"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * When Supabase rejects `emailRedirectTo` with a query string, the verify link
 * falls back to Site URL only (`https://prepinsight.in`) and the PKCE `code`
 * lands on `/` or another page — not `/auth/callback`. This component forwards
 * any `?code=` hit on a non-callback route to `/auth/callback` so the session
 * exchange runs.
 */
function AuthCodeForwarderInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;
    if (pathname?.startsWith("/auth/callback")) return;

    const p = new URLSearchParams(searchParams.toString());
    if (!p.get("next")) p.set("next", "/exam");
    router.replace(`/auth/callback?${p.toString()}`);
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
