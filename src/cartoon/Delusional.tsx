/**
 * "Am I delusional?" (2026-11-05), 9:16. The first generated-look test: a soft 3D cartoon student (Gemini images, one
 * character, made with films/cartoon-test/gen.sh) spirals at night over a Goldman posting. Over their shoulder the REAL
 * product is on the laptop: Goldman's own job card in Job Match. Excel and PowerPoint fly out of the screen, the page
 * scrolls to "Skills recruiters screen for", and that real row lifts out of the laptop: each skill the student has
 * pops in turn, the two they don't wobble. One sticker with the card's own words. Then the laptop goes to Learn a
 * skill, "valuation" is searched, and its row (a free NYU Stern course, the UMD class) lifts out. Then the student
 * leans back relieved, and the logo.
 * Images are illustration only: no UI, no text in them. Every word on screen is drawn here or comes from the
 * recording: films/cartoon-delusional/facts.md.
 *
 * Round 3 (Jacob): stay on the computer instead of zooming the page to fill the reel; add icons and logos; an ending
 * that belongs to the story. Round 4: the skills on the job card itself, not Tailor resume. Round 5: then where to
 * learn the missing one (Learn a skill, recorded by films/cartoon-delusional/cartoon-delusional-learn.json).
 * Recording: `npm run flow cartoon-delusional` (Job Match opened on the Goldman job, 1280 x 2300 CSS px, DPR 3), so
 * the whole card including the skills row is in one frame; the laptop shows its top and pans down to the row.
 */
