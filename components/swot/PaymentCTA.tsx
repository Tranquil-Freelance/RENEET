"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { PAYMENT_AMOUNT_RS } from "@/lib/payment";
import { PaymentModal } from "./PaymentModal";

export function PaymentCTA({
  totalMarksLost,
  ctaLabel = "Unlock full SWOT + 30-day plan",
  helperText = "See the complete SWOT breakdown and get your day-by-day plan",
  redirectToPlan = true,
  onPaid,
}: {
  totalMarksLost: number;
  ctaLabel?: string;
  helperText?: string;
  redirectToPlan?: boolean;
  onPaid?: () => void;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-ink">
              You can recover ~{Math.round(totalMarksLost)} marks in fixable topics
            </div>
            <div className="text-xs text-ink-muted">
              {helperText}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-warn text-ink-dark px-5 py-2.5 text-sm font-semibold shadow-soft hover:brightness-95 transition"
          >
            <Sparkles className="h-4 w-4" />
            {ctaLabel} ·{" "}
            <span className="line-through opacity-60">₹999</span>{" "}
            <span>₹{PAYMENT_AMOUNT_RS}</span>
          </button>
        </div>
      </div>

      {showModal && (
        <PaymentModal
          onClose={() => setShowModal(false)}
          redirectToPlan={redirectToPlan}
          onPaid={onPaid}
        />
      )}
    </>
  );
}
