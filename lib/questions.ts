import type {
  ClientQuestion,
  Difficulty,
  Option,
  Question,
  QuestionOptions,
  Subject,
} from "@/types";
import { ANSWER_KEY } from "./answer-key";
import neetBank from "@/neet_data/all_questions.json";

/**
 * NEET UG 2026 question text and options come from `neet_data/all_questions.json`.
 * Chapter / subtopic labels keep the NCERT-style scaffold for SWOT scoring.
 * Official keys: `npx tsx scripts/load-answer-key.ts answer-key.csv` → `lib/answer-key.json`.
 * Diagram pages (when flagged in the bank) are served from `/neet-diagrams/q{n}.png`.
 */

interface NeetBankRow {
  id: number;
  subject: string;
  stem: string;
  options?: { a?: string; b?: string; c?: string; d?: string };
  needs_diagram_asset?: boolean;
}

interface QuestionMeta {
  q_no: number;
  subject: Subject;
  chapter: string;
  subtopic: string;
  correct_option: Option;
  ncert_class: 11 | 12;
  difficulty: Difficulty;
}

const OPTIONS: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];

interface ChapterSpec {
  chapter: string;
  ncert_class: 11 | 12;
  subtopics: string[];
  count: number;
}

const PHYSICS_CHAPTERS: ChapterSpec[] = [
  {
    chapter: "Mechanics",
    ncert_class: 11,
    subtopics: [
      "Kinematics 1D",
      "Kinematics 2D — Projectile",
      "Newton's Laws of Motion",
      "Friction",
      "Work, Energy & Power",
      "Circular Motion",
      "Centre of Mass & Collisions",
      "Rotational Motion",
      "Gravitation",
    ],
    count: 10,
  },
  {
    chapter: "Properties of Matter & Thermodynamics",
    ncert_class: 11,
    subtopics: [
      "Elasticity",
      "Fluid Mechanics",
      "Surface Tension & Viscosity",
      "Thermal Expansion & Calorimetry",
      "Laws of Thermodynamics",
      "Kinetic Theory of Gases",
    ],
    count: 5,
  },
  {
    chapter: "Oscillations & Waves",
    ncert_class: 11,
    subtopics: ["SHM", "Wave Motion", "Sound Waves & Doppler", "Superposition & Beats"],
    count: 4,
  },
  {
    chapter: "Electrostatics & Current Electricity",
    ncert_class: 12,
    subtopics: [
      "Coulomb's Law & Electric Field",
      "Gauss's Law",
      "Electric Potential",
      "Capacitance",
      "Ohm's Law & Resistivity",
      "Kirchhoff's Laws",
      "Wheatstone & Potentiometer",
    ],
    count: 8,
  },
  {
    chapter: "Magnetism & EMI",
    ncert_class: 12,
    subtopics: [
      "Magnetic Field of Currents",
      "Force on Moving Charge",
      "Magnetism & Matter",
      "Electromagnetic Induction",
      "Alternating Current",
    ],
    count: 6,
  },
  {
    chapter: "Optics",
    ncert_class: 12,
    subtopics: [
      "Ray Optics — Reflection",
      "Ray Optics — Refraction",
      "Lenses & Optical Instruments",
      "Wave Optics — Interference",
      "Wave Optics — Diffraction & Polarization",
    ],
    count: 6,
  },
  {
    chapter: "Modern Physics",
    ncert_class: 12,
    subtopics: [
      "Dual Nature of Matter",
      "Atomic Models & Hydrogen Spectrum",
      "Nuclei & Radioactivity",
      "Semiconductor Electronics",
      "Communication Systems",
      "EM Waves",
    ],
    count: 6,
  },
];

