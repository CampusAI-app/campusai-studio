/**
 * Type film (round 4 experiment, 2026-10-25): kinetic type carries the piece and the product appears only as proof.
 *
 * Four thoughts a student has in their head are typed big on an empty Swiss grid. Each one is re-set into the
 * words the product uses for the place that answers it (the words that are the same in both stay and slide, the
 * rest leave or arrive), and that line then flies down onto the real heading on the real page, which comes up
 * underneath it, so the typed thought becomes the product's own heading. One red caret types every thought, rides
 * every flight, rests on every heading and finally types the address under the logo: it is the carrier.
 *
 * Built from: shelf `typewriter-moves` (1.5 f a character, the caret as the accent, 8 f blink when idle),
 * shelf `title-demote-to-label` (a big title shrinks onto its place in one continuous move, bezier(.6, 0, .18, 1),
 * hold before the move), kit `PageView` and the page camera (the page is laid out at size, never scaled),
 * kit `LogoOpen` (the masthead mark at 0.33 s that settles into the end logo), system `Score` (music and cues on
 * the measured grid of slow-walk). Swiss Motion: one left margin every line starts on, one baseline every question
 * starts on, a hairline masthead, generous empty ground, red only on the caret.
 *
 * Text: Zodiak for the thoughts (it is the film's voice), Inter for the address and the running place name.
 * Every answer is the product's own string from public/pass; see films/type-film/facts.md.
 */
import React from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { brand, glow } from "../../kit/brand";
import type { PageCam, Rect } from "../../kit/camera";
import { clampCam, rectOnCanvas, toCanvas } from "../../kit/camera";
import { LogoOpen } from "../../kit/LogoMoment";
import { PageView } from "../../kit/PageView";
import { INTER } from "../../kit/parts";
import { EASE, EASE_CAMERA } from "../../lib/anim";
import { beatGrid } from "../../system/sound/beats";
import type { SoundEvent } from "../../system/sound/cues";
import { Score } from "../../system/sound/Score";
import type { Beat, Clock, Thought, Tok } from "./script";
import { F, MUSIC, THOUGHTS, URL_TEXT, makeClock, textOf } from "./script";

const B = brand("campusai");
const FPS = 30;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** title-demote-to-label's flight curve: decisive start, soft landing. */
const DEMOTE = Easing.bezier(0.6, 0, 0.18, 1);
const ramp = (f: number, a: number, b: number, e = EASE) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export const CLOCK: Clock = makeClock(beatGrid(MUSIC.track, MUSIC.startAt, FPS).beatFrame);

/* ------------------------------------------------------------------ layout per aspect */

export type Aspect = "9x16" | "16x9";
type Layout = {
  W: number;
  H: number;
  view: Rect;
  /** Left margin and first baseline every question is typed on, its size, the width it wraps at. */
  ax: number;
  ay: number;
  size: number;
  maxW: number;
  mast: { cx: number; cy: number; w: number; hairY: number; x1: number; place: number };
  end: { left: number; w: number; cy: number; urlBase: number; url: number };
};

const LAYOUT: Record<Aspect, Layout> = {
  "9x16": {
    W: 1080, H: 1920,
    view: { x: 36, y: 236, w: 1008, h: 1400 },
    ax: 72, ay: 880, size: 128, maxW: 936,
    mast: { cx: 72 + 105, cy: 116, w: 210, hairY: 184, x1: 1008, place: 30 },
    end: { left: 72, w: 640, cy: 860, urlBase: 1030, url: 54 },
  },
  "16x9": {
    W: 1920, H: 1080,
    view: { x: 120, y: 150, w: 1680, h: 900 },
    ax: 120, ay: 610, size: 136, maxW: 1680,
    mast: { cx: 120 + 85, cy: 74, w: 170, hairY: 120, x1: 1800, place: 26 },
    end: { left: 120, w: 620, cy: 470, urlBase: 640, url: 48 },
  },
};

/* ------------------------------------------------------------------ Zodiak, loaded before anything is measured */

const useZodiakReady = () => {
  const [handle] = React.useState(() => delayRender("Zodiak, before measuring"));
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const faces = [
      new FontFace("Zodiak", `url(${staticFile("fonts/Zodiak-Bold.woff2")}) format("woff2")`, { weight: "700", style: "normal" }),
    ];
    Promise.all(faces.map((x) => x.load().then((l) => document.fonts.add(l)))).finally(() => setReady(true));
  }, []);
  // continue only after the re-render that measured with the real face
  React.useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  return ready;
};

