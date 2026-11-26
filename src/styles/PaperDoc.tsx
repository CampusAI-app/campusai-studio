/**
 * /paper-doc (2026-11-18, from the "Pencil to VOX" Instagram reel via Muse, Jacob: "I love this". The creator's paid
 * skill was never bought or seen, so this is our own build of the look, read frame by frame).
 *
 * A Vox-style paper documentary. Cream paper ground with grain; one huge deep-navy high-contrast serif word per scene
 * (Playfair Display 900) with small serif lines on torn white paper scraps above and below it (Libre Caslon Text);
 * cut-out pictures with a thin off-white paper edge and a soft shadow, layered as a collage. Scenes are props, one of
 * four kinds: `title` (a cut-paper collage), `compare` (objects rise one by one against a ruled axis, value pills with
 * dashed guide lines), `map` (a torn map sheet, pins, a dashed route drawn by a moving cutout) and `count` (the huge
 * word is a number counting up while a small desk calendar flips). Calm hard cuts between scenes; ease-out rises and
 * slides inside a scene; a red hand-drawn underline that draws itself.
 *
 * One timeline, two frames: the layout reads the aspect. Vertical stacks the words over the picture; wide puts the
 * words in a left column and the picture on the right. Register it twice (format "vertical" and "wide").
 *
 * Honest by construction: every word is a prop and lives in the film's facts.md; a product picture is only ever a
 * real capture (`clip`), never a drawn screen; drawn shapes are generic cut paper, never a likeness of a building.
 * A map is only for a real place in a history story (11/06: no map beats for CampusAI product claims).
 */
import React from "react";
import { loadFont as DISPLAYFont } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as SERIFFont } from "@remotion/google-fonts/LibreCaslonText";
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, readHold } from "../system/motion";
import { Cue, RED, ramp, type Format } from "./common";
import { UmdOpen, type UmdOpenProps } from "./UmdOpen";
import { World } from "./world";

const { fontFamily: DISPLAY } = DISPLAYFont("normal", { weights: ["800", "900"], subsets: ["latin"] });
const { fontFamily: SERIF } = SERIFFont("normal", { weights: ["400", "700"], subsets: ["latin"] });
SERIFFont("italic", { weights: ["400"], subsets: ["latin"] });

// the style's own paper and inks (named here, like the board green in Chalkboard)
const NAVY = "#14234F";
const NAVY_HI = "#2A3F86";
const SCRAP = "#FCFAF4";
const EDGE = "#FBF7EE";
const SHADOW = "#1A1F33";
const GROUND = "radial-gradient(ellipse 90% 75% at 50% 42%, #F6EEDD 0%, #EFE4CE 60%, #E2D3B6 100%)";

type LatLng = [number, number];
export type CollagePiece = "sun" | "clouds" | "hall" | "trees" | "hills";
export type CompareShape = "tower" | "obelisk" | "hall" | "pole" | "cap" | "block";
/** A real capture cut out like a clipping: the file in public/, its pixel size, the crop to show. */
export type Clipping = { src: string; w: number; h: number; crop: { x: number; y: number; w: number; h: number } };
/** One semester card in a `terms` scene: a big label ("Fall"), a small line under it ("Year 1"), an optional pill. */
export type TermCard = { label: string; sub?: string; note?: string };
type Box = { x: number; y: number; w: number; h: number };
/**
 * A real capture shown whole at frame width (`page` scene, 11/18). `states` are captures of the same page in different
 * states (a tab pressed), each fading in at its frame over the one before, never a recorded scroll (rules/campusai.md:
 * dissolve between states). All files share the pixel size `w` x `h`; `crop` is the part of the page shown.
 */
export type PageCapture = { w: number; h: number; crop: Box; states: { src: string; at: number }[] };
/** A part of the page lifting off to be read: rises from its place at `at`, grows to `toW` wide centred on `toCy`, and goes back at `back` (or stays). */
export type PageLift = { src: string; crop: Box; at: number; back?: number; toW: number; toCy: number; follow?: boolean };
/** `follow`: the lifted part keeps showing the page's current state, so the dissolves between states play inside it. */

type Words = {
  /** Small serif line on a torn scrap above the big word. */
  above?: string;
  /** The one huge word. For `count`, leave it out: the number is the word. */
  word?: string;
  /** Small serif line on a torn scrap below the big word. */
  below?: string;
  /** Draw the red hand-drawn underline under the big word. */
  underline?: boolean;
  /** Frames this scene holds before the hard cut. Default: from the reading rule. */
  frames?: number;
  /** Frame the big word lands. Default: 8, or 46 in the first scene so the UMD M has the frame (the word sits above the big M, so a hook can land with it). */
  wordAt?: number;
  /** A real capture pinned into the picture as a clipping. */
  clip?: Clipping;
};
export type PaperScene =
  | (Words & { kind: "title"; collage?: CollagePiece[] })
  | (Words & { kind: "compare"; unit: string; max: number; step: number; items: { label: string; value: number; pill: string; shape: CompareShape }[] })
  | (Words & { kind: "map"; bounds: [number, number, number, number]; pins: { label: string; at: LatLng }[]; route?: [number, number]; water?: LatLng[][] })
  | (Words & { kind: "count"; from: number; to: number; calendar?: [string, string] })
  /**
   * Cut-paper semester cards dealt into a grid (11/18). `held`: the cards are already on the desk (a scene that follows
   * another `terms` scene), so they fade up instead of being dealt. `mark`: the cards to circle in red, the rest dim.
   * `tally`: each card's pill adds this much to the big word, which counts up to `word` as the pills land.
   */
  | (Words & { kind: "terms"; cards: TermCard[]; columns?: number; held?: boolean; mark?: number[]; tally?: number })
  /** A real product page, whole at frame width, with parts lifting off it to be read (11/18). `counter`: a small scrap under the page that changes at each `at`. */
  | (Words & { kind: "page"; page: PageCapture; lifts?: PageLift[]; counter?: { at: number; text: string }[]; counterTop?: number });

export type PaperDocProps = {
  format?: Format;
  scenes: PaperScene[];
  /** Small source line under the last scene. */
  source?: string;
  cta?: string;
  /** Where the UMD M sits big before it glides into its tag (vertical only). Default: UmdOpen's own. */
  umd?: Pick<UmdOpenProps, "bigCx" | "bigCy" | "bigH">;
};

