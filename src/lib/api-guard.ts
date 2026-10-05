/**
 * api-guard.ts — Unified wrapper yang mengaplikasikan SEMUA layer proteksi
 * sebelum logic route dijalankan.
 *
 * Layer proteksi (urutan eksekusi):
 *   1. Content-Type check
 *   2. Rate limit (IP + fingerprint)
 *   3. Body parsing
 *   4. Input validation (schema + abuse detection)
 *
 * Cara pakai di setiap API route:
 * ```ts
 * import { withGuard } from "@/lib/api-guard";
 *
 * export const POST = withGuard(
 *   [
 *     { name: "productName", required: true, freeText: true },
 *     { name: "tone", required: false },
 *   ],
 *   async (body, req) => {
 *     // ... logic route ...
 *     return NextResponse.json({ result: "..." });
 *   }
 * );
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "./rate-limiter";
import { computeFingerprint, extractIP } from "./fingerprint";
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

export function withGuard(
  schema: FieldSchema[],
  handler: RouteHandler
) {
  return async function guardedRoute(req: NextRequest): Promise<NextResponse> {
    // -----------------------------------------------------------------------
    // 1. Content-Type check
    // -----------------------------------------------------------------------
    const ctError = validateContentType(req);
    if (ctError) return ctError;

    // -----------------------------------------------------------------------
    // 2. Rate limiting (IP + fingerprint)
    // -----------------------------------------------------------------------
    const ip = extractIP(req);
    const fingerprint = await computeFingerprint(req);

    // Gunakan prefix supaya IP dan fingerprint gak collision di store
    const keys = [`ip:${ip}`, `fp:${fingerprint}`];
    const rl = rateLimit(keys);

    if (!rl.allowed) {
      const response = NextResponse.json(
        { error: rl.message },
        { status: 429 }
      );

      // Standard rate-limit headers
      response.headers.set("Retry-After", String(rl.retryAfterSeconds));
      response.headers.set("X-RateLimit-Remaining-Minute", String(rl.remainingMinute));
      response.headers.set("X-RateLimit-Remaining-Daily", String(rl.remainingDaily));

      return response;
    }

    // -----------------------------------------------------------------------
    // 3. Parse body
    // -----------------------------------------------------------------------
    const bodyOrError = await parseBody(req);
    if (bodyOrError instanceof NextResponse) return bodyOrError;

    const body = bodyOrError;

    // -----------------------------------------------------------------------
    // 4. Input validation
    // -----------------------------------------------------------------------
    const validationError = validateFields(body, schema);
    if (validationError) return validationError;

    // -----------------------------------------------------------------------
    // 5. Execute route handler
    // -----------------------------------------------------------------------
    const response = await handler(body, req);

    // Tambahkan info rate-limit di response header (bermanfaat untuk debugging
    // dan buat client tahu sisa quota)
    response.headers.set("X-RateLimit-Remaining-Minute", String(rl.remainingMinute));
    response.headers.set("X-RateLimit-Remaining-Daily", String(rl.remainingDaily));

    return response;
  };
}
