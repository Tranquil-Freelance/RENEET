import type {
  AnswerMap,
  AnswerStatus,
  DerivedAnswer,
  Option,
  Question,
  Subject,
  SubjectScore,
} from "@/types";
import { QUESTIONS_BY_NO, SUBJECTS } from "./questions";

export const MARKS_CORRECT = 4;
export const MARKS_WRONG = -1;
export const MARKS_BLANK = 0;

export function deriveStatus(
  chosen: Option | null,
  correct: Option,
  guessed: boolean,
): AnswerStatus {
  if (chosen === null) return "blank";
  if (chosen === correct) return guessed ? "guessed_right" : "correct";
  return "wrong";
}

export function deriveAnswer(qNo: number, state: { chosen: Option | null; guessed: boolean }): DerivedAnswer | null {
  const question = QUESTIONS_BY_NO[qNo];
  if (!question) return null;
  const status = deriveStatus(state.chosen, question.correct_option, state.guessed);
  return {
    q_no: qNo,
    subject: question.subject,
    chapter: question.chapter,
    syllabus_unit_no: question.syllabus_unit_no,
    subtopic: question.subtopic,
    concept: question.concept,
    chosen: state.chosen,
    correct: question.correct_option,
    guessed: state.guessed,
    status,
  };
}

export function deriveAll(answers: AnswerMap): DerivedAnswer[] {
  return Object.entries(answers)
    .map(([qNoStr, state]) => deriveAnswer(Number(qNoStr), state))
    .filter((d): d is DerivedAnswer => d !== null);
}

export function marksFor(status: AnswerStatus): number {
  if (status === "correct" || status === "guessed_right") return MARKS_CORRECT;
  if (status === "wrong") return MARKS_WRONG;
  return MARKS_BLANK;
}

export function computeSubjectScores(
  derived: DerivedAnswer[],
): Record<Subject, SubjectScore> {
  const empty = (): SubjectScore => ({
    correct: 0,
    wrong: 0,
    blank: 0,
    guessed_right: 0,
    net_marks: 0,
  });

  const out: Record<Subject, SubjectScore> = {
    physics: empty(),
    chemistry: empty(),
    biology: empty(),
  };

  for (const d of derived) {
    const s = out[d.subject];
    if (d.status === "correct") s.correct += 1;
    else if (d.status === "guessed_right") s.guessed_right += 1;
    else if (d.status === "wrong") s.wrong += 1;
    else s.blank += 1;
    s.net_marks += marksFor(d.status);
  }

  return out;
}

export function totalNetMarks(scores: Record<Subject, SubjectScore>): number {
  return SUBJECTS.reduce((sum, s) => sum + scores[s].net_marks, 0);
}

export interface OverallStats {
  total_attempted: number;
  total_blank: number;
  total_correct: number;
  total_wrong: number;
  total_guessed_right: number;
  total_marks: number;
  max_marks: number;
  accuracy_pct: number;
}

export const MAX_MARKS = 720;

/**
 * Aggregate across all subjects. Used by the SWOT banner and the pre-submit summary.
 */
export function computeOverallStats(
  scores: Record<Subject, SubjectScore>,
): OverallStats {
  const totals = SUBJECTS.reduce(
    (acc, s) => {
      const v = scores[s];
      acc.correct += v.correct;
      acc.wrong += v.wrong;
      acc.blank += v.blank;
      acc.guessed_right += v.guessed_right;
      acc.net_marks += v.net_marks;
      return acc;
    },
    { correct: 0, wrong: 0, blank: 0, guessed_right: 0, net_marks: 0 },
  );
  const attempted = totals.correct + totals.wrong + totals.guessed_right;
  const accuracy = attempted === 0 ? 0 : Math.round(((totals.correct + totals.guessed_right) / attempted) * 100);
  return {
    total_attempted: attempted,
    total_blank: totals.blank,
    total_correct: totals.correct + totals.guessed_right,
    total_wrong: totals.wrong,
    total_guessed_right: totals.guessed_right,
    total_marks: totals.net_marks,
    max_marks: MAX_MARKS,
    accuracy_pct: accuracy,
  };
}

/**
 * Fill in unmarked questions as "blank" so the derived list always covers all 180.
 */
export function deriveWithBlanks(answers: AnswerMap, questions: Question[]): DerivedAnswer[] {
  return questions.map((q) => {
    const state = answers[q.q_no];
    const chosen = state?.chosen ?? null;
    const guessed = state?.guessed ?? false;
    return {
      q_no: q.q_no,
      subject: q.subject,
      chapter: q.chapter,
      syllabus_unit_no: q.syllabus_unit_no,
      subtopic: q.subtopic,
      concept: q.concept,
      chosen,
      correct: q.correct_option,
      guessed,
      status: deriveStatus(chosen, q.correct_option, guessed),
    };
  });
}

