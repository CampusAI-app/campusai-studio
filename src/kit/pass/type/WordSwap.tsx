/**
 * WordSwap (2026-10-22): big display words swap in one phrase at a time on the brand ground, then
 * the last phrase rises into a small headline while a real page rises in beneath it. A hook that
 * hands into the product instead of cutting to it.
 *
 * From Raylight's "Fetch Saas" (4NkKI8GD, sheeted 2026-10-22: one centred phrase at a time, letters
 * cascading in left to right out of a blur, the old phrase gone before the next lands), with the
 * blur channel of the shelf's `blur-slide` and the upward exit of `vertical-word-roll-blur-cycle`.
 * Dictionary: per-character cascade in, blur-out lift exit, then a headline settle (move-to-header).
 *
 * The numbers that matter:
 * - Letters cascade 0.8 frame apart (Raylight's ~30 ms per character), each landing over 11 frames
 *   on EASE: blur 14 to 0 px, rise 0.24 em, opacity 0 to 1.
 * - Every phrase then stays fully on screen for letters / 15 + 1.5 s, never under 1.8 s (`holds`
 *   overrides per phrase but never goes under the rule unless you pass it lower on purpose).
 * - Exit 8 frames, faster than the entrance: lift 0.22 em, blur 0 to 14 px. The next phrase starts
 *   4 frames into the exit, so two phrases never sit on top of each other at full strength.
 * - Handoff: the last phrase is never cleared. It eases (26 frames, EASE_CAMERA) up into a headline
 *   at `headline.scale` while the page rises 40 px past its rest and settles (30 frames, EASE), then
 *   the page camera drifts linearly so the last frame is never still.
 *
 * Timing honesty: three phrases at the reading rule take about 5.5 s before the page lands. A true
 * 2 second hook is one short phrase plus the handoff.
 */
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { camAlong } from "../../camera";
import { PageView } from "../../PageView";
import { ZODIAK } from "../../parts";
import { EASE, EASE_CAMERA } from "../../../lib/anim";
import { MPatch, clamp, readFrames } from "./shared";

export type Phrase = { text: string; /** One word of `text` set in the accent, Zodiak italic. */ accent?: string };

export type WordSwapHandoff = {
  src: string;
  page: Size;
  /** Where the page rests, canvas px. */
  view: Rect;
  /** Camera keys in frames from the moment the page starts rising. Default: full page with a slow drift. */
  cams?: { t: number; cam: PageCam }[];
  /** Sidebar colour for the Maryland mark patch (see shared.tsx). */
  patch: string;
  /** Where the last phrase settles: its centre y and its scale against `size`. */
  headline: { y: number; scale: number };
  /** Extra frames the last phrase holds centred before the move. Default 0: the move starts 0.7 s after it has landed. */
  delay?: number;
};

export type WordSwapProps = {
  brand: Brand;
  phrases: Phrase[];
  /** First frame of the first letter. */
  at?: number;
  /** Frames each phrase stays fully on screen. Defaults to the reading rule per phrase. */
  holds?: number[];
  /** Font size px and the width a phrase wraps at. */
  size?: number;
  maxWidth?: number;
  /** Centre of the phrase on the canvas. */
  x: number;
  y: number;
  handoff?: WordSwapHandoff;
};

const STAGGER = 0.8;
const LETTER = 11;
const EXIT = 8;
const OVERLAP = 4;
const MOVE = 26;
const RISE = 30;

/** The timeline a WordSwap plays, so a film can size its composition and hang beats on it. */
export const wordSwapTimeline = (p: Pick<WordSwapProps, "phrases" | "at" | "holds" | "handoff">, fps: number) => {
  let t = p.at ?? 4;
  const beats = p.phrases.map((ph, i) => {
    const enter = t;
    const landed = enter + Math.ceil((ph.text.length - 1) * STAGGER) + LETTER;
    const hold = p.holds?.[i] ?? readFrames(ph.text, fps);
    const exit = landed + hold;
    t = exit + EXIT - OVERLAP;
    return { enter, landed, exit, hold };
  });
  const last = beats[beats.length - 1];
  // the last phrase is read across the move: it starts 0.7 s after it lands, and the page settles
  // well inside its reading time
  const moveAt = last.landed + Math.round(fps * 0.7) + (p.handoff?.delay ?? 0);
  const settled = moveAt + Math.max(MOVE, RISE);
  return { beats, moveAt, settled, end: p.handoff ? Math.max(settled + Math.round(fps * 0.8), last.landed + last.hold) : last.exit + EXIT };
};

