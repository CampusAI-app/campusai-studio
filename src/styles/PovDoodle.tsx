/**
 * /pov-doodle (2026-11-04, name from Shaan Johari's Animation Styles Part 5, his prompt is DM-gated and unseen):
 * the cartoon diary. A hand-drawn student, a POV line, and a running tally that piles up beside them while their
 * face gets worse, then one line clears the pile and the face lands happy. The person is Open Peeps (./peeps).
 * Everything drawn sits under one "boil" filter whose noise reseeds every 4 frames, which is what makes still
 * line art read as hand-animated instead of a sticker sliding around.
 */
import React from "react";
import { loadFont } from "@remotion/google-fonts/Caveat";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR } from "../system/motion";
import { B, Clip, Cue, PRINT, RED, ZODIAK, clamp, ramp } from "./common";
import { Peep, type FaceName } from "./peeps/Peep";
import { PointerAt, pointerAt } from "../kit";
import { DrawnAsk, DrawnChat, askFrames, chatFrames, chatLanded, type DrawnAskSpec, type DrawnChatSpec } from "./DrawnChat";

const { fontFamily: HAND } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export type PovDoodleProps = {
  /** The POV line, top of frame. */
  pov: string;
  /** What the tally counts, e.g. "Tabs open". */
  tally: string;
  /** One sticky note per thing piling up, in order. 3 to 5 reads best. */
  notes: string[];
  /** The face after each note lands, same length as notes. */
  faces: FaceName[];
  /** The line that clears the pile, and the one word in it drawn in red. */
  payoff: string;
  accent: string;
  /** What the tally reads after the pile clears. */
  after: number;
  /** A school's real mark (public/ path): beside the POV line, and printed on the student's shirt (2026-11-04,
   * Jacob: UMD's logo can go in a video, just sometimes not on the product). */
  mark?: string;
  /** A campus building drawn in the same ink behind the student. */
  backdrop?: "mckeldin";
  /** Episode 2's gag instead of sticky notes (11/04): a drawn week. The real classes fill it first, then each note drops
   * into its day like a Tetris piece, stacking past the top when a day is full; a note with day -1 finds nowhere to
   * land and hovers. */
  week?: { cols: string[]; classes: [number, string][]; days: number[] };
  /** A second headline that replaces the payoff when the last recording starts, and the word in it drawn red. */
  then?: string;
  thenAccent?: string;
  /** The real chat, played where the pile was once it clears (2026-11-04, Jacob: "CampusAI show up with him"). Never
   * drawn: a recording of the demo, either `capture/register-chat-record.mjs` (pointer per frame) or `npm run flow`
   * (pointer as moves). */
  answer?: AnswerItem | AnswerItem[];
};

type RecFrame = { t: number; name: string; mx?: number; my?: number };
/** A recording of the demo, or the chat drawn (DrawnChat). */
export type AnswerItem = AnswerRec | DrawnChatSpec | DrawnAskSpec;
export type AnswerRec = {
  kind?: "rec";
  /** public/ folder holding the frames */
  dir: string;
  rec: { vw: number; vh: number; frames: RecFrame[]; moves?: Parameters<typeof pointerAt>[0] };
  /** css px cut off the left (the sidebar, and its Maryland mark) */
  x0: number;
  /** stretches of the recording to play, in its own seconds, each at its own speed */
  segs: { from: number; to: number; speed: number }[];
  /** the camera over the page: [recording s, left, top, zoom], left/top in css px past x0 */
  cam: [number, number, number, number][];
  /** when the recorded pointer is drawn, its press (needed only without moves) and its size; then when the result is on
   * screen, which is when he grins (recording s) */
  pointer: { from: number; to: number; press?: number; size?: number };
  landed: number;
};

// quicker since 11/04 (Jacob: "the 6 things to figure out should be sped up"): was 34 / 24 / 40
const FIRST = 26;
const GAP = 15;
/** How long the full pile holds before it clears. */
const HOLD = 32;
/** The answer box: where it sits and how long it holds once the recording ends. */
const BOX_TOP = 410;
const BOX_H = 1070;
const REC_HOLD = 24;
const notesEnd = (n: number) => FIRST + (n - 1) * GAP + DUR.arrive;
export const recFrames = (a: AnswerItem) =>
  a.kind === "chat" ? chatFrames(a) : a.kind === "ask" ? askFrames(a) : Math.round(a.segs.reduce((s, g) => s + (g.to - g.from) / g.speed, 0) * 30);