/* ---------------- timing ---------------- */
const sceneText = (s: PaperScene) => [s.above, s.kind === "count" ? String(s.to) : s.word, s.below].filter(Boolean).join(" ");
const sceneLen = (s: PaperScene) => s.frames ?? Math.max(72, Math.round(readHold(sceneText(s)) * 30 * 0.75)); // motion: scraps read alongside the picture
export const paperDocStarts = (p: PaperDocProps) => {
  const out: number[] = [];
  let n = 0;
  for (const s of p.scenes) { out.push(n); n += sceneLen(s); }
  out.push(n);
  return out;
};
export const paperDocEnd = (p: PaperDocProps) => paperDocStarts(p)[p.scenes.length];

/* ---------------- layout by aspect ---------------- */
type Rect = { x: number; y: number; w: number; h: number };
const layoutFor = (W: number, H: number) => {
  const wide = W > H;
  return wide
    ? { wide, text: { x: 100, y: 150, w: 820, h: 820 } as Rect, pic: { x: 990, y: 150, w: 850, h: 840 } as Rect, wordMax: 230, scrap: 38 }
    : { wide, text: { x: 70, y: 280, w: W - 140, h: 500 } as Rect, pic: { x: 60, y: 830, w: W - 120, h: 940 } as Rect, wordMax: 250, scrap: 40 };
};

/* ---------------- small parts ---------------- */
const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
/** A torn-paper clip-path: jagged top and bottom edges, slightly ragged sides. Fixed per seed, so it never crawls. */
const torn = (seed: number) => {
  const r = rng(seed * 97 + 13);
  const n = 16;
  const top = Array.from({ length: n + 1 }, (_, i) => `${((i / n) * 100).toFixed(2)}% ${(r() * 7).toFixed(1)}px`);
  const bot = Array.from({ length: n + 1 }, (_, i) => `${(100 - (i / n) * 100).toFixed(2)}% calc(100% - ${(r() * 7).toFixed(1)}px)`);
  return `polygon(${[...top, `calc(100% - ${(r() * 3).toFixed(1)}px) 50%`, ...bot, `${(r() * 3).toFixed(1)}px 50%`].join(", ")})`;
};

const Scrap: React.FC<{ text: string; k: number; seed: number; size: number; tilt: number }> = ({ text, k, seed, size, tilt }) => (
  <div style={{ filter: `drop-shadow(0 5px 7px rgba(26,31,51,0.22))`, opacity: Math.min(1, k * 1.6), transform: `translateY(${((1 - k) * 26).toFixed(1)}px) rotate(${tilt}deg)` }}>
    <div style={{ background: SCRAP, clipPath: torn(seed), padding: `${size * 0.42}px ${size * 0.7}px ${size * 0.48}px`, fontFamily: SERIF, fontSize: size, lineHeight: 1.18, color: NAVY, textAlign: "center" }}>
      {text}
    </div>
  </div>
);

/** The red underline, a hand-drawn stroke that draws itself left to right. */
const Underline: React.FC<{ k: number }> = ({ k }) => (
  <svg viewBox="0 0 400 40" preserveAspectRatio="none" style={{ position: "absolute", left: "-4%", width: "108%", bottom: "-0.12em", height: "0.2em", overflow: "visible" }}>
    <path d="M6 26 C 70 14, 150 30, 230 20 S 360 12, 394 18 M30 32 C 120 26, 250 32, 370 26" fill="none" stroke={RED} strokeWidth={7} strokeLinecap="round"
      pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} vectorEffect="non-scaling-stroke" />
  </svg>
);

/** Filters for cut pieces: a thin off-white paper edge grown around the shape, then a soft shadow. */
const CutDefs: React.FC = () => (
  <defs>
    <filter id="pd-cut" x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius={5} result="d" />
      <feFlood floodColor={EDGE} />
      <feComposite in2="d" operator="in" result="edge" />
      <feMerge result="m"><feMergeNode in="edge" /><feMergeNode in="SourceGraphic" /></feMerge>
      <feDropShadow in="m" dx={0} dy={7} stdDeviation={8} floodColor={SHADOW} floodOpacity={0.28} />
    </filter>
    <filter id="pd-sheet" x="-6%" y="-6%" width="112%" height="116%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={0.04} numOctaves={2} seed={4} result="e" />
      <feDisplacementMap in="SourceGraphic" in2="e" scale={9} xChannelSelector="R" yChannelSelector="G" result="s" />
      <feDropShadow in="s" dx={0} dy={10} stdDeviation={12} floodColor={SHADOW} floodOpacity={0.26} />
    </filter>
  </defs>
);

/** Paper grain over the whole frame, fixed seed. */
const Grain: React.FC<{ W: number; H: number }> = ({ W, H }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 0.5, zIndex: 40, pointerEvents: "none" }}>
    <filter id="pd-grain">
      <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={11} />
      <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 -0.9 0.5" />
    </filter>
    <filter id="pd-fibre">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.03" numOctaves={3} seed={6} />
      <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.42  0 0 0 0 0.3  0 0 0 0.5 -0.18" />
    </filter>
    <rect width={W} height={H} filter="url(#pd-grain)" />
    <rect width={W} height={H} filter="url(#pd-fibre)" />
  </svg>
);

