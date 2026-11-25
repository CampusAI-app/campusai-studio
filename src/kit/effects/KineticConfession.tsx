/**
 * Kinetic confession (2026-11-25, Muse: Adrian's (@adrianinmotion) spec film for Bitstack, "I've never been able to save";
 * Jacob: "I LOVE THIS. Let's do a version of someone talking to there friend about campusAI"). Read frame by frame (all
 * 29.2 s, every 0.5 s and every 0.1 to 0.2 s around each cut); our own build, nothing copied from the film.
 *
 * What the film does that these parts carry:
 * - `NoticeStack`: life as notifications. Each new banner lands in the SAME slot (blurred, 70 px low, settling in about
 *   0.4 s) and pushes the ones before it up, so the eye never moves while the pile grows. Use it for the problem (drawn
 *   banners from the person's week) or for the proof (real cards cropped from the product).
 * - `BoilMarker`: the hand-drawn highlight behind a word or number. It wipes on left to right in about 0.2 s and can
 *   "boil" (its ragged edge redraws every 3 frames), which is how the film's "something" feels scribbled in.
 * - `OrbitWord`: one word is set straight, then its letters curl into a ring around a centre word and keep turning
 *   ("rounded" around "up" in the film, 17.6 to 18.9 s). Letters sit tangent to the ring with a gap where the word ends.
 * - `FlipTile`: a small rounded tile that spins on its vertical axis like a coin, to stand in for a letter inside a word
 *   ("c[coins]ts" in the film). Give it the letter as its face and an icon as its `back`, so the word still reads
 *   between turns. Put several in a row inside a line of type.
 *
 * Fonts and colours are props: the parts carry the motion, the film carries its look.
 * Worked example: `PostFriendStory-9x16` (src/trials/post-friend-story.tsx, stays local).
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { OUT, clampX, k, mix } from "./shared";

/** A tiny seeded random in 0..1, so a boiling edge is the same on every render. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------------------------- NoticeStack
export type Notice = {
  /** Frame it lands. */
  at: number;
  /** Its height in px (the stack needs it to push the others up). */
  h: number;
  node: React.ReactNode;
};

