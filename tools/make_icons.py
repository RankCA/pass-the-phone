#!/usr/bin/env python3
"""Draw the Pass the Phone app icon with no libraries.

Usage: python3 tools/make_icons.py
Writes icons/icon-180.png, icons/icon-192.png and icons/icon-512.png.
The shapes match icons/icon.svg: a tilted red phone with a smiling screen on yellow.
"""
import math
import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "icons")

BG = (255, 210, 63)
INK = (21, 19, 26)
RED = (255, 79, 109)
WHITE = (255, 255, 255)
ANGLE = math.radians(-12)


def rounded_rect(px, py, cx, cy, hw, hh, r):
    qx = abs(px - cx) - (hw - r)
    qy = abs(py - cy) - (hh - r)
    outside = math.hypot(max(qx, 0.0), max(qy, 0.0))
    inside = min(max(qx, qy), 0.0)
    return outside + inside - r


def circle(px, py, cx, cy, r):
    return math.hypot(px - cx, py - cy) - r


def smile(px, py):
    # Lower half of a ring centered under the eyes
    cx, cy, r, w = 0.5, 0.505, 0.075, 0.02
    ring = abs(math.hypot(px - cx, py - cy) - r) - w
    if py < cy:
        ring = max(ring, (cy - py))
    return ring


def layers(px, py):
    """Return the list of (signed distance, color) painted bottom to top."""
    # Rotate the sample point around the center so the phone tilts
    dx, dy = px - 0.5, py - 0.5
    c, s = math.cos(-ANGLE), math.sin(-ANGLE)
    x, y = 0.5 + dx * c - dy * s, 0.5 + dx * s + dy * c
    return [
        (rounded_rect(x, y, 0.5, 0.5, 0.215, 0.37, 0.085), INK),
        (rounded_rect(x, y, 0.5, 0.5, 0.185, 0.34, 0.06), RED),
        (rounded_rect(x, y, 0.5, 0.455, 0.145, 0.235, 0.025), INK),
        (rounded_rect(x, y, 0.5, 0.455, 0.125, 0.215, 0.012), WHITE),
        (circle(x, y, 0.445, 0.425, 0.026), INK),
        (circle(x, y, 0.555, 0.425, 0.026), INK),
        (smile(x, y), INK),
        (circle(x, y, 0.5, 0.79, 0.026), INK),
    ]


def render(size):
    rows = []
    aa = 1.0 / size
    for j in range(size):
        row = bytearray([0])
        py = (j + 0.5) / size
        for i in range(size):
            px = (i + 0.5) / size
            col = BG
            for d, color in layers(px, py):
                a = max(0.0, min(1.0, 0.5 - d / aa))
                if a > 0:
                    col = tuple(col[k] + (color[k] - col[k]) * a for k in range(3))
            row.extend(int(round(v)) for v in col)
        rows.append(bytes(row))
    return b"".join(rows)


def write_png(path, size, raw):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for size in (180, 192, 512):
        write_png(os.path.join(OUT, "icon-%d.png" % size), size, render(size))
        print("wrote icon-%d.png" % size)
