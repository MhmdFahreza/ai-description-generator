// src/app/generate/advertisement-generator/page.tsx
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
import { adStyleOptions, type AdStyle } from "@/constants/ad-styles";
import { generateAdvertisement } from "@/lib/generators/advertisement";

const CORAL = "#E8623D";

// Placeholder header icon — swap for a real icon (e.g. IconMegaphone)
// from your icon set if you have one.
function IconMegaphone({ className }: { className?: string }) {
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
      <path d="M3 11v2a1 1 0 0 0 1 1h1l3 6h2l-2-6h2l7 4V6l-7 4H5a1 1 0 0 0-1 1z" />
      <path d="M17 8a3 3 0 0 1 0 6" />
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

export default function AdvertisementGeneratorPage() {
  const [description, setDescription] = useState("");

  const [style, setStyle] = useState<AdStyle | null>(null);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (styleRef.current && !styleRef.current.contains(e.target as Node)) {
        setIsStyleOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsStyleOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const canGenerate = description.trim().length > 0 && style !== null && !isLoading;
  const selectedStyle = adStyleOptions.find((s) => s.value === style) ?? null;

  async function handleGenerate() {
    if (!canGenerate || !style) return;
    setIsLoading(true);
    setCopied(false);
    try {
      const text = await generateAdvertisement({ description, style });
      setResult(text);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

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
            <IconMegaphone className="h-6 w-6" />
          </span>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: CORAL }}>
              GEN.05 · Advertisement Generator
            </p>
            <h1 className="font-serif text-2xl text-[#F5F3ED] sm:text-3xl">
              Generator Teks Iklan
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#9A9CA5]">
          Jelasin produk atau iklan yang mau dibuat, pilih gaya bahasanya —
          AI yang nuliskan teks iklannya.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          {/* Form */}
          <div className="rounded-2xl border border-white/10 bg-[#171A21] p-6 sm:p-8">
            <div className="space-y-6">
              {/* Deskripsi iklan */}
              <div>
                <label htmlFor="description" className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Deskripsi Iklan
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan produk/jasanya apa, keunggulannya apa, ada promo atau penawaran khusus nggak, siapa target audiensnya, dll."
                  rows={7}
                  className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 text-sm leading-relaxed text-[#F5F3ED] placeholder:text-[#5C5F68] outline-none transition-colors focus:border-[#E8623D]"
                />
              </div>

              {/* Gaya bahasa — dropdown */}
              <div ref={styleRef} className="relative">
                <label className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Gaya Bahasa
                </label>

                <button
                  type="button"
                  onClick={() => setIsStyleOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={isStyleOpen}
                  className={`mt-2 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                    isStyleOpen ? "border-[#E8623D]" : "border-white/10 hover:border-white/25"
                  } bg-[#0F1115]`}
                >
                  {selectedStyle ? (
                    <span className="flex items-center gap-2.5">
                      <span className="text-base leading-none">{selectedStyle.emoji}</span>
                      <span className="text-[#F5F3ED]">{selectedStyle.label}</span>
                    </span>
                  ) : (
                    <span className="text-[#5C5F68]">Pilih gaya bahasa</span>
                  )}
                  <IconChevronDown
                    className={`h-4 w-4 text-[#9A9CA5] transition-transform ${
                      isStyleOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {selectedStyle && !isStyleOpen && (
                  <p className="mt-1.5 text-xs leading-snug text-[#5C5F68]">
                    {selectedStyle.description}
                  </p>
                )}

                {isStyleOpen && (
                  <ul
                    role="listbox"
                    className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-white/10 bg-[#171A21] shadow-xl shadow-black/40"
                  >
                    {adStyleOptions.map((s) => {
                      const isSelected = style === s.value;
                      return (
                        <li key={s.value} role="option" aria-selected={isSelected}>
                          <button
                            type="button"
                            onClick={() => {
                              setStyle(s.value);
                              setIsStyleOpen(false);
                            }}
                            className={`flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-white/5 ${
                              isSelected ? "bg-white/5" : ""
                            }`}
                          >
                            <span className="mt-0.5 text-base leading-none">{s.emoji}</span>
                            <span className="min-w-0 flex-1">
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
                            {isSelected && (
                              <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4FB6A8]" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
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
                    Membuat iklan...
                  </>
                ) : (
                  <>
                    <IconSparkle className="h-4 w-4" />
                    Generate Iklan
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
              {result && !isLoading && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#9A9CA5] transition-colors hover:text-[#F5F3ED]"
                >
                  {copied ? (
                    <>
                      <IconCheck className="h-3.5 w-3.5 text-[#4FB6A8]" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <IconCopy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="mt-4 min-h-[220px]">
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-3 w-full animate-pulse rounded bg-white/5" />
                  <div className="h-3 w-11/12 animate-pulse rounded bg-white/5" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-white/5" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-white/5" />
                </div>
              ) : result ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#F5F3ED]">
                  {result}
                </p>
              ) : (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-[#5C5F68]">
                    <IconImage className="h-5 w-5" />
                  </span>
                  <p className="max-w-[220px] text-sm leading-relaxed text-[#5C5F68]">
                    Hasil teks iklan akan muncul di sini setelah kamu klik Generate.
                  </p>
                </div>
              )}
            </div>

            {result && !isLoading && (
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