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
    description: "Professional & trustworthy, great for B2B or serious brands",
    emoji: "💼",
  },
  {
    value: "casual",
    label: "Casual",
    description: "Friendly and light, like talking to a friend",
    emoji: "💬",
  },
  {
    value: "persuasive",
    label: "Persuasive",
    description: "Action-driven, emphasizes benefits & urgency",
    emoji: "🎯",
  },
  {
    value: "humorous",
    label: "Humorous",
    description: "Fun & playful, makes people smile while reading",
    emoji: "😄",
  },
  {
    value: "luxurious",
    label: "Luxurious",
    description: "Elegant & exclusive, premium feel",
    emoji: "✨",
  },
  {
    value: "emotional",
    label: "Emotional",
    description: "Touches feelings, builds a personal connection",
    emoji: "❤️",
  },
];

export type AdStyle = (typeof adStyleOptions)[number]["value"];