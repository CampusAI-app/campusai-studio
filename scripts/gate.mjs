// The motion gate (2026-11-18): step a composition frame by frame and print the faults that are never
// intentional, then one pass/fail line. Runs before the critic (skill/review.md).
//
//   npm run gate <CompositionId>                         from src/index.ts (Root.tsx)
//   npm run gate <CompositionId> -- --entry src/x/entry.ts   a film with its own entry file
//   options: --from N --to N   a stretch of frames (the hardest seconds)
//            --loop            also judge the seam from the last frame back to the first
//            --public <dir>    another public/ to read assets from (a worktree whose captures live elsewhere)
//            --dump <file>     write every frame's geometry as JSON, to look at a finding closely
//            --strip <dir>     also save every stepped frame as a JPEG there, to look at a finding frame by frame
//
// How: the composition is bundled, served on localhost and opened in headless Chrome the way Remotion's
// own renderer drives it (remotion_setFrame, then wait for renderReady), so every frame is the exact frame
// a render would draw. After each frame the page records the box of every visible element. Then:
//
//   jump              moves or resizes more than 2 px in one frame while still the frames around it
//   appears with no entrance / vanishes with no exit
//                     shows (or goes) whole in one frame: full opacity, full size, nothing fading, growing,
//                     blurring, clipping or sliding it in, nothing covering it, not part of a hard cut
//   settle snap       came to rest after moving, then hopped half a pixel or more with nothing moving it
//   handoff shift     one element is swapped for an identical one that is drawn up to 6 px off
//   drift             two neighbours in a column glide out of step (their gap wobbles for 4+ frames)
//
// Notes, not faults: hard cuts (most of a scene swaps in one frame: fine when the cut is the edit) and
// recorded footage. A recording (`npm run chat` / `npm run flow` frames played by an <Img>) is one box to
// this gate: it judges the box (camera moves, crops, the footage layer arriving and leaving) and reports the
// footage's cadence (how many film frames each recorded frame holds), but it cannot see motion INSIDE the
// recorded pixels (a thread that jolts while it scrolls, a loader popping in). Check those on a frame strip.
//
// Exempt on purpose: anything inside [data-snap], [data-typing] or [data-gate-skip] (typed letters, carets,
// a counter that steps). Mark it in the film, never loosen the gate.
//
// Ported from Stageshow by Benji Taylor (github.com/benjitaylor/skills, stageshow/, commit 299140f), MIT:
// scripts/jumps-core.mjs (jump and drift analysis, near verbatim) and scripts/motion-watch.mjs (the pop,
// settle snap and handoff checks, rewritten to read recorded frames because a Remotion frame has no running
// CSS animations to ask). The licence:
//
//   MIT License. Copyright (c) 2026 Benji Taylor. Permission is hereby granted, free of charge, to any
//   person obtaining a copy of this software and associated documentation files (the "Software"), to deal
//   in the Software without restriction, including without limitation the rights to use, copy, modify,
//   merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to
//   whom the Software is furnished to do so, subject to the following conditions: The above copyright
//   notice and this permission notice shall be included in all copies or substantial portions of the
//   Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
//   INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
//   NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
//   OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
//   CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { REMOTION } from "./remotion-cli.mjs";

const STUDIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const takesValue = new Set(["--entry", "--from", "--to", "--public", "--dump", "--strip"]);
const positional = argv.filter((a, i) => !a.startsWith("--") && !takesValue.has(argv[i - 1]));
const comp = positional[0];
if (!comp) {
  console.error("Usage: npm run gate <CompositionId> [-- --entry src/x/entry.ts --from N --to N --loop --public <dir>]");
  process.exit(2);
}
const entry = opt("entry", "src/index.ts");
const loop = argv.includes("--loop");
const publics = [path.join(STUDIO, "public"), ...(opt("public") ? [path.resolve(opt("public"))] : [])];

