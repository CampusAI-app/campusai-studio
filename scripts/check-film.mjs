#!/usr/bin/env node
/**
 * The film checker (2026-10-23). Lago's point: a script handles the arithmetic (reading holds, lengths,
 * where the hero sits, whether a press shows its result) so the human only judges the story.
 *
 *   node scripts/check-film.mjs <id-or-path>        npm run check <id>
 *
 * <id> resolves to Content/video-studio/films/<id>/storyboard.json; a path to a storyboard file or its
 * folder also works. Every number comes from src/system/rules.json, every part name from
 * src/system/parts/names.json. Prints a plain-English list and exits 1 on any failure. Warnings never
 * fail the check; they are things a person should look at.
 *
 * Also imported by draft-film.mjs and make-film.mjs (`checkFilm`), so all three agree on what passes.
 */
import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const STUDIO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const FILMS = resolve(STUDIO, "..", "films");
const PUBLIC = join(STUDIO, "public");

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const rules = readJson(join(STUDIO, "src/system/rules.json"));
const namesFile = readJson(join(STUDIO, "src/system/parts/names.json"));
const PART_NAMES = Array.isArray(namesFile) ? namesFile : namesFile.names;

const ASPECTS = ["9x16", "4x5", "16x9", "1x1"];
const MODES = ["individual", "bulk"];
const FORMATS = Object.keys(rules.formats).filter((k) => !k.startsWith("_"));
const ROLES = ["hook", "line", "caption", "label"];
const SOURCES = ["capture", "facts", "hook"];
const TRANSITIONS = ["camera", "carry", "cut"];
/** The em dash, built from its code so this file never contains one. */
const EM = String.fromCharCode(0x2014);

/** Same formula as readHold in src/system/storyboard.ts, fed by rules.json. */
export const readHold = (text) => {
  const r = rules.reading;
  const letters = (String(text).match(/[\p{L}\p{N}]/gu) ?? []).length;
  return Math.max(r.min, letters / r.lettersPerSecond + r.base);
};

/** For text truth: case, curly quotes and runs of whitespace never decide a match. */
const norm = (s) =>
  String(s)
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const s2 = (n) => `${Math.round(n * 100) / 100} s`;

/** id, folder or file path to the storyboard file. */
export const resolveStoryboard = (arg) => {
  if (!arg) return null;
  const asPath = resolve(process.cwd(), arg);
  if (existsSync(asPath)) return statSync(asPath).isDirectory() ? join(asPath, "storyboard.json") : asPath;
  return join(FILMS, arg, "storyboard.json");
};

/**
 * Runs every check. Returns { ok, file, sb, fails, warns, notes }. Never throws for a bad storyboard;
 * a file that is missing or not JSON is reported as a failure.
 */
