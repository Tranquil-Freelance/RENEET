import { Check, X } from "lucide-react";

const ROWS = [
  {
    coaching: "Generic 'Re-NEET Crash Course' for all 97 chapters",
    surge: "Personalized to what you actually marked on exam day",
  },
  {
    coaching: "Treats every student the same",
    surge: "Identifies the 15% that's actually missing for YOU",
  },
  {
    coaching: "Covers topics you already know",
    surge: "Skips your strengths, attacks your weaknesses",
  },
  {
    coaching: "Panic + overwhelm + drop-off by Day 3",
    surge: "Calm, targeted confidence — day-by-day clarity",
  },
  {
    coaching: "₹15,000+ for a full crash course",
    surge: "Free SWOT + ₹149 for the 30-day AI plan",
  },
];

export function ComparisonTable() {
  return (
    <section className="bg-slate-50 py-20 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Why NEETSurge is different
          </h2>
          <p className="mt-3 text-slate-600">
            You don&apos;t need another crash course. You need a mirror.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100 text-sm font-semibold">
            <div className="p-4 text-slate-600">Coaching crash course</div>
            <div className="p-4 text-[var(--color-brand)] border-l border-slate-200">
              NEETSurge
            </div>
          </div>
          {ROWS.map((row) => (
            <div
              key={row.surge}
              className="grid grid-cols-2 border-b border-slate-100 last:border-0 text-sm"
            >
              <div className="p-4 flex items-start gap-2 text-slate-600">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" />
                {row.coaching}
              </div>
              <div className="p-4 flex items-start gap-2 border-l border-slate-100 text-slate-800">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                {row.surge}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
