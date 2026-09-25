// src/lib/generators/advertisement.ts
//
// Stub — wire this to your actual API route the same way as the other
// generators. Adjust endpoint/payload to match your convention.

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

  if (!res.ok) {
    throw new Error("Gagal generate iklan");
  }

  const data = await res.json();
  return data.text as string;
}