/**
 * Comment drop (2026-11-15, ours, after Skill Stack Store's "20 Claude Effects" reel, 10.25 to 12.9 s). What the reel
 * does: white rounded pills with bold black sans text drop in one after another and stack over the lower third, like
 * comments arriving ("Comment EDIT", then "to get access to these", then a third tucked behind).
 *
 * Ours: each pill is one spoken phrase, driven by the clip's word timings, so it drops the moment its first word is
 * said and lights word by word as the words are spoken (unsaid words wait in light grey, never ahead of the voice).
 * A pill drops about 150 px out of a blur, lands with a spring and a small squash, and the pills already down take
 * the hit (a 6 px nudge). Each sits a few degrees off level and a little off centre, overlapping the one above, so
 * the stack reads as thrown, not typeset. Words listed in `accent` are drawn in the accent colour.
 *
 * Props: `clip` (path under public/), `from` (frames trimmed off its start), `words` (the clip's word timings, in
 * seconds of the clip, as in captions.json), `pills` (each a [first, last] index range into `words`, inclusive),
 * `accent` (word indices drawn in `accentColor`), `at` ({ x centre, y top } of the stack in frame px), `size` (font
 * px), `exitAt` (optional frame the stack leaves), `sound`.
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { INTER } from "../parts";
import { IN, OUT, Sfx, k, mix } from "./shared";

/** One spoken word with its start and end in seconds of the clip (the captions.json shape). */
export type CaptionWord = { w: string; start: number; end: number };

export type CommentDropProps = {
  clip: string;
  from?: number;
  volume?: number;
  words: CaptionWord[];
  pills: [number, number][];
  accent?: number[];
  accentColor?: string;
  at?: { x: number; y: number };
  size?: number;
  exitAt?: number;
  sound?: boolean;
};

const TILT = [-2.6, 1.9, -1.3, 2.4];
const NUDGE = [-18, 26, -6, 14];

export const CommentDrop: React.FC<CommentDropProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width: W } = useVideoConfig();
  const from = p.from ?? 0;
  const size = p.size ?? 68;
  const at = p.at ?? { x: W / 2, y: 1230 };
  const accent = new Set(p.accent ?? []);
  const accentColor = p.accentColor ?? "#E5484D";
  // clip seconds to this composition's frames
  const toFrame = (s: number) => s * fps - from;
  const now = (f + from) / fps;

  const padY = Math.round(size * 0.42);
  const pillH = Math.round(size * 1.12) + padY * 2;
  const step = pillH - Math.round(size * 0.1);

  // when each pill lands: a hair before its first word, so the pill is there as the word starts
  const lands = p.pills.map(([a]) => toFrame(p.words[a].start) - 3);

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <OffthreadVideo src={staticFile(p.clip)} trimBefore={from} volume={p.volume ?? 1} style={{ width: "100%", height: "100%" }} />

      {p.pills.map(([a, b], i) => {
        const land = lands[i];
        if (f < land - 6) return null;
        // the drop: 6 frames of fall out of a blur, then a spring settles it
        const fall = k(f, land - 6, land, IN);
        const settle = spring({ frame: f - land, fps, config: { damping: 9, stiffness: 230, mass: 0.7 } });
        const y = f < land ? mix(-150, 0, fall) : 14 * (1 - settle);
        const squash = f < land ? 1 : 1 - 0.07 * Math.sin(Math.min(1, (f - land) / 6) * Math.PI);
        // later pills landing knock this one down a touch
        let bump = 0;
        for (let j = i + 1; j < lands.length; j++) {
          const t = f - lands[j];
          if (t >= 0 && t < 10) bump += 6 * Math.sin((t / 10) * Math.PI);
        }
        const o = k(f, land - 6, land - 2, OUT);
        const blur = f < land ? (1 - fall) * 10 : 0;
        const leave = p.exitAt === undefined ? 0 : k(f, p.exitAt + (p.pills.length - 1 - i) * 2, p.exitAt + (p.pills.length - 1 - i) * 2 + 9, IN);
        const words = p.words.slice(a, b + 1);
        return (
          <div key={i} style={{ position: "absolute", left: at.x + NUDGE[i % NUDGE.length], top: at.y + i * step, zIndex: i,
            transform: `translate(-50%, ${(y + bump - 120 * leave).toFixed(2)}px) rotate(${TILT[i % TILT.length]}deg) scale(${(1 / squash).toFixed(4)}, ${squash.toFixed(4)})`,
            transformOrigin: "50% 100%", opacity: o * (1 - leave), filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
            <div style={{ whiteSpace: "nowrap", background: "#FFFFFF", borderRadius: pillH / 2, padding: `${padY}px ${Math.round(size * 0.62)}px`,
              fontFamily: INTER, fontWeight: 700, fontSize: size, lineHeight: 1.12, letterSpacing: "-0.03em",
              boxShadow: "0 18px 40px rgba(0,0,0,0.38), 0 3px 8px rgba(0,0,0,0.22)" }}>
              {words.map((w, j) => {
                const idx = a + j;
                // light from the word's own start, over 3 frames
                const lit = k(now * fps, w.start * fps, w.start * fps + 3);
                const ink = accent.has(idx) ? accentColor : "#0E0E10";
                return (
                  <span key={j} style={{ color: ink, opacity: mix(0.22, 1, lit) }}>
                    {w.w}
                    {j < words.length - 1 ? " " : ""}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}

      {lands.map((l, i) => (
        <Sfx key={i} at={l - 1} name="paper-slide" volume={0.32} on={p.sound ?? true} />
      ))}
    </AbsoluteFill>
  );
};
