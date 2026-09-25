"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/componenets/sections/header";
import {
  IconSearch,
  IconArrow,
  IconSparkle,
  IconCopy,
  IconCheck,
  IconLoader,
  IconChevronDown,
} from "@/componenets/icons";
import { toneOptions } from "@/constants/tones";
import { generateSeoDescription } from "@/lib/generators/seo-description";

const CORAL = "#E8623D";
const META_LIMIT = 160;

export default function SeoDescriptionPage() {
  const [concept, setConcept] = useState("");
  const [tone, setTone] = useState(toneOptions[0].value);

  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const canGenerate = concept.trim().length > 0 && !isLoading;

  async function handleGenerate() {
    if (!canGenerate) return;
    setIsLoading(true);
    setCopied(false);
    try {
      const text = await generateSeoDescription({ concept, tone });
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
          All generators
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/5"
            style={{ color: CORAL }}
          >
            <IconSearch className="h-6 w-6" />
          </span>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: CORAL }}>
              GEN.06 · SEO Description
            </p>
            <h1 className="font-serif text-2xl text-[#F5F3ED] sm:text-3xl">
              SEO Description Generator
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#9A9CA5]">
          Describe your page or product concept, pick a tone, and get a
          search-engine-friendly meta description.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          {/* Form */}
          <div className="rounded-2xl border border-white/10 bg-[#171A21] p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="concept" className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Concept / Idea
                </label>
                <textarea
                  id="concept"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="What's your concept? e.g. logo design service page for small businesses, focused on speed and affordable pricing."
                  rows={6}
                  className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 text-sm leading-relaxed text-[#F5F3ED] placeholder:text-[#5C5F68] outline-none transition-colors focus:border-[#E8623D]"
                />
              </div>

              <div>
                <label htmlFor="tone" className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Writing Style
                </label>
                <div className="relative mt-2">
                  <select
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 pr-10 text-sm text-[#F5F3ED] outline-none transition-colors focus:border-[#E8623D]"
                  >
                    {toneOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <IconChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9CA5]" />
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
                    Generating description...
                  </>
                ) : (
                  <>
                    <IconSparkle className="h-4 w-4" />
                    Generate SEO Description
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="rounded-2xl border border-white/10 bg-[#171A21] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                Result
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
                      Copied
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
                </div>
              ) : result ? (
                <>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-[#F5F3ED]">
                    {result}
                  </p>
                  <p
                    className={`mt-3 font-mono text-xs ${
                      result.length > META_LIMIT ? "text-red-400" : "text-[#5C5F68]"
                    }`}
                  >
                    {result.length}/{META_LIMIT} karakter
                    {result.length > META_LIMIT ? " — kepanjangan buat meta description" : ""}
                  </p>
                </>
              ) : (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-[#5C5F68]">
                    <IconSearch className="h-5 w-5" />
                  </span>
                  <p className="max-w-[220px] text-sm leading-relaxed text-[#5C5F68]">
                    Your description will appear here after you click Generate.
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
                Regenerate
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}