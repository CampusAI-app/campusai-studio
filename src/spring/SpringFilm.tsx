/**
 * CampusAI, "plan your spring" (round 8, 2026-10-22). 4:5, 30fps, about 33.5s, music and sound.
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
import { Box, CHIPS, DASH_CARD, PICK_ROWS, PRESS, SWAP_PANEL, WT } from "./data";
import { B, FILM_FRAMES, MUSIC_TRIM, SIZE } from "./beats";
import { STEP_ICONS } from "./icons";

export { FPS as SPRING_FPS, SIZE as SPRING_SIZE } from "./beats";
export const SPRING_FRAMES = FILM_FRAMES;

const SW = 1440, SH = 929; // the screen, in CSS px
const ASPECT = SIZE.width / SIZE.height;
const shot = (b: number, u: number, v: number, fill: number, ease = Easing.bezier(0.55, 0, 0.2, 1)): CamKey => ({ at: Math.round(B(b)), ...onScreen(u, v, fill, ASPECT), ease });
const hold = (b: number, k: CamKey): CamKey => ({ ...k, at: Math.round(B(b)) });
const mid = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const st = (n: string) => staticFile(`spring4/${n}.jpg`);

/* ---------------- timeline (film beats) ---------------- */

// Round 5: the lid opens faster, and the first two answers (term, transcript) are skipped: the press on the card
// cuts straight to where you stand.
const DASH_PRESS = 5.0;
const STAND_AT = 5.3, LOOKS_RIGHT = 8.0, GRAD_YES = 9.9;
const GOAL_HOVER = 10.9, GOAL_PRESS = 11.7, GOAL_DONE = 12.5;
const PREFS_AT = 13;
const CHIP_AT = [14.6, 16.0, 17.4, 18.8];
const PICKED = ["Afternoons", "Back to back", "Fri", "In person"];
const TPL_AT = 20, SWAP_PRESS = 22, ELECTIVE_PRESS = 23.2, GENED_PRESS = 24.4, TPL_PRESS = 26;
const CLASS_AT = 26.3, CLASS_PRESS = 28.9; // a beat longer on the suggested classes (round 6)
const C5_CLASSES_AT = 42.5, C5_CLASS_PRESS = 43.6;
const PK = [
  { in: 29.3, hover: 30.8, press: 32.6 },
  { in: 33.6, hover: 34.6, press: 36.0 },
  { in: 36.9, hover: 37.9, press: 40.0 },
  { in: 40.8, hover: 41.3, press: 42.0 },
  { in: 43.8, hover: 44.6, press: 45.6 },
];
const ADD_PRESS = 49.6, SAVED_AT = 50.8, BOOK_HOVER = 53, END_AT = 54.6;

/** What is on the glass, in order: [film beat it appears, still]. */
const EVENTS: [number, string][] = ([
  [0, "dash"], [STAND_AT, "open2"], [LOOKS_RIGHT + 0.15, "open3"], [GRAD_YES + 0.15, "open4"],
  [GOAL_PRESS + 0.15, "open5"], [PREFS_AT, "prefs0"],
  ...CHIP_AT.map((p, i): [number, string] => [p, `prefs${i + 1}`]),
  [TPL_AT, "tpl"], [SWAP_PRESS + 0.1, "swap1"], [ELECTIVE_PRESS + 0.1, "swap2"], [GENED_PRESS + 0.15, "tpl2"],
  [CLASS_AT, "c1classes"],
  ...PK.flatMap((p, i): [number, string][] => [[p.in, `c${i + 1}sec`], [p.hover, `c${i + 1}hover`], [p.press, `c${i + 1}add`]]),
  [C5_CLASSES_AT, "c5classes"],
  [SAVED_AT, "saved"],
] as [number, string][]).sort((x, y) => x[0] - y[0]);
const screenAt = (b: number) => EVENTS.filter(([at]) => b >= at).pop()![1];

/* ---------------- camera: the laptop opens, then the camera works across the screen ---------------- */

