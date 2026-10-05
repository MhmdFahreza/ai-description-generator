import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, MAX_PER_DAY, MAX_PER_MINUTE } from "@/lib/rate-limiter";
import { computeFingerprint, extractIP } from "@/lib/fingerprint";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ip = extractIP(req);
  const fingerprint = await computeFingerprint(req);
  const keys = [`ip:${ip}`, `fp:${fingerprint}`];

  const rl = checkRateLimit(keys);

  return NextResponse.json({
    remainingDaily: rl.remainingDaily,
    maxDaily: MAX_PER_DAY,
    remainingMinute: rl.remainingMinute,
    maxMinute: MAX_PER_MINUTE,
    allowed: rl.allowed,
  });
}
