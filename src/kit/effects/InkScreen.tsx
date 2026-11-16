/**
 * Ink screen (2026-11-15): the print looks shared by Press font, Impact frame and Bank note. Live footage turned into
 * ink the way a press would: a halftone dot screen, a line engraving, or a hard posterised threshold. All of it is CSS
 * plus one SVG filter, so it renders headless frame by frame (no canvas reads, no backdrop-filter, nothing random).
 *
 * How it works: the footage is greyed and halved in brightness (0 to 0.5); a screen pattern (dots or lines, 0 to 0.5)
 * is added on top with `plus-lighter`; the SVG filter then thresholds the sum at 0.5. A dark pixel is under the
 * threshold for most of the pattern's cell, so it prints a big dot or a thick line; a light pixel prints little or
 * nothing. The screen spans 0.04 to 0.46, not 0 to 0.5, so pure white prints no ink and pure black prints solid. A steep linear ramp instead of a hard step keeps the edges antialiased. The result is ink on transparent,
 * so whatever sits behind (newsprint, a note, speed lines) is the paper.
 *
 * Props: `src` (path under public/), `transparent` (it is a cutout webm; `paper` then sets the tone behind the person,
 * 1 = white = no ink), `place` (the clip px kept at the box centre and its zoom), `pattern`, `cell` (px per dot or
 * line), `angle` (degrees), `ink`, `contrast` and `brightness` (the tone curve before screening: high contrast gives the
 * manga threshold look with screentone only in the mids), `wave` (px of hand-engraved wobble on the lines).
 */
import React from "react";
import { OffthreadVideo, staticFile, useVideoConfig } from "remotion";

/** Zoom, the clip y that sits on the frame's bottom edge, and the clip x kept centred (as in Orbit and GreenScreen). */
export type Framing = { zoom: number; bottom: number; focusX?: number };

/** The CSS for a full-frame layer framed by `frame`, so a clip and its cutout stay locked together. */
export const framedStyle = (W: number, H: number, frame?: Framing): React.CSSProperties => {
  const zoom = frame?.zoom ?? 1;
  const bottom = frame?.bottom ?? H;
  const focusX = frame?.focusX ?? W / 2;
  const tx = W / 2 - focusX * zoom;
  const ty = H - bottom * zoom;
  return { position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` };
};

/** Where a clip point lands on the frame under `frame`. */
export const framedPoint = (W: number, H: number, frame: Framing | undefined, x: number, y: number) => {
  const zoom = frame?.zoom ?? 1;
  const tx = W / 2 - (frame?.focusX ?? W / 2) * zoom;
  const ty = H - (frame?.bottom ?? H) * zoom;
  return { x: tx + x * zoom, y: ty + y * zoom };
};

/** Small seeded random, so every "random" mark is the same on every render. */
export const rng = (seed: number) => {
  let a = Math.floor(seed * 9973) + 0x6d2b79f5;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hex = (c: string) => {
  const h = c.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export type InkScreenProps = {
  id: string;
  src: string;
  transparent?: boolean;
  startFrom?: number;
  width: number;
  height: number;
  /** The clip pixel kept at the box centre, and how much the clip is scaled. */
  place: { x: number; y: number; zoom: number };
  /** The clip's own size, if it is not the composition's. */
  clipSize?: { w: number; h: number };
  pattern?: "dots" | "lines";
  cell?: number;
  angle?: number;
  ink?: string;
  contrast?: number;
  brightness?: number;
  /** Tone behind a cutout, 0 (black) to 1 (white, no ink). */
  paper?: number;
  wave?: number;
  /** Sharpness of the threshold ramp. Higher is harder. */
  edge?: number;
  style?: React.CSSProperties;
};

export const InkScreen: React.FC<InkScreenProps> = (p) => {
  const { width: CW, height: CH } = useVideoConfig();
  const cw = p.clipSize?.w ?? CW;
  const ch = p.clipSize?.h ?? CH;
  const { width: w, height: h } = p;
  const cell = p.cell ?? 10;
  const pattern = p.pattern ?? "dots";
  const [r, g, b] = hex(p.ink ?? "#141210");
  const s = p.edge ?? 9;
  const diag = Math.ceil(Math.sqrt(w * w + h * h)) + cell * 4;

  const bg =
    pattern === "dots"
      ? { backgroundImage: "radial-gradient(circle farthest-corner at 50% 50%, #0a0a0a 0%, #767676 100%)", backgroundSize: `${cell}px ${cell}px` }
      : { backgroundImage: `repeating-linear-gradient(0deg, #0a0a0a 0px, #767676 ${cell / 2}px, #0a0a0a ${cell}px)` };

  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden", ...p.style }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={`${p.id}-ink`} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" />
          <feComponentTransfer>
            <feFuncR type="linear" slope={s} intercept={0.5 - s * 0.5} />
          </feComponentTransfer>
          <feColorMatrix type="matrix" values={`0 0 0 0 ${r.toFixed(4)}  0 0 0 0 ${g.toFixed(4)}  0 0 0 0 ${b.toFixed(4)}  -1 0 0 0 1`} />
        </filter>
        {p.wave ? (
          <filter id={`${p.id}-wave`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.0032 0.0085" numOctaves={1} seed={3} />
            <feDisplacementMap in="SourceGraphic" scale={p.wave} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ) : null}
      </svg>
      <div style={{ position: "absolute", inset: 0, filter: `url(#${p.id}-ink)` }}>
        {/* the tone: grey footage halved to 0..0.5 */}
        <div style={{ position: "absolute", inset: 0, filter: "brightness(0.5)", background: p.transparent ? `rgb(${Math.round((p.paper ?? 1) * 255)},${Math.round((p.paper ?? 1) * 255)},${Math.round((p.paper ?? 1) * 255)})` : "#fff" }}>
          <OffthreadVideo
            src={staticFile(p.src)}
            startFrom={p.startFrom ?? 0}
            muted
            transparent={p.transparent}
            style={{
              position: "absolute",
              left: w / 2 - p.place.x * p.place.zoom,
              top: h / 2 - p.place.y * p.place.zoom,
              width: cw * p.place.zoom,
              height: ch * p.place.zoom,
              maxWidth: "none",
              filter: `grayscale(1) contrast(${p.contrast ?? 1.25}) brightness(${p.brightness ?? 1.05})`,
            }}
          />
        </div>
        {/* the screen: 0..0.5 added on top */}
        <div
          style={{
            position: "absolute",
            left: (w - diag) / 2,
            top: (h - diag) / 2,
            width: diag,
            height: diag,
            transform: `rotate(${p.angle ?? 45}deg)`,
            mixBlendMode: "plus-lighter",
            filter: p.wave ? `url(#${p.id}-wave)` : undefined,
            ...bg,
          }}
        />
      </div>
    </div>
  );
};
