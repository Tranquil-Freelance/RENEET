"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Is the SWOT really free?",
    a: "Yes — completely. You only pay ₹99 if you choose to unlock the 30-day AI study plan after seeing your SWOT. No account, no card needed for the free analysis.",
  },
  {
    q: "What if I don't remember all my answers?",
    a: "Most students remember 150+ of their 180 marks. Mark what you remember; leave the rest as blank. The SWOT works perfectly even with partial data — the topic-level pattern is what matters.",
  },
  {
    q: "How accurate is the score prediction?",
    a: "We use NEET's standard scoring rules (+4 / -1 / 0) and cross-reference your answers with the official NTA answer key. The estimated band is typically within ±15 marks.",
  },
  {
    q: "What does the ₹99 plan include?",
    a: "A day-by-day 30-day study plan personalized to your SWOT: which NCERT chapters to revisit, which PYQs to solve, daily time targets, two mock test days, and PDF download. WhatsApp reminders included.",
  },
  {
    q: "Will the plan really be ready in 30 days?",
    a: "Yes — the plan is generated for the days remaining to the re-exam (4–6 weeks). It's adaptive — you can mark days as done and the dashboard tracks adherence.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-slate-50 py-20 px-6">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Frequently asked
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={faq.q}
              className="rounded-xl border border-slate-200 bg-white"
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-slate-800"
              >
                {faq.q}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate-500 transition-transform",
                    open === i && "rotate-180",
                  )}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
