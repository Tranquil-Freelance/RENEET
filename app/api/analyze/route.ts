import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrCreateAppUserId,
  getServerSupabase,
  getServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";
import { callClaudeJson, isClaudeConfigured } from "@/lib/claude";
import { generateSWOTPrompt } from "@/lib/prompts";
import { computeOverallStats, computeSubjectScores, deriveWithBlanks } from "@/lib/scoring";
import { QUESTIONS } from "@/lib/questions";
import type { SWOT } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const AnswerSchema = z.object({
  chosen: z.enum(["A", "B", "C", "D"]).nullable(),
  guessed: z.boolean().default(false),
});

const Body = z.object({
  answers: z.record(z.string(), AnswerSchema),
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

  const answerMap = Object.fromEntries(
    Object.entries(parsed.answers).map(([k, v]) => [Number(k), v]),
  );

  const derived = deriveWithBlanks(answerMap, QUESTIONS);
  const subjectScores = computeSubjectScores(derived);
  const overallStats = computeOverallStats(subjectScores);

  let userProfile = {
    name: "Student",
    state: null as string | null,
    attempt_no: 1,
    target: null as string | null,
  };
  let userId: string | null = null;

  if (isSupabaseConfigured()) {
    const supa = await getServerSupabase();
    const {
      data: { user },
    } = await supa.auth.getUser();
    if (user) {
      userId = await getOrCreateAppUserId();
      if (userId) {
        const service = getServiceClient();
        const { data } = await service
          .from("users")
          .select("name, state, attempt_no, target")
          .eq("id", userId)
          .maybeSingle();
        if (data) userProfile = { ...userProfile, ...data };
        await service.from("responses").insert({
          user_id: userId,
          answers: parsed.answers,
          derived,
        });
      }
    }
  }

  if (!isClaudeConfigured()) {
    const stub = stubSWOT(subjectScores);
    return NextResponse.json({
      swot: stub,
      overall: overallStats,
      analysisId: "dev-stub",
      warning: "Claude not configured",
    });
  }

  let swot: SWOT;
  try {
    swot = await callClaudeJson<SWOT>({
      prompt: generateSWOTPrompt({
        user: userProfile,
        derived,
        subject_scores: subjectScores,
      }),
      maxTokens: 6000,
    });
  } catch (err) {
    console.error("[analyze] Claude error", err);
    return NextResponse.json(
      { error: "AI analysis failed. Please try again." },
      { status: 502 },
    );
  }

  swot.subject_scores = subjectScores;

  let analysisId = "dev-stub";
  if (userId && isSupabaseConfigured()) {
    const service = getServiceClient();
    const { data } = await service
      .from("analyses")
      .insert({
        user_id: userId,
        swot,
        score_band: `${swot.estimated_score.min}-${swot.estimated_score.max}`,
      })
      .select("id")
      .single();
    if (data?.id) analysisId = data.id;
  }

  return NextResponse.json({ swot, overall: overallStats, analysisId });
}

function stubSWOT(subjectScores: SWOT["subject_scores"]): SWOT {
  const total = Object.values(subjectScores).reduce((s, v) => s + v.net_marks, 0);
  return {
    estimated_score: { min: Math.max(0, total - 15), max: total + 15 },
    estimated_percentile: "top 30%",
    subject_scores: subjectScores,
    strengths: [
      {
        topic: "Ecology",
        subtopic: "Ecosystem",
        subject: "biology",
        score_pct: 90,
        marks: 18,
        insight: "Strong grasp on energy flow and trophic levels.",
      },
    ],
    weaknesses: [
      {
        topic: "Genetics & Evolution",
        subtopic: "Linkage & Crossing Over",
        subject: "biology",
        marks_lost: 12,
        questions_wrong: 3,
        likely_gap: "Confusion between recombination frequency and map distance.",
        fix_priority: "high",
        fix_time_hours: 4,
      },
    ],
    opportunities: [
      {
        topic: "Modern Physics",
        subtopic: "Nuclei & Radioactivity",
        subject: "physics",
        questions_blank: 3,
        marks_recoverable: 12,
        effort_hours: 2,
        insight: "NCERT formulas alone unlock most NEET questions here.",
      },
    ],
    threats: [
      {
        topic: "Optics",
        subtopic: "Wave Optics - Interference",
        subject: "physics",
        questions_guessed_right: 2,
        marks_at_risk: 8,
        warning: "Lucky on YDSE - revisit before relying on it in the re-exam.",
      },
    ],
    headline_insight:
      "Stub analysis (Claude not configured). Add your ANTHROPIC_API_KEY to get a real personalized SWOT.",
  };
}
