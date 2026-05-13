"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { INDIAN_STATES } from "@/lib/states";

interface Profile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  state: string | null;
  attempt_no: number | null;
  target: string | null;
  study_hours: string | null;
  exam_feel: string | null;
}

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

export function ProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [attemptNo, setAttemptNo] = useState("1");
  const [target, setTarget] = useState("Any AIIMS");
  const [studyHours, setStudyHours] = useState("6-8");
  const [examFeel, setExamFeel] = useState("As expected");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Could not load profile");
        if (cancelled) return;
        const p = body.profile as Profile;
        setProfile(p);
        setName(p?.name ?? "");
        setPhone(p?.phone ?? "");
        setState(p?.state ?? "");
        setAttemptNo(String(p?.attempt_no ?? 1));
        setTarget(p?.target ?? "Any AIIMS");
        setStudyHours(p?.study_hours ?? "6-8");
        setExamFeel(p?.exam_feel ?? "As expected");
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Profile load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(() => {
    if (!profile) return false;
    return (
      name !== (profile.name ?? "") ||
      phone !== (profile.phone ?? "") ||
      state !== (profile.state ?? "") ||
      attemptNo !== String(profile.attempt_no ?? 1) ||
      target !== (profile.target ?? "Any AIIMS") ||
      studyHours !== (profile.study_hours ?? "6-8") ||
      examFeel !== (profile.exam_feel ?? "As expected")
    );
  }, [attemptNo, examFeel, name, phone, profile, state, studyHours, target]);

  async function saveProfile() {
    if (name.trim().length < 2) {
      toast.error("Please enter your full name");
      return;
    }
    if (!state) {
      toast.error("Please select your state");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          state,
          attempt_no: Number(attemptNo.replace("+", "")),
          target,
          study_hours: studyHours,
          exam_feel: examFeel,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not save profile");
      const p = body.profile as Profile;
      setProfile(p);
      localStorage.setItem("prepinsights:userName", p?.name ?? name.trim());
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-600 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading profile…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Your profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Keep this updated so analysis, plan, and payment records stay tied to your account.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <Field label="Email">
          <input value={profile?.email ?? ""} className={inputCls} disabled />
        </Field>
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Phone">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
            inputMode="numeric"
            placeholder="10-digit mobile number"
          />
        </Field>
        <Field label="State">
          <select value={state} onChange={(e) => setState(e.target.value)} className={inputCls}>
            <option value="">Select state…</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Attempt">
            <select
              value={attemptNo}
              onChange={(e) => setAttemptNo(e.target.value)}
              className={inputCls}
            >
              {ATTEMPT_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Target">
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputCls}>
              {TARGET_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Daily study hours">
            <select
              value={studyHours}
              onChange={(e) => setStudyHours(e.target.value)}
              className={inputCls}
            >
              {HOURS_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Exam felt">
            <select
              value={examFeel}
              onChange={(e) => setExamFeel(e.target.value)}
              className={inputCls}
            >
              {FEEL_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <button
          type="button"
          onClick={saveProfile}
          disabled={!dirty || saving}
          className="w-full rounded-xl bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 disabled:bg-slate-50 disabled:text-slate-500";

