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
    subtopic: question.subtopic,
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
      subtopic: q.subtopic,
      chosen,
      correct: q.correct_option,
      guessed,
      status: deriveStatus(chosen, q.correct_option, guessed),
    };
  });
}
