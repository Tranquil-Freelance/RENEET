import { NextResponse } from "next/server";
import { getOrCreateAppUserId, getServerSupabase, isSupabaseAuthConfigured } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json({ paid: false, reason: "supabase_not_configured" });
  }

  const supa = await getServerSupabase();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ paid: false, reason: "not_signed_in" }, { status: 401 });
  }

  const userId = await getOrCreateAppUserId();
  if (!userId) {
    return NextResponse.json({ paid: false, reason: "not_signed_in" }, { status: 401 });
  }

  const { data, error } = await supa
    .from("payments")
    .select("status, txn_ref, order_id, created_at")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    const { data: planData, error: planErr } = await supa
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
