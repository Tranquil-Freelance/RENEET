import type { SWOT, Subject } from "@/types";

const SUBJECT_LABEL: Record<Subject, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
};

const SUBJECT_TOTAL: Record<Subject, number> = {
  physics: 45,
  chemistry: 45,
  biology: 90,
};

export function ScoreBanner({ swot }: { swot: SWOT }) {
  const total =
    Object.values(swot.subject_scores).reduce((s, v) => s + v.net_marks, 0);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[var(--color-brand)] via-[var(--color-brand-600)] to-[var(--color-brand-700)] p-6 text-white shadow-xl shadow-blue-500/20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider opacity-80">
            Estimated NEET 2026 score
          </div>
          <div className="mt-1 text-4xl md:text-5xl font-bold leading-none">
            {swot.estimated_score.min}–{swot.estimated_score.max}
            <span className="ml-2 text-sm font-normal opacity-80">/ 720</span>
          </div>
          <div className="mt-2 text-sm opacity-90">
            Predicted percentile: <span className="font-semibold">{swot.estimated_percentile}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider opacity-80">Net marks</div>
          <div className="text-3xl font-bold">{total}</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {(Object.keys(swot.subject_scores) as Subject[]).map((s) => {
          const sc = swot.subject_scores[s];
          return (
            <div
              key={s}
              className="rounded-xl bg-white/15 backdrop-blur p-3 text-center"
            >
              <div className="text-[11px] uppercase tracking-wider opacity-80">
                {SUBJECT_LABEL[s]}
              </div>
              <div className="mt-1 text-xl font-bold">{sc.net_marks}</div>
              <div className="mt-1 text-[10px] opacity-90">
                {sc.correct + sc.guessed_right}/{SUBJECT_TOTAL[s]} right · {sc.wrong} wrong · {sc.blank} blank
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