/* ------------------------------------------------------------------ measuring (per 1 px of font size) */

const TRACK = -0.02; // Zodiak's house tracking, em
const LH = 1.04;
let ctx: CanvasRenderingContext2D | null = null;
const widths = new Map<string, number>();
const pen = () => {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  c.font = "700 100px Zodiak";
  c.letterSpacing = `${TRACK * 100}px`;
  return c;
};
const wEm = (s: string) => {
  const hit = widths.get(s);
  if (hit !== undefined) return hit;
  const w = pen().measureText(s).width / 100;
  widths.set(s, w);
  return w;
};
let metricsCache: { cap: number; base: number } | null = null;
/** Cap height, and the baseline's distance from the top of a line-height 1 box, both per px of size. */
const metrics = () => {
  if (metricsCache) return metricsCache;
  const m = pen().measureText("H");
  const A = m.fontBoundingBoxAscent / 100;
  const D = m.fontBoundingBoxDescent / 100;
  metricsCache = { cap: m.actualBoundingBoxAscent / 100, base: (1 - (A + D)) / 2 + A };
  return metricsCache;
};

type Placed = { tok: Tok; x: number; line: number; w: number; off: number };
/** Greedy wrap by words (pieces joined without a space are one word). x and w in em, `off` = first char index. */
const place = (toks: Tok[], maxEm: number) => {
  const space = wEm(" ");
  const words: Tok[][] = [];
  let cur: Tok[] = [];
  toks.forEach((t) => {
    cur.push(t);
    if (t.sp) {
      words.push(cur);
      cur = [];
    }
  });
  if (cur.length) words.push(cur);
  const out: Placed[] = [];
  let x = 0;
  let line = 0;
  let off = 0;
  let width = 0;
  words.forEach((w) => {
    const ww = w.reduce((s, t) => s + wEm(t.t), 0);
    if (x > 0 && x + ww > maxEm) {
      line += 1;
      x = 0;
    }
    w.forEach((t) => {
      const tw = wEm(t.t);
      out.push({ tok: t, x, line, w: tw, off });
      x += tw;
      off += t.t.length + (t.sp ? 1 : 0);
    });
    width = Math.max(width, x);
    x += space;
  });
  return { placed: out, lines: line + 1, width };
};

/* ------------------------------------------------------------------ the page camera for one thought */

/** The landing camera: still during the flight, then a slow 8 CSS px drift down the page while it holds. A drift,
 *  not a push-in, so the right edge stays in its gutter and no word is sliced at the frame edge. */
const camFor = (th: Thought, b: Beat, f: number, lay: Layout, aspect: Aspect): PageCam => {
  const T = th.target;
  const base = aspect === "9x16" ? T.cam.v : T.cam.w;
  // held still while the line flies (one subject at a time), then the drift once it has landed
  const drift = 8 * interpolate(f, [b.land + 2, b.leave + F.ret + 30], [0, 1], clamp);
  return clampCam({ cx: base.cx, cy: base.cy + drift, cw: base.cw }, T.page, { w: lay.view.w, h: lay.view.h });
};

/* ------------------------------------------------------------------ one frame of type */

type Glyph = { key: string; text: string; x: number; y: number; size: number; o: number; blur: number };
type Caret = { x: number; y: number; h: number; w: number; on: boolean } | null;

const blinkOn = (f: number, from: number) => Math.floor((f - from) / 8) % 2 === 0;
const caretBox = (x: number, base: number, size: number, cap: number) => ({
  x, y: base - cap * size * 1.16, h: cap * size * 1.36, w: Math.max(3, size * 0.05),
});

type Frame = { glyphs: Glyph[]; caret: Caret };

