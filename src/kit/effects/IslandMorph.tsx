/**
 * Island morph (2026-11-26, from dnyx studios' Find My Dynamic Island film, Muse send 1918bcf7; Jacob: "let's make one
 * like this"). Read frame by frame (Lucius's watch notes, 0.125 s steps over every morph); our own build.
 *
 * One black shape on a light ground that never cuts. It opens from a dot, stretches into a pill, widens, grows into a
 * card, tips back to lie flat in 3D while a pin drops onto it, squashes to a line and opens as the next state. The
 * content swaps INSIDE the shape: the old content blurs out in 3 frames, the new one blurs in over 6 while the shape is
 * still moving, and its letters arrive in the state's accent colour and turn white (`IslandWords`).
 *
 * Numbers taken from the reference (30 fps):
 *   dot to circle ~0.3 s with overshoot; circle to pill ~0.25 s with motion blur on the stretch; pill to pill ~0.2 s;
 *   pill to card ~0.45 s with a glowing edge in the state's accent; card tips back ~0.4 s; pin bounces ~0.8 s;
 *   card to line ~0.2 s, line to the next state ~0.3 s with a comet arc swooshing round it; a full-frame tint flash in
 *   the state's accent at the big changes (the red open, the green unlock), gone in ~0.35 s.
 * How it moves: width and height ride their own springs (width faster, height slower, ratio 0.75, overshoot under 4%),
 * so a stretch leads with its long edge, the way the reference's pill pulls sideways before it grows tall. Every state's
 * change is added on top of the last (superposition), so a state can start before the previous one has settled, which
 * is what keeps it liquid. Speed becomes blur along the direction of travel (an SVG blur, x and y separately).
 *
 * Use: <IslandMorph states={[...]} tilt={[...]} /> with each state's `at` in frames. `content` gets the frames since the
 * state began. `islandProject` gives where a point on the flat card lands on screen (for a pin that stands upright).
 * Worked example: src/trials/post-campus-island.tsx (PostCampusIsland-9x16).
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { INTER } from "../parts";
import { springStep } from "../pass/readout/shared";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type IslandState = {
  /** Frame the shape starts moving into this state. */
  at: number;
  w: number;
  h: number;
  /** Corner radius; a pill (h / 2) when left out. */
  radius?: number;
  /** The state's one accent: its letters arrive in it, its glow and flash use it. */
  accent?: string;
  /** Full-frame tint at the change, in this colour. */
  flash?: string;
  /** How strong the flash starts (0 to 1). Default 0.5. */
  flashPeak?: number;
  /** A glowing edge in the accent while the shape grows into this state (the reference's map card). */
  glow?: boolean;
  /** The inside of the shape. `local` is frames since `at`. */
  content?: (local: number) => React.ReactNode;
  /** Fill colour of the shape. Default near-black. */
  fill?: string;
};

/** A 3D pose for the whole shape, sprung from the last one. rx tips the top away (lay flat), rz turns it on the table. */
export type IslandTilt = { at: number; rx: number; rz: number; dx?: number; dy?: number; scale?: number };

export const ISLAND = { fill: "#050505", zeta: 0.75, settleW: 0.32, settleH: 0.42, perspective: 1700 } as const;

/** Geometry at frame f, as the sum of every state's change so far. */
const geometry = (states: IslandState[], f: number, fps: number) => {
  let w = states[0].w;
  let h = states[0].h;
  let r = states[0].radius ?? states[0].h / 2;
  for (let i = 1; i < states.length; i++) {
    const s = states[i];
    const p = states[i - 1];
    const t = (f - s.at) / fps;
    w += (s.w - p.w) * springStep(t, ISLAND.zeta, ISLAND.settleW);
    h += (s.h - p.h) * springStep(t, ISLAND.zeta, ISLAND.settleH);
    r += ((s.radius ?? s.h / 2) - (p.radius ?? p.h / 2)) * springStep(t, 1, ISLAND.settleH);
  }
  return { w: Math.max(2, w), h: Math.max(2, h), r: Math.max(1, Math.min(r, Math.min(w, h) / 2)) };
};

