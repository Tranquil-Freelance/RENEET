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
  getServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Create a Cashfree order for the ₹99 plan unlock.
 *
 * Pulls customer details (email + phone, when available) from the Supabase
 * user row; falls back to neutral placeholders so guests in dev can still
 * trigger the modal without a session.
 */
export async function POST(req: Request) {
  if (!isCashfreeConfigured()) {
    return NextResponse.json(
      { error: "Cashfree credentials missing — set CASHFREE_APP_ID / CASHFREE_SECRET_KEY." },
      { status: 503 },
    );
  }

  let userId: string | null = null;
  let customerId = `guest_${Date.now().toString(36)}`;
  let customerEmail: string | undefined;
  let customerPhone = "9999999999";

  if (isSupabaseConfigured()) {
    try {
      const supa = await getServerSupabase();
      const {
        data: { user },
      } = await supa.auth.getUser();
      if (user) {
        userId = await getOrCreateAppUserId();
        customerEmail = user.email ?? undefined;
        if (userId) {
          customerId = `u_${userId.replace(/-/g, "").slice(0, 32)}`;
          const service = getServiceClient();
          const { data } = await service
            .from("users")
            .select("phone, email")
            .eq("id", userId)
            .maybeSingle();
          if (data?.phone) {
            const digits = String(data.phone).replace(/\D/g, "");
            if (digits.length >= 10) customerPhone = digits.slice(-10);
          }
          if (!customerEmail && data?.email) customerEmail = data.email;
        }
      }
    } catch (err) {
      console.warn("[payment/order] supabase lookup failed", err);
    }
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  try {
    const order = await createCashfreeOrder({
      amountRupees: PAYMENT_AMOUNT_RS,
      customerId,
      customerEmail,
      customerPhone,
      returnUrl: `${origin}/swot`,
    });

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
