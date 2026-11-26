/**
 * /flat-cartoon (2026-11-04, name from Shaan Johari's Animation Styles Part 5, his prompt is DM-gated and unseen):
 * the plainest business visual. A flat illustrated room fills or empties as a true number moves, one little
 * person per N of whatever was counted, with the number and its year ticking above. No outlines, no gradients,
 * three flat colours from the brand. Every person on screen is real arithmetic: round(value / per), and the
 * legend says what one person stands for, so a viewer can check the picture against the number.
 *
 * 2026-11-17 (Jacob: show the product when we can, and open on UMD so Maryland students stop scrolling): three optional
 * props, all off by default so the Nov 4 sample renders as before. `numberTop` moves the number block down under a
 * two-line title (the BMGT340 student cut's title ran into the number). `shot` brings a REAL capture up over the room
 * once the count is done, flat (no shadow, no outline), with short red bars under the words that answer the title,
 * never drawn UI. `umd` adds the shared <UmdOpen /> as the last child.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR } from "../system/motion";
import { B, Clip, Cue, INTER, PRINT, RED, ZODIAK, clamp, ramp } from "./common";
import { UmdOpen, type UmdOpenProps } from "./UmdOpen";

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
  /** Optional (11/17): top of the big number (default 300). Push it down when the title runs to two lines. */
  numberTop?: number;
  /** Optional (11/17): a real capture brought up over the room after the count. `line` sits above it, `marks` are red
   * bars under the words that answer the title (in the crop's own pixels), `source` sits under it. */
  shot?: {
    src: string; w: number; h: number; crop: { x: number; y: number; w: number; h: number };
    line: string; source: string; marks?: { x: number; y: number; w: number }[]; width?: number; top?: number;
  };
  /** Optional (11/17): the UMD M opening (src/styles/UmdOpen.tsx), placement only. */
  umd?: UmdOpenProps;
};

const START = 24;
const STEP = 26;
const SHOT_AFTER = 54; // motion: the callout reads for 1.8 s before the capture comes up
const SHOT_HOLD = 120; // motion: 4 s on the capture, its line and its marks
export const flatEnd = (n: number, p?: Pick<FlatCartoonProps, "shot">) => START + n * STEP + (p?.shot ? SHOT_AFTER + SHOT_HOLD : 90);
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

/** The capture, flat: it slides up over the room on a spring, its line above, red bars under the answer, source below. */
const FlatShot: React.FC<{ shot: NonNullable<FlatCartoonProps["shot"]>; at: number; lineTop: number }> = ({ shot, at, lineTop }) => {
  const f = useCurrentFrame();
  const { fps, width: W } = useVideoConfig();
  if (f < at - 2) return null;
  const k = spring({ frame: f - at, fps, config: { damping: 15, stiffness: 120 } });
  const w = shot.width ?? 1000;
  const h = w * (shot.crop.h / shot.crop.w);
  const s = w / shot.crop.w;
  const top = shot.top ?? lineTop + 150;
  const line = ramp(f, at + 6, at + 6 + DUR.arrive, CURVE.quiet.enter);
  const src = ramp(f, at + 30, at + 30 + DUR.arrive, CURVE.quiet.enter);
  return (
    <>
      <div style={{ position: "absolute", left: 64, right: 64, top: lineTop, fontFamily: ZODIAK, fontWeight: 700, fontSize: 64, lineHeight: 1.06, letterSpacing: "-0.02em",
        color: RED, opacity: line, transform: `translateY(${(1 - line) * 14}px)` }}>{shot.line}</div>
      <div style={{ position: "absolute", left: (W - w) / 2, top: top + (1 - k) * 900, width: w, height: h, borderRadius: 28, overflow: "hidden", background: PRINT }}>
        <Img src={staticFile(shot.src)} style={{ position: "absolute", left: -shot.crop.x * s, top: -shot.crop.y * s, width: shot.w * s, height: shot.h * s }} />
        {shot.marks?.map((m, i) => {
          const mk = ramp(f, at + 20 + i * 6, at + 30 + i * 6, CURVE.quiet.enter);
          return <div key={i} style={{ position: "absolute", left: m.x * s, top: m.y * s, width: m.w * s * mk, height: 8, borderRadius: 4, background: RED }} />;
        })}
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, top: top + h + 26, fontFamily: INTER, fontSize: 28, color: PRINT, opacity: 0.62 * src }}>{shot.source}</div>
    </>
  );
};

