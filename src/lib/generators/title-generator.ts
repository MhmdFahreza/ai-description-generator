// src/lib/generators/title-generator.ts

import { titleStyleOptions, type TitleStyle } from "@/constants/title-styles";

export type GenerateTitleInput = {
  style: TitleStyle;
  description: string;
  media?: File | null;
};

/**
 * Generate beberapa pilihan judul lewat API route `/api/generate/title`,
 * yang di server manggil Groq (model openai/gpt-oss-120b).
 *
 * NOTE soal `media`: openai/gpt-oss-120b itu text-only (gak ada vision),
 * jadi thumbnail/video yang di-upload untuk sekarang cuma dipakai buat
 * preview di UI — belum ikut dikirim/dianalisis AI-nya. Judul digenerate
 * murni dari `description` + gaya (`style`).
 *
 * Label & deskripsi gaya (`styleLabel`/`styleDescription`) di-lookup dari
 * titleStyleOptions di sini terus dikirim ke server, jadi route.ts gak
 * perlu hardcode daftar gaya judulnya sendiri.
 */
export async function generateTitle({
  style,
  description,
  media,
}: GenerateTitleInput): Promise<string[]> {
  void media; // belum dipakai, lihat NOTE di atas

  const styleOption = titleStyleOptions.find((s) => s.value === style);

  const res = await fetch("/api/generate/title-generator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description,
      style,
      styleLabel: styleOption?.label ?? style,
      styleDescription: styleOption?.description ?? "",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? "Gagal generate judul.");
  }

  return data.titles as string[];
}