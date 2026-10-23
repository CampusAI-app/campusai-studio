import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_CAMERA } from "../lib/anim";
import type { Theme } from "../theme";

/**
 * The continuous space every beat sits in.
 *
 * Rendered ONCE at the root, below every scene, and the scenes themselves are
 * transparent. That is the whole point: the background does not crossfade with
 * itself at a scene boundary, so the film reads as one room the camera moves
 * around rather than eight slides. It also gives the panels something to
 * parallax against, which is what makes them feel like objects in space instead
 * of rectangles on a colour.
 *
 * Grain and blur live here and ONLY here. Nothing in this file is ever drawn
 * over a caption or over captured UI, so no treatment can soften text.
 */

// One static grain tile, as a data URI so nothing is fetched. feTurbulence at a
// high frequency reads as film grain rather than as noise.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

export const Atmosphere: React.FC<{ theme: Theme; totalFrames: number }> = ({
  theme,
  totalFrames,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // The bloom crosses the frame ONCE over the whole film. Slow enough that you
  // never catch it moving, fast enough that the last beat does not sit on the
  // same ground as the first.
  const t = interpolate(frame, [0, Math.max(1, totalFrames)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_CAMERA,
  });

  const bloomX = interpolate(t, [0, 1], [78, 42]);
  const bloomY = interpolate(t, [0, 1], [-6, 34]);
  const bloomSpread = interpolate(t, [0, 1], [52, 64]);
  const warmX = interpolate(t, [0, 1], [-4, 18]);
  const warmY = interpolate(t, [0, 1], [104, 82]);

  // The near layer travels further than the bloom over the same time, which is
  // the whole parallax effect. It also runs the other way, so the two never
  // move together and read as one field.
  const nearX = interpolate(t, [0, 1], [18, 74]);
  const nearY = interpolate(t, [0, 1], [58, 40]);
  const floorY = interpolate(t, [0, 1], [96, 88]);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      {/* The drifting crimson bloom, our accent at low alpha. */}
      <AbsoluteFill
        style={{
          backgroundImage:
            `radial-gradient(ellipse at ${bloomX}% ${bloomY}%, rgba(217, 32, 46, 0.26) 0%, transparent ${bloomSpread}%), ` +
            `radial-gradient(ellipse at ${warmX}% ${warmY}%, rgba(245, 200, 66, 0.13) 0%, transparent 52%), ` +
            `radial-gradient(ellipse at 50% 34%, rgba(23, 16, 18, 0.82) 0%, transparent 72%)`,
        }}
      />
      {/* A second, tighter pool that breathes, so the ground is never static
          even on a beat where the camera holds. */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle at ${bloomX - 8}% ${
            bloomY + 26
          }%, rgba(217, 32, 46, 0.14) 0%, transparent 34%)`,
          opacity:
            0.6 +
            0.4 * Math.sin((frame / Math.max(1, totalFrames)) * Math.PI * 3),
        }}
      />
      {/* A second field moving at a DIFFERENT rate to the bloom. Two layers at
          two speeds is what makes it parallax rather than drift: the panel sits
          still, and the space behind it visibly has depth. */}
      <AbsoluteFill
        style={{
          backgroundImage:
            `radial-gradient(ellipse 70% 40% at ${nearX}% ${nearY}%, rgba(120, 20, 34, 0.30) 0%, transparent 62%), ` +
            `radial-gradient(ellipse 50% 30% at ${100 - nearX}% ${nearY - 22}%, rgba(60, 10, 20, 0.34) 0%, transparent 58%)`,
        }}
      />
      {/* A floor: a wide soft pool low in frame, so a panel reads as standing on
          something and its shadow has somewhere to fall. */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(ellipse 90% 26% at 50% ${floorY}%, rgba(217, 32, 46, 0.13) 0%, transparent 70%)`,
        }}
      />
      {/* Vignette, so the frame edges fall away and the panel reads forward. */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(ellipse ${width}px ${height}px at 50% 46%, transparent 38%, rgba(0,0,0,0.62) 100%)`,
        }}
      />
      {/* Grain, background only. */}
      <AbsoluteFill
        style={{
          backgroundImage: GRAIN,
          backgroundRepeat: "repeat",
          opacity: 0.055,
          mixBlendMode: "overlay",
        }}
      />
    </AbsoluteFill>
  );
};