// 1. Bundle (Remotion's own bundler, with remotion.config.ts). public/ is served, not copied: it can be huge.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gate-"));
const bundleDir = path.join(tmp, "bundle");
const emptyPublic = path.join(tmp, "public");
fs.mkdirSync(emptyPublic);
const built = spawnSync(process.execPath, [REMOTION, "bundle", entry, "--out-dir", bundleDir, "--public-dir", emptyPublic], {
  cwd: STUDIO,
  encoding: "utf8",
});
if (built.status !== 0) {
  console.error(built.stdout + built.stderr);
  process.exit(1);
}

// 2. Serve it. /public/<file> reads from the studio's public/ (then --public).
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".woff2": "font/woff2",
  ".woff": "font/woff", ".ttf": "font/ttf", ".otf": "font/otf", ".mp4": "video/mp4", ".webm": "video/webm", ".mp3": "audio/mpeg",
  ".wav": "audio/wav", ".m4a": "audio/mp4", ".ico": "image/x-icon", ".map": "application/json" };
const inside = (root, p) => {
  const full = path.resolve(root, p);
  return full === root || full.startsWith(root + path.sep) ? full : null;
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const candidates = url.startsWith("/public/")
    ? publics.map((r) => inside(r, url.slice("/public/".length)))
    : [inside(bundleDir, url === "/" ? "index.html" : url.slice(1))];
  const file = candidates.find((f) => f && fs.existsSync(f) && fs.statSync(f).isFile());
  if (!file) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// 3. Open it the way Remotion's renderer does.
const browser = await chromium.launch({ channel: process.env.CHROME ? undefined : "chrome", executablePath: process.env.CHROME, headless: true });
let frames = [];
let meta;
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.remotion_isMainTab = true;
    window.remotion_inputProps = "{}";
    window.remotion_initialFrame = 0;
    window.remotion_attempt = 1;
    window.remotion_audioEnabled = false;
    window.remotion_videoEnabled = true;
    window.remotion_logLevel = "error";
    window.process = window.process || {};
    window.process.env = { ...(window.process.env || {}), NODE_ENV: "production" };
  });
  const ready = (timeout = 60000) =>
    page.waitForFunction(() => window.remotion_renderReady === true || window.remotion_cancelledError !== undefined, null, { timeout, polling: 5 });
  const failIfCancelled = async () => {
    const err = await page.evaluate(() => window.remotion_cancelledError);
    if (err) throw new Error(`The composition stopped itself: ${String(err).split("\n")[0]}`);
  };
  await page.goto(BASE + "/index.html", { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.remotion_setBundleMode === "function", null, { timeout: 60000 });
  await page.evaluate(() => window.remotion_setBundleMode({ type: "evaluation" }));
  await ready();
  const ids = await page.evaluate(async () => (window.getStaticCompositions ? (await window.getStaticCompositions()).map((c) => c.id) : []));
  if (ids.length && !ids.includes(comp)) {
    throw new Error(`No composition "${comp}" in ${entry}. A film with its own entry file needs --entry. Here: ${ids.slice(0, 40).join(", ")}${ids.length > 40 ? ", ..." : ""}`);
  }
  meta = await page.evaluate(async (id) => await window.remotion_calculateComposition(id), comp);
  await page.setViewportSize({ width: meta.width, height: meta.height });
  await page.evaluate((m) => {
    window.remotion_setBundleMode({
      type: "composition",
      compositionName: m.id,
      serializedResolvedPropsWithSchema: m.serializedResolvedPropsWithCustomSchema,
      compositionDurationInFrames: m.durationInFrames,
      compositionFps: m.fps,
      compositionHeight: m.height,
      compositionWidth: m.width,
      compositionDefaultCodec: m.defaultCodec,
      compositionDefaultOutName: m.defaultOutName,
      compositionDefaultVideoImageFormat: m.defaultVideoImageFormat,
      compositionDefaultPixelFormat: m.defaultPixelFormat,
      compositionDefaultProResProfile: m.defaultProResProfile,
      compositionDefaultSampleRate: m.defaultSampleRate,
    });
  }, meta);
  await ready();
  await failIfCancelled();
  await page.evaluate(installRecorder);

  const from = Math.max(0, +opt("from", 0));
  const to = Math.min(meta.durationInFrames - 1, +opt("to", meta.durationInFrames - 1));
  const list = [];
  for (let f = from; f <= to; f++) list.push(f);
  if (loop && from === 0 && to === meta.durationInFrames - 1) list.push(0);
  const t0 = Date.now();
  for (const [n, f] of list.entries()) {
    await page.evaluate(([f, id]) => window.remotion_setFrame(f, id, 1), [f, comp]);
    await ready();
    await failIfCancelled();
    await page.evaluate(() => document.fonts.ready);
    const rec = await page.evaluate(() => window.__gateRecord());
    if (opt("strip")) {
      fs.mkdirSync(opt("strip"), { recursive: true });
      await page.screenshot({ path: path.join(opt("strip"), `f${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 85 });
    }
    frames.push({ f, seam: n === list.length - 1 && loop && f === 0, ...rec });
    if (n && n % 150 === 0) process.stdout.write(`  stepped ${n} of ${list.length} frames (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
  }
} catch (e) {
  console.error(`gate: could not step ${comp}: ${e.message.split("\n")[0]}`);
  if (errors.length) console.error("page errors:\n  " + errors.slice(0, 5).join("\n  "));
  await browser.close();
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(1);
}
await browser.close();
server.close();
fs.rmSync(tmp, { recursive: true, force: true });
if (opt("dump")) fs.writeFileSync(opt("dump"), JSON.stringify({ meta: { id: comp, width: meta.width, height: meta.height, fps: meta.fps }, frames }));

const { faults, notes } = analyse(frames, meta.fps);
console.log(`\ngate · ${comp} · ${meta.width}x${meta.height} · ${meta.fps} fps · frames ${frames[0].f} to ${frames.at(-1).f}${loop ? " and the loop seam" : ""} (${frames.length} stepped)`);
if (faults.length) {
  console.log("\nfaults (never intentional):");
  for (const l of faults) console.log("  " + l);
}
if (notes.length) {
  console.log("\nnotes (look, then decide):");
  for (const l of notes) console.log("  " + l);
}
console.log(`\ngate: ${faults.length ? "FAIL" : "PASS"} · ${faults.length} fault${faults.length === 1 ? "" : "s"} · ${comp}`);
process.exit(faults.length ? 1 : 0);

// ---------------------------------------------------------------------------------------------------------
// In the page: the box of every visible element, this frame. Element identity carries across frames (the
// page is never reloaded), so an element that is the same DOM node in two frames is the same element.
function installRecorder() {
  const ids = new WeakMap();
  let n = 0;
  let lastSeen = new Set();
  const label = (el) => {
    const tag = el.tagName.toLowerCase();
    const cls = typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/)[0] : "";
    if (tag === "img") return `img ${(el.getAttribute("src") || "").replace(/^.*\/public\//, "").replace(/[^/]*$/, "") || "(no src)"}`;
    // its own words; a box with none is named by what it holds
    const own = [...el.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join(" ").trim().replace(/\s+/g, " ").slice(0, 28);
    const held = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28);
    return `${tag}${cls}${own ? ` "${own}"` : held ? ` holding "${held}"` : ""}`;
  };
  const id = (el) => {
    if (!ids.has(el)) ids.set(el, { n: n++, name: label(el) });
    return ids.get(el);
  };
  window.__gateRecord = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const items = [];
    const seen = new Set();
    // top-down: opacity, clip box, softening (blur / clip-path / mask) and the nearest recorded ancestor
    const st = new Map();
    const rootState = { o: 1, clip: { l: 0, t: 0, r: W, b: H }, soft: false, rec: -1, skip: false };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    for (let el = walker.nextNode(); el; el = walker.nextNode()) {
      const tag = el.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "link" || tag === "meta") continue;
      const ps = st.get(el.parentElement) || rootState;
      const inSvg = el.parentElement && el.parentElement.closest("svg");
      if (inSvg) {
        st.set(el, ps);
        continue;
      }
      const cs = getComputedStyle(el);
      const hidden = cs.visibility === "hidden" || cs.display === "none";
      const o = ps.o * Number(cs.opacity) * (hidden ? 0 : 1);
      const r = el.getBoundingClientRect();
      const clips = cs.overflowX !== "visible" || cs.overflowY !== "visible" || cs.clipPath !== "none";
      const clip = clips
        ? { l: Math.max(ps.clip.l, r.left), t: Math.max(ps.clip.t, r.top), r: Math.min(ps.clip.r, r.right), b: Math.min(ps.clip.b, r.bottom) }
        : ps.clip;
      const masked = (cs.maskImage && cs.maskImage !== "none") || (cs.webkitMaskImage && cs.webkitMaskImage !== "none");
      const blurred = /blur\((?!0px)/.test(cs.filter || "");
      const soft = ps.soft || blurred || masked || cs.clipPath !== "none";
      const skip = ps.skip || el.hasAttribute("data-snap") || el.hasAttribute("data-typing") || el.hasAttribute("data-gate-skip");
      const state = { o, clip, soft, rec: ps.rec, skip };
      st.set(el, state);
      // (off the frame is still recorded, as out of view: a strip sliding past the edge has not vanished)
      if (o <= 0.02 || r.width * r.height < 16) continue;
      // Only what paints can be seen to jump: a wrapper that draws nothing is judged through what it holds
      const paints =
        (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") ||
        cs.backgroundImage !== "none" ||
        parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth) > 0 ||
        cs.boxShadow !== "none" ||
        clips;
      const ownText = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
      const media = tag === "img" || tag === "video" || tag === "canvas" || tag === "svg";
      if (!paints && !ownText && !media) continue;
      const me = id(el);
      state.rec = me.n;
      seen.add(me.n);
      // visible share inside every clipping ancestor and the frame: mostly outside means it is moving in or out
      const vis = Math.max(0, Math.min(r.right, clip.r) - Math.max(r.left, clip.l)) * Math.max(0, Math.min(r.bottom, clip.b) - Math.max(r.top, clip.t));
      const out = vis < r.width * r.height * 0.5;
      const sc = el instanceof HTMLElement && el.offsetWidth ? r.width / el.offsetWidth : 1;
      const words = [...el.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent.trim()).join(" ").slice(0, 40);
      const src = tag === "img" ? el.getAttribute("src") || "" : "";
      const sig = `${tag}|${words}|${src ? src.replace(/[^/]*$/, "") : ""}|${tag === "svg" ? el.innerHTML.replace(/\s+/g, "").slice(0, 160) : ""}`;
      // Something new this frame: is it under a surface that covers it?
      let covered = false;
      if (!lastSeen.has(me.n) && !out) {
        const top = document.elementFromPoint(Math.min(W - 1, Math.max(0, r.left + r.width / 2)), Math.min(H - 1, Math.max(0, r.top + r.height / 2)));
        covered = !!top && !el.contains(top) && !top.contains(el) && getComputedStyle(el).pointerEvents !== "none";
      }
      const sib = el.nextElementSibling;
      const inFlow = (e) => !/absolute|fixed/.test(getComputedStyle(e).position);
      const next = sib && inFlow(el) && inFlow(sib) ? id(sib).n : -1;
      items.push({
        id: me.n, name: me.name, x: r.left, y: r.top, w: r.width, h: r.height, o: +o.toFixed(3), sc: +sc.toFixed(3),
        rp: ps.rec, next, out, soft, covered, skip, sig, src: src || undefined, words,
      });
    }
    lastSeen = seen;
    return { items };
  };
}

// ---------------------------------------------------------------------------------------------------------
// The analysis, on the recorded frames.
function analyse(frames, fps) {
  const at = frames.map((fr) => new Map(fr.items.map((i) => [i.id, i])));
  const when = (k) => `${(frames[k].f / fps).toFixed(2)}s (f${frames[k].f})${frames[k].seam ? " [loop seam]" : ""}`;
  const shown = (it) => it && it.o >= 0.5 && it.w * it.h >= 36;
  const faults = [];
  const notes = [];

  // Hard cuts: most of what was on screen leaves and most of what is now on screen arrives, in one frame.
  const cut = new Set();
  for (let k = 1; k < frames.length; k++) {
    const prev = [...at[k - 1].values()].filter(shown);
    const now = [...at[k].values()].filter(shown);
    const left = prev.filter((i) => !shown(at[k].get(i.id))).length;
    const came = now.filter((i) => !shown(at[k - 1].get(i.id))).length;
    if (left >= 3 && came >= 3 && left >= prev.length * 0.5 && came >= now.length * 0.5) {
      cut.add(k);
      notes.push(`hard cut at ${when(k)}: ${left} of ${prev.length} elements leave and ${came} of ${now.length} arrive in one frame (fine when the cut is the edit; otherwise carry something across it)`);
    }
  }

  // Jumps (Stageshow jumps-core): more than 2 px in one frame while calm the frame before and after.
  const found = new Map();
  for (let k = 2; k < frames.length - 1; k++) {
    if (cut.has(k) || cut.has(k - 1) || cut.has(k + 1)) continue;
    for (const [n, it] of at[k]) {
      if (it.skip) continue;
      const a = at[k - 2].get(n), b = at[k - 1].get(n), c = at[k + 1].get(n);
      if (!a || !b || !c || (it.out && b.out)) continue;
      // a seamless wrap (a rolling strip's duplicate end cell): an identical element now sits where this one was
      const twin = [...at[k].values()].some((o) => o.id !== n && o.sig === it.sig && !o.out &&
        Math.abs(o.x - b.x) < 2 && Math.abs(o.y - b.y) < 2 && Math.abs(o.w - b.w) < 2 && Math.abs(o.h - b.h) < 2);
      if (twin) continue;
      for (const ax of ["x", "y", "w", "h"]) {
        const d = it[ax] - b[ax];
        const calm = Math.max(Math.abs(b[ax] - a[ax]), Math.abs(c[ax] - it[ax]), 0.4);
        if (Math.abs(d) > 2 && Math.abs(d) > 3 * calm) {
          const key = `${n}:${ax}`;
          const prev = found.get(key);
          if (prev) prev.count++;
          else found.set(key, { id: n, rp: it.rp, k, name: it.name, ax, d, count: 1 });
        }
      }
    }
  }
  // a parent's jump drags its children: report the outermost
  const jumps = [...found.values()].sort((p, q) => p.k - q.k);
  const kept = jumps.filter((l) => !jumps.some((s) => s.id === l.rp && s.k === l.k && s.ax === l.ax && Math.abs(s.d - l.d) < 0.6));
  const axis = { x: "x", y: "y", w: "width", h: "height" };
  const jumped = new Set(kept.map((l) => `${l.id}@${l.k}`));
  // siblings that jump together (cells of one strip, words of one line) are one finding
  const together = new Map();
  for (const l of kept) {
    const key = `${l.k}:${l.ax}:${l.rp}:${Math.round(l.d)}`;
    if (!together.has(key)) together.set(key, { ...l, more: 0 });
    else together.get(key).more++;
  }
  for (const l of together.values()) faults.push(`jump: ${l.name}${l.more ? ` and ${l.more} beside it` : ""} ${axis[l.ax]} ${l.d > 0 ? "+" : ""}${l.d.toFixed(1)}px in one frame at ${when(l.k)}${l.count > 1 ? ` (${l.count} times in the film)` : ""}`);

  // Pops and handoffs (Stageshow motion-watch, read from frames): what shows or goes whole in one frame.
  const near = (a, b) => Math.abs(a.x + a.w / 2 - b.x - b.w / 2) < 40 && Math.abs(a.y + a.h / 2 - b.y - b.h / 2) < 40 && Math.abs(a.w - b.w) < Math.max(a.w, b.w) * 0.35;
  const growing = (n, k, dir) => {
    // still opening (or closing) over the next (or last) three frames: an entrance (or exit) by size
    const it = at[k].get(n);
    const o = at[Math.min(frames.length - 1, Math.max(0, k + 3 * dir))].get(n);
    return it && o && (it.w < o.w * 0.95 || it.h < o.h * 0.95 || it.o < o.o - 0.05);
  };
  const pops = new Map();
  const noted = new Set();
  for (let k = 1; k < frames.length; k++) {
    if (cut.has(k)) continue;
    // whole: 0.9 opacity or more; gone: under 0.1 or not drawn. A fast fade (1 to 0.4 to 0.1) is still a fade
    const whole = (i) => i && i.o >= 0.9 && i.w * i.h >= 36;
    const there = (i) => i && i.o >= 0.1 && i.w * i.h >= 36;
    const came = [...at[k].values()].filter((i) => whole(i) && !there(at[k - 1].get(i.id)));
    const left = [...at[k - 1].values()].filter((i) => whole(i) && !there(at[k].get(i.id)));
    const cameIds = new Set(came.map((i) => i.id));
    const leftIds = new Set(left.map((i) => i.id));
    for (const c of came) {
      const twin = left.find((g) => g.sig === c.sig && near(g, c));
      if (twin) {
        const d = Math.max(Math.abs(twin.x - c.x), Math.abs(twin.y - c.y), Math.abs(twin.w - c.w), Math.abs(twin.h - c.h));
        if (d >= 0.5 && d <= 6 && !noted.has("h" + c.sig)) {
          noted.add("h" + c.sig);
          faults.push(`handoff shift: ${c.name} replaces an identical element drawn ${(c.x - twin.x).toFixed(1)}px across, ${(c.y - twin.y).toFixed(1)}px down and ${(c.w - twin.w).toFixed(1)}x${(c.h - twin.h).toFixed(1)}px larger at ${when(k)}, so it snaps on the swap`);
        }
        continue;
      }
      if (cameIds.has(c.rp) || c.skip || c.out || c.covered || c.soft || c.sc < 0.95 || growing(c.id, k, 1)) continue;
      const key = `in@${k}`;
      if (!pops.has(key)) pops.set(key, { k, dir: "in", names: [] });
      pops.get(key).names.push(c.name);
    }
    for (const g of left) {
      if (came.some((c) => c.sig === g.sig && near(g, c))) continue;
      if (leftIds.has(g.rp) || g.skip || g.out || g.soft || g.sc < 0.95 || growing(g.id, k - 1, -1)) continue;
      const key = `out@${k}`;
      if (!pops.has(key)) pops.set(key, { k, dir: "out", names: [] });
      pops.get(key).names.push(g.name);
    }
  }
  for (const p of [...pops.values()].sort((a, b) => a.k - b.k)) {
    const names = [...new Set(p.names)];
    const list = names.slice(0, 3).join(", ") + (names.length > 3 ? ` and ${names.length - 3} more` : "");
    faults.push(p.dir === "in"
      ? `appears with no entrance: ${list} ${p.names.length > 1 ? "show" : "shows"} at full size and opacity in one frame at ${when(p.k)}; fade it in, or grow it out of what it comes from`
      : `vanishes with no exit: ${list} ${p.names.length > 1 ? "go" : "goes"} from full opacity to gone in one frame at ${when(p.k)}; fade it out, or move it out of view first`);
  }

  // Settle snaps: moving, then still, then a hop of half a pixel or more, then still again, within a second.
  const settled = new Set();
  const tracks = new Map();
  frames.forEach((fr, k) => fr.items.forEach((it) => {
    if (!tracks.has(it.id)) tracks.set(it.id, []);
    tracks.get(it.id).push(k);
  }));
  for (const [n, ks] of tracks) {
    let lastMove = -1e9;
    let run = 0;
    let still = 0;
    for (let j = 1; j < ks.length; j++) {
      const k = ks[j];
      if (ks[j - 1] !== k - 1 || cut.has(k)) {
        run = 0;
        still = 0;
        continue;
      }
      const a = at[k - 1].get(n), b = at[k].get(n);
      if (b.skip || !shown(b)) continue;
      const m = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), Math.abs(b.w - a.w), Math.abs(b.h - a.h));
      if (m < 0.01) {
        still++;
        continue;
      }
      const after = [1, 2].map((s) => at[k + s]?.get(n)).filter(Boolean);
      const calmAfter = after.length === 2 && after.every((c, i) => {
        const p = i ? after[0] : b;
        return Math.max(Math.abs(c.x - p.x), Math.abs(c.y - p.y), Math.abs(c.w - p.w), Math.abs(c.h - p.h)) < 0.01;
      });
      if (m >= 0.5 && still >= 2 && run >= 2 && k - lastMove <= fps && calmAfter && !jumped.has(`${n}@${k}`) && !settled.has(b.sig)) {
        settled.add(b.sig);
        faults.push(`settle snap: ${b.name} came to rest, then hopped ${m.toFixed(1)}px with nothing moving it at ${when(k)}; land it exactly where it stays, or carry the last part in the move`);
      }
      if (still > 0) run = 0;
      run++;
      still = 0;
      lastMove = k;
    }
  }

  // Drift (Stageshow jumps-core): neighbours in a column whose gap wobbles while both keep their size.
  const born = new Map();
  frames.forEach((fr, k) => fr.items.forEach((i) => born.has(i.id) || born.set(i.id, k)));
  const drift = new Map();
  for (let k = 1; k < frames.length; k++) {
    if (cut.has(k)) continue;
    for (const [n, it] of at[k]) {
      const nx = it.next >= 0 ? at[k].get(it.next) : null;
      const pa = at[k - 1].get(n), pb = nx && at[k - 1].get(nx.id);
      if (!nx || !pa || !pb || it.skip || nx.skip) continue;
      if (k - born.get(n) < 45 || k - born.get(nx.id) < 45) continue;
      const held = Math.abs(it.h - pa.h) < 0.3 && Math.abs(nx.h - pb.h) < 0.3;
      const dg = nx.y - (it.y + it.h) - (pb.y - (pa.y + pa.h));
      if (!held || Math.abs(dg) <= 1) continue;
      const key = `${n}>${nx.id}`;
      const d = drift.get(key) ?? { k, a: it.name, b: nx.name, max: 0, count: 0 };
      d.max = Math.max(d.max, Math.abs(dg));
      d.count++;
      drift.set(key, d);
    }
  }
  for (const d of drift.values()) if (d.count >= 4) faults.push(`drift: ${d.a} and ${d.b} glide out of step (their gap changes up to ${d.max.toFixed(1)}px a frame, ${d.count} frames from ${when(d.k)})`);

  // Recorded footage: an <Img> whose picture keeps changing. Its cadence, and what the gate cannot see.
  // (per element: the same <Img> showing a new picture; different stills from one folder are not footage)
  const footage = new Map();
  frames.forEach((fr, k) => fr.items.forEach((it) => {
    if (!it.src) return;
    if (!footage.has(it.id)) footage.set(it.id, []);
    footage.get(it.id).push({ k, src: it.src });
  }));
  for (const seq of footage.values()) {
    const dir = seq[0].src.replace(/[^/]*$/, "");
    const runs = [];
    let changes = 0;
    for (let i = 1; i < seq.length; i++) {
      if (seq[i].src !== seq[i - 1].src) {
        changes++;
        runs.push(i);
      }
    }
    if (changes < 5) continue;
    const gaps = runs.slice(1).map((r, i) => r - runs[i]);
    const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const longest = Math.max(...gaps);
    const where = runs[gaps.indexOf(longest)];
    notes.push(`footage ${dir.replace(/^.*\/public\//, "")}: a new recorded frame every ${mean.toFixed(1)} film frames on average (about ${(fps / mean).toFixed(0)} fps), longest hold ${longest} frames from ${when(seq[where].k)}. The gate judges this footage's box (camera, crop, arrival, exit), not the motion inside its pixels: look at a frame strip for that`);
  }
  return { faults, notes };
}
