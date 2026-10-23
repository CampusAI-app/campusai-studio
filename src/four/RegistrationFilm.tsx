/**
 * CampusAI, type 4: Registration, round 2 (2026-10-19), 9:16. "Plan your spring" in the order the
 * real flow runs it. See ../../four-videos/BRIEF.md (round 2 wins) and four-videos/Registration.md.
 *
 * 1. Hook on the film's own background, the planner's week grid drawn in line by line:
 *    "Spring registration is 5 days away." The number is the `daysAway` prop, so it can be made
 *    true on the day it posts (render with --props='{"daysAway":4}').
 * 2. Preferences: the real preferences message, close up; the hand picks Afternoons, Back to back,
 *    Fri, In person.
 * 3. Template: the real Spring 2027 template (the planner's own requirement blocks, built from
 *    Maryland's 4-year plan for Finance); its five blocks come in one by one; the hand presses
 *    Looks good.
 * 4. Class by class: the real split view, the week on the LEFT and the options on the right. Class 1
 *    and 2 are pulled out big (the class, then the section); the hand picks; the section flies into
 *    its slot on the week and the blocks pop in where the dashed preview was. Classes 3 to 5 run
 *    fast on the screen itself, hover (dashed preview) then press (the blocks land).
 * 5. The camera pushes into the full week. "Your spring, planned."
 * 6. The CampusAI logo lands with one settle, "Link in bio." Nothing rises from the bottom.
 *
 * No laptop: the product fills the frame. Every product pixel is a real capture, one continuous
 * live run on campusai-demo.vercel.app (public/four/registration, rig in _capture/). Professor
 * names, professor ratings and review text were hidden at capture time, so none can reach a frame.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { getTheme } from "../theme";
import { EASE_CAMERA, keyframes } from "../lib/anim";
import { INTER, Ink, ZODIAK, pop, ramp, useZodiak } from "../kit/parts";
import { Box, Crop, HeadLines, Run, SCREEN_H, SCREEN_W, TapHand, WeekGrid } from "./registration-parts";

export const REGISTRATION_FPS = 30;
const T = getTheme("campusaiProduct");
const RED = T.accent;
const BG = "#0b0708";
const INK: Ink = { ink: "#ffffff", soft: "rgba(255,255,255,.55)", accent: RED, surface: "#141114", line: "rgba(255,255,255,.08)" };
const W = 1080;
const H = 1920;
const CX = W / 2;
const FCY = 1150; // the centre of the product, below the headline band
const HEAD = 82;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const shot = (name: string) => staticFile(`four/registration/${name}.jpg`);

/* ------------------------------------------------------------- timing */

const HOOK_OUT = 56;
const P_TAPS = [92, 104, 116, 128]; // Afternoons, Back to back, Fri, In person
const TPL_IN = 150;
const ROWS_AT = 166; // the template's five blocks come in
const LOOKS_GOOD = 228;
const WIDE_AT = 244; // the split view: week on the left, options on the right
// class 1, pulled out
const ROW1_UP = 256;
const ROW1_TAP = 278;
const SEC1_IN = 290;
const SEC1_UP = 294;
const SEC1_TAP = 320;
// class 2
const ROW2_TAP = 360;
const SEC2_UP = 366;
const SEC2_TAP = 390;
// classes 3 to 5, fast, on the screen itself: [class tap, section tap]
const FAST: [number, number][] = [[426, 448], [466, 488], [506, 528]];
const RAIL_AT = 548; // the push into the full week
const END_AT = 610;
export const REGISTRATION_FRAMES = 696;
export const REGISTRATION_SIZE = { width: W, height: H };

/* ------------------------------------------------------------- camera */

type Cam = { cx: number; cy: number; s: number };
const PREF: Cam = { cx: 377, cy: 815, s: 2.4 };
const TPLZ: Cam = { cx: 487, cy: 990, s: 1.9 }; // close on the template's blocks, its left edge in frame
const TPL: Cam = { cx: 621, cy: 790, s: 1.27 };
const WIDE: Cam = { cx: 582, cy: 730, s: 1.1638 }; // css 118 to 1046 across the frame; bottom of the capture at the frame's bottom
const MID: Cam = { cx: 470, cy: 760, s: 1.45 }; // the fast classes: the week and the left of the options, bigger
const RAIL: Cam = { cx: 304, cy: 709, s: 2.8 };

