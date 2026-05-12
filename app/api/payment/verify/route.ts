import { NextResponse } from "next/server";
import { z } from "zod";
import { isRazorpayConfigured, verifyPaymentSignature } from "@/lib/razorpay";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase-server";

export const runtime = "nodejs";

const Body = z.object({
  userId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
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
    return NextResponse.json({ success: true, dev: true });
  }

  const valid = verifyPaymentSignature({
    orderId: parsed.razorpay_order_id,
    paymentId: parsed.razorpay_payment_id,
    signature: parsed.razorpay_signature,
  });
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (isSupabaseConfigured() && !parsed.userId.startsWith("dev-")) {
    const supabase = getServiceClient();
    await supabase
      .from("plans")
      .update({ paid: true, payment_id: parsed.razorpay_payment_id })
      .eq("user_id", parsed.userId)
      .eq("order_id", parsed.razorpay_order_id);
  }

  return NextResponse.json({ success: true });
}
