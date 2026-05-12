import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrCreateAppUserId,
  getServerSupabase,
  getServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";
import { callAiJson, isAiConfigured } from "@/lib/openrouter";
import { generateSWOTPrompt, type QuantitativeSummary } from "@/lib/prompts";
import {
  aggregateBySubtopic,
  computeOverallStats,
  computeSubjectScores,
  deriveWithBlanks,
  enrichSWOT,
  percentileFor,
  rankEstimateFor,
} from "@/lib/scoring";
import { QUESTIONS } from "@/lib/questions";
import type { SubjectScore, SWOT } from "@/types";

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
  const aggregates = aggregateBySubtopic(derived);

  const netMarks = overallStats.total_marks;
  const percentile = percentileFor(netMarks);
  const rank = rankEstimateFor(percentile);

  const quant: QuantitativeSummary = {
    net_marks: netMarks,
    percentile,
    rank,
    subject_scores: subjectScores,
  };

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

  if (!isAiConfigured()) {
    const stub = enrichSWOT(stubSWOT(subjectScores, quant), aggregates);
    return NextResponse.json({
      swot: stub,
      overall: overallStats,
      analysisId: "dev-stub",
      warning: "OpenRouter not configured",
    });
  }

  let swot: SWOT;
  try {
    swot = await callAiJson<SWOT>({
      prompt: generateSWOTPrompt({
        user: userProfile,
        derived,
        aggregates,
        quant,
      }),
      maxTokens: 6000,
      temperature: 0.25,
    });
  } catch (err) {
    console.error("[analyze] OpenRouter error", err);
    return NextResponse.json(
      { error: "AI analysis failed. Please try again." },
      { status: 502 },
    );
  }

  // Always overwrite quantitative fields with server-computed values — never
  // trust the AI to do arithmetic.
  swot.estimated_score = netMarks;
  swot.estimated_percentile = percentile;
  swot.estimated_rank = rank;
  swot.subject_scores = subjectScores;

  // Backfill any empty SWOT category and guarantee every subject is represented
  // so the cards/breakdown never show "Nothing here yet" / "0 chapters".
  swot = enrichSWOT(swot, aggregates);

  let analysisId = "dev-stub";
  if (userId && isSupabaseConfigured()) {
    const service = getServiceClient();
    const { data } = await service
      .from("analyses")
      .insert({
        user_id: userId,
        swot,
        score_band: `${netMarks}`,
      })
      .select("id")
      .single();
    if (data?.id) analysisId = data.id;
  }

  return NextResponse.json({ swot, overall: overallStats, analysisId });
}

function stubSWOT(
  subjectScores: Record<"physics" | "chemistry" | "biology", SubjectScore>,
  quant: QuantitativeSummary,
): SWOT {
  return {
    estimated_score: quant.net_marks,
    estimated_percentile: quant.percentile,
    estimated_rank: quant.rank,
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
      "Stub analysis (OpenRouter not configured). Add your OPENROUTER_API_KEY to get a real personalized SWOT.",
  };
}
