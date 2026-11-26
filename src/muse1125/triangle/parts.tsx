/**
 * Triangle parts (2026-11-25, Muse: John Bucog's "The Triangle of Editing", tiktok.com/@johnbucog_/video/7710822650515295509;
 * Jacob: "learn from this and take these components to our studio"). Read frame by frame: all 29.7 s every 0.5 s, then
 * 0.1 to 0.2 s around the beat changes (2.0 to 2.5 s, 3.6 to 4.4 s, 6.0 to 7.0 s, 11.2 to 12.4 s, 14.6 to 15.4 s).
 * Our own build; nothing from the film is copied.
 *
 * What the film does that these parts carry (its numbers, so the parts can be tuned against it):
 * - `SlamWord`: one or two words filling the frame edge to edge in a heavy condensed face, white on oxblood. Each line is
 *   stretched to the full width on its own ("UNDER" over "STAND"). The letters boil: every 4 to 5 frames each one takes
 *   a new small tilt (up to about 4 degrees), lift and size, so a held word never sits still (FIRST, 2.0 to 2.3 s).
 * - `BarWipe`: the cut between two type cards is a stack of flat bars sliding across in alternate directions, covering
 *   the frame for a frame or two and leaving the next card behind them (2.45 s).
 * - `TriangleType`: a phrase set INSIDE a triangle, each line stretched to the triangle's width at its own height, so the
 *   type is the shape (4.0 to 4.5 s). The triangle arrives growing and turning in about 0.4 s.
 * - `RingText`: a filled circle holding a photo or a clip, a word repeated around it as a ring that keeps turning, the
 *   word swapping on the beat ("TO BUILD", "PACING", "YOU NEED", "MOTION", 8.0 to 9.5 s). Ours can also open the circle
 *   like an iris into a full frame of what it holds, to carry into the next shot.
 * - `InsetType`: a giant condensed word drifting sideways across a red ground, with grey portrait insets of the person
 *   sitting over the letters (CONTRAST, EQUALS, RHYTHM, 11.5 to 12.5 s).
 * - `FaceTiles`: the face broken into tiles, each a rectangle of the same shot slightly pushed in and offset, so the face
 *   reads but is fractured; the tiles twitch every few frames (15.0 to 17.5 s).
 * - `CutRhythm` and `pace`: fast cuts mixed with slow ones. The film's fast cuts run 0.2 to 0.5 s and its holds 1.5 to
 *   2.5 s ("Contrast equals rhythm"), and a hit lands on each fast cut.
 * - `SaidWords`: the spoken line landing word by word as it is said, mixed sizes, one word huge in the condensed face.
 *
 * Colours and fonts are props. The parts carry the motion; a film carries its look.
 * Worked example: `TriangleNetwork-9x16` (./film.tsx). Every part alone: `TriangleParts-9x16` (./shelf.tsx).
 */
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadShoulders } from "@remotion/google-fonts/BigShoulders";
import { INTER } from "../../kit/parts";
import { IN, OUT, Sfx, clampX, k, mix } from "../../kit/effects/shared";

export const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
export const { fontFamily: SHOULDERS } = loadShoulders("normal", { weights: ["900"], subsets: ["latin"] });
export { INTER };

/** The film's own family, close to the reference: oxblood ground, brand red, near black, warm white, one blue. */
export const TRI = {
  oxblood: "#9E0F17",
  red: "#D9202E",
  black: "#0b0708",
  white: "#F7EFE6",
  blue: "#1E63D6",
};

/** Seeded 0..1, the same on every render. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

let ctx: CanvasRenderingContext2D | null = null;
/** Width of `text` set in `font` (a CSS font shorthand), in px. */
export const measure = (text: string, font: string) => {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  ctx!.font = font;
  return ctx!.measureText(text).width;
};

