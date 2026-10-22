/**
 * ai-monitor.ts — Privacy-conscious server-side AI usage monitoring and aggregation.
 *
 * PRIVACY GUARANTEES:
 * - NO user prompts or instructions are ever captured or logged.
 * - NO generated text or completion content is ever captured or logged.
 * - NO images, file names, or media data are captured or logged.
 * - NO visitor IDs, session tokens, cookies, or IP addresses are logged in usage records.
 * - Errors are normalized into controlled categories; raw provider error bodies containing
 *   user text are discarded.
 *
 * STORAGE & AGGREGATION ARCHITECTURE:
 * - Emits structured JSON logs for observability platforms (CloudWatch, Datadog, Vercel).
 * - Aggregates daily metrics into Redis hashes (`ai:usage:daily:YYYY-MM-DD`) with a 30-day TTL,
 *   strictly preventing unbounded Redis storage growth.
 * - In local dev or environments without Redis credentials, falls back to a bounded in-memory store.
 */

import { NextResponse } from "next/server";
import {
  calculateEstimatedCost,
  DEFAULT_MODEL,
  PRICING_DISCLAIMER,
} from "@/config/ai-pricing";
import {
  getAlertThresholds,
  type ActiveAlert,
} from "@/config/ai-alerts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GeneratorId =
  | "product-description"
  | "marketplace-description"
  | "seo-description"
  | "advertisement"
  | "hook"
  | "social-media-caption"
  | "title-generator"
  | "unknown";

export type ErrorCategory =
  | "none"
  | "rate_limit"
  | "invalid_input"
  | "unauthorized"
  | "provider_timeout"
  | "provider_error"
  | "internal_error";

export interface ProviderUsageShape {
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
}

export interface AiUsageRecord {
  requestId: string;
  generatorId: GeneratorId;
  modelId: string;
  timestamp: string;
  durationMs: number;
  success: boolean;
  httpStatus: number;
  errorCategory: ErrorCategory;
  rejectedByRateLimit: boolean;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  estimatedCostUsd: number | null;
}

export interface DailyUsageAggregation {
  date: string; // YYYY-MM-DD
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  byGenerator: Record<string, { requests: number; tokens: number }>;
  disclaimer: string;
  activeAlerts: ActiveAlert[];
}

// ---------------------------------------------------------------------------
// In-Memory Aggregation Store (Bounded 30-day fallback)
// ---------------------------------------------------------------------------

interface MemoryDailyBucket {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostMicroUsd: number; // Stored in micro-USD ($1 = 1,000,000) for integer math
  byGenerator: Record<string, { requests: number; tokens: number }>;
}

const memoryStore = new Map<string, MemoryDailyBucket>();
const MAX_MEMORY_DAYS = 30;

function pruneMemoryStore() {
  if (memoryStore.size > MAX_MEMORY_DAYS) {
    const keys = Array.from(memoryStore.keys()).sort();
    while (keys.length > MAX_MEMORY_DAYS) {
      const oldest = keys.shift();
      if (oldest) memoryStore.delete(oldest);
    }
  }
}

// ---------------------------------------------------------------------------
// Upstash Redis Client Loader (Optional)
// ---------------------------------------------------------------------------

let _redisInstance: import("@upstash/redis").Redis | null = null;

