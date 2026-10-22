/**
 * Unit tests: rate-limiter.ts (in-memory / development fallback path)
 *
 * These tests run WITHOUT Upstash Redis. They exercise the in-memory sliding
 * window logic (memoryRateLimit / memoryCheckQuota) which is used in dev mode.
 *
 * We force the in-memory path by making sure UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are not set.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Ensure no Redis env vars leak in from the test environment
vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
vi.stubEnv("NODE_ENV", "development");

// Import AFTER stubbing env so lazy singletons pick up the empty vars
import {
  rateLimit,
  checkQuota,
  refundQuota,
  MAX_PER_DAY,
  MAX_PER_MINUTE,
  isRedisConfigured,
} from "@/lib/rate-limiter";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let uidCounter = 0;
function uniqueVisitor(): string {
  return `test-visitor-${Date.now()}-${++uidCounter}`;
}
function uniqueIP(): string {
  return `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

// ---------------------------------------------------------------------------
// isRedisConfigured
// ---------------------------------------------------------------------------

describe("isRedisConfigured", () => {
  it("returns false when env vars are empty", () => {
    expect(isRedisConfigured()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// rateLimit – basic flow (in-memory)
// ---------------------------------------------------------------------------

describe("rateLimit – in-memory", () => {
  it("allows first request and returns full quota", async () => {
    const visitor = uniqueVisitor();
    const ip = uniqueIP();
    const result = await rateLimit(visitor, ip);
    expect(result.allowed).toBe(true);
    expect(result.remainingDaily).toBe(MAX_PER_DAY - 1);
    expect(result.mode).toBe("memory");
  });

  it("decrements remaining quota on each call", async () => {
    const visitor = uniqueVisitor();
    const ip = uniqueIP();

    const first = await rateLimit(visitor, ip);
    expect(first.remainingDaily).toBe(MAX_PER_DAY - 1);

    const second = await rateLimit(visitor, ip);
    expect(second.remainingDaily).toBe(MAX_PER_DAY - 2);
  });

  it("blocks after daily quota is exhausted", async () => {
    const visitor = uniqueVisitor();
    const ip = uniqueIP();

    // Exhaust daily quota (different visitor than burst check to avoid minute-limit interference)
    for (let i = 0; i < MAX_PER_DAY; i++) {
      await rateLimit(visitor, `${ip}.${i}`); // vary IP slightly to avoid burst limit
    }

    const result = await rateLimit(visitor, uniqueIP());
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("daily");
    expect(result.remainingDaily).toBe(0);
  });

  it("blocks after burst limit is reached for same IP", async () => {
    const ip = uniqueIP();

    // Use different visitors to avoid daily quota
    for (let i = 0; i < MAX_PER_MINUTE; i++) {
      await rateLimit(uniqueVisitor(), ip);
    }

    const result = await rateLimit(uniqueVisitor(), ip);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("minute");
    expect(result.remainingMinute).toBe(0);
  });

  it("returns retryAfterSeconds > 0 when burst-limited", async () => {
    const ip = uniqueIP();
    for (let i = 0; i < MAX_PER_MINUTE; i++) {
      await rateLimit(uniqueVisitor(), ip);
    }
    const result = await rateLimit(uniqueVisitor(), ip);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("different visitors share same burst IP counter", async () => {
    const ip = uniqueIP();
    // Fill up the burst window
    for (let i = 0; i < MAX_PER_MINUTE; i++) {
      await rateLimit(uniqueVisitor(), ip);
    }
    // Even a brand-new visitor on the same IP is blocked
    const result = await rateLimit(uniqueVisitor(), ip);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("minute");
  });
});

// ---------------------------------------------------------------------------
// checkQuota – non-destructive read
// ---------------------------------------------------------------------------

describe("checkQuota – in-memory", () => {
  it("returns full quota for new visitor", async () => {
    const visitor = uniqueVisitor();
    const ip = uniqueIP();
    const status = await checkQuota(visitor, ip);
    expect(status.remaining).toBe(MAX_PER_DAY);
    expect(status.allowed).toBe(true);
    expect(status.limit).toBe(MAX_PER_DAY);
  });

  it("does not decrement quota when called", async () => {
    const visitor = uniqueVisitor();
    const ip = uniqueIP();
    await checkQuota(visitor, ip);
    await checkQuota(visitor, ip);
    const status = await checkQuota(visitor, ip);
    expect(status.remaining).toBe(MAX_PER_DAY); // still full
  });

  it("reflects consumed quota after rateLimit calls", async () => {
    const visitor = uniqueVisitor();
    const ip = uniqueIP();
    await rateLimit(visitor, ip); // consume 1
    await rateLimit(visitor, ip); // consume 2
    const status = await checkQuota(visitor, ip);
    expect(status.remaining).toBe(MAX_PER_DAY - 2);
  });
});

// ---------------------------------------------------------------------------
// refundQuota – rollback one token
// ---------------------------------------------------------------------------

describe("refundQuota – in-memory", () => {
  it("restores one quota token after a failed generate", async () => {
    const visitor = uniqueVisitor();
    const ip = uniqueIP();

    await rateLimit(visitor, ip); // consume 1 → remaining = 9

    const beforeRefund = await checkQuota(visitor, ip);
    expect(beforeRefund.remaining).toBe(MAX_PER_DAY - 1);

    await refundQuota(visitor);

    const afterRefund = await checkQuota(visitor, ip);
    expect(afterRefund.remaining).toBe(MAX_PER_DAY);
  });

  it("does not go above MAX_PER_DAY on double refund", async () => {
    const visitor = uniqueVisitor();
    const ip = uniqueIP();

    await rateLimit(visitor, ip); // consume 1

    await refundQuota(visitor);
    await refundQuota(visitor); // second refund on a visitor with 0 consumed

    const status = await checkQuota(visitor, ip);
    // Remaining should not exceed MAX_PER_DAY
    expect(status.remaining).toBeLessThanOrEqual(MAX_PER_DAY);
  });

  it("allows a generate after refund when daily quota was exactly full", async () => {
    const visitor = uniqueVisitor();
    const ip = uniqueIP();

    // Exhaust daily quota (use distinct IPs to avoid burst limit)
    for (let i = 0; i < MAX_PER_DAY; i++) {
      await rateLimit(visitor, `10.1.${i}.1`);
    }

    let result = await rateLimit(visitor, uniqueIP());
    expect(result.allowed).toBe(false);

    await refundQuota(visitor);

    result = await rateLimit(visitor, uniqueIP());
    expect(result.allowed).toBe(true);
  });
});
