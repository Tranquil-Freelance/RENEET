"""Shared rendering for NEET subject categorization PDFs."""
from __future__ import annotations

from pathlib import Path
from typing import Sequence

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

BRAND = HexColor("#0d6efd")
INK = HexColor("#1f2937")
MUTED = HexColor("#475569")
ROW_ALT = HexColor("#f8fafc")
BORDER = HexColor("#cbd5e1")


def _styles():
    base = getSampleStyleSheet()
    return {
        "h1": ParagraphStyle("h1", parent=base["Heading1"], fontName="Helvetica-Bold",
                              fontSize=20, leading=24, spaceAfter=4, textColor=INK),
        "h2": ParagraphStyle("h2", parent=base["Heading2"], fontName="Helvetica-Bold",
                              fontSize=14, leading=18, spaceBefore=14, spaceAfter=6,
                              textColor=BRAND),
        "h3": ParagraphStyle("h3", parent=base["Heading3"], fontName="Helvetica-Bold",
                              fontSize=11, leading=14, spaceBefore=8, spaceAfter=4,
                              textColor=INK),
        "body": ParagraphStyle("body", parent=base["BodyText"], fontName="Helvetica",
                                fontSize=9.5, leading=13, textColor=INK,
                                alignment=TA_LEFT, spaceAfter=4),
        "muted": ParagraphStyle("muted", parent=base["BodyText"],
                                 fontName="Helvetica-Oblique", fontSize=8.5,
                                 leading=12, textColor=MUTED, alignment=TA_LEFT),
        "small": ParagraphStyle("small", parent=base["BodyText"], fontName="Helvetica",
                                 fontSize=8.5, leading=11, textColor=INK,
                                 alignment=TA_LEFT),
        "th": ParagraphStyle("th", parent=base["BodyText"], fontName="Helvetica-Bold",
                              fontSize=9, leading=12, textColor=HexColor("#ffffff"),
                              alignment=TA_LEFT),
        "bullet": ParagraphStyle("bullet", parent=base["BodyText"], fontName="Helvetica",
                                  fontSize=9.5, leading=13, textColor=INK,
                                  leftIndent=14, bulletIndent=2, spaceAfter=2),
    }


def _header_footer(canvas, doc, footer_text):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(15 * mm, 10 * mm, footer_text)
    canvas.drawRightString(w - 15 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def render(
    *,
    out_path: Path,
    subject: str,
    q_range: str,
    total_q: int,
    sources_blurb: str,
    distribution: Sequence[tuple[str, str, int, str]],
    class_split: Sequence[str] | None,
    rows: Sequence[tuple[int, str, str, str, str]],
    notes: Sequence[tuple[str, str]],
    dist_col_widths_mm: tuple[float, float, float, float] = (15, 95, 18, 52),
    rows_col_widths_mm: tuple[float, float, float, float, float] = (10, 12, 40, 50, 68),
):
    """Build the PDF. ``distribution`` rows are (unit_num, unit_name, count, q_numbers)."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    title = f"NEET-UG 2026 \u2014 {subject} Categorization"
    doc = BaseDocTemplate(
        str(out_path),
        pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=15 * mm, bottomMargin=15 * mm,
        title=title,
        author="NEETSurge",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    footer_text = f"NEET-UG 2026 \u2014 {subject} Categorization"

    def on_page(canvas, document):
        _header_footer(canvas, document, footer_text)

    doc.addPageTemplates(PageTemplate(id="main", frames=[frame], onPage=on_page))

    s = _styles()
    story = []

    story.append(Paragraph(title, s["h1"]))
    story.append(
        Paragraph(
            f"Each of the {total_q} {subject} questions ({q_range}) in the "
            f"NEET-UG 2026 paper, mapped to its corresponding Unit / Subtopic "
            "in the official NEET-UG 2026 syllabus.",
            s["body"],
        )
    )
    story.append(Paragraph(f"<b>Sources:</b> {sources_blurb}", s["muted"]))
    story.append(Spacer(1, 6 * mm))

    # Distribution table
    story.append(
        Paragraph("Distribution across the syllabus units", s["h2"])
    )
    dist_data = [[
        Paragraph("Unit", s["th"]),
        Paragraph("Syllabus Unit", s["th"]),
        Paragraph("Q&nbsp;count", s["th"]),
        Paragraph("Question Numbers", s["th"]),
    ]]
    for unit, name, count, qs in distribution:
        dist_data.append([
            Paragraph(unit, s["small"]),
            Paragraph(name, s["small"]),
            Paragraph(str(count), s["small"]),
            Paragraph(qs, s["small"]),
        ])
    dist_data.append([
        Paragraph("<b>Total</b>", s["small"]),
        Paragraph("", s["small"]),
        Paragraph(f"<b>{total_q}</b>", s["small"]),
        Paragraph("", s["small"]),
    ])
    dist_tbl = Table(
        dist_data,
        colWidths=[w * mm for w in dist_col_widths_mm],
        repeatRows=1,
    )
    dist_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [None, ROW_ALT]),
        ("BACKGROUND", (0, -1), (-1, -1), HexColor("#eef2ff")),
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(dist_tbl)

    if class_split:
        story.append(Spacer(1, 4 * mm))
        story.append(Paragraph("Class-level split (NCERT)", s["h3"]))
        for line in class_split:
            story.append(Paragraph(f"\u2022&nbsp;&nbsp;{line}", s["bullet"]))

    story.append(PageBreak())

    # Per-question
    story.append(Paragraph("Per-question categorization", s["h2"]))
    rows_data = [[
        Paragraph("Q#", s["th"]),
        Paragraph("Ans", s["th"]),
        Paragraph("Syllabus Unit", s["th"]),
        Paragraph("Subtopic", s["th"]),
        Paragraph("What the question tests (from the PDF explanation)", s["th"]),
    ]]
    for q, ans, unit, sub, test in rows:
        rows_data.append([
            Paragraph(f"<b>{q}</b>", s["small"]),
            Paragraph(f"<b>{ans}</b>", s["small"]),
            Paragraph(unit, s["small"]),
            Paragraph(sub, s["small"]),
            Paragraph(test, s["small"]),
        ])
    rows_tbl = Table(
        rows_data,
        colWidths=[w * mm for w in rows_col_widths_mm],
        repeatRows=1,
    )
    rows_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [None, ROW_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(rows_tbl)

    if notes:
        story.append(PageBreak())
        story.append(Paragraph("Notes on borderline / cross-listed items", s["h2"]))
        story.append(
            Paragraph(
                "A few questions sit at the boundary of two syllabus units. "
                "These are the choices made and why:",
                s["body"],
            )
        )
        for label, body in notes:
            story.append(Paragraph(f"<b>{label}</b>", s["h3"]))
            story.append(Paragraph(body, s["body"]))

    doc.build(story)
    print(f"Wrote {out_path}  ({out_path.stat().st_size // 1024} KB)")
