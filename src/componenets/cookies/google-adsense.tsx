"use client";

import { useEffect, useRef } from "react";
import { getSavedPreferences, type CookiePreferences } from "@/lib/cookies";
import { ADSENSE_ID, deleteAdCookies } from "@/lib/adsense";

const SCRIPT_ID = "adsense-script";

function loadAdSense(clientId: string) {
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  document.head.appendChild(script);
}

export default function GoogleAdSense() {
  const loaded = useRef(false);

  useEffect(() => {
    const clientId = ADSENSE_ID;
    if (!clientId) return;

    const apply = (advertising: boolean) => {
      if (advertising) {
        loaded.current = true;
        loadAdSense(clientId);
      } else if (loaded.current) {
        // Consent dicabut setelah script termuat: bersihkan cookie & reload
        deleteAdCookies();
        window.location.reload();
      }
    };

    apply(Boolean(getSavedPreferences()?.advertising));

    const onChange = (e: Event) => {
      apply((e as CustomEvent<CookiePreferences>).detail.advertising);
    };
    window.addEventListener("cookieConsentChanged", onChange);
    return () => window.removeEventListener("cookieConsentChanged", onChange);
  }, []);

  return null;
}