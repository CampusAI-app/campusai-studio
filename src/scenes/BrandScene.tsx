import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "../lib/anim";
import type { Theme } from "../theme";

/**
 * The brand open. Wordmark in, hairline out, then the whole thing scales up and
 * away so the first product beat reads as arriving THROUGH it rather than after
 * it.
 *
 * Deliberately not the end card reused. The end card's job is to settle and
 * hold an ask; this one's job is to hand off, which is the opposite shape: it
 * has to leave while still growing, or the cut to the product feels like a stop
 * and a restart.
 */
export const BrandScene: React.FC<{
  logoSrc: string;
  logoWidth?: number;
  theme: Theme;
}> = ({ logoSrc, logoWidth, theme }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const short = Math.min(width, height);
  const w = logoWidth ?? short * 0.46;

  // In.
  const a = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  // The hairline draws out from the centre once the mark has landed.
  const rule = interpolate(frame, [14, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  // Out, still growing.
  const push = interpolate(frame, [26, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const fade = interpolate(frame, [34, 45], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  const scale = 0.94 + 0.06 * a + 0.1 * push;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: a * fade,
          transform: `scale(${scale})`,
        }}
      >
        <Img
          src={staticFile(logoSrc)}
          style={{
            width: w,
            filter: `drop-shadow(0 ${short * 0.012}px ${short * 0.04}px rgba(0,0,0,0.6))`,
          }}
        />
        <div
          style={{
            marginTop: short * 0.055,
            width: w * 0.5,
            height: Math.max(2, short * 0.0032),
            borderRadius: 99,
            backgroundColor: theme.accent,
            transform: `scaleX(${rule})`,
            opacity: rule,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
