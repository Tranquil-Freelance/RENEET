"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Sparkles } from "lucide-react";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; contact?: string; email?: string };
  theme?: { color: string };
  handler: (resp: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

const PRICE_INR = 149;
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

export function PaymentCTA({ totalMarksLost }: { totalMarksLost: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    const userId = localStorage.getItem("neetsurge:userId");
    if (!userId) {
      toast.error("Session expired. Please start over.");
      router.push("/onboarding");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, amount: PRICE_INR * 100 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout");

      if (data.dev) {
        toast.success("Razorpay not configured — proceeding in dev mode.");
        await generatePlanThen(userId);
        return;
      }

      if (!window.Razorpay) {
        toast.error("Payment provider not ready yet, try again.");
        return;
      }

      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY ?? "",
        amount: data.amount,
        currency: data.currency ?? "INR",
        name: "NEETSurge",
        description: "30-Day AI Study Plan",
        order_id: data.orderId,
        prefill: {
          name: localStorage.getItem("neetsurge:userName") ?? undefined,
        },
        theme: { color: "#4A90D9" },
        handler: async (resp) => {
          try {
            const verify = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ ...resp, userId }),
            });
            if (!verify.ok) {
              const body = await verify.json().catch(() => ({}));
              throw new Error(body.error ?? "Verification failed");
            }
            await generatePlanThen(userId);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Verification failed");
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout");
      setLoading(false);
    }
  }

  async function generatePlanThen(userId: string) {
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Plan generation failed");
      }
      router.push("/plan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Plan generation failed");
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-800">
              You can recover ~{Math.round(totalMarksLost)} marks in fixable topics
            </div>
            <div className="text-xs text-slate-500">
              Get a 30-day plan that fixes them, day by day
            </div>
          </div>
          <button
            type="button"
            onClick={startCheckout}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-warn)] px-5 py-2.5 text-sm font-semibold text-white shadow hover:brightness-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Working…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Unlock 30-Day Plan ·{" "}
                <span className="line-through opacity-70">₹499</span>{" "}
                <span>₹{PRICE_INR}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
