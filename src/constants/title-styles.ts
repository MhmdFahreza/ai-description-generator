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
    description: "Curiosity-driven, hard to skip",
    emoji: "🔥",
  },
  {
    value: "authentic",
    label: "Authentic",
    description: "Honest & straightforward, true to the content",
    emoji: "🤝",
  },
  {
    value: "question",
    label: "Question",
    description: "A question that resonates with the audience",
    emoji: "❓",
  },
  {
    value: "casual",
    label: "Casual",
    description: "Laid-back, like talking to a friend",
    emoji: "💬",
  },
  {
    value: "dramatic",
    label: "Dramatic",
    description: "Emotional & storytelling, builds suspense",
    emoji: "🎭",
  },
  {
    value: "seo",
    label: "SEO Friendly",
    description: "Keyword-focused, easy to find in search",
    emoji: "🎯",
  },
];

export type TitleStyle = (typeof titleStyleOptions)[number]["value"];