const camAt = (f: number): Cam => {
  const k = (pick: (c: Cam) => number, extra: [number, number][] = []) =>
    keyframes(f, [
      ...extra.map(([at, value]) => ({ at, value })),
      { at: 140, value: pick(PREF) }, { at: 164, value: pick(TPLZ) }, { at: 204, value: pick(TPLZ) },
      { at: 218, value: pick(TPL) }, { at: 234, value: pick(TPL) }, { at: 254, value: pick(WIDE) },
      { at: FAST[0][0] - 14, value: pick(WIDE) }, { at: FAST[0][0] - 2, value: pick(MID) },
      { at: RAIL_AT, value: pick(MID) }, { at: RAIL_AT + 28, value: pick(RAIL) },
    ], EASE_CAMERA);
  return {
    cx: k((c) => c.cx, [[0, PREF.cx]]),
    cy: k((c) => c.cy, [[0, PREF.cy]]),
    s: k((c) => c.s, [[50, 2.62]]) + (f > RAIL_AT + 28 ? (f - RAIL_AT - 28) * 0.0012 : 0),
  };
};
const toF = (c: Cam, sx: number, sy: number) => ({ x: CX + (sx - c.cx) * c.s, y: FCY + (sy - c.cy) * c.s });

/* ------------------------------------------------------------- states */

// Which real capture is on screen, from when. Each crossfades in over XF frames.
const XF = 4;
const STATES: [number, string][] = [
  [0, "prefs0"], [P_TAPS[0] + 1, "prefs1"], [P_TAPS[1] + 1, "prefs2"], [P_TAPS[2] + 1, "prefs3"], [P_TAPS[3] + 1, "prefs4"],
  [TPL_IN, "tpl"], [WIDE_AT, "c1list"],
  [SEC1_IN, "c1sec"], [SEC1_TAP - 8, "c1hover"], [SEC1_TAP + 18, "c1add"],
  [ROW2_TAP + 3, "c2sec"], [SEC2_TAP - 8, "c2hover"], [SEC2_TAP + 16, "c2add"],
  ...FAST.flatMap(([c, s], i): [number, string][] => [[c + 3, `c${i + 3}sec`], [s - 6, `c${i + 3}hover`], [s + 3, `c${i + 3}add`]]),
];

/** The rail's top (CSS y) in each capture, read off the capture's own boxes: it moves as the section list under the week grows. */
const WEEK_Y: Record<string, number> = {
  c1hover: 432.5, c1add: 423.3, c2hover: 423.3, c2add: 403.5, c3hover: 403.5, c3add: 385.8, c4hover: 384.6, c4add: 365.8, c5hover: 365.5, c5add: 346.2,
};

/** One class block on the real week grid: day 0 = Mon, start in hours. Grid read off the captures. */
const block = (weekY: number, day: number, start: number): Box => ({ x: 165 + day * 62.35, y: weekY + 165.4 + (start - 8) * 30, w: 61.3, h: 37.5 });

// The five picks, as the flow placed them (Testudo's Spring 2027 sections in the demo's data).
const PICKS: { days: [number, number]; start: number; at: number }[] = [
  { days: [1, 3], start: 14, at: SEC1_TAP + 18 }, // BMGT440 0301, Tue and Thu 2pm
  { days: [0, 2], start: 14, at: SEC2_TAP + 16 }, // BMGT441 0301, Mon and Wed 2pm
  { days: [1, 3], start: 12.5, at: FAST[0][1] + 3 }, // BMGT446 0301, Tue and Thu 12:30pm
  { days: [0, 2], start: 15.5, at: FAST[1][1] + 3 }, // BMGT495 0401, Mon and Wed 3:30pm
  { days: [1, 3], start: 15.5, at: FAST[2][1] + 3 }, // BMGT302 0401, Tue and Thu 3:30pm
];

