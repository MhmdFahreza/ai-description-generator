"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { IconSparkle, IconClock, IconX } from "@/componenets/icons";

type LimitReason = "minute" | "daily";

interface RateLimitContextType {
  remainingDaily: number | null;
  maxDaily: number;
  remainingMinute: number | null;
  maxMinute: number;
  cooldownSeconds: number;
  isCooldown: boolean;
  resetAt: number | null;
  updateQuota: (daily: number, minute: number, resetAt?: number | null) => void;
  showLimitModal: (
    reason?: LimitReason,
    retryAfterSeconds?: number,
    resetAt?: number | null
  ) => void;
}

const RateLimitContext = createContext<RateLimitContextType>({
  remainingDaily: null,
  maxDaily: 10,
  remainingMinute: null,
  maxMinute: 5,
  cooldownSeconds: 0,
  isCooldown: false,
  resetAt: null,
  updateQuota: () => {},
  showLimitModal: () => {},
});

export const useRateLimit = () => useContext(RateLimitContext);

export function RateLimitProvider({ children }: { children: React.ReactNode }) {
  const [remainingDaily, setRemainingDaily] = useState<number | null>(null);
  const [remainingMinute, setRemainingMinute] = useState<number | null>(null);
  const [maxDaily, setMaxDaily] = useState(10);
  const [maxMinute, setMaxMinute] = useState(5);
  const [resetAt, setResetAt] = useState<number | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalReason, setModalReason] = useState<LimitReason>("daily");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Active cooldown countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          // Cooldown selesai: pulihkan remainingMinute jika belum tahu
          setRemainingMinute((rm) => (rm === 0 ? 5 : rm));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  useEffect(() => {
    // Fetch initial quota dari server (selalu ambil yang terbaru)
    fetch("/api/generate/quota", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.remainingDaily !== undefined) {
          setRemainingDaily(data.remainingDaily);
          setMaxDaily(data.maxDaily ?? 10);
          setRemainingMinute(data.remainingMinute ?? 5);
          setMaxMinute(data.maxMinute ?? 5);
          if (data.resetAt) {
            setResetAt(data.resetAt);
          }
          if (data.reason === "minute" && data.retryAfterSeconds > 0) {
            setCooldownSeconds(data.retryAfterSeconds);
          }
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
      if (detail && typeof detail.resetAt === "number") {
        setResetAt(detail.resetAt);
      }
    };

    const handleLimitExceeded = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        reason?: LimitReason;
        retryAfterSeconds?: number;
        resetAt?: number;
      } | undefined;

      const reason = detail?.reason === "daily" ? "daily" : "minute";
      const retryAfter = detail?.retryAfterSeconds || 60;

      if (reason === "daily") {
        setRemainingDaily(0);
      } else {
        setRemainingMinute(0);
        setCooldownSeconds(retryAfter);
      }

      if (detail?.resetAt) {
        setResetAt(detail.resetAt);
      }

      setModalReason(reason);
      setIsModalOpen(true);
    };

    window.addEventListener("rateLimitUpdated", handleQuotaUpdate);
    window.addEventListener("rateLimitExceeded", handleLimitExceeded);

    return () => {
      window.removeEventListener("rateLimitUpdated", handleQuotaUpdate);
      window.removeEventListener("rateLimitExceeded", handleLimitExceeded);
    };
  }, []);

  const updateQuota = (
    daily: number,
    minute: number,
    newResetAt?: number | null
  ) => {
    setRemainingDaily(daily);
    setRemainingMinute(minute);
    if (newResetAt !== undefined) {
      setResetAt(newResetAt);
    }
  };

  const showLimitModal = (
    reason: LimitReason = "daily",
    retryAfterSeconds = 60,
    newResetAt?: number | null
  ) => {
    setModalReason(reason);
    if (reason === "minute") {
      setCooldownSeconds(retryAfterSeconds);
    }
    if (newResetAt) {
      setResetAt(newResetAt);
    }
    setIsModalOpen(true);
  };

  const isCooldown = cooldownSeconds > 0;

  // Format waktu reset yang mudah dipahami
  const formattedResetTime = resetAt
    ? new Date(resetAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <RateLimitContext.Provider
      value={{
        remainingDaily,
        maxDaily,
        remainingMinute,
        maxMinute,
        cooldownSeconds,
        isCooldown,
        resetAt,
        updateQuota,
        showLimitModal,
      }}
    >
      {children}

      {/* Limit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#171A21] p-6 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-[#9A9CA5] transition-colors hover:text-[#F5F3ED]"
              aria-label="Close"
            >
              <IconX className="h-5 w-5" />
            </button>

            {modalReason === "minute" ? (
              /* MINUTE LIMIT WARNING (COOLDOWN) */
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#F4A261]/25 bg-[#F4A261]/10 text-[#F4A261] shadow-[0_0_25px_rgba(244,162,97,0.15)]">
                  <IconClock className="h-8 w-8 animate-pulse" />
                </div>

                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-[#F4A261]/30 bg-[#F4A261]/10 px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider text-[#F4A261]">
                  <span>Cooldown Active</span>
                </div>

                <h3 className="mb-2 mt-2 font-serif text-xl text-[#F5F3ED]">
                  Too Many Requests
                </h3>

                <p className="mb-5 text-sm leading-relaxed text-[#9A9CA5]">
                  To protect AI server stability, the limit is{" "}
                  <strong className="text-[#F5F3ED] font-semibold">
                    {maxMinute} requests per minute
                  </strong>
                  . Please wait for the cooldown to finish.
                </p>

                {/* Box Cooldown Timer */}
                <div className="mb-6 flex w-full flex-col items-center justify-center rounded-xl border border-white/10 bg-black/30 p-4">
                  <span className="text-xs uppercase tracking-widest text-[#9A9CA5] font-mono">
                    You can generate again in
                  </span>
                  <div className="mt-1 flex items-baseline gap-1 text-[#F4A261]">
                    <span className="font-mono text-3xl font-bold tracking-tight">
                      {cooldownSeconds > 0 ? cooldownSeconds : 0}
                    </span>
                    <span className="text-sm font-mono text-[#9A9CA5]">
                      seconds
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full rounded-lg border border-[#F4A261]/30 bg-[#F4A261] py-3 text-sm font-semibold text-[#0F1115] transition-all hover:bg-[#e09152] hover:shadow-[0_0_20px_rgba(244,162,97,0.3)] active:scale-[0.99]"
                >
                  {cooldownSeconds > 0 ? "Please Wait" : "Ready to Generate"}
                </button>
              </div>
            ) : (
              /* DAILY LIMIT MODAL */
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8623D]/10">
                  <IconSparkle className="h-7 w-7 text-[#E8623D]" />
                </div>
                <h3 className="mb-2 font-serif text-xl text-[#F5F3ED]">
                  Daily Limit Reached
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-[#9A9CA5]">
                  You have reached your daily limit of {maxDaily} generations
                  across all tools.
                </p>

                {formattedResetTime && (
                  <div className="mb-6 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-[#9A9CA5]">
                    <span className="block font-mono uppercase tracking-wider text-[10px] text-[#E8623D]">
                      Rolling 24-Hour Reset
                    </span>
                    <span className="mt-1 block text-sm font-medium text-[#F5F3ED]">
                      Quota begins resetting around{" "}
                      <span className="text-[#E8623D]">{formattedResetTime}</span>
                    </span>
                  </div>
                )}

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full rounded-lg bg-[#E8623D] py-3 text-sm font-medium text-[#0F1115] transition-opacity hover:opacity-90"
                >
                  Understood
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </RateLimitContext.Provider>
  );
}