/* ---------------- cut-paper shapes (base centre at 0,0, drawn upward) ---------------- */
const Hall: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const bodyH = h * 0.62, roofH = h * 0.16, cupH = h * 0.22;
  const cols = 4, pw = w * 0.42, colW = pw / (cols * 2 - 1);
  return (
    <g>
      <rect x={-w / 2} y={-bodyH} width={w} height={bodyH} fill="#B5523B" />
      {[0.18, 0.82].flatMap((cx) => [0.3, 0.62].map((cy) => (
        <rect key={`${cx}${cy}`} x={-w / 2 + w * cx - w * 0.05} y={-bodyH + bodyH * cy - bodyH * 0.08} width={w * 0.1} height={bodyH * 0.17} fill="#F3E7D0" />
      )))}
      <polygon points={`${-pw / 2 - 8},${-bodyH} ${pw / 2 + 8},${-bodyH} 0,${-bodyH - roofH}`} fill="#F3E7D0" />
      {Array.from({ length: cols }, (_, i) => (
        <rect key={i} x={-pw / 2 + i * colW * 2} y={-bodyH + 4} width={colW} height={bodyH - 4} fill="#F7EEDC" />
      ))}
      <rect x={-w * 0.07} y={-bodyH - roofH - cupH * 0.5} width={w * 0.14} height={cupH * 0.5} fill="#F3E7D0" />
      <path d={`M${-w * 0.08} ${-bodyH - roofH - cupH * 0.5} Q0 ${-bodyH - roofH - cupH * 1.05} ${w * 0.08} ${-bodyH - roofH - cupH * 0.5} Z`} fill="#3E6B58" />
      <rect x={-w / 2 - 6} y={-6} width={w + 12} height={6} fill="#8E3D2C" />
    </g>
  );
};
const Pole: React.FC<{ h: number }> = ({ h }) => (
  <g>
    <rect x={-5} y={-h} width={10} height={h} fill="#6B4B35" />
    <polygon points={`5,${-h} ${Math.min(120, 40 + h * 0.18)},${-h + Math.min(34, 10 + h * 0.05)} 5,${-h + Math.min(68, 20 + h * 0.1)}`} fill="#E0A93B" />
    <rect x={-22} y={-8} width={44} height={8} fill="#6B4B35" />
  </g>
);
/** A tall brick tower with a pointed roof: windows repeat up its height, so any height reads as a tower. */
const Tower: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const roof = Math.min(h * 0.3, w * 1.1), body = h - roof;
  const rows = Math.max(1, Math.floor((body - 40) / 92));
  return (
    <g>
      <rect x={-w / 2} y={-body} width={w} height={body} fill="#B5523B" />
      {Array.from({ length: rows }, (_, i) => (
        <path key={i} d={`M${-w * 0.14} ${-60 - i * 92} v-34 a${w * 0.14} ${w * 0.14} 0 0 1 ${w * 0.28} 0 v34 Z`} fill="#F3E7D0" />
      ))}
      <rect x={-w / 2 - 6} y={-body - 10} width={w + 12} height={12} fill="#F3E7D0" />
      <polygon points={`${-w / 2},${-body - 10} ${w / 2},${-body - 10} 0,${-h}`} fill="#3E6B58" />
      <rect x={-w / 2 - 6} y={-6} width={w + 12} height={6} fill="#8E3D2C" />
    </g>
  );
};
/** A pale stone obelisk with a pyramid tip. */
const Obelisk: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const tip = Math.min(h * 0.12, w * 0.6), top = w * 0.66;
  return (
    <g>
      <polygon points={`${-w / 2},0 ${w / 2},0 ${top / 2},${-(h - tip)} ${-top / 2},${-(h - tip)}`} fill="#E4DCCB" />
      <polygon points={`0,${-(h - tip)} ${top / 2},${-(h - tip)} 0,${-h}`} fill="#C9BFAE" />
      <polygon points={`0,${-(h - tip)} ${-top / 2},${-(h - tip)} 0,${-h}`} fill="#D8CFBD" />
      <polygon points={`0,0 ${w / 2},0 ${top / 2},${-(h - tip)} 0,${-(h - tip)}`} fill="#000" fillOpacity={0.06} />
    </g>
  );
};
const Cap: React.FC<{ h: number }> = ({ h }) => {
  const s = Math.max(16, h) / 22;
  return (
    <g transform={`scale(${s})`}>
      <path d="M-18 -2 L-18 -10 L18 -10 L18 -2 Q0 4 -18 -2 Z" fill={NAVY} />
      <polygon points="-34,-14 0,-24 34,-14 0,-4" fill={NAVY_HI} />
      <path d="M22 -14 L24 -2" stroke="#E0A93B" strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
};
const Tree: React.FC<{ s: number }> = ({ s }) => (
  <g transform={`scale(${s})`}>
    <rect x={-8} y={-70} width={16} height={70} fill="#6E4A3A" />
    <circle cx={0} cy={-110} r={58} fill="#4F7F4A" />
    <circle cx={-34} cy={-86} r={36} fill="#5C8E55" />
  </g>
);
const Cloud: React.FC<{ w: number }> = ({ w }) => (
  <path d={`M0 0 Q${w * 0.02} ${-w * 0.2} ${w * 0.22} ${-w * 0.18} Q${w * 0.32} ${-w * 0.42} ${w * 0.56} ${-w * 0.26} Q${w * 0.8} ${-w * 0.34} ${w * 0.86} ${-w * 0.1} Q${w} ${-w * 0.08} ${w} 0 Z`} fill="#FBF6EC" />
);

/* ---------------- the four kinds of picture ---------------- */
const rise = (t: number, at: number, dur = 16) => ramp(t, at, at + dur, CURVE.quiet.enter);

const TitleCollage: React.FC<{ R: Rect; t: number; pieces: CollagePiece[]; first: boolean }> = ({ R, t, pieces, first }) => {
  const { w, h } = R;
  const base = first ? 10 : 0; // the first scene waits a beat under the UMD M
  const has = (p: CollagePiece) => pieces.includes(p);
  const k = (i: number) => rise(t, base + i * 5, 18);
  const lift = (i: number, d: number) => `translate(0 ${((1 - k(i)) * d).toFixed(1)})`;
  const hallW = Math.min(w * 0.58, h * 0.62);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: R.x, top: R.y, overflow: "visible", opacity: rise(t, 0, 6) }}>
      <CutDefs />
      {has("sun") ? <g transform={lift(0, 120)} opacity={Math.min(1, k(0) * 2)}><circle cx={w * 0.8} cy={h * 0.17} r={Math.min(w, h) * 0.08} fill="#F2B544" filter="url(#pd-cut)" /></g> : null}
      {has("clouds") ? (
        <g opacity={Math.min(1, k(1) * 2)} filter="url(#pd-cut)">
          <g transform={`translate(${(w * 0.06 + (1 - k(1)) * -90).toFixed(1)} ${h * 0.2})`}><Cloud w={w * 0.26} /></g>
          <g transform={`translate(${(w * 0.5 + (1 - k(1)) * 90).toFixed(1)} ${h * 0.33})`}><Cloud w={w * 0.2} /></g>
        </g>
      ) : null}
      {has("hills") || has("hall") ? (
        <g transform={lift(2, 200)} filter="url(#pd-cut)">
          <path d={`M-20 ${h * 0.84} Q${w * 0.25} ${h * 0.76} ${w * 0.5} ${h * 0.82} T${w + 20} ${h * 0.8} L${w + 20} ${h + 10} L-20 ${h + 10} Z`} fill="#8DB07A" />
        </g>
      ) : null}
      {has("hall") ? <g transform={`translate(${w * 0.5} ${h * 0.86}) ${lift(3, h * 0.7)}`} filter="url(#pd-cut)"><Hall w={hallW} h={hallW * 0.82} /></g> : null}
      {has("trees") ? (
        <g filter="url(#pd-cut)">
          <g transform={`translate(${w * 0.12} ${h * 0.9}) ${lift(4, h * 0.5)}`}><Tree s={Math.min(w, h) / 700} /></g>
          <g transform={`translate(${w * 0.88} ${h * 0.9}) ${lift(5, h * 0.5)}`}><Tree s={Math.min(w, h) / 820} /></g>
        </g>
      ) : null}
    </svg>
  );
};

