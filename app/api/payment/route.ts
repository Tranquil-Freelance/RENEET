import { NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpay, isRazorpayConfigured } from "@/lib/razorpay";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase-server";

export const runtime = "nodejs";

const Body = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive().max(100000),
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

  if (!isRazorpayConfigured()) {
    return NextResponse.json({
      dev: true,
      orderId: `dev_order_${Date.now()}`,
      amount: parsed.amount,
      currency: "INR",
      warning: "Razorpay not configured — using dev fallback (skips real payment).",
    });
  }

  const razorpay = getRazorpay();
  try {
    const order = await razorpay.orders.create({
      amount: parsed.amount,
      currency: "INR",
      receipt: `ns_${parsed.userId.slice(0, 24)}_${Date.now()}`,
      notes: { userId: parsed.userId },
    });

    if (isSupabaseConfigured() && !parsed.userId.startsWith("dev-")) {
      const supabase = getServiceClient();
      await supabase.from("plans").insert({
        user_id: parsed.userId,
        paid: false,
        order_id: order.id,
      });
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("[payment] order creation failed", err);
    return NextResponse.json(
      { error: "Could not create payment order" },
      { status: 500 },
    );
  }
}
