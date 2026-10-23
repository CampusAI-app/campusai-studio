/**
 * Spotlight, episode 1: Job Match. ROUND 2 (2026-10-19 evening, see ../../four-videos/BRIEF.md round 2
 * and ../../four-videos/Spotlight.md). One feature, one press, 9:16.
 *
 * Round 2 keeps round 1's shape and changes two things Jacob named:
 *   - the laptop is the photoreal RealLaptop (./real-laptop), not the kit's drawn one, and it is BIG;
 *   - the ending is tailoring the resume, recorded live in the demo, instead of Save / Saved.
 *
 * 1. Hook: the CampusAI icon lands under "Which jobs actually fit you?", turns away as the shut laptop
 *    turns in on the desk; the lid opens on the real Job Match page.
 * 2. Square-on push into the selected Capital One card until it fills the width; the laptop falls back
 *    into the dark and the card floats. Its Strong match label pops out.
 * 3. Its real "Why this fits you" panel pops in under it, line by line.
 * 4. The card falls away, the laptop comes back on the dashboard brief. The hand presses the real
 *    "Tailor my resume for Evercore" row (the one live tailoring entry the demo has, see the note).
 * 5. The real Tailor run plays on the screen: reading the posting, checking the resume, the results;
 *    the page scrolls to "What to change for this role".
 * 6. One recommendation is pulled out; the hand presses its real View suggestion; it opens on
 *    Current and Suggested, the suggested bullet writing in.
 * 7. The icon lands with one settle, "Link in bio."
 *
 * Every pixel of the product is a capture of campusai-demo.vercel.app (public/four/spotlight). Renders
 * need --gl=angle (WebGL laptop).
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { getTheme } from "../theme";
import { EASE } from "../lib/anim";
import { BlurLines, Hand, Ink, ZODIAK, pop, ramp, useZodiak } from "../kit/parts";
import { RealLaptop, type CamKey, type LidKey, type ScreenSource } from "./real-laptop";
import { BG, Studio, liftShadow, onFrame, pose, shot } from "./spotlight-parts";

export const SPOTLIGHT_FPS = 30;
export const SPOTLIGHT_SIZE = { width: 1080, height: 1920 };

const T = getTheme("campusaiProduct");
const RED = T.accent;
const INK: Ink = { ink: "#ffffff", soft: "rgba(255,255,255,.55)", accent: RED, surface: "#141114", line: "rgba(255,255,255,.08)" };
const W = 1080;
const CX = W / 2;
const HEAD = 74;

const src = (f: string) => staticFile(`four/spotlight/${f}`);
const SP = (f: string) => `four/spotlight/${f}`; // RealLaptop paths are relative to public/

/* ------------------------------------------------ geometry, from the captures (CSS px of 1440x900) */

// Job Match page (round 1 capture, boxes.json)
const CARD = { x: 269, y: 442.25, w: 435.67, h: 169.5 }; // Capital One, selected
const CARD_C = { x: CARD.x + CARD.w / 2, y: CARD.y + CARD.h / 2 };
const CARD_IMG = { w: 1305, h: 507 }; // card-before.png
const PILL = { x: 430, y: 42, w: 298, h: 55, cx: 579, cy: 69.5 }; // its Strong match label, in card image px

// Dashboard brief (r2-dash.jpg): the Evercore job row in Worth a look, and its Tailor link (r2-boxes.json)
const ROW = { x: 848, y: 216, w: 527, h: 67 };
const ROW_C = { x: ROW.x + ROW.w / 2, y: ROW.y + ROW.h / 2 };
const LINK_C = { x: 1143 + 224 / 2, y: 220.67 + 44.5 / 2 };

// Tailor results, scrolled to the changes (r2-scroll-12.jpg): the M&A recommendation row
const MA_ROW = { x: 273, y: 418, w: 1110, h: 91 };
const MA_C = { x: MA_ROW.x + MA_ROW.w / 2, y: MA_ROW.y + MA_ROW.h / 2 };
const PAGE_C = { x: 840, y: 300 }; // the top of the page's main column, where the run reports its steps

