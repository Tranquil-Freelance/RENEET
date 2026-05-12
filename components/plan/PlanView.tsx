"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  Lightbulb,
  Loader2,
  Share2,
  Trophy,
} from "lucide-react";
import type { PlanDay, StudyPlan, SwotCategory } from "@/types";
import { cn } from "@/lib/utils";

const CATEGORY_META: Record<
  SwotCategory,
  { label: string; color: string; bg: string; Icon: typeof Flame }
> = {
  weakness: {
    label: "Weakness",
    color: "var(--color-danger)",
    bg: "var(--color-danger-50)",
    Icon: Flame,
  },
  opportunity: {
    label: "Opportunity",
    color: "var(--color-brand)",
    bg: "var(--color-brand-50)",
    Icon: Lightbulb,
  },
  threat: {
    label: "Threat",
    color: "var(--color-warn)",
    bg: "var(--color-warn-50)",
    Icon: BookOpen,
  },
  strength: {
    label: "Strength",
    color: "var(--color-accent)",
    bg: "var(--color-accent-50)",
    Icon: Trophy,
  },
};

export function PlanView() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [doneDays, setDoneDays] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("prepinsights:planDone");
    if (saved) {
      try {
        setDoneDays(new Set(JSON.parse(saved)));
      } catch {}
    }

    function readCachedPlan(): StudyPlan | null {
      try {
        const raw = localStorage.getItem("prepinsights:plan");
        if (!raw) return null;
        return JSON.parse(raw) as StudyPlan;
      } catch {
        return null;
      }
    }

    fetch(`/api/plan/get`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Could not load plan");
        return r.json();
      })
      .then((data) => {
        if (data.plan) {
          setPlan(data.plan as StudyPlan);
          try {
            localStorage.setItem("prepinsights:plan", JSON.stringify(data.plan));
          } catch {
            /* ignore */
          }
          return;
        }
        // Dev-mode fallback: when Supabase isn't configured the server returns
        // {plan: null, dev: true}. Use the client cache written on payment success.
        const cached = readCachedPlan();
        if (cached) {
          setPlan(cached);
        } else {
          toast.error("No plan found yet. Complete payment to unlock it.");
        }
      })
      .catch(() => {
        const cached = readCachedPlan();
        if (cached) setPlan(cached);
        else toast.error("Could not load plan");
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleDone(day: number) {
    setDoneDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      try {
        localStorage.setItem("prepinsights:planDone", JSON.stringify([...next]));
      } catch {}
      fetch("/api/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dayNumber: day,
          completed: !prev.has(day),
          action: "toggle",
        }),
      }).catch(() => {});
      return next;
    });
  }

  async function downloadPdf() {
    if (!plan) return;
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      let y = 50;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("PrepInsights — 30-Day Plan", 40, y);
      y += 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      const summary = doc.splitTextToSize(plan.plan_summary, W - 80);
      doc.text(summary, 40, y);
      y += summary.length * 12 + 10;

      doc.setTextColor(20);
      for (const week of plan.weeks) {
        if (y > 760) {
          doc.addPage();
          y = 50;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(`Week ${week.week_number} — ${week.theme}`, 40, y);
        y += 16;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(week.weekly_goal, 40, y);
        y += 14;
        doc.setTextColor(20);
        for (const d of week.days) {
          if (y > 770) {
            doc.addPage();
            y = 50;
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.text(`Day ${d.day}: ${d.focus_topic} (${d.subject})`, 40, y);
          y += 13;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(80);
          for (const t of d.tasks) {
            const line = `• ${t.time_minutes}m — ${t.activity} [${t.resource}]`;
            const wrapped = doc.splitTextToSize(line, W - 80);
            if (y + wrapped.length * 11 > 780) {
              doc.addPage();
              y = 50;
            }
            doc.text(wrapped, 50, y);
            y += wrapped.length * 11;
          }
          doc.setTextColor(20);
          y += 6;
        }
        y += 8;
      }

      doc.save(`prepinsights-30day-plan.pdf`);
    } finally {
      setExporting(false);
    }
  }

  function shareToWhatsApp() {
    if (!plan) return;
    const text = encodeURIComponent(
      `I just got my Re-NEET 2026 study plan from PrepInsights.\n\n${plan.plan_summary}\n\nGet yours: https://tranquilai.in`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  const currentWeek = useMemo(
    () => plan?.weeks.find((w) => w.week_number === activeWeek) ?? plan?.weeks[0],
    [plan, activeWeek],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--color-brand)]" />
        <div className="text-sm">Loading your plan…</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">No plan yet</h1>
        <p className="mt-2 text-sm text-slate-600">
          Complete your exam analysis and unlock the plan to see it here.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Start fresh <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const totalDays = plan.weeks.reduce((s, w) => s + w.days.length, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
            Your 30-day plan
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold">
            From SWOT to your seat in college
          </h1>
          <p className="mt-2 text-sm text-slate-600">{plan.plan_summary}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={shareToWhatsApp}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            PDF
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Days planned" value={String(totalDays)} icon={CalendarDays} />
        <Stat label="Daily avg" value={`${plan.daily_avg_hours}h`} icon={Clock} />
        <Stat label="Mock tests" value={plan.mock_test_days.join(", ")} icon={BookOpen} />
        <Stat
          label="Done"
          value={`${doneDays.size} / ${totalDays}`}
          icon={CheckCircle2}
        />
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {plan.weeks.map((w) => (
          <button
            key={w.week_number}
            type="button"
            onClick={() => setActiveWeek(w.week_number)}
            className={cn(
              "shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition",
              activeWeek === w.week_number
                ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
            )}
          >
            <div>Week {w.week_number}</div>
            <div
              className={cn(
                "text-[10px]",
                activeWeek === w.week_number ? "text-white/80" : "text-slate-500",
              )}
            >
              {w.theme}
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeWeek}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mt-4 space-y-3"
        >
          {currentWeek && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <div className="font-semibold text-slate-800">{currentWeek.theme}</div>
              <div className="text-xs text-slate-500">{currentWeek.weekly_goal}</div>
            </div>
          )}
          {currentWeek?.days.map((d) => (
            <DayCard
              key={d.day}
              day={d}
              done={doneDays.has(d.day)}
              onToggle={() => toggleDone(d.day)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex justify-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
        >
          Go to today&apos;s focus <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Flame;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 inline-flex items-center gap-1">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-xl font-bold text-slate-800">{value}</div>
    </div>
  );
}

function DayCard({
  day,
  done,
  onToggle,
}: {
  day: PlanDay;
  done: boolean;
  onToggle: () => void;
}) {
  const meta = CATEGORY_META[day.swot_category] ?? CATEGORY_META.weakness;
  const Icon = meta.Icon;
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 transition",
        done ? "border-[var(--color-accent)] bg-[var(--color-accent-50)]" : "border-slate-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Day {day.day}</span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: meta.bg, color: meta.color }}
            >
              <Icon className="h-3 w-3" /> {meta.label}
            </span>
            <span className="text-[10px] uppercase text-slate-400">
              {day.subject}
            </span>
          </div>
          <div className="mt-1 font-semibold text-slate-800">{day.focus_topic}</div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            done
              ? "bg-[var(--color-accent)] text-white"
              : "border border-slate-300 text-slate-600 hover:border-slate-400",
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {done ? "Done" : "Mark done"}
        </button>
      </div>

      <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
        {day.tasks.map((t, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
            <div>
              <span className="font-medium">{t.activity}</span>{" "}
              <span className="text-slate-400">· {t.time_minutes} min</span>
              <div className="text-xs text-slate-500">{t.resource} — {t.goal}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Total · {day.total_hours}h</span>
        <span className="italic text-slate-600">“{day.motivation}”</span>
      </div>
    </div>
  );
}
