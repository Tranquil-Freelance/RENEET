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
import { SUBJECTS } from "@/lib/questions";
import { cn } from "@/lib/utils";

const LS_ANSWERS = "neetsurge:answers";
const LS_USER = "neetsurge:userId";
const OPTIONS: Option[] = ["A", "B", "C", "D"];
const MIN_TO_ANALYZE = 150;

interface Props {
  questions: ClientQuestion[];
}

export function OMRSheet({ questions }: Props) {
  const router = useRouter();
  const [activeSubject, setActiveSubject] = useState<Subject>("physics");
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserId(localStorage.getItem(LS_USER));
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
    const out: Record<Subject, { answered: number; total: number }> = {
      physics: { answered: 0, total: 0 },
      chemistry: { answered: 0, total: 0 },
      biology: { answered: 0, total: 0 },
    };
    for (const q of questions) {
      out[q.subject].total += 1;
      if (answers[q.q_no]?.chosen) out[q.subject].answered += 1;
    }
    return out;
  }, [questions, answers]);

  const totalMarked = counts.physics.answered + counts.chemistry.answered + counts.biology.answered;

  async function submit() {
    if (totalMarked < MIN_TO_ANALYZE) {
      toast.error(`Mark at least ${MIN_TO_ANALYZE} questions to analyze. You have ${totalMarked}.`);
      return;
    }
    if (!userId) {
      toast.error("Profile missing — please complete onboarding first.");
      router.push("/onboarding");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, answers }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Analysis failed");
      }
      const { analysisId } = await res.json();
      localStorage.setItem("neetsurge:analysisId", analysisId);
      router.push("/swot");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not analyze");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Header
        totalMarked={totalMarked}
        canSubmit={totalMarked >= MIN_TO_ANALYZE}
        submitting={submitting}
        onSubmit={submit}
      />

      <div className="sticky top-0 z-10 -mx-4 px-4 pt-2 pb-3 bg-slate-50/95 backdrop-blur">
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setActiveSubject(s);
                containerRef.current?.scrollTo({ top: 0, behavior: "auto" });
              }}
              className={cn(
                "rounded-lg py-2 text-sm font-medium capitalize transition",
                activeSubject === s
                  ? "bg-[var(--color-brand)] text-white"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <div>{s}</div>
              <div className="text-[10px] opacity-80">
                {counts[s].answered}/{counts[s].total}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
          <div
            className="h-1.5 rounded-full bg-[var(--color-brand)] transition-all"
            style={{ width: `${(totalMarked / 180) * 100}%` }}
          />
        </div>
      </div>

      <div ref={containerRef} className="mt-4 space-y-3">
        {subjectQuestions.map((q) => (
          <QuestionCard
            key={q.q_no}
            question={q}
            state={answers[q.q_no]}
            onChange={(patch) => setAnswer(q.q_no, patch)}
          />
        ))}
      </div>

      <div className="mt-8 mb-24 text-center text-xs text-slate-400">
        Tip: keyboard 1/2/3/4 for A/B/C/D · G to toggle guessed · X to clear
      </div>

      <StickySubmit
        totalMarked={totalMarked}
        canSubmit={totalMarked >= MIN_TO_ANALYZE}
        submitting={submitting}
        onSubmit={submit}
      />
    </div>
  );
}

function Header({
  totalMarked,
}: {
  totalMarked: number;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-bold">Mark your answers</h1>
      <p className="text-sm text-slate-600">
        For each question, tap what you actually marked on exam day. Leave it
        blank if you didn&apos;t attempt. Use{" "}
        <span className="font-medium text-slate-800">I guessed</span> if you
        were unsure — it powers your Threats analysis.
      </p>
      <div className="mt-2 text-xs text-slate-500">
        Marked: <span className="font-semibold text-slate-700">{totalMarked} / 180</span>
      </div>
    </div>
  );
}

function StickySubmit({
  totalMarked,
  canSubmit,
  submitting,
  onSubmit,
}: {
  totalMarked: number;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3">
      <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {canSubmit ? (
            <>You&apos;ve marked enough. Ready when you are.</>
          ) : (
            <>Mark {MIN_TO_ANALYZE - totalMarked} more to enable analysis.</>
          )}
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-brand-600)]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
            </>
          ) : (
            <>
              Analyze My Exam <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
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
        "rounded-2xl border bg-white p-4 shadow-sm transition",
        chosen ? "border-slate-300" : "border-slate-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-[var(--color-brand)]">
            Q{q.q_no}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            {q.chapter} · {q.subtopic}
          </div>
        </div>
        {chosen && (
          <button
            type="button"
            onClick={() => onChange({ chosen: null, guessed: false })}
            className="text-xs text-slate-400 hover:text-slate-700 inline-flex items-center gap-1"
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
                "rounded-xl border py-2.5 text-sm font-semibold transition",
                isSelected
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                  : "border-slate-300 text-slate-700 hover:border-slate-400",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <label className="inline-flex items-center gap-2 cursor-pointer text-slate-600">
          <input
            type="checkbox"
            checked={guessed}
            onChange={(e) => onChange({ guessed: e.target.checked })}
            disabled={chosen === null}
            className="h-4 w-4 accent-[var(--color-warn)] disabled:opacity-40"
          />
          I guessed this
        </label>
        <div className="text-slate-400">
          {chosen === null ? (
            "Blank"
          ) : (
            <span className="inline-flex items-center gap-1 text-[var(--color-brand)]">
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

  return (
    <div className="mt-3 relative rounded-xl border border-dashed border-slate-200 bg-slate-50 overflow-hidden">
      {!errored && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Question ${qNo}`}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={cn(
            "w-full block",
            loaded ? "opacity-100" : "opacity-0",
            "transition-opacity",
          )}
        />
      )}
      {(errored || !loaded) && (
        <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
          {errored ? (
            <span>
              Question {qNo} image not uploaded yet · drop{" "}
              <code className="text-[11px] bg-slate-200 px-1 py-0.5 rounded">
                /public/questions/q{qNo}.jpg
              </code>
            </span>
          ) : (
            <span>Loading Q{qNo}…</span>
          )}
        </div>
      )}
    </div>
  );
}

function isInView(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}