// Where the Capital One card floats: full width less the gutters, under the headline band.
const FLOAT_W = 980;
const S_CARD = FLOAT_W / CARD.w;
const FLOAT_H = CARD.h * S_CARD;
const FLOAT = { x: CX, y: 700 };
const FLOAT_L = FLOAT.x - FLOAT_W / 2;
const FLOAT_T = FLOAT.y - FLOAT_H / 2;

// The phone-width "Why this fits you" capture (1044x876 at DPR 3): header band, then ten lines on a 69px pitch.
const WHY = { w: 1044, h: 874, head: 132, line0: 145, pitch: 69, lines: 10, bg: "rgb(42,29,31)" };
const WHY_W = 920;
const WHY_S = WHY_W / WHY.w;
const WHY_TOP = FLOAT_T + FLOAT_H + 34;

// The phone-width recommendation (560px viewport, DPR 3): closed r2-card-1.png 486x177, open r2-ma-open.png 486x471.
const REC = { w: 486, closedH: 177, openH: 471, bg: "rgb(33,23,30)", btn: { x: 334, y: 29 } };
const REC_S = FLOAT_W / REC.w;
const REC_L = CX - FLOAT_W / 2;
const REC_T = 470;
// its Suggested bullet, three line boxes (m-boxes.json), revealed in reading order
const SUG = [
  { y: 352.39, w: 429.61 },
  { y: 373.31, w: 397.31 },
  { y: 394.23, w: 36.86 },
];
const SUG_X = 33;
const SUG_LH = 20.9;

/* ---------------------------------------------------------------- timing */

const ICON_AWAY = 26; // the icon turns away as the shut laptop turns in
const SPUN = 54; // turned in, lid still shut
const OPEN = 86; // lid open, screen awake
const FACE = 96; // turns square-on and pushes to the card
const ON_CARD = 122; // the card fills the width
const LIFT = 130; // the laptop falls away, the card stays
const CHIP_IN = 150;
const CHIP_OUT = 184;
const WHY_AT = 192;
const LINE_AT = 198;
const LINE_GAP = 4;
const WHY_OUT = 260; // the card and its reasons fall back into the dark
const BACK = 270; // the laptop comes back, on the dashboard brief
const AT_DASH = 296;
const HAND2 = 295;
const TAP2 = 312; // presses Tailor my resume for Evercore
const REC_AT = 314; // the recorded run plays from here
const SCROLL_AT = 356;
const ON_ROW = 384; // pushed in on the M&A recommendation
const FLOAT2 = 386; // the recommendation is pulled out
const HAND3 = 396;
const TAP3 = 412; // presses View suggestion
const GROW = 414; // it opens
const SUG_AT = 434;
const SUG_GAP = 6;
const END = 478; // the end card
export const SPOTLIGHT_FRAMES = END + 50;

/* ------------------------------------------------------------ the screen, frame by frame */

// The recorded Tailor run (Playwright headless, 1440x900, the real click on the dashboard row). 12 of
// its frames, in order, each held 3 or 4 video frames: the run took ~9.5s and plays here in ~1.4s.
const RUN = ["002", "004", "015", "030", "044", "060", "075", "090", "107", "120", "135", "143"].map((n) => SP(`r2-rec-${n}.jpg`));
const SCROLL = ["02", "04", "06", "08", "10", "12"].map((n) => SP(`r2-scroll-${n}.jpg`));

const screenAt = (f: number): string => {
  if (f < BACK) return SP("page-before.jpg");
  if (f < TAP2 - 6) return SP("r2-dash.jpg");
  if (f < REC_AT) return SP("r2-dash-hover.jpg");
  if (f < SCROLL_AT) return RUN[Math.min(RUN.length - 1, Math.floor(((f - REC_AT) / (SCROLL_AT - 6 - REC_AT)) * RUN.length))];
  return SCROLL[Math.min(SCROLL.length - 1, Math.floor((f - SCROLL_AT) / 3))];
};
// One path per video frame, built once so RealLaptop loads every distinct image up front.
const SCREEN: ScreenSource = { frames: Array.from({ length: END + 50 }, (_, f) => screenAt(f)), fps: SPOTLIGHT_FPS, startAt: 0 };

