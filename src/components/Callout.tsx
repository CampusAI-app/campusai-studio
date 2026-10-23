import React from "react";
import { useCurrentFrame } from "remotion";
import type { Callout as CalloutProps } from "../script";
import type { Theme } from "../theme";
import { envelope } from "../lib/anim";

const CONNECTOR = 44;

/**
 * A label pinned to a point in the footage, with a short connector and a dot.
 * Sentence case on purpose: no all-caps tracked-out labels.
 */
export const Callout: React.FC<{
  callout: CalloutProps;
  theme: Theme;
  fontFamily: string;
}> = ({ callout, theme, fontFamily }) => {
  const frame = useCurrentFrame();
  const { opacity, y, visible } = envelope(
    frame,
    callout.from,
    callout.duration,
  );
  if (!visible) return null;

  const side = callout.side ?? "right";
  const horizontal = side === "left" || side === "right";

  const labelOffset: React.CSSProperties =
    side === "right"
      ? { left: CONNECTOR + 14, top: "50%", transform: "translateY(-50%)" }
      : side === "left"
        ? { right: CONNECTOR + 14, top: "50%", transform: "translateY(-50%)" }
        : side === "top"
          ? { bottom: CONNECTOR + 14, left: "50%", transform: "translateX(-50%)" }
          : { top: CONNECTOR + 14, left: "50%", transform: "translateX(-50%)" };

  const line: React.CSSProperties = {
    position: "absolute",
    backgroundColor: theme.accent,
    ...(horizontal
      ? {
          width: CONNECTOR,
          height: 2,
          top: "50%",
          marginTop: -1,
          ...(side === "right" ? { left: 10 } : { right: 10 }),
        }
      : {
          height: CONNECTOR,
          width: 2,
          left: "50%",
          marginLeft: -1,
          ...(side === "bottom" ? { top: 10 } : { bottom: 10 }),
        }),
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${callout.x * 100}%`,
        top: `${callout.y * 100}%`,
        opacity,
        transform: `translate(-50%, -50%) translateY(${y}px)`,
      }}
    >
      {/* the anchor dot */}
      <div
        style={{
          position: "absolute",
          left: -7,
          top: -7,
          width: 14,
          height: 14,
          borderRadius: 999,
          backgroundColor: theme.accent,
          boxShadow: `0 0 0 6px ${theme.accent}22`,
        }}
      />
      <div style={line} />
      <div
        style={{
          position: "absolute",
          ...labelOffset,
          whiteSpace: "nowrap",
          backgroundColor: theme.accent,
          color: theme.accentInk,
          fontFamily,
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          padding: "12px 20px",
          borderRadius: 12,
          boxShadow: "0 12px 34px rgba(0,0,0,0.22)",
        }}
      >
        {callout.text}
      </div>
    </div>
  );
};
