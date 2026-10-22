// src/lib/generators/advertisement-generator.ts

import type { AdStyle } from "@/constants/ad-styles";
import type { OutputLanguage } from "@/constants/languages";
import { apiFetch } from "../api-fetch";

interface GenerateAdParams {
  description: string;
  style: AdStyle;
  outputLanguage?: OutputLanguage;
}

export async function generateAdvertisement({
  description,
  style,
  outputLanguage = "auto",
}: GenerateAdParams): Promise<string> {
  const res = await apiFetch("/api/generate/advertisement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, style, outputLanguage }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 429) {
      return "";
    }
    throw new Error(data?.error ?? "Failed to generate advertisement.");
  }

  return data.text as string;
}