import type {
  ClientQuestion,
  Difficulty,
  Option,
  Question,
  QuestionOptions,
  Subject,
} from "@/types";
import neetBank from "@/neet_data/all_questions.json";
import categorization from "./categorization.json";

/**
 * NEET UG 2026 question bank.
 *
 * Source of truth:
 *   stem + options                                          → neet_data/all_questions.json (PDF-extracted)
 *   chapter (bare unit name) + syllabus_unit_no + subtopic
 *   + concept + correct answer + ncert_class                → lib/categorization.json
 *                                                              (built by scripts/parse_categorization.py
 *                                                               from the three NEET2026-*-Categorization.docx files)
 *   image_url                                               → /public/questions/q{N}.png
 */

interface NeetBankRow {
  id: number;
  subject: string;
  stem: string;
  options?: { a?: string; b?: string; c?: string; d?: string };
  needs_diagram_asset?: boolean;
}

interface CatRow {
  q_no: number;
  subject: Subject;
  answer: string;
  syllabus_unit_no: number;
  syllabus_unit: string;
  subtopic: string;
  concept: string;
  ncert_class: 11 | 12;
}

interface CategorizationFile {
  questions: Record<string, CatRow>;
  unit_totals: Record<Subject, { unit_no: number; name: string; q_count: number; q_nos: number[] }[]>;
  class_boundaries: Record<Subject, Record<string, number[]>>;
  answer_mismatches?: { q_no: number; docx: string; legacy_key: string }[];
}

const CAT = categorization as unknown as CategorizationFile;

function difficultyFor(qNo: number): Difficulty {
  if (qNo % 5 === 0) return "hard";
  if (qNo % 3 === 0) return "easy";
  return "medium";
}

function mapNeetOptions(raw: NeetBankRow["options"]): QuestionOptions {
  const o = raw ?? {};
  return {
    A: (o.a ?? "").trim(),
    B: (o.b ?? "").trim(),
    C: (o.c ?? "").trim(),
    D: (o.d ?? "").trim(),
  };
}

function assertOption(value: string, qNo: number): Option {
  const upper = value.trim().toUpperCase();
  if (upper === "A" || upper === "B" || upper === "C" || upper === "D") return upper;
  throw new Error(`Q${qNo}: invalid answer '${value}' in categorization.json`);
}

export const QUESTIONS: Question[] = [...(neetBank as NeetBankRow[])]
  .sort((a, b) => a.id - b.id)
  .map((row) => {
    const subject = row.subject as Subject;
    const tag = CAT.questions[String(row.id)];
    if (!tag) {
      throw new Error(`Q${row.id}: missing from lib/categorization.json — re-run scripts/parse_categorization.py`);
    }
    return {
      q_no: row.id,
      subject,
      chapter: tag.syllabus_unit,
      syllabus_unit_no: tag.syllabus_unit_no,
      subtopic: tag.subtopic,
      concept: tag.concept,
      correct_option: assertOption(tag.answer, row.id),
      ncert_class: tag.ncert_class,
      difficulty: difficultyFor(row.id),
      stem: row.stem,
      options: mapNeetOptions(row.options),
      image_url: `/questions/q${row.id}.png?v=3`,
    };
  });

if (QUESTIONS.length !== 180) {
  throw new Error(`Expected 180 questions, got ${QUESTIONS.length}`);
}

const missingCat = Array.from({ length: 180 }, (_, i) => i + 1).filter(
  (q) => !CAT.questions[String(q)],
);
if (missingCat.length > 0) {
  throw new Error(
    `categorization.json is missing ${missingCat.length} question(s): ${missingCat.slice(0, 10).join(", ")}${missingCat.length > 10 ? "…" : ""}`,
  );
}

export const QUESTIONS_BY_NO: Record<number, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.q_no, q]),
);

export const SUBJECTS: Subject[] = ["physics", "chemistry", "biology"];

export const SUBJECT_RANGES: Record<Subject, { start: number; end: number; count: number }> = {
  physics: { start: 1, end: 45, count: 45 },
  chemistry: { start: 46, end: 90, count: 45 },
  biology: { start: 91, end: 180, count: 90 },
};

export const CHAPTERS_BY_SUBJECT: Record<Subject, string[]> = SUBJECTS.reduce(
  (acc, s) => {
    acc[s] = Array.from(new Set(QUESTIONS.filter((q) => q.subject === s).map((q) => q.chapter)));
    return acc;
  },
  {} as Record<Subject, string[]>,
);

export const SUBTOPICS_BY_CHAPTER: Record<string, string[]> = QUESTIONS.reduce(
  (acc, q) => {
    if (!acc[q.chapter]) acc[q.chapter] = [];
    if (!acc[q.chapter].includes(q.subtopic)) acc[q.chapter].push(q.subtopic);
    return acc;
  },
  {} as Record<string, string[]>,
);

/**
 * Per-subject unit distribution from the official docx Table 0. Useful for
 * SWOT prompts that need reliable "X of Y" denominators.
 */
export const UNIT_TOTALS = CAT.unit_totals;

/**
 * Sanitized question list for the client — never expose correct_option,
 * the docx concept text (often quotes the answer formula), or the internal
 * syllabus_unit_no ordering field.
 */
export function getClientQuestions(): ClientQuestion[] {
  return QUESTIONS.map(
    ({ correct_option: _correct, concept: _concept, syllabus_unit_no: _u, ...rest }) => rest,
  );
}

export function getQuestion(qNo: number): Question | undefined {
  return QUESTIONS_BY_NO[qNo];
}
