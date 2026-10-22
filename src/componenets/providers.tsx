"use client";

import React from "react";
import { RateLimitProvider } from "./rate-limit-provider";
import { ErrorBoundary } from "./error-boundary";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <RateLimitProvider>
        {children}
      </RateLimitProvider>
    </ErrorBoundary>
  );
}