import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrCreateAppUserId,
  getServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";
import { callAiJson, isAiConfigured } from "@/lib/openrouter";
import { generateDailyQuizPrompt } from "@/lib/prompts";
import type { CheckInQuiz, StudyPlan, SWOT } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 45;

const Body = z.object({
  dayNumber: z.number().int().min(1).max(60),
  action: z.enum(["fetch", "submit", "toggle"]).default("fetch"),
  score: z.number().int().min(0).max(5).optional(),
  completed: z.boolean().optional(),
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

  const userId = isSupabaseConfigured() ? await getOrCreateAppUserId() : null;
  const supabase = userId ? getServiceClient() : null;

  if (parsed.action === "submit" && parsed.score !== undefined) {
    if (supabase && userId) {
      await supabase
        .from("checkins")
        .upsert(
          {
            user_id: userId,
            day_number: parsed.dayNumber,
            score: parsed.score,
            completed: true,
          },
          { onConflict: "user_id,day_number" },
        );
    }
    return NextResponse.json({ ok: true });
  }

  if (parsed.action === "toggle") {
    if (supabase && userId) {
      await supabase
        .from("checkins")
        .upsert(
          {
            user_id: userId,
            day_number: parsed.dayNumber,
            completed: Boolean(parsed.completed),
          },
          { onConflict: "user_id,day_number" },
        );
    }
    return NextResponse.json({ ok: true });
  }

  if (supabase && userId) {
    const { data: existing } = await supabase
      .from("checkins")
      .select("quiz, score, completed")
      .eq("user_id", userId)
      .eq("day_number", parsed.dayNumber)
      .maybeSingle();

    if (existing?.quiz) {
      return NextResponse.json({
        quiz: existing.quiz,
        score: existing.score,
        completed: existing.completed,
      });
    }
  }

  let topic = "General revision";
  let subtopic = "Mixed";
  let subject: "physics" | "chemistry" | "biology" = "biology";
  let weaknessInsight: string | undefined;

  if (supabase && userId) {
    const [{ data: planRow }, { data: swotRow }] = await Promise.all([
      supabase
        .from("plans")
        .select("plan_json")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("analyses")
        .select("swot")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const plan = planRow?.plan_json as StudyPlan | null;
    if (plan) {
      for (const w of plan.weeks) {
        const day = w.days.find((d) => d.day === parsed.dayNumber);
        if (day) {
          subject = day.subject;
          const parts = day.focus_topic.split("·").map((s) => s.trim());
          topic = parts[0] ?? day.focus_topic;
          subtopic = parts[1] ?? day.focus_topic;
          break;
        }
      }
    }

    const swot = swotRow?.swot as SWOT | null;
    if (swot) {
      const match = swot.weaknesses.find((w) => w.topic === topic || w.subtopic === subtopic);
      weaknessInsight = match?.likely_gap;
    }
  }

  if (!isAiConfigured()) {
    return NextResponse.json({
      quiz: stubQuiz(),
      warning: "OpenRouter not configured",
    });
  }

  let quiz: CheckInQuiz;
  try {
    quiz = await callAiJson<CheckInQuiz>({
      prompt: generateDailyQuizPrompt({ topic, subtopic, subject, weakness_insight: weaknessInsight }),
      maxTokens: 3000,
      temperature: 0.4,
    });
  } catch (err) {
    console.error("[checkin] OpenRouter error", err);
    return NextResponse.json({ quiz: stubQuiz(), warning: "AI fallback" });
  }

  if (supabase && userId) {
    await supabase
      .from("checkins")
      .upsert(
        {
          user_id: userId,
          day_number: parsed.dayNumber,
          quiz,
          completed: false,
        },
        { onConflict: "user_id,day_number" },
      );
  }

  return NextResponse.json({ quiz });
}

function stubQuiz(): CheckInQuiz {
  return {
    questions: Array.from({ length: 5 }, (_, i) => ({
      q_no: i + 1,
      question: `Sample NEET-style question ${i + 1}: (configure OpenRouter for real questions)`,
      options: { A: "Option A", B: "Option B", C: "Option C", D: "Option D" },
      correct: "A",
      explanation: "Sample explanation — set OPENROUTER_API_KEY for AI-generated quizzes.",
    })),
  };
}
