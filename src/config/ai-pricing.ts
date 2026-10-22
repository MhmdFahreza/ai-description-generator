/**
 * ai-pricing.ts — Configurable pricing models for AI usage cost estimation.
 *
 * HOW TO UPDATE PRICING:
 * 1. Update the default rates in `DEFAULT_MODEL_PRICING` below, OR
 * 2. Set the environment variables:
 *    - `AI_INPUT_PRICE_PER_MILLION`: Price in USD per 1,000,000 prompt tokens
 *    - `AI_OUTPUT_PRICE_PER_MILLION`: Price in USD per 1,000,000 completion tokens
 *
 * IMPORTANT DISCLAIMER:
 * Estimated costs calculated here are operational projections based on reported
 * token counts and configured rates. They DO NOT represent the provider's actual
 * billed invoice, which may vary due to volume tiers, minimum spend, batch discounts,
 * taxes, or currency fluctuations.
 */

export interface ModelPricing {
  modelId: string;
  displayName: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  currency: "USD";
  effectiveDate: string;
}

export const PRICING_DISCLAIMER =
  "Estimated costs are calculated using configured model rates and reported token counts. " +
  "They do not equal the actual provider invoice and are for internal estimation only.";

export const DEFAULT_MODEL = "openai/gpt-oss-120b";

export const DEFAULT_MODEL_PRICING: Record<string, ModelPricing> = {
  "openai/gpt-oss-120b": {
    modelId: "openai/gpt-oss-120b",
    displayName: "GPT-OSS 120B (Groq)",
    // Current indicative rates ($0.15 / 1M prompt, $0.60 / 1M completion)
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
    currency: "USD",
    effectiveDate: "2025-01-01",
  },
};

/**
 * Returns the effective pricing for a model, considering environment variable overrides.
 */
export function getModelPricing(modelId: string = DEFAULT_MODEL): ModelPricing {
  const base = DEFAULT_MODEL_PRICING[modelId] ?? {
    modelId,
    displayName: modelId,
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
    currency: "USD" as const,
    effectiveDate: new Date().toISOString().split("T")[0],
  };

  const envInput = process.env.AI_INPUT_PRICE_PER_MILLION;
  const envOutput = process.env.AI_OUTPUT_PRICE_PER_MILLION;

  const inputPrice =
    envInput && !isNaN(Number(envInput))
      ? Number(envInput)
      : base.inputPricePerMillion;

  const outputPrice =
    envOutput && !isNaN(Number(envOutput))
      ? Number(envOutput)
      : base.outputPricePerMillion;

  return {
    ...base,
    inputPricePerMillion: inputPrice,
    outputPricePerMillion: outputPrice,
  };
}

export interface CostCalculationResult {
  estimatedCostUsd: number | null;
  inputCostUsd: number | null;
  outputCostUsd: number | null;
  isEstimate: true;
  disclaimer: string;
  hasUnknownTokens: boolean;
}

/**
 * Calculates estimated cost for given token counts using the configured pricing.
 * Returns null if token counts are not available (does not invent estimates).
 */
export function calculateEstimatedCost(
  promptTokens: number | null | undefined,
  completionTokens: number | null | undefined,
  modelId: string = DEFAULT_MODEL
): CostCalculationResult {
  if (
    promptTokens === null ||
    promptTokens === undefined ||
    completionTokens === null ||
    completionTokens === undefined
  ) {
    return {
      estimatedCostUsd: null,
      inputCostUsd: null,
      outputCostUsd: null,
      isEstimate: true,
      disclaimer: PRICING_DISCLAIMER,
      hasUnknownTokens: true,
    };
  }

  const pricing = getModelPricing(modelId);

  const inputCost = (promptTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost =
    (completionTokens / 1_000_000) * pricing.outputPricePerMillion;
  const totalCost = inputCost + outputCost;

  return {
    estimatedCostUsd: Number(totalCost.toFixed(6)),
    inputCostUsd: Number(inputCost.toFixed(6)),
    outputCostUsd: Number(outputCost.toFixed(6)),
    isEstimate: true,
    disclaimer: PRICING_DISCLAIMER,
    hasUnknownTokens: false,
  };
}
