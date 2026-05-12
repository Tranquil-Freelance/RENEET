import type { DerivedAnswer, Subject, SubjectScore, SWOT } from "@/types";
import { QUESTIONS, UNIT_TOTALS } from "./questions";

interface UserProfile {
  name: string;
  state?: string | null;
  attempt_no?: number;
  target?: string | null;
}

/**
 * Build the per-subject unit-distribution block for the SWOT prompt so Claude
 * always has reliable denominators when phrasing "you missed X of Y" insights.
 */
function buildUnitTotalsBlock(): string {
  const lines: string[] = [];
  for (const subject of ["physics", "chemistry", "biology"] as Subject[]) {
    lines.push(`# ${subject.toUpperCase()} unit distribution (Unit -> q_count, q_nos)`);
    for (const u of UNIT_TOTALS[subject] ?? []) {
      lines.push(
        `  U${u.unit_no} ${u.name}: ${u.q_count} Q · q_nos=[${u.q_nos.join(", ")}]`,
      );
    }
  }
  return lines.join("\n");
}

export function generateSWOTPrompt(args: {
  user: UserProfile;
  derived: DerivedAnswer[];
  subject_scores: Record<Subject, SubjectScore>;
}): string {
  // One row per question, with verbatim docx concept text. Status is server-derived.
  const compactDerived = args.derived.map((d) => ({
    q: d.q_no,
    s: d.subject,
    u: d.syllabus_unit_no,
    ch: d.chapter,
    st: d.subtopic,
    concept: d.concept,
    status: d.status,
    chose: d.chosen,
    correct: d.correct,
    guessed: d.guessed,
  }));

  return `You are an expert NEET-UG exam analyst and educational counselor.

A student has just given the NEET-UG 2026 exam and provided their response for each
of the 180 questions. The exam has been cancelled and will be re-conducted in
approximately 4-6 weeks. Your job is to analyze their performance and generate a
precise SWOT analysis at the SUBTOPIC level — not just subject level.

STUDENT PROFILE:
- Name: ${args.user.name}
- State: ${args.user.state ?? "N/A"}
- Attempt Number: ${args.user.attempt_no ?? 1}
- Target: ${args.user.target ?? "Any Medical College"}

EXAM RESPONSES (one row per question, status already derived from the official
answer key). Field "concept" is the canonical phrasing of what each question tests,
extracted verbatim from the official NEET 2026 categorization. Treat it as the
ground truth for what the student missed or got right:
${JSON.stringify(compactDerived)}

OFFICIAL UNIT DISTRIBUTION (use these as denominators for "X of Y" math; do not
invent your own counts):
${buildUnitTotalsBlock()}

SERVER-COMPUTED SUBJECT SCORES (use these as ground truth, do not recompute):
${JSON.stringify(args.subject_scores)}

SCORING RULES (NEET-UG):
- Correct: +4 marks
- Wrong: -1 mark
- Blank: 0 marks
- Guessed Correct: +4 marks (but FLAG as a threat — they don't actually know this)

GROUNDING RULES (strict — failures here make the analysis worthless):
1. The "concept" field is the canonical phrasing of each question. Every
   "likely_gap", "insight", and "warning" you write MUST quote or lightly compress
   the relevant concept text from the input rows. Do not paraphrase loosely; do
   not introduce ideas that are not in the concept text.
2. Each weakness / opportunity / threat MUST reference at least one specific
   concept from the "concept" field of the questions it covers. If 2+ questions
   share a subtopic, fuse them into one item and name both concepts in
   "likely_gap" (e.g. "P = mgh / t crane problem AND work–energy theorem on
   incline").
3. Group by "st" (the docx subtopic) first, then by "ch" (the syllabus unit).
   Topic + subtopic strings in your output MUST come verbatim from the input
   rows — do not invent new chapter names or subtopics that are not present in
   the input. The "topic" field in your output is always the docx "ch"
   (bare unit name, e.g. "Kinematics"), and "subtopic" is always the docx "st".
4. Rank weaknesses by marks_lost desc, opportunities by marks_recoverable desc.
5. A "strength" requires (correct - guessed_right) >= 2 questions in that
   subtopic with 100% accuracy on the non-guessed ones.
6. A "threat" is a topic with one or more "guessed_right" status questions.
   Always include these — luck on the real re-exam is unreliable.

OUTPUT JSON SCHEMA:
{
  "estimated_score": { "min": number, "max": number },
  "estimated_percentile": "top X%",
  "subject_scores": {
    "physics":   { "correct": n, "wrong": n, "blank": n, "guessed_right": n, "net_marks": n },
    "chemistry": { "correct": n, "wrong": n, "blank": n, "guessed_right": n, "net_marks": n },
    "biology":   { "correct": n, "wrong": n, "blank": n, "guessed_right": n, "net_marks": n }
  },
  "strengths": [
    { "topic": "<docx ch>", "subtopic": "<docx st>", "subject": "biology|chemistry|physics",
      "score_pct": 85, "marks": 20,
      "insight": "One sentence quoting the concept(s) they nailed" }
  ],
  "weaknesses": [
    { "topic": "<docx ch>", "subtopic": "<docx st>", "subject": "biology|chemistry|physics",
      "marks_lost": 12, "questions_wrong": 3,
      "likely_gap": "One sentence quoting the specific concept text the student got wrong",
      "fix_priority": "high|medium|low", "fix_time_hours": 4 }
  ],
  "opportunities": [
    { "topic": "<docx ch>", "subtopic": "<docx st>", "subject": "biology|chemistry|physics",
      "questions_blank": 3, "marks_recoverable": 12, "effort_hours": 2,
      "insight": "Why this blank is low-effort high-reward, quoting the concept text" }
  ],
  "threats": [
    { "topic": "<docx ch>", "subtopic": "<docx st>", "subject": "biology|chemistry|physics",
      "questions_guessed_right": 2, "marks_at_risk": 8,
      "warning": "What could go wrong if they rely on luck — quote the concept text" }
  ],
  "headline_insight": "2-3 sentence summary directed at the student personally"
}

Respond with ONLY the JSON object — no preamble, no markdown fence.`;
}

