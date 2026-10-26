# Copies the round 4 kit previews into public/r4/reel/ and writes reel.json (order, numbers, names,
# plain-words notes, lengths and sizes) for reel.tsx. Run from the studio folder:
#   python3 src/kit/r4/make-reel.py
import json, shutil, subprocess, os

PARTS = [
    (1, "Card opens the page", "A real card grows into the next page", ["R4-CardOpensPage"]),
    (2, "Button opens the page", "My Calendar opens through the button's own shape", ["R4-MaskHandoff"]),
    (3, "Deck swap", "One page slides under as the next deals on top", ["R4-DeckSwap"]),
    (4, "Feature tag", "The control's outline becomes the feature name below", ["R4-FeatureTag"]),
    (5, "Chapter mark", "The nav row grows into the chapter title and flies back", ["R4-ChapterMark"]),
    (6, "Question hook", "A real question typed into the real Ask field", ["R4-QuestionHook"]),
    (7, "Stat line", "A true number counts in and lands on the page", ["R4-StatLine"]),
    (8, "Spotlight", "The page dims, one thing stays lit", ["R4-Spotlight"]),
    (9, "Drawn mark", "A hand-drawn circle, underline and arrow", ["R4-DrawnMark"]),
    (10, "Loupe", "A magnifier reads the small text", ["R4-Loupe"]),
    (11, "Press mark", "The press, then a line to where it landed", ["R4-PressMark"]),
    (12, "List re-rank", "Sort by Newest and the cards really move", ["R4-ListReRank"]),
    (13, "Blocks land", "The button flies down and becomes its calendar block", ["R4-BlocksLand"]),
    (14, "Tally roll", "Each event lands, then the count rolls", ["R4-TallyRoll"]),
]

os.makedirs("public/r4/reel", exist_ok=True)
out = []
for n, name, note, ids in PARTS:
    for i in ids:
        src = f"out/r4/{i}.mp4"
        if not os.path.exists(src):
            print("missing", src); continue
        shutil.copy(src, f"public/r4/reel/{i}.mp4")
        p = json.loads(subprocess.check_output(["npx", "remotion", "ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", src]))
        st = p["streams"][0]
        out.append({"n": n, "name": name, "note": note, "file": f"{i}.mp4", "seconds": round(float(p["format"]["duration"]), 2), "w": st["width"], "h": st["height"]})
json.dump(out, open("public/r4/reel/reel.json", "w"), indent=1)
print(len(out), "clips,", round(sum(c["seconds"] for c in out), 1), "s")
