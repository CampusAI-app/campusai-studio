/**
 * Shared pieces for the titles group (round 4, 2026-10-25): FeatureTag, ChapterMark, QuestionHook, StatLine.
 * Kept in this folder so the kit index is not touched (round 4 brief). Positions are PAGE px of a captured
 * campusai-demo page unless a name says canvas.
 *
 *   DEMOTE       title-demote-to-label's travel curve, bezier(0.6, 0, 0.18, 1): leaves decisively, lands very soft.
 *                Every title in this group that travels between the page and a band uses it, over DUR.travel-ish.
 *   WordsIn      the blur-slide reveal (shelf shot typography/blur-slide): words rise out of a blur, y, blur and
 *                opacity on ONE progress and one curve, about 4 f apart, 22 f each (main) or 2.4 f / 20 f (sub).
 *   ZDigits      a rolling-digit number in any face (the kit Odometer is Inter only): every column rolls like an
 *                odometer, so a count in Zodiak reads as counting, never as text swapping.
 *   drifted      a camera that keeps breathing during a hold (system/motion DRIFT: the last frame is never still).
 */
import React from "react";
import { Easing, interpolate } from "remotion";
import type { PageCam, Rect } from "../../camera";
import { EASE } from "../../../lib/anim";
import { DRIFT, FPS, readFrames, readHold } from "../../../system/motion";

export { readFrames, readHold, FPS };
export { PageCrop, mixRect, inflate, INTER_400 } from "../../pass/chat/shared";
export { MarkPatch, PASS_MARK, MARK_COLOR, MARK_COLOR_GOLDMAN } from "../../pass/camera";
export type { MarkPatchSpec } from "../../pass/camera";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** title-demote-to-label: "起步果断、落点很软" (leaves decisively, lands very soft). */
export const DEMOTE = Easing.bezier(0.6, 0, 0.18, 1);

/** 0 to 1 between two frames. */
export const ramp = (f: number, a: number, b: number, easing: (t: number) => number = EASE) =>
  b <= a ? (f >= b ? 1 : 0) : interpolate(f, [a, b], [0, 1], { ...clamp, easing });

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** A hold that breathes: from frame `from`, the camera tightens by DRIFT.scalePerSecond. */
export const drifted = (cam: PageCam, f: number, from: number): PageCam => {
  const t = Math.max(0, f - from) / FPS;
  return { ...cam, cw: cam.cw * (1 - DRIFT.scalePerSecond * t) };
};

/** Canvas rect centre. */
export const centre = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/**
 * blur-slide words. `at` is the first word's start; `out` blurs the whole line away (lift and blur, 10 f).
 * Words are inline-blocks whose layout never changes (only opacity, transform and filter move), so nothing reflows.
 */
export const WordsIn: React.FC<{
  text: string;
  f: number;
  at: number;
  size: number;
  family: string;
  weight: number;
  color: string;
  track?: string;
  stagger?: number;
  win?: number;
  /** Rise, in em. blur-slide: 0.38 main, about 0.2 sub. */
  dy?: number;
  /** Peak blur as a share of the size (blur-slide: 18 px on 170 px, about 0.11). */
  blur?: number;
  out?: { at: number; len?: number };
  align?: "left" | "center";
  lineHeight?: number;
  italic?: boolean;
  maxWidth?: number;
}> = ({ text, f, at, size, family, weight, color, track = "-0.02em", stagger = 4, win = 22, dy = 0.38, blur = 0.11, out, align = "left", lineHeight = 1.12, italic, maxWidth }) => {
  const o = out ? ramp(f, out.at, out.at + (out.len ?? 10), Easing.bezier(0.4, 0, 1, 1)) : 0;
  return (
    <div style={{ fontFamily: family, fontWeight: weight, fontSize: size, color, letterSpacing: track, lineHeight, textAlign: align,
      fontStyle: italic ? "italic" : "normal", whiteSpace: "normal", maxWidth, opacity: 1 - o,
      transform: o ? `translateY(${(-o * 0.25 * size).toFixed(2)}px)` : undefined, filter: o ? `blur(${(o * size * 0.12).toFixed(2)}px)` : undefined }}>
      {text.split(" ").map((w, i) => {
        const p = ramp(f, at + i * stagger, at + i * stagger + win);
        return (
          <span key={i} style={{ display: "inline-block", opacity: p, marginRight: "0.26em",
            transform: `translateY(${((1 - p) * dy * size).toFixed(2)}px)`, filter: p < 1 ? `blur(${((1 - p) * blur * size).toFixed(2)}px)` : undefined }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Column position for a continuous value (the kit Odometer's carry rule: a column turns only on its carry). */
const colPos = (v: number, i: number) => {
  if (i === 0) return v;
  const p = Math.pow(10, i);
  const lower = ((v % p) + p) % p;
  return Math.floor(v / p) + Math.max(0, lower - (p - 1));
};

/**
 * Rolling digits in any face. Each digit sits in a fixed 0.62 em cell so the number never jitters sideways while
 * it counts (Zodiak's figures are proportional). Leading zeros are left empty until a column has a value, so 0 to 22
 * starts as one rolling digit and the tens column rolls in on its first carry.
 */
export const ZDigits: React.FC<{ value: number; digits: number; size: number; color: string; family: string; weight: number; cell?: number }> = ({
  value, digits, size, color, family, weight, cell = 0.62,
}) => {
  const h = size * 1.08;
  const cells = [...Array(12)].map((_, i) => (i + 9) % 10);
  return (
    <div style={{ display: "inline-flex", fontFamily: family, fontWeight: weight, fontSize: size, color, lineHeight: `${h}px`, height: h, overflow: "hidden",
      letterSpacing: 0 }}>
      {[...Array(digits)].map((_, k) => {
        const i = digits - 1 - k;
        const raw = colPos(value, i);
        const pos = ((raw % 10) + 10) % 10;
        // a column above the units shows only once the value reaches it (no leading zero)
        const shown = i === 0 ? 1 : interpolate(value, [Math.pow(10, i) - 1, Math.pow(10, i)], [0, 1], clamp);
        return (
          <div key={k} style={{ width: `${cell}em`, textAlign: "center", opacity: shown, transform: `translateY(${-(pos + 1) * h}px)` }}>
            {cells.map((d, j) => <div key={j} style={{ height: h }}>{d}</div>)}
          </div>
        );
      })}
    </div>
  );
};
