/**
 * Server-side rate limiter — in-memory sliding-window counter.
 *
 * Strategi: rate limit di-enforce berdasarkan DUA key sekaligus:
 *   1. IP address  — tangkap abuse dari IP yang sama
 *   2. Fingerprint — tangkap abuse kalau user ganti IP (VPN, hotspot lain, dll.)
 *
 * Kalau salah satu key kena limit, request ditolak.
 *
 * Limit default:
 *   - Per menit : 5 generate
 *   - Per hari  : 10 generate
 *
 * NOTE: In-memory store hilang kalau server restart. Untuk production
 * scale (multi-instance), ganti store ini dengan Redis/Upstash.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WindowEntry {
  /** Timestamps (ms) of each successful request within the window */
  timestamps: number[];
}

interface RateLimitResult {
  allowed: boolean;
  /** Sisa quota per menit */
  remainingMinute: number;
  /** Sisa quota per hari */
  remainingDaily: number;
  /** Detik sampai window per-menit reset (berguna buat header Retry-After) */
  retryAfterSeconds: number;
  /** Pesan error kalau ditolak */
  message?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MINUTE_WINDOW_MS = 60 * 1000; // 1 menit
const DAY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 jam
const MAX_PER_MINUTE = 5;
const MAX_PER_DAY = 10;

// Auto-cleanup interval — hapus entry yang sudah expired tiap 10 menit
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

// ---------------------------------------------------------------------------
// Store (module-level singleton, hidup selama proses Node berjalan)
// ---------------------------------------------------------------------------

const store = new Map<string, WindowEntry>();

// Periodic cleanup supaya memory gak membengkak
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanupTimer() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      // Buang timestamps yang sudah di luar window harian
      entry.timestamps = entry.timestamps.filter(
        (ts) => now - ts < DAY_WINDOW_MS
      );
      // Kalau sudah kosong, hapus entry-nya
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Jangan block proses Node dari exit
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}


/**
 * Jalankan rate-limit check untuk satu atau dua key sekaligus.
 * Kalau salah satu key kena limit, request ditolak.
 */
export function rateLimit(keys: string[]): RateLimitResult {
  const now = Date.now();

  // Cek semua key dulu TANPA merecord — biar kalau satu key kena limit,
  // key lainnya gak ikut ke-record (atomic check).
  const checks = keys.map((key) => {
    const entry = store.get(key);
    const timestamps = entry
      ? entry.timestamps.filter((ts) => now - ts < DAY_WINDOW_MS)
      : [];
    const minuteTimestamps = timestamps.filter(
      (ts) => now - ts < MINUTE_WINDOW_MS
    );
    return {
      key,
      countMinute: minuteTimestamps.length,
      countDaily: timestamps.length,
      oldestInMinute:
        minuteTimestamps.length > 0 ? minuteTimestamps[0] : null,
    };
  });

  // Cari apakah ada key yang kena limit
  for (const check of checks) {
    if (check.countMinute >= MAX_PER_MINUTE) {
      const retryAfter = check.oldestInMinute
        ? Math.ceil((MINUTE_WINDOW_MS - (now - check.oldestInMinute)) / 1000)
        : 60;
      return {
        allowed: false,
        remainingMinute: 0,
        remainingDaily: Math.max(0, MAX_PER_DAY - check.countDaily),
        retryAfterSeconds: retryAfter,
        message: `Terlalu banyak request. Batas: ${MAX_PER_MINUTE} generate per menit. Coba lagi dalam ${retryAfter} detik.`,
      };
    }
    if (check.countDaily >= MAX_PER_DAY) {
      return {
        allowed: false,
        remainingMinute: 0,
        remainingDaily: 0,
        retryAfterSeconds: 0,
        message: `Kamu sudah mencapai batas harian (${MAX_PER_DAY} generate per hari). Coba lagi besok ya!`,
      };
    }
  }

  // Semua key aman — record di semua key
  for (const key of keys) {
    ensureCleanupTimer();
    let entry = store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }
    // Bersihkan expired sebelum push
    entry.timestamps = entry.timestamps.filter(
      (ts) => now - ts < DAY_WINDOW_MS
    );
    entry.timestamps.push(now);
  }

  // Hitung remaining dari key yang paling "terisi"
  const worstMinute = Math.max(...checks.map((c) => c.countMinute));
  const worstDaily = Math.max(...checks.map((c) => c.countDaily));

  return {
    allowed: true,
    remainingMinute: MAX_PER_MINUTE - worstMinute - 1,
    remainingDaily: MAX_PER_DAY - worstDaily - 1,
    retryAfterSeconds: 0,
  };
}

/**
 * Cek sisa kuota tanpa mencatat (tidak increment).
 */
export function checkRateLimit(keys: string[]): RateLimitResult {
  const now = Date.now();

  const checks = keys.map((key) => {
    const entry = store.get(key);
    const timestamps = entry
      ? entry.timestamps.filter((ts) => now - ts < DAY_WINDOW_MS)
      : [];
    const minuteTimestamps = timestamps.filter(
      (ts) => now - ts < MINUTE_WINDOW_MS
    );
    return {
      key,
      countMinute: minuteTimestamps.length,
      countDaily: timestamps.length,
      oldestInMinute:
        minuteTimestamps.length > 0 ? minuteTimestamps[0] : null,
    };
  });

  for (const check of checks) {
    if (check.countMinute >= MAX_PER_MINUTE) {
      const retryAfter = check.oldestInMinute
        ? Math.ceil((MINUTE_WINDOW_MS - (now - check.oldestInMinute)) / 1000)
        : 60;
      return {
        allowed: false,
        remainingMinute: 0,
        remainingDaily: Math.max(0, MAX_PER_DAY - check.countDaily),
        retryAfterSeconds: retryAfter,
      };
    }
    if (check.countDaily >= MAX_PER_DAY) {
      return {
        allowed: false,
        remainingMinute: 0,
        remainingDaily: 0,
        retryAfterSeconds: 0,
      };
    }
  }

  const worstMinute = Math.max(...checks.map((c) => c.countMinute));
  const worstDaily = Math.max(...checks.map((c) => c.countDaily));

  return {
    allowed: true,
    remainingMinute: MAX_PER_MINUTE - worstMinute,
    remainingDaily: MAX_PER_DAY - worstDaily,
    retryAfterSeconds: 0,
  };
}

export { MAX_PER_MINUTE, MAX_PER_DAY };
