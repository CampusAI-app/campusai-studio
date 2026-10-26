/**
 * Shared pieces for the r4 transitions group (CardOpensPage, MaskHandoff, DeckSwap), kept in this folder so the
 * kit index is not touched (r4 brief). Every position is in PAGE px of a captured campusai-demo page (1440 CSS
 * wide, DPR 2) unless it says canvas.
 *
 *   PageSide    one end of a handoff: the page image, its size, the camera it rests on, the sidebar colour that
 *               paints out the Maryland mark (null when the framing never reaches it).
 *   PageMapped  a page drawn with an explicit page-to-canvas mapping (origin + scale), clipped to a canvas rect
 *               with a rounded corner by clip-path (crisp, no overflow+radius layer). The handoffs need this
 *               because their window is not the view, so PageView's camera cannot draw them.
 *   PieceAt     a piece of a page (page rect) laid out at a canvas rect: a resize, never transform: scale.
 *   regionOf    the page region a camera shows in a view; mapRegion the mapping that lays a region onto a rect.
 */
import React from "react";
import { Img, interpolate } from "remotion";
import type { PageCam, Rect, Size } from "../../camera";
import { rectOnCanvas, toCanvas } from "../../camera";
import { MARK_BOX } from "../../pass/camera/shared";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type PageSide = {
  /** The page image (staticFile path or URL). */
  src: string;
  page: Size;
  /** The camera this side rests on. */
  cam: PageCam;
  /** The camera it eases toward while it is the only page on screen (so no frame is a freeze). */
  drift?: PageCam;
  /** Sidebar colour behind the Maryland mark, sampled from this capture ("rgb(33, 21, 21)" on most pass pages,
   *  "rgb(29, 20, 21)" on job-goldman). null when the framing never shows the sidebar's top left. */
  mark: string | null;
};

/** A page-to-canvas mapping: canvas = (x, y) + page * s. */
export type PageMap = { x: number; y: number; s: number };

export const camMap = (cam: PageCam, view: Rect): PageMap => {
  const o = toCanvas(cam, view, 0, 0);
  return { x: o.x, y: o.y, s: o.s };
};

export const onMap = (m: PageMap, r: Rect): Rect => ({ x: m.x + r.x * m.s, y: m.y + r.y * m.s, w: r.w * m.s, h: r.h * m.s });

/** The page region a camera shows in a view. */
export const regionOf = (cam: PageCam, view: Rect): Rect => {
  const h = cam.cw * (view.h / view.w);
  return { x: cam.cx - cam.cw / 2, y: cam.cy - h / 2, w: cam.cw, h };
};

/** The mapping that lays page region `r` onto canvas rect `to`: widths match, centres match. */
export const mapRegion = (r: Rect, to: Rect): PageMap => {
  const s = to.w / r.w;
  return { s, x: to.x + to.w / 2 - (r.x + r.w / 2) * s, y: to.y + to.h / 2 - (r.y + r.h / 2) * s };
};

/** The camera that shows the same page region as `m` does inside `view`. */
export const camOfMap = (m: PageMap, view: Rect): PageCam => {
  const cw = view.w / m.s;
  return { cw, cx: (view.x + view.w / 2 - m.x) / m.s, cy: (view.y + view.h / 2 - m.y) / m.s };
};

export const mixRect = (a: Rect, b: Rect, k: number): Rect => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  w: a.w + (b.w - a.w) * k,
  h: a.h + (b.h - a.h) * k,
});

export const mixCam = (a: PageCam, b: PageCam, k: number): PageCam => ({
  cx: a.cx + (b.cx - a.cx) * k,
  cy: a.cy + (b.cy - a.cy) * k,
  cw: a.cw + (b.cw - a.cw) * k,
});

/** The same camera wider by `k` (k > 1 pulls back), with page point (px, py) held where it was on the canvas. */
export const widenAbout = (cam: PageCam, view: Rect, px: number, py: number, k: number): PageCam => {
  const a = toCanvas(cam, view, px, py);
  const cw = cam.cw * k;
  const s = view.w / cw;
  return { cw, cx: px - (a.x - view.x - view.w / 2) / s, cy: py - (a.y - view.y - view.h / 2) / s };
};

/** A side's camera at frame f: rest at 0, easing linearly toward `drift` by frame `until`. */
export const driftCam = (side: PageSide, f: number, from: number, until: number): PageCam => {
  if (!side.drift) return side.cam;
  return mixCam(side.cam, side.drift, interpolate(f, [from, until], [0, 1], clamp));
};

/** CSS clip-path for a rounded canvas rect. Coordinates are relative to the element the clip is on (the canvas). */
export const roundClip = (r: Rect, radius: number, canvas: Size) =>
  `inset(${r.y.toFixed(2)}px ${(canvas.w - r.x - r.w).toFixed(2)}px ${(canvas.h - r.y - r.h).toFixed(2)}px ${r.x.toFixed(2)}px round ${Math.max(0, radius).toFixed(2)}px)`;

/** A page drawn through a mapping, clipped to a rounded canvas rect. `children` draw in canvas px on top. */
export const PageMapped: React.FC<{
  src: string;
  page: Size;
  map: PageMap;
  clip: Rect;
  radius: number;
  canvas: Size;
  mark: string | null;
  opacity?: number;
  /** 0 to 1: darken the page (no blur, so the edge and the page stay crisp). */
  dim?: number;
  children?: React.ReactNode;
}> = ({ src, page, map, clip, radius, canvas, mark, opacity = 1, dim = 0, children }) => {
  const m = onMap(map, MARK_BOX);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: canvas.w, height: canvas.h, clipPath: roundClip(clip, radius, canvas), opacity }}>
      <Img src={src} style={{ position: "absolute", left: map.x, top: map.y, width: page.w * map.s, height: page.h * map.s, maxWidth: "none",
        filter: dim ? `brightness(${(1 - dim * 0.7).toFixed(3)})` : undefined }} />
      {mark ? <div style={{ position: "absolute", left: m.x, top: m.y, width: m.w, height: m.h, background: mark, filter: dim ? `brightness(${(1 - dim * 0.7).toFixed(3)})` : undefined }} /> : null}
      {children}
    </div>
  );
};

/** A piece of a page (`from`, page px) laid out at canvas rect `to`, keeping its own aspect: width fits, top aligns. */
export const PieceAt: React.FC<{
  src: string;
  page: Size;
  from: Rect;
  to: Rect;
  /** Stretch to `to` exactly instead of keeping the aspect (only for a piece and target of the same shape). */
  fill?: boolean;
  style?: React.CSSProperties;
}> = ({ src, page, from, to, fill = false, style }) => {
  const sx = to.w / from.w;
  const sy = fill ? to.h / from.h : sx;
  return (
    <div style={{ position: "absolute", left: to.x, top: to.y, width: to.w, height: to.h, overflow: "hidden", ...style }}>
      <Img src={src} style={{ position: "absolute", left: -from.x * sx, top: -from.y * sy, width: page.w * sx, height: page.h * sy, maxWidth: "none" }} />
    </div>
  );
};

/** A page rect on the canvas through a camera (re-exported for the parts). */
export const onCam = rectOnCanvas;

/** A hex colour at an alpha. */
export const hexA = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
