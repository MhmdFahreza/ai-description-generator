// src/lib/generators/hook-generator.ts

import type { HookStyle } from "@/constants/hook-styles";
import type { HookPlatform } from "@/constants/hook-platforms";
import type { OutputLanguage } from "@/constants/languages";
import { apiFetch } from "../api-fetch";

interface GenerateHookParams {
  topic: string;
  description: string;
  platform: HookPlatform;
  style: HookStyle;
  outputLanguage?: OutputLanguage;
}

export async function generateHook({
  topic,
  description,
  platform,
  style,
  outputLanguage = "auto",
}: GenerateHookParams): Promise<string[]> {
  const res = await apiFetch("/api/generate/hook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, description, platform, style, outputLanguage }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 429) {
      return [];
    }
    throw new Error(data?.error ?? "Failed to generate hook.");
  }

  return data.hooks as string[];
}