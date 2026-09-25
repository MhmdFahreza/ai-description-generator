"use client";

import React, { useEffect, useState } from "react";
import { getSavedPreferences, applyPreferences } from "@/lib/cookies";

export default function CookieBanner() {
  const [hasDecided, setHasDecided] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = getSavedPreferences();
    setHasDecided(Boolean(saved));
  }, []);

  const handleAcceptAll = () => {
    applyPreferences({
      analytics: true,
      advertising: true,
    });
    setHasDecided(true);
  };

  const handleRejectAll = () => {
    applyPreferences({
      analytics: false,
      advertising: false,
    });
    setHasDecided(true);
  };

  if (hasDecided === null || hasDecided) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom duration-300 pointer-events-none">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-[#14161C]/95 p-5 sm:p-6 shadow-2xl backdrop-blur-xl text-[#F5F3ED] pointer-events-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F2B441]/10 text-2xl border border-[#F2B441]/20">
              🍪
            </div>
            <div>
              <h4 className="font-serif text-base font-semibold text-[#F5F3ED]">
                Cookies
              </h4>
              <p className="mt-1 text-xs text-[#9A9CA5] leading-relaxed max-w-2xl">
                We use cookies to improve your experience while using this generator. Necessary cookies are required for the system to function properly, while you can choose whether to allow analytics and advertising cookies through the options below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
            <button
              type="button"
              onClick={handleRejectAll}
              className="flex-1 md:flex-none rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-medium text-[#F5F3ED] hover:bg-white/10 hover:border-white/30 transition-all active:scale-[0.98]"
            >
              Reject Cookies
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex-1 md:flex-none rounded-xl bg-[#F2B441] px-5 py-2.5 text-xs font-semibold text-[#0F1115] hover:bg-[#e0a436] transition-all shadow-lg shadow-[#F2B441]/15 active:scale-[0.98]"
            >
              Accept Cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
