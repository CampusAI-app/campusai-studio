/**
 * DrawnMark (round 4, 2026-10-25): a hand-drawn circle, underline or arrow that draws itself onto a real
 * element of a real page, holds, then fades. Brand red only. The mark is computed in page px from the
 * element's measured box, so it stays glued to the page while the camera drifts.
 *
 * Where it came from: the annotation half of the shelf shot `scanline-annotate-focus` (marks that appear on
 * the exact element they explain) plus the dictionary's "hand-drawn annotation / marker circle": a stroke
 * that grows along its path at pen speed (slow start, fast middle, a soft stop), never a fade-in.
 *
 * The imperfection is seeded, so a mark looks the same every render:
 * - circle: an ellipse 16 page px outside the box, started at the upper left, swept 385 degrees so its end
 *   overshoots past the start, the radius growing 7% across the sweep (the pen spirals out), two low
 *   wobbles (4% and 2.5%), tilted 3 degrees,
 * - underline: a hair under the text, rising 4 page px left to right with a slight belly and a small hook
 *   up at the end,
 * - arrow: a curved shaft (bend 0.2 of its length) from `from` to 10 page px short of the box, then the two
 *   head strokes, drawn after the shaft.
 * Numbers (30 fps): draw 16 frames for a circle, 12 an underline, 18 an arrow (shaft 70%, head 30%) on
 * bezier(0.45, 0, 0.2, 1); stroke 6.5 canvas px round-capped with a 2 px pen-drag second pass at 35%;
 * hold 40 frames; fade 10 frames.
 */
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { camAlong, clampCam, toCanvas } from "../../camera";
import { PageView } from "../../PageView";
import type { MarkPatchSpec } from "../../pass/camera/shared";
import { MarkPatch } from "../../pass/camera/shared";
import { clamp } from "./shared";

const PEN = Easing.bezier(0.45, 0, 0.2, 1);
type Pt = { x: number; y: number };

export type DrawnMarkSpec = {
  kind: "circle" | "underline" | "arrow";
  /** The element, page px. */
  rect: Rect;
  /** Frame the pen starts. */
  at: number;
  draw?: number;
  hold?: number;
  fade?: number;
  /** Arrow tail, page px. Default 150 left and 110 below the box. */
  from?: Pt;
  /** Arrow tip, page px: the point on the element it lands on (pulled back 10 px). Default: where the line
   *  from the tail to the element's centre meets its box. */
  aim?: Pt;
  /** Arrow shaft bend as a share of its length, signed (positive bows to the left of travel). Default 0.2. */
  bend?: number;
  /** Changes the wobble. */
  seed?: number;
};

const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** The mark's polylines in page px (an arrow has three: shaft, then the two head strokes). */
export const markPaths = (m: DrawnMarkSpec): Pt[][] => {
  const s = m.seed ?? 1;
  const { x, y, w, h } = m.rect;
  if (m.kind === "circle") {
    const cx = x + w / 2;
    const cy = y + h / 2 + 1;
    const rx = w / 2 + 16;
    const ry = h / 2 + 14;
    const tilt = (-3 * Math.PI) / 180;
    const a0 = (-160 * Math.PI) / 180;
    const sweep = (385 * Math.PI) / 180;
    const p1 = rnd(s) * 6;
    const p2 = rnd(s + 1) * 6;
    const pts: Pt[] = [];
    const N = 96;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = a0 + sweep * t;
      const g = 1 + 0.07 * t + 0.04 * Math.sin(2 * a + p1) + 0.025 * Math.sin(3 * a + p2);
      const ex = Math.cos(a) * rx * g;
      const ey = Math.sin(a) * ry * g;
      pts.push({ x: cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), y: cy + ex * Math.sin(tilt) + ey * Math.cos(tilt) });
    }
    return [pts];
  }
  if (m.kind === "underline") {
    const x0 = x - 6;
    const x1 = x + w + 8;
    const yb = y + h + 6;
    const ph = rnd(s) * 6;
    const pts: Pt[] = [];
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const hook = t > 0.94 ? -(((t - 0.94) / 0.06) ** 2) * 7 : 0;
      pts.push({ x: x0 + (x1 - x0) * t + (t > 0.94 ? -((t - 0.94) / 0.06) * 3 : 0), y: yb - 4 * t + 2.2 * Math.sin(Math.PI * t) + 0.9 * Math.sin(9 * t + ph) + hook });
    }
    return [pts];
  }
  // arrow
  const tail = m.from ?? { x: x - 150, y: y + h + 110 };
  const c = { x: x + w / 2, y: y + h / 2 };
  // the tip: where the line from the tail to the centre meets the box, pulled back 10 px
  const dx = c.x - tail.x;
  const dy = c.y - tail.y;
  const tx = dx === 0 ? Infinity : Math.abs(w / 2 / dx);
  const ty = dy === 0 ? Infinity : Math.abs(h / 2 / dy);
  const hit = 1 - Math.min(tx, ty);
  const len = Math.hypot(dx, dy);
  const back = 10 / len;
  const tip = m.aim
    ? (() => {
        const ax = m.aim.x - tail.x;
        const ay = m.aim.y - tail.y;
        const al = Math.hypot(ax, ay);
        return { x: m.aim.x - (ax / al) * 10, y: m.aim.y - (ay / al) * 10 };
      })()
    : { x: tail.x + dx * (hit - back), y: tail.y + dy * (hit - back) };
  const L = Math.hypot(tip.x - tail.x, tip.y - tail.y);
  const nx = -(tip.y - tail.y) / L;
  const ny = (tip.x - tail.x) / L;
  const bend = (m.bend ?? 0.2) * L;
  const ctrl = { x: (tail.x + tip.x) / 2 + nx * bend, y: (tail.y + tip.y) / 2 + ny * bend };
  const shaft: Pt[] = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const u = 1 - t;
    shaft.push({ x: u * u * tail.x + 2 * u * t * ctrl.x + t * t * tip.x, y: u * u * tail.y + 2 * u * t * ctrl.y + t * t * tip.y });
  }
  // the head follows the shaft's last tangent
  const ang = Math.atan2(tip.y - ctrl.y, tip.x - ctrl.x);
  const hl = Math.min(26, L * 0.22);
  const head = (sgn: number): Pt[] => {
    const a = ang + Math.PI + sgn * (30 * Math.PI) / 180;
    const end = { x: tip.x + Math.cos(a) * hl, y: tip.y + Math.sin(a) * hl };
    return [end, { x: (end.x + tip.x) / 2 + sgn * 1.2, y: (end.y + tip.y) / 2 }, tip];
  };
  return [shaft, head(1), head(-1)];
};

