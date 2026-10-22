/**
 * Unit tests: output-language.ts
 *
 * Covers:
 *  - sanitizeOutputLanguage – valid codes, unknown codes, edge cases
 *  - getLanguageInstruction – auto mode, explicit modes, content assertions
 */

import { describe, it, expect } from "vitest";
import {
  sanitizeOutputLanguage,
  getLanguageInstruction,
} from "@/lib/output-language";

// ---------------------------------------------------------------------------
// sanitizeOutputLanguage
// ---------------------------------------------------------------------------

describe("sanitizeOutputLanguage", () => {
  it("returns 'auto' for undefined", () => {
    expect(sanitizeOutputLanguage(undefined)).toBe("auto");
  });

  it("returns 'auto' for null", () => {
    expect(sanitizeOutputLanguage(null)).toBe("auto");
  });

  it("returns 'auto' for empty string", () => {
    expect(sanitizeOutputLanguage("")).toBe("auto");
  });

  it("returns 'auto' for unknown language code", () => {
    expect(sanitizeOutputLanguage("zh")).toBe("auto");
    expect(sanitizeOutputLanguage("de")).toBe("auto");
    expect(sanitizeOutputLanguage("ENGLISH")).toBe("auto");
  });

  it("returns 'auto' for non-string values", () => {
    expect(sanitizeOutputLanguage(42)).toBe("auto");
    expect(sanitizeOutputLanguage(true)).toBe("auto");
    expect(sanitizeOutputLanguage({})).toBe("auto");
  });

  const validCodes = ["auto", "en", "id", "es", "fr", "pt", "ja", "ko"] as const;

  for (const code of validCodes) {
    it(`accepts valid code "${code}"`, () => {
      expect(sanitizeOutputLanguage(code)).toBe(code);
    });
  }
});

// ---------------------------------------------------------------------------
// getLanguageInstruction
// ---------------------------------------------------------------------------

describe("getLanguageInstruction – auto mode", () => {
  it("contains 'CRITICAL' priority marker", () => {
    const inst = getLanguageInstruction("auto");
    expect(inst).toContain("CRITICAL");
  });

  it("mentions auto-detection", () => {
    const inst = getLanguageInstruction("auto");
    expect(inst.toLowerCase()).toContain("detect");
  });

  it("mentions English as fallback when input has no language signal", () => {
    const inst = getLanguageInstruction("auto");
    expect(inst).toContain("English");
  });

  it("returns consistent value when called without arguments", () => {
    expect(getLanguageInstruction()).toBe(getLanguageInstruction("auto"));
  });
});

describe("getLanguageInstruction – explicit languages", () => {
  const cases: Array<[string, string]> = [
    ["en", "English"],
    ["id", "Indonesian"],
    ["es", "Spanish"],
    ["fr", "French"],
    ["pt", "Portuguese"],
    ["ja", "Japanese"],
    ["ko", "Korean"],
  ];

  for (const [code, expectedName] of cases) {
    it(`includes target language name for "${code}"`, () => {
      const inst = getLanguageInstruction(code as never);
      expect(inst).toContain(expectedName);
    });

    it(`mentions strict override for "${code}"`, () => {
      const inst = getLanguageInstruction(code as never);
      expect(inst.toLowerCase()).toMatch(/strict|override|must/);
    });

    it(`different from auto-detect for "${code}"`, () => {
      expect(getLanguageInstruction(code as never)).not.toBe(
        getLanguageInstruction("auto")
      );
    });
  }

  it("mentions cross-language override scenario", () => {
    const inst = getLanguageInstruction("en");
    // Should mention that even if user writes in another language, output must be in target
    expect(inst).toContain("English");
  });
});

describe("getLanguageInstruction – output completeness", () => {
  it("mentions proper nouns preservation", () => {
    const inst = getLanguageInstruction("en");
    expect(inst.toLowerCase()).toContain("proper noun");
  });

  it("mentions 100% completeness requirement", () => {
    const inst = getLanguageInstruction("ko");
    expect(inst).toContain("100%");
  });
});
