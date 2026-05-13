"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { INDIAN_STATES } from "@/lib/states";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

type Step = 1 | 2;

interface FormState {
  name: string;
  phone: string;
  state: string;
  attempt_no: string;
  target: string;
  study_hours: string;
  exam_feel: string;
}

const INITIAL: FormState = {
  name: "",
  phone: "",
  state: "",
  attempt_no: "1",
  target: "Any AIIMS",
  study_hours: "6-8",
  exam_feel: "As expected",
};

const ATTEMPT_OPTIONS = ["1", "2", "3+"];
const TARGET_OPTIONS = [
  "AIIMS Delhi",
  "Top AIIMS",
  "Any AIIMS",
  "State Govt Medical",
  "Any Medical College",
];
const HOURS_OPTIONS = ["1-4", "4-6", "6-8", "8+"];
const FEEL_OPTIONS = [
  "Better than expected",
  "As expected",
  "Harder than expected",
];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supa = getBrowserSupabase();
        const { data } = await supa.auth.getUser();
        setEmail(data.user?.email ?? null);
      } catch {
        // Supabase not configured — fine for dev preview.
      }
    })();
  }, []);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canAdvance1 = form.name.trim().length > 1 && form.state.length > 0;

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          state: form.state,
          attempt_no: Number(form.attempt_no.replace("+", "")),
          target: form.target,
          study_hours: form.study_hours,
          exam_feel: form.exam_feel,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save your profile");
      }
      try {
        localStorage.setItem("prepinsights:userName", form.name.trim());
      } catch {
        /* ignore local storage failures */
      }
      router.push("/exam");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="text-xs text-ink-muted">Step {step} of 2</div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1.5 rounded-full",
              s <= step ? "bg-brand" : "bg-line",
            )}
          />
        ))}
      </div>

      <div className="rounded-3xl border border-line bg-white p-6 md:p-8 shadow-soft">
        {email && (
          <p className="text-xs text-ink-muted mb-4">
            Signed in as <span className="font-medium text-ink">{email}</span>
          </p>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-serif font-semibold text-ink">First, where are you from?</h2>
              <p className="mt-1 text-sm text-ink-muted">
                We use this to compare you fairly with state-quota peers.
              </p>

              <div className="mt-6 space-y-4">
                <Field label="Your name">
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Aakash Sharma"
                  />
                </Field>
                <Field label="Phone (optional)">
                  <input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className={inputCls}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="State">
                  <select
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select state…</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <PrimaryButton
                onClick={() => setStep(2)}
                disabled={!canAdvance1}
                className="mt-6"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </PrimaryButton>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-serif font-semibold text-ink">A bit about your exam</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Helps the AI personalize your plan.
              </p>

              <div className="mt-6 space-y-5">
                <PillField
                  label="Which attempt was this?"
                  options={ATTEMPT_OPTIONS}
                  value={form.attempt_no}
                  onChange={(v) => set("attempt_no", v)}
                />
                <Field label="What's your target?">
                  <select
                    value={form.target}
                    onChange={(e) => set("target", e.target.value)}
                    className={inputCls}
                  >
                    {TARGET_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <PillField
                  label="Daily study hours (avg)"
                  options={HOURS_OPTIONS}
                  value={form.study_hours}
                  onChange={(v) => set("study_hours", v)}
                />
                <PillField
                  label="How did the exam feel?"
                  options={FEEL_OPTIONS}
                  value={form.exam_feel}
                  onChange={(v) => set("exam_feel", v)}
                />
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-ink-muted hover:text-ink"
                  disabled={submitting}
                >
                  Back
                </button>
                <PrimaryButton onClick={submit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      Start the analysis
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </PrimaryButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function PillField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-ink mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition",
              value === o
                ? "border-brand bg-brand text-white shadow-soft"
                : "border-line text-ink hover:border-ink-muted",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
