"use client";

import { Lock, Flame, Lightbulb, Shield, Trophy } from "lucide-react";
import type { SWOT } from "@/types";
import { cn } from "@/lib/utils";

const CONFIG = {
  strengths: {
    label: "Strengths",
    emptyTitle: "No standout strengths detected",
    emptyNote: "Missed or wrong across this section — that's normal. Building one strength here is a 30-mark gain.",
    icon: Trophy,
    accent: "var(--color-accent)",
    bg: "var(--color-accent-50)",
    border: "border-[color:var(--color-accent)]/40",
  },
  weaknesses: {
    label: "Weaknesses",
    emptyTitle: "No clear weaknesses",
    emptyNote: "Either you blanked this section entirely (check opportunities) or you did OK on the topics you attempted.",
    icon: Flame,
    accent: "var(--color-danger)",
    bg: "var(--color-danger-50)",
    border: "border-[color:var(--color-danger)]/40",
  },
  opportunities: {
    label: "Opportunities",
    emptyTitle: "No easy wins identified",
    emptyNote: "Blanked topics here were either too hard or too few — focus energy on sections with more blanks.",
    icon: Lightbulb,
    accent: "var(--color-brand)",
    bg: "var(--color-brand-50)",
    border: "border-[color:var(--color-brand)]/40",
  },
  threats: {
    label: "Threats",
    emptyTitle: "No lucky guesses here",
    emptyNote: "Every mark in this section was earned, not guessed — your foundation is solid.",
    icon: Shield,
    accent: "var(--color-warn)",
    bg: "var(--color-warn-50)",
    border: "border-[color:var(--color-warn)]/40",
  },
} as const;

const FIX_HOURS_BAR_MAX = 20;

export interface SwotLockedHidden {
  strengths: number;
  weaknesses: number;
  opportunities: number;
  threats: number;
}

export function SwotCards({
  swot,
  isLocked,
  lockedHidden,
}: {
  swot: SWOT;
  isLocked?: boolean;
  lockedHidden?: SwotLockedHidden;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card
        cfg={CONFIG.strengths}
        hidden={lockedHidden?.strengths ?? 0}
        isLocked={isLocked}
        items={swot.strengths.map((s) => ({
          topic: s.topic,
          subtopic: s.subtopic,
          sub: `${s.marks} marks · ${s.score_pct}% accuracy`,
          note: s.insight,
          scorePct: s.score_pct,
        }))}
      />
      <Card
        cfg={CONFIG.weaknesses}
        hidden={lockedHidden?.weaknesses ?? 0}
        isLocked={isLocked}
        items={swot.weaknesses.map((s) => ({
          topic: s.topic,
          subtopic: s.subtopic,
          sub: `−${s.marks_lost} marks · ${s.questions_wrong} wrong`,
          note: s.likely_gap,
          badge: s.fix_priority,
          fixHours: s.fix_time_hours,
        }))}
      />
      <Card
        cfg={CONFIG.opportunities}
        hidden={lockedHidden?.opportunities ?? 0}
        isLocked={isLocked}
        items={swot.opportunities.map((s) => ({
          topic: s.topic,
          subtopic: s.subtopic,
          sub: `${s.questions_blank} blanks · ~${s.effort_hours}h to learn`,
          note: s.insight,
          recoverableChip: `+${s.marks_recoverable} marks`,
        }))}
      />
      <Card
        cfg={CONFIG.threats}
        hidden={lockedHidden?.threats ?? 0}
        isLocked={isLocked}
        items={swot.threats.map((s) => ({
          topic: s.topic,
          subtopic: s.subtopic,
          sub: `${s.questions_guessed_right} guessed right · ${s.marks_at_risk} marks at risk`,
          note: s.warning,
          marksAtRisk: s.marks_at_risk,
        }))}
      />
    </div>
  );
}

interface CardItem {
  topic: string;
  subtopic: string;
  sub: string;
  note: string;
  badge?: string;
  scorePct?: number;
  fixHours?: number;
  recoverableChip?: string;
  marksAtRisk?: number;
}

function Card({
  cfg,
  items,
  hidden,
  isLocked,
}: {
  cfg: (typeof CONFIG)[keyof typeof CONFIG];
  items: CardItem[];
  hidden: number;
  isLocked?: boolean;
}) {
  const Icon = cfg.icon;
  const total = items.length + hidden;
  return (
    <div
      className={`rounded-2xl border ${cfg.border} p-5 flex flex-col`}
      style={{ backgroundColor: cfg.bg }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
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
        {total > 0 && (
          <span
            className="text-[11px] font-bold rounded-full px-2 py-0.5 text-white shrink-0"
            style={{ backgroundColor: cfg.accent }}
          >
            {total}
          </span>
        )}
      </div>

      <ul className="mt-3 space-y-3 flex-1">
        {items.length === 0 && hidden === 0 && (
          <li className="rounded-xl bg-white/60 p-3">
            <div className="text-sm font-medium text-slate-700">{cfg.emptyTitle}</div>
            <div className="text-xs text-slate-500 mt-1 leading-relaxed">{cfg.emptyNote}</div>
          </li>
        )}
        {items.map((it, i) => (
          <li key={i} className="rounded-xl bg-white/70 p-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-slate-800 leading-snug">{it.topic}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{it.subtopic}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
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
                  <span className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5 bg-amber-500 text-white">
                    {it.marksAtRisk} at risk
                  </span>
                )}
              </div>
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-1.5">{it.sub}</div>

            {typeof it.scorePct === "number" && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Topic accuracy</span>
                  <span className="font-bold text-slate-700">{it.scorePct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full"
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
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Est. time to fix</span>
                  <span className="font-bold text-slate-700">~{it.fixHours}h</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (it.fixHours / FIX_HOURS_BAR_MAX) * 100)}%`,
                      backgroundColor: cfg.accent,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="text-xs text-slate-600 mt-2 leading-relaxed border-t border-slate-200/60 pt-1.5">
              {it.note}
            </div>
          </li>
        ))}

        {isLocked && hidden > 0 && (
          <li className="rounded-xl border border-dashed p-3 flex items-center gap-2.5"
            style={{ borderColor: cfg.accent + "60", backgroundColor: cfg.accent + "0a" }}>
            <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.accent }} />
            <span className="text-xs font-semibold" style={{ color: cfg.accent }}>
              {hidden} more {cfg.label.toLowerCase().slice(0, -1)}{hidden !== 1 ? "s" : ""} hidden — unlock to see all
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
