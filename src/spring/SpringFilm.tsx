/**
 * CampusAI, "plan your spring" (round 10, 2026-10-30). 4:5, 30fps, sound only (no music since round 9). Round 10 is
 * re-captured on the flow as it is now (capture/spring-desk3.cjs, public/spring5/): reviews in preferences, the required
 * class locked in and picked first, professors on the sections (ratings under 4.0 hidden at capture).
 *
 * Plays on the photoreal laptop (four/real-laptop.tsx, the device from the Morning and Spotlight films) showing real
 * 1440x929 desktop captures; the camera moves across the screen to where each step happens, and the cursor, press
 * ripples, hover glow and landing blocks are drawn ON the glass, in screen px.
 *
 * Round 3 put it on the computer, slower. Round 4, Jacob's notes: the first two answers can stay quick but "where you
 * stand" and the preferences slow down, and the template is actually changed (Swap a type: the elective becomes a gen
 * ed), so the fifth class is a gen ed with only one section that fits.
 *
 * Round 5: the lid opens faster over a background (the Oct 16 wall of real screens, dim and tilted), the camera
 * goes in close on "Ready to plan your spring classes?" for the press, and the term and transcript answers are
 * skipped, so the steps read: your degree progress, confirm when you graduate, choose your preferences.
 *
 *   0-5.3    the laptop opens on the dashboard; close in on the Ask CampusAI card; the cursor presses it
 *   5.3-13   where you stand (degree progress), Looks right; graduating May 2028, Yes; the goal question
 *   13-20    the preferences, one chip every 1.4 beats (shelf chip-grid-single-select-blackout)
 *   20-26.3  the template, then Swap a type: Elective, then A gen ed; the card updates; Looks good
 *   26.3-46  the suggested classes, then the week and the chat side by side: hover a time and its dashed block shows on the week, press and it
 *            lands; four classes, then the gen ed, where only one section fits
 *   46-54.6  the full week, Add to my 4-year plan, Meet your advisor
 *   54.6-    logo, "Ask CampusAI to plan your spring." Link in bio.
 *
 * Film beats (beats.ts), music from beat 60 so the picks start on the track's step up. Captures:
 * `capture/spring-desk2.cjs` (public/spring4/), professor names and ratings hidden at capture time. The closing
 * card's title greets Maya as "May" (a demo bug); the advisor framing keeps that title under the headline band.
 * Laptop model CC-BY-4.0 (credit in the post caption). Sounds and music Mixkit free license.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { BlurLines, useZodiak, ZODIAK, INTER } from "../kit/parts";
import { EASE, mix, ramp } from "../shots/_fixtures/Polish";
import { springAt } from "../shots/_fixtures/Look";
import { RealLaptop, laptopIntro, onScreen, type CamKey } from "../four/real-laptop";
import { BG, INK, cursorAt, type CursorKey } from "./parts";
import { Box, CHIPS, LOCK_CHIP, LOCKED_LABEL, PICK_BLOCKS, PRESS, REC_ROW, REVIEWS_CHIP, SHEET, SWAP_PANEL, TPL_CARD, TPL_ROWS, WT } from "./data";
import { B, beatAt, FILM_FRAMES, holdFrames, SIZE } from "./beats";
import { STEP_ICONS } from "./icons";

export { FPS as SPRING_FPS, SIZE as SPRING_SIZE } from "./beats";
export const SPRING_FRAMES = FILM_FRAMES;

const SW = 1440, SH = 929; // the screen, in CSS px
const ASPECT = SIZE.width / SIZE.height;
const shot = (b: number, u: number, v: number, fill: number, ease = Easing.bezier(0.55, 0, 0.2, 1)): CamKey => ({ at: Math.round(B(b)), ...onScreen(u, v, fill, ASPECT), ease });
const hold = (b: number, k: CamKey): CamKey => ({ ...k, at: Math.round(B(b)) });
const mid = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const st = (n: string) => staticFile(`spring5/${n}.jpg`);

/* ---------------- timeline (film beats) ---------------- */

// Round 10: the flow as it is now (capture/spring-desk3.cjs, public/spring5/). The first two answers (term,
// transcript) are still skipped, the goal question is gone from the product, preferences carry reviews, then the
// required class: search BMGT495, lock it in, and it is picked first.
const DASH_PRESS = 5.0;
const STAND_AT = 5.3, LOOKS_RIGHT = 8.0, GRAD_YES = 9.9;
const PREFS_AT = 10.1;
const CHIP_AT = [11.6, 13.0, 14.4, 15.8];
const PICKED = ["Afternoons", "Back to back", "Fri", "In person"];
const REQ_AT = 17.6, SEARCH_PRESS = 19.0, TYPE_AT = 20.0, KEY = 0.22, MATCH_PRESS = 22.6, SHEET_DONE = 23.7, LOCK_PRESS = 25.0;
const TPL_AT = 25.15, SWAP_PRESS = 28.4, ELECTIVE_PRESS = 29.6, GENED_PRESS = 30.8, TPL_PRESS = 32.4;
const C2_CLASS_PRESS = 36.6, C5_CLASSES_AT = 43.6, C5_CLASS_PRESS = 44.8;
const PK = [
  { in: 32.6, hover: 34.0, press: 35.4 }, // BMGT495, the locked class, first
  { in: 36.75, hover: 37.6, press: 38.8 },
  { in: 39.6, hover: 40.2, press: 40.9 },
  { in: 41.7, hover: 42.2, press: 42.9 },
  { in: 44.95, hover: 46.4, press: 47.8 }, // the gen ed, with why it is recommended
];
const ADD_PRESS = 51.2, SAVED_AT = 52.3, BOOK_HOVER = 54.4, END_AT = 56.2;