import React from "react";
import { AbsoluteFill, Audio, Composition, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { brand as getBrand, glow, Icon, INTER, LogoEnd, LogoOpen, pop, SPARK, useBrandFonts } from "../kit";
import { EASE, EASE_CAMERA } from "../lib/anim";
import rec from "../../public/cartoon-delusional/flow/frames.json";
import learnRec from "../../public/cartoon-delusional-learn/flow/frames.json";

const FPS = 30;
const W = 1080;
const H = 1920;
const IMG_H = (1376 / 768) * W; // generated images are 768 x 1376, drawn 1080 wide
const IMG_TOP = (H - IMG_H) / 2;
const IMG_K = W / 768;
const B = getBrand("campusai");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const QUESTION = "be honest. do i qualify for goldman or am i delusional";
type Rec = { vw: number; vh: number; marks: Record<string, number>; frames: { t: number; name: string }[] };
const R = rec as Rec;
const L = learnRec as Rec;

// timeline, frames
const TYPE_AT = 6; // one letter a frame
const GOLDMAN_AT = TYPE_AT + QUESTION.indexOf("goldman") + 7; // the word has just finished typing
const CLOSE_AT = 72; // dissolve to the close-up
const SHOULDER_AT = 118; // cut to over the shoulder, Tailor already reading on the laptop
const REC_AT = R.marks.held - 1; // the page has settled; the recording is still from here on
const PUSH = { from: 124, to: 168 }; // the camera settles on the laptop, never into it
const LOGOS_AT = [150, 160]; // Excel, PowerPoint: two of the skills the card screens for
const PAN = { from: 172, to: 190 }; // the page scrolls to the card
const LIFT = { from: 192, to: 208 };
const CHIPS_AT = 218; // one skill every 9 frames: the four checked, then the two missing // the card lifts out of the laptop, just before its marks land
const STICK = 292; // the card's own count, big
const DROP = 350; // the card goes back into the laptop
const LEARN_AT = 364; // the laptop goes to Learn a skill as "valuation" finishes typing
const LEARN_REC = 3.0; // learn recording time at LEARN_AT
const LIFT2 = { from: 386, to: 402 }; // the Valuation row lifts out
const DROP2 = 470;
const RELIEF_AT = 478;
const LOGO_AT = 550;
const TOTAL = LOGO_AT + 96;

// The laptop screen in 2b-over-shoulder.jpg, measured (image px x 244-509, y 632-810), in canvas px.
const SCREEN = { x0: 244 * IMG_K, y0: 632 * IMG_K + IMG_TOP, x1: 509 * IMG_K, y1: 810 * IMG_K + IMG_TOP };
const SW = SCREEN.x1 - SCREEN.x0;
const SH = SCREEN.y1 - SCREEN.y0;
const SC = { x: (SCREEN.x0 + SCREEN.x1) / 2, y: (SCREEN.y0 + SCREEN.y1) / 2 };
// What the screen shows: the page right of the sidebar (CSS x 216 on, so the school's logo is never on screen).
const RX0 = 216;
const KS = SW / (R.vw - RX0); // canvas px per CSS px on the screen, before the camera
const PAN_Y = 1366; // CSS px scrolled to bring the skills row to the middle of the screen
// The camera's landing: the screen 880 px wide, its centre at (540, 800).
const Z1 = 880 / SW;
const C_END = { x: 540, y: 800 };
// "Skills recruiters screen for", measured in the recording (CSS px), and where it lands lifted.
const CARD = { x0: 680, y0: 1638, x1: 1206, y1: 1806 };
const CARD_K = 1000 / (CARD.x1 - CARD.x0); // ~1.9 canvas px per CSS px, chip text ~30 px
const CARD_TO = { x: 40, y: 760 };
// Its chips, in order: the four with a check, then the two without (CSS px).
type Box = { x0: number; y0: number; x1: number; y1: number; has: boolean };
const CHIPS: Box[] = [
  { x0: 699, y0: 1681, x1: 908, y1: 1707, has: true }, // Financial statement analysis
  { x0: 916, y0: 1681, x1: 988, y1: 1707, has: true }, // Excel
  { x0: 996, y0: 1681, x1: 1103, y1: 1707, has: true }, // Accounting
  { x0: 699, y0: 1715, x1: 807, y1: 1741, has: true }, // PowerPoint
  { x0: 815, y0: 1715, x1: 946, y1: 1741, has: false }, // Financial modeling
  { x0: 954, y0: 1715, x1: 1030, y1: 1741, has: false }, // Valuation
];

const frameAt = (r: Rec, t: number) => {
  let fr = r.frames[0];
  for (const x of r.frames) {
    if (x.t <= t) fr = x;
    else break;
  }
  return fr;
};
const recSrc = (f: number) => `cartoon-delusional/flow/${frameAt(R, REC_AT + (f - SHOULDER_AT) / FPS).name}`;
const learnSrc = (f: number) => `cartoon-delusional-learn/flow/${frameAt(L, LEARN_REC + (f - LEARN_AT) / FPS).name}`;
// The Valuation row on Learn a skill (CSS px of the 1280 x 1100 recording), split in two so each half reads big:
// its name and course line, then its two buttons (Online course, UMD · BMGT440).
const ROW_TEXT = { x0: 256, y0: 238, x1: 610, y1: 288 };
const ROW_BTNS = { x0: 958, y0: 241, x1: 1236, y1: 284 };
const ROW_K = 2.6;

/** A generated still, covering the frame, pushed in on a focus point. */
const Still: React.FC<{ src: string; from: number; to: number; s0: number; s1: number; fx: number; fy: number }> = ({ src, from, to, s0, s1, fx, fy }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [from, to], [s0, s1], { ...clamp, easing: EASE_CAMERA });
  return (
    <AbsoluteFill style={{ transformOrigin: `${fx}px ${fy}px`, transform: `scale(${s.toFixed(4)})` }}>
      <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: IMG_TOP, width: W, height: IMG_H, maxWidth: "none" }} />
    </AbsoluteFill>
  );
};

