/**
 * Server-side fingerprinting — menghitung hash dari sinyal-sinyal request
 * yang relatif stabil meskipun user ganti browser/hapus cookie.
 *
 * Sinyal yang dipakai (semua dari header, bukan cookie):
 *   - User-Agent (browser + OS + versi)
 *   - Accept-Language (bahasa yang di-set di browser)
 *   - Sec-CH-UA* client hints (Chrome/Edge kirim info hardware/OS)
 *   - Accept-Encoding
 *
 * Digabung jadi satu string lalu di-hash dengan SHA-256.
 *
 * Kenapa ini berguna sebagai layer tambahan di atas IP:
 *   - Kalau user ganti VPN (IP berubah), fingerprint tetap sama selama
 *     masih pakai browser+OS+bahasa yang sama.
 *   - Bukan 100% unik, tapi cukup untuk mendeteksi abuse yang berulang.
 *   - Gak butuh JavaScript atau cookie di sisi client.
 *
 * Limitation:
 *   - User yang pakai browser berbeda akan punya fingerprint berbeda.
 *   - Tapi dikombinasikan dengan IP-based rate limit, coverage sudah kuat.
 */

import { NextRequest } from "next/server";

/**
 * Hash string pakai Web Crypto API (tersedia di Node 18+ dan Edge Runtime).
 */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Ekstrak sinyal dari request headers dan hasilkan fingerprint hash.
 */
export async function computeFingerprint(req: NextRequest): Promise<string> {
  const signals: string[] = [
    // Browser + OS identifier
    req.headers.get("user-agent") || "unknown-ua",

    // Bahasa yang di-set user (biasanya jarang diganti)
    req.headers.get("accept-language") || "unknown-lang",

    // Encoding support — beda browser/versi kadang beda
    req.headers.get("accept-encoding") || "unknown-enc",

    // Client Hints (Chrome, Edge, Opera, dll.)
    // Sec-CH-UA: brand & versi browser
    req.headers.get("sec-ch-ua") || "",
    // Sec-CH-UA-Platform: OS (Windows, macOS, Android, dll.)
    req.headers.get("sec-ch-ua-platform") || "",
    // Sec-CH-UA-Mobile: ?0 atau ?1
    req.headers.get("sec-ch-ua-mobile") || "",
    // Sec-CH-UA-Arch: x86, arm, dll. (kalau tersedia)
    req.headers.get("sec-ch-ua-arch") || "",
    // Sec-CH-UA-Bitness: 32 atau 64
    req.headers.get("sec-ch-ua-bitness") || "",

    // Connection type hint
    req.headers.get("sec-ch-ua-full-version-list") || "",

    // DNT (Do Not Track) — meskipun deprecated, jadi sinyal tambahan
    req.headers.get("dnt") || "",
  ];

  const raw = signals.join("|:|");
  return sha256(raw);
}

/**
 * Ekstrak IP address dari request.
 *
 * Priority:
 *   1. x-forwarded-for (dari reverse proxy / Vercel / Cloudflare)
 *   2. x-real-ip
 *   3. NextRequest.ip (Vercel Edge)
 *   4. Fallback "unknown"
 */
export function extractIP(req: NextRequest): string {
  // x-forwarded-for bisa berisi chain: "client, proxy1, proxy2"
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // NextRequest.ip ada di Vercel Edge Runtime tapi gak selalu ada di type
  // definitions — pakai optional chaining di cast supaya aman.
  const edgeIp = (req as unknown as { ip?: string }).ip;
  if (edgeIp) return edgeIp;

  return "unknown-ip";
}
