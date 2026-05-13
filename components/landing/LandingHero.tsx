"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, LayoutDashboard, ShieldCheck, Sparkles, Clock } from "lucide-react";

export function LandingHero({ signupCount }: { signupCount: number }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-lavender-50/50 to-paper"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-16 h-64 w-64 rounded-full bg-warn/15 blur-3xl"
      />

      <div className="mx-auto max-w-5xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 backdrop-blur px-3 py-1 text-xs font-medium text-ink-muted shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Built specifically for 22.79 lakh Re-NEET 2026 aspirants
          </div>

          <h1 className="mt-6 text-4xl md:text-6xl font-serif font-semibold tracking-tight text-ink">
            You already gave the exam.
            <br />
            <span className="text-brand underline-wave">
              Now let&apos;s fix what tripped you up.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-ink-muted">
            Mark what you actually wrote. We score against the official key,
            then map the gaps to the exact NCERT subtopics that hurt you. Free.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3">
            <Link
              href="/login?next=/exam"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-soft-lg transition hover:bg-brand-dark"
            >
              Start my free analysis
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-white px-6 py-3.5 text-base font-semibold text-ink hover:border-ink-muted transition"
            >
              How it works
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-white px-6 py-3.5 text-base font-semibold text-ink hover:border-brand hover:text-brand transition"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" />
              Email login, no spam
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-brand" />
              About 10 minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-warn-600" />
              SWOT report free
            </span>
          </div>

          <div className="mt-10 text-sm text-ink-muted">
            Join{" "}
            <span className="font-semibold text-ink">
              {signupCount.toLocaleString("en-IN")}
            </span>{" "}
            students already analyzed
          </div>
        </motion.div>
      </div>
    </section>
  );
}
