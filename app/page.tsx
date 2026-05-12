import Link from "next/link";
import { getSignupCount } from "@/lib/stats";
import { LandingHero } from "@/components/landing/LandingHero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { SampleSwot } from "@/components/landing/SampleSwot";
import { FaqSection } from "@/components/landing/FaqSection";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const signupCount = await getSignupCount();
  return (
    <main className="flex flex-col">
      <div className="w-full bg-[var(--color-ink)] text-white text-center text-sm py-2 px-4">
        <span className="font-medium">NEET 2026 Cancelled</span>
        <span className="opacity-70"> — Re-exam expected June 2026</span>
      </div>

      <LandingHero signupCount={signupCount} />
      <HowItWorks />
      <ComparisonTable />
      <SampleSwot />
      <FaqSection />

      <footer className="border-t border-slate-200 py-10 px-6 text-sm text-slate-500">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-brand)] text-white font-bold">
              P
            </span>
            <span className="font-semibold text-slate-700">PrepInsights</span>
            <span className="text-slate-400">— Built for Re-NEET 2026 aspirants</span>
          </div>
          <div className="flex gap-4">
            <Link href="/onboarding" className="hover:text-[var(--color-brand)]">
              Start free
            </Link>
            <a href="mailto:hello@tranquilai.in" className="hover:text-[var(--color-brand)]">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