export const checkFilm = (arg) => {
  const fails = [];
  const warns = [];
  const notes = [];
  const fail = (m) => fails.push(m);
  const warn = (m) => warns.push(m);
  const note = (m) => notes.push(m);
  const file = resolveStoryboard(arg);
  const out = (sb = null) => ({ ok: fails.length === 0, file, sb, fails, warns, notes });

  if (!file) return fail("No film given. Usage: node scripts/check-film.mjs <id-or-path>"), out();
  if (!existsSync(file)) return fail(`No storyboard at ${file}.`), out();
  let sb;
  try {
    sb = readJson(file);
  } catch (e) {
    return fail(`The storyboard is not valid JSON: ${e.message}`), out();
  }
  if (!sb || typeof sb !== "object" || Array.isArray(sb)) return fail("The storyboard is not a JSON object."), out();

  const isStr = (v) => typeof v === "string" && v.trim().length > 0;
  const isNum = (v) => typeof v === "number" && Number.isFinite(v);
  const isRect = (r) => r && isNum(r.x) && isNum(r.y) && isNum(r.w) && isNum(r.h) && r.w > 0 && r.h > 0;

  // ---- Shape: the top level -------------------------------------------------------------------
  for (const k of ["id", "title"]) if (!isStr(sb[k])) fail(`The storyboard needs a "${k}" (text).`);
  const folder = file.endsWith("storyboard.json") ? basename(dirname(file)) : null;
  if (isStr(sb.id) && folder && sb.id !== folder) warn(`The id "${sb.id}" does not match its folder "${folder}".`);
  if (!FORMATS.includes(sb.format)) fail(`"format" is "${sb.format}"; it must be one of ${FORMATS.join(", ")}.`);
  if (!MODES.includes(sb.mode)) fail(`"mode" is "${sb.mode}"; it must be "individual" or "bulk".`);
  if (sb.brand !== "campusai") fail(`"brand" must be "campusai" (it is "${sb.brand}").`);
  if (!Array.isArray(sb.aspects) || sb.aspects.length === 0) fail(`"aspects" must list at least one of ${ASPECTS.join(", ")}.`);
  else for (const a of sb.aspects) if (!ASPECTS.includes(a)) fail(`Aspect "${a}" is not one of ${ASPECTS.join(", ")}.`);
  if (!sb.contract || !["does", "changes", "better"].every((k) => isStr(sb.contract[k])))
    fail(`"contract" needs all three lines: does, changes, better (a student does X, Y changes on screen, they are better off because Z).`);
  const surfaces = sb.surfaces && typeof sb.surfaces === "object" && !Array.isArray(sb.surfaces) ? sb.surfaces : null;
  if (!surfaces) fail(`"surfaces" must be an object of named captures (it can be empty).`);
  const shots = Array.isArray(sb.shots) ? sb.shots : null;
  if (!shots || shots.length === 0) fail(`"shots" must be a list with at least one shot.`);
  if (!sb.end || sb.end.kind !== "logo-url" || !isNum(sb.end.hold))
    fail(`"end" must be { "kind": "logo-url", "hold": <seconds> }.`);
  if (sb.end && sb.end.instagram !== undefined && typeof sb.end.instagram !== "boolean") fail(`"end.instagram" must be true or false.`);
  const facts = Array.isArray(sb.facts) ? sb.facts : null;
  if (!facts) fail(`"facts" must be a list (it can be empty).`);
  else facts.forEach((f, i) => {
    if (!f || !isStr(f.text) || !isStr(f.source)) fail(`Fact ${i + 1} needs both "text" and "source" (where it was checked).`);
  });
  if (sb.music !== undefined && (!sb.music || !isStr(sb.music.track))) fail(`"music" needs a "track".`);

  // ---- Surfaces: the files exist, and their layers text is loaded for the truth check -------------
  const layerText = {};
  if (surfaces) {
    for (const [key, sf] of Object.entries(surfaces)) {
      if (!sf || !isStr(sf.src)) { fail(`Surface "${key}" needs a "src" under public/.`); continue; }
      if (!existsSync(join(PUBLIC, sf.src))) fail(`Surface "${key}": public/${sf.src} does not exist.`);
      if (!sf.page || !isNum(sf.page.w) || !isNum(sf.page.h) || sf.page.w <= 0 || sf.page.h <= 0)
        fail(`Surface "${key}" needs "page": { "w", "h" } in page px.`);
      if (sf.dpr !== undefined && !(isNum(sf.dpr) && sf.dpr > 0)) fail(`Surface "${key}": "dpr" must be a positive number.`);
      (sf.patch ?? []).forEach((p, i) => {
        if (!isRect(p)) fail(`Surface "${key}" patch ${i + 1} is not a rectangle { x, y, w, h }.`);
      });
      if (sf.layers !== undefined) {
        const lp = join(PUBLIC, sf.layers);
        if (!existsSync(lp)) fail(`Surface "${key}": layers file public/${sf.layers} does not exist.`);
        else {
          try {
            const L = readJson(lp);
            layerText[key] = (L.layers ?? []).map((l) => norm(l.text ?? "")).filter(Boolean);
          } catch {
            fail(`Surface "${key}": layers file public/${sf.layers} is not valid JSON.`);
          }
        }
      }
    }
  }

  const inPage = (sf, x, y) => x >= 0 && y >= 0 && x <= sf.page.w && y <= sf.page.h;
  const rectInPage = (sf, r) => r.x >= 0 && r.y >= 0 && r.x + r.w <= sf.page.w && r.y + r.h <= sf.page.h;
  const factTexts = (facts ?? []).filter((f) => f && isStr(f.text)).map((f) => norm(f.text));

  // ---- Shots -----------------------------------------------------------------------------------
  const ids = [];
  const hooks = [];
  let cursor = 0;
  const starts = [];
  if (shots) {
    shots.forEach((sh, i) => {
      const who = isStr(sh?.id) ? `Shot "${sh.id}"` : `Shot ${i + 1}`;
      starts.push(cursor);
      if (!sh || typeof sh !== "object") return fail(`${who} is not an object.`);
      if (!isStr(sh.id)) fail(`${who} needs an "id".`);
      else if (ids.includes(sh.id)) fail(`${who}: the id is used twice.`);
      ids.push(sh.id);
      if (!isNum(sh.seconds) || sh.seconds <= 0) fail(`${who} needs "seconds" above 0.`);
      const secs = isNum(sh.seconds) ? sh.seconds : 0;
      cursor += secs;
      if (!PART_NAMES.includes(sh.part)) fail(`${who}: part "${sh.part}" is not a known part (${PART_NAMES.join(", ")}).`);
      if (!isStr(sh.action)) fail(`${who} needs an "action": plain words for what happens.`);
      if (sh.transition !== undefined && !TRANSITIONS.includes(sh.transition))
        fail(`${who}: transition "${sh.transition}" must be camera, carry or cut.`);

      let sf = null;
      if (sh.surface !== undefined) {
        sf = surfaces?.[sh.surface] ?? null;
        if (!sf) fail(`${who}: surface "${sh.surface}" is not in "surfaces".`);
        else if (!sf.page || !isNum(sf.page.w)) sf = null; // already failed above
      } else if (sh.focus || sh.camera || sh.press || sh.part === "page-walk") {
        fail(`${who} frames or presses a page but names no "surface".`);
      }

      if (sh.focus !== undefined) {
        if (!isRect(sh.focus)) fail(`${who}: "focus" is not a rectangle { x, y, w, h }.`);
        else if (sf && !rectInPage(sf, sh.focus))
          fail(`${who}: focus box (${sh.focus.x}, ${sh.focus.y}, ${sh.focus.w} x ${sh.focus.h}) runs outside the ${sf.page.w} x ${sf.page.h} page.`);
      }
      if (sh.camera !== undefined) {
        if (!Array.isArray(sh.camera) || sh.camera.length === 0) fail(`${who}: "camera" must be a list of { t, cam }.`);
        else {
          let last = -Infinity;
          sh.camera.forEach((k, n) => {
            const c = k?.cam;
            if (!k || !isNum(k.t) || !c || !isNum(c.cx) || !isNum(c.cy) || !isNum(c.cw) || c.cw <= 0)
              return fail(`${who}: camera key ${n + 1} needs t and cam { cx, cy, cw }.`);
            if (k.t < last) fail(`${who}: camera keys must be in time order (key ${n + 1} goes back to ${s2(k.t)}).`);
            last = k.t;
            if (k.t < 0 || k.t > secs) fail(`${who}: camera key ${n + 1} at ${s2(k.t)} is outside the shot's ${s2(secs)}.`);
            if (sf && !inPage(sf, c.cx, c.cy)) fail(`${who}: camera key ${n + 1} centres on (${c.cx}, ${c.cy}), off the page.`);
          });
        }
      }
      if (sh.press !== undefined) {
        const p = sh.press;
        if (!p || !isNum(p.x) || !isNum(p.y) || !isNum(p.at)) fail(`${who}: "press" needs x, y and at.`);
        else {
          if (sf && !inPage(sf, p.x, p.y)) fail(`${who}: the press at (${p.x}, ${p.y}) is off the ${sf.page.w} x ${sf.page.h} page.`);
          if (p.at < 0 || p.at > secs) fail(`${who}: the press at ${s2(p.at)} falls outside the shot's ${s2(secs)}.`);
        }
        if (!isStr(sh.lands)) fail(`${who} has a press but no "lands": every press must show where its result lands.`);
      } else if (sh.lands !== undefined) warn(`${who} names "lands" but has no press.`);

      if (sh.text !== undefined && !Array.isArray(sh.text)) fail(`${who}: "text" must be a list.`);
      (Array.isArray(sh.text) ? sh.text : []).forEach((t, n) => {
        const line = isStr(t?.text) ? `"${t.text}"` : `line ${n + 1}`;
        if (!t || !isStr(t.text)) return fail(`${who}: text ${line} has no words.`);
        if (!ROLES.includes(t.role)) fail(`${who}: text ${line} has role "${t.role}"; it must be ${ROLES.join(", ")}.`);
        if (!SOURCES.includes(t.source)) fail(`${who}: text ${line} has source "${t.source}"; it must be capture, facts or hook.`);
        if (t.at !== undefined && (!isNum(t.at) || t.at < 0)) fail(`${who}: text ${line} "at" must be 0 or more.`);
        if (t.hold !== undefined && (!isNum(t.hold) || t.hold <= 0)) fail(`${who}: text ${line} "hold" must be above 0.`);
        const at = isNum(t.at) ? t.at : 0;
        const need = readHold(t.text);
        const hold = isNum(t.hold) ? t.hold : need;
        if (hold + 1e-9 < need) fail(`${who}: text ${line} holds ${s2(hold)}; the reading rule needs ${s2(need)}.`);
        if (at + hold > secs + 1e-9)
          fail(`${who}: text ${line} starts at ${s2(at)} and holds ${s2(hold)}, ending at ${s2(at + hold)}, past the shot's ${s2(secs)}.`);

        if (t.source === "capture") {
          if (!sf) fail(`${who}: text ${line} says it comes from a capture, but the shot has no surface.`);
          else if (layerText[sh.surface] === undefined) {
            const sib = sf.src.replace(/(-tall)?\.(jpe?g|png|webp)$/i, ".json");
            const hint = existsSync(join(PUBLIC, sib)) ? ` public/${sib} exists; add it as the surface's "layers".` : "";
            warn(`${who}: text ${line} is unverified: surface "${sh.surface}" has no layers file to check it against.${hint}`);
          } else if (!layerText[sh.surface].some((l) => l.includes(norm(t.text))))
            fail(`${who}: text ${line} is not on the captured page (not found in ${surfaces[sh.surface].layers}).`);
        } else if (t.source === "facts") {
          if (!factTexts.includes(norm(t.text))) fail(`${who}: text ${line} is marked as a fact but matches no entry in "facts".`);
        } else if (t.source === "hook") hooks.push(`${who}: ${line}`);
      });

      if ((!Array.isArray(sh.text) || sh.text.length === 0) && secs > 3 * rules.pace.ideaSeconds)
        warn(`${who} runs ${s2(secs)} with no text, over 3 x ${s2(rules.pace.ideaSeconds)} per idea: dead air unless the picture is carrying a story.`);
    });

    // press to lands, now that every id is known
    shots.forEach((sh, i) => {
      if (!sh || !isStr(sh.lands) || sh.press === undefined) return;
      const j = ids.indexOf(sh.lands);
      if (j === -1) fail(`Shot "${sh.id}": its press lands in "${sh.lands}", which is not a shot.`);
      else if (j < i) fail(`Shot "${sh.id}": its press lands in "${sh.lands}", which comes before it.`);
    });
  }

  // ---- Banned strings, anywhere in the storyboard ----------------------------------------------
  const banned = rules.banned.strings;
  const ci = rules.banned.caseInsensitive;
  const walk = (v, path) => {
    if (typeof v === "string") {
      for (const b of banned) {
        const hit = ci ? v.toLowerCase().includes(b.toLowerCase()) : v.includes(b);
        if (hit) fail(`Banned ${b === EM ? "em dash" : `"${b}"`} in ${path}: "${v.length > 70 ? v.slice(0, 70) + "..." : v}".`);
      }
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(sb, "");

  // ---- Runtime, end card, hero -----------------------------------------------------------------
  const endHold = isNum(sb.end?.hold) ? sb.end.hold : 0;
  const total = cursor + endHold;
  const fmt = rules.formats[sb.format];
  if (fmt && shots) {
    if (total < fmt.min || total > fmt.max)
      fail(`Runtime is ${s2(total)} (shots ${s2(cursor)} plus end ${s2(endHold)}); a ${sb.format} film runs ${fmt.min} to ${fmt.max} s.`);
    else note(`Runtime ${s2(total)}, inside ${sb.format}'s ${fmt.min} to ${fmt.max} s.`);
  }
  if (isNum(sb.end?.hold) && (endHold < rules.end.holdMin || endHold > rules.end.holdMax))
    fail(`The end card holds ${s2(endHold)}; it must hold ${rules.end.holdMin} to ${rules.end.holdMax} s.`);
  if (shots && total > 0) {
    const heroes = shots.map((sh, i) => (sh?.hero ? i : -1)).filter((i) => i >= 0);
    if (heroes.length > 1) warn(`${heroes.length} shots are marked hero; a film has one hero moment.`);
    for (const i of heroes) {
      const share = starts[i] / total;
      const pct = Math.round(share * 100);
      if (share < rules.pace.heroFrom || share > rules.pace.heroTo)
        warn(`Hero shot "${shots[i].id}" starts at ${s2(starts[i])}, ${pct}% of the runtime; it belongs at ${rules.pace.heroFrom * 100} to ${rules.pace.heroTo * 100}%.`);
      else note(`Hero shot "${shots[i].id}" starts at ${pct}% of the runtime.`);
    }
  }

  // ---- Eight-block format (2026-10-24, opt-in): block order, each block's timing, every open loop answered ----
  // Robin Tempe's structure (rules.json `eightBlock`): hook, lead, body 1, loop 1, body 2, loop 2, body 3, CTA.
  // Only a storyboard with "format": "eight-block" is held to it; any other film is untouched.
  if (sb.format === "eight-block" && shots && shots.length) {
    const E = rules.eightBlock;
    const ORDER = E.order.filter((b) => b !== "cta");
    const label = (b) => `${b} (${E.jobs[b] ?? ""})`;
    // runs of consecutive shots that share a block
    const runs = [];
    shots.forEach((sh, i) => {
      const b = sh?.block;
      if (!ORDER.includes(b)) return fail(`Shot "${sh?.id ?? i + 1}" needs a "block": one of ${ORDER.join(", ")} (an eight-block film names every shot's block; the CTA is the end card).`);
      const last = runs[runs.length - 1];
      if (last && last.block === b) { last.end = starts[i] + (isNum(sh.seconds) ? sh.seconds : 0); last.idx.push(i); }
      else runs.push({ block: b, start: starts[i], end: starts[i] + (isNum(sh.seconds) ? sh.seconds : 0), idx: [i] });
    });
    const seq = runs.map((r) => r.block);
    if (seq.join(",") !== ORDER.join(",")) {
      fail(`The blocks run ${seq.join(", ")}; an eight-block film runs ${ORDER.join(", ")}, then the end card as the CTA, each block once and in that order.`);
    } else {
      const run = Object.fromEntries(runs.map((r) => [r.block, r]));
      // hook: short, and something worth watching on the first frames
      const h = run.hook;
      if (h.end - h.start > E.hook.maxSeconds + 1e-9) fail(`The hook runs ${s2(h.end - h.start)}; it stops the scroll in at most ${E.hook.maxSeconds} s.`);
      const first = shots[0];
      const earlyText = (first.text ?? []).some((t) => (t.role === "hook" || t.role === "line") && (isNum(t.at) ? t.at : 0) <= E.hook.showsBy);
      if (!first.surface && !earlyText) fail(`The hook shows nothing by ${E.hook.showsBy} s: its first shot needs the product (a surface) or a hook line at ${E.hook.showsBy} s or sooner.`);
      // lead: carries the viewer past the 10 second mark
      const l = run.lead;
      if (l.end < E.lead.endFrom - 1e-9 || l.end > E.lead.endTo + 1e-9)
        fail(`The lead ends at ${s2(l.end)}; its job is to carry the viewer to about 10 s, so it ends between ${E.lead.endFrom} and ${E.lead.endTo} s.`);
      else note(`Lead ends at ${s2(l.end)}: the viewer is carried past the 10 second mark.`);
      if (!l.idx.some((i) => (shots[i].text ?? []).some((t) => t.role === "hook" || t.role === "line")))
        warn(`The lead has no line on screen; a retention anchor is usually a promise the viewer can read.`);
      for (const b of ["body-1", "body-2", "body-3"]) {
        const r = run[b];
        if (r.end - r.start < E.body.minSeconds - 1e-9) fail(`Block ${label(b)} runs ${s2(r.end - r.start)}; a body runs at least ${E.body.minSeconds} s.`);
      }
      // loops: a question on screen, answered by words on screen in the NEXT body
      for (const [b, next] of [["loop-1", "body-2"], ["loop-2", "body-3"]]) {
        const r = run[b];
        const len = r.end - r.start;
        if (len < E.loop.minSeconds - 1e-9 || len > E.loop.maxSeconds + 1e-9)
          fail(`Open loop ${b} runs ${s2(len)}; a loop runs ${E.loop.minSeconds} to ${E.loop.maxSeconds} s (long enough to read, short enough to stay a question).`);
        const own = shots[r.idx[0]];
        const lp = own.loop;
        if (!lp || !isStr(lp.question) || !lp.answer || !isStr(lp.answer.shot) || !isStr(lp.answer.evidence)) {
          fail(`Open loop ${b}: its first shot "${own.id}" needs "loop": { "question", "answer": { "shot", "evidence" } }, the question it asks and where ${next} answers it.`);
          continue;
        }
        const lines = r.idx.flatMap((i) => (shots[i].text ?? []).filter((t) => t.role === "hook" || t.role === "line").map((t) => norm(t.text)));
        if (lp.visual !== true && !lines.includes(norm(lp.question)))
          fail(`Open loop ${b}: the question "${lp.question}" is not one of its lines on screen (or mark it "visual": true and describe the picture).`);
        const ai = ids.indexOf(lp.answer.shot);
        if (ai === -1) { fail(`Open loop ${b}: its answer shot "${lp.answer.shot}" is not a shot.`); continue; }
        if (!run[next].idx.includes(ai)) { fail(`Open loop ${b}: its answer shot "${lp.answer.shot}" is in ${shots[ai].block}, not the next body (${next}). A loop is answered by the body right after it.`); continue; }
        const ans = shots[ai];
        const ev = norm(lp.answer.evidence);
        const onCapture = ans.surface && layerText[ans.surface] ? layerText[ans.surface].some((x) => x.includes(ev)) : false;
        const onText = (ans.text ?? []).some((t) => norm(t.text).includes(ev));
        if (!onCapture && !onText)
          fail(`Open loop ${b} is never answered: "${lp.answer.evidence}" is not on screen in "${ans.id}" (not in its capture's layers, not in its text).`);
        else note(`Open loop ${b} ("${lp.question}") is answered in ${next} by "${lp.answer.evidence}" in "${ans.id}".`);
        if (lines.some((x) => x.includes(ev))) warn(`Open loop ${b} shows its own answer ("${lp.answer.evidence}"), so it is no longer open.`);
      }
      // CTA: the end card, logo plus address, about 3 s
      if (isNum(sb.end?.hold) && (sb.end.hold < E.cta.holdMin - 1e-9 || sb.end.hold > E.cta.holdMax + 1e-9))
        fail(`The CTA (end card) holds ${s2(sb.end.hold)}; in an eight-block film it holds ${E.cta.holdMin} to ${E.cta.holdMax} s.`);
      for (const [i, sh] of shots.entries()) if (sh.hero && !["body-1", "body-2", "body-3"].includes(sh.block)) warn(`Hero shot "${shots[i].id}" sits in ${sh.block}; the hero belongs in a body.`);
      note(`Eight blocks in order: ${runs.map((r) => `${r.block} ${s2(r.start)} to ${s2(r.end)}`).join(", ")}, cta ${s2(cursor)} to ${s2(total)}.`);
    }
  } else if (shots && shots.some((sh) => sh && (sh.block !== undefined || sh.loop !== undefined)))
    warn(`Some shots name a "block" or "loop", which only an eight-block film reads ("format" is "${sb.format}").`);

  // ---- Length cutdowns: each cut is a list of the film's own shots, checked as a film of its own ----------
  // opt-in (2026-10-23): shots made for cuts only, never in the full film; their ids must not clash
  const cutShots = sb.cutShots === undefined ? [] : Array.isArray(sb.cutShots) ? sb.cutShots : (fail(`"cutShots" must be a list of shots.`), []);
  for (const cs of cutShots) if (cs && ids.includes(cs.id)) fail(`Cut shot "${cs.id}" has the same id as a film shot.`);
  if (sb.cuts !== undefined) {
    if (!sb.cuts || typeof sb.cuts !== "object" || Array.isArray(sb.cuts)) fail(`"cuts" must be an object of { name: { shots: [...] } }.`);
    else for (const [name, c] of Object.entries(sb.cuts)) {
      const ids = Array.isArray(c?.shots) ? c.shots : null;
      if (!ids || ids.length === 0) { fail(`Cut "${name}" has no "shots" list.`); continue; }
      const byId = new Map([...(shots ?? []), ...cutShots].map((sh) => [sh?.id, sh]));
      const missing = ids.filter((id) => !byId.has(id));
      if (missing.length) { fail(`Cut "${name}" names shots that do not exist: ${missing.join(", ")}.`); continue; }
      const cf = c.format ?? sb.format;
      if (!FORMATS.includes(cf)) { fail(`Cut "${name}" has format "${cf}"; it must be one of ${FORMATS.join(", ")}.`); continue; }
      if (c.endHold !== undefined && !isNum(c.endHold)) { fail(`Cut "${name}": "endHold" must be a number of seconds.`); continue; }
      const cutEnd = isNum(c.endHold) ? c.endHold : endHold;
      // the cut checked as a film of its own (reading holds, text truth, cameras, presses, end hold); its length is reported below
      if (cutShots.length || c.endHold !== undefined) {
        const tmp = join(tmpdir(), `film-cut-${process.pid}-${String(sb.id).replace(/[^\w-]/g, "")}-${String(name).replace(/[^\w-]/g, "")}.json`);
        const { cuts: _c, cutShots: _cs, ...rest } = sb;
        writeFileSync(tmp, JSON.stringify({ ...rest, format: cf, end: { ...sb.end, hold: cutEnd }, shots: ids.map((id) => byId.get(id)) }));
        const sub = checkFilm(tmp);
        rmSync(tmp, { force: true });
        for (const m of sub.fails) if (!m.startsWith("Runtime is ")) fail(`Cut "${name}": ${m}`);
        for (const m of sub.warns) if (!m.startsWith("The id ")) warn(`Cut "${name}": ${m}`);
      }
      const len = ids.reduce((a, id) => a + (isNum(byId.get(id).seconds) ? byId.get(id).seconds : 0), 0) + cutEnd;
      const range = rules.formats[cf];
      if (len < range.min || len > range.max) fail(`Cut "${name}" runs ${s2(len)}; a ${cf} cut runs ${range.min} to ${range.max} s.`);
      else note(`Cut "${name}" runs ${s2(len)}, inside ${cf}'s ${range.min} to ${range.max} s.`);
      for (const id of ids) {
        const sh = byId.get(id);
        if (sh.press && sh.lands && !ids.includes(sh.lands))
          fail(`Cut "${name}" keeps the press in "${id}" but drops "${sh.lands}", where its result lands. Every press shows where it lands.`);
      }
    }
  }

  for (const h of hooks) note(`Hook line, ours, claims nothing about the product: ${h}`);
  if (sb.mode === "individual")
    note(sb.draftApproved === true
      ? `Individual film: the grey draft is approved, so it can be made.`
      : `Individual film: the grey draft is not approved yet ("draftApproved" is not true), so make will refuse.`);
  else if (sb.mode === "bulk") note(`Bulk film: no draft gate.`);

  return out(sb);
};

/** One time per shot (its middle) plus the end card's middle, for contact sheets. */
export const sheetTimes = (sb) => {
  const t = [];
  let acc = 0;
  for (const sh of sb.shots) {
    t.push(Math.round((acc + sh.seconds / 2) * 100) / 100);
    acc += sh.seconds;
  }
  t.push(Math.round((acc + sb.end.hold / 2) * 100) / 100);
  return t;
};

/** The plain-English printout. */
export const printReport = (r) => {
  const head = r.sb?.title ? `${r.sb.title} (${r.sb.id})` : r.file ?? "film";
  console.log(`\n  Checking ${head}`);
  if (r.file) console.log(`  ${r.file}\n`);
  for (const m of r.fails) console.log(`  ✗ ${m}`);
  for (const m of r.warns) console.log(`  ! ${m}`);
  for (const m of r.notes) console.log(`  · ${m}`);
  console.log(
    r.ok
      ? `\n  Passed, with ${r.warns.length} warning${r.warns.length === 1 ? "" : "s"}.\n`
      : `\n  Failed: ${r.fails.length} problem${r.fails.length === 1 ? "" : "s"}, ${r.warns.length} warning${r.warns.length === 1 ? "" : "s"}.\n`,
  );
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const arg = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const r = checkFilm(arg);
  printReport(r);
  process.exit(r.ok ? 0 : 1);
}
