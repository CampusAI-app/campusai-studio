import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Theme } from "../theme";
import { enter } from "../lib/anim";

export const EndScene: React.FC<{
  title: string;
  subtitle?: string;
  cta?: string;
  /** Path inside public/ to a wordmark. Replaces the type-set title when set. */
  logoSrc?: string;
  /** Rendered width of that wordmark, in px. */
  logoWidth?: number;
  /** `punch` scales the ask up for a feed post. See the script type. */
  voice?: "display" | "punch";
  theme: Theme;
  fontFamily: string;
}> = ({
  title,
  subtitle,
  cta,
  logoSrc,
  logoWidth = 520,
  voice = "display",
  theme,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const a = enter(frame, 0, 22);
  const b = enter(frame, 8, 22);
  const c = enter(frame, 18, 24);

  // The display voice keeps its original fixed sizes so the 16:9
  // screen-recording cut is unchanged. Punch scales off the short edge.
  const punch = voice === "punch";
  const short = Math.min(width, height);
  const subSize = punch ? short * 0.058 : 40;
  const ctaSize = punch ? short * 0.042 : 34;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {logoSrc ? (
        <Img
          src={staticFile(logoSrc)}
          style={{
            width: logoWidth,
            opacity: a.opacity,
            transform: `translateY(${a.y}px)`,
          }}
        />
      ) : (
        <div
          style={{
            fontFamily,
            fontSize: 120,
            fontWeight: theme.displayWeight,
            letterSpacing: theme.displayTracking,
            color: theme.ink,
            opacity: a.opacity,
            transform: `translateY(${a.y}px)`,
          }}
        >
          {title}
        </div>
      )}
      {subtitle ? (
        <div
          style={{
            fontFamily,
            fontSize: subSize,
            fontWeight: punch ? 600 : 400,
            color: punch ? theme.ink : theme.inkSoft,
            letterSpacing: "-0.015em",
            marginTop: punch ? 28 : 18,
            textAlign: "center",
            opacity: b.opacity,
            transform: `translateY(${b.y}px)`,
          }}
        >
          {subtitle}
        </div>
      ) : null}
      {cta ? (
        <div
          style={{
            marginTop: punch ? 42 : 52,
            fontFamily,
            fontSize: ctaSize,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: theme.accentInk,
            backgroundColor: theme.accent,
            padding: "20px 42px",
            borderRadius: 999,
            opacity: c.opacity,
            transform: `translateY(${c.y}px)`,
          }}
        >
          {cta}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
