import { ClipboardCheck, ScanSearch, CalendarDays } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "1. Mark your answers",
    body: "Go question by question and pick what you actually marked on exam day. ABCD, blank, or guessed.",
    accent: "var(--color-brand)",
  },
  {
    icon: ScanSearch,
    title: "2. Get your SWOT",
    body: "Strengths, weaknesses, opportunities and threats — analyzed at the subtopic level by Claude AI.",
    accent: "var(--color-accent)",
  },
  {
    icon: CalendarDays,
    title: "3. Get your 30-day plan",
    body: "Day-by-day study plan to close your specific gaps before Re-NEET. ₹99 one-time.",
    accent: "var(--color-warn)",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            How PrepInsight works
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Not another crash course. A precision tool that tells you exactly
            what 15% of topics actually cost you marks.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${step.accent}1a`, color: step.accent }}
              >
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
