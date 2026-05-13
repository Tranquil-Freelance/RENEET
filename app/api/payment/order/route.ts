import { NextResponse } from "next/server";
import {
  PAYMENT_AMOUNT_RS,
  createCashfreeOrder,
  getCashfreeMode,
  isCashfreeConfigured,
} from "@/lib/payment";
import {
  getOrCreateAppUserId,
  getServerSupabase,
  isSupabaseAuthConfigured,
} from "@/lib/supabase-server";
import { getPublicSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Create a Cashfree order for the ₹99 plan unlock.
 *
 * Uses the user's session (anon + cookies + RLS) — no service role required.
 */
export async function POST(req: Request) {
  if (!isCashfreeConfigured()) {
    return NextResponse.json(
      { error: "Cashfree credentials missing — set CASHFREE_APP_ID / CASHFREE_SECRET_KEY." },
      { status: 503 },
    );
  }

  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json(
      { error: "Supabase auth is not configured (URL / anon key)." },
      { status: 503 },
    );
  }

  let userId: string | null = null;
  let customerId = "";
  let customerEmail: string | undefined;
  let customerPhone = "9999999999";

  try {
    const supa = await getServerSupabase();
    const {
      data: { user },
    } = await supa.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in before payment." }, { status: 401 });
    }
    userId = await getOrCreateAppUserId();
    customerEmail = user.email ?? undefined;
    if (!userId) {
      return NextResponse.json({ error: "Could not resolve user profile." }, { status: 500 });
    }
    customerId = `u_${userId.replace(/-/g, "").slice(0, 32)}`;

    const { data } = await supa
      .from("users")
      .select("phone, email")
      .eq("id", userId)
      .maybeSingle();
    if (data?.phone) {
      const digits = String(data.phone).replace(/\D/g, "");
      if (digits.length >= 10) customerPhone = digits.slice(-10);
    }
    if (!customerEmail && data?.email) customerEmail = data.email;
  } catch (err) {
    console.warn("[payment/order] supabase lookup failed", err);
    return NextResponse.json(
      { error: "Could not start payment — try refreshing the page or signing in again." },
      { status: 500 },
    );
  }

  if (!userId) {
    return NextResponse.json({ error: "Please sign in before payment." }, { status: 401 });
  }

  const origin = req.headers.get("origin") ?? getPublicSiteUrl();

  try {
    const order = await createCashfreeOrder({
      amountRupees: PAYMENT_AMOUNT_RS,
      customerId,
      customerEmail,
      customerPhone,
      returnUrl: `${origin}/swot`,
    });

    const supa = await getServerSupabase();
    const { error: paymentInsertErr } = await supa.from("payments").upsert(
      {
        user_id: userId,
        provider: "cashfree",
        order_id: order.order_id,
        status: "created",
        amount_paise: PAYMENT_AMOUNT_RS * 100,
        currency: "INR",
        raw_order: order,
      },
      { onConflict: "order_id" },
    );
    if (paymentInsertErr) {
      console.warn("[payment/order] ledger insert failed", paymentInsertErr.message);
    }

    return NextResponse.json({
      order_id: order.order_id,
      payment_session_id: order.payment_session_id,
      amount_rs: PAYMENT_AMOUNT_RS,
      cashfree_mode: getCashfreeMode(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cashfree order failed";
    console.error("[payment/order]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
