export type Subject = "physics" | "chemistry" | "biology";
export type Option = "A" | "B" | "C" | "D";
export type Difficulty = "easy" | "medium" | "hard";
export type AnswerStatus = "correct" | "wrong" | "blank" | "guessed_right";
export type SwotCategory = "weakness" | "opportunity" | "threat" | "strength";

export interface QuestionOptions {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface Question {
  q_no: number;
  subject: Subject;
  /** Bare syllabus unit name from the official docx (e.g. "Kinematics"). */
  chapter: string;
  /** Official NCERT/NTA syllabus unit number (1-20 per subject). */
  syllabus_unit_no: number;
  /** Verbatim subtopic from the official categorization docx. */
  subtopic: string;
  /** Verbatim "What the question tests" text — the canonical concept phrasing. */
  concept: string;
  correct_option: Option;
  ncert_class: 11 | 12;
  difficulty: Difficulty;
  /** Diagram from NEET paper (empty when the item is text-only). */
  image_url: string;
  stem: string;
  options: QuestionOptions;
}

/**
 * Sanitized question shape for the exam UI. We strip:
 *   - `correct_option`  — answer key must never reach the browser
 *   - `concept`         — verbatim "what the question tests" text often
 *                         spoils the answer (e.g. "P = mgh / t")
 *   - `syllabus_unit_no`— internal grouping field; not needed in the UI
 */
export type ClientQuestion = Omit<Question, "correct_option" | "concept" | "syllabus_unit_no">;

export interface AnswerState {
  chosen: Option | null;
  guessed: boolean;
}

export type AnswerMap = Record<number, AnswerState>;

export interface DerivedAnswer {
  q_no: number;
  subject: Subject;
  chapter: string;
  syllabus_unit_no: number;
  subtopic: string;
  /** Canonical concept text from the official categorization docx. */
  concept: string;
  chosen: Option | null;
  correct: Option;
  guessed: boolean;
  status: AnswerStatus;
}

export interface SubjectScore {
  correct: number;
  wrong: number;
  blank: number;
  guessed_right: number;
  net_marks: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  state: string | null;
  attempt_no: number;
  target: string | null;
  created_at: string;
}

export interface SwotStrength {
  topic: string;
  subtopic: string;
  subject: Subject;
  score_pct: number;
  marks: number;
  insight: string;
}

export interface SwotWeakness {
  topic: string;
  subtopic: string;
  subject: Subject;
  marks_lost: number;
  questions_wrong: number;
  likely_gap: string;
  fix_priority: "high" | "medium" | "low";
  fix_time_hours: number;
}

export interface SwotOpportunity {
  topic: string;
  subtopic: string;
  subject: Subject;
  questions_blank: number;
  marks_recoverable: number;
  effort_hours: number;
  insight: string;
}

export interface SwotThreat {
  topic: string;
  subtopic: string;
  subject: Subject;
  questions_guessed_right: number;
  marks_at_risk: number;
  warning: string;
}

/**
 * SWOT payload returned to the client. Quantitative fields
 * (estimated_score / percentile / rank / subject_scores) are computed
 * server-side from the actual NEET +4/-1/0 scoring and a NEET-2024 marks
 * → percentile table — the AI never invents these numbers. The AI is only
 * responsible for the qualitative narrative (strengths / weaknesses /
 * opportunities / threats / headline_insight).
 */
export interface SWOT {
  /** Actual NEET-marked score: +4 correct, -1 wrong, 0 blank. Out of 720. */
  estimated_score: number;
  /** Percentile of test-takers we beat (0-100, two decimals). */
  estimated_percentile: number;
  /** Approximate All-India Rank, derived from percentile × ~23.85L candidates. */
  estimated_rank: number;
  subject_scores: Record<Subject, SubjectScore>;
  strengths: SwotStrength[];
  weaknesses: SwotWeakness[];
  opportunities: SwotOpportunity[];
  threats: SwotThreat[];
  headline_insight: string;
}

export interface PlanTask {
  time_minutes: number;
  activity: string;
  resource: string;
  goal: string;
}

export interface PlanDay {
  day: number;
  date_offset: number;
  focus_topic: string;
  subject: Subject;
  swot_category: SwotCategory;
  tasks: PlanTask[];
  total_hours: number;
  motivation: string;
}

export interface PlanWeek {
  week_number: number;
  theme: string;
  weekly_goal: string;
  days: PlanDay[];
}

export interface StudyPlan {
  plan_summary: string;
  weeks: PlanWeek[];
  mock_test_days: number[];
  daily_avg_hours: number;
}

export interface CheckInQuestion {
  q_no: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: Option;
  explanation: string;
}

export interface CheckInQuiz {
  questions: CheckInQuestion[];
}