// ---------------------------------------------------------------------------------------------- Media
/** A clip or a still under public/, placed so that `focus` (in the media's own px) sits at `target` (frame px). */
export type MediaSpec = {
  src: string;
  kind: "video" | "image";
  /** Media size in px. */
  size: { w: number; h: number };
  /** Seconds into the clip at this element's first frame. */
  from?: number;
  volume?: number;
  filter?: string;
};
export type Framing = { zoom?: number; focus?: { x: number; y: number }; target?: { x: number; y: number } };

export const MediaFrame: React.FC<{ media: MediaSpec; framing?: Framing; w?: number; h?: number; muted?: boolean }> = ({
  media, framing = {}, w, h, muted = true,
}) => {
  const vc = useVideoConfig();
  const W = w ?? vc.width, H = h ?? vc.height;
  const base = Math.max(W / media.size.w, H / media.size.h);
  const s = base * (framing.zoom ?? 1);
  const focus = framing.focus ?? { x: media.size.w / 2, y: media.size.h / 2 };
  const target = framing.target ?? { x: W / 2, y: H / 2 };
  const style: React.CSSProperties = {
    position: "absolute", left: target.x - focus.x * s, top: target.y - focus.y * s,
    width: media.size.w * s, height: media.size.h * s, maxWidth: "none", filter: media.filter,
  };
  return media.kind === "video" ? (
    <OffthreadVideo src={staticFile(media.src)} trimBefore={Math.round((media.from ?? 0) * vc.fps)} muted={muted}
      volume={media.volume ?? 1} style={style} />
  ) : (
    <Img src={staticFile(media.src)} style={style} />
  );
};

// ---------------------------------------------------------------------------------------------- SlamWord
export type Box = { x: number; y: number; w: number; h: number };

/**
 * Words filling a box edge to edge, one line per entry in `lines`, each line stretched to the box width. Boiling letters.
 * `ground` fills the whole frame behind it (leave it out to lay the word over footage).
 */