const pose = (tilt: IslandTilt[] | undefined, f: number, fps: number) => {
  const out = { rx: 0, rz: 0, dx: 0, dy: 0, scale: 1 };
  if (!tilt) return out;
  let prev = { rx: 0, rz: 0, dx: 0, dy: 0, scale: 1 };
  for (const k of tilt) {
    const t = springStep((f - k.at) / fps, 0.82, 0.5);
    const next = { rx: k.rx, rz: k.rz, dx: k.dx ?? 0, dy: k.dy ?? 0, scale: k.scale ?? 1 };
    out.rx += (next.rx - prev.rx) * t;
    out.rz += (next.rz - prev.rz) * t;
    out.dx += (next.dx - prev.dx) * t;
    out.dy += (next.dy - prev.dy) * t;
    out.scale += (next.scale - prev.scale) * t;
    prev = next;
  }
  return out;
};

/** Where a point on the card (px from its centre, before tilt) lands on screen, relative to the shape's centre. */
export const islandProject = (tilt: IslandTilt[] | undefined, f: number, fps: number, px: number, py: number) => {
  const p = pose(tilt, f, fps);
  const rz = (p.rz * Math.PI) / 180;
  const rx = (p.rx * Math.PI) / 180;
  const x1 = (px * Math.cos(rz) - py * Math.sin(rz)) * p.scale;
  const y1 = (px * Math.sin(rz) + py * Math.cos(rz)) * p.scale;
  const y2 = y1 * Math.cos(rx);
  const z2 = y1 * Math.sin(rx);
  const s = ISLAND.perspective / (ISLAND.perspective - z2);
  return { x: x1 * s + p.dx, y: y2 * s + p.dy, depth: s };
};

/** The current state index and its local frame. */
const activeAt = (states: IslandState[], f: number) => {
  let i = 0;
  for (let j = 0; j < states.length; j++) if (f >= states[j].at) i = j;
  return i;
};

export const IslandMorph: React.FC<{
  states: IslandState[];
  tilt?: IslandTilt[];
  /** Centre of the shape on the canvas. */
  x: number;
  y: number;
  fps?: number;
  /** A soft drop shadow under the shape. Default on. */
  shadow?: boolean;
  children?: React.ReactNode;
}> = ({ states, tilt, x, y, fps = 30, shadow = true, children }) => {
  const f = useCurrentFrame();
  const g = geometry(states, f, fps);
  const g0 = geometry(states, f - 1, fps);
  const vw = Math.abs(g.w - g0.w);
  const vh = Math.abs(g.h - g0.h);
  // motion: speed becomes blur along the edge that is moving, as the reference's stretch smears sideways.
  const bx = Math.min(9, vw * 0.14);
  const by = Math.min(7, vh * 0.13);
  const p = pose(tilt, f, fps);
  const idx = activeAt(states, f);
  const id = `island-blur-${Math.round(x)}-${Math.round(y)}`;

  // glow: the accent edge while growing into a `glow` state, fading once it settles
  const gs = states[idx];
  const glowAmt = gs.glow ? interpolate(f - gs.at, [0, 4, 14, 26], [0, 1, 0.8, 0], clamp) : 0;

  const fill = gs.fill ?? ISLAND.fill;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
        </filter>
      </svg>
      <div style={{ position: "absolute", left: x + p.dx, top: y + p.dy, width: 0, height: 0, perspective: ISLAND.perspective }}>
        <div
          style={{
            position: "absolute",
            left: -g.w / 2,
            top: -g.h / 2,
            width: g.w,
            height: g.h,
            borderRadius: g.r,
            background: fill,
            overflow: "hidden",
            transform: `rotateX(${p.rx}deg) rotateZ(${p.rz}deg) scale(${p.scale})`,
            transformStyle: "flat",
            filter: bx + by > 0.4 ? `url(#${id})` : undefined,
            boxShadow: [
              shadow ? `0 ${18 + p.rx * 0.4}px ${50 + p.rx}px rgba(0,0,0,${0.16 + p.rx * 0.002})` : "",
              glowAmt > 0 && gs.accent ? `0 0 ${10 + 40 * glowAmt}px ${6 * glowAmt}px ${gs.accent}` : "",
              glowAmt > 0 && gs.accent ? `inset 0 0 0 ${4 * glowAmt}px ${gs.accent}` : "",
            ].filter(Boolean).join(", ") || undefined,
          }}
        >
          {states.map((s, i) => {
            const end = states[i + 1]?.at ?? Infinity;
            const local = f - s.at;
            if (!s.content || f < s.at || f > end + 4) return null;
            // content: in over 6 frames (blur 12 to 0) starting 2 frames into the move; out in 3 as the next begins
            const inn = interpolate(local, [2, 8], [0, 1], clamp);
            const out = interpolate(f, [end, end + 3], [1, 0], clamp);
            const o = Math.min(inn, out);
            if (o <= 0) return null;
            return (
              <div key={i} style={{ position: "absolute", inset: 0, opacity: o, filter: o < 1 ? `blur(${(1 - o) * 12}px)` : undefined,
                transform: `scale(${0.96 + 0.04 * inn})` }}>
                {s.content(local)}
              </div>
            );
          })}
        </div>
      </div>
      {children}
    </AbsoluteFill>
  );
};