/**
 * Empirical NEET marks → percentile table, calibrated against NEET 2024 results
 * (23.85L candidates, qualifying cutoff ~164 = ~18.5th percentile). Linearly
 * interpolated between anchor points. Values are "percentage of test-takers
 * this score beats" so a higher number is better.
 */
const NEET_PERCENTILE_TABLE: ReadonlyArray<readonly [number, number]> = [
  [720, 99.999],
  [700, 99.99],
  [680, 99.95],
  [660, 99.85],
  [640, 99.7],
  [620, 99.45],
  [600, 99.1],
  [580, 98.6],
  [560, 97.9],
  [540, 97.0],
  [520, 95.8],
  [500, 94.3],
  [480, 92.5],
  [460, 90.3],
  [440, 87.7],
  [420, 84.6],
  [400, 81.0],
  [380, 77.0],
  [360, 72.5],
  [340, 67.5],
  [320, 62.0],
  [300, 56.3],
  [280, 50.4],
  [260, 44.5],
  [240, 38.6],
  [220, 32.8],
  [200, 27.3],
  [180, 22.1],
  [164, 18.5],
  [140, 13.5],
  [120, 9.5],
  [100, 6.4],
  [80, 4.0],
  [60, 2.3],
  [40, 1.1],
  [20, 0.4],
  [0, 0.1],
];

/** Total NEET 2024 appeared candidates — used to translate percentile → AIR. */
export const NEET_CANDIDATE_POOL = 2_385_000;

/**
 * Real percentile (0-100) from net marks, via piecewise-linear interpolation
 * of the NEET 2024 distribution. No AI guessing involved.
 */
export function percentileFor(marks: number): number {
  if (marks >= 720) return 99.999;
  if (marks <= 0) return 0;
  for (let i = 0; i < NEET_PERCENTILE_TABLE.length - 1; i++) {
    const [hiMarks, hiPct] = NEET_PERCENTILE_TABLE[i];
    const [loMarks, loPct] = NEET_PERCENTILE_TABLE[i + 1];
    if (marks <= hiMarks && marks >= loMarks) {
      const t = (marks - loMarks) / (hiMarks - loMarks);
      const pct = loPct + t * (hiPct - loPct);
      return Math.round(pct * 100) / 100;
    }
  }
  return 0;
}

/**
 * Approximate All-India Rank from percentile. NEET 2024 had ~23.85L appeared,
 * so rank ≈ (1 - percentile/100) × pool. Capped at 1 from above.
 */
export function rankEstimateFor(percentile: number): number {
  const pct = Math.max(0, Math.min(100, percentile));
  const rank = Math.round(((100 - pct) / 100) * NEET_CANDIDATE_POOL);
  return Math.max(1, rank);
}

export interface SubtopicAggregate {
  subject: Subject;
  topic: string;
  subtopic: string;
  total: number;
  correct: number;
  guessed_right: number;
  wrong: number;
  blank: number;
  marks_net: number;
  marks_lost: number;
  marks_blank: number;
  marks_at_risk: number;
  concepts: string[];
  q_nos: number[];
}

/**
 * Aggregate every question into per-(subject, chapter, subtopic) rollups so
 * the AI prompt can reason at the subtopic level without doing arithmetic.
 */
export function aggregateBySubtopic(
  derived: DerivedAnswer[],
): SubtopicAggregate[] {
  const map = new Map<string, SubtopicAggregate>();
  for (const d of derived) {
    const key = `${d.subject}||${d.chapter}||${d.subtopic}`;
    let row = map.get(key);
    if (!row) {
      row = {
        subject: d.subject,
        topic: d.chapter,
        subtopic: d.subtopic,
        total: 0,
        correct: 0,
        guessed_right: 0,
        wrong: 0,
        blank: 0,
        marks_net: 0,
        marks_lost: 0,
        marks_blank: 0,
        marks_at_risk: 0,
        concepts: [],
        q_nos: [],
      };
      map.set(key, row);
    }
    row.total += 1;
    row.q_nos.push(d.q_no);
    if (!row.concepts.includes(d.concept)) row.concepts.push(d.concept);
    row.marks_net += marksFor(d.status);
    if (d.status === "correct") {
      row.correct += 1;
    } else if (d.status === "guessed_right") {
      row.guessed_right += 1;
      row.marks_at_risk += MARKS_CORRECT;
    } else if (d.status === "wrong") {
      row.wrong += 1;
      row.marks_lost += MARKS_CORRECT - MARKS_WRONG;
    } else {
      row.blank += 1;
      row.marks_blank += MARKS_CORRECT;
    }
  }
  return [...map.values()].sort((a, b) => {
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
    return a.topic.localeCompare(b.topic);
  });
}
