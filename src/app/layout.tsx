import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/componenets/providers";
import CookieBanner from "@/componenets/cookies/cookie-banner";
import GoogleAnalytics from "@/componenets/cookies/google-analytics";
import GoogleAdSense from "@/componenets/cookies/google-adsense";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ai Description Generator",
  description: "Generated descriptions for your products, social media, and more.",
  other: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
    ? { "google-adsense-account": process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID }
    : undefined,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <CookieBanner />
        <GoogleAnalytics />
        <GoogleAdSense />
      </body>
    </html>
  );
}