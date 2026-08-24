"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/componenets/sections/header";
import {
  IconBox,
  IconArrow,
  IconSparkle,
  IconCopy,
  IconCheck,
  IconLoader,
  IconChevronDown,
  IconImage,
  IconX,
} from "@/componenets/icons";
import { toneOptions } from "@/constants/tones";
import { generateProductDescription } from "@/lib/generators/product-description";
import { validateImageFile, formatBytes } from "@/lib/image";

const AMBER = "#F2B441";

export default function ProductDescriptionPage() {
  const [productName, setProductName] = useState("");
  const [idea, setIdea] = useState("");
  const [tone, setTone] = useState(toneOptions[0].value);

  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Bersihin object URL preview pas komponen unmount, biar nggak bocor memori.
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const canGenerate =
    productName.trim().length > 0 &&
    idea.trim().length > 0 &&
    productImage !== null &&
    !isLoading;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      setImageError(error);
      e.target.value = ""; // reset biar bisa pilih ulang file yang sama
      return;
    }

    setImageError(null);
    setProductImage(file);
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function handleRemoveImage() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setProductImage(null);
    setImagePreviewUrl(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setIsLoading(true);
    setCopied(false);
    try {
      const text = await generateProductDescription({
        productName,
        idea,
        tone,
        image: productImage,
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
          Semua generator
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/5"
            style={{ color: AMBER }}
          >
            <IconBox className="h-6 w-6" />
          </span>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: AMBER }}>
              GEN.01 · Product Description
            </p>
            <h1 className="font-serif text-2xl text-[#F5F3ED] sm:text-3xl">
              Product Description Generator
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#9A9CA5]">
          Upload foto produknya, kasih tau namanya, ceritakan idenya, pilih
          tone-nya, dan biarkan AI nulisin deskripsi produk yang siap tempel
          ke listing.
        </p>

        {/* Form + Result */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          {/* Form */}
          <div className="rounded-2xl border border-white/10 bg-[#171A21] p-6 sm:p-8">
            <div className="space-y-6">
              {/* Foto produk */}
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Foto Produk
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {imagePreviewUrl ? (
                  <div className="relative mt-2 overflow-hidden rounded-lg border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreviewUrl}
                      alt="Preview produk"
                      className="h-44 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      aria-label="Hapus foto"
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0F1115]/80 text-[#F5F3ED] transition-colors hover:bg-[#0F1115]"
                    >
                      <IconX className="h-3.5 w-3.5" />
                    </button>
                    {productImage && (
                      <p className="truncate border-t border-white/10 bg-[#0F1115] px-3 py-1.5 text-xs text-[#9A9CA5]">
                        {productImage.name} · {formatBytes(productImage.size)}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-[#0F1115] px-4 py-8 text-center transition-colors hover:border-[#F2B441]/60"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[#9A9CA5]">
                      <IconImage className="h-5 w-5" />
                    </span>
                    <span className="text-sm text-[#F5F3ED]">
                      Klik untuk upload foto produk
                    </span>
                    <span className="text-xs text-[#5C5F68]">
                      PNG atau JPG, maks 500KB
                    </span>
                  </button>
                )}

                {imageError && (
                  <p className="mt-2 text-xs text-red-400">{imageError}</p>
                )}
              </div>

              <div>
                <label htmlFor="productName" className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Nama / Jenis Produk
                </label>
                <input
                  id="productName"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Contoh: Kaos Polos Cotton Combed 30s"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 text-sm text-[#F5F3ED] placeholder:text-[#5C5F68] outline-none transition-colors focus:border-[#F2B441]"
                />
              </div>

              <div>
                <label htmlFor="idea" className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Ide / Detail Produk
                </label>
                <textarea
                  id="idea"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Ceritakan detail produkmu: bahan, keunggulan, ukuran, target pembeli, dll."
                  rows={5}
                  className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 text-sm leading-relaxed text-[#F5F3ED] placeholder:text-[#5C5F68] outline-none transition-colors focus:border-[#F2B441]"
                />
              </div>

              <div>
                <label htmlFor="tone" className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]">
                  Tone / Gaya Bahasa
                </label>
                <div className="relative mt-2">
                  <select
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 pr-10 text-sm text-[#F5F3ED] outline-none transition-colors focus:border-[#F2B441]"
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
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F2B441] px-5 py-3 text-sm font-medium text-[#0F1115] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <IconLoader className="h-4 w-4 animate-spin" />
                    Membuat deskripsi...
                  </>
                ) : (
                  <>
                    <IconSparkle className="h-4 w-4" />
                    Generate Deskripsi
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
                  <div className="h-3 w-full animate-pulse rounded bg-white/5" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-white/5" />
                </div>
              ) : result ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#F5F3ED]">
                  {result}
                </p>
              ) : (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-[#5C5F68]">
                    <IconSparkle className="h-5 w-5" />
                  </span>
                  <p className="max-w-[220px] text-sm leading-relaxed text-[#5C5F68]">
                    Hasil deskripsi akan muncul di sini setelah kamu klik Generate.
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
