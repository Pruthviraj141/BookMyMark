#!/usr/bin/env python3
import os
import math
import cairo

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
RES_DIR = os.path.join(BASE_DIR, 'frontend', 'android', 'app', 'src', 'main', 'res')
PUBLIC_BRANDING_DIR = os.path.join(BASE_DIR, 'frontend', 'public', 'branding')

os.makedirs(PUBLIC_BRANDING_DIR, exist_ok=True)

def rounded_rect(cr, x, y, w, h, r):
    cr.new_sub_path()
    cr.arc(x + w - r, y + r, r, -math.pi/2, 0)
    cr.arc(x + w - r, y + h - r, r, 0, math.pi/2)
    cr.arc(x + r, y + h - r, r, math.pi/2, math.pi)
    cr.arc(x + r, y + r, r, math.pi, 3*math.pi/2)
    cr.close_path()

def draw_bookmymark_emblem(cr, center_x, center_y, size, card_fill=(1, 1, 1), ribbon_fill=(0.04, 0.04, 0.05)):
    """
    Renders the precision geometric BookMyMark emblem centered at (center_x, center_y).
    The emblem is proportioned within a 48x48 virtual box scaled by scale = size / 48.
    """
    scale = size / 48.0
    cr.save()
    cr.translate(center_x, center_y)
    cr.scale(scale, scale)
    cr.translate(-24, -24)  # Now (0,0) to (48,48) is centered

    # 1. Main outer card: x=8, y=4, w=32, h=40, rx=5
    cr.set_source_rgb(*card_fill)
    rounded_rect(cr, 8, 4, 32, 40, 5)
    cr.fill()

    # 2. Precision Bookmark Ribbon with chevron: M17 4 H31 V25 L24 19.5 L17 25 Z
    cr.set_source_rgb(*ribbon_fill)
    cr.new_path()
    cr.move_to(17, 4)
    cr.line_to(31, 4)
    cr.line_to(31, 25)
    cr.line_to(24, 19.5)
    cr.line_to(17, 25)
    cr.close_path()
    cr.fill()

    # 3. Reading / Saved Content Indicator Bars:
    # Bar 1: x=16, y=30, w=16, h=2.5, r=1.25
    rounded_rect(cr, 16, 30, 16, 2.5, 1.25)
    cr.fill()

    # Bar 2: x=16, y=35.5, w=10, h=2.5, r=1.25
    rounded_rect(cr, 16, 35.5, 10, 2.5, 1.25)
    cr.fill()

    cr.restore()

def generate_adaptive_foreground(size, out_path):
    # Foreground must have transparent background. Center safe-zone emblem.
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, size, size)
    cr = cairo.Context(surface)
    # Emblem size: approx 50% of canvas so it's fully inside the 66dp center safe circle
    emblem_size = size * 0.48
    draw_bookmymark_emblem(cr, size / 2, size / 2, emblem_size, card_fill=(1, 1, 1), ribbon_fill=(0.04, 0.04, 0.05))
    surface.write_to_png(out_path)

def generate_legacy_launcher_icon(size, out_path, is_round=False):
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, size, size)
    cr = cairo.Context(surface)
    
    # Background
    cr.set_source_rgb(0.04, 0.04, 0.05)  # Obsidian #0A0A0D
    if is_round:
        cr.arc(size / 2, size / 2, size / 2 - 0.5, 0, 2 * math.pi)
        cr.fill()
    else:
        rounded_rect(cr, 1, 1, size - 2, size - 2, size * 0.22)
        cr.fill()

    # Subtle border
    cr.set_source_rgba(1, 1, 1, 0.12)
    cr.set_line_width(size * 0.02)
    if is_round:
        cr.arc(size / 2, size / 2, size / 2 - size * 0.015, 0, 2 * math.pi)
        cr.stroke()
    else:
        rounded_rect(cr, 1, 1, size - 2, size - 2, size * 0.22)
        cr.stroke()

    # Centered white BookMyMark emblem
    emblem_size = size * 0.58
    draw_bookmymark_emblem(cr, size / 2, size / 2, emblem_size, card_fill=(1, 1, 1), ribbon_fill=(0.04, 0.04, 0.05))
    surface.write_to_png(out_path)

