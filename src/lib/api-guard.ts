/**
 * api-guard.ts — Unified wrapper yang mengaplikasikan SEMUA layer proteksi
 * sebelum proses AI dijalankan.
 *
 * Urutan eksekusi yang benar & aman:
 *   1. Content-Type check
 *   2. Body parsing (JSON)
 *   3. Input validation & anti-abuse check
 *      -> Request tidak valid DITOLAK sebelum memakai kuota.
 *   4. Identitas anonim server (HttpOnly Cookie + IP)
 *   5. Rate limiting (Upstash Redis / In-memory fallback untuk dev)
 *      -> Kuota harian (global 10/hari) + Burst protection (5/menit/IP)
 *      -> Jika Redis bermasalah di production: kembalikan 503 (Fail-closed).
 *   6. Eksekusi handler AI
 *   7. Sematkan header rate limit dan cookie identitas anonim pada response.
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit, refundQuota, MAX_PER_DAY } from "./rate-limiter";
import {
  getOrCreateVisitorIdentity,
  attachVisitorCookie,
} from "./visitor-identity";
import {
  validateContentType,
  parseBody,
  validateFields,
  type FieldSchema,
} from "./input-validation";
import { inferGeneratorId, recordAiUsage } from "./ai-monitor";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RouteHandler = (
  body: Record<string, unknown>,
  req: NextRequest
) => Promise<NextResponse>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validasi header Origin untuk mencegah serangan CSRF / cross-site abuse.
 */
function validateOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) return null; // Request server-to-server / non-browser tanpa Origin header

  const host = req.headers.get("host");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  try {
    const originHost = new URL(origin).host;
    if (host && originHost === host) return null;
    if (appUrl && originHost === new URL(appUrl).host) return null;
    if (
      process.env.NODE_ENV !== "production" &&
      (originHost.startsWith("localhost") || originHost.startsWith("127.0.0.1"))
    ) {
      return null;
    }
  } catch {
    return NextResponse.json(
      { error: "Format origin request tidak valid." },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: "Permintaan lintas domain (cross-origin) tidak diizinkan." },
    { status: 403 }
  );
}

// ---------------------------------------------------------------------------
// Guard wrapper
// ---------------------------------------------------------------------------