const Question: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(QUESTION.length, f - TYPE_AT + 1));
  const out = interpolate(f, [PUSH.from, PUSH.from + 10], [1, 0], clamp);
  if (n === 0 || out <= 0) return null;
  const caret = n < QUESTION.length || Math.floor(f / 15) % 2 === 0;
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 330, opacity: out, fontFamily: "Zodiak", fontWeight: 700, fontSize: 70,
      lineHeight: 1.12, letterSpacing: "-0.02em", color: B.color.ink, textShadow: "0 4px 28px rgba(5,6,18,0.85)" }}>
      {QUESTION.slice(0, n)}
      <span style={{ opacity: caret ? 1 : 0, color: B.color.accent, fontWeight: 400 }}>|</span>
    </div>
  );
};

/** A small round chip that pops in, drifts up, and fades: the student's worries, or a logo. */
const Chip: React.FC<{ at: number; until: number; x: number; y: number; size: number; tilt: number; children: React.ReactNode; light?: boolean }> = ({ at, until, x, y, size, tilt, children, light }) => {
  const f = useCurrentFrame();
  if (f < at || f > until + 10) return null;
  const k = pop(f, at, FPS, 11);
  const out = interpolate(f, [until, until + 10], [0, 1], clamp);
  const rise = (f - at) * 0.9;
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2 - rise, width: size, height: size, borderRadius: size * 0.28,
      display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 - out,
      background: light ? "#ffffff" : "rgba(20,16,28,0.72)", border: light ? "none" : "1.5px solid rgba(255,255,255,0.18)",
      boxShadow: `0 14px 34px rgba(0,0,0,0.45)${light ? "" : `, 0 0 26px ${glow(B, 0.25)}`}`,
      transform: `rotate(${(tilt * (2 - k)).toFixed(2)}deg) scale(${(k * (1 - 0.2 * out)).toFixed(4)})` }}>
      {children}
    </div>
  );
};