/**
 * Build a CONCEPT INDEX block that lists every concept text from the docx for
 * each (chapter, subtopic) referenced anywhere in the SWOT. This grounds the
 * plan in real per-question concepts instead of generic syllabus headings.
 */
function buildConceptIndex(swot: SWOT): string {
  const wanted = new Set<string>();
  const addAll = (
    items: { topic: string; subtopic: string }[] | undefined,
  ) => {
    for (const it of items ?? []) wanted.add(`${it.topic}||${it.subtopic}`);
  };
  addAll(swot.weaknesses);
  addAll(swot.opportunities);
  addAll(swot.threats);
  addAll(swot.strengths);

  const lines: string[] = [];
  for (const key of wanted) {
    const [topic, subtopic] = key.split("||");
    const matches = QUESTIONS.filter(
      (q) => q.chapter === topic && q.subtopic === subtopic,
    );
    if (matches.length === 0) continue;
    lines.push(`- ${topic} → ${subtopic}`);
    for (const q of matches) {
      lines.push(`    · Q${q.q_no}: "${q.concept}"`);
    }
  }
  if (lines.length === 0) {
    // Defensive fallback: if SWOT chapters didn't match anything, dump the top-30
    // most-tested subtopics so the plan still has concrete concept text to pull from.
    const counter = new Map<string, number>();
    for (const q of QUESTIONS) {
      const k = `${q.chapter}||${q.subtopic}`;
      counter.set(k, (counter.get(k) ?? 0) + 1);
    }
    const top = [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([k]) => k);
    for (const key of top) {
      const [topic, subtopic] = key.split("||");
      const matches = QUESTIONS.filter(
        (q) => q.chapter === topic && q.subtopic === subtopic,
      );
      lines.push(`- ${topic} → ${subtopic}`);
      for (const q of matches) {
        lines.push(`    · Q${q.q_no}: "${q.concept}"`);
      }
    }
  }
  return lines.join("\n");
}