/** What is on the glass, in order: [film beat it appears, still]. */
const EVENTS: [number, string][] = ([
  [0, "dash"], [STAND_AT, "open2"], [LOOKS_RIGHT + 0.15, "open3"], [PREFS_AT, "prefs0"],
  ...CHIP_AT.map((p, i): [number, string] => [p, `prefs${i + 1}`]),
  [REQ_AT, "req0"], [SEARCH_PRESS + 0.1, "req1"],
  ...Array.from({ length: 7 }, (_, i): [number, string] => [TYPE_AT + i * KEY, `reqt${i + 1}`]),
  [MATCH_PRESS + 0.1, "req2"], [SHEET_DONE + 0.15, "req3"],
  [TPL_AT, "tpl"], [SWAP_PRESS + 0.1, "swap1"], [ELECTIVE_PRESS + 0.1, "swap2"], [GENED_PRESS + 0.15, "tpl2"],
  ...PK.flatMap((p, i): [number, string][] => [[p.in, `c${i + 1}sec`], [p.hover, `c${i + 1}hover`], [p.press, `c${i + 1}add`]]),
  [C5_CLASSES_AT, "c5classes"],
  [SAVED_AT, "saved"],
] as [number, string][]).sort((x, y) => x[0] - y[0]);
const screenAt = (b: number) => EVENTS.filter(([at]) => b >= at).pop()![1];

/* ---------------- camera: the laptop opens, then the camera works across the screen ---------------- */

const DASH_CARD: Box = { x: PRESS.dash.x, y: PRESS.dash.y, w: PRESS.dash.w, h: 80 }; // the card's top row, where its title sits
const DASH_CAM = shot(3.9, 0.44, 0.56, 1.75);
// a faster open: the lid starts almost at once and the camera is on Ask CampusAI by beat 3.9
const intro = laptopIntro({ aspect: ASPECT, from: 0, openAt: Math.round(B(0.25)), heroAt: Math.round(B(2.0)), pushAt: Math.round(B(2.3)), pushEnd: Math.round(B(3.9)), push: DASH_CAM });
// then in close on "Ready to plan your spring classes?" for the press
const CARD = shot(4.7, mid(DASH_CARD).x / SW, mid(DASH_CARD).y / SH, 2.8);
const STAND = shot(5.9, 0.62, 0.52, 1.65); // where you stand: the degree progress card
const GRAD = shot(8.7, 0.42, 0.5, 2.0); // "You're graduating May 2028, right?"
const PREFS = shot(10.7, 0.45, 0.55, 2.2); // five rows now, down to "Do reviews matter to you?"
const REQ = shot(18.2, 0.6, 0.72, 1.55); // the required-class question, its search box and Lock it in
const SHEETCAM = shot(19.6, mid(SHEET).x / SW + 0.06, mid(SHEET).y / SH - 0.1, 1.65); // the title clear of the headline band, the search and the match, big enough to read the typing
const TPL = shot(25.8, 0.6, 0.58, 1.6);
const SWAP = shot(28.8, mid(SWAP_PANEL[1]).x / SW, mid(SWAP_PANEL[1]).y / SH, 2.3);
const TPL2 = shot(31.5, 0.6, 0.58, 1.6);
const SIDE = shot(33.0, 0.52, 0.5, 1.45); // the week and the chat side by side
// close on the week and the times, so the hover and the dashed block read together
const CLOSER = (b: number, u = 0.43, fill = 2.0) => shot(b, u, 0.53, fill);
const C5 = shot(45.4, 0.7, 0.6, 1.8); // the gen ed: close enough to read why its time is recommended
const WHOLE = shot(48.6, 0.5, 0.5, 1.08);
const ADD = shot(50.4, 0.72, 0.6, 1.7);
// the card's title greets Maya as "May" (a demo bug), so this framing keeps it under the headline band
// round 8: lower, so the card's top row clears the headline and the step icons (the band is cut sharper for this shot)
const ADV = shot(52.9, 0.625, 0.663, 2.55);
const CAMERA: CamKey[] = [
  ...intro.camera,
  CARD, hold(5.2, CARD), STAND, hold(8.1, STAND), GRAD, hold(10.0, GRAD), PREFS, hold(17.4, PREFS),
  REQ, hold(19.1, REQ), SHEETCAM, hold(23.8, SHEETCAM), hold(24.3, REQ), hold(25.2, REQ),
  TPL, hold(28.5, TPL), SWAP, hold(31.0, SWAP), TPL2, hold(32.5, TPL2),
  SIDE, hold(33.4, SIDE), CLOSER(34.2), hold(35.9, CLOSER(34.2)), hold(36.7, SIDE), hold(37.3, SIDE),
  CLOSER(38.0, 0.47, 1.8), hold(39.3, CLOSER(38.0, 0.47, 1.8)), hold(40.0, SIDE), hold(43.4, SIDE), C5, hold(48.0, C5),
  WHOLE, hold(49.9, WHOLE), ADD, hold(52.2, ADD), ADV,
];

