#!/usr/bin/env python3
"""Parse NEET PDF text export into JSON + diagram page images."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

TEXT_FILE = Path(__file__).resolve().parents[1] / "neet_extracted.txt"
PDF_FILE = Path(__file__).resolve().parents[1] / "69f6ce9dc187bc3be1ddf35b_9f93adde1778142937838.pdf"
OUT_DIR = Path(__file__).resolve().parents[1] / "neet_data"
DIAGRAM_DIR = OUT_DIR / "diagram_snippets"

DIAGRAM_HINTS = re.compile(
    r"\b("
    r"figure|shown below|shown in the|as shown|graph|plots?|diagram|ray diagram|"
    r"image|pictorial|sketch|vernier|callipers?|calipers?|metre bridge|"
    r"equilateral prism|prism\s*\(ABC\)|galvanometer.*interchanged|"
    r"wire.*bent.*square|long straight solid wire|circular cross-section|"
    r"variation of.*with.*(is )?represented by|correctly represents the variation|"
    r"reaction sequence|following sequence|"
    r"circuit shown|the circuit shown|in the circuit shown"
    r")\b",
    re.I | re.S,
)


def load_question_body() -> str:
    raw = TEXT_FILE.read_text(encoding="utf-8", errors="replace")
    m1 = re.search(r"(?m)^\s*1\.\s+The following plots", raw)
    if not m1:
        raise SystemExit("Could not locate start of Q1")
    m2 = re.search(r"(?m)^\s*Answers\s*$", raw)
    if not m2:
        raise SystemExit("Could not locate Answers section")
    return raw[m1.start() : m2.start()]


def split_questions(body: str) -> dict[int, str]:
    parts = re.split(r"(?m)^\s*(\d{1,3})\.\s+", body)
    # parts[0] is preamble (empty or junk)
    out: dict[int, str] = {}
    i = 1
    while i + 1 < len(parts):
        num_s, chunk = parts[i], parts[i + 1]
        n = int(num_s)
        if 1 <= n <= 180:
            out[n] = chunk.strip()
        i += 2
    return out


def strip_marks(line: str) -> str:
    return re.sub(r"\s*\(\+4, -1\)\s*", " ", line).strip()


def parse_stem_options(chunk: str) -> tuple[str, dict[str, str]]:
    lines = [strip_marks(ln) for ln in chunk.splitlines()]
    lines = [ln for ln in lines if ln or ln == ""]  # keep structure
    # recompute without excessive blanks for markers
    raw_lines = chunk.splitlines()

    markers: list[tuple[int, str]] = []
    for idx, ln in enumerate(raw_lines):
        m = re.match(r"^(\s*)([a-d])\.\s*(.*)$", ln)
        if m:
            markers.append((idx, m.group(2)))

    opt_start_idx: int | None = None
    for j in range(len(markers) - 3):
        letters = [markers[j + k][1] for k in range(4)]
        if letters == ["a", "b", "c", "d"]:
            opt_start_idx = markers[j][0]

    if opt_start_idx is None:
        # fallback: any a. b. c. d. sequence
        for j in range(len(markers) - 3):
            letters = [markers[j + k][1] for k in range(4)]
            if set(letters) == {"a", "b", "c", "d"}:
                opt_start_idx = markers[j][0]
                break

    if opt_start_idx is None:
        return chunk.strip(), {}

    stem_lines = raw_lines[:opt_start_idx]
    stem = "\n".join(strip_marks(ln) for ln in stem_lines).strip()
    opt_lines = raw_lines[opt_start_idx:]

    opts: dict[str, list[str]] = {"a": [], "b": [], "c": [], "d": []}
    cur: str | None = None
    for ln in opt_lines:
        m = re.match(r"^(\s*)([a-d])\.\s*(.*)$", ln)
        if m:
            cur = m.group(2)
            opts[cur].append(m.group(3).strip())
        elif cur and ln.strip():
            opts[cur].append(ln.strip())
        elif cur and not ln.strip():
            opts[cur].append("")

    joined = {k: " ".join(v for v in vals if v).strip() for k, vals in opts.items()}
    return stem, joined


def subject_for(n: int) -> str:
    if n <= 45:
        return "physics"
    if n <= 90:
        return "chemistry"
    return "biology"


def page_text(p: int) -> str:
    r = subprocess.run(
        ["pdftotext", "-f", str(p), "-l", str(p), "-layout", str(PDF_FILE), "-"],
        capture_output=True,
        text=True,
    )
    return r.stdout


def build_question_first_page_map() -> dict[int, int]:
    first: dict[int, int] = {}
    for p in range(1, 278):
        t = page_text(p)
        for m in re.finditer(r"(?m)^\s*(\d{1,3})\.\s+", t):
            n = int(m.group(1))
            if 1 <= n <= 180 and n not in first:
                first[n] = p
    return first


def needs_diagram(stem: str, options: dict[str, str]) -> bool:
    if DIAGRAM_HINTS.search(stem):
        return True
    if options and all(len(options.get(k, "").strip()) < 2 for k in "abcd"):
        return True
    return False


def main() -> None:
    body = load_question_body()
    chunks = split_questions(body)
    if len(chunks) != 180:
        print("WARNING: expected 180 chunks, got", len(chunks), sorted(set(range(1, 181)) - set(chunks.keys())))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    DIAGRAM_DIR.mkdir(parents=True, exist_ok=True)

    q_page = build_question_first_page_map()

    all_rows: list[dict] = []
    diagram_q: list[int] = []

    for n in range(1, 181):
        chunk = chunks.get(n, "")
        stem, options = parse_stem_options(chunk)
        stem = f"{n}. {stem}" if stem else f"{n}."
        sub = subject_for(n)
        diagram = needs_diagram(stem, options)
        page = q_page.get(n)
        row = {
            "id": n,
            "subject": sub,
            "stem": stem,
            "options": options,
            "needs_diagram_asset": diagram,
            "pdf_page": page,
        }
        all_rows.append(row)
        if diagram:
            diagram_q.append(n)

    (OUT_DIR / "all_questions.json").write_text(
        json.dumps(all_rows, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    by_sub = {"physics": [], "chemistry": [], "biology": []}
    for row in all_rows:
        by_sub[row["subject"]].append(row)
    for k, v in by_sub.items():
        (OUT_DIR / f"{k}.json").write_text(json.dumps(v, ensure_ascii=False, indent=2), encoding="utf-8")

    manifest = {
        "source_pdf": str(PDF_FILE.name),
        "text_extract": str(TEXT_FILE.name),
        "counts": {s: len(by_sub[s]) for s in by_sub},
        "diagram_question_ids": diagram_q,
        "diagram_count": len(diagram_q),
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    # Export diagram pages as PNG (full page — crop later in UI if needed)
    try:
        from pdf2image import convert_from_path
    except ImportError:
        print("pdf2image not installed; skipping PNG export")
        return

    pages_to_export = sorted(
        {r["pdf_page"] for r in all_rows if r["needs_diagram_asset"] and r["pdf_page"]}
    )
    for p in pages_to_export:
        ims = convert_from_path(str(PDF_FILE), first_page=p, last_page=p, dpi=144)
        if ims:
            # name by page; multiple Q may share a page
            q_on_page = [r["id"] for r in all_rows if r["pdf_page"] == p and r["needs_diagram_asset"]]
            tag = "_".join(f"Q{q}" for q in q_on_page[:5])
            if len(q_on_page) > 5:
                tag += f"_plus{len(q_on_page) - 5}"
            fn = DIAGRAM_DIR / f"page_{p:03d}_{tag}.png"
            ims[0].save(fn, "PNG")
            print("wrote", fn)

    print("Done. Questions:", len(all_rows), "Diagram-flagged:", len(diagram_q))


if __name__ == "__main__":
    main()
