/**
 * Parts for SpotlightFilm round 2 (2026-10-19 evening). Only the Spotlight film imports this.
 *
 * - Studio: the background. Round 1 sat on the kit Atmosphere (a drifting red bloom), which Jacob's
 *   round-2 notes call AI-looking. This is the dark photo-studio floor Raylight's device templates
 *   put a laptop on ("MacBook template", "Macbook pro around Linear"): near-black, one soft overhead
 *   light pool where the device sits, a faint warm-red floor bounce, a vignette, and moving film
 *   grain. Grain lives only here, never over the product.
 * - shot(): a RealLaptop camera that looks square-on at a point of the open screen, expressed in the
 *   capture's own CSS pixels, so a measured DOM box lands exactly where the film wants it.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { onScreen, type CamKey } from "./real-laptop";

export const BG = "#0b0708";
const W = 1080;
const H = 1920;

/* ------------------------------------------------------------------ the studio */

const grain = (seed: number) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='${seed}' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")`;

/** `poolY` is where the light pool sits (frame px), `lit` 0..1 how much of it is on. */
export const Studio: React.FC<{ poolY: number; lit: number }> = ({ poolY, lit }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      {/* the overhead softbox's pool on the desk: neutral, warm, wide and soft */}
      <div style={{ position: "absolute", left: -360, right: -360, top: poolY - 700, height: 1400, borderRadius: "50%", opacity: lit,
        background: "radial-gradient(closest-side, rgba(255,236,232,.085), rgba(255,236,232,.035) 45%, rgba(255,236,232,0) 100%)" }} />
      {/* a low red bounce off the floor, the brand colour kept as light rather than as a shape */}
      <div style={{ position: "absolute", left: -200, right: -200, top: H - 760, height: 1100, borderRadius: "50%",
        background: "radial-gradient(closest-side, rgba(217,32,46,.16), rgba(217,32,46,.05) 55%, rgba(217,32,46,0) 100%)" }} />
      {/* vignette, the lens falling off at the corners */}
      <AbsoluteFill style={{ background: "radial-gradient(120% 85% at 50% 52%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)" }} />
      {/* film grain, a new pattern every other frame */}
      <AbsoluteFill style={{ backgroundImage: grain(1 + (Math.floor(f / 2) % 9)), backgroundSize: "240px 240px", opacity: 0.07, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};

/** A realistic contact shadow for a floating capture: tight and dark near, wide and faint far. No glow. */
export const liftShadow = (k: number) =>
  `0 ${2 * k}px ${4 * k}px rgba(0,0,0,${0.35 * k}), 0 ${18 * k}px ${40 * k}px rgba(0,0,0,${0.45 * k}), 0 ${60 * k}px ${120 * k}px rgba(0,0,0,${0.5 * k})`;

/* ------------------------------------------------------------------ cameras on the glass */

/** Glass width / height, as onScreen assumes it, and the captures' CSS viewport. */
const GLASS_ASPECT = 1.55;
const VW = 1440;
const VH = 900;
/** The texture covers the glass: a 16:10 capture is cropped a little at the sides. */
const FRAC = GLASS_ASPECT / (VW / VH);
const SX0 = (1 - FRAC) / 2;
const u = (x: number) => (x / VW - SX0) / FRAC;
const v = (y: number) => y / VH;

/**
 * A square-on camera that puts capture point (x, y) (CSS px of the 1440x900 page) at frame point
 * (X, Y), at `k` frame pixels per CSS pixel.
 */
export const shot = (x: number, y: number, k: number, X = W / 2, Y = H / 2): Omit<CamKey, "at"> => {
  const fill = (k * VW * FRAC) / W; // glass width as a fraction of the frame width
  const ut = u(x) - (X - W / 2) / (fill * W);
  const vt = v(y) - ((Y - H / 2) * GLASS_ASPECT) / (fill * W);
  return onScreen(ut, vt, fill, W / H, 30, GLASS_ASPECT);
};

/** Where capture point (x, y) lands in the frame under shot(cx, cy, k, X, Y). */
export const onFrame = (x: number, y: number, cx: number, cy: number, k: number, X = W / 2, Y = H / 2) => ({
  x: X + (x - cx) * k,
  y: Y + (y - cy) * k,
});

type V3 = [number, number, number];
/** A pose by direction and distance, for the three-quarter and above shots. */
export const pose = (dir: V3, target: V3, dist: number, fov = 30): Omit<CamKey, "at"> => {
  const n = Math.hypot(...dir);
  return { pos: [target[0] + (dir[0] / n) * dist, target[1] + (dir[1] / n) * dist, target[2] + (dir[2] / n) * dist], target, fov };
};
