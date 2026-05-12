#!/usr/bin/env python3
"""Render the Biology categorization Word document (Q91-Q180).

Reuses the data declared in `build_biology_pdf.py`.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _docx_render import render  # noqa: E402
from build_biology_pdf import (  # noqa: E402
    CLASS_SPLIT,
    DISTRIBUTION,
    NOTES,
    ROWS,
)

OUT = Path("docs/NEET2026-Biology-Categorization.docx")

if __name__ == "__main__":
    render(
        out_path=OUT,
        subject="Biology",
        q_range="Q91\u2013Q180",
        total_q=90,
        sources_blurb=(
            "NEET-UG 2026 syllabus (NMC notification, Notice_20260108180635.pdf, "
            "Biology \u2014 10 units) \u00b7 Question paper + answer key + line-by-line "
            "explanations (questions on pp. 2\u201386, explanations on pp. 87\u2013277)."
        ),
        distribution=DISTRIBUTION,
        class_split=CLASS_SPLIT,
        rows=ROWS,
        notes=NOTES,
    )
