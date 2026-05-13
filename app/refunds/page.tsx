import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";
import { PAYMENT_AMOUNT_RS, PAYMENT_CURRENCY } from "@/lib/payment";

export const metadata: Metadata = {
  title: "Refunds & Cancellations · PrepInsight",
  description:
    "Refund and cancellation policy for PrepInsight paid plans — processed in INR via Cashfree.",
};

const LAST = "13 May 2026";

export default function RefundsPage() {
  return (
    <LegalShell title="Refunds & cancellations" lastUpdated={LAST}>
      <p>
        This policy describes how refunds and cancellations work for <strong>paid</strong>{" "}
        features on PrepInsight. All amounts are in <strong>{PAYMENT_CURRENCY}</strong>{" "}
        (Indian Rupees). Current paid offering: <strong>₹{PAYMENT_AMOUNT_RS}</strong> for the
        30-day personalised study plan unlock (see <a href="/pricing">Pricing</a>).
      </p>

      <h2>1. Free features</h2>
      <p>
        SWOT-style analysis and other features offered at no charge do not involve a
        payment — there is nothing to refund for those features.
      </p>

      <h2>2. Paid plan — eligibility for refund</h2>
      <p>We may issue a refund in the following situations:</p>
      <ul>
        <li>
          <strong>Duplicate charge:</strong> You were charged more than once for the same
          unlock due to a technical error.
        </li>
        <li>
          <strong>Service failure:</strong> Payment succeeded (as confirmed by our payment
          partner) but the paid plan was not delivered to your account within a reasonable
          time and we cannot resolve it after you contact support.
        </li>
        <li>
          <strong>Charge without consent:</strong> You can demonstrate the transaction was
          unauthorised (subject to verification with our payment partner).
        </li>
      </ul>

      <h2>3. What we generally do not refund</h2>
      <p>
        Because digital study-plan content is generated and delivered after successful
        payment confirmation, we typically <strong>do not</strong> offer refunds where:
      </p>
      <ul>
        <li>The plan was successfully generated and made available to you;</li>
        <li>You changed your mind after purchase;</li>
        <li>You did not use the plan or stopped preparing for personal reasons;</li>
        <li>Dissatisfaction with AI wording, unless it is due to a clear technical defect we confirm.</li>
      </ul>

      <h2>4. How to request a refund</h2>
      <p>
        Email <a href="mailto:hello@tranquilai.in">hello@tranquilai.in</a> with subject
        &quot;Refund request — PrepInsight&quot; and include: your account email, approximate date
        of payment, and Cashfree order ID if available. We will respond within{" "}
        <strong>5 business days</strong> with a decision or a request for more information.
      </p>

      <h2>5. Processing time</h2>
      <p>
        Approved refunds are initiated back to your original payment method where possible.
        Settlement timing depends on your bank or UPI issuer — often <strong>5–10 business
        days</strong> after we submit the refund to our payment partner.
      </p>

      <h2>6. Cancellations</h2>
      <p>
        There is no recurring subscription for the current ₹{PAYMENT_AMOUNT_RS} unlock — it is
        a one-time payment. You cannot &quot;cancel&quot; an order after digital delivery in the sense
        of undoing generated content; see section 3. If payment failed or was reversed by
        your bank before we confirmed it, your account will not be marked paid and no refund
        is needed.
      </p>

      <h2>7. Chargebacks</h2>
      <p>
        If you file a chargeback or dispute with your bank, we may suspend access until the
        dispute is resolved. Please contact us first — we resolve most issues faster by email.
      </p>

      <h2>8. Contact</h2>
      <p>
        <a href="/contact">Contact us</a> ·{" "}
        <a href="mailto:hello@tranquilai.in">hello@tranquilai.in</a>
      </p>
    </LegalShell>
  );
}
