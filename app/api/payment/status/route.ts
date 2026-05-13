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
 * Three-layer strategy (order of priority):
 *
 *  1. users.paid  — primary flag set by /confirm. Direct lookup by
 *     auth_id = supaUser.id. One query, no joins, bypasses RLS.
 *
 *  2. payments.status = 'paid' — ledger written by /confirm. Fallback
 *     for users who paid before migration 0006 added users.paid.
 *
 *  3. plans.paid = true — original canonical flag. Fallback for oldest
 *     records and cases where the payments upsert failed.
 *
 * All DB reads use the service-role client (when configured) so RLS and
 * current_user_id() EXECUTE-grant issues can never return false negatives.
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

  // All DB reads use service-role (bypasses RLS). Identity confirmed above.
  const db = isSupabaseConfigured() ? getServiceClient() : supa;

  // ── Layer 1: users.paid (primary, fastest, most reliable) ─────────────────
  // Look up directly by auth_id — no need to resolve the internal user ID.
  const { data: userRow, error: userErr } = await db
    .from("users")
    .select("id, paid, paid_at")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!userErr && userRow?.paid) {
    return NextResponse.json({ paid: true, source: "users", paid_at: userRow.paid_at });
  }

  // Resolve internal user ID for the fallback checks.
  // Use the existing userRow.id if we already have it; otherwise call the helper.
  const userId: string | null = userRow?.id ?? (await getOrCreateAppUserId());
  if (!userId) {
    return NextResponse.json({ paid: false, reason: "user_not_found" }, { status: 401 });
  }

  // ── Layer 2: payments ledger ───────────────────────────────────────────────
  const { data: paymentRow, error: payErr } = await db
    .from("payments")
    .select("status, txn_ref, order_id")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payErr && paymentRow) {
    // Backfill users.paid so future checks hit Layer 1 (fire-and-forget).
    void db
      .from("users")
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq("id", userId)
      .then(({ error }) => {
        if (error) console.warn("[payment/status] backfill users.paid failed:", error.message);
      });
    return NextResponse.json({
      paid: true,
      source: "payments",
      txn_ref: paymentRow.txn_ref ?? paymentRow.order_id ?? null,
    });
  }

  // ── Layer 3: plans.paid ────────────────────────────────────────────────────
  const { data: planRow, error: planErr } = await db
    .from("plans")
    .select("paid, txn_ref, created_at")
    .eq("user_id", userId)
    .eq("paid", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planErr) {
    console.error("[payment/status] plans query error:", planErr.message);
    return NextResponse.json({ error: planErr.message }, { status: 500 });
  }

  if (planRow?.paid) {
    // Backfill users.paid so future checks hit Layer 1 (fire-and-forget).
    void db
      .from("users")
      .update({ paid: true, paid_at: planRow.created_at ?? new Date().toISOString() })
      .eq("id", userId)
      .then(({ error }) => {
        if (error) console.warn("[payment/status] backfill users.paid from plans failed:", error.message);
      });
    return NextResponse.json({
      paid: true,
      source: "plans",
      txn_ref: planRow.txn_ref ?? null,
    });
  }

  return NextResponse.json({ paid: false });
}
