import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrCreateAppUserId,
  getServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";
import {
  PAYMENT_AMOUNT_PAISE,
  PAYMENT_PROVIDER,
  isValidPaymentRef,
} from "@/lib/payment";

export const runtime = "nodejs";

const Body = z.object({
  payment_ref: z.string().min(6).max(64),
});

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

  const cleanRef = parsed.payment_ref.trim().replace(/\s+/g, "");
  if (!isValidPaymentRef(cleanRef)) {
    return NextResponse.json(
      {
        error:
          "That reference doesn't look right. Paste the Razorpay payment ID (starts with pay_) from your receipt.",
      },
      { status: 400 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      paid: true,
      dev: true,
      warning: "Supabase not configured — payment not persisted",
    });
  }

  const userId = await getOrCreateAppUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const service = getServiceClient();

  const { data: existing } = await service
    .from("plans")
    .select("id, paid")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await service
      .from("plans")
      .update({
        paid: true,
        txn_ref: cleanRef,
        amount_paise: PAYMENT_AMOUNT_PAISE,
        payment_method: PAYMENT_PROVIDER,
      })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, paid: true });
  }

  const { error } = await service.from("plans").insert({
    user_id: userId,
    paid: true,
    txn_ref: cleanRef,
    amount_paise: PAYMENT_AMOUNT_PAISE,
    payment_method: PAYMENT_PROVIDER,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, paid: true });
}
