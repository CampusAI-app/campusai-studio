#!/usr/bin/env node
/**
 * The studio's export pipeline, in one command.
 *
 *   node scripts/render.mjs <CompositionId> [outfile] [--crf N] [--no-tag]
 *   npm run film ChatAsk-16x9
 *
 * Why this exists rather than a flag list someone has to remember: the default
 * `remotion render` produced visibly softer text than the same film exported
 * properly, and the difference is six flags plus a second pass. A pipeline you
 * have to retype is a pipeline that gets skipped at 1am before a launch.
 *
 * Adapted from Nutlope/inspo's teaser/RENDER.md (MIT). Their reasoning, checked
 * against our own footage, not their numbers taken on faith.
 *
 * What each setting is doing:
 *
 *   --image-format png   The one that matters most, and it is set in
 *                        remotion.config.ts so the Studio preview matches.
 *                        JPEG-80 frames put artefacts on fine text before the
 *                        encoder runs.
 *   --crf 12             Practical ceiling. The real remaining loss is 4:2:0
 *                        chroma subsampling, not bitrate, and 4:2:0 is not
 *                        negotiable: it is what plays everywhere, and every
 *                        social platform re-encodes to it regardless.
 *   --x264-preset slow   Spends encode time instead of bitrate.
 *   --color-space bt709  Sets the matrix. It does NOT set primaries or
 *                        transfer, which is why the second pass exists.
 *   --audio-bitrate 320k Cheap, and our sfx cues are quiet enough that codec
 *                        noise would sit right on top of them.
 *
 * The second pass is a STREAM COPY. It re-tags the colour flags h264 left
 * unset so players stop guessing, and costs no quality and almost no time.
 * Untagged video is the usual reason a dark film looks washed out or crushed on
 * someone else's screen, which for us is every film we make.
 *
 * Skip it with --no-tag if ffmpeg is missing; the mp4 is still valid, just
 * untagged.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const positional = argv.filter((a) => !a.startsWith("--"));

const composition = positional[0];
if (!composition) {
  console.error(
    "usage: node scripts/render.mjs <CompositionId> [outfile] [--crf N] [--no-tag]\n" +
      "example: node scripts/render.mjs ChatAsk-16x9",
  );
  process.exit(2);
}

const crfIndex = argv.indexOf("--crf");
const crf = crfIndex !== -1 && argv[crfIndex + 1] ? argv[crfIndex + 1] : "12";
const out = positional[1] ?? join("out", `${composition}.mp4`);

mkdirSync(dirname(out), { recursive: true });

const renderArgs = [
  "remotion",
  "render",
  composition,
  out,
  "--codec",
  "h264",
  "--image-format",
  "png",
  "--crf",
  crf,
  "--x264-preset",
  "slow",
  "--color-space",
  "bt709",
  "--pixel-format",
  "yuv420p",
  "--audio-bitrate",
  "320k",
];

console.log(`\n  render · ${composition} → ${out} · crf ${crf} · png frames\n`);
const render = spawnSync("npx", renderArgs, { stdio: "inherit" });
if (render.status !== 0) process.exit(render.status ?? 1);

if (flags.has("--no-tag")) {
  console.log("\n  colour tagging skipped (--no-tag)\n");
  process.exit(0);
}

const hasFfmpeg = spawnSync("which", ["ffmpeg"], { stdio: "ignore" }).status === 0;
if (!hasFfmpeg) {
  console.log(
    "\n  ffmpeg not found — skipping the colour-tag pass.\n" +
      "  The mp4 is valid but its colour flags are unset, so players guess.\n",
  );
  process.exit(0);
}

const tagged = out.replace(/\.mp4$/, ".tagged.mp4");
const tag = spawnSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    out,
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    "-bsf:v",
    "h264_metadata=colour_primaries=1:transfer_characteristics=1:" +
      "matrix_coefficients=1:video_full_range_flag=0",
    tagged,
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);

if (tag.status !== 0 || !existsSync(tagged)) {
  console.log(
    "\n  colour tagging failed — keeping the untagged render.\n" +
      `  ${(tag.stderr?.toString() ?? "").trim().split("\n").slice(-3).join("\n  ")}\n`,
  );
  process.exit(0);
}

renameSync(tagged, out);
console.log(`\n  done · ${out} · bt709 tagged, faststart\n`);
