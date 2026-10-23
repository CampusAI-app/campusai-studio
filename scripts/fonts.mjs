#!/usr/bin/env node
/**
 * Downloads the Zodiak font files the four launch films need (src/kit/parts.tsx, useZodiak).
 *
 *   npm run fonts
 *
 * Zodiak is by Indian Type Foundry, free from Fontshare under the ITF Free Font License. That
 * licence lets us use it in videos but not redistribute the font files, so they are not in this
 * repo (public/fonts/Zodiak-*.woff2 is gitignored) and every machine fetches its own copy.
 *
 * What it writes, matching what useZodiak loads:
 *   public/fonts/Zodiak-Bold.woff2    weight 700, normal
 *   public/fonts/Zodiak-Italic.woff2  weight 400, italic
 *
 * Safe to run again: files already present are left alone. Pass --force to download them anew.
 */
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "fonts");
const CSS = "https://api.fontshare.com/v2/css?f[]=zodiak@700,401&display=swap";
const WANT = [
  { file: "Zodiak-Bold.woff2", weight: "700", style: "normal" },
  { file: "Zodiak-Italic.woff2", weight: "400", style: "italic" },
];
const force = process.argv.includes("--force");

const fail = (msg) => {
  console.error(`\nfonts: ${msg}`);
  console.error("The four films (Spotlight, Swap, Week, Registration) stop with an error until these files are in place.");
  console.error("To fix by hand: download Zodiak from https://www.fontshare.com/fonts/zodiak and save the Bold and Italic");
  console.error(`woff2 files as ${WANT.map((w) => w.file).join(" and ")} in ${OUT}\n`);
  process.exit(1);
};

const missing = WANT.filter((w) => force || !existsSync(join(OUT, w.file)) || statSync(join(OUT, w.file)).size === 0);
if (missing.length === 0) {
  console.log(`fonts: Zodiak already in ${OUT}, nothing to do (use --force to download again).`);
  process.exit(0);
}

let css;
try {
  const res = await fetch(CSS, { headers: { "user-agent": "Mozilla/5.0 (campusai-video-studio fonts script)" } });
  if (!res.ok) fail(`Fontshare answered ${res.status} for its stylesheet.`);
  css = await res.text();
} catch (e) {
  fail(`could not reach Fontshare (${e.message}). Are you online?`);
}

// One @font-face per weight/style. Take the woff2 url out of the block that matches each file.
const blocks = css.split("@font-face").slice(1);
const urlFor = ({ weight, style }) => {
  const block = blocks.find((b) => new RegExp(`font-weight:\\s*${weight}\\b`).test(b) && new RegExp(`font-style:\\s*${style}\\b`).test(b));
  const m = block?.match(/url\('([^']+\.woff2)'\)/);
  return m ? (m[1].startsWith("//") ? `https:${m[1]}` : m[1]) : null;
};

mkdirSync(OUT, { recursive: true });
for (const w of missing) {
  const url = urlFor(w);
  if (!url) fail(`Fontshare's stylesheet had no woff2 for Zodiak ${w.weight} ${w.style}; its format may have changed.`);
  try {
    const res = await fetch(url);
    if (!res.ok) fail(`download of ${w.file} failed with ${res.status}.`);
    const buf = Buffer.from(await res.arrayBuffer());
    // woff2 files start with the bytes "wOF2"; anything else is an error page.
    if (buf.length < 1000 || buf.subarray(0, 4).toString("latin1") !== "wOF2") fail(`${w.file} did not come back as a woff2 file.`);
    writeFileSync(join(OUT, w.file), buf);
    console.log(`fonts: saved ${w.file} (${Math.round(buf.length / 1024)} KB)`);
  } catch (e) {
    fail(`download of ${w.file} failed (${e.message}).`);
  }
}
console.log("fonts: done.");
