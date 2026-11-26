/**
 * Edge-turn card (2026-11-26, from Studio Size's Medallia motion system carousel, slide 9, Muse send d7d623c9; Jacob:
 * "i love the motion graphics other than slide 1"). Read frame by frame (Lucius's watch notes); our own build.
 *
 * One dark data card on a pale ground carries a run of charts. Between charts the card turns on its vertical axis until
 * it is a thin line, edge-on, and opens on the next chart from the other side; nothing else in the frame moves. Inside
 * each chart the bars grow up one after another, and the page dots at the top advance with each turn.
 *
 * Numbers taken from the reference (30 fps): the turn is ~0.5 s door to door (in 0.2 s, speeding up into the edge;
 * out 0.3 s, a strong ease-out that settles softly, no bounce); bars grow ~0.45 s each, the next starting ~0.25 s
 * after the last, strong ease-out; a chart holds ~3.5 s before the next turn.
 *
 * Use: <EdgeTurnCard pages={[{ frames, render: (local) => ... }]} /> with `GrowBars` and `StatTile` inside a page.
 * Worked example: src/trials/proof-edge-turn.tsx (ProofEdgeTurn-4x5), degree progress then professors, from the demo.
 */
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { INTER } from "../parts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// motion: the reference's moves land hard and settle (strong ease-out); the turn speeds up into the edge (ease-in).
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const IN = Easing.bezier(0.55, 0, 0.85, 0.35);

export const EDGE_TURN = { turnIn: 6, turnOut: 9, barGrow: 14, barStagger: 8 } as const;

export type EdgePage = { frames: number; render: (local: number) => React.ReactNode };

/** Frame each page starts (after its turn has opened it), for timing sound or captions. */
export const edgeTurnTimes = (pages: EdgePage[]) => {
  const out: number[] = [];
  let t = 0;
  for (const p of pages) {
    out.push(t);
    t += p.frames;
  }
  return out;
};

export const EdgeTurnCard: React.FC<{
  pages: EdgePage[];
  width: number;
  height: number;
  /** Card colour. */
  fill?: string;
  /** The page dots' accent. */
  accent?: string;
  /** Top-right mark (a logo), optional. */
  mark?: React.ReactNode;
  radius?: number;
  /** Frames the first page takes to arrive (a rise from below). 0 = already there at frame 0. */
  enter?: number;
}> = ({ pages, width, height, fill = "#0c0c0d", accent = "#D9202E", mark, radius = 26, enter = 0 }) => {
  const f = useCurrentFrame();
  const starts = edgeTurnTimes(pages);
  let i = 0;
  for (let j = 0; j < pages.length; j++) if (f >= starts[j] - EDGE_TURN.turnIn) i = j;
  // the turn that opens page i: it closes the last page from turnIn frames before starts[i], opens from starts[i]
  const s = starts[i];
  let ry = 0;
  let showing = i;
  if (i > 0 && f < s) {
    ry = interpolate(f, [s - EDGE_TURN.turnIn, s], [0, 90], { ...clamp, easing: IN });
    showing = i - 1;
  } else if (i > 0) {
    ry = interpolate(f, [s, s + EDGE_TURN.turnOut], [-90, 0], { ...clamp, easing: OUT });
  }
  const dip = 1 - 0.04 * Math.sin((Math.abs(ry) / 90) * (Math.PI / 2));
  const rise = enter > 0 ? interpolate(f, [0, enter], [1, 0], { ...clamp, easing: OUT }) : 0;
  const local = f - starts[showing];
  const dots = pages.length > 1 ? pages.length : 0;
  return (
    <div style={{ width, height, perspective: 2400 }}>
      <div style={{ position: "relative", width, height, borderRadius: radius, background: fill, overflow: "hidden",
        transform: `translateY(${rise * 120}px) rotateY(${ry}deg) scale(${dip})`, opacity: 1 - rise,
        boxShadow: "0 30px 80px rgba(0,0,0,0.18)" }}>
        {pages[showing].render(local)}
        {dots > 0 && (
          <div style={{ position: "absolute", top: 22, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8,
            padding: "7px 10px", borderRadius: 20, background: "rgba(255,255,255,0.08)" }}>
            {Array.from({ length: dots }).map((_, d) => (
              <div key={d} style={{ width: d === showing ? 22 : 9, height: 9, borderRadius: 5,
                background: d === showing ? accent : "rgba(255,255,255,0.3)" }} />
            ))}
          </div>
        )}
        {mark && <div style={{ position: "absolute", top: 22, right: 26 }}>{mark}</div>}
      </div>
    </div>
  );
};

export type Bar = { value: number; label: string; valueText: string; color: string; ink?: string };

/** Bars that grow up one after another inside a dark panel, each label riding its top. */
export const GrowBars: React.FC<{
  bars: Bar[];
  local: number;
  max: number;
  width: number;
  height: number;
  start?: number;
}> = ({ bars, local, max, width, height, start = 8 }) => {
  const gap = 16;
  const bw = (width - 48 - gap * (bars.length - 1)) / bars.length;
  return (
    <div style={{ position: "relative", width, height, borderRadius: 18, background: "rgba(255,255,255,0.06)" }}>
      {bars.map((b, i) => {
        const g = interpolate(local, [start + i * EDGE_TURN.barStagger, start + i * EDGE_TURN.barStagger + EDGE_TURN.barGrow], [0, 1], { ...clamp, easing: OUT });
        const h = ((height - 90) * b.value * g) / max;
        return (
          <div key={i} style={{ position: "absolute", left: 24 + i * (bw + gap), bottom: 48, width: bw, height: h, background: b.color,
            borderRadius: 6, opacity: g > 0 ? 1 : 0 }}>
            <div style={{ position: "absolute", left: 12, top: 10, fontFamily: INTER, fontWeight: 600, fontSize: 24, color: b.ink ?? "#ffffff",
              opacity: interpolate(g, [0.5, 1], [0, 1], clamp), letterSpacing: "-0.02em" }}>{b.valueText}</div>
            <div style={{ position: "absolute", left: 0, bottom: -36, width: bw + 40, fontFamily: INTER, fontWeight: 500, fontSize: 19,
              color: "rgba(255,255,255,0.62)", opacity: interpolate(g, [0.2, 0.8], [0, 1], clamp), whiteSpace: "nowrap" }}>{b.label}</div>
          </div>
        );
      })}
    </div>
  );
};

/** The small stat tile at the card's lower left (the reference's "87.2%"), its number counting up as it arrives. */
export const StatTile: React.FC<{ local: number; value: number; decimals?: number; suffix?: string; label: string; at?: number }> = ({
  local, value, decimals = 0, suffix = "", label, at = 4,
}) => {
  const t = interpolate(local, [at, at + 22], [0, 1], { ...clamp, easing: OUT });
  return (
    <div style={{ padding: "18px 22px", borderRadius: 18, background: "rgba(255,255,255,0.08)", opacity: interpolate(local, [at, at + 6], [0, 1], clamp),
      transform: `translateY(${(1 - t) * 14}px)` }}>
      <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 58, color: "#ffffff", letterSpacing: "-0.04em", lineHeight: 1 }}>
        {(value * t).toFixed(decimals)}{suffix}
      </div>
      <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 19, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>{label}</div>
    </div>
  );
};
