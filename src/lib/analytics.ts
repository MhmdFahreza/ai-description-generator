export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Kirim custom event ke GA4, contoh: trackEvent("generate_description", { type: "seo" }) */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}

/** Aktif/nonaktifkan pengumpulan data GA4 tanpa reload halaman */
export function setGADisabled(disabled: boolean) {
  if (typeof window === "undefined" || !GA_ID) return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = disabled;
}

/** Hapus cookie milik GA4 (_ga, _ga_<ID>, dll.) */
export function deleteGACookies() {
  if (typeof document === "undefined") return;

  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((n) => n === "_ga" || n === "_gid" || n.startsWith("_ga_") || n.startsWith("_gat"));

  const host = window.location.hostname;
  const parts = host.split(".");
  const domains = new Set<string>(["", `; domain=${host}`, `; domain=.${host}`]);
  if (parts.length >= 2) domains.add(`; domain=.${parts.slice(-2).join(".")}`);
  if (parts.length >= 3) domains.add(`; domain=.${parts.slice(-3).join(".")}`);

  names.forEach((name) => {
    domains.forEach((d) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${d}`;
    });
  });
}