const CHEMISTRY_CHAPTERS: ChapterSpec[] = [
  {
    chapter: "Physical Chemistry — Some Basic Concepts",
    ncert_class: 11,
    subtopics: ["Mole Concept", "Stoichiometry", "Concentration Terms"],
    count: 3,
  },
  {
    chapter: "Atomic Structure",
    ncert_class: 11,
    subtopics: ["Quantum Numbers", "Bohr Model", "Electronic Configuration"],
    count: 2,
  },
  {
    chapter: "Chemical Bonding",
    ncert_class: 11,
    subtopics: ["VSEPR", "Hybridization", "MOT", "Hydrogen Bonding"],
    count: 3,
  },
  {
    chapter: "Thermodynamics & Equilibrium",
    ncert_class: 11,
    subtopics: [
      "First Law",
      "Enthalpy & Entropy",
      "Chemical Equilibrium",
      "Ionic Equilibrium & pH",
    ],
    count: 4,
  },
  {
    chapter: "Solutions & Colligative Properties",
    ncert_class: 12,
    subtopics: ["Raoult's Law", "Colligative Properties", "Vant Hoff Factor"],
    count: 2,
  },
  {
    chapter: "Electrochemistry & Chemical Kinetics",
    ncert_class: 12,
    subtopics: [
      "Galvanic & Electrolytic Cells",
      "Nernst Equation",
      "Order of Reaction",
      "Arrhenius Equation",
    ],
    count: 4,
  },
  {
    chapter: "Inorganic — p-Block",
    ncert_class: 12,
    subtopics: [
      "Group 13 — Boron Family",
      "Group 14 — Carbon Family",
      "Group 15 — Nitrogen Family",
      "Group 16 — Oxygen Family",
      "Group 17 — Halogens",
      "Group 18 — Noble Gases",
    ],
    count: 5,
  },
  {
    chapter: "Inorganic — d & f Block",
    ncert_class: 12,
    subtopics: [
      "Transition Elements",
      "Lanthanides & Actinides",
      "Coordination Compounds — Werner",
      "Coordination Compounds — Isomerism",
    ],
    count: 4,
  },
  {
    chapter: "Organic — GOC & Hydrocarbons",
    ncert_class: 11,
    subtopics: ["IUPAC Nomenclature", "Isomerism", "Reaction Mechanisms", "Alkanes/Alkenes/Alkynes"],
    count: 4,
  },
  {
    chapter: "Organic — Functional Groups",
    ncert_class: 12,
    subtopics: [
      "Haloalkanes & Haloarenes",
      "Alcohols, Phenols, Ethers",
      "Aldehydes & Ketones",
      "Carboxylic Acids",
      "Amines & Diazonium Salts",
    ],
    count: 8,
  },
  {
    chapter: "Biomolecules & Polymers",
    ncert_class: 12,
    subtopics: ["Carbohydrates", "Proteins & Amino Acids", "Nucleic Acids", "Polymers"],
    count: 4,
  },
  {
    chapter: "Environmental & Practical Chemistry",
    ncert_class: 11,
    subtopics: ["Qualitative Analysis", "Environmental Chemistry"],
    count: 2,
  },
];

const BIOLOGY_CHAPTERS: ChapterSpec[] = [
  {
    chapter: "Diversity of Living World",
    ncert_class: 11,
    subtopics: ["Taxonomy & Classification", "Five Kingdom", "Plant Kingdom", "Animal Kingdom"],
    count: 7,
  },
  {
    chapter: "Structural Organisation",
    ncert_class: 11,
    subtopics: ["Plant Anatomy", "Animal Tissues", "Morphology of Flowering Plants"],
    count: 5,
  },
  {
    chapter: "Cell Biology",
    ncert_class: 11,
    subtopics: [
      "Cell — The Unit of Life",
      "Biomolecules",
      "Cell Cycle & Cell Division",
    ],
    count: 7,
  },
  {
    chapter: "Plant Physiology",
    ncert_class: 11,
    subtopics: [
      "Transport in Plants",
      "Mineral Nutrition",
      "Photosynthesis",
      "Respiration in Plants",
      "Plant Growth & Development",
    ],
    count: 8,
  },
  {
    chapter: "Human Physiology",
    ncert_class: 11,
    subtopics: [
      "Digestion & Absorption",
      "Breathing & Exchange of Gases",
      "Body Fluids & Circulation",
      "Excretory Products",
      "Locomotion & Movement",
      "Neural Control & Coordination",
      "Chemical Coordination — Endocrine",
    ],
    count: 14,
  },
  {
    chapter: "Reproduction",
    ncert_class: 12,
    subtopics: [
      "Reproduction in Organisms",
      "Sexual Reproduction in Flowering Plants",
      "Human Reproduction",
      "Reproductive Health",
    ],
    count: 8,
  },
  {
    chapter: "Genetics & Evolution",
    ncert_class: 12,
    subtopics: [
      "Mendelian Genetics",
      "Linkage & Crossing Over",
      "Sex Determination & Pedigree",
      "Molecular Basis of Inheritance — DNA",
      "Molecular Basis of Inheritance — Replication & Translation",
      "Evolution",
    ],
    count: 14,
  },
  {
    chapter: "Biology in Human Welfare",
    ncert_class: 12,
    subtopics: [
      "Human Health & Disease",
      "Strategies for Enhancement in Food Production",
      "Microbes in Human Welfare",
    ],
    count: 6,
  },
  {
    chapter: "Biotechnology",
    ncert_class: 12,
    subtopics: [
      "Biotechnology — Principles & Processes",
      "Biotechnology — Applications",
    ],
    count: 7,
  },
  {
    chapter: "Ecology",
    ncert_class: 12,
    subtopics: [
      "Organisms & Populations",
      "Ecosystem",
      "Biodiversity & Conservation",
      "Environmental Issues",
    ],
    count: 14,
  },
];