export const FlatCartoon: React.FC<FlatCartoonProps> = ({ title, unit, points, per, perLabel, callout, source, cols, rows, numberTop = 300, shot, umd }) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const n = points.length;
  const END = flatEnd(n, { shot });
  const dy = numberTop - 300;
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
  const shotAt = START + n * STEP + SHOT_AFTER;
  // when the capture comes up, the count block and the callout step back so the capture and its line read alone
  const away = shot ? 1 - ramp(f, shotAt - 4, shotAt + 8, CURVE.quiet.exit) : 1;
  return (
    <Clip endAt={END} light>
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})`, transformOrigin: "50% 70%" }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d={`M0 ${top - 70} L${W} ${top - 70} L${W} ${H} L0 ${H} Z`} fill={TAN} opacity={0.45} />
          {Array.from({ length: rows }, (_, r) => (
            <rect key={r} x={W * 0.05} y={rowY(r) + 8} width={W * 0.9} height={22 * rowScale(r)} rx={10} fill={SEAT} />
          ))}
          <g opacity={away}>{order.map((o, i) => {
            if (i >= Math.max(seats, prevSeats)) return null;
            const arriving = i >= prevSeats;
            const leaving = i >= seats;
            const stagger = Math.min(2, 18 / Math.max(1, seats - prevSeats));
            const at = START + step * STEP + (arriving ? Math.round((i - prevSeats) * stagger) : 0);
            const kk = leaving ? 1 - ramp(f, START + step * STEP, START + step * STEP + 10) : arriving ? spring({ frame: f - at, fps, config: { damping: 10, stiffness: 170 } }) : 1;
            return <Person key={i} x={colX(o.c, o.r)} y={rowY(o.r)} s={rowScale(o.r)} k={kk} red={i % 11 === 3} />;
          })}</g>
        </svg>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 64, right: 64, top: 196, fontFamily: ZODIAK, fontWeight: 700, fontSize: 70, lineHeight: 1.06, letterSpacing: "-0.02em", color: PRINT, opacity: fade(2) }}>{title}</div>
      <div style={{ position: "absolute", left: 60, top: 300 + dy, fontFamily: ZODIAK, fontWeight: 700, fontSize: 260, lineHeight: 1, letterSpacing: "-0.03em", color: RED, fontVariantNumeric: "tabular-nums", opacity: fade(START - 14) * away }}>{shown}</div>
      <div style={{ position: "absolute", left: 66, top: 570 + dy, fontFamily: INTER, fontWeight: 600, fontSize: 40, color: PRINT, opacity: fade(START - 10) * away }}>{p.label}</div>
      <div style={{ position: "absolute", left: 66, top: 622 + dy, fontFamily: INTER, fontWeight: 500, fontSize: 34, color: B.color.bgDeep, opacity: 0.62 * fade(START - 10) * away }}>{unit}</div>
      <div style={{ position: "absolute", right: 64, top: 586 + dy, display: "flex", alignItems: "center", gap: 14, fontFamily: INTER, fontWeight: 500, fontSize: 32, color: PRINT, opacity: 0.8 * fade(START) * away }}>
        <svg width={44} height={56} viewBox="-30 -72 60 80"><path d="M-30 0 C-30 -34 30 -34 30 0 L30 6 L-30 6 Z" fill={PRINT} /><circle cx={0} cy={-46} r={17} fill={TAN} /></svg>
        = {perLabel}
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, top: H * 0.87, fontFamily: ZODIAK, fontWeight: 700, fontSize: 56, lineHeight: 1.08, color: PRINT, opacity: fade(done) * away, transform: `translateY(${(1 - fade(done)) * 14}px)` }}>{callout}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: H * 0.87 + 76, fontFamily: INTER, fontSize: 28, color: PRINT, opacity: 0.62 * fade(done + 10) * away }}>{source}</div>
      {shot ? <FlatShot shot={shot} at={shotAt} lineTop={numberTop} /> : null}
      {points.map((_, i) => <Cue key={i} at={START + i * STEP} name={i === 0 ? "air-woosh-quick" : "switch-tap"} volume={0.4} />)}
      <Cue at={START + 10} name="counter" volume={0.22} />
      <Cue at={done} name="bass-hit-short" volume={0.5} />
      {shot ? <Cue at={shotAt} name="air-woosh-quick" volume={0.45} /> : null}
      {shot?.marks?.map((_, i) => <Cue key={`m${i}`} at={shotAt + 20 + i * 6} name="switch-tap" volume={0.3} />)}
      {umd ? <UmdOpen {...umd} /> : null}
    </Clip>
  );
};
