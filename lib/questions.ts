import type { ClientQuestion, Question, Subject } from "@/types";
import { ANSWER_KEY } from "./answer-key";

/**
 * 180-question scaffold for NEET-UG 2026 reconstruction.
 *
 * The exam structure follows the standard NEET pattern:
 *   - Physics:    Q1   - Q45   (45 questions)
 *   - Chemistry:  Q46  - Q90   (45 questions)
 *   - Biology:    Q91  - Q180  (90 questions, Botany + Zoology combined)
 *
 * `correct_option` is seeded as 'A' placeholder. Run
 *   `npx ts-node scripts/load-answer-key.ts answer-key.csv`
 * to overwrite from the official NTA key.
 *
 * `image_url` points to /public/questions/q{n}.jpg. Drop the cropped question
 * images there with no code change required.
 */

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

const OPTIONS: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];

function buildSubjectQuestions(
  subject: Subject,
  startQ: number,
  chapters: ChapterSpec[],
): Question[] {
  const expected = chapters.reduce((sum, c) => sum + c.count, 0);
  const questions: Question[] = [];
  let q = startQ;
  let i = 0;

  for (const chap of chapters) {
    for (let j = 0; j < chap.count; j++) {
      const subtopic = chap.subtopics[j % chap.subtopics.length];
      const difficulty =
        i % 5 === 0 ? "hard" : i % 3 === 0 ? "easy" : "medium";
      questions.push({
        q_no: q,
        subject,
        chapter: chap.chapter,
        subtopic,
        correct_option: ANSWER_KEY[String(q)] ?? OPTIONS[i % 4],
        ncert_class: chap.ncert_class,
        difficulty,
        image_url: `/questions/q${q}.jpg`,
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

export const QUESTIONS: Question[] = [
  ...buildSubjectQuestions("physics", 1, PHYSICS_CHAPTERS),
  ...buildSubjectQuestions("chemistry", 46, CHEMISTRY_CHAPTERS),
  ...buildSubjectQuestions("biology", 91, BIOLOGY_CHAPTERS),
];

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
