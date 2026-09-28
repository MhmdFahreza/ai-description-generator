"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { getSavedPreferences, type CookiePreferences } from "@/lib/cookies";
import { GA_ID, setGADisabled, deleteGACookies } from "@/lib/analytics";

export default function GoogleAnalytics() {
  const [prefs, setPrefs] = useState<CookiePreferences | null>(null);

  // Baca consent tersimpan + dengarkan perubahan dari banner
  useEffect(() => {
    setPrefs(getSavedPreferences());

    const onChange = (e: Event) => {
      setPrefs((e as CustomEvent<CookiePreferences>).detail);
    };
    window.addEventListener("cookieConsentChanged", onChange);
    return () => window.removeEventListener("cookieConsentChanged", onChange);
  }, []);

  // Terapkan perubahan consent ke GA4
  useEffect(() => {
    if (!prefs || !GA_ID) return;

    setGADisabled(!prefs.analytics);
    if (!prefs.analytics) deleteGACookies();

    window.gtag?.("consent", "update", {
      analytics_storage: prefs.analytics ? "granted" : "denied",
      ad_storage: prefs.advertising ? "granted" : "denied",
      ad_user_data: prefs.advertising ? "granted" : "denied",
      ad_personalization: prefs.advertising ? "granted" : "denied",
    });
  }, [prefs]);

  // Jangan load apa pun sebelum user setuju analytics
  if (!GA_ID || !prefs?.analytics) return null;

  const adState = prefs.advertising ? "granted" : "denied";

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
            ad_storage: '${adState}',
            ad_user_data: '${adState}',
            ad_personalization: '${adState}'
          });
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}