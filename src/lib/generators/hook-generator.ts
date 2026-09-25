// src/lib/generators/hook-generator.ts

import type { HookStyle } from "@/constants/hook-styles";
import type { HookPlatform } from "@/constants/hook-platforms";

interface GenerateHookParams {
  topic: string;
  description: string;
  platform: HookPlatform;
  style: HookStyle;
}

export async function generateHook({
  topic,
  description,
  platform,
  style,
}: GenerateHookParams): Promise<string[]> {
  const res = await fetch("/api/generate/hook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, description, platform, style }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? "Gagal generate hook.");
  }

  return data.hooks as string[];
}