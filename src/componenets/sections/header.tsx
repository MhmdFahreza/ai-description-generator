"use client";

import { useRateLimit } from "../rate-limit-provider";

export default function Header() {
  const { remainingDaily, maxDaily } = useRateLimit();

  const percentage = remainingDaily !== null && maxDaily > 0
    ? Math.max(0, Math.min(100, (remainingDaily / maxDaily) * 100))
    : 0;

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0F1115]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F2B441] font-serif text-lg italic text-[#0F1115]">
            Ai
          </div>
          <div className="leading-tight">
            <p className="font-serif text-lg tracking-tight text-[#F5F3ED]">
              AI Description Generator
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#9A9CA5]">
              Content Writing Toolkit
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {remainingDaily !== null && (
            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-24 h-1.5 bg-[#0F1115] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#4FB6A8] to-[#E8623D] transition-all duration-500 ease-out" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#9A9CA5]">
                {remainingDaily} / {maxDaily} left
              </span>
            </div>
          )}
          <span className="hidden font-mono text-xs uppercase tracking-widest text-[#9A9CA5] sm:block">
            7 Generators · Ready to Use
          </span>
        </div>
      </div>
    </header>
  );
}