function typeFrame(f: number, lay: Layout, aspect: Aspect): Frame {
  const { cap, base: baseOff } = metrics();
  const glyphs: Glyph[] = [];
  const beats = CLOCK.beats;
  const idx = beats.findIndex((b, n) => f < (n + 1 < beats.length ? beats[n + 1].typeStart : Infinity));
  const b = beats[idx];
  const th = THOUGHTS[idx];
  const S = lay.size;
  const gap = 0.07;

  // the return: the caret travels from where it rested (a heading, or the margin before the film starts) to the
  // start of this thought's line
  const bigCaret = caretBox(lay.ax - 0.02 * S, lay.ay, S, cap);
  if (f < b.typeStart) {
    const prev = beats[idx - 1];
    if (!prev) return { glyphs, caret: { ...bigCaret, on: true } };
    const from = pageCaret(THOUGHTS[idx - 1], prev, prev.leave, lay, aspect, cap);
    const k = ramp(f, prev.leave, b.typeStart, EASE_CAMERA);
    return { glyphs, caret: { x: lerp(from.x, bigCaret.x, k), y: lerp(from.y, bigCaret.y, k), h: lerp(from.h, bigCaret.h, k), w: lerp(from.w, bigCaret.w, k), on: true } };
  }

  const q = place(th.q, lay.maxW / S);
  const qText = textOf(th.q);
  // the answer is one line, as big as the question but never wider than the grid
  const aW = place(th.a, 1e9).width;
  const Sa = Math.min(S, (lay.maxW / aW) * 0.98);
  const a = place(th.a, 1e9);
  const qPos = (p: Placed) => ({ x: lay.ax + p.x * S, y: lay.ay + p.line * LH * S, size: S });
  const aPos = (p: Placed, ax: number, ay: number, s: number) => ({ x: ax + p.x * s, y: ay, size: s });
  const top = (y: number, size: number) => y - baseOff * size;

  // typing and the hold
  if (f < b.morphStart) {
    const n = Math.min(qText.length, Math.floor((f - b.typeStart) / F.type) + 1);
    let cx = lay.ax;
    let cy = lay.ay;
    q.placed.forEach((p) => {
      const vis = Math.max(0, Math.min(p.tok.t.length, n - p.off));
      const pos = qPos(p);
      if (vis > 0) {
        glyphs.push({ key: `q${p.off}`, text: p.tok.t.slice(0, vis), x: pos.x, y: top(pos.y, S), size: S, o: 1, blur: 0 });
        cx = pos.x + wEm(p.tok.t.slice(0, vis)) * S;
        cy = pos.y;
        // the space after a finished word moves the caret on
        if (vis === p.tok.t.length && p.tok.sp && n > p.off + p.tok.t.length) cx += wEm(" ") * S;
      }
    });
    const typing = f < b.typedEnd;
    return { glyphs, caret: { ...caretBox(cx + gap * S * 0.4, cy, S, cap), on: typing || blinkOn(f, b.typedEnd) } };
  }

  // the re-set: shared words slide to their place in the answer, the others leave or arrive
  const qEnd = (() => {
    const last = q.placed[q.placed.length - 1];
    const pos = qPos(last);
    return { x: pos.x + last.w * S, y: pos.y };
  })();
  const startCaret = th.target.caret === "start";
  if (f < b.travelStart) {
    const ms = b.morphStart;
    const m = ramp(f, ms + 1, ms + F.morph, EASE_CAMERA);
    q.placed.forEach((p) => {
      if (p.tok.id) return;
      const e = ramp(f, ms, ms + 9);
      const pos = qPos(p);
      glyphs.push({ key: `q${p.off}`, text: p.tok.t, x: pos.x, y: top(pos.y - 0.16 * S * e, S), size: S, o: 1 - e, blur: 10 * e * (S / 128) });
    });
    let j = 0;
    a.placed.forEach((p) => {
      const to = aPos(p, lay.ax, lay.ay, Sa);
      const shared = p.tok.id ? q.placed.find((x) => x.tok.id === p.tok.id) : undefined;
      if (shared) {
        const from = qPos(shared);
        const size = lerp(S, Sa, m);
        glyphs.push({ key: `s${p.tok.id}`, text: p.tok.t, x: lerp(from.x, to.x, m), y: top(lerp(from.y, to.y, m), size), size, o: 1, blur: 0 });
      } else {
        const e = ramp(f, ms + 5 + 2 * j, ms + 14 + 2 * j);
        j += 1;
        glyphs.push({ key: `a${p.off}`, text: p.tok.t, x: to.x, y: top(to.y + 0.16 * Sa * (1 - e), Sa), size: Sa, o: e, blur: 10 * (1 - e) * (Sa / 128) });
      }
    });
    const aEndX = startCaret ? lay.ax - 0.16 * Sa : lay.ax + a.width * Sa + gap * Sa * 0.4;
    const fromC = caretBox(qEnd.x + gap * S * 0.4, qEnd.y, S, cap);
    const toC = caretBox(aEndX, lay.ay, Sa, cap);
    // a field's caret goes home to the start of the line rather than sweeping back across the words
    if (startCaret) return { glyphs, caret: m < 0.5 ? { ...fromC, on: m < 0.2 } : { ...toC, on: m > 0.8 } };
    return { glyphs, caret: { x: lerp(fromC.x, toC.x, m), y: lerp(fromC.y, toC.y, m), h: lerp(fromC.h, toC.h, m), w: lerp(fromC.w, toC.w, m), on: true } };
  }

  // the flight: the answer line shrinks onto the real heading, which the page brings up under it
  if (f < b.land + 4) {
    const k = ramp(f, b.travelStart, b.land, DEMOTE);
    const cam = camFor(th, b, f, lay, aspect);
    const T = th.target;
    const p = toCanvas(cam, lay.view, T.x, T.base);
    const sLand = (T.capH * p.s) / cap;
    const ax = lerp(lay.ax, p.x, k);
    const ay = lerp(lay.ay, p.y, k);
    const size = lerp(Sa, sLand, k);
    // a short handover so the two faces never sit on top of each other for long
    const o = 1 - ramp(f, b.land - 1, b.land + 1, EASE_CAMERA);
    const handBlur = 0;
    a.placed.forEach((pl) => {
      const pos = aPos(pl, ax, ay, size);
      glyphs.push({ key: pl.tok.id ? `s${pl.tok.id}` : `a${pl.off}`, text: pl.tok.t, x: pos.x, y: top(pos.y, size), size, o, blur: handBlur });
    });
    const flying = caretBox(startCaret ? ax - 0.16 * size : ax + a.width * size + gap * size * 0.4, ay, size, cap);
    const rest = pageCaret(th, b, f, lay, aspect, cap);
    const kk = ramp(f, b.land - 6, b.land + 2, EASE_CAMERA);
    return { glyphs, caret: { x: lerp(flying.x, rest.x, kk), y: lerp(flying.y, rest.y, kk), h: lerp(flying.h, rest.h, kk), w: lerp(flying.w, rest.w, kk), on: true } };
  }

  // resting on the page
  if (idx === beats.length - 1 && f >= CLOCK.endStart) return endCaret(f, lay, aspect, cap);
  return { glyphs, caret: { ...pageCaret(th, b, f, lay, aspect, cap), on: blinkOn(f, b.land + 4) } };
}

