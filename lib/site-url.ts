/**
 * Canonical public URL for the app (magic links, OG metadata, payment return_url,
 * OpenRouter Referer header). Prefer NEXT_PUBLIC_APP_URL on Render / prod so
 * emails and redirects never point at localhost by accident.
 */

const PRODUCTION_FALLBACK = "https://prepinsight.in";

function normalizeBase(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** Server + client: use env when set (inlined on client at build time). */
export function getPublicSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return normalizeBase(fromEnv);

  const render = process.env.RENDER_EXTERNAL_URL?.trim();
  if (render) {
    const r = normalizeBase(render);
    return r.startsWith("http://") || r.startsWith("https://") ? r : `https://${r}`;
  }

  return PRODUCTION_FALLBACK;
}

/**
 * Client-only: magic-link redirect target for Supabase `emailRedirectTo`.
 *
 * - On a real deployed host (not localhost), always use `window.location.origin`
 *   so links match the site the user is on — even if a bad localhost value was
 *   accidentally baked into `NEXT_PUBLIC_APP_URL` at build time.
 * - On localhost, prefer `NEXT_PUBLIC_APP_URL` when set, else current origin.
 */
export function getBrowserAuthRedirectBase(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (!isLocal) return window.location.origin;
    const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (fromEnv) return normalizeBase(fromEnv);
    return window.location.origin;
  }
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return normalizeBase(fromEnv);
  return PRODUCTION_FALLBACK;
}
