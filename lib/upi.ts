/**
 * UPI deep-link helpers.
 * Swap UPI_VPA to a real merchant VPA before launch.
 */

export const UPI_VPA = process.env.NEXT_PUBLIC_UPI_VPA ?? "prepinsights@upi";
export const UPI_PAYEE_NAME = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME ?? "PrepInsights";
export const UPI_AMOUNT_RS = 50;
export const UPI_AMOUNT_PAISE = UPI_AMOUNT_RS * 100;

export function buildUpiLink(refTag: string): string {
  const tn = `PI_${refTag.slice(0, 8)}`;
  const params = new URLSearchParams({
    pa: UPI_VPA,
    pn: UPI_PAYEE_NAME,
    am: String(UPI_AMOUNT_RS),
    cu: "INR",
    tn,
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * 12-digit UPI reference number validation (NPCI standard for UPI txn IDs).
 * Real-world refs are usually 12 digits but we accept 8–20 alphanumerics
 * to be forgiving (some PSPs return mixed format).
 */
export function isValidTxnRef(ref: string): boolean {
  const trimmed = ref.trim().replace(/\s+/g, "");
  return /^[A-Za-z0-9]{8,24}$/.test(trimmed);
}
