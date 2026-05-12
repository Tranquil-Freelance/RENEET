import { NextResponse } from "next/server";
import {
  getOrCreateAppUserId,
  getServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ plan: null, dev: true });
  }
  const userId = await getOrCreateAppUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const service = getServiceClient();
  const { data, error } = await service
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
