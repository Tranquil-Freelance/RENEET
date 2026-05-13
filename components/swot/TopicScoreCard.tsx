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

interface ChapterRow {
  chapter: string;
  marksImpact: number;
  good: number;
  bad: number;
  rows: { subtopic: string; impact: number; tone: "good" | "bad" | "neutral"; note: string }[];
}

export function TopicScoreCard({
  swot,
  defaultOpen,
}: {
  swot: SWOT;
  /** Subject accordion that starts expanded; updates when this prop changes. */
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
    note: string,
  ) {
    if (!map[subj][chapter]) {
      map[subj][chapter] = { chapter, marksImpact: 0, good: 0, bad: 0, rows: [] };
    }
    map[subj][chapter].marksImpact += impact;
    if (tone === "good") map[subj][chapter].good += 1;
    if (tone === "bad") map[subj][chapter].bad += 1;
    map[subj][chapter].rows.push({ subtopic, impact, tone, note });
  }

  for (const s of swot.strengths)
    add(s.subject, s.topic, s.subtopic, s.marks, "good", `${s.score_pct}% — ${s.insight}`);
  for (const w of swot.weaknesses)
    add(w.subject, w.topic, w.subtopic, -w.marks_lost, "bad", w.likely_gap);
  for (const o of swot.opportunities)
    add(o.subject, o.topic, o.subtopic, 0, "neutral", `${o.questions_blank} blanks — ${o.insight}`);
  for (const t of swot.threats)
    add(t.subject, t.topic, t.subtopic, 0, "neutral", t.warning);

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
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-sm font-semibold"
      >
        <span>{SUBJECT_LABEL[subject]}</span>
        <span className="flex items-center gap-3 text-xs text-slate-500 font-normal">
          {chapters.length} chapters
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 py-3 space-y-3">
          {chapters.map((ch) => (
            <ChapterRowView key={ch.chapter} chapter={ch} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChapterRowView({ chapter }: { chapter: ChapterRow }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <div className="font-medium text-slate-800">{chapter.chapter}</div>
        <div className="text-xs text-slate-500">
          {chapter.good > 0 && <span className="text-[var(--color-accent)] mr-2">+{chapter.good} ok</span>}
          {chapter.bad > 0 && <span className="text-[var(--color-danger)]">-{chapter.bad} gaps</span>}
        </div>
      </div>
      <div className="mt-1 ml-1 space-y-1">
        {chapter.rows.map((r, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span
              className={cn(
                "mt-1 h-1.5 w-1.5 rounded-full shrink-0",
                r.tone === "good" && "bg-[var(--color-accent)]",
                r.tone === "bad" && "bg-[var(--color-danger)]",
                r.tone === "neutral" && "bg-slate-300",
              )}
            />
            <div>
              <span className="font-medium text-slate-700">{r.subtopic}</span>
              <span className="text-slate-500"> · {r.note}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
