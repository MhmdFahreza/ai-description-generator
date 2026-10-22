"use client";

import { useEffect } from "react";

/**
 * Next.js App Router error page — catches server-component and
 * route-segment errors. Provides a polished recovery UI consistent
 * with the application design.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Privacy-safe: only log error name, never user data
    console.error(`[GlobalError] ${error.name}: ${error.message}`);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F1115] px-6 text-center font-sans text-[#F5F3ED]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <svg
          className="h-8 w-8 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      <h1 className="mt-6 font-serif text-2xl font-semibold">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#9A9CA5]">
        An unexpected error occurred. Your data is safe — you can try again or
        go back to the home page.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-[#F2B441] px-6 py-3 text-sm font-semibold text-[#0F1115] transition-all hover:bg-[#e0a436] active:scale-[0.98] shadow-lg shadow-[#F2B441]/15"
        >
          Try Again
        </button>
        <a
          href="/"
          className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-[#F5F3ED] transition-all hover:bg-white/10 hover:border-white/30 active:scale-[0.98]"
        >
          Back to Home
        </a>
      </div>

      {error.digest && (
        <p className="mt-8 font-mono text-[10px] text-[#5C5F68]">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
