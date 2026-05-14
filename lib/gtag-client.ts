import { getGaMeasurementId } from "@/lib/ga-config";
import { PAYMENT_AMOUNT_RS, PAYMENT_CURRENCY } from "@/lib/payment";

/** GA4 recommended item shape for ecommerce events. */
export interface Ga4EcommerceItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
}

const PLAN_ITEM: Ga4EcommerceItem = {
  item_id: "prepinsight_plan_30d",
  item_name: "PrepInsight 30-day study plan",
  price: PAYMENT_AMOUNT_RS,
  quantity: 1,
  item_category: "education",
};

function planItems(): Ga4EcommerceItem[] {
  return [PLAN_ITEM];
}

function canSend(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(getGaMeasurementId()) &&
    typeof window.gtag === "function"
  );
}

/**
 * GA4 `sign_up` — user finished product onboarding (profile saved, ready to use the app).
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#sign_up
 */
export function trackSignUp(): void {
  if (!canSend()) return;
  window.gtag!("event", "sign_up", {
    method: "email",
  });
}

/**
 * GA4 `begin_checkout` — fire when checkout is about to start (payment UI).
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#begin_checkout
 */
export function trackBeginCheckout(): void {
  if (!canSend()) return;
  window.gtag!("event", "begin_checkout", {
    currency: PAYMENT_CURRENCY,
    value: PAYMENT_AMOUNT_RS,
    items: planItems(),
  });
}

/**
 * GA4 `purchase` — fire once per completed transaction (after server verification).
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#purchase
 */
export function trackPurchase(transactionId: string): void {
  if (!canSend() || !transactionId.trim()) return;
  window.gtag!("event", "purchase", {
    transaction_id: transactionId.trim(),
    value: PAYMENT_AMOUNT_RS,
    currency: PAYMENT_CURRENCY,
    items: planItems(),
  });
}

/**
 * GA4 `login` — successful email OTP session + profile bootstrap.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#login
 */
export function trackLogin(): void {
  if (!canSend()) return;
  window.gtag!("event", "login", {
    method: "email",
  });
}

/** Custom — OMR submitted and `/api/analyze` succeeded. */
export function trackExamAnalyzed(params: {
  total_marked: number;
  total_guessed: number;
  total_blank: number;
}): void {
  if (!canSend()) return;
  window.gtag!("event", "exam_analyzed", {
    total_marked: params.total_marked,
    total_guessed: params.total_guessed,
    total_blank: params.total_blank,
  });
}

/**
 * GA4 `generate_lead` — user reached the free SWOT (value delivered).
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#generate_lead
 */
export function trackGenerateLead(): void {
  if (!canSend()) return;
  window.gtag!("event", "generate_lead", {});
}

/** Custom — paid plan document is shown to the user. */
export function trackViewPlan(params: { total_days: number }): void {
  if (!canSend()) return;
  window.gtag!("event", "view_plan", {
    total_days: params.total_days,
  });
}

/** Custom — daily check-in quiz submitted successfully. */
export function trackDailyQuizSubmit(params: {
  day_number: number;
  score: number;
}): void {
  if (!canSend()) return;
  window.gtag!("event", "daily_quiz_submit", {
    day_number: params.day_number,
    score: params.score,
  });
}

/** Custom — Cashfree checkout did not complete with a paid result. */
export function trackPaymentFailed(err: unknown): void {
  if (!canSend()) return;
  const raw = err instanceof Error ? err.message.toLowerCase() : "";
  let reason: "cancelled" | "verification_failed" | "order_failed" | "auth_required" | "unknown" =
    "unknown";
  if (raw.includes("cancel")) reason = "cancelled";
  else if (raw.includes("sign in") || raw.includes("401")) reason = "auth_required";
  else if (raw.includes("verify") || raw.includes("paid")) reason = "verification_failed";
  else if (raw.includes("order") || raw.includes("create")) reason = "order_failed";
  window.gtag!("event", "payment_failed", { reason });
}

/**
 * GA4 `select_content` — primary navigation / CTA taps.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#select_content
 */
export function trackSelectContent(params: {
  content_type: string;
  item_id: string;
}): void {
  if (!canSend()) return;
  window.gtag!("event", "select_content", {
    content_type: params.content_type,
    item_id: params.item_id,
  });
}
