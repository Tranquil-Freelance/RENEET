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
  chapter: string;
  subtopic: string;
  correct_option: Option;
  ncert_class: 11 | 12;
  difficulty: Difficulty;
  /** Diagram from NEET paper (empty when the item is text-only). */
  image_url: string;
  stem: string;
  options: QuestionOptions;
}

export type ClientQuestion = Omit<Question, "correct_option">;

export interface AnswerState {
  chosen: Option | null;
  guessed: boolean;
}

export type AnswerMap = Record<number, AnswerState>;

export interface DerivedAnswer {
  q_no: number;
  subject: Subject;
  chapter: string;
  subtopic: string;
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

export interface SWOT {
  estimated_score: { min: number; max: number };
  estimated_percentile: string;
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
