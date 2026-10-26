"""Feature loops (round 4, 2026-10-25): builds the loop surfaces in public/loops/ from the real captures in
public/sys/ (campusai-demo, dark, 1440x900 CSS at DPR 2, captured 2026-10-23 by capture/system-flows.cjs).
Run from the studio folder:  python3 src/r4/loops/prepare.py

Every page gets the Maryland "M" painted out in the sidebar's own colour (house box: CSS x 116 to 156, y 10 to
46, colour sampled just right of it, as kit/pass/stage/cover-mark.py does). Three surfaces need a little more,
each one a STATE the product really has, rebuilt from the capture that shows its neighbour:
  cal-before   My Calendar, Oct 25 to 31, with Sunday 5 to 7 PM empty: the week before the event is added. The
               block is painted out by interpolating the column's own ground between the rows above and below
               it and redrawing the two hour lines it covered (5 PM, 6 PM) from the 4 PM line.
  job-blank    Job Match with Goldman Sachs selected and its "Why this fits you" paragraph emptied, so the
               paragraph can be revealed line by line over the real one (the box ground is a flat 41, 29, 31).
  plan-before  The planner step "BMGT440. Pick a time." with the "See BMGT440 on Testudo" link painted out
               (house rule: no Testudo). plan-after is the same page with the left "Your week" panel taken
               from the capture after the press (it sits 8 CSS px higher there, measured, so it is moved down 8).
Crops (the flying pieces) are cut from the same images by the measured boxes printed below.
"""
from PIL import Image, ImageFilter
import numpy as np
import os

SYS = "public/sys"
OUT = "public/loops"
os.makedirs(OUT, exist_ok=True)
D = 2  # DPR


def load(name):
    return np.array(Image.open(f"{SYS}/{name}.jpg").convert("RGB")).astype(np.float64)


def save(arr, name):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(f"{OUT}/{name}.jpg", quality=95)


def cover_mark(a):
    color = a[28 * D, 165 * D].copy()
    a[10 * D:46 * D, 116 * D:156 * D] = color
    return a


def crop(a, r, name):
    x, y, w, h = r
    save(a[y * D:(y + h) * D, x * D:(x + w) * D], name)


def inpaint_rows(a, x0, x1, y0, y1):
    """Fill CSS box x0..x1, y0..y1 by blending, per column, the row just above into the row just below."""
    X0, X1, Y0, Y1 = int(x0 * D), int(x1 * D), int(y0 * D), int(y1 * D)
    # ground rows a few px clear of the box (and of any line on its edge), averaged, then smoothed across x
    # so JPEG grain in one row does not streak down the whole fill
    top = a[Y0 - 10:Y0 - 3, X0:X1].mean(0)
    bot = a[Y1 + 5:Y1 + 12, X0:X1].mean(0)
    k9 = np.ones(9) / 9
    top = np.stack([np.convolve(np.pad(top[:, c], 4, mode="edge"), k9, "valid") for c in range(3)], 1)
    bot = np.stack([np.convolve(np.pad(bot[:, c], 4, mode="edge"), k9, "valid") for c in range(3)], 1)
    for i, y in enumerate(range(Y0, Y1)):
        k = (i + 0.5) / (Y1 - Y0)
        a[y, X0:X1] = top * (1 - k) + bot * k


# ---- 1. Events and My Calendar --------------------------------------------------------------------
ev_before = cover_mark(load("cal-0-events"))
ev_after = cover_mark(load("cal-3-added"))
save(ev_before, "events-before")
save(ev_after, "events-after")
CARD = (833, 224, 576, 212)  # the Financial Modeling Bootcamp card, border to border
crop(ev_after, CARD, "cal-card")

cal_after = cover_mark(load("cal-6-calendar-event-week"))
save(cal_after, "cal-after")
BLOCK = (522, 500, 126, 87)  # the event's block on Sunday 25, 5 to 7 PM
crop(cal_after, BLOCK, "cal-block")
cal_before = cal_after.copy()
inpaint_rows(cal_before, 521, 649.5, 500, 587.5)
# the 5 PM and 6 PM lines, redrawn from the 4 PM line (CSS y 456) as a lift over its own ground
x0, x1 = 521 * D, int(649.5 * D)
line = cal_after[912:914, x0:x1] - (cal_after[906, x0:x1] + cal_after[920, x0:x1]) / 2
for y in (1000, 1088):
    cal_before[y:y + 2, x0:x1] += line
save(cal_before, "cal-before")

# ---- 2. Job Match ---------------------------------------------------------------------------------
job_before = cover_mark(load("job-0-list"))
job_after = cover_mark(load("job-1-goldman"))
save(job_before, "job-before")
save(job_after, "job-after")
job_blank = job_after.copy()
job_blank[425 * D:562 * D, 758 * D:1346 * D] = np.array([41, 29, 31], dtype=np.float64)
save(job_blank, "job-blank")

# ---- 3. Planner -----------------------------------------------------------------------------------
plan_before = cover_mark(load("spring-2-first-options"))
inpaint_rows(plan_before, 838, 1012, 689, 711)  # "See BMGT440 on Testudo"
save(plan_before, "plan-before")
added = cover_mark(load("spring-2-first-added"))
plan_after = plan_before.copy()
# left panel: before-coords x 250..650, y 160..720 come from after-coords 8 CSS px higher. Only what CHANGED is
# taken (the "1 class . 3 cr" header, the two blocks, the summary line): the page's ambient glow drifts between
# captures, so taking the whole panel would carry a visible box of warmer ground with it.
PX0, PX1, PY0, PY1 = 250 * D, 650 * D, 160 * D, 720 * D
src = added[PY0 - 8 * D:PY1 - 8 * D, PX0:PX1]
diff = np.abs(src - plan_after[PY0:PY1, PX0:PX1]).sum(2)
changed = diff > 70
changed[(655 - 160) * D:(702 - 160) * D, (262 - 250) * D:(632 - 250) * D] = True  # the whole summary line swaps
mask = Image.fromarray((changed * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(13))
mask = np.array(mask.filter(ImageFilter.GaussianBlur(3 * D))) / 255.0
mask = mask[:, :, None]
plan_after[PY0:PY1, PX0:PX1] = src * mask + plan_after[PY0:PY1, PX0:PX1] * (1 - mask)
save(plan_after, "plan-after")
ROW = (706, 400, 666, 56)  # "Tue and Thu, 2pm to 3:15pm  0301 . 40 open" with its review line
crop(plan_before, ROW, "plan-row")
TUE = (372, 532, 60, 37)  # BMGT440 2pm on Tuesday, in before-coords (after-coords y 524)
THU = (497, 532, 60, 37)
crop(plan_after, TUE, "plan-tue")
crop(plan_after, THU, "plan-thu")

print("boxes (CSS px): card", CARD, "block", BLOCK, "row", ROW, "tue", TUE, "thu", THU)
print("ground samples: card", ev_after[330 * D, 1200 * D], "block", cal_after[560 * D, 600 * D],
      "row", plan_before[440 * D, 1200 * D], "tue", plan_after[550 * D, 400 * D])