/* ------------------------------------------------------------ the laptop */

const ABOVE = pose([-0.12, 1, 0.42], [0, 2, 1], 150);
const HERO = pose([-0.3, 0.4, 0.87], [1, 11, -4], 124);
const ON_CARD_CAM = shot(CARD_C.x, CARD_C.y, S_CARD, FLOAT.x, FLOAT.y);
const FAR = pose([-0.35, 0.32, 0.88], [0, 7, -6], 220);
const DASH_CAM = shot(ROW_C.x, ROW_C.y, 1.8, CX, 1010);
const DASH_IN = pose([-0.42, 0.3, 0.86], [2, 9, -10], 120);
const RUN_CAM = shot(PAGE_C.x, PAGE_C.y, 0.92, CX, 1010);
const ROW_K = 0.9;
const ROW_CAM = shot(MA_C.x, MA_C.y, ROW_K, CX, REC_T + (REC.closedH * REC_S) / 2);
const EASE_IO = Easing.bezier(0.55, 0, 0.15, 1);
const EASE_PUSH = Easing.bezier(0.6, 0, 0.1, 1);

const CAMERA: CamKey[] = [
  { at: 0, ...ABOVE },
  { at: SPUN, ...ABOVE },
  { at: OPEN + 4, ...HERO, ease: EASE_IO },
  { at: FACE, ...HERO },
  { at: ON_CARD, ...ON_CARD_CAM, ease: EASE_PUSH },
  { at: LIFT, ...ON_CARD_CAM },
  { at: LIFT + 34, ...FAR, ease: Easing.in(Easing.cubic) },
  { at: BACK, ...DASH_IN },
  { at: AT_DASH, ...DASH_CAM, ease: EASE_IO },
  { at: REC_AT, ...DASH_CAM },
  { at: REC_AT + 18, ...RUN_CAM, ease: EASE_IO },
  { at: SCROLL_AT + 6, ...RUN_CAM },
  { at: ON_ROW, ...ROW_CAM, ease: EASE_PUSH },
];
const LID: LidKey[] = [
  { at: SPUN - 4, open: 0 },
  { at: OPEN, open: 1, ease: Easing.bezier(0.3, 0, 0.15, 1) },
];
const SPIN: LidKey[] = [
  { at: ICON_AWAY - 6, open: 1.5 },
  { at: SPUN, open: 0, ease: Easing.bezier(0.2, 0, 0.1, 1) },
];

