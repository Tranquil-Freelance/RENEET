#!/usr/bin/env python3
"""Rebuild problem-question snippets as stem + 2x2 grid of options.

For questions where the default whole-region crop ends up cropped or
poorly proportioned (image-option questions, multi-page questions, big
stem diagrams), we render the stem and each option separately and
compose them into a single neat PNG sized for the exam-card viewport.

Outputs overwrite `public/questions/q{N}.png` for the listed question
numbers.
"""
from __future__ import annotations

import re
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont

PDF = Path("/Users/shreyasmohan/RENEET/69f6ce9dc187bc3be1ddf35b_9f93adde1778142937838.pdf")
OUT_DIR = Path("/Users/shreyasmohan/RENEET/public/questions")

DPI = 150
ZOOM = DPI / 72.0
PAGE_W_PT = 595.92
CONTENT_TOP_PT = 60.0
CONTENT_BOT_PT = 755.0  # above the recurring "Prepp" banner

TARGETS = [1, 9, 14, 21, 22, 27, 31, 37, 38, 43, 45, 60, 65, 66, 88]

# Layout constants (in pixels)
CANVAS_W = 1240
PAD = 16
GAP = 10
STEM_MAX_H = 820
CELL_H_DEFAULT = 200
CELL_H_TEXT_ONLY = 110


def font_for(size: int) -> ImageFont.FreeTypeFont:
    """Pick a system bold font; fall back to default if not found."""
    for path in (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def build_question_index(doc: fitz.Document):
    starts: dict[int, tuple[int, float]] = {}
    raw_events: list[tuple[int, float, int]] = []
    for p in range(2, 87):
        for b in doc[p].get_text("blocks"):
            x0, y0, x1, y1, txt, *_ = b
            first = (txt or "").strip().splitlines()
            first = first[0].strip() if first else ""
            m = re.match(r"^(\d{1,3})\.(?:\s|$)", first)
            if m:
                n = int(m.group(1))
                if 1 <= n <= 180:
                    raw_events.append((p, y0, n))
    raw_events.sort()
    for p, y, n in raw_events:
        if n not in starts:
            starts[n] = (p, y)

    def next_q(n: int) -> tuple[int, float]:
        for p, y, k in raw_events:
            if k == n + 1:
                return (p, y)
        return (87, CONTENT_TOP_PT)

    def option_markers(n: int) -> dict[str, tuple[int, float, float]]:
        sp, sy = starts[n]
        ep, ey = next_q(n)
        out: dict[str, tuple[int, float, float]] = {}
        for p in range(sp, ep + 1):
            for b in doc[p].get_text("blocks"):
                x0, y0, x1, y1, txt, *_ = b
                t = (txt or "").strip()
                if not t:
                    continue
                for line in t.splitlines():
                    ls = line.strip()
                    m = re.match(r"^([a-d])\.(?:\s|$)", ls)
                    if not m:
                        continue
                    opt = m.group(1)
                    top = sy if p == sp else CONTENT_TOP_PT
                    bot = ey if p == ep else 9999
                    if top <= y0 < bot and opt not in out:
                        out[opt] = (p, y0, x0)
                        break
        return out

    return starts, next_q, option_markers


page_cache: dict[int, Image.Image] = {}


def render_page(doc: fitz.Document, p: int) -> Image.Image:
    if p in page_cache:
        return page_cache[p]
    pix = doc[p].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM), alpha=False)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    page_cache[p] = img
    return img


