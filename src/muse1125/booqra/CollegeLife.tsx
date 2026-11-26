/**
 * "Navigating college life shouldn't be this hard." Muse pass 2026-11-25, from Booqra's 47 s promo
 * (instagram.com/reel/DfSCMz-vbau, read frame by frame). Jacob: "We should do this almost exactly like this but for
 * campusai." Same spine as Booqra: the mess fills the screen around one italic-serif line, a calendar of dates
 * floods in with the red ones flagged, the reframe line scrolls across, the wordmark with its ring, one word in a
 * letter wave, then the product proving it beat by beat, and a call to action that ends on the address.
 *
 * Everything on a product screen is a frame of the real demo recorded on Nov 25 with `npm run flow`
 * (films/muse1125-booqra/flows/*.json -> public/muse1125-booqra/flow-*). The notification and date-chip words are
 * the demo student's own week (films/muse1125-booqra/facts.md). Voice: Victor on eleven_v4, one take per line.
 */
import React from "react";
import {
  AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame,
} from "remotion";
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { PointerAt, pointerAt } from "../../kit";
import { useFrameSeq } from "../../system/parts/common";
import { Bed } from "../../styles/common";

const { fontFamily: SANS } = loadInterTight("normal", { weights: ["500", "600"] });
const { fontFamily: SERIF } = loadSerif("italic");

export const FPS = 30;
export const TOTAL_S = 52.8;
const DIR = "muse1125-booqra";
const RED = "#D9202E";
const CX = 540, CY = 960;

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
const IN = Easing.bezier(0.55, 0, 0.9, 0.4);
/** 0..1 between two seconds. */
const k = (t: number, a: number, b: number, e = OUT) => interpolate(t, [a, b], [0, 1], { ...cl, easing: e });
const mix = (a: number, b: number, x: number) => a + (b - a) * x;
const useT = () => useCurrentFrame() / FPS;

// ---------------------------------------------------------------- ground and type

/** Booqra's soft gradient, leaned toward the brand's reds: blush, coral, peach, a little warm yellow. */
const Ground: React.FC<{ white?: number }> = ({ white = 0 }) => {
  const t = useT();
  const blob = (x: number, y: number, r: number, c: string) => `radial-gradient(${r}px ${r}px at ${x}px ${y}px, ${c}, transparent 70%)`;
  const s = (p: number, a: number) => Math.sin(t * 0.35 + p) * a;
  const c = (p: number, a: number) => Math.cos(t * 0.29 + p) * a;
  return (
    <AbsoluteFill style={{ background: "#efe3e1" }}>
      <AbsoluteFill
        style={{
          backgroundImage: [
            blob(240 + s(0, 160), 380 + c(1, 200), 820, "rgba(242,135,111,0.85)"),
            blob(880 + c(2, 160), 700 + s(3, 220), 760, "rgba(243,166,182,0.9)"),
            blob(300 + c(4, 200), 1350 + s(5, 180), 900, "rgba(246,214,140,0.75)"),
            blob(820 + s(6, 180), 1600 + c(7, 160), 760, "rgba(232,105,122,0.7)"),
            blob(560 + c(8, 240), 1000 + s(9, 260), 620, "rgba(247,190,149,0.8)"),
          ].join(","),
        }}
      />
      {white > 0 && <AbsoluteFill style={{ background: "#fbf6f5", opacity: white }} />}
    </AbsoluteFill>
  );
};

