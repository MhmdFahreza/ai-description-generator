"use client";

import React from "react";
import { RateLimitProvider } from "./rate-limit-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RateLimitProvider>
      {children}
    </RateLimitProvider>
  );
}