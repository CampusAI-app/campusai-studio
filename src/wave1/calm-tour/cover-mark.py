"""The calm tour: copies of the pass captures with the Maryland "M" (and the divider before it)
painted out in the sidebar's own colour, because these pages are shown whole (sidebar in) on the
laptop glass and on the glide cards, where no DOM patch can sit. Same box as the kit's PASS_MARK
(CSS x 116 to 156, y 10 to 46), widened left to 110 to take the divider. Run from the studio folder:
  python3 src/wave1/calm-tour/cover-mark.py"""
from PIL import Image

SRC = {"dashboard": "public/pass/dashboard.jpg", "jobmatch": "public/pass/jobmatch.jpg",
       "calendar": "public/pass/calendar.jpg", "chat-answer": "public/pass/chat/chat-answer.jpg"}
X0, Y0, X1, Y1 = 110, 10, 156, 46
for name, path in SRC.items():
    im = Image.open(path).convert("RGB")
    color = im.getpixel((165 * 2, 28 * 2))  # flat sidebar ground right of the mark
    im.paste(color, (X0 * 2, Y0 * 2, X1 * 2, Y1 * 2))
    im.save(f"public/w1/calm-tour/{name}.jpg", quality=95)
    print(name, color)
