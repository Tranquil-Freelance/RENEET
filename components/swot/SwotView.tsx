"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, ArrowRightCircle, Loader2, Lock, Share2, Sparkles, Zap } from "lucide-react";
import type { SWOT, Subject } from "@/types";
import { SwotCards } from "./SwotCards";
import { ScoreBanner } from "./ScoreBanner";
import { TopicScoreCard } from "./TopicScoreCard";
import { ShareCard } from "./ShareCard";
import { PaymentCTA } from "./PaymentCTA";
import { cn } from "@/lib/utils";
import { trackGenerateLead } from "@/lib/gtag-client";

const SUBJECT_TAB_LABEL: Record<Subject, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
};

const SUBJECT_TOTAL: Record<Subject, number> = {
  physics: 45,
  chemistry: 45,
  biology: 90,
};

interface Props {
  initialSwot: SWOT | null;
}

function readLocalPaid(): boolean {
  try {
    return localStorage.getItem("prepinsights:paid") === "true";
  } catch {
    return false;
  }
}

export function SwotView({ initialSwot }: Props) {
  const router = useRouter();
  const [swot, setSwot] = useState<SWOT | null>(initialSwot);
  const [loading, setLoading] = useState(initialSwot === null);
  const [paidUnlocked, setPaidUnlocked] = useState(false);
  const [checkingPaid, setCheckingPaid] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [userName, setUserName] = useState("there");
  const [activeSection, setActiveSection] = useState<Subject>("physics");
  const generateLeadSent = useRef(false);

  useEffect(() => {
    if (loading || !swot || generateLeadSent.current) return;
    generateLeadSent.current = true;
    trackGenerateLead();
  }, [loading, swot]);

  useEffect(() => {
    setUserName(localStorage.getItem("prepinsights:userName") ?? "there");
    if (readLocalPaid()) {
      setPaidUnlocked(true);
      setCheckingPaid(false);
    }
    if (swot) return;

    try {
      const cachedRaw = localStorage.getItem("prepinsights:swot");
      if (cachedRaw) {
        setSwot(JSON.parse(cachedRaw) as SWOT);
        setLoading(false);
        return;
      }
    } catch {
      /* ignore */
    }

    const answersRaw = localStorage.getItem("prepinsights:answers");
    if (!answersRaw) {
      toast.error("No exam data found. Please mark your answers first.");
      router.push("/exam");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ answers: JSON.parse(answersRaw) }),
        });
        if (res.status === 401) {
          toast.error("Please sign in to view your SWOT.");
          router.push("/login?next=/swot");
          return;
        }
        if (!res.ok) throw new Error("Analysis failed");
        const data = await res.json();
        if (!cancelled) {
          setSwot(data.swot);
          try {
            if (data.swot) localStorage.setItem("prepinsights:swot", JSON.stringify(data.swot));
            if (data.overall)
              localStorage.setItem("prepinsights:overall", JSON.stringify(data.overall));
          } catch {
            /* ignore */
          }
          if (data.analysisId) localStorage.setItem("prepinsights:analysisId", data.analysisId);
        }
      } catch (err) {
        if (!cancelled)
          toast.error(err instanceof Error ? err.message : "Could not analyze");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, swot]);

  useEffect(() => {
    let cancelled = false;

    async function checkPaidStatus(attempt = 1): Promise<void> {
      try {
        const res = await fetch("/api/payment/status", { cache: "no-store", credentials: "include" });

        // On 401/server error: retry once after 2 seconds. The session cookie
        // may not yet be propagated on first mount (e.g. right after sign-in).
        if (!res.ok) {
          if (res.status === 401 && attempt === 1) {
            setTimeout(() => {
              if (!cancelled) void checkPaidStatus(2);
            }, 2000);
            return;
          }
          if (res.status !== 401) {
            const body = await res.json().catch(() => ({}));
            console.warn("[swot] payment status lookup failed", body);
          }
          if (!cancelled) setCheckingPaid(false);
          return;
        }

        const body = await res.json();
        const serverPaid = Boolean(body.paid);
        if (!cancelled) {
          setPaidUnlocked(serverPaid);
          try {
            if (serverPaid) {
              localStorage.setItem("prepinsights:paid", "true");
            } else {
              localStorage.removeItem("prepinsights:paid");
            }
          } catch {
            /* ignore */
          }
          setCheckingPaid(false);
        }
      } catch (err) {
        console.warn("[swot] payment status request error", err);
        if (!cancelled) setCheckingPaid(false);
      }
    }

    void checkPaidStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !swot) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--color-brand)]" />
        <div className="text-sm">Analyzing your exam with AI…</div>
        <div className="text-xs text-slate-400">This takes about 15–30 seconds</div>
      </div>
    );
  }

  const isLocked = !paidUnlocked;

  // --- Per-section derived data ---
  const sectionSwot: SWOT = {
    ...swot,
    strengths: swot.strengths.filter((i) => i.subject === activeSection),
    weaknesses: swot.weaknesses.filter((i) => i.subject === activeSection),
    opportunities: swot.opportunities.filter((i) => i.subject === activeSection),
    threats: swot.threats.filter((i) => i.subject === activeSection),
  };

  const previewSectionSwot: SWOT = {
    ...sectionSwot,
    strengths: sectionSwot.strengths.slice(0, 1),
    weaknesses: sectionSwot.weaknesses.slice(0, 1),
    opportunities: sectionSwot.opportunities.slice(0, 1),
    threats: sectionSwot.threats.slice(0, 1),
  };

  const cardsSwot = isLocked ? previewSectionSwot : sectionSwot;

  const lockedHidden = isLocked
    ? {
        strengths: Math.max(0, sectionSwot.strengths.length - previewSectionSwot.strengths.length),
        weaknesses: Math.max(0, sectionSwot.weaknesses.length - previewSectionSwot.weaknesses.length),
        opportunities: Math.max(0, sectionSwot.opportunities.length - previewSectionSwot.opportunities.length),
        threats: Math.max(0, sectionSwot.threats.length - previewSectionSwot.threats.length),
      }
    : undefined;

  // Tab issue-count badges
  const tabBadge = (s: Subject) =>
    swot.weaknesses.filter((i) => i.subject === s).length +
    swot.opportunities.filter((i) => i.subject === s).length;

  // Global marks recoverable (for PaymentCTA)
  const totalMarksLost =
    swot.weaknesses.reduce((s, w) => s + w.marks_lost, 0) +
    swot.opportunities.reduce((s, o) => s + o.marks_recoverable, 0);

  // Section stats
  const sc = swot.subject_scores[activeSection];
  const sectionTotal = SUBJECT_TOTAL[activeSection];
  const sectionAccuracy = sectionTotal > 0
    ? Math.round(((sc.correct + sc.guessed_right) / sectionTotal) * 100)
    : 0;
  const sectionRecoverable = swot.opportunities
    .filter((i) => i.subject === activeSection)
    .reduce((sum, o) => sum + o.marks_recoverable, 0);
  const sectionActionCount = tabBadge(activeSection);

  // Priority actions (unlocked only — top weakness + top opportunity for section)
  const topWeakness = sectionSwot.weaknesses[0];
  const topOpportunity = sectionSwot.opportunities[0];

  // Per-section bullet counts for locked upsell
  const unlockedBullets = (["physics", "chemistry", "biology"] as const).map((s) => {
    const w = swot.weaknesses.filter((i) => i.subject === s).length;
    const o = swot.opportunities.filter((i) => i.subject === s).length;
    const t = swot.threats.filter((i) => i.subject === s).length;
    const r = swot.opportunities
      .filter((i) => i.subject === s)
      .reduce((sum, op) => sum + op.marks_recoverable, 0);
    return { subject: s, w, o, t, r };
  });

  return (
    <div className={cn("mx-auto max-w-4xl px-4 py-6", isLocked && "pb-32")}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
            Your SWOT report
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold">
            Hi {userName.split(" ")[0]}, here&apos;s your gap analysis
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowShare(true)}
          className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      {/* Section tabs with issue-count badges */}
      <div
        className="mt-5 flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1.5"
        role="tablist"
        aria-label="SWOT section"
      >
        {(["physics", "chemistry", "biology"] as const).map((s) => {
          const count = tabBadge(s);
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={activeSection === s}
              onClick={() => setActiveSection(s)}
              className={cn(
                "flex-1 min-w-[5.5rem] rounded-xl px-3 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5",
                activeSection === s
                  ? "bg-white text-[var(--color-brand)] shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-white/80",
              )}
            >
              {SUBJECT_TAB_LABEL[s]}
              {count > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none",
                    activeSection === s
                      ? "bg-[var(--color-brand)] text-white"
                      : "bg-slate-300 text-slate-600",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Score banner (clicking a subject also switches the tab) */}
      <div className="mt-4">
        <ScoreBanner
          swot={swot}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </div>

      {/* Section mini-stats strip */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 px-1">
        <span className="font-semibold text-slate-700">
          {SUBJECT_TAB_LABEL[activeSection]}:
        </span>
        <span className={cn("font-semibold", sc.net_marks >= 0 ? "text-emerald-700" : "text-red-600")}>
          {sc.net_marks >= 0 ? "+" : ""}{sc.net_marks} net marks
        </span>
        <span className="text-slate-300">·</span>
        <span>{sectionAccuracy}% accuracy</span>
        <span className="text-slate-300">·</span>
        {sectionActionCount > 0 ? (
          <span className="text-[var(--color-brand)] font-medium">{sectionActionCount} action items found</span>
        ) : (
          <span>No action items</span>
        )}
        {sectionRecoverable > 0 && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-700 font-medium">+{sectionRecoverable} marks recoverable</span>
          </>
        )}
      </div>

      {/* SWOT cards section */}
      <section className="mt-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="text-base font-bold text-slate-800">
            {isLocked ? "SWOT preview" : "Full SWOT analysis"} — {SUBJECT_TAB_LABEL[activeSection]}
          </h2>
          {isLocked && checkingPaid && (
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking…
            </div>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-4">
          {isLocked
            ? "One insight per quadrant. Switch tabs above to preview other subjects."
            : `All ${SUBJECT_TAB_LABEL[activeSection]} topics ranked by mark impact.`}
        </p>

        <SwotCards swot={cardsSwot} isLocked={isLocked} lockedHidden={lockedHidden} />
      </section>

      {/* Priority actions — unlocked only */}
      {!isLocked && (topWeakness || topOpportunity) && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--color-brand)]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-brand)]">
              Priority actions — {SUBJECT_TAB_LABEL[activeSection]}
            </h2>
          </div>
          {topWeakness && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-1">
                    #1 Weakness to fix
                  </div>
                  <div className="font-semibold text-slate-800 text-sm">{topWeakness.topic}</div>
                  <div className="text-xs text-slate-500">{topWeakness.subtopic}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-red-600">−{topWeakness.marks_lost}</div>
                  <div className="text-[10px] text-slate-400">marks lost</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">~{topWeakness.fix_time_hours}h to fix</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{topWeakness.likely_gap}</p>
            </div>
          )}
          {topOpportunity && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                    #1 Quick win
                  </div>
                  <div className="font-semibold text-slate-800 text-sm">{topOpportunity.topic}</div>
                  <div className="text-xs text-slate-500">{topOpportunity.subtopic}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-blue-700">+{topOpportunity.marks_recoverable}</div>
                  <div className="text-[10px] text-slate-400">recoverable</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">~{topOpportunity.effort_hours}h effort</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{topOpportunity.insight}</p>
            </div>
          )}
        </section>
      )}

      {/* Topic score breakdown — unlocked only */}
      {!isLocked && (
        <section className="mt-8">
          <h2 className="text-base font-bold text-slate-800">Topic-level breakdown</h2>
          <p className="text-sm text-slate-500 mt-0.5 mb-4">
            Every chapter → subtopic, tagged by SWOT category (S/W/O/T) and sorted by mark impact.
          </p>
          <TopicScoreCard swot={swot} defaultOpen={activeSection} />
        </section>
      )}

      {/* Locked upsell — richer with per-section data */}
      {isLocked && (
        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 text-amber-700 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                What you unlock
              </div>
              <div className="space-y-2">
                {unlockedBullets.map(({ subject, w, o, t, r }) => (
                  <div key={subject} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-amber-600 shrink-0" />
                    <span className="text-slate-800">
                      <span className="font-semibold">{SUBJECT_TAB_LABEL[subject]}:</span>{" "}
                      {w > 0 && <span>{w} weakness{w !== 1 ? "es" : ""}</span>}
                      {w > 0 && o > 0 && <span className="text-slate-400"> · </span>}
                      {o > 0 && (
                        <span className="text-emerald-700 font-medium">
                          {o} quick win{o !== 1 ? "s" : ""} (+{r} marks)
                        </span>
                      )}
                      {t > 0 && <span className="text-slate-400"> · {t} threat{t !== 1 ? "s" : ""} to address</span>}
                      {w === 0 && o === 0 && t === 0 && <span className="text-slate-500 italic">no major issues found</span>}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-amber-800 font-medium">
                + Full topic-level breakdown with chapter-by-chapter mark impact, and your personalised 30-day study plan.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Headline insight (always visible — teaser when locked) */}
      <section className="mt-8 rounded-2xl border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-[var(--color-brand)] shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)] mb-1">
              {isLocked ? "AI insight preview" : "The honest take"}
            </div>
            <p className="text-sm text-slate-800 leading-relaxed">
              {swot.headline_insight}
            </p>
            {isLocked && (
              <p className="mt-2 text-xs text-slate-500 italic">
                Unlock to get your full personalised action plan with daily tasks, NCERT references, and mock test schedule.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Mobile share */}
      <div className="md:hidden mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => setShowShare(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
        >
          <Share2 className="h-4 w-4" /> Share my SWOT
        </button>
      </div>

      {/* Fixed bottom CTA — only shown when locked */}
      {isLocked && (
        <PaymentCTA
          totalMarksLost={totalMarksLost}
          ctaLabel="Unlock full SWOT + 30-day plan"
          helperText="See every weakness, opportunity and threat across all sections"
          redirectToPlan={false}
          onPaid={() => {
            setPaidUnlocked(true);
            toast.success("Unlocked! Full SWOT is now visible.");
          }}
        />
      )}

      {/* Inline plan CTA — shown only when unlocked (no persistent banner) */}
      {!isLocked && (
        <section className="mt-8 rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-700)] p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">
                You&apos;re unlocked
              </div>
              <div className="text-lg font-bold">Ready to build your 30-day plan?</div>
              <div className="text-sm opacity-80 mt-0.5">
                Personalised day-by-day tasks, NCERT references, and daily quizzes — all based on your SWOT.
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/plan")}
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-[var(--color-brand)] font-semibold px-5 py-2.5 text-sm shadow hover:brightness-95 transition shrink-0"
            >
              <ArrowRightCircle className="h-4 w-4" />
              Build my plan
            </button>
          </div>
        </section>
      )}

      {showShare && (
        <ShareCard
          swot={swot}
          userName={userName}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