/** Frames into the box at which item `i` starts. */
const itemStart = (list: AnswerItem[], i: number) => list.slice(0, i).reduce((n, r) => n + recFrames(r), 0);
/** Several recordings play back to back in the one box (11/04: the chat, then Courses and Professors). */
const asList = (a: AnswerItem | AnswerItem[]) => (Array.isArray(a) ? a : [a]);
export const answerFrames = (a: AnswerItem | AnswerItem[]) => asList(a).reduce((n, r) => n + recFrames(r), 0) + 10 + REC_HOLD;
/** Which recording is on at `k` frames into the box, and how far into it. */
const recOn = (list: AnswerItem[], k: number) => {
  let left = k;
  for (const [i, r] of list.entries()) {
    if (left < recFrames(r) || i === list.length - 1) return { a: r, k: left };
    left -= recFrames(r);
  }
  return { a: list[0], k };
};
export const povEnd = (n: number, extra = 0) => notesEnd(n) + HOLD + 74 + extra;
export const POV_END = povEnd(4);

/** film frames since the box landed -> recording seconds */
const recT = (a: AnswerRec, k: number) => {
  let left = Math.max(0, k) / 30;
  for (const g of a.segs) {
    const len = (g.to - g.from) / g.speed;
    if (left <= len) return g.from + left * g.speed;
    left -= len;
  }
  return a.segs[a.segs.length - 1].to;
};
/** recording seconds -> film frames since the box landed (first stretch it falls in) */
export const recFrame = (a: AnswerRec, t: number) => {
  let acc = 0;
  for (const g of a.segs) {
    if (t <= g.to) return Math.round((acc + Math.max(0, t - g.from) / g.speed) * 30);
    acc += (g.to - g.from) / g.speed;
  }
  return Math.round(acc * 30);
};
const camAt = (a: AnswerRec, t: number) => {
  const c = a.cam;
  let i = 0;
  while (i < c.length - 2 && t > c[i + 1][0]) i++;
  const [t0, x0, y0, z0] = c[i], [t1, x1, y1, z1] = c[i + 1];
  const k = CURVE.quiet.standard(Math.min(1, Math.max(0, (t - t0) / Math.max(0.001, t1 - t0))));
  return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, z: z0 + (z1 - z0) * k };
};

/** The real chat, crisp (outside the boil: the product is never wobbled), in a frame like the notes it replaces. */
const Answer: React.FC<{ list: AnswerItem[]; at: number; W: number }> = ({ list, at, W }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const k = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 120 } });
  const { a: item, k: into } = recOn(list, f - at - 10);
  const w = W - 64;
  return (
    <div style={{ position: "absolute", left: 32, top: BOX_TOP, width: w, height: BOX_H, overflow: "hidden", borderRadius: 22,
      border: `5px solid ${PRINT}`, boxShadow: `8px 10px 0 ${PRINT}`, background: "#0b0708",
      opacity: interpolate(k, [0, 0.25], [0, 1], clamp), transform: `translateY(${(1 - k) * 260}px) rotate(${(1 - k) * -4}deg)` }}>
      {item.kind === "chat" ? <DrawnChat s={item} from={f - Math.max(0, into)} w={w} />
        : item.kind === "ask" ? <DrawnAsk s={item} from={f - Math.max(0, into)} w={w} />
        : <RecShot a={item} into={into} w={w} />}
    </div>
  );
};

