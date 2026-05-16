"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { Check, ChevronRight, Loader2, X } from "lucide-react";
import type { AnswerMap, ClientQuestion, Option, Subject } from "@/types";
import { trackExamAnalyzed } from "@/lib/gtag-client";
import { cn } from "@/lib/utils";

const LS_ANSWERS = "prepinsights:answers";
const OPTIONS: Option[] = ["A", "B", "C", "D"];
const SUBJECTS: Subject[] = ["physics", "chemistry", "biology"];

interface Props {
  questions: ClientQuestion[];
}

export function OMRSheet({ questions }: Props) {
  const router = useRouter();
  const [activeSubject, setActiveSubject] = useState<Subject>("physics");
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_ANSWERS);
      if (saved) setAnswers(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(LS_ANSWERS, JSON.stringify(answers));
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [answers]);

  const setAnswer = useCallback((qNo: number, patch: Partial<AnswerMap[number]>) => {
    setAnswers((prev) => {
      const current = prev[qNo] ?? { chosen: null, guessed: false };
      return { ...prev, [qNo]: { ...current, ...patch } };
    });
  }, []);

  const subjectQuestions = useMemo(
    () => questions.filter((q) => q.subject === activeSubject),
    [questions, activeSubject],
  );

  const counts = useMemo(() => {
    const out: Record<Subject, { answered: number; guessed: number; total: number }> = {
      physics: { answered: 0, guessed: 0, total: 0 },
      chemistry: { answered: 0, guessed: 0, total: 0 },
      biology: { answered: 0, guessed: 0, total: 0 },
    };
    for (const q of questions) {
      out[q.subject].total += 1;
      const a = answers[q.q_no];
      if (a?.chosen) {
        out[q.subject].answered += 1;
        if (a.guessed) out[q.subject].guessed += 1;
      }
    }
    return out;
  }, [questions, answers]);

  const totalMarked = counts.physics.answered + counts.chemistry.answered + counts.biology.answered;
  const totalGuessed = counts.physics.guessed + counts.chemistry.guessed + counts.biology.guessed;
  const totalBlank = 180 - totalMarked;

  const canSubmit = totalMarked >= 1;

  async function submit() {
    if (!canSubmit) {
      toast.error("Mark at least one answer first.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.status === 401) {
        setSubmitting(false);
        toast.error("Sign in to run your SWOT analysis.");
        router.push("/login?next=/swot");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Analysis failed");
      }
      const data = await res.json();
      const { analysisId, swot, overall } = data;
      trackExamAnalyzed({
        total_marked: totalMarked,
        total_guessed: totalGuessed,
        total_blank: totalBlank,
      });
      if (analysisId) localStorage.setItem("prepinsights:analysisId", analysisId);
      try {
        if (swot) localStorage.setItem("prepinsights:swot", JSON.stringify(swot));
        if (overall) localStorage.setItem("prepinsights:overall", JSON.stringify(overall));
        localStorage.removeItem(LS_ANSWERS);
      } catch {
        /* ignore */
      }
      router.push(analysisId ? `/swot?analysisId=${encodeURIComponent(analysisId)}` : "/swot");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not analyze");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Header totalMarked={totalMarked} />

      <div className="sticky top-0 z-10 -mx-4 px-4 pt-2 pb-3 bg-paper/95 backdrop-blur">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-line bg-white p-1.5 shadow-soft">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setActiveSubject(s);
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "auto" });
                }
              }}
              className={cn(
                "rounded-xl py-2 text-sm font-medium capitalize transition",
                activeSubject === s
                  ? "bg-brand text-white shadow-soft"
                  : "text-ink-muted hover:bg-paper",
              )}
            >
              <div>{s}</div>
              <div className="text-[10px] opacity-80">
                {counts[s].answered}/{counts[s].total}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-line">
          <div
            className="h-1.5 rounded-full bg-brand transition-all"
            style={{ width: `${(totalMarked / 180) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {subjectQuestions.map((q) => (
          <QuestionCard
            key={q.q_no}
            question={q}
            state={answers[q.q_no]}
            onChange={(patch) => setAnswer(q.q_no, patch)}
          />
        ))}
      </div>

      <div className="mt-8 mb-32 text-center text-xs text-ink-muted">
        Tip: keyboard 1/2/3/4 for A/B/C/D · G to toggle guessed · X to clear
      </div>

      <StickySubmit
        totalMarked={totalMarked}
        totalGuessed={totalGuessed}
        totalBlank={totalBlank}
        canSubmit={canSubmit}
        submitting={submitting}
        onSubmit={() => setShowSummary(true)}
      />

      {showSummary && (
        <PreSubmitSummary
          counts={counts}
          totalMarked={totalMarked}
          totalGuessed={totalGuessed}
          totalBlank={totalBlank}
          submitting={submitting}
          onConfirm={submit}
          onCancel={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}

function Header({ totalMarked }: { totalMarked: number }) {
  return (
    <div className="mb-4">
      <h1 className="text-3xl font-serif font-semibold text-ink">Mark your answers</h1>
      <p className="text-sm text-ink-muted mt-1">
        For each question, tap what you actually marked on exam day. Leave it
        blank if you didn&apos;t attempt. Use{" "}
        <span className="font-medium text-ink">I guessed</span> if you
        were unsure — it powers your Threats analysis.
      </p>
      <div className="mt-2 text-xs text-ink-muted">
        Marked: <span className="font-semibold text-ink">{totalMarked} / 180</span>
      </div>
    </div>
  );
}

function StickySubmit({
  totalMarked,
  totalGuessed,
  totalBlank,
  canSubmit,
  submitting,
  onSubmit,
}: {
  totalMarked: number;
  totalGuessed: number;
  totalBlank: number;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-20 border-t border-line bg-white/95 backdrop-blur px-4 py-3">
      <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
        <div className="text-xs text-ink-muted">
          {totalMarked} marked
          {totalGuessed > 0 ? ` · ${totalGuessed} guessed` : ""}
          {" · "}
          {totalBlank} blank
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-dark transition"
        >
          Review &amp; analyze <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PreSubmitSummary({
  counts,
  totalMarked,
  totalGuessed,
  totalBlank,
  submitting,
  onConfirm,
  onCancel,
}: {
  counts: Record<Subject, { answered: number; guessed: number; total: number }>;
  totalMarked: number;
  totalGuessed: number;
  totalBlank: number;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-soft-lg p-6 sm:p-7">
        <div className="text-xs font-semibold uppercase tracking-wider text-brand">Ready?</div>
        <h2 className="mt-1 text-2xl font-serif font-semibold text-ink">
          Submit for analysis
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          We&apos;ll score your paper against the official NEET key
          (<span className="font-medium text-ink">+4 / −1 / 0</span>) and run an
          in-depth SWOT. This takes about a minute.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {SUBJECTS.map((s) => (
            <div key={s} className="rounded-2xl bg-paper border border-line p-3 text-center">
              <div className="text-[10px] uppercase tracking-wide text-ink-muted">{s}</div>
              <div className="text-xl font-semibold text-ink">{counts[s].answered}</div>
              <div className="text-[10px] text-ink-muted">/ {counts[s].total}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-paper border border-line p-4 text-sm space-y-2">
          <SummaryRow label="Marked" value={`${totalMarked}`} accent />
          <SummaryRow label="Of which guessed" value={`${totalGuessed}`} />
          <SummaryRow label="Blank" value={`${totalBlank}`} />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-2xl border border-line bg-white text-ink py-3 text-sm font-medium hover:bg-paper transition disabled:opacity-50"
          >
            Keep editing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand text-white py-3 text-sm font-semibold shadow-soft hover:bg-brand-dark disabled:opacity-50 disabled:cursor-wait transition"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>Run the analysis</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={cn("font-semibold", accent ? "text-brand" : "text-ink")}>{value}</span>
    </div>
  );
}

function QuestionCard({
  question: q,
  state,
  onChange,
}: {
  question: ClientQuestion;
  state: { chosen: Option | null; guessed: boolean } | undefined;
  onChange: (patch: Partial<{ chosen: Option | null; guessed: boolean }>) => void;
}) {
  const chosen = state?.chosen ?? null;
  const guessed = state?.guessed ?? false;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = el;
    function onKey(e: KeyboardEvent) {
      if (!isInView(target)) return;
      const focused = e.target as HTMLElement | null;
      if (focused && (focused.tagName === "INPUT" || focused.tagName === "TEXTAREA")) return;
      if (e.key === "1") onChange({ chosen: "A" });
      else if (e.key === "2") onChange({ chosen: "B" });
      else if (e.key === "3") onChange({ chosen: "C" });
      else if (e.key === "4") onChange({ chosen: "D" });
      else if (e.key.toLowerCase() === "g") onChange({ guessed: !guessed });
      else if (e.key.toLowerCase() === "x") onChange({ chosen: null, guessed: false });
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onChange, guessed]);

  return (
    <div
      ref={ref}
      data-qno={q.q_no}
      className={cn(
        "rounded-3xl border bg-white p-4 shadow-soft transition",
        chosen ? "border-brand/30" : "border-line",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-semibold text-brand tabular-nums">
            Q{q.q_no}
          </span>
          <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            {q.subject}
          </span>
        </div>
        {chosen && (
          <button
            type="button"
            onClick={() => onChange({ chosen: null, guessed: false })}
            className="shrink-0 text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      <QuestionImage src={q.image_url} qNo={q.q_no} />

      <div className="mt-3 grid grid-cols-4 gap-2">
        {OPTIONS.map((opt) => {
          const isSelected = chosen === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange({ chosen: opt })}
              className={cn(
                "rounded-2xl border py-2.5 text-base font-semibold transition",
                isSelected
                  ? "border-brand bg-brand text-white shadow-soft"
                  : "border-line text-ink hover:border-ink-muted",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <label className="inline-flex items-center gap-2 cursor-pointer text-ink-muted">
          <input
            type="checkbox"
            checked={guessed}
            onChange={(e) => onChange({ guessed: e.target.checked })}
            disabled={chosen === null}
            className="h-4 w-4 accent-warn disabled:opacity-40"
          />
          I guessed this
        </label>
        <div className="text-ink-muted">
          {chosen === null ? (
            "Blank"
          ) : (
            <span className="inline-flex items-center gap-1 text-brand">
              <Check className="h-3.5 w-3.5" /> Marked {chosen}
              {guessed ? " · guessed" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionImage({ src, qNo }: { src: string; qNo: number }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (!src) return null;

  return (
    <div className="mt-3 rounded-2xl border border-line bg-paper shadow-inner overflow-hidden">
      <div className="relative flex min-h-[200px] max-h-[min(62vh,620px)] w-full items-center justify-center p-2 sm:p-3">
        {!errored && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`Question ${qNo}`}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            loading="lazy"
            className={cn(
              "max-h-full max-w-full object-contain object-center select-none",
              loaded ? "opacity-100" : "opacity-0",
              "transition-opacity duration-200",
            )}
            draggable={false}
          />
        )}
        {(errored || !loaded) && (
          <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-sm text-ink-muted">
            {errored ? (
              <span>
                Snippet for Q{qNo} missing — add{" "}
                <code className="rounded bg-line px-1 py-0.5 text-[11px] text-ink">
                  /public/questions/q{qNo}.png
                </code>
              </span>
            ) : (
              <span>Loading…</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function isInView(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}