/** The full-frame tint at each state's change (`flash`), decaying in ~0.35 s. Frame 0 can start already tinted. */
export const IslandFlash: React.FC<{ states: IslandState[] }> = ({ states }) => {
  const f = useCurrentFrame();
  return (
    <>
      {states.filter((s) => s.flash).map((s, i) => {
        const o = interpolate(f - s.at, [-1, 0, 11], [0, s.flashPeak ?? 0.5, 0], clamp);
        return o > 0 ? <AbsoluteFill key={i} style={{ background: s.flash, opacity: o }} /> : null;
      })}
    </>
  );
};

/** Letters that arrive one after another in the accent and turn white, as the reference's "Unlocked". */
export const IslandWords: React.FC<{
  text: string;
  local: number;
  accent: string;
  size: number;
  weight?: number;
  color?: string;
  /** Frames between letters. */
  stagger?: number;
  delay?: number;
}> = ({ text, local, accent, size, weight = 600, color = "#ffffff", stagger = 0.7, delay = 3 }) => (
  <span style={{ fontFamily: INTER, fontWeight: weight, fontSize: size, letterSpacing: "-0.02em", whiteSpace: "pre", lineHeight: 1.1 }}>
    {[...text].map((ch, i) => {
      const t = local - delay - i * stagger;
      const o = interpolate(t, [0, 4], [0, 1], clamp);
      const y = interpolate(t, [0, 6], [0.25, 0], clamp);
      const c = interpolate(t, [5, 14], [0, 1], clamp);
      return (
        <span key={i} style={{ display: "inline-block", opacity: o, transform: `translateY(${y}em)`,
          color: c >= 1 ? color : `color-mix(in srgb, ${color} ${Math.round(c * 100)}%, ${accent})` }}>
          {ch}
        </span>
      );
    })}
  </span>
);

/** A map pin that drops onto a point and bounces, with its shadow and a ripple on the ground. */
export const IslandPin: React.FC<{ x: number; y: number; at: number; color: string; size?: number; depth?: number }> = ({
  x, y, at, color, size = 92, depth = 1,
}) => {
  const f = useCurrentFrame();
  const t = (f - at) / 30;
  if (t < 0) return null;
  const s = size * depth;
  const fall = 1 - springStep(t, 0.6, 0.7); // 1 up high, one small overshoot past 0 = the bounce
  const lift = Math.max(-0.05, fall) * 320 * depth;
  const squash = interpolate(fall, [-0.12, 0, 0.12], [0.86, 1, 1.04], clamp);
  const ripple = interpolate(t, [0.12, 0.8], [0, 1], clamp);
  const appear = interpolate(t, [0, 0.08], [0, 1], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: x - s * 0.9 * (0.5 + ripple), top: y - s * 0.28 * (0.5 + ripple),
        width: s * 1.8 * (0.5 + ripple), height: s * 0.56 * (0.5 + ripple), borderRadius: "50%",
        border: `${3 * depth}px solid ${color}`, opacity: (1 - ripple) * 0.8 * (ripple > 0 ? 1 : 0) }} />
      <div style={{ position: "absolute", left: x - s * 0.32, top: y - s * 0.09, width: s * 0.64, height: s * 0.18, borderRadius: "50%",
        background: "rgba(0,0,0,0.35)", filter: `blur(${4 * depth}px)`, opacity: appear * interpolate(fall, [0, 1], [1, 0.25], clamp) }} />
      <div style={{ position: "absolute", left: x - s / 2, top: y - s * 1.55 - lift, width: s, height: s * 1.55, opacity: appear,
        transform: `scaleY(${squash}) scaleX(${2 - squash})`, transformOrigin: "50% 100%" }}>
        <div style={{ position: "absolute", left: s * 0.47, top: s * 0.8, width: s * 0.06, height: s * 0.75, borderRadius: s * 0.03,
          background: "#ffffff", boxShadow: "0 0 0 1px rgba(0,0,0,0.12)" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: s, height: s, borderRadius: "50%", background: color,
          boxShadow: `0 ${6 * depth}px ${18 * depth}px rgba(0,0,0,0.28), inset 0 -${6 * depth}px ${10 * depth}px rgba(0,0,0,0.15), 0 0 0 ${5 * depth}px #ffffff` }}>
          <div style={{ position: "absolute", left: s * 0.36, top: s * 0.36, width: s * 0.28, height: s * 0.28, borderRadius: "50%", background: "#ffffff" }} />
        </div>
      </div>
    </>
  );
};

