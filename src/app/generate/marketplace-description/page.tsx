"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/componenets/sections/header";
import {
  IconStore,
  IconArrow,
  IconSparkle,
  IconCopy,
  IconCheck,
  IconLoader,
  IconChevronDown,
} from "@/componenets/icons";
import { toneOptions } from "@/constants/tones";
import { businessTypeOptions, businessModelOptions } from "@/constants/business";
import { generateMarketplaceDescription } from "@/lib/generators/marketplace-description";

const TEAL = "#4FB6A8";

export default function MarketplaceDescriptionPage() {
  const [concept, setConcept] = useState("");
  const [businessType, setBusinessType] = useState(businessTypeOptions[0].value);
  const [tone, setTone] = useState(toneOptions[0].value);
  const [businessModel, setBusinessModel] = useState(businessModelOptions[0].value);

  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const canGenerate = concept.trim().length > 0 && !isLoading;

  async function handleGenerate() {
    if (!canGenerate) return;
    setIsLoading(true);
    setCopied(false);
    try {
      const text = await generateMarketplaceDescription({
        concept,
        businessType,
        tone,
        businessModel,
      });
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
            style={{ color: TEAL }}
          >
            <IconStore className="h-6 w-6" />
          </span>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: TEAL }}>
              GEN.07 · Marketplace Description
            </p>
            <h1 className="font-serif text-2xl text-[#F5F3ED] sm:text-3xl">
              Marketplace Description Generator
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#9A9CA5]">
          Describe your marketplace concept, select a business type, tone, and
          business model — get a description ready to paste into your Tokopedia,
          Shopee, or any other store.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          {/* Form */}
          <div className="rounded-2xl border border-white/10 bg-[#171A21] p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="concept" className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Marketplace Concept
                </label>
                <textarea
                  id="concept"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="What's your store concept? e.g. home kitchen tools store, focused on safe materials and minimalist design."
                  rows={5}
                  className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 text-sm leading-relaxed text-[#F5F3ED] placeholder:text-[#5C5F68] outline-none transition-colors focus:border-[#4FB6A8]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="businessType" className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                    Business Type
                  </label>
                  <div className="relative mt-2">
                    <select
                      id="businessType"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 pr-10 text-sm text-[#F5F3ED] outline-none transition-colors focus:border-[#4FB6A8]"
                    >
                      {businessTypeOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <IconChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9CA5]" />
                  </div>
                </div>

                <div>
                  <label htmlFor="businessModel" className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                    Business Model
                  </label>
                  <div className="relative mt-2">
                    <select
                      id="businessModel"
                      value={businessModel}
                      onChange={(e) => setBusinessModel(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 pr-10 text-sm text-[#F5F3ED] outline-none transition-colors focus:border-[#4FB6A8]"
                    >
                      {businessModelOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <IconChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9CA5]" />
                  </div>
                </div>
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
                    className="w-full appearance-none rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 pr-10 text-sm text-[#F5F3ED] outline-none transition-colors focus:border-[#4FB6A8]"
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
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4FB6A8] px-5 py-3 text-sm font-medium text-[#0F1115] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <IconLoader className="h-4 w-4 animate-spin" />
                    Generating description...
                  </>
                ) : (
                  <>
                    <IconSparkle className="h-4 w-4" />
                    Generate Description
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
                  <div className="h-3 w-3/5 animate-pulse rounded bg-white/5" />
                </div>
              ) : result ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#F5F3ED]">
                  {result}
                </p>
              ) : (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-[#5C5F68]">
                    <IconStore className="h-5 w-5" />
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