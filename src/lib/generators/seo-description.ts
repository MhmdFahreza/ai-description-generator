export type GenerateInput = {
  concept: string;
  tone: string;
};

const toneOpeners: Record<string, string[]> = {
  casual: ["Cari", "Butuh", "Lagi nyari"],
  formal: ["Temukan", "Dapatkan", "Kami menyediakan"],
  persuasive: ["Jangan lewatkan", "Solusi terbaik untuk", "Pilihan tepat untuk"],
  professional: ["Solusi", "Layanan", "Produk unggulan untuk"],
  friendly: ["Yuk temukan", "Kenalan sama", "Cari tau soal"],
  luxury: ["Nikmati", "Rasakan eksklusivitas", "Hadirkan kemewahan lewat"],
  playful: ["Cus intip", "Nih ada", "Cek deh,"],
  urgent: ["Promo terbatas untuk", "Buruan cek", "Jangan sampai kehabisan:"],
};

/**
 * NOTE: masih implementasi sementara (template lokal) karena backend AI-nya
 * belum ada. Meta description idealnya ~150-160 karakter biar nggak
 * kepotong di hasil pencarian, jadi output di sini sengaja dibikin ringkas.
 */
export async function generateSeoDescription({
  concept,
  tone,
}: GenerateInput): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const openers = toneOpeners[tone] ?? toneOpeners.casual;
  const opener = openers[Math.floor(Math.random() * openers.length)];
  const trimmedConcept = concept.trim().replace(/\.$/, "");

  return `${opener} ${trimmedConcept}. Kualitas terjamin, proses cepat, dan siap bantu kebutuhanmu sekarang juga.`;
}