export const SlamWord: React.FC<{
  lines: string[];
  ink: string;
  ground?: string;
  box?: Box;
  font?: string;
  /** Frame it appears (cut in, the film's way). */
  at?: number;
  /** Frames between boil redraws; 0 holds the letters still. */
  boil?: number;
  /** Most tilt in degrees while boiling. */
  tilt?: number;
  seed?: number;
  /** Gap between lines as a share of a line's height. */
  gap?: number;
  /** "cut" lands on the frame; "punch" lands from 112% in 4 frames. */
  enter?: "cut" | "punch";
  /** Upper bound on how much a line may be stretched sideways (a short word in a wide box). */
  maxStretch?: number;
}> = ({ lines, ink, ground, box, font = ANTON, at = 0, boil = 4, tilt = 4, seed = 1, gap = 0.04, enter = "cut", maxStretch = 2.6 }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  if (f < at) return null;
  const b = box ?? { x: width * 0.04, y: height * 0.08, w: width * 0.92, h: height * 0.84 };
  const n = lines.length;
  const lineH = (b.h - (n - 1) * gap * (b.h / n)) / n;
  const size = lineH * 1.16; // motion: Anton's caps fill about 0.86 of the em, so the caps fill the line
  const tick = boil > 0 ? Math.floor((f - at) / boil) : 0;
  const p = enter === "punch" ? k(f, at, at + 4, OUT) : 1;
  return (
    <AbsoluteFill style={{ background: ground }}>
      <div style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h,
        transform: `scale(${mix(1.12, 1, p).toFixed(4)})`, transformOrigin: "50% 50%" }}>
        {lines.map((line, li) => {
          const fnt = `400 ${size}px ${font}`;
          const natural = measure(line, fnt);
          const sx = Math.min(maxStretch, b.w / Math.max(1, natural));
          return (
            <div key={li} style={{ position: "absolute", left: 0, top: li * (lineH + gap * lineH), width: b.w, height: lineH,
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible" }}>
              <div style={{ transform: `scaleX(${sx.toFixed(4)})`, whiteSpace: "pre", font: fnt, lineHeight: `${lineH}px`, color: ink }}>
                {line.split("").map((ch, ci) => {
                  const r = (s: number) => rand(seed * 131 + li * 37 + ci * 11 + tick * 7 + s);
                  const rot = boil > 0 ? (r(1) - 0.5) * 2 * tilt : 0;
                  const dy = boil > 0 ? (r(2) - 0.5) * 0.05 * lineH : 0;
                  const sc = boil > 0 ? 1 + (r(3) - 0.5) * 0.06 : 1;
                  return (
                    <span key={ci} style={{ display: "inline-block", transform: `translateY(${dy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})` }}>
                      {ch}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- BarWipe
/** Flat bars crossing the frame in alternate directions. Covered at `at + dur / 2`: cut underneath on that frame. */
export const BarWipe: React.FC<{ at: number; dur?: number; bars?: number; color: string; stagger?: number }> = ({
  at, dur = 10, bars = 5, color, stagger = 1,
}) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const half = dur / 2;
  if (f < at || f > at + dur + bars * stagger) return null;
  const bh = height / bars;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: bars }).map((_, i) => {
        const s = at + i * stagger;
        const inP = k(f, s, s + half, OUT);
        const outP = k(f, s + half, s + dur, IN);
        const dir = i % 2 === 0 ? 1 : -1;
        const x = dir * (-(1 - inP) * width + outP * width);
        return <div key={i} style={{ position: "absolute", left: x, top: i * bh - 1, width, height: bh + 2, background: color }} />;
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- TriangleType
/** A phrase set inside a triangle (apex up): each line stretched to the triangle's width at its own height. */
export const TriangleType: React.FC<{
  lines: string[];
  /** Centre of the triangle's box. */
  cx: number;
  cy: number;
  base: number;
  height: number;
  fill: string;
  ink: string;
  font?: string;
  at?: number;
  /** Where the type starts below the apex, as a share of the height (the apex is too narrow to hold a line). */
  start?: number;
  boil?: number;
  seed?: number;
}> = ({ lines, cx, cy, base, height, fill, ink, font = ANTON, at = 0, start = 0.24, boil = 5, seed = 3 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const grow = spring({ frame: f - at, fps, config: { damping: 15, stiffness: 160, mass: 0.7 } });
  const top = cy - height / 2;
  const left = cx - base / 2;
  const n = lines.length;
  const bandH = (height * (1 - start) * 0.94) / n;
  const tick = boil > 0 ? Math.floor((f - at) / boil) : 0;
  const wob = boil > 0 ? (rand(seed + tick) - 0.5) * 1.6 : 0;
  return (
    <div style={{ position: "absolute", left, top, width: base, height,
      transform: `scale(${mix(0.25, 1, grow).toFixed(4)}) rotate(${(mix(-14, 0, grow) + wob).toFixed(2)}deg)`, transformOrigin: "50% 62%" }}>
      <svg width={base} height={height} style={{ position: "absolute", inset: 0 }}>
        <polygon points={`${base / 2},0 ${base},${height} 0,${height}`} fill={fill} />
      </svg>
      {lines.map((line, i) => {
        const y0 = height * start + i * bandH; // band top, from the apex
        const wAtTop = (base * y0) / height;
        const w = wAtTop * 0.9;
        const size = bandH * 1.12;
        const fnt = `400 ${size}px ${font}`;
        const sx = Math.min(2.4, w / Math.max(1, measure(line, fnt)));
        const lp = k(f, at + 4 + i * 3, at + 10 + i * 3, OUT);
        return (
          <div key={i} style={{ position: "absolute", left: 0, width: base, top: y0, height: bandH, display: "flex", alignItems: "center",
            justifyContent: "center", opacity: lp, filter: `blur(${((1 - lp) * 8).toFixed(2)}px)` }}>
            <div style={{ font: fnt, lineHeight: `${bandH}px`, color: ink, whiteSpace: "pre", transform: `scaleX(${sx.toFixed(4)})` }}>{line}</div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------- RingText
export type RingWord = { text: string; at: number };

/**
 * A filled circle holding `children` (a clip or a still), with a word repeated around it as a turning ring that swaps on
 * the beat. `irisAt` opens the circle until it fills the frame and throws the ring outward, carrying into a full shot.
 */
export const RingText: React.FC<{
  cx: number;
  cy: number;
  /** Radius of the filled circle. */
  r: number;
  /** Radius of the ring the type sits on (its baseline). */
  ringR: number;
  size: number;
  words: RingWord[];
  fill: string;
  ink: string;
  font?: string;
  at?: number;
  /** Degrees a second. */
  spin?: number;
  /** How many times each word goes round. */
  repeat?: number;
  irisAt?: number;
  irisDur?: number;
  children?: React.ReactNode;
}> = ({ cx, cy, r, ringR, size, words, fill, ink, font = ANTON, at = 0, spin = 40, repeat = 3, irisAt, irisDur = 14, children }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  if (f < at) return null;
  const pop = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 170 } });
  const iris = irisAt === undefined ? 0 : k(f, irisAt, irisAt + irisDur, (t) => t * t * (3 - 2 * t));
  const far = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy)) + 4;
  const rr = mix(r * pop, far, iris);
  let cur = 0;
  words.forEach((w, i) => { if (f >= w.at) cur = i; });
  const w = words[cur];
  const wp = k(f, w.at, w.at + 5, OUT);
  // motion: steady turn plus a 40 degree kick on each word change, eased out over 9 frames
  const kicks = words.slice(1).reduce((a, x) => a + 40 * k(f, x.at, x.at + 9, OUT), 0);
  const rot = ((f - at) / fps) * spin + kicks;
  const circ = 2 * Math.PI * ringR;
  const text = Array.from({ length: repeat }).map(() => w.text).join("  ") + "  ";
  const ringScale = mix(0.6, 1, pop) * mix(1, 1.9, iris);
  const id = `ring-${cx}-${cy}`;
  return (
    <>
      <div style={{ position: "absolute", left: cx - rr, top: cy - rr, width: rr * 2, height: rr * 2, borderRadius: "50%", overflow: "hidden", background: fill }}>
        <div style={{ position: "absolute", left: rr - cx, top: rr - cy, width, height }}>{children}</div>
      </div>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible",
        opacity: (1 - iris) * Math.min(1, pop * 1.4), filter: `blur(${((1 - wp) * 10 + iris * 8).toFixed(2)}px)` }}>
        <defs>
          <path id={id} d={`M ${cx} ${cy - ringR} a ${ringR} ${ringR} 0 1 1 -0.01 0`} />
        </defs>
        <g transform={`rotate(${rot.toFixed(2)} ${cx} ${cy}) translate(${cx} ${cy}) scale(${ringScale.toFixed(4)}) translate(${-cx} ${-cy})`}>
          <text style={{ font: `400 ${size}px ${font}` }} fill={ink}>
            <textPath href={`#${id}`} textLength={circ * 0.985} lengthAdjust="spacingAndGlyphs">{text}</textPath>
          </text>
        </g>
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------------------------- InsetType
export type Inset = { x: number; y: number; w: number; h: number; at: number; node: React.ReactNode };

/** A giant condensed word drifting sideways across a ground, portrait insets sitting over its letters. */
export const InsetType: React.FC<{
  words: RingWord[];
  ink: string;
  ground: string;
  /** Height the caps fill, px, and their centre line. */
  capH: number;
  cy: number;
  font?: string;
  /** Px a frame (negative drifts left). */
  drift?: number;
  insets?: Inset[];
  /** Insets drawn in grey, the film's way. */
  grey?: boolean;
  boil?: number;
  at?: number;
  /** Stretch or squeeze each word to this width (px) before it drifts; left out, the word keeps its natural width. */
  fitWidth?: number;
}> = ({ words, ink, ground, capH, cy, font = SHOULDERS, drift = -9, insets = [], grey = true, boil = 4, at = 0, fitWidth }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  if (f < at) return null;
  let cur = 0;
  words.forEach((w, i) => { if (f >= w.at) cur = i; });
  const w = words[cur];
  const size = capH * 1.28;
  const fnt = `900 ${size}px ${font}`;
  const natural = measure(w.text, fnt);
  const sx = fitWidth ? fitWidth / Math.max(1, natural) : 1;
  // the word enters with its left edge just inside the frame and drifts; each new word restarts the drift
  const x = width * 0.02 + (f - w.at) * drift;
  const tick = Math.floor((f - w.at) / Math.max(1, boil));
  return (
    <AbsoluteFill style={{ background: ground, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: x, top: cy - size / 2, height: size, width: natural, font: fnt, lineHeight: `${size}px`, color: ink, whiteSpace: "pre",
        transform: `scaleX(${sx.toFixed(4)})`, transformOrigin: "0 50%" }}>
        {w.text.split("").map((ch, i) => (
          <span key={i} style={{ display: "inline-block", transform: `translateY(${((rand(i * 9 + tick * 5) - 0.5) * capH * 0.03).toFixed(2)}px) scaleY(${(1 + (rand(i * 3 + tick) - 0.5) * 0.04).toFixed(3)})` }}>{ch}</span>
        ))}
      </div>
      {insets.map((s, i) => {
        if (f < s.at) return null;
        const p = k(f, s.at, s.at + 3, OUT);
        return (
          <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.w, height: s.h, overflow: "hidden",
            transform: `scale(${mix(1.08, 1, p).toFixed(4)})`, filter: grey ? "grayscale(1) contrast(1.05)" : undefined }}>
            <div style={{ position: "absolute", inset: 0 }}>{s.node}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- FaceTiles
export type Tile = { x: number; y: number; w: number; h: number; zoom: number; dx: number; dy: number };

/** Tiles laid over a face box (frame px): random rectangles, each a pushed-in, offset copy of the same shot. */
export const faceTiles = (face: Box, n = 9, seed = 5): Tile[] =>
  Array.from({ length: n }).map((_, i) => {
    const r = (s: number) => rand(seed * 71 + i * 13 + s);
    const w = face.w * mix(0.38, 0.72, r(1));
    const h = w * mix(0.55, 0.95, r(2));
    return {
      x: face.x + mix(0, 1, r(3)) * face.w - w / 2,
      y: face.y + mix(0, 1, r(4)) * face.h - h / 2,
      w, h,
      zoom: mix(1.04, 1.32, r(5)),
      dx: (r(6) - 0.5) * face.w * 0.16,
      dy: (r(7) - 0.5) * face.h * 0.12,
    };
  });

/** The face broken into tiles. `media` plays full frame (dimmed) and again inside every tile, offset and pushed in. */
export const FaceTiles: React.FC<{
  media: MediaSpec;
  framing?: Framing;
  tiles: Tile[];
  at?: number;
  /** Frames between tile arrivals. */
  stagger?: number;
  /** Frames between twitches. */
  twitch?: number;
  dim?: number;
  wash?: string;
}> = ({ media, framing = {}, tiles, at = 0, stagger = 2, twitch = 4, dim = 0.5, wash }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const tick = Math.floor(Math.max(0, f - at) / twitch);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ opacity: 1 - dim }}><MediaFrame media={media} framing={framing} /></AbsoluteFill>
      {wash ? <AbsoluteFill style={{ background: wash, mixBlendMode: "multiply" }} /> : null}
      {tiles.map((t, i) => {
        const s = at + i * stagger;
        if (f < s) return null;
        const p = k(f, s, s + 3, OUT);
        const jx = (rand(i * 17 + tick * 3) - 0.5) * 8;
        const jy = (rand(i * 29 + tick * 5) - 0.5) * 8;
        const fx = (framing.focus ?? { x: media.size.w / 2, y: media.size.h / 2 });
        const tg = framing.target ?? { x: width / 2, y: height / 2 };
        return (
          <div key={i} style={{ position: "absolute", left: t.x + jx, top: t.y + jy, width: t.w, height: t.h, overflow: "hidden",
            boxShadow: "0 18px 40px rgba(0,0,0,0.45)", opacity: p, transform: `scale(${mix(1.15, 1, p).toFixed(4)})` }}>
            <div style={{ position: "absolute", left: -t.x - jx, top: -t.y - jy, width, height }}>
              <MediaFrame media={media} framing={{ zoom: (framing.zoom ?? 1) * t.zoom, focus: fx, target: { x: tg.x + t.dx, y: tg.y + t.dy } }} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------- CutRhythm
/** motion: the reference's fast cuts run 0.2 to 0.5 s and its holds 1.5 to 2.5 s; these are the two ends we use. */
export const FAST = 8;
export const SLOW = 48;
/** "ffs" gives [FAST, FAST, SLOW]: write the rhythm first, then fill it. */
export const pace = (pattern: string, fast = FAST, slow = SLOW) => pattern.split("").map((c) => (c === "f" ? fast : slow));

export type Cut = { len: number; node: React.ReactNode; hit?: string };

/** Shots back to back, each `len` frames; a cut with `hit` plays that sound on its first frame. */
export const CutRhythm: React.FC<{ cuts: Cut[]; sound?: boolean; volume?: number }> = ({ cuts, sound = true, volume = 0.5 }) => {
  let t = 0;
  return (
    <>
      {cuts.map((c, i) => {
        const from = t;
        t += c.len;
        return (
          <Sequence key={i} from={from} durationInFrames={c.len} layout="none">
            <AbsoluteFill>{c.node}</AbsoluteFill>
            {c.hit ? <Sfx at={0} name={c.hit} volume={volume} on={sound} /> : null}
          </Sequence>
        );
      })}
    </>
  );
};
export const cutsLength = (cuts: Cut[]) => cuts.reduce((a, c) => a + c.len, 0);

// ---------------------------------------------------------------------------------------------- SaidWords
export type SaidWord = { text: string; at: number; big?: boolean; color?: string };

/** A spoken line landing word by word as it is said: small words in a bold sans, `big` ones huge in the condensed face. */
export const SaidWords: React.FC<{
  words: SaidWord[];
  box: Box;
  ink: string;
  size?: number;
  bigSize?: number;
  font?: string;
  bigFont?: string;
  align?: "flex-start" | "center" | "flex-end";
  /** Words already on screen before they are said sit at this opacity (0 hides them). */
  ghost?: number;
  out?: number;
}> = ({ words, box, ink, size = 64, bigSize = 220, font = INTER, bigFont = ANTON, align = "center", ghost = 0, out }) => {
  const f = useCurrentFrame();
  const o = out === undefined ? 1 : 1 - k(f, out, out + 5, IN);
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, display: "flex", flexWrap: "wrap",
      alignContent: "center", justifyContent: align, columnGap: size * 0.32, rowGap: 0, opacity: o }}>
      {words.map((w, i) => {
        const p = k(f, w.at, w.at + 5, OUT);
        const shown = f >= w.at;
        const op = shown ? p : ghost;
        const sc = shown ? mix(1.18, 1, p) : 1;
        return (
          <span key={i} style={{
            display: "inline-block", color: w.color ?? ink, opacity: op,
            font: w.big ? `400 ${bigSize}px ${bigFont}` : `800 ${size}px ${font}`,
            lineHeight: w.big ? `${bigSize * 0.92}px` : `${size * 1.15}px`, letterSpacing: w.big ? 0 : "-0.02em",
            transform: `scale(${sc.toFixed(4)})`, filter: shown ? `blur(${((1 - p) * 10).toFixed(2)}px)` : undefined,
            textShadow: w.big ? undefined : "0 4px 24px rgba(0,0,0,0.45)",
          }}>{w.text}</span>
        );
      })}
    </div>
  );
};

export { clampX, interpolate };
