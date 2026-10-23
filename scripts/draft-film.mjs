#!/usr/bin/env node
/**
 * The grey draft, in one command (2026-10-23).
 *
 *   node scripts/draft-film.mjs <id-or-path>        npm run draft <id>
 *
 * Runs the checker (stops on any failure), writes the storyboard as a props file, renders composition
 * `Draft` from src/system/entry.ts to out/drafts/<id>.mp4 at a fast setting (jpeg frames, crf 23; it is
 * a review copy, not a film), then a contact sheet out/drafts/<id>-sheet.png with one frame per shot
 * plus the end card. In "individual" mode this is what Jacob says yes to before `npm run make`.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { checkFilm, printReport, sheetTimes, STUDIO } from "./check-film.mjs";

const arg = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!arg) {
  console.error("usage: node scripts/draft-film.mjs <id-or-path>   (npm run draft <id>)");
  process.exit(2);
}

const r = checkFilm(arg);
printReport(r);
if (!r.ok) {
  console.error("  No draft: fix the failures above first.\n");
  process.exit(1);
}

const sb = r.sb;
const dir = join(STUDIO, "out", "drafts");
mkdirSync(dir, { recursive: true });
const props = join(dir, `${sb.id}.props.json`);
const video = join(dir, `${sb.id}.mp4`);
const sheet = join(dir, `${sb.id}-sheet.png`);
writeFileSync(props, JSON.stringify(sb, null, 2));

console.log(`  draft · ${sb.id} · ${sb.aspects[0]} · jpeg frames, crf 23\n`);
const render = spawnSync(
  "npx",
  ["remotion", "render", "src/system/entry.ts", "Draft", video, `--props=${props}`,
    "--codec", "h264", "--image-format", "jpeg", "--crf", "23", "--pixel-format", "yuv420p"],
  { cwd: STUDIO, stdio: "inherit" },
);
if (render.status !== 0) process.exit(render.status ?? 1);

const sh = spawnSync("node", [join(STUDIO, "..", "capture", "sheet.mjs"), video, sheet, sheetTimes(sb).join(",")], { cwd: STUDIO, stdio: "inherit" });
if (sh.status !== 0) console.error("  The contact sheet failed; the draft video is still there.");

console.log(`\n  draft  ${video}\n  sheet  ${sheet}\n`);
if (sb.mode === "individual" && sb.draftApproved !== true)
  console.log(`  After Jacob's yes, set "draftApproved": true in the storyboard, then npm run make ${sb.id}.\n`);
