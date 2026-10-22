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
import { rateLimit, MAX_PER_DAY } from "./rate-limiter";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RouteHandler = (
  body: Record<string, unknown>,
  req: NextRequest
) => Promise<NextResponse>;

// ---------------------------------------------------------------------------
// Guard wrapper
// ---------------------------------------------------------------------------

export function withGuard(schema: FieldSchema[], handler: RouteHandler) {
  return async function guardedRoute(req: NextRequest): Promise<NextResponse> {
    // -----------------------------------------------------------------------
    // 1. Content-Type check
    // -----------------------------------------------------------------------
    const ctError = validateContentType(req);
    if (ctError) return ctError;

    // -----------------------------------------------------------------------
    // 2. Parse body
    // -----------------------------------------------------------------------
    const bodyOrError = await parseBody(req);
    if (bodyOrError instanceof NextResponse) return bodyOrError;

    const body = bodyOrError;

    // -----------------------------------------------------------------------
    // 3. Input validation (Dijalankan SEBELUM rate limiter agar input tidak
    //    valid tidak mengurangi kuota pengguna)
    // -----------------------------------------------------------------------
    const validationError = validateFields(body, schema);
    if (validationError) return validationError;

    // -----------------------------------------------------------------------
    // 4. Server-managed anonymous identity (HttpOnly cookie + IP)
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
      return response;
    }

    // -----------------------------------------------------------------------
    // 6. Execute route handler (Proses AI)
    // -----------------------------------------------------------------------
    const response = await handler(body, req);

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
      String(rl.remainingDaily)
    );
    if (rl.resetAt) {
      response.headers.set("X-RateLimit-Reset", String(rl.resetAt));
    }

    attachVisitorCookie(response, identity.visitorId, identity.isNew);

    return response;
  };
}
