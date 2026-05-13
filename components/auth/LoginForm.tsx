"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { sanitizeAuthNextPath } from "@/lib/site-url";

export default function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = sanitizeAuthNextPath(search.get("next"), "/exam");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("That email looks off");
      return;
    }
    startTransition(async () => {
      try {
        const supabase = getBrowserSupabase();
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: true },
        });
        if (error) throw error;
        setSent(true);
        toast.success("OTP sent — check your inbox");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not send OTP";
        toast.error(msg);
      }
    });
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const token = otp.trim();
    if (!/^\d{6}$/.test(token)) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    startTransition(async () => {
      try {
        const supabase = getBrowserSupabase();
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token,
          type: "email",
        });
        if (error) throw error;
        toast.success("Signed in");
        router.replace(next);
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
          We sent a 6-digit sign-in code to <span className="font-medium text-ink">{email}</span>.
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
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-ink tracking-[0.2em] text-center placeholder:text-ink-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
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
            setEmail("");
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
        Sign in
      </h1>
      <p className="mt-2 text-ink-muted">
        No passwords, no nonsense. We&apos;ll email you a one-time OTP.
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
