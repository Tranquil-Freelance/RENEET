"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { PAYMENT_AMOUNT_RS } from "@/lib/payment";

interface Props {
  onClose: () => void;
}

interface CashfreeCheckoutResult {
  error?: { message?: string };
  redirect?: boolean;
  paymentDetails?: { paymentMessage?: string };
}

interface CashfreeInstance {
  checkout: (opts: {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_modal";
  }) => Promise<CashfreeCheckoutResult>;
}

type CashfreeFactory = (config: {
  mode: "production" | "sandbox";
}) => CashfreeInstance;

declare global {
  interface Window {
    Cashfree?: CashfreeFactory;
  }
}

const CASHFREE_SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

function loadCashfreeSdk(): Promise<CashfreeFactory> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cashfree SDK requires a browser"));
  }
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CASHFREE_SDK_URL}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.Cashfree) resolve(window.Cashfree);
        else reject(new Error("Cashfree SDK loaded but global missing"));
      });
      existing.addEventListener("error", () =>
        reject(new Error("Cashfree SDK failed to load")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = CASHFREE_SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) resolve(window.Cashfree);
      else reject(new Error("Cashfree SDK loaded but global missing"));
    };
    script.onerror = () => reject(new Error("Cashfree SDK failed to load"));
    document.body.appendChild(script);
  });
}

export function PaymentModal({ onClose }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<
    "idle" | "creating" | "checkout" | "verifying" | "planning"
  >("idle");
  const closingRef = useRef(false);

  const phaseLabel: Record<typeof phase, string> = {
    idle: `Pay ₹${PAYMENT_AMOUNT_RS} via Cashfree`,
    creating: "Preparing checkout…",
    checkout: "Opening Cashfree…",
    verifying: "Verifying payment…",
    planning: "Building your plan…",
  };

  useEffect(() => {
    void loadCashfreeSdk().catch(() => {
      /* network failures handled when user clicks pay */
    });
  }, []);

  const buildPlanFromCache = useCallback(async () => {
    let cachedSwot: unknown = null;
    try {
      const raw = localStorage.getItem("prepinsights:swot");
      if (raw) cachedSwot = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    const planRes = await fetch("/api/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ swot: cachedSwot ?? undefined }),
    });
    const planBody = await planRes.json().catch(() => ({}));
    if (!planRes.ok) throw new Error(planBody.error ?? "Plan generation failed");
    try {
      if (planBody.plan)
        localStorage.setItem("prepinsights:plan", JSON.stringify(planBody.plan));
    } catch {
      /* ignore */
    }
  }, []);

  async function startPayment() {
    if (phase !== "idle") return;
    try {
      setPhase("creating");
      const orderRes = await fetch("/api/payment/order", { method: "POST" });
      const orderBody = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok || !orderBody.payment_session_id) {
        throw new Error(orderBody.error ?? "Could not create order");
      }

      setPhase("checkout");
      const factory = await loadCashfreeSdk();
      const cashfree = factory({ mode: orderBody.cashfree_mode ?? "production" });
      const result = await cashfree.checkout({
        paymentSessionId: orderBody.payment_session_id,
        redirectTarget: "_modal",
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Payment cancelled");
      }

      setPhase("verifying");
      const confirmRes = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_id: orderBody.order_id }),
      });
      const confirmBody = await confirmRes.json().catch(() => ({}));
      if (confirmRes.status === 401) {
        toast.error("Please sign in first.");
        router.push("/login?next=/swot");
        return;
      }
      if (!confirmRes.ok || !confirmBody.paid) {
        throw new Error(
          confirmBody.error ?? "Could not verify payment with Cashfree.",
        );
      }

      toast.success("Payment verified — building your plan…");
      setPhase("planning");
      await buildPlanFromCache();
      closingRef.current = true;
      router.push("/plan");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      toast.error(msg);
      setPhase("idle");
    }
  }

  const busy = phase !== "idle";

  return (
    <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-soft-lg p-6 sm:p-7 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink disabled:opacity-40"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-xs font-semibold uppercase tracking-wider text-brand">
          Unlock your plan
        </div>
        <h2 className="mt-1 text-2xl font-serif font-semibold text-ink">
          ₹{PAYMENT_AMOUNT_RS} via Cashfree
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          UPI, cards, netbanking, wallets — all in one secure Cashfree modal.
          One-time payment unlocks your personalized 30-day plan + daily quizzes.
        </p>

        <div className="mt-5 rounded-2xl bg-paper border border-line p-4 flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-success shrink-0" />
          <div className="text-xs text-ink-muted leading-relaxed">
            Card details never touch our servers. Once you complete payment in
            the Cashfree window, we verify it directly with Cashfree before
            unlocking your plan — no copy-pasting payment IDs.
          </div>
        </div>

        <button
          type="button"
          onClick={startPayment}
          disabled={busy}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand text-white py-3 text-sm font-semibold shadow-soft hover:bg-brand-dark disabled:opacity-60 disabled:cursor-progress transition"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {phaseLabel[phase]}
        </button>
        <p className="mt-3 text-[11px] text-ink-muted text-center">
          You&apos;ll see the Cashfree logo on the payment screen. Total: ₹
          {PAYMENT_AMOUNT_RS} (incl. taxes).
        </p>
      </div>
    </div>
  );
}
