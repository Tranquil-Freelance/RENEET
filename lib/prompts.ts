import type { DerivedAnswer, Subject, SubjectScore, SWOT } from "@/types";

interface UserProfile {
  name: string;
  state?: string | null;
  attempt_no?: number;
  target?: string | null;
}

export function generateSWOTPrompt(args: {
  user: UserProfile;
  derived: DerivedAnswer[];
  subject_scores: Record<Subject, SubjectScore>;
}): string {
  // Strip null chosen to keep payload tight. Server-derived status is the source of truth.
  const compactDerived = args.derived.map((d) => ({
    q: d.q_no,
    s: d.subject,
    ch: d.chapter,
    st: d.subtopic,
    status: d.status,
    chose: d.chosen,
    correct: d.correct,
    guessed: d.guessed,
  }));

  return `You are an expert NEET-UG exam analyst and educational counselor.

A student has just given the NEET-UG 2026 exam and provided their response for each
of the 180 questions. The exam has been cancelled and will be re-conducted in approximately
4-6 weeks. Your job is to analyze their performance and generate a precise SWOT analysis
at the SUBTOPIC level - not just subject level.

STUDENT PROFILE:
- Name: ${args.user.name}
- State: ${args.user.state ?? "N/A"}
- Attempt Number: ${args.user.attempt_no ?? 1}
- Target: ${args.user.target ?? "Any Medical College"}

EXAM RESPONSES (one row per question, status already derived from the official answer key):
${JSON.stringify(compactDerived)}

SERVER-COMPUTED SUBJECT SCORES (use these as ground truth, do not recompute):
${JSON.stringify(args.subject_scores)}

SCORING RULES (NEET-UG):
- Correct: +4 marks
- Wrong: -1 mark
- Blank: 0 marks
- Guessed Correct: +4 marks (but FLAG as a threat - they don't actually know this)

TASK: Generate a SWOT analysis in the following JSON format. Be specific. Use NCERT chapter
names. Rank weaknesses by marks_lost descending and opportunities by marks_recoverable
descending. The student needs actionable intelligence, not general advice.

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
    { "topic": "Chapter", "subtopic": "Subtopic", "subject": "biology|chemistry|physics",
      "score_pct": 85, "marks": 20, "insight": "One sentence on what they know well" }
  ],
  "weaknesses": [
    { "topic": "Chapter", "subtopic": "Subtopic", "subject": "biology|chemistry|physics",
      "marks_lost": 12, "questions_wrong": 3,
      "likely_gap": "One sentence on the conceptual gap causing this",
      "fix_priority": "high|medium|low", "fix_time_hours": 4 }
  ],
  "opportunities": [
    { "topic": "Chapter", "subtopic": "Subtopic", "subject": "biology|chemistry|physics",
      "questions_blank": 3, "marks_recoverable": 12, "effort_hours": 2,
      "insight": "Why this blank is low-effort high-reward" }
  ],
  "threats": [
    { "topic": "Chapter", "subtopic": "Subtopic", "subject": "biology|chemistry|physics",
      "questions_guessed_right": 2, "marks_at_risk": 8,
      "warning": "What could go wrong if they don't revisit this" }
  ],
  "headline_insight": "2-3 sentence summary directed at the student personally"
}

Respond with ONLY the JSON object - no preamble, no markdown fence.`;
}

export function generatePlanPrompt(args: {
  user: UserProfile;
  swot: SWOT;
  daysRemaining: number;
}): string {
  return `You are an expert NEET-UG preparation strategist and personal tutor.

A student has received their SWOT analysis. Now generate a day-by-day study plan that is
laser-focused on closing their specific gaps - not a generic syllabus review.

STUDENT PROFILE:
- Name: ${args.user.name}
- Target: ${args.user.target ?? "Any Medical College"}
- Attempt: ${args.user.attempt_no ?? 1}

DAYS UNTIL RE-EXAM: ${args.daysRemaining}

SWOT ANALYSIS:
${JSON.stringify(args.swot)}

PLANNING RULES:
1. Prioritize WEAKNESSES first (week 1-2): these cost real marks
2. Convert OPPORTUNITIES next (week 2-3): blanks = free marks with minimal effort
3. Address THREATS in week 3: guessed-right topics need PYQ practice
4. Revisit STRENGTHS daily (10-15 min, rotating): must not let these slip
5. Include 2 full mock tests: one mid-plan, one near the end
6. Each day: max 6-7 hours of study (realistic, not punishing)
7. Sundays are lighter: revision + 1 mock subject section only
8. Use real NCERT chapter/section references in every task

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
          "focus_topic": "Chapter - Subtopic",
          "subject": "biology|chemistry|physics",
          "swot_category": "weakness|opportunity|threat|strength",
          "tasks": [
            { "time_minutes": 45, "activity": "Read NCERT...", "resource": "NCERT Bio 12 Ch 5",
              "goal": "Understand X" }
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

Generate ${Math.min(30, args.daysRemaining)} days organized into weeks of 7 (last week may be shorter).
Respond with ONLY the JSON object - no preamble, no markdown fence.`;
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
