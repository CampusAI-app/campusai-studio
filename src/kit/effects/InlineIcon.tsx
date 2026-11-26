/**
 * Inline icon (2026-11-26, from Halmarr's Placed SaaS film, Muse Nov 26; Jacob: "let's put this in inspiration"). Read
 * frame by frame (Lucius's watch notes, Nov 26, 11.5 to 13.0 s); our own build.
 *
 * A headline with a gap in it, and a rounded app icon that drops into the gap ("Build your [icon] path"): the words
 * arrive first a touch apart, the icon falls in from above with a small overshoot and a soft glow, and the words close
 * up round it. The icon stands in for a word, so the line reads as a sentence and a picture at once. Use a real
 * icon (the app's own, a school mark), never a drawn stand-in. Worked example: InlineIcon-Proof-9x16 (src/phonewalk/).
 */
import React from "react";
import { Easing, Img, interpolate, spring } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const LAND = Easing.bezier(0.16, 1, 0.3, 1);

export const InlineIcon: React.FC<{
  f: number;
  fps: number;
  at: number;
  before: string;
  after: string;
  icon: string;
  size: number;
  font: string;
  weight?: number;
  ink: string;
  /** Accent for the word after the icon (Placed's "path" is in its blue). */
  afterInk?: string;
  glow?: string;
  /** Frames from the words landing to the icon dropping. */
  drop?: number;
}> = ({ f, fps, at, before, after, icon, size, font, weight = 600, ink, afterInk, glow = "rgba(217,32,46,0.45)", drop = 10 }) => {
  if (f < at) return null;
  const words = interpolate(f, [at, at + 14], [0, 1], { ...clamp, easing: LAND });
  const dropK = spring({ frame: f - at - drop, fps, config: { damping: 11, stiffness: 140, mass: 0.8 } });
  const close = interpolate(f, [at + drop + 4, at + drop + 16], [0, 1], { ...clamp, easing: LAND });
  const tile = size * 1.18;
  const gap = size * 0.24 + (1 - close) * size * 0.35;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, fontWeight: weight, fontSize: size, letterSpacing: "-0.03em", color: ink, whiteSpace: "nowrap" }}>
      <span style={{ opacity: words, transform: `translateX(${(1 - words) * -40}px)`, display: "inline-block" }}>{before}</span>
      <div style={{ width: tile + gap * 2, height: tile, position: "relative", flex: "none" }}>
        <div style={{ position: "absolute", left: gap, top: 0, width: tile, height: tile, borderRadius: tile * 0.24, overflow: "hidden",
          transform: `translateY(${(1 - dropK) * -size * 2.4}px) rotate(${(1 - dropK) * -14}deg) scale(${0.8 + 0.2 * Math.min(1, dropK)})`, opacity: Math.min(1, dropK * 2),
          boxShadow: `0 ${tile * 0.18}px ${tile * 0.45}px ${glow}, 0 0 0 2px rgba(255,255,255,0.18)` }}>
          <Img src={icon} style={{ width: "100%", height: "100%", display: "block" }} />
        </div>
      </div>
      <span style={{ opacity: words, transform: `translateX(${(1 - words) * 40}px)`, display: "inline-block", color: afterInk ?? ink }}>{after}</span>
    </div>
  );
};
