#!/usr/bin/env python3
"""Crop each NEET question (stem + options as printed in the PDF) into one PNG.

Each output file lives at `public/questions/q{N}.png` (1 ≤ N ≤ 180).

Strategy:
- Walk every page of the PDF, collect "events" — each question-number heading
  (e.g. "12.") and each section heading ("Physics", "Chemistry", "Biology",
  "Answers") — along with their (page, y) position.
- Sort events in reading order. A question's region spans from its own start
  to the next event (next question or section header). This automatically
  excludes Chemistry/Biology section headers from the preceding question's crop.
- When a region spans multiple PDF pages (e.g. the question continues across a
  diagram-only page or onto the next page's options), we render each page
  slice and stitch them vertically into a single PNG.
"""
from __future__ import annotations

import re
from pathlib import Path

import fitz
from PIL import Image

PDF = Path("/Users/shreyasmohan/RENEET/69f6ce9dc187bc3be1ddf35b_9f93adde1778142937838.pdf")
OUT_DIR = Path("/Users/shreyasmohan/RENEET/public/questions")

DPI = 150
ZOOM = DPI / 72.0          # PDF user-space points → pixels
CONTENT_TOP_PT = 65.0      # below page-template header (logo at y≈21–43)
CONTENT_BOT_PT = 755.0     # above recurring "Prepp" ad banner (y≈760–821)

SECTION_NAMES = {"Physics", "Chemistry", "Biology", "Answers"}


def find_section_bounds(doc: fitz.Document):
    """Return (start_page, answers_page) — only scan pages in [start, answers)."""
    start_page = None
    answers_page = None
    for p in range(doc.page_count):
        for block in doc[p].get_text("blocks"):
            txt = (block[4] or "").strip().splitlines()
            if not txt:
                continue
            first_line = txt[0].strip()
            if first_line == "Physics" and start_page is None:
                start_page = p
            if first_line == "Answers" and answers_page is None:
                answers_page = p
    if start_page is None:
        start_page = 2
    if answers_page is None:
        answers_page = doc.page_count
    return start_page, answers_page


def collect_events(doc: fitz.Document, start_page: int, answers_page: int):
    events = []
    for p in range(start_page, answers_page + 1):
        for block in doc[p].get_text("blocks"):
            x0, y0, x1, y1, txt, *_ = block
            txt = (txt or "").strip()
            if not txt:
                continue
            first_line = txt.splitlines()[0].strip()

            if p < answers_page:
                m = re.match(r"^(\d{1,3})\.(?:\s|$)", first_line)
                if m:
                    n = int(m.group(1))
                    if 1 <= n <= 180:
                        events.append(("q", p, y0, n))
                        continue

            if first_line in SECTION_NAMES:
                events.append(("sec", p, y0, first_line))
    events.sort(key=lambda e: (e[1], e[2]))
    return events


def first_question_starts(events):
    seen: dict[int, tuple[int, float]] = {}
    for kind, p, y, name in events:
        if kind == "q" and name not in seen:
            seen[name] = (p, y)
    return seen


def first_next_event_after(events, page: int, y: float):
    for kind, ep, ey, name in events:
        if (ep, ey) > (page, y):
            return (kind, ep, ey, name)
    return None


def render_page(doc, p, cache):
    if p in cache:
        return cache[p]
    pix = doc[p].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM), alpha=False)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    cache[p] = img
    return img


def crop_slice(doc, p, y_top_pt, y_bot_pt, cache):
    img = render_page(doc, p, cache)
    w, h = img.size
    yt = max(0, int(y_top_pt * ZOOM))
    yb = min(h, int(y_bot_pt * ZOOM))
    if yb <= yt:
        return None
    return img.crop((0, yt, w, yb))


def stitch(imgs):
    imgs = [im for im in imgs if im is not None]
    if not imgs:
        return None
    w = max(im.width for im in imgs)
    total_h = sum(im.height for im in imgs)
    canvas = Image.new("RGB", (w, total_h), "white")
    yo = 0
    for im in imgs:
        if im.width < w:
            pad = Image.new("RGB", (w, im.height), "white")
            pad.paste(im, (0, 0))
            im = pad
        canvas.paste(im, (0, yo))
        yo += im.height
    return canvas


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)
    start_page, answers_page = find_section_bounds(doc)
    print(f"Questions pages: fitz {start_page}..{answers_page - 1}; Answers starts at fitz {answers_page}")
    events = collect_events(doc, start_page, answers_page)
    starts = first_question_starts(events)

    missing = [n for n in range(1, 181) if n not in starts]
    if missing:
        print("Missing question starts:", missing)

    page_cache: dict[int, Image.Image] = {}
    fallback_end = (answers_page, CONTENT_TOP_PT)

    for n in range(1, 181):
        if n not in starts:
            continue
        sp, sy = starts[n]
        nxt = first_next_event_after(events, sp, sy)
        if nxt is None:
            ep, ey = fallback_end
        else:
            _, ep, ey, _ = nxt

        slices = []
        if ep == sp:
            slices.append(crop_slice(doc, sp, max(sy, CONTENT_TOP_PT), ey, page_cache))
        else:
            slices.append(crop_slice(doc, sp, max(sy, CONTENT_TOP_PT), CONTENT_BOT_PT, page_cache))
            for mid in range(sp + 1, ep):
                slices.append(crop_slice(doc, mid, CONTENT_TOP_PT, CONTENT_BOT_PT, page_cache))
            if ey > CONTENT_TOP_PT:
                slices.append(crop_slice(doc, ep, CONTENT_TOP_PT, ey, page_cache))

        out_img = stitch(slices)
        if out_img is None:
            print(f"q{n}: no image produced (skipping)")
            continue

        # Cap max dimension for sanity
        max_h = 2400
        if out_img.height > max_h:
            ratio = max_h / out_img.height
            out_img = out_img.resize(
                (int(out_img.width * ratio), max_h), Image.LANCZOS
            )

        target = OUT_DIR / f"q{n}.png"
        out_img.save(target, "PNG", optimize=True)
        if n % 20 == 0 or n in (1, 45, 46, 90, 91, 180):
            print(f"q{n}: pages {sp}->{ep} → {target.name} ({out_img.size})")

    print("Done. PNGs in:", OUT_DIR)


if __name__ == "__main__":
    main()
