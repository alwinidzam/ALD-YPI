"""
Generates the PWA icon set for Arsip Laporan Digital (ALD).
Run once with: python3 scripts/gen_icons.py
Produces square PNGs (plain + maskable-safe padded) used by public/manifest.webmanifest.
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
os.makedirs(OUT, exist_ok=True)

EMERALD_DARK = (4, 32, 22)      # deep emerald background
EMERALD = (5, 92, 68)           # brand emerald
EMERALD_LIGHT = (16, 185, 129)  # accent emerald-500
GOLD = (217, 164, 65)           # brand gold accent
WHITE = (255, 255, 255)

def rounded_square_bg(size, radius_ratio=0.22):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    radius = int(size * radius_ratio)
    # subtle diagonal gradient by layering two rects (cheap gradient)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=EMERALD_DARK)
    grad = Image.new('L', (size, size), 0)
    gd = ImageDraw.Draw(grad)
    for y in range(size):
        v = int(255 * (y / size) * 0.35)
        gd.line([(0, y), (size, y)], fill=v)
    overlay = Image.new('RGBA', (size, size), EMERALD_LIGHT + (0,))
    overlay.putalpha(grad)
    mask = Image.new('L', (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    img = Image.composite(Image.alpha_composite(img, overlay), img, mask)
    return img, d

def draw_mark(img, size):
    d = ImageDraw.Draw(img)
    cx, cy = size / 2, size / 2
    # Stylized open-book / archive glyph made of simple geometry (no external font dependency issues)
    book_w = size * 0.52
    book_h = size * 0.34
    top = cy - book_h * 0.35
    # left page
    d.polygon([
        (cx - book_w/2, top),
        (cx, top + book_h * 0.18),
        (cx, top + book_h),
        (cx - book_w/2, top + book_h * 0.82),
    ], fill=WHITE + (235,))
    # right page
    d.polygon([
        (cx + book_w/2, top),
        (cx, top + book_h * 0.18),
        (cx, top + book_h),
        (cx + book_w/2, top + book_h * 0.82),
    ], fill=WHITE + (200,))
    # spine highlight
    d.line([(cx, top + book_h * 0.18), (cx, top + book_h)], fill=GOLD + (255,), width=max(2, int(size*0.012)))
    # gold accent arc above (dome / mosque-inspired accent, echoes YPI identity) — simple circle segment
    r = size * 0.09
    d.ellipse([cx - r, top - book_h*0.55 - r, cx + r, top - book_h*0.55 + r], outline=GOLD + (255,), width=max(2, int(size*0.012)))
    d.line([(cx, top - book_h*0.55 + r), (cx, top - book_h*0.18)], fill=GOLD + (255,), width=max(2, int(size*0.012)))
    return img

def make_icon(size, maskable=False, filename=None):
    if maskable:
        # maskable icons need extra safe-zone padding (~20%) since OS may crop to a circle
        canvas = Image.new('RGBA', (size, size), (0,0,0,0))
        inner_size = int(size * 0.8)
        inner, _ = rounded_square_bg(inner_size, radius_ratio=0.3)
        inner = draw_mark(inner, inner_size)
        # solid bg full bleed for maskable safe zone
        bg = Image.new('RGBA', (size, size), EMERALD_DARK + (255,))
        offset = (size - inner_size) // 2
        bg.paste(inner, (offset, offset), inner)
        img = bg
    else:
        img, _ = rounded_square_bg(size)
        img = draw_mark(img, size)
    path = os.path.join(OUT, filename)
    img.save(path, 'PNG')
    print('wrote', path)

sizes = [72, 96, 128, 144, 152, 192, 256, 384, 512]
for s in sizes:
    make_icon(s, maskable=False, filename=f'icon-{s}.png')
make_icon(512, maskable=True, filename='icon-maskable-512.png')
make_icon(192, maskable=True, filename='icon-maskable-192.png')

# apple-touch-icon (no transparency, no maskable padding, 180px is the canonical size)
make_icon(180, maskable=False, filename='apple-touch-icon.png')

# favicon
make_icon(48, maskable=False, filename='favicon-48.png')
print('Done.')
