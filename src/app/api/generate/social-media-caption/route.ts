import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

type Platform =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "twitter"
  | "youtube"
  | "linkedin";

const platformGuides: Record<Platform, string> = {
  instagram:
    "Instagram: gaya storytelling yang hangat, boleh pakai emoji secukupnya, 2-4 kalimat, tutup dengan 3-5 hashtag relevan di baris terpisah.",
  tiktok:
    "TikTok: hook yang kuat banget di kalimat pertama biar orang gak scroll, gaya santai kayak ngomong ke kamera, 1-3 kalimat, tutup dengan 2-3 hashtag (boleh #fyp).",
  facebook:
    "Facebook: gaya naratif dan personal, ajak audiens buat komen atau diskusi, 2-4 kalimat, hashtag maksimal 0-2 dan jangan berlebihan.",
  twitter:
    "Twitter/X: sangat padat, idealnya di bawah 200 karakter, langsung ke inti, hashtag maksimal 1-2.",
  youtube:
    "YouTube: berfungsi sebagai deskripsi video, jelasin isi videonya secara singkat lalu ajak like/comment/subscribe, 3-5 kalimat, tutup dengan 2-3 hashtag.",
  linkedin:
    "LinkedIn: profesional dan reflektif, angkat insight atau pembelajaran, minim emoji, 3-5 kalimat, tutup dengan sampai 3 hashtag profesional.",
};

type Body = {
  platform?: string;
  idea?: string;
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

  const idea = body.idea?.trim();
  const platform = (body.platform ?? "instagram") as Platform;

  if (!idea) {
    return NextResponse.json({ error: "idea wajib diisi." }, { status: 400 });
  }

  const guide = platformGuides[platform] ?? platformGuides.instagram;

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.9,
        top_p: 0.9,
        max_completion_tokens: 300,
        // Task-nya nulis caption, jadi reasoning effort rendah aja — lebih cepat & murah.
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
            content:
              "Kamu social media strategist Indonesia yang ahli bikin caption yang nyantol sesuai karakter tiap platform. " +
              `Tulis dalam Bahasa Indonesia (boleh selipin gaya bahasa gaul/Inggris ringan kalau natural). Ikuti panduan gaya berikut: ${guide} ` +
              "Jangan pakai heading atau markdown, langsung teks caption yang siap post.",
          },
          {
            role: "user",
            content: `Konteks/ide konten: ${idea}`,
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
    // `message.content` udah jawaban final — reasoning chain-nya (kalau ada)
    // ditaruh Groq di field `reasoning` yang terpisah, jadi ga perlu di-strip.
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