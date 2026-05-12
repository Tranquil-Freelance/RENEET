import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-600">
      <Loader2 className="h-7 w-7 animate-spin text-[var(--color-brand)]" />
      <div className="text-sm">Loading…</div>
    </div>
  );
}