/** The caret where it rests on the real page: after the heading, or at the start of the empty field. */
function pageCaret(th: Thought, b: Beat, f: number, lay: Layout, aspect: Aspect, cap: number) {
  const T = th.target;
  const cam = camFor(th, b, f, lay, aspect);
  const s = lay.view.w / cam.cw;
  const x = T.caret === "start" ? (T.caretX ?? T.x - 3) : T.right + 3;
  const p = toCanvas(cam, lay.view, x, T.base);
  const h = T.capH * 1.36 * s;
  return { x: p.x, y: p.y - T.capH * 1.16 * s, h, w: Math.max(3, h * 0.09) };
  void cap;
}

/** The end: the caret leaves the field and types the address under the logo, then keeps blinking. */
function endCaret(f: number, lay: Layout, aspect: Aspect, cap: number): Frame {
  const last = CLOCK.beats[CLOCK.beats.length - 1];
  const th = THOUGHTS[THOUGHTS.length - 1];
  const from = pageCaret(th, last, CLOCK.endStart, lay, aspect, cap);
  const U = lay.end.url;
  const urlCaret = (x: number) => ({ x, y: lay.end.urlBase - U * 0.86, h: U * 1.08, w: Math.max(3, U * 0.07) });
  const n = f < CLOCK.urlStart ? 0 : Math.min(URL_TEXT.length, Math.floor((f - CLOCK.urlStart) / F.urlType) + 1);
  const typedW = n === 0 ? 0 : interW(URL_TEXT.slice(0, n), U);
  const to = urlCaret(lay.end.left + typedW + U * 0.06);
  const k = ramp(f, CLOCK.endStart, CLOCK.urlStart, EASE_CAMERA);
  const typedEnd = CLOCK.urlStart + Math.ceil(URL_TEXT.length * F.urlType);
  const on = f < typedEnd || blinkOn(f, typedEnd);
  return {
    glyphs: [],
    caret: { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k), h: lerp(from.h, to.h, k), w: lerp(from.w, to.w, k), on },
  };
}

