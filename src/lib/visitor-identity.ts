import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { extractIP } from "./fingerprint";

export const VISITOR_COOKIE_NAME = "aidg_vid";
const COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60; // 1 tahun

const SIGNING_SECRET =
  process.env.APP_SECRET ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.GROQ_API_KEY ||
  "aidg-cookie-signing-secret-default";

/**
 * Validasi apakah string adalah UUID v4 yang valid.
 */
function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    uuid
  );
}

/**
 * Buat HMAC signature untuk UUID v4.
 */
export function signVisitorId(uuid: string): string {
  const hmac = createHmac("sha256", SIGNING_SECRET)
    .update(uuid)
    .digest("hex")
    .slice(0, 32);
  return `${uuid}.${hmac}`;
}

/**
 * Verifikasi signature dan ekstrak UUID murni.
 * Mengembalikan null jika format atau signature tidak valid.
 */
export function verifyAndExtractVisitorId(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;

  const parts = cookieValue.split(".");
  if (parts.length === 2) {
    const [uuid, sig] = parts;
    if (!isValidUUID(uuid)) return null;

    const expectedSig = createHmac("sha256", SIGNING_SECRET)
      .update(uuid)
      .digest("hex")
      .slice(0, 32);

    if (sig.length === expectedSig.length) {
      const a = Buffer.from(sig);
      const b = Buffer.from(expectedSig);
      if (timingSafeEqual(a, b)) {
        return uuid;
      }
    }
    return null;
  }

  // Graceful migration untuk cookie lama yang belum ditandatangani
  if (isValidUUID(cookieValue)) {
    return cookieValue;
  }

  return null;
}

export interface VisitorIdentity {
  visitorId: string;
  ip: string;
  isNew: boolean;
}

/**
 * Dapatkan atau buat visitor identity anonim dari request cookie dan IP.
 * Identitas utama: Cookie anonim HttpOnly bertanda tangan server.
 * Identitas sekunder / burst protection: IP address (melalui trusted proxy header).
 */
export function getOrCreateVisitorIdentity(req: NextRequest): VisitorIdentity {
  const rawCookie = req.cookies.get(VISITOR_COOKIE_NAME)?.value;
  const ip = extractIP(req);

  const verifiedId = verifyAndExtractVisitorId(rawCookie);
  if (verifiedId) {
    // Jika cookie masih format lama tanpa signature, tandai perlu re-attach signed cookie
    const needsResign = !rawCookie?.includes(".");
    return {
      visitorId: verifiedId,
      ip,
      isNew: needsResign,
    };
  }

  // Buat UUID v4 baru menggunakan runtime crypto
  const newVisitorId = crypto.randomUUID();
  return {
    visitorId: newVisitorId,
    ip,
    isNew: true,
  };
}

/**
 * Tempelkan cookie identitas anonim bertanda tangan ke response jika baru atau perlu di-sign.
 */
export function attachVisitorCookie(
  res: NextResponse,
  visitorId: string,
  isNew: boolean
): void {
  if (isNew) {
    const isProd = process.env.NODE_ENV === "production";
    const signedValue = signVisitorId(visitorId);
    res.cookies.set({
      name: VISITOR_COOKIE_NAME,
      value: signedValue,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });
  }
}

