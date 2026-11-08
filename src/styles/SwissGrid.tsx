/**
 * /swiss-grid (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). A poster in the International Typographic Style: the grid draws itself first, then every element snaps into
 * a module on a hard ease (no float, no bounce): one red block, one huge number flush left, its label turned on its
 * side, smaller facts in the cells, the headline set flush left and ragged right. Light paper ground, black and one
 * red, asymmetric. Numbers and labels are Inter, which is the grotesk the style wants; the headline is Zodiak.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, readHold } from "../system/motion";
import { loadFont } from "@remotion/google-fonts/Archivo";
import { Cue, ramp } from "./common";
import { World } from "./world";

const { fontFamily: ARCHIVO } = loadFont("normal", { weights: ["500", "600", "800", "900"], subsets: ["latin"] });
// rebuilt 11/08 as its own world: a Swiss poster on brand red, one grotesk (Archivo) for everything, a black block,
// the hero number in cream. One face, flush left, ragged right, the grid showing.
const GROUND = "#D9202E";
const PRINT = "#140405";
const CREAM = "#FBE9DA";
const RED = PRINT; // the block: on a red poster the strong mark is black

export type SwissGridProps = {
  headline: string;
  /** The hero figure, as it should read ("659"), and what it counts. */
  big: { value: string; label: string };
  /** Two or three smaller facts. */
  cells: { value: string; label: string }[];
  source: string;
  cta?: string;
};

const COLS = 6;
const SNAP = 7; // motion: frames per snap, hard and short
const FPS = 30;
const SNAPPY = CURVE.showy.exit; // motion: a hard in-out so elements arrive like they were placed, not floated
const hard = (f: number, at: number) => ramp(f, at, at + SNAP, (t) => 1 - SNAPPY(1 - t));

export const swissPlan = (p: SwissGridProps) => {
  const grid = 0, block = 22, big = 32, label = 44, cells = 54;
  const head = cells + p.cells.length * 8 + 4;
  const end = head + 20 + Math.round((readHold(`${p.headline} ${p.big.value} ${p.big.label}`) + 0.4) * FPS);
  return { grid, block, big, label, cells, head, end };
};
export const swissEnd = (p: SwissGridProps) => swissPlan(p).end;

export const SwissGrid: React.FC<SwissGridProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = swissPlan(p);
  const m = 56;
  const colW = (width - m * 2) / COLS;
  const rowH = (height - 620) / 8;
  const gx = (c: number) => m + c * colW;
  const gy = (r: number) => 300 + r * rowH;
  const lineK = (i: number) => ramp(f, t.grid + i * 1.5, t.grid + i * 1.5 + 14, CURVE.quiet.standard);
  const bigK = hard(f, t.big);
  const blockK = hard(f, t.block);
  const bigSize = Math.min((rowH * 2.2) / 0.86, (colW * 5) / (p.big.value.length * 0.58));
  return (
    <World endAt={t.end} ground={GROUND} ink={CREAM} logo="white" logoSpot="top-left" font={ARCHIVO} fontWeight={900} cta={p.cta} end="wipe-left" endGround={PRINT}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {[...Array(COLS + 1)].map((_, i) => (
          <line key={`c${i}`} x1={gx(i)} x2={gx(i)} y1={gy(0)} y2={gy(0) + (gy(8) - gy(0)) * lineK(i)} stroke={PRINT} strokeOpacity={0.22} strokeWidth={2} />
        ))}
        {[...Array(9)].map((_, i) => (
          <line key={`r${i}`} x1={gx(0)} x2={gx(0) + (gx(COLS) - gx(0)) * lineK(i + 2)} y1={gy(i)} y2={gy(i)} stroke={PRINT} strokeOpacity={0.14} strokeWidth={2} />
        ))}
      </svg>
      {/* the red block: four columns by two rows, top right, sliding in from the edge */}
      <div style={{ position: "absolute", left: gx(2) + (1 - blockK) * colW * 4.4, top: gy(0), width: colW * 4, height: rowH * 2, background: RED }} />
      {/* the hero number, flush left across five columns */}
      <div style={{ position: "absolute", left: gx(0) - bigSize * 0.04, top: gy(2) + (1 - bigK) * rowH, fontFamily: ARCHIVO, fontWeight: 900, fontSize: bigSize, lineHeight: 0.86,
        letterSpacing: "-0.06em", color: CREAM, opacity: bigK, fontVariantNumeric: "tabular-nums", clipPath: `inset(0 0 ${((1 - bigK) * 100).toFixed(1)}% 0)` }}>{p.big.value}</div>
      {/* its label, turned on its side along the last column */}
      <div style={{ position: "absolute", left: gx(0) + 12, top: gy(4) + 18, transform: `translateX(${((1 - hard(f, t.label)) * -30).toFixed(1)}px)`,
        fontFamily: ARCHIVO, fontWeight: 600, fontSize: 38, color: PRINT, whiteSpace: "nowrap", opacity: hard(f, t.label) }}>{p.big.label}</div>
      {/* the cells, one module each along row 5 */}
      {p.cells.map((c, i) => {
        const k = hard(f, t.cells + i * 8);
        const col = i * 2;
        return (
          <div key={i} style={{ position: "absolute", left: gx(col) + 12, top: gy(5) + 14, width: colW * 2 - 24, opacity: k, transform: `translateY(${((1 - k) * 30).toFixed(1)}px)` }}>
            <div style={{ fontFamily: ARCHIVO, fontWeight: 800, fontSize: 88, lineHeight: 1, letterSpacing: "-0.05em", color: i === 0 ? CREAM : PRINT, fontVariantNumeric: "tabular-nums" }}>{c.value}</div>
            <div style={{ fontFamily: ARCHIVO, fontWeight: 500, fontSize: 30, lineHeight: 1.2, color: PRINT, marginTop: 10 }}>{c.label}</div>
          </div>
        );
      })}
      {/* the headline, flush left, ragged right, two rows from the bottom */}
      <AbsoluteFill>
        <div style={{ position: "absolute", left: gx(0) + 12, width: colW * 5, top: gy(6) + 20, fontFamily: ARCHIVO, fontWeight: 900, fontSize: 84, lineHeight: 0.96,
          letterSpacing: "-0.04em", color: PRINT, opacity: hard(f, t.head), transform: `translateX(${((1 - hard(f, t.head)) * -40).toFixed(1)}px)` }}>{p.headline}</div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: gx(0) + 12, top: gy(8) + 26, fontFamily: ARCHIVO, fontSize: 32, color: PRINT, opacity: 0.85 * hard(f, t.head + 10) }}>{p.source}</div>
      <Cue at={t.block} name="paper-slide" volume={0.4} />
      <Cue at={t.big} name="bass-hit-short" volume={0.55} />
      {p.cells.map((_, i) => <Cue key={i} at={t.cells + i * 8} name="switch-tap" volume={0.3} />)}
      <Cue at={t.head} name="paper-move-quick" volume={0.35} />
    </World>
  );
};
