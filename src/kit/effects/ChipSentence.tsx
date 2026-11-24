/**
 * ChipSentence (2026-11-24, from Gur's Waze brand film "The Living Map", Muse pass): a sentence set as huge kinetic type
 * where the product's own UI pieces sit inside the words like letters (each keeps its place from the start, so nothing jumps) ("shapes [chip] it"), real chips pop on around it,
 * and a flat colour floods across laterally, turning the type as the edge passes. Built for post-living-campus; the
 * chips there are crops of fresh captures of the real demo, never drawn UI.
 *
 *   <ChipSentence font={figtree} size={170} lines={[[{ text: "Works", at: 0 }, { chip: "film/ui/worked.png", w: 420, h: 36, at: 6 }, { text: "on it.", at: 10 }]]}
 *     flood={{ color: "#D9202E", at: 0, frames: 10 }} ink="#141012" inkOnFlood="#FFFFFF" floats={[...]} />
 *
 * Frame 0 is the start; wrap it in a Sequence. Every `at` is a frame inside it. A part rises 40 px into place over 8
 * frames on a strong ease-out; a chip part scales up from 0.6 instead. `floats` pop with a spring and keep drifting so the
 * frame is never still.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export type SentencePart =
  | { text: string; at: number }
  /** A real UI crop inline with the words: path under public/, its drawn size in px. */
  | { chip: string; w: number; h: number; at: number; radius?: number };

export type FloatChip = {
  src: string;
  /** Centre, px. */
  x: number;
  y: number;
  /** Drawn width; height follows the image. */
  w: number;
  at: number;
  /** Drift in px per frame (keeps the frame alive). */
  dx?: number;
  dy?: number;
  radius?: number;
  /** A white card behind the crop, for crops with a light page ground. */
  card?: boolean;
};

export type ChipSentenceProps = {
  lines: SentencePart[][];
  font: string;
  size?: number;
  weight?: number;
  ink?: string;
  /** The type colour once the flood has passed it. */
  inkOnFlood?: string;
  flood?: { color: string; at: number; frames?: number; from?: "right" | "left" };
  floats?: FloatChip[];
  /** Vertical centre of the type block. */
  cy?: number;
  lineGap?: number;
};

const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const SWING = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const ChipSentence: React.FC<ChipSentenceProps> = ({
  lines, font, size = 170, weight = 900, ink = "#141012", inkOnFlood, flood, floats = [], cy, lineGap = 0.08,
}) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const mid = cy ?? height / 2;

  // the flood's leading edge, in px from the left (it covers everything right of the edge when coming from the right)
  const ft = flood ? interpolate(f, [flood.at, flood.at + (flood.frames ?? 10)], [0, 1], { ...clamp, easing: SWING }) : 0;
  const fromLeft = flood?.from === "left";
  const edge = fromLeft ? ft * width : width * (1 - ft);

  const block = (color: string) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: mid, transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: size * lineGap }}>
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", alignItems: "center", gap: size * 0.22, whiteSpace: "nowrap" }}>
          {line.map((p, pi) => {
            const t = interpolate(f, [p.at, p.at + 8], [0, 1], { ...clamp, easing: OUT });
            if ("text" in p) {
              return (
                <span key={pi} style={{ fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1, letterSpacing: -size * 0.025, color,
                  opacity: t, transform: `translateY(${((1 - t) * 40).toFixed(1)}px)`, display: "inline-block" }}>{p.text}</span>
              );
            }
            const s = spring({ frame: f - p.at, fps, config: { damping: 13, stiffness: 170 } });
            return (
              <span key={pi} style={{ display: "inline-block", width: p.w, height: p.h, opacity: t, transform: `scale(${(0.6 + 0.4 * s).toFixed(3)})` }}>
                <Img src={staticFile(p.chip)} style={{ width: p.w, height: p.h, borderRadius: p.radius ?? p.h * 0.28, boxShadow: "0 10px 30px rgba(20,16,18,0.18)", display: "block" }} />
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <AbsoluteFill>
      {flood && ft > 0 ? (
        <div style={{ position: "absolute", top: 0, bottom: 0, left: fromLeft ? 0 : edge, width: fromLeft ? edge : width - edge, background: flood.color }} />
      ) : null}
      {floats.map((c, i) => {
        if (f < c.at) return null;
        const s = spring({ frame: f - c.at, fps, config: { damping: 12, stiffness: 180 } });
        const x = c.x + (f - c.at) * (c.dx ?? 0);
        const y = c.y + (f - c.at) * (c.dy ?? 0);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: c.w, transform: `translate(-50%, -50%) scale(${s.toFixed(3)})`,
            borderRadius: c.radius ?? 18, overflow: "hidden", background: c.card ? "#FFFFFF" : undefined, boxShadow: "0 12px 32px rgba(20,16,18,0.20)" }}>
            <Img src={staticFile(c.src)} style={{ width: "100%", display: "block" }} />
          </div>
        );
      })}
      {/* the type, twice: its own ink where the flood has not reached, the flood ink where it has */}
      <div style={{ position: "absolute", inset: 0, clipPath: inkOnFlood && flood ? (fromLeft ? `inset(0 0 0 ${edge}px)` : `inset(0 ${width - edge}px 0 0)`) : undefined }}>
        {block(ink)}
      </div>
      {inkOnFlood && flood && ft > 0 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: fromLeft ? `inset(0 ${width - edge}px 0 0)` : `inset(0 0 0 ${edge}px)` }}>
          {block(inkOnFlood)}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
