// src/constants/hook-styles.ts

export interface HookStyleOption {
  value: string;
  label: string;
  description: string;
  emoji: string;
}

export const hookStyleOptions: HookStyleOption[] = [
  {
    value: "question",
    label: "Pertanyaan",
    description: "Buka dengan pertanyaan yang relate ke masalah audiens",
    emoji: "❓",
  },
  {
    value: "controversial",
    label: "Kontroversial",
    description: "Pernyataan berani/anti-mainstream yang bikin berhenti scroll",
    emoji: "⚡",
  },
  {
    value: "stat-fact",
    label: "Statistik & Fakta",
    description: "Angka atau fakta mengejutkan di awal",
    emoji: "📊",
  },
  {
    value: "storytelling",
    label: "Storytelling",
    description: "Buka dengan potongan cerita/pengalaman personal",
    emoji: "📖",
  },
  {
    value: "problem-agitate",
    label: "Problem-Agitate",
    description: "Highlight masalah yang dialami audiens, bikin mereka relate",
    emoji: "🎯",
  },
  {
    value: "curiosity-gap",
    label: "Curiosity Gap",
    description: "Kasih info setengah, bikin penasaran sama kelanjutannya",
    emoji: "🌀",
  },
];

export type HookStyle = (typeof hookStyleOptions)[number]["value"];