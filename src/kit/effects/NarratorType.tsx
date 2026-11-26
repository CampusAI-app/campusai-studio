/**
 * Narrator type (2026-11-26, from John Stark's Spline explainer, Muse send 392a845c; Jacob: "I LOVE THIS VIDEO").
 * Read frame by frame (Lucius's watch notes, 22.5 to 30 s of the film); our own build.
 *
 * Kinetic type that tells the story with no voice. What the reference does, and this part does:
 *  - word SIZE carries meaning: a small word ("shouldn't") beside a huge, soft one ("Complicated") that blooms in;
 *  - a selection box is DRAGGED round one word by a pointer, corner first, its handles popping as it lands;
 *  - real photo tiles POP between the words, as if they were words;
 *  - the key word is in hand BRUSH lettering in the accent, painted on left to right;
 *  - brush strokes bracket a line ("What if I told you");
 *  - the cuts are HIDDEN: a whip (the old line leaves fast and blurred, the new one arrives the same way and settles),
 *    or a big brush stroke that sweeps across the frame and leaves the next beat behind it.
 * Numbers from the reference (30 fps): a new idea about every 0.75 s; words arrive ~2 to 3 frames apart with a pop from
 * ~70% and a 6 px blur; a whip is ~5 frames out and ~8 frames in; the drag takes ~10 frames; a tile pops with ~8% overshoot.
 *
 * Use: <NarratorType beats={[...]} accent="#D9202E" />, a beat per idea. Worked example: src/trials/proof-narrator.tsx
 * (ProofNarrator-9x16), on the demo's campus map and its Van Munching study rooms.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadKaushan } from "@remotion/google-fonts/KaushanScript";
import { INTER } from "../parts";
import { springStep } from "../pass/readout/shared";

const { fontFamily: BRUSH } = loadKaushan();
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// motion: arrivals land hard and settle; exits speed up into the whip.
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const IN = Easing.bezier(0.55, 0, 0.85, 0.35);

export const NARRATOR = { stagger: 3, whipOut: 5, whipIn: 8, drag: 10, sweep: 12 } as const;

export type NarratorWord =
  | { text: string; size: number; weight?: number; brush?: boolean; soft?: boolean; select?: boolean; color?: string; at?: number }
  | { tile: string; w: number; h: number; radius?: number; at?: number };

export type NarratorBeat = {
  frames: number;
  /** Lines, each a row of words and tiles, centred. */
  lines: NarratorWord[][];
  /** How this beat arrives: a whip from the right, a brush sweep, or already there (frame 0). */
  enter?: "whip" | "sweep" | "none";
  /** Brush strokes bracketing the first line. */
  strokes?: boolean;
  /** Frames into the beat its first word lands (negative: already partly in at the beat's start). */
  offset?: number;
};

const isTile = (w: NarratorWord): w is Extract<NarratorWord, { tile: string }> => "tile" in w;

/** A hand brush stroke: a tapered swash, painted on along its length. */
const Stroke: React.FC<{ p: number; color: string; flip?: boolean; width: number }> = ({ p, color, flip, width }) => (
  <svg width={width} height={width * 0.32} viewBox="0 0 300 96" style={{ transform: flip ? "scaleX(-1)" : undefined, overflow: "visible" }}>
    <defs>
      <clipPath id={`stroke-${flip ? 1 : 0}-${Math.round(width)}`}><rect x={0} y={-20} width={300 * p} height={140} /></clipPath>
    </defs>
    <g clipPath={`url(#stroke-${flip ? 1 : 0}-${Math.round(width)})`}>
      <path d="M4 70 C 60 20, 120 90, 170 46 S 260 8, 296 30 L 292 40 C 250 24, 200 70, 160 66 S 70 66, 10 82 Z" fill={color} />
      <path d="M40 30 C 90 10, 150 30, 210 14 L 212 20 C 150 40, 96 22, 44 38 Z" fill={color} opacity={0.75} />
    </g>
  </svg>
);

/** The pointer that drags the selection box. */
const Arrow: React.FC<{ color: string }> = ({ color }) => (
  <svg width={38} height={46} viewBox="0 0 24 30" style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.25))" }}>
    <path d="M2 2 L2 24 L8 18 L12 28 L16 26 L12 17 L20 17 Z" fill={color} stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);

