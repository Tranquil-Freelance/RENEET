import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { getPublicSiteUrl } from "@/lib/site-url";
import "./globals.css";

const APP_URL = getPublicSiteUrl();

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["SOFT"],
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "PrepInsights — Your Personal Re-NEET 2026 Gap Analyzer",
  description:
    "NEET 2026 cancelled? Mark your exam answers and get an AI-powered SWOT analysis + 30-day study plan. Free for all aspirants.",
  keywords: [
    "NEET 2026",
    "Re-NEET",
    "NEET cancelled",
    "NEET gap analysis",
    "NEET study plan",
    "NEET AI tutor",
    "PrepInsights",
  ],
  openGraph: {
    title: "PrepInsights — You gave the exam. We'll tell you what to fix.",
    description:
      "Mark what you actually wrote. Get your personal SWOT in 10 minutes. Free.",
    url: APP_URL,
    siteName: "PrepInsights",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PrepInsights — Re-NEET 2026 Gap Analyzer",
    description: "AI-powered SWOT + 30-day plan for Re-NEET 2026 aspirants.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} ${fraunces.variable}`}
    >
      <body
        className="min-h-full flex flex-col bg-paper text-ink"
        style={{ fontFamily: "var(--font-inter), var(--font-sans)" }}
      >
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "16px",
              background: "#1f1b2e",
              color: "#fafaf9",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
