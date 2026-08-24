// src/lib/generators/hook.ts
//
// Stub — wire this up the same way you wired generateTitle /
// generateSocialMediaCaption. Adjust endpoint/payload to match your convention.

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

  if (!res.ok) {
    throw new Error("Gagal generate hook");
  }

  const data = await res.json();
  return data.hooks as string[];
}