const PhraseLine: React.FC<{ ph: Phrase; f: number; enter: number; exitAt: number | null; size: number; maxWidth: number; brand: Brand }> = ({
  ph, f, enter, exitAt, size, maxWidth, brand,
}) => {
  const out = exitAt === null ? 0 : interpolate(f, [exitAt, exitAt + EXIT], [0, 1], { ...clamp, easing: EASE });
  let k = 0;
  return (
    <div style={{ width: maxWidth, textAlign: "center", fontFamily: ZODIAK.family, fontWeight: ZODIAK.weight, fontSize: size, lineHeight: 1.04,
      letterSpacing: ZODIAK.track, color: brand.color.ink, opacity: 1 - out, filter: out ? `blur(${(out * 14).toFixed(2)}px)` : undefined,
      transform: `translateY(${(-out * 0.22 * size).toFixed(2)}px)` }}>
      {ph.text.split(" ").map((word, wi) => {
        const accent = ph.accent !== undefined && word.replace(/[.,!?]/g, "") === ph.accent.replace(/[.,!?]/g, "");
        const chars = word.split("").map((ch, ci) => {
          const s = enter + k * STAGGER;
          k += 1;
          const p = interpolate(f, [s, s + LETTER], [0, 1], { ...clamp, easing: EASE });
          return (
            <span key={ci} style={{ display: "inline-block", opacity: p, filter: p < 1 ? `blur(${((1 - p) * 14).toFixed(2)}px)` : undefined,
              transform: `translateY(${((1 - p) * 0.24 * size).toFixed(2)}px)` }}>{ch}</span>
          );
        });
        k += 1; // the space counts in the cascade
        return (
          <span key={wi} style={{ display: "inline-block", whiteSpace: "nowrap", marginRight: "0.24em",
            ...(accent ? { color: brand.color.accent, fontStyle: "italic", fontWeight: 400 } : null) }}>{chars}</span>
        );
      })}
    </div>
  );
};

export const WordSwap: React.FC<WordSwapProps> = (props) => {
  const { brand, phrases, size = 128, maxWidth = 900, x, y, handoff } = props;
  const f = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const tl = wordSwapTimeline(props, fps);
  const lastI = phrases.length - 1;

  const move = handoff ? interpolate(f, [tl.moveAt, tl.moveAt + MOVE], [0, 1], { ...clamp, easing: EASE_CAMERA }) : 0;
  const rise = handoff ? interpolate(f, [tl.moveAt + 4, tl.moveAt + 4 + RISE], [0, 1], { ...clamp, easing: EASE }) : 0;

  return (
    <>
      {handoff && f >= tl.moveAt + 4 && (() => {
        const v = handoff.view;
        const view = { ...v, y: v.y + (1 - rise) * (height - v.y + 40) };
        const cams = handoff.cams ?? [
          { t: 0, cam: { cx: handoff.page.w / 2, cy: handoff.page.h / 2, cw: handoff.page.w } },
          { t: RISE, cam: { cx: handoff.page.w / 2, cy: handoff.page.h / 2, cw: handoff.page.w } },
          { t: RISE + fps * 6, cam: { cx: handoff.page.w / 2 - 40, cy: handoff.page.h / 2 - 20, cw: handoff.page.w * 0.94 } },
        ];
        // the drift is a constant-speed glide (linear), the arrival keeps the house curve
        const cam = camAlong(f - tl.moveAt - 4, cams, (t) => t);
        return (
          <div style={{ opacity: Math.min(1, rise * 1.6) }}>
            <PageView src={handoff.src} page={handoff.page} cam={cam} view={view} brand={brand}>
              <MPatch cam={cam} view={view} color={handoff.patch} />
            </PageView>
          </div>
        );
      })()}
      {phrases.map((ph, i) => {
        const b = tl.beats[i];
        const isLast = i === lastI;
        const exitAt = isLast && handoff ? null : b.exit;
        if (f < b.enter - 1 || (exitAt !== null && f > exitAt + EXIT + 1)) return null;
        const hy = handoff ? handoff.headline.y : y;
        const s = 1 + ((handoff?.headline.scale ?? 1) - 1) * (isLast ? move : 0);
        const cy = y + (hy - y) * (isLast ? move : 0);
        return (
          <div key={i} style={{ position: "absolute", left: x - maxWidth / 2, top: cy, width: maxWidth,
            transform: `translateY(-50%) scale(${s.toFixed(4)})`, transformOrigin: "50% 50%" }}>
            <PhraseLine ph={ph} f={f} enter={b.enter} exitAt={exitAt} size={size} maxWidth={maxWidth} brand={brand} />
          </div>
        );
      })}
    </>
  );
};
