import { SwotView } from "@/components/swot/SwotView";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type { SWOT } from "@/types";

interface PageProps {
  searchParams: Promise<{ analysisId?: string }>;
}

export default async function SwotPage({ searchParams }: PageProps) {
  const params = await searchParams;
  let initialSwot: SWOT | null = null;

  if (params.analysisId && isSupabaseConfigured() && !params.analysisId.startsWith("dev-")) {
    try {
      const supabase = getServiceClient();
      const { data } = await supabase
        .from("analyses")
        .select("swot")
        .eq("id", params.analysisId)
        .maybeSingle();
      if (data?.swot) initialSwot = data.swot as SWOT;
    } catch {
      /* fall through, client will fetch */
    }
  }

  return (
    <main className="min-h-screen bg-paper pb-32">
      <SwotView initialSwot={initialSwot} />
    </main>
  );
}
