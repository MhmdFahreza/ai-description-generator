// src/constants/title-styles.ts

export interface TitleStyleOption {
  value: string;
  label: string;
  description: string;
  emoji: string;
}

export const titleStyleOptions: TitleStyleOption[] = [
  {
    value: "clickbait",
    label: "Clickbait",
    description: "Bikin penasaran, heboh, susah buat di-skip",
    emoji: "🔥",
  },
  {
    value: "authentic",
    label: "Autentik",
    description: "Jujur & apa adanya, sesuai isi konten",
    emoji: "🤝",
  },
  {
    value: "question",
    label: "Pertanyaan",
    description: "Bentuk pertanyaan yang relate ke audiens",
    emoji: "❓",
  },
  {
    value: "casual",
    label: "Santai",
    description: "Ngobrol kasual, kayak ngomong ke temen",
    emoji: "💬",
  },
  {
    value: "dramatic",
    label: "Dramatis",
    description: "Emosional & story telling, bikin penasaran",
    emoji: "🎭",
  },
  {
    value: "seo",
    label: "SEO Friendly",
    description: "Fokus keyword, gampang ketemu di pencarian",
    emoji: "🎯",
  },
];

export type TitleStyle = (typeof titleStyleOptions)[number]["value"];