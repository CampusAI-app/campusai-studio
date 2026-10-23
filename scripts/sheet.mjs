/** Contact sheet so I can actually SEE a film, one labelled frame per beat on one image.
 *  From a rendered video:   npm run sheet -- <video> <out.png> <t1,t2,...>            (times in seconds)
 *  Before any full render:  npm run sheet -- --comp <Composition> <out.png> <f1,f2,...> [--fps=30]
 *                           (frames, rendered as stills straight from the source, so a sheet
 *                           costs seconds instead of a full export) */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const studio = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2);
const isComp = args[0] === "--comp";
const fps = Number((args.find(a => a.startsWith("--fps=")) ?? "--fps=30").slice(6));
const [source, out, list] = (isComp ? args.slice(1) : args).filter(a => !a.startsWith("--fps="));
const points = list.split(",").map(Number);
const tmp = mkdtempSync(path.join(tmpdir(), "sheet-"));
const labels = isComp ? points.map(f => `f${f}  ${(f / fps).toFixed(1)}s`) : points.map(t => `${t}s`);
points.forEach((p, i) => {
  const file = path.join(tmp, `f${String(i).padStart(2, "0")}.png`);
  const cmd = isComp
    ? ["remotion", "still", "src/index.ts", source, file, `--frame=${p}`, "--scale=0.5"]
    : ["remotion", "ffmpeg", "-y", "-ss", String(p), "-i", source, "-frames:v", "1", file];
  execFileSync("npx", cmd, { cwd: studio, stdio: "ignore" });
});
execFileSync("python3", ["-c", `
import sys, glob, json
from PIL import Image, ImageDraw
files = sorted(glob.glob("${tmp}/*.png"))
labels = json.loads(sys.argv[1])
ims = [Image.open(f).convert("RGB") for f in files]
# Portrait films get narrower tiles so a 9x16 sheet stays readable on one screen.
tw = 320 if ims[0].height > ims[0].width else 640
ims = [im.resize((tw, round(im.height * tw / im.width))) for im in ims]
w, h = ims[0].size
cols = 4 if tw == 320 else 3
rows = (len(ims) + cols - 1) // cols
pad = 22
sheet = Image.new("RGB", (cols*w, rows*(h+pad)), (18,18,20))
d = ImageDraw.Draw(sheet)
for i, im in enumerate(ims):
    x, y = (i % cols)*w, (i // cols)*(h+pad)
    sheet.paste(im, (x, y+pad))
    d.text((x+8, y+6), labels[i], fill=(235,235,235))
sheet.save("${out}")
print("sheet:", sheet.size, len(ims), "frames")
`, JSON.stringify(labels)], { stdio: "inherit" });
rmSync(tmp, { recursive: true, force: true });
