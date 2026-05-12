/**
 * Payment configuration for PrepInsights.
 *
 * We use a Razorpay hosted Payment Page (https://razorpay.com/payment-page/).
 * The student opens the link, pays via UPI / card / netbanking on Razorpay,
 * then returns to our app and pastes their Razorpay payment ID
 * (e.g. `pay_M5IXr0KaTOOZ12`) to unlock the 30-day plan. We don't take card
 * details on our origin, so we stay out of PCI scope.
 *
 * Override the payment-page URL by setting NEXT_PUBLIC_RAZORPAY_PAGE_URL in
 * .env.local once the production page is ready.
 */

export const PAYMENT_PAGE_URL =
  process.env.NEXT_PUBLIC_RAZORPAY_PAGE_URL ?? "https://rzp.io/rzp/w0QWVnV";

export const PAYMENT_AMOUNT_RS = 50;
export const PAYMENT_AMOUNT_PAISE = PAYMENT_AMOUNT_RS * 100;

export const PAYMENT_PROVIDER = "razorpay";

/**
 * Accepts:
 *   - Razorpay payment IDs        (pay_XXXXXXXXXXXXXX, 14+ alphanumerics after the prefix)
 *   - Razorpay order IDs          (order_XXXXXXXXXXXXXX)
 *   - 12-digit UPI reference numbers (in case a user pays the payee directly)
 *   - 8-24 char alphanumeric (forgiving fallback for other PSP ref formats)
 *
 * We're trust-based here — server-side verification against the Razorpay API
 * is a future hardening step (would need RAZORPAY_KEY_ID + KEY_SECRET).
 */
export function isValidPaymentRef(ref: string): boolean {
  const trimmed = ref.trim().replace(/\s+/g, "");
  if (/^(pay|order)_[A-Za-z0-9]{10,}$/.test(trimmed)) return true;
  if (/^[A-Za-z0-9]{8,24}$/.test(trimmed)) return true;
  return false;
}
