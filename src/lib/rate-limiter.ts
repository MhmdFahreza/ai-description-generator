/**
 * rate-limiter.ts — Server-side rate limiting berbasis Upstash Redis.
 *
 * Strategi identitas (layer bertingkat):
 *   1. Cookie anonim HttpOnly  — identitas utama, dikelola server
 *   2. IP address              — fallback + perlindungan burst tambahan
 *
 * Dua jenis pembatasan yang terpisah:
 *   A. Kuota harian global     : 10 generate per 24 jam (sliding window)
 *                                  Key: quota:{visitorId}
 *   B. Burst protection per IP : 5 generate per menit (fixed window)
 *                                  Key: burst:{ip}
 *
 * Kuota harian menggunakan SATU counter global untuk semua 7 generator.
 * Refresh halaman, clear sessionStorage, atau manipulasi JS tidak mereset kuota
 * karena state tersimpan di Redis (server-side).
 *
 * Algoritma: Sliding Window (kuota harian) + Fixed Window (burst per IP).
 *
 * Rolling 24 hours: Window dihitung dari request pertama, bukan reset tengah malam.
 * Contoh: generate pertama jam 14:00 → kuota reset jam 14:00 keesokan harinya.
 *
 * Keterbatasan identitas anonim:
 *   - Tanpa akun/login, penyalahgunaan via penghapusan cookie atau VPN/IP rotation
 *     tidak dapat dicegah sepenuhnya.
 *   - Cookie HttpOnly mencegah manipulasi JavaScript, namun user bisa clear cookie
 *     via browser settings. Saat itu, cookie baru dibuat → kuota baru dari IP baru.
 *   - IP-based burst protection menambah lapisan perlindungan tambahan.
 *
 * Fallback development (in-memory):
 *   Jika UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN tidak dikonfigurasi,
 *   sistem menggunakan in-memory store sebagai fallback. Fallback ini:
 *   - HANYA cocok untuk development lokal
 *   - Tidak berbagi state antar proses/instance
 *   - Akan hilang saat server restart
 *   - TIDAK aman untuk production
 *
 * Production behavior:
 *   Jika Redis gagal (timeout, error koneksi) saat production, endpoint AI
 *   mengembalikan 503 Service Unavailable untuk mencegah biaya AI yang tidak terkontrol.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  /** true jika request diizinkan */
  allowed: boolean;
  /** Sisa kuota harian (0 jika habis atau ditolak) */
  remainingDaily: number;
  /** Sisa burst per menit (hanya untuk burst check) */
  remainingMinute: number;
  /** Detik hingga burst window reset (untuk header Retry-After) */
  retryAfterSeconds: number;
  /** Alasan penolakan */
  reason?: "minute" | "daily";
  /** Pesan error yang user-friendly */
  message?: string;
  /** Timestamp (ms) kapan kuota harian akan reset */
  resetAt?: number;
  /** Mode yang sedang digunakan */
  mode: "redis" | "memory";
}

export interface QuotaStatus {
  limit: number;
  remaining: number;
  remainingMinute?: number;
  resetAt: number | null;
  allowed: boolean;
  reason?: "minute" | "daily";
  retryAfterSeconds: number;
  mode: "redis" | "memory";
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const MAX_PER_DAY = 10;
export const MAX_PER_MINUTE = 5;

const DAY_WINDOW_SECONDS = 24 * 60 * 60; // 86400 detik
const MINUTE_WINDOW_SECONDS = 60;

// ---------------------------------------------------------------------------
// Helper: apakah sedang di production
// ---------------------------------------------------------------------------

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

// ---------------------------------------------------------------------------
// Upstash Redis client (lazy singleton)
// ---------------------------------------------------------------------------

let _redisClient: import("@upstash/redis").Redis | null = null;
let _dailyLimiter: import("@upstash/ratelimit").Ratelimit | null = null;
let _burstLimiter: import("@upstash/ratelimit").Ratelimit | null = null;

/**
 * Menginisialisasi Upstash Redis client dan limiter.
 * Mengembalikan null jika credential belum dikonfigurasi.
 */
async function getRedisLimiters(): Promise<{
  redis: import("@upstash/redis").Redis;
  daily: import("@upstash/ratelimit").Ratelimit;
  burst: import("@upstash/ratelimit").Ratelimit;
} | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  // Lazy initialization — reuse singleton antar request
  if (_redisClient && _dailyLimiter && _burstLimiter) {
    return {
      redis: _redisClient,
      daily: _dailyLimiter,
      burst: _burstLimiter,
    };
  }

