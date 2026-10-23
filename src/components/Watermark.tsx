import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "../lib/anim";
import { safeLayout } from "../lib/safeArea";

/**
 * The mark, held for the whole film.
 *
 * Rendered at the root ABOVE the TransitionSeries, so it never crossfades with
 * a scene and never moves. Top LEFT and small: it has to clear the North Star
 * chip, which is centred at 8.5% of frame height, so a mark level with the chip
 * or centred like it would collide or read as a second piece of content.
 */
export const Watermark: React.FC<{
  src: string;
  widthRatio?: number;
  opacity?: number;
  /**
   * Frame to start fading out on. Set to the end card's first frame: that card
   * draws the wordmark full size, and two CampusAI logos on one frame reads as
   * a mistake.
   */
  fadeOutAt?: number;
  /** Which top corner. Left is the default every film uses. */
  side?: "left" | "right";
}> = ({ src, widthRatio = 0.19, opacity = 0.72, fadeOutAt, side = "left" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const short = Math.min(width, height);

  // A short fade in so frame one is not abrupt.
  const a = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  const out =
    fadeOutAt === undefined
      ? 1
      : interpolate(frame, [fadeOutAt - 6, fadeOutAt + 8], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        });
  if (out <= 0) return null;

  return (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        [side]: short * 0.055,
        top: height * safeLayout(width, height).watermarkY,
        width: short * widthRatio,
        opacity: opacity * a * out,
        filter: `drop-shadow(0 ${short * 0.006}px ${short * 0.02}px rgba(0,0,0,0.65))`,
      }}
    />
  );
};
