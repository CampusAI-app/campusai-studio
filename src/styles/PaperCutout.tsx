/**
 * /paper-cutout (2026-11-05, from the Nov 5 Muse send of Tobi's (@tobiadonadon_) cartoon story reels; his flat
 * paper-cutout look is the one of the three we can draw in code): a storybook told in layers of cut paper.
 * Hills, buildings, trees and one small student are cut-paper shapes, each with real paper grain, a slightly
 * torn edge and a soft drop shadow onto the layer behind, which is the depth that sells cut paper. The layers
 * slide at different speeds as she walks (parallax), every new piece pops up like a pop-up book as it slides
 * in, and the time of day carries the story: each beat names its own light, from afternoon into night, when the
 * windows light up. The payoff names CampusAI in words only: its screens only ever come from real captures.
 * No boil filter here on purpose: /pov-doodle wobbles, paper sits still and slides.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR, readHold } from "../system/motion";
import { Clip, Cue, HeldLogo, INTER, PAPER, PRINT, RED, ZODIAK, clamp, ramp } from "./common";

export type TimeOfDay = "afternoon" | "golden" | "dusk" | "night";
/** What pops into the world during a beat. `library` a columned library, `houses` a row of small houses,
 * `hills` open hills while the sun goes down, `stars` the moon and the stars. */
export type PaperScene = "library" | "houses" | "hills" | "stars";

export type PaperCutoutProps = {
  /** The story, one beat per line: what pops up, the light it is told in, and its caption. 3 to 5 reads best. */
  beats: { scene: PaperScene; time: TimeOfDay; caption: string }[];
  /** The payoff, told at night at a lit window: the line, its one red word, and a smaller line under it. */
  payoff: string;
  accent: string;
  sub: string;
};

/* ---------------- timing ---------------- */
const IN = 12;
const OUT = 10;
const hold = (text: string) => Math.round(readHold(text) * 30);
const beatLen = (caption: string) => IN + hold(caption) + OUT;
/** Frame each beat starts on; the last entry is the payoff's start. */
export const paperStarts = (p: Pick<PaperCutoutProps, "beats">) => {
  const s: number[] = [];
  let n = 0;
  for (const b of p.beats) { s.push(n); n += beatLen(b.caption); }
  s.push(n);
  return s;
};
/** The payoff holds its two lines, plus the walk to the door and the window lighting. */
const payoffLen = (p: Pick<PaperCutoutProps, "payoff" | "sub">) => IN + hold(`${p.payoff} ${p.sub}`) + 26;
export const paperEnd = (p: Pick<PaperCutoutProps, "beats" | "payoff" | "sub">) => paperStarts(p)[p.beats.length] + payoffLen(p);

/* ---------------- paper colours (the scene's own; the one accent stays CampusAI red) ---------------- */
type Pal = {
  skyTop: string; skyBot: string; sun: string; cloud: string; far: string; mid: string; near: string; ground: string;
  path: string; front: string; wall: string; wall2: string; trim: string; roof: string; leaf: string; trunk: string;
};
const PAL: Record<TimeOfDay, Pal> = {
  afternoon: {
    skyTop: "#9dcfdb", skyBot: "#e6f1e2", sun: "#fbe3a2", cloud: "#f8f4ea", far: "#a9cc9d", mid: "#7ab36d", near: "#5c9a57",
    ground: "#4c8a4d", path: "#ecdcb8", front: "#3e7843", wall: "#d8a785", wall2: "#ead9bd", trim: "#f6eddc", roof: "#7d5a4a",
    leaf: "#3f7e4a", trunk: "#6e4a3a",
  },
  golden: {
    skyTop: "#f0b98c", skyBot: "#f8e1b4", sun: "#fbd28e", cloud: "#f9dcc0", far: "#c2b47e", mid: "#93a35d", near: "#6c8b4c",
    ground: "#5a7c45", path: "#eccb9c", front: "#4b6c3e", wall: "#d99b78", wall2: "#efcfa8", trim: "#f7e5ca", roof: "#7a4f42",
    leaf: "#4d7442", trunk: "#6a4637",
  },
  dusk: {
    skyTop: "#5b4c8c", skyBot: "#d690a0", sun: "#f2a77c", cloud: "#b88aa9", far: "#77709a", mid: "#56717e", near: "#415e64",
    ground: "#344f53", path: "#a8939e", front: "#2b4347", wall: "#9b7a86", wall2: "#a99aae", trim: "#c9b7c2", roof: "#4b3a4f",
    leaf: "#2f4b4f", trunk: "#4a3842",
  },
  night: {
    skyTop: "#181c3a", skyBot: "#3a3468", sun: "#f3dfae", cloud: "#3c3a63", far: "#2c3159", mid: "#22374a", near: "#1c2e3c",
    ground: "#172833", path: "#57566f", front: "#122029", wall: "#5a4f6a", wall2: "#615b7c", trim: "#837d9c", roof: "#272339",
    leaf: "#16262f", trunk: "#2b2534",
  },
};
const WINDOW_LIT = "#ffd37e";
const WINDOW_DARK = "#7d8fa3";
const SKIN = "#c68b67";
const HAIR = "#2a1c1f";
const COAT = "#2f6b70";
const COAT_DEEP = "#24545a";
const TROUSERS = "#2a2c45";

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const x = hex(a), y = hex(b);
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
};
const mixPal = (a: Pal, b: Pal, t: number) =>
  Object.fromEntries((Object.keys(a) as (keyof Pal)[]).map((k) => [k, mix(a[k], b[k], t)])) as Pal;