const SHADOW = "0 2px 34px rgba(140,40,52,0.28)";
/** A line in the sans with one or more words in the italic serif, Booqra's "Tired of the mess?". */
const Line: React.FC<{ parts: [string, boolean][]; size: number; color?: string; style?: React.CSSProperties }> = ({ parts, size, color = "#fff", style }) => (
  <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: size, lineHeight: 1.02, letterSpacing: "-0.03em", color, textShadow: color === "#fff" ? SHADOW : undefined, ...style }}>
    {parts.map(([w, it], i) => (
      <span key={i} style={it ? { fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.01em", fontSize: size * 1.08 } : undefined}>{w}</span>
    ))}
  </div>
);

/** A block that blurs and rises in, then blurs out. */
const blurIn = (t: number, a: number, b: number, dur = 0.45) => {
  const i = k(t, a, a + dur);
  const o = k(t, b - 0.3, b, IN);
  return { opacity: i * (1 - o), filter: `blur(${(1 - i) * 14 + o * 18}px)`, transform: `translateY(${(1 - i) * 26 - o * 10}px)` };
};

// ---------------------------------------------------------------- the real product

type Cam = { cx: number; cy: number; s: number };
type Key = [number, number, Cam];
/** Camera from keys [start, end, target]: glides from the last target to this one between start and end. */
const camAt = (t: number, keys: Key[], e = INOUT): Cam => {
  let c = keys[0][2];
  for (let i = 1; i < keys.length; i++) {
    const [a, b, to] = keys[i];
    if (t <= a) break;
    const x = k(t, a, b, e);
    c = { cx: mix(c.cx, to.cx, x), cy: mix(c.cy, to.cy, x), s: mix(c.s, to.s, x) };
  }
  return c;
};
/** Piecewise film seconds to recording seconds. */
const recAt = (t: number, map: [number, number][]) => {
  if (t <= map[0][0]) return map[0][1];
  for (let i = 1; i < map.length; i++) {
    const [a, ra] = map[i - 1];
    const [b, rb] = map[i];
    if (t <= b) return ra + ((t - a) / (b - a)) * (rb - ra);
  }
  return map[map.length - 1][1];
};

/** One recorded flow drawn as a frameless page under a camera; `rec` picks the recorded moment. */
const Page: React.FC<{
  flow: string; rec?: number; still?: string; cam: Cam; y?: number; pointer?: boolean;
  tilt?: { rx?: number; ry?: number; rz?: number }; lift?: number; blur?: number; opacity?: number; children?: React.ReactNode;
}> = ({ flow, rec = 0, still, cam, y = CY, pointer, tilt, lift = 0, blur = 0, opacity = 1, children }) => {
  const seq = useFrameSeq(`${DIR}/flow-${flow}/frames.json`);
  if (!seq) return null;
  let name = still ?? seq.frames[0].name;
  if (!still) for (const fr of seq.frames) { if (fr.t <= rec) name = fr.name; else break; }
  const moves = (seq as unknown as { moves?: Parameters<typeof pointerAt>[0] }).moves ?? [];
  const at = pointer ? pointerAt(moves, rec) : null;
  return (
    <AbsoluteFill style={{ perspective: 2600, opacity, filter: blur > 0.1 ? `blur(${blur}px)` : undefined }}>
      <AbsoluteFill style={{ transformOrigin: `${CX}px ${y}px`, transform: `translateY(${lift}px) rotateX(${tilt?.rx ?? 0}deg) rotateY(${tilt?.ry ?? 0}deg) rotateZ(${tilt?.rz ?? 0}deg)` }}>
        <div
          style={{
            position: "absolute", left: 0, top: 0, width: 1440, height: 900, transformOrigin: "0 0",
            transform: `translate(${CX - cam.cx * cam.s}px, ${y - cam.cy * cam.s}px) scale(${cam.s})`,
            borderRadius: 18, overflow: "hidden", boxShadow: "0 40px 140px rgba(110,24,36,0.45), 0 0 0 1px rgba(255,255,255,0.10)",
          }}
        >
          <Img src={staticFile(`${seq.dir}${name}`)} style={{ width: 1440, height: 900, display: "block" }} />
          {children}
          {at?.p && <div data-snap><PointerAt x={at.p.x} y={at.p.y} since={at.since} accent={RED} size={26} /></div>}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** A part of one recorded frame, cut out and floated on the ground (Booqra's lifted occupancy card). */
const Crop: React.FC<{ flow: string; still: string; r: { x: number; y: number; w: number; h: number }; s: number; x?: number; y?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ flow, still, r, s, x = CX, y = CY, style, children }) => (
  <div style={{ position: "absolute", left: x - (r.w * s) / 2, top: y - (r.h * s) / 2, width: r.w * s, height: r.h * s, borderRadius: 16 * s, overflow: "hidden",
    boxShadow: "0 30px 90px rgba(110,24,36,0.42), 0 0 0 1px rgba(255,255,255,0.12)", background: "#0b0708", ...style }}>
    <Img src={staticFile(`${DIR}/flow-${flow}/${still}`)} style={{ position: "absolute", left: -r.x * s, top: -r.y * s, width: 1440 * s, height: 900 * s, maxWidth: "none", maxHeight: "none" }} />
    {children}
  </div>
);

// ---------------------------------------------------------------- 1. the mess

type Note = { app: "canvas" | "outlook" | "groupme" | "testudo"; title: string; body?: string; x: number; y: number; at: number; from: "l" | "r" | "t" | "b"; w: number };
const APP = {
  canvas: { name: "ELMS-Canvas", icon: "canvas.png", tile: "#fff" },
  outlook: { name: "Outlook", icon: "outlook.png", tile: "#fff" },
  groupme: { name: "GroupMe", icon: "groupme.png", tile: "#fff" },
  testudo: { name: "Testudo", icon: "testudo.png", tile: "#B11A2B" },
};
// The demo student's own week (facts.md): every name, date and time here is on her dashboard, Events or My Calendar.
const NOTES: Note[] = [
  { app: "groupme", title: "Finance Association", body: "Resume & LinkedIn Night, tomorrow 7 PM", x: 470, y: 230, at: 0.85, from: "r", w: 580 },
  { app: "canvas", title: "BMGT380", body: "Case brief: Palsgraf is due Wed at 11:59 PM", x: 30, y: 430, at: 1.2, from: "l", w: 600 },
  { app: "outlook", title: "Smith OCS", body: "Smith Fall Career & Internship Fair, Mon, Nov 30, 10 AM", x: 420, y: 1150, at: 1.55, from: "r", w: 640 },
  { app: "testudo", title: "Spring 2027 registration", body: "Plan your Spring 2027 classes", x: 140, y: 60, at: 1.9, from: "t", w: 600 },
  { app: "groupme", title: "Smith Finance Group", body: "Financial Modeling Bootcamp, Sat 5 PM", x: 24, y: 1330, at: 2.2, from: "l", w: 590 },
  { app: "canvas", title: "BMGT343", body: "Quiz 2 due Thu", x: 600, y: 600, at: 2.55, from: "r", w: 450 },
  { app: "canvas", title: "Due date moved", body: "Reading Response 6: Remedies is now due Sat, Nov 21", x: 330, y: 1530, at: 2.85, from: "b", w: 720 },
  { app: "groupme", title: "Smith Investment Fund", body: "Stock Pitch Competition, Saturday 5 PM", x: 40, y: 1740, at: 3.15, from: "b", w: 640 },
  { app: "canvas", title: "BMGT343", body: "Midterm exam, Wed, Dec 2", x: 610, y: 1020, at: 3.45, from: "r", w: 450 },
];

const NoteCard: React.FC<{ n: Note; t: number }> = ({ n, t }) => {
  const a = APP[n.app];
  const e = k(t, n.at, n.at + 0.5);
  const d = (1 - e) * 700;
  const dx = n.from === "l" ? -d : n.from === "r" ? d : 0;
  const dy = n.from === "t" ? -d : n.from === "b" ? d : 0;
  const drift = Math.sin(t * 0.9 + n.x) * 6;
  return (
    <div style={{ position: "absolute", left: n.x, top: n.y, width: n.w, transform: `translate(${dx}px, ${dy + drift}px)`, opacity: e,
      background: "rgba(255,255,255,0.93)", borderRadius: 26, padding: "18px 22px", boxShadow: "0 14px 40px rgba(120,40,50,0.18)", fontFamily: SANS }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: a.tile, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 1px rgba(0,0,0,0.06)" }}>
          <Img src={staticFile(`${DIR}/logos/${a.icon}`)} style={n.app === "testudo" ? { width: 36, height: "auto" } : { width: 40, height: 40 }} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, color: "#2a2224" }}>{a.name}</div>
        <div style={{ marginLeft: "auto", fontSize: 21, color: "#9a8d8f" }}>now</div>
      </div>
      <div style={{ fontSize: 25, fontWeight: 600, color: "#1d1718", marginTop: 12 }}>{n.title}</div>
      {n.body && <div style={{ fontSize: 24, fontWeight: 500, color: "#4d4345", marginTop: 3, lineHeight: 1.25 }}>{n.body}</div>}
    </div>
  );
};

const Mess: React.FC = () => {
  const t = useT();
  const out = k(t, 4.15, 4.5, IN);
  // frame 0 already carries the hook (11/24): the line is set, sharpening as the voice starts
  const hook = k(t, -0.15, 0.35);
  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: `blur(${out * 22}px)` }}>
      {NOTES.map((n, i) => <NoteCard key={i} n={n} t={t} />)}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ opacity: 0.55 + 0.45 * hook, filter: `blur(${(1 - hook) * 8}px)`, transform: `scale(${1.04 - 0.04 * hook})`, textAlign: "center" }}>
          <Line size={150} parts={[["Tired ", false], ["of", true]]} />
          <Line size={150} parts={[["the mess?", false]]} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2. the calendar full of red

