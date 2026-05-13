/**
 * Payment configuration for PrepInsight — Cashfree Payment Gateway.
 *
 * Flow:
 *   1. Server creates a Cashfree order via POST /pg/orders → returns
 *      { order_id, payment_session_id }.
 *   2. Client opens Cashfree's hosted modal checkout (SDK v3) with the
 *      payment_session_id. We never touch card / UPI details.
 *   3. After the modal closes, client calls /api/payment/confirm with the
 *      order_id; server hits GET /pg/orders/{order_id} and only marks
 *      `plans.paid = true` if Cashfree returns order_status === "PAID".
 *
 * No client-side secrets — payment_session_id is per-order and ephemeral.
 */

export const PAYMENT_AMOUNT_RS = 99;
export const PAYMENT_AMOUNT_PAISE = PAYMENT_AMOUNT_RS * 100;
export const PAYMENT_CURRENCY = "INR";
export const PAYMENT_PROVIDER = "cashfree";

export const CASHFREE_ENV =
  (process.env.CASHFREE_ENV ?? "production").toLowerCase() === "sandbox"
    ? "sandbox"
    : "production";

export const CASHFREE_BASE =
  CASHFREE_ENV === "sandbox"
    ? "https://sandbox.cashfree.com/pg"
    : "https://api.cashfree.com/pg";

const APP_ID = process.env.CASHFREE_APP_ID ?? "";
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY ?? "";
const API_VERSION = process.env.CASHFREE_API_VERSION ?? "2025-01-01";

export function isCashfreeConfigured(): boolean {
  return Boolean(APP_ID && SECRET_KEY);
}

/**
 * Public mode flag for the JS SDK on the client. Safe to expose — it's just
 * "production" vs "sandbox", not a secret.
 */
export function getCashfreeMode(): "production" | "sandbox" {
  return CASHFREE_ENV;
}

interface CashfreeFetchInit {
  method?: "GET" | "POST";
  body?: unknown;
}

/**
 * Minimal server-only Cashfree HTTP helper. Always throws on non-2xx so
 * callers can surface the Cashfree error message verbatim.
 */
export async function cashfreeFetch<T>(
  path: string,
  init: CashfreeFetchInit = {},
): Promise<T> {
  if (!isCashfreeConfigured()) {
    throw new Error("Cashfree credentials missing. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.");
  }
  const url = `${CASHFREE_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-version": API_VERSION,
      "x-client-id": APP_ID,
      "x-client-secret": SECRET_KEY,
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      /* leave as null */
    }
  }
  if (!res.ok) {
    const msg =
      (parsed && typeof parsed === "object" && "message" in parsed
        ? String((parsed as { message: unknown }).message)
        : undefined) ??
      text.slice(0, 300) ??
      res.statusText;
    throw new Error(`Cashfree ${res.status}: ${msg}`);
  }
  return parsed as T;
}

export interface CashfreeOrder {
  cf_order_id: number | string;
  order_id: string;
  entity: string;
  order_currency: string;
  order_amount: number;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | string;
  payment_session_id: string;
  order_expiry_time?: string;
  created_at?: string;
}

export interface CreateOrderArgs {
  amountRupees: number;
  customerId: string;
  customerEmail?: string;
  customerPhone: string;
  orderNote?: string;
  returnUrl?: string;
}

/**
 * Create a Cashfree order. Returns the full order payload — caller pulls out
 * { order_id, payment_session_id } for the client SDK.
 */
export async function createCashfreeOrder(
  args: CreateOrderArgs,
): Promise<CashfreeOrder> {
  const orderId = `pi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return cashfreeFetch<CashfreeOrder>("/orders", {
    method: "POST",
    body: {
      order_id: orderId,
      order_amount: args.amountRupees,
      order_currency: PAYMENT_CURRENCY,
      customer_details: {
        customer_id: args.customerId,
        customer_email: args.customerEmail,
        customer_phone: args.customerPhone,
      },
      // Cashfree production rejects http return_urls. Modal checkout doesn't
      // actually need one — the SDK callback resolves on success client-side.
      // Include it only when we have an https origin (e.g. real domain).
      order_meta:
        args.returnUrl && /^https:\/\//i.test(args.returnUrl)
          ? { return_url: `${args.returnUrl}?order_id={order_id}` }
          : undefined,
      order_note: args.orderNote ?? "PrepInsight 30-day study plan",
    },
  });
}

export async function fetchCashfreeOrder(orderId: string): Promise<CashfreeOrder> {
  return cashfreeFetch<CashfreeOrder>(`/orders/${encodeURIComponent(orderId)}`);
}

/** Order IDs we generate look like pi_<ts>_<rand>; Cashfree allows 1-50 [A-Za-z0-9_-]. */
export function isValidCashfreeOrderId(id: string): boolean {
  return /^[A-Za-z0-9_-]{6,50}$/.test(id.trim());
}
