"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { sanitizeAuthNextPath } from "@/lib/site-url";
import { cn } from "@/lib/utils";

const OTP_FLOW_KEY = "prepinsights:otpAuthMode";

/** Supabase may send 6- or 8-digit numeric email tokens depending on project settings. */
const OTP_LEN_MIN = 6;
const OTP_LEN_MAX = 8;

type AuthMode = "login" | "signup";

export default function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = sanitizeAuthNextPath(search.get("next"), "/exam");
  const modeParam = search.get("mode");
  const [authMode, setAuthMode] = useState<AuthMode>(
    modeParam === "login" ? "login" : "signup",
  );
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const errorToastShown = useRef(false);

  useEffect(() => {
    if (modeParam === "login" || modeParam === "signup") {
      setAuthMode(modeParam);
    }
  }, [modeParam]);

  useEffect(() => {
    if (errorToastShown.current) return;
    const err = search.get("error");
    if (!err) return;
    errorToastShown.current = true;
    if (err === "exchange_failed") {
      toast.error(
        "That sign-in link expired, was already used, or opened on the wrong site. Request a new code on PrepInsights.",
      );
    } else if (err === "missing_code") {
      toast.error("Missing sign-in parameters. Open the link from the latest email or use OTP.");
    }
  }, [search]);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("That email looks off");
      return;
    }
    startTransition(async () => {
      try {
        const supabase = getBrowserSupabase();
        let siteUrl = "";
        try {
          const cfgRes = await fetch("/api/public-site", { cache: "no-store" });
          if (cfgRes.ok) {
            const cfg = (await cfgRes.json()) as { siteUrl?: string };
            if (cfg.siteUrl?.trim()) siteUrl = cfg.siteUrl.trim().replace(/\/+$/, "");
          }
        } catch {
          /* ignore */
        }
        if (!siteUrl && typeof window !== "undefined") {
          siteUrl = window.location.origin;
        }
        const nextForEmail = authMode === "signup" ? "/onboarding" : next;
        const cb = new URL(`${siteUrl}/auth/callback`);
        cb.searchParams.set("next", nextForEmail);

        try {
          sessionStorage.setItem(OTP_FLOW_KEY, authMode);
        } catch {
          /* ignore */
        }

        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: authMode === "signup",
            emailRedirectTo: cb.toString(),
          },
        });
        if (error) throw error;
        setSent(true);
        toast.success("OTP sent — check your inbox");
      } catch (err) {
        const raw = err instanceof Error ? err.message : "Could not send OTP";
        if (authMode === "login" && /user not found|not found|signups not allowed/i.test(raw)) {
          toast.error("No account for this email. Switch to Sign up or check the address.");
        } else if (authMode === "signup" && /already registered|already exists/i.test(raw)) {
          toast.error("This email already has an account. Use Log in instead.");
        } else {
          toast.error(raw);
        }
      }
    });
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const token = otp.trim();
    if (!/^\d{6,8}$/.test(token)) {
      toast.error("Enter the full sign-in code from your email (6–8 digits)");
      return;
    }
    startTransition(async () => {
      try {
        const supabase = getBrowserSupabase();
        let flow: AuthMode = "login";
        try {
          const s = sessionStorage.getItem(OTP_FLOW_KEY);
          if (s === "signup" || s === "login") flow = s;
        } catch {
          /* ignore */
        }
        const otpType = flow === "signup" ? "signup" : "email";
        let { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token,
          type: otpType,
        });
        if (error && otpType === "signup") {
          const r2 = await supabase.auth.verifyOtp({
            email: email.trim(),
            token,
            type: "email",
          });
          error = r2.error;
        }
        if (error) throw error;
        try {
          sessionStorage.removeItem(OTP_FLOW_KEY);
        } catch {
          /* ignore */
        }
        const bootRes = await fetch("/api/users/bootstrap", { method: "POST" });
        const bootBody = await bootRes.json().catch(() => ({}));
        if (bootRes.status === 401) {
          toast.error("Session not ready. Please try again.");
          return;
        }
        if (!bootRes.ok) {
          throw new Error(bootBody.error ?? "Could not initialize profile");
        }
        try {
          const meRes = await fetch("/api/users/me", { cache: "no-store" });
          if (meRes.ok) {
            const meBody = await meRes.json();
            if (meBody?.profile?.name) {
              localStorage.setItem("prepinsights:userName", meBody.profile.name);
            }
          }
        } catch {
          /* ignore profile prefetch failures on login */
        }
        toast.success(authMode === "signup" ? "Welcome!" : "Signed in");
        router.replace(bootBody.onboardingRequired ? "/onboarding" : next);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "OTP verification failed";
        toast.error(msg);
      }
    });
  }

  if (sent) {
    return (
      <div className="max-w-md w-full bg-white rounded-3xl shadow-soft p-8 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-2xl font-serif font-semibold text-ink">Enter OTP</h1>
        <p className="text-ink-muted mt-3">
          We sent a code to <span className="font-medium text-ink">{email}</span>. Enter the full
          number from the email ({OTP_LEN_MIN}–{OTP_LEN_MAX} digits).
        </p>
        <form onSubmit={verifyOtp} className="mt-6 space-y-4 text-left">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-ink mb-1.5">
              Email OTP
            </label>
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="00000000"
              maxLength={OTP_LEN_MAX}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LEN_MAX))
              }
              className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink tracking-[0.12em] text-center placeholder:text-ink-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
              required
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-brand text-white font-medium py-3 hover:bg-brand-dark transition disabled:opacity-60 disabled:cursor-wait"
          >
            {pending ? "Verifying…" : "Verify OTP"}
          </button>
        </form>
        <button
          onClick={() => {
            setSent(false);
            setOtp("");
            try {
              sessionStorage.removeItem(OTP_FLOW_KEY);
            } catch {
              /* ignore */
            }
          }}
          className="mt-6 text-sm text-brand hover:underline"
        >
          Use a different email
        </button>
        <p className="mt-8 text-xs text-ink-muted">
          Didn&apos;t get it? Wait a minute, then check spam.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full bg-white rounded-3xl shadow-soft p-8">
      <Link href="/" className="text-sm text-ink-muted hover:text-ink">
        ← Back home
      </Link>
      <h1 className="mt-6 text-3xl font-serif font-semibold text-ink">
        Log in or sign up
      </h1>
      <p className="mt-2 text-ink-muted">
        No passwords. We&apos;ll email you a one-time code — same flow for new and returning
        students.
      </p>

      <div
        className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-paper p-1"
        role="tablist"
        aria-label="Account action"
      >
        <button
          type="button"
          role="tab"
          aria-selected={authMode === "signup"}
          onClick={() => setAuthMode("signup")}
          className={cn(
            "rounded-xl px-3 py-2 text-sm font-semibold transition",
            authMode === "signup"
              ? "bg-white text-ink shadow-soft"
              : "text-ink-muted hover:text-ink",
          )}
        >
          Sign up
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={authMode === "login"}
          onClick={() => setAuthMode("login")}
          className={cn(
            "rounded-xl px-3 py-2 text-sm font-semibold transition",
            authMode === "login"
              ? "bg-white text-ink shadow-soft"
              : "text-ink-muted hover:text-ink",
          )}
        >
          Log in
        </button>
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        {authMode === "signup"
          ? "Creates your PrepInsights account if this email is new."
          : "Only sends a code if you already have an account."}
      </p>

      <form onSubmit={sendOtp} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink placeholder:text-ink-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
            required
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-brand text-white font-medium py-3 hover:bg-brand-dark transition disabled:opacity-60 disabled:cursor-wait"
        >
          {pending ? "Sending OTP…" : "Send OTP"}
        </button>
      </form>

      <p className="mt-6 text-xs text-ink-muted">
        By continuing you agree to our terms. We only use your email for sign-in.
      </p>
    </div>
  );
}
