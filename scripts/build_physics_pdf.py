#!/usr/bin/env python3
"""Render docs/physics-categorization.md to a presentable A4 PDF."""
from __future__ import annotations

from pathlib import Path

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

OUT = Path("docs/NEET2026-Physics-Categorization.pdf")


def make_styles():
    base = getSampleStyleSheet()
    styles = {
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            spaceAfter=4,
            textColor=INK,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            spaceBefore=14,
            spaceAfter=6,
            textColor=BRAND,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            spaceBefore=8,
            spaceAfter=4,
            textColor=INK,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=4,
        ),
        "muted": ParagraphStyle(
            "muted",
            parent=base["BodyText"],
            fontName="Helvetica-Oblique",
            fontSize=8.5,
            leading=12,
            textColor=MUTED,
            alignment=TA_LEFT,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=INK,
            alignment=TA_LEFT,
        ),
        "th": ParagraphStyle(
            "th",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=HexColor("#ffffff"),
            alignment=TA_LEFT,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=INK,
            leftIndent=14,
            bulletIndent=2,
            spaceAfter=2,
        ),
    }
    return styles


def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(15 * mm, 10 * mm, "NEET-UG 2026 \u2014 Physics Categorization")
    canvas.drawRightString(w - 15 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


# ----- Data ---------------------------------------------------------------

DISTRIBUTION = [
    ("1", "Physics and Measurement", 2, "Q8, Q35"),
    ("2", "Kinematics", 2, "Q1, Q29"),
    ("3", "Laws of Motion", 2, "Q5, Q7"),
    ("4", "Work, Energy and Power", 1, "Q3"),
    ("5", "Rotational Motion", 2, "Q27, Q30"),
    ("6", "Gravitation", 1, "Q18"),
    ("7", "Properties of Solids and Liquids", 2, "Q10, Q45"),
    ("8", "Thermodynamics", 1, "Q11"),
    ("9", "Kinetic Theory of Gases", 1, "Q23"),
    ("10", "Oscillations and Waves", 4, "Q6, Q25, Q33, Q38"),
    ("11", "Electrostatics", 3, "Q20, Q37, Q41"),
    ("12", "Current Electricity", 4, "Q22, Q28, Q39, Q43"),
    ("13", "Magnetic Effects of Current and Magnetism", 3, "Q12, Q16, Q31"),
    ("14", "Electromagnetic Induction and Alternating Currents", 3, "Q19, Q26, Q40"),
    ("15", "Electromagnetic Waves", 1, "Q42"),
    ("16", "Optics", 4, "Q13, Q15, Q21, Q36"),
    ("17", "Dual Nature of Matter and Radiation", 2, "Q2, Q4"),
    ("18", "Atoms and Nuclei", 3, "Q17, Q32, Q44"),
    ("19", "Electronic Devices", 3, "Q9, Q14, Q24"),
    ("20", "Experimental Skills", 1, "Q34"),
]

ROWS = [
    (1, "D", "2 — Kinematics",
     "Position/velocity-time graphs; uniformly accelerated motion under gravity",
     "Identify correct v-t plot for a ball thrown vertically up and returning — velocity is +ve, drops to 0 at apex, then becomes −ve."),
    (2, "D", "17 — Dual Nature of Matter & Radiation",
     "Photoelectric effect; threshold wavelength",
     "Condition for photoelectric emission: photon energy hc/λ ≥ φ, i.e. λ ≤ hc/φ."),
    (3, "C", "4 — Work, Energy and Power",
     "Power; work against gravity",
     "Crane lifts 1000 kg by 20 m in 10 s; P = mgh / t."),
    (4, "D", "17 — Dual Nature of Matter & Radiation",
     "Energy of photon (E=hν), de Broglie wavelength (λ=h/p), wave/particle nature",
     "List I (E=hν, Interference, λ=h/p, Compton) matched to List II (energy of photon, particle nature, de Broglie wavelength, wave nature)."),
    (5, "B", "3 — Laws of Motion",
     "Newton's 2nd law; resultant of perpendicular forces",
     "Two perpendicular forces (8 N, 6 N) on 5 kg body → resultant 10 N → a = 2 m/s²."),
    (6, "B", "10 — Oscillations and Waves",
     "Energy in SHM; simple pendulum",
     "Pendulum total energy 0.02 J → speed at mean position from KE = ½mv²."),
    (7, "A", "3 — Laws of Motion",
     "Static friction; equilibrium on an accelerating surface",
     "Max trolley acceleration so box remains stationary → a_max = μ_s · g."),
    (8, "C", "1 — Physics and Measurement",
     "System of units; unit conversion",
     "Sun-Earth distance with c = 1 (new unit system); distance = c × t = 400 light-seconds = 400 new-units."),
    (9, "B", "19 — Electronic Devices",
     "Semiconductor diode — half-wave rectification",
     "Voltage across a single diode in series with R fed by AC source — clipped sine (negative half blocked)."),
    (10, "A", "7 — Properties of Solids and Liquids",
     "Pressure due to a fluid column; Pascal's law",
     "Max depth before submarine hits 100 atm absolute: P_abs = P_atm + ρgh."),
    (11, "D", "8 — Thermodynamics",
     "First law of thermodynamics",
     "dU/dt = dQ/dt − dW/dt — rate of change of internal energy from heat in and work done."),
    (12, "C", "13 — Magnetic Effects of Current and Magnetism",
     "Biot-Savart law — circular coil",
     "B at centre of circular coil with N turns: B = μ₀NI / (2r) → solve for I."),
    (13, "C", "16 — Optics",
     "Wave optics — Young's double-slit (intensity, phase)",
     "I = I_max cos²(φ/2); phase difference from given path difference."),
    (14, "C", "19 — Electronic Devices",
     "Ideal diode circuit analysis",
     "Multi-branch circuit with ideal diodes; identify forward-biased branches and apply KVL/KCL for net current I."),
    (15, "B", "16 — Optics",
     "Refraction through thin lenses — concave (diverging) lens ray rules",
     "Ray-tracing rules for a concave lens (parallel ray diverges; ray through optical centre is undeviated)."),
    (16, "D", "13 — Magnetic Effects of Current and Magnetism",
     "Moving coil galvanometer → ammeter (shunt)",
     "Shunt S = I_g G / (I − I_g) for G=100 Ω, I_g=1 mA, I=10 A."),
    (17, "B", "18 — Atoms and Nuclei",
     "Bohr model — orbit radius, energy levels",
     "First excited state (n=2) of H; r_n = n²a₀ → r_2 = 4a₀."),
    (18, "D", "6 — Gravitation",
     "Gravitational PE; work done against gravity",
     "Work to move mass between two radial distances from Earth's centre: W = ΔU = −GMm(1/r₂ − 1/r₁)."),
    (19, "B", "14 — Electromagnetic Induction and Alternating Currents",
     "LCR series circuit — resonance",
     "f₀ = 1 / (2π√(LC)) (independent of R)."),
    (20, "D", "11 — Electrostatics",
     "Capacitors — charge sharing & energy loss",
     "Charged capacitor (200 pF at 100 V) connected to identical uncharged one → energy lost = ½ × initial energy."),
    (21, "B", "16 — Optics",
     "Refraction through a prism — Snell's law",
     "Equilateral prism, ray QR parallel to base → r = 30°; angle of deviation from i = 50°."),
    (22, "B", "12 — Current Electricity",
     "Metre/Wheatstone bridge — balance condition",
     "Effect of interchanging galvanometer and cell positions on detected balance point."),
    (23, "B", "9 — Kinetic Theory of Gases",
     "RMS speed; degrees of freedom / molar mass",
     "v_rms ∝ 1/√M; ratio for Argon (40) vs Chlorine (71)."),
    (24, "A", "19 — Electronic Devices",
     "p-n junction diode — forward bias / I-V characteristics",
     "Statements on threshold/knee voltage and exponential current rise in forward bias."),
    (25, "A", "10 — Oscillations and Waves",
     "Travelling wave — phase difference vs path difference",
     "y = 2.0 cos 2π(10t − 0.0080x + 0.35); ΔΦ = 2π × 0.0080 × Δx."),
    (26, "A", "14 — Electromagnetic Induction and Alternating Currents",
     "Faraday's / motional emf",
     "emf = Blv with B=0.3 T, l=3 cm, v=2 cm/s → 1.8 × 10⁻⁴ V."),
    (27, "D", "5 — Rotational Motion",
     "Moment of inertia; parallel axis theorem",
     "Ring about a tangent in its plane: I = ½mR² + mR² = (3/2)mR² with R from wire length L = 2πR."),
    (28, "A", "12 — Current Electricity",
     "EMF, internal resistance, terminal voltage",
     "V_T = E − Ir for E=12 V, r=2 Ω, I=0.6 A."),
    (29, "C", "2 — Kinematics",
     "Uniformly accelerated motion under gravity (reaction-time experiment)",
     "Ruler falls from rest: d = ½gt² — distance proportional to t²."),
    (30, "B", "5 — Rotational Motion",
     "Equations of rotational motion (angular kinematics)",
     "Flywheel angular speed 600→1200 rpm; revolutions from θ = ω_avg × t (or ω² = ω₀² + 2αθ)."),
    (31, "A", "13 — Magnetic Effects of Current and Magnetism",
     "Ampère's law — long straight current-carrying wire",
     "B(r) for solid wire of radius a: B ∝ r for r ≤ a, B ∝ 1/r for r ≥ a."),
    (32, "B", "18 — Atoms and Nuclei",
     "Size of nucleus; mass number relations",
     "R ∝ A^(1/3) ⇒ V ∝ A; identify true statements about nuclear volume and density."),
    (33, "B", "10 — Oscillations and Waves",
     "Simple pendulum — time period",
     "T = 2 s from 30 oscillations in 60 s; L = gT²/(4π²)."),
    (34, "B", "20 — Experimental Skills",
     "Vernier calipers — least count",
     "20 VSD = 16 MSD, 1 MSD = 1 mm → LC = 1 MSD − 1 VSD = 0.2 mm."),
    (35, "B", "1 — Physics and Measurement",
     "Significant figures; error propagation",
     "Density of cube from mass (4 sig fig) and side (2 sig fig); answer limited to 2 sig fig."),
    (36, "C", "16 — Optics",
     "Wave optics — interference & diffraction (conceptual)",
     "Evaluate statements: energy redistribution (true), property of all waves (true/false)."),
    (37, "D", "11 — Electrostatics",
     "Capacitors in series/parallel; charge on each capacitor",
     "Four 10 μF in series, parallel with 2.5 μF → equivalent C and individual charges."),
    (38, "B", "10 — Oscillations and Waves",
     "Energy in SHM — KE vs time graph",
     "KE non-negative, oscillates at 2× pendulum frequency, max at mean position, zero at extremes."),
    (39, "D", "12 — Current Electricity",
     "Electric power (heating effect)",
     "Heater rated 400 W at 220 V; new P at reduced V keeping R constant."),
    (40, "B", "14 — Electromagnetic Induction and Alternating Currents",
     "Alternating current — instantaneous value, peak time",
     "I(t) = I_p sin(ωt); reach peak when ωt = π/2 → t = T/4 = 1/(4f)."),
    (41, "A", "11 — Electrostatics",
     "Conductors in electrostatic equilibrium; surface field",
     "Truth of statements: field inside conductor is 0 (true); surface E depends on σ (true)."),
    (42, "C", "15 — Electromagnetic Waves",
     "EM spectrum — production methods",
     "Match microwave→klystron/magnetron, visible→atomic transitions, gamma→nuclear decay, IR→thermal radiation."),
    (43, "D", "12 — Current Electricity",
     "Kirchhoff's laws; balanced bridge",
     "Square loop made from 4 Ω wire (each side 1 Ω) with 2 Ω across diagonal, 2 V battery — solve for I."),
    (44, "A", "18 — Atoms and Nuclei",
     "Nuclear density; R = R₀A^(1/3)",
     "Find mass number A from given nuclear density and R₀ = 1.2 × 10⁻¹⁵ m."),
    (45, "A", "7 — Properties of Solids and Liquids",
     "Elastic moduli — Young's modulus, compressibility, Poisson's ratio",
     "Match physical property to defining formula (Y = FL/AΔL, β = −(1/V)(ΔV/ΔP), etc.)."),
]

CLASS_SPLIT = [
    "<b>Class XI</b> topics (Units 1–10): ~18 questions",
    "<b>Class XII</b> topics (Units 11–19): ~25 questions",
]

NOTES = [
    ("Q14 (diode circuit)",
     "Placed under Unit 19 (Electronic Devices) because the explanation hinges on identifying which diodes are forward-biased; KVL/KCL is mechanical and secondary. Cross-list: Unit 12."),
    ("Q22 (metre bridge)",
     "Kept under Unit 12 (Current Electricity) since the syllabus places the metre bridge there explicitly. Q43 also fits here (balanced bridge with Kirchhoff)."),
    ("Q29 (reaction-time / ruler fall)",
     "Categorized as Unit 2 (Kinematics) — the experimental dressing is incidental; underlying physics is d = ½gt². Could also be filed under Unit 20."),
    ("Q33 (simple pendulum T)",
     "Primary unit is Unit 10 — Oscillations & Waves (T = 2π√(L/g)). The framing is experimental (30 oscillations in 60 s), so it also touches Unit 20."),
    ("Q34 (vernier least count)",
     "Pure experimental skill → Unit 20; also implicitly Unit 1 (measurement)."),
    ("Q35 (density with sig figs)",
     "Primarily about significant figures and error propagation → Unit 1."),
    ("Q4 (E=hν, λ=h/p, Compton, interference)",
     "Bridges Units 16 and 17. Placed under Unit 17 because three of four sub-items are about photons / matter waves; interference appears only as a misdirection in this matching question."),
    ("Q45 (elastic moduli matching)",
     "Placed under Unit 7 (Properties of Solids and Liquids) since Young's modulus, bulk modulus and compressibility live there."),
]


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title="NEET-UG 2026 — Physics Categorization",
        author="NEETSurge",
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        id="normal",
    )
    doc.addPageTemplates(
        PageTemplate(id="main", frames=[frame], onPage=header_footer)
    )

    s = make_styles()
    story = []

    story.append(Paragraph("NEET-UG 2026 — Physics Categorization", s["h1"]))
    story.append(
        Paragraph(
            "Each of the 45 Physics questions in the NEET-UG 2026 paper, mapped to its "
            "corresponding Unit / Subtopic in the official NEET-UG 2026 syllabus.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>Sources:</b> NEET-UG 2026 syllabus (NMC notification, "
            "Notice_20260108180635.pdf, Physics — 20 units) · Question paper + answer key + "
            "line-by-line explanations (questions on pp. 2–86, explanations on pp. 87–277).",
            s["muted"],
        )
    )
    story.append(Spacer(1, 6 * mm))

    # Distribution table
    story.append(Paragraph("Distribution across the 20 syllabus units", s["h2"]))
    dist_data = [
        [
            Paragraph("Unit", s["th"]),
            Paragraph("Syllabus Unit", s["th"]),
            Paragraph("Q&nbsp;count", s["th"]),
            Paragraph("Question Numbers", s["th"]),
        ]
    ]
    for u, name, count, qs in DISTRIBUTION:
        dist_data.append(
            [
                Paragraph(u, s["small"]),
                Paragraph(name, s["small"]),
                Paragraph(str(count), s["small"]),
                Paragraph(qs, s["small"]),
            ]
        )
    dist_data.append(
        [
            Paragraph("<b>Total</b>", s["small"]),
            Paragraph("", s["small"]),
            Paragraph("<b>45</b>", s["small"]),
            Paragraph("", s["small"]),
        ]
    )
    t = Table(
        dist_data,
        colWidths=[15 * mm, 95 * mm, 18 * mm, 52 * mm],
        repeatRows=1,
    )
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND),
                ("ROWBACKGROUNDS", (0, 1), (-1, -2), [None, ROW_ALT]),
                ("BACKGROUND", (0, -1), (-1, -1), HexColor("#eef2ff")),
                ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(t)

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Class-level split (NCERT)", s["h3"]))
    story.append(
        Paragraph(
            "Approximate, based on the dominant NCERT chapter:",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "•&nbsp;&nbsp;<b>Class XI</b> topics (Units 1–10): ~18 questions",
            s["bullet"],
        )
    )
    story.append(
        Paragraph(
            "•&nbsp;&nbsp;<b>Class XII</b> topics (Units 11–19): ~25 questions",
            s["bullet"],
        )
    )

    story.append(PageBreak())

    # Per-question table
    story.append(Paragraph("Per-question categorization", s["h2"]))
    rows_data = [
        [
            Paragraph("Q#", s["th"]),
            Paragraph("Ans", s["th"]),
            Paragraph("Syllabus Unit", s["th"]),
            Paragraph("Subtopic", s["th"]),
            Paragraph("What the question tests (from the PDF explanation)", s["th"]),
        ]
    ]
    for q, ans, unit, sub, test in ROWS:
        rows_data.append(
            [
                Paragraph(f"<b>{q}</b>", s["small"]),
                Paragraph(f"<b>{ans}</b>", s["small"]),
                Paragraph(unit, s["small"]),
                Paragraph(sub, s["small"]),
                Paragraph(test, s["small"]),
            ]
        )
    rt = Table(
        rows_data,
        colWidths=[10 * mm, 12 * mm, 40 * mm, 50 * mm, 68 * mm],
        repeatRows=1,
    )
    rt.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [None, ROW_ALT]),
                ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(rt)

    story.append(PageBreak())

    # Notes
    story.append(Paragraph("Notes on borderline / cross-listed items", s["h2"]))
    story.append(
        Paragraph(
            "A few questions sit at the boundary of two syllabus units. "
            "These are the choices made and why:",
            s["body"],
        )
    )
    for label, body in NOTES:
        story.append(Paragraph(f"<b>{label}</b>", s["h3"]))
        story.append(Paragraph(body, s["body"]))

    doc.build(story)
    print(f"Wrote {OUT}  ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    build()
