/**
 * adsense.ts — Google AdSense integration utilities.
 *
 * ADSENSE_ID     : Publisher ID (ca-pub-...). Used for site verification via
 *                  meta tag in layout.tsx AND for script/ad loading.
 *                  Safe to be public; not a secret.
 *
 * ADSENSE_ENABLED: Feature flag. Set to "true" ONLY after Google AdSense has
 *                  reviewed and approved your site. Defaults to false so that
 *                  no ad requests are made while the site is under review.
 *                  Site verification (meta tag) is unaffected by this flag.
 */

/** Publisher ID, e.g. "ca-pub-1234567890". Used for meta-tag verification and ad loading. */
export const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

/**
 * Feature flag — set to true ONLY after AdSense has approved your site.
 * When false, adsbygoogle.js is never loaded and no ad requests are made.
 * The site-verification meta tag in layout.tsx is NOT affected by this flag.
 */
export const ADSENSE_ENABLED =
  process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";

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