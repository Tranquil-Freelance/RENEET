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
    .from("payments")
    .select("status, txn_ref, order_id, created_at")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Backward compatibility: older DBs may not have the payments ledger yet.
    const { data: planData, error: planErr } = await service
      .from("plans")
      .select("paid, txn_ref, created_at")
      .eq("user_id", userId)
      .eq("paid", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (planErr) {
      return NextResponse.json({ error: planErr.message }, { status: 500 });
    }
    return NextResponse.json({
      paid: Boolean(planData?.paid),
      txn_ref: planData?.txn_ref ?? null,
    });
  }

  return NextResponse.json({
    paid: Boolean(data),
    txn_ref: data?.txn_ref ?? data?.order_id ?? null,
  });
}