const Word: React.FC<{ w: NarratorWord; local: number; accent: string; ink: string }> = ({ w, local, accent, ink }) => {
  const t = local - (w.at ?? 0);
  // before it arrives a word still holds its place (opacity 0), so nothing reflows when it lands
  if (isTile(w)) {
    const s = springStep(Math.max(0, t) / 30, 0.62, 0.42);
    return (
      <div style={{ width: w.w * Math.min(1, s * 1.2), height: w.h, display: "inline-flex", justifyContent: "center", alignItems: "center",
        transition: "none" }}>
        <Img src={staticFile(w.tile)} style={{ width: w.w, height: w.h, objectFit: "cover", borderRadius: w.radius ?? 26, flex: "none",
          transform: `scale(${s}) rotate(${(1 - s) * -6}deg)`, boxShadow: "0 14px 34px rgba(0,0,0,0.18)" }} />
      </div>
    );
  }
  const a = interpolate(t, [0, 6], [0, 1], { ...clamp, easing: OUT });
  if (w.brush) {
    // painted on left to right, the way the reference's pink "Your Work" is lettered
    const paint = interpolate(t, [0, 12], [0, 1], { ...clamp, easing: OUT });
    return (
      <span style={{ fontFamily: BRUSH, fontSize: w.size, color: w.color ?? accent, lineHeight: 1.05, display: "inline-block",
        clipPath: `inset(-20% ${(1 - paint) * 100}% -20% -5%)`, transform: "rotate(-4deg)", padding: "0 0.08em" }}>
        {w.text}
      </span>
    );
  }
  if (w.soft) {
    // the huge soft word: blooms in from a blur and keeps growing a little, as "Complicated" does
    const grow = interpolate(t, [0, 40], [0.9, 1.04], clamp);
    return (
      <span style={{ fontFamily: INTER, fontWeight: w.weight ?? 600, fontSize: w.size, letterSpacing: "-0.05em", lineHeight: 1,
        display: "inline-block", color: w.color ?? ink, opacity: a, filter: `blur(${(1 - a) * 18 + 1.2}px)`,
        transform: `scale(${grow})`, textShadow: `0 0 40px ${w.color ?? ink}55` }}>
        {w.text}
      </span>
    );
  }
  const pop = interpolate(t, [0, 7], [0.7, 1], { ...clamp, easing: OUT });
  return (
    <span style={{ fontFamily: INTER, fontWeight: w.weight ?? 600, fontSize: w.size, letterSpacing: "-0.04em", lineHeight: 1.05,
      display: "inline-block", color: w.color ?? ink, opacity: a, filter: a < 1 ? `blur(${(1 - a) * 6}px)` : undefined,
      transform: `scale(${pop})` }}>
      {w.text}
      {w.select && <Select local={t - 8} accent={accent} />}
    </span>
  );
};

/** The selection box: a pointer drags it from the word's top-left to bottom-right, then the handles pop and it fills. */
const Select: React.FC<{ local: number; accent: string }> = ({ local, accent }) => {
  if (local < -4) return null;
  const d = interpolate(local, [0, NARRATOR.drag], [0, 1], { ...clamp, easing: Easing.bezier(0.4, 0, 0.2, 1) });
  const land = interpolate(local, [NARRATOR.drag, NARRATOR.drag + 5], [0, 1], clamp);
  const arrowIn = interpolate(local, [-4, 0], [0, 1], clamp);
  const pad = 10;
  const hs = 14;
  return (
    <span style={{ position: "absolute", left: -pad, top: -pad, right: -pad, bottom: -pad, pointerEvents: "none" }}>
      <span style={{ position: "absolute", left: 0, top: 0, width: `${d * 100}%`, height: `${d * 100}%`,
        border: `3px solid ${accent}`, background: `rgba(217,32,46,${0.08 + 0.1 * land})` }} />
      {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], i) => (
        <span key={i} style={{ position: "absolute", left: `calc(${x * 100}% - ${hs / 2}px)`, top: `calc(${y * 100}% - ${hs / 2}px)`, width: hs, height: hs,
          background: "#fff", border: `3px solid ${accent}`, transform: `scale(${land})` }} />
      ))}
      <span style={{ position: "absolute", left: `${d * 100}%`, top: `${d * 100}%`, opacity: arrowIn * interpolate(local, [NARRATOR.drag + 10, NARRATOR.drag + 16], [1, 0], clamp),
        transform: "translate(-4px,-4px)" }}>
        <Arrow color={accent} />
      </span>
    </span>
  );
};

