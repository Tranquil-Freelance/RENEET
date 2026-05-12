"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import type { SWOT } from "@/types";

interface Props {
  swot: SWOT;
  userName: string;
  onClose: () => void;
}

export function ShareCard({ swot, userName, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function download() {
    const el = cardRef.current;
    if (!el) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(el, {
        backgroundColor: "#0f172a",
        scale: 2,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `prepinsights-swot-${Date.now()}.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  }

  const topWeakness = swot.weaknesses[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Share your SWOT</div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={cardRef}
          className="mt-3 rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6 text-white"
        >
          <div className="flex items-center gap-2">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-brand)] font-bold text-white">
              P
            </div>
            <div className="text-sm font-semibold">PrepInsights</div>
            <div className="text-xs opacity-60">· Re-NEET 2026</div>
          </div>

          <div className="mt-5">
            <div className="text-xs uppercase tracking-wider opacity-70">
              {userName.split(" ")[0]}&apos;s estimated score
            </div>
            <div className="mt-1 text-5xl font-bold tracking-tight">
              {swot.estimated_score.min}–{swot.estimated_score.max}
              <span className="ml-2 text-sm font-normal opacity-70">/ 720</span>
            </div>
            <div className="mt-2 text-xs opacity-80">
              {swot.estimated_percentile}
            </div>
          </div>

          {topWeakness && (
            <div className="mt-5 rounded-xl bg-white/10 p-3 backdrop-blur">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-warn)]">
                Top fix
              </div>
              <div className="mt-1 text-sm font-semibold">
                {topWeakness.topic} · {topWeakness.subtopic}
              </div>
              <div className="mt-0.5 text-xs opacity-80">
                -{topWeakness.marks_lost} marks · ~{topWeakness.fix_time_hours}h to fix
              </div>
            </div>
          )}

          <div className="mt-5 text-[11px] opacity-60">
            Get your own free SWOT at tranquilai.in
          </div>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={download}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)] disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
