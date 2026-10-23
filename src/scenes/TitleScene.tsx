import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Theme } from "../theme";
import { enter } from "../lib/anim";

export const TitleScene: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  theme: Theme;
  fontFamily: string;
}> = ({ eyebrow, title, subtitle, theme, fontFamily }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const a = enter(frame, 0, 20);
  const b = enter(frame, 6, 22);
  const c = enter(frame, 14, 22);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        justifyContent: "center",
        padding: width * 0.11,
      }}
    >
      {eyebrow ? (
        <div
          style={{
            fontFamily,
            fontSize: 34,
            fontWeight: 600,
            color: theme.accent,
            letterSpacing: "-0.01em",
            marginBottom: 22,
            opacity: a.opacity,
            transform: `translateY(${a.y}px)`,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <div
        style={{
          fontFamily,
          fontSize: 112,
          fontWeight: theme.displayWeight,
          letterSpacing: theme.displayTracking,
          lineHeight: 1.04,
          color: theme.ink,
          maxWidth: "82%",
          opacity: b.opacity,
          transform: `translateY(${b.y}px)`,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            fontFamily,
            fontSize: 42,
            fontWeight: 400,
            color: theme.inkSoft,
            letterSpacing: "-0.015em",
            marginTop: 28,
            maxWidth: "62%",
            lineHeight: 1.35,
            opacity: c.opacity,
            transform: `translateY(${c.y}px)`,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