def generate_splash_screen(width, height, out_path):
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, width, height)
    cr = cairo.Context(surface)

    # Ultra-deep dark obsidian background (#0A0B0E)
    cr.set_source_rgb(0.039, 0.043, 0.055)
    cr.rectangle(0, 0, width, height)
    cr.fill()

    # Centered BookMyMark emblem
    emblem_size = min(width, height) * 0.20
    emblem_size = max(48, min(emblem_size, 100))
    emblem_y = height / 2 - 18
    draw_bookmymark_emblem(cr, width / 2, emblem_y, emblem_size, card_fill=(1, 1, 1), ribbon_fill=(0.039, 0.043, 0.055))

    # "BookMyMark" Wordmark text below
    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    font_size = max(16, min(width, height) * 0.045)
    font_size = min(font_size, 26)
    cr.set_font_size(font_size)

    text = "BookMyMark"
    extents = cr.text_extents(text)
    text_x = (width - extents.width) / 2 - extents.x_bearing
    text_y = emblem_y + emblem_size / 2 + 28
    cr.set_source_rgb(1, 1, 1)
    cr.move_to(text_x, text_y)
    cr.show_text(text)

    # Tagline text "Everything worth keeping."
    cr.select_font_face("Sans", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    tag_size = font_size * 0.52
    cr.set_font_size(tag_size)
    tagline = "Everything worth keeping."
    tag_extents = cr.text_extents(tagline)
    tag_x = (width - tag_extents.width) / 2 - tag_extents.x_bearing
    tag_y = text_y + 16
    cr.set_source_rgba(0.65, 0.65, 0.70, 0.85)
    cr.move_to(tag_x, tag_y)
    cr.show_text(tagline)

    surface.write_to_png(out_path)

def main():
    print("Generating BookMyMark launcher icons...")
    densities = {
        'mdpi': (48, 108),
        'hdpi': (72, 162),
        'xhdpi': (96, 216),
        'xxhdpi': (144, 324),
        'xxxhdpi': (192, 432),
    }

    for density, (icon_sz, fg_sz) in densities.items():
        folder = os.path.join(RES_DIR, f'mipmap-{density}')
        os.makedirs(folder, exist_ok=True)
        # 1. Foreground for adaptive icon
        generate_adaptive_foreground(fg_sz, os.path.join(folder, 'ic_launcher_foreground.png'))
        # 2. Standard legacy icon
        generate_legacy_launcher_icon(icon_sz, os.path.join(folder, 'ic_launcher.png'), is_round=False)
        # 3. Round legacy icon
        generate_legacy_launcher_icon(icon_sz, os.path.join(folder, 'ic_launcher_round.png'), is_round=True)
        print(f"  ✓ mipmap-{density} generated (legacy: {icon_sz}px, fg: {fg_sz}px)")

    # Also save a 512x512 preview icon into branding folder
    generate_legacy_launcher_icon(512, os.path.join(PUBLIC_BRANDING_DIR, 'bookmymark-app-icon-512.png'), is_round=False)
    generate_legacy_launcher_icon(512, os.path.join(PUBLIC_BRANDING_DIR, 'bookmymark-app-icon-round-512.png'), is_round=True)
    generate_adaptive_foreground(512, os.path.join(PUBLIC_BRANDING_DIR, 'bookmymark-adaptive-foreground-512.png'))

    print("Generating BookMyMark splash screens...")
    splashes = [
        ('drawable', (480, 320)),
        ('drawable-land-mdpi', (480, 320)),
        ('drawable-land-hdpi', (800, 480)),
        ('drawable-land-xhdpi', (1280, 720)),
        ('drawable-land-xxhdpi', (1600, 960)),
        ('drawable-land-xxxhdpi', (1920, 1280)),
        ('drawable-port-mdpi', (320, 480)),
        ('drawable-port-hdpi', (480, 800)),
        ('drawable-port-xhdpi', (720, 1280)),
        ('drawable-port-xxhdpi', (960, 1600)),
        ('drawable-port-xxxhdpi', (1280, 1920)),
    ]

    for draw_folder, (w, h) in splashes:
        folder = os.path.join(RES_DIR, draw_folder)
        os.makedirs(folder, exist_ok=True)
        generate_splash_screen(w, h, os.path.join(folder, 'splash.png'))
        print(f"  ✓ {draw_folder}/splash.png ({w}x{h})")

    # Generate splash preview in branding
    generate_splash_screen(720, 1280, os.path.join(PUBLIC_BRANDING_DIR, 'bookmymark-splash-preview.png'))
    print("Done! All BookMyMark branding assets generated successfully.")

if __name__ == '__main__':
    main()
