/**
 * Unit tests: ai-pricing.ts
 *
 * Covers:
 *  - Cost estimation using default model pricing
 *  - Separate input and output token rates
 *  - Safe handling of null/missing token counts (does not invent estimates)
 *  - Overriding pricing via environment variables
 *  - Explicit disclaimer inclusion
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  calculateEstimatedCost,
  getModelPricing,
  PRICING_DISCLAIMER,
  DEFAULT_MODEL,
} from "@/config/ai-pricing";

describe("ai-pricing.ts — Cost Estimation", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calculates cost accurately with default pricing ($0.15/1M input, $0.60/1M output)", () => {
    // 100,000 prompt tokens: (100,000 / 1,000,000) * 0.15 = 0.015
    // 50,000 completion tokens: (50,000 / 1,000,000) * 0.60 = 0.030
    // Total = 0.045
    const result = calculateEstimatedCost(100_000, 50_000, DEFAULT_MODEL);

    expect(result.estimatedCostUsd).toBe(0.045);
    expect(result.inputCostUsd).toBe(0.015);
    expect(result.outputCostUsd).toBe(0.03);
    expect(result.isEstimate).toBe(true);
    expect(result.hasUnknownTokens).toBe(false);
    expect(result.disclaimer).toBe(PRICING_DISCLAIMER);
  });

  it("handles 0 tokens correctly (returns 0 cost)", () => {
    const result = calculateEstimatedCost(0, 0, DEFAULT_MODEL);

    expect(result.estimatedCostUsd).toBe(0);
    expect(result.inputCostUsd).toBe(0);
    expect(result.outputCostUsd).toBe(0);
    expect(result.hasUnknownTokens).toBe(false);
  });

  it("returns null estimatedCostUsd when promptTokens is null (does NOT invent estimates)", () => {
    const result = calculateEstimatedCost(null, 150, DEFAULT_MODEL);

    expect(result.estimatedCostUsd).toBeNull();
    expect(result.hasUnknownTokens).toBe(true);
    expect(result.isEstimate).toBe(true);
  });

  it("returns null estimatedCostUsd when completionTokens is undefined", () => {
    const result = calculateEstimatedCost(200, undefined, DEFAULT_MODEL);

    expect(result.estimatedCostUsd).toBeNull();
    expect(result.hasUnknownTokens).toBe(true);
  });

  it("respects environment variable pricing overrides", () => {
    vi.stubEnv("AI_INPUT_PRICE_PER_MILLION", "0.50");
    vi.stubEnv("AI_OUTPUT_PRICE_PER_MILLION", "1.50");

    const pricing = getModelPricing(DEFAULT_MODEL);
    expect(pricing.inputPricePerMillion).toBe(0.5);
    expect(pricing.outputPricePerMillion).toBe(1.5);

    // 1M prompt ($0.50) + 1M completion ($1.50) = $2.00
    const result = calculateEstimatedCost(1_000_000, 1_000_000, DEFAULT_MODEL);
    expect(result.estimatedCostUsd).toBe(2.0);
  });

  it("falls back to default pricing when env vars are invalid numbers", () => {
    vi.stubEnv("AI_INPUT_PRICE_PER_MILLION", "not-a-number");
    vi.stubEnv("AI_OUTPUT_PRICE_PER_MILLION", "invalid");

    const pricing = getModelPricing(DEFAULT_MODEL);
    expect(pricing.inputPricePerMillion).toBe(0.15);
    expect(pricing.outputPricePerMillion).toBe(0.6);
  });
});
