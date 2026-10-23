#!/usr/bin/env node
/**
 * The final film, in one command (2026-10-23).
 *
 *   node scripts/make-film.mjs <id-or-path> [--aspect 4x5] [--cut 15|all]   one film (or a length cutdown), one aspect or all
 *   node scripts/make-film.mjs --all                            every bulk film, plus approved individual ones
 *   npm run make <id>          (npm eats flags: npm run make <id> -- --aspect 4x5, or npm run make -- --all)
 *
 * Runs the checker. In "individual" mode it refuses until the grey draft is approved. Then renders
 * composition `Film` from src/system/entry.ts once per aspect (default: every aspect the storyboard lists)
 * with the same quality settings as scripts/render.mjs (png frames, crf 12, slow preset, bt709, then the
 * stream-copy colour retag), to out/films/<id>-<aspect>.mp4, plus a contact sheet per file.
 *
 * --all reads ../films/<id>/storyboard.json for every folder whose name does not start with "_"
 * (so _sample and _archive are never made by accident).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { checkFilm, FILMS, printReport, sheetTimes, STUDIO } from "./check-film.mjs";
import { loudness } from "./loudness.mjs";

const ASPECTS = ["9x16", "4x5", "16x9", "1x1"];
const argv = process.argv.slice(2);
const aIdx = argv.indexOf("--aspect");
const aspectArg = aIdx !== -1 ? argv[aIdx + 1] : process.env.npm_config_aspect || null;
const all = argv.includes("--all") || process.env.npm_config_all === "true";
const cIdx = argv.indexOf("--cut");
const cutArg = cIdx !== -1 ? argv[cIdx + 1] : process.env.npm_config_cut || null;
const ids = argv.filter((a, i) => !a.startsWith("--") && !(aIdx !== -1 && i === aIdx + 1) && !(cIdx !== -1 && i === cIdx + 1));

if (!all && ids.length === 0) {
  console.error("usage: node scripts/make-film.mjs <id-or-path> [--aspect 4x5] [--cut 15|all] | --all");
  process.exit(2);
}
if (aspectArg && !ASPECTS.includes(aspectArg)) {
  console.error(`  --aspect ${aspectArg} is not one of ${ASPECTS.join(", ")}.`);
  process.exit(2);
}

const hasFfmpeg = spawnSync("which", ["ffmpeg"], { stdio: "ignore" }).status === 0;

/**
 * The stream-copy colour retag from scripts/render.mjs: no quality cost, players stop guessing. Uses the
 * system ffmpeg when there is one, else Remotion's bundled one (render.mjs skips the pass without a system
 * ffmpeg, which on this Mac meant it never ran).
 */
const tag = (out) => {
  const tagged = out.replace(/\.mp4$/, ".tagged.mp4");
  const args = ["-y", "-i", out, "-c", "copy", "-movflags", "+faststart", "-bsf:v",
    "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0", tagged];
  const t = hasFfmpeg
    ? spawnSync("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] })
    : spawnSync("npx", ["remotion", "ffmpeg", ...args], { cwd: STUDIO, stdio: ["ignore", "ignore", "pipe"] });
  if (t.status !== 0 || !existsSync(tagged)) return console.log("  Colour tagging failed; keeping the untagged render.");
  renameSync(tagged, out);
  console.log("  bt709 tagged, faststart");
};

/** Returns "made", "skipped" or "failed". From --all, an unapproved individual film is skipped, not failed. */
const make = (arg, { fromAll = false } = {}) => {
  const r = checkFilm(arg);
  printReport(r);
  if (!r.ok) return console.error("  Not made: fix the failures above first.\n"), "failed";
  const sb = r.sb;
  if (sb.mode === "individual" && sb.draftApproved !== true) {
    const msg = `  Not made: "${sb.id}" is an individual film and its grey draft is not approved. ` +
      `Run \`npm run draft ${sb.id}\` and set "draftApproved": true after Jacob's yes, or switch the storyboard to mode "bulk".\n`;
    if (fromAll) return console.log(msg), "skipped";
    return console.error(msg), "failed";
  }
  // --cut <name> makes one length cutdown; --cut all makes every cut in the storyboard. No --cut: the full film.
  const cutNames = !cutArg ? [null] : cutArg === "all" ? Object.keys(sb.cuts ?? {}) : [cutArg];
  for (const c of cutNames) if (c && !sb.cuts?.[c]) return console.error(`  Not made: "${sb.id}" has no cut "${c}".\n`), "failed";
  const aspects = aspectArg ? [aspectArg] : sb.aspects;
  if (aspectArg && !sb.aspects.includes(aspectArg)) console.log(`  ! ${aspectArg} is not in this storyboard's aspects; making it anyway.\n`);
  const dir = join(STUDIO, "out", "films");
  mkdirSync(dir, { recursive: true });
  for (const cut of cutNames) for (const aspect of aspects) {
    const base = cut ? `${sb.id}-${cut}-${aspect}` : `${sb.id}-${aspect}`;
    const props = join(dir, `${base}.props.json`);
    const out = join(dir, `${base}.mp4`);
    writeFileSync(props, JSON.stringify(cut ? { ...sb, aspect, cut } : { ...sb, aspect }, null, 2));
    console.log(`  film · ${base} · png frames, crf 12, slow, bt709\n`);
    const render = spawnSync("npx", ["remotion", "render", "src/system/entry.ts", "Film", out, `--props=${props}`,
      "--codec", "h264", "--image-format", "png", "--crf", "12", "--x264-preset", "slow", "--color-space", "bt709",
      "--pixel-format", "yuv420p", "--audio-bitrate", "320k"], { cwd: STUDIO, stdio: "inherit" });
    if (render.status !== 0) return console.error(`  Render failed for ${base}.\n`), "failed";
    tag(out);
    loudness(out);
    const sheet = join(dir, `${base}-sheet.png`);
    const s = spawnSync("node", [join(STUDIO, "..", "capture", "sheet.mjs"), out, sheet, sheetTimes(sb).join(",")], { cwd: STUDIO, stdio: "inherit" });
    if (s.status !== 0) console.error("  The contact sheet failed; the film is still there.");
    console.log(`\n  film   ${out}\n  sheet  ${sheet}\n`);
  }
  return "made";
};

const targets = all
  ? readdirSync(FILMS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && existsSync(join(FILMS, d.name, "storyboard.json")))
    .map((d) => d.name)
  : ids;
if (all) console.log(`\n  --all: ${targets.length} storyboard${targets.length === 1 ? "" : "s"} under ${FILMS}${targets.length ? ": " + targets.join(", ") : ""}`);

const results = targets.map((t) => [t, make(t, { fromAll: all })]);
if (results.length > 1 || all) {
  console.log("  Summary");
  for (const [t, res] of results) console.log(`  ${res === "made" ? "✓" : res === "skipped" ? "·" : "✗"} ${t}: ${res}`);
  console.log("");
}
process.exit(results.some(([, res]) => res === "failed") ? 1 : 0);
