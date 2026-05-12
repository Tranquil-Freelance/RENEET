import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SAMPLE = [
  {
    label: "Strengths",
    accent: "var(--color-accent)",
    bg: "var(--color-accent-50)",
    rows: [
      "Ecology · Ecosystem — 95%",
      "Plant Anatomy — 88%",
      "Coordination Compounds — 84%",
    ],
  },
  {
    label: "Weaknesses",
    accent: "var(--color-danger)",
    bg: "var(--color-danger-50)",
    rows: [
      "Genetics · Linkage — lost 12 marks",
      "Electrostatics · Capacitance — lost 8 marks",
      "Aldehydes & Ketones — lost 8 marks",
    ],
  },
  {
    label: "Opportunities",
    accent: "var(--color-brand)",
    bg: "var(--color-brand-50)",
    rows: [
      "Modern Physics · Nuclei (3 blanks)",
      "Biotechnology · Applications (2 blanks)",
      "Reproduction · Reproductive Health (2 blanks)",
    ],
  },
  {
    label: "Threats",
    accent: "var(--color-warn)",
    bg: "var(--color-warn-50)",
    rows: [
      "Optics · Wave Optics — 2 lucky guesses",
      "Equilibrium — 1 lucky guess",
      "Evolution — 1 lucky guess",
    ],
  },
];

export function SampleSwot() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            This is what your SWOT looks like
          </h2>
          <p className="mt-3 text-slate-600">
            Real subtopic-level insight, not vague advice.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 p-5"
              style={{ backgroundColor: card.bg }}
            >
              <div
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: card.accent }}
              >
                {card.label}
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                {card.rows.map((row) => (
                  <li key={row}>• {row}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-ink)] px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            See your real SWOT
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
