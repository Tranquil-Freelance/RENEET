"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SWOT, Subject } from "@/types";
import { cn } from "@/lib/utils";

const SUBJECT_LABEL: Record<Subject, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
};

const CATEGORY_TAG: Record<RowCategory, { label: string; color: string; bg: string }> = {
  strength:    { label: "S", color: "text-emerald-700",  bg: "bg-emerald-100" },
  weakness:    { label: "W", color: "text-red-600",      bg: "bg-red-100" },
  opportunity: { label: "O", color: "text-blue-700",     bg: "bg-blue-100" },
  threat:      { label: "T", color: "text-amber-700",    bg: "bg-amber-100" },
};

type RowCategory = "strength" | "weakness" | "opportunity" | "threat";

interface SubtopicRow {
  subtopic: string;
  impact: number;
  tone: "good" | "bad" | "neutral";
  category: RowCategory;
  note: string;
}

interface ChapterRow {
  chapter: string;
  marksImpact: number;
  good: number;
  bad: number;
  rows: SubtopicRow[];
}

export function TopicScoreCard({
  swot,
  defaultOpen,
}: {
  swot: SWOT;
  defaultOpen?: Subject;
}) {
  const byChapter = useMemo(() => buildByChapter(swot), [swot]);
  return (
    <div className="space-y-3">
      {(Object.keys(byChapter) as Subject[]).map((s) => (
        <SubjectBlock key={s} subject={s} chapters={byChapter[s]} defaultOpen={defaultOpen} />
      ))}
    </div>
  );
}

function buildByChapter(swot: SWOT): Record<Subject, ChapterRow[]> {
  const map: Record<Subject, Record<string, ChapterRow>> = {
    physics: {},
    chemistry: {},
    biology: {},
  };

  function add(
    subj: Subject,
    chapter: string,
    subtopic: string,
    impact: number,
    tone: "good" | "bad" | "neutral",
    category: RowCategory,
    note: string,
  ) {
    if (!map[subj][chapter]) {
      map[subj][chapter] = { chapter, marksImpact: 0, good: 0, bad: 0, rows: [] };
    }
    map[subj][chapter].marksImpact += impact;
    if (tone === "good") map[subj][chapter].good += 1;
    if (tone === "bad") map[subj][chapter].bad += 1;
    map[subj][chapter].rows.push({ subtopic, impact, tone, category, note });
  }

  for (const s of swot.strengths)
    add(s.subject, s.topic, s.subtopic, s.marks, "good", "strength",
      `${s.score_pct}% accuracy · ${s.marks} marks earned — ${s.insight}`);
  for (const w of swot.weaknesses)
    add(w.subject, w.topic, w.subtopic, -w.marks_lost, "bad", "weakness",
      `−${w.marks_lost} marks (${w.questions_wrong} wrong, ~${w.fix_time_hours}h to fix) — ${w.likely_gap}`);
  for (const o of swot.opportunities)
    add(o.subject, o.topic, o.subtopic, 0, "neutral", "opportunity",
      `${o.questions_blank} blanks · +${o.marks_recoverable} recoverable in ~${o.effort_hours}h — ${o.insight}`);
  for (const t of swot.threats)
    add(t.subject, t.topic, t.subtopic, 0, "neutral", "threat",
      `${t.questions_guessed_right} guessed right · ${t.marks_at_risk} marks at risk — ${t.warning}`);

  return {
    physics: Object.values(map.physics).sort((a, b) => a.marksImpact - b.marksImpact),
    chemistry: Object.values(map.chemistry).sort((a, b) => a.marksImpact - b.marksImpact),
    biology: Object.values(map.biology).sort((a, b) => a.marksImpact - b.marksImpact),
  };
}

function SubjectBlock({
  subject,
  chapters,
  defaultOpen,
}: {
  subject: Subject;
  chapters: ChapterRow[];
  defaultOpen?: Subject;
}) {
  const [open, setOpen] = useState(() => subject === defaultOpen);

  useEffect(() => {
    setOpen(subject === defaultOpen);
  }, [defaultOpen, subject]);

  const totalImpact = chapters.reduce((s, c) => s + c.marksImpact, 0);
  const totalGaps = chapters.reduce((s, c) => s + c.bad, 0);
  const totalWins = chapters.reduce((s, c) => s + c.good, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold text-slate-800">{SUBJECT_LABEL[subject]}</span>
          <span className="text-xs text-slate-400">{chapters.length} chapters</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {totalWins > 0 && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
              +{totalWins} ok
            </span>
          )}
          {totalGaps > 0 && (
            <span className="text-[11px] font-semibold text-red-600 bg-red-50 rounded-full px-2 py-0.5">
              {totalGaps} gap{totalGaps !== 1 ? "s" : ""}
            </span>
          )}
          {totalImpact !== 0 && (
            <span
              className={cn(
                "text-[11px] font-bold rounded-full px-2 py-0.5",
                totalImpact > 0 ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50",
              )}
            >
              {totalImpact > 0 ? "+" : ""}{totalImpact}m
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">
          {chapters.map((ch) => (
            <ChapterRowView key={ch.chapter} chapter={ch} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChapterRowView({ chapter }: { chapter: ChapterRow }) {
  const [open, setOpen] = useState(chapter.bad > 0);
  return (
    <div className="px-5 py-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 text-sm text-left group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform", open && "rotate-180")} />
          <span className="font-medium text-slate-800 truncate">{chapter.chapter}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
          {chapter.marksImpact !== 0 && (
            <span
              className={cn(
                "font-bold rounded px-1.5 py-0.5",
                chapter.marksImpact > 0 ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50",
              )}
            >
              {chapter.marksImpact > 0 ? "+" : ""}{chapter.marksImpact}m
            </span>
          )}
          {chapter.good > 0 && (
            <span className="text-emerald-600 bg-emerald-50 rounded px-1.5 py-0.5">+{chapter.good}</span>
          )}
          {chapter.bad > 0 && (
            <span className="text-red-500 bg-red-50 rounded px-1.5 py-0.5">−{chapter.bad}</span>
          )}
        </div>
      </button>

      {open && (
        <div className="mt-2 ml-5 space-y-2">
          {chapter.rows.map((r, i) => {
            const tag = CATEGORY_TAG[r.category];
            return (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span
                  className={cn(
                    "mt-0.5 shrink-0 inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold",
                    tag.bg,
                    tag.color,
                  )}
                >
                  {tag.label}
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-slate-700">{r.subtopic}</span>
                  <span className="text-slate-500 ml-1">·</span>
                  <span className="text-slate-500 ml-1 leading-relaxed">{r.note}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
