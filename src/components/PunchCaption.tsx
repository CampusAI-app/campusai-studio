import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "../lib/anim";
import type { Theme } from "../theme";
import { safeLayout } from "../lib/safeArea";

/**
 * Short-form caption, in the format short video actually uses.
 *
 * Built to the pattern that performs on creator reels: show the WHOLE phrase
 * quickly, then mark the word that carries the meaning with a filled accent
 * box. The earlier version revealed slowly and only recoloured the accent word,
 * which reads as a lower third rather than a caption, because the eye has
 * nothing to land on and the phrase is never whole.
 *
 * Four things doing the work:
 *   1. Words pop in 2 frames apart, not 4, so the line completes fast.
 *   2. Each word overshoots to 1.04 and settles, rather than easing to 1.
 *   3. Stroke AND a drop shadow. Stroke alone floats; the shadow seats it.
 *   4. The accent word gets a filled brand box that snaps in once the line is
 *      complete, so it arrives as emphasis instead of just being a red word.
 *
 * Montserrat is the exception to this project's Inter-only convention. Sentence
 * case, not the all-caps creator look: this is a product sold to universities,
 * and all-caps reads cheap next to a Smith lockup.
 */
export const PunchCaption: React.FC<{
  text: string;
  from: number;
  duration: number;
  accentWords?: string[];
  theme: Theme;
  fontFamily: string;
  y?: number;
}> = ({ text, from, duration, accentWords = [], theme, fontFamily, y }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const strip = (w: string) => w.toLowerCase().replace(/[.,:;!?]/g, "");
  const accent = new Set(accentWords.map(strip));

  // Consecutive accent words are merged into ONE token so they share ONE box.
  // Rendered per word, "Job Match:" came out as two boxes with a gap down the
  // middle, which reads as two marks rather than one phrase.
  const words = text.split(" ").reduce<{ text: string; isAccent: boolean }[]>(
    (acc, w) => {
      const isAccent = accent.has(strip(w));
      const prev = acc[acc.length - 1];
      if (prev && prev.isAccent && isAccent) {
        prev.text += ` ${w}`;
        return acc;
      }
      acc.push({ text: w, isAccent });
      return acc;
    },
    [],
  );

  // Sized off the SHORTER edge. Keyed off width, the 16:9 caption came out
  // 150px tall in a 1080px frame and two lines ran off the bottom.
  const size = Math.min(width, height) * 0.078;
  const stroke = Math.max(6, Math.round(size * 0.1));

  const STEP = 2;
  const lineComplete = from + words.length * STEP + 8;

  const out = interpolate(
    frame,
    [from + duration - 10, from + duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE },
  );
  if (out <= 0) return null;

  // The accent box lands just after the last word, so the phrase reads whole
  // first and the emphasis is a second beat rather than a colour.
  const box = interpolate(frame, [lineComplete, lineComplete + 7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: height * (y ?? safeLayout(width, height).captionY),
        display: "flex",
        flexWrap: "wrap",
        gap: `${size * 0.18}px ${size * 0.26}px`,
        alignItems: "baseline",
        justifyContent: "center",
        padding: `0 ${width * 0.07}px`,
      }}
    >
      {words.map((token, i) => {
        const start = from + i * STEP;
        const p = interpolate(frame, [start, start + 7], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        });
        if (p <= 0) return null;

        // Overshoot, then settle. A word that only eases to 1 lands flat.
        const pop = interpolate(p, [0, 0.7, 1], [0.86, 1.04, 1]);
        const isAccent = token.isAccent;

        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              opacity: p * out,
              transform: `translateY(${(1 - p) * 18}px) scale(${pop})`,
            }}
          >
            {isAccent ? (
              <span
                style={{
                  position: "absolute",
                  left: `-${size * 0.15}px`,
                  right: `-${size * 0.15}px`,
                  top: `-${size * 0.08}px`,
                  bottom: `-${size * 0.14}px`,
                  backgroundColor: theme.accent,
                  borderRadius: size * 0.18,
                  transform: `scaleX(${0.72 + 0.28 * box}) scaleY(${0.82 + 0.18 * box})`,
                  opacity: box,
                  boxShadow: `0 ${size * 0.06}px ${size * 0.22}px rgba(0,0,0,0.45)`,
                }}
              />
            ) : null}
            <span
              style={{
                position: "relative",
                fontFamily,
                fontSize: size,
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: "-0.02em",
                color: "#FFFFFF",
                WebkitTextStroke: `${stroke}px rgba(0,0,0,0.82)`,
                paintOrder: "stroke fill",
                // Seats the type against the frame. Stroke alone floats.
                filter: `drop-shadow(0 ${size * 0.05}px ${size * 0.14}px rgba(0,0,0,0.6))`,
                display: "inline-block",
              }}
            >
              {token.text}
            </span>
          </span>
        );
      })}
    </div>
  );
};
