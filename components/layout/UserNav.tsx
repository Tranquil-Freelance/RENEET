"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, LayoutDashboard, UserRound } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { PROFILE_UPDATED_EVENT } from "@/lib/profile-events";
import { cn } from "@/lib/utils";

const BRAND_FALLBACK = "PrepInsight";

/** Raw fields for computing the label in the header. */
type NavProfile = {
  apiName: string | null;
  metaName: string | null;
  email: string | null;
  state: string | null;
};

function readStoredDisplayName(): string | null {
  try {
    const s = localStorage.getItem("prepinsights:userName")?.trim();
    return s && s.length > 0 ? s : null;
  } catch {
    return null;
  }
}

function resolveNavDisplayName(p: NavProfile | null): string {
  if (!p) return BRAND_FALLBACK;
  const db = p.apiName?.trim() ?? "";
  if (db && db !== "Student") return db;
  const stored = readStoredDisplayName();
  if (stored && stored !== "Student") return stored;
  const meta = p.metaName?.trim() ?? "";
  if (meta) return meta;
  if (db) return db;
  const local = p.email?.split("@")[0]?.trim();
  if (local) return local;
  return BRAND_FALLBACK;
}

export function UserNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<NavProfile | null>(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supa = getBrowserSupabase();
    let cancelled = false;

    async function loadFromSession(session: Awaited<ReturnType<typeof supa.auth.getSession>>["data"]["session"]) {
      if (cancelled) return;
      setSignedIn(Boolean(session));
      if (!session) {
        setProfile(null);
        setSessionReady(true);
        return;
      }
      try {
        const {
          data: { user },
        } = await supa.auth.getUser();
        const metaName =
          typeof user?.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name.trim()
            : null;
        const sessionEmail = user?.email ?? null;

        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (res.ok) {
          const body = await res.json();
          const row = body.profile as { name?: string | null; email?: string | null; state?: string | null } | undefined;
          if (!cancelled) {
            setProfile({
              apiName: row?.name ?? null,
              metaName,
              email: row?.email ?? sessionEmail,
              state: row?.state ?? null,
            });
            const n = row?.name?.trim();
            if (n && n !== "Student") {
              try {
                localStorage.setItem("prepinsights:userName", n);
              } catch {
                /* ignore */
              }
            }
          }
        } else if (!cancelled) {
          setProfile({
            apiName: null,
            metaName,
            email: sessionEmail,
            state: null,
          });
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
        await loadFromSession(session);
      } catch {
        if (!cancelled) {
          setSignedIn(false);
          setSessionReady(true);
        }
      }
    })();

    const { data: sub } = supa.auth.onAuthStateChange((_event, session) => {
      void loadFromSession(session);
    });

    function onProfileUpdated() {
      void supa.auth.getSession().then(({ data: { session } }) => loadFromSession(session));
    }
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    };
  }, [pathname]);

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
      localStorage.removeItem("prepinsights:paid");
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

  const displayName = resolveNavDisplayName(profile);
  const emailLocal = profile?.email?.split("@")[0]?.trim() ?? "";

  let initialLetter = "";
  if (displayName !== BRAND_FALLBACK) {
    initialLetter = displayName.slice(0, 1).toUpperCase();
  } else if (emailLocal) {
    initialLetter = emailLocal.slice(0, 1).toUpperCase();
  }
  const useUserIcon = initialLetter.length === 0;

  return (
    <div ref={panelRef} className="relative flex items-center gap-2">
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
          {useUserIcon ? (
            <UserRound className="h-4 w-4 text-white" strokeWidth={2.25} />
          ) : (
            initialLetter
          )}
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
