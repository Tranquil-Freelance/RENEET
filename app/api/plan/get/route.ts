import { NextResponse } from "next/server";
import { getServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  if (!isSupabaseConfigured() || userId.startsWith("dev-")) {
    return NextResponse.json({ plan: null, dev: true });
  }

  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("plans")
    .select("plan_json, paid")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plan: data?.plan_json ?? null, paid: data?.paid ?? false });
}