const DASH_CAM = shot(3.9, 0.44, 0.56, 1.75);
// a faster open: the lid starts almost at once and the camera is on Ask CampusAI by beat 3.9
const intro = laptopIntro({ aspect: ASPECT, from: 0, openAt: Math.round(B(0.25)), heroAt: Math.round(B(2.0)), pushAt: Math.round(B(2.3)), pushEnd: Math.round(B(3.9)), push: DASH_CAM });
// then in close on "Ready to plan your spring classes?" for the press
const CARD = shot(4.7, mid(DASH_CARD).x / SW, mid(DASH_CARD).y / SH, 2.8);
const STAND = shot(5.9, 0.62, 0.52, 1.65); // where you stand: the degree progress card
const GRAD = shot(8.7, 0.42, 0.5, 2.0); // "You're graduating May 2028, right?"
const GOAL = shot(10.6, 0.5, 0.6, 1.9);
const PREFS = shot(13.8, 0.43, 0.62, 2.55);
const TPL = shot(20.7, 0.6, 0.62, 1.6);
const SWAP = shot(22.5, mid(SWAP_PANEL).x / SW, mid(SWAP_PANEL).y / SH, 2.3);
const TPL2 = shot(25.1, 0.6, 0.6, 1.6);
const SIDE = shot(26.9, 0.52, 0.5, 1.45); // the week and the chat side by side
// close on the week and the times, so the hover and the dashed block read together
const CLOSER = (b: number, u = 0.43, fill = 2.0) => shot(b, u, 0.53, fill);
const C5 = shot(44.2, 0.565, 0.5, 1.3); // wide enough for the week's Mon column and the Add to my week button
const WHOLE = shot(46.8, 0.5, 0.5, 1.08);
const ADD = shot(48.8, 0.72, 0.6, 1.7);
// the card's title greets Maya as "May" (a demo bug), so this framing keeps it under the headline band
// round 8: lower, so the card's top row clears the headline and the step icons (the band is cut sharper for this shot)
const ADV = shot(51.4, 0.625, 0.663, 2.55);
const CAMERA: CamKey[] = [
  ...intro.camera,
  CARD, hold(5.2, CARD), STAND, hold(8.1, STAND), GRAD, hold(10.0, GRAD), GOAL, hold(12.9, GOAL), PREFS, hold(19.6, PREFS),
  TPL, hold(21.7, TPL), SWAP, hold(24.7, SWAP), TPL2, hold(26.2, TPL2),
  SIDE, hold(29.8, SIDE), CLOSER(31.2), hold(33.1, CLOSER(31.2)), hold(33.9, SIDE), hold(36.6, SIDE),
  CLOSER(37.6, 0.47, 1.8), hold(40.3, CLOSER(37.6, 0.47, 1.8)), hold(41, SIDE), hold(43.4, SIDE), C5, hold(46, C5),
  WHOLE, hold(48.2, WHOLE), ADD, hold(50.6, ADD), ADV,
];

/* ---------------- what is drawn on the glass ---------------- */