/* ---------------- what is drawn on the glass ---------------- */

/** One region of a screen still, at its own place on the screen. */
const Piece: React.FC<{ src: string; box: Box; style?: React.CSSProperties }> = ({ src, box, style }) => (
  <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, overflow: "hidden", ...style }}>
    <Img src={src} style={{ position: "absolute", left: -box.x, top: -box.y, width: SW, height: SH, maxWidth: "none" }} />
  </div>
);

/** The cursor on the glass (shelf cursor-flyover), screen px. */
const cursorKeys: CursorKey[] = (() => {
  const k: CursorKey[] = [];
  const at = (b: number) => Math.round(B(b));
  const c = (box: Box, dx = 0) => ({ x: mid(box).x + dx, y: mid(box).y + 4 });
  const tap = (b: number, box: Box, lead = 0.6, dx = 0) => k.push({ at: at(b - lead), ...c(box, dx) }, { at: at(b), ...c(box, dx), press: true });
  k.push({ at: at(3.4), x: 1100, y: 860 }, { at: at(DASH_PRESS), ...c(DASH_CARD), press: true });
  tap(LOOKS_RIGHT, PRESS.open2, 0.8); tap(GRAD_YES, PRESS.open3);
  CHIP_AT.forEach((p, i) => k.push({ at: at(p), ...c(CHIPS[i].find((x) => x.t === PICKED[i])!), press: true }));
  tap(SEARCH_PRESS, PRESS.search, 0.8, -250);
  tap(MATCH_PRESS, PRESS.match, 0.5); tap(SHEET_DONE, PRESS.sheetDone, 0.6); tap(LOCK_PRESS, PRESS.lock, 0.7);
  tap(SWAP_PRESS, PRESS.swap, 0.8);
  tap(ELECTIVE_PRESS, PRESS.elective, 0.6, -60); tap(GENED_PRESS, PRESS.gened, 0.6, -60);
  tap(TPL_PRESS, PRESS.looksGood, 0.8);
  PK.forEach((p, i) => {
    if (i === 1) tap(C2_CLASS_PRESS, PRESS.c2class, 0.5, -200);
    if (i === 4) tap(C5_CLASS_PRESS, PRESS.c5class, 0.6, -200);
    const r = PRESS[`c${i + 1}row`];
    // on the row's arrow, so the time and the reason under it stay readable
    const pt = { x: r.x + r.w - 14, y: r.y + 10 };
    k.push({ at: at(p.hover), ...pt }, { at: at(p.press), ...pt, press: true });
  });
  k.push({ at: at(ADD_PRESS), ...c(PRESS.add), press: true }, { at: at(BOOK_HOVER), ...c(PRESS.book) });
  return k;
})();

const ScreenCursor: React.FC<{ f: number }> = ({ f }) => {
  if (f < B(3.4) || f > B(END_AT)) return null;
  const { x, y } = cursorAt(f, cursorKeys);
  const presses = cursorKeys.filter((k) => k.press);
  const dip = presses.reduce((d, k) => Math.max(d, f >= k.at - 3 && f < k.at + 4 ? 1 - Math.abs(f - k.at) / 4 : 0), 0);
  return (
    <>
      {presses.map((k) => {
        if (f < k.at || f > k.at + 16) return null;
        const r = ramp(f, k.at, 16, EASE.out);
        return <div key={k.at} style={{ position: "absolute", left: k.x - 30 * r, top: k.y - 30 * r, width: 60 * r, height: 60 * r, borderRadius: "50%",
          border: `2px solid rgba(255,255,255,${(0.75 * (1 - r)).toFixed(3)})`, background: `rgba(232,66,78,${(0.22 * (1 - r)).toFixed(3)})` }} />;
      })}
      <svg width={26} height={35} viewBox="0 0 32 43" style={{ position: "absolute", left: x - 2, top: y - 1, transform: `scale(${(1 - 0.14 * dip).toFixed(3)})`,
        transformOrigin: "2px 1px", filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.55))", opacity: ramp(f, B(3.4), 6, EASE.out) }}>
        <path d="M2 1 L2 33 L10 26 L15.5 39 L21 36.6 L15.6 24 L26 24 Z" fill="#fff" stroke="#120c0d" strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </>
  );
};

/* ---------------- round 14: three moments drawn on the glass (Jacob's yes to all three) ---------------- */

const LOCK_HOLD = 25.8, EXPLODE_AT = 26.2, FOCUS_AT = 33.2; // the holds in beats.ts

