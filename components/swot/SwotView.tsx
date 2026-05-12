"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Share2, Sparkles } from "lucide-react";
import type { SWOT } from "@/types";
import { SwotCards } from "./SwotCards";
import { ScoreBanner } from "./ScoreBanner";
import { TopicScoreCard } from "./TopicScoreCard";
import { ShareCard } from "./ShareCard";
import { PaymentCTA } from "./PaymentCTA";

interface Props {
  initialSwot: SWOT | null;
}

export function SwotView({ initialSwot }: Props) {
  const router = useRouter();
  const [swot, setSwot] = useState<SWOT | null>(initialSwot);
  const [loading, setLoading] = useState(initialSwot === null);
  const [showShare, setShowShare] = useState(false);
  const [userName, setUserName] = useState("there");

  useEffect(() => {
    setUserName(localStorage.getItem("neetsurge:userName") ?? "there");
    if (swot) return;

    // Prefer the cached SWOT written by OMRSheet on submit success.
    try {
      const cachedRaw = localStorage.getItem("neetsurge:swot");
      if (cachedRaw) {
        setSwot(JSON.parse(cachedRaw) as SWOT);
        setLoading(false);
        return;
      }
    } catch {
      /* ignore */
    }

    const answersRaw = localStorage.getItem("neetsurge:answers");
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
            if (data.swot) localStorage.setItem("neetsurge:swot", JSON.stringify(data.swot));
            if (data.overall)
              localStorage.setItem("neetsurge:overall", JSON.stringify(data.overall));
          } catch {
            /* ignore */
          }
          if (data.analysisId) localStorage.setItem("neetsurge:analysisId", data.analysisId);
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

  if (loading || !swot) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--color-brand)]" />
        <div className="text-sm">Analyzing your exam with AI…</div>
        <div className="text-xs text-slate-400">This takes about 15-30 seconds</div>
      </div>
    );
  }

  const totalMarksLost =
    swot.weaknesses.reduce((s, w) => s + w.marks_lost, 0) +
    swot.opportunities.reduce((s, o) => s + o.marks_recoverable, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
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

      <div className="mt-6">
        <ScoreBanner swot={swot} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Your SWOT at a glance</h2>
        <p className="text-sm text-slate-600">
          Each card is ranked by mark impact. Tap a topic to see the AI&apos;s insight.
        </p>
        <div className="mt-4">
          <SwotCards swot={swot} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Topic score breakdown</h2>
        <p className="text-sm text-slate-600">
          Subject → chapter → subtopic, color-coded by performance.
        </p>
        <div className="mt-4">
          <TopicScoreCard swot={swot} />
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-[var(--color-brand)]" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
              The honest take
            </div>
            <p className="mt-1 text-slate-800 leading-relaxed">
              {swot.headline_insight}
            </p>
          </div>
        </div>
      </section>

      <div className="md:hidden mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => setShowShare(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
        >
          <Share2 className="h-4 w-4" /> Share my SWOT
        </button>
      </div>

      <PaymentCTA totalMarksLost={totalMarksLost} />

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
