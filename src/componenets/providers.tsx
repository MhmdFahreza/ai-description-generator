"use client";

import React from "react";
import CookieBanner from "@/componenets/cookies/cookie-banner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CookieBanner />
    </>
  );
}
