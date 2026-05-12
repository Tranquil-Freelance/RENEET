"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ExternalLink, Loader2, ShieldCheck, X } from "lucide-react";
import {
  PAYMENT_AMOUNT_RS,
  PAYMENT_PAGE_URL,
  isValidPaymentRef,
} from "@/lib/payment";

interface Props {
  onClose: () => void;
}

export function PaymentModal({ onClose }: Props) {
  const router = useRouter();
  const [paymentRef, setPaymentRef] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [openedPayment, setOpenedPayment] = useState(false);

  function openPaymentPage() {
    window.open(PAYMENT_PAGE_URL, "_blank", "noopener,noreferrer");
    setOpenedPayment(true);
  }

  async function confirmPayment() {
    if (!isValidPaymentRef(paymentRef)) {
      toast.error("Paste your Razorpay payment ID (starts with pay_…)");
      return;
    }
    setConfirming(true);
    try {
      const res = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payment_ref: paymentRef }),
      });
      if (res.status === 401) {
        toast.error("Please sign in first.");
        router.push("/login?next=/swot");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Confirmation failed");

      toast.success("Payment recorded — building your plan…");

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
      if (!planRes.ok) {
        throw new Error(planBody.error ?? "Plan generation failed");
      }
      try {
        if (planBody.plan)
          localStorage.setItem("prepinsights:plan", JSON.stringify(planBody.plan));
      } catch {
        /* ignore */
      }
      router.push("/plan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not confirm payment");
      setConfirming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-soft-lg p-6 sm:p-7 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={confirming}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink disabled:opacity-40"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-xs font-semibold uppercase tracking-wider text-brand">
          Unlock your plan
        </div>
        <h2 className="mt-1 text-2xl font-serif font-semibold text-ink">
          ₹{PAYMENT_AMOUNT_RS} via Razorpay
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          UPI, cards, netbanking — all on Razorpay&apos;s secure page. One-time
          payment unlocks your personalized 30-day plan + daily quizzes.
        </p>

        <div className="mt-5 rounded-2xl bg-paper border border-line p-4 flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-success shrink-0" />
          <div className="text-xs text-ink-muted leading-relaxed">
            We never see your card or UPI details — Razorpay handles the entire
            checkout. After paying, you&apos;ll get a 14-character payment ID like{" "}
            <span className="font-mono text-ink">pay_M5IXr0KaTOOZ12</span>.
            Paste it below to unlock your plan instantly.
          </div>
        </div>

        <button
          type="button"
          onClick={openPaymentPage}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-brand bg-white text-brand py-3 text-sm font-semibold hover:bg-brand/5 transition"
        >
          <ExternalLink className="h-4 w-4" />
          {openedPayment ? "Re-open payment page" : `Pay ₹${PAYMENT_AMOUNT_RS} on Razorpay`}
        </button>

        <div className="mt-5">
          <label htmlFor="paymentRef" className="block text-sm font-medium text-ink mb-1.5">
            Paste Razorpay payment ID
          </label>
          <input
            id="paymentRef"
            type="text"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            placeholder="pay_M5IXr0KaTOOZ12"
            className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink font-mono text-sm placeholder:text-ink-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
            autoComplete="off"
            spellCheck={false}
          />
          <p className="mt-1.5 text-[11px] text-ink-muted">
            You&apos;ll see this on the Razorpay receipt page or in the success email.
          </p>
        </div>

        <button
          type="button"
          onClick={confirmPayment}
          disabled={confirming || !paymentRef}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand text-white py-3 text-sm font-semibold shadow-soft hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {confirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Confirming…
            </>
          ) : (
            <>I&apos;ve paid — unlock my plan</>
          )}
        </button>
        <p className="mt-3 text-[11px] text-ink-muted text-center">
          We trust you. Fake refs delay your plan — please be honest.
        </p>
      </div>
    </div>
  );
}
