// src/lib/generators/title.ts
//
// Stub — wire this up to your actual API route the same way
// generateSocialMediaCaption is wired. Adjust the endpoint/payload
// shape to match your existing convention.

import type { TitleStyle } from "@/constants/title-styles";

interface GenerateTitleParams {
  style: TitleStyle;
  description: string;
  media: File | null;
}

export async function generateTitle({
  style,
  description,
  media,
}: GenerateTitleParams): Promise<string[]> {
  const formData = new FormData();
  formData.append("style", style);
  formData.append("description", description);
  if (media) formData.append("media", media);

  const res = await fetch("/api/generate/title", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Gagal generate judul");
  }

  const data = await res.json();
  return data.titles as string[];
}