/**
 * Input validation untuk semua API generate endpoint.
 *
 * Layer ini memastikan:
 *   1. Content-Type harus application/json
 *   2. Body bisa di-parse sebagai JSON
 *   3. Setiap field string dicek: max length, tidak kosong, tidak spam/gibberish
 *   4. Field pilihan (tone, style, platform, dll.) dicek terhadap whitelist
 *   5. Anti-abuse: deteksi repetisi karakter berlebihan dan pola bot
 */

import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Batas panjang field input (dalam karakter) */
const MAX_FIELD_LENGTHS: Record<string, number> = {
  productName: 150,
  idea: 1000,
  concept: 1000,
  description: 1000,
  topic: 200,
  tone: 30,
  style: 30,
  styleLabel: 100,
  styleDescription: 300,
  platform: 30,
  businessType: 30,
  businessModel: 30,
};

/** Default max kalau field gak ada di daftar atas */
const DEFAULT_MAX_LENGTH = 500;

/** Whitelist untuk field enum/pilihan */
const ALLOWED_VALUES: Record<string, Set<string>> = {
  tone: new Set([
    "casual", "formal", "persuasive", "professional", "playful", "urgent",
  ]),
  style: new Set([
    // Advertisement styles
    "formal", "casual", "persuasive", "humorous", "luxurious", "emotional",
    // Hook styles
    "question", "controversial", "stat-fact", "storytelling",
    "problem-agitate", "curiosity-gap",
    // Title styles — dari client, bisa apa aja karena lookup dari constants
    // jadi kita izinkan kalau ada di sini, tapi gak reject kalau gak ada
    // (karena title-generator pakai styleLabel/styleDescription dari client)
  ]),
  platform: new Set([
    "general", "tiktok", "reels", "shorts",
    "instagram", "facebook", "twitter", "youtube", "linkedin",
  ]),
  businessType: new Set([
    "fashion", "electronics", "food", "beauty", "health",
    "home", "automotive", "hobby", "services", "other",
  ]),
  businessModel: new Set([
    "b2c", "b2b", "c2c", "d2c", "b2b2c",
  ]),
};

// ---------------------------------------------------------------------------
// Regex patterns untuk abuse detection
// ---------------------------------------------------------------------------

/** Karakter yang diulang berlebihan (>= 5x berturut-turut) */
const REPEATED_CHAR_RE = /(.)\1{4,}/;

/** Baris kosong berturut-turut yang terlalu banyak */
const EXCESSIVE_NEWLINES_RE = /\n{5,}/;

/**
 * Pola "prompt injection" umum — bukan bulletproof, tapi mengurangi
 * percobaan manipulasi paling kasual.
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts?)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /disregard\s+(all|your|the)\s+(previous|above)/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /<\|im_start\|>/i,
];

/**
 * URL / link detection — gak perlu ada URL di input generate.
 * Bisa jadi spam/phishing attempt.
 */
const URL_PATTERN = /https?:\/\/\S+/i;

/** Email pattern */
const EMAIL_PATTERN = /[\w.-]+@[\w.-]+\.\w+/;

// ---------------------------------------------------------------------------
// Validation functions
// ---------------------------------------------------------------------------

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validasi satu field string.
 */
function validateStringField(
  fieldName: string,
  value: unknown,
  required: boolean
): ValidationError | null {
  // Kalau gak required dan gak ada / kosong, skip
  if (value === undefined || value === null || value === "") {
    if (required) {
      return { field: fieldName, message: `${fieldName} wajib diisi.` };
    }
    return null;
  }

  // Harus string
  if (typeof value !== "string") {
    return { field: fieldName, message: `${fieldName} harus berupa teks.` };
  }

  const trimmed = value.trim();

  if (required && trimmed.length === 0) {
    return { field: fieldName, message: `${fieldName} tidak boleh kosong.` };
  }

  // Max length
  const maxLen = MAX_FIELD_LENGTHS[fieldName] ?? DEFAULT_MAX_LENGTH;
  if (trimmed.length > maxLen) {
    return {
      field: fieldName,
      message: `${fieldName} terlalu panjang (maks ${maxLen} karakter).`,
    };
  }

  // Cek whitelist untuk field enum
  if (ALLOWED_VALUES[fieldName] && trimmed.length > 0) {
    if (!ALLOWED_VALUES[fieldName].has(trimmed)) {
      // Untuk style di title-generator, value bisa custom — jadi kita
      // gak reject tapi tetap cap length-nya saja
      if (fieldName === "style") {
        // Allow custom styles tapi batasi panjang (sudah dicek di atas)
        return null;
      }
      return {
        field: fieldName,
        message: `Nilai "${trimmed}" tidak valid untuk ${fieldName}.`,
      };
    }
  }

  return null;
}

