import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE } from "../lib/anim";
import type { HighlightRect } from "../script";
import type { Theme } from "../theme";

/**
 * Points at a phrase INSIDE a captured card, rather than restating it in a
 * caption underneath. The rects come from a Range over the real text node in
 * the running product (see scripts that write highlights.json), so the mark
 * lands on the exact words even when the phrase wraps across two lines.
 *
 * Wipes left to right, the direction the sentence is read. A phrase that wraps
 * gets one rect per line, staggered, so the mark travels the way the eye does.
 */
export const Highlight: React.FC<{
  rects: HighlightRect[];
  from: number;
  theme: Theme;
  /** Extra room around the text, as a fraction of the card box. */
  padX?: number;
  padY?: number;
}> = ({ rects, from, theme, padX = 0.010, padY = 0.007 }) => {
  const frame = useCurrentFrame();

  return (
    <>
      {rects.map((r, i) => {
        // Each wrapped line starts a few frames after the one above it.
        const start = from + i * 4;
        const p = interpolate(frame, [start, start + 13], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        });
        if (p <= 0) return null;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(r.x - padX) * 100}%`,
              top: `${(r.y - padY) * 100}%`,
              width: `${(r.w + padX * 2) * 100}%`,
              height: `${(r.h + padY * 2) * 100}%`,
              borderRadius: 6,
              backgroundColor: "rgba(217, 32, 46, 0.20)",
              borderBottom: `3px solid ${theme.accent}`,
              boxSizing: "border-box",
              transform: `scaleX(${p})`,
              transformOrigin: "left center",
            }}
          />
        );
      })}
    </>
  );
};
