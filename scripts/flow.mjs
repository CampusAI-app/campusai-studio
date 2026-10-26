// Record your own path through the REAL CampusAI demo (2026-10-26): pages, presses, typing, scrolls.
//
//   npm run flow <film>            reads films/<film>/flow.json, writes public/<film>/flow/
//   npm run flow examples/add-to-calendar.json   records that file into public/add-to-calendar/flow/
//
// The public demo (campusai-demo.vercel.app) runs in a browser on your machine at a student's pace, slowed
// down while it records so every frame is sharp, and played back at true speed. Nothing in the demo
// changes: a press on "Add to CampusAI Calendar" adds it in your recording only. This is the method of
// Jacob's capture scripts (howto-run.cjs) as one command that reads a list instead of code.
//
// flow.json:
// {
//   "start": "/events",              the demo page it opens on
//   "size": [1440, 900],             the page in CSS px; 1440x900 suits wide, 820x1000 suits 9x16 and 4x5
//   "theme": "dark",                 dark | light
//   "zoom": 1.4,                     optional: bigger type for a phone screen
//   "steps": [
//     { "wait": 1 },                                   hold, seconds
//     { "press": "Add Financial Modeling Bootcamp" },  move the pointer to it and press it
//     { "press": "Save", "nth": 2 },                   the second match on screen
//     { "hover": "Job Match" },                        move the pointer there, no press
//     { "type": "investment", "into": "Search" },      press a box (by its label or placeholder) and type
//     { "key": "Enter" },                              one key
//     { "scroll": 600 },                               scroll the page, px (negative goes up)
//     { "scrollTo": "Bloomberg Terminal Workshop" },   scroll until it is on screen
//     { "go": "/calendar" },                           open a page directly (no pointer)
//     { "back": true }                                 the browser's back
//   ],                               any step can also carry "mark": "name" (its time lands in marks)
//                                    and "ms": how long the pointer takes to get there (default 650)
//   "tail": 2                        seconds held after the last step
// }
//
// Names are matched the way a person reads the screen: a button's or link's name, then a box's
// placeholder or label, then any text. A part of the name is enough; the first match on screen wins.
//
// Output: sharp frames (2x) + frames.json { vw, vh, marks, moves, frames: [{ t, name }] }, t in real seconds.
// Play it with <FlowRecording src="<film>/flow/frames.json" /> from the kit, which also draws the pointer.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const STUDIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILMS = process.env.STUDIO_FILMS || path.resolve(STUDIO, "..", "films");
const DEMO = "https://campusai-demo.vercel.app";
// Google Chrome where each system installs it; set CHROME to point anywhere else.
const CHROME = process.env.CHROME || [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ...["PROGRAMFILES", "PROGRAMFILES(X86)", "LOCALAPPDATA"]
    .filter((k) => process.env[k])
    .map((k) => path.join(process.env[k], "Google", "Chrome", "Application", "chrome.exe")),
  "/usr/bin/google-chrome",
].find((p) => fs.existsSync(p));
if (!CHROME) {
  console.error("Google Chrome not found. Install it from google.com/chrome, or set CHROME to its path.");
  process.exit(1);
}
const SLOW = +(process.env.SLOW || 4);
const EM = String.fromCharCode(8212); // the long dash, which never reaches a frame
const KINDS = ["wait", "press", "hover", "type", "key", "scroll", "scrollTo", "go", "back"];

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: npm run flow <film>   (reads films/<film>/flow.json)\n   or: npm run flow examples/add-to-calendar.json");
  process.exit(1);
}
const specPath = arg.endsWith(".json") ? path.resolve(arg) : path.join(FILMS, arg, "flow.json");
const film = arg.endsWith(".json") ? path.basename(arg, ".json") : arg;
if (!fs.existsSync(specPath)) {
  console.error(`No ${specPath}. Write the steps there first (see the top of scripts/flow.mjs).`);
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
if (!Array.isArray(spec.steps) || !spec.steps.length) throw new Error(`flow.json needs "steps", a list.`);
spec.steps.forEach((s, i) => {
  const kind = KINDS.filter((k) => k in s);
  if (kind.length !== 1) throw new Error(`Step ${i + 1} ${JSON.stringify(s)} needs exactly one of: ${KINDS.join(", ")}.`);
  if (s.type !== undefined && !s.into) throw new Error(`Step ${i + 1} types "${s.type}" but has no "into" (the box's label or placeholder).`);
  if (typeof s.type === "string" && s.type.includes(EM)) throw new Error(`Step ${i + 1} types a long dash. Rewrite it without one.`);
});
const [vw, vh] = spec.size || [1440, 900];
const outDir = path.join(STUDIO, "public", film, "flow");
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) fs.unlinkSync(path.join(outDir, f));

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  // bypassCSP lets the capture add its zoom rule; nothing the policy governs is drawn differently
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, bypassCSP: true });
  await ctx.addInitScript((theme) => {
    try {
      localStorage.setItem("campusai-theme", theme);
    } catch {}
  }, spec.theme || "dark");
  // The page's own clock runs at 1/SLOW once window.__warp() is called, so animations read true speed in playback.
  await ctx.addInitScript((SLOW) => {
    let k = 1, realAt = 0, virtAt = 0;
    const pn = performance.now.bind(performance), dn = Date.now, st = window.setTimeout, si = window.setInterval, raf = window.requestAnimationFrame.bind(window);
    const v = () => virtAt + (pn() - realAt) / k;
    const dOff = dn() - pn();
    window.__warp = () => { virtAt = v(); realAt = pn(); k = SLOW; };
    // a page opened mid-recording starts slowed (the flag survives navigation in this tab)
    try { if (sessionStorage.getItem("studio-warp")) { window.__warp(); window.__warpOn = true; } } catch {}
    performance.now = () => v();
    Date.now = () => Math.round(dOff + v());
    const D = Date;
    window.Date = class extends D { constructor(...a) { if (a.length) super(...a); else super(dOff + v()); } static now() { return Math.round(dOff + v()); } };
    window.setTimeout = (fn, ms, ...a) => st(fn, (ms || 0) * k, ...a);
    window.setInterval = (fn, ms, ...a) => si(fn, (ms || 0) * k, ...a);
    window.requestAnimationFrame = (cb) => raf(() => cb(v()));
  }, SLOW);
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Animation.enable");
  let warping = false;
  // after anything that may open a page (a press, a key, "go", "back"): keep it slowed and scrubbed
  const settle = async () => {
    await p.waitForLoadState("domcontentloaded").catch(() => {});
    if (warping) await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 / SLOW }).catch(() => {});
    await p.evaluate((em) => {
      if (window.__scrubbed) return;
      window.__scrubbed = true;
      // No long dash from the demo's own copy reaches a frame.
      const re = new RegExp("\\s*" + em + "\\s*", "g");
      const fix = (n) => { const w = n.nodeValue.replace(re, ", "); if (w !== n.nodeValue) n.nodeValue = w; };
      const walk = (root) => { const t = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = t.nextNode())) fix(n); };
      walk(document.body);
      new MutationObserver((ms) => { for (const m of ms) { if (m.type === "characterData") fix(m.target); for (const a of m.addedNodes || []) { if (a.nodeType === 3) fix(a); else if (a.nodeType === 1) walk(a); } } })
        .observe(document.body, { subtree: true, childList: true, characterData: true });
    }, EM).catch(() => {});
    if (spec.zoom) await p.addStyleTag({ content: `main { zoom: ${spec.zoom}; }` }).catch(() => {});
  };
  await p.goto(DEMO + (spec.start || "/"), { waitUntil: "networkidle", timeout: 90000 });
  await p.waitForTimeout(2500);
  await settle();

  const frames = [];
  const t0 = Date.now();
  const now = () => +((Date.now() - t0) / 1000 / SLOW).toFixed(4);
  let stop = false;
  const shoot = (async () => {
    while (!stop) {
      const name = `f${String(frames.length).padStart(5, "0")}.jpg`;
      const t = now();
      try {
        await p.screenshot({ path: path.join(outDir, name), type: "jpeg", quality: 90 });
        frames.push({ t, name });
      } catch {
        await new Promise((r) => setTimeout(r, 50)); // mid-navigation; the next frame catches up
      }
    }
  })();

  const wait = (s) => p.waitForTimeout(s * 1000 * SLOW);
  // The pointer: page px, eased like the how-to film. Each glide is a move in frames.json; a press stamps it.
  const moves = [];
  let at = { x: Math.round(vw * 0.55), y: Math.round(vh * 0.6) };
  await p.mouse.move(at.x, at.y);
  const glide = async (to, ms = 650) => {
    const m = { from: { ...at }, to, start: now() };
    const n = 24;
    for (let i = 1; i <= n; i++) {
      const e = 1 - Math.pow(1 - i / n, 3);
      await p.mouse.move(m.from.x + (to.x - m.from.x) * e, m.from.y + (to.y - m.from.y) * e);
      await p.waitForTimeout((ms / n) * SLOW);
    }
    m.end = now();
    at = { ...to };
    moves.push(m);
  };
  const scrollBy = async (dy, ms = 700) => {
    const n = 14;
    for (let i = 0; i < n; i++) {
      await p.mouse.wheel(0, dy / n);
      await p.waitForTimeout((ms / n) * SLOW);
    }
  };
  // a person's reading of "that one": a button or link by name, a box by placeholder or label, then any text
  const find = async (name, nth = 1, boxOnly = false) => {
    const tries = boxOnly
      ? [p.getByPlaceholder(name), p.getByLabel(name), p.getByRole("textbox", { name }), p.getByRole("combobox", { name })]
      : [p.getByRole("button", { name }), p.getByRole("link", { name }), p.getByRole("tab", { name }), p.getByRole("checkbox", { name }),
          p.getByPlaceholder(name), p.getByLabel(name), p.getByText(name)];
    for (const loc of tries) {
      const all = await loc.all();
      const shown = [];
      for (const el of all) if (await el.isVisible().catch(() => false)) shown.push(el);
      if (shown.length >= nth) return shown[nth - 1];
    }
    throw new Error(`Nothing on screen called "${name}"${nth > 1 ? ` (match ${nth})` : ""}. Check the words on the page at ${p.url().replace(DEMO, "")}.`);
  };
  // scroll it into view the way a person would, then return its centre
  const reach = async (el) => {
    let b = await el.boundingBox();
    if (b && (b.y < 80 || b.y + b.height > vh - 40)) {
      await scrollBy(b.y + b.height / 2 - vh / 2, 800);
      await p.waitForTimeout(300 * SLOW);
      b = await el.boundingBox();
    }
    if (!b) throw new Error("It is on the page but has no size on screen.");
    return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) };
  };
  const press = async () => {
    moves.at(-1).click = now();
    await p.mouse.down();
    await p.waitForTimeout(90 * SLOW);
    await p.mouse.up();
  };

  await p.evaluate(() => { window.__warp(); window.__warpOn = true; sessionStorage.setItem("studio-warp", "1"); });
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 / SLOW });
  warping = true;
  await wait(0.6);
  const marks = { start: now() };
  for (const [i, s] of spec.steps.entries()) {
    try {
      if ("wait" in s) await wait(s.wait);
      else if ("press" in s || "hover" in s) {
        const el = await find(s.press ?? s.hover, s.nth);
        await glide(await reach(el), s.ms);
        await wait(0.15);
        if ("press" in s) {
          await press();
          await wait(0.5);
          await settle();
        }
      } else if ("type" in s) {
        const el = await find(s.into, s.nth, true);
        await glide(await reach(el), s.ms);
        await press();
        await wait(0.3);
        await p.keyboard.type(String(s.type), { delay: 55 * SLOW });
        await wait(0.3);
      } else if ("key" in s) {
        await p.keyboard.press(s.key);
        await wait(0.5);
        await settle();
      } else if ("scroll" in s) await scrollBy(s.scroll, s.ms ?? 700);
      else if ("scrollTo" in s) await reach(await find(s.scrollTo, s.nth));
      else if ("go" in s) {
        await p.goto(DEMO + s.go, { waitUntil: "networkidle", timeout: 90000 });
        await settle();
        await wait(0.4);
      } else if ("back" in s) {
        await p.goBack({ waitUntil: "networkidle", timeout: 90000 });
        await settle();
        await wait(0.4);
      }
    } catch (e) {
      throw new Error(`Step ${i + 1} ${JSON.stringify(s)}: ${e.message.split("\n")[0]}`);
    }
    if (s.mark) marks[s.mark] = now();
  }
  await wait(spec.tail ?? 2);
  marks.end = now();
  stop = true;
  await shoot;
  fs.writeFileSync(path.join(outDir, "frames.json"), JSON.stringify({ vw, vh, dpr: 2, marks, moves, frames }, null, 1));
  const dur = frames.at(-1)?.t || 0;
  console.log(`${frames.length} frames over ${dur.toFixed(1)}s (${(frames.length / dur).toFixed(1)} fps) in public/${film}/flow/`);
  console.log("marks", marks);
} finally {
  await browser.close();
}