const DAYX: Record<string, number> = { mon: 308, tue: 370, wed: 433, thu: 495 };
const BLOCKS = [
  { y: 230.5, days: ["tue", "thu"] }, { y: 230.5, days: ["mon", "wed"] }, { y: 186.3, days: ["tue", "thu"] },
  { y: 275.5, days: ["mon", "wed"] }, { y: 320.5, days: ["mon", "wed"] },
];

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
  k.push({ at: at(3.4), x: 1100, y: 860 }, { at: at(DASH_PRESS), ...c(DASH_CARD), press: true });
  k.push({ at: at(LOOKS_RIGHT - 0.8), ...c(PRESS.open2) }, { at: at(LOOKS_RIGHT), ...c(PRESS.open2), press: true });
  k.push({ at: at(GRAD_YES - 0.6), ...c(PRESS.open3) }, { at: at(GRAD_YES), ...c(PRESS.open3), press: true });
  k.push({ at: at(GOAL_HOVER), ...c(PRESS.open4) }, { at: at(GOAL_PRESS), ...c(PRESS.open4), press: true }, { at: at(GOAL_DONE), ...c(PRESS.open5), press: true });
  CHIP_AT.forEach((p, i) => k.push({ at: at(p), ...c(CHIPS[i].find((x) => x.t === PICKED[i])!), press: true }));
  k.push({ at: at(SWAP_PRESS), ...c(PRESS.swap), press: true });
  k.push({ at: at(ELECTIVE_PRESS - 0.6), ...c(PRESS.elective, -60) }, { at: at(ELECTIVE_PRESS), ...c(PRESS.elective, -60), press: true });
  k.push({ at: at(GENED_PRESS - 0.6), ...c(PRESS.gened, -60) }, { at: at(GENED_PRESS), ...c(PRESS.gened, -60), press: true });
  k.push({ at: at(TPL_PRESS), ...c(PRESS.tpl2), press: true }, { at: at(CLASS_PRESS), ...c(PRESS.c1classes, -200), press: true });
  PK.forEach((p, i) => {
    if (i === 4) k.push({ at: at(C5_CLASS_PRESS), ...c(PRESS.c5classes, -200), press: true });
    const r = PICK_ROWS[i];
    // on the row's arrow (or the single section's button), so the time and the reason under it stay readable
    const pt = i === 4 ? c(r) : { x: r.x + r.w - 14, y: r.y + 12 };
    k.push({ at: at(p.hover), ...pt }, { at: at(p.press), ...pt, press: true });
  });
  k.push({ at: at(ADD_PRESS), ...c(PRESS.c5add), press: true }, { at: at(BOOK_HOVER), ...c(PRESS.book) });
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

