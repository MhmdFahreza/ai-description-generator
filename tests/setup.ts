import { expect, vi } from "vitest";

// Suppress console output during tests (can be re-enabled per test)
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

// ---- Node.js built-ins / globals needed by tests ----
// crypto.randomUUID is available in Node 19+; polyfill for older:
if (!globalThis.crypto?.randomUUID) {
  const { webcrypto } = await import("crypto");
  // @ts-expect-error – polyfill
  globalThis.crypto = webcrypto;
}
