import type { Platform } from "@/constants/platforms";

export type GenerateInput = {
  platform: Platform;
  idea: string;
  media?: File | null;
};

const platformStyle: Record<Platform, { openers: string[]; hashtags: string[] }> = {
  instagram: {
    openers: ["✨", "Yuk intip", "Behind the scenes:"],
    hashtags: ["#instagood", "#explore", "#konten"],
  },
  tiktok: {
    openers: ["POV:", "Wait for it...", "Real talk,"],
    hashtags: ["#fyp", "#viral", "#tiktokid"],
  },
  facebook: {
    openers: ["Hai teman-teman!", "Kabar baik nih,", "Cerita hari ini:"],
    hashtags: [],
  },
  twitter: {
    openers: ["Thread time.", "Real talk:", "Update:"],
    hashtags: ["#update"],
  },
  youtube: {
    openers: ["Video baru udah tayang!", "Jangan lewatkan,", "Episode kali ini:"],
    hashtags: ["#youtube", "#subscribe"],
  },
  linkedin: {
    openers: ["Excited to share,", "Sedikit refleksi:", "Update profesional:"],
    hashtags: ["#career", "#insight"],
  },
};

/**
 * NOTE: masih implementasi sementara (template lokal) karena backend AI-nya
 * belum ada. Nanti tinggal ganti isi fungsi ini jadi fetch ke API kamu —
 * `media` sudah disiapkan di signature-nya buat dikirim bareng prompt.
 */
export async function generateSocialMediaCaption({
  platform,
  idea,
  media,
}: GenerateInput): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  void media;

  const style = platformStyle[platform];
  const opener = style.openers[Math.floor(Math.random() * style.openers.length)];
  const hashtags = style.hashtags.length ? `\n\n${style.hashtags.join(" ")}` : "";

  return `${opener} ${idea.trim()}${hashtags}`;
}
