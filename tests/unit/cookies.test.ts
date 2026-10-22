/**
 * Unit tests: cookies.ts
 *
 * Tests the cookie utility functions using a simulated browser `document.cookie`
 * via jsdom-style mocking.
 */

import { describe, it, expect, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock browser environment (document.cookie)
// ---------------------------------------------------------------------------

const cookieJar: Record<string, string> = {};

const documentMock = {
  get cookie() {
    return Object.entries(cookieJar)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  },
  set cookie(val: string) {
    // Parse a Set-Cookie-style string: "name=value; ..."
    const parts = val.split(";").map((s) => s.trim());
    const [nameValue] = parts;
    const [name, ...rest] = nameValue.split("=");
    const value = rest.join("=");

    if (value === "" || parts.some((p) => /^expires=/i.test(p) && new Date(p.split("=")[1]) < new Date())) {
      delete cookieJar[name.trim()];
    } else {
      cookieJar[name.trim()] = value;
    }
  },
};

Object.defineProperty(globalThis, "window", { value: globalThis, writable: true });
if (typeof globalThis.dispatchEvent === "undefined") {
  globalThis.dispatchEvent = () => true;
}
Object.defineProperty(globalThis, "document", { value: documentMock, writable: true });

// Also stub window.location for setCookie secure detection
Object.defineProperty(globalThis, "location", {
  value: { protocol: "http:" },
  writable: true,
});

import {
  getCookie,
  setCookie,
  deleteCookie,
  getSavedPreferences,
  applyPreferences,
  COOKIE_CONSENT_KEY,
} from "@/lib/cookies";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Clear cookie jar between tests
  for (const key of Object.keys(cookieJar)) {
    delete cookieJar[key];
  }
});

// ---------------------------------------------------------------------------
// getCookie
// ---------------------------------------------------------------------------

describe("getCookie", () => {
  it("returns null when cookie is not set", () => {
    expect(getCookie("nonExistent")).toBeNull();
  });

  it("returns value of a set cookie", () => {
    cookieJar["testCookie"] = encodeURIComponent("hello world");
    expect(getCookie("testCookie")).toBe("hello world");
  });

  it("returns null for a different cookie name", () => {
    cookieJar["otherCookie"] = "value";
    expect(getCookie("testCookie")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// setCookie / deleteCookie
// ---------------------------------------------------------------------------

describe("setCookie", () => {
  it("stores a cookie value", () => {
    setCookie("myKey", "myValue");
    expect(getCookie("myKey")).toBe("myValue");
  });

  it("stores a value with special characters (URL-encoded)", () => {
    setCookie("key", "hello world");
    expect(getCookie("key")).toBe("hello world");
  });

  it("overwrites an existing cookie", () => {
    setCookie("key", "first");
    setCookie("key", "second");
    expect(getCookie("key")).toBe("second");
  });
});

describe("deleteCookie", () => {
  it("removes a cookie that was set", () => {
    cookieJar["toDelete"] = "value";
    deleteCookie("toDelete");
    expect(getCookie("toDelete")).toBeNull();
  });

  it("does not throw when deleting a non-existent cookie", () => {
    expect(() => deleteCookie("ghost")).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getSavedPreferences
// ---------------------------------------------------------------------------

describe("getSavedPreferences", () => {
  it("returns null when no consent cookie exists", () => {
    expect(getSavedPreferences()).toBeNull();
  });

  it("returns parsed preferences when cookie is valid JSON", () => {
    const prefs = {
      necessary: true,
      analytics: true,
      advertising: false,
      decidedAt: "2024-01-01T00:00:00.000Z",
    };
    cookieJar[COOKIE_CONSENT_KEY] = encodeURIComponent(JSON.stringify(prefs));
    const result = getSavedPreferences();
    expect(result).not.toBeNull();
    expect(result!.analytics).toBe(true);
    expect(result!.advertising).toBe(false);
    expect(result!.necessary).toBe(true);
  });

  it("returns null when cookie contains corrupted JSON", () => {
    cookieJar[COOKIE_CONSENT_KEY] = encodeURIComponent("{bad json}");
    expect(getSavedPreferences()).toBeNull();
  });

  it("coerces analytics/advertising to boolean", () => {
    const prefs = { analytics: 1, advertising: 0 };
    cookieJar[COOKIE_CONSENT_KEY] = encodeURIComponent(JSON.stringify(prefs));
    const result = getSavedPreferences();
    expect(result!.analytics).toBe(true);
    expect(result!.advertising).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyPreferences
// ---------------------------------------------------------------------------

describe("applyPreferences", () => {
  it("returns CookiePreferences with necessary=true", () => {
    const result = applyPreferences({ analytics: true, advertising: false });
    expect(result.necessary).toBe(true);
    expect(result.analytics).toBe(true);
    expect(result.advertising).toBe(false);
  });

  it("persists preferences to cookie", () => {
    applyPreferences({ analytics: false, advertising: true });
    const saved = getSavedPreferences();
    expect(saved).not.toBeNull();
    expect(saved!.advertising).toBe(true);
    expect(saved!.analytics).toBe(false);
  });

  it("includes a decidedAt timestamp", () => {
    const result = applyPreferences({ analytics: false, advertising: false });
    expect(result.decidedAt).toBeTruthy();
    expect(new Date(result.decidedAt!).getTime()).toBeGreaterThan(0);
  });
});
