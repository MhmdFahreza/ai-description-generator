export const COOKIE_CONSENT_KEY = "cookie_consent_preferences";

export interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  advertising: boolean;
  decidedAt?: string;
}

export const COOKIE_CATEGORIES = [
  {
    id: "necessary" as const,
    name: "Essential / Necessary Cookies",
    badge: "Selalu Aktif (Wajib)",
    isMandatory: true,
    description:
      "Cookie yang esensial untuk menyimpan pilihan privasi Anda agar banner ini tidak muncul kembali. Cookie ini tidak dapat dinonaktifkan.",
    examples: ["cookie_consent_preferences"],
  },
  {
    id: "analytics" as const,
    name: "Analytics Cookies",
    badge: "Opsional",
    isMandatory: false,
    description:
      "Cookie untuk menganalisis performa dan penggunaan generator secara anonim untuk peningkatan fitur.",
    examples: ["_ga", "_ga_<MEASUREMENT_ID>"],
  },
  {
    id: "advertising" as const,
    name: "Advertising Cookies",
    badge: "Opsional",
    isMandatory: false,
    description:
      "Cookie dari Google AdSense untuk menampilkan iklan dan membatasi frekuensi iklan yang sama.",
    examples: ["__gads", "__gpi"],
  },
];

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

export function setCookie(
  name: string,
  value: string,
  days = 365,
  sameSite = "Lax"
): void {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=${sameSite}${secure}`;
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;`;
}

export function getSavedPreferences(): CookiePreferences | null {
  const raw = getCookie(COOKIE_CONSENT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      advertising: Boolean(parsed.advertising),
      decidedAt: parsed.decidedAt,
    };
  } catch {
    return null;
  }
}

export function applyPreferences(prefs: {
  analytics: boolean;
  advertising: boolean;
}): CookiePreferences {
  const completePrefs: CookiePreferences = {
    necessary: true,
    analytics: prefs.analytics,
    advertising: prefs.advertising,
    decidedAt: new Date().toISOString(),
  };

  setCookie(COOKIE_CONSENT_KEY, JSON.stringify(completePrefs), 365);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("cookieConsentChanged", { detail: completePrefs })
    );
  }

  return completePrefs;
}