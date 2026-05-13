"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

type Profile = {
  name: string | null;
  email: string | null;
  state: string | null;
};

export function UserNav() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supa = getBrowserSupabase();
    let cancelled = false;

    async function applySession(session: Awaited<ReturnType<typeof supa.auth.getSession>>["data"]["session"]) {
      if (cancelled) return;
      setSignedIn(Boolean(session));
      if (!session) {
        setProfile(null);
        setSessionReady(true);
        return;
      }
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (res.ok) {
          const body = await res.json();
          const p = body.profile as Profile | undefined;
          if (p?.name) {
            try {
              localStorage.setItem("prepinsights:userName", p.name);
            } catch {
              /* ignore */
            }
          }
          if (!cancelled) setProfile(p ?? null);
        }
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    }

    (async () => {
      try {
        const {
          data: { session },
        } = await supa.auth.getSession();
        await applySession(session);
      } catch {
        if (!cancelled) {
          setSignedIn(false);
          setSessionReady(true);
        }
      }
    })();

    const { data: sub } = supa.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function signOut() {
    try {
      const supa = getBrowserSupabase();
      await supa.auth.signOut();
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem("prepinsights:userName");
    } catch {
      /* ignore */
    }
    setOpen(false);
    setSignedIn(false);
    setProfile(null);
    router.push("/login");
    router.refresh();
  }

  if (!sessionReady || !signedIn) return null;

  const displayName = profile?.name?.trim() || profile?.email?.split("@")[0] || "Account";
  const initial = displayName.slice(0, 1).toUpperCase();
  const needsSetup = !profile?.state;

  return (
    <div ref={panelRef} className="relative flex items-center gap-2">
      {needsSetup && (
        <Link
          href="/onboarding"
          className="hidden sm:inline text-xs font-medium text-brand hover:underline"
        >
          Finish setup
        </Link>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-2xl border border-line bg-white px-2 py-1.5 pr-2 shadow-soft",
          "hover:bg-paper transition text-left min-w-0 max-w-[min(14rem,46vw)]",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white"
          aria-hidden
        >
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{displayName}</span>
          {profile?.email ? (
            <span className="block truncate text-[11px] text-ink-muted">{profile.email}</span>
          ) : null}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-muted transition", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-[100] w-56 rounded-2xl border border-line bg-white py-2 shadow-soft-lg"
        >
          <Link
            href="/profile"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-paper"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4 text-ink-muted" /> Profile
          </Link>
          <Link
            href="/dashboard"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-paper"
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4 text-ink-muted" /> Dashboard
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-paper"
            onClick={() => void signOut()}
          >
            <LogOut className="h-4 w-4 text-ink-muted" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
