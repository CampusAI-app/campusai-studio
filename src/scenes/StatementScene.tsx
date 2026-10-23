import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Theme } from "../theme";
import { enter } from "../lib/anim";

/**
 * A full-bleed typographic beat. One idea only.
 *
 * The punch voice is CENTRED, with a short accent rule above it and the line
 * set optically in the middle of the frame. The earlier version set the lines
 * flush left in a left-padded box, which in a 4:5 frame put a short sentence in
 * the lower left of a large empty field with no anchor anywhere: it read as
 * unfinished rather than deliberate.
 */
export const StatementScene: React.FC<{
  lines: string[];
  accentWord?: string;
  voice?: "display" | "punch";
  theme: Theme;
  fontFamily: string;
  captionFamily?: string;
}> = ({
  lines,
  accentWord,
  voice = "display",
  theme,
  fontFamily,
  captionFamily,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const punch = voice === "punch";
  const family = punch && captionFamily ? captionFamily : fontFamily;

  // The punch voice is sized off the SHORTER edge and then fitted to the
  // longest line, for the same reason PunchCaption is. The display voice keeps
  // its original fixed numbers, because the only composition that uses it is
  // the 16:9 screen-recording cut where they already work.
  const short = Math.min(width, height);
  const pad = punch ? short * 0.09 : width * 0.11;
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const size = punch
    ? Math.min(short * 0.105, (width - pad * 2) / (longest * 0.56))
    : 96;

  const rule = enter(frame, 0, 20);

  const render = (line: string) => {
    if (!accentWord || !line.includes(accentWord)) return line;
    const [before, ...rest] = line.split(accentWord);
    return (
      <>
        {before}
        <span style={{ color: theme.accent }}>{accentWord}</span>
        {rest.join(accentWord)}
      </>
    );
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: punch ? "center" : "flex-start",
        padding: pad,
      }}
    >
      {/* A short accent rule, so the block is anchored to something instead of
          floating in the middle of a large dark field. */}
      {punch ? (
        <div
          style={{
            width: size * 1.1,
            height: Math.max(3, size * 0.045),
            borderRadius: 99,
            backgroundColor: theme.accent,
            marginBottom: size * 0.5,
            opacity: rule.opacity,
            transform: `scaleX(${0.3 + 0.7 * rule.progress})`,
          }}
        />
      ) : null}

      {lines.map((line, i) => {
        const a = enter(frame, 6 + i * 7, 24);
        return (
          <div
            key={i}
            style={{
              fontFamily: family,
              fontSize: size,
              fontWeight: punch ? 800 : theme.displayWeight,
              letterSpacing: punch ? "-0.025em" : theme.displayTracking,
              lineHeight: punch ? 1.06 : 1.14,
              color: punch ? "#FFFFFF" : theme.ink,
              textAlign: punch ? "center" : "left",
              textWrap: "balance",
              filter: punch
                ? `drop-shadow(0 ${size * 0.04}px ${size * 0.12}px rgba(0,0,0,0.55))`
                : undefined,
              opacity: a.opacity,
              transform: `translateY(${a.y}px)`,
            }}
          >
            {render(line)}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
