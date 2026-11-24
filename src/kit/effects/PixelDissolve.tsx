/**
 * PixelDissolve (2026-11-24, Muse): one scene breaks into square blocks of the accent that sweep across the frame and
 * leave the next scene behind them. From bemx.studio's RunInfra launch film (instagram.com/reel/DgGtZyFKcLY), measured
 * at 0.5 s steps: the slide breaks into accent blocks from the left edge, the front is ragged (blocks run ahead and lag
 * behind), each block holds the accent for a moment, then shows what comes next.
 *
 * Every block has its own moment, from its position along `direction` plus a random share (`jitter`). Before its moment
 * it shows `from`; for `band` (a share of the sweep) it shows one of `colors`; after that it shows `to`.
 *  - Cover to a solid: `to` is a flat fill of the accent.
 *  - Pass one scene to the next: `from` and `to` both scenes, the accent only in the moving front.
 *  - Assemble a logo from pixels: `from` empty, `to` the logo, `direction: "random"`, a small band of light blocks.
 * `progress` is 0 to 1, driven by the film (so it can ease). Pure function of progress: no state, safe to scrub.
 */
import React from "react";
import { AbsoluteFill, random } from "remotion";

export type PixelDissolveProps = {
  progress: number;
  from?: React.ReactNode;
  to?: React.ReactNode;
  width: number;
  height: number;
  /** Block size in px. */
  cell?: number;
  /** The colours of the moving front, picked per block. */
  colors?: string[];
  /** How long a block holds its colour, as a share of the sweep. */
  band?: number;
  /** 0 is a clean straight edge, 1 is pure noise. */
  jitter?: number;
  direction?: "left" | "right" | "top" | "random";
  seed?: string;
};

type Block = { x: number; y: number; t: number; c: string };

const blocksFor = (w: number, h: number, cell: number, jitter: number, direction: PixelDissolveProps["direction"], seed: string, colors: string[]): Block[] => {
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  const out: Block[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const base = direction === "random" ? 0 : direction === "right" ? 1 - (c + 0.5) / cols : direction === "top" ? (r + 0.5) / rows : (c + 0.5) / cols;
      const noise = random(`${seed}-t-${i}`);
      const j = direction === "random" ? 1 : jitter;
      out.push({ x: c * cell, y: r * cell, t: base * (1 - j) + noise * j, c: colors[Math.floor(random(`${seed}-c-${i}`) * colors.length) % colors.length] });
    }
  }
  return out;
};

export const PixelDissolve: React.FC<PixelDissolveProps> = ({
  progress,
  from,
  to,
  width,
  height,
  cell = 48,
  colors = ["#D9202E", "#C21826", "#E5394A", "#B0101D"],
  band = 0.22,
  jitter = 0.45,
  direction = "left",
  seed = "px",
}) => {
  const blocks = React.useMemo(() => blocksFor(width, height, cell, jitter, direction, seed, colors), [width, height, cell, jitter, direction, seed, colors.join(",")]);
  const front = Math.max(0, Math.min(1, progress)) * (1 + band);
  const pad = 0.6; // overlap so no seam shows between blocks
  const showingFrom = blocks.filter((b) => front < b.t);
  const lit = blocks.filter((b) => front >= b.t && front < b.t + band);
  const fromAll = showingFrom.length === blocks.length;
  const maskOf = (list: Block[]): React.CSSProperties => {
    const rects = list.map((b) => `<rect x="${b.x}" y="${b.y}" width="${cell + pad}" height="${cell + pad}"/>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g fill="#fff">${rects}</g></svg>`;
    const m = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
    return { maskImage: m, WebkitMaskImage: m, maskSize: "100% 100%", WebkitMaskSize: "100% 100%", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat" };
  };
  // With no `from`, `to` only shows where the front has reached (nothing covers the rest).
  const reached = blocks.filter((b) => front >= b.t);
  const toStyle = !from && reached.length < blocks.length ? maskOf(reached) : undefined;
  const fromStyle = from && !fromAll && showingFrom.length > 0 ? maskOf(showingFrom) : undefined;
  return (
    <AbsoluteFill style={{ width, height, overflow: "hidden" }}>
      {to && !fromAll ? <AbsoluteFill style={toStyle}>{to}</AbsoluteFill> : null}
      {from && showingFrom.length > 0 ? <AbsoluteFill style={fromStyle}>{from}</AbsoluteFill> : null}
      {lit.length > 0 ? (
        // data-gate-skip: the blocks pop one frame at a time by design; that IS the effect, not a fault.
        <svg data-gate-skip width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
          {lit.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={cell + pad} height={cell + pad} fill={b.c} />
          ))}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
