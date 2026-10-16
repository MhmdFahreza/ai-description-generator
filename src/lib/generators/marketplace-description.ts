// src/lib/generators/marketplace-description.ts

import { apiFetch } from "../api-fetch";

export type GenerateInput = {
  concept: string;
  businessType: string;
  businessModel: string;
  tone: string;
};

export async function generateMarketplaceDescription({
  concept,
  businessType,
  businessModel,
  tone,
}: GenerateInput): Promise<string> {
  const res = await apiFetch("/api/generate/marketplace-description", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ concept, businessType, businessModel, tone }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 429) {
      return "";
    }
    throw new Error(data?.error ?? "Failed to generate marketplace description.");
  }

  return data.result as string;
}
