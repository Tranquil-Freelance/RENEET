import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Contact Us · PrepInsight",
  description:
    "Contact PrepInsight for support, billing, or partnership questions related to NEET SWOT and study plans.",
};

const LAST = "13 May 2026";

export default function ContactPage() {
  return (
    <LegalShell title="Contact us" lastUpdated={LAST}>
      <p>
        <strong>PrepInsight</strong> is an online preparation tool for NEET-UG aspirants
        (including Re-NEET 2026). For questions about your account, payments, or the
        product, use the channels below.
      </p>

      <h2>Email</h2>
      <ul>
        <li>
          <strong>General &amp; support:</strong>{" "}
          <a href="mailto:hello@tranquilai.in">hello@tranquilai.in</a>
        </li>
        <li>
          <strong>Transactional / auth:</strong>{" "}
          <a href="mailto:noreply@tranquilai.in">noreply@tranquilai.in</a> (no-reply; for
          replies use hello@)
        </li>
      </ul>

      <h2>Response time</h2>
      <p>
        We aim to respond to support emails within <strong>2 business days</strong>. During
        high volume (e.g. around Re-NEET announcements), it may take longer; we appreciate
        your patience.
      </p>

      <h2>Postal / legal notices</h2>
      <p>
        PrepInsight is operated in connection with <strong>Tranquil AI</strong> (tranquilai.in).
        For formal legal notices only, email{" "}
        <a href="mailto:hello@tranquilai.in">hello@tranquilai.in</a> with subject line
        &quot;Legal notice — PrepInsight&quot;.
      </p>

      <h2>Payments</h2>
      <p>
        Payments are processed by our payment partner <strong>Cashfree</strong>. For
        payment-specific issues, contact us first at{" "}
        <a href="mailto:hello@tranquilai.in">hello@tranquilai.in</a> with your order details.
        See also our <a href="/refunds">Refunds &amp; cancellations</a> page.
      </p>
    </LegalShell>
  );
}
