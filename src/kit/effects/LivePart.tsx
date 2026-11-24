/**
 * LivePart (2026-11-24, keynote monitor round 2): a real CampusAI component that ARRIVES instead of sitting there as a
 * screenshot. Jacob on round 1: "It's clearly a screenshot, and I like showing the data flowing."
 *
 * The pixels are the real page's, cut out by `films/post-keynote-monitor/capture-parts.mjs`: the component's own shot
 * (full.png), the same with its rows hidden (frame.png, the empty card), each row's box, and rows with numbers re-shot as
 * the numbers count from 0 (the way labs/page-motion's countUp sets the text node). The motion is the lab's two-beat
 * arrival (`createArrival` in labs/page-motion/src/components/layout/page-motion.ts), slowed to film reading pace:
 * the frame settles in (rises 12px, 0.99 to 1), then its rows fill in one by one (rise 4px), numbers count with an
 * ease-out cubic once their row is in, and a bar row draws in from the left.
 *
 * `liveTimes()` returns the frame each row starts, so a film can put a sound on every row landing.
 */
import React from "react";
import { Easing, Img, interpolate, staticFile } from "remotion";

export type LiveLine = { x: number; y: number; w: number; h: number; text?: string };
export type LiveManifest = {
  w: number;
  h: number;
  dpr: number;
  radius: string;
  lines: LiveLine[];
  bars: { x: number; y: number; w: number; h: number }[];
  counts: Record<string, string[]>;
  after?: { x: number; y: number; w: number; h: number; press: string } | null;
};

export type LiveTiming = { start: number; frameDur?: number; fillAfter?: number; step?: number; lineDur?: number; countDur?: number; order?: number[] };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const CUBIC = (t: number) => 1 - Math.pow(1 - t, 3);

/** Reading order: top to bottom (12px rows), then left to right, the lab's `readingOrder`. */
export const readingOrder = (m: LiveManifest) =>
  m.lines.map((_, i) => i).sort((a, b) => {
    const A = m.lines[a], B = m.lines[b];
    return Math.abs(A.y - B.y) > 12 ? A.y - B.y : A.x - B.x;
  });

/** The frame each row starts filling in, in row index order. */
export const liveTimes = (m: LiveManifest, t: LiveTiming) => {
  const order = t.order ?? readingOrder(m);
  const fillAt = t.start + (t.fillAfter ?? 8);
  const step = t.step ?? 3;
  const at: number[] = new Array(m.lines.length).fill(Infinity);
  order.forEach((li, j) => (at[li] = fillAt + j * step));
  return at;
};

export const LivePart: React.FC<{
  f: number;
  dir: string; // under public/, e.g. "post-keynote-monitor/parts/brief"
  m: LiveManifest;
  scale: number;
  timing: LiveTiming;
  radius?: number; // CSS px of the page, overrides the captured one (a cut-out first row of a list, say)
  /** After this frame the whole part crossfades to after.png (the page after a real press), over 4 frames. */
  swapAt?: number;
  shadow?: boolean;
}> = ({ f, dir, m, scale: s, timing, radius, swapAt, shadow = true }) => {
  const frameDur = timing.frameDur ?? 14;
  const lineDur = timing.lineDur ?? 11;
  const countDur = timing.countDur ?? 22;
  const a = interpolate(f, [timing.start, timing.start + frameDur], [0, 1], { ...clamp, easing: OUT });
  // on a light slide a fading dark card passes through grey, so its opacity lands in 2 frames while it keeps settling
  const op = interpolate(f, [timing.start, timing.start + 2], [0, 1], clamp);
  const at = liveTimes(m, timing);
  const W = m.w * s, H = m.h * s;
  const br = radius !== undefined ? `${radius * s}px` : m.radius.split(" ").map((v) => `${parseFloat(v) * s}px`).join(" ");
  const full = staticFile(`${dir}/full.png`);
  const isBar = (l: LiveLine) => m.bars.some((b) => b.x >= l.x - 1 && b.y >= l.y - 1 && b.x + b.w <= l.x + l.w + 1 && b.y + b.h <= l.y + l.h + 1);
  const swap = swapAt === undefined ? 0 : interpolate(f, [swapAt, swapAt + 4], [0, 1], clamp);
  if (a <= 0) return <div style={{ width: W, height: H }} />;
  return (
    <div style={{ position: "relative", width: W, height: H, opacity: op, transform: `translateY(${(1 - a) * 12 * s}px) scale(${0.99 + 0.01 * a})`, transformOrigin: "50% 100%" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: br, overflow: "hidden", boxShadow: shadow ? `0 ${18 * s}px ${44 * s}px rgba(0,0,0,0.22), 0 ${2 * s}px ${6 * s}px rgba(0,0,0,0.12)` : undefined }}>
        <Img src={staticFile(`${dir}/frame.png`)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />
        {m.lines.map((l, i) => {
          const t0 = at[i];
          const p = interpolate(f, [t0, t0 + lineDur], [0, 1], { ...clamp, easing: OUT });
          if (p <= 0) return null;
          const bar = isBar(l);
          const shots = m.counts[String(i)];
          let src = full;
          if (shots && shots.length) {
            const c = interpolate(f, [t0 + 2, t0 + 2 + countDur], [0, 1], clamp);
            src = staticFile(`${dir}/${shots[Math.round(CUBIC(c) * (shots.length - 1))]}`);
          }
          const isShot = shots && shots.length;
          return (
            <div key={i} style={{ position: "absolute", left: l.x * s, top: l.y * s, width: l.w * s, height: l.h * s, overflow: "hidden",
              opacity: bar ? 1 : p, transform: bar ? undefined : `translateY(${(1 - p) * 4 * s}px)`,
              clipPath: bar ? `inset(0 ${(1 - interpolate(f, [t0, t0 + 16], [0, 1], { ...clamp, easing: OUT })) * 100}% 0 0)` : undefined }}>
              {isShot ? (
                <Img src={src} style={{ position: "absolute", left: 0, top: 0, width: l.w * s, height: l.h * s }} />
              ) : (
                <Img src={full} style={{ position: "absolute", left: -l.x * s, top: -l.y * s, width: W, height: H, maxWidth: "none" }} />
              )}
            </div>
          );
        })}
        {swap > 0 ? <Img src={staticFile(`${dir}/after.png`)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: swap }} /> : null}
      </div>
    </div>
  );
};