const LUCIDE: Record<string, string[]> = {
  trend: ["M22 7 13.5 15.5 8.5 10.5 2 17", "M16 7h6v6"],
  cap: ["M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z", "M22 10v6", "M6 12.5V16a6 3 0 0 0 12 0v-3.5"],
};
const Lucide: React.FC<{ name: keyof typeof LUCIDE; size: number; color: string }> = ({ name, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {LUCIDE[name].map((d) => <path key={d} d={d} />)}
  </svg>
);

/** Over the shoulder, settling on the laptop. The real page plays on its screen and scrolls to the card. */
const Laptop: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [PUSH.from, PUSH.to], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const z = Math.pow(Z1, p);
  const fp = { x: SC.x + (C_END.x - SC.x) * p, y: SC.y + (C_END.y - SC.y) * p };
  const pan = interpolate(f, [PAN.from, PAN.to], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const lifted = Math.max(
    interpolate(f, [LIFT.from, LIFT.from + 10], [0, 1], clamp) * (1 - interpolate(f, [DROP, DROP + 10], [0, 1], clamp)),
    interpolate(f, [LIFT2.from, LIFT2.from + 10], [0, 1], clamp) * (1 - interpolate(f, [DROP2, DROP2 + 10], [0, 1], clamp)),
  );
  const swap = interpolate(f, [LEARN_AT, LEARN_AT + 3], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: B.color.bgDeep }}>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${(fp.x - z * SC.x).toFixed(2)}px, ${(fp.y - z * SC.y).toFixed(2)}px) scale(${z.toFixed(5)})`,
        filter: lifted > 0 ? `brightness(${(1 - 0.55 * lifted).toFixed(3)}) blur(${(3 * lifted).toFixed(2)}px)` : undefined }}>
        <Img src={staticFile("cartoon-delusional/2b-over-shoulder.jpg")} style={{ position: "absolute", left: 0, top: IMG_TOP, width: W, height: IMG_H, maxWidth: "none" }} />
        <div style={{ position: "absolute", left: SCREEN.x0, top: SCREEN.y0, width: SW, height: SH, overflow: "hidden", borderRadius: 3, background: B.color.bg }}>
          {swap < 1 && <Img src={staticFile(recSrc(f))} style={{ position: "absolute", left: -RX0 * KS, top: -PAN_Y * pan * KS, width: R.vw * KS, height: R.vh * KS, maxWidth: "none" }} />}
          {swap > 0 && <Img src={staticFile(learnSrc(f))} style={{ position: "absolute", left: -RX0 * KS, top: 0, width: L.vw * KS, height: L.vh * KS, maxWidth: "none", opacity: swap }} />}
          {/* the screen's own light on the room */}
          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 18px rgba(255,236,214,0.16)" }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Where a CSS point of the recording sits on the canvas once the camera has landed and the page has panned. */
const onScreen = (x: number, y: number) => {
  const sx = SCREEN.x0 + (x - RX0) * KS;
  const sy = SCREEN.y0 + (y - PAN_Y) * KS;
  return { x: C_END.x + Z1 * (sx - SC.x), y: C_END.y + Z1 * (sy - SC.y) };
};

/** The real card, cut from the same recording frame, lifted out of the laptop toward the camera. */
const CardLift: React.FC = () => {
  const f = useCurrentFrame();
  const up = interpolate(f, [LIFT.from, LIFT.to], [0, 1], { ...clamp, easing: EASE });
  const down = interpolate(f, [DROP, DROP + 12], [0, 1], { ...clamp, easing: EASE });
  const k = up * (1 - down);
  if (k <= 0.001) return null;
  const a = onScreen(CARD.x0, CARD.y0);
  const s0 = Z1 * KS;
  const s = s0 + (CARD_K - s0) * k;
  const x = a.x + (CARD_TO.x - a.x) * k;
  const y = a.y + (CARD_TO.y - a.y) * k;
  const w = (CARD.x1 - CARD.x0) * s;
  const h = (CARD.y1 - CARD.y0) * s;
  const tilt = (1 - k) * -6;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", borderRadius: 14 * (s / CARD_K),
      transform: `perspective(1600px) rotateX(${tilt.toFixed(2)}deg)`, background: B.color.bg,
      boxShadow: `0 ${(40 * k).toFixed(0)}px ${(90 * k).toFixed(0)}px rgba(0,0,0,${(0.6 * k).toFixed(2)}), 0 0 ${(60 * k).toFixed(0)}px ${glow(B, 0.3 * k)}` }}>
      <Img src={staticFile(recSrc(f))} style={{ position: "absolute", left: -CARD.x0 * s, top: -CARD.y0 * s, width: R.vw * s, height: R.vh * s, maxWidth: "none" }} />
      {/* each skill in turn: the ones they have pop, the ones they don't wobble (the marks are the product's own) */}
      {CHIPS.map((c, i) => {
        const at = CHIPS_AT + i * 9;
        if (f < at) return null;
        const b = pop(f, at, FPS, 9);
        const bump = c.has ? Math.max(0, Math.sin(Math.min(1, (f - at) / 10) * Math.PI)) * 0.14 : 0;
        const wob = c.has ? 0 : Math.sin((f - at) * 1.3) * 5 * Math.max(0, 1 - (f - at) / 16);
        const glowA = c.has ? 0.55 * Math.max(0, 1 - (f - at) / 24) : 0;
        const w = (c.x1 - c.x0) * s;
        const h = (c.y1 - c.y0) * s;
        return (
          <div key={i} style={{ position: "absolute", left: (c.x0 - CARD.x0) * s, top: (c.y0 - CARD.y0) * s, width: w, height: h, overflow: "hidden",
            borderRadius: 8 * s, transform: `translateX(${wob.toFixed(2)}px) scale(${(1 + bump * b).toFixed(4)})`,
            boxShadow: glowA > 0 ? `0 0 ${(28 * glowA).toFixed(0)}px rgba(52, 211, 153, ${glowA.toFixed(3)})` : undefined }}>
            <Img src={staticFile(recSrc(f))} style={{ position: "absolute", left: -c.x0 * s, top: -c.y0 * s, width: R.vw * s, height: R.vh * s, maxWidth: "none" }} />
          </div>
        );
      })}
    </div>
  );
};

/** Where a CSS point of the Learn a skill recording sits on the canvas, the camera landed (no pan on this page). */
const onLearn = (x: number, y: number) => {
  const sx = SCREEN.x0 + (x - RX0) * KS;
  const sy = SCREEN.y0 + y * KS;
  return { x: C_END.x + Z1 * (sx - SC.x), y: C_END.y + Z1 * (sy - SC.y) };
};

/** The Valuation row, cut from the recording in two pieces, lifted out of the laptop and stacked big. */
const LearnLift: React.FC = () => {
  const f = useCurrentFrame();
  const up = interpolate(f, [LIFT2.from, LIFT2.to], [0, 1], { ...clamp, easing: EASE });
  const down = interpolate(f, [DROP2, DROP2 + 12], [0, 1], { ...clamp, easing: EASE });
  const k = up * (1 - down);
  if (k <= 0.001) return null;
  const src = staticFile(learnSrc(f));
  const s0 = Z1 * KS;
  const piece = (r: typeof ROW_TEXT, to: { x: number; y: number }, delay: number) => {
    const kk = Math.max(0, Math.min(1, (k - delay) / (1 - delay)));
    const ss = s0 + (ROW_K - s0) * kk;
    const a = onLearn(r.x0, r.y0);
    return (
      <div style={{ position: "absolute", left: a.x + (to.x - a.x) * kk, top: a.y + (to.y - a.y) * kk, width: (r.x1 - r.x0) * ss, height: (r.y1 - r.y0) * ss,
        overflow: "hidden", borderRadius: 10 * (ss / ROW_K), background: B.color.bg,
        boxShadow: `0 ${(30 * kk).toFixed(0)}px ${(70 * kk).toFixed(0)}px rgba(0,0,0,${(0.55 * kk).toFixed(2)})` }}>
        <Img src={src} style={{ position: "absolute", left: -r.x0 * ss, top: -r.y0 * ss, width: L.vw * ss, height: L.vh * ss, maxWidth: "none" }} />
      </div>
    );
  };
  const textW = (ROW_TEXT.x1 - ROW_TEXT.x0) * ROW_K;
  const btnW = (ROW_BTNS.x1 - ROW_BTNS.x0) * ROW_K;
  return (
    <>
      {piece(ROW_TEXT, { x: (W - textW) / 2, y: 720 }, 0)}
      {piece(ROW_BTNS, { x: (W - btnW) / 2, y: 900 }, 0.15)}
    </>
  );
};

/** The card's own count, big: dims the card and pops up tilted in the brand red (RegisterChat's Gen Z sticker). */
const Sticker: React.FC = () => {
  const f = useCurrentFrame();
  const inK = interpolate(f, [STICK, STICK + 8], [0, 1], clamp);
  const out = interpolate(f, [DROP - 8, DROP + 2], [0, 1], clamp);
  if (inK <= 0 || out >= 1) return null;
  const k = pop(f, STICK + 2, FPS, 10);
  const sm = pop(f, STICK + 8, FPS, 13);
  return (
    <>
      <div style={{ position: "absolute", left: W / 2, top: 1300, transform: `translate(-50%, -50%) rotate(${(-3 - (1 - k) * 6).toFixed(2)}deg) scale(${(k * (1 - 0.15 * out)).toFixed(4)})`,
        opacity: 1 - out, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "28px 50px 26px",
        borderRadius: 30, background: B.color.accent, boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 70px ${glow(B, 0.5)}` }}>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 92, lineHeight: 1, letterSpacing: "-0.035em", color: "#fff", whiteSpace: "nowrap" }}>4 of 6</div>
        <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 40, lineHeight: 1.1, color: "rgba(255,255,255,0.88)", whiteSpace: "nowrap",
          opacity: sm, transform: `translateY(${((1 - sm) * 10).toFixed(2)}px)` }}>Worth sharpening: Valuation and modeling</div>
        <svg width={56} height={56} viewBox="0 0 24 24" style={{ position: "absolute", right: -22, top: -24, transform: `rotate(${(((f - STICK) / FPS) * 40).toFixed(1)}deg) scale(${sm.toFixed(3)})` }}>
          <path d={SPARK} fill="#fff" />
        </svg>
      </div>
    </>
  );
};

