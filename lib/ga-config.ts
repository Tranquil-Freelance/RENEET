const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i;

/**
 * GA4 Measurement ID from NEXT_PUBLIC_GA_MEASUREMENT_ID.
 * Returns null if unset or invalid so we never inject a malformed id into the page.
 */
export function getGaMeasurementId(): string | null {
  const raw = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!raw || !GA_MEASUREMENT_ID_PATTERN.test(raw)) return null;
  return raw;
}