const BeatView: React.FC<{ beat: NarratorBeat; local: number; accent: string; ink: string }> = ({ beat, local, accent, ink }) => {
  // each word's arrival: its own `at`, else one after another
  let n = 0;
  const lines = beat.lines.map((line) => line.map((w) => {
    const at = w.at ?? n * NARRATOR.stagger;
    n++;
    return { ...w, at } as NarratorWord;
  }));
  const l = local - (beat.offset ?? 0);
  const sp = interpolate(l, [0, 10], [0, 1], { ...clamp, easing: OUT });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, position: "relative" }}>
          {beat.strokes && i === 0 && <div style={{ position: "absolute", right: "100%", marginRight: 6 }}><Stroke p={sp} color={accent} width={150} flip /></div>}
          {line.map((w, j) => <div key={j} style={{ position: "relative" }}><Word w={w} local={l} accent={accent} ink={ink} /></div>)}
          {beat.strokes && i === 0 && <div style={{ position: "absolute", left: "100%", marginLeft: 6 }}><Stroke p={sp} color={accent} width={150} /></div>}
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** Frame each beat starts, for sound. */
export const narratorTimes = (beats: NarratorBeat[]) => {
  const out: number[] = [];
  let t = 0;
  for (const b of beats) {
    out.push(t);
    t += b.frames;
  }
  return out;
};

export const NarratorType: React.FC<{ beats: NarratorBeat[]; accent?: string; ink?: string; ground?: string }> = ({
  beats, accent = "#D9202E", ink = "#141414", ground = "#ffffff",
}) => {
  const f = useCurrentFrame();
  const starts = narratorTimes(beats);
  return (
    <AbsoluteFill style={{ background: ground, overflow: "hidden" }}>
      {beats.map((b, i) => {
        const s = starts[i];
        const e = s + b.frames;
        const next = beats[i + 1];
        if (f < s - NARRATOR.whipOut || f >= e + NARRATOR.sweep) return null;
        const local = f - s;
        // leaving: a whip left with blur, or (under a sweep) a hold until the stroke covers it
        let x = 0;
        let blur = 0;
        let o = 1;
        if (next?.enter === "whip" && f >= e - NARRATOR.whipOut) {
          const t = interpolate(f, [e - NARRATOR.whipOut, e], [0, 1], { ...clamp, easing: IN });
          x = -1300 * t;
          blur = 26 * t;
        }
        // under a sweep the old beat goes while the stroke covers it
        if (next?.enter === "sweep") o = interpolate(f, [e - 3, e], [1, 0], clamp);
        if (next && next.enter !== "sweep" && next.enter !== "whip" && f >= e) o = 0;
        // arriving by whip
        if (b.enter === "whip" && f < s + NARRATOR.whipIn) {
          if (f < s) return null;
          const t = interpolate(f, [s, s + NARRATOR.whipIn], [1, 0], { ...clamp, easing: OUT });
          x = 1300 * t;
          blur = 26 * t;
        }
        if (o <= 0) return null;
        return (
          <AbsoluteFill key={i} style={{ transform: `translateX(${x}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined, opacity: o }}>
            <BeatView beat={b} local={local} accent={accent} ink={ink} />
          </AbsoluteFill>
        );
      })}
      {beats.map((b, i) => {
        if (b.enter !== "sweep") return null;
        // the sweep: a giant brush stroke crosses the frame; the cut happens under its widest point
        const s = starts[i];
        const t = interpolate(f, [s - NARRATOR.sweep / 2, s + NARRATOR.sweep / 2], [0, 1], clamp);
        if (f < s - NARRATOR.sweep || f > s + NARRATOR.sweep) return null;
        return (
          // data-gate-skip: the layer is full-frame; the stroke itself enters and leaves by moving across, from off frame to off frame
          <AbsoluteFill key={`sw${i}`} data-gate-skip style={{ pointerEvents: "none" }}>
            <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="none">
              <g transform={`translate(${-2900 + 4800 * t} 0) rotate(-14 540 960)`} style={{ filter: "blur(2px)" }}>
                <path d="M0 380 C 500 240, 900 500, 1400 320 S 2200 240, 2400 380 L 2400 1620 C 2000 1720, 1600 1480, 1100 1640 S 300 1740, 0 1580 Z" fill={accent} />
              </g>
            </svg>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
