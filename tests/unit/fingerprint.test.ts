/**
 * Unit tests: fingerprint.ts
 *
 * Covers:
 *  - extractIP – priority order: cf-connecting-ip, x-vercel-forwarded-for,
 *    x-real-ip, req.ip, x-forwarded-for, fallback "unknown-ip"
 *  - IP validation (valid/invalid formats)
 */

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { extractIP } from "@/lib/fingerprint";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq(headers: Record<string, string>): NextRequest {
  return new NextRequest("http://localhost/api/test", {
    method: "GET",
    headers,
  });
}

// ---------------------------------------------------------------------------
// extractIP – header priority
// ---------------------------------------------------------------------------

describe("extractIP", () => {
  it("prefers cf-connecting-ip", () => {
    const req = makeReq({
      "cf-connecting-ip": "1.2.3.4",
      "x-real-ip": "5.6.7.8",
      "x-forwarded-for": "9.10.11.12",
    });
    expect(extractIP(req)).toBe("1.2.3.4");
  });

  it("falls back to x-vercel-forwarded-for when no cf header", () => {
    const req = makeReq({
      "x-vercel-forwarded-for": "1.2.3.4, 5.6.7.8",
      "x-real-ip": "9.10.11.12",
    });
    expect(extractIP(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = makeReq({ "x-real-ip": "10.0.0.1" });
    expect(extractIP(req)).toBe("10.0.0.1");
  });

  it("falls back to x-forwarded-for first IP", () => {
    const req = makeReq({ "x-forwarded-for": "192.168.1.1, 10.0.0.1" });
    expect(extractIP(req)).toBe("192.168.1.1");
  });

  it("returns 'unknown-ip' when no IP headers present", () => {
    const req = makeReq({});
    expect(extractIP(req)).toBe("unknown-ip");
  });

  it("ignores cf-connecting-ip if it's an invalid IP", () => {
    const req = makeReq({
      "cf-connecting-ip": "not-an-ip!!!",
      "x-real-ip": "1.2.3.4",
    });
    expect(extractIP(req)).toBe("1.2.3.4");
  });

  it("rejects IP longer than 45 chars", () => {
    const longIp = "1234:5678:9abc:def0:".repeat(4); // > 45 chars
    const req = makeReq({
      "cf-connecting-ip": longIp,
      "x-real-ip": "1.2.3.4",
    });
    expect(extractIP(req)).toBe("1.2.3.4");
  });

  it("accepts valid IPv6 address", () => {
    const req = makeReq({
      "cf-connecting-ip": "2001:db8::1",
    });
    const ip = extractIP(req);
    expect(ip).toBe("2001:db8::1");
  });

  it("trims whitespace from header values", () => {
    const req = makeReq({ "x-real-ip": "  10.0.0.5  " });
    expect(extractIP(req)).toBe("10.0.0.5");
  });
});