const CompareChart: React.FC<{ R: Rect; t: number; s: Extract<PaperScene, { kind: "compare" }> }> = ({ R, t, s }) => {
  const { w, h } = R;
  const axisX = 92, top = 60, base = h - 80;
  const Y = (v: number) => base - (v / s.max) * (base - top);
  const axisK = rise(t, 0, 10);
  const right = w - 60; // the clipping sits outside the chart (above it, or under the words), so the objects get the full width
  const n = s.items.length;
  const xs = s.items.map((_, i) => axisX + 120 + (i * (right - axisX - 150)) / Math.max(1, n - 1));
  const ticks: number[] = [];
  for (let v = 0; v <= s.max + 1e-6; v += s.step) ticks.push(v);
  const GAP = 18; // motion: about 0.6 s between objects, as in the reel
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: R.x, top: R.y, overflow: "visible", opacity: rise(t, 0, 6) }}>
      <CutDefs />
      <clipPath id="pd-above-base"><rect x={0} y={-400} width={w} height={base + 400} /></clipPath>
      <g opacity={axisK}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={axisX} x2={w - 10} y1={Y(v)} y2={Y(v)} stroke={NAVY} strokeOpacity={v === 0 ? 0.55 : 0.1} strokeWidth={v === 0 ? 3 : 2} />
            <line x1={axisX - 14} x2={axisX} y1={Y(v)} y2={Y(v)} stroke={NAVY} strokeOpacity={0.6} strokeWidth={2} />
            <text x={axisX - 22} y={Y(v) + 9} textAnchor="end" fontFamily={SERIF} fontSize={26} fill={NAVY} fillOpacity={0.75}>{v}</text>
          </g>
        ))}
        <line x1={axisX} x2={axisX} y1={top - 20} y2={base} stroke={NAVY} strokeOpacity={0.6} strokeWidth={3} />
        <text x={axisX} y={top - 34} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={26} fill={NAVY} fillOpacity={0.75}>{s.unit}</text>
      </g>
      {s.items.map((it, i) => {
        const at = 8 + i * GAP;
        const k = rise(t, at, 18);
        const objH = Math.max(1, base - Y(it.value));
        const x = xs[i];
        const objW = Math.min(220, (right - axisX) / (n + 0.6));
        const pillK = rise(t, at + 12, 10);
        const yTop = base - Math.max(objH, it.shape === "cap" ? 16 : objH);
        const pillW = 30 + it.pill.length * 17, pillH = 50;
        const py = yTop - 20 - pillH;
        const lineK = rise(t, at + 16, 12);
        return (
          <g key={i}>
            <g clipPath="url(#pd-above-base)">
              <g transform={`translate(${x} ${base + (1 - k) * (objH + 60)})`} filter="url(#pd-cut)">
                {it.shape === "tower" ? <Tower w={Math.min(130, objW * 0.9)} h={objH} /> : it.shape === "obelisk" ? <Obelisk w={Math.min(100, objW * 0.7)} h={objH} /> : it.shape === "hall" ? <Hall w={objW} h={objH} /> : it.shape === "pole" ? <Pole h={objH} /> : it.shape === "cap" ? <Cap h={objH} /> : <rect x={-50} y={-objH} width={100} height={objH} fill={NAVY_HI} />}
              </g>
            </g>
            {/* dashed guide from the object's top back to the axis */}
            <line x1={axisX} x2={axisX + (x - pillW / 2 - 8 - axisX) * lineK} y1={yTop} y2={yTop} stroke={NAVY} strokeOpacity={0.55} strokeWidth={2.5} strokeDasharray="10 9" />
            <g opacity={pillK} transform={`translate(0 ${((1 - pillK) * 14).toFixed(1)})`}>
              <rect x={x - pillW / 2} y={py} width={pillW} height={pillH} rx={pillH / 2} fill={SCRAP} stroke={NAVY} strokeWidth={2.5} />
              <text x={x} y={py + pillH / 2 + 10} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={28} fill={NAVY}>{it.pill}</text>
            </g>
            <text x={x} y={base + 42} textAnchor="middle" fontFamily={SERIF} fontSize={25} fill={NAVY} opacity={rise(t, at + 4, 10)}>{it.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

const lengthOf = (pts: [number, number][]) => pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
const MapSheet: React.FC<{ R: Rect; t: number; s: Extract<PaperScene, { kind: "map" }> }> = ({ R, t, s }) => {
  const { w, h } = R;
  const [south, west, north, east] = s.bounds;
  const pad = 20;
  const cos = Math.cos(((south + north) / 2) * (Math.PI / 180));
  const sc = Math.min((w - pad * 2) / ((east - west) * cos), (h - pad * 2) / (north - south));
  const mw = (east - west) * cos * sc, mh = (north - south) * sc;
  const ox = (w - mw) / 2, oy = (h - mh) / 2;
  const P = ([lat, lng]: LatLng): [number, number] => [ox + (lng - west) * cos * sc, oy + (north - lat) * sc];
  const sheetK = rise(t, 0, 16);
  const pinAt = (i: number) => (i === (s.route?.[1] ?? -1) ? 58 : 14 + i * 6);
  // the route: a gentle curve from pin A to pin B, drawn by a moving cutout
  let route: { d: string; pts: [number, number][]; len: number } | null = null;
  if (s.route) {
    const a = P(s.pins[s.route[0]].at), b = P(s.pins[s.route[1]].at);
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const c: [number, number] = [mx - dy * 0.18, my + dx * 0.18];
    const pts: [number, number][] = Array.from({ length: 41 }, (_, i) => {
      const u = i / 40;
      return [(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
    });
    route = { d: `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`, pts, len: lengthOf(pts) };
  }
  const drawK = ramp(t, 22, 58, CURVE.quiet.standard);
  const idx = Math.min(40, Math.floor(drawK * 40));
  const head = route ? route.pts[idx] : [0, 0];
  const prev = route ? route.pts[Math.max(0, idx - 1)] : [0, 0];
  const ang = route ? (Math.atan2(head[1] - prev[1], head[0] - prev[0]) * 180) / Math.PI : 0;
  const moverK = ramp(t, 18, 24) * (1 - ramp(t, 60, 68));
  const grid: number[] = [];
  for (let g = Math.ceil(west * 10) / 10; g < east; g += 0.1) grid.push(g);
  const gridLat: number[] = [];
  for (let g = Math.ceil(south * 10) / 10; g < north; g += 0.1) gridLat.push(g);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: R.x, top: R.y, overflow: "visible", opacity: rise(t, 0, 6) }}>
      <CutDefs />
      <clipPath id="pd-map"><rect x={ox} y={oy} width={mw} height={mh} /></clipPath>
      <g transform={`translate(${((1 - sheetK) * w * 0.5).toFixed(1)} 0) rotate(${(-1.2 * sheetK).toFixed(2)} ${w / 2} ${h / 2})`} opacity={Math.min(1, sheetK * 2)}>
        <rect x={ox} y={oy} width={mw} height={mh} fill="#EEF0E2" filter="url(#pd-sheet)" />
        <g clipPath="url(#pd-map)">
          {(s.water ?? []).map((poly, i) => <polygon key={i} points={poly.map((q) => P(q).join(",")).join(" ")} fill="#B9D2E2" stroke="#9BBBD0" strokeWidth={2} />)}
          {grid.map((g) => <line key={`x${g}`} x1={P([south, g])[0]} x2={P([north, g])[0]} y1={oy} y2={oy + mh} stroke={NAVY} strokeOpacity={0.08} strokeWidth={1.5} />)}
          {gridLat.map((g) => <line key={`y${g}`} y1={P([g, west])[1]} y2={P([g, east])[1]} x1={ox} x2={ox + mw} stroke={NAVY} strokeOpacity={0.08} strokeWidth={1.5} />)}
        </g>
        {route ? (
          <>
            <mask id="pd-route-mask" maskUnits="userSpaceOnUse">
              <path d={route.d} fill="none" stroke="#fff" strokeWidth={14} strokeDasharray={route.len} strokeDashoffset={route.len * (1 - drawK)} />
            </mask>
            <path d={route.d} fill="none" stroke={NAVY} strokeWidth={5} strokeDasharray="14 11" strokeLinecap="round" mask="url(#pd-route-mask)" />
          </>
        ) : null}
        {s.pins.map((pin, i) => {
          const at = pinAt(i);
          const k = rise(t, at, 12);
          const [x, y] = P(pin.at);
          const labelW = 28 + pin.label.length * 17;
          const leftSide = x + labelW + 40 > ox + mw;
          return (
            <g key={i} opacity={Math.min(1, k * 2)}>
              <g transform={`translate(${x} ${y - (1 - k) * 50})`} filter="url(#pd-cut)">
                <path d="M0 0 C -6 -14, -20 -24, -20 -38 A 20 20 0 1 1 20 -38 C 20 -24, 6 -14, 0 0 Z" fill={RED} />
                <circle cx={0} cy={-38} r={7} fill={SCRAP} />
              </g>
              <g transform={`translate(${leftSide ? x - 30 - labelW : x + 30} ${y - 66}) rotate(${i % 2 ? 1.5 : -1.5})`} filter="url(#pd-cut)">
                <rect x={0} y={0} width={labelW} height={48} fill={SCRAP} />
                <text x={labelW / 2} y={33} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={28} fill={NAVY}>{pin.label}</text>
              </g>
            </g>
          );
        })}
        {route && moverK > 0 ? (
          // the moving cutout: a rolled paper scroll riding the head of the route
          <g transform={`translate(${head[0]} ${head[1]}) rotate(${ang.toFixed(1)}) translate(0 -26)`} opacity={moverK} filter="url(#pd-cut)">
            <rect x={-30} y={-12} width={60} height={24} rx={4} fill="#F4E6C8" />
            <circle cx={-30} cy={0} r={12} fill="#E7D3AA" />
            <circle cx={30} cy={0} r={12} fill="#E7D3AA" />
            <rect x={-4} y={-12} width={8} height={24} fill={RED} />
          </g>
        ) : null}
      </g>
    </svg>
  );
};

const FlipCalendar: React.FC<{ R: Rect; t: number; pages: [string, string]; flipAt: number }> = ({ R, t, pages, flipAt }) => {
  const S = Math.min(R.w, R.h) * 0.52;
  const inK = rise(t, 0, 16);
  const flip = ramp(t, flipAt, flipAt + 12, CURVE.quiet.standard);
  const page = (txt: string): React.CSSProperties => ({
    position: "absolute", left: 0, right: 0, top: S * 0.2, bottom: 0, background: SCRAP, display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: DISPLAY, fontWeight: 900, fontSize: S * 0.3, color: NAVY, letterSpacing: "-0.01em", backfaceVisibility: "hidden",
  });
  return (
    <div style={{ position: "absolute", left: R.x + R.w / 2 - S / 2, top: R.y + R.h / 2 - S / 2, width: S, height: S,
      transform: `translateY(${((1 - inK) * 140).toFixed(1)}px) rotate(-3deg)`, opacity: Math.min(1, inK * 2),
      filter: `drop-shadow(0 12px 16px rgba(26,31,51,0.28))`, perspective: S * 3 }}>
      <div style={{ position: "absolute", inset: 0, background: "#E9DFCB", outline: `6px solid ${EDGE}` }} />
      <div style={page(pages[1])}>{pages[1]}</div>
      {flip < 1 ? (
        <div style={{ ...page(pages[0]), opacity: 1 - ramp(flip, 0.6, 1), transformOrigin: "50% 0%", transform: `rotateX(${(flip * 100).toFixed(1)}deg)`, boxShadow: flip > 0 ? `0 ${12 * flip}px ${20 * flip}px rgba(0,0,0,${0.18 * flip})` : undefined }}>{pages[0]}</div>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: S * 0.2, background: NAVY }} />
      {[0.28, 0.72].map((x) => (
        <div key={x} style={{ position: "absolute", left: S * x - S * 0.04, top: -S * 0.07, width: S * 0.08, height: S * 0.2, borderRadius: S * 0.04, background: "#C9BFAE", border: `3px solid ${NAVY}` }} />
      ))}
    </div>
  );
};

/** A real capture cut out like a newspaper clipping, sliding in from the side. */
/** Vertical: top right of the picture, above the shorter objects. Wide: under the words, in the left column. */
const Clip: React.FC<{ L: ReturnType<typeof layoutFor>; t: number; c: Clipping; at: number }> = ({ L, t, c, at }) => {
  const k = rise(t, at, 18);
  if (k <= 0) return null;
  const dw = L.wide ? 330 : L.pic.w * 0.375;
  const s = dw / c.crop.w;
  const dh = c.crop.h * s;
  const left = L.wide ? L.text.x + L.text.w / 2 - dw / 2 + 40 : L.pic.x + L.pic.w - dw - 18;
  const top = L.wide ? L.text.y + L.text.h - dh - 30 : L.pic.y - 60;
  return (
    <div style={{ position: "absolute", left, top, width: dw + 20, padding: 10, background: EDGE,
      boxShadow: "0 12px 22px rgba(26,31,51,0.3)", transform: `translate(${((1 - k) * 160).toFixed(1)}px, ${((1 - k) * 40).toFixed(1)}px) rotate(${(3 - (1 - k) * 4).toFixed(2)}deg)`,
      opacity: Math.min(1, k * 2), zIndex: 5 }}>
      <div style={{ position: "relative", width: dw, height: dh, overflow: "hidden" }}>
        <Img src={staticFile(c.src)} style={{ position: "absolute", left: -c.crop.x * s, top: -c.crop.y * s, width: c.w * s, height: c.h * s }} />
      </div>
    </div>
  );
};

/* ---------------- semesters and a real page (11/18, the post) ---------------- */
const NOTE_AT = 14, NOTE_GAP = 5; // motion: the pills land one card every 1/6 s, so the tally reads as it climbs
const notesIn = (s: Extract<PaperScene, { kind: "terms" }>, t: number) => s.cards.filter((c, i) => c.note && t >= NOTE_AT + i * NOTE_GAP + 3).length; // counted as its pill shows

const TermsGrid: React.FC<{ R: Rect; t: number; s: Extract<PaperScene, { kind: "terms" }>; first: boolean }> = ({ R, t, s, first }) => {
  const cols = s.columns ?? 2;
  const rows = Math.ceil(s.cards.length / cols);
  const gap = 26;
  const cw = (R.w - gap * (cols - 1)) / cols;
  const ch = Math.min(230, (R.h - gap * (rows - 1)) / rows);
  const top = R.y + (R.h - (ch * rows + gap * (rows - 1))) / 2;
  const base = first ? 38 : 4; // the first scene deals once the UMD M has glided up
  const markK = s.mark ? rise(t, 10, 14) : 0;
  return (
    <>
      {s.cards.map((c, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const k = s.held ? rise(t, 0, 8) : rise(t, base + i * 3, 16);
        const on = s.mark?.includes(i);
        const dim = s.mark && !on ? 1 - 0.6 * markK : 1;
        const noteK = c.note ? rise(t, NOTE_AT + i * NOTE_GAP, 10) : 0;
        const tilt = (((i * 37) % 5) - 2) * 0.45;
        return (
          <div key={i} style={{ position: "absolute", left: R.x + col * (cw + gap), top: top + row * (ch + gap), width: cw, height: ch,
            opacity: Math.min(1, k * 1.6) * dim, transform: `translateY(${((1 - k) * 70).toFixed(1)}px) rotate(${tilt}deg)`, filter: "drop-shadow(0 6px 9px rgba(26,31,51,0.24))" }}>
            <div style={{ position: "absolute", inset: 0, background: SCRAP, clipPath: torn(i * 7 + 3) }} />
            {on ? <div style={{ position: "absolute", inset: 12, border: `6px solid ${RED}`, borderRadius: 6, opacity: markK, transform: `scale(${(1.06 - 0.06 * markK).toFixed(3)})` }} /> : null}
            <div style={{ position: "absolute", left: 38, top: ch * 0.2, fontFamily: DISPLAY, fontWeight: 900, fontSize: ch * 0.34, lineHeight: 1, color: NAVY, letterSpacing: "-0.02em" }}>{c.label}</div>
            {c.sub ? <div style={{ position: "absolute", left: 40, top: ch * 0.6, fontFamily: SERIF, fontStyle: "italic", fontSize: 30, color: NAVY, opacity: 0.75 }}>{c.sub}</div> : null}
            {c.note ? (
              <div style={{ position: "absolute", right: 30, top: ch / 2 - 30, height: 60, padding: "0 22px", borderRadius: 30, background: SCRAP, border: `3px solid ${NAVY}`,
                display: "flex", alignItems: "center", fontFamily: SERIF, fontWeight: 700, fontSize: 30, color: NAVY,
                opacity: Math.min(1, noteK * 1.5), transform: `translateY(${((1 - noteK) * 16).toFixed(1)}px) scale(${(0.9 + 0.1 * noteK).toFixed(3)})` }}>{c.note}</div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

/** Where the whole page sits: full frame width under the words in vertical, the picture side in wide. */
const pageRect = (L: ReturnType<typeof layoutFor>, W: number, p: PageCapture) => {
  const w = L.wide ? L.pic.w - 20 : W - 100;
  const s = w / p.crop.w;
  return { x: L.wide ? L.pic.x + 10 : 50, y: L.wide ? L.pic.y + 10 : 520, w, h: p.crop.h * s, s };
};

const PageView: React.FC<{ L: ReturnType<typeof layoutFor>; t: number; s: Extract<PaperScene, { kind: "page" }>; len: number }> = ({ L, t, s, len }) => {
  const { width: W } = useVideoConfig();
  const p = s.page;
  const P = pageRect(L, W, p);
  const inK = rise(t, 0, 18);
  const push = 1 + 0.025 * ramp(t, 0, len, CURVE.quiet.standard); // motion: a slow push so the held page never sits still
  const lifts = (s.lifts ?? []).map((l) => {
    const up = rise(t, l.at, 16);
    const down = l.back !== undefined ? ramp(t, l.back, l.back + 12, CURVE.quiet.standard) : 0;
    return { l, k: up * (1 - down) };
  });
  const veil = Math.max(0, ...lifts.map((x) => x.k));
  const img = (src: string, c: Box, sc: number) => (
    <Img src={staticFile(src)} style={{ position: "absolute", left: -c.x * sc, top: -c.y * sc, width: p.w * sc, height: p.h * sc }} />
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: "100%", transformOrigin: `${W / 2}px ${P.y + P.h / 2}px`, transform: `scale(${push.toFixed(4)})` }}>
      {/* the page, cut out like a clipping with a thin paper edge */}
      <div style={{ position: "absolute", left: P.x - 10, top: P.y - 10, padding: 10, background: EDGE, boxShadow: "0 14px 26px rgba(26,31,51,0.32)",
        opacity: Math.min(1, inK * 2), transform: `translateY(${((1 - inK) * 140).toFixed(1)}px) rotate(${(-0.5 - (1 - inK) * 2).toFixed(2)}deg)` }}>
        <div style={{ position: "relative", width: P.w, height: P.h, overflow: "hidden" }}>
          {p.states.map((st, i) => (
            <div key={i} style={{ position: "absolute", inset: 0, opacity: i === 0 ? 1 : ramp(t, st.at, st.at + 6, CURVE.quiet.standard) }}>{img(st.src, p.crop, P.s)}</div>
          ))}
          <div style={{ position: "absolute", inset: 0, background: "#EFE4CE", opacity: 0.62 * veil }} />
        </div>
      </div>
      {lifts.map(({ l, k }, i) => {
        if (k <= 0) return null;
        const w0 = l.crop.w * P.s, h0 = l.crop.h * P.s;
        const x0 = P.x + (l.crop.x - p.crop.x) * P.s, y0 = P.y + (l.crop.y - p.crop.y) * P.s;
        const h1 = (l.crop.h * l.toW) / l.crop.w;
        const x1 = W / 2 - l.toW / 2, y1 = l.toCy - h1 / 2;
        const w = w0 + (l.toW - w0) * k, h = h0 + (h1 - h0) * k;
        const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k;
        const sc = w / l.crop.w;
        const pad = 12 * k;
        return (
          <div key={i} style={{ position: "absolute", left: x - pad, top: y - pad, padding: pad, background: EDGE, transform: `rotate(${(-1.2 * k).toFixed(2)}deg)`,
            boxShadow: `0 ${(22 * k).toFixed(1)}px ${(36 * k).toFixed(1)}px rgba(26,31,51,${(0.4 * k).toFixed(3)})`, zIndex: 6 }}>
            <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
              {l.follow
                ? p.states.map((st, j) => (
                  <div key={j} style={{ position: "absolute", inset: 0, opacity: j === 0 ? 1 : ramp(t, st.at, st.at + 6, CURVE.quiet.standard) }}>
                    <Img src={staticFile(st.src)} style={{ position: "absolute", left: -l.crop.x * sc, top: -l.crop.y * sc, width: p.w * sc, height: p.h * sc }} />
                  </div>
                ))
                : <Img src={staticFile(l.src)} style={{ position: "absolute", left: -l.crop.x * sc, top: -l.crop.y * sc, width: p.w * sc, height: p.h * sc }} />}
            </div>
          </div>
        );
      })}
      {(s.counter ?? []).map((c, i, all) => {
        const next = all[i + 1]?.at;
        const k = rise(t, c.at, 10) * (next !== undefined ? 1 - ramp(t, next, next + 6, CURVE.quiet.exit) : 1);
        if (k <= 0) return null;
        return (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: s.counterTop ?? P.y + P.h + 30, display: "flex", justifyContent: "center", zIndex: 7 }}>
            <Scrap text={c.text} k={k} seed={40 + i} size={L.scrap} tilt={i % 2 ? 1.2 : -1.2} />
          </div>
        );
      })}
    </div>
  );
};

/* ---------------- one scene ---------------- */
const CUT = 4; // motion: the calm cut, the page clears in 4 frames to an empty sheet, then the next scene lands
const Scene: React.FC<{ s: PaperScene; first: boolean; last: boolean; source?: string; seed: number; len: number }> = ({ s, first, last, source, seed, len }) => {
  const t = useCurrentFrame();
  const clear = last ? 1 : 1 - ramp(t, len - CUT, len, CURVE.quiet.exit);
  const { width: W, height: H } = useVideoConfig();
  const L = layoutFor(W, H);
  // when each part lands; the first scene lets the UMD M have the frame until it glides up at 1.1 s
  const aboveAt = s.wordAt !== undefined ? 0 : first ? 6 : 2;
  const wordAt = s.wordAt ?? (first ? 46 : 8);
  const belowAt = s.wordAt !== undefined ? s.wordAt + 8 : first ? 54 : 14;
  const countFrom = 14, countTo = 50;
  const tallied = s.kind === "terms" && s.tally !== undefined;
  const wordText = s.kind === "count"
    ? Math.round(s.from + (s.to - s.from) * ramp(t, countFrom, countTo, CURVE.quiet.enter)).toLocaleString("en-US")
    : tallied ? String(Math.min(Number(s.word), s.tally! * Math.max(1, notesIn(s, t)))) // starts on one card's worth, never on 0
    : s.word ?? "";
  const chars = s.kind === "count" ? String(s.to.toLocaleString("en-US")).length : tallied ? (s.word ?? "").length : wordText.length;
  // a page scene gives the frame to the page: the words sit higher and smaller
  const T = s.kind === "page" && !L.wide ? { ...L.text, y: 190, h: 320 } : L.text;
  const fontSize = Math.min(s.kind === "page" ? 190 : L.wordMax, T.w / Math.max(1, chars * 0.6));
  const wordK = rise(t, wordAt, 14);
  const ulK = s.underline ? ramp(t, wordAt + 26, wordAt + 40, CURVE.quiet.enter) : 0;
  const clipAt = s.kind === "compare" ? 8 + (s.items.length - 1) * 18 + 12 : 30;
  return (
    <AbsoluteFill style={{ opacity: clear }}>
      <div style={{ position: "absolute", left: T.x, top: T.y, width: T.w, height: T.h, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: L.wide && !s.clip ? "center" : "flex-start", paddingTop: L.wide && s.clip ? 60 : 0, gap: 10 }}>
        {s.above ? <Scrap text={s.above} k={rise(t, aboveAt, 12)} seed={seed * 3 + 1} size={L.scrap} tilt={-1.4} /> : null}
        <div style={{ position: "relative", display: "inline-block", opacity: Math.min(1, wordK * 1.5), transform: `translateY(${((1 - wordK) * 34).toFixed(1)}px)`, margin: "4px 0 12px" }}>
          <span data-snap={s.kind === "count" || tallied ? "" : undefined} style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize, lineHeight: 1.04, letterSpacing: "-0.025em",
            fontVariantNumeric: "lining-nums tabular-nums", backgroundImage: `linear-gradient(180deg, ${NAVY_HI} 0%, ${NAVY} 70%)`, WebkitBackgroundClip: "text",
            backgroundClip: "text", color: "transparent", display: "inline-block", padding: "0 0.04em" }}>{wordText}</span>
          {s.underline ? <Underline k={ulK} /> : null}
        </div>
        {s.below ? <Scrap text={s.below} k={rise(t, belowAt, 12)} seed={seed * 3 + 2} size={L.scrap} tilt={1.1} /> : null}
      </div>
      {s.kind === "title" ? <TitleCollage R={L.pic} t={t} pieces={s.collage ?? ["sun", "clouds", "hall", "trees"]} first={first} /> : null}
      {s.kind === "compare" ? <CompareChart R={L.pic} t={t} s={s} /> : null}
      {s.kind === "map" ? <MapSheet R={L.pic} t={t} s={s} /> : null}
      {s.kind === "count" ? <FlipCalendar R={L.pic} t={t} pages={s.calendar ?? [String(s.from), String(s.to)]} flipAt={countFrom} /> : null}
      {s.kind === "terms" ? <TermsGrid R={L.wide ? L.pic : { x: 90, y: 760, w: W - 180, h: 820 }} t={t} s={s} first={first} /> : null}
      {s.kind === "page" ? <PageView L={L} t={t} s={s} len={len} /> : null}
      {s.clip ? <Clip L={L} t={t} c={s.clip} at={clipAt} /> : null}
      {last && source ? (
        <div style={{ position: "absolute", left: L.wide ? L.text.x : 70, right: L.wide ? undefined : 70, bottom: L.wide ? 50 : 70, textAlign: L.wide ? "left" : "center",
          fontFamily: SERIF, fontStyle: "italic", fontSize: 24, color: NAVY, opacity: 0.7 * rise(t, 30, 12) }}>{source}</div>
      ) : null}
      {/* sound: a paper slide on the cut, then what lands */}
      <Cue at={0} name="paper-slide" volume={0.32} />
      {s.kind === "compare" ? s.items.map((_, i) => <Cue key={i} at={8 + i * 18} name="paper-move-quick" volume={0.3} />) : null}
      {s.kind === "map" ? <Cue at={22} name="paper-move-quick" volume={0.3} /> : null}
      {s.kind === "count" ? <><Cue at={countFrom} name="paper-page-turn" volume={0.45} /><Cue at={countFrom + 2} name="counter" volume={0.3} /></> : null}
      {s.underline ? <Cue at={wordAt + 26} name="marker-pen-line" volume={0.4} /> : null}
      {s.kind === "terms" && !s.held ? <Cue at={first ? 38 : 4} name="paper-move-quick" volume={0.3} /> : null}
      {s.kind === "terms" && s.tally !== undefined ? <Cue at={NOTE_AT} name="counter" volume={0.3} /> : null}
      {s.kind === "terms" && s.mark ? <Cue at={10} name="marker-pen-line" volume={0.35} /> : null}
      {s.kind === "page" ? (s.lifts ?? []).map((l, i) => <Cue key={`l${i}`} at={l.at} name="paper-slide" volume={0.3} />) : null}
      {s.kind === "page" ? (s.page.states.slice(1)).map((st, i) => <Cue key={`s${i}`} at={st.at} name="paper-page-turn" volume={0.3} />) : null}
    </AbsoluteFill>
  );
};

export const PaperDoc: React.FC<PaperDocProps> = (p) => {
  const { width: W, height: H } = useVideoConfig();
  const starts = paperDocStarts(p);
  const end = starts[p.scenes.length];
  const wide = W > H;
  return (
    <World endAt={end} cta={p.cta} font={DISPLAY} fontWeight={800} ink="#F6EEDD" logo="dark" endLogo="white" logoSpot="top-right" end="wipe-up" endGround={NAVY} ground={GROUND}>
      {p.scenes.map((s, i) => (
        // calm cuts: each scene owns its frames, nothing carries across; the last runs on under the end wipe
        <Sequence key={i} from={starts[i]} durationInFrames={i === p.scenes.length - 1 ? Infinity : starts[i + 1] - starts[i]} layout="none">
          <Scene s={s} first={i === 0} last={i === p.scenes.length - 1} source={p.source} seed={i + 1} len={starts[i + 1] - starts[i]} />
        </Sequence>
      ))}
      <Grain W={W} H={H} />
      {wide ? <UmdOpen bigCx={960} bigCy={520} bigH={300} tagCx={960} tagCy={84} tagH={56} outAt={end - 10} /> : <UmdOpen outAt={end - 10} {...p.umd} />}
    </World>
  );
};