// Nov 16 to Dec 6 in a scattered order; red = a day with something due on her week (23, 24, 26, 27) and the midterm (2).
const DAYS = [19, 3, 28, 14, 6, 30, 22, 27, 1, 17, 24, 29, 18, 23, 25, 26, 2, 21, 16, 5, 20, 4, 26, 30, 17, 27, 23, 19, 2, 28, 22, 3, 24, 18, 29, 1, 21, 16, 20, 6, 4, 24, 5, 27, 30, 19, 2, 17, 23, 28, 22, 26, 18, 1, 29, 3, 21, 6, 20, 16, 4, 5, 24, 30, 27, 2];
const RED_DAYS = new Set([23, 24, 26, 27, 2]);
const COLS = 6, D = 156, GX = 184, GY = 172;
const Chips: React.FC = () => {
  const t = useT();
  if (t < 4.3 || t > 6.95) return null;
  // one chip, the camera pulls back as the rest flood in (Booqra 3.05 to 4.2 s)
  const zoom = mix(2.3, 1, k(t, 4.45, 5.35, INOUT));
  const out = k(t, 6.55, 6.9, IN);
  const cells: React.ReactNode[] = [];
  const rows = 12;
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < COLS + 1; c++) {
      const x = CX + (c - COLS / 2) * GX + (r % 2 ? GX / 2 : 0);
      const y = CY + (r - (rows - 1) / 2) * GY;
      const today = r === 6 && c === 3;
      const day = today ? 25 : DAYS[n++ % DAYS.length];
      const dist = Math.hypot(x - CX, y - CY);
      const at = today ? 4.32 : 4.55 + dist / 1900;
      const e = k(t, at, at + 0.35);
      const red = !today && RED_DAYS.has(day) ? k(t, 5.0 + (dist % 300) / 600, 5.25 + (dist % 300) / 600) : 0;
      if (e <= 0) continue;
      cells.push(
        <div key={`${r}-${c}`} style={{ position: "absolute", left: x - D / 2, top: y - D / 2, width: D, height: D, borderRadius: D,
          transform: `scale(${0.6 + 0.4 * e})`, opacity: e,
          background: red > 0 ? `rgba(217,32,46,${0.25 + 0.75 * red})` : "rgba(255,255,255,0.55)",
          boxShadow: red > 0.5 ? "0 10px 30px rgba(217,32,46,0.35)" : "0 6px 20px rgba(140,60,60,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 500 }}>
          {today ? (
            <div style={{ width: 92, height: 92, borderRadius: 20, background: "#fff", overflow: "hidden", boxShadow: "0 4px 14px rgba(0,0,0,0.12)", textAlign: "center" }}>
              <div style={{ height: 26, background: RED }} />
              <div style={{ fontSize: 46, color: "#1d1718", lineHeight: "62px" }}>25</div>
            </div>
          ) : (
            <span style={{ fontSize: 70, color: red > 0.5 ? "#fff" : "#4a3f40", letterSpacing: "-0.03em" }}>{day}</span>
          )}
          {red > 0.5 && (
            <div style={{ position: "absolute", right: 6, bottom: 6, width: 42, height: 42, borderRadius: 42, background: "#fff", color: RED, fontSize: 30, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${red})` }}>!</div>
          )}
        </div>,
      );
    }
  }
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom * (1 + out * 0.3)})`, opacity: 1 - out, filter: `blur(${out * 16}px)` }}>{cells}</AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3. the reframe line, 4. the wordmark, 5. the word

const Marquee: React.FC = () => {
  const t = useT();
  if (t < 6.6 || t > 10.6) return null;
  const x = interpolate(t, [6.7, 10.5], [1080, -2900], cl);
  const o = k(t, 6.7, 6.9) * (1 - k(t, 10.3, 10.55));
  return (
    <AbsoluteFill style={{ justifyContent: "center", opacity: o }}>
      <div style={{ transform: `translateX(${x}px)`, whiteSpace: "nowrap" }}>
        <Line size={136} parts={[["Navigating college life shouldn't be ", false], ["this hard", true]]} />
      </div>
    </AbsoluteFill>
  );
};

const Wordmark: React.FC = () => {
  const t = useT();
  if (t < 10.3 || t > 13.8) return null;
  const i = k(t, 10.45, 10.95);
  const o = k(t, 13.15, 13.5, IN);
  const ring = (at: number) => {
    const x = k(t, at, at + 1.4, OUT);
    return x <= 0 || x >= 1 ? null : (
      <div style={{ position: "absolute", left: CX - 300, top: CY - 300, width: 600, height: 600, borderRadius: 600, transform: `scale(${0.45 + x * 1.1})`, opacity: (1 - x) * 0.9,
        background: "radial-gradient(circle, transparent 52%, rgba(217,32,46,0.18) 62%, rgba(242,135,111,0.22) 68%, transparent 74%)" }} />
    );
  };
  return (
    <AbsoluteFill>
      {ring(10.5)}
      {ring(11.6)}
      {ring(12.7)}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: i * (1 - o), filter: `blur(${(1 - i) * 16 + o * 20}px)`, transform: `scale(${0.94 + 0.06 * i + 0.02 * k(t, 11, 13.4, Easing.linear)})` }}>
        <Img src={staticFile("brand/campusai-logo.svg")} style={{ width: 600, height: "auto" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Booqra's "Schedule": the letters bob in a wave, settle, and wave out. */
const WaveWord: React.FC<{ word: string; a: number; b: number; size: number; italic?: boolean }> = ({ word, a, b, size, italic }) => {
  const t = useT();
  if (t < a - 0.1 || t > b + 0.1) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", fontFamily: italic ? SERIF : SANS, fontStyle: italic ? "italic" : "normal", fontWeight: italic ? 400 : 600, fontSize: size, color: "#fff", textShadow: SHADOW, letterSpacing: "-0.02em" }}>
        {word.split("").map((ch, i) => {
          const settle = k(t, a + i * 0.035, a + 0.55 + i * 0.035);
          const leave = k(t, b - 0.45 + i * 0.03, b + i * 0.03, IN);
          const amp = (1 - settle) * 70 + leave * 80;
          const y = Math.sin(t * 9 + i * 1.1) * amp;
          return <span key={i} style={{ display: "inline-block", transform: `translateY(${y}px)`, opacity: Math.min(settle * 1.6, 1) * (1 - leave) }}>{ch}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 6 to 11. the product

/** How a product panel arrives (rises tipped back, NestPay hand-off 1) and leaves (lifts away blurred). */
const hand = (t: number, a: number, b: number) => {
  const i = k(t, a, a + 0.7);
  const o = k(t, b - 0.4, b, IN);
  return { lift: (1 - i) * 1100 - o * 900, rx: (1 - i) * 42 - o * 18, blur: o * 16, opacity: Math.min(1, i * 2) * (1 - o) };
};

// The brief's cards, each in its own settled hover state (the product's own expanded card and red edge), lifted off
// the page and stacked one by one as the voice names them, Booqra's lock-screen notifications stacking.
const DASH_CARDS: { still: string; r: { x: number; y: number; w: number; h: number }; at: number; y: number }[] = [
  { still: "f00290.jpg", r: { x: 501, y: 338, w: 410, h: 167 }, at: 18.65, y: 540 },
  { still: "f00414.jpg", r: { x: 746, y: 337, w: 410, h: 167 }, at: 19.95, y: 960 },
  { still: "f00527.jpg", r: { x: 258, y: 337, w: 411, h: 167 }, at: 21.9, y: 1380 },
];
const Dash: React.FC = () => {
  const t = useT();
  if (t < 15.5 || t > 24.2) return null;
  const h = hand(t, 15.55, 24.15);
  const cam = camAt(t, [[0, 0, { cx: 828, cy: 380, s: 0.95 }], [16.3, 18.6, { cx: 828, cy: 395, s: 1.04 }]], Easing.linear);
  const back = k(t, 18.45, 18.9);
  const out = k(t, 23.7, 24.15, IN);
  return (
    <AbsoluteFill>
      <Page flow="dash" still="f00047.jpg" cam={cam} lift={h.lift} tilt={{ rx: h.rx }} blur={h.blur + back * 16} opacity={h.opacity * (1 - back * 0.55)} />
      {DASH_CARDS.map((c, n) => {
        const e = k(t, c.at, c.at + 0.5);
        if (e <= 0) return null;
        return (
          <Crop key={n} flow="dash" still={c.still} r={c.r} s={2.3} y={c.y + (1 - e) * 900 - out * 600}
            style={{ opacity: Math.min(1, e * 2) * (1 - out), transform: `perspective(1800px) rotateX(${(1 - e) * 35}deg)`, filter: out > 0 ? `blur(${out * 14}px)` : undefined }} />
        );
      })}
    </AbsoluteFill>
  );
};

/** A part of the recording, cut out live and floated on the ground, with the recorded pointer inside it. */
const CropRec: React.FC<{ flow: string; rec: number; r: { x: number; y: number; w: number; h: number }; s: number; x: number; y: number; opacity?: number }> = ({ flow, rec, r, s, x, y, opacity = 1 }) => {
  const seq = useFrameSeq(`${DIR}/flow-${flow}/frames.json`);
  if (!seq) return null;
  let name = seq.frames[0].name;
  for (const fr of seq.frames) { if (fr.t <= rec) name = fr.name; else break; }
  const moves = (seq as unknown as { moves?: Parameters<typeof pointerAt>[0] }).moves ?? [];
  const at = pointerAt(moves, rec);
  const inside = at.p && at.p.x > r.x && at.p.x < r.x + r.w && at.p.y > r.y && at.p.y < r.y + r.h;
  return (
    <div style={{ position: "absolute", left: x - (r.w * s) / 2, top: y - (r.h * s) / 2, width: r.w * s, height: r.h * s, borderRadius: 14 * s, overflow: "hidden", opacity,
      boxShadow: "0 40px 120px rgba(110,24,36,0.5), 0 0 0 1px rgba(255,255,255,0.14)", background: "#0b0708" }}>
      <Img src={staticFile(`${seq.dir}${name}`)} style={{ position: "absolute", left: -r.x * s, top: -r.y * s, width: 1440 * s, height: 900 * s, maxWidth: "none", maxHeight: "none" }} />
      {inside && at.p && <div data-snap style={{ position: "absolute", left: (at.p.x - r.x) * s, top: (at.p.y - r.y) * s }}><PointerAt x={0} y={0} since={at.since} accent={RED} size={26 * s * 0.8} /></div>}
    </div>
  );
};

// The career fair card after the carousel moves (page px, frame f00353).
const FAIR = { x: 1170, y: 184, w: 242, h: 266 };
const Events: React.FC = () => {
  const t = useT();
  if (t < 23.9 || t > 29.5) return null;
  const h = hand(t, 23.95, 29.4);
  const camA = { cx: 1180, cy: 330, s: 1.45 };
  const cam = camAt(t, [[0, 0, { cx: 720, cy: 450, s: 0.74 }], [25.05, 25.85, camA]]);
  const rec = recAt(t, [[24.0, 1.4], [25.0, 3.3], [25.35, 4.0], [26.6, 6.34], [29.4, 9.1]]);
  // the card lifts off the page (the pop-out), Booqra's phone between "Bookings" and "confirmed"
  const lift = k(t, 25.85, 26.35, INOUT);
  const out = k(t, 29.0, 29.4, IN);
  const sx = 540 + (FAIR.x + FAIR.w / 2 - camA.cx) * camA.s, sy = 960 + (FAIR.y + FAIR.h / 2 - camA.cy) * camA.s;
  const top = blurIn(t, 26.45, 29.3);
  const bot = blurIn(t, 27.4, 29.3);
  return (
    <AbsoluteFill>
      <Page flow="events" rec={rec} cam={cam} pointer={lift < 0.01} lift={h.lift} tilt={{ rx: h.rx }} blur={h.blur + lift * 18} opacity={h.opacity * (1 - lift)} />
      {lift > 0 && (
        <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 16}px)` : undefined, transform: `translateY(${-out * 300}px)` }}>
          <CropRec flow="events" rec={rec} r={FAIR} s={mix(camA.s, 3.1, lift)} x={mix(sx, 540, lift)} y={mix(sy, 975, lift)} />
        </AbsoluteFill>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center", ...top }}>
        <Line size={118} parts={[["One press", false]]} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1500, textAlign: "center", ...bot }}>
        <Line size={118} parts={[["on your ", false], ["calendar", true]]} />
      </div>
    </AbsoluteFill>
  );
};

/** The plan, set from the recording's marks: the question, the plan card, then a section landing on the week. */
export type PlanMarks = { ask: number; plan: number; presstime: number };
const Plan: React.FC<{ m: PlanMarks }> = ({ m }) => {
  const t = useT();
  if (t < 29.1 || t > 35.2) return null;
  const h = hand(t, 29.15, 35.1);
  // three moments of one recording, joined by quick whips so the jumps never show (11/09: dissolve, never a scroll)
  const segA = t < 31.3;
  const rec = segA ? recAt(t, [[29.2, m.ask + 0.1], [31.3, m.ask + 2.4]]) : recAt(t, [[31.3, m.presstime - 2.0], [33.3, m.presstime], [35.1, m.presstime + 1.8]]);
  const cam = segA ? { cx: 600, cy: 150, s: 2.0 }
    : camAt(t, [[0, 0, { cx: 1022, cy: 480, s: 1.55 }], [33.45, 34.2, { cx: 413, cy: 490, s: 1.85 }]]);
  // whip: a short blur and slide on each join
  const whip = Math.max(1 - Math.abs(t - 31.3) / 0.12, 0);
  return (
    <AbsoluteFill style={{ filter: whip > 0 ? `blur(${whip * 18}px)` : undefined, transform: `translateY(${-whip * 60}px)` }}>
      <Page flow="plan" rec={rec} cam={cam} pointer lift={h.lift} tilt={{ rx: h.rx }} blur={h.blur} opacity={h.opacity} />
    </AbsoluteFill>
  );
};

/** "Canvas moves a due date?" the Moved row lifts off the brief; "Calendar synced." the week tilts in under the line. */
const MOVED = { x: 282, y: 118, w: 528, h: 66 };
const Synced: React.FC = () => {
  const t = useT();
  if (t < 34.9 || t > 38.7) return null;
  const rowIn = k(t, 35.0, 35.45);
  const rowOut = k(t, 36.35, 36.8, IN);
  const cal = k(t, 36.4, 37.1);
  const out = k(t, 38.15, 38.55, IN);
  const drift = k(t, 36.4, 38.6, Easing.linear);
  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 18}px)` : undefined }}>
      {cal > 0 && (
        <Page flow="pages" still="f00254.jpg" cam={{ cx: 820 + drift * 60, cy: 360, s: 0.98 }} y={1110}
          tilt={{ rx: 24, rz: -3 }} lift={(1 - cal) * 700} opacity={Math.min(1, cal * 2)} />
      )}
      {rowOut < 1 && (
        <Crop flow="dash" still="f00047.jpg" r={MOVED} s={1.9} y={CY - 40}
          style={{ opacity: rowIn * (1 - rowOut), transform: `translateY(${(1 - rowIn) * 60 + rowOut * 260}px) scale(${1 - rowOut * 0.4})`, filter: `blur(${(1 - rowIn) * 10}px)` }} />
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center", ...blurIn(t, 36.8, 38.6) }}>
        <Line size={120} parts={[["Calendar ", false], ["synced", true]]} />
      </div>
    </AbsoluteFill>
  );
};

/** Booqra's occupancy card: here the plan's "where you stand" card lifts off, its parts arriving one by one. */
const STAND = { x: 432, y: 282, w: 836, h: 386 };
const Stand: React.FC<{ still: string }> = ({ still }) => {
  const t = useT();
  if (t < 38.3 || t > 41.9) return null;
  const i = k(t, 38.45, 38.95);
  const o = k(t, 41.45, 41.8, IN);
  const s = mix(1.22, 1.3, k(t, 38.5, 41.8, Easing.linear));
  // the parts of the real card, revealed in reading order (the bar first, then the four requirement groups)
  const parts = [
    { x: 0, y: 0, w: 836, h: 66, at: 38.75 },
    { x: 0, y: 70, w: 414, h: 154, at: 39.1 },
    { x: 416, y: 70, w: 420, h: 154, at: 39.35 },
    { x: 0, y: 228, w: 414, h: 158, at: 39.6 },
    { x: 416, y: 228, w: 420, h: 158, at: 39.85 },
  ];
  return (
    <AbsoluteFill style={{ opacity: i * (1 - o), filter: `blur(${(1 - i) * 12 + o * 16}px)`, transform: `scale(${0.92 + 0.08 * i})` }}>
      <Crop flow="plan" still={still} r={STAND} s={s}>
        {parts.map((p, n) => {
          const e = k(t, p.at, p.at + 0.4);
          // a cover that lifts off each part as it arrives, so the real card fills in rather than appearing whole
          return <div key={n} style={{ position: "absolute", left: p.x * s, top: p.y * s, width: p.w * s, height: p.h * s, background: "#130c0d", opacity: 1 - e,
            clipPath: `inset(0 0 0 ${e * 100}%)` }} />;
        })}
      </Crop>
    </AbsoluteFill>
  );
};

/** Booqra's hand-held phone cycling screens: here one real part of each page lifts in and hands to the next. */
const PARTS: { flow: string; still: string; r: { x: number; y: number; w: number; h: number }; s: number; at: number }[] = [
  { flow: "pages", still: "f00254.jpg", r: { x: 500, y: 50, w: 680, h: 520 }, s: 1.55, at: 41.75 },
  { flow: "pages", still: "f00334.jpg", r: { x: 262, y: 255, w: 452, h: 392 }, s: 2.3, at: 42.55 },
  { flow: "pages", still: "f00778.jpg", r: { x: 900, y: 185, w: 476, h: 265 }, s: 2.2, at: 43.3 },
];
const Cycle: React.FC = () => {
  const t = useT();
  if (t < 41.5 || t > 46.0) return null;
  const allIn = k(t, 44.35, 44.95);
  const h = hand(t, 44.35, 45.95);
  return (
    <AbsoluteFill>
      {PARTS.map((p, n) => {
        const next = n < PARTS.length - 1 ? PARTS[n + 1].at : 44.35;
        const i = k(t, p.at, p.at + 0.34);
        const o = k(t, next, next + 0.3, IN);
        if (i <= 0 || o >= 1) return null;
        return (
          <Crop key={n} flow={p.flow} still={p.still} r={p.r} s={p.s} y={CY + (1 - i) * 1000 - o * 700}
            style={{ opacity: Math.min(1, i * 2) * (1 - o), transform: `perspective(1800px) rotateX(${(1 - i) * 30 - o * 12}deg) rotateY(${interpolate(t, [p.at, next], [-5, 4], cl)}deg)`,
              filter: o > 0 ? `blur(${o * 14}px)` : undefined }} />
        );
      })}
      {allIn > 0 && (
        <Page flow="dash" still="f00047.jpg" cam={{ cx: 828, cy: 400, s: mix(0.98, 0.9, k(t, 44.4, 45.9, Easing.linear)) }} lift={h.lift} tilt={{ rx: h.rx, ry: interpolate(t, [44.3, 46], [-6, 3], cl) }} blur={h.blur} opacity={h.opacity} />
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 12 to 13. the close

const Close: React.FC = () => {
  const t = useT();
  if (t < 45.8) return null;
  const end = k(t, 49.5, 50.1);
  const logoBreathe = 1 + 0.025 * k(t, 50, TOTAL_S, Easing.linear);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18, flexDirection: "column" }}>
        <div style={blurIn(t, 46.05, 48.35)}><Line size={132} parts={[["Less ", false], ["noise.", true]]} /></div>
        <div style={blurIn(t, 47.28, 48.35)}><Line size={132} parts={[["More ", false], ["college.", true]]} /></div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={blurIn(t, 48.45, 49.55)}><Line size={140} parts={[["Get ", false], ["started", true]]} /></div>
      </AbsoluteFill>
      {end > 0 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", opacity: end, filter: `blur(${(1 - end) * 14}px)` }}>
          <Img src={staticFile("brand/campusai-logo.svg")} style={{ width: 560, height: "auto", transform: `scale(${logoBreathe})` }} />
          <div style={{ marginTop: 56, ...blurIn(t, 49.7, 99) }}><Line size={92} parts={[["campusai.app", false]]} /></div>
          <div style={{ marginTop: 30, opacity: k(t, 50.3, 50.8), fontFamily: SANS, fontWeight: 500, fontSize: 40, color: "#fff", textShadow: SHADOW }}>Link in bio</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- sound

// Each line's take and where it starts (film seconds). Take "a" of each read, films/muse1125-booqra/facts.md.
export const VO: [string, number][] = [
  ["L01a", 0.15], ["L02a", 6.6], ["L03a", 10.4], ["L04a", 15.8], ["L05a", 18.7], ["L06a", 24.1],
  ["L08a", 29.3], ["L07a", 35.1], ["L09a", 38.6], ["L10a", 41.8], ["L11a", 45.9], ["L12a", 48.5],
];
const CUES: [string, number, number][] = [
  ...NOTES.map((n) => ["notify-ui-message-pop", n.at + 0.1, 0.22] as [string, number, number]),
  ["arrive-wind-swoosh-short", 4.3, 0.35], ["land-ui-popup-dry", 4.35, 0.3], ["move-swoosh-quick", 6.65, 0.3],
  ["logo-bass-hit-futuristic", 10.5, 0.45], ["type-alt-switch-light", 13.65, 0.3], ["arrive-wind-swoosh-short", 15.55, 0.35],
  ["move-swoosh-quick", 23.95, 0.3], ["press-ui-select-click", 26.62, 0.5], ["success-chime-crystal", 26.95, 0.3],
  ["move-swoosh-quick", 29.15, 0.3], ["move-swoosh-quick", 30.85, 0.22], ["move-swoosh-quick", 32.35, 0.22],
  ["arrive-wind-swoosh-short", 34.95, 0.3], ["land-ui-popup-dry", 36.85, 0.3], ["land-ui-popup-dry", 38.5, 0.25],
  ["move-swoosh-quick", 41.6, 0.25], ["move-swoosh-quick", 42.55, 0.2], ["move-swoosh-quick", 43.3, 0.2], ["move-swoosh-quick", 44.4, 0.2],
  ["logo-bass-hit-futuristic", 49.5, 0.45],
];

export const CollegeLife: React.FC<{ plan: PlanMarks; standStill: string; voice?: boolean }> = ({ plan, standStill, voice = true }) => {
  const total = Math.round(TOTAL_S * FPS);
  const t = useT();
  return (
    <AbsoluteFill style={{ background: "#efe3e1" }}>
      <Ground white={0.35 * k(t, 51.4, TOTAL_S, Easing.linear)} />
      <Mess />
      <Chips />
      <Marquee />
      <Wordmark />
      <WaveWord word="semester" a={13.62} b={15.55} size={150} />
      <Dash />
      <Events />
      <Plan m={plan} />
      <Synced />
      <Stand still={standStill} />
      <Cycle />
      <Close />
      <Bed total={total} volume={0.26} track="digital-clouds" />
      {voice && VO.map(([f, at]) => (
        <Sequence key={f} from={Math.round(at * FPS)} layout="none"><Audio src={staticFile(`${DIR}/vo/${f}.mp3`)} volume={1} /></Sequence>
      ))}
      {CUES.map(([c, at, v], i) => (
        <Sequence key={i} from={Math.round(at * FPS)} layout="none"><Audio src={staticFile(`sound/cues/${c}.wav`)} volume={v} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};

