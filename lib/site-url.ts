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

/**
 * `next` query on /auth/callback must stay a same-site path only — never an
 * absolute URL (open redirect + magic links accidentally carrying
 * https://localhost:10000/exam style junk from bookmarks or bad Supabase config).
 */
export function sanitizeAuthNextPath(raw: string | null, fallback = "/exam"): string {
  if (!raw) return fallback;
  let t = raw.trim();
  try {
    t = decodeURIComponent(t);
  } catch {
    return fallback;
  }
  if (t.length > 512 || t.includes("://") || t.startsWith("//")) return fallback;
  if (!t.startsWith("/") || t.includes("..")) return fallback;
  if (!/^\/[A-Za-z0-9/_-]+$/.test(t)) return fallback;
  return t;
}

/**
 * Base URL for Location headers after OAuth/magic-link exchange. Prefer
 * NEXT_PUBLIC_APP_URL when it is a non-localhost deploy so we never redirect
 * to a mistaken localhost host even if the incoming request URL were wrong.
 */
export function getAuthCallbackRedirectOrigin(requestUrl: string): string {
  const requestOrigin = new URL(requestUrl).origin;
  const requestHost = new URL(requestUrl).hostname;
  if (requestHost !== "localhost" && requestHost !== "127.0.0.1") {
    // Keep callback redirects on the same host that received the magic link.
    // If we hop to a different origin from env, the freshly-set auth cookie is
    // host-scoped to the callback host and the user appears logged out.
    return requestOrigin;
  }

  const cfg = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (cfg) {
    const n = normalizeBase(cfg);
    try {
      const host = new URL(n.startsWith("http") ? n : `https://${n}`).hostname;
      if (host !== "localhost" && host !== "127.0.0.1") return n;
    } catch {
      /* fall through */
    }
  }
  return requestOrigin;
}
