// Record the REAL CampusAI chat answering a question you wrote (2026-10-23).
//
//   npm run chat <film>            reads films/<film>/chat.json, writes public/<film>/chat/
//   npm run chat examples/x.json   records that file into public/x/chat/ (try examples/study-spots.json)
//
// The public demo (campusai-demo.vercel.app) is served through localhost and only its chat answer is
// swapped for the one in chat.json. Every pixel is the real product: the box, the thinking steps, the
// streaming, the follow-up chips. Nothing in the demo is edited. This is site-chat-proxy.mjs plus
// study-spot-record.cjs as one command that reads a file instead of code.
//
// chat.json:
// {
//   "question": "Best study spots on campus?",
//   "answer": "Markdown. **Bold** names, [links](https://...), a line break is two spaces then a newline.",
//   "steps": [{ "label": "Checking campus study spaces", "detail": "Libraries and quiet floors", "ms": 1000 }],
//   "chips": ["How do I book an ESJ huddle room?"],
//   "theme": "dark",            dark | light
//   "size": [820, 1000],        the page in CSS px; 820x1000 suits 9x16 and 4x5, 1440x900 suits wide
//   "zoom": 1.6,                optional: bigger type for a phone screen
//   "scroll": 1800,             optional: once answered, scroll to the bottom over this many ms
//   "tail": 2.6                 seconds held after the answer
// }
//
// Output: numbered sharp frames (2x) + frames.json { vw, vh, marks, frames: [{ t, name }] }, t in real
// seconds. Play it with <ChatRecording src="<film>/chat/frames.json" /> from the kit.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const STUDIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILMS = process.env.STUDIO_FILMS || path.resolve(STUDIO, "..", "films");
const DEMO = "https://campusai-demo.vercel.app";
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
// Recording runs this many times slower than real time so every frame is sharp; frames are stamped in real time.
const SLOW = +(process.env.SLOW || 4);
const EM = String.fromCharCode(8212); // the long dash, which never reaches a frame

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: npm run chat <film>   (reads films/<film>/chat.json)\n   or: npm run chat examples/study-spots.json");
  process.exit(1);
}
// a film name reads films/<film>/chat.json; a path to a .json records that file under its own name
const specPath = arg.endsWith(".json") ? path.resolve(arg) : path.join(FILMS, arg, "chat.json");
const film = arg.endsWith(".json") ? path.basename(arg, ".json") : arg;
if (!fs.existsSync(specPath)) {
  console.error(`No ${specPath}. Write the question and answer there first (see the top of scripts/chat.mjs).`);
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
for (const k of ["question", "answer"]) if (!spec[k]) throw new Error(`chat.json needs "${k}"`);
if ((spec.question + spec.answer).includes(EM)) throw new Error("chat.json has a long dash. Rewrite the line without it.");
const steps = (spec.steps?.length ? spec.steps : [{ label: "Reading your profile", detail: "", ms: 900 }]).map((s, i) => ({
  name: s.name || `step_${i}`,
  label: s.label,
  detail: s.detail || "",
  ms: s.ms || 900,
}));
const chips = (spec.chips || []).map((label, i) => ({ id: `f-${i}`, label, surface: "chat_reprompt", target: label, agent: "career" }));
const [vw, vh] = spec.size || [820, 1000];
const outDir = path.join(STUDIO, "public", film, "chat");
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) fs.unlinkSync(path.join(outDir, f));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let answered;
const answeredOnce = new Promise((r) => (answered = r));

