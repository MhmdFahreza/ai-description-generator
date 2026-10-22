"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  trackGeneratorOpen,
  trackGenerateAttempt,
  trackGenerateSuccess,
  trackGenerateError,
  trackCopyResult,
  trackOutputLanguageSelected,
  type AnalyticsErrorCategory,
} from "@/lib/analytics";

/**
 * Reusable hook to track generator events with strict privacy guarantees:
 * - Automatically tracks `generator_open` once on mount (deduplicated).
 * - Exposes safe tracking callbacks that accept only metadata (NO prompts, NO AI outputs).
 */
export function useGeneratorAnalytics(generatorId: string) {
  const hasTrackedOpen = useRef(false);

  useEffect(() => {
    if (!hasTrackedOpen.current) {
      hasTrackedOpen.current = true;
      trackGeneratorOpen(generatorId);
    }
  }, [generatorId]);

  const onAttempt = useCallback(
    (outputLanguage: string) => {
      trackGenerateAttempt(generatorId, outputLanguage);
    },
    [generatorId]
  );

  const onSuccess = useCallback(
    (outputLanguage: string, durationMs?: number) => {
      trackGenerateSuccess(generatorId, outputLanguage, durationMs);
    },
    [generatorId]
  );

  const onError = useCallback(
    (errorCategory: AnalyticsErrorCategory, httpStatus?: number) => {
      trackGenerateError(generatorId, errorCategory, httpStatus);
    },
    [generatorId]
  );

  const onCopy = useCallback(() => {
    trackCopyResult(generatorId);
  }, [generatorId]);

  const onLanguageSelect = useCallback(
    (outputLanguage: string) => {
      trackOutputLanguageSelected(generatorId, outputLanguage);
    },
    [generatorId]
  );

  return {
    onAttempt,
    onSuccess,
    onError,
    onCopy,
    onLanguageSelect,
  };
}
