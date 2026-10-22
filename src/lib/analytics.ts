/**
 * analytics.ts — Privacy-conscious Google Analytics 4 (GA4) integration.
 *
 * PRIVACY GUARANTEES:
 * - NO user prompts, instructions, ideas, or brief details are ever sent to GA4.
 * - NO generated text or AI output is ever sent to GA4.
 * - NO image data, file names, or media data are ever sent to GA4.
 * - NO API keys, cookies, IP addresses, or sensitive user identifiers are sent.
 * - Only controlled, coarse event names and sanitized parameters are permitted.
 * - Strictly respects user consent: if analytics consent is not granted,
 *   all tracking calls are silent no-ops and GA cookies are deleted.
 */

import { getSavedPreferences } from "./cookies";

export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsErrorCategory =
  | "validation_error"
  | "rate_limited"
  | "provider_error"
  | "timeout"
  | "network_error"
  | "unknown";

// Disallowed param keys that must NEVER be forwarded to GA4
const FORBIDDEN_KEYS = new Set([
  "prompt",
  "idea",
  "text",
  "input",
  "output",
  "result",
  "image",
  "filename",
  "file",
  "cookie",
  "ip",
  "token",
  "key",
  "secret",
  "email",
  "user_id",
  "visitor_id",
]);

/**
 * Checks if the user has explicitly consented to analytics cookies.
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  const prefs = getSavedPreferences();
  return prefs?.analytics === true;
}

/**
 * Sanitizes an event parameter object, removing any forbidden keys
 * and truncating string lengths to prevent accidental data leaks.
 */
function sanitizeEventParams(
  params?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!params) return undefined;

  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_KEYS.has(lowerKey)) {
      continue;
    }

    if (typeof value === "string") {
      // Coarse string sanitization: max 64 chars, no newlines
      clean[key] = value.replace(/[\r\n]+/g, " ").slice(0, 64);
    } else if (
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      clean[key] = value;
    }
  }

  return clean;
}

/**
 * Low-level event dispatcher to GA4 with consent check & sanitization.
 */
export function trackEvent(name: string, params?: Record<string, unknown>): boolean {
  const gaId = GA_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (typeof window === "undefined" || !window.gtag || !gaId) {
    return false;
  }

  if (!hasAnalyticsConsent()) {
    return false;
  }

  const cleanParams = sanitizeEventParams(params);
  window.gtag("event", name, cleanParams);
  return true;
}

// ---------------------------------------------------------------------------
// Standardized Event Tracking Functions
// ---------------------------------------------------------------------------

/**
 * Tracks when a generator tool page is opened.
 */
export function trackGeneratorOpen(generatorId: string): boolean {
  return trackEvent("generator_open", { generator_id: generatorId });
}

/**
 * Tracks when a user initiates a generation request.
 */
export function trackGenerateAttempt(
  generatorId: string,
  outputLanguage: string
): boolean {
  return trackEvent("generate_attempt", {
    generator_id: generatorId,
    output_language: outputLanguage,
  });
}

/**
 * Tracks a successful generation event.
 */
export function trackGenerateSuccess(
  generatorId: string,
  outputLanguage: string,
  durationMs?: number
): boolean {
  return trackEvent("generate_success", {
    generator_id: generatorId,
    output_language: outputLanguage,
    duration_ms: durationMs ? Math.round(durationMs) : undefined,
  });
}

/**
 * Tracks a generation error with a controlled category.
 */
export function trackGenerateError(
  generatorId: string,
  errorCategory: AnalyticsErrorCategory,
  httpStatus?: number
): boolean {
  return trackEvent("generate_error", {
    generator_id: generatorId,
    error_category: errorCategory,
    http_status: httpStatus,
  });
}

/**
 * Tracks when the user copies generated content to clipboard.
 * (Does NOT send the copied content).
 */
export function trackCopyResult(generatorId: string): boolean {
  return trackEvent("copy_result", { generator_id: generatorId });
}

/**
 * Tracks when the user chooses an output language.
 */
export function trackOutputLanguageSelected(
  generatorId: string,
  outputLanguage: string
): boolean {
  return trackEvent("output_language_selected", {
    generator_id: generatorId,
    output_language: outputLanguage,
  });
}

/**
 * Tracks when a user's quota or burst rate limit is exhausted.
 */
export function trackQuotaExhausted(
  reason: "daily" | "minute",
  generatorId?: string
): boolean {
  return trackEvent("quota_exhausted", {
    reason,
    generator_id: generatorId || "unknown",
  });
}

/**
 * Tracks a client-side page view in Next.js App Router.
 */
export function trackPageView(path: string): boolean {
  return trackEvent("page_view", {
    page_path: path,
  });
}

// ---------------------------------------------------------------------------
// Consent & Cookie Control
// ---------------------------------------------------------------------------

/**
 * Dynamically disables/enables GA4 tracking without a page reload.
 */
export function setGADisabled(disabled: boolean) {
  const gaId = GA_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (typeof window === "undefined" || !gaId) return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = disabled;
}

/**
 * Deletes all Google Analytics cookies (_ga, _ga_*, _gid, etc.) from the browser.
 */
export function deleteGACookies() {
  if (typeof document === "undefined") return;

  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter(
      (n) =>
        n === "_ga" ||
        n === "_gid" ||
        n.startsWith("_ga_") ||
        n.startsWith("_gat")
    );

  const host = window.location.hostname;
  const parts = host.split(".");
  const domains = new Set<string>(["", `; domain=${host}`, `; domain=.${host}`]);
  if (parts.length >= 2) domains.add(`; domain=.${parts.slice(-2).join(".")}`);
  if (parts.length >= 3) domains.add(`; domain=.${parts.slice(-3).join(".")}`);

  names.forEach((name) => {
    domains.forEach((d) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${d}`;
    });
  });
}