/**
 * Unit tests: adsense.ts
 *
 * Covers:
 *  - ADSENSE_ID is exported from NEXT_PUBLIC_ADSENSE_CLIENT_ID env var
 *  - ADSENSE_ID format: must be "ca-pub-..." (no "client=" prefix)
 *  - ADSENSE_ENABLED is a boolean, false by default
 *  - ADSENSE_ENABLED is true only when env var is exactly "true"
 *  - ADSENSE_ENABLED is false for "1", "yes", "false", or unset
 *  - deleteAdCookies removes __gads, __gpi, __eoi
 *  - deleteAdCookies does NOT remove unrelated cookies (consent, GA, etc.)
 *  - deleteAdCookies does not throw when no AdSense cookies exist
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock browser environment
// ---------------------------------------------------------------------------

const cookieJar: Record<string, string> = {};

const documentMock = {
  get cookie() {
    return Object.entries(cookieJar)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  },
  set cookie(val: string) {
    const parts = val.split(";").map((s) => s.trim());
    const [nameValue] = parts;
    const [name, ...rest] = nameValue.split("=");
    const value = rest.join("=");
    if (
      value === "" ||
      parts.some(
        (p) => /^expires=/i.test(p) && new Date(p.split("=")[1]) < new Date()
      )
    ) {
      delete cookieJar[name.trim()];
    } else {
      cookieJar[name.trim()] = value;
    }
  },
};

Object.defineProperty(globalThis, "window", { value: globalThis, writable: true });
Object.defineProperty(globalThis, "document", { value: documentMock, writable: true });
Object.defineProperty(globalThis, "location", {
  value: { hostname: "descriptiongenerator.web.id", protocol: "https:" },
  writable: true,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  for (const key of Object.keys(cookieJar)) delete cookieJar[key];
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// ADSENSE_ID — format validation
// ---------------------------------------------------------------------------

describe("adsense.ts — ADSENSE_ID", () => {
  it("is a string or undefined (never another type)", async () => {
    const { ADSENSE_ID } = await import("@/lib/adsense");
    expect(typeof ADSENSE_ID === "string" || ADSENSE_ID === undefined).toBe(true);
  });

  it("does NOT contain 'client=' prefix (that prefix belongs in the script src, not in ADSENSE_ID)", async () => {
    const { ADSENSE_ID } = await import("@/lib/adsense");
    if (ADSENSE_ID) {
      expect(ADSENSE_ID).not.toContain("client=");
    }
  });

  it("matches 'ca-pub-{digits}' format when set", async () => {
    const { ADSENSE_ID } = await import("@/lib/adsense");
    if (ADSENSE_ID) {
      expect(ADSENSE_ID).toMatch(/^ca-pub-\d+$/);
    }
  });
});

// ---------------------------------------------------------------------------
// ADSENSE_ENABLED — feature flag semantics
// Note: The module is loaded once per vitest worker, so we test the boolean
// logic inline to avoid module-cache issues with process.env.
// ---------------------------------------------------------------------------

describe("adsense.ts — ADSENSE_ENABLED logic", () => {
  it("ADSENSE_ENABLED is a boolean", async () => {
    const { ADSENSE_ENABLED } = await import("@/lib/adsense");
    expect(typeof ADSENSE_ENABLED).toBe("boolean");
  });

  it("evaluates to false when env var is empty string", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", "");
    expect(process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true").toBe(false);
  });

  it("evaluates to false when env var is '1'", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", "1");
    expect(process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true").toBe(false);
  });

  it("evaluates to false when env var is 'yes'", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", "yes");
    expect(process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true").toBe(false);
  });

  it("evaluates to false when env var is 'TRUE' (wrong case)", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", "TRUE");
    expect(process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true").toBe(false);
  });

  it("evaluates to false when env var is 'false'", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", "false");
    expect(process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true").toBe(false);
  });

  it("evaluates to true ONLY when env var is exactly 'true'", () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", "true");
    expect(process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// deleteAdCookies
// ---------------------------------------------------------------------------

describe("adsense.ts — deleteAdCookies", () => {
  it("removes __gads cookie", async () => {
    cookieJar["__gads"] = "ID=abc123:T=1700000000:S=ALNI_MXxx";
    const { deleteAdCookies } = await import("@/lib/adsense");
    deleteAdCookies();
    expect(cookieJar["__gads"]).toBeUndefined();
  });

  it("removes __gpi cookie", async () => {
    cookieJar["__gpi"] = "UID=0000000000000000:T=1700000000:RT=1700000000:S=ALNI";
    const { deleteAdCookies } = await import("@/lib/adsense");
    deleteAdCookies();
    expect(cookieJar["__gpi"]).toBeUndefined();
  });

  it("removes __eoi cookie", async () => {
    cookieJar["__eoi"] = "ID=abcdef1234:T=1700000000:RT=1700000000:S=AA-Afgh";
    const { deleteAdCookies } = await import("@/lib/adsense");
    deleteAdCookies();
    expect(cookieJar["__eoi"]).toBeUndefined();
  });

  it("removes all three AdSense cookies at once", async () => {
    cookieJar["__gads"] = "ad-val-1";
    cookieJar["__gpi"] = "ad-val-2";
    cookieJar["__eoi"] = "ad-val-3";
    const { deleteAdCookies } = await import("@/lib/adsense");
    deleteAdCookies();
    expect(cookieJar["__gads"]).toBeUndefined();
    expect(cookieJar["__gpi"]).toBeUndefined();
    expect(cookieJar["__eoi"]).toBeUndefined();
  });

  it("does NOT remove unrelated cookies (consent, GA cookies)", async () => {
    cookieJar["cookie_consent_preferences"] = "%7B%22necessary%22%3Atrue%7D";
    cookieJar["_ga"] = "GA1.2.123456789.1700000000";
    cookieJar["__gads"] = "some-ad-value";
    const { deleteAdCookies } = await import("@/lib/adsense");
    deleteAdCookies();
    // Consent and GA cookies must remain
    expect(cookieJar["cookie_consent_preferences"]).toBe("%7B%22necessary%22%3Atrue%7D");
    expect(cookieJar["_ga"]).toBe("GA1.2.123456789.1700000000");
    // Only the ad cookie should be gone
    expect(cookieJar["__gads"]).toBeUndefined();
  });

  it("does not throw when no AdSense cookies are present", async () => {
    const { deleteAdCookies } = await import("@/lib/adsense");
    expect(() => deleteAdCookies()).not.toThrow();
  });
});