/** One frame of a recording, through its camera, with its pointer. */
export const RecShot: React.FC<{ a: AnswerRec; into: number; w: number }> = ({ a, into, w }) => {
  const t = recT(a, into);
  const fr = a.rec.frames[Math.max(0, a.rec.frames.findIndex((x) => x.t > t) - 1)] ?? a.rec.frames[a.rec.frames.length - 1];
  const cam = camAt(a, t);
  const s = (w / (a.rec.vw - a.x0)) * cam.z;
  const ptr = a.rec.moves
    ? pointerAt(a.rec.moves, t)
    : { p: fr.mx === undefined ? null : { x: fr.mx, y: fr.my ?? 0 }, since: a.pointer.press !== undefined && t >= a.pointer.press ? t - a.pointer.press : null };
  const px = ((ptr.p?.x ?? 0) - a.x0 - cam.x) * s, py = ((ptr.p?.y ?? 0) - cam.y) * s;
  const pOp = interpolate(t, [a.pointer.from - 0.3, a.pointer.from, a.pointer.to - 0.3, a.pointer.to], [0, 1, 1, 0], clamp);
  return (
    <>
      <Img src={staticFile(`${a.dir}/${fr.name}`)} style={{ position: "absolute", width: a.rec.vw * s, height: a.rec.vh * s, maxWidth: "none",
        left: -(a.x0 + cam.x) * s, top: -cam.y * s }} />
      {pOp > 0 && ptr.p ? <PointerAt x={px} y={py} since={ptr.since} accent={RED} opacity={pOp} size={(a.pointer.size ?? 34) * cam.z} /> : null}
    </>
  );
};

/** The drawn week (episode 2). Columns are days; each piece lands on its day's stack. */
const GX = 420, GY = 1000, COL = 155, BH = 150, BG = 10, ROWS = 3;
const WeekPile: React.FC<{ week: NonNullable<PovDoodleProps["week"]>; notes: string[]; f: number; fps: number; op: number }> = ({ week, notes, f, fps, op }) => {
  const GH = ROWS * (BH + BG) + BG;
  const ncol = week.cols.length;
  const block = (key: string, label: string, col: number, k: number, at: number, kind: "class" | "thing") => {
    const drop = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 150 } });
    const top = GY + GH - BG - (k + 1) * (BH + BG) + BG;
    return f < at ? null : (
      <div key={key} style={{ position: "absolute", left: GX + col * COL + 6, top: top - (1 - drop) * 900, width: COL - 12, height: BH, padding: "12px 10px",
        background: kind === "class" ? "#e9e2d8" : "#fffdf8", border: `4px solid ${PRINT}`, borderRadius: "10px 16px 9px 18px", boxShadow: `4px 5px 0 ${PRINT}`,
        fontFamily: HAND, fontSize: kind === "class" ? 33 : 35, lineHeight: 1.02, color: PRINT, opacity: interpolate(drop, [0, 0.15], [0, 1], clamp),
        transform: `rotate(${((col * 7 + k * 3) % 5) - 2}deg)` }}>{label}</div>
    );
  };
  const stack = Array(ncol).fill(0);
  const pieces: React.ReactNode[] = [];
  week.classes.forEach(([col, label], j) => pieces.push(block(`c${j}`, label, col, stack[col]++, 6 + j * 2, "class")));
  notes.forEach((label, i) => {
    const d = week.days[i];
    const at = FIRST + i * GAP;
    if (d >= 0) pieces.push(block(`n${i}`, label, d, stack[d]++, at, "thing"));
    else if (f >= at) {
      // nowhere to land: it drops to just above the week and swings from day to day looking for a gap
      const drop = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 150 } });
      const swing = Math.sin((f - at) / 10);
      pieces.push(
        <div key={`h${i}`} style={{ position: "absolute", left: GX + COL * 0.35 + swing * COL * 0.7, top: GY - 345 - (1 - drop) * 700, width: COL * 2 - 20, padding: "16px 16px",
          background: "#fff6c9", border: `5px solid ${PRINT}`, borderRadius: "14px 22px 12px 26px", boxShadow: `6px 8px 0 ${PRINT}`, fontFamily: HAND, fontSize: 40,
          lineHeight: 1, color: PRINT, transform: `rotate(${swing * 5}deg)`, opacity: interpolate(drop, [0, 0.15], [0, 1], clamp) }}>{label}</div>,
      );
    }
  });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <svg width={GX + ncol * COL + 20} height={GY + GH + 90} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path d={`M${GX} ${GY} V${GY + GH} H${GX + ncol * COL} V${GY}`} fill="none" stroke={PRINT} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        {week.cols.slice(1).map((_, i) => <path key={i} d={`M${GX + (i + 1) * COL} ${GY + 8} V${GY + GH - 4}`} stroke={PRINT} strokeWidth={3} strokeDasharray="10 12" strokeLinecap="round" />)}
      </svg>
      {week.cols.map((c, i) => (
        <div key={c} style={{ position: "absolute", left: GX + i * COL, top: GY + GH + 12, width: COL, textAlign: "center", fontFamily: HAND, fontSize: 40, color: PRINT }}>{c}</div>
      ))}
      {pieces}
    </div>
  );
};