const LockIcon: React.FC<{ close: number }> = ({ close }) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ overflow: "visible" }}>
    <rect width={18} height={11} x={3} y={11} rx={2} />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" transform={`translate(${(3 * (1 - close)).toFixed(2)} ${(-5 * (1 - close)).toFixed(2)})`} />
  </svg>
);

/** 1. The lock snaps on: the picked chip grows into the BMGT495 row of the template, a lock shuts over it, then
 *  settles into the row's own "Locked" label. (The shelf move: element-body-moves lift, then icon-performance-moves.) */
const LockMoment: React.FC<{ f: number }> = ({ f }) => {
  const L = B(LOCK_PRESS);
  const [, end] = holdFrames(LOCK_HOLD);
  if (f < L || f > end + 2) return null;
  const row = TPL_ROWS[2];
  const fly = springAt(f, L, { damping: 17, stiffness: 95 });
  const x = mix(LOCK_CHIP.x, row.x, fly), y = mix(LOCK_CHIP.y, row.y, fly);
  const sx = mix(LOCK_CHIP.w / row.w, 1, fly), sy = mix(LOCK_CHIP.h / row.h, 1, fly);
  const landed = ramp(f, L + 15, 6, EASE.out);
  const glow = landed * (1 - ramp(f, L + 17, 16, EASE.out));
  const pop = springAt(f, L + 11, { damping: 10, stiffness: 210 });
  const shut = springAt(f, L + 19, { damping: 11, stiffness: 280 });
  const ring = ramp(f, L + 19, 14, EASE.out);
  const away = ramp(f, end - 8, 10, EASE.smooth);
  const lab = mid(LOCKED_LABEL);
  return (
    <>
      {landed < 1 && <div style={{ position: "absolute", left: row.x, top: row.y, width: row.w, height: row.h, borderRadius: 6, background: "#151012",
        border: "1px dashed rgba(255,255,255,0.16)", opacity: 1 - landed }} />}
      <Piece src={st("tpl")} box={row} style={{ borderRadius: 6, transformOrigin: "0 0",
        transform: `translate(${(x - row.x).toFixed(2)}px, ${(y - row.y).toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
        boxShadow: `0 ${(16 * (1 - landed)).toFixed(1)}px 30px rgba(0,0,0,${(0.55 * (1 - landed)).toFixed(3)}), 0 0 ${(26 * glow).toFixed(1)}px rgba(232,66,78,${(0.85 * glow).toFixed(3)})` }} />
      {f >= L + 11 && (
        <div style={{ position: "absolute", left: lab.x - 24, top: lab.y - 58, width: 48, height: 48, opacity: Math.min(1, pop * 1.5) * (1 - away),
          transform: `translateY(${(away * 50).toFixed(1)}px) scale(${(mix(0.5, 1, pop) * mix(1, 0.3, away)).toFixed(4)})` }}>
          {ring < 1 && <div style={{ position: "absolute", left: -16 * ring, top: -16 * ring, width: 48 + 32 * ring, height: 48 + 32 * ring, borderRadius: "50%",
            border: `2px solid rgba(232,66,78,${(0.75 * (1 - ring)).toFixed(3)})` }} />}
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#D9202E", boxShadow: "0 6px 22px rgba(217,32,46,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LockIcon close={Math.min(1, shut)} />
          </div>
        </div>
      )}
    </>
  );
};

/** 2. The template comes apart (Jacob's ExplodedPage favorite, flattened onto the glass): the five rows lift off the
 *  card and spread, each showing its own type, hold, then snap back flat. */
const ExplodeMoment: React.FC<{ f: number }> = ({ f }) => {
  const [s, e] = holdFrames(EXPLODE_AT);
  if (f < s || f > e + 4) return null;
  const back = springAt(f, e - 14, { damping: 16, stiffness: 190 });
  return (
    <>
      <div style={{ position: "absolute", left: TPL_CARD.x, top: TPL_CARD.y, width: TPL_CARD.w, height: TPL_CARD.h, borderRadius: 12,
        background: `rgba(8,5,6,${(0.78 * Math.min(1, springAt(f, s, { damping: 18, stiffness: 160 })) * (1 - Math.min(1, back))).toFixed(3)})` }} />
      {TPL_ROWS.map((r, i) => {
        const a = Math.max(0, springAt(f, s + i * 2, { damping: 13, stiffness: 150 }) - back);
        return <Piece key={i} src={st("tpl")} box={r} style={{ borderRadius: 6,
          transform: `translate(${((i - 2) * 3 * a).toFixed(2)}px, ${((i - 2) * 14 * a).toFixed(2)}px) scale(${(1 + 0.04 * a).toFixed(4)})`,
          boxShadow: `0 ${(12 * a).toFixed(1)}px 26px rgba(0,0,0,${(0.6 * a).toFixed(3)}), inset 0 0 0 1px rgba(255,255,255,${(0.1 * a).toFixed(3)})` }} />;
      })}
    </>
  );
};

/** 3. The spotlight on why (Jacob's FocusWalk favorite): the page dims; the light sits on the reviews chip in Your
 *  preferences, then moves to the recommended time and its reason, "...William Hurst is rated 5.0". */
const FocusMoment: React.FC<{ f: number }> = ({ f }) => {
  const [s, e] = holdFrames(FOCUS_AT);
  if (f < s || f > e) return null;
  const dim = ramp(f, s, 8, EASE.out) * (1 - ramp(f, e - 8, 8, EASE.out));
  const k = ramp(f, s + 22, 14, EASE.smooth);
  const pad = (b: Box, p: number): Box => ({ x: b.x - p, y: b.y - p, w: b.w + 2 * p, h: b.h + 2 * p });
  const a = pad(REVIEWS_CHIP, 7), b = pad(REC_ROW, 3);
  const r = { x: mix(a.x, b.x, k), y: mix(a.y, b.y, k), w: mix(a.w, b.w, k), h: mix(a.h, b.h, k) };
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 12,
      boxShadow: `0 0 0 3000px rgba(6,3,4,${(0.68 * dim).toFixed(3)}), 0 0 0 1.5px rgba(232,66,78,${(0.85 * dim).toFixed(3)}), 0 0 30px rgba(232,66,78,${(0.35 * dim).toFixed(3)})` }} />
  );
};

const Screen: React.FC<{ f: number }> = ({ f }) => {
  const b = beatAt(f);
  const name = screenAt(b);
  const rowHover = (box: Box, press: number) =>
    b >= press - 0.6 && b < press + 0.1 ? <div style={{ position: "absolute", left: box.x + 4, top: box.y, width: box.w - 8, height: box.h, borderRadius: 6, background: "rgba(255,255,255,0.07)" }} /> : null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, background: "#100a0c" }}>
      <Img src={st(name)} style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, maxWidth: "none" }} />
      {/* the saved state fades in under the advisor framing */}
      {b >= SAVED_AT && f < B(SAVED_AT) + 8 && <Img src={st("c5add")} style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, maxWidth: "none",
        opacity: 1 - ramp(f, B(SAVED_AT), 8, EASE.out) }} />}
      {/* preferences: a grey press frame, a small bounce, the rest of the row drops back */}
      {b >= PREFS_AT && b < REQ_AT && CHIP_AT.map((p, i) => {
        const pf = B(p);
        if (f < pf - 2) return null;
        const done = CHIP_AT.filter((q) => b >= q).length;
        const chosen = CHIPS[i + 1].find((x) => x.t === PICKED[i])!;
        const rest = CHIPS[done].filter((x) => Math.abs(x.y - chosen.y) < 2 && x.t !== PICKED[i]);
        const dim = ramp(f, pf, 6, EASE.out) * 0.66;
        const flash = f < pf;
        const box = flash ? CHIPS[i].find((x) => x.t === PICKED[i])! : chosen;
        const sc = flash ? 0.97 : mix(0.9, 1, springAt(f, pf, { damping: 10, stiffness: 210 }));
        return (
          <React.Fragment key={p}>
            {rest.map((x) => <div key={x.t + x.x} style={{ position: "absolute", left: x.x - 1, top: x.y - 1, width: x.w + 2, height: x.h + 2, borderRadius: 9,
              background: `rgba(14,9,10,${dim.toFixed(3)})` }} />)}
            {f < pf + 22 && <Piece src={st(flash ? `prefs${i}` : `prefs${i + 1}`)} box={box}
              style={{ borderRadius: 8, transform: `scale(${sc.toFixed(4)})`, filter: flash ? "brightness(1.7) saturate(0)" : undefined }} />}
          </React.Fragment>
        );
      })}
      {/* Swap a type: the row about to be chosen lights as the cursor reaches it */}
      {name === "swap1" && rowHover(PRESS.elective, ELECTIVE_PRESS)}
      {name === "swap2" && rowHover(PRESS.gened, GENED_PRESS)}
      {/* a hovered time: its dashed preview on the week glows */}
      {PK.map((p, i) => {
        if (b < p.hover || b >= p.press) return null;
        const pulse = 0.55 + 0.45 * Math.sin(((f - B(p.hover)) / 10) * Math.PI);
        return PICK_BLOCKS[i].map((x) => (
          <div key={`${i}${x.x}`} style={{ position: "absolute", left: x.x - 3, top: WT[`c${i + 1}hover`] + x.y - 3, width: x.w + 6, height: x.h + 6, borderRadius: 8,
            boxShadow: `0 0 ${(16 * pulse).toFixed(1)}px rgba(232,66,78,${(0.8 * pulse).toFixed(3)}), inset 0 0 0 1.5px rgba(232,66,78,${(0.75 * pulse).toFixed(3)})` }} />
        ));
      })}
      {/* a pressed time lands solid */}
      {PK.map((p, i) => {
        const pf = B(p.press);
        if (f < pf || f > pf + 20 || b >= SAVED_AT) return null;
        const s = springAt(f, pf, { damping: 11, stiffness: 190 });
        const glow = 1 - ramp(f, pf + 4, 16, EASE.out);
        return PICK_BLOCKS[i].map((x) => (
          <Piece key={`${i}${x.x}`} src={st(`c${i + 1}add`)} box={{ x: x.x, y: WT[`c${i + 1}add`] + x.y, w: x.w, h: x.h }}
            style={{ borderRadius: 6, transform: `scale(${mix(1.4, 1, s).toFixed(4)})`, boxShadow: `0 0 ${(26 * glow).toFixed(1)}px rgba(232,66,78,${(0.85 * glow).toFixed(3)})` }} />
        ));
      })}
      <LockMoment f={f} />
      <ExplodeMoment f={f} />
      <FocusMoment f={f} />
      <ScreenCursor f={f} />
    </div>
  );
};

/* ---------------- the room behind the laptop ---------------- */

// Round 5, Jacob: "some background instead of it just being black". The approved Oct 16 wall look: real CampusAI
// screens (public/wall, campusai-demo captures) on one tilted grid (-11deg), dim and soft so the laptop stays the
// subject, over the brand red-black gradient with a red glow behind the laptop. It drifts slowly.
const WALL = ["D_dashboard", "D_planner", "D_calendar", "D_jobs", "D_degree", "D_chat", "D_classes", "D_orgs", "D_eventdetail", "D_resume"];
const Room: React.FC<{ f: number }> = ({ f }) => {
  const tw = 520, th = 325, gap = 26;
  const drift = f * 0.35;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #1a0b0e 0%, #0e0709 48%, #070405 100%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -700, top: -900, width: 2600, height: 3200, transform: `rotate(-11deg) translateY(${(-drift % (th + gap)).toFixed(1)}px)`,
        display: "grid", gridTemplateColumns: `repeat(5, ${tw}px)`, gap, alignContent: "start", filter: "blur(4px)", opacity: 0.2 }}>
        {Array.from({ length: 45 }, (_, i) => (
          <Img key={i} src={staticFile(`wall/${WALL[(i * 3 + Math.floor(i / 5)) % WALL.length]}.jpg`)}
            style={{ width: tw, height: th, borderRadius: 14, objectFit: "cover", display: "block" }} />
        ))}
      </div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 42% at 50% 60%, rgba(217,32,46,0.30) 0%, rgba(217,32,46,0.08) 55%, rgba(217,32,46,0) 75%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 80% at 50% 55%, rgba(5,3,4,0) 40%, rgba(5,3,4,0.85) 100%)" }} />
    </AbsoluteFill>
  );
};

/* ---------------- the step tracker (round 7) ---------------- */

// Jacob asked for icons; the pick was a tracker that explains the flow: seven product icons (Lucide, the set the
// app's own sidebar uses) in a row under the headline. The current step turns red with the shelf's
// icon-performance-moves bounce, done steps stay a dim red, the rest wait faint.
const STEPS: { icon: string; at: number }[] = [
  { icon: "chart-column-increasing", at: STAND_AT }, // degree progress
  { icon: "graduation-cap", at: LOOKS_RIGHT + 0.15 }, // when you graduate
  { icon: "sliders-horizontal", at: PREFS_AT }, // preferences, reviews included
  { icon: "lock", at: REQ_AT }, // the class you need, locked in (round 10)
  { icon: "list-checks", at: TPL_AT }, // the template, swap
  { icon: "calendar-days", at: PK[0].in }, // the picks, into the 4-year plan
  { icon: "user-round", at: SAVED_AT }, // meet your advisor
];
const Tracker: React.FC<{ f: number }> = ({ f }) => {
  const b = beatAt(f);
  if (b < STAND_AT - 0.3 || f > B(END_AT) + 10) return null;
  const cur = STEPS.filter((s) => b >= s.at).length - 1;
  const D = 46, GAP = 76, CY = 268;
  const x0 = 540 - ((STEPS.length - 1) * GAP) / 2;
  const show = ramp(f, B(STAND_AT - 0.3), 10, EASE.out) * (1 - ramp(f, B(END_AT), 10, EASE.exit));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: show }}>
      {STEPS.slice(1).map((st, i) => {
        // the line into a step fills red as that step starts
        const fill = ramp(f, B(st.at) - 6, 8, EASE.out);
        const xa = x0 + i * GAP + D / 2 + 6, xb = x0 + (i + 1) * GAP - D / 2 - 6;
        return (
          <div key={st.icon} style={{ position: "absolute", left: xa, top: CY - 1, width: xb - xa, height: 2, background: "rgba(255,255,255,0.14)", borderRadius: 2 }}>
            <div style={{ width: `${(fill * 100).toFixed(1)}%`, height: "100%", background: "rgba(232,66,78,0.75)", borderRadius: 2 }} />
          </div>
        );
      })}
      {STEPS.map((st, i) => {
        const state = i < cur ? "done" : i === cur ? "now" : "next";
        const k = state === "now" ? springAt(f, B(st.at), { damping: 8, stiffness: 220 }) : 1;
        const pop = state === "now" ? mix(0.55, 1, k) : 1;
        const hop = state === "now" ? -10 * Math.max(0, 1 - k) : 0;
        const ring = state === "now" ? ramp(f, B(st.at), 18, EASE.out) : 1;
        const enter = ramp(f, B(STAND_AT - 0.3) + i * 2, 8, EASE.out);
        const bg = state === "now" ? "#D9202E" : state === "done" ? "rgba(232,66,78,0.16)" : "rgba(255,255,255,0.05)";
        const line = state === "now" ? "rgba(255,120,128,0.9)" : state === "done" ? "rgba(232,66,78,0.5)" : "rgba(255,255,255,0.14)";
        const ink = state === "now" ? "#fff" : state === "done" ? "rgba(255,226,228,0.78)" : "rgba(255,255,255,0.34)";
        return (
          <div key={st.icon} style={{ position: "absolute", left: x0 + i * GAP - D / 2, top: CY - D / 2 + hop + (1 - enter) * 14, width: D, height: D, opacity: enter }}>
            {state === "now" && ring < 1 && (
              <div style={{ position: "absolute", left: -14 * ring, top: -14 * ring, width: D + 28 * ring, height: D + 28 * ring, borderRadius: "50%",
                border: `2px solid rgba(232,66,78,${(0.7 * (1 - ring)).toFixed(3)})` }} />
            )}
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: bg, boxShadow: `inset 0 0 0 1.5px ${line}${state === "now" ? ", 0 0 26px rgba(217,32,46,0.65)" : ""}`,
              transform: `scale(${pop.toFixed(4)})`, display: "flex", alignItems: "center", justifyContent: "center", color: ink }}>
              <svg width={22} height={22} viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: STEP_ICONS[st.icon] }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------------- words ---------------- */

const Headline: React.FC<{ lines: { text: string; accent?: boolean }[]; from: number; to: number }> = ({ lines, from, to }) => {
  const f = useCurrentFrame();
  if (f < B(from) || f > B(to) + 12) return null;
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 64 }}>
      <BlurLines lines={lines} at={B(from)} size={70} ink={INK} face={ZODIAK} outAt={B(to)} stagger={3} />
    </div>
  );
};
// round 10 (2026-10-30, Jacob): 8 headlines (10 since round 11). "Built from UMD's 4-year plan" sits on the template, before the swap
// ("build from UMD's plan, then make it yours"); the required class gets its own line; the advisor line says why.
// "When only one fits" is gone: on the flow as it is now, every class this run picks has more than one time that fits.
// Finance's plan_targets come from Smith's "Finance - 4 Year Plan - 2024.pdf"; the template says "Maryland's 4-year plan".
const LINES: { lines: { text: string; accent?: boolean }[]; from: number; to: number }[] = [
  { lines: [{ text: "Spring registration" }, { text: "is coming.", accent: true }], from: 0.9, to: 5.2 },
  // round 11, Jacob: words over every step, the top band is never empty
  { lines: [{ text: "It starts with" }, { text: "where you stand.", accent: true }], from: 5.5, to: 9.9 },
  { lines: [{ text: "Tell us your" }, { text: "preferences.", accent: true }], from: 10.2, to: 17.4 }, // round 12, Jacob
  { lines: [{ text: "Need a class?" }, { text: "It locks it in first.", accent: true }], from: 17.8, to: 25.9 },
  { lines: [{ text: "Built from UMD's" }, { text: "4-year plan.", accent: true }], from: 26.1, to: 28.2 },
  { lines: [{ text: "Then make it yours." }, { text: "Swap any class type.", accent: true }], from: 28.6, to: 32.1 },
  // round 14: over the spotlight, what links the preferences to the recommendation
  { lines: [{ text: "It uses what" }, { text: "you told it.", accent: true }], from: 32.7, to: 33.9 },
  { lines: [{ text: "Pick a class," }, { text: "then a time.", accent: true }], from: 34.1, to: 43.3 },
  { lines: [{ text: "It recommends" }, { text: "what fits.", accent: true }], from: 43.7, to: 47.9 },
  { lines: [{ text: "Add it to" }, { text: "your 4-year plan.", accent: true }], from: 48.2, to: 52.0 },
  { lines: [{ text: "Meet your advisor" }, { text: "to confirm it.", accent: true }], from: 52.6, to: 55.8 },
];

const End: React.FC<{ f: number }> = ({ f }) => {
  const k = springAt(f, B(END_AT + 0.4), { damping: 12, stiffness: 150 });
  const W = 560, H = (W * 53) / 223;
  return (
    <AbsoluteFill style={{ background: BG, opacity: ramp(f, B(END_AT), 10, EASE.out) }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 75% 40% at 50% 46%, rgba(217,32,46,0.22) 0%, rgba(217,32,46,0) 70%)" }} />
      <div style={{ position: "absolute", left: 540 - W / 2, top: 520 - H / 2, width: W, height: H, opacity: Math.min(1, k * 1.5),
        transform: `scale(${mix(1.3, 1, k).toFixed(4)})`, filter: `blur(${((1 - Math.min(1, k)) * 14).toFixed(2)}px) drop-shadow(0 0 34px rgba(217,32,46,0.55))` }}>
        <Img src={staticFile("brand/campusai-logo-white.svg")} style={{ width: W, height: H, display: "block" }} />
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 700 }}>
        <BlurLines lines={[{ text: "Ask CampusAI to" }, { text: "plan your spring.", accent: true }]} at={B(END_AT + 1)} size={76} ink={INK} face={ZODIAK} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 940, textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: 38,
        color: INK.soft, opacity: ramp(f, B(END_AT + 2), 12, EASE.out) }}>Link in bio.</div>
    </AbsoluteFill>
  );
};

/* ---------------- film ---------------- */

const a = (x: string) => staticFile(`flock/audio/${x}`);
const click = (b: number, name: string, volume = 0.4) => ({ at: B(b) - 1, src: a("ui-select-click.mp3"), volume, name });
// round 13, Jacob: clicks back on the presses (round 12 took them all out), but not the same click every time: each
// one is softer than round 11 and a little higher or lower in pitch (toneFrequency), so a run of presses does not
// repeat. The moments that change something keep their own sound on top: the lock-in, each class landing (two
// alternating pops), the plan added, the advisor card, the logo.
const TONES = [1, 1.08, 0.94, 1.12, 0.97, 1.05];
let presses = 0;
const tick = (b: number, name: string, volume = 0.24) => ({ ...click(b, name, volume), tone: TONES[presses++ % TONES.length] });
const CUES: { at: number; src: string; volume: number; name: string; tone?: number }[] = [
  { at: B(0.25), src: a("whoosh-swirl.mp3"), volume: 0.25, name: "lid" },
  tick(DASH_PRESS, "ask card", 0.4),
  tick(LOOKS_RIGHT, "looks right"), tick(GRAD_YES, "grad yes"),
  ...CHIP_AT.map((p, i) => tick(p, `chip ${i}`, 0.22)),
  tick(SEARCH_PRESS, "search", 0.2), tick(MATCH_PRESS, "match"), tick(SHEET_DONE, "sheet done", 0.2), tick(LOCK_PRESS, "lock it in", 0.3),
  { at: B(LOCK_PRESS) - 1, src: a("light-sweep-magic.mp3"), volume: 0.2, name: "lock sweep" },
  tick(SWAP_PRESS, "swap a type"), tick(ELECTIVE_PRESS, "elective", 0.2), tick(GENED_PRESS, "a gen ed"),
  tick(TPL_PRESS, "looks good", 0.28), tick(C2_CLASS_PRESS, "class"), tick(C5_CLASS_PRESS, "gen ed class"),
  ...PK.map((p, i) => ({ at: B(p.press) - 1, src: a(i % 2 ? "ui-message-pop.mp3" : "ui-popup-dry.mp3"), volume: 0.34, name: `class ${i + 1} lands` })),
  tick(ADD_PRESS, "add to plan", 0.3),
  { at: B(ADD_PRESS) - 1, src: a("ui-message-pop.mp3"), volume: 0.36, name: "plan added" },
  { at: holdFrames(EXPLODE_AT)[0], src: a("air-zoom-vacuum.mp3"), volume: 0.16, name: "template apart" },
  { at: holdFrames(EXPLODE_AT)[1] - 14, src: a("ui-select-click.mp3"), volume: 0.2, name: "template back", tone: 0.9 },
  { at: holdFrames(FOCUS_AT)[0] + 24, src: a("swoosh-quick.mp3"), volume: 0.12, name: "spotlight moves" },
  { at: B(SAVED_AT), src: a("swoosh-quick.mp3"), volume: 0.25, name: "to advisor" },
  { at: B(END_AT + 0.4), src: a("bass-hit-futuristic.mp3"), volume: 0.45, name: "logo lands" },
];



export const SpringFilm: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#050505", overflow: "hidden" }}>
      {f < B(END_AT) + 12 && <Room f={f} />}
      {f < B(END_AT) + 12 && (
        <RealLaptop screen={{ node: <Screen f={f} /> }} camera={CAMERA} lid={intro.lid} nodeWidth={SW} />
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 480,
        background: `linear-gradient(180deg, ${BG} 0%, ${BG} 52%, rgba(11,7,8,0.85) 66%, rgba(11,7,8,0) 100%)`,
        opacity: ramp(f, B(1.2), 10, EASE.out) * (1 - ramp(f, B(SAVED_AT), B(52.9) - B(SAVED_AT), EASE.smooth)) }} />
      {/* on the advisor card the band ends sharp at 300px: the "May" title above the card stays under solid dark, the
          card's top row (TerpEngage, Meet your advisor) sits clear below the step icons */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 360,
        background: `linear-gradient(180deg, ${BG} 0%, ${BG} 83%, rgba(11,7,8,0) 100%)`,
        opacity: ramp(f, B(SAVED_AT), B(52.9) - B(SAVED_AT), EASE.smooth) }} />
      {LINES.map((l) => <Headline key={l.from} {...l} />)}
      <Tracker f={f} />
      {f >= B(END_AT) && <End f={f} />}
      {/* round 9: no music, Jacob adds a trending song when he posts; the presses keep their clicks */}
      {CUES.map((c) => (
        <Sequence key={c.name} from={Math.round(c.at)} name={c.name}>
          <Audio src={c.src} volume={() => c.volume} toneFrequency={c.tone} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
