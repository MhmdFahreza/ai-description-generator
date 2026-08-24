export type GenerateInput = {
  productName: string;
  idea: string;
  tone: string;
  image?: File | null;
};

const toneOpeners: Record<string, string[]> = {
  casual: ["Nih,", "Eh, kenalin dong,", "Cuss, cek deh,"],
  formal: ["Perkenalkan,", "Dengan bangga kami hadirkan,", "Kami persembahkan,"],
  persuasive: ["Jangan lewatkan,", "Ini yang kamu cari:", "Saatnya upgrade dengan"],
  professional: ["Diperkenalkan:", "Solusi terbaik untuk kebutuhanmu:", "Produk unggulan kami:"],
  friendly: ["Halo! Kenalan yuk sama", "Yuk, sapa", "Kenalin nih temen baru kamu:"],
  luxury: ["Nikmati kemewahan dari", "Rasakan eksklusivitas", "Hadir untukmu yang berselera tinggi:"],
  playful: ["Woohoo! Ini dia", "Siap-siap jatuh cinta sama", "Tarraa~ kenalin"],
  urgent: ["Jangan sampai kehabisan!", "Stok terbatas untuk", "Buruan, promo terbatas untuk"],
};

const toneClosers: Record<string, string> = {
  casual: "Cocok banget buat kamu yang cari yang praktis tapi tetap kece.",
  formal: "Diproduksi dengan standar kualitas terbaik untuk kepuasan pelanggan.",
  persuasive: "Stok terbatas, jangan sampai kehabisan!",
  professional: "Dirancang untuk memenuhi kebutuhanmu secara maksimal.",
  friendly: "Kita yakin kamu bakal suka begitu nyoba!",
  luxury: "Setiap detailnya dibuat untuk kamu yang menghargai kualitas.",
  playful: "Dijamin bikin harimu lebih seru!",
  urgent: "Klik sekarang sebelum kehabisan stok!",
};

/**
 * Generate a product description.
 *
 * NOTE: ini masih implementasi sementara (template lokal, bukan mock untuk
 * testing) karena backend AI-nya belum ada. Begitu API/model generatornya
 * siap, ganti isi fungsi ini jadi fetch ke endpoint kamu (atau panggil
 * provider AI-nya langsung dari server). Signature-nya (input/output) bisa
 * tetap sama, jadi page.tsx yang manggil fungsi ini nggak perlu diubah.
 */
export async function generateProductDescription({
  productName,
  idea,
  tone,
  image,
}: GenerateInput): Promise<string> {
  // simulasi delay network/model — hapus baris ini begitu diganti fetch asli
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // `image` belum dipakai di sini karena ini masih template lokal. Di API
  // asli nanti, file ini yang bakal dikirim (misalnya lewat FormData) supaya
  // model bisa "lihat" produknya, bukan cuma baca teksnya.
  void image;

  const openers = toneOpeners[tone] ?? toneOpeners.casual;
  const opener = openers[Math.floor(Math.random() * openers.length)];
  const closer = toneClosers[tone] ?? toneClosers.casual;

  return `${opener} ${productName}. ${idea.trim()} ${closer}`;
}