const Screen: React.FC<{ f: number }> = ({ f }) => {
  const b = (f - B(0)) / (B(1) - B(0));
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
      {b >= PREFS_AT && b < TPL_AT && CHIP_AT.map((p, i) => {
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
        return BLOCKS[i].days.map((d) => (
          <div key={`${i}${d}`} style={{ position: "absolute", left: DAYX[d] - 3, top: WT[`c${i + 1}hover`] + BLOCKS[i].y - 3, width: 65, height: 46, borderRadius: 8,
            boxShadow: `0 0 ${(16 * pulse).toFixed(1)}px rgba(232,66,78,${(0.8 * pulse).toFixed(3)}), inset 0 0 0 1.5px rgba(232,66,78,${(0.75 * pulse).toFixed(3)})` }} />
        ));
      })}
      {/* a pressed time lands solid */}
      {PK.map((p, i) => {
        const pf = B(p.press);
        if (f < pf || f > pf + 20 || b >= SAVED_AT) return null;
        const s = springAt(f, pf, { damping: 11, stiffness: 190 });
        const glow = 1 - ramp(f, pf + 4, 16, EASE.out);
        return BLOCKS[i].days.map((d) => (
          <Piece key={`${i}${d}`} src={st(`c${i + 1}add`)} box={{ x: DAYX[d], y: WT[`c${i + 1}add`] + BLOCKS[i].y, w: 59, h: 40 }}
            style={{ borderRadius: 6, transform: `scale(${mix(1.4, 1, s).toFixed(4)})`, boxShadow: `0 0 ${(26 * glow).toFixed(1)}px rgba(232,66,78,${(0.85 * glow).toFixed(3)})` }} />
        ));
      })}
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
  { icon: "sliders-horizontal", at: GRAD_YES + 0.15 }, // preferences
  { icon: "list-checks", at: TPL_AT }, // confirm what you want to take, swap
  { icon: "sparkles", at: CLASS_AT }, // suggested classes
  { icon: "calendar-days", at: PK[0].in }, // the picks, into the 4-year plan
  { icon: "user-round", at: SAVED_AT }, // meet your advisor
];
const Tracker: React.FC<{ f: number }> = ({ f }) => {
  const b = (f - B(0)) / (B(1) - B(0));
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
const LINES: { lines: { text: string; accent?: boolean }[]; from: number; to: number }[] = [
  { lines: [{ text: "Spring registration" }, { text: "is coming.", accent: true }], from: 0.9, to: 5.2 },
  { lines: [{ text: "First, your" }, { text: "degree progress.", accent: true }], from: 5.5, to: 8.0 },
  { lines: [{ text: "Confirm when" }, { text: "you graduate.", accent: true }], from: 8.4, to: 9.9 },
  { lines: [{ text: "Then choose" }, { text: "your preferences.", accent: true }], from: 10.3, to: 19.7 },
  // round 6, Jacob: the template step is confirming what you want to take; the suggested classes come off the
  // 4-year plan ("the", not "your": the student is building theirs now, Jacob 2026-10-06); no hover line
  { lines: [{ text: "Confirm what" }, { text: "you want to take.", accent: true }], from: 20.3, to: 21.9 },
  { lines: [{ text: "Make it yours." }, { text: "Swap any class type.", accent: true }], from: 22.2, to: 25.7 },
  { lines: [{ text: "Built off the 4-year plan," }, { text: "it suggests your classes.", accent: true }], from: 26.2, to: 29.0 },
  // round 7, Jacob: "Click it, and it's on." dropped; this line carries through the second class
  { lines: [{ text: "Pick a class," }, { text: "then a time.", accent: true }], from: 29.4, to: 36.7 },
  { lines: [{ text: "It recommends" }, { text: "what fits.", accent: true }], from: 37, to: 40.6 },
  { lines: [{ text: "When only one fits," }, { text: "it tells you.", accent: true }], from: 42.6, to: 45.9 },
  { lines: [{ text: "All 5 classes," }, { text: "15 credits.", accent: true }], from: 46.2, to: 48.3 },
  { lines: [{ text: "Add it to" }, { text: "your 4-year plan.", accent: true }], from: 48.6, to: 50.7 },
  { lines: [{ text: "Then meet" }, { text: "your advisor.", accent: true }], from: 51.1, to: 54.2 },
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
const CUES: { at: number; src: string; volume: number; name: string }[] = [
  { at: B(0.25), src: a("whoosh-swirl.mp3"), volume: 0.25, name: "lid" },
  click(DASH_PRESS, "ask card", 0.5),
  click(LOOKS_RIGHT, "looks right", 0.32), click(GRAD_YES, "grad yes", 0.32),
  click(GOAL_PRESS, "goal"), click(GOAL_DONE, "goal done", 0.3),
  ...CHIP_AT.map((p, i) => click(p, `chip ${i}`)),
  click(SWAP_PRESS, "swap a type"), click(ELECTIVE_PRESS, "elective", 0.35), click(GENED_PRESS, "a gen ed"),
  click(TPL_PRESS, "looks good"), click(CLASS_PRESS, "class"), click(C5_CLASS_PRESS, "gen ed class"),
  ...PK.map((p, i) => ({ at: B(p.press) - 1, src: a("ui-popup-dry.mp3"), volume: 0.4, name: `class ${i + 1} lands` })),
  click(ADD_PRESS, "add to plan", 0.48),
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
        opacity: ramp(f, B(1.2), 10, EASE.out) * (1 - ramp(f, B(SAVED_AT), B(51.4) - B(SAVED_AT), EASE.smooth)) }} />
      {/* on the advisor card the band ends sharp at 300px: the "May" title above the card stays under solid dark, the
          card's top row (TerpEngage, Meet your advisor) sits clear below the step icons */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 360,
        background: `linear-gradient(180deg, ${BG} 0%, ${BG} 83%, rgba(11,7,8,0) 100%)`,
        opacity: ramp(f, B(SAVED_AT), B(51.4) - B(SAVED_AT), EASE.smooth) }} />
      {LINES.map((l) => <Headline key={l.from} {...l} />)}
      <Tracker f={f} />
      {f >= B(END_AT) && <End f={f} />}
      <Audio src={staticFile("spring/audio/tonight-hiphop.mp3")} trimBefore={MUSIC_TRIM}
        volume={(fr) => 0.8 * Math.min(1, fr / 8) * Math.min(1, Math.max(0, (FILM_FRAMES - fr) / 24))} />
      {CUES.map((c) => (
        <Sequence key={c.name} from={Math.round(c.at)} name={c.name}>
          <Audio src={c.src} volume={() => c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
