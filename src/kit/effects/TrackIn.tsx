/**
 * Track in (2026-11-27, from XZE Creative's "Spotify 2.0" desk film, Muse Nov 27; Jacob: "I love this as inspo"). Read
 * frame by frame (Lucius's watch notes: 6.0 to 7.5 s and 8.0 to 9.4 s); our own build.
 *
 * A short line that arrives spread wide and pulls together: each word fades in with its letters far apart (about 0.6 em)
 * and closes to normal spacing over half a second, the words landing one after another, the key words in the brand
 * colour. The reference used it for its payoff lines after the product beats ("See what your [faces] are playing.",
 * "And react to it", "In real-time"), one line on black at a time, and shrank the last one before the logo. `shrinkAt`
 * does that: the line eases to `shrinkTo` of its size and fades as the next beat comes.
 *
 * A word takes no room until it arrives, so the line re-centres as it grows. Words are split on spaces; mark a key word with a leading `*` ("See what's *left"). `f` is the current frame.
 */
import React from "react";
import { Easing, interpolate } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CLOSE = Easing.bezier(0.16, 1, 0.3, 1);

export const TrackIn: React.FC<{
  f: number;
  at: number;
  text: string;
  font: string;
  size: number;
  weight?: number;
  ink?: string;
  accent?: string;
  /** Frames between one word and the next. */
  stagger?: number;
  /** Frames for a word to close up. */
  close?: number;
  /** Start of the shrink-and-fade out, if any. */
  shrinkAt?: number;
  shrinkTo?: number;
  style?: React.CSSProperties;
}> = ({ f, at, text, font, size, weight = 600, ink = "#f4f1ee", accent = "#e0313d", stagger = 5, close = 16, shrinkAt, shrinkTo = 0.62, style }) => {
  if (f < at) return null;
  const words = text.split(" ");
  const out = shrinkAt === undefined ? 0 : interpolate(f, [shrinkAt, shrinkAt + 14], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const scale = 1 - (1 - shrinkTo) * out;
  const fade = shrinkAt === undefined ? 1 : interpolate(f, [shrinkAt + 8, shrinkAt + 16], [1, 0], clamp);
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", flexWrap: "nowrap", gap: `0 ${size * 0.26}px`, fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.1, whiteSpace: "nowrap", transform: `scale(${scale})`, opacity: fade, ...style }}>
      {words.map((w, i) => {
        const key = w.startsWith("*");
        const word = key ? w.slice(1) : w;
        const a = at + i * stagger;
        if (f < a) return null; // a word takes no room until it arrives, so the line re-centres as it grows (as the reference did)
        const t = interpolate(f, [a, a + close], [0, 1], { ...clamp, easing: CLOSE });
        const o = interpolate(f, [a, a + close * 0.55], [0, 1], clamp);
        return (
          <span key={i} style={{ color: key ? accent : ink, letterSpacing: `${0.6 * (1 - t) - 0.01}em`, opacity: o, textShadow: key ? `0 0 ${size * 0.5}px ${accent}55` : undefined }}>
            {word}
          </span>
        );
      })}
    </div>
  );
};