async function getRedis(): Promise<import("@upstash/redis").Redis | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  if (_redisInstance) return _redisInstance;

  try {
    const { Redis } = await import("@upstash/redis");
    _redisInstance = new Redis({ url, token });
    return _redisInstance;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core Monitoring Functions
// ---------------------------------------------------------------------------

export interface RecordAiUsageParams {
  generatorId: GeneratorId;
  modelId?: string;
  durationMs: number;
  status: number;
  errorCategory?: ErrorCategory;
  rejectedByRateLimit?: boolean;
  providerUsage?: ProviderUsageShape | null;
}

/**
 * Normalizes provider usage metadata safely without assuming or estimating missing tokens.
 */
export function normalizeProviderUsage(usage?: ProviderUsageShape | null): {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
} {
  if (!usage || typeof usage !== "object") {
    return { promptTokens: null, completionTokens: null, totalTokens: null };
  }

  const prompt =
    typeof usage.prompt_tokens === "number" && !isNaN(usage.prompt_tokens)
      ? Math.max(0, Math.floor(usage.prompt_tokens))
      : null;

  const completion =
    typeof usage.completion_tokens === "number" && !isNaN(usage.completion_tokens)
      ? Math.max(0, Math.floor(usage.completion_tokens))
      : null;

  const total =
    typeof usage.total_tokens === "number" && !isNaN(usage.total_tokens)
      ? Math.max(0, Math.floor(usage.total_tokens))
      : prompt !== null && completion !== null
      ? prompt + completion
      : null;

  return { promptTokens: prompt, completionTokens: completion, totalTokens: total };
}

/**
 * Records an AI operational event:
 * 1. Formats privacy-safe structured log (no user data)
 * 2. Emits structured log to stdout for external log collection
 * 3. Atomically aggregates into Redis daily hash (or in-memory store)
 * 4. Checks warning thresholds
 */
export async function recordAiUsage(
  params: RecordAiUsageParams
): Promise<AiUsageRecord> {
  const modelId = params.modelId ?? DEFAULT_MODEL;
  const durationMs = Math.max(0, Math.round(params.durationMs));
  const success = params.status >= 200 && params.status < 300;
  const rejectedByRateLimit = Boolean(params.rejectedByRateLimit || params.status === 429);

  const errorCategory: ErrorCategory =
    params.errorCategory ??
    (success
      ? "none"
      : rejectedByRateLimit
      ? "rate_limit"
      : params.status === 400
      ? "invalid_input"
      : params.status === 401 || params.status === 403
      ? "unauthorized"
      : params.status === 504
      ? "provider_timeout"
      : params.status >= 500
      ? "provider_error"
      : "internal_error");

  const { promptTokens, completionTokens, totalTokens } =
    normalizeProviderUsage(params.providerUsage);

  const costResult = calculateEstimatedCost(promptTokens, completionTokens, modelId);

  // Generate lightweight random request ID for trace correlation
  const requestId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const timestamp = new Date().toISOString();

  const record: AiUsageRecord = {
    requestId,
    generatorId: params.generatorId,
    modelId,
    timestamp,
    durationMs,
    success,
    httpStatus: params.status,
    errorCategory,
    rejectedByRateLimit,
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCostUsd: costResult.estimatedCostUsd,
  };

  // 1. Structured log output (Strictly zero user prompts or output text)
  if (process.env.NODE_ENV !== "test") {
    console.info(`[AI_USAGE] ${JSON.stringify(record)}`);
  }

  // 2. Latency alert evaluation
  const thresholds = getAlertThresholds();
  if (durationMs > thresholds.latencyWarningMs) {
    console.warn(
      `[AI_ALERT] High latency detected for generator=${params.generatorId} duration=${durationMs}ms threshold=${thresholds.latencyWarningMs}ms`
    );
  }

  // 3. Aggregate into daily rollup
  await aggregateDaily(record);

  return record;
}

/**
 * Aggregates record into daily counters with automatic 30-day TTL.
 */
async function aggregateDaily(record: AiUsageRecord): Promise<void> {
  const dateStr = record.timestamp.split("T")[0]; // YYYY-MM-DD
  const redis = await getRedis();

  const pTokens = record.promptTokens ?? 0;
  const cTokens = record.completionTokens ?? 0;
  const tTokens = record.totalTokens ?? 0;
  const microCost = record.estimatedCostUsd
    ? Math.round(record.estimatedCostUsd * 1_000_000)
    : 0;

  if (redis) {
    try {
      const key = `ai:usage:daily:${dateStr}`;
      const pipeline = redis.pipeline();

      pipeline.hincrby(key, "total_requests", 1);
      if (record.success) {
        pipeline.hincrby(key, "successful_requests", 1);
      } else {
        pipeline.hincrby(key, "failed_requests", 1);
      }

      if (record.rejectedByRateLimit) {
        pipeline.hincrby(key, "rate_limited_requests", 1);
      }

      if (pTokens > 0) pipeline.hincrby(key, "prompt_tokens", pTokens);
      if (cTokens > 0) pipeline.hincrby(key, "completion_tokens", cTokens);
      if (tTokens > 0) pipeline.hincrby(key, "total_tokens", tTokens);
      if (microCost > 0) pipeline.hincrby(key, "cost_micro_usd", microCost);

      pipeline.hincrby(key, `gen:${record.generatorId}:requests`, 1);
      if (tTokens > 0) {
        pipeline.hincrby(key, `gen:${record.generatorId}:tokens`, tTokens);
      }

      // 30 days retention TTL (30 * 86400 = 2,592,000 seconds)
      pipeline.expire(key, 30 * 86400);

      await pipeline.exec();
      return;
    } catch (err) {
      console.error(
        "[ai-monitor] Redis aggregation failed, falling back to in-memory:",
        err instanceof Error ? err.message : "unknown"
      );
    }
  }

  // Fallback: In-memory store
  let bucket = memoryStore.get(dateStr);
  if (!bucket) {
    bucket = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostMicroUsd: 0,
      byGenerator: {},
    };
    memoryStore.set(dateStr, bucket);
    pruneMemoryStore();
  }

  bucket.totalRequests += 1;
  if (record.success) bucket.successfulRequests += 1;
  else bucket.failedRequests += 1;

  if (record.rejectedByRateLimit) bucket.rateLimitedRequests += 1;

  bucket.promptTokens += pTokens;
  bucket.completionTokens += cTokens;
  bucket.totalTokens += tTokens;
  bucket.estimatedCostMicroUsd += microCost;

  if (!bucket.byGenerator[record.generatorId]) {
    bucket.byGenerator[record.generatorId] = { requests: 0, tokens: 0 };
  }
  bucket.byGenerator[record.generatorId].requests += 1;
  bucket.byGenerator[record.generatorId].tokens += tTokens;
}