def crop_band(
    doc: fitz.Document,
    p_top: int,
    y_top_pt: float,
    p_bot: int,
    y_bot_pt: float,
) -> Image.Image | None:
    """Crop a band that may span multiple pages, stitching vertically."""
    slices: list[Image.Image] = []

    def slice_one(p: int, yt: float, yb: float) -> Image.Image | None:
        if yb <= yt:
            return None
        img = render_page(doc, p)
        w, h = img.size
        return img.crop(
            (0, max(0, int(yt * ZOOM)), w, min(h, int(yb * ZOOM)))
        )

    if p_top == p_bot:
        s = slice_one(p_top, y_top_pt, y_bot_pt)
        if s:
            slices.append(s)
    else:
        slices.append(slice_one(p_top, y_top_pt, CONTENT_BOT_PT))
        for mid in range(p_top + 1, p_bot):
            slices.append(slice_one(mid, CONTENT_TOP_PT, CONTENT_BOT_PT))
        if y_bot_pt > CONTENT_TOP_PT:
            slices.append(slice_one(p_bot, CONTENT_TOP_PT, y_bot_pt))

    slices = [s for s in slices if s is not None]
    if not slices:
        return None
    w = max(s.width for s in slices)
    h = sum(s.height for s in slices)
    canvas = Image.new("RGB", (w, h), "white")
    yo = 0
    for s in slices:
        if s.width < w:
            pad = Image.new("RGB", (w, s.height), "white")
            pad.paste(s, (0, 0))
            s = pad
        canvas.paste(s, (0, yo))
        yo += s.height
    return canvas


