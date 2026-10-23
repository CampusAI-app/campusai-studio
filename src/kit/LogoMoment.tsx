/**
 * The two logo moments every piece has (Jacob, 2026-10-22: the logo near the start, always at the end).
 *
 * LogoOpen: the logo arrives out of a blur in 10 frames with the brand glow, and either leaves or
 * settles into a small mark it holds (the Job Match watermark). From the Flock film's opening.
 * LogoEnd: a focus pull onto the logo, then a hold that never goes fully still. From the how-to
 * film's ending (ui-strip-away-outro).
 * Both take `at` in frames and read the brand's own logo and glow.
 */
import React from "react";
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "./brand";
import { glow } from "./brand";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SNAP = Easing.bezier(0.22, 1, 0.36, 1);
const SETTLE = Easing.bezier(0.6, 0, 0.18, 1);

export const LogoOpen: React.FC<{
  brand: Brand;
  at: number;
  /** Centre and width on arrival, canvas px. */
  x: number;
  y: number;
  width: number;
  /** Settle into a held mark at this frame (centre and width), or leave at `leaveAt`. */
  settle?: { at: number; x: number; y: number; width: number };
  leaveAt?: number;
}> = ({ brand, at, x, y, width, settle, leaveAt }) => {
  const f = useCurrentFrame();
  if (!brand.logo || f < at) return null;
  const inK = interpolate(f, [at, at + 10], [0, 1], { ...clamp, easing: SNAP });
  const st = settle ? interpolate(f, [settle.at, settle.at + 16], [0, 1], { ...clamp, easing: SETTLE }) : 0;
  const out = leaveAt === undefined ? 0 : interpolate(f, [leaveAt, leaveAt + 8], [0, 1], clamp);
  const w = settle ? width + (settle.width - width) * st : width;
  const cx = settle ? x + (settle.x - x) * st : x;
  const cy = settle ? y + (settle.y - y) * st : y;
  const s = 1.06 - 0.06 * inK;
  const g = 1 - 0.6 * st;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - w / brand.logo.ratio / 2, width: w, opacity: inK * (1 - out),
      transform: `scale(${s.toFixed(4)})`,
      filter: `blur(${((1 - inK) * 16).toFixed(2)}px) drop-shadow(0 0 ${(30 * g).toFixed(1)}px ${glow(brand, 0.6 * g)})` }}>
      <Img src={staticFile(brand.logo.onDark)} style={{ width: "100%", height: "auto", display: "block" }} />
    </div>
  );
};

export const LogoEnd: React.FC<{
  brand: Brand;
  at: number;
  x: number;
  y: number;
  width: number;
}> = ({ brand, at, x, y, width }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!brand.logo || f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 90 } });
  // the hold keeps breathing: 1% over four seconds, so the last frame is never a freeze
  const drift = interpolate(f, [at + 20, at + 20 + fps * 4], [0, 0.01], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, width, transform: `translate(-50%, -50%) scale(${(0.86 + 0.14 * p + drift).toFixed(4)})`,
      opacity: Math.min(1, p * 1.4), filter: `${p < 0.995 ? `blur(${((1 - p) * 9).toFixed(2)}px) ` : ""}drop-shadow(0 0 40px ${glow(brand, 0.45 * p)})` }}>
      <Img src={staticFile(brand.logo.onDark)} style={{ display: "block", width: "100%", height: "auto" }} />
    </div>
  );
};