/**
 * Returns daily usage metrics and alerts for a given date (defaults to today).
 */
export async function getDailyUsageSummary(
  targetDate?: string
): Promise<DailyUsageAggregation> {
  const dateStr = targetDate ?? new Date().toISOString().split("T")[0];
  const redis = await getRedis();

  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  let rateLimitedRequests = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;
  let estimatedCostUsd = 0;
  const byGenerator: Record<string, { requests: number; tokens: number }> = {};

  if (redis) {
    try {
      const key = `ai:usage:daily:${dateStr}`;
      const data = await redis.hgetall<Record<string, string | number>>(key);

      if (data && Object.keys(data).length > 0) {
        totalRequests = Number(data.total_requests || 0);
        successfulRequests = Number(data.successful_requests || 0);
        failedRequests = Number(data.failed_requests || 0);
        rateLimitedRequests = Number(data.rate_limited_requests || 0);
        promptTokens = Number(data.prompt_tokens || 0);
        completionTokens = Number(data.completion_tokens || 0);
        totalTokens = Number(data.total_tokens || 0);
        estimatedCostUsd = Number(
          ((Number(data.cost_micro_usd || 0)) / 1_000_000).toFixed(6)
        );

        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith("gen:") && k.endsWith(":requests")) {
            const genName = k.replace("gen:", "").replace(":requests", "");
            if (!byGenerator[genName]) {
              byGenerator[genName] = { requests: 0, tokens: 0 };
            }
            byGenerator[genName].requests = Number(v);
          } else if (k.startsWith("gen:") && k.endsWith(":tokens")) {
            const genName = k.replace("gen:", "").replace(":tokens", "");
            if (!byGenerator[genName]) {
              byGenerator[genName] = { requests: 0, tokens: 0 };
            }
            byGenerator[genName].tokens = Number(v);
          }
        }
      }
    } catch (err) {
      console.error("[ai-monitor] Error reading Redis usage:", err);
    }
  } else {
    const bucket = memoryStore.get(dateStr);
    if (bucket) {
      totalRequests = bucket.totalRequests;
      successfulRequests = bucket.successfulRequests;
      failedRequests = bucket.failedRequests;
      rateLimitedRequests = bucket.rateLimitedRequests;
      promptTokens = bucket.promptTokens;
      completionTokens = bucket.completionTokens;
      totalTokens = bucket.totalTokens;
      estimatedCostUsd = Number(
        (bucket.estimatedCostMicroUsd / 1_000_000).toFixed(6)
      );
      for (const [k, v] of Object.entries(bucket.byGenerator)) {
        byGenerator[k] = { ...v };
      }
    }
  }

  // Evaluate operational alerts
  const thresholds = getAlertThresholds();
  const alerts: ActiveAlert[] = [];

  if (totalRequests >= thresholds.maxDailyRequests) {
    alerts.push({
      level: "warning",
      type: "HIGH_VOLUME",
      message: `Daily request volume (${totalRequests}) reached warning threshold (${thresholds.maxDailyRequests})`,
      metric: "total_requests",
      value: totalRequests,
      threshold: thresholds.maxDailyRequests,
      timestamp: new Date().toISOString(),
    });
  }

  if (totalRequests >= thresholds.minRequestsForFailureAlert) {
    const failureRate = (failedRequests / totalRequests) * 100;
    if (failureRate >= thresholds.failureRatePercentThreshold) {
      alerts.push({
        level: "critical",
        type: "HIGH_FAILURE_RATE",
        message: `Failure rate (${failureRate.toFixed(1)}%) exceeded threshold (${thresholds.failureRatePercentThreshold}%)`,
        metric: "failure_rate_percent",
        value: Number(failureRate.toFixed(1)),
        threshold: thresholds.failureRatePercentThreshold,
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (estimatedCostUsd >= thresholds.dailyCostThresholdUsd) {
    alerts.push({
      level: "warning",
      type: "COST_THRESHOLD_EXCEEDED",
      message: `Daily estimated cost ($${estimatedCostUsd}) reached threshold ($${thresholds.dailyCostThresholdUsd})`,
      metric: "estimated_cost_usd",
      value: estimatedCostUsd,
      threshold: thresholds.dailyCostThresholdUsd,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    date: dateStr,
    totalRequests,
    successfulRequests,
    failedRequests,
    rateLimitedRequests,
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCostUsd,
    byGenerator,
    disclaimer: PRICING_DISCLAIMER,
    activeAlerts: alerts,
  };
}

/**
 * Infers a standardized GeneratorId from a request URL pathname.
 */
export function inferGeneratorId(pathname: string): GeneratorId {
  if (pathname.includes("product-description")) return "product-description";
  if (pathname.includes("marketplace-description")) return "marketplace-description";
  if (pathname.includes("seo-description")) return "seo-description";
  if (pathname.includes("advertisement")) return "advertisement";
  if (pathname.includes("hook")) return "hook";
  if (pathname.includes("social-media-caption")) return "social-media-caption";
  if (pathname.includes("title-generator")) return "title-generator";
  return "unknown";
}

export interface CallGroqAiResult {
  data: Record<string, unknown> | null;
  resultText?: string;
  errorResponse?: NextResponse;
}

/**
 * Reusable utility to invoke Groq API while measuring latency, extracting
 * token usage, handling errors safely, and recording privacy-safe monitoring metrics.
 */
export async function callGroqAi(options: {
  generatorId: GeneratorId;
  apiKey: string;
  payload: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<CallGroqAiResult> {
  const startTime = Date.now();
  const modelId = (options.payload.model as string) || DEFAULT_MODEL;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(options.timeoutMs ?? 25000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify(options.payload),
    });

    const durationMs = Date.now() - startTime;

    if (!groqRes.ok) {
      await recordAiUsage({
        generatorId: options.generatorId,
        modelId,
        durationMs,
        status: 502,
        errorCategory: "provider_error",
      });
      return {
        data: null,
        errorResponse: NextResponse.json(
          { error: "AI sedang bermasalah, coba lagi sebentar lagi." },
          { status: 502 }
        ),
      };
    }

    const data = (await groqRes.json()) as Record<string, unknown>;
    const choices = data?.choices as Array<{ message?: { content?: string } }> | undefined;
    const resultText = choices?.[0]?.message?.content;

    if (!resultText) {
      await recordAiUsage({
        generatorId: options.generatorId,
        modelId,
        durationMs,
        status: 502,
        errorCategory: "provider_error",
        providerUsage: data?.usage as ProviderUsageShape,
      });
      return {
        data,
        errorResponse: NextResponse.json(
          { error: "AI tidak mengembalikan hasil." },
          { status: 502 }
        ),
      };
    }

    await recordAiUsage({
      generatorId: options.generatorId,
      modelId,
      durationMs,
      status: 200,
      providerUsage: data?.usage as ProviderUsageShape,
    });

    return { data, resultText: resultText.trim() };
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const isTimeout =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");

    if (isTimeout) {
      await recordAiUsage({
        generatorId: options.generatorId,
        modelId,
        durationMs,
        status: 504,
        errorCategory: "provider_timeout",
      });
      return {
        data: null,
        errorResponse: NextResponse.json(
          {
            error:
              "Waktu tunggu AI habis (timeout). Kuota Anda tidak terpotong, silakan coba kembali.",
          },
          { status: 504 }
        ),
      };
    }

    await recordAiUsage({
      generatorId: options.generatorId,
      modelId,
      durationMs,
      status: 500,
      errorCategory: "internal_error",
    });
    return {
      data: null,
      errorResponse: NextResponse.json(
        { error: "Terjadi kesalahan saat menghubungi AI." },
        { status: 500 }
      ),
    };
  }
}

/**
 * Helper for testing: clears the in-memory bucket store.
 */
export function _clearMemoryStoreForTest(): void {
  memoryStore.clear();
}
