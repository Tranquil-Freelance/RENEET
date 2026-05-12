"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RotateCcw } from "lucide-react";
import type { CheckInQuiz, CheckInQuestion, Option } from "@/types";
import { cn } from "@/lib/utils";

const OPTIONS: Option[] = ["A", "B", "C", "D"];

export function DailyQuiz({
  quiz,
  onComplete,
}: {
  quiz: CheckInQuiz;
  onComplete: (score: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Option | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q: CheckInQuestion | undefined = quiz.questions[index];

  function pick(opt: Option) {
    if (picked !== null || !q) return;
    setPicked(opt);
    if (opt === q.correct) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= quiz.questions.length) {
      setDone(true);
      onComplete(score);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }

  function restart() {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <div className="text-xs uppercase tracking-wider text-slate-500">Done</div>
        <div className="mt-2 text-3xl font-bold">
          {score} / {quiz.questions.length}
        </div>
        <div className="mt-1 text-sm text-slate-600">
          {score === quiz.questions.length
            ? "Perfect — you really know this topic."
            : score >= 3
              ? "Strong base. Revisit the explanations and you've got it."
              : "Worth a deeper revision pass today."}
        </div>
        <button
          type="button"
          onClick={restart}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400"
        >
          <RotateCcw className="h-4 w-4" /> Retake
        </button>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Question {index + 1} of {quiz.questions.length}</span>
        <span className="text-slate-500">Score: {score}</span>
      </div>
      <div className="mt-3 text-base font-semibold text-slate-800">{q.question}</div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const isCorrect = picked && opt === q.correct;
          const isWrong = picked === opt && opt !== q.correct;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => pick(opt)}
              disabled={picked !== null}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-left text-sm transition",
                picked === null && "border-slate-300 hover:border-slate-400",
                isCorrect && "border-[var(--color-accent)] bg-[var(--color-accent-50)]",
                isWrong && "border-[var(--color-danger)] bg-[var(--color-danger-50)]",
                picked !== null && !isCorrect && !isWrong && "opacity-70",
              )}
            >
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-xs font-bold text-slate-700">
                {opt}
              </span>
              <span className="flex-1 text-slate-700">{q.options[opt]}</span>
              {isCorrect && <Check className="h-4 w-4 text-[var(--color-accent)]" />}
              {isWrong && <X className="h-4 w-4 text-[var(--color-danger)]" />}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {picked && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3"
          >
            <div className="text-xs font-semibold text-slate-700">
              {picked === q.correct ? "Correct" : `Correct answer: ${q.correct}`}
            </div>
            <div className="mt-1 text-xs text-slate-600 leading-relaxed">
              {q.explanation}
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={next}
                className="rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-brand-600)]"
              >
                {index + 1 >= quiz.questions.length ? "Finish" : "Next"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