// Pieces lifted out of the screen, in CSS pixels of their capture.
const ROW1: Box = { x: 562, y: 750, w: 469, h: 100 }; // BMGT440 row (Recommended, 4.2), c1list
const SEC1: Box = { x: 562, y: 975, w: 469, h: 68.8 }; // "Tue and Thu, 2pm to 3:15pm", c1sec
const SEC2: Box = { x: 562, y: 975.4, w: 469, h: 68.8 }; // "Mon and Wed, 2pm to 3:15pm", c2sec
// Where the hand presses on the screen itself (CSS), from the captures' button boxes.
const ROW2_PT = { x: 700, y: 945 }; // BMGT441 Fixed Income, c1add
const FAST_PTS: { cls: { x: number; y: number }; sec: { x: number; y: number } }[] = [
  { cls: { x: 700, y: 1045 }, sec: { x: 700, y: 962 } }, // BMGT446, then Tue and Thu 12:30pm
  { cls: { x: 700, y: 972 }, sec: { x: 700, y: 575 } }, // BMGT495, then Mon and Wed 3:30pm
  { cls: { x: 700, y: 962 }, sec: { x: 700, y: 802 } }, // BMGT302, then Tue and Thu 3:30pm
];
const PREF_PTS = [{ x: 352, y: 724 }, { x: 266, y: 792 }, { x: 476, y: 860 }, { x: 255, y: 928 }];
const LOOKS_PT = { x: 969, y: 1174 };
// The template's five requirement blocks, tpl.jpg, and the card colour under them.
const TPL_ROWS: Box[] = [936, 971, 1006, 1041].map((y) => ({ x: 222, y, w: 797, h: 30 })).concat([{ x: 222, y: 1076, w: 797, h: 50 }]);
const TPL_COVER: Box = { x: 220, y: 931, w: 801, h: 199 };

const LIFT_W = 1000;

/* ------------------------------------------------------------ the screen */

const ScreenImg: React.FC<{ name: string; cam: Cam; opacity: number }> = ({ name, cam, opacity }) => {
  const o = toF(cam, 0, 0);
  return <Img src={shot(name)} style={{ position: "absolute", left: o.x, top: o.y, width: SCREEN_W * cam.s, height: SCREEN_H * cam.s, opacity, maxWidth: "none" }} />;
};

/** A piece of the screen, placed on the screen at its own pixels (so it can be popped or covered). */
const OnScreen: React.FC<{ cam: Cam; box: Box; children?: React.ReactNode; style?: React.CSSProperties }> = ({ cam, box, children, style }) => {
  const o = toF(cam, box.x, box.y);
  return <div style={{ position: "absolute", left: o.x, top: o.y, width: box.w * cam.s, height: box.h * cam.s, ...style }}>{children}</div>;
};

/**
 * A crop lifted out of the screen: it starts on its own pixels, springs to `to` (frame centre,
 * LIFT_W wide), and with `back` (0 to 1) goes to `home` (its slot, or where its result lands).
 */
const Lift: React.FC<{ src: string; box: Box; cam: Cam; up: number; back?: number; to: { x: number; y: number }; home?: { x: number; y: number; w: number }; press?: number }> = ({
  src, box, cam, up, back = 0, to, home, press = 1,
}) => {
  const c0 = toF(cam, box.x + box.w / 2, box.y + box.h / 2);
  const from = { ...c0, w: box.w * cam.s };
  const end = home ?? from;
  const x = interpolate(back, [0, 1], [interpolate(up, [0, 1], [from.x, to.x]), end.x]);
  const y = interpolate(back, [0, 1], [interpolate(up, [0, 1], [from.y, to.y]), end.y]);
  const w = interpolate(back, [0, 1], [interpolate(up, [0, 1], [from.w, LIFT_W]), end.w]);
  const h = box.h * (LIFT_W / box.w);
  return (
    <div style={{ position: "absolute", left: x - LIFT_W / 2, top: y - h / 2, width: LIFT_W, height: h, transform: `scale(${(w / LIFT_W) * press})`, transformOrigin: "50% 50%" }}>
      <Crop src={src} box={box} w={LIFT_W} radius={26} shadow />
    </div>
  );
};

