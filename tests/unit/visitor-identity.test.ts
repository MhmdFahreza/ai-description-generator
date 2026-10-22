/**
 * Unit tests: visitor-identity.ts
 *
 * Covers:
 *  - signVisitorId – produces correct format
 *  - verifyAndExtractVisitorId – valid signature, tampered, old format, null
 *  - getOrCreateVisitorIdentity – new vs existing cookie, unsigned migration
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  signVisitorId,
  verifyAndExtractVisitorId,
  getOrCreateVisitorIdentity,
  attachVisitorCookie,
  VISITOR_COOKIE_NAME,
} from "@/lib/visitor-identity";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function freshUUID(): string {
  return crypto.randomUUID();
}

function makeReqWithCookie(cookieValue?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (cookieValue !== undefined) {
    headers["cookie"] = `${VISITOR_COOKIE_NAME}=${cookieValue}`;
  }
  return new NextRequest("http://localhost/api/generate/quota", {
    method: "GET",
    headers,
  });
}

// ---------------------------------------------------------------------------
// signVisitorId
// ---------------------------------------------------------------------------

describe("signVisitorId", () => {
  it("returns a string containing a dot separator", () => {
    const uuid = freshUUID();
    const signed = signVisitorId(uuid);
    expect(signed).toContain(".");
  });

  it("starts with the original UUID", () => {
    const uuid = freshUUID();
    const signed = signVisitorId(uuid);
    expect(signed.startsWith(uuid)).toBe(true);
  });

  it("appended signature is 32 hex chars", () => {
    const uuid = freshUUID();
    const signed = signVisitorId(uuid);
    const sig = signed.split(".")[1];
    expect(sig).toMatch(/^[0-9a-f]{32}$/);
  });

  it("is deterministic for the same UUID", () => {
    const uuid = freshUUID();
    expect(signVisitorId(uuid)).toBe(signVisitorId(uuid));
  });
});

// ---------------------------------------------------------------------------
// verifyAndExtractVisitorId
// ---------------------------------------------------------------------------

describe("verifyAndExtractVisitorId", () => {
  it("extracts UUID from a correctly signed value", () => {
    const uuid = freshUUID();
    const signed = signVisitorId(uuid);
    expect(verifyAndExtractVisitorId(signed)).toBe(uuid);
  });

  it("returns null for tampered signature", () => {
    const uuid = freshUUID();
    const signed = signVisitorId(uuid);
    const tampered = signed.slice(0, -4) + "xxxx";
    expect(verifyAndExtractVisitorId(tampered)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(verifyAndExtractVisitorId(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(verifyAndExtractVisitorId("")).toBeNull();
  });

  it("accepts legacy unsigned UUID (graceful migration)", () => {
    const uuid = freshUUID();
    // No signature — old format
    expect(verifyAndExtractVisitorId(uuid)).toBe(uuid);
  });

  it("returns null for completely invalid string", () => {
    expect(verifyAndExtractVisitorId("not-a-uuid-or-signed-value")).toBeNull();
  });

  it("returns null if UUID part is not a valid v4", () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const signed = `${fakeId}.abcd1234abcd1234abcd1234abcd1234`;
    // v4 requires 4 in position 14 and 8|9|a|b in position 19
    // The above UUID has all zeros so it's v4-incompatible
    expect(verifyAndExtractVisitorId(signed)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getOrCreateVisitorIdentity
// ---------------------------------------------------------------------------

describe("getOrCreateVisitorIdentity", () => {
  it("creates new identity when no cookie present", () => {
    const req = makeReqWithCookie();
    const identity = getOrCreateVisitorIdentity(req);
    expect(identity.isNew).toBe(true);
    expect(identity.visitorId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("reuses existing identity from a valid signed cookie", () => {
    const uuid = freshUUID();
    const signed = signVisitorId(uuid);
    const req = makeReqWithCookie(signed);
    const identity = getOrCreateVisitorIdentity(req);
    expect(identity.isNew).toBe(false);
    expect(identity.visitorId).toBe(uuid);
  });

  it("creates new identity when cookie is tampered", () => {
    const uuid = freshUUID();
    const signed = signVisitorId(uuid);
    const tampered = signed.slice(0, -4) + "xxxx";
    const req = makeReqWithCookie(tampered);
    const identity = getOrCreateVisitorIdentity(req);
    expect(identity.isNew).toBe(true);
    expect(identity.visitorId).not.toBe(uuid);
  });

  it("marks isNew=true for legacy unsigned cookie (re-sign needed)", () => {
    const uuid = freshUUID();
    const req = makeReqWithCookie(uuid); // unsigned legacy
    const identity = getOrCreateVisitorIdentity(req);
    // Should still use the same visitorId but flag as new to re-sign
    expect(identity.visitorId).toBe(uuid);
    expect(identity.isNew).toBe(true);
  });

  it("includes ip field", () => {
    const req = makeReqWithCookie();
    const identity = getOrCreateVisitorIdentity(req);
    expect(typeof identity.ip).toBe("string");
    expect(identity.ip.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// attachVisitorCookie
// ---------------------------------------------------------------------------

describe("attachVisitorCookie", () => {
  it("sets cookie when isNew=true", () => {
    const uuid = freshUUID();
    const res = NextResponse.json({});
    attachVisitorCookie(res, uuid, true);
    const cookieHeader = res.headers.get("set-cookie");
    expect(cookieHeader).not.toBeNull();
    expect(cookieHeader).toContain(VISITOR_COOKIE_NAME);
  });

  it("does not set cookie when isNew=false", () => {
    const uuid = freshUUID();
    const res = NextResponse.json({});
    attachVisitorCookie(res, uuid, false);
    const cookieHeader = res.headers.get("set-cookie");
    // Either null or does not contain visitor cookie
    if (cookieHeader) {
      expect(cookieHeader).not.toContain(VISITOR_COOKIE_NAME);
    } else {
      expect(cookieHeader).toBeNull();
    }
  });

  it("cookie value is signed (contains dot)", () => {
    const uuid = freshUUID();
    const res = NextResponse.json({});
    attachVisitorCookie(res, uuid, true);
    const cookieHeader = res.headers.get("set-cookie") ?? "";
    // The value portion should contain UUID.signature
    expect(cookieHeader).toContain(".");
  });
});
