"use client";

import Script from "next/script";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getSavedPreferences, type CookiePreferences } from "@/lib/cookies";
import { GA_ID, setGADisabled, deleteGACookies, trackPageView } from "@/lib/analytics";

/**
 * Tracks client-side page views in Next.js App Router.
 * Uses a ref to guarantee that no duplicate page_view events are sent
 * when components re-render or state changes.
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    // Prevent duplicate events for the same URL
    if (lastTrackedUrl.current === url) return;
    lastTrackedUrl.current = url;

    trackPageView(url);
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleAnalytics() {
  const [prefs, setPrefs] = useState<CookiePreferences | null>(null);

  // Read saved consent preferences and listen for updates from cookie banner
  useEffect(() => {
    queueMicrotask(() => {
      setPrefs(getSavedPreferences());
    });

    const onChange = (e: Event) => {
      setPrefs((e as CustomEvent<CookiePreferences>).detail);
    };
    window.addEventListener("cookieConsentChanged", onChange);
    return () => window.removeEventListener("cookieConsentChanged", onChange);
  }, []);

  // Sync consent state to GA4
  useEffect(() => {
    if (!prefs || !GA_ID) return;

    setGADisabled(!prefs.analytics);
    if (!prefs.analytics) deleteGACookies();

    window.gtag?.("consent", "update", {
      analytics_storage: prefs.analytics ? "granted" : "denied",
      // Keep advertising strictly denied — advertising tags are separate
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }, [prefs]);

  // Do NOT render scripts or track anything until user explicitly grants analytics consent
  if (!GA_ID || !prefs?.analytics) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            send_page_view: false
          });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}