const NIGHT_RANK: Record<TimeOfDay, number> = { afternoon: 0, golden: 0.15, dusk: 0.55, night: 1 };

/* ---------------- shapes ---------------- */
const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
/** Rolling hills: one smooth curve through random crests, closed down past the bottom of the frame. */
const hills = (len: number, base: number, amp: number, period: number, seed: number, bottom: number) => {
  const r = rng(seed);
  const pts: [number, number][] = [];
  for (let x = -period; x <= len + period * 2; x += period) pts.push([x, base - amp * (0.3 + 0.7 * r())]);
  let d = `M${pts[0][0]} ${bottom} L${pts[0][0]} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d} L${pts[pts.length - 1][0]} ${bottom} Z`;
};
const cloudPath = (w: number) => {
  const h = w * 0.34;
  return `M0 0 C${-w * 0.08} 0 ${-w * 0.1} ${-h * 0.62} ${w * 0.12} ${-h * 0.6} C${w * 0.16} ${-h * 1.12} ${w * 0.46} ${-h * 1.18} ${w * 0.52} ${-h * 0.72}
    C${w * 0.6} ${-h * 1.02} ${w * 0.9} ${-h * 0.92} ${w * 0.86} ${-h * 0.42} C${w * 1.08} ${-h * 0.42} ${w * 1.1} 0 ${w} 0 Z`;
};
const star = (r: number) => `M0 ${-r} Q${r * 0.18} ${-r * 0.18} ${r} 0 Q${r * 0.18} ${r * 0.18} 0 ${r} Q${-r * 0.18} ${r * 0.18} ${-r} 0 Q${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`;

/* ---------------- the paper itself ---------------- */
/** Two filters. `pc-sheet` for big layers, `pc-piece` for small cut pieces: a torn edge, grain, pale fibres,
 * a lit top rim, and a drop shadow onto whatever sits behind. Seeds are fixed, so the paper never crawls. */
const PaperDefs: React.FC = () => (
  <defs>
    {[
      { id: "pc-sheet", edge: 0.03, tear: 7, dy: 11, blur: 13, op: 0.36 },
      { id: "pc-piece", edge: 0.06, tear: 3, dy: 5, blur: 5, op: 0.4 },
    ].map((p) => (
      <filter key={p.id} id={p.id} x="-8%" y="-20%" width="116%" height="150%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency={p.edge} numOctaves={2} seed={3} result="e" />
        <feDisplacementMap in="SourceGraphic" in2="e" scale={p.tear} xChannelSelector="R" yChannelSelector="G" result="s" />
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={8} result="g" />
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.8 0.42" result="gd" />
        <feComposite in="gd" in2="s" operator="in" result="grain" />
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves={3} seed={5} result="m" />
        <feColorMatrix in="m" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.36 -0.16" result="ml" />
        <feComposite in="ml" in2="s" operator="in" result="fibre" />
        <feOffset in="s" dy={p.tear * 0.6 + 1.5} result="down" />
        <feComposite in="s" in2="down" operator="out" result="rimS" />
        <feColorMatrix in="rimS" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.32 0" result="rim" />
        <feMerge result="paper">
          <feMergeNode in="s" />
          <feMergeNode in="fibre" />
          <feMergeNode in="grain" />
          <feMergeNode in="rim" />
        </feMerge>
        <feDropShadow in="paper" dx={0} dy={p.dy} stdDeviation={p.blur} floodColor="#120a16" floodOpacity={p.op} />
      </filter>
    ))}
    <filter id="pc-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation={18} />
    </filter>
  </defs>
);

