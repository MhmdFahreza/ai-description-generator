import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

const toneGuides: Record<string, string> = {
  casual: "santai dan akrab, kayak ngobrol sama teman",
  formal: "formal dan sopan",
  persuasive: "persuasif, meyakinkan pengunjung untuk klik",
  professional: "profesional dan terpercaya",
  playful: "playful, ceria, penuh energi",
  urgent: "mendesak — menekankan waktu terbatas atau kesempatan yang sayang dilewatkan",
};

type Body = {
  concept?: string;
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

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.75,
        top_p: 0.9,
        max_completion_tokens: 100,
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
            content:
              "Kamu SEO specialist Indonesia yang ahli menulis meta description yang menarik dan ramah mesin pencari. " +
              `Tulis SATU meta description dalam Bahasa Indonesia dengan gaya ${toneGuide}. ` +
              "Panjang HARUS antara 120-160 karakter (termasuk spasi) — ini sangat penting agar tidak terpotong di hasil pencarian Google. " +
              "Fokus ke kata kunci utama, manfaat untuk pengguna, dan sedikit CTA. " +
              "Tulis langsung teksnya saja tanpa label, tanda kutip, atau penjelasan tambahan.",
          },
          {
            role: "user",
            content: `Konsep/ide halaman: ${concept}`,
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