export function withGuard(schema: FieldSchema[], handler: RouteHandler) {
  return async function guardedRoute(req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    const generatorId = inferGeneratorId(req.nextUrl?.pathname || req.url || "");

    // -----------------------------------------------------------------------
    // 0. Origin / CSRF check
    // -----------------------------------------------------------------------
    const originError = validateOrigin(req);
    if (originError) {
      void recordAiUsage({
        generatorId,
        durationMs: Date.now() - startTime,
        status: originError.status,
        errorCategory: "unauthorized",
      });
      return originError;
    }

    // -----------------------------------------------------------------------
    // 1. Content-Type check
    // -----------------------------------------------------------------------
    const ctError = validateContentType(req);
    if (ctError) {
      void recordAiUsage({
        generatorId,
        durationMs: Date.now() - startTime,
        status: ctError.status,
        errorCategory: "invalid_input",
      });
      return ctError;
    }

    // -----------------------------------------------------------------------
    // 2. Parse body (termasuk batas ukuran 50KB)
    // -----------------------------------------------------------------------
    const bodyOrError = await parseBody(req);
    if (bodyOrError instanceof NextResponse) {
      void recordAiUsage({
        generatorId,
        durationMs: Date.now() - startTime,
        status: bodyOrError.status,
        errorCategory: "invalid_input",
      });
      return bodyOrError;
    }

    const body = bodyOrError;

    // -----------------------------------------------------------------------
    // 3. Input validation (Dijalankan SEBELUM rate limiter agar input tidak
    //    valid tidak mengurangi kuota pengguna)
    // -----------------------------------------------------------------------
    const validationError = validateFields(body, schema);
    if (validationError) {
      void recordAiUsage({
        generatorId,
        durationMs: Date.now() - startTime,
        status: validationError.status,
        errorCategory: "invalid_input",
      });
      return validationError;
    }

    // -----------------------------------------------------------------------
    // 4. Server-managed anonymous identity (HttpOnly cookie bertanda tangan + IP)
    // -----------------------------------------------------------------------
    const identity = getOrCreateVisitorIdentity(req);

    // -----------------------------------------------------------------------
    // 5. Rate limiting check & quota deduction
    // -----------------------------------------------------------------------
    let rl;
    try {
      rl = await rateLimit(identity.visitorId, identity.ip);
    } catch (err) {
      // Fail-closed di production jika terjadi masalah pada koneksi Redis
      console.error(
        "[api-guard] Rate limiter service error:",
        err instanceof Error ? err.message : "unknown"
      );
      void recordAiUsage({
        generatorId,
        durationMs: Date.now() - startTime,
        status: 503,
        errorCategory: "internal_error",
      });
      return NextResponse.json(
        {
          error:
            "Layanan verifikasi kuota sedang mengalami gangguan. Silakan coba kembali sesaat lagi.",
        },
        { status: 503 }
      );
    }

    if (!rl.allowed) {
      const retryAfter =
        rl.reason === "minute"
          ? rl.retryAfterSeconds
          : rl.resetAt
          ? Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))
          : 60;

      const response = NextResponse.json(
        {
          error: rl.message,
          reason: rl.reason,
          retryAfter,
          limit: MAX_PER_DAY,
          remaining: rl.remainingDaily,
          resetAt: rl.resetAt,
        },
        { status: 429 }
      );

      // Standard rate-limit headers
      response.headers.set("Retry-After", String(retryAfter));
      response.headers.set("X-RateLimit-Limit", String(MAX_PER_DAY));
      response.headers.set("X-RateLimit-Reason", rl.reason || "daily");
      response.headers.set(
        "X-RateLimit-Remaining-Minute",
        String(rl.remainingMinute)
      );
      response.headers.set(
        "X-RateLimit-Remaining-Daily",
        String(rl.remainingDaily)
      );
      if (rl.resetAt) {
        response.headers.set("X-RateLimit-Reset", String(rl.resetAt));
      }

      attachVisitorCookie(response, identity.visitorId, identity.isNew);

      void recordAiUsage({
        generatorId,
        durationMs: Date.now() - startTime,
        status: 429,
        rejectedByRateLimit: true,
        errorCategory: "rate_limit",
      });

      return response;
    }

    // -----------------------------------------------------------------------
    // 6. Execute route handler (Proses AI) dengan auto-refund jika gagal
    // -----------------------------------------------------------------------
    let response: NextResponse;
    try {
      response = await handler(body, req);
    } catch (handlerErr) {
      // Rollback kuota jika handler mengalami exception tak terduga
      await refundQuota(identity.visitorId);
      console.error(
        "[api-guard] Unhandled exception pada route handler:",
        handlerErr instanceof Error ? handlerErr.message : "unknown"
      );
      void recordAiUsage({
        generatorId,
        durationMs: Date.now() - startTime,
        status: 500,
        errorCategory: "internal_error",
      });
      return NextResponse.json(
        {
          error:
            "Terjadi kesalahan internal saat menghubungi AI. Kuota Anda tidak terpotong.",
        },
        { status: 500 }
      );
    }

    // Jika AI handler mengembalikan status 5xx (AI error / timeout / outage), kembalikan kuota
    let effectiveRemainingDaily = rl.remainingDaily;
    if (response.status >= 500) {
      await refundQuota(identity.visitorId);
      effectiveRemainingDaily = Math.min(MAX_PER_DAY, rl.remainingDaily + 1);
    }

    // -----------------------------------------------------------------------
    // 7. Attach rate-limit headers & anonymous identity cookie
    // -----------------------------------------------------------------------
    response.headers.set("X-RateLimit-Limit", String(MAX_PER_DAY));
    response.headers.set(
      "X-RateLimit-Remaining-Minute",
      String(rl.remainingMinute)
    );
    response.headers.set(
      "X-RateLimit-Remaining-Daily",
      String(effectiveRemainingDaily)
    );
    if (rl.resetAt) {
      response.headers.set("X-RateLimit-Reset", String(rl.resetAt));
    }

    attachVisitorCookie(response, identity.visitorId, identity.isNew);

    return response;
  };
}