function buildSubjectQuestions(
  subject: Subject,
  startQ: number,
  chapters: ChapterSpec[],
): QuestionMeta[] {
  const expected = chapters.reduce((sum, c) => sum + c.count, 0);
  const questions: QuestionMeta[] = [];
  let q = startQ;
  let i = 0;

  for (const chap of chapters) {
    for (let j = 0; j < chap.count; j++) {
      const subtopic = chap.subtopics[j % chap.subtopics.length];
      const difficulty: Difficulty =
        i % 5 === 0 ? "hard" : i % 3 === 0 ? "easy" : "medium";
      questions.push({
        q_no: q,
        subject,
        chapter: chap.chapter,
        subtopic,
        correct_option: ANSWER_KEY[String(q)] ?? OPTIONS[i % 4],
        ncert_class: chap.ncert_class,
        difficulty,
      });
      q++;
      i++;
    }
  }

  if (questions.length !== expected) {
    throw new Error(
      `Subject ${subject}: expected ${expected} questions, got ${questions.length}`,
    );
  }
  return questions;
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

const LEGACY_META: QuestionMeta[] = [
  ...buildSubjectQuestions("physics", 1, PHYSICS_CHAPTERS),
  ...buildSubjectQuestions("chemistry", 46, CHEMISTRY_CHAPTERS),
  ...buildSubjectQuestions("biology", 91, BIOLOGY_CHAPTERS),
];

const LEGACY_BY_NO: Record<number, QuestionMeta> = Object.fromEntries(
  LEGACY_META.map((m) => [m.q_no, m]),
);

export const QUESTIONS: Question[] = [...(neetBank as NeetBankRow[])]
  .sort((a, b) => a.id - b.id)
  .map((row) => {
  const L = LEGACY_BY_NO[row.id];
  if (!L) {
    throw new Error(`NEET bank has Q${row.id} but legacy scaffold does not`);
  }
  const subject = row.subject as Subject;
  if (subject !== L.subject) {
    throw new Error(`Subject mismatch for Q${row.id}: bank ${subject} vs scaffold ${L.subject}`);
  }
  return {
    q_no: row.id,
    subject,
    chapter: L.chapter,
    subtopic: L.subtopic,
    correct_option: (ANSWER_KEY[String(row.id)] ?? L.correct_option) as Option,
    ncert_class: L.ncert_class,
    difficulty: L.difficulty,
    stem: row.stem,
    options: mapNeetOptions(row.options),
    image_url: `/questions/q${row.id}.png?v=3`,
  };
});

if (QUESTIONS.length !== 180) {
  throw new Error(`Expected 180 questions, got ${QUESTIONS.length}`);
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
 * Sanitized question list for the client — never expose correct_option.
 */
export function getClientQuestions(): ClientQuestion[] {
  return QUESTIONS.map(({ correct_option: _correct, ...rest }) => rest);
}

export function getQuestion(qNo: number): Question | undefined {
  return QUESTIONS_BY_NO[qNo];
}
