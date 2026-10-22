/**
 * ai-alerts.ts — Operational warning and alert thresholds for AI service monitoring.
 */

export interface AlertThresholds {
  /** Maximum number of requests expected per calendar day before warning */
  maxDailyRequests: number;
  /** Warning threshold for request failure rate (0 to 100 percentage) */
  failureRatePercentThreshold: number;
  /** Latency warning threshold in milliseconds */
  latencyWarningMs: number;
  /** Maximum daily estimated spend threshold in USD before alerting */
  dailyCostThresholdUsd: number;
  /** Minimum requests required before failureRatePercent check evaluates */
  minRequestsForFailureAlert: number;
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  maxDailyRequests: 1000,
  failureRatePercentThreshold: 20, // Alert if > 20% requests fail
  latencyWarningMs: 15_000, // Alert if a request takes > 15 seconds
  dailyCostThresholdUsd: 15.0, // Alert if estimated spend exceeds $15/day
  minRequestsForFailureAlert: 10,
};

export function getAlertThresholds(): AlertThresholds {
  const envMaxDaily = process.env.ALERT_MAX_DAILY_REQUESTS;
  const envFailRate = process.env.ALERT_FAILURE_RATE_PERCENT;
  const envLatency = process.env.ALERT_LATENCY_WARNING_MS;
  const envCost = process.env.ALERT_DAILY_COST_USD;

  return {
    maxDailyRequests:
      envMaxDaily && !isNaN(Number(envMaxDaily))
        ? Number(envMaxDaily)
        : DEFAULT_ALERT_THRESHOLDS.maxDailyRequests,
    failureRatePercentThreshold:
      envFailRate && !isNaN(Number(envFailRate))
        ? Number(envFailRate)
        : DEFAULT_ALERT_THRESHOLDS.failureRatePercentThreshold,
    latencyWarningMs:
      envLatency && !isNaN(Number(envLatency))
        ? Number(envLatency)
        : DEFAULT_ALERT_THRESHOLDS.latencyWarningMs,
    dailyCostThresholdUsd:
      envCost && !isNaN(Number(envCost))
        ? Number(envCost)
        : DEFAULT_ALERT_THRESHOLDS.dailyCostThresholdUsd,
    minRequestsForFailureAlert: DEFAULT_ALERT_THRESHOLDS.minRequestsForFailureAlert,
  };
}

export interface ActiveAlert {
  level: "warning" | "critical";
  type:
    | "HIGH_VOLUME"
    | "HIGH_FAILURE_RATE"
    | "HIGH_LATENCY"
    | "COST_THRESHOLD_EXCEEDED";
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: string;
}
