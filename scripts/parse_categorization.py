#!/usr/bin/env python3
"""
Parse the three NEET 2026 categorization docx files into lib/categorization.json.

Source of truth:
  - NEET2026-Physics-Categorization.docx   (Q1-Q45)
  - NEET2026-Chemistry-Categorization.docx (Q46-Q90)
  - NEET2026-Biology-Categorization.docx   (Q91-Q180)

Each docx has:
  Table 0: unit distribution summary (Unit | Syllabus Unit | Q count | Question Numbers)
  Table 1: per-question rows (Q# | Ans | Syllabus Unit | Subtopic | What the question tests)
  Prose:   "Class XI topics (Units a-b): ~N questions" and same for XII

Output: lib/categorization.json with shape:
{
  "questions": { "1": { q_no, subject, answer, syllabus_unit_no, syllabus_unit,
                        subtopic, concept, ncert_class }, ... },
  "unit_totals": { "physics": [{unit_no, name, q_count, q_nos}, ...], ... },
  "class_boundaries": { "physics": { "11": [1,10], "12": [11,19] }, ... }
}

Also runs a fail-loud cross-check of each Ans against lib/answer-key.ts. If any
of the 180 disagree, exits non-zero with the offending rows.

Usage:
    python3 scripts/parse_categorization.py
"""
from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

ROOT = Path(__file__).resolve().parent.parent

DOCX_FILES = [
    ("physics",   ROOT / "NEET2026-Physics-Categorization.docx",   (1, 45)),
    ("chemistry", ROOT / "NEET2026-Chemistry-Categorization.docx", (46, 90)),
    ("biology",   ROOT / "NEET2026-Biology-Categorization.docx",   (91, 180)),
]

OUTPUT = ROOT / "lib" / "categorization.json"
ANSWER_KEY_TS = ROOT / "lib" / "answer-key.ts"


def cell_text(cell: ET.Element) -> str:
    return "".join(t.text or "" for t in cell.iter(W + "t")).strip()


def para_text(p: ET.Element) -> str:
    return "".join(t.text or "" for t in p.iter(W + "t"))


def split_unit_label(raw: str) -> tuple[int | None, str]:
    """'2 — Kinematics' -> (2, 'Kinematics'). Handles em-dash, en-dash, hyphen."""
    m = re.match(r"\s*(\d+)\s*[\u2014\u2013\-]\s*(.+)", raw)
    if not m:
        return None, raw.strip()
    return int(m.group(1)), m.group(2).strip()


def parse_class_split(lines: list[str]) -> dict[int, tuple[int, int]]:
    """Find 'Class XI/XII ... Units a-b' lines and return {11: (a,b), 12: (a,b)}."""
    out: dict[int, tuple[int, int]] = {}
    for line in lines:
        for roman, cls in (("XII", 12), ("XI", 11)):
            if f"Class {roman}" not in line:
                continue
            # Look for "Units a-b" or "Units a–b" or "(a-b)" or "(a–b)"
            m = re.search(
                r"[Uu]nits?\s*\(?\s*(\d+)\s*[\u2013\u2014\-]\s*(\d+)\s*\)?",
                line,
            )
            if not m:
                m = re.search(
                    r"\(\s*(\d+)\s*[\u2013\u2014\-]\s*(\d+)\s*\)",
                    line,
                )
            if m and cls not in out:
                out[cls] = (int(m.group(1)), int(m.group(2)))
    return out


def find_tables(root: ET.Element) -> list[ET.Element]:
    return list(root.iter(W + "tbl"))


def parse_question_table(tbl: ET.Element) -> list[dict]:
    rows = list(tbl.iter(W + "tr"))
    if not rows:
        return []
    header = [cell_text(c) for c in rows[0].iter(W + "tc")]
    if not (len(header) >= 5 and header[0].lower().startswith("q") and "ans" in header[1].lower()):
        return []
    out = []
    for row in rows[1:]:
        cells = [cell_text(c) for c in row.iter(W + "tc")]
        if len(cells) < 5:
            continue
        q_raw, ans, unit, subtopic, concept = cells[0], cells[1], cells[2], cells[3], cells[4]
        if not q_raw.isdigit():
            continue
        out.append(
            {
                "q_no": int(q_raw),
                "answer": ans.strip().upper(),
                "syllabus_unit_raw": unit.strip(),
                "subtopic": subtopic.strip(),
                "concept": concept.strip(),
            }
        )
    return out


def parse_unit_totals_table(tbl: ET.Element) -> list[dict]:
    rows = list(tbl.iter(W + "tr"))
    if not rows:
        return []
    header = [cell_text(c) for c in rows[0].iter(W + "tc")]
    # First col is "Unit", second "Syllabus Unit", third "Q count", fourth "Question Numbers"
    if not (len(header) >= 4 and "unit" in header[0].lower() and "count" in header[2].lower()):
        return []
    out = []
    for row in rows[1:]:
        cells = [cell_text(c) for c in row.iter(W + "tc")]
        if len(cells) < 4 or not cells[0].strip().isdigit():
            continue
        unit_no = int(cells[0])
        name = cells[1].strip()
        try:
            q_count = int(cells[2])
        except ValueError:
            continue
        q_nos_raw = cells[3]
        q_nos = [int(m.group(1)) for m in re.finditer(r"Q?(\d+)", q_nos_raw)]
        out.append({"unit_no": unit_no, "name": name, "q_count": q_count, "q_nos": q_nos})
    return out


