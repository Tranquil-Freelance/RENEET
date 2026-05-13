import type { SWOT } from "@/types";
import { Flame, Lightbulb, Shield, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

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

const FIX_HOURS_BAR_MAX = 24;

export function SwotCards({ swot }: { swot: SWOT }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card
        cfg={CONFIG.strengths}
        items={swot.strengths.map((s) => ({
          title: `${s.topic} · ${s.subtopic}`,
          sub: `${s.score_pct}% · ${s.marks} marks`,
          note: s.insight,
          scorePct: s.score_pct,
        }))}
      />
      <Card
        cfg={CONFIG.weaknesses}
        items={swot.weaknesses.map((s) => ({
          title: `${s.topic} · ${s.subtopic}`,
          sub: `-${s.marks_lost} marks · ${s.questions_wrong} wrong`,
          note: s.likely_gap,
          badge: s.fix_priority,
          fixHours: s.fix_time_hours,
        }))}
      />
      <Card
        cfg={CONFIG.opportunities}
        items={swot.opportunities.map((s) => ({
          title: `${s.topic} · ${s.subtopic}`,
          sub: `${s.questions_blank} blanks · ~${s.effort_hours}h effort`,
          note: s.insight,
          recoverableChip: `+${s.marks_recoverable} marks`,
        }))}
      />
      <Card
        cfg={CONFIG.threats}
        items={swot.threats.map((s) => ({
          title: `${s.topic} · ${s.subtopic}`,
          sub: `${s.questions_guessed_right} guessed right`,
          note: s.warning,
          marksAtRisk: s.marks_at_risk,
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
  /** Strength: 0–100 for progress bar */
  scorePct?: number;
  /** Weakness: hours to fix (bar scale) */
  fixHours?: number;
  /** Opportunity: highlight chip text */
  recoverableChip?: string;
  /** Threat: marks at risk (amber emphasis) */
  marksAtRisk?: number;
}

function Card({
  cfg,
  items,
}: {
  cfg: (typeof CONFIG)[keyof typeof CONFIG];
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
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="font-semibold text-sm text-slate-800 min-w-0 flex-1">{it.title}</div>
              <div className="flex items-center gap-1.5 shrink-0">
                {it.recoverableChip && (
                  <span
                    className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5 text-white"
                    style={{ backgroundColor: "var(--color-brand)" }}
                  >
                    {it.recoverableChip}
                  </span>
                )}
                {it.badge && (
                  <span
                    className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5 text-white"
                    style={{ backgroundColor: cfg.accent }}
                  >
                    {it.badge}
                  </span>
                )}
                {typeof it.marksAtRisk === "number" && it.marksAtRisk > 0 && (
                  <span className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5 bg-amber-500 text-white ring-1 ring-amber-600/30">
                    {it.marksAtRisk} marks at risk
                  </span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{it.sub}</div>

            {typeof it.scorePct === "number" && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                  <span>Topic strength</span>
                  <span className="font-semibold text-slate-700">{it.scorePct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width]"
                    style={{
                      width: `${Math.min(100, Math.max(0, it.scorePct))}%`,
                      backgroundColor: cfg.accent,
                    }}
                  />
                </div>
              </div>
            )}

            {typeof it.fixHours === "number" && it.fixHours > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                  <span>Est. fix time</span>
                  <span className="font-semibold text-slate-700">~{it.fixHours}h</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", "bg-[color:var(--color-danger)]")}
                    style={{
                      width: `${Math.min(100, (it.fixHours / FIX_HOURS_BAR_MAX) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">{it.note}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
