/**
 * Unit tests: session-storage.ts
 *
 * Because sessionStorage is a browser API, we use jsdom environment.
 * We reset the mock between tests so each starts clean.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock sessionStorage (jsdom doesn't always provide it in node env)
// ---------------------------------------------------------------------------

const store: Record<string, string> = {};

const sessionStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const key of Object.keys(store)) delete store[key];
  },
  get length() {
    return Object.keys(store).length;
  },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

Object.defineProperty(globalThis, "window", { value: globalThis, writable: true });
Object.defineProperty(globalThis, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
});

// Now import the module (after window and sessionStorage are available)
import { ssGet, ssSet, ssRemove } from "@/lib/session-storage";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  sessionStorageMock.clear();
});

describe("ssSet / ssGet", () => {
  it("stores and retrieves a string", () => {
    ssSet("myKey", "hello");
    expect(ssGet("myKey")).toBe("hello");
  });

  it("stores and retrieves an object", () => {
    const obj = { name: "Test", value: 42 };
    ssSet("objKey", obj);
    expect(ssGet("objKey")).toEqual(obj);
  });

  it("stores and retrieves an array", () => {
    ssSet("arrKey", [1, 2, 3]);
    expect(ssGet("arrKey")).toEqual([1, 2, 3]);
  });

  it("returns null for missing key", () => {
    expect(ssGet("nonExistent")).toBeNull();
  });

  it("overwrites existing value", () => {
    ssSet("k", "first");
    ssSet("k", "second");
    expect(ssGet("k")).toBe("second");
  });
});

describe("ssRemove", () => {
  it("removes a key that exists", () => {
    ssSet("toRemove", "data");
    ssRemove("toRemove");
    expect(ssGet("toRemove")).toBeNull();
  });

  it("does not throw when removing non-existent key", () => {
    expect(() => ssRemove("ghost")).not.toThrow();
  });
});

describe("ssGet – edge cases", () => {
  it("returns null for explicitly stored null-like JSON value 'null'", () => {
    sessionStorageMock.setItem("nullKey", "null");
    // JSON.parse("null") => null, which triggers the ternary to return null
    expect(ssGet("nullKey")).toBeNull();
  });

  it("returns null when sessionStorage returns corrupted JSON", () => {
    sessionStorageMock.setItem("corrupt", "{bad json}");
    expect(ssGet("corrupt")).toBeNull();
  });
});