/** McKeldin Library, drawn as a facade: the portico, its pediment, the drum and dome with its lantern. */
const McKeldin: React.FC<{ w: number; ink: string }> = ({ w, ink }) => {
  const line = { fill: "none", stroke: ink, strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const windows = [40, 100, 160, 540, 600, 660].flatMap((x) => [330, 410].map((y) => <rect key={`${x}-${y}`} x={x - 18} y={y} width={36} height={50} rx={4} {...line} />));
  return (
    <svg viewBox="0 0 700 540" width={w} height={(w * 540) / 700}>
      <path d="M0 500 H700 M210 515 H490 M190 530 H510" {...line} />
      <path d="M0 500 V270 H700 V500" {...line} />
      {windows}
      <path d="M220 290 L350 205 L480 290 Z M232 290 V308 H468 V290" {...line} />
      {[255, 315, 385, 445].map((x) => <path key={x} d={`M${x} 308 V500`} {...line} strokeWidth={7} />)}
      <path d="M300 205 V130 H400 V205 M300 130 Q350 52 400 130 M342 75 V48 H358 V75 M350 48 V18" {...line} />
      {[322, 350, 378].map((x) => <path key={x} d={`M${x - 8} 190 V160 Q${x} 148 ${x + 8} 160 V190`} {...line} strokeWidth={4} />)}
    </svg>
  );
};

const Boil: React.FC<{ f: number }> = ({ f }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id="boil" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={Math.floor(f / 4) % 7} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={5} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

/** A hand-drawn underline, drawn with the pen. */
const Scribble: React.FC<{ w: number; k: number }> = ({ w, k }) => {
  const d = `M4 18 C ${w * 0.3} 6, ${w * 0.6} 26, ${w - 4} 10`;
  return (
    <svg width={w} height={30} style={{ position: "absolute", left: 0, bottom: -26, overflow: "visible" }}>
      <path d={d} fill="none" stroke={RED} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
    </svg>
  );
};

export const PovDoodle: React.FC<PovDoodleProps> = ({ pov, tally, notes, faces, payoff, accent, after, answer, mark, backdrop, then, thenAccent, week }) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const n = notes.length;
  const clear = notesEnd(n) + HOLD;
  const END = povEnd(n, answer ? answerFrames(answer) : 0);
  const answerAt = clear + 16 + payoff.split(" ").length * 6 + DUR.panel;
  // motion: the headline, tally and student step aside for the answer, the same travel the pile left on
  const makeRoom = answer ? ramp(f, answerAt - 6, answerAt - 6 + DUR.travel, CURVE.quiet.standard) : 0;
  const landed = notes.filter((_, i) => f >= FIRST + i * GAP + 6).length;
  const swept = ramp(f, clear, clear + DUR.travel * 0.6, CURVE.showy.exit);
  const count = f >= clear + 14 ? after : landed;
  // with the real chat playing, he watches it calmly and grins when the class is on his plan
  // he grins when the first recording's result is on screen
  // he grins when the first result is on screen: a drawn answer's, or the first recording's `landed`
  const list = answer ? asList(answer) : [];
  const gi = list.findIndex((r) => r.kind !== "ask");
  const gItem = gi >= 0 ? list[gi] : null;
  const grinAt = gItem ? answerAt + 10 + itemStart(list, gi) + (gItem.kind === "chat" ? chatLanded(gItem) : gItem.kind === "ask" ? 0 : recFrame(gItem, gItem.landed)) : clear + 10;
  // `then` takes over the headline when the last item starts (round 11: the cut to degree progress)
  const thenAt = then && list.length > 1 ? answerAt + 10 + itemStart(list, list.length - 1) : Infinity;
  const handOff = Number.isFinite(thenAt) ? 1 - ramp(f, thenAt - 10, thenAt, CURVE.quiet.exit) : 1;
  const thenWords = then ? then.split(" ") : [];
  const thenK = (i: number) => ramp(f, thenAt + 4 + i * 4, thenAt + 4 + i * 4 + DUR.panel, CURVE.showy.enter);
  const face: FaceName = f >= grinAt ? "SmileBig" : answer && f >= clear + 10 ? "Calm" : landed === 0 ? "Calm" : faces[landed - 1];
  const peepIn = spring({ frame: f - 6, fps, config: { damping: 13, stiffness: 120 } });
  const bob = Math.sin(f / 9) * 6;
  const povK = ramp(f, 2, 2 + DUR.arrive, CURVE.quiet.enter) * (1 - ramp(f, clear, clear + DUR.panel, CURVE.quiet.exit));
  const words = payoff.split(" ");
  const pay = (i: number) => ramp(f, clear + 16 + i * 6, clear + 16 + i * 6 + DUR.panel, CURVE.showy.enter);
  const lineK = ramp(f, clear + 16 + words.length * 6, clear + 16 + words.length * 6 + 16, CURVE.quiet.standard);
  const tickAt = (i: number) => FIRST + i * GAP + 6;
  const lastTick = [...notes.map((_, i) => tickAt(i)), clear + 14].filter((t) => t <= f).pop() ?? -99;
  const pop = 1 + 0.18 * (1 - ramp(f, lastTick, lastTick + 8, CURVE.quiet.standard));
  return (
    <Clip endAt={END} light>
      <Boil f={f} />
      <AbsoluteFill style={{ filter: "url(#boil)" }}>
        {backdrop === "mckeldin" ? (
          <div style={{ position: "absolute", right: -40, top: H * 0.43, opacity: 0.26 * (1 - makeRoom) * ramp(f, 4, 4 + DUR.arrive, CURVE.quiet.enter) }}>
            <McKeldin w={W * 0.86} ink={PRINT} />
          </div>
        ) : null}
        <div style={{ position: "absolute", left: 64, right: mark ? 230 : 64, top: 196, fontFamily: ZODIAK, fontWeight: 700, fontSize: 76, lineHeight: 1.06,
          letterSpacing: "-0.02em", color: PRINT, opacity: povK, transform: `translateY(${(1 - povK) * 14}px)` }}>
          {pov}
        </div>
        {mark ? (
          <Img src={staticFile(mark)} style={{ position: "absolute", right: 64, top: 200, height: 150, opacity: povK,
            transform: `translateY(${(1 - povK) * 14}px) rotate(4deg)` }} />
        ) : null}
        <div style={{ position: "absolute", left: 64, top: 196, right: 64, fontFamily: ZODIAK, fontWeight: 700, fontSize: 104, lineHeight: 1.04, letterSpacing: "-0.025em", color: PRINT,
          transform: `scale(${1 - 0.42 * makeRoom})`, transformOrigin: "0 0", opacity: handOff }}>
          {words.map((w, i) => {
            const isAccent = w.replace(/[^\w]/g, "") === accent;
            return (
              <span key={i} style={{ position: "relative", display: "inline-block", marginRight: "0.24em", opacity: f < clear + 16 + i * 6 ? 0 : pay(i),
                transform: `scale(${(1.3 - 0.3 * pay(i)).toFixed(3)})`, color: isAccent ? RED : PRINT }}>
                {w}
                {isAccent ? <Scribble w={w.length * 52} k={lineK} /> : null}
              </span>
            );
          })}
        </div>
        {then && f >= thenAt ? (
          <div style={{ position: "absolute", left: 64, right: 64, top: 186, fontFamily: ZODIAK, fontWeight: 700, fontSize: 58, lineHeight: 1.08, letterSpacing: "-0.02em", color: PRINT }}>
            {thenWords.map((w, i) => (
              <span key={i} style={{ display: "inline-block", marginRight: "0.24em", opacity: thenK(i), transform: `translateY(${(1 - thenK(i)) * 12}px)`,
                color: thenAccent && w.replace(/[^\w-]/g, "") === thenAccent ? RED : PRINT }}>{w}</span>
            ))}
          </div>
        ) : null}
        <div style={{ position: "absolute", left: 70, top: 470, fontFamily: HAND, fontSize: 64, color: PRINT, opacity: ramp(f, 20, 32) * handOff,
          transform: `translateY(${-140 * makeRoom}px) scale(${1 - 0.3 * makeRoom})`, transformOrigin: "0 0" }}>
          {tally}:{" "}
          <span style={{ display: "inline-block", color: RED, fontSize: 96, transform: `scale(${pop.toFixed(3)})`, transformOrigin: "30% 70%" }}>{count}</span>
        </div>
        <div style={{ position: "absolute", left: (week ? -150 : -90) + ((week ? -40 : -40) - (week ? -150 : -90)) * makeRoom,
          top: (week ? H * 0.55 : H * 0.4) + bob + makeRoom * (1470 - (week ? H * 0.55 : H * 0.4)),
          transform: `scale(${((week ? 0.74 : 1) + (0.5 - (week ? 0.74 : 1)) * makeRoom).toFixed(4)})`, transformOrigin: "0 0" }}>
        <div style={{ position: "relative", transform: `scale(${peepIn.toFixed(4)})`, transformOrigin: "50% 100%" }}>
          <Peep face={face} body="Device" ink={PRINT} fill={B.color.ink} width={W * 0.72} />
          {/* the mark printed on his shirt, left of the phone hand (viewBox 850 x 1200, chest near 300,800) */}
          {mark ? <Img src={staticFile(mark)} style={{ position: "absolute", left: W * 0.72 * (250 / 850), top: W * 0.72 * (760 / 850), width: W * 0.72 * (110 / 850), transform: "rotate(-6deg)" }} /> : null}
        </div>
        </div>
        {week ? <WeekPile week={week} notes={notes} f={f} fps={fps} op={1 - ramp(f, answerAt - 4, answerAt + 12, CURVE.quiet.exit)} /> : null}
        {week ? null : notes.map((label, i) => {
          const at = FIRST + i * GAP;
          const drop = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 140 } });
          const rot = (i % 2 ? 5 : -6) + (i === 1 ? 3 : 0);
          const y = H * 0.8 - i * 165; // room for a two-line note (6 notes since 11/04)
          const off = swept * (W * 1.1 + i * 60);
          return f < at ? null : (
            <div key={i} style={{ position: "absolute", left: W * 0.58 + (i % 2) * 18, top: y - (1 - drop) * 520, width: 410, padding: "24px 28px",
              background: i === n - 1 ? "#fff6c9" : "#fffdf8", border: `5px solid ${PRINT}`, borderRadius: "14px 22px 12px 26px",
              boxShadow: `6px 8px 0 ${PRINT}`, transform: `translateX(${off}px) rotate(${rot + swept * 40}deg)`,
              fontFamily: HAND, fontSize: label.length > 12 ? 50 : 60, lineHeight: 1, color: PRINT, opacity: interpolate(drop, [0, 0.2], [0, 1], clamp) }}>
              {label}
            </div>
          );
        })}
      </AbsoluteFill>
      {answer ? <Answer list={asList(answer)} at={answerAt} W={W} /> : null}
      {answer ? <Cue at={answerAt} name="paper-slide" volume={0.5} /> : null}
      {notes.map((_, i) => <Cue key={i} at={FIRST + i * GAP + 4} name="paper-slide" volume={0.45} />)}
      {notes.map((_, i) => <Cue key={`t${i}`} at={tickAt(i)} name="switch-tap" volume={0.35} />)}
      <Cue at={clear} name="paper-move-quick" volume={0.6} />
      <Cue at={clear + 16 + words.length * 6} name="marker-pen-line" volume={0.5} />
    </Clip>
  );
};