// The demo, through localhost, with one chat answer swapped. Same stream shape as the demo's own route.
async function answer(req, res) {
  for await (const _ of req); // drain the question; the answer is the file's
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
  const push = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);
  push({ type: "session", session_id: "studio-session" });
  for (const s of steps) {
    push({ type: "tool", name: s.name, state: "started", label: s.label, detail: s.detail });
    await sleep(s.ms * SLOW);
    push({ type: "tool", name: s.name, state: "finished" });
  }
  if (spec.entities?.length) push({ type: "entities", items: spec.entities });
  // one word at a time on a steady beat, so the chat's soft trail reads as a smooth stream
  for (const w of spec.answer.match(/\S+\s*/g) || [spec.answer]) {
    push({ type: "token", token: w });
    await sleep(38 * SLOW);
  }
  push({ type: "done", session_id: "studio-session", ...(chips.length ? { suggestion_chips: chips } : {}) });
  res.end();
  answered();
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url.startsWith("/api/chat") && !req.url.startsWith("/api/chat/")) return await answer(req, res);
    let body;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const b = [];
      for await (const c of req) b.push(c);
      body = Buffer.concat(b);
    }
    const headers = { ...req.headers };
    delete headers.host;
    delete headers["accept-encoding"];
    delete headers.connection;
    const r = await fetch(DEMO + req.url, { method: req.method, headers, body, redirect: "manual" });
    const out = {};
    // CSP dropped locally so the capture can add its zoom rule; nothing it governs is drawn differently
    r.headers.forEach((v, k) => {
      if (!["content-encoding", "content-length", "transfer-encoding", "connection", "content-security-policy"].includes(k)) out[k] = v;
    });
    if (out.location) out.location = out.location.replace(DEMO, `http://localhost:${server.address().port}`);
    res.writeHead(r.status, out);
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    res.writeHead(502);
    res.end(String(e));
  }
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2 });
  await ctx.addInitScript((theme) => {
    try {
      localStorage.setItem("campusai-theme", theme);
    } catch {}
  }, spec.theme || "dark");
  // The page's own clock runs at 1/SLOW once window.__warp() is called, so JS animations and the
  // "Checked N things" timer read true speed in playback.
  await ctx.addInitScript((SLOW) => {
    let k = 1, realAt = 0, virtAt = 0;
    const pn = performance.now.bind(performance), dn = Date.now, st = window.setTimeout, si = window.setInterval, raf = window.requestAnimationFrame.bind(window);
    const v = () => virtAt + (pn() - realAt) / k;
    const dOff = dn() - pn();
    window.__warp = () => { virtAt = v(); realAt = pn(); k = SLOW; };
    performance.now = () => v();
    Date.now = () => Math.round(dOff + v());
    const D = Date;
    window.Date = class extends D { constructor(...a) { if (a.length) super(...a); else super(dOff + v()); } static now() { return Math.round(dOff + v()); } };
    window.setTimeout = (fn, ms, ...a) => st(fn, (ms || 0) * k, ...a);
    window.setInterval = (fn, ms, ...a) => si(fn, (ms || 0) * k, ...a);
    window.requestAnimationFrame = (cb) => raf(() => cb(v()));
  }, SLOW);
  const p = await ctx.newPage();
  await p.goto(BASE + "/ai", { waitUntil: "networkidle", timeout: 90000 });
  await p.waitForTimeout(3000);
  // No long dash from the demo's own copy reaches a frame.
  await p.evaluate((em) => {
    const re = new RegExp("\\s*" + em + "\\s*", "g");
    const fix = (n) => { const w = n.nodeValue.replace(re, ", "); if (w !== n.nodeValue) n.nodeValue = w; };
    const walk = (root) => { const t = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = t.nextNode())) fix(n); };
    walk(document.body);
    new MutationObserver((ms) => { for (const m of ms) { if (m.type === "characterData") fix(m.target); for (const a of m.addedNodes || []) { if (a.nodeType === 3) fix(a); else if (a.nodeType === 1) walk(a); } } })
      .observe(document.body, { subtree: true, childList: true, characterData: true });
  }, EM);
  if (spec.zoom) {
    // Only the conversation column and the chat box are zoomed (zooming the root breaks the 100vh layout).
    await p.addStyleTag({ content: `.cr-wide { zoom: ${spec.zoom}; } div.z-\\[2\\].max-w-\\[1100px\\] { zoom: ${spec.zoom}; }` });
    await p.waitForTimeout(800);
  }
  await p.locator("textarea").first().click();
  await p.waitForTimeout(400);

  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Animation.enable");
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 / SLOW });
  await p.evaluate(() => window.__warp());
  const frames = [];
  const t0 = Date.now();
  const now = () => +((Date.now() - t0) / 1000 / SLOW).toFixed(4);
  let stop = false;
  const shoot = (async () => {
    while (!stop) {
      const name = `f${String(frames.length).padStart(5, "0")}.jpg`;
      const t = now();
      await p.screenshot({ path: path.join(outDir, name), type: "jpeg", quality: 90 });
      frames.push({ t, name });
    }
  })();

  await p.waitForTimeout(600 * SLOW);
  const marks = { typeStart: now() };
  await p.keyboard.type(spec.question, { delay: 55 * SLOW });
  await p.waitForTimeout(350 * SLOW);
  marks.send = now();
  await p.keyboard.press("Enter");
  // done = the last word of the answer has left the server (it is on screen a frame later)
  await Promise.race([answeredOnce, sleep(180000)]);
  marks.done = now();
  if (spec.scroll) {
    await p.waitForTimeout(1600 * SLOW);
    marks.scroll = now();
    await p.evaluate((ms) => new Promise((done) => {
      let el = document.querySelector(".cr-wide");
      while (el && !(el.scrollHeight > el.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(el).overflowY))) el = el.parentElement;
      if (!el) return done();
      const from = el.scrollTop, to = el.scrollHeight - el.clientHeight, s = performance.now();
      const step = () => { const k = Math.min(1, (performance.now() - s) / ms); const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; el.scrollTop = from + (to - from) * e; if (k < 1) requestAnimationFrame(step); else done(); };
      requestAnimationFrame(step);
    }), spec.scroll);
    marks.scrolled = now();
  }
  await p.waitForTimeout((spec.tail ?? 2.6) * 1000 * SLOW);
  stop = true;
  await shoot;
  fs.writeFileSync(path.join(outDir, "frames.json"), JSON.stringify({ vw, vh, dpr: 2, marks, frames }, null, 1));
  const dur = frames.at(-1)?.t || 0;
  console.log(`${frames.length} frames over ${dur.toFixed(1)}s (${(frames.length / dur).toFixed(1)} fps) in public/${film}/chat/`);
  console.log("marks", marks);
} finally {
  await browser.close();
  server.close();
}
