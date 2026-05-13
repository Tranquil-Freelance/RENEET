import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrCreateAppUserId,
  getServerSupabase,
  isSupabaseAuthConfigured,
} from "@/lib/supabase-server";

export const runtime = "nodejs";

const UpdateBody = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(32).optional(),
  state: z.string().max(60).optional(),
  attempt_no: z.number().int().min(1).max(10).optional(),
  target: z.string().max(80).optional(),
  study_hours: z.string().max(20).optional(),
  exam_feel: z.string().max(40).optional(),
});

export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
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
    return NextResponse.json({ error: "Could not resolve user profile" }, { status: 500 });
  }

  const { data, error } = await supa
    .from("users")
    .select("id, name, phone, email, state, attempt_no, target, study_hours, exam_feel, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    profile: {
      ...data,
      email: user.email ?? data?.email ?? null,
    },
  });
}

export async function PATCH(req: Request) {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  let parsed: z.infer<typeof UpdateBody>;
  try {
    parsed = UpdateBody.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof z.ZodError ? err.issues[0]?.message : "Invalid request" },
      { status: 400 },
    );
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
    return NextResponse.json({ error: "Could not resolve user profile" }, { status: 500 });
  }

  const patch = {
    ...parsed,
    email: user.email ?? null,
    phone:
      parsed.phone === undefined
        ? undefined
        : parsed.phone.replace(/\D/g, "").slice(-10) || null,
  };

  const { data, error } = await supa
    .from("users")
    .update(patch)
    .eq("id", userId)
    .select("id, name, phone, email, state, attempt_no, target, study_hours, exam_feel, created_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

