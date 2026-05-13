"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { sanitizeAuthNextPath } from "@/lib/site-url";

/**
 * When Supabase rejects `emailRedirectTo` with a query string, the verify link
 * falls back to Site URL only (`https://prepinsight.in`) and the PKCE `code`
 * lands on `/` or another page — not `/auth/callback`. This component forwards
 * any auth params hit on a non-callback route to `/auth/callback` so the
 * session exchange runs.
 */
function AuthCodeForwarderInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const otpType = searchParams.get("type");

    if (code || (tokenHash && otpType)) {
      if (pathname?.startsWith("/auth/callback")) return;
      const p = new URLSearchParams(searchParams.toString());
      if (!p.get("next")) p.set("next", "/exam");
      router.replace(`/auth/callback?${p.toString()}`);
      return;
    }

    // Some mobile clients open verify links with tokens in URL hash fragments.
    // Hash is never sent to server, so complete session in browser and route.
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash || !hash.includes("access_token=")) return;

    const run = async () => {
      const fragment = new URLSearchParams(hash.slice(1));
      const access_token = fragment.get("access_token");
      const refresh_token = fragment.get("refresh_token");
      if (!access_token || !refresh_token) return;

      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        router.replace("/login?error=exchange_failed");
        return;
      }

      const next = sanitizeAuthNextPath(searchParams.get("next"), "/exam");
      router.replace(next);
    };
    void run();

  }, [pathname, router, searchParams]);

  return null;
}

export function AuthCodeForwarder() {
  return (
    <Suspense fallback={null}>
      <AuthCodeForwarderInner />
    </Suspense>
  );
}
