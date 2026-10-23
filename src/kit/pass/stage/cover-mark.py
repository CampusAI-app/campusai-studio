"""Writes copies of the pass captures with the Maryland "M" mark (and the divider before it) painted
out in the sidebar's own colour, for surfaces that take an image path and cannot carry a DOM patch
(the RealLaptop screen). Run from the studio folder:  python3 src/kit/pass/stage/cover-mark.py
Mark box measured on these captures: CSS x 116 to 156, y 10 to 46 (image px at DPR 2 = x2)."""
from PIL import Image

PAGES = ["dashboard", "calendar", "job-goldman"]
X0, Y0, X1, Y1 = 116, 10, 156, 46
for name in PAGES:
    im = Image.open(f"public/pass/{name}.jpg").convert("RGB")
    color = im.getpixel((165 * 2, 28 * 2))  # flat sidebar ground just right of the mark
    im.paste(color, (X0 * 2, Y0 * 2, X1 * 2, Y1 * 2))
    im.save(f"public/pass/stage/{name}.jpg", quality=95)
    print(name, color)