/** Banners landing in one slot and pushing the earlier ones up. `bottom` is the slot's bottom edge (frame px). */
export const NoticeStack: React.FC<{
  items: Notice[];
  x: number;
  bottom: number;
  width: number;
  gap?: number;
  /** Frames for a landing. */
  land?: number;
}> = ({ items, x, bottom, width, gap = 18, land = 12 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {items.map((it, i) => {
        if (f < it.at) return null;
        // how far later arrivals have pushed this one up, each push springing in as that banner lands
        let lift = 0;
        for (let j = i + 1; j < items.length; j++) {
          const s = spring({ frame: f - items[j].at, fps, config: { damping: 20, stiffness: 170, mass: 0.8 } });
          lift += (items[j].h + gap) * s;
        }
        const p = k(f, it.at, it.at + land, OUT);
        const top = bottom - it.h - lift + (1 - p) * 70;
        return (
          <div key={i} style={{ position: "absolute", left: x, top, width, height: it.h, opacity: Math.min(1, p * 1.6),
            transform: `scale(${mix(0.94, 1, p).toFixed(4)})`, filter: `blur(${((1 - p) * 14).toFixed(2)}px)` }}>
            {it.node}
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------------------------- BoilMarker
/** A ragged marker block behind a word. Wipes on from `at`; `boil` keeps redrawing its edge. Sized in frame px. */
export const BoilMarker: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  at: number;
  color: string;
  seed?: number;
  boil?: boolean;
  /** Edge roughness in px. */
  rough?: number;
  wipe?: number;
}> = ({ x, y, w, h, at, color, seed = 1, boil = false, rough = 7, wipe = 6 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = k(f, at, at + wipe, OUT);
  const tick = boil ? Math.floor((f - at) / 3) : 0;
  const n = Math.max(6, Math.round(w / 34));
  const pts: string[] = [];
  const j = (i: number, a: number) => (rand(seed * 97 + tick * 13 + i * 7 + a) - 0.5) * 2 * rough;
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * w + j(i, 1) * 0.4},${j(i, 2)}`);
  for (let i = n; i >= 0; i--) pts.push(`${(i / n) * w + j(i, 3) * 0.4},${h + j(i, 4)}`);
  return (
    <svg width={w + rough * 4} height={h + rough * 4} viewBox={`${-rough * 2} ${-rough * 2} ${w + rough * 4} ${h + rough * 4}`}
      style={{ position: "absolute", left: x - rough * 2, top: y - rough * 2, overflow: "visible",
        clipPath: `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)` }}>
      <polygon points={pts.join(" ")} fill={color} />
    </svg>
  );
};

// ---------------------------------------------------------------------------------------------- OrbitWord
let ctx: CanvasRenderingContext2D | null = null;
const widthOf = (t: string, font: string) => {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  ctx!.font = font;
  return ctx!.measureText(t).width;
};

/** A word set straight at (cx, cy) that curls into a ring of `radius` from `curlAt`, then keeps turning. */
export const OrbitWord: React.FC<{
  word: string;
  cx: number;
  cy: number;
  size: number;
  font: string;
  weight?: number;
  color: string;
  radius: number;
  at: number;
  curlAt: number;
  curl?: number;
  /** Degrees turned from curlAt to the end of `spin` frames (negative is counter-clockwise). */
  turn?: number;
  spin?: number;
  /** Degrees left open where the word ends. */
  gap?: number;
  /** Where the word's first letter sits on the ring, degrees (0 is the top). */
  start?: number;
}> = ({ word, cx, cy, size, font, weight = 600, color, radius, at, curlAt, curl = 16, turn = -150, spin = 90, gap = 70, start = -110 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const fnt = `${weight} ${size}px ${font}`;
  const letters = word.split("");
  const ws = letters.map((c) => widthOf(c, fnt));
  const total = ws.reduce((a, b) => a + b, 0);
  const inP = k(f, at, at + 8, OUT);
  // motion: ease in and out, so the first frame of the curl does not throw the letters (a hard ease-out jumped 60 px)
  const c = k(f, curlAt, curlAt + curl, (t) => t * t * (3 - 2 * t));
  const rot = interpolate(f, [curlAt, curlAt + spin], [0, turn], { ...clampX, easing: (t) => t * t * (3 - 2 * t) });
  const step = (360 - gap) / letters.length;
  let x = cx - total / 2;
  return (
    <>
      {letters.map((ch, i) => {
        const lx = x + ws[i] / 2;
        x += ws[i];
        const ang = start + i * step + rot; // degrees, 0 at the top, clockwise
        const rad = (ang * Math.PI) / 180;
        const rx = cx + Math.sin(rad) * radius;
        const ry = cy - Math.cos(rad) * radius;
        const px = mix(lx, rx, c);
        const py = mix(cy, ry, c);
        const r = mix(0, ang, c);
        return (
          <div key={i} style={{ position: "absolute", left: px, top: py, transform: `translate(-50%, -50%) rotate(${r.toFixed(2)}deg)`,
            font: fnt, color, lineHeight: 1, opacity: inP, whiteSpace: "pre" }}>{ch}</div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------------------------- FlipTile
/** A rounded tile spinning on its vertical axis like a coin. `phase` offsets it from its neighbours. */
export const FlipTile: React.FC<{
  size: number;
  color: string;
  at: number;
  phase?: number;
  /** Frames per half turn. */
  period?: number;
  /** With `flip`: each period the tile turns to its back in `flip` frames, rests there `backHold` frames, turns home,
   *  and rests on its face for the rest of the period, so the letter reads most of the time. */
  flip?: number;
  backHold?: number;
  radius?: number;
  /** The face it starts on (a letter, so the word still reads). */
  children?: React.ReactNode;
  /** The other face, shown while the tile is turned (an icon). Left out, both faces are the same. */
  back?: React.ReactNode;
}> = ({ size, color, at, phase = 0, period = 26, flip, backHold = 8, radius, children, back }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return <span style={{ display: "inline-block", width: size, height: size }} />;
  const pop = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 180 } });
  const tt = (f - at) / period + phase;
  const n = Math.floor(tt);
  const lf = (tt - n) * period; // frames into this period
  const ease = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
  const half = flip ? ease(lf / flip) + ease((lf - flip - backHold) / flip) : 0; // 0 face, 1 back, 2 face again
  const turn = flip ? Math.cos(half * Math.PI) : Math.cos(tt * Math.PI);
  const sx = Math.max(0.08, Math.abs(turn));
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size,
      borderRadius: radius ?? size * 0.24, background: color, transform: `scale(${(pop * 1).toFixed(4)}) scaleX(${sx.toFixed(4)})`,
      boxShadow: `inset ${(turn * -6).toFixed(1)}px 0 0 rgba(0,0,0,0.18)` }}>
      {back !== undefined && turn < 0 ? back : children}
    </span>
  );
};

export const KINETIC_CONFESSION = { NoticeStack, BoilMarker, OrbitWord, FlipTile };
