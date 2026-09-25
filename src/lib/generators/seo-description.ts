// src/lib/generators/seo-description.ts

export type GenerateInput = {
  concept: string;
  tone: string;
};

export async function generateSeoDescription({
  concept,
  tone,
}: GenerateInput): Promise<string> {
  const res = await fetch("/api/generate/seo-description", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ concept, tone }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? "Gagal generate SEO description.");
  }

  return data.result as string;
}
