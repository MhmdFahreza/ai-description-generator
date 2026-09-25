import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";
const HOOK_COUNT = 5;

const platformGuides: Record<string, string> = {
  general: "umum (bisa untuk berbagai platform)",
  tiktok: "TikTok (singkat, energik, langsung to the point dalam 1-2 kalimat)",
  reels: "Instagram Reels (visual & engaging, sedikit storytelling)",
  shorts: "YouTube Shorts (langsung hook di kalimat pertama, gaya percakapan)",
};

const styleGuides: Record<string, string> = {
  question: "pertanyaan yang relate ke masalah atau rasa penasaran audiens",
  controversial: "pernyataan berani atau anti-mainstream yang bikin orang berhenti scroll",
  "stat-fact": "angka atau fakta mengejutkan yang relevan dengan topik",
  storytelling: "potongan cerita atau pengalaman personal yang menarik",
  "problem-agitate": "highlight masalah yang dialami audiens dengan cara yang bikin mereka relate",
  "curiosity-gap": "kasih informasi setengah-setengah yang bikin penasaran sama kelanjutannya",
};

type Body = {
  topic?: string;
  description?: string;
  platform?: string;
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

  const topic = body.topic?.trim();
  const description = body.description?.trim();

  if (!topic || !description) {
    return NextResponse.json(
      { error: "topic dan description wajib diisi." },
      { status: 400 }
    );
  }

  const platformGuide = platformGuides[body.platform ?? "general"] ?? platformGuides.general;
  const styleGuide = styleGuides[body.style ?? "question"] ?? styleGuides.question;

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
        max_completion_tokens: 500,
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
            content:
              `Kamu content creator Indonesia yang ahli bikin kalimat pembuka (hook) yang bikin orang berhenti scroll. ` +
              `Buatin persis ${HOOK_COUNT} pilihan hook dalam Bahasa Indonesia dengan gaya "${styleGuide}" ` +
              `yang dioptimalkan untuk platform ${platformGuide}. ` +
              "Tulis SATU hook per baris, tanpa nomor, tanpa bullet, tanpa tanda kutip, tanpa penjelasan tambahan — cuma daftar hooknya aja, satu hook per baris.",
          },
          {
            role: "user",
            content: `Topik konten: ${topic}\nDeskripsi konten: ${description}`,
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
    const raw: string | undefined = data?.choices?.[0]?.message?.content;

    if (!raw) {
      return NextResponse.json(
        { error: "AI tidak mengembalikan hasil." },
        { status: 502 }
      );
    }

    const hooks = raw
      .split("\n")
      .map((line) =>
        line
          .replace(/^\s*\d+[.).\-]\s*/, "")
          .replace(/^\s*[-*•]\s*/, "")
          .replace(/^[""]/g, "")
          .replace(/["""]$/g, "")
          .trim()
      )
      .filter((line) => line.length > 0)
      .slice(0, HOOK_COUNT);

    if (hooks.length === 0) {
      return NextResponse.json(
        { error: "AI tidak mengembalikan hasil." },
        { status: 502 }
      );
    }

    return NextResponse.json({ hooks });
  } catch (err) {
    console.error("Gagal menghubungi Groq:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghubungi AI." },
      { status: 500 }
    );
  }
}