/**
 * Cek pola abuse/spam pada free-text fields.
 */
function checkAbuse(fieldName: string, value: string): ValidationError | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  // Repeated characters
  if (REPEATED_CHAR_RE.test(trimmed)) {
    return {
      field: fieldName,
      message: `${fieldName} mengandung karakter yang diulang berlebihan.`,
    };
  }

  // Excessive newlines
  if (EXCESSIVE_NEWLINES_RE.test(trimmed)) {
    return {
      field: fieldName,
      message: `${fieldName} mengandung terlalu banyak baris kosong.`,
    };
  }

  // Prompt injection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        field: fieldName,
        message: `${fieldName} mengandung pola yang tidak diizinkan.`,
      };
    }
  }

  // URL (gak perlu ada di input generate)
  if (URL_PATTERN.test(trimmed)) {
    return {
      field: fieldName,
      message: `${fieldName} tidak boleh mengandung URL/link.`,
    };
  }

  // Email
  if (EMAIL_PATTERN.test(trimmed)) {
    return {
      field: fieldName,
      message: `${fieldName} tidak boleh mengandung alamat email.`,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Schema-based validation
// ---------------------------------------------------------------------------

export interface FieldSchema {
  /** Nama field di body JSON */
  name: string;
  /** Apakah field ini wajib */
  required: boolean;
  /** Apakah field ini free-text (perlu abuse check) */
  freeText?: boolean;
}

/**
 * Validasi Content-Type header.
 */
export function validateContentType(req: NextRequest): NextResponse | null {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type harus application/json." },
      { status: 415 }
    );
  }
  return null;
}

/**
 * Parse body JSON dengan error handling.
 */
export async function parseBody(
  req: NextRequest
): Promise<Record<string, unknown> | NextResponse> {
  try {
    const body = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Body harus berupa JSON object." },
        { status: 400 }
      );
    }
    return body as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Body request tidak valid (bukan JSON)." },
      { status: 400 }
    );
  }
}

/**
 * Validasi body terhadap schema field-by-field.
 *
 * @returns `null` kalau valid, atau `NextResponse` error kalau ada masalah.
 */
export function validateFields(
  body: Record<string, unknown>,
  schema: FieldSchema[]
): NextResponse | null {
  // Cek apakah body punya field yang gak ada di schema (bisa jadi injection attempt)
  const allowedFields = new Set(schema.map((s) => s.name));
  const extraFields = Object.keys(body).filter((k) => !allowedFields.has(k));
  if (extraFields.length > 0) {
    return NextResponse.json(
      { error: `Field tidak dikenal: ${extraFields.join(", ")}` },
      { status: 400 }
    );
  }

  for (const field of schema) {
    const value = body[field.name];

    // Basic validation
    const basicError = validateStringField(field.name, value, field.required);
    if (basicError) {
      return NextResponse.json(
        { error: basicError.message },
        { status: 400 }
      );
    }

    // Abuse check untuk free-text fields
    if (field.freeText && typeof value === "string" && value.trim().length > 0) {
      const abuseError = checkAbuse(field.name, value);
      if (abuseError) {
        return NextResponse.json(
          { error: abuseError.message },
          { status: 400 }
        );
      }
    }
  }

  return null;
}