const LaptopShot: React.FC = () => {
  const f = useCurrentFrame();
  // gone into the dark while the card floats, back for the tailoring, gone again when the recommendation is pulled out
  const shown = Math.min(1,
    ramp(f, ICON_AWAY - 4, ICON_AWAY + 8) * (1 - ramp(f, LIFT + 6, LIFT + 26)) + ramp(f, BACK, BACK + 16) * (1 - ramp(f, FLOAT2, FLOAT2 + 12)));
  const blur = Math.max(ramp(f, LIFT + 4, LIFT + 26) * (1 - ramp(f, BACK - 2, BACK)), (1 - ramp(f, BACK, BACK + 18)) * ramp(f, BACK - 2, BACK), ramp(f, FLOAT2, FLOAT2 + 12)) * 14;
  if (shown <= 0.001) return null;
  return (
    <AbsoluteFill style={{ opacity: shown, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
      <RealLaptop screen={SCREEN} camera={CAMERA} lid={LID} spin={SPIN} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------- the floating job card */

const FloatingCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < ON_CARD + 2 || f > WHY_OUT + 16) return null;
  // matches the glass exactly at ON_CARD..LIFT (cross-fade), then lifts off it
  const lift = f < LIFT ? 0 : pop(f, LIFT, fps, 12);
  const fadeIn = ramp(f, ON_CARD + 2, LIFT);
  const bob = f > LIFT ? Math.sin((f - LIFT) / 22) * 5 : 0;
  const chip = pop(f, CHIP_IN, fps, 11) * (1 - ramp(f, CHIP_OUT, CHIP_OUT + 10, Easing.in(Easing.cubic)));
  const k = FLOAT_W / CARD_IMG.w;
  const PK = 2.1;
  const out = ramp(f, WHY_OUT, WHY_OUT + 14, Easing.in(Easing.cubic));
  return (
    <div style={{ position: "absolute", left: FLOAT_L, top: FLOAT_T + bob, width: FLOAT_W, height: FLOAT_H, zIndex: 50,
      transformOrigin: "50% 50%", opacity: fadeIn * (1 - out),
      transform: `translateY(${-out * 60}px) scale(${(0.985 + 0.015 * lift) * (1 - 0.18 * out)})` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 27, overflow: "hidden", boxShadow: liftShadow(lift) }}>
        <Img src={src("card-before.png")} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
      {chip > 0.001 ? (
        <div style={{ position: "absolute", left: PILL.cx * k, top: PILL.cy * k, width: PILL.w * k * PK, height: PILL.h * k * PK,
          transform: `translate(-50%, -50%) translateY(${-150 * chip}px) scale(${1 / PK + (1 - 1 / PK) * Math.max(0, chip)})`,
          opacity: Math.min(1, chip * 3), borderRadius: 16 * k * PK, overflow: "hidden", boxShadow: liftShadow(Math.max(0, chip) * 0.7) }}>
          <Img src={src("card-before.png")} style={{ position: "absolute", left: -PILL.x * k * PK, top: -PILL.y * k * PK,
            width: CARD_IMG.w * k * PK, height: CARD_IMG.h * k * PK, maxWidth: "none" }} />
        </div>
      ) : null}
    </div>
  );
};

/* -------------------------------------------- the reasons, line by line */

const Why: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < WHY_AT || f > WHY_OUT + 16) return null;
  const p = pop(f, WHY_AT, fps, 14);
  const out = ramp(f, WHY_OUT - 2, WHY_OUT + 12, Easing.in(Easing.cubic));
  const H = WHY.h * WHY_S;
  return (
    <div style={{ position: "absolute", left: CX - WHY_W / 2, top: WHY_TOP, width: WHY_W, height: H, zIndex: 40,
      opacity: Math.min(1, p * 1.4) * (1 - out), transform: `translateY(${(1 - p) * 80 - out * 40}px) scale(${(0.94 + 0.06 * p) * (1 - 0.18 * out)})`,
      transformOrigin: "50% 0" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 40, overflow: "hidden", boxShadow: liftShadow(0.8) }}>
        <Img src={src("why-m.png")} style={{ position: "absolute", left: 0, top: 0, width: WHY_W, height: WHY.h * WHY_S, maxWidth: "none" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: WHY.head * WHY_S, bottom: 0, background: WHY.bg }} />
        {[...Array(WHY.lines)].map((_, i) => {
          const at = LINE_AT + i * LINE_GAP;
          const q = ramp(f, at, at + 12);
          const top = (WHY.line0 + i * WHY.pitch) * WHY_S;
          return (
            <div key={i} style={{ position: "absolute", left: 0, top, width: WHY_W, height: WHY.pitch * WHY_S, overflow: "hidden",
              opacity: q, filter: q < 1 ? `blur(${(1 - q) * 10}px)` : undefined, transform: `translateY(${(1 - q) * 18}px)` }}>
              <Img src={src("why-m.png")} style={{ position: "absolute", left: 0, top: -top, width: WHY_W, height: WHY.h * WHY_S, maxWidth: "none" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------------------------------- the recommendation: pulled out, opened, rewritten */

const Recommendation: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < FLOAT2 || f > END + 8) return null;
  const p = pop(f, FLOAT2, fps, 13);
  // the desktop row becomes the card: its box grows from where the row sits on the glass (ROW_CAM)
  // to the card's, while the row's own pixels give way to the phone-width capture of the same card
  const m = ramp(f, FLOAT2, FLOAT2 + 14, Easing.bezier(0.3, 0, 0.1, 1));
  const rowBox = { l: CX - (MA_ROW.w * ROW_K) / 2, t: REC_T + (REC.closedH * REC_S) / 2 - (MA_ROW.h * ROW_K) / 2, w: MA_ROW.w * ROW_K, h: MA_ROW.h * ROW_K };
  const g = ramp(f, GROW, GROW + 18, Easing.bezier(0.3, 0, 0.1, 1));
  const cardH = interpolate(g, [0, 1], [REC.closedH, REC.openH]) * REC_S;
  const bl = interpolate(m, [0, 1], [rowBox.l, REC_L]);
  const bt = interpolate(m, [0, 1], [rowBox.t, REC_T]);
  const bw = interpolate(m, [0, 1], [rowBox.w, FLOAT_W]);
  const h = interpolate(m, [0, 1], [rowBox.h, cardH]);
  const row = 1 - ramp(f, FLOAT2 + 2, FLOAT2 + 10);
  const closed = 1 - ramp(f, GROW, GROW + 7);
  const squash = interpolate(f, [TAP3 - 2, TAP3 + 2, TAP3 + 9], [1, 0.975, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = ramp(f, END - 6, END + 6);
  const img = { position: "absolute", left: 0, top: 0, width: FLOAT_W, maxWidth: "none" } as const;
  return (
    <div style={{ position: "absolute", left: bl, top: bt, width: bw, height: h, zIndex: 50,
      opacity: 1 - out, transformOrigin: "50% 0", transform: `scale(${squash})` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: interpolate(m, [0, 1], [10, 24]), overflow: "hidden", background: REC.bg, boxShadow: liftShadow(Math.min(1, p)) }}>
       <div style={{ position: "absolute", left: 0, top: 0, width: FLOAT_W, height: REC.openH * REC_S, transformOrigin: "0 0", transform: `scale(${bw / FLOAT_W})` }}>
        <Img src={src("r2-ma-open.png")} style={{ ...img, height: REC.openH * REC_S }} />
        {/* the suggested bullet, covered with the card's own flat colour, then written in line by line */}
        <div style={{ position: "absolute", left: (SUG_X - 2) * REC_S, top: (SUG[0].y - 2) * REC_S, width: (REC.w - SUG_X - 8) * REC_S,
          height: (SUG_LH * SUG.length + 4) * REC_S, background: REC.bg }} />
        {SUG.map((l, i) => {
          const at = SUG_AT + i * SUG_GAP;
          const q = ramp(f, at, at + 12, Easing.out(Easing.cubic));
          if (q <= 0) return null;
          const top = (l.y - 3) * REC_S;
          return (
            <div key={i} style={{ position: "absolute", left: (SUG_X - 2) * REC_S, top, width: (l.w + 6) * REC_S * q, height: SUG_LH * REC_S, overflow: "hidden" }}>
              <Img src={src("r2-ma-open.png")} style={{ ...img, left: -(SUG_X - 2) * REC_S, top: -top, height: REC.openH * REC_S }} />
            </div>
          );
        })}
        {closed > 0.001 ? <Img src={src("r2-card-1.png")} style={{ ...img, height: REC.closedH * REC_S, opacity: closed }} /> : null}
       </div>
        {row > 0.001 ? (
          <div style={{ position: "absolute", inset: 0, opacity: row, overflow: "hidden" }}>
            <Img src={src("r2-scroll-12.jpg")} style={{ position: "absolute", maxWidth: "none", width: 1440 * (bw / MA_ROW.w), height: 900 * (bw / MA_ROW.w),
              left: -MA_ROW.x * (bw / MA_ROW.w), top: -MA_ROW.y * (bw / MA_ROW.w) }} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------- the hook icon and end card */

const Icon: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(f, 2, fps, 11);
  const away = ramp(f, ICON_AWAY, ICON_AWAY + 16, Easing.in(Easing.cubic));
  if (f > ICON_AWAY + 18) return null;
  return (
    <div style={{ position: "absolute", left: CX, top: 1060, zIndex: 60, opacity: 1 - ramp(f, ICON_AWAY, ICON_AWAY + 10),
      transform: `translate(-50%,-50%) scale(${s * (1 - away * 0.45)}) rotateY(${away * 90}deg)` }}>
      <div style={{ width: 280, height: 280, borderRadius: 66, overflow: "hidden", boxShadow: liftShadow(1) }}>
        <Img src={staticFile("kit/app-icon.png")} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
    </div>
  );
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < END - 3) return null;
  const s = pop(f, END - 2, fps, 10); // lands with one settle
  return (
    <AbsoluteFill style={{ alignItems: "center", zIndex: 70 }}>
      <div style={{ marginTop: 780, width: 260, height: 260, borderRadius: 62, overflow: "hidden", opacity: ramp(f, END - 3, END + 3),
        transform: `translateY(${(1 - s) * -60}px) scale(${0.6 + 0.4 * s})`, boxShadow: liftShadow(1) }}>
        <Img src={staticFile("kit/app-icon.png")} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
      <div style={{ marginTop: 58 }}>
        <BlurLines at={END + 10} size={54} ink={{ ...INK, ink: "rgba(255,255,255,.72)" }} face={ZODIAK} lines={[{ text: "Link in bio." }]} />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ headlines */

const LINES: { from: number; to: number; l: { text: string; accent?: boolean }[] }[] = [
  { from: 4, to: LIFT - 2, l: [{ text: "Which jobs actually" }, { text: "fit you?", accent: true }] },
  { from: LIFT + 6, to: WHY_AT - 2, l: [{ text: "Matched to" }, { text: "what you've done.", accent: true }] },
  { from: WHY_AT + 2, to: WHY_OUT + 2, l: [{ text: "And it tells you" }, { text: "why.", accent: true }] },
  { from: WHY_OUT + 6, to: FLOAT2 - 2, l: [{ text: "Then tailor your resume" }, { text: "for the one you want.", accent: true }] },
  { from: FLOAT2 + 2, to: END - 4, l: [{ text: "It shows you" }, { text: "what to change.", accent: true }] },
];

const Headlines: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {/* a dark band so a headline never sits on the product */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 548, zIndex: 45, opacity: 1 - ramp(f, END - 6, END + 4),
        background: "linear-gradient(180deg, rgba(11,7,8,1) 0%, rgba(11,7,8,.97) 80%, rgba(11,7,8,0) 100%)" }} />
      {LINES.map((x, i) => (
        <div key={i} style={{ position: "absolute", top: 150, width: "100%", zIndex: 90,
          opacity: ramp(f, x.from, x.from + 6) * (1 - ramp(f, x.to - 8, x.to)) }}>
          {f >= x.from && f < x.to ? <BlurLines at={x.from} size={HEAD} ink={INK} face={ZODIAK} lines={x.l} /> : null}
        </div>
      ))}
    </>
  );
};

/* ------------------------------------------------------------ the film */

export const SpotlightFilm: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  const press2 = onFrame(LINK_C.x, LINK_C.y, ROW_C.x, ROW_C.y, 1.8, CX, 1010);
  const btn = { x: REC_L + REC.btn.x * REC_S, y: REC_T + REC.btn.y * REC_S };
  // the light pool follows the device: low while it sits on the desk, under the card when it floats
  const poolY = interpolate(f, [LIFT, LIFT + 20, BACK, BACK + 20, FLOAT2, FLOAT2 + 20], [1120, 900, 900, 1040, 1040, 920], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Studio poolY={poolY} lit={1 - 0.5 * ramp(f, END - 6, END + 10)} />
      <LaptopShot />
      <Icon />
      <Why />
      <FloatingCard />
      <Recommendation />
      {f >= HAND2 && f < TAP2 + 26 ? (
        <AbsoluteFill style={{ zIndex: 55 }}>
          <Hand from={[1180, 1500]} to={[press2.x, press2.y]} at={HAND2} tapAt={TAP2} leaveAt={TAP2 + 10} size={150} />
        </AbsoluteFill>
      ) : null}
      {f >= HAND3 && f < TAP3 + 26 ? (
        <AbsoluteFill style={{ zIndex: 55 }}>
          <Hand from={[1180, 1300]} to={[btn.x, btn.y]} at={HAND3} tapAt={TAP3} leaveAt={TAP3 + 10} size={150} />
        </AbsoluteFill>
      ) : null}
      <Headlines />
      <EndCard />
      <AbsoluteFill style={{ background: BG, opacity: 1 - ramp(f, 0, 8, EASE), pointerEvents: "none", zIndex: 100 }} />
    </AbsoluteFill>
  );
};
