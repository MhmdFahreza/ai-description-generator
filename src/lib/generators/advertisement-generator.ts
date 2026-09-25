// src/lib/generators/advertisement-generator.ts

import type { AdStyle } from "@/constants/ad-styles";

interface GenerateAdParams {
  description: string;
  style: AdStyle;
}

export async function generateAdvertisement({
  description,
  style,
}: GenerateAdParams): Promise<string> {
  const res = await fetch("/api/generate/advertisement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, style }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? "Gagal generate iklan.");
  }

  return data.text as string;
}