/** Inter 600 width for the address, measured the same way. */
const interWidths = new Map<string, number>();
function interW(s: string, size: number) {
  const key = s;
  let w = interWidths.get(key);
  if (w === undefined) {
    const c = pen();
    c.font = `600 100px ${INTER}`;
    (c as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "-1px";
    w = c.measureText(s).width / 100;
    interWidths.set(key, w);
  }
  return w * size;
}

/* ------------------------------------------------------------------ sound */

export const soundEvents = (): SoundEvent[] => {
  const ev: SoundEvent[] = [];
  CLOCK.beats.forEach((b, i) => {
    const text = textOf(THOUGHTS[i].q);
    let k = 0;
    for (let c = 0; c < text.length; c++) {
      if (text[c] === " ") continue;
      ev.push({ kind: "type", frame: b.typeStart + Math.floor(c * F.type), index: k++, db: -2, name: `key ${i}` });
    }
    ev.push({ kind: "move", frame: b.travelStart + 4, db: -4, name: `flight ${i}` });
    ev.push({ kind: "land", frame: b.land, name: `lands on ${THOUGHTS[i].target.place}` });
  });
  for (let c = 0; c < URL_TEXT.length; c++) {
    ev.push({ kind: "type", frame: CLOCK.urlStart + Math.floor(c * F.urlType), index: c, db: -4, name: "url key" });
  }
  ev.push({ kind: "logo", frame: CLOCK.logoLand, db: -2, name: "logo" });
  return ev;
};

/* ------------------------------------------------------------------ the film */

export const TypeFilm: React.FC<{ aspect: Aspect; sound?: boolean }> = ({ aspect, sound = true }) => {
  const ready = useZodiakReady();
  const f = useCurrentFrame();
  const lay = LAYOUT[aspect];
  return (
    <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient, overflow: "hidden" }}>
      {sound ? (
        <Score music={{ track: MUSIC.track, startAt: MUSIC.startAt }} events={soundEvents()} end={{ from: CLOCK.logoLand }} />
      ) : null}
      <Pages f={f} lay={lay} aspect={aspect} />
      <Masthead f={f} lay={lay} />
      {ready ? <Type f={f} lay={lay} aspect={aspect} /> : null}
      <EndUrl f={f} lay={lay} />
    </AbsoluteFill>
  );
};

const Pages: React.FC<{ f: number; lay: Layout; aspect: Aspect }> = ({ f, lay, aspect }) => (
  <>
    {CLOCK.beats.map((b, i) => {
      const isLast = i === CLOCK.beats.length - 1;
      const out = isLast ? CLOCK.endStart : b.leave;
      const outLen = isLast ? 16 : F.ret + 2;
      if (f < b.travelStart || f > out + outLen) return null;
      const th = THOUGHTS[i];
      const o = ramp(f, b.travelStart, b.travelStart + 16) * (1 - ramp(f, out, out + outLen, EASE_CAMERA));
      // the page stays low while the big line is over it, and lights up as the line lands
      const dim = 0.82 * (1 - ramp(f, b.travelStart + 8, b.land + 2, Easing.in(Easing.cubic))) + 0.45 * ramp(f, out, out + outLen);
      const cam = camFor(th, b, f, lay, aspect);
      const T = th.target;
      const hide = 1 - ramp(f, b.land - 1, b.land + 1, EASE_CAMERA);
      const r = rectOnCanvas(cam, lay.view, { x: T.x - 3, y: T.base - T.capH - 4, w: T.right - T.x + 6, h: T.capH + 9 });
      return (
        <div key={i} style={{ position: "absolute", inset: 0, opacity: o, maskImage: FADE(lay), WebkitMaskImage: FADE(lay),
          maskComposite: "intersect", WebkitMaskComposite: "source-in" }}>
          <PageView src={staticFile(T.src)} page={T.page} cam={cam} view={lay.view} brand={B} radius={28} dim={dim}>
            {hide > 0.001 ? (
              <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, opacity: hide,
                background: `linear-gradient(90deg, ${T.bg[0]}, ${T.bg[1]})`,
                filter: dim ? `brightness(${1 - dim * 0.72}) saturate(${1 - dim * 0.6})` : undefined }} />
            ) : null}
          </PageView>
        </div>
      );
    })}
  </>
);

/** The view's right and bottom edges fade over their last 44 px, so a sentence that runs past the frame trails off
 *  instead of being sliced (lead review 2026-10-25). Two gradients intersected. */
