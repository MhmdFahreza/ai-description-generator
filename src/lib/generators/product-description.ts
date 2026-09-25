export type GenerateInput = {
  productName: string;
  idea: string;
  tone: string;
  image?: File | null;
};

/**
 * Generate a product description lewat API route
 * `/api/generate/product-description`, yang di server manggil Groq
 * (model openai/gpt-oss-120b).
 *
 * NOTE soal `image`: openai/gpt-oss-120b di Groq itu text-only (belum ada
 * dukungan vision), jadi foto produk untuk sekarang cuma dipakai buat
 * preview di UI — belum ikut dikirim/dianalisis AI-nya. Kalau nanti mau
 * AI "lihat" fotonya juga, ganti model di route.ts ke yang vision-capable
 * (mis. meta-llama/llama-4-scout / llama-4-maverick di Groq) dan kirim
 * gambarnya sebagai base64 image_url di content message.
 */
export async function generateProductDescription({
  productName,
  idea,
  tone,
  image,
}: GenerateInput): Promise<string> {
  void image; // belum dipakai, lihat NOTE di atas

  const res = await fetch("/api/generate/product-description", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productName, idea, tone }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? "Gagal generate deskripsi.");
  }

  return data.result as string;
}