const Address: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ position: "absolute", top: 1030, width: "100%", textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: 50,
      color: B.color.inkSoft, opacity: p, transform: `translateY(${((1 - p) * 12).toFixed(2)}px)` }}>
      campusai.app
    </div>
  );
};

const Film: React.FC = () => {
  useBrandFonts(B);
  const f = useCurrentFrame();
  const closeIn = interpolate(f, [CLOSE_AT, CLOSE_AT + 8], [0, 1], clamp);
  const shoulderIn = interpolate(f, [SHOULDER_AT, SHOULDER_AT + 4], [0, 1], clamp);
  const reliefIn = interpolate(f, [RELIEF_AT, RELIEF_AT + 10], [0, 1], clamp);
  const endOut = interpolate(f, [LOGO_AT - 12, LOGO_AT + 2], [0, 1], { ...clamp, easing: EASE });
  const veil = interpolate(f, [PUSH.from, PUSH.from + 14], [1, 0], clamp);
  const keys = Math.ceil(QUESTION.length / 3);
  return (
    <AbsoluteFill style={{ background: B.color.bgDeep }}>
      {/* 1 + 2: the night, wide then close */}
      {f < SHOULDER_AT + 6 && (
        <AbsoluteFill>
          <Still src="cartoon-delusional/1-night-wide.jpg" from={0} to={CLOSE_AT + 8} s0={1} s1={1.08} fx={520} fy={1050} />
          {closeIn > 0 && (
            <AbsoluteFill style={{ opacity: closeIn }}>
              <Still src="cartoon-delusional/2-night-close.jpg" from={CLOSE_AT} to={SHOULDER_AT + 6} s0={1.02} s1={1.08} fx={540} fy={900} />
            </AbsoluteFill>
          )}
        </AbsoluteFill>
      )}
      {/* 3: over the shoulder, the laptop, the card */}
      {f >= SHOULDER_AT && f < RELIEF_AT + 12 && (
        <AbsoluteFill style={{ opacity: shoulderIn * (1 - reliefIn) }}>
          <Laptop />
          {/* the tools the posting names, out of the screen as the read finds them */}
          <Chip at={LOGOS_AT[0]} until={LIFT.from - 4} x={250} y={470} size={150} tilt={-10} light>
            <Img src={staticFile("cartoon-delusional/logo-excel.svg")} style={{ width: 96, height: 96 }} />
          </Chip>
          <Chip at={LOGOS_AT[1]} until={LIFT.from - 4} x={830} y={430} size={150} tilt={9} light>
            <Img src={staticFile("cartoon-delusional/logo-powerpoint.svg")} style={{ width: 96, height: 96 }} />
          </Chip>
          <CardLift />
          <Sticker />
          <LearnLift />
        </AbsoluteFill>
      )}
      {/* 4: relief, the story's end */}
      {f >= RELIEF_AT && (
        <AbsoluteFill style={{ opacity: reliefIn * (1 - endOut) }}>
          <Still src="cartoon-delusional/4-relief.jpg" from={RELIEF_AT} to={LOGO_AT} s0={1.06} s1={1} fx={560} fy={900} />
        </AbsoluteFill>
      )}

      {/* the worries around the student's head while the question types, and Goldman's real mark on its name */}
      {f < SHOULDER_AT && (
        <>
          <Chip at={18} until={66} x={640} y={760} size={104} tilt={-12}><Icon name="briefcase" size={52} color="#f7efe6" /></Chip>
          <Chip at={30} until={66} x={930} y={700} size={96} tilt={10}><Lucide name="trend" size={50} color="#f7efe6" /></Chip>
          <Chip at={46} until={66} x={820} y={1080} size={92} tilt={-6}><Lucide name="cap" size={48} color="#f7efe6" /></Chip>
          <Chip at={GOLDMAN_AT} until={SHOULDER_AT - 8} x={900} y={250} size={130} tilt={8} light>
            <Img src={staticFile("cartoon-delusional/gs-logo.png")} style={{ width: 130, height: 130, borderRadius: 36 }} />
          </Chip>
        </>
      )}

      {/* a dark veil at the top so the typed question always reads; it goes with the question */}
      {f < PUSH.from + 14 && (
        <AbsoluteFill style={{ opacity: veil, background: "linear-gradient(to bottom, rgba(6,8,22,0.82) 0, rgba(6,8,22,0.55) 640px, rgba(6,8,22,0) 860px)" }} />
      )}
      <Question />
      <LogoOpen brand={B} at={2} x={W / 2} y={190} width={240} leaveAt={GOLDMAN_AT - 4} />

      {f >= LOGO_AT - 12 && (
        <AbsoluteFill style={{ opacity: interpolate(f, [LOGO_AT - 4, LOGO_AT + 10], [0, 1], clamp),
          background: `radial-gradient(120% 70% at 50% 100%, ${glow(B, 0.28)} 0%, rgba(11,7,8,0) 60%), ${B.color.bgDeep}` }} />
      )}
      <LogoEnd brand={B} at={LOGO_AT} x={W / 2} y={900} width={600} />
      <Sequence from={LOGO_AT + 8}>
        <Address />
      </Sequence>

      {/* sound */}
      <Audio src={staticFile("ask-series/music.mp3")} volume={(x) => interpolate(x, [0, 8, TOTAL - 30, TOTAL], [0, 0.32, 0.32, 0], clamp)} />
      {Array.from({ length: keys }, (_, i) => (
        <Sequence key={`k${i}`} from={TYPE_AT + i * 3} durationInFrames={10}>
          <Audio src={staticFile("sound/cues/type-switch-tap.wav")} volume={0.14} />
        </Sequence>
      ))}
      {[18, 30, 46, GOLDMAN_AT, ...LOGOS_AT].map((at) => (
        <Sequence key={`p${at}`} from={at} durationInFrames={20}>
          <Audio src={staticFile("sound/cues/notify-ui-message-pop.wav")} volume={0.22} />
        </Sequence>
      ))}
      <Sequence from={PUSH.from} durationInFrames={30}>
        <Audio src={staticFile("sound/cues/arrive-wind-swoosh-short.wav")} volume={0.28} />
      </Sequence>
      <Sequence from={LIFT.from} durationInFrames={30}>
        <Audio src={staticFile("sound/cues/move-swoosh-quick.wav")} volume={0.3} />
      </Sequence>
      {CHIPS.map((c, i) => (
        <Sequence key={`c${i}`} from={CHIPS_AT + i * 9} durationInFrames={20}>
          <Audio src={staticFile(c.has ? "sound/cues/type-alt-switch-light.wav" : "sound/cues/press-ui-select-click.wav")} volume={c.has ? 0.3 : 0.18} />
        </Sequence>
      ))}
      <Sequence from={STICK + 2} durationInFrames={30}>
        <Audio src={staticFile("sound/cues/land-ui-popup-dry.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={LEARN_AT - 2} durationInFrames={30}>
        <Audio src={staticFile("sound/cues/move-swoosh-quick.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={LIFT2.from + 4} durationInFrames={30}>
        <Audio src={staticFile("sound/cues/notify-ui-message-pop.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={RELIEF_AT} durationInFrames={40}>
        <Audio src={staticFile("sound/cues/success-chime-crystal.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={LOGO_AT - 6} durationInFrames={60}>
        <Audio src={staticFile("sound/cues/logo-bass-hit-futuristic.wav")} volume={0.45} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const CartoonRoot: React.FC = () => (
  <Composition id="CartoonDelusional-9x16" component={Film} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
);