const FADE = (lay: Layout) => {
  const r = lay.view.x + lay.view.w;
  const b = lay.view.y + lay.view.h;
  return `linear-gradient(90deg, #000 ${r - 44}px, transparent ${r}px), linear-gradient(180deg, #000 ${b - 44}px, transparent ${b}px)`;
};

/** Logo at the left, a hairline, and the page's own name at the right while a page is up. */
const Masthead: React.FC<{ f: number; lay: Layout }> = ({ f, lay }) => {
  const m = lay.mast;
  const endOut = ramp(f, CLOCK.endStart, CLOCK.endStart + 14);
  const line = ramp(f, 4, 34, EASE_CAMERA);
  // which page is up, and how much
  let name = "";
  let o = 0;
  let rise = 0;
  CLOCK.beats.forEach((b, i) => {
    const out = i === CLOCK.beats.length - 1 ? CLOCK.endStart : b.leave;
    const k = ramp(f, b.travelStart + 8, b.travelStart + 22) * (1 - ramp(f, out, out + 10));
    if (k > o) {
      o = k;
      name = THOUGHTS[i].target.place;
      rise = (1 - ramp(f, b.travelStart + 8, b.travelStart + 22)) * 16;
    }
  });
  const e = lay.end;
  const settleK = ramp(f, CLOCK.logoSettle, CLOCK.logoSettle + 16, EASE_CAMERA);
  const drift = interpolate(f, [CLOCK.logoLand, CLOCK.logoLand + 120], [0, 0.012], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: lay.ax, top: m.hairY, height: 1.5, width: (m.x1 - lay.ax) * line, background: B.color.ink, opacity: 0.16 * (1 - endOut) }} />
      <div style={{ position: "absolute", right: lay.W - m.x1, top: m.cy - m.place * 0.62 + rise, fontFamily: INTER, fontWeight: 500, fontSize: m.place,
        color: B.color.inkSoft, opacity: o * (1 - endOut), letterSpacing: "-0.01em" }}>{name}</div>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${e.left}px ${e.cy}px`, transform: `scale(${(1 + drift).toFixed(4)})`,
        filter: `drop-shadow(0 0 ${(46 * settleK).toFixed(1)}px ${glow(B, 0.42 * settleK)})` }}>
        <LogoOpen brand={B} at={10} x={m.cx} y={m.cy} width={m.w}
          settle={{ at: CLOCK.logoSettle, x: e.left + e.w / 2, y: e.cy, width: e.w }} />
      </div>
    </>
  );
};

const Type: React.FC<{ f: number; lay: Layout; aspect: Aspect }> = ({ f, lay, aspect }) => {
  const { glyphs, caret } = typeFrame(f, lay, aspect);
  return (
    <>
      {glyphs.map((g) => (
        <div key={g.key} style={{ position: "absolute", left: g.x, top: g.y, fontFamily: "Zodiak", fontWeight: 700, fontSize: g.size, lineHeight: 1,
          letterSpacing: `${TRACK}em`, whiteSpace: "pre", color: B.color.ink, opacity: g.o, filter: g.blur > 0.05 ? `blur(${g.blur.toFixed(2)}px)` : undefined }}>
          {g.text}
        </div>
      ))}
      {caret && caret.on ? (
        <div style={{ position: "absolute", left: caret.x, top: caret.y, width: caret.w, height: caret.h, borderRadius: caret.w / 2,
          background: B.color.accent, boxShadow: `0 0 ${(caret.h * 0.3).toFixed(1)}px ${glow(B, 0.55)}` }} />
      ) : null}
    </>
  );
};

/** The address, typed by the caret (the caret itself is drawn by Type). */
const EndUrl: React.FC<{ f: number; lay: Layout }> = ({ f, lay }) => {
  if (f < CLOCK.urlStart) return null;
  const n = Math.min(URL_TEXT.length, Math.floor((f - CLOCK.urlStart) / F.urlType) + 1);
  const U = lay.end.url;
  return (
    <div style={{ position: "absolute", left: lay.end.left, top: lay.end.urlBase - U * 0.96, fontFamily: INTER, fontWeight: 600, fontSize: U, lineHeight: 1.2,
      letterSpacing: "-0.01em", color: B.color.ink, whiteSpace: "pre" }}>
      {URL_TEXT.slice(0, n)}
    </div>
  );
};
