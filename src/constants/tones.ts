export type ToneOption = {
  value: string;
  label: string;
};

export const toneOptions: ToneOption[] = [
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "persuasive", label: "Persuasive" },
  { value: "professional", label: "Professional" },
  { value: "playful", label: "Playful" },
  { value: "urgent", label: "Promotional" },
];