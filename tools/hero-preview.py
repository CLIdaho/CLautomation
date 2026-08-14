#!/usr/bin/env python3
"""Offline preview of the hero animation.

The hero canvas in js/main.js is a flow field: a few hundred particles
following a slowly morphing noise field, each drawing a faint additive
stroke that the canvas fades out over time. It's hard to tune blind —
the alpha values in particular are load-bearing, and getting them wrong
by a factor of a few makes the whole thing either invisible or a white
blowout.

This script reimplements that exact algorithm on the CPU and writes a
still frame, so the constants can be tuned and reviewed without a
browser in the loop. Keep the defaults here in sync with the constants
at the top of current() in js/main.js.

    pip install numpy pillow
    python3 tools/hero-preview.py            # -> hero-preview.png

Usage note: the output is a single frame of what is normally a moving
image. On the live site the ribbons sweep continuously, which reads
considerably stronger than any still does.
"""

import argparse
import math
import random

import numpy as np
from PIL import Image, ImageFilter

BG = np.array([8, 11, 20], dtype=np.float64)

# --- must match js/main.js -------------------------------------------------
SCALE = 0.0024      # field zoom — governs ribbon size
WASH = 0.014        # per-frame fade; lower = longer trails
DRIFT = 0.00042     # how fast the field itself morphs
ALPHA = (0.17, 0.38)
LIFE = (140, 460)   # frames: min, extra random
SPEED = (0.5, 1.1)
WIDTH = (0.5, 0.8)
HALO_BLUR = 3.5     # approximates the wide low-alpha bloom stroke
HALO_GAIN = 1.7
PALETTE = np.array([
    [45, 212, 232],   # cyan — the build
    [45, 212, 232],
    [73, 168, 245],
    [91, 124, 250],   # indigo
    [255, 165, 58],   # amber — the town
], dtype=np.float64)
# ---------------------------------------------------------------------------


def render(W, H, frames=800, seed=5, count=None):
    rng = random.Random(seed)
    np.random.seed(seed)
    p = list(range(256))
    rng.shuffle(p)
    perm = np.array(p * 2, dtype=np.int32)

    def noise2(x, y):
        xi = np.floor(x).astype(np.int32)
        yi = np.floor(y).astype(np.int32)
        xf = x - xi
        yf = y - yi
        xf = xf * xf * (3 - 2 * xf)
        yf = yf * yf * (3 - 2 * yf)
        h = lambda a, b: perm[(perm[a & 255] + (b & 255)) & 255] / 255.0
        a, b = h(xi, yi), h(xi + 1, yi)
        c, d = h(xi, yi + 1), h(xi + 1, yi + 1)
        return (a + (b - a) * xf) * (1 - yf) + (c + (d - c) * xf) * yf

    def field(x, y):
        n = noise2(x, y) * 0.68 + noise2(x * 2.3, y * 2.3) * 0.32
        return n * math.pi * 3.2

    N = count or max(240, int(W * 0.29))
    px, py = np.random.rand(N) * W, np.random.rand(N) * H
    mx = LIFE[0] + np.random.rand(N) * LIFE[1]
    life = np.random.rand(N) * mx
    speed = SPEED[0] + np.random.rand(N) * SPEED[1]
    alpha = ALPHA[0] + np.random.rand(N) * (ALPHA[1] - ALPHA[0])
    col = PALETTE[np.random.randint(0, len(PALETTE), N)]

    acc = np.zeros((H, W, 3))
    t = 0.0
    for _ in range(frames):
        acc *= (1 - WASH)
        ang = field(px * SCALE, py * SCALE + t)
        nx, ny = px + np.cos(ang) * speed, py + np.sin(ang) * speed
        env = np.sin(np.clip(life / mx, 0, 1) * math.pi)
        deposit = (alpha * env)[:, None] * col

        ix, iy = np.round(nx).astype(np.int32), np.round(ny).astype(np.int32)
        ok = (ix >= 0) & (ix < W) & (iy >= 0) & (iy < H)
        np.add.at(acc, (iy[ok], ix[ok]), deposit[ok])

        px, py, life = nx, ny, life + 1
        dead = (life > mx) | (nx < -60) | (nx > W + 60) | (ny < -60) | (ny > H + 60)
        n = int(dead.sum())
        if n:
            px[dead] = np.random.rand(n) * W
            py[dead] = np.random.rand(n) * H
            life[dead] = 0
            mx[dead] = LIFE[0] + np.random.rand(n) * LIFE[1]
            speed[dead] = SPEED[0] + np.random.rand(n) * SPEED[1]
            alpha[dead] = ALPHA[0] + np.random.rand(n) * (ALPHA[1] - ALPHA[0])
            col[dead] = PALETTE[np.random.randint(0, len(PALETTE), n)]
        t += DRIFT

    core = Image.fromarray(np.clip(acc, 0, 255).astype(np.uint8))
    halo = np.asarray(core.filter(ImageFilter.GaussianBlur(HALO_BLUR)), dtype=np.float64)
    return np.clip(BG + acc + halo * HALO_GAIN, 0, 255)


def veil(W, H):
    """Replicates .hero__veil in css/style.css."""
    yy, xx = np.mgrid[0:H, 0:W]
    r = np.sqrt(((xx - 0.5 * W) / (0.59 * W)) ** 2 + ((yy - 0.45 * H) / (0.43 * H)) ** 2)
    vig = np.clip((r - 0.42) / 0.58, 0, 1) * 0.36
    left = np.clip(1 - (xx / W) / 0.52, 0, 1) * 0.55
    bot = np.clip(1 - (H - yy) / (0.22 * H), 0, 1) * 0.80
    return np.clip(np.maximum(np.maximum(vig, left), bot), 0, 1)[:, :, None]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--width", type=int, default=1440)
    ap.add_argument("--height", type=int, default=900)
    ap.add_argument("--frames", type=int, default=800)
    ap.add_argument("--seed", type=int, default=5)
    ap.add_argument("--raw", action="store_true", help="skip the veil and grain")
    ap.add_argument("-o", "--out", default="hero-preview.png")
    args = ap.parse_args()

    out = render(args.width, args.height, args.frames, args.seed)
    if not args.raw:
        m = veil(args.width, args.height)
        out = out * (1 - m) + BG * m
        out = out + (np.random.rand(args.height, args.width, 1) - 0.5) * 255 * 0.05

    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(args.out)
    print("wrote", args.out)


if __name__ == "__main__":
    main()
