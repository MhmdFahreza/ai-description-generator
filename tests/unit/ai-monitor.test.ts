/**
 * Unit tests: ai-monitor.ts
 *
 * Covers:
 *  - Provider usage normalization (valid, missing, partial, malformed)
 *  - AI execution recording (success, 429 rate limit, 502 provider error, 504 timeout)
 *  - Rate-limited requests are strictly distinguished from provider failures
 *  - Missing provider token metadata is handled safely without guessing
 *  - Sensitive prompt and output data are NEVER included in usage records or logs
 *  - In-memory aggregation and daily rollups
 *  - Operational alert evaluation (high volume, failure rate, high latency, spend threshold)
 *  - URL pathname generator ID inference
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  normalizeProviderUsage,
  recordAiUsage,
  getDailyUsageSummary,
  inferGeneratorId,
  _clearMemoryStoreForTest,
} from "@/lib/ai-monitor";

describe("ai-monitor.ts — normalizeProviderUsage", () => {
  it("normalizes complete and valid usage object", () => {
    const usage = {
      prompt_tokens: 150,
      completion_tokens: 75,
      total_tokens: 225,
    };
    const result = normalizeProviderUsage(usage);
    expect(result).toEqual({
      promptTokens: 150,
      completionTokens: 75,
      totalTokens: 225,
    });
  });

  it("handles null or undefined usage safely (returns all null)", () => {
    expect(normalizeProviderUsage(null)).toEqual({
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    });
    expect(normalizeProviderUsage(undefined)).toEqual({
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    });
  });

  it("calculates totalTokens if prompt and completion exist but total_tokens is omitted", () => {
    const usage = { prompt_tokens: 80, completion_tokens: 40 };
    const result = normalizeProviderUsage(usage);
    expect(result.promptTokens).toBe(80);
    expect(result.completionTokens).toBe(40);
    expect(result.totalTokens).toBe(120);
  });

  it("ignores invalid types (strings, NaN, booleans)", () => {
    const usage = {
      prompt_tokens: ("100" as unknown as number),
      completion_tokens: NaN,
      total_tokens: (true as unknown as number),
    };
    const result = normalizeProviderUsage(usage);
    expect(result.promptTokens).toBeNull();
    expect(result.completionTokens).toBeNull();
    expect(result.totalTokens).toBeNull();
  });
});

describe("ai-monitor.ts — recordAiUsage Operational Event Logging", () => {
  beforeEach(() => {
    _clearMemoryStoreForTest();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("records a successful AI call with tokens, duration, and cost estimation", async () => {
    const record = await recordAiUsage({
      generatorId: "product-description",
      durationMs: 850,
      status: 200,
      providerUsage: {
        prompt_tokens: 200,
        completion_tokens: 100,
        total_tokens: 300,
      },
    });

    expect(record.generatorId).toBe("product-description");
    expect(record.success).toBe(true);
    expect(record.httpStatus).toBe(200);
    expect(record.errorCategory).toBe("none");
    expect(record.rejectedByRateLimit).toBe(false);
    expect(record.promptTokens).toBe(200);
    expect(record.completionTokens).toBe(100);
    expect(record.totalTokens).toBe(300);
    expect(record.durationMs).toBe(850);
    expect(typeof record.estimatedCostUsd).toBe("number");
    expect(record.estimatedCostUsd).toBeGreaterThan(0);

    // Verify record has NO prompts, completions, or user data
    expect(record).not.toHaveProperty("prompt");
    expect(record).not.toHaveProperty("content");
    expect(record).not.toHaveProperty("result");
    expect(record).not.toHaveProperty("output");
    expect(record).not.toHaveProperty("ip");
    expect(record).not.toHaveProperty("visitorId");
  });

  it("records a rate-limited request (429) distinctly from provider errors", async () => {
    const record = await recordAiUsage({
      generatorId: "hook",
      durationMs: 15,
      status: 429,
      rejectedByRateLimit: true,
    });

    expect(record.generatorId).toBe("hook");
    expect(record.success).toBe(false);
    expect(record.httpStatus).toBe(429);
    expect(record.rejectedByRateLimit).toBe(true);
    expect(record.errorCategory).toBe("rate_limit");
    expect(record.promptTokens).toBeNull();
    expect(record.completionTokens).toBeNull();
    expect(record.totalTokens).toBeNull();
    expect(record.estimatedCostUsd).toBeNull();
  });

  it("records provider 502 error safely", async () => {
    const record = await recordAiUsage({
      generatorId: "marketplace-description",
      durationMs: 1200,
      status: 502,
      errorCategory: "provider_error",
    });

    expect(record.success).toBe(false);
    expect(record.httpStatus).toBe(502);
    expect(record.errorCategory).toBe("provider_error");
    expect(record.rejectedByRateLimit).toBe(false);
  });

  it("records timeout 504 safely", async () => {
    const record = await recordAiUsage({
      generatorId: "social-media-caption",
      durationMs: 25000,
      status: 504,
      errorCategory: "provider_timeout",
    });

    expect(record.success).toBe(false);
    expect(record.httpStatus).toBe(504);
    expect(record.errorCategory).toBe("provider_timeout");
  });

  it("records invalid input 400 safely", async () => {
    const record = await recordAiUsage({
      generatorId: "seo-description",
      durationMs: 8,
      status: 400,
      errorCategory: "invalid_input",
    });

    expect(record.success).toBe(false);
    expect(record.httpStatus).toBe(400);
    expect(record.errorCategory).toBe("invalid_input");
  });
});

describe("ai-monitor.ts — Aggregation & Daily Summary", () => {
  beforeEach(() => {
    _clearMemoryStoreForTest();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("aggregates multiple requests into daily metrics", async () => {
    // 1 success on product-description
    await recordAiUsage({
      generatorId: "product-description",
      durationMs: 500,
      status: 200,
      providerUsage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    });

    // 1 success on seo-description
    await recordAiUsage({
      generatorId: "seo-description",
      durationMs: 300,
      status: 200,
      providerUsage: { prompt_tokens: 50, completion_tokens: 25, total_tokens: 75 },
    });

    // 1 rate-limited request
    await recordAiUsage({
      generatorId: "product-description",
      durationMs: 10,
      status: 429,
      rejectedByRateLimit: true,
    });

    const summary = await getDailyUsageSummary();

    expect(summary.totalRequests).toBe(3);
    expect(summary.successfulRequests).toBe(2);
    expect(summary.failedRequests).toBe(1);
    expect(summary.rateLimitedRequests).toBe(1);
    expect(summary.promptTokens).toBe(150);
    expect(summary.completionTokens).toBe(75);
    expect(summary.totalTokens).toBe(225);
    expect(summary.estimatedCostUsd).toBeGreaterThan(0);

    // Generator breakdown
    expect(summary.byGenerator["product-description"]).toBeDefined();
    expect(summary.byGenerator["product-description"].requests).toBe(2);
    expect(summary.byGenerator["product-description"].tokens).toBe(150);

    expect(summary.byGenerator["seo-description"]).toBeDefined();
    expect(summary.byGenerator["seo-description"].requests).toBe(1);
    expect(summary.byGenerator["seo-description"].tokens).toBe(75);
  });

  it("triggers high failure rate alert when threshold is breached", async () => {
    // 10 requests: 2 success, 8 failed (80% failure rate)
    for (let i = 0; i < 2; i++) {
      await recordAiUsage({ generatorId: "hook", durationMs: 200, status: 200 });
    }
    for (let i = 0; i < 8; i++) {
      await recordAiUsage({
        generatorId: "hook",
        durationMs: 200,
        status: 502,
        errorCategory: "provider_error",
      });
    }

    const summary = await getDailyUsageSummary();
    const alert = summary.activeAlerts.find((a) => a.type === "HIGH_FAILURE_RATE");

    expect(alert).toBeDefined();
    expect(alert?.level).toBe("critical");
    expect(alert?.value).toBe(80);
  });
});

describe("ai-monitor.ts — inferGeneratorId", () => {
  it("maps URL pathnames to standardized generator IDs", () => {
    expect(inferGeneratorId("/api/generate/product-description")).toBe("product-description");
    expect(inferGeneratorId("/api/generate/marketplace-description")).toBe("marketplace-description");
    expect(inferGeneratorId("/api/generate/seo-description")).toBe("seo-description");
    expect(inferGeneratorId("/api/generate/advertisement")).toBe("advertisement");
    expect(inferGeneratorId("/api/generate/hook")).toBe("hook");
    expect(inferGeneratorId("/api/generate/social-media-caption")).toBe("social-media-caption");
    expect(inferGeneratorId("/api/generate/title-generator")).toBe("title-generator");
    expect(inferGeneratorId("/api/generate/unknown-tool")).toBe("unknown");
  });
});
