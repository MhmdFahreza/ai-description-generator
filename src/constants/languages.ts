export type OutputLanguage =
  | "auto"
  | "en"
  | "id"
  | "es"
  | "fr"
  | "pt"
  | "ja"
  | "ko";

export interface LanguageOption {
  value: OutputLanguage;
  label: string;
  nativeLabel: string;
}

export const DEFAULT_OUTPUT_LANGUAGE: OutputLanguage = "auto";

export const outputLanguageOptions: LanguageOption[] = [
  { value: "auto", label: "Auto-detect (Language of your input)", nativeLabel: "Auto-detect" },
  { value: "en", label: "English", nativeLabel: "English" },
  { value: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia" },
  { value: "es", label: "Spanish", nativeLabel: "Español" },
  { value: "fr", label: "French", nativeLabel: "Français" },
  { value: "pt", label: "Portuguese", nativeLabel: "Português" },
  { value: "ja", label: "Japanese", nativeLabel: "日本語" },
  { value: "ko", label: "Korean", nativeLabel: "한국어" },
];

export const ALLOWED_OUTPUT_LANGUAGES = new Set<OutputLanguage>([
  "auto",
  "en",
  "id",
  "es",
  "fr",
  "pt",
  "ja",
  "ko",
]);
