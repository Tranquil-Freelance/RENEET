import { NextResponse } from "next/server";
import {
  getOrCreateAppUserId,
  getServerSupabase,
  isSupabaseAuthConfigured,
} from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 20;

/**
 * Ensure a public.users row exists right after auth sign-in.
 * Returns whether onboarding is still required (missing `state`).
 */
export async function POST() {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json({
      userId: "dev-anon",
      isNew: false,
      onboardingRequired: true,
      warning: "Supabase URL or anon key missing — bootstrap not persisted",
    });
  }

  const supa = await getServerSupabase();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const userId = await getOrCreateAppUserId();
  if (!userId) {
    return NextResponse.json({ error: "Could not resolve user" }, { status: 500 });
  }

  const { data, error } = await supa
    .from("users")
    .select("id, state, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    userId,
    onboardingRequired: !data?.state,
  });
}

