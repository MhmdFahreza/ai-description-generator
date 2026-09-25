import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";
const TITLE_COUNT = 5;

type Body = {
  description?: string;
  style?: string;
  styleLabel?: string;
  styleDescription?: string;
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

  // `styleLabel`/`styleDescription` dikirim dari client (lookup dari
  // titleStyleOptions) supaya route ini gak perlu hardcode & duplikat daftar
  // gaya judul — kalau nanti nambah style baru di constants, route ini gak
  // perlu ikut diubah.
  const styleLabel = body.styleLabel?.trim() || body.style || "netral";
  const styleDescription = body.styleDescription?.trim();
  const styleGuide = styleDescription
    ? `${styleLabel} (${styleDescription})`
    : styleLabel;

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
        max_completion_tokens: 400,
        // Task-nya nulis judul, jadi reasoning effort rendah aja — lebih cepat & murah.
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
            content:
              "Kamu content strategist Indonesia yang ahli bikin judul konten yang menarik. " +
              `Buatin persis ${TITLE_COUNT} pilihan judul dalam Bahasa Indonesia dengan gaya "${styleGuide}". ` +
              "Tulis SATU judul per baris, tanpa nomor, tanpa bullet, tanpa tanda kutip, tanpa penjelasan tambahan — cuma daftar judulnya aja, satu judul per baris.",
          },
          {
            role: "user",
            content: `Deskripsi konten: ${description}`,
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

    // Parse jadi array judul: pecah per baris, buang nomor/bullet/kutip
    // kalau model tetap nyelipin itu meski udah diinstruksiin, buang baris
    // kosong. Sengaja gak pakai response_format json_schema — ada laporan
    // di forum Groq soal itu suka diabaikan sama gpt-oss-120b, jadi
    // plain-text + parsing manual lebih reliable di sini.
    const titles = raw
      .split("\n")
      .map((line) =>
        line
          .replace(/^\s*\d+[.).\-]\s*/, "")
          .replace(/^\s*[-*•]\s*/, "")
          .replace(/^["“]|["”]$/g, "")
          .trim()
      )
      .filter((line) => line.length > 0)
      .slice(0, TITLE_COUNT);

    if (titles.length === 0) {
      return NextResponse.json(
        { error: "AI tidak mengembalikan hasil." },
        { status: 502 }
      );
    }

    return NextResponse.json({ titles });
  } catch (err) {
    console.error("Gagal menghubungi Groq:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghubungi AI." },
      { status: 500 }
    );
  }
}