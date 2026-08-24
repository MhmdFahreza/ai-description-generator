"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/componenets/sections/header";
import {
  IconChat,
  IconArrow,
  IconSparkle,
  IconCopy,
  IconCheck,
  IconLoader,
  IconImage,
  IconVideo,
  IconX,
} from "@/componenets/icons";
import { platformOptions } from "@/constants/platforms";
import { generateSocialMediaCaption } from "@/lib/generators/social-media-caption";
import { validateMediaFile, formatBytes, getMediaKind } from "@/lib/media";

const CORAL = "#E8623D";

// Small inline chevron so we don't depend on an icon that may not exist yet
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

export default function SocialMediaCaptionPage() {
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [platform, setPlatform] = useState<string | null>(null);
  const [isPlatformOpen, setIsPlatformOpen] = useState(false);
  const platformRef = useRef<HTMLDivElement>(null);

  const [idea, setIdea] = useState("");

  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    };
  }, [mediaPreviewUrl]);

  // Close the platform dropdown on outside click or Escape
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
    media !== null && platform !== null && idea.trim().length > 0 && !isLoading;

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
    if (!canGenerate || !platform) return;
    setIsLoading(true);
    setCopied(false);
    try {
      const text = await generateSocialMediaCaption({
        platform: platform as (typeof platformOptions)[number]["value"],
        idea,
        media,
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

  const mediaKind = media ? getMediaKind(media) : null;
  const selectedPlatform = platformOptions.find((p) => p.value === platform) ?? null;

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
            <IconChat className="h-6 w-6" />
          </span>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: CORAL }}>
              GEN.02 · Social Media Caption
            </p>
            <h1 className="font-serif text-2xl text-[#F5F3ED] sm:text-3xl">
              Social Media Caption Generator
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#9A9CA5]">
          Upload hasil konten kamu, pilih mau diupload ke platform mana, terus
          kasih ide singkat — AI yang nuliskan caption-nya.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          {/* Form */}
          <div className="rounded-2xl border border-white/10 bg-[#171A21] p-6 sm:p-8">
            <div className="space-y-6">
              {/* Upload media */}
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Video atau Foto Konten
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
                        alt="Preview konten"
                        className="h-44 w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      aria-label="Hapus media"
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
                      Klik untuk upload video atau foto
                    </span>
                    <span className="text-xs text-[#5C5F68]">
                      Gambar maks 5MB · Video maks 20MB
                    </span>
                  </button>
                )}

                {mediaError && (
                  <p className="mt-2 text-xs text-red-400">{mediaError}</p>
                )}
              </div>

              {/* Pilih platform — dropdown */}
              <div ref={platformRef} className="relative">
                <label className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Media Sosial
                </label>

                <button
                  type="button"
                  onClick={() => setIsPlatformOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={isPlatformOpen}
                  style={
                    selectedPlatform
                      ? { borderColor: `${selectedPlatform.accent}66` }
                      : undefined
                  }
                  className={`mt-2 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                    isPlatformOpen ? "border-[#E8623D]" : "border-white/10 hover:border-white/25"
                  } bg-[#0F1115]`}
                >
                  {selectedPlatform ? (
                    <span
                      className="flex items-center gap-2.5"
                      style={{ color: selectedPlatform.accent }}
                    >
                      <span className="[&>svg]:h-4 [&>svg]:w-4">{selectedPlatform.icon}</span>
                      <span className="text-[#F5F3ED]">{selectedPlatform.label}</span>
                    </span>
                  ) : (
                    <span className="text-[#5C5F68]">Pilih media sosial</span>
                  )}
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
                    {platformOptions.map((p) => {
                      const isSelected = platform === p.value;
                      return (
                        <li key={p.value} role="option" aria-selected={isSelected}>
                          <button
                            type="button"
                            onClick={() => {
                              setPlatform(p.value);
                              setIsPlatformOpen(false);
                            }}
                            className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5 ${
                              isSelected ? "bg-white/5" : ""
                            }`}
                            style={isSelected ? { color: p.accent } : undefined}
                          >
                            <span className="[&>svg]:h-4 [&>svg]:w-4">{p.icon}</span>
                            <span className={isSelected ? "" : "text-[#F5F3ED]"}>
                              {p.label}
                            </span>
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

              {/* Prompt ide */}
              <div>
                <label htmlFor="idea" className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Ide / Prompt Caption
                </label>
                <textarea
                  id="idea"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Ceritakan konteks kontennya: momennya apa, mau nyampein pesan apa, ada campaign/promo nggak, dll."
                  rows={5}
                  className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 text-sm leading-relaxed text-[#F5F3ED] placeholder:text-[#5C5F68] outline-none transition-colors focus:border-[#E8623D]"
                />
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
                    Membuat caption...
                  </>
                ) : (
                  <>
                    <IconSparkle className="h-4 w-4" />
                    Generate Caption
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
                    Hasil caption akan muncul di sini setelah kamu klik Generate.
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