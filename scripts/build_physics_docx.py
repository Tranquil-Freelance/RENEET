#!/usr/bin/env python3
"""Render the Physics categorization Word document (Q1-Q45).

Reuses the data declared in `build_physics_pdf.py`.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _docx_render import render  # noqa: E402
from build_physics_pdf import (  # noqa: E402
    CLASS_SPLIT,
    DISTRIBUTION,
    NOTES,
    ROWS,
)

OUT = Path("docs/NEET2026-Physics-Categorization.docx")

if __name__ == "__main__":
    render(
        out_path=OUT,
        subject="Physics",
        q_range="Q1\u2013Q45",
        total_q=45,
        sources_blurb=(
            "NEET-UG 2026 syllabus (NMC notification, Notice_20260108180635.pdf, "
            "Physics \u2014 20 units) \u00b7 Question paper + answer key + line-by-line "
            "explanations (questions on pp. 2\u201386, explanations on pp. 87\u2013277)."
        ),
        distribution=DISTRIBUTION,
        class_split=CLASS_SPLIT,
        rows=ROWS,
        notes=NOTES,
    )
