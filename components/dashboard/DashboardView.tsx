"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Flame,
  Loader2,
  Quote,
  Sparkles,
} from "lucide-react";
import type { CheckInQuiz, PlanDay, StudyPlan } from "@/types";
import { DailyQuiz } from "./DailyQuiz";
import { StreakHeatmap } from "./StreakHeatmap";
import { cn } from "@/lib/utils";

export function DashboardView() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [day, setDay] = useState(1);
  const [quiz, setQuiz] = useState<CheckInQuiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [quote, setQuote] = useState<string>("");
  const [name, setName] = useState("there");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("neetsurge:userId");
    setName(localStorage.getItem("neetsurge:userName") ?? "there");
    if (!userId) {
      toast.error("Please complete onboarding first.");
      setLoading(false);
      return;
    }

    const stored = localStorage.getItem("neetsurge:planDone");
    if (stored) {
      try {
        setCompletedDays(new Set(JSON.parse(stored)));
      } catch {}
    }

    Promise.all([
      fetch(`/api/plan/get?userId=${encodeURIComponent(userId)}`).then((r) =>
        r.json(),
      ),
      fetch(`/api/motivation?userId=${encodeURIComponent(userId)}&day=1`).then((r) =>
        r.json().catch(() => ({ quote: "" })),
      ),
    ])
      .then(([planRes, motiRes]) => {
        setPlan(planRes.plan ?? null);
        if (motiRes.quote) setQuote(motiRes.quote);
      })
      .finally(() => setLoading(false));
  }, []);

  const today: PlanDay | null = useMemo(() => {
    if (!plan) return null;
    for (const w of plan.weeks) {
      const d = w.days.find((dd) => dd.day === day);
      if (d) return d;
    }
    return null;
  }, [plan, day]);

  const loadQuiz = useCallback(
    async (dayNumber: number) => {
      const userId = localStorage.getItem("neetsurge:userId");
      if (!userId) return;
      setQuizLoading(true);
      setQuiz(null);
      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userId, dayNumber, action: "fetch" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Quiz fetch failed");
        setQuiz(data.quiz ?? null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not load quiz");
      } finally {
        setQuizLoading(false);
      }
    },
    [],
  );

  function markDone(dayNumber: number) {
    setCompletedDays((prev) => {
      const next = new Set(prev);
      next.add(dayNumber);
      try {
        localStorage.setItem("neetsurge:planDone", JSON.stringify([...next]));
      } catch {}
      return next;
    });
    const userId = localStorage.getItem("neetsurge:userId");
    if (userId) {
      fetch("/api/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId,
          dayNumber,
          action: "toggle",
          completed: true,
        }),
      }).catch(() => {});
    }
  }

  function submitQuizScore(score: number) {
    const userId = localStorage.getItem("neetsurge:userId");
    if (!userId) return;
    fetch("/api/checkin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, dayNumber: day, action: "submit", score }),
    }).catch(() => {});
    markDone(day);
  }

  const totalDays = plan?.weeks.reduce((s, w) => s + w.days.length, 0) ?? 0;
  const streak = computeStreak(completedDays, day);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--color-brand)]" />
        <div className="text-sm">Loading your day…</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">No plan yet</h1>
        <p className="mt-2 text-sm text-slate-600">
          Unlock your 30-day plan from the SWOT page to start daily check-ins.
        </p>
        <Link
          href="/swot"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Go to my SWOT <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
          Day {day} of {totalDays || 30}
        </div>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold">
          Hi {name.split(" ")[0]}, ready for today?
        </h1>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Pill label="Streak" value={`${streak} day${streak === 1 ? "" : "s"}`} icon={Flame} accent="var(--color-warn)" />
        <Pill label="Done" value={`${completedDays.size}`} icon={CheckCircle2} accent="var(--color-accent)" />
        <Pill label="Today" value={`${today?.total_hours ?? 0}h`} icon={CalendarCheck} accent="var(--color-brand)" />
      </div>

      {quote && (
        <div className="mt-5 rounded-xl bg-[var(--color-ink)] text-white px-4 py-3 flex items-start gap-2">
          <Quote className="h-4 w-4 mt-0.5 text-[var(--color-brand)] shrink-0" />
          <p className="text-sm leading-relaxed">{quote}</p>
        </div>
      )}

      {today ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Today&apos;s focus
          </div>
          <h2 className="mt-1 text-xl font-bold">{today.focus_topic}</h2>
          <div className="mt-1 text-xs text-slate-500">
            {today.subject} · {today.swot_category} · ~{today.total_hours}h
          </div>

          <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
            {today.tasks.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                <div>
                  <span className="font-medium">{t.activity}</span>{" "}
                  <span className="text-slate-400">· {t.time_minutes}m</span>
                  <div className="text-xs text-slate-500">{t.goal}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadQuiz(day)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
            >
              <Sparkles className="h-4 w-4" /> Start today&apos;s quiz
            </button>
            {!completedDays.has(day) && (
              <button
                type="button"
                onClick={() => markDone(day)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
              >
                <CheckCircle2 className="h-4 w-4" /> Mark day done
              </button>
            )}
          </div>
        </section>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          No task scheduled for day {day}.
        </div>
      )}

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Last 30 days</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <DayPicker day={day} maxDay={totalDays || 30} onChange={setDay} />
          </div>
        </div>
        <div className="mt-3">
          <StreakHeatmap totalDays={totalDays || 30} completed={completedDays} today={day} />
        </div>
      </section>

      {(quizLoading || quiz) && (
        <section className="mt-8">
          <h3 className="text-sm font-semibold text-slate-700">Today&apos;s 5-question check-in</h3>
          <div className="mt-3">
            {quizLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Generating quiz…
              </div>
            ) : quiz ? (
              <DailyQuiz quiz={quiz} onComplete={submitQuizScore} />
            ) : null}
          </div>
        </section>
      )}

      <div className="my-10 text-center">
        <Link href="/plan" className="text-sm text-slate-500 hover:text-slate-800 underline">
          See full 30-day plan
        </Link>
      </div>
    </div>
  );
}

function Pill({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Flame;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 inline-flex items-center gap-1">
        <Icon className="h-3.5 w-3.5" style={{ color: accent }} /> {label}
      </div>
      <div className="mt-1 text-xl font-bold text-slate-800">{value}</div>
    </div>
  );
}

function DayPicker({
  day,
  maxDay,
  onChange,
}: {
  day: number;
  maxDay: number;
  onChange: (d: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, day - 1))}
        className={cn(
          "h-7 w-7 rounded-md border border-slate-300 text-sm text-slate-600 hover:bg-slate-50",
          day <= 1 && "opacity-50 cursor-not-allowed",
        )}
        disabled={day <= 1}
      >
        −
      </button>
      <span className="text-xs w-12 text-center">Day {day}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(maxDay, day + 1))}
        className={cn(
          "h-7 w-7 rounded-md border border-slate-300 text-sm text-slate-600 hover:bg-slate-50",
          day >= maxDay && "opacity-50 cursor-not-allowed",
        )}
        disabled={day >= maxDay}
      >
        +
      </button>
    </div>
  );
}

function computeStreak(completed: Set<number>, today: number): number {
  let streak = 0;
  for (let d = today; d >= 1; d--) {
    if (completed.has(d)) streak++;
    else break;
  }
  return streak;
}
