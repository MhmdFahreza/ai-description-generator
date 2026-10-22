import { NextRequest, NextResponse } from "next/server";
import { extractIP } from "./fingerprint";

export const VISITOR_COOKIE_NAME = "aidg_vid";
const COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60; // 1 tahun

/**
 * Validasi apakah string adalah UUID v4 yang valid.
 */
function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    uuid
  );
}

export interface VisitorIdentity {
  visitorId: string;
  ip: string;
  isNew: boolean;
}

/**
 * Dapatkan atau buat visitor identity anonim dari request cookie dan IP.
 * Identitas utama: Cookie anonim HttpOnly yang dihasilkan server.
 * Identitas sekunder / burst protection: IP address (melalui trusted proxy header).
 */
export function getOrCreateVisitorIdentity(req: NextRequest): VisitorIdentity {
  const existingCookie = req.cookies.get(VISITOR_COOKIE_NAME)?.value;
  const ip = extractIP(req);

  if (existingCookie && isValidUUID(existingCookie)) {
    return {
      visitorId: existingCookie,
      ip,
      isNew: false,
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
 * Tempelkan cookie identitas anonim ke response jika baru dibuat.
 */
export function attachVisitorCookie(
  res: NextResponse,
  visitorId: string,
  isNew: boolean
): void {
  // Hanya set cookie jika baru atau belum ada di response
  if (isNew) {
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set({
      name: VISITOR_COOKIE_NAME,
      value: visitorId,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });
  }
}
