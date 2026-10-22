import {
  ALLOWED_OUTPUT_LANGUAGES,
  DEFAULT_OUTPUT_LANGUAGE,
  type OutputLanguage,
} from "@/constants/languages";

/**
 * Human-readable language names for explicit prompt injection.
 */
export const LANGUAGE_DISPLAY_NAMES: Record<OutputLanguage, string> = {
  auto: "Auto-detect",
  en: "English",
  id: "Indonesian (Bahasa Indonesia)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  pt: "Portuguese (Português)",
  ja: "Japanese (日本語)",
  ko: "Korean (한국어)",
};

/**
 * Sanitizes and validates an unknown outputLanguage value against the allowlist.
 * If missing, invalid, or unrecognized, safely returns the default "auto".
 */
export function sanitizeOutputLanguage(val: unknown): OutputLanguage {
  if (
    typeof val === "string" &&
    ALLOWED_OUTPUT_LANGUAGES.has(val as OutputLanguage)
  ) {
    return val as OutputLanguage;
  }
  return DEFAULT_OUTPUT_LANGUAGE;
}

/**
 * Generates clear, unambiguous, high-priority language instructions to be appended
 * directly into the AI system prompt.
 *
 * Rules implemented:
 * 1. Auto-detect mode: detects dominant language of the user's natural-language brief/details.
 *    If input lacks a reliable natural language signal (e.g., only product name, SKU, or image),
 *    it defaults strictly to English.
 * 2. Explicit mode: explicitly overrides any input language (e.g., Indonesian input with English selected
 *    must produce English output).
 * 3. Proper nouns, brand names, product names, and SKUs are preserved unchanged.
 * 4. Ensures 100% of the output (including any CTAs or formatting) is in the target language.
 */
export function getLanguageInstruction(language: OutputLanguage = "auto"): string {
  if (language === "auto") {
    return [
      "OUTPUT LANGUAGE INSTRUCTION (CRITICAL - HIGHEST PRIORITY):",
      "1. Automatic Language Detection:",
      "   - Detect the dominant natural language used in the user's input (product details, concept, idea, or description).",
      "   - Generate the ENTIRE output strictly and fluently in that detected language.",
      "2. Fallback Rule:",
      "   - If the input consists only of an isolated brand/product name, technical specifications/SKUs, image-only references, or lacks a reliable language signal, you MUST fallback to English.",
      "3. Proper Nouns:",
      "   - Keep brand names, product titles, model numbers, and universal proper nouns unchanged where appropriate.",
      "4. Completeness:",
      "   - Every sentence, word, phrase, and call-to-action in the output must follow the detected language.",
    ].join("\n");
  }

  const targetName = LANGUAGE_DISPLAY_NAMES[language] || "English";

  return [
    "OUTPUT LANGUAGE INSTRUCTION (CRITICAL - HIGHEST PRIORITY):",
    `1. Target Language: ${targetName}.`,
    `2. Strict Override: The user has explicitly selected ${targetName} as the desired output language.`,
    `   - You MUST produce 100% of the generated output in ${targetName}, REGARDLESS of the language the user used in their input.`,
    `   - Example: If the user writes details in Indonesian but has selected English, your output MUST be in fluent English.`,
    "3. Proper Nouns:",
    "   - Keep brand names, product names, model numbers, and universal proper nouns unchanged where appropriate.",
    "4. Completeness:",
    `   - Every sentence, word, phrase, hook, title, and call-to-action in the output must be strictly in ${targetName}.`,
  ].join("\n");
}