def trim_whitespace_borders(img: Image.Image, threshold: int = 248) -> Image.Image:
    """Trim near-white top/bottom borders."""
    gray = img.convert("L")
    px = gray.load()
    w, h = img.size

    def row_is_blank(y: int) -> bool:
        return all(px[x, y] >= threshold for x in range(0, w, max(1, w // 200)))

    top = 0
    while top < h - 1 and row_is_blank(top):
        top += 1
    bot = h - 1
    while bot > top + 1 and row_is_blank(bot):
        bot -= 1
    if top == 0 and bot == h - 1:
        return img
    return img.crop((0, top, w, bot + 1))


def pair_option_images(
    doc: fitz.Document,
    om: dict[str, tuple[int, float, float]],
    starts: dict[int, tuple[int, float]],
    n: int,
    next_q_pos: tuple[int, float],
) -> dict[str, tuple[int, tuple[float, float, float, float]]]:
    """Greedy per-page pairing of option markers with images.

    On each page, we list option markers (sorted by y) and candidate images
    (sorted by y0, excluding header/footer and likely stem images), then
    pair them in order. Works for both image-above-marker and image-below
    -marker layouts (e.g. Q31's option d has its image below the letter).
    Options with no available image on their page are left unpaired (the
    caller will fall back to a text-style band crop).
    """
    sp, sy = starts[n]
    next_p, next_y = next_q_pos

    # Determine y range of stem on the start page (above option a)
    a_p, a_y, _ = om["a"]

    # Collect candidate option-images globally, in reading order
    img_list: list[tuple[int, tuple[float, float, float, float]]] = []
    for p in sorted({mp for mp, _, _ in om.values()} | {a_p}):
        for im in doc[p].get_image_info(xrefs=True):
            bbox = im.get("bbox")
            if not bbox:
                continue
            bx0, by0, bx1, by1 = bbox
            # Skip page-template header logo and footer banner
            if by0 < 50 and bx0 < 30:
                continue
            if by0 > 750:
                continue
            # Skip images above option a (stem diagrams)
            if p == a_p and by1 < a_y + 6:
                continue
            if p < a_p:
                continue
            # Skip images that belong to a later question
            if p > next_p:
                continue
            if p == next_p and by0 >= next_y - 2:
                continue
            img_list.append((p, bbox))
    img_list.sort(key=lambda t: (t[0], t[1][1]))

    # Collect markers in reading order
    marker_list = sorted(
        [(om[o][0], om[o][1], o) for o in "abcd"],
        key=lambda t: (t[0], t[1]),
    )

    pairs: dict[str, tuple[int, tuple[float, float, float, float]]] = {}
    used = [False] * len(img_list)
    # Strategy: per marker, pick the closest unused image vertically
    # (preferring same page, then nearest in reading order).
    for mp, my, opt in marker_list:
        best_idx = -1
        best_score = float("inf")
        for i, (ip, ibbox) in enumerate(img_list):
            if used[i]:
                continue
            ix0, iy0, ix1, iy1 = ibbox
            # Page penalty: huge if different page
            page_pen = 0 if ip == mp else 1000
            # Vertical distance from marker to image center
            icenter = (iy0 + iy1) / 2
            dist = abs(my - icenter)
            score = page_pen + dist
            if score < best_score:
                best_score = score
                best_idx = i
        if best_idx >= 0:
            used[best_idx] = True
            pairs[opt] = (img_list[best_idx][0], img_list[best_idx][1])

    return pairs


def classify_option_kind(
    pairs: dict[str, tuple[int, tuple[float, float, float, float]]],
    om: dict[str, tuple[int, float, float]],
) -> str:
    """At least 3 of 4 options paired to an image → image-option Q."""
    image_count = sum(1 for opt in "abcd" if opt in pairs)
    if image_count >= 3:
        return "image"
    # Big vertical gap between consecutive markers on same page also implies image-option
    pa, ya, _ = om["a"]
    pb, yb, _ = om["b"]
    if pa == pb and (yb - ya) > 60:
        return "image"
    return "text"


def crop_stem(
    doc: fitz.Document,
    n: int,
    starts: dict[int, tuple[int, float]],
    om: dict[str, tuple[int, float, float]],
    pairs: dict[str, tuple[int, tuple[float, float, float, float]]],
    kind: str,
) -> Image.Image | None:
    sp, sy = starts[n]
    end_p = om["a"][0]
    if kind == "image" and "a" in pairs and pairs["a"][0] == end_p:
        _, bbox_a = pairs["a"]
        end_y = min(om["a"][1], bbox_a[1]) - 2
    else:
        end_y = om["a"][1] - 2
    img = crop_band(doc, sp, sy - 2, end_p, end_y)
    if img is None:
        return None
    return trim_whitespace_borders(img)


def crop_option(
    doc: fitz.Document,
    n: int,
    opt: str,
    om: dict[str, tuple[int, float, float]],
    pairs: dict[str, tuple[int, tuple[float, float, float, float]]],
    next_q_pos: tuple[int, float],
) -> Image.Image | None:
    seq = ["a", "b", "c", "d"]
    idx = seq.index(opt)

    # Use paired image bbox if available
    if opt in pairs:
        img_p, (bx0, by0, bx1, by1) = pairs[opt]
        x_left = max(0.0, bx0 - 10)
        x_right = min(PAGE_W_PT, bx1 + 10)
        # Render the image's own region, optionally with the marker label
        # appended (if the marker sits on the same page, just outside the
        # image y-range).
        marker_p, marker_y, _ = om[opt]
        img_page = render_page(doc, img_p)
        y_top = max(CONTENT_TOP_PT, by0 - 5)
        y_bot = min(CONTENT_BOT_PT, by1 + 5)
        if marker_p == img_p:
            y_top = min(y_top, max(CONTENT_TOP_PT, marker_y - 5))
            y_bot = max(y_bot, min(CONTENT_BOT_PT, marker_y + 22))
        piece = img_page.crop(
            (
                int(x_left * ZOOM),
                int(y_top * ZOOM),
                int(x_right * ZOOM),
                int(y_bot * ZOOM),
            )
        )
        return trim_whitespace_borders(piece)

    # Text-option (or option with no image): band from this marker to next
    p, y, _ = om[opt]
    if idx == 3:
        bot_p, bot_y = next_q_pos
        # If next question is on a later page, cap on same page so we don't
        # pull in section headers / empty page tails.
        if bot_p != p:
            bot_p, bot_y = p, min(CONTENT_BOT_PT, y + 130)
    else:
        nxt = om[seq[idx + 1]]
        bot_p, bot_y = nxt[0], nxt[1]
        if bot_p != p:
            bot_p, bot_y = p, min(CONTENT_BOT_PT, y + 130)
    piece = crop_band(doc, p, y - 2, bot_p, bot_y - 2)
    return trim_whitespace_borders(piece) if piece else None


def fit(img: Image.Image, max_w: int, max_h: int) -> Image.Image:
    w, h = img.size
    scale = min(max_w / w, max_h / h)
    if scale >= 1.0:
        return img
    return img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)


def split_stem_to_columns(stem: Image.Image, max_aspect_h_over_w: float = 0.9) -> Image.Image:
    """If stem is much taller than wide, re-lay it out as N side-by-side columns
    so the final composite isn't squeezed to a narrow strip."""
    w, h = stem.size
    aspect = h / max(1, w)
    if aspect <= max_aspect_h_over_w:
        return stem
    n_cols = min(3, max(2, int(round(aspect / max_aspect_h_over_w))))
    col_h = -(-h // n_cols)  # ceil division
    col_gap = 24
    out_w = w * n_cols + col_gap * (n_cols - 1)
    out = Image.new("RGB", (out_w, col_h), "white")
    for i in range(n_cols):
        y0 = i * col_h
        y1 = min(h, y0 + col_h)
        piece = stem.crop((0, y0, w, y1))
        # Pad piece to col_h
        if piece.size[1] < col_h:
            padded = Image.new("RGB", (w, col_h), "white")
            padded.paste(piece, (0, 0))
            piece = padded
        x = i * (w + col_gap)
        out.paste(piece, (x, 0))
    return out


def _prepare_stem(stem: Image.Image) -> Image.Image:
    stem_laid = split_stem_to_columns(stem)
    inner_w = CANVAS_W - 2 * PAD
    sw, sh = stem_laid.size
    if sw > inner_w:
        ratio = inner_w / sw
        stem_laid = stem_laid.resize(
            (inner_w, max(1, int(sh * ratio))), Image.LANCZOS
        )
    if stem_laid.size[1] > STEM_MAX_H:
        ratio = STEM_MAX_H / stem_laid.size[1]
        stem_laid = stem_laid.resize(
            (max(1, int(stem_laid.size[0] * ratio)), STEM_MAX_H),
            Image.LANCZOS,
        )
    return stem_laid


def _compose_grid(
    stem_fitted: Image.Image, opts: dict[str, Image.Image]
) -> Image.Image:
    """2x2 grid layout for image options. Cell height scales with content
    so we don't reserve empty space when option images are short."""
    cell_w = (CANVAS_W - 2 * PAD - GAP) // 2
    label_pad_left = 50
    avail_w = cell_w - label_pad_left - 12
    # Pre-fit options to grid width, then size cells to the tallest fitted option
    fitted_opts = {
        opt: fit(opts[opt], avail_w, CELL_H_DEFAULT) for opt in "abcd"
    }
    content_h = max(im.size[1] for im in fitted_opts.values())
    cell_h = max(140, min(CELL_H_DEFAULT, content_h + 16))

    stem_h = stem_fitted.size[1]
    total_h = PAD + stem_h + PAD + cell_h * 2 + GAP + PAD
    canvas = Image.new("RGB", (CANVAS_W, total_h), "white")
    canvas.paste(stem_fitted, ((CANVAS_W - stem_fitted.size[0]) // 2, PAD))

    grid_top = PAD + stem_h + PAD
    positions = {
        "a": (PAD, grid_top),
        "b": (PAD + cell_w + GAP, grid_top),
        "c": (PAD, grid_top + cell_h + GAP),
        "d": (PAD + cell_w + GAP, grid_top + cell_h + GAP),
    }
    draw = ImageDraw.Draw(canvas)
    label_font = font_for(28)
    for opt in "abcd":
        x, y = positions[opt]
        draw.rectangle(
            [x, y, x + cell_w, y + cell_h],
            outline=(220, 224, 232),
            width=2,
        )
        draw.text(
            (x + 10, y + 6), f"{opt.upper()}.", fill=(70, 80, 100), font=label_font
        )
        fitted = fitted_opts[opt]
        ox = x + label_pad_left + (avail_w - fitted.size[0]) // 2
        oy = y + (cell_h - fitted.size[1]) // 2
        canvas.paste(fitted, (ox, oy))
    return canvas


def _compose_list(
    stem_fitted: Image.Image, opts: dict[str, Image.Image]
) -> Image.Image:
    """Full-width vertical list layout for text-style options."""
    row_w = CANVAS_W - 2 * PAD
    label_w = 50
    inner_w = row_w - label_w - 12

    fitted_opts: dict[str, Image.Image] = {}
    for opt, img in opts.items():
        if img.width > inner_w:
            ratio = inner_w / img.width
            fitted_opts[opt] = img.resize(
                (inner_w, max(1, int(img.height * ratio))), Image.LANCZOS
            )
        else:
            fitted_opts[opt] = img

    row_heights = {
        opt: max(54, fitted_opts[opt].size[1] + 14) for opt in "abcd"
    }

    stem_h = stem_fitted.size[1]
    total_h = (
        PAD
        + stem_h
        + PAD
        + sum(row_heights.values())
        + GAP * 3
        + PAD
    )
    canvas = Image.new("RGB", (CANVAS_W, total_h), "white")
    canvas.paste(stem_fitted, ((CANVAS_W - stem_fitted.size[0]) // 2, PAD))

    draw = ImageDraw.Draw(canvas)
    label_font = font_for(30)

    y = PAD + stem_h + PAD
    for opt in "abcd":
        rh = row_heights[opt]
        draw.rectangle(
            [PAD, y, PAD + row_w, y + rh],
            outline=(220, 224, 232),
            width=2,
        )
        draw.text(
            (PAD + 10, y + (rh - 30) // 2),
            f"{opt.upper()}.",
            fill=(70, 80, 100),
            font=label_font,
        )
        opt_img = fitted_opts[opt]
        ox = PAD + label_w
        oy = y + (rh - opt_img.size[1]) // 2
        canvas.paste(opt_img, (ox, oy))
        y += rh + GAP
    return canvas


def compose(stem: Image.Image, opts: dict[str, Image.Image], qno: int) -> Image.Image:
    max_oh = max(o.size[1] for o in opts.values())
    avg_aspect = sum(o.size[1] / max(1, o.size[0]) for o in opts.values()) / 4
    layout = "list" if (max_oh < 200 and avg_aspect < 0.25) else "grid"
    print(
        f"  Q{qno} [{layout}] option dims: "
        + " ".join(f"{k}={v.size}" for k, v in opts.items())
        + f"  max_oh={max_oh} avg_aspect={avg_aspect:.3f}"
    )

    stem_fitted = _prepare_stem(stem)
    if layout == "list":
        return _compose_list(stem_fitted, opts)
    return _compose_grid(stem_fitted, opts)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)
    starts, next_q, option_markers = build_question_index(doc)

    for n in TARGETS:
        if n not in starts:
            print(f"Q{n}: not found, skipping")
            continue
        om = option_markers(n)
        if len(om) != 4:
            print(f"Q{n}: only found options {sorted(om.keys())}, skipping")
            continue

        pairs = pair_option_images(doc, om, starts, n, next_q(n))
        kind = classify_option_kind(pairs, om)
        stem = crop_stem(doc, n, starts, om, pairs, kind)
        if stem is None:
            print(f"Q{n}: stem crop failed, skipping")
            continue

        next_pos = next_q(n)
        # (already passed to pair_option_images above; reuse here)
        options: dict[str, Image.Image] = {}
        for opt in "abcd":
            piece = crop_option(doc, n, opt, om, pairs, next_pos)
            if piece is None:
                print(f"Q{n}: option {opt} crop failed; aborting Q")
                options = {}
                break
            options[opt] = piece
        if not options:
            continue

        out_img = compose(stem, options, n)
        target = OUT_DIR / f"q{n}.png"
        out_img.save(target, "PNG", optimize=True)
        print(f"Q{n} [{kind}]: stem {stem.size} → {target.name} {out_img.size}")


if __name__ == "__main__":
    main()
