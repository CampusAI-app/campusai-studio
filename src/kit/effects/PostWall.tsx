/**
 * Post wall (2026-11-15, from Skill Stack Store's "20 Claude Effects" reel, #7, 7.0 to 7.75 s, stepped frame by frame).
 * What the reel does: the wall behind the speaker fills with a grid of small square post tiles, row by row from the top,
 * while he stays in front. About 0.75 s.
 *
 * Ours: a dark backing comes down the wall with the rows, and each row of square tiles drops into place (`rowEvery`
 * frames apart, default 2, each tile a frame later than its left neighbour, falling 26 px and growing from 88% on a
 * stiff spring), so a 9 row wall fills in about 0.8 s. Once full, the whole wall keeps scrolling up slowly, like a feed,
 * so the held frame is never still. He sits in front with a soft shadow on the tiles.
 *
 * Props: `clip`, `person` (alpha webm), `from`, `frame` ({ zoom, bottom, focusX }), `tiles` (StillSource list, used in
 * order and repeated as needed), `cols`, `gap`, `radius`, `startAt`, `rowEvery`, `colEvery`, `scroll` (px the wall
 * rises over the rest of the piece), `exitAt` (optional: rows leave from the bottom up), `backing`, `sound`.
 *
 *   <PostWall clip="x/clip.mp4" person="x/person.webm" frame={{ zoom: 1.55, bottom: 1250 }}
 *     tiles={[{ src: "broll/stills-ssb/umd-0125-0.jpg" }, ...]} startAt={20} />
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { IN, OUT, Sfx, k } from "./shared";
import { Still, StillSource } from "./Orbit";
import { Framing, framingOf } from "./frameGrab";

export type PostWallProps = {
  clip: string;
  person: string;
  from?: number;
  frame?: Framing;
  tiles: StillSource[];
  cols?: number;
  gap?: number;
  radius?: number;
  startAt?: number;
  rowEvery?: number;
  colEvery?: number;
  scroll?: number;
  exitAt?: number;
  backing?: string;
  volume?: number;
  sound?: boolean;
};

export const PostWall: React.FC<PostWallProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const from = p.from ?? 0;
  const cols = p.cols ?? 5;
  const gap = p.gap ?? 12;
  const radius = p.radius ?? 12;
  const startAt = p.startAt ?? 8;
  const rowEvery = p.rowEvery ?? 2;
  const colEvery = p.colEvery ?? 0.6;
  const size = (W - gap * (cols + 1)) / cols;
  const pitch = size + gap;
  const rows = Math.ceil(H / pitch) + 2;
  const filled = startAt + rows * rowEvery + 10;
  // motion: the feed scroll starts as the last row lands and runs linear to the end, so the wall never freezes
  const rise = (p.scroll ?? 90) * k(f, filled - 6, durationInFrames, (x) => x);

  const { zoom, tx, ty } = framingOf(W, H, p.frame);
  const framed: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` };

  // the backing comes down the wall a row ahead of the tiles
  const backingTo = Math.min(H + 80, (Math.max(0, f - startAt + 2) / rowEvery) * pitch + gap);
  const exitRow = (r: number) => (p.exitAt === undefined ? 0 : k(f, p.exitAt + (rows - 1 - r) * 1, p.exitAt + (rows - 1 - r) * 1 + 7, IN));
  const allGone = p.exitAt !== undefined && f > p.exitAt + rows + 8;

  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const at = startAt + r * rowEvery + c * colEvery;
      if (f < at) continue;
      const pop = spring({ frame: f - at, fps, config: { damping: 15, stiffness: 260, mass: 0.7 } });
      const out = exitRow(r);
      const item = p.tiles[(r * cols + c) % p.tiles.length];
      const x = gap + c * pitch;
      const y = gap + r * pitch - rise;
      tiles.push(
        <div key={`${r}-${c}`} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: radius, overflow: "hidden",
          opacity: Math.min(1, pop * 2.5) * (1 - out),
          transform: `translateY(${((1 - pop) * -26 + out * 40).toFixed(2)}px) scale(${(0.88 + 0.12 * pop - 0.1 * out).toFixed(4)})`,
          boxShadow: "0 10px 22px rgba(0,0,0,0.35)", background: "#1b1418" }}>
          <Still item={item} />
          <div style={{ position: "absolute", inset: 0, borderRadius: radius, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(0,0,0,0.12))" }} />
        </div>,
      );
    }
  }

  const wallIn = k(f, startAt, startAt + 8, OUT);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={framed}>
        <OffthreadVideo src={staticFile(p.clip)} startFrom={from} volume={p.volume ?? 1} style={{ width: W, height: H }} />
      </div>
      {f >= startAt - 2 && !allGone ? (
        <AbsoluteFill style={{ background: p.backing ?? "#140d11",
          WebkitMaskImage: `linear-gradient(to bottom, black ${Math.max(0, backingTo - 60)}px, transparent ${backingTo}px)`,
          maskImage: `linear-gradient(to bottom, black ${Math.max(0, backingTo - 60)}px, transparent ${backingTo}px)`,
          opacity: p.exitAt === undefined ? 1 : 1 - k(f, p.exitAt + rows - 2, p.exitAt + rows + 8) }} />
      ) : null}
      {tiles}
      <div style={framed}>
        <OffthreadVideo src={staticFile(p.person)} startFrom={from} muted transparent
          style={{ width: W, height: H, filter: `drop-shadow(0 ${(24 * wallIn).toFixed(1)}px ${(36 * wallIn).toFixed(1)}px rgba(0,0,0,${(0.6 * wallIn).toFixed(3)}))` }} />
      </div>
      <Sfx at={startAt} name="paper-move-quick" volume={0.3} on={p.sound ?? true} />
    </AbsoluteFill>
  );
};
