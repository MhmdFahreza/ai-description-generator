export const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Hapus cookie first-party milik AdSense (__gads, __gpi, __eoi) */
export function deleteAdCookies() {
  if (typeof document === "undefined") return;

  const names = ["__gads", "__gpi", "__eoi"];
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