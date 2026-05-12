"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { INDIAN_STATES } from "@/lib/states";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

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

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canAdvance1 =
    form.name.trim().length >= 2 &&
    /^\d{10}$/.test(form.phone.replace(/\D/g, "").slice(-10)) &&
    form.state.length > 0;

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.replace(/\D/g, "").slice(-10),
          state: form.state,
          attempt_no: Number(form.attempt_no.replace("+", "")),
          target: form.target,
          study_hours: form.study_hours,
          exam_feel: form.exam_feel,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not create your profile");
      }
      const { userId } = await res.json();
      localStorage.setItem("neetsurge:userId", userId);
      localStorage.setItem("neetsurge:userName", form.name.trim());
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
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="text-xs text-slate-500">Step {step} of 3</div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1.5 rounded-full",
              s <= step ? "bg-[var(--color-brand)]" : "bg-slate-200",
            )}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-bold">First, the basics</h2>
              <p className="mt-1 text-sm text-slate-600">
                We&apos;ll never spam you. Phone is used to deliver your plan.
              </p>

              <div className="mt-6 space-y-4">
                <Field label="First name">
                  <input
                    autoFocus
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Aarav"
                    className={inputCls}
                  />
                </Field>

                <Field label="WhatsApp number">
                  <div className="flex items-stretch rounded-lg border border-slate-300 focus-within:border-[var(--color-brand)] focus-within:ring-2 focus-within:ring-[var(--color-brand)]/20">
                    <span className="px-3 inline-flex items-center text-sm text-slate-500 border-r border-slate-200 bg-slate-50 rounded-l-lg">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full bg-transparent px-3 py-2.5 outline-none"
                    />
                  </div>
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
              <h2 className="text-2xl font-bold">A bit about your exam</h2>
              <p className="mt-1 text-sm text-slate-600">
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
                  className="text-sm text-slate-500 hover:text-slate-800"
                >
                  Back
                </button>
                <PrimaryButton onClick={() => setStep(3)}>
                  Continue
                </PrimaryButton>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-bold">Confirm and start</h2>
              <p className="mt-1 text-sm text-slate-600">
                Quick check before you open the answer sheet.
              </p>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <SummaryRow label="Name" value={form.name} />
                <SummaryRow label="Phone" value={`+91 ${form.phone}`} />
                <SummaryRow label="State" value={form.state} />
                <SummaryRow label="Attempt" value={form.attempt_no} />
                <SummaryRow label="Target" value={form.target} />
                <SummaryRow label="Study hours/day" value={form.study_hours} />
                <SummaryRow label="Exam feel" value={form.exam_feel} />
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm text-slate-500 hover:text-slate-800"
                  disabled={submitting}
                >
                  Back
                </button>
                <PrimaryButton onClick={submit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                    </>
                  ) : (
                    <>
                      Start Marking My Answers
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
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">
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
      <div className="text-sm font-medium text-slate-700 mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition",
              value === o
                ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                : "border-slate-300 text-slate-700 hover:border-slate-400",
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
        "inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[var(--color-brand-600)] disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-200 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
