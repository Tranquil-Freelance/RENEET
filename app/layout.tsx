import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://neetsurge.in";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "NEETSurge — Your Personal Re-NEET 2026 Gap Analyzer",
  description:
    "NEET 2026 cancelled? Mark your exam answers and get an AI-powered SWOT analysis + 30-day study plan. Free for all aspirants.",
  keywords: [
    "NEET 2026",
    "Re-NEET",
    "NEET cancelled",
    "NEET gap analysis",
    "NEET study plan",
    "NEET AI tutor",
  ],
  openGraph: {
    title: "NEETSurge — You gave the exam. We'll tell you what to fix.",
    description:
      "Mark what you actually wrote. Get your personal SWOT in 10 minutes. Free.",
    url: APP_URL,
    siteName: "NEETSurge",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEETSurge — Re-NEET 2026 Gap Analyzer",
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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-[var(--color-ink)]">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
