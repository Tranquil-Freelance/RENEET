import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateAppUserId, getServerSupabase, isSupabaseAuthConfigured } from "@/lib/supabase-server";
import {
  PAYMENT_AMOUNT_PAISE,
  PAYMENT_PROVIDER,
  fetchCashfreeOrder,
  isCashfreeConfigured,
  isValidCashfreeOrderId,
} from "@/lib/payment";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  order_id: z.string().min(6).max(64),
});

/**
 * Verify a Cashfree order and mark the user's latest plan as paid.
 *
 * We don't trust anything the client sends except the order_id — we re-fetch
 * the order from Cashfree and only accept order_status === "PAID".
 */
export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof z.ZodError ? err.issues[0]?.message : "Invalid request" },
      { status: 400 },
    );
  }

  const orderId = parsed.order_id.trim();
  if (!isValidCashfreeOrderId(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  if (!isCashfreeConfigured()) {
    return NextResponse.json(
      { error: "Cashfree credentials missing on the server." },
      { status: 503 },
    );
  }

  let orderStatus: string;
  let amountPaise: number;
  try {
    const order = await fetchCashfreeOrder(orderId);
    orderStatus = order.order_status;
    amountPaise = Math.round(order.order_amount * 100);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cashfree lookup failed";
    console.error("[payment/confirm]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (orderStatus !== "PAID") {
    return NextResponse.json(
      {
        error: `Payment not completed (status: ${orderStatus}). If you just paid, wait a few seconds and retry.`,
        order_status: orderStatus,
      },
      { status: 402 },
    );
  }

  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json({
      ok: true,
      paid: true,
      dev: true,
      order_id: orderId,
      warning: "Supabase auth not configured — payment verified but not persisted.",
    });
  }

  const supa = await getServerSupabase();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const userId = await getOrCreateAppUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: existing } = await supa
    .from("plans")
    .select("id, paid")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const paymentPayload = {
    paid: true,
    txn_ref: orderId,
    amount_paise: amountPaise || PAYMENT_AMOUNT_PAISE,
    payment_method: PAYMENT_PROVIDER,
  };

  // Unlock in `plans` first so a paid user is never blocked by ledger issues
  // (e.g. missing `payments` table, transient PostgREST errors).
  if (existing?.id) {
    const { error } = await supa.from("plans").update(paymentPayload).eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supa.from("plans").insert({ user_id: userId, ...paymentPayload });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: ledgerErr } = await supa.from("payments").upsert(
    {
      user_id: userId,
      provider: PAYMENT_PROVIDER,
      order_id: orderId,
      status: "paid",
      txn_ref: orderId,
      amount_paise: amountPaise || PAYMENT_AMOUNT_PAISE,
      currency: "INR",
      raw_order: { order_status: orderStatus },
    },
    { onConflict: "order_id" },
  );
  if (ledgerErr) {
    console.error("[payment/confirm] payments ledger upsert failed:", ledgerErr.message);
  }

  return NextResponse.json({ ok: true, paid: true, order_id: orderId });
}
