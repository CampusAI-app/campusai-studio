/**
 * The desktop pointer (2026-10-22): an arrow for the web product, from the how-to film. Squashes on
 * the press and drops a ring in the brand accent. For a phone or a touch moment use `Hand` or
 * `HandAt` from `kit/parts` instead. Positions are canvas px (map page points with `toCanvas`).
 */
import React from "react";
import { interpolate } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const PointerAt: React.FC<{
  x: number;
  y: number;
  /** Seconds since the last click, or null when none is recent. */
  since: number | null;
  accent: string;
  size?: number;
  opacity?: number;
}> = ({ x, y, since, accent, size = 58, opacity = 1 }) => {
  const press = since === null ? 1 : interpolate(since, [0, 0.08, 0.25], [0.86, 0.86, 1], clamp);
  const ring = since === null ? 1 : Math.min(1, since / 0.5);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity }}>
      {since !== null && ring < 1 && (
        <div style={{ position: "absolute", left: 0, top: 0, width: 120 * ring, height: 120 * ring, transform: "translate(-50%,-50%)",
          borderRadius: "50%", border: `3px solid ${accent}`, opacity: 1 - ring }} />
      )}
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", left: -3, top: -3, transform: `scale(${press})`,
        transformOrigin: "3px 3px", filter: "drop-shadow(0 6px 10px rgba(0,0,0,.5))" }}>
        <path d="M3 2l15 8.2-6.6 1.7L8.6 18z" fill="#fff" stroke="#0b0708" strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </div>
  );
};
