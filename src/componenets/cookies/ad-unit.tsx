"use client";

import { useEffect, useRef, useState } from "react";
import { getSavedPreferences, type CookiePreferences } from "@/lib/cookies";
import { ADSENSE_ID } from "@/lib/adsense";

type AdUnitProps = {
  slot: string;
  className?: string;
};

export default function AdUnit({ slot, className }: AdUnitProps) {
  const [allowed, setAllowed] = useState(false);
  const pushed = useRef(false);

  useEffect(() => {
    setAllowed(Boolean(getSavedPreferences()?.advertising));

    const onChange = (e: Event) => {
      setAllowed((e as CustomEvent<CookiePreferences>).detail.advertising);
    };
    window.addEventListener("cookieConsentChanged", onChange);
    return () => window.removeEventListener("cookieConsentChanged", onChange);
  }, []);

  useEffect(() => {
    if (!allowed || !ADSENSE_ID || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [allowed]);

  if (!allowed || !ADSENSE_ID) return null;

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={ADSENSE_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}