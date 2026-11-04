/**
 * /flat-cartoon (2026-11-04, name from Shaan Johari's Animation Styles Part 5, his prompt is DM-gated and unseen):
 * the plainest business visual. A flat illustrated room fills or empties as a true number moves, one little
 * person per N of whatever was counted, with the number and its year ticking above. No outlines, no gradients,
 * three flat colours from the brand. Every person on screen is real arithmetic: round(value / per), and the
 * legend says what one person stands for, so a viewer can check the picture against the number.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR } from "../system/motion";
import { B, Clip, Cue, INTER, PRINT, RED, ZODIAK, clamp, ramp } from "./common";

export type FlatCartoonProps = {
  title: string;
  /** What was counted, under the number. */
  unit: string;
  points: { label: string; value: number }[];
  /** How many of the counted thing one person stands for. */
  per: number;
  /** Shown on the legend, e.g. "10 students". */
  perLabel: string;
  callout: string;
  source: string;
  /** Seats in the room, columns x rows. Must hold the largest value / per. */
  cols: number;
  rows: number;
};

const START = 24;
const STEP = 26;
export const flatEnd = (n: number) => START + n * STEP + 90;
export const FLAT_END = flatEnd(6);

const TAN = "#e4cdb8";
const SEAT = "#d9bfa8";

const Person: React.FC<{ x: number; y: number; s: number; k: number; red: boolean }> = ({ x, y, s, k, red }) => (
  <g transform={`translate(${x} ${y + (1 - k) * 26}) scale(${(s * (0.6 + 0.4 * k)).toFixed(3)} ${(s * (0.4 + 0.6 * Math.min(1.1, k))).toFixed(3)})`} opacity={Math.min(1, k * 2)}>
    <path d="M-30 0 C-30 -34 30 -34 30 0 L30 6 L-30 6 Z" fill={red ? RED : PRINT} />
    <circle cx={0} cy={-46} r={17} fill={TAN} />
    <path d="M-17 -50 C-16 -70 16 -70 17 -50 C8 -58 -8 -58 -17 -50 Z" fill={PRINT} />
  </g>
);

export const FlatCartoon: React.FC<FlatCartoonProps> = ({ title, unit, points, per, perLabel, callout, source, cols, rows }) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const n = points.length;
  const END = flatEnd(n);
  const step = Math.max(0, Math.min(n - 1, Math.floor((f - START) / STEP)));
  const p = points[step];
  const prev = points[Math.max(0, step - 1)];
  const k = ramp(f, START + step * STEP, START + step * STEP + 14, CURVE.quiet.standard);
  // The number never counts up from zero: every value on screen between two years is between two real ones.
  const shown = Math.round(step === 0 ? p.value : prev.value + (p.value - prev.value) * k);
  const seats = Math.round(p.value / per);
  const prevSeats = step === 0 ? 0 : Math.round(prev.value / per);
  // Fill from the front row, centre out, like a real lecture hall.
  const order = Array.from({ length: cols * rows }, (_, i) => ({ c: i % cols, r: Math.floor(i / cols) }))
    .sort((a, b) => b.r - a.r || Math.abs(a.c - (cols - 1) / 2) - Math.abs(b.c - (cols - 1) / 2));
  const top = H * 0.46, bottom = H * 0.84;
  const rowY = (r: number) => top + (r / (rows - 1)) * (bottom - top);
  const rowScale = (r: number) => 1.05 + (r / (rows - 1)) * 0.45;
  const colX = (c: number, r: number) => W / 2 + (c - (cols - 1) / 2) * (W * 0.86 / cols) * (0.86 + (r / (rows - 1)) * 0.14);
  const done = START + n * STEP;
  const fade = (at: number) => ramp(f, at, at + DUR.arrive, CURVE.quiet.enter);
  const push = interpolate(f, [0, END], [1, 1.05], clamp);
  return (
    <Clip endAt={END} light>
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})`, transformOrigin: "50% 70%" }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d={`M0 ${top - 70} L${W} ${top - 70} L${W} ${H} L0 ${H} Z`} fill={TAN} opacity={0.45} />
          {Array.from({ length: rows }, (_, r) => (
            <rect key={r} x={W * 0.05} y={rowY(r) + 8} width={W * 0.9} height={22 * rowScale(r)} rx={10} fill={SEAT} />
          ))}
          {order.map((o, i) => {
            if (i >= Math.max(seats, prevSeats)) return null;
            const arriving = i >= prevSeats;
            const leaving = i >= seats;
            const stagger = Math.min(2, 18 / Math.max(1, seats - prevSeats));
            const at = START + step * STEP + (arriving ? Math.round((i - prevSeats) * stagger) : 0);
            const kk = leaving ? 1 - ramp(f, START + step * STEP, START + step * STEP + 10) : arriving ? spring({ frame: f - at, fps, config: { damping: 10, stiffness: 170 } }) : 1;
            return <Person key={i} x={colX(o.c, o.r)} y={rowY(o.r)} s={rowScale(o.r)} k={kk} red={i % 11 === 3} />;
          })}
        </svg>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 64, right: 64, top: 196, fontFamily: ZODIAK, fontWeight: 700, fontSize: 70, lineHeight: 1.06, letterSpacing: "-0.02em", color: PRINT, opacity: fade(2) }}>{title}</div>
      <div style={{ position: "absolute", left: 60, top: 300, fontFamily: ZODIAK, fontWeight: 700, fontSize: 260, lineHeight: 1, letterSpacing: "-0.03em", color: RED, fontVariantNumeric: "tabular-nums", opacity: fade(START - 14) }}>{shown}</div>
      <div style={{ position: "absolute", left: 66, top: 570, fontFamily: INTER, fontWeight: 600, fontSize: 40, color: PRINT, opacity: fade(START - 10) }}>{p.label}</div>
      <div style={{ position: "absolute", left: 66, top: 622, fontFamily: INTER, fontWeight: 500, fontSize: 34, color: B.color.bgDeep, opacity: 0.62 * fade(START - 10) }}>{unit}</div>
      <div style={{ position: "absolute", right: 64, top: 586, display: "flex", alignItems: "center", gap: 14, fontFamily: INTER, fontWeight: 500, fontSize: 32, color: PRINT, opacity: 0.8 * fade(START) }}>
        <svg width={44} height={56} viewBox="-30 -72 60 80"><path d="M-30 0 C-30 -34 30 -34 30 0 L30 6 L-30 6 Z" fill={PRINT} /><circle cx={0} cy={-46} r={17} fill={TAN} /></svg>
        = {perLabel}
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, top: H * 0.87, fontFamily: ZODIAK, fontWeight: 700, fontSize: 56, lineHeight: 1.08, color: PRINT, opacity: fade(done), transform: `translateY(${(1 - fade(done)) * 14}px)` }}>{callout}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: H * 0.87 + 76, fontFamily: INTER, fontSize: 28, color: PRINT, opacity: 0.62 * fade(done + 10) }}>{source}</div>
      {points.map((_, i) => <Cue key={i} at={START + i * STEP} name={i === 0 ? "air-woosh-quick" : "switch-tap"} volume={0.4} />)}
      <Cue at={START + 10} name="counter" volume={0.22} />
      <Cue at={done} name="bass-hit-short" volume={0.5} />
    </Clip>
  );
};
