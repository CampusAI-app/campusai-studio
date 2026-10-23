/**
 * Parts for the Registration film only (round 2, 2026-10-19). kit/parts.tsx stays untouched; the
 * two kit ideas that needed a change are copied here with that change.
 *
 * - HeadLines: the kit's BlurLines, but a line is a list of runs, so only the key words of a line
 *   ("5 days", "preferences") turn italic red instead of the whole line.
 * - WeekGrid: the film's own background, a redraw of the product's week rail
 *   (components/academics/schedule-week-rail.tsx in campusai-demo): five day columns, hour lines at
 *   7% ink, Mon to Fri and 8 AM to 5 PM in the mute label colour. It draws itself in line by line.
 *   No glow, no gradient blob: the planner's own grid is the texture.
 * - TapHand: the kit's Hand, taking a list of taps so one hand walks a whole flow.
 * - Crop: a crop of a real 3x capture; cropping only, nothing drawn on it.
 */
import React from "react";
import { Easing, Img, interpolate, useCurrentFrame } from "remotion";
import { EASE_CAMERA } from "../lib/anim";
import { INTER, Face, Ink, ramp } from "../kit/parts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------------------------------------------------------------- type */

export type Run = { text: string; accent?: boolean };

/** Words arrive one at a time out of a blur, rising slightly. Each line is a list of runs. */
export const HeadLines: React.FC<{ lines: Run[][]; at: number; size: number; ink: Ink; face: Face; stagger?: number; outAt?: number }> = ({
  lines, at, size, ink, face, stagger = 4, outAt,
}) => {
  const f = useCurrentFrame();
  const out = outAt === undefined ? 0 : ramp(f, outAt, outAt + 8);
  let k = 0;
  return (
    <div style={{ fontFamily: face.family, fontWeight: face.weight, fontSize: size, lineHeight: 1.08, letterSpacing: face.track, textAlign: "center",
      opacity: 1 - out, filter: out ? `blur(${out * 12}px)` : undefined }}>
      {lines.map((line, li) => (
        <div key={li}>
          {line.map((run, ri) =>
            run.text.split(" ").filter(Boolean).map((w, wi) => {
              const p = ramp(f, at + k * stagger, at + k * stagger + 14);
              k += 1;
              return (
                <span key={`${ri}-${wi}`} style={{ display: "inline-block", opacity: p, filter: `blur(${(1 - p) * 16}px)`,
                  transform: `translateY(${(1 - p) * 0.28 * size}px)`, marginRight: "0.24em", color: run.accent ? ink.accent : ink.ink,
                  ...(run.accent && face.accentItalic ? { fontStyle: "italic", fontWeight: 400 } : null) }}>{w}</span>
              );
            }),
          )}
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------- the grid */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = ["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"];

/**
 * The product's week grid, drawn at frame size. `at` starts the draw-in; `rowH` is one hour.
 * `top` is where 8 AM sits. Lines are the rail's own 7% ink; labels its mute grey.
 */
export const WeekGrid: React.FC<{ at: number; top: number; rowH: number; left?: number; right?: number; opacity?: number; labels?: boolean }> = ({
  at, top, rowH, left = 120, right = 40, opacity = 1, labels = true,
}) => {
  const f = useCurrentFrame();
  const W = 1080 - left - right;
  const colW = W / 5;
  const h = rowH * HOURS.length;
  const line = "rgba(255,255,255,.075)";
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      {DAYS.map((d, i) => {
        const p = ramp(f, at + i * 2, at + i * 2 + 22, EASE_CAMERA);
        return (
          <React.Fragment key={d}>
            {labels ? (
              <div style={{ position: "absolute", left: left + i * colW, width: colW, top: top - 64, textAlign: "center", fontFamily: INTER, fontWeight: 500,
                fontSize: 28, color: "rgba(255,255,255,.34)", opacity: ramp(f, at + 6 + i * 2, at + 18 + i * 2) }}>{d}</div>
            ) : null}
            <div style={{ position: "absolute", left: left + i * colW, top: top - 14, width: 1.5, height: (h + 28) * p, background: line }} />
          </React.Fragment>
        );
      })}
      {HOURS.map((hr, j) => {
        const p = ramp(f, at + 4 + j * 1.5, at + 26 + j * 1.5, EASE_CAMERA);
        return (
          <React.Fragment key={hr}>
            {labels ? (
              <div style={{ position: "absolute", left: 0, width: left - 18, top: top + j * rowH - 16, textAlign: "right", fontFamily: INTER, fontWeight: 500,
                fontSize: 24, color: "rgba(255,255,255,.26)", fontVariantNumeric: "tabular-nums", opacity: p }}>{hr}</div>
            ) : null}
            <div style={{ position: "absolute", left, top: top + j * rowH, width: W * p, height: 1.5, background: line }} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ----------------------------------------------------------------- hand */

const HAND = "M9 2.5c.83 0 1.5.67 1.5 1.5V10c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V16c0 3.3-2.7 6-6 6h-2.5c-2 0-3.4-.7-4.6-2L3.6 15.6c-.6-.6-.6-1.6 0-2.2s1.6-.6 2.2 0L7.5 15V4c0-.83.67-1.5 1.5-1.5Z";

export type Tap = { x: number; y: number; at: number; travel?: number };

/**
 * One hand through a list of taps (frame pixels). It glides into each tap over `travel` frames
 * (default 12), presses (squash and a ripple), and after the last tap leaves down and right.
 */
export const TapHand: React.FC<{ taps: Tap[]; enterFrom: [number, number]; size?: number; leaveAfter?: number }> = ({ taps, enterFrom, size = 150, leaveAfter = 6 }) => {
  const f = useCurrentFrame();
  if (!taps.length) return null;
  const first = taps[0];
  const t0 = first.at - (first.travel ?? 14);
  const last = taps[taps.length - 1];
  if (f < t0 || f > last.at + leaveAfter + 16) return null;
  let x = enterFrom[0];
  let y = enterFrom[1];
  let prev: [number, number] = enterFrom;
  for (const t of taps) {
    const tr = t.travel ?? 12;
    const p = ramp(f, t.at - tr, t.at - 3, EASE_CAMERA);
    if (p > 0) {
      x = interpolate(p, [0, 1], [prev[0], t.x]);
      y = interpolate(p, [0, 1], [prev[1], t.y]);
    }
    prev = [t.x, t.y];
  }
  const l = ramp(f, last.at + leaveAfter, last.at + leaveAfter + 14, Easing.in(Easing.cubic));
  x += l * 260;
  y += l * 320;
  const press = Math.min(...taps.map((t) => interpolate(f, [t.at - 2, t.at + 2, t.at + 8], [1, 0.84, 1], clamp)));
  const sc = size / 24;
  return (
    <>
      {taps.map((t, i) => {
        const r = ramp(f, t.at + 1, t.at + 18, Easing.out(Easing.cubic));
        return f >= t.at && r < 1 ? (
          <div key={i} style={{ position: "absolute", left: t.x, top: t.y, width: 150 * r, height: 150 * r, transform: "translate(-50%,-50%)",
            borderRadius: "50%", border: "3px solid rgba(255,255,255,.7)", opacity: 1 - r }} />
        ) : null;
      })}
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", left: x - 9 * sc, top: y - 2.5 * sc,
        opacity: ramp(f, t0, t0 + 6) * (1 - l), transform: `scale(${press})`, transformOrigin: `${9 * sc}px ${2.5 * sc}px`,
        filter: "drop-shadow(0 14px 22px rgba(0,0,0,.45))", overflow: "visible" }}>
        <path d={HAND} fill="#fff" stroke="#0b0b0d" strokeWidth={1.1} strokeLinejoin="round" />
        <path d="M10.5 10v2.2M13.5 11v1.6M16.5 11.5v1.2" stroke="#0b0b0d" strokeWidth={1} strokeLinecap="round" opacity={0.55} />
      </svg>
    </>
  );
};

/* ----------------------------------------------------------------- crop */

/** A box on the captured screen, in CSS pixels. Captures are 1100x1400 at 3x, so crops stay sharp. */
export type Box = { x: number; y: number; w: number; h: number };
export const SCREEN_W = 1100;
export const SCREEN_H = 1400;

/** A crop of a real capture, `w` frame pixels wide. Cropping only: nothing is drawn on it. */
export const Crop: React.FC<{ src: string; box: Box; w: number; radius?: number; shadow?: boolean }> = ({ src, box, w, radius = 0, shadow }) => {
  const k = w / box.w;
  return (
    <div style={{ position: "relative", width: w, height: box.h * k, overflow: "hidden", borderRadius: radius,
      boxShadow: shadow ? "0 40px 90px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.07)" : undefined }}>
      <Img src={src} style={{ position: "absolute", left: -box.x * k, top: -box.y * k, width: SCREEN_W * k, height: SCREEN_H * k, maxWidth: "none" }} />
    </div>
  );
};
