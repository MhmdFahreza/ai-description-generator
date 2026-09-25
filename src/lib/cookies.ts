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
      "Cookie yang esensial agar website dapat beroperasi dengan aman dan menyimpan preferensi privasi Anda. Cookie ini tidak dapat dinonaktifkan.",
    examples: ["cookie_consent_preferences", "app_session"],
  },
  {
    id: "analytics" as const,
    name: "Analytics Cookies",
    badge: "Opsional",
    isMandatory: false,
    description:
      "Cookie untuk menganalisis performa dan penggunaan generator secara anonim untuk peningkatan fitur.",
    examples: ["_site_analytics_id", "_analytics_session"],
  },
  {
    id: "advertising" as const,
    name: "Advertising Cookies",
    badge: "Opsional",
    isMandatory: false,
    description:
      "Cookie untuk preferensi konten rekomendasi dan iklan relevan.",
    examples: ["_ad_user_pref", "_campaign_ref"],
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

  if (completePrefs.analytics) {
    setCookie("_site_analytics_id", "analytics_" + Math.random().toString(36).substring(2, 10), 30);
    setCookie("_analytics_session", "session_active", 1);
  } else {
    deleteCookie("_site_analytics_id");
    deleteCookie("_analytics_session");
  }

  if (completePrefs.advertising) {
    setCookie("_ad_user_pref", "personalized_ads_v1", 30);
    setCookie("_campaign_ref", "direct_generator", 7);
  } else {
    deleteCookie("_ad_user_pref");
    deleteCookie("_campaign_ref");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("cookieConsentChanged", { detail: completePrefs })
    );
  }

  return completePrefs;
}
