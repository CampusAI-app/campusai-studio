/**
 * Live cursor (2026-11-15, ours, after Skill Stack Store's "20 Claude Effects" reel, 0.25 to 1.3 s, stepped frame by
 * frame). What the reel does: a black arrow cursor with a dark rounded name tag glides in from the left, presses at the
 * top left of the speaker, drags a design-tool selection box (thin gold lines, small square handles at the corners and
 * side middles) around his head and torso, and parks at the box's bottom right corner. About 1 s.
 *
 * Ours: the glide is a curve, not a straight line, and the cursor leans a few degrees into its own travel; the press
 * squashes the arrow; the box is drawn by the drag (it is always the rectangle between the press point and the cursor),
 * then on release the handles pop on one after another and a small size badge lands under the box, the way a design
 * tool shows it. While parked the cursor drifts a hair so the hold is never a freeze. `exitAt` lets the cursor slide
 * off to the right as the box fades.
 *
 * Props: `clip` (full shot with sound, path under public/), `from` (frames trimmed off its start), `box` (the
 * selection in frame px), `name` (the tag), `startAt` (frame the cursor enters), `enter` (where it enters from, frame
 * px, default off the left edge), `exitAt` (optional), `color` (the selection colour), `sound`.
 *
 *   <LiveCursor clip="founder/goal/clip.mp4" box={{ x: 215, y: 640, w: 650, h: 640 }} name="Lucius" startAt={6} />
 */
import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { INTER } from "../parts";
import { IN, SWING, Sfx, clampX, k, mix } from "./shared";

export type LiveCursorProps = {
  clip: string;
  from?: number;
  volume?: number;
  box: { x: number; y: number; w: number; h: number };
  name?: string;
  startAt?: number;
  enter?: { x: number; y: number };
  exitAt?: number;
  color?: string;
  /** Show the W x H badge under the box once it is drawn. */
  badge?: boolean;
  sound?: boolean;
};

const GOLD = "#F5B83D";
// motion, in frames at 30 fps: glide 13, press 3, drag 15, then the handles pop 1 frame apart
const GLIDE = 13;
const PRESS = 3;
const DRAG = 15;
// the glide gets going quickly and decelerates late, so it is still travelling as it reaches the press
const GLIDE_EASE = Easing.bezier(0.4, 0, 0.15, 1);

/** A point on a quadratic curve from a to b that bows by `bow` px to the left of travel. */
const curve = (a: { x: number; y: number }, b: { x: number; y: number }, t: number, bow: number) => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (dy / len) * bow;
  const cy = my - (dx / len) * bow;
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y };
};

/** `flip` 0 to 1 swings the tag from the right of the arrow to its left, so it never runs off the frame. */
const Arrow: React.FC<{ x: number; y: number; press: number; lean: number; name: string; o: number; flip: number }> = ({ x, y, press, lean, name, o, flip }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity: o }}>
    <svg width={104} height={104} viewBox="0 0 24 24" style={{ position: "absolute", left: -18, top: -11, overflow: "visible",
      transform: `rotate(${lean.toFixed(2)}deg) scale(${press.toFixed(4)})`, transformOrigin: "18px 11px",
      filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.38))" }}>
      <path d="M4.2 2.6 L19.4 11.4 L12.4 13.1 L9.1 19.6 Z" fill="#111113" stroke="#FFFFFF" strokeWidth={1.35} strokeLinejoin="round" />
    </svg>
    <div style={{ position: "absolute", left: mix(62, 6, flip), top: 78, whiteSpace: "nowrap", fontFamily: INTER, fontWeight: 600, fontSize: 40,
      lineHeight: 1, letterSpacing: "-0.01em", color: "#FFFFFF", background: "#16161A", padding: "14px 22px 15px", borderRadius: 16,
      boxShadow: "0 8px 22px rgba(0,0,0,0.35), inset 0 0 0 1.5px rgba(255,255,255,0.10)", transform: `translateX(${(-100 * flip).toFixed(2)}%) scale(${mix(0.96, 1, press).toFixed(4)})`,
      transformOrigin: "0 0" }}>
      {name}
    </div>
  </div>
);

export const LiveCursor: React.FC<LiveCursorProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width: W } = useVideoConfig();
  const startAt = p.startAt ?? 6;
  const color = p.color ?? GOLD;
  const b = p.box;
  const tl = { x: b.x, y: b.y };
  const br = { x: b.x + b.w, y: b.y + b.h };
  const enter = p.enter ?? { x: -90, y: b.y + b.h * 0.55 };

  const pressAt = startAt + GLIDE;
  const dragAt = pressAt + PRESS;
  const releaseAt = dragAt + DRAG;

  // where the cursor is: the glide, then the drag, then a slow drift, then (optionally) off to the right
  const glide = k(f, startAt, pressAt, GLIDE_EASE);
  const drag = k(f, dragAt, releaseAt, SWING);
  let pos = curve(enter, tl, glide, 120);
  if (f >= dragAt) pos = curve(tl, br, drag, -36);
  const drift = f > releaseAt ? k(f, releaseAt, releaseAt + 60, SWING) : 0;
  pos = { x: pos.x + 10 * Math.sin(drift * Math.PI * 0.9), y: pos.y + 7 * drift };
  const leave = p.exitAt === undefined ? 0 : k(f, p.exitAt, p.exitAt + 12, IN);
  pos = { x: mix(pos.x, W + 160, leave), y: pos.y - 60 * leave };

  // lean into the travel: a few degrees, from the frame-to-frame motion
  const prevF = f - 1;
  const prevGlide = k(prevF, startAt, pressAt, GLIDE_EASE);
  const prevDrag = k(prevF, dragAt, releaseAt, SWING);
  const prev = prevF >= dragAt ? curve(tl, br, prevDrag, -36) : curve(enter, tl, prevGlide, 120);
  const vx = f > releaseAt ? 0 : pos.x - prev.x;
  const lean = Math.max(-9, Math.min(9, vx * 0.22));

  // the press squashes the arrow, held through the drag, released with a little spring
  const down = f >= pressAt && f < releaseAt ? k(f, pressAt, pressAt + 2) : 0;
  const up = f >= releaseAt ? spring({ frame: f - releaseAt, fps, config: { damping: 10, stiffness: 260, mass: 0.6 } }) : 0;
  const press = f >= releaseAt ? mix(0.86, 1, up) : mix(1, 0.86, down);
  const cursorIn = k(f, startAt, startAt + 4);

  // the selection: the rectangle between the press point and the cursor while dragging, the box once released
  const dragging = f >= dragAt;
  const cur = f >= releaseAt ? br : curve(tl, br, drag, -36);
  const sx = Math.min(tl.x, cur.x);
  const sy = Math.min(tl.y, cur.y);
  const sw = Math.abs(cur.x - tl.x);
  const sh = Math.abs(cur.y - tl.y);
  const boxOut = p.exitAt === undefined ? 0 : k(f, p.exitAt + 2, p.exitAt + 10, IN);
  const boxO = (dragging ? 1 : 0) * (1 - boxOut);

  const handles = [
    [0, 0], [0.5, 0], [1, 0], [1, 0.5], [1, 1], [0.5, 1], [0, 1], [0, 0.5],
  ];
  const H = 24;

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <OffthreadVideo src={staticFile(p.clip)} trimBefore={p.from ?? 0} volume={p.volume ?? 1} style={{ width: "100%", height: "100%" }} />

      {boxO > 0 && sw > 1 && (
        <div style={{ position: "absolute", left: sx, top: sy, width: sw, height: sh, opacity: boxO }}>
          {/* faint fill while the drag is live, gone once it lands */}
          <div style={{ position: "absolute", inset: 0, background: color, opacity: 0.1 * (1 - k(f, releaseAt, releaseAt + 8)) }} />
          <div style={{ position: "absolute", inset: 0, border: `4px solid ${color}`, boxShadow: "0 0 0 1px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.12)" }} />
          {f >= releaseAt &&
            handles.map(([hx, hy], i) => {
              const s = spring({ frame: f - releaseAt - i, fps, config: { damping: 11, stiffness: 240, mass: 0.6 } });
              return (
                <div key={i} style={{ position: "absolute", left: hx * sw - H / 2, top: hy * sh - H / 2, width: H, height: H, background: "#FFFFFF",
                  border: `3px solid ${color}`, boxSizing: "border-box", transform: `scale(${s.toFixed(4)})`, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }} />
              );
            })}
          {(p.badge ?? true) && f >= releaseAt + 4 && (
            <div style={{ position: "absolute", left: sw / 2, top: sh + 26, transform: `translate(-50%, ${mix(-8, 0, k(f, releaseAt + 4, releaseAt + 12)).toFixed(2)}px)`,
              opacity: k(f, releaseAt + 4, releaseAt + 10), whiteSpace: "nowrap", fontFamily: INTER, fontWeight: 600, fontSize: 32, lineHeight: 1,
              fontVariantNumeric: "tabular-nums", color: "#1A1305", background: color, padding: "11px 16px", borderRadius: 9 }}>
              {Math.round(b.w)} × {Math.round(b.h)}
            </div>
          )}
        </div>
      )}

      {f >= startAt && <Arrow x={pos.x} y={pos.y} press={press} lean={lean} flip={k(pos.x, W - 340, W - 220, SWING)} name={p.name ?? "Lucius"} o={cursorIn * interpolate(leave, [0.7, 1], [1, 0], clampX)} />}

      <Sfx at={pressAt} name="switch-tap" volume={0.3} on={p.sound ?? true} />
      <Sfx at={releaseAt} name="hit-weak" volume={0.3} on={p.sound ?? true} />
    </AbsoluteFill>
  );
};
