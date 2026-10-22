import type { Platform } from "@/constants/platforms";
import type { OutputLanguage } from "@/constants/languages";
import { apiFetch } from "../api-fetch";

export type GenerateInput = {
  platform: Platform;
  idea: string;
  outputLanguage?: OutputLanguage;
  media?: File | null;
};

/**
 * Generate a social media caption lewat API route
 * `/api/generate/social-media-caption`, yang di server manggil Groq
 * (model openai/gpt-oss-120b).
 *
 * NOTE soal `media`: openai/gpt-oss-120b itu text-only (gak ada vision,
 * apalagi video), jadi foto/video yang di-upload untuk sekarang cuma
 * dipakai buat preview di UI — belum ikut dikirim/dianalisis AI-nya.
 * Caption digenerate murni dari `platform` + `idea`. Kalau nanti mau AI
 * "lihat" foto/frame video-nya juga, model di route.ts harus diganti ke
 * yang vision-capable (mis. Llama 4 Scout/Maverick di Groq).
 */
export async function generateSocialMediaCaption({
  platform,
  idea,
  outputLanguage = "auto",
  media,
}: GenerateInput): Promise<string> {
  void media; // belum dipakai, lihat NOTE di atas

  const res = await apiFetch("/api/generate/social-media-caption", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, idea, outputLanguage }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 429) {
      return "";
    }
    throw new Error(data?.error ?? "Failed to generate caption.");
  }

  return data.result as string;
}