  try {
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");

    _redisClient = new Redis({ url, token });

    // Kuota harian: sliding window 24 jam, 10 request per visitor
    _dailyLimiter = new Ratelimit({
      redis: _redisClient,
      limiter: Ratelimit.slidingWindow(MAX_PER_DAY, `${DAY_WINDOW_SECONDS} s`),
      prefix: "rl:daily",
      analytics: false,
    });

    // Burst protection: fixed window 1 menit, 5 request per IP
    _burstLimiter = new Ratelimit({
      redis: _redisClient,
      limiter: Ratelimit.fixedWindow(MAX_PER_MINUTE, `${MINUTE_WINDOW_SECONDS} s`),
      prefix: "rl:burst",
      analytics: false,
    });

    return {
      redis: _redisClient,
      daily: _dailyLimiter,
      burst: _burstLimiter,
    };
  } catch (err) {
    // Jangan log credential
    console.error("[rate-limiter] Gagal menginisialisasi Upstash Redis:", err instanceof Error ? err.message : "unknown error");
    _redisClient = null;
    _dailyLimiter = null;
    _burstLimiter = null;
    return null;
  }
}

// ---------------------------------------------------------------------------
// In-memory fallback (development only)
// ---------------------------------------------------------------------------

interface MemoryEntry {
  timestamps: number[];
}

const memoryStore = new Map<string, MemoryEntry>();

let memoryCleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureMemoryCleanup() {
  if (memoryCleanupTimer) return;
  memoryCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      entry.timestamps = entry.timestamps.filter(
        (ts) => now - ts < DAY_WINDOW_SECONDS * 1000
      );
      if (entry.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);

  if (
    memoryCleanupTimer &&
    typeof memoryCleanupTimer === "object" &&
    "unref" in memoryCleanupTimer
  ) {
    (memoryCleanupTimer as NodeJS.Timeout).unref();
  }
}

function memoryRateLimit(
  visitorId: string,
  ip: string,
  increment: boolean
): RateLimitResult {
  const now = Date.now();
  const dayMs = DAY_WINDOW_SECONDS * 1000;
  const minuteMs = MINUTE_WINDOW_SECONDS * 1000;

  const dailyKey = `daily:${visitorId}`;
  const burstKey = `burst:${ip}`;

  const getTimestamps = (key: string, windowMs: number) => {
    const entry = memoryStore.get(key);
    return entry
      ? entry.timestamps.filter((ts) => now - ts < windowMs)
      : [];
  };

  const dailyTs = getTimestamps(dailyKey, dayMs);
  const burstTs = getTimestamps(burstKey, minuteMs);

  // Cek burst dulu
  if (burstTs.length >= MAX_PER_MINUTE) {
    const oldestBurst = burstTs[0];
    const retryAfter = Math.ceil(
      (minuteMs - (now - oldestBurst)) / 1000
    );
    return {
      allowed: false,
      remainingDaily: Math.max(0, MAX_PER_DAY - dailyTs.length),
      remainingMinute: 0,
      retryAfterSeconds: retryAfter,
      reason: "minute",
      message: `Terlalu banyak request. Batas: ${MAX_PER_MINUTE} generate per menit. Coba lagi dalam ${retryAfter} detik.`,
      mode: "memory",
    };
  }

  // Cek kuota harian
  if (dailyTs.length >= MAX_PER_DAY) {
    const oldestDaily = dailyTs[0];
    const resetAt = oldestDaily + dayMs;
    return {
      allowed: false,
      remainingDaily: 0,
      remainingMinute: MAX_PER_MINUTE - burstTs.length,
      retryAfterSeconds: 0,
      reason: "daily",
      message: `Anda telah mencapai batas harian ${MAX_PER_DAY} generate. Kuota reset pada ${new Date(resetAt).toLocaleTimeString("id-ID")}.`,
      resetAt,
      mode: "memory",
    };
  }

  // Allowed — catat jika increment
  if (increment) {
    ensureMemoryCleanup();

    const recordTimestamp = (key: string, windowMs: number) => {
      let entry = memoryStore.get(key);
      if (!entry) {
        entry = { timestamps: [] };
        memoryStore.set(key, entry);
      }
      entry.timestamps = entry.timestamps.filter(
        (ts) => now - ts < windowMs
      );
      entry.timestamps.push(now);
    };

    recordTimestamp(dailyKey, dayMs);
    recordTimestamp(burstKey, minuteMs);
  }

  const newDailyCount = increment ? dailyTs.length + 1 : dailyTs.length;
  const newBurstCount = increment ? burstTs.length + 1 : burstTs.length;

  // Estimasi resetAt dari timestamp paling awal di daily window
  const allDailyTs = memoryStore.get(dailyKey)?.timestamps ?? [];
  const resetAt =
    allDailyTs.length > 0 ? allDailyTs[0] + dayMs : now + dayMs;

  return {
    allowed: true,
    remainingDaily: Math.max(0, MAX_PER_DAY - newDailyCount),
    remainingMinute: Math.max(0, MAX_PER_MINUTE - newBurstCount),
    retryAfterSeconds: 0,
    resetAt,
    mode: "memory",
  };
}

