import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
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
    // Dev fallback: return a deterministic-ish id so the rest of the flow works
    // without Supabase configured. Replace with real credentials before launch.
    return NextResponse.json({
      userId: `dev-${parsed.phone}`,
      warning: "Supabase not configured — user not persisted",
    });
  }

  const supabase = getServerClient();

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("phone", parsed.phone)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("users").update({
      name: parsed.name,
      state: parsed.state,
      attempt_no: parsed.attempt_no,
      target: parsed.target,
      study_hours: parsed.study_hours,
      exam_feel: parsed.exam_feel,
    }).eq("id", existing.id);
    return NextResponse.json({ userId: existing.id, returning: true });
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      name: parsed.name,
      phone: parsed.phone,
      state: parsed.state,
      attempt_no: parsed.attempt_no,
      target: parsed.target,
      study_hours: parsed.study_hours,
      exam_feel: parsed.exam_feel,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create user" },
      { status: 500 },
    );
  }

  return NextResponse.json({ userId: data.id });
}