export function generatePlanPrompt(args: {
  user: UserProfile;
  swot: SWOT;
  daysRemaining: number;
}): string {
  return `You are an expert NEET-UG preparation strategist and personal tutor.

A student has received their SWOT analysis. Now generate a day-by-day study plan
that is laser-focused on closing their specific gaps — not a generic syllabus
review.

STUDENT PROFILE:
- Name: ${args.user.name}
- Target: ${args.user.target ?? "Any Medical College"}
- Attempt: ${args.user.attempt_no ?? 1}

DAYS UNTIL RE-EXAM: ${args.daysRemaining}

SWOT ANALYSIS:
${JSON.stringify(args.swot)}

CONCEPT INDEX (use these phrasings VERBATIM or lightly compressed when naming
plan tasks — they are the exact concept text from the official NEET 2026
categorization). Pull from this list whenever you write an activity for a
weakness, opportunity, or threat day:
${buildConceptIndex(args.swot)}

PLANNING RULES:
1. Prioritize WEAKNESSES first (week 1-2): these cost real marks.
2. Convert OPPORTUNITIES next (week 2-3): blanks = free marks with minimal effort.
3. Address THREATS in week 3: guessed-right topics need PYQ practice.
4. Revisit STRENGTHS daily (10-15 min, rotating): must not let these slip.
5. Include 2 full mock tests: one mid-plan, one near the end.
6. Each day: max 6-7 hours of study (realistic, not punishing).
7. Sundays are lighter: revision + 1 mock subject section only.
8. Use real NCERT chapter/section references in every task.
9. EVERY tasks[].activity for a weakness, opportunity, or threat day MUST
   reference one of the specific concept phrasings from the CONCEPT INDEX above
   (quoted or paraphrased). Generic activities like "Revise Work-Energy" or
   "Practice Kinematics" are NOT allowed — they must be e.g. "Practice crane
   power problems (P = mgh / t)" or "Drill v-t graphs of vertical projectile
   motion". Strength-revisit activities may be slightly more general.
10. focus_topic on every day MUST be one of the SWOT topic+subtopic combinations
    (format: "<topic> — <subtopic>"), not a free-form heading.

OUTPUT JSON SCHEMA:
{
  "plan_summary": "2-sentence overview of the strategy",
  "weeks": [
    {
      "week_number": 1,
      "theme": "Attack Weaknesses",
      "weekly_goal": "Close the top 3 weakness gaps",
      "days": [
        {
          "day": 1,
          "date_offset": 1,
          "focus_topic": "Chapter — Subtopic",
          "subject": "biology|chemistry|physics",
          "swot_category": "weakness|opportunity|threat|strength",
          "tasks": [
            { "time_minutes": 45,
              "activity": "Practice crane power problems (P = mgh / t)",
              "resource": "NCERT Phy 11 Ch 6 + 20 PYQs",
              "goal": "Lock the P = mgh / t shortcut" }
          ],
          "total_hours": 5.5,
          "motivation": "One short motivational line specific to today"
        }
      ]
    }
  ],
  "mock_test_days": [14, 30],
  "daily_avg_hours": 5.5
}

Generate ${Math.min(30, args.daysRemaining)} days organized into weeks of 7
(last week may be shorter).
Respond with ONLY the JSON object — no preamble, no markdown fence.`;
}

export function generateDailyQuizPrompt(args: {
  topic: string;
  subtopic: string;
  subject: Subject;
  weakness_insight?: string;
}): string {
  return `Generate 5 MCQ questions for today's NEET-UG revision focus.

TODAY'S TOPIC: ${args.topic}
SUBTOPIC: ${args.subtopic}
SUBJECT: ${args.subject}
STUDENT WEAKNESS NOTES: ${args.weakness_insight ?? "General revision"}

Rules:
- Questions must be NEET-UG style (single correct MCQ, 4 options)
- Mix of concept, application, and assertion-reason
- Difficulty: medium (not boring, not demotivating)
- Include one common misconception trap

OUTPUT JSON SCHEMA:
{
  "questions": [
    {
      "q_no": 1,
      "question": "Question text",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct": "A|B|C|D",
      "explanation": "2-3 sentence explanation, NCERT-referenced"
    }
  ]
}

Respond with ONLY the JSON object.`;
}

export function generateMotivationalQuotePrompt(args: { dayNumber: number; name: string }): string {
  return `One powerful, original motivational line for a NEET aspirant named ${args.name} on Day ${args.dayNumber} of their preparation. Max 20 words. Plain text, no quotes, no markdown.`;
}
