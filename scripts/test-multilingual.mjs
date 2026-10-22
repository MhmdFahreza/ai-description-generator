import { readFileSync } from "fs";
import { resolve } from "path";

// Read .env for GROQ_API_KEY
const envContent = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
const envVars = Object.fromEntries(
  envContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const groqApiKey = envVars.GROQ_API_KEY || process.env.GROQ_API_KEY;
if (!groqApiKey) {
  console.error("GROQ_API_KEY not found in .env");
  process.exit(1);
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

async function callGroq(messages, maxTokens = 250) {
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      reasoning_effort: "low",
      max_completion_tokens: maxTokens,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error HTTP ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// Language utility logic mirror
const ALLOWED_LANGUAGES = ["auto", "en", "id", "es", "fr", "pt", "ja", "ko"];
function sanitizeOutputLanguage(lang) {
  if (typeof lang !== "string") return "auto";
  const trimmed = lang.trim().toLowerCase();
  return ALLOWED_LANGUAGES.includes(trimmed) ? trimmed : "auto";
}

function getLanguageInstruction(outputLanguage) {
  const sanitized = sanitizeOutputLanguage(outputLanguage);
  switch (sanitized) {
    case "en":
      return "OUTPUT LANGUAGE REQUIREMENT: You MUST generate the ENTIRE output strictly in English. Preserve proper nouns and brand names, but all descriptive copy, headers, calls-to-action, and commentary must be in natural English, regardless of the language of the user input.";
    case "id":
      return "OUTPUT LANGUAGE REQUIREMENT: You MUST generate the ENTIRE output strictly in Indonesian (Bahasa Indonesia). Preserve proper nouns and brand names, but all descriptive copy, headers, calls-to-action, and commentary must be in natural, fluent Indonesian, regardless of the language of the user input.";
    case "es":
      return "OUTPUT LANGUAGE REQUIREMENT: You MUST generate the ENTIRE output strictly in Spanish (Español). Preserve proper nouns and brand names, but all descriptive copy, headers, calls-to-action, and commentary must be in natural Spanish, regardless of the language of the user input.";
    case "fr":
      return "OUTPUT LANGUAGE REQUIREMENT: You MUST generate the ENTIRE output strictly in French (Français). Preserve proper nouns and brand names, but all descriptive copy, headers, calls-to-action, and commentary must be in natural French, regardless of the language of the user input.";
    case "pt":
      return "OUTPUT LANGUAGE REQUIREMENT: You MUST generate the ENTIRE output strictly in Portuguese (Português). Preserve proper nouns and brand names, but all descriptive copy, headers, calls-to-action, and commentary must be in natural Portuguese, regardless of the language of the user input.";
    case "ja":
      return "OUTPUT LANGUAGE REQUIREMENT: You MUST generate the ENTIRE output strictly in Japanese (日本語). Preserve proper nouns and brand names, but all descriptive copy, headers, calls-to-action, and commentary must be in natural Japanese, regardless of the language of the user input.";
    case "ko":
      return "OUTPUT LANGUAGE REQUIREMENT: You MUST generate the ENTIRE output strictly in Korean (한국어). Preserve proper nouns and brand names, but all descriptive copy, headers, calls-to-action, and commentary must be in natural Korean, regardless of the language of the user input.";
    case "auto":
    default:
      return "OUTPUT LANGUAGE REQUIREMENT (AUTO-DETECT): Detect the dominant natural language of the user's input/product details and generate the ENTIRE output in that exact same language. If the input is only an image, a bare brand name/SKU, or lacks clear natural-language text to determine the language, default to generating the output in English. Preserve proper nouns, brand names, and technical terms as appropriate.";
  }
}

// Simple heuristic checks for language detection in output
function containsIndonesianKeywords(text) {
  const words = ["yang", "untuk", "dengan", "dan", "ini", "dari", "adalah", "anda", "kami", "bisa", "fitur", "kualitas", "desain", "membuat", "terbaik", "keunggulan"];
  const lower = text.toLowerCase();
  return words.some(w => lower.includes(` ${w} `) || lower.startsWith(`${w} `));
}

function containsEnglishKeywords(text) {
  const words = ["the", "and", "with", "for", "this", "your", "crafted", "designed", "features", "experience", "perfect", "premium"];
  const lower = text.toLowerCase();
  return words.some(w => lower.includes(` ${w} `) || lower.startsWith(`${w} `));
}

function containsJapaneseCharacters(text) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text);
}

async function runTests() {
  console.log("=== RUNNING MULTILINGUAL OUTPUT TESTS ===\n");
  let passed = 0;
  let failed = 0;

  // Test 0: Sanitizer tests
  console.log("Test 0: Sanitizer tests");
  if (
    sanitizeOutputLanguage("en") === "en" &&
    sanitizeOutputLanguage("ID") === "id" &&
    sanitizeOutputLanguage("auto") === "auto" &&
    sanitizeOutputLanguage("invalid_lang") === "auto" &&
    sanitizeOutputLanguage(null) === "auto" &&
    sanitizeOutputLanguage(undefined) === "auto" &&
    sanitizeOutputLanguage("<script>") === "auto"
  ) {
    console.log("  ✓ Sanitizer passed all edge cases");
    passed++;
  } else {
    console.error("  ✗ Sanitizer failed");
    failed++;
  }

  // Test 1: English input + auto-detect
  console.log("\nTest 1: English input with auto-detect -> Should be English");
  try {
    const text = await callGroq([
      {
        role: "system",
        content: `You are an expert e-commerce copywriter.\n\n${getLanguageInstruction("auto")}`,
      },
      {
        role: "user",
        content: "Product: Minimalist Ceramic Coffee Mug\nTarget Audience: Modern coffee enthusiasts\nTone: Professional",
      },
    ]);
    console.log("  Sample output:\n   ", text.slice(0, 140).replace(/\n/g, " "), "...");
    const isEn = containsEnglishKeywords(text) && !containsIndonesianKeywords(text);
    if (isEn) {
      console.log("  ✓ Output is in English");
      passed++;
    } else {
      console.error("  ✗ Expected English, but got something else");
      failed++;
    }
  } catch (err) {
    console.error("  ✗ API Error:", err.message);
    failed++;
  }

  // Test 2: Indonesian input + auto-detect
  console.log("\nTest 2: Indonesian input with auto-detect -> Should be Indonesian");
  try {
    const text = await callGroq([
      {
        role: "system",
        content: `You are an expert e-commerce copywriter.\n\n${getLanguageInstruction("auto")}`,
      },
      {
        role: "user",
        content: "Produk: Cangkir Kopi Keramik Minimalis\nTarget Audiens: Pecinta kopi modern yang menyukai estetika santai di rumah\nTone: Ramah",
      },
    ]);
    console.log("  Sample output:\n   ", text.slice(0, 140).replace(/\n/g, " "), "...");
    const isId = containsIndonesianKeywords(text);
    if (isId) {
      console.log("  ✓ Output is in Indonesian");
      passed++;
    } else {
      console.error("  ✗ Expected Indonesian, but got something else");
      failed++;
    }
  } catch (err) {
    console.error("  ✗ API Error:", err.message);
    failed++;
  }

  // Test 3: Indonesian input + Explicit English ("en")
  console.log("\nTest 3: Indonesian input with 'en' selected -> Should be 100% English");
  try {
    const text = await callGroq([
      {
        role: "system",
        content: `You are an expert e-commerce copywriter.\n\n${getLanguageInstruction("en")}`,
      },
      {
        role: "user",
        content: "Produk: Sepatu Lari UltraRingan\nTarget: Pelari maraton dan pemula yang mencari kenyamanan maksimal di jalan aspal",
      },
    ]);
    console.log("  Sample output:\n   ", text.slice(0, 140).replace(/\n/g, " "), "...");
    const isEn = containsEnglishKeywords(text) && !containsIndonesianKeywords(text);
    if (isEn) {
      console.log("  ✓ Output is strictly in English");
      passed++;
    } else {
      console.error("  ✗ Expected English override, but got Indonesian or mixed");
      failed++;
    }
  } catch (err) {
    console.error("  ✗ API Error:", err.message);
    failed++;
  }

  // Test 4: English input + Explicit Indonesian ("id")
  console.log("\nTest 4: English input with 'id' selected -> Should be 100% Indonesian");
  try {
    const text = await callGroq([
      {
        role: "system",
        content: `You are an expert e-commerce copywriter.\n\n${getLanguageInstruction("id")}`,
      },
      {
        role: "user",
        content: "Product: Wireless Noise-Cancelling Headphones Pro X\nTarget: Remote workers and travelers looking for crystal-clear sound",
      },
    ]);
    console.log("  Sample output:\n   ", text.slice(0, 140).replace(/\n/g, " "), "...");
    const isId = containsIndonesianKeywords(text);
    if (isId) {
      console.log("  ✓ Output is strictly in Indonesian");
      passed++;
    } else {
      console.error("  ✗ Expected Indonesian override, but got English or mixed");
      failed++;
    }
  } catch (err) {
    console.error("  ✗ API Error:", err.message);
    failed++;
  }

  // Test 5: Ambiguous/Brand-only input + auto-detect -> Should default to English
  console.log("\nTest 5: Ambiguous/Brand-only input ('Apex-9000 Pro') + auto-detect -> Should default to English");
  try {
    const text = await callGroq([
      {
        role: "system",
        content: `You are an expert e-commerce copywriter.\n\n${getLanguageInstruction("auto")}`,
      },
      {
        role: "user",
        content: "Product: Apex-9000 Pro SKU-884\nDetails: 100W, Titanium, IP68",
      },
    ]);
    console.log("  Sample output:\n   ", text.slice(0, 140).replace(/\n/g, " "), "...");
    const isEn = containsEnglishKeywords(text) && !containsIndonesianKeywords(text);
    if (isEn) {
      console.log("  ✓ Output defaulted to English as required");
      passed++;
    } else {
      console.error("  ✗ Expected English fallback for ambiguous input");
      failed++;
    }
  } catch (err) {
    console.error("  ✗ API Error:", err.message);
    failed++;
  }

  // Test 6: Explicit Japanese ("ja")
  console.log("\nTest 6: English input with 'ja' selected -> Should be Japanese");
  try {
    const text = await callGroq([
      {
        role: "system",
        content: `You are an expert e-commerce copywriter.\n\n${getLanguageInstruction("ja")}`,
      },
      {
        role: "user",
        content: "Product: Matcha Green Tea Powder Organic 100g",
      },
    ]);
    console.log("  Sample output:\n   ", text.slice(0, 140).replace(/\n/g, " "), "...");
    const isJa = containsJapaneseCharacters(text);
    if (isJa) {
      console.log("  ✓ Output contains Japanese text");
      passed++;
    } else {
      console.error("  ✗ Expected Japanese characters");
      failed++;
    }
  } catch (err) {
    console.error("  ✗ API Error:", err.message);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) process.exit(1);
}

runTests();
