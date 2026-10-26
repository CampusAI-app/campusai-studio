#!/usr/bin/env node
/**
 * Export a single frame as a PNG.
 *
 *   npm run still HeroStill-4x5
 *   node scripts/still.mjs ChatAsk-16x9 out/check/cta.png --frame 505
 *
 * Two jobs, and they are worth keeping in one command:
 *
 *   1. The hero stills, which are a real deliverable — an image for a feed, a
 *      deck or a press kit that costs one frame instead of a render.
 *   2. Checking a film. Looking at an actual exported frame is the only way any
 *      claim about how a beat looks gets made honestly around here, and the
 *      default output path puts those in out/check/ so they never get confused
 *      with something shippable.
 *
 * PNG always. A still that will be looked at closely has no business being
 * JPEG, and `--image-format png` is already the studio default anyway.
 */
import { spawnSync } from "node:child_process";
import { REMOTION } from "./remotion-cli.mjs";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const composition = positional[0];

if (!composition) {
  console.error(
    "usage: node scripts/still.mjs <CompositionId> [outfile] [--frame N]\n" +
      "example: npm run still HeroStill-4x5",
  );
  process.exit(2);
}

const frameIndex = argv.indexOf("--frame");
const frame = frameIndex !== -1 && argv[frameIndex + 1] ? argv[frameIndex + 1] : "0";

// A hero still is a deliverable and belongs in out/. A frame pulled out of a
// film is evidence and belongs in out/check/.
const isHero = composition.toLowerCase().startsWith("hero");
const fallback = isHero
  ? join("out", `${composition}.png`)
  : join("out", "check", `${composition}-f${frame}.png`);
const out = positional[1] ?? fallback;

mkdirSync(dirname(out), { recursive: true });

console.log(`\n  still · ${composition} @ frame ${frame} → ${out}\n`);

const r = spawnSync(
  process.execPath,
  [REMOTION, "still", composition, out, "--frame", frame, "--image-format", "png"],
  { stdio: "inherit" },
);

process.exit(r.status ?? 1);
