# Copies the motion pass previews into public/pass/reel/ and writes reel.json (order, numbers, names,
# plain-words notes, lengths and sizes) for reel.tsx. Run from the studio folder:
#   python3 src/kit/pass/make-reel.py
import json, shutil, subprocess, os

PARTS = [
    (1, "Slow glide", "Real pages glide past, tilted, one at a time", ["Pass-SlowGlide"]),
    (2, "Crane rise", "Starts on one row, rises to the whole page", ["Pass-CraneRise"]),
    (3, "Focus walk", "One screen held, the camera walks part to part", ["Pass-FocusWalk"]),
    (4, "Laptop in a place", "The real laptop, lit by a lamp, then at night", ["Pass-LaptopRoom", "Pass-LaptopRoomNight"]),
    (5, "Exploded page", "A real page comes apart in layers, then snaps back", ["Pass-ExplodedPage"]),
    (6, "Honest typing", "Typed, hesitated, deleted, retyped, then the real answer", ["Pass-HonestTyping"]),
    (7, "Answer becomes the page", "What the answer names opens as its real page", ["Pass-AnswerToPage"]),
    (8, "The red dot", "CampusAI as a dot, landing on what it picked", ["Pass-RedDot"]),
    (9, "Word swap", "Big words swap in, then the product rises", ["Pass-WordSwap"]),
    (10, "Product inside the letters", "The real product plays inside the word (wide)", ["Pass-ProductInLetters"]),
    (11, "Name into logo", "Two endings: a shimmer, and Apply turning into the logo", ["Pass-NameToLogo", "Pass-NameToLogoFromElement"]),
    (12, "Circle handoff", "The bell opens into the page it leads to", ["Pass-CircleHandoff"]),
    (13, "Role card", "A real job card lifts off with its reason and chips", ["Pass-RoleCard"]),
    (14, "Score fill", "Profile strength fills as real steps land", ["Pass-ScoreFill"]),
    (15, "One shape", "One shape becomes each real button, then the logo", ["Pass-ShapeMorph"]),
]

os.makedirs("public/pass/reel", exist_ok=True)
out = []
for n, name, note, ids in PARTS:
    for i in ids:
        src = f"out/pass/{i}.mp4"
        if not os.path.exists(src):
            print("missing", src); continue
        shutil.copy(src, f"public/pass/reel/{i}.mp4")
        p = json.loads(subprocess.check_output(["npx", "remotion", "ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", src]))
        st = p["streams"][0]
        out.append({"n": n, "name": name, "note": note, "file": f"{i}.mp4", "seconds": round(float(p["format"]["duration"]), 2), "w": st["width"], "h": st["height"]})
json.dump(out, open("public/pass/reel/reel.json", "w"), indent=1)
print(len(out), "clips,", round(sum(c["seconds"] for c in out), 1), "s")
