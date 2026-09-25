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
    label: "Question",
    description: "Open with a question that resonates with the audience's pain point",
    emoji: "❓",
  },
  {
    value: "controversial",
    label: "Controversial",
    description: "A bold or counter-intuitive statement that stops the scroll",
    emoji: "⚡",
  },
  {
    value: "stat-fact",
    label: "Stat & Fact",
    description: "A surprising number or fact right at the start",
    emoji: "📊",
  },
  {
    value: "storytelling",
    label: "Storytelling",
    description: "Open with a snippet of a story or personal experience",
    emoji: "📖",
  },
  {
    value: "problem-agitate",
    label: "Problem-Agitate",
    description: "Highlight a problem the audience faces in a relatable way",
    emoji: "🎯",
  },
  {
    value: "curiosity-gap",
    label: "Curiosity Gap",
    description: "Give partial info to make them want to know the rest",
    emoji: "🌀",
  },
];

export type HookStyle = (typeof hookStyleOptions)[number]["value"];