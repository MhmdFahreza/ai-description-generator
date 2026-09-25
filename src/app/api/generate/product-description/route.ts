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
  urgent: "mendesak — menekankan stok terbatas / promo",
};

type Body = {
  productName?: string;
  idea?: string;
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

  const productName = body.productName?.trim();
  const idea = body.idea?.trim();
  const tone = body.tone ?? "casual";

  if (!productName || !idea) {
    return NextResponse.json(
      { error: "productName dan idea wajib diisi." },
      { status: 400 }
    );
  }

  const toneGuide = toneGuides[tone] ?? toneGuides.casual;

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
        max_completion_tokens: 350,
        // Task-nya copywriting, jadi reasoning effort rendah aja — lebih cepat & murah.
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
            content:
              "Kamu copywriter e-commerce Indonesia yang ahli bikin deskripsi produk yang siap tempel ke listing marketplace (Tokopedia/Shopee/Instagram). " +
              `Tulis dalam Bahasa Indonesia dengan gaya bahasa ${toneGuide}. ` +
              "Panjang 3-5 kalimat, fokus ke fitur & manfaat produk berdasarkan detail yang dikasih penjual. " +
              "Jangan pakai heading, markdown, atau bullet point — langsung teks paragraf saja.",
          },
          {
            role: "user",
            content: `Nama/jenis produk: ${productName}\nDetail & ide dari penjual: ${idea}`,
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
    // Catatan: untuk model reasoning (gpt-oss), Groq naruh chain-of-thought
    // di field `reasoning` yang terpisah — `message.content` udah berisi
    // jawaban final aja, jadi aman langsung dipakai tanpa perlu di-strip.
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