function memoryCheckQuota(visitorId: string, ip: string): QuotaStatus {
  const result = memoryRateLimit(visitorId, ip, false);
  return {
    limit: MAX_PER_DAY,
    remaining: result.remainingDaily,
    resetAt: result.resetAt ?? null,
    allowed: result.allowed,
    reason: result.reason,
    retryAfterSeconds: result.retryAfterSeconds,
    mode: "memory",
  };
}

// ---------------------------------------------------------------------------
// Redis-backed rate limit
// ---------------------------------------------------------------------------

async function redisRateLimit(
  visitorId: string,
  ip: string
): Promise<RateLimitResult> {
  const limiters = await getRedisLimiters();
  if (!limiters) {
    throw new Error("Redis limiters tidak tersedia");
  }

  const { daily, burst } = limiters;

  // Cek burst per IP dulu (lebih ringan)
  const burstResult = await burst.limit(`ip:${ip}`);
  if (!burstResult.success) {
    const retryAfter = Math.ceil(
      (burstResult.reset - Date.now()) / 1000
    );
    return {
      allowed: false,
      remainingDaily: MAX_PER_DAY, // belum dicek, konservatif
      remainingMinute: 0,
      retryAfterSeconds: Math.max(1, retryAfter),
      reason: "minute",
      message: `Terlalu banyak request. Batas: ${MAX_PER_MINUTE} generate per menit. Coba lagi dalam ${Math.max(1, retryAfter)} detik.`,
      resetAt: burstResult.reset,
      mode: "redis",
    };
  }

  // Cek kuota harian visitor
  const dailyResult = await daily.limit(`visitor:${visitorId}`);
  if (!dailyResult.success) {
    const resetAt = dailyResult.reset;
    return {
      allowed: false,
      remainingDaily: 0,
      remainingMinute: burstResult.remaining,
      retryAfterSeconds: 0,
      reason: "daily",
      message: `Anda telah mencapai batas harian ${MAX_PER_DAY} generate. Kuota reset pada ${new Date(resetAt).toLocaleTimeString("id-ID")}.`,
      resetAt,
      mode: "redis",
    };
  }

  return {
    allowed: true,
    remainingDaily: dailyResult.remaining,
    remainingMinute: burstResult.remaining,
    retryAfterSeconds: 0,
    resetAt: dailyResult.reset,
    mode: "redis",
  };
}

