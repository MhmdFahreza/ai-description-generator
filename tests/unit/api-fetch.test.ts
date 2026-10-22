/**
 * Unit tests: api-fetch.ts
 *
 * Covers:
 *  - apiFetch dispatches `rateLimitUpdated` event with header values
 *  - apiFetch dispatches `rateLimitExceeded` event on 429
 *  - reason inference from Retry-After header when X-RateLimit-Reason is missing
 *  - No event dispatched when rate-limit headers are absent
 *  - Returns the original Response
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch } from "@/lib/api-fetch";

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

function makeFetchMock(status: number, headers: Record<string, string>, body = "{}") {
  const responseHeaders = new Headers(headers);
  const response = new Response(body, { status, headers: responseHeaders });
  return vi.fn().mockResolvedValue(response);
}

// ---------------------------------------------------------------------------
// Setup: browser-like window with event dispatch support
// ---------------------------------------------------------------------------

const dispatchedEvents: Array<{ type: string; detail: unknown }> = [];

beforeEach(() => {
  dispatchedEvents.length = 0;

  // Mock window if not already available
  if (typeof globalThis.window === "undefined") {
    Object.defineProperty(globalThis, "window", {
      value: globalThis,
      writable: true,
    });
  }

  // Override dispatchEvent to capture events
  globalThis.dispatchEvent = (event: Event) => {
    if (event instanceof CustomEvent) {
      dispatchedEvents.push({ type: event.type, detail: event.detail });
    }
    return true;
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("apiFetch – rate limit headers", () => {
  it("returns the Response from fetch", async () => {
    const mockFetch = makeFetchMock(200, {});
    vi.stubGlobal("fetch", mockFetch);

    const res = await apiFetch("/api/test");
    expect(res.status).toBe(200);
  });

  it("dispatches rateLimitUpdated when daily header is present", async () => {
    const mockFetch = makeFetchMock(200, {
      "x-ratelimit-remaining-daily": "7",
      "x-ratelimit-remaining-minute": "3",
      "x-ratelimit-reset": "1700000000000",
    });
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/api/test");

    const evt = dispatchedEvents.find((e) => e.type === "rateLimitUpdated");
    expect(evt).toBeDefined();
    expect((evt!.detail as Record<string, unknown>).remainingDaily).toBe(7);
    expect((evt!.detail as Record<string, unknown>).remainingMinute).toBe(3);
    expect((evt!.detail as Record<string, unknown>).resetAt).toBe(1700000000000);
  });

  it("does NOT dispatch rateLimitUpdated when no rate-limit headers", async () => {
    const mockFetch = makeFetchMock(200, {});
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/api/test");

    const evt = dispatchedEvents.find((e) => e.type === "rateLimitUpdated");
    expect(evt).toBeUndefined();
  });

  it("dispatches rateLimitExceeded on 429 with reason from header", async () => {
    const mockFetch = makeFetchMock(429, {
      "x-ratelimit-remaining-daily": "0",
      "x-ratelimit-reason": "daily",
      "retry-after": "0",
    });
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/api/test");

    const evt = dispatchedEvents.find((e) => e.type === "rateLimitExceeded");
    expect(evt).toBeDefined();
    expect((evt!.detail as Record<string, unknown>).reason).toBe("daily");
  });

  it("infers 'minute' reason from Retry-After > 0 when X-RateLimit-Reason is absent", async () => {
    const mockFetch = makeFetchMock(429, {
      "retry-after": "45",
    });
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/api/test");

    const evt = dispatchedEvents.find((e) => e.type === "rateLimitExceeded");
    expect(evt).toBeDefined();
    expect((evt!.detail as Record<string, unknown>).reason).toBe("minute");
    expect((evt!.detail as Record<string, unknown>).retryAfterSeconds).toBe(45);
  });

  it("infers 'daily' reason when Retry-After is 0 and no reason header", async () => {
    const mockFetch = makeFetchMock(429, {
      "retry-after": "0",
    });
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/api/test");

    const evt = dispatchedEvents.find((e) => e.type === "rateLimitExceeded");
    expect(evt).toBeDefined();
    expect((evt!.detail as Record<string, unknown>).reason).toBe("daily");
  });

  it("does NOT dispatch rateLimitExceeded for non-429 errors", async () => {
    const mockFetch = makeFetchMock(500, {});
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/api/test");

    const evt = dispatchedEvents.find((e) => e.type === "rateLimitExceeded");
    expect(evt).toBeUndefined();
  });

  it("passes through options to fetch", async () => {
    const mockFetch = makeFetchMock(200, {});
    vi.stubGlobal("fetch", mockFetch);

    await apiFetch("/api/test", {
      method: "POST",
      body: JSON.stringify({ test: true }),
      headers: { "content-type": "application/json" },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({ method: "POST" })
    );
  });
});
