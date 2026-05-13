import { NextResponse } from "next/server";
import {
  getOrCreateAppUserId,
  getServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ paid: false, reason: "supabase_not_configured" });
  }

  const userId = await getOrCreateAppUserId();
  if (!userId) {
    return NextResponse.json({ paid: false, reason: "not_signed_in" }, { status: 401 });
  }

  const service = getServiceClient();
  const { data, error } = await service
    .from("plans")
    .select("paid, txn_ref, updated_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    paid: Boolean(data?.paid),
    txn_ref: data?.txn_ref ?? null,
  });
}

