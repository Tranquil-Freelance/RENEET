import { cn } from "@/lib/utils";

export function StreakHeatmap({
  totalDays,
  completed,
  today,
}: {
  totalDays: number;
  completed: Set<number>;
  today: number;
}) {
  return (
    <div className="grid grid-cols-10 gap-1.5">
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => {
        const isToday = d === today;
        const isDone = completed.has(d);
        const isPast = d < today;
        return (
          <div
            key={d}
            title={`Day ${d}${isDone ? " — done" : isToday ? " — today" : isPast ? " — missed" : ""}`}
            className={cn(
              "aspect-square rounded-md border text-[10px] flex items-center justify-center font-medium",
              isDone && "bg-[var(--color-accent)] border-[var(--color-accent)] text-white",
              !isDone && isToday && "bg-[var(--color-warn)] border-[var(--color-warn)] text-white",
              !isDone && !isToday && isPast && "bg-slate-100 border-slate-200 text-slate-500",
              !isDone && !isToday && !isPast && "bg-white border-slate-200 text-slate-400",
            )}
          >
            {d}
          </div>
        );
      })}
    </div>
  );
}
