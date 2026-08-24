export type GenerateInput = {
  concept: string;
  businessType: string;
  businessModel: string;
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

const businessModelClosers: Record<string, string> = {
  b2c: "Cocok buat kamu yang cari kebutuhan sehari-hari langsung dari penjual terpercaya.",
  b2b: "Solusi pasokan yang bisa diandalkan untuk kebutuhan bisnismu dalam jumlah besar.",
  c2c: "Transaksi aman dan mudah, langsung antar sesama pengguna.",
  d2c: "Langsung dari produsen ke tanganmu, tanpa perantara, harga lebih bersahabat.",
  b2b2c: "Menghubungkan mitra bisnis hingga sampai ke tangan pelanggan akhir dengan mudah.",
};

const businessTypeContext: Record<string, string> = {
  fashion: "produk fashion",
  electronics: "produk elektronik",
  food: "produk makanan & minuman",
  beauty: "produk kecantikan & perawatan",
  health: "produk kesehatan",
  home: "produk rumah tangga & dekorasi",
  automotive: "produk otomotif",
  hobby: "produk hobi & koleksi",
  services: "layanan jasa",
  other: "produk",
};

/**
 * NOTE: masih implementasi sementara (template lokal) karena backend AI-nya
 * belum ada. Tinggal ganti isi fungsi ini jadi fetch ke API kamu nanti.
 */
export async function generateMarketplaceDescription({
  concept,
  businessType,
  businessModel,
  tone,
}: GenerateInput): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const openers = toneOpeners[tone] ?? toneOpeners.casual;
  const opener = openers[Math.floor(Math.random() * openers.length)];
  const closer = businessModelClosers[businessModel] ?? businessModelClosers.b2c;
  const context = businessTypeContext[businessType] ?? businessTypeContext.other;
  const trimmedConcept = concept.trim().replace(/\.$/, "");

  return `${opener} ${trimmedConcept}. Kami hadir sebagai penyedia ${context} pilihan. ${closer}`;
}
