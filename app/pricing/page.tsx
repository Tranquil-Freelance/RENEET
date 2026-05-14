import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";
import { SelectContentLink } from "@/components/analytics/SelectContentLink";
import { PAYMENT_AMOUNT_RS, PAYMENT_CURRENCY } from "@/lib/payment";

export const metadata: Metadata = {
  title: "Pricing (INR) · PrepInsight",
  description:
    "PrepInsight products and services with prices in Indian Rupees (INR) — free SWOT and paid 30-day plan.",
};

const LAST = "13 May 2026";

export default function PricingPage() {
  return (
    <LegalShell title="Products & pricing (INR)" lastUpdated={LAST}>
      <p>
        All prices below are in <strong>{PAYMENT_CURRENCY}</strong> (Indian Rupees) inclusive
        of applicable taxes unless stated otherwise at checkout. Payment processing is
        handled by <strong>Cashfree</strong> (cards, UPI, netbanking, wallets where available).
      </p>

      <h2>Products &amp; services</h2>

      <div className="not-prose my-8 space-y-4">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-serif font-semibold text-ink">NEET performance SWOT</h3>
            <span className="text-xl font-bold text-[var(--color-brand)]">₹0</span>
          </div>
          <p className="mt-2 text-sm text-ink-muted leading-relaxed">
            Mark your NEET-UG answers against our answer key, view subject-wise marks (NEET
            scoring +4 / −1 / 0), percentile estimate, and an AI-generated SWOT-style
            analysis (strengths, weaknesses, opportunities, threats) grounded in official
            syllabus categorisation.
          </p>
          <p className="mt-3 text-xs text-ink-muted">
            <strong>Delivery:</strong> Online, immediately after you submit answers (subject to
            availability of the Service).
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft ring-2 ring-[var(--color-brand)]/20">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-serif font-semibold text-ink">
              30-day personalised study plan
            </h3>
            <span className="text-xl font-bold text-[var(--color-brand)]">₹{PAYMENT_AMOUNT_RS}</span>
          </div>
          <p className="mt-2 text-sm text-ink-muted leading-relaxed">
            One-time unlock after your SWOT: an AI-generated day-by-day study plan aligned to
            your gaps (weak topics, blanks, guessed-right risks), with task suggestions,
            revision rhythm, and mock-test placeholders. Includes access to plan-related flows
            in the app (e.g. dashboard check-ins where enabled).
          </p>
          <p className="mt-3 text-xs text-ink-muted">
            <strong>Delivery:</strong> Digital, generated after successful payment confirmation
            via Cashfree. No physical goods are shipped.
          </p>
        </div>
      </div>

      <h2>How to purchase</h2>
      <p>
        Complete the free SWOT flow first. If you choose to unlock the plan, you will see the
        price <strong>₹{PAYMENT_AMOUNT_RS}</strong> at checkout before you pay. No hidden fees
        beyond what Cashfree and your bank may display for your payment method.
      </p>

      <h2>Refunds</h2>
      <p>
        See our <a href="/refunds">Refunds &amp; cancellations</a> policy for when refunds may
        apply and how to request them.
      </p>

      <h2>Contact</h2>
      <p>
        Billing or product questions: <a href="/contact">Contact us</a> or{" "}
        <a href="mailto:hello@tranquilai.in">hello@tranquilai.in</a>
      </p>

      <p className="not-prose mt-10">
        <SelectContentLink
          href="/onboarding"
          contentType="cta"
          itemId="pricing_start_free_swot"
          className="inline-flex rounded-xl bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
        >
          Start free SWOT
        </SelectContentLink>
      </p>
    </LegalShell>
  );
}