const toD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

/** One mark, drawn in canvas px for the current camera. Put it inside a PageView (children are canvas px). */
export const DrawnMarkLayer: React.FC<{ mark: DrawnMarkSpec; cam: PageCam; view: Rect; brand: Brand; f: number; weight?: number }> = ({ mark, cam, view, brand, f, weight = 6.5 }) => {
  const draw = mark.draw ?? (mark.kind === "circle" ? 16 : mark.kind === "underline" ? 12 : 18);
  const hold = mark.hold ?? 40;
  const fade = mark.fade ?? 10;
  const end = mark.at + draw + hold;
  if (f < mark.at || f > end + fade) return null;
  const p = interpolate(f, [mark.at, mark.at + draw], [0, 1], { ...clamp, easing: PEN });
  const op = 1 - interpolate(f, [end, end + fade], [0, 1], clamp);
  const paths = markPaths(mark).map((pts) => pts.map((q) => toCanvas(cam, view, q.x, q.y)));
  // the arrow's shaft takes 70% of the draw, each head stroke 15%
  const parts = mark.kind === "arrow" ? [[0, 0.7], [0.7, 0.85], [0.85, 1]] : [[0, 1]];
  return (
    <svg width={2 * view.x + view.w} height={2 * view.y + view.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: op,
      filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.55))" }}>
      {paths.map((pts, i) => {
        const [a, b] = parts[i];
        const k = Math.max(0, Math.min(1, (p - a) / (b - a)));
        if (k <= 0) return null;
        const d = toD(pts);
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={brand.color.accent} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round"
              pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - k} />
            {/* the pen dragging: a thinner pass a hair off the main line */}
            <path d={d} fill="none" stroke={brand.color.accent} strokeOpacity={0.35} strokeWidth={weight * 0.32} strokeLinecap="round"
              pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - k} transform={`translate(${(weight * 0.35).toFixed(2)} ${(-weight * 0.3).toFixed(2)})`} />
          </g>
        );
      })}
    </svg>
  );
};

export type DrawnMarkProps = {
  src: string;
  page: Size;
  view: Rect;
  brand: Brand;
  /** Camera keys (frames). One key holds still. */
  cams: { t: number; cam: PageCam }[];
  marks: DrawnMarkSpec[];
  weight?: number;
  mark?: MarkPatchSpec | null;
};

/** A real page with marks drawn onto it in turn. */
export const DrawnMark: React.FC<DrawnMarkProps> = ({ src, page, view, brand, cams, marks, weight, mark = null }) => {
  const f = useCurrentFrame();
  const cam = clampCam(camAlong(f, cams), page, view);
  return (
    <PageView src={src} page={page} cam={cam} view={view} brand={brand}>
      <MarkPatch cam={cam} view={view} spec={mark} />
      {marks.map((m, i) => (
        <DrawnMarkLayer key={i} mark={m} cam={cam} view={view} brand={brand} f={f} weight={weight} />
      ))}
    </PageView>
  );
};
