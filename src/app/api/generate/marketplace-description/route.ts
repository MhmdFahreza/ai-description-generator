import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

const toneGuides: Record<string, string> = {
  casual: "santai dan akrab, kayak ngobrol sama teman",
  formal: "formal dan sopan",
  persuasive: "persuasif, meyakinkan calon pembeli",
  professional: "profesional dan terpercaya",
  playful: "playful, ceria, penuh energi",
  urgent: "mendesak — menekankan stok terbatas atau promo",
};

const businessTypeLabels: Record<string, string> = {
  fashion: "Fashion & Pakaian",
  electronics: "Elektronik & Gadget",
  food: "Makanan & Minuman",
  beauty: "Kecantikan & Perawatan",
  health: "Kesehatan",
  home: "Rumah Tangga & Dekorasi",
  automotive: "Otomotif",
  hobby: "Hobi, Mainan & Koleksi",
  services: "Jasa & Layanan",
  other: "Produk",
};

const businessModelLabels: Record<string, string> = {
  b2c: "B2C (Business to Consumer) — langsung ke konsumen akhir",
  b2b: "B2B (Business to Business) — melayani kebutuhan bisnis lain",
  c2c: "C2C (Consumer to Consumer) — transaksi antar sesama pengguna",
  d2c: "D2C (Direct to Consumer) — langsung dari produsen ke pembeli tanpa perantara",
  b2b2c: "B2B2C — menghubungkan mitra bisnis hingga ke konsumen akhir",
};

type Body = {
  concept?: string;
  businessType?: string;
  businessModel?: string;
  tone?: string;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY belum diset di server." },
      { status: 500 }
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body request tidak valid." },
      { status: 400 }
    );
  }

  const concept = body.concept?.trim();
  if (!concept) {
    return NextResponse.json(
      { error: "concept wajib diisi." },
      { status: 400 }
    );
  }

  const toneGuide = toneGuides[body.tone ?? "casual"] ?? toneGuides.casual;
  const businessTypeLabel = businessTypeLabels[body.businessType ?? "other"] ?? businessTypeLabels.other;
  const businessModelLabel = businessModelLabels[body.businessModel ?? "b2c"] ?? businessModelLabels.b2c;

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.8,
        top_p: 0.9,
        max_completion_tokens: 400,
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
            content:
              "Kamu copywriter marketplace Indonesia yang ahli bikin deskripsi toko/produk yang siap tempel ke Tokopedia, Shopee, Lazada, dan marketplace lainnya. " +
              `Tulis deskripsi dalam Bahasa Indonesia dengan gaya bahasa ${toneGuide}. ` +
              `Kategori bisnis: ${businessTypeLabel}. Model bisnis: ${businessModelLabel}. ` +
              "Panjang 4-6 kalimat, menonjolkan keunggulan dan keunikan toko/produk, manfaat untuk pembeli, dan sedikit ajakan untuk bertransaksi. " +
              "Jangan pakai heading, markdown, atau bullet point — langsung paragraf teks yang bisa langsung dipakai.",
          },
          {
            role: "user",
            content: `Konsep marketplace: ${concept}`,
          },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error:", groqRes.status, errText);
      return NextResponse.json(
        { error: "AI sedang bermasalah, coba lagi sebentar lagi." },
        { status: 502 }
      );
    }

    const data = await groqRes.json();
    const result: string | undefined = data?.choices?.[0]?.message?.content;

    if (!result) {
      return NextResponse.json(
        { error: "AI tidak mengembalikan hasil." },
        { status: 502 }
      );
    }

    return NextResponse.json({ result: result.trim() });
  } catch (err) {
    console.error("Gagal menghubungi Groq:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghubungi AI." },
      { status: 500 }
    );
  }
}
