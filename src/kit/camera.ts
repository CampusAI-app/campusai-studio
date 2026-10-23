/**
 * The page camera (2026-10-22): one way to move over a captured product page. Lifted from the
 * how-to film (speedrun/HowToFilm.tsx), which Jacob called smooth once it held one framing and let
 * the camera ease after the hand instead of jerking with it.
 *
 * A camera is the part of the PAGE in view: its centre (cx, cy) and width (cw), in page px. The
 * height follows from the view's shape. Smaller cw is a tighter shot. It is applied by laying the
 * page image out larger (a resize), never with transform: scale, which drops frames.
 */
import { interpolate } from "remotion";
import { EASE_CAMERA } from "../lib/anim";

export type Size = { w: number; h: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type PageCam = { cx: number; cy: number; cw: number };

/** Keep the view inside the page; a view wider (or taller) than the page centres on it. */
export const clampCam = (c: PageCam, page: Size, view: Size): PageCam => {
  const ch = c.cw * (view.h / view.w);
  const cx = c.cw >= page.w ? page.w / 2 : Math.min(page.w - c.cw / 2, Math.max(c.cw / 2, c.cx));
  const cy = ch >= page.h ? page.h / 2 : Math.min(page.h - ch / 2, Math.max(ch / 2, c.cy));
  return { cw: c.cw, cx, cy };
};

/** Straight blend of two cameras, k from 0 to 1. */
export const mixCam = (a: PageCam, b: PageCam, k: number): PageCam => ({
  cx: a.cx + (b.cx - a.cx) * k,
  cy: a.cy + (b.cy - a.cy) * k,
  cw: a.cw + (b.cw - a.cw) * k,
});

/** A camera moving through keyframes (t in seconds or frames, as long as it is consistent). */
export const camAlong = (t: number, keys: { t: number; cam: PageCam }[], easing = EASE_CAMERA): PageCam => {
  if (keys.length === 1 || t <= keys[0].t) return keys[0].cam;
  const last = keys[keys.length - 1];
  if (t >= last.t) return last.cam;
  const i = keys.findIndex((k, n) => t >= k.t && t < keys[n + 1].t);
  const a = keys[i];
  const b = keys[i + 1];
  const k = interpolate(t, [a.t, b.t], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
  return mixCam(a.cam, b.cam, k);
};

/**
 * A point averaged over its recent past, so a camera following a recorded cursor eases after it.
 * `lag` is the gap between samples, `n` how many: 6 samples 0.08 s apart is the how-to film's feel.
 */
export const followPoint = (at: (t: number) => { x: number; y: number }, t: number, lag = 0.08, n = 6) => {
  let x = 0;
  let y = 0;
  for (let i = 0; i < n; i++) {
    const p = at(Math.max(0, t - lag * i));
    x += p.x / n;
    y += p.y / n;
  }
  return { x, y };
};

/** Where a page point lands on the canvas, and the canvas px per page px (`s`). */
export const toCanvas = (cam: PageCam, view: Rect, x: number, y: number) => {
  const s = view.w / cam.cw;
  return { x: view.x + view.w / 2 + (x - cam.cx) * s, y: view.y + view.h / 2 + (y - cam.cy) * s, s };
};

/** A page rectangle on the canvas. */
export const rectOnCanvas = (cam: PageCam, view: Rect, r: Rect): Rect => {
  const p = toCanvas(cam, view, r.x, r.y);
  return { x: p.x, y: p.y, w: r.w * p.s, h: r.h * p.s };
};
