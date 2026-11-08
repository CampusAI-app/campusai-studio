/**
 * /git-city (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). A grid of numbers built as an isometric city, the way a GitHub contribution graph becomes a skyline: one
 * row per series, one column per period, every tower's height its true value. The towers rise column by column
 * like time passing, the camera drifting round a little, and the column that matters lights red. Row and column
 * labels sit on the ground. It works for any grid of true counts, not only commits.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR, readHold } from "../system/motion";
import { B, Clip, Cue, INTER, RED, Title, ZODIAK, clamp, ramp } from "./common";

export type GitCityProps = {
  title: string;
  rows: { label: string; values: number[] }[];
  /** One label per column, e.g. "2016". Only the first and last are drawn, plus any in `marks`. */
  cols: string[];
  /** The column index lit red. */
  accent: number;
  caption: string;
  source: string;
  cta?: string;
};

const FPS = 30;
const COL_STEP = 6; // motion: frames between columns rising, a year every fifth of a second
export const cityPlan = (p: GitCityProps) => {
  const built = 14 + p.cols.length * COL_STEP + 18;
  const capAt = built + 6;
  const end = capAt + Math.round((readHold(p.caption) + 0.6) * FPS);
  return { built, capAt, end };
};
export const cityEnd = (p: GitCityProps) => cityPlan(p).end;

export const GitCity: React.FC<GitCityProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { built, capAt, end } = cityPlan(p);
  const nC = p.cols.length, nR = p.rows.length;
  const max = Math.max(...p.rows.flatMap((r) => r.values));
  const cell = Math.min((width - 280) / (nC + nR), 60);
  const turn = interpolate(f, [0, end], [-0.06, 0.06], clamp); // the slow drift round the city
  const ox = width / 2 + 40, oy = height * 0.5;
  // iso projection about the grid's centre, turned a little by `turn`
  const P = (c: number, r: number, z = 0) => {
    const x = c - nC / 2, y = r - nR / 2;
    const xr = x * Math.cos(turn) - y * Math.sin(turn), yr = x * Math.sin(turn) + y * Math.cos(turn);
    return { X: ox + (xr - yr) * cell, Y: oy + (xr + yr) * cell * 0.5 - z };
  };
  const hMax = height * 0.22;
  const pt = (q: { X: number; Y: number }) => `${q.X.toFixed(1)},${q.Y.toFixed(1)}`;
  const towers: { key: string; depth: number; el: React.ReactNode }[] = [];
  p.rows.forEach((row, r) => row.values.forEach((v, c) => {
    const at = 14 + c * COL_STEP + r * 1.5;
    const s = spring({ frame: f - at, fps, config: { damping: 15, stiffness: 120 } });
    const h = Math.max(2, (v / max) * hMax * Math.min(1.04, s));
    const g = 0.36;
    const top = [P(c + 0.5 - g, r + 0.5 - g, h), P(c + 0.5 + g, r + 0.5 - g, h), P(c + 0.5 + g, r + 0.5 + g, h), P(c + 0.5 - g, r + 0.5 + g, h)];
    const bot = [P(c + 0.5 + g, r + 0.5 - g), P(c + 0.5 + g, r + 0.5 + g), P(c + 0.5 - g, r + 0.5 + g)];
    const lit = c === p.accent && f >= built - 4;
    const col = lit ? RED : B.color.ink;
    if (f < at) return;
    towers.push({ key: `${r}-${c}`, depth: c + r, el: (
      <g key={`${r}-${c}`}>
        <polygon points={[top[1], top[2], bot[1], bot[0]].map(pt).join(" ")} fill={col} opacity={lit ? 0.75 : 0.5} />
        <polygon points={[top[2], top[3], bot[2], bot[1]].map(pt).join(" ")} fill={col} opacity={lit ? 0.55 : 0.32} />
        <polygon points={top.map(pt).join(" ")} fill={col} opacity={lit ? 1 : 0.92} />
      </g>
    ) });
  }));
  towers.sort((a, b) => a.depth - b.depth);
  const cap = ramp(f, capAt, capAt + DUR.arrive, CURVE.quiet.enter);
  const ground = (c: number, r: number) => P(c, r);
  return (
    <Clip endAt={end} cta={p.cta}>
      <Title out={end}>{p.title}</Title>
      <AbsoluteFill>
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <polygon points={[ground(0, 0), ground(nC, 0), ground(nC, nR), ground(0, nR)].map(pt).join(" ")} fill={B.color.ink} opacity={0.05} />
          {towers.map((t) => t.el)}
        </svg>
        {/* row labels along the near-left edge, column labels along the near-right edge */}
        {p.rows.map((row, r) => {
          const q = P(0, r + 0.5);
          return <div key={r} style={{ position: "absolute", left: q.X - 236, width: 170, top: q.Y - 30, textAlign: "right", opacity: ramp(f, 6, 18) }}>
            <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 26, color: B.color.ink, background: "rgba(11,7,8,.82)", padding: "2px 10px", borderRadius: 8 }}>{row.label}</span>
          </div>;
        })}
        {p.cols.map((c, i) => {
          if (i !== 0 && i !== nC - 1 && i !== p.accent) return null;
          const q = P(i + 0.5, nR);
          return <div key={i} style={{ position: "absolute", left: q.X - 60, width: 120, top: q.Y + 16, textAlign: "center", fontFamily: INTER, fontWeight: 600, fontSize: 30,
            color: i === p.accent ? RED : B.color.inkSoft, opacity: ramp(f, 14 + i * COL_STEP, 24 + i * COL_STEP) }}>{c}</div>;
        })}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.72, fontFamily: ZODIAK, fontWeight: 700, fontSize: 58, lineHeight: 1.1, color: B.color.ink,
        opacity: cap, transform: `translateY(${(1 - cap) * 14}px)` }}>{p.caption}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.72 + 160, fontFamily: INTER, fontSize: 32, color: B.color.ink, opacity: ramp(f, capAt + 12, capAt + 24) }}>{p.source}</div>
      {p.cols.map((_, i) => (i % 2 === 0 ? <Cue key={i} at={14 + i * COL_STEP} name="hit-weak" volume={0.22} /> : null))}
      <Cue at={built - 4} name="bass-hit-short" volume={0.5} />
    </Clip>
  );
};