/** A cut piece that pops up from its base like a pop-up book page, with a little overshoot. */
/** `abs`: the children are drawn in frame coordinates, so the pop pivots on (x, y) without moving them. */
const Pop: React.FC<{ x: number; y: number; at: number; tilt?: number; abs?: boolean; children: React.ReactNode }> = ({ x, y, at, tilt = 0, abs, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const k = spring({ frame: f - at, fps, config: { damping: 9, stiffness: 150, mass: 0.7 } });
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((1 - Math.min(1, k)) * tilt).toFixed(2)}) scale(${(0.86 + 0.14 * Math.min(1.05, k)).toFixed(3)} ${k.toFixed(3)})${abs ? ` translate(${-x} ${-y})` : ""}`}>
      {children}
    </g>
  );
};

/* ---------------- buildings and trees (local coordinates: base centre at 0,0) ---------------- */
const Window: React.FC<{ x: number; y: number; w: number; h: number; lit: number; c: Pal }> = ({ x, y, w, h, lit, c }) => (
  <g>
    {lit > 0.02 ? <rect x={x - w * 0.5} y={y - h * 0.4} width={w * 2} height={h * 1.8} rx={w} fill={WINDOW_LIT} opacity={0.45 * lit} filter="url(#pc-glow)" /> : null}
    <rect x={x} y={y} width={w} height={h} rx={4} fill={mix(mix(WINDOW_DARK, c.wall, 0.35), WINDOW_LIT, lit)} />
    <rect x={x + w / 2 - 2} y={y} width={4} height={h} fill={c.trim} opacity={0.8} />
  </g>
);

const Library: React.FC<{ c: Pal; lit: number; u: number }> = ({ c, lit, u }) => {
  const w = 560 * u, h = 250 * u;
  const cols = 6, pw = 250 * u, ph = 230 * u;
  return (
    <g>
      <g filter="url(#pc-sheet)">
        <rect x={-w / 2} y={-h} width={w} height={h} fill={c.wall} />
        <rect x={-w / 2 - 10 * u} y={-h - 18 * u} width={w + 20 * u} height={22 * u} fill={c.trim} />
        <path d={`M${-w * 0.28} ${-h - 18 * u} L0 ${-h - 96 * u} L${w * 0.28} ${-h - 18 * u} Z`} fill={c.roof} />
      </g>
      <g filter="url(#pc-piece)">
        {[-1, 1].map((s) =>
          [0, 1].map((r) => [0, 1].map((q) => (
            <Window key={`${s}${r}${q}`} x={s * (w / 2 - 62 * u - q * 70 * u) - (s < 0 ? 0 : 44 * u)} y={-h + 36 * u + r * 100 * u} w={44 * u} h={66 * u} lit={lit} c={c} />
          ))),
        )}
      </g>
      <g filter="url(#pc-piece)">
        <path d={`M${-pw / 2 - 16 * u} ${-ph} L0 ${-ph - 74 * u} L${pw / 2 + 16 * u} ${-ph} Z`} fill={c.trim} />
        <rect x={-pw / 2 - 16 * u} y={-ph} width={pw + 32 * u} height={20 * u} fill={c.wall2} />
        {Array.from({ length: cols }, (_, i) => (
          <rect key={i} x={-pw / 2 + i * (pw / (cols - 1)) - 9 * u} y={-ph + 20 * u} width={18 * u} height={ph - 44 * u} fill={c.trim} />
        ))}
        <rect x={-pw / 2 - 30 * u} y={-24 * u} width={pw + 60 * u} height={12 * u} fill={c.wall2} />
        <rect x={-pw / 2 - 46 * u} y={-12 * u} width={pw + 92 * u} height={12 * u} fill={c.trim} />
      </g>
    </g>
  );
};

const House: React.FC<{ c: Pal; lit: number; u: number; w: number; h: number; tone: number }> = ({ c, lit, u, w, h, tone }) => (
  <g>
    <g filter="url(#pc-sheet)">
      <rect x={-w * u / 2} y={-h * u} width={w * u} height={h * u} fill={mix(c.wall2, c.wall, tone)} />
      <path d={`M${-w * u / 2 - 16 * u} ${-h * u} L0 ${-h * u - w * u * 0.46} L${w * u / 2 + 16 * u} ${-h * u} Z`} fill={c.roof} />
    </g>
    <g filter="url(#pc-piece)">
      <Window x={-w * u * 0.3} y={-h * u * 0.72} w={34 * u} h={44 * u} lit={lit} c={c} />
      <Window x={w * u * 0.3 - 34 * u} y={-h * u * 0.72} w={34 * u} h={44 * u} lit={lit * (tone > 0.5 ? 0 : 1)} c={c} />
      <rect x={-16 * u} y={-62 * u} width={32 * u} height={62 * u} rx={14 * u} fill={c.roof} />
    </g>
  </g>
);

const Tree: React.FC<{ c: Pal; u: number; s: number; round: boolean }> = ({ c, u, s, round }) => (
  <g filter="url(#pc-piece)">
    <rect x={-7 * u * s} y={-70 * u * s} width={14 * u * s} height={72 * u * s} rx={5} fill={c.trunk} />
    {round ? (
      <ellipse cx={0} cy={-120 * u * s} rx={66 * u * s} ry={76 * u * s} fill={c.leaf} />
    ) : (
      <path d={`M0 ${-232 * u * s} C${30 * u * s} ${-160 * u * s} ${58 * u * s} ${-90 * u * s} ${46 * u * s} ${-58 * u * s} L${-46 * u * s} ${-58 * u * s} C${-58 * u * s} ${-90 * u * s} ${-30 * u * s} ${-160 * u * s} 0 ${-232 * u * s} Z`} fill={c.leaf} />
    )}
  </g>
);

/** The house the story ends at: two floors, a door she walks into, an upstairs window where she ends up studying. */
const Dorm: React.FC<{ c: Pal; u: number; doorGlow: number; lit: number; seat: number }> = ({ c, u, doorGlow, lit, seat }) => {
  const w = 400 * u, h = 470 * u;
  const wx = -w * 0.32, wy = -h + 70 * u, ww = 150 * u, wh = 140 * u;
  return (
    <g>
      <g filter="url(#pc-sheet)">
        <rect x={-w / 2} y={-h} width={w} height={h} fill={c.wall2} />
        <path d={`M${-w / 2 - 22 * u} ${-h} L${-w * 0.1} ${-h - 190 * u} L${w / 2 + 22 * u} ${-h} Z`} fill={c.roof} />
        <rect x={w * 0.22} y={-h - 150 * u} width={44 * u} height={110 * u} fill={c.roof} />
      </g>
      {/* the upstairs window: lights warm, then she pops in at her desk */}
      <rect x={wx - ww * 0.6} y={wy - wh * 0.5} width={ww * 2.2} height={wh * 2} rx={ww} fill={WINDOW_LIT} opacity={0.6 * lit} filter="url(#pc-glow)" />
      <g filter="url(#pc-piece)">
        <rect x={wx} y={wy} width={ww} height={wh} rx={6 * u} fill={mix(mix(WINDOW_DARK, c.wall, 0.4), WINDOW_LIT, lit)} />
      </g>
      <svg x={wx} y={wy} width={ww} height={wh} overflow="hidden">
        <g transform={`translate(${ww * 0.42} ${wh + (1 - seat) * wh * 0.9})`}>
          <g filter="url(#pc-piece)">
            {/* shoulders, head and bun in silhouette, a red book open on the desk */}
            <path d={`M${-52 * u} 0 C${-50 * u} ${-48 * u} ${-30 * u} ${-62 * u} 0 ${-62 * u} C${30 * u} ${-62 * u} ${48 * u} ${-44 * u} ${50 * u} 0 Z`} fill={COAT_DEEP} />
            <circle cx={4 * u} cy={-86 * u} r={25 * u} fill={HAIR} />
            <circle cx={-20 * u} cy={-106 * u} r={13 * u} fill={HAIR} />
            <rect x={-64 * u} y={-14 * u} width={150 * u} height={16 * u} fill={c.roof} />
            <path d={`M${26 * u} ${-14 * u} L${52 * u} ${-34 * u} L${80 * u} ${-14 * u} Z`} fill={RED} />
          </g>
        </g>
      </svg>
      <rect x={wx + ww / 2 - 3 * u} y={wy} width={6 * u} height={wh} fill={c.trim} />
      <rect x={wx - 8 * u} y={wy + wh - 4 * u} width={ww + 16 * u} height={14 * u} fill={c.trim} />
      <g filter="url(#pc-piece)">
        <Window x={w * 0.12} y={wy + 10 * u} w={64 * u} h={110 * u} lit={lit * 0.85} c={c} />
        <rect x={w * 0.14} y={-150 * u} width={78 * u} height={150 * u} rx={36 * u} fill={mix(c.roof, WINDOW_LIT, doorGlow)} />
        <Window x={-w * 0.36} y={-170 * u} w={110 * u} h={92 * u} lit={lit * 0.6} c={c} />
      </g>
      {doorGlow > 0.02 ? <rect x={w * 0.08} y={-170 * u} width={120 * u} height={190 * u} rx={50 * u} fill={WINDOW_LIT} opacity={0.4 * doorGlow} filter="url(#pc-glow)" /> : null}
    </g>
  );
};

/* ---------------- the student: flat cut pieces, a red backpack, nothing drawn like a real person ---------------- */
/** `rise` pops her up from her feet on the first frames, like every other piece. */
const Student: React.FC<{ x: number; y: number; u: number; phase: number; walk: number; fold: number; rise: number }> = ({ x, y, u, phase, walk, fold, rise }) => {
  if (fold >= 1) return null;
  const sw = Math.sin(phase) * 24 * walk;
  const bob = -Math.abs(Math.cos(phase)) * 6 * walk;
  const tail = Math.sin(phase + 0.8) * 7 * walk;
  const s = u * 1.3;
  const leg = (rot: number, tone: string) => (
    <g transform={`rotate(${rot.toFixed(2)} 0 -118)`} filter="url(#pc-piece)">
      <rect x={-13} y={-124} width={26} height={118} rx={11} fill={tone} />
      <path d="M-14 -8 L22 -8 C30 -8 32 4 24 4 L-14 4 Z" fill={HAIR} />
    </g>
  );
  return (
    <g transform={`translate(${x.toFixed(1)} ${(y + bob * s).toFixed(1)}) scale(${s.toFixed(3)} ${(s * (1 - fold) * rise).toFixed(3)})`}>
      {leg(-sw, mix(TROUSERS, "#000000", 0.25))}
      <g transform={`rotate(${(sw * 0.8).toFixed(2)} -2 -236)`} filter="url(#pc-piece)">
        <rect x={-15} y={-240} width={28} height={104} rx={13} fill={COAT_DEEP} />
      </g>
      <g filter="url(#pc-piece)">
        <rect x={-74} y={-252} width={56} height={104} rx={18} fill={RED} />
        <rect x={-66} y={-200} width={40} height={30} rx={8} fill={mix(RED, "#000000", 0.18)} />
      </g>
      <g filter="url(#pc-piece)">
        <path d="M-34 -254 C-12 -262 14 -262 34 -254 L48 -112 C20 -104 -22 -104 -50 -112 Z" fill={COAT} />
        <path d="M-18 -254 L-8 -228 L4 -254 Z" fill={COAT_DEEP} />
      </g>
      <g filter="url(#pc-piece)">
        <path d="M-6 -256 L4 -256 L-4 -170 L-16 -170 Z" fill={RED} />
      </g>
      {leg(sw, TROUSERS)}
      <g filter="url(#pc-piece)">
        <rect x={-8} y={-284} width={20} height={34} rx={8} fill={SKIN} />
        <circle cx={6} cy={-300} r={40} fill={SKIN} />
        <path d="M-36 -296 C-40 -346 32 -356 46 -314 C26 -326 2 -326 -8 -306 C-14 -296 -20 -284 -30 -270 Z" fill={HAIR} />
        <circle cx={-44 + tail * 0.4} cy={-322 + Math.abs(tail) * 0.3} r={19} fill={HAIR} />
        <circle cx={30} cy={-302} r={4.5} fill={HAIR} />
        <circle cx={34} cy={-284} r={7} fill="#d97e6a" opacity={0.5} />
      </g>
      <g transform={`rotate(${(-sw * 0.9).toFixed(2)} 4 -240)`} filter="url(#pc-piece)">
        <rect x={-10} y={-244} width={28} height={108} rx={13} fill={mix(COAT, "#ffffff", 0.08)} />
        <circle cx={4} cy={-136} r={13} fill={SKIN} />
      </g>
    </g>
  );
};

/* ---------------- the film ---------------- */
const SPEED = 6.2; // px a frame the path slides under her (vertical frame)
const STOP = 40; // frames the camera takes to come to rest at the house

export const PaperCutout: React.FC<PaperCutoutProps> = ({ beats, payoff, accent, sub }) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const u = H / 1920;
  const starts = useMemo(() => paperStarts({ beats }), [beats]);
  const P0 = starts[beats.length];
  const END = paperEnd({ beats, payoff, sub });
  const speed = SPEED * u;

  // The camera walks with her, then comes to rest at the house; its speed eases to zero (no jolt).
  const camAt = (fr: number) => {
    if (fr <= P0) return speed * fr;
    const k = Math.min(1, (fr - P0) / STOP);
    return speed * P0 + speed * STOP * (k - (k * k) / 2);
  };
  const cam = camAt(f);
  const camEnd = camAt(P0 + STOP);
  const camMax = camEnd + 10;

  // Which beat, and the light: each beat's light arrives over its first second.
  const bi = Math.max(0, starts.findIndex((s, i) => f >= s && f < (starts[i + 1] ?? Infinity)));
  const timeOf = (i: number): TimeOfDay => (i >= beats.length ? "night" : beats[i].time);
  const cur = timeOf(bi);
  const prev = timeOf(Math.max(0, bi - 1));
  const tk = bi === 0 ? 1 : ramp(f, starts[bi], starts[bi] + 34, CURVE.quiet.standard);
  const c = mixPal(PAL[prev], PAL[cur], tk);
  const night = NIGHT_RANK[prev] + (NIGHT_RANK[cur] - NIGHT_RANK[prev]) * tk;
  const lit = interpolate(night, [0.5, 0.95], [0, 1], clamp);

  // Where she is: fixed on screen while the world slides, then she walks on to the door once the camera rests.
  const SX = W * 0.32;
  const feetY = H * 0.835;
  const worldX = SX + speed * f;
  const sx = worldX - cam;
  const doorX = W * 0.6 + 4 * u;
  const atDoor = P0 + Math.ceil((doorX - SX + speed * STOP / 2 - speed * STOP) / speed + STOP);
  const fold = ramp(f, atDoor, atDoor + 8, CURVE.quiet.exit);
  const doorGlow = ramp(f, atDoor - 6, atDoor + 2) * (1 - ramp(f, atDoor + 14, atDoor + 26));
  const winLit = ramp(f, atDoor + 10, atDoor + 18, CURVE.quiet.enter);
  const seat = spring({ frame: f - atDoor - 16, fps, config: { damping: 11, stiffness: 140 } });

  // Layers, back to front, each with its own speed (parallax).
  const layers = useMemo(() => {
    const len = W + camMax + 400 * u;
    return {
      far: hills(len * 0.2 + W, H * 0.62, 190 * u, 300 * u, 11, H + 40),
      mid: hills(len * 0.42 + W, H * 0.69, 120 * u, 260 * u, 23, H + 40),
      near: hills(len * 0.75 + W, H * 0.776, 48 * u, 220 * u, 37, H + 40),
      front: hills(len * 1.35 + W, H * 0.925, 54 * u, 240 * u, 51, H + 40),
    };
  }, [W, H, u, camMax]);

  /** The frame a piece slides into view, so it pops up as it arrives (pieces already in frame pop at the start). */
  const arrive = (lx: number, fac: number, halfW: number, open: number) => {
    const c0 = (lx - halfW - W) / fac;
    const fr = c0 <= 0 ? open : c0 / speed;
    return Math.max(open, Math.round(fr) - 4);
  };

  // Landmarks, placed so they pass where the story needs them.
  const place = (fr: number, screenX: number, fac: number) => screenX + camAt(fr) * fac;
  const town = 0.6, tree = 0.78, front = 1.35;
  const libIdx = beats.findIndex((b) => b.scene === "library");
  const houseIdx = beats.findIndex((b) => b.scene === "houses");
  const starIdx = beats.findIndex((b) => b.scene === "stars");
  const libX = libIdx < 0 ? null : place(starts[libIdx] + 55, W * 0.66, town);
  const housesX = houseIdx < 0 ? [] : [0, 1, 2].map((i) => place(starts[houseIdx] + 50, W * (0.5 + i * 0.27), town));
  const treeXs = useMemo(() => {
    const r = rng(77);
    const xs: { x: number; s: number; round: boolean }[] = [];
    for (let x = W * 0.08; x < W + camMax * tree; x += (230 + r() * 260) * u) xs.push({ x, s: 0.8 + r() * 0.5, round: r() > 0.45 });
    return xs;
  }, [W, u, camMax]);
  const bushXs = useMemo(() => {
    const r = rng(91);
    const xs: { x: number; s: number }[] = [];
    for (let x = W * 0.05; x < W + camMax * front; x += (300 + r() * 380) * u) xs.push({ x, s: 0.7 + r() * 0.6 });
    return xs;
  }, [W, u, camMax]);

  // Sun goes down through the warm beats; the moon comes up for the night ones.
  const sunY = interpolate(night, [0, 0.15, 0.55, 0.75], [H * 0.3, H * 0.41, H * 0.58, H * 0.71], clamp);
  const moonAt = starIdx >= 0 ? starts[starIdx] : P0;
  const moonK = ramp(f, moonAt, moonAt + 70, CURVE.quiet.enter);
  const moonY = interpolate(moonK, [0, 1], [H * 0.64, H * 0.27]);
  const starAt = starIdx >= 0 ? starts[starIdx] + 10 : P0;
  const STARS = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: 16 }, () => ({ x: r() * W, y: H * (0.2 + r() * 0.3), s: 7 + r() * 9 }));
  }, [W, H]);

  // Captions: a cream paper strip that unfolds down from its top edge, then folds away.
  const card = (i: number) => {
    const isPay = i >= beats.length;
    const at = starts[i] + (isPay ? 6 : 2);
    const out = isPay ? 1e6 : starts[i + 1] - OUT + 2;
    const kin = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 120 } });
    const kout = ramp(f, out, out + OUT - 2, CURVE.quiet.exit);
    if (f < at || f > out + OUT) return null;
    const rot = (1 - Math.min(1, kin)) * -92 + kout * 92;
    const text = isPay ? payoff : beats[i].caption;
    const words = text.split(" ");
    return (
      <div key={i} style={{ position: "absolute", left: 60 * u, right: 60 * u, top: 220 * u, perspective: 1400, opacity: interpolate(kin, [0, 0.15], [0, 1], clamp) * (1 - kout) }}>
        <div style={{ transformOrigin: "50% 0%", transform: `rotateX(${rot.toFixed(2)}deg) rotate(${(isPay ? -0.6 : i % 2 ? 0.8 : -0.9).toFixed(2)}deg)`,
          background: PAPER, borderRadius: 6 * u, padding: `${34 * u}px ${44 * u}px ${38 * u}px`,
          boxShadow: `0 ${10 * u}px ${22 * u}px rgba(18, 10, 22, 0.32), 0 ${2 * u}px ${3 * u}px rgba(18, 10, 22, 0.18)`,
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(GRAIN)}")` }}>
          <div style={{ fontFamily: ZODIAK, fontWeight: 700, fontSize: (isPay ? 80 : 68) * u, lineHeight: 1.08, letterSpacing: "-0.02em", color: PRINT }}>
            {words.map((w, j) => (
              <span key={j} style={{ color: isPay && w.replace(/[^\p{L}\p{N}]/gu, "") === accent ? RED : PRINT }}>{w}{j < words.length - 1 ? " " : ""}</span>
            ))}
          </div>
          {isPay ? (
            <div style={{ marginTop: 18 * u, fontFamily: INTER, fontWeight: 500, fontSize: 40 * u, letterSpacing: "-0.01em", color: PRINT, opacity: 0.72 * ramp(f, at + 10, at + 10 + DUR.arrive, CURVE.quiet.enter) }}>{sub}</div>
          ) : null}
        </div>
      </div>
    );
  };

  const L = (fac: number) => `translate(${(-cam * fac).toFixed(1)} 0)`;
  const pathY = feetY - 22 * u;

  return (
    <Clip endAt={END} ground={PAL.night.skyTop} noLogo>
      <AbsoluteFill>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <PaperDefs />
          <defs>
            <linearGradient id="pc-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={c.skyTop} />
              <stop offset="0.66" stopColor={c.skyBot} />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill="url(#pc-sky)" />
          {/* stars, then the sun or the moon, all cut from paper */}
          {STARS.map((s, i) => (
            <Pop key={i} x={s.x - cam * 0.02} y={s.y} at={starAt + i * 3}>
              <g filter="url(#pc-piece)"><path d={star(s.s * u)} fill={PAL.night.sun} opacity={0.92} /></g>
            </Pop>
          ))}
          <g filter="url(#pc-sheet)" opacity={1 - interpolate(night, [0.6, 0.8], [0, 1], clamp)}>
            <circle cx={W * 0.74 - cam * 0.03} cy={sunY} r={118 * u} fill={c.sun} />
          </g>
          {f >= moonAt ? (
            <g filter="url(#pc-sheet)">
              <circle cx={W * 0.7 - cam * 0.03} cy={moonY} r={96 * u} fill={PAL.night.sun} />
              <circle cx={W * 0.7 - cam * 0.03 + 30 * u} cy={moonY - 18 * u} r={16 * u} fill={mix(PAL.night.sun, PAL.night.far, 0.18)} />
              <circle cx={W * 0.7 - cam * 0.03 - 24 * u} cy={moonY + 26 * u} r={10 * u} fill={mix(PAL.night.sun, PAL.night.far, 0.18)} />
            </g>
          ) : null}
          {/* clouds drift on their own as well as with the camera */}
          {[{ x: 0.12, y: 0.36, w: 300 }, { x: 0.62, y: 0.43, w: 220 }, { x: 1.15, y: 0.33, w: 340 }, { x: 1.8, y: 0.41, w: 260 }].map((cl, i) => (
            <Pop key={i} x={W * cl.x - cam * 0.09 - f * 0.25 * u} y={H * cl.y} at={2 + i * 3}>
              <g filter="url(#pc-sheet)"><path d={cloudPath(cl.w * u)} fill={c.cloud} /></g>
            </Pop>
          ))}
          <g transform={L(0.2)}>
            <Pop x={0} y={H} abs at={0}><g filter="url(#pc-sheet)"><path d={layers.far} fill={c.far} /></g></Pop>
          </g>
          <g transform={L(0.42)}>
            <Pop x={0} y={H} abs at={2}><g filter="url(#pc-sheet)"><path d={layers.mid} fill={c.mid} /></g></Pop>
          </g>
          {/* the town: buildings stand behind the near hill and pop up as they slide in */}
          <g transform={L(town)}>
            {libX !== null ? (
              <Pop x={libX} y={H * 0.765} at={arrive(libX, town, 340 * u, 4)} tilt={-4}>
                <Library c={c} lit={lit} u={u * 1.2} />
              </Pop>
            ) : null}
            {housesX.map((hx, i) => (
              <Pop key={i} x={hx} y={H * 0.768} at={arrive(hx, town, 140 * u, 6 + i * 4)} tilt={i % 2 ? 4 : -4}>
                <House c={c} lit={lit} u={u * 1.2} w={[190, 160, 210][i]} h={[150, 190, 140][i]} tone={i === 1 ? 0.7 : 0.15} />
              </Pop>
            ))}
          </g>
          <g transform={L(0.75)}>
            <Pop x={0} y={H} abs at={4}><g filter="url(#pc-sheet)"><path d={layers.near} fill={c.near} /></g></Pop>
          </g>
          <g transform={L(tree)}>
            {treeXs.map((t, i) => (
              <Pop key={i} x={t.x} y={H * 0.795} at={arrive(t.x, tree, 70 * u, 6 + i * 2)} tilt={i % 2 ? 5 : -5}>
                <Tree c={c} u={u * 1.2} s={t.s} round={t.round} />
              </Pop>
            ))}
          </g>
          {/* the ground she walks on and its path, at camera speed */}
          <g transform={L(1)}>
            <Pop x={0} y={H} abs at={4}>
              <g filter="url(#pc-sheet)">
                <rect x={-40} y={H * 0.805} width={W + camMax + 80} height={H * 0.25} fill={c.ground} />
              </g>
              <g filter="url(#pc-piece)">
                <rect x={-40} y={pathY} width={W + camMax + 80} height={46 * u} fill={c.path} />
              </g>
              <g filter="url(#pc-piece)">
                {PEBBLES.filter((p) => p.x * u < W + camMax).map((p, i) => (
                  <ellipse key={i} cx={p.x * u} cy={pathY + p.y * u} rx={p.r * u} ry={p.r * 0.6 * u} fill={mix(c.path, c.ground, 0.35)} />
                ))}
              </g>
            </Pop>
          </g>
          <g transform={L(1)}>
            <Pop x={W * 0.6 + camEnd} y={pathY + 4 * u} at={arrive(W * 0.6 + camEnd, 1, 220 * u, P0 - 40)} tilt={-3}>
              <g transform={`translate(${(-W * 0.6 + doorX - (0.14 * 400 + 39) * u * 1.15).toFixed(1)} 0)`}>
                <Dorm c={c} u={u * 1.15} doorGlow={doorGlow} lit={Math.max(lit * 0.3, winLit)} seat={Math.max(0, Math.min(1.08, seat))} />
              </g>
            </Pop>
          </g>
          <Student x={sx} y={feetY} u={u} phase={worldX / (34 * u)} walk={1 - fold} fold={fold} rise={spring({ frame: f - 3, fps, config: { damping: 9, stiffness: 150, mass: 0.7 } })} />
          <g transform={L(front)}>
            <Pop x={0} y={H} abs at={6}><g filter="url(#pc-sheet)"><path d={layers.front} fill={c.front} /></g></Pop>
            {bushXs.map((b, i) => (
              <Pop key={i} x={b.x} y={H * 0.945} at={arrive(b.x, front, 90 * u, 8 + i * 2)} tilt={i % 2 ? 6 : -6}>
                <g filter="url(#pc-piece)">
                  <path d={cloudPath(200 * u * b.s)} transform={`translate(${-100 * u * b.s} 0)`} fill={mix(c.leaf, c.near, 0.35)} />
                </g>
                <g filter="url(#pc-piece)">
                  {[-46, -14, 24, 52].map((dx, j) => (
                    <circle key={j} cx={dx * u * b.s} cy={(-30 - ((j * 37) % 40)) * u * b.s} r={8 * u} fill={mix(c.trim, c.wall2, 0.3)} />
                  ))}
                </g>
              </Pop>
            ))}
          </g>
        </svg>
      </AbsoluteFill>
      {starts.map((_, i) => card(i))}
      {/* the held logo, dark on the day sky and light once the sky goes dark */}
      <div style={{ opacity: 1 - interpolate(night, [0.35, 0.6], [0, 1], clamp) }}><HeldLogo light out={END} /></div>
      <div style={{ opacity: interpolate(night, [0.35, 0.6], [0, 1], clamp) }}><HeldLogo out={END} /></div>
      <Cue at={0} name="paper-page-turn" volume={0.4} />
      {starts.slice(0, -1).map((s, i) => <Cue key={i} at={s + 2} name={i === 0 ? "paper-move-quick" : "paper-slide"} volume={0.35} />)}
      <Cue at={P0 + 6} name="paper-slide" volume={0.35} />
      <Cue at={atDoor + 10} name="chime-crystal" volume={0.32} />
    </Clip>
  );
};

/** Small stones along the path, so the ground visibly slides under her. */
const PEBBLES = (() => {
  const r = rng(13);
  const out: { x: number; y: number; r: number }[] = [];
  for (let x = 20; x < 6000; x += 70 + r() * 150) out.push({ x, y: 10 + r() * 26, r: 5 + r() * 6 });
  return out;
})();

/** Fine paper grain for the caption strip. */
const GRAIN = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.24  0 0 0 0 0.2  0 0 0 0.12 0"/></filter><rect width="240" height="240" filter="url(#n)"/></svg>`;
