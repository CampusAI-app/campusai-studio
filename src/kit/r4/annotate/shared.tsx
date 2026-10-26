/**
 * Helpers the annotate group shares (round 4, 2026-10-25). Kept in this folder so the kit is not edited.
 *
 * - `readFramesFor(text)`: the studio reading rule (letters / 15 + 1.5 s, never under 1.8 s) in frames at 30 fps.
 * - `CaptionBand`: one short line in the band BELOW the footage (captions never sit on live UI), Inter because
 *   it names a thing in the product in the product's own words, with one small accent dot as its leader.
 * - `LitCrop`: the page image laid out exactly as PageView lays it, clipped to a rect, for "this part stays
 *   lit" layers. Sized by layout, never by transform: scale.
 * - `featherMask`: a soft-edged rounded-rect mask as an SVG data URI (a Gaussian blur on the shape), the way
 *   spotlight-hero-card cuts its card-shaped soft hole (a tight blur plus a faint wide spill).
 */
import React from "react";
import { Img, interpolate } from "remotion";
import type { Brand } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { toCanvas } from "../../camera";
import { INTER } from "../../parts";
import { EASE } from "../../../lib/anim";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const FPS = 30;

/** The reading rule, in frames: letters / 15 + 1.5 s, never under 1.8 s. */
export const readFramesFor = (text: string) => Math.ceil(Math.max(1.8, text.replace(/\s+/g, "").length / 15 + 1.5) * FPS);

export const padRect = (r: Rect, p: number): Rect => ({ x: r.x - p, y: r.y - p, w: r.w + p * 2, h: r.h + p * 2 });
export const mixRect = (a: Rect, b: Rect, k: number): Rect => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  w: a.w + (b.w - a.w) * k,
  h: a.h + (b.h - a.h) * k,
});

/** The page image placed as PageView places it (canvas px), clipped to `clip` (canvas px). */
export const LitCrop: React.FC<{
  src: string;
  page: Size;
  cam: PageCam;
  view: Rect;
  clip: Rect;
  radius?: number;
  style?: React.CSSProperties;
}> = ({ src, page, cam, view, clip, radius = 0, style }) => {
  const o = toCanvas(cam, view, 0, 0);
  const s = view.w / cam.cw;
  return (
    <div style={{ position: "absolute", left: clip.x, top: clip.y, width: clip.w, height: clip.h, borderRadius: radius, overflow: "hidden", ...style }}>
      <Img src={src} style={{ position: "absolute", left: o.x - clip.x, top: o.y - clip.y, width: page.w * s, height: page.h * s, maxWidth: "none" }} />
    </div>
  );
};

/**
 * A soft rounded-rect mask over a box of size w x h (canvas px): the hole `r` (box-local) fully white,
 * feathered by `feather` px, plus a faint wider spill (`spill` alpha, blurred 2.6x) so the light falls off
 * around it rather than stopping at an edge.
 */
export const featherMask = (w: number, h: number, r: Rect, rx: number, feather: number, spill = 0.16) => {
  const f = Math.max(0.5, feather);
  const sp = f * 2.6;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(0)}" height="${h.toFixed(0)}" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}">` +
    `<defs><filter id="a" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f.toFixed(2)}"/></filter>` +
    `<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sp.toFixed(2)}"/></filter></defs>` +
    `<rect x="${(r.x - sp).toFixed(1)}" y="${(r.y - sp).toFixed(1)}" width="${(r.w + sp * 2).toFixed(1)}" height="${(r.h + sp * 2).toFixed(1)}" rx="${(rx + sp).toFixed(1)}" fill="white" fill-opacity="${spill}" filter="url(#b)"/>` +
    `<rect x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.w.toFixed(1)}" height="${r.h.toFixed(1)}" rx="${rx.toFixed(1)}" fill="white" filter="url(#a)"/>` +
    `</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};

/** One short line in the caption band below the footage. Shows from `from` to `to` (frames). */
export const CaptionBand: React.FC<{
  text: string;
  f: number;
  from: number;
  to: number;
  brand: Brand;
  /** Centre line of the band on the canvas, and type size. */
  y: number;
  size?: number;
}> = ({ text, f, from, to, brand, y, size = 46 }) => {
  if (f < from - 1 || f > to + 12) return null;
  const inK = interpolate(f, [from, from + 12], [0, 1], { ...clamp, easing: EASE });
  const outK = interpolate(f, [to, to + 10], [0, 1], { ...clamp, easing: EASE });
  const dot = interpolate(f, [from + 2, from + 10], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y - size * 0.7, height: size * 1.4, display: "flex", justifyContent: "center", alignItems: "center",
      opacity: inK * (1 - outK), transform: `translateY(${(1 - inK) * 16 - outK * 8}px)` }}>
      <div style={{ width: size * 0.28, height: size * 0.28, borderRadius: "50%", background: brand.color.accent, marginRight: size * 0.42, opacity: dot,
        boxShadow: `0 0 ${size * 0.4}px rgba(${brand.color.glowRgb}, 0.55)` }} />
      <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: size, letterSpacing: "-0.02em", color: brand.color.ink, whiteSpace: "nowrap" }}>{text}</div>
    </div>
  );
};
