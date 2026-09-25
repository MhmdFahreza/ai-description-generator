// src/lib/generators/marketplace-description.ts

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
  const res = await fetch("/api/generate/marketplace-description", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ concept, businessType, businessModel, tone }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? "Gagal generate deskripsi marketplace.");
  }

  return data.result as string;
}
