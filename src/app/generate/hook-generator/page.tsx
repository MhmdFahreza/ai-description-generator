// src/app/generate/hook-generator/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/componenets/sections/header";
import {
  IconArrow,
  IconSparkle,
  IconCopy,
  IconCheck,
  IconLoader,
  IconImage,
} from "@/componenets/icons";
import { hookStyleOptions, type HookStyle } from "@/constants/hook-styles";
import { hookPlatformOptions, type HookPlatform } from "@/constants/hook-platforms";
import { generateHook } from "@/lib/generators/hook-generator";

const CORAL = "#E8623D";

// Placeholder header icon — swap for a real icon (e.g. IconZap / IconHook)
// from your icon set if you have one.
function IconHook({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 3v10a4 4 0 0 0 8 0v-1" />
      <circle cx="8" cy="3" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function HookGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");

  const [platform, setPlatform] = useState<HookPlatform>("general");
  const [isPlatformOpen, setIsPlatformOpen] = useState(false);
  const platformRef = useRef<HTMLDivElement>(null);

  const [style, setStyle] = useState<HookStyle | null>(null);

  const [hooks, setHooks] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (platformRef.current && !platformRef.current.contains(e.target as Node)) {
        setIsPlatformOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsPlatformOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const canGenerate =
    topic.trim().length > 0 &&
    description.trim().length > 0 &&
    style !== null &&
    !isLoading;

  async function handleGenerate() {
    if (!canGenerate || !style) return;
    setIsLoading(true);
    setCopiedAll(false);
    setCopiedIndex(null);
    try {
      const result = await generateHook({ topic, description, platform, style });
      setHooks(result);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyOne(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex((prev) => (prev === index ? null : prev)), 1800);
  }

  async function handleCopyAll() {
    if (!hooks) return;
    await navigator.clipboard.writeText(hooks.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1800);
  }

  const selectedPlatform = hookPlatformOptions.find((p) => p.value === platform)!;

  return (
    <div className="min-h-screen bg-[#0F1115] font-sans text-[#F5F3ED]">
      <Header />

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#9A9CA5] transition-colors hover:text-[#F5F3ED]"
        >
          <IconArrow className="h-3.5 w-3.5 rotate-180" />
          Semua generator
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/5"
            style={{ color: CORAL }}
          >
            <IconHook className="h-6 w-6" />
          </span>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: CORAL }}>
              GEN.04 · Hook Generator
            </p>
            <h1 className="font-serif text-2xl text-[#F5F3ED] sm:text-3xl">
              Generator Hook 
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#9A9CA5]">
          Jelasin topik & isi kontennya, pilih gaya hook yang cocok — AI bakal
          kasih beberapa opsi kalimat pembuka buat bikin orang berhenti scroll.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          {/* Form */}
          <div className="rounded-2xl border border-white/10 bg-[#171A21] p-6 sm:p-8">
            <div className="space-y-6">
              {/* Topik konten */}
              <div>
                <label htmlFor="topic" className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Topik Konten
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Misal: skincare kulit berjerawat, tips keuangan, review produk"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 text-sm text-[#F5F3ED] placeholder:text-[#5C5F68] outline-none transition-colors focus:border-[#E8623D]"
                />
              </div>

              {/* Deskripsi konten */}
              <div>
                <label htmlFor="description" className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Deskripsi Konten
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Video/postingan ini isinya apa? Poin utama atau pesan yang mau disampaikan apa?"
                  rows={4}
                  className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 text-sm leading-relaxed text-[#F5F3ED] placeholder:text-[#5C5F68] outline-none transition-colors focus:border-[#E8623D]"
                />
              </div>

              {/* Platform */}
              <div ref={platformRef} className="relative">
                <label className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Platform <span className="normal-case text-[#5C5F68]">(opsional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsPlatformOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={isPlatformOpen}
                  className={`mt-2 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                    isPlatformOpen ? "border-[#E8623D]" : "border-white/10 hover:border-white/25"
                  } bg-[#0F1115]`}
                >
                  <span className="text-[#F5F3ED]">{selectedPlatform.label}</span>
                  <IconChevronDown
                    className={`h-4 w-4 text-[#9A9CA5] transition-transform ${
                      isPlatformOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isPlatformOpen && (
                  <ul
                    role="listbox"
                    className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-white/10 bg-[#171A21] shadow-xl shadow-black/40"
                  >
                    {hookPlatformOptions.map((p) => {
                      const isSelected = platform === p.value;
                      return (
                        <li key={p.value} role="option" aria-selected={isSelected}>
                          <button
                            type="button"
                            onClick={() => {
                              setPlatform(p.value);
                              setIsPlatformOpen(false);
                            }}
                            className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5 ${
                              isSelected ? "bg-white/5 text-[#E8623D]" : "text-[#F5F3ED]"
                            }`}
                          >
                            {p.label}
                            {isSelected && (
                              <IconCheck className="ml-auto h-3.5 w-3.5 text-[#4FB6A8]" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Gaya hook */}
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Gaya Hook
                </label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {hookStyleOptions.map((s) => {
                    const isSelected = style === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setStyle(s.value)}
                        aria-pressed={isSelected}
                        className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-left transition-colors ${
                          isSelected
                            ? "border-[#E8623D] bg-white/5"
                            : "border-white/10 hover:border-white/25"
                        }`}
                      >
                        <span className="text-base leading-none">{s.emoji}</span>
                        <span className="min-w-0">
                          <span
                            className={`block text-sm font-medium ${
                              isSelected ? "text-[#E8623D]" : "text-[#F5F3ED]"
                            }`}
                          >
                            {s.label}
                          </span>
                          <span className="mt-0.5 block text-xs leading-snug text-[#9A9CA5]">
                            {s.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E8623D] px-5 py-3 text-sm font-medium text-[#0F1115] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <IconLoader className="h-4 w-4 animate-spin" />
                    Membuat hook...
                  </>
                ) : (
                  <>
                    <IconSparkle className="h-4 w-4" />
                    Generate Hook
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="rounded-2xl border border-white/10 bg-[#171A21] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                Hasil
              </p>
              {hooks && hooks.length > 0 && !isLoading && (
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#9A9CA5] transition-colors hover:text-[#F5F3ED]"
                >
                  {copiedAll ? (
                    <>
                      <IconCheck className="h-3.5 w-3.5 text-[#4FB6A8]" />
                      Semua tersalin
                    </>
                  ) : (
                    <>
                      <IconCopy className="h-3.5 w-3.5" />
                      Copy semua
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="mt-4 min-h-[220px]">
              {isLoading ? (
                <div className="space-y-2.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-11 w-full animate-pulse rounded-lg bg-white/5"
                    />
                  ))}
                </div>
              ) : hooks && hooks.length > 0 ? (
                <ul className="space-y-2">
                  {hooks.map((hook, i) => {
                    const isCopied = copiedIndex === i;
                    return (
                      <li
                        key={i}
                        className="group flex items-start gap-3 rounded-lg border border-white/10 bg-[#0F1115] px-3.5 py-3"
                      >
                        <span className="mt-0.5 font-mono text-xs text-[#5C5F68]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="flex-1 text-sm leading-relaxed text-[#F5F3ED]">
                          {hook}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopyOne(hook, i)}
                          aria-label="Copy hook ini"
                          className="shrink-0 text-[#5C5F68] transition-colors hover:text-[#F5F3ED]"
                        >
                          {isCopied ? (
                            <IconCheck className="h-3.5 w-3.5 text-[#4FB6A8]" />
                          ) : (
                            <IconCopy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-[#5C5F68]">
                    <IconImage className="h-5 w-5" />
                  </span>
                  <p className="max-w-[220px] text-sm leading-relaxed text-[#5C5F68]">
                    Pilihan hook akan muncul di sini setelah kamu klik Generate.
                  </p>
                </div>
              )}
            </div>

            {hooks && hooks.length > 0 && !isLoading && (
              <button
                type="button"
                onClick={handleGenerate}
                className="mt-6 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#9A9CA5] transition-colors hover:text-[#F5F3ED]"
              >
                <IconSparkle className="h-3.5 w-3.5" />
                Generate ulang
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}