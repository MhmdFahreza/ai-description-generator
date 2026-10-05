"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { IconSparkle, IconX } from "@/componenets/icons";

interface RateLimitContextType {
  remainingDaily: number | null;
  maxDaily: number;
  remainingMinute: number | null;
  maxMinute: number;
  updateQuota: (daily: number, minute: number) => void;
  showLimitModal: () => void;
}

const RateLimitContext = createContext<RateLimitContextType>({
  remainingDaily: null,
  maxDaily: 10,
  remainingMinute: null,
  maxMinute: 5,
  updateQuota: () => {},
  showLimitModal: () => {},
});

export const useRateLimit = () => useContext(RateLimitContext);

export function RateLimitProvider({ children }: { children: React.ReactNode }) {
  const [remainingDaily, setRemainingDaily] = useState<number | null>(null);
  const [remainingMinute, setRemainingMinute] = useState<number | null>(null);
  const [maxDaily, setMaxDaily] = useState(10);
  const [maxMinute, setMaxMinute] = useState(5);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Fetch initial quota
    fetch("/api/generate/quota")
      .then((res) => res.json())
      .then((data) => {
        if (data.remainingDaily !== undefined) {
          setRemainingDaily(data.remainingDaily);
          setMaxDaily(data.maxDaily);
          setRemainingMinute(data.remainingMinute);
          setMaxMinute(data.maxMinute);
        }
      })
      .catch((err) => console.error("Failed to fetch quota", err));

    // Listen for global custom events from generators
    const handleQuotaUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.remainingDaily === "number") {
        setRemainingDaily(detail.remainingDaily);
      }
      if (detail && typeof detail.remainingMinute === "number") {
        setRemainingMinute(detail.remainingMinute);
      }
    };

    const handleLimitExceeded = () => {
      setRemainingDaily(0);
      setIsModalOpen(true);
    };

    window.addEventListener("rateLimitUpdated", handleQuotaUpdate);
    window.addEventListener("rateLimitExceeded", handleLimitExceeded);

    return () => {
      window.removeEventListener("rateLimitUpdated", handleQuotaUpdate);
      window.removeEventListener("rateLimitExceeded", handleLimitExceeded);
    };
  }, []);

  const updateQuota = (daily: number, minute: number) => {
    setRemainingDaily(daily);
    setRemainingMinute(minute);
  };

  const showLimitModal = () => {
    setIsModalOpen(true);
  };

  return (
    <RateLimitContext.Provider
      value={{
        remainingDaily,
        maxDaily,
        remainingMinute,
        maxMinute,
        updateQuota,
        showLimitModal,
      }}
    >
      {children}
      
      {/* Limit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#171A21] p-6 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-[#9A9CA5] transition-colors hover:text-[#F5F3ED]"
            >
              <IconX className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8623D]/10">
                <IconSparkle className="h-7 w-7 text-[#E8623D]" />
              </div>
              <h3 className="mb-2 font-serif text-xl text-[#F5F3ED]">
                Daily Limit Reached
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-[#9A9CA5]">
                You have reached your daily limit of {maxDaily} generations. Please come back tomorrow for more free generations!
              </p>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full rounded-lg bg-[#E8623D] py-3 text-sm font-medium text-[#0F1115] transition-opacity hover:opacity-90"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </RateLimitContext.Provider>
  );
}