const Product: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = camAt(f);

  // the capture on screen, and the one it is crossfading from
  let i = 0;
  while (i + 1 < STATES.length && STATES[i + 1][0] <= f) i++;
  const [at, name] = STATES[i];
  const fade = ramp(f, at, at + XF);
  const prev = i > 0 && fade < 1 ? STATES[i - 1][1] : null;

  // the screen dims a little while a piece is pulled out of it
  const dim = 0.42 * Math.max(
    ramp(f, ROW1_UP, ROW1_UP + 10) * (1 - ramp(f, ROW1_TAP + 4, ROW1_TAP + 12)),
    ramp(f, SEC1_UP, SEC1_UP + 10) * (1 - ramp(f, SEC1_TAP + 2, SEC1_TAP + 14)),
    ramp(f, SEC2_UP, SEC2_UP + 10) * (1 - ramp(f, SEC2_TAP + 2, SEC2_TAP + 14)),
  );

  // template blocks: the card's rows are covered with the card's own colour, then come in one by one
  const tplOn = f >= TPL_IN && f < ROWS_AT + 40;

  // the lifted pieces
  const liftTo = { x: CX, y: 650 };
  const row1Up = pop(f, ROW1_UP, fps, 15);
  const row1Back = ramp(f, ROW1_TAP + 4, ROW1_TAP + 14, EASE_CAMERA);
  const k = LIFT_W / ROW1.w;
  const row1Tap = { x: liftTo.x - LIFT_W / 2 + 448 * k, y: liftTo.y - (ROW1.h * k) / 2 + 20 * k }; // on its arrow, so the hand covers no words
  const secTap = (b: Box) => ({ x: liftTo.x - LIFT_W / 2 + 440 * (LIFT_W / b.w), y: liftTo.y - (b.h * (LIFT_W / b.w)) / 2 + 26 * (LIFT_W / b.w) });
  // a section flies into the first of its two blocks on the week, sized to it
  const slot = (p: number) => {
    const addName = `c${p + 1}add`;
    const b = block(WEEK_Y[addName], PICKS[p].days[0], PICKS[p].start);
    return { ...toF(cam, b.x + b.w / 2, b.y + b.h / 2), w: b.w * cam.s };
  };
  const fly = (tap: number) => ramp(f, tap + 2, tap + 18, EASE_CAMERA);

  const sec = (p: number, box: Box, src: string, up: number, tap: number) => {
    if (f < up || f > tap + 18) return null;
    const back = fly(tap);
    return (
      <div style={{ opacity: 1 - ramp(f, tap + 12, tap + 18) }}>
        <Lift src={shot(src)} box={box} cam={cam} up={pop(f, up, fps, 15)} back={back} to={liftTo} home={slot(p)}
          press={interpolate(f, [tap - 2, tap + 2, tap + 8], [1, 0.97, 1], clamp)} />
      </div>
    );
  };

  return (
    <AbsoluteFill>
      {prev ? <ScreenImg name={prev} cam={cam} opacity={1} /> : null}
      <ScreenImg name={name} cam={cam} opacity={fade} />

      {tplOn ? (
        <>
          <OnScreen cam={cam} box={TPL_COVER} style={{ background: "#221618", opacity: 1 - ramp(f, ROWS_AT + 34, ROWS_AT + 38) }} />
          {TPL_ROWS.map((r, j) => {
            const p = pop(f, ROWS_AT + j * 6, fps, 14);
            return f >= ROWS_AT + j * 6 && f < ROWS_AT + 38 ? (
              <OnScreen key={j} cam={cam} box={r} style={{ opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 14}px) scale(${0.97 + 0.03 * p})` }}>
                <Crop src={shot("tpl")} box={r} w={r.w * cam.s} />
              </OnScreen>
            ) : null;
          })}
        </>
      ) : null}

      {/* each pick: where the press lands. The new blocks are held at their previous look (the
          dashed preview) until they pop in, solid, from the real after-press capture. */}
      {PICKS.map((pk, p) => {
        if (f < pk.at || f > pk.at + 24) return null;
        const addName = `c${p + 1}add`;
        const hovName = `c${p + 1}hover`;
        const dy = WEEK_Y[addName] - WEEK_Y[hovName];
        return pk.days.map((d, j) => {
          const b = block(WEEK_Y[addName], d, pk.start);
          const before: Box = { ...b, x: b.x - 1, y: b.y - dy - 1, w: b.w + 2, h: b.h + 2 };
          const s = spring({ frame: f - pk.at - 1 - j * 3, fps, config: { damping: 11, stiffness: 190, mass: 0.6 } });
          const glow = 1 - ramp(f, pk.at + 6 + j * 3, pk.at + 22 + j * 3);
          return (
            <React.Fragment key={`${p}-${j}`}>
              {f < pk.at + 9 + j * 3 ? (
                <OnScreen cam={cam} box={{ ...b, x: b.x - 1, y: b.y - 1, w: b.w + 2, h: b.h + 2 }}>
                  <Crop src={shot(hovName)} box={before} w={(b.w + 2) * cam.s} />
                </OnScreen>
              ) : null}
              <OnScreen cam={cam} box={b} style={{ transform: `scale(${0.35 + 0.65 * s})`, opacity: Math.min(1, s * 2),
                filter: `drop-shadow(0 0 ${14 * glow}px rgba(255,255,255,${0.55 * glow}))` }}>
                <Crop src={shot(addName)} box={b} w={b.w * cam.s} radius={4} />
              </OnScreen>
            </React.Fragment>
          );
        });
      })}

      <AbsoluteFill style={{ background: "#050304", opacity: dim }} />

      {f >= ROW1_UP && f <= ROW1_TAP + 14 ? (
        <div style={{ opacity: 1 - ramp(f, ROW1_TAP + 8, ROW1_TAP + 14) }}>
          <Lift src={shot("c1list")} box={ROW1} cam={cam} up={row1Up} back={row1Back} to={liftTo}
            press={interpolate(f, [ROW1_TAP - 2, ROW1_TAP + 2, ROW1_TAP + 8], [1, 0.97, 1], clamp)} />
        </div>
      ) : null}
      {sec(0, SEC1, "c1sec", SEC1_UP, SEC1_TAP)}
      {sec(1, SEC2, "c2sec", SEC2_UP, SEC2_TAP)}

      <TapHand enterFrom={[1000, 1820]} taps={P_TAPS.map((t, j) => ({ ...toF(camAt(t), PREF_PTS[j].x, PREF_PTS[j].y), at: t, travel: j ? 10 : 16 }))} />
      <TapHand enterFrom={[1040, 1860]} taps={[{ ...toF(TPL, LOOKS_PT.x, LOOKS_PT.y), at: LOOKS_GOOD, travel: 16 }]} />
      <TapHand enterFrom={[980, 1800]} taps={[{ ...row1Tap, at: ROW1_TAP, travel: 16 }, { ...secTap(SEC1), at: SEC1_TAP, travel: 14 }]} />
      <TapHand enterFrom={[1000, 1800]} taps={[{ ...toF(WIDE, ROW2_PT.x, ROW2_PT.y), at: ROW2_TAP, travel: 14 }, { ...secTap(SEC2), at: SEC2_TAP, travel: 14 }]} />
      <TapHand enterFrom={[1000, 1800]} taps={FAST.flatMap(([c, s], j) => [
        { ...toF(MID, FAST_PTS[j].cls.x, FAST_PTS[j].cls.y), at: c, travel: 14 },
        { ...toF(MID, FAST_PTS[j].sec.x, FAST_PTS[j].sec.y), at: s, travel: 12 },
      ])} />
    </AbsoluteFill>
  );
};


/* ------------------------------------------------------------ the words */

const LINES: { from: number; to: number; l: Run[][] }[] = [
  { from: 66, to: TPL_IN, l: [[{ text: "First, your" }], [{ text: "preferences.", accent: true }]] },
  { from: TPL_IN + 2, to: WIDE_AT + 2, l: [[{ text: "Start from" }], [{ text: "a template.", accent: true }]] },
  { from: WIDE_AT + 4, to: FAST[0][0] - 8, l: [[{ text: "Then go" }], [{ text: "class by class.", accent: true }]] },
  { from: FAST[0][0] - 8, to: RAIL_AT, l: [[{ text: "Each one lands" }], [{ text: "on your week.", accent: true }]] },
  { from: RAIL_AT + 2, to: END_AT, l: [[{ text: "Your spring," }], [{ text: "planned.", accent: true }]] },
];

const Band: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 470,
        background: "linear-gradient(180deg, rgba(11,7,8,1) 0%, rgba(11,7,8,1) 78%, rgba(11,7,8,0) 100%)" }} />
      {LINES.map((x, i) => (f >= x.from && f < x.to ? (
        <div key={i} style={{ position: "absolute", top: 150, width: "100%" }}>
          <HeadLines at={x.from} outAt={x.to - 8} size={HEAD} ink={INK} face={ZODIAK} lines={x.l} />
        </div>
      ) : null))}
    </>
  );
};

/* ------------------------------------------------------------- the hook */

const dayWord = (n: number) => (n === 1 ? "1 day" : `${n} days`);

const Hook: React.FC<{ daysAway: number }> = ({ daysAway }) => {
  const f = useCurrentFrame();
  const out = ramp(f, HOOK_OUT, HOOK_OUT + 14);
  const second: Run[] = daysAway <= 0 ? [{ text: "opens " }, { text: "today.", accent: true }] : [{ text: "is " }, { text: dayWord(daysAway), accent: true }, { text: " away." }];
  return (
    <AbsoluteFill style={{ opacity: 1 - out, transform: `scale(${1 + out * 0.08})`, filter: out ? `blur(${out * 10}px)` : undefined }}>
      <WeekGrid at={0} top={720} rowH={112} />
      <div style={{ position: "absolute", top: 300, width: "100%" }}>
        <HeadLines at={8} size={96} ink={INK} face={ZODIAK} stagger={5} lines={[[{ text: "Spring registration" }], second]} />
      </div>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------- the end */

const End: React.FC = () => {
  const f = useCurrentFrame() - END_AT;
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 2, fps, config: { damping: 12, stiffness: 150, mass: 0.8 } });
  return (
    <AbsoluteFill style={{ opacity: ramp(f, 0, 10) }}>
      <WeekGrid at={-40} top={420} rowH={128} labels={false} opacity={0.6} />
      <div style={{ position: "absolute", left: CX - 150, top: 700, width: 300, height: 300, borderRadius: 70, overflow: "hidden",
        transform: `scale(${0.6 + 0.4 * s})`, opacity: Math.min(1, s * 2), boxShadow: "0 30px 90px rgba(0,0,0,.55)" }}>
        <Img src={staticFile("kit/app-icon.png")} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
      <div style={{ position: "absolute", top: 1080, width: "100%", textAlign: "center", fontFamily: ZODIAK.family, fontWeight: 700, fontSize: 64,
        letterSpacing: ZODIAK.track, color: "#fff", opacity: ramp(f, 16, 28), transform: `translateY(${(1 - ramp(f, 16, 28)) * 16}px)` }}>Link in bio.</div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ the edit */

export const RegistrationFilm: React.FC<{ daysAway?: number }> = ({ daysAway = 5 }) => {
  useZodiak();
  const f = useCurrentFrame();
  const productIn = ramp(f, HOOK_OUT + 2, HOOK_OUT + 14);
  const productOut = ramp(f, END_AT - 4, END_AT + 6);
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: INTER }}>
      {f >= HOOK_OUT && f < END_AT + 8 ? (
        <AbsoluteFill style={{ opacity: productIn * (1 - productOut) }}>
          <Product />
          <Band />
        </AbsoluteFill>
      ) : null}
      {f < HOOK_OUT + 16 ? <Hook daysAway={daysAway} /> : null}
      {f >= END_AT - 4 ? <End /> : null}
    </AbsoluteFill>
  );
};
