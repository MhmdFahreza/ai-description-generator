import { NextRequest, NextResponse } from "next/server";
import { checkQuota, MAX_PER_DAY, MAX_PER_MINUTE } from "@/lib/rate-limiter";
import {
  getOrCreateVisitorIdentity,
  attachVisitorCookie,
} from "@/lib/visitor-identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const identity = getOrCreateVisitorIdentity(req);

  try {
    const quota = await checkQuota(identity.visitorId, identity.ip);

    const response = NextResponse.json({
      success: true,
      limit: quota.limit,
      remaining: quota.remaining,
      remainingDaily: quota.remaining,
      maxDaily: quota.limit,
      remainingMinute: quota.remainingMinute ?? MAX_PER_MINUTE,
      maxMinute: MAX_PER_MINUTE,
      resetAt: quota.resetAt,
      allowed: quota.allowed,
      reason: quota.reason,
      retryAfterSeconds: quota.retryAfterSeconds,
      mode: quota.mode,
    });

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    // Pastikan cookie identitas terpasang saat pertama kali halaman membaca kuota
    attachVisitorCookie(response, identity.visitorId, identity.isNew);
    return response;
  } catch (err) {
    console.error(
      "[quota-route] Error membaca status kuota:",
      err instanceof Error ? err.message : "unknown"
    );

    // Di production jika Redis tidak dapat diakses
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil status kuota dari server.",
        limit: MAX_PER_DAY,
        remaining: 0,
        remainingDaily: 0,
        maxDaily: MAX_PER_DAY,
        remainingMinute: 0,
        maxMinute: MAX_PER_MINUTE,
        resetAt: null,
        allowed: false,
      },
      { status: 503 }
    );
  }
}
