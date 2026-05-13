import { NextResponse } from "next/server";
import {
  getOrCreateAppUserId,
  getServerSupabase,
  getServiceClient,
  isSupabaseAuthConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 20;

/**
 * Returns { paid: boolean } for the currently signed-in user.
 *
 * Strategy (order of priority):
 *  1. Use the service-role client when available — bypasses RLS so results are
 *     never silently blocked by missing EXECUTE grants on current_user_id().
 *  2. Fall back to the session-bound (anon) client if no service key.
 *  3. Always check BOTH `payments` AND `plans` tables — `plans` is the canonical
 *     unlock flag and is written first in /api/payment/confirm; `payments` is the
 *     ledger. Either one being paid → user is paid.
 */
export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json({ paid: false, reason: "supabase_not_configured" });
  }

  // Verify caller's identity via their JWT cookie.
  const supa = await getServerSupabase();
  const {
    data: { user },
    error: authErr,
  } = await supa.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ paid: false, reason: "not_signed_in" }, { status: 401 });
  }

  const userId = await getOrCreateAppUserId();
  if (!userId) {
    return NextResponse.json({ paid: false, reason: "not_signed_in" }, { status: 401 });
  }

  // Use service-role client for data reads: it bypasses RLS and is not affected
  // by EXECUTE permission on current_user_id(). We already confirmed the user's
  // identity above, so this is safe.
  const db = isSupabaseConfigured() ? getServiceClient() : supa;

  // --- Check payments ledger -------------------------------------------------
  const { data: paymentRow, error: payErr } = await db
    .from("payments")
    .select("status, txn_ref, order_id")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payErr && paymentRow) {
    return NextResponse.json({
      paid: true,
      txn_ref: paymentRow.txn_ref ?? paymentRow.order_id ?? null,
    });
  }

  // --- Always fall back to plans (canonical unlock flag) ---------------------
  // This handles cases where the payments ledger upsert failed or the table
  // doesn't exist yet (pre-migration), but /confirm already wrote plans.paid.
  const { data: planRow, error: planErr } = await db
    .from("plans")
    .select("paid, txn_ref")
    .eq("user_id", userId)
    .eq("paid", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planErr) {
    console.error("[payment/status] plans query error:", planErr.message);
    return NextResponse.json({ error: planErr.message }, { status: 500 });
  }

  return NextResponse.json({
    paid: Boolean(planRow?.paid),
    txn_ref: planRow?.txn_ref ?? null,
  });
}
