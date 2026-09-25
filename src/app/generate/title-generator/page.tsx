// src/app/generate/title-generator/page.tsx
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
  IconVideo,
  IconX,
  IconChevronDown,
} from "@/componenets/icons";
import { titleStyleOptions, type TitleStyle } from "@/constants/title-styles";
import { generateTitle } from "@/lib/generators/title-generator";
import { validateMediaFile, formatBytes, getMediaKind } from "@/lib/media";

const CORAL = "#E8623D";

function IconType({ className }: { className?: string }) {
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
      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </svg>
  );
}

export default function TitleGeneratorPage() {
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState("");
  const [style, setStyle] = useState<TitleStyle | null>(null);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  const [titles, setTitles] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Close style dropdown on outside click or Escape
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

  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    };
  }, [mediaPreviewUrl]);

  const canGenerate =
    media !== null &&
    description.trim().length > 0 &&
    style !== null &&
    !isLoading;

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateMediaFile(file);
    if (error) {
      setMediaError(error);
      e.target.value = "";
      return;
    }

    setMediaError(null);
    setMedia(file);
    setMediaPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function handleRemoveMedia() {
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMedia(null);
    setMediaPreviewUrl(null);
    setMediaError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleGenerate() {
    if (!canGenerate || !style) return;
    setIsLoading(true);
    setCopiedAll(false);
    setCopiedIndex(null);
    try {
      const result = await generateTitle({ style, description, media });
      setTitles(result);
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
    if (!titles) return;
    await navigator.clipboard.writeText(titles.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1800);
  }

  const mediaKind = media ? getMediaKind(media) : null;
  const selectedStyle = titleStyleOptions.find((s) => s.value === style) ?? null;

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
            <IconType className="h-6 w-6" />
          </span>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: CORAL }}>
              GEN.03 · Title Generator
            </p>
            <h1 className="font-serif text-2xl text-[#F5F3ED] sm:text-3xl">
              Content Title Generator
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#9A9CA5]">
          Upload a thumbnail or video, describe your content, then pick a title
          style — AI will generate several title options for you.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          {/* Form */}
          <div className="rounded-2xl border border-white/10 bg-[#171A21] p-6 sm:p-8">
            <div className="space-y-6">
              {/* Upload media */}
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Thumbnail or Content Video
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaChange}
                  className="hidden"
                />

                {mediaPreviewUrl && media ? (
                  <div className="relative mt-2 overflow-hidden rounded-lg border border-white/10">
                    {mediaKind === "video" ? (
                      <video
                        src={mediaPreviewUrl}
                        controls
                        className="h-44 w-full bg-black object-contain"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaPreviewUrl}
                        alt="Content preview"
                        className="h-44 w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      aria-label="Remove media"
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0F1115]/80 text-[#F5F3ED] transition-colors hover:bg-[#0F1115]"
                    >
                      <IconX className="h-3.5 w-3.5" />
                    </button>
                    <p className="truncate border-t border-white/10 bg-[#0F1115] px-3 py-1.5 text-xs text-[#9A9CA5]">
                      {media.name} · {formatBytes(media.size)}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-[#0F1115] px-4 py-8 text-center transition-colors hover:border-[#E8623D]/60"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[#9A9CA5]">
                      <IconVideo className="h-5 w-5" />
                    </span>
                    <span className="text-sm text-[#F5F3ED]">
                      Click to upload a thumbnail or video
                    </span>
                    <span className="text-xs text-[#5C5F68]">
                      Image max 5MB · Video max 20MB
                    </span>
                  </button>
                )}

                {mediaError && (
                  <p className="mt-2 text-xs text-red-400">{mediaError}</p>
                )}
              </div>

              {/* Content description */}
              <div>
                <label htmlFor="description" className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Content Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your content: the topic, key points, target audience, etc."
                  rows={4}
                  className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 text-sm leading-relaxed text-[#F5F3ED] placeholder:text-[#5C5F68] outline-none transition-colors focus:border-[#E8623D]"
                />
              </div>

              {/* Title style — dropdown */}
              <div ref={styleRef} className="relative">
                <label className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Title Style
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
                    <span className="text-[#5C5F68]">Select a title style</span>
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
                    {titleStyleOptions.map((s) => {
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
                    Generating titles...
                  </>
                ) : (
                  <>
                    <IconSparkle className="h-4 w-4" />
                    Generate Titles
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
              {titles && titles.length > 0 && !isLoading && (
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#9A9CA5] transition-colors hover:text-[#F5F3ED]"
                >
                  {copiedAll ? (
                    <>
                      <IconCheck className="h-3.5 w-3.5 text-[#4FB6A8]" />
                      All copied
                    </>
                  ) : (
                    <>
                      <IconCopy className="h-3.5 w-3.5" />
                      Copy all
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
              ) : titles && titles.length > 0 ? (
                <ul className="space-y-2">
                  {titles.map((title, i) => {
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
                          {title}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopyOne(title, i)}
                          aria-label="Copy this title"
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
                    Your title options will appear here after you click Generate.
                  </p>
                </div>
              )}
            </div>

            {titles && titles.length > 0 && !isLoading && (
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