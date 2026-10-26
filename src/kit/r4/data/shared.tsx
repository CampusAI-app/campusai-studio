/**
 * Helpers shared by the data parts (ListReRank, BlocksLand, TallyRoll), 2026-10-25. Kept in the group folder on
 * purpose (r4/BRIEF.md: a shared helper lives in your own folder). The film ground and the reading rule are the
 * readout group's, imported rather than redefined.
 *
 * - `Cut`: one rectangle of a capture drawn at a canvas rectangle, laid out larger (never transform-scaled), so a
 *   card, a button or a calendar block can travel and grow on its own.
 * - `Stretch`: a thin strip of a capture stretched across a wider rectangle, keeping the page's own vertical
 *   gradient. Used to clear a list or a cell back to the panel it sits on, in the panel's own pixels.
 * - `lerp`, `lerpRect`, `ease01`: small maths, pure functions of the frame.
 */
import React from "react";
import { Img } from "remotion";
import type { Rect, Size } from "../../camera";
import { EASE } from "../../../lib/anim";

export { Ground, readFrames, springStep } from "../../pass/readout/shared";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerpRect = (a: Rect, b: Rect, k: number): Rect => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) });
/** 0 before `a`, 1 after `a + len`, eased between. */
export const ease01 = (f: number, a: number, len: number, curve: (t: number) => number = EASE) =>
  f <= a ? 0 : f >= a + len ? 1 : curve((f - a) / len);

/**
 * `src` cut to `from` (page px of that image) and drawn at canvas rect `to`. `fit: "cover"` keeps the cut's own
 * aspect (one scale, cropped to the box, anchored by `align`), so text inside a piece that changes shape in flight
 * is never squashed; the default stretches it to the box.
 */
export const Cut: React.FC<{
  src: string;
  page: Size;
  from: Rect;
  to: Rect;
  radius?: number;
  opacity?: number;
  fit?: "stretch" | "cover";
  align?: "center" | "top-left";
  style?: React.CSSProperties;
}> = ({ src, page, from, to, radius = 0, opacity = 1, fit = "stretch", align = "center", style }) => {
  if (opacity <= 0.001 || to.w <= 0.5 || to.h <= 0.5) return null;
  let sx = to.w / from.w;
  let sy = to.h / from.h;
  let ox = 0;
  let oy = 0;
  if (fit === "cover") {
    const k = Math.max(sx, sy);
    if (align === "center") {
      ox = (to.w - from.w * k) / 2;
      oy = (to.h - from.h * k) / 2;
    }
    sx = k;
    sy = k;
  }
  return (
    <div style={{ position: "absolute", left: to.x, top: to.y, width: to.w, height: to.h, overflow: "hidden", borderRadius: radius, opacity, ...style }}>
      <Img src={src} style={{ position: "absolute", left: ox - from.x * sx, top: oy - from.y * sy, width: page.w * sx, height: page.h * sy, maxWidth: "none" }} />
    </div>
  );
};

/** A vertical strip (`strip`, page px) stretched across `to` (canvas), rows kept at their page height via `s`. */
export const Stretch: React.FC<{ src: string; page: Size; strip: Rect; area: Rect; to: Rect; s: number }> = ({ src, page, strip, area, to, s }) => {
  const sx = to.w / strip.w;
  return (
    <div style={{ position: "absolute", left: to.x, top: to.y, width: to.w, height: to.h, overflow: "hidden" }}>
      <Img src={src} style={{ position: "absolute", left: -strip.x * sx, top: -area.y * s, width: page.w * sx, height: page.h * s, maxWidth: "none" }} />
    </div>
  );
};
