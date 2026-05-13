import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Terms & Conditions · PrepInsight",
  description:
    "Terms and conditions for using PrepInsight — NEET SWOT analysis and 30-day study plan.",
};

const LAST = "13 May 2026";

export default function TermsPage() {
  return (
    <LegalShell title="Terms & conditions" lastUpdated={LAST}>
      <p>
        These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of the PrepInsight
        website and services (&quot;Service&quot;), operated in connection with Tranquil AI
        (&quot;we&quot;, &quot;us&quot;). By accessing or using the Service, you agree to these
        Terms. If you do not agree, do not use the Service.
      </p>

      <h2>1. The service</h2>
      <p>
        PrepInsight provides educational tools for NEET-UG aspirants, including (where
        available) answer marking against an official-style key, performance summaries,
        AI-assisted SWOT-style analysis, and optional paid features such as a personalised
        study plan. Outputs are <strong>informational and educational</strong> only — not
        medical advice, not a guarantee of exam rank or college admission, and not a
        substitute for professional counselling or your own study plan.
      </p>

      <h2>2. Eligibility &amp; accounts</h2>
      <p>
        You must be able to form a binding contract in your jurisdiction. If you create an
        account, you are responsible for safeguarding your credentials and for all
        activity under your account. You agree to provide accurate information where
        requested.
      </p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Attempt to access non-public areas, other users&apos; data, or our systems without authorisation;</li>
        <li>Use the Service to harass, abuse, or harm others, or to distribute malware;</li>
        <li>Scrape, overload, or automate the Service in a way that impairs stability;</li>
        <li>Misrepresent your identity or attempt payment fraud.</li>
      </ul>
      <p>We may suspend or terminate access for violations.</p>

      <h2>4. Intellectual property</h2>
      <p>
        The Service, its branding, software, and original content are owned by us or our
        licensors. NEET-related question material may be subject to third-party rights; we
        do not claim ownership of NTA or NCERT content. You receive a limited, revocable
        licence to use the Service for personal, non-commercial preparation.
      </p>

      <h2>5. Third-party services</h2>
      <p>
        We use third parties for hosting, authentication, payments (e.g. Cashfree), and AI
        inference. Their terms and privacy practices may also apply to your use of those
        features.
      </p>

      <h2>6. Fees &amp; taxes</h2>
      <p>
        Certain features are paid. Prices are displayed in <strong>INR (Indian Rupees)</strong>{" "}
        on our <a href="/pricing">Pricing</a> page. Taxes, if applicable, are as shown at
        checkout or on your receipt from the payment provider.
      </p>

      <h2>7. Disclaimers</h2>
      <p>
        The Service is provided <strong>&quot;as is&quot;</strong> and <strong>&quot;as available&quot;</strong>. To the
        maximum extent permitted by law, we disclaim warranties of merchantability, fitness
        for a particular purpose, and non-infringement. We do not warrant uninterrupted or
        error-free operation.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by applicable law, our total liability for any claim
        arising from the Service shall not exceed the amount you paid us for the Service in
        the twelve (12) months before the claim (or INR 500 if you only used free features).
        We are not liable for indirect, incidental, special, consequential, or punitive
        damages.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these Terms. We will post the revised version on this page and update
        the &quot;Last updated&quot; date. Continued use after changes constitutes acceptance of the
        updated Terms where permitted by law.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the laws of <strong>India</strong>. Courts at Bengaluru,
        Karnataka shall have exclusive jurisdiction, subject to any mandatory consumer
        protections in your jurisdiction.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a href="mailto:hello@tranquilai.in">hello@tranquilai.in</a> ·{" "}
        <a href="/contact">Contact page</a>
      </p>
    </LegalShell>
  );
}
