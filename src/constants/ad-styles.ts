// src/constants/ad-styles.ts

export interface AdStyleOption {
  value: string;
  label: string;
  description: string;
  emoji: string;
}

export const adStyleOptions: AdStyleOption[] = [
  {
    value: "formal",
    label: "Formal",
    description: "Profesional & terpercaya, cocok untuk B2B atau brand serius",
    emoji: "💼",
  },
  {
    value: "casual",
    label: "Santai",
    description: "Ngobrol kayak ke temen, ringan & gampang dicerna",
    emoji: "💬",
  },
  {
    value: "persuasive",
    label: "Persuasif",
    description: "Fokus dorong action, tekankan benefit & urgensi",
    emoji: "🎯",
  },
  {
    value: "humorous",
    label: "Humoris",
    description: "Lucu & ringan, bikin orang senyum sambil baca",
    emoji: "😄",
  },
  {
    value: "luxurious",
    label: "Mewah",
    description: "Elegan & eksklusif, kesan premium",
    emoji: "✨",
  },
  {
    value: "emotional",
    label: "Emosional",
    description: "Sentuh perasaan, bangun koneksi personal",
    emoji: "❤️",
  },
];

export type AdStyle = (typeof adStyleOptions)[number]["value"];