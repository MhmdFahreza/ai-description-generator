// src/constants/hook-platforms.ts

export interface HookPlatformOption {
  value: string;
  label: string;
}

export const hookPlatformOptions: HookPlatformOption[] = [
  { value: "general", label: "Umum" },
  { value: "tiktok", label: "TikTok" },
  { value: "reels", label: "Instagram Reels" },
  { value: "shorts", label: "YouTube Shorts" },
];

export type HookPlatform = (typeof hookPlatformOptions)[number]["value"];