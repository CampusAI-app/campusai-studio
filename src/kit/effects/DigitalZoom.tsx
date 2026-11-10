/**
 * Digital zoom: a phone camera's interface over a talking shot that punches in on the face in steps. Four white
 * corner brackets, a blinking red record dot, a yellow focus square that finds the face and locks on (it shrinks
 * onto it with a small settle, and re-locks after every punch), and a zoom readout bottom right that steps with
 * each punch. Each punch is fast (about 4 frames), lands with a hair of overshoot and holds.
 * From @mrcreates.ai's "17 Video Effects" reel (4.9 to 5.6 s), watched frame by frame, Nov 10.
 *
 * Props: `clip` (full shot with sound, path under public/), `from` (frames trimmed off its start), `source` (its
 * pixel size), `face` (centre and head width in source px), `steps` (each punch: the frame it LANDS on, the zoom,
 * and the source point held at the frame centre), `focusAt` (frame the focus square appears), `punchFrames`, `sfx`.
 * The clip is scaled as an element (OffthreadVideo), never re-rendered small and blown up.
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { INTER } from "../parts";
import { OUT, SWING, Sfx, clampX, k, mix } from "./shared";

type Pt = { x: number; y: number };
export type ZoomStep = { at: number; zoom: number; centre: Pt };
export type DigitalZoomProps = {
  clip: string;
  from: number;
  source: { w: number; h: number };
  face: Pt & { size: number };
  steps: ZoomStep[];
  focusAt?: number;
  punchFrames?: number;
  sfx?: boolean;
};

const YELLOW = "#FFD60A";
const RED = "#FF3B30";

/** Zoom and camera centre at frame f: holds between steps, punches into each one. */
const cameraAt = (f: number, p: DigitalZoomProps, W: number, H: number) => {
  const punch = p.punchFrames ?? 4;
  let base = 1;
  let over = 0;
  let c: Pt = { x: p.source.w / 2, y: p.source.h / 2 };
  let blur = 0;
  for (const s of p.steps) {
    const a = s.at - punch;
    if (f < a) break;
    const t = k(f, a, s.at, OUT);
    base = mix(base, s.zoom, t);
    c = { x: mix(c.x, s.centre.x, t), y: mix(c.y, s.centre.y, t) };
    // a hair past the target, then settle back over 6 frames: the landing reads as a thunk, not a creep
    over = f <= s.at ? t : 1 - k(f, s.at, s.at + 6, SWING);
    if (f < s.at + 1) blur = 3.2 * Math.sin(Math.PI * interpolate(f, [a, s.at + 1], [0, 1], clampX));
  }
  const z = base * (1 + 0.02 * over);
  // never show past the edge of the shot
  const hw = W / 2 / z;
  const hh = H / 2 / z;
  c = { x: Math.min(p.source.w - hw, Math.max(hw, c.x)), y: Math.min(p.source.h - hh, Math.max(hh, c.y)) };
  return { z, c, blur };
};

const Brackets: React.FC<{ W: number; H: number; inset: number; arm: number; o: number }> = ({ W, H, inset, arm, o }) => {
  const d = (x: number, y: number, sx: number, sy: number) => `M ${x} ${y + sy * arm} L ${x} ${y} L ${x + sx * arm} ${y}`;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: o, filter: "drop-shadow(0 1px 5px rgba(0,0,0,0.35))" }}>
      {[d(inset, inset, 1, 1), d(W - inset, inset, -1, 1), d(W - inset, H - inset, -1, -1), d(inset, H - inset, 1, -1)].map((p, i) => (
        <path key={i} d={p} stroke="white" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
};

/** The focus square: four sides with the small inward ticks a phone camera draws at each side's middle. */
const FocusSquare: React.FC<{ x: number; y: number; size: number; o: number }> = ({ x, y, size, o }) => {
  const s = size;
  const tick = Math.max(12, s * 0.06);
  return (
    <svg width={s + 8} height={s + 8} style={{ position: "absolute", left: x - s / 2 - 4, top: y - s / 2 - 4, opacity: o, overflow: "visible",
      filter: "drop-shadow(0 0 3px rgba(0,0,0,0.3))" }}>
      <g transform="translate(4 4)" stroke={YELLOW} strokeWidth={4} fill="none">
        <rect x={0} y={0} width={s} height={s} />
        <path d={`M ${s / 2} 0 L ${s / 2} ${tick} M ${s / 2} ${s} L ${s / 2} ${s - tick} M 0 ${s / 2} L ${tick} ${s / 2} M ${s} ${s / 2} L ${s - tick} ${s / 2}`} />
      </g>
    </svg>
  );
};

export const DigitalZoom: React.FC<DigitalZoomProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const { z, c, blur } = cameraAt(f, p, W, H);
  const focusAt = p.focusAt ?? 6;

  // where the face is on screen right now
  const fx = (p.face.x - c.x) * z + W / 2;
  const fy = (p.face.y - c.y) * z + H / 2;

  // the focus square: finds the face (shrinks onto it with a little settle), and re-locks after each punch
  const locks = [focusAt, ...p.steps.map((s) => s.at)];
  const last = [...locks].reverse().find((l) => f >= l);
  const firstLock = spring({ frame: f - focusAt, fps, config: { damping: 11, stiffness: 170, mass: 0.8 } });
  let grow = 1;
  let o = 0;
  if (last !== undefined) {
    const isFirst = last === focusAt;
    const sp = spring({ frame: f - last, fps, config: { damping: 12, stiffness: 190, mass: 0.7 } });
    grow = isFirst ? mix(2.1, 1, firstLock) : mix(1.28, 1, sp);
    // bright while it locks, then it rests a little dimmer
    o = (isFirst ? k(f, focusAt, focusAt + 4) : 1) * mix(1, 0.62, k(f, last + 22, last + 32, SWING));
  }
  const size = Math.min(560, Math.max(200, p.face.size * z * 1.2)) * grow;

  // the readout: the step that has landed
  const landed = [...p.steps].reverse().find((s) => f >= s.at);
  const value = landed ? landed.zoom : 1;
  const label = value < 1.05 ? "1x" : `${value.toFixed(1)}x`;
  const pop = landed ? mix(1.16, 1, k(f, landed.at, landed.at + 8)) : 1;

  // the record dot blinks once a second, easing in and out
  const phase = (f % fps) / fps;
  const rec = phase < 0.62 ? 1 : interpolate(phase, [0.62, 0.72, 0.9, 1], [1, 0.15, 0.15, 1], clampX);
  const ui = k(f, 0, 6);

  return (
    <AbsoluteFill style={{ background: "black", overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: p.source.w, height: p.source.h, transformOrigin: "0 0",
          transform: `translate(${W / 2}px, ${H / 2}px) scale(${z.toFixed(5)}) translate(${-c.x}px, ${-c.y}px)` }}>
          <OffthreadVideo src={staticFile(p.clip)} trimBefore={p.from} style={{ width: p.source.w, height: p.source.h, display: "block" }} />
        </div>
      </AbsoluteFill>

      <Brackets W={W} H={H} inset={70} arm={88} o={ui} />
      <div style={{ position: "absolute", left: 116, top: 124, width: 26, height: 26, borderRadius: 13, background: RED, opacity: ui * rec,
        boxShadow: "0 0 0 3px rgba(255,255,255,0.18), 0 1px 6px rgba(0,0,0,0.35)" }} />

      {o > 0 && <FocusSquare x={fx} y={fy} size={size} o={o} />}

      <div style={{ position: "absolute", right: 112, bottom: 150, opacity: ui, transform: `scale(${pop.toFixed(4)})`, transformOrigin: "100% 50%",
        fontFamily: INTER, fontWeight: 600, fontSize: 46, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em",
        color: value < 1.05 ? "white" : YELLOW, background: "rgba(0,0,0,0.42)", padding: "16px 26px", borderRadius: 999 }}>
        {label}
      </div>

      <Sfx at={focusAt + 8} name="switch-tap" volume={0.28} on={p.sfx ?? true} />
    </AbsoluteFill>
  );
};

