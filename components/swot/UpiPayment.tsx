"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import QRCode from "qrcode";
import { Check, Copy, Loader2, Smartphone, X } from "lucide-react";
import {
  UPI_AMOUNT_RS,
  UPI_PAYEE_NAME,
  UPI_VPA,
  buildUpiLink,
  isValidTxnRef,
} from "@/lib/upi";

interface Props {
  onClose: () => void;
}

export function UpiPayment({ onClose }: Props) {
  const router = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [txnRef, setTxnRef] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  const refTag = useMemo(() => Math.random().toString(36).slice(2, 10), []);
  const upiLink = useMemo(() => buildUpiLink(refTag), [refTag]);

  useEffect(() => {
    QRCode.toDataURL(upiLink, {
      width: 280,
      margin: 1,
      color: { dark: "#1F1B2E", light: "#FFFFFFFF" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [upiLink]);

  async function copyVpa() {
    try {
      await navigator.clipboard.writeText(UPI_VPA);
      setCopied(true);
      toast.success("UPI ID copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed — long-press to copy");
    }
  }

  async function confirmPayment() {
    if (!isValidTxnRef(txnRef)) {
      toast.error("Paste your 12-digit UPI transaction reference");
      return;
    }
    setConfirming(true);
    try {
      const res = await fetch("/api/payment/upi-confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ txn_ref: txnRef }),
      });
      if (res.status === 401) {
        toast.error("Please sign in first.");
        router.push("/login?next=/swot");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Confirmation failed");

      toast.success("Payment recorded — building your plan…");

      const planRes = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!planRes.ok) {
        const body = await planRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Plan generation failed");
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
          ₹{UPI_AMOUNT_RS} via UPI
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          One-time payment unlocks your personalized 30-day plan + daily quizzes.
        </p>

        <div className="mt-5 rounded-2xl bg-paper border border-line p-4 flex flex-col items-center">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="UPI QR code" className="w-56 h-56" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
            </div>
          )}
          <div className="mt-3 text-xs text-ink-muted text-center">
            Scan with any UPI app (PhonePe, GPay, Paytm, BHIM)
          </div>
        </div>

        <a
          href={upiLink}
          className="mt-3 sm:hidden inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-brand bg-white text-brand py-3 text-sm font-medium hover:bg-brand/5 transition"
        >
          <Smartphone className="h-4 w-4" /> Open UPI app
        </a>

        <button
          type="button"
          onClick={copyVpa}
          className="mt-3 w-full inline-flex items-center justify-between gap-2 rounded-2xl border border-line bg-paper px-4 py-3 text-sm hover:border-ink-muted transition"
        >
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase tracking-wide text-ink-muted">
              Or pay to UPI ID
            </span>
            <span className="font-medium text-ink">{UPI_VPA}</span>
            <span className="text-[10px] text-ink-muted">{UPI_PAYEE_NAME} · ₹{UPI_AMOUNT_RS}</span>
          </div>
          {copied ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4 text-ink-muted" />
          )}
        </button>

        <div className="mt-5">
          <label htmlFor="txnRef" className="block text-sm font-medium text-ink mb-1.5">
            Paste UPI transaction reference
          </label>
          <input
            id="txnRef"
            type="text"
            inputMode="numeric"
            value={txnRef}
            onChange={(e) => setTxnRef(e.target.value)}
            placeholder="e.g. 412345678901"
            className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink placeholder:text-ink-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
          />
          <p className="mt-1.5 text-[11px] text-ink-muted">
            You&apos;ll see this 12-digit ref on your UPI app&apos;s success screen.
          </p>
        </div>

        <button
          type="button"
          onClick={confirmPayment}
          disabled={confirming || !txnRef}
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
