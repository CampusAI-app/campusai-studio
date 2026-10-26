#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { REMOTION } from "./remotion-cli.mjs";
import { existsSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const STUDIO = join(dirname(fileURLToPath(import.meta.url)), "..");
/**
 * Loudness: two-pass EBU R128 to -14 LUFS with true peak under -1.5 dBTP (2026-10-23). Score's mix lands near
 * -16.5 LUFS and can touch 0 dBTP, because nothing in the render chain limits. Video is stream-copied; only the
 * audio is re-encoded, so the picture is untouched. Skipped for a silent film.
 */
const hasFfmpeg = spawnSync("which", ["ffmpeg"], { stdio: "ignore" }).status === 0;
const ffmpeg = (args) => hasFfmpeg
  ? spawnSync("ffmpeg", args, { encoding: "utf8" })
  : spawnSync(process.execPath, [REMOTION, "ffmpeg", ...args], { cwd: STUDIO, encoding: "utf8" });
export const loudness = (out) => {
  const probe = ffmpeg(["-hide_banner", "-i", out]);
  if (!/Audio:/.test(probe.stderr ?? "")) return console.log("  Silent film, no loudness pass.");
  const target = "I=-14:TP=-1.5:LRA=11";
  const first = ffmpeg(["-hide_banner", "-i", out, "-vn", "-af", `loudnorm=${target}:print_format=json`, "-c:a", "pcm_s16le", "-f", "null", "-"]);
  const m = (first.stderr ?? "").match(/\{[\s\S]*?"input_i"[\s\S]*?\}/);
  if (!m) return console.log("  Loudness measure failed; keeping the mix as rendered.");
  const j = JSON.parse(m[0]);
  const norm = `loudnorm=${target}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}` +
    `:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  const tmp = out.replace(/\.mp4$/, ".loud.mp4");
  const second = ffmpeg(["-hide_banner", "-y", "-i", out, "-c:v", "copy", "-af", `${norm},aresample=48000`,
    "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", tmp]);
  if (second.status !== 0 || !existsSync(tmp)) return console.log("  Loudness pass failed; keeping the mix as rendered.");
  renameSync(tmp, out);
  console.log(`  loudness ${j.input_i} LUFS / ${j.input_tp} dBTP -> -14 LUFS, true peak under -1.5`);
};


// node scripts/loudness.mjs <file.mp4>: run the pass on a finished render by hand.
if (process.argv[1] && process.argv[1].endsWith("loudness.mjs") && process.argv[2]) loudness(process.argv[2]);
