export type ToneOption = {
  value: string;
  label: string;
};

export const toneOptions: ToneOption[] = [
  { value: "casual", label: "Santai (Casual)" },
  { value: "formal", label: "Formal / Resmi" },
  { value: "persuasive", label: "Persuasif" },
  { value: "professional", label: "Profesional" },
  { value: "friendly", label: "Ramah" },
  { value: "luxury", label: "Mewah / Elegan" },
  { value: "playful", label: "Playful / Fun" },
  { value: "urgent", label: "Mendesak / Promo" },
];