/**
 * Integration tests: withGuard middleware
 *
 * Tests the full withGuard pipeline using mocked rate limiter and identity
 * so we don't need Redis or actual AI API calls.
 *
 * Covers:
 *  - Origin/CSRF rejection for cross-domain requests
 *  - Content-Type enforcement
 *  - Input validation (required fields, abuse)
 *  - Rate limit enforcement (daily and burst)
 *  - Rate-limit headers on responses
 *  - Quota refund on 5xx handler response
 *  - Quota refund on unhandled exception
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// We need to mock rate-limiter and visitor-identity before importing api-guard
vi.mock("@/lib/rate-limiter", () => ({
  MAX_PER_DAY: 10,
  rateLimit: vi.fn(),
  refundQuota: vi.fn(),
}));

vi.mock("@/lib/visitor-identity", () => ({
  getOrCreateVisitorIdentity: vi.fn(),
  attachVisitorCookie: vi.fn(),
}));

import { withGuard } from "@/lib/api-guard";
import * as rateLimiterMod from "@/lib/rate-limiter";
import * as visitorMod from "@/lib/visitor-identity";

// ---------------------------------------------------------------------------
// Test schema & helpers
// ---------------------------------------------------------------------------

const schema = [
  { name: "productName", required: true, freeText: true },
  { name: "tone", required: false },
];

function okHandler() {
  return async () =>
    NextResponse.json({ result: "ok" }, { status: 200 });
}

function errorHandler(status: number) {
  return async () =>
    NextResponse.json({ error: "fail" }, { status });
}

function throwingHandler() {
  return async (): Promise<NextResponse> => {
    throw new Error("Unexpected boom");
  };
}

function makeRequest(options: {
  body?: unknown;
  contentType?: string;
  origin?: string;
  host?: string;
}): NextRequest {
  const {
    body = { productName: "Test Product" },
    contentType = "application/json",
    origin,
    host = "localhost:3000",
  } = options;

  const headers: Record<string, string> = { host };
  if (contentType) headers["content-type"] = contentType;
  if (origin) headers["origin"] = origin;

  return new NextRequest("http://localhost:3000/api/generate/product-description", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const mockIdentity = {
  visitorId: "test-visitor-id",
  ip: "127.0.0.1",
  isNew: false,
};

const allowedRateResult = {
  allowed: true,
  remainingDaily: 9,
  remainingMinute: 4,
  retryAfterSeconds: 0,
  resetAt: Date.now() + 86400000,
  mode: "memory" as const,
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.mocked(visitorMod.getOrCreateVisitorIdentity).mockReturnValue(mockIdentity);
  vi.mocked(visitorMod.attachVisitorCookie).mockImplementation(() => {});
  vi.mocked(rateLimiterMod.rateLimit).mockResolvedValue(allowedRateResult);
  vi.mocked(rateLimiterMod.refundQuota).mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Origin validation
// ---------------------------------------------------------------------------

describe("withGuard – Origin validation", () => {
  it("allows request with no Origin header (server-to-server)", async () => {
    const handler = withGuard(schema, okHandler());
    const req = makeRequest({});
    const res = await handler(req);
    expect(res.status).toBe(200);
  });

  it("allows request from same host", async () => {
    const handler = withGuard(schema, okHandler());
    const req = makeRequest({ origin: "http://localhost:3000" });
    const res = await handler(req);
    expect(res.status).toBe(200);
  });

  it("blocks cross-origin request from unknown domain", async () => {
    const handler = withGuard(schema, okHandler());
    const req = makeRequest({ origin: "https://evil.com" });
    const res = await handler(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Content-Type
// ---------------------------------------------------------------------------

describe("withGuard – Content-Type", () => {
  it("returns 415 for wrong content-type", async () => {
    const handler = withGuard(schema, okHandler());
    const req = makeRequest({ contentType: "text/plain" });
    const res = await handler(req);
    expect(res.status).toBe(415);
  });
});

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe("withGuard – Input validation", () => {
  it("returns 400 when required field is missing", async () => {
    const handler = withGuard(schema, okHandler());
    const req = makeRequest({ body: {} });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown fields", async () => {
    const handler = withGuard(schema, okHandler());
    const req = makeRequest({ body: { productName: "Test", evilField: "x" } });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("passes with valid body", async () => {
    const handler = withGuard(schema, okHandler());
    const req = makeRequest({ body: { productName: "Sepatu Lari" } });
    const res = await handler(req);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

describe("withGuard – Rate limiting", () => {
  it("returns 429 when rate limit is daily-exceeded", async () => {
    vi.mocked(rateLimiterMod.rateLimit).mockResolvedValueOnce({
      allowed: false,
      reason: "daily",
      remainingDaily: 0,
      remainingMinute: 5,
      retryAfterSeconds: 0,
      resetAt: Date.now() + 86400000,
      message: "Daily limit reached",
      mode: "memory",
    });

    const handler = withGuard(schema, okHandler());
    const req = makeRequest({});
    const res = await handler(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.reason).toBe("daily");
  });

  it("returns 429 when rate limit is burst-exceeded", async () => {
    vi.mocked(rateLimiterMod.rateLimit).mockResolvedValueOnce({
      allowed: false,
      reason: "minute",
      remainingDaily: 5,
      remainingMinute: 0,
      retryAfterSeconds: 30,
      message: "Burst limit reached",
      mode: "memory",
    });

    const handler = withGuard(schema, okHandler());
    const req = makeRequest({});
    const res = await handler(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.reason).toBe("minute");
  });

  it("sets Retry-After header on 429", async () => {
    vi.mocked(rateLimiterMod.rateLimit).mockResolvedValueOnce({
      allowed: false,
      reason: "minute",
      remainingDaily: 5,
      remainingMinute: 0,
      retryAfterSeconds: 45,
      message: "Burst limit",
      mode: "memory",
    });

    const handler = withGuard(schema, okHandler());
    const req = makeRequest({});
    const res = await handler(req);
    expect(res.headers.get("Retry-After")).toBe("45");
  });

  it("returns 503 when rate limiter throws", async () => {
    vi.mocked(rateLimiterMod.rateLimit).mockRejectedValueOnce(
      new Error("Redis connection error")
    );

    const handler = withGuard(schema, okHandler());
    const req = makeRequest({});
    const res = await handler(req);
    expect(res.status).toBe(503);
  });
});

// ---------------------------------------------------------------------------
// Rate-limit headers on success
// ---------------------------------------------------------------------------

describe("withGuard – Rate-limit response headers", () => {
  it("sets X-RateLimit-Limit header", async () => {
    const handler = withGuard(schema, okHandler());
    const req = makeRequest({});
    const res = await handler(req);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
  });

  it("sets X-RateLimit-Remaining-Daily header", async () => {
    const handler = withGuard(schema, okHandler());
    const req = makeRequest({});
    const res = await handler(req);
    expect(res.headers.get("X-RateLimit-Remaining-Daily")).toBe("9");
  });

  it("sets X-RateLimit-Remaining-Minute header", async () => {
    const handler = withGuard(schema, okHandler());
    const req = makeRequest({});
    const res = await handler(req);
    expect(res.headers.get("X-RateLimit-Remaining-Minute")).toBe("4");
  });
});

// ---------------------------------------------------------------------------
// Quota refund on 5xx
// ---------------------------------------------------------------------------

describe("withGuard – Quota refund on 5xx", () => {
  it("calls refundQuota when handler returns 500", async () => {
    const handler = withGuard(schema, errorHandler(500));
    const req = makeRequest({});
    await handler(req);
    expect(rateLimiterMod.refundQuota).toHaveBeenCalledWith("test-visitor-id");
  });

  it("calls refundQuota when handler returns 502", async () => {
    const handler = withGuard(schema, errorHandler(502));
    const req = makeRequest({});
    await handler(req);
    expect(rateLimiterMod.refundQuota).toHaveBeenCalledWith("test-visitor-id");
  });

  it("calls refundQuota when handler throws an unhandled exception", async () => {
    const handler = withGuard(schema, throwingHandler());
    const req = makeRequest({});
    const res = await handler(req);
    expect(res.status).toBe(500);
    expect(rateLimiterMod.refundQuota).toHaveBeenCalled();
  });

  it("does NOT call refundQuota when handler returns 200", async () => {
    const handler = withGuard(schema, okHandler());
    const req = makeRequest({});
    await handler(req);
    expect(rateLimiterMod.refundQuota).not.toHaveBeenCalled();
  });

  it("does NOT call refundQuota when handler returns 400", async () => {
    const handler = withGuard(schema, errorHandler(400));
    const req = makeRequest({});
    await handler(req);
    expect(rateLimiterMod.refundQuota).not.toHaveBeenCalled();
  });
});
