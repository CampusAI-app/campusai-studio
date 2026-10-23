import React from "react";
import { useCurrentFrame } from "remotion";
import type { Caption as CaptionProps } from "../script";
import type { Theme } from "../theme";
import { envelope } from "../lib/anim";

/**
 * Lower third, rendered inside a reserved band BELOW the footage rather than
 * floating on top of it. Text over a live product UI is never reliably legible
 * (the UI's own contrast is out of our control), so the footage gets shortened
 * and the caption gets clean ground to sit on.
 */
export const Caption: React.FC<{
  caption: CaptionProps;
  theme: Theme;
  fontFamily: string;
  band: number;
}> = ({ caption, theme, fontFamily, band }) => {
  const frame = useCurrentFrame();
  const { opacity, y, visible } = envelope(
    frame,
    caption.from,
    caption.duration,
    20,
    16,
  );
  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: band,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: 44,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: theme.ink,
          textAlign: "center",
          maxWidth: "78%",
          opacity,
          transform: `translateY(${y}px)`,
        }}
      >
        {caption.text}
      </div>
    </div>
  );
};
