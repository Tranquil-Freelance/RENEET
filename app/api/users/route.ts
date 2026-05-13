import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrCreateAppUserId,
  getServerSupabase,
  getServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(32).optional(),
  state: z.string().min(1).max(60),
  attempt_no: z.number().int().min(1).max(10).default(1),
  target: z.string().max(80).optional(),
  study_hours: z.string().max(20).optional(),
  exam_feel: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof z.ZodError ? err.issues[0]?.message : "Invalid request" },
      { status: 400 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      userId: "dev-anon",
      warning: "Supabase service key not configured — onboarding not persisted",
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

  const service = getServiceClient();
  const { error } = await service
    .from("users")
    .update({
      name: parsed.name ?? "Student",
      phone: parsed.phone ? parsed.phone.replace(/\D/g, "").slice(-10) || null : null,
      state: parsed.state,
      attempt_no: parsed.attempt_no,
      target: parsed.target,
      study_hours: parsed.study_hours,
      exam_feel: parsed.exam_feel,
      email: user.email ?? null,
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ userId });
}
