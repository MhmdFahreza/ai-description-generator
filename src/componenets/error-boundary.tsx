"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback UI to render when an error occurs */
  fallback?: ReactNode;
  /** Optional callback invoked when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Client-side Error Boundary for catching and recovering from rendering errors.
 *
 * Provides a polished fallback UI with a retry mechanism. Does NOT log
 * user-facing text, prompts, or AI-generated content — only the controlled
 * error name and message.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Privacy-safe: only log error name and component stack.
    // Never log user prompts, AI outputs, or form contents.
    console.error(
      `[ErrorBoundary] ${error.name}: ${error.message}`,
      errorInfo.componentStack
    );
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-5 rounded-2xl border border-white/10 bg-[#171A21] p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <svg
            className="h-7 w-7 text-red-400"
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

        <div>
          <h3 className="font-serif text-lg font-semibold text-[#F5F3ED]">
            Something went wrong
          </h3>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[#9A9CA5]">
            An unexpected error occurred while rendering this section. Your data
            is safe — try again or refresh the page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-xl bg-[#F2B441] px-5 py-2.5 text-xs font-semibold text-[#0F1115] transition-all hover:bg-[#e0a436] active:scale-[0.98]"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-medium text-[#F5F3ED] transition-all hover:bg-white/10 hover:border-white/30 active:scale-[0.98]"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}