/** The comet that swooshes round the shape as it opens from a line (the reference's blue arc), motion-blurred. */
export const IslandComet: React.FC<{ x: number; y: number; w: number; h: number; at: number; color: string; frames?: number }> = ({
  x, y, w, h, at, color, frames = 20,
}) => {
  const f = useCurrentFrame();
  const t = interpolate(f - at, [0, frames], [0, 1], clamp);
  if (f < at || t >= 1) return null;
  const rx = w * 0.62;
  const ry = h * 0.9;
  // an ellipse path from lower left, under the shape, up the right side
  const head = 0.15 + 0.85 * t;
  const tail = Math.max(0, head - 0.42);
  const len = 1000;
  const fade = interpolate(t, [0, 0.15, 0.75, 1], [0, 1, 1, 0], clamp);
  return (
    <svg style={{ position: "absolute", left: x - rx - 40, top: y - ry - 40, width: rx * 2 + 80, height: ry * 2 + 80, overflow: "visible", opacity: fade }}>
      <defs>
        <filter id={`comet-${at}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3 2" /></filter>
        <linearGradient id={`comet-g-${at}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="1" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path
        d={`M ${40 + rx * 0.05} ${40 + ry * 1.55} A ${rx} ${ry} 0 0 0 ${40 + rx * 2.02} ${40 + ry * 0.4}`}
        pathLength={len}
        fill="none"
        stroke={`url(#comet-g-${at})`}
        strokeWidth={16}
        strokeLinecap="round"
        strokeDasharray={`${(head - tail) * len} ${len}`}
        strokeDashoffset={-tail * len}
        filter={`url(#comet-${at})`}
      />
    </svg>
  );
};

/** Dots that fly in from a scatter and settle into a mark, which resolves sharp with a glow as they land. */
export const IslandParticleLogo: React.FC<{
  src: string;
  x: number;
  y: number;
  width: number;
  ratio: number;
  at: number;
  frames?: number;
  count?: number;
  glow?: string;
}> = ({ src, x, y, width, ratio, at, frames = 30, count = 150, glow = "rgba(255,255,255,0.55)" }) => {
  const f = useCurrentFrame();
  const h = width / ratio;
  const t = interpolate(f - at, [0, frames], [0, 1], clamp);
  if (f < at - 1) return null;
  const rnd = (i: number, s: number) => {
    const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const ease = (u: number) => 1 - Math.pow(1 - u, 3);
  const logoIn = interpolate(t, [0.3, 0.8], [0, 1], clamp);
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const delay = rnd(i, 1) * 0.35;
        const u = ease(interpolate(t, [delay, delay + 0.6], [0, 1], clamp));
        const sx = x + (rnd(i, 2) - 0.5) * 1100;
        const sy = y + (rnd(i, 3) - 0.5) * 900;
        const tx = x - width / 2 + rnd(i, 4) * width;
        const ty = y - h / 2 + rnd(i, 5) * h;
        const o = interpolate(t, [delay, delay + 0.14], [0, 1], clamp) * interpolate(u, [0.85, 1], [1, 0], clamp) * (1 - logoIn * 0.8);
        const r = 2 + rnd(i, 6) * 4;
        return (
          <div key={i} style={{ position: "absolute", left: sx + (tx - sx) * u - r, top: sy + (ty - sy) * u - r, width: r * 2, height: r * 2,
            borderRadius: "50%", background: "#ffffff", opacity: o, boxShadow: `0 0 ${r * 3}px ${glow}` }} />
        );
      })}
      <img src={src} style={{ position: "absolute", left: x - width / 2, top: y - h / 2, width, height: h, opacity: logoIn,
        filter: `blur(${(1 - logoIn) * 6}px) drop-shadow(0 0 ${18 + 14 * logoIn}px ${glow})` }} />
    </>
  );
};
