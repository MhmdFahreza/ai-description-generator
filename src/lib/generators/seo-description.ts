// src/lib/generators/seo-description.ts

import type { OutputLanguage } from "@/constants/languages";
import { apiFetch } from "../api-fetch";

export type GenerateInput = {
  concept: string;
  tone: string;
  outputLanguage?: OutputLanguage;
};

export async function generateSeoDescription({
  concept,
  tone,
  outputLanguage = "auto",
}: GenerateInput): Promise<string> {
  const res = await apiFetch("/api/generate/seo-description", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ concept, tone, outputLanguage }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 429) {
      return "";
    }
    throw new Error(data?.error ?? "Failed to generate SEO description.");
  }

  return data.result as string;
}
