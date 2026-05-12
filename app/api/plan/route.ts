import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrCreateAppUserId,
  getServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";
import { callClaudeJson, isClaudeConfigured } from "@/lib/claude";
import { generatePlanPrompt } from "@/lib/prompts";
import type { StudyPlan, SWOT } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  daysRemaining: z.number().int().min(7).max(60).default(30),
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
    return NextResponse.json(
      { error: "Supabase not configured." },
      { status: 503 },
    );
  }

  const userId = await getOrCreateAppUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const service = getServiceClient();
  let user = { name: "Student", attempt_no: 1, target: null as string | null };
  let swot: SWOT | null = null;

  const [userRes, swotRes] = await Promise.all([
    service
      .from("users")
      .select("name, attempt_no, target")
      .eq("id", userId)
      .maybeSingle(),
    service
      .from("analyses")
      .select("swot")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (userRes.data) user = { ...user, ...userRes.data };
  if (swotRes.data?.swot) swot = swotRes.data.swot as SWOT;

  if (!swot) {
    return NextResponse.json(
      { error: "No SWOT analysis found. Please complete the exam first." },
      { status: 400 },
    );
  }

  if (!isClaudeConfigured()) {
    const stub = stubPlan();
    await savePlan(userId, stub);
    return NextResponse.json({ plan: stub, warning: "Claude not configured" });
  }

  let plan: StudyPlan;
  try {
    plan = await callClaudeJson<StudyPlan>({
      prompt: generatePlanPrompt({ user, swot, daysRemaining: parsed.daysRemaining }),
      maxTokens: 12000,
    });
  } catch (err) {
    console.error("[plan] Claude error", err);
    return NextResponse.json(
      { error: "AI plan generation failed. Please try again." },
      { status: 502 },
    );
  }

  await savePlan(userId, plan);
  return NextResponse.json({ plan });
}

async function savePlan(userId: string, plan: StudyPlan) {
  const service = getServiceClient();
  const { data: latest } = await service
    .from("plans")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest?.id) {
    await service.from("plans").update({ plan_json: plan }).eq("id", latest.id);
  } else {
    await service
      .from("plans")
      .insert({ user_id: userId, plan_json: plan, paid: false });
  }
}

function stubPlan(): StudyPlan {
  return {
    plan_summary:
      "Stub plan (Claude not configured). Add your ANTHROPIC_API_KEY for a personalized 30-day plan.",
    weeks: [
      {
        week_number: 1,
        theme: "Attack Weaknesses",
        weekly_goal: "Close the top 3 weakness gaps",
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          date_offset: i + 1,
          focus_topic: "Genetics · Linkage & Crossing Over",
          subject: "biology" as const,
          swot_category: "weakness" as const,
          tasks: [
            {
              time_minutes: 60,
              activity: "Read NCERT Bio Class 12 Chapter 5, Section 5.3",
              resource: "NCERT Biology Class 12",
              goal: "Understand linkage and recombination",
            },
            {
              time_minutes: 45,
              activity: "Solve 20 PYQs on linkage",
              resource: "NEET PYQ Booklet",
              goal: "Apply concepts to exam-style problems",
            },
          ],
          total_hours: 1.75,
          motivation: "One concept fixed is 4 marks unlocked.",
        })),
      },
    ],
    mock_test_days: [14, 30],
    daily_avg_hours: 5.5,
  };
}
