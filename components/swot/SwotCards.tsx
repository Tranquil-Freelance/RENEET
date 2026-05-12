import type { SWOT } from "@/types";
import { Flame, Lightbulb, Shield, Trophy } from "lucide-react";

const CONFIG = {
  strengths: {
    label: "Strengths",
    icon: Trophy,
    accent: "var(--color-accent)",
    bg: "var(--color-accent-50)",
    border: "border-[color:var(--color-accent)]/40",
  },
  weaknesses: {
    label: "Weaknesses",
    icon: Flame,
    accent: "var(--color-danger)",
    bg: "var(--color-danger-50)",
    border: "border-[color:var(--color-danger)]/40",
  },
  opportunities: {
    label: "Opportunities",
    icon: Lightbulb,
    accent: "var(--color-brand)",
    bg: "var(--color-brand-50)",
    border: "border-[color:var(--color-brand)]/40",
  },
  threats: {
    label: "Threats",
    icon: Shield,
    accent: "var(--color-warn)",
    bg: "var(--color-warn-50)",
    border: "border-[color:var(--color-warn)]/40",
  },
} as const;

export function SwotCards({ swot }: { swot: SWOT }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card
        cfg={CONFIG.strengths}
        items={swot.strengths.map((s) => ({
          title: `${s.topic} · ${s.subtopic}`,
          sub: `${s.score_pct}% · ${s.marks} marks`,
          note: s.insight,
        }))}
      />
      <Card
        cfg={CONFIG.weaknesses}
        items={swot.weaknesses.map((s) => ({
          title: `${s.topic} · ${s.subtopic}`,
          sub: `-${s.marks_lost} marks · ${s.questions_wrong} wrong · ~${s.fix_time_hours}h to fix`,
          note: s.likely_gap,
          badge: s.fix_priority,
        }))}
      />
      <Card
        cfg={CONFIG.opportunities}
        items={swot.opportunities.map((s) => ({
          title: `${s.topic} · ${s.subtopic}`,
          sub: `+${s.marks_recoverable} marks possible · ${s.questions_blank} blanks · ~${s.effort_hours}h`,
          note: s.insight,
        }))}
      />
      <Card
        cfg={CONFIG.threats}
        items={swot.threats.map((s) => ({
          title: `${s.topic} · ${s.subtopic}`,
          sub: `${s.questions_guessed_right} lucky · ${s.marks_at_risk} marks at risk`,
          note: s.warning,
        }))}
      />
    </div>
  );
}

interface CardItem {
  title: string;
  sub: string;
  note: string;
  badge?: string;
}

function Card({
  cfg,
  items,
}: {
  cfg: typeof CONFIG[keyof typeof CONFIG];
  items: CardItem[];
}) {
  const Icon = cfg.icon;
  return (
    <div
      className={`rounded-2xl border ${cfg.border} p-5`}
      style={{ backgroundColor: cfg.bg }}
    >
      <div className="flex items-center gap-2">
        <div
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: cfg.accent, color: "#fff" }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: cfg.accent }}
        >
          {cfg.label}
        </div>
      </div>

      <ul className="mt-3 space-y-3">
        {items.length === 0 && (
          <li className="text-sm text-slate-500 italic">Nothing here yet.</li>
        )}
        {items.map((it, i) => (
          <li key={i} className="rounded-xl bg-white/70 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-sm text-slate-800">
                {it.title}
              </div>
              {it.badge && (
                <span
                  className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5 text-white"
                  style={{ backgroundColor: cfg.accent }}
                >
                  {it.badge}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{it.sub}</div>
            <div className="text-xs text-slate-600 mt-1.5">{it.note}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
