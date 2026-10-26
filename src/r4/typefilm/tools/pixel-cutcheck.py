"""Pixel cut check for the type film (2026-10-25). The pass captures carry no per-line text boxes (their JSON has
headings, cards, buttons and nav only), so `capture/wave2-cutcheck.py` has nothing to read for them. This does the
same job from the pixels: for a camera window on a capture it lists every run of rows where ink (any channel > 150,
which catches white text, red labels and red buttons) crosses the left or right edge, with ink on both sides of the
edge (within 20 px each side), i.e. a word sliced, or a line of words that carries on past the frame. Top and bottom edges are checked the same way by columns.

  python3 src/r4/typefilm/tools/pixel-cutcheck.py <capture.jpg> <dpr> L R T B          (CSS px window)
  python3 src/r4/typefilm/tools/pixel-cutcheck.py <capture.jpg> <dpr> --gutters L Rmin Rmax T B   (right edges that cut nothing)
"""
import sys
import numpy as np
from PIL import Image

def ink(path):
    a = np.asarray(Image.open(path).convert("RGB")).astype(int)
    return a.max(axis=2) > 150

def cuts_v(m, dpr, X, T, B):
    """Row runs where ink crosses the vertical line x = X (CSS)."""
    x = int(round(X * dpr)); t = max(0, int(T * dpr)); b = min(m.shape[0], int(B * dpr))
    if x - 41 < 0 or x + 41 >= m.shape[1]:
        return []
    # ink within 20 CSS px on BOTH sides of the edge: a word, or a phrase that carries on past a word gap, is cut
    w = int(20 * dpr)
    l = m[t:b, x - w:x].any(axis=1)
    r = m[t:b, x:x + w].any(axis=1)
    hit = l & r
    runs, start = [], None
    for i, h in enumerate(hit):
        if h and start is None: start = i
        if not h and start is not None:
            if i - start >= 6: runs.append(((t + start) / dpr, (t + i) / dpr))
            start = None
    if start is not None and len(hit) - start >= 6: runs.append(((t + start) / dpr, b / dpr))
    return runs

def cuts_h(m, dpr, Y, L, R):
    y = int(round(Y * dpr)); l = max(0, int(L * dpr)); r = min(m.shape[1], int(R * dpr))
    if y - 10 < 0 or y + 10 >= m.shape[0]:
        return []
    c = m[y - 2:y + 3, l:r].any(axis=0)
    a = m[y - 10:y - 2, l:r].any(axis=0)
    b = m[y + 3:y + 11, l:r].any(axis=0)
    hit = c & a & b
    n = int(hit.sum())
    return [n / dpr] if n > 6 else []

if __name__ == "__main__":
    path, dpr = sys.argv[1], float(sys.argv[2])
    m = ink(path)
    if sys.argv[3] == "--gutters":
        L, Rmin, Rmax, T, B = map(float, sys.argv[4:9])
        ok = [R for R in range(int(Rmin), int(Rmax) + 1) if not cuts_v(m, dpr, R, T, B)]
        print("clean right edges:", ok)
    else:
        L, R, T, B = map(float, sys.argv[3:7])
        out = {"L": cuts_v(m, dpr, L, T, B), "R": cuts_v(m, dpr, R, T, B), "T": cuts_h(m, dpr, T, L, R), "B": cuts_h(m, dpr, B, L, R)}
        bad = {k: v for k, v in out.items() if v}
        print(f"window x {L:.0f}-{R:.0f} y {T:.0f}-{B:.0f}:", "clean" if not bad else bad)