async function redisCheckQuota(
  visitorId: string,
  ip: string
): Promise<QuotaStatus> {
  const limiters = await getRedisLimiters();
  if (!limiters) {
    throw new Error("Redis limiters tidak tersedia");
  }

  const { daily, burst } = limiters;

  try {
    const [dailyInfo, burstInfo] = await Promise.all([
      daily.getRemaining(`visitor:${visitorId}`),
      burst.getRemaining(`ip:${ip}`),
    ]);

    const remaining = Math.max(0, dailyInfo.remaining);
    const burstRemaining = Math.max(0, burstInfo.remaining);

    let reason: "minute" | "daily" | undefined = undefined;
    let allowed = true;
    let retryAfterSeconds = 0;

    if (burstRemaining <= 0) {
      allowed = false;
      reason = "minute";
      retryAfterSeconds = Math.max(
        1,
        Math.ceil((burstInfo.reset - Date.now()) / 1000)
      );
    } else if (remaining <= 0) {
      allowed = false;
      reason = "daily";
    }

    return {
      limit: dailyInfo.limit ?? MAX_PER_DAY,
      remaining,
      remainingMinute: burstRemaining,
      resetAt: dailyInfo.reset,
      allowed,
      reason,
      retryAfterSeconds,
      mode: "redis",
    };
  } catch (err) {
    console.error(
      "[rate-limiter] Error saat membaca quota dari Redis:",
      err instanceof Error ? err.message : "unknown"
    );
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Jalankan rate limit check dan catat request.
 * Panggil ini hanya ketika request AI benar-benar akan dijalankan.
 *
 * @param visitorId - ID anonim dari cookie HttpOnly server
 * @param ip        - IP address dari request
 */
export async function rateLimit(
  visitorId: string,
  ip: string
): Promise<RateLimitResult> {
  const limiters = await getRedisLimiters();

  if (!limiters) {
    // Tidak ada Redis — gunakan fallback in-memory
    if (isProduction()) {
      // Di production, log warning tapi tetap fail-safe dengan 503
      // (ditangani di api-guard.ts)
      console.warn(
        "[rate-limiter] PERINGATAN: Upstash Redis tidak dikonfigurasi di production! " +
        "Set UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN."
      );
      throw new Error("Redis tidak dikonfigurasi untuk production");
    }
    // Development: gunakan in-memory dengan warning
    console.warn(
      "[rate-limiter] Mode development: menggunakan in-memory fallback. " +
      "Set UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN untuk production."
    );
    return memoryRateLimit(visitorId, ip, true);
  }

  try {
    return await redisRateLimit(visitorId, ip);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error("[rate-limiter] Redis error saat rate limit check:", msg);

    if (isProduction()) {
      // Di production, fail closed — jangan izinkan request jika Redis error
      throw err;
    }

    // Development: fallback ke in-memory
    console.warn("[rate-limiter] Fallback ke in-memory karena Redis error.");
    return memoryRateLimit(visitorId, ip, true);
  }
}

/**
 * Cek status kuota tanpa mencatat (tidak increment counter).
 * Gunakan ini untuk endpoint GET /api/generate/quota.
 *
 * @param visitorId - ID anonim dari cookie HttpOnly server
 * @param ip        - IP address dari request
 */
export async function checkQuota(
  visitorId: string,
  ip: string
): Promise<QuotaStatus> {
  const limiters = await getRedisLimiters();

  if (!limiters) {
    if (isProduction()) {
      console.warn(
        "[rate-limiter] PERINGATAN: Upstash Redis tidak dikonfigurasi di production!"
      );
      throw new Error("Redis tidak dikonfigurasi untuk production");
    }
    return memoryCheckQuota(visitorId, ip);
  }

  try {
    return await redisCheckQuota(visitorId, ip);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error("[rate-limiter] Redis error saat check quota:", msg);

    if (isProduction()) {
      throw err;
    }

    return memoryCheckQuota(visitorId, ip);
  }
}

/**
 * Refund / rollback 1 penggunaan kuota harian visitor jika proses AI gagal.
 */
export async function refundQuota(visitorId: string): Promise<void> {
  const limiters = await getRedisLimiters();
  if (limiters) {
    try {
      await limiters.daily.limit(`visitor:${visitorId}`, { rate: -1 });
    } catch (err) {
      console.error(
        "[rate-limiter] Gagal refund kuota di Redis:",
        err instanceof Error ? err.message : "unknown error"
      );
    }
  } else {
    // Memory fallback rollback
    const dailyKey = `daily:${visitorId}`;
    const entry = memoryStore.get(dailyKey);
    if (entry && entry.timestamps.length > 0) {
      entry.timestamps.pop();
    }
  }
}

/**
 * Apakah Upstash Redis sudah dikonfigurasi.
 */
export function isRedisConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}