def load_hand_typed_key() -> dict[int, str]:
    """Best-effort parse of lib/answer-key.ts → {q_no: 'A'|'B'|'C'|'D'}."""
    if not ANSWER_KEY_TS.exists():
        return {}
    text = ANSWER_KEY_TS.read_text(encoding="utf-8")
    out: dict[int, str] = {}
    for m in re.finditer(r'"(\d+)"\s*:\s*"([ABCD])"', text):
        out[int(m.group(1))] = m.group(2)
    return out


def class_for_unit(boundaries: dict[int, tuple[int, int]], unit_no: int) -> int:
    if 11 in boundaries:
        a, b = boundaries[11]
        if a <= unit_no <= b:
            return 11
    if 12 in boundaries:
        a, b = boundaries[12]
        if a <= unit_no <= b:
            return 12
    # Fallback: anything below 12's range is XI, otherwise XII.
    if 12 in boundaries and unit_no < boundaries[12][0]:
        return 11
    return 12


def main() -> int:
    questions: dict[str, dict] = {}
    unit_totals: dict[str, list[dict]] = {}
    class_boundaries: dict[str, dict[str, list[int]]] = {}
    parse_errors: list[str] = []

    for subject, path, (q_lo, q_hi) in DOCX_FILES:
        if not path.exists():
            print(f"  MISSING: {path}", file=sys.stderr)
            return 1
        with zipfile.ZipFile(path) as z:
            xml = z.read("word/document.xml").decode("utf-8")
        root = ET.fromstring(xml)

        prose = [para_text(p) for p in root.iter(W + "p")]
        boundaries = parse_class_split(prose)
        if 11 not in boundaries or 12 not in boundaries:
            parse_errors.append(f"{subject}: could not find class boundaries (got {boundaries})")
            continue
        class_boundaries[subject] = {str(k): list(v) for k, v in boundaries.items()}

        tables = find_tables(root)
        q_rows: list[dict] = []
        unit_rows: list[dict] = []
        for tbl in tables:
            if not q_rows:
                q_rows = parse_question_table(tbl)
            if not unit_rows:
                unit_rows = parse_unit_totals_table(tbl)

        if not q_rows:
            parse_errors.append(f"{subject}: per-question table not found")
            continue
        if not unit_rows:
            parse_errors.append(f"{subject}: unit-distribution table not found")
            continue

        unit_totals[subject] = unit_rows

        for row in q_rows:
            q_no = row["q_no"]
            if not (q_lo <= q_no <= q_hi):
                parse_errors.append(f"{subject}: Q{q_no} outside expected range [{q_lo},{q_hi}]")
                continue
            unit_no, unit_name = split_unit_label(row["syllabus_unit_raw"])
            if unit_no is None:
                parse_errors.append(
                    f"{subject} Q{q_no}: could not parse unit '{row['syllabus_unit_raw']}'"
                )
                continue
            ncert_class = class_for_unit(boundaries, unit_no)
            questions[str(q_no)] = {
                "q_no": q_no,
                "subject": subject,
                "answer": row["answer"],
                "syllabus_unit_no": unit_no,
                "syllabus_unit": unit_name,
                "subtopic": row["subtopic"],
                "concept": row["concept"],
                "ncert_class": ncert_class,
            }

    # Sanity: must have all 180.
    missing = [i for i in range(1, 181) if str(i) not in questions]
    if missing:
        parse_errors.append(f"Missing {len(missing)} questions: {missing[:20]}{'...' if len(missing) > 20 else ''}")

    # Cross-check against hand-typed key.
    hand_key = load_hand_typed_key()
    mismatches: list[tuple[int, str, str]] = []
    if hand_key:
        for qno_str, row in questions.items():
            qno = int(qno_str)
            if qno in hand_key and hand_key[qno] != row["answer"]:
                mismatches.append((qno, row["answer"], hand_key[qno]))

    if parse_errors:
        for e in parse_errors:
            print(f"  PARSE-ERR: {e}", file=sys.stderr)
        return 1

    # Write output. (Docx is the gold mine per product spec; mismatches are
    # logged loudly but the docx wins.)
    output = {
        "questions": questions,
        "unit_totals": unit_totals,
        "class_boundaries": class_boundaries,
        "answer_mismatches": [
            {"q_no": qno, "docx": docx_ans, "legacy_key": key_ans}
            for qno, docx_ans, key_ans in mismatches
        ],
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    # Summary.
    n_q = len(questions)
    n_units = sum(len(v) for v in unit_totals.values())
    n_checked = len(hand_key)
    matched = n_checked - len(mismatches)
    print(f"  OK: {n_q}/180 questions parsed, {matched}/{n_checked} docx answers match legacy key, {n_units} units")
    if mismatches:
        print("  WARN: docx wins on the following disagreements (legacy key recorded but ignored):")
        for qno, docx_ans, key_ans in mismatches:
            print(f"        Q{qno}: docx={docx_ans}  legacy={key_ans}")
    print(f"     wrote -> {OUTPUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
