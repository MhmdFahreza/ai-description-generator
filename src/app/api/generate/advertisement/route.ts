import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

const styleGuides: Record<string, string> = {
  formal: "formal dan profesional, cocok untuk B2B atau brand serius — gunakan bahasa yang sopan dan terpercaya",
  casual: "santai dan akrab, seperti ngobrol sama teman — ringan dan mudah dicerna",
  persuasive: "sangat persuasif — fokus dorong action, tekankan benefit utama dan urgensi pembelian",
  humorous: "humoris dan ringan — gunakan humor yang relatable, bikin orang senyum saat baca",
  luxurious: "mewah dan eksklusif — gunakan bahasa elegan, kesan premium, sentuhan high-end",
  emotional: "emosional dan personal — sentuh perasaan pembaca, bangun koneksi, ceritakan dampak nyata produk",
};

type Body = {
  description?: string;
  style?: string;
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

  const description = body.description?.trim();
  if (!description) {
    return NextResponse.json(
      { error: "description wajib diisi." },
      { status: 400 }
    );
  }

  const styleGuide = styleGuides[body.style ?? "casual"] ?? styleGuides.casual;

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.85,
        top_p: 0.9,
        max_completion_tokens: 400,
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
            content:
              "Kamu copywriter iklan Indonesia yang berpengalaman membuat teks iklan yang menarik dan konversi tinggi. " +
              `Tulis teks iklan dalam Bahasa Indonesia dengan gaya ${styleGuide}. ` +
              "Panjang 3-6 kalimat, fokus ke keunggulan produk/jasa, manfaat untuk konsumen, dan ajakan bertindak (CTA) yang jelas. " +
              "Jangan pakai heading, markdown, atau bullet point — langsung teks paragraf yang siap pakai.",
          },
          {
            role: "user",
            content: `Deskripsi iklan: ${description}`,
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

    return NextResponse.json({ text: result.trim() });
  } catch (err) {
    console.error("Gagal menghubungi Groq:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghubungi AI." },
      { status: 500 }
    );
  }
}
