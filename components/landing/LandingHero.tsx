"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Clock } from "lucide-react";

export function LandingHero({ signupCount }: { signupCount: number }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--color-brand-50)] via-white to-white"
      />
      <div className="mx-auto max-w-5xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-brand)]" />
            Built specifically for 22.79 lakh Re-NEET 2026 aspirants
          </div>

          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-[var(--color-ink)]">
            You gave the exam.
            <br />
            <span className="text-[var(--color-brand)]">
              Now let&apos;s fix the gaps.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-slate-600">
            Mark what you actually wrote. Get your personal SWOT analysis in 10
            minutes — built from the exact answers you marked on exam day. Free.
            No signup needed.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/onboarding"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[var(--color-brand-600)]"
            >
              Start My Free Analysis
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 hover:border-slate-400"
            >
              How it works
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[var(--color-accent)]" />
              No login needed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[var(--color-brand)]" />
              Takes 10 minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[var(--color-warn)]" />
              Free SWOT report
            </span>
          </div>

          <div className="mt-10 text-sm text-slate-500">
            Join{" "}
            <span className="font-semibold text-[var(--color-ink)]">
              {signupCount.toLocaleString("en-IN")}
            </span>{" "}
            students already analyzed
          </div>
        </motion.div>
      </div>
    </section>
  );
}
