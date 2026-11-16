/**
 * Clone row (2026-11-15, from Skill Stack Store's "20 Claude Effects" reel, #2, 1.5 to 2.4 s, stepped frame by frame).
 * What the reel does: cutout copies of the speaker appear BEHIND him on both sides, smaller and receding in a row, two,
 * then four, then six, the far ones darker. About 0.9 s.
 *
 * Ours: the copies fan out from behind him like cards, each pair sliding out from behind the pair before it (8 frames,
 * hard ease-out), a pair every `every` frames (default 9, so 2, 4, 6 inside 0.9 s). Each copy shrinks toward his eye
 * line (`horizon`), so the row recedes the way people standing further back do: heads near the same height, bodies
 * smaller. Further copies are darker, a touch cooler and softer, and run a few frames behind him (`lag`), so the row
 * moves like a crowd rather than a mirror. Each copy's lower edge is feathered out (`feather`, clip rows) because a
 * smaller copy would otherwise show where the cutout stops. Same framing as Orbit: `frame` puts that edge off frame.
 *
 * Props: `clip` (full clip with sound, under public/), `person` (the same clip cut out, alpha webm), `from` (frames into
 * both), `frame` ({ zoom, bottom, focusX }), `horizon` (clip px point the copies shrink toward, his eye line),
 * `pairs` (per pair, outward offset in frame px and scale), `startAt`, `every`, `lag`, `exitAt` (optional: the row folds
 * back behind him), `feather` (clip rows where a copy fades out), `sound`.
 *
 *   <CloneRow clip="x/clip.mp4" person="x/person.webm" frame={{ zoom: 1.2, bottom: 1640 }} horizon={{ x: 490, y: 1110 }}
 *     startAt={30} />
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { IN, OUT, Sfx, k, mix } from "./shared";
import { Framing, framingOf } from "./frameGrab";

export type ClonePair = { /** outward offset from his centre, frame px */ offset: number; scale: number };

export type CloneRowProps = {
  clip: string;
  person: string;
  from?: number;
  frame?: Framing;
  horizon: { x: number; y: number };
  pairs?: ClonePair[];
  startAt?: number;
  every?: number;
  lag?: number;
  exitAt?: number;
  feather?: { from: number; to: number };
  volume?: number;
  sound?: boolean;
};

const PAIRS: ClonePair[] = [
  { offset: 290, scale: 0.76 },
  { offset: 500, scale: 0.58 },
  { offset: 670, scale: 0.43 },
];

export const CloneRow: React.FC<CloneRowProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const from = p.from ?? 0;
  const startAt = p.startAt ?? 6;
  const every = p.every ?? 9;
  const lag = p.lag ?? 3;
  const pairs = p.pairs ?? PAIRS;
  const { zoom, tx, ty } = framingOf(W, H, p.frame);
  const framed: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` };
  const hx = tx + p.horizon.x * zoom;
  const hy = ty + p.horizon.y * zoom;
  const feather = p.feather ?? { from: p.frame ? p.frame.bottom - 150 : H - 150, to: p.frame ? p.frame.bottom - 20 : H - 20 };
  const mask = `linear-gradient(to bottom, black ${feather.from}px, transparent ${feather.to}px)`;

  // the room dims a little as the row fills, so the copies separate from the wall
  const dim = 0.12 * k(f, startAt, startAt + every * pairs.length + 6) * (p.exitAt === undefined ? 1 : 1 - k(f, p.exitAt, p.exitAt + 10));

  const copies: React.ReactNode[] = [];
  // far pairs first so nearer copies cover them
  for (let i = pairs.length - 1; i >= 0; i--) {
    const at = startAt + i * every;
    const t = k(f, at, at + 8, OUT);
    // the row folds back from the outside in
    const back = p.exitAt === undefined ? 0 : k(f, p.exitAt + (pairs.length - 1 - i) * 3, p.exitAt + (pairs.length - 1 - i) * 3 + 7, IN);
    const reach = t * (1 - back);
    if (reach <= 0.001) continue;
    const prev = i === 0 ? { offset: 0, scale: 1 } : pairs[i - 1];
    const off = mix(prev.offset, pairs[i].offset, reach);
    const s = mix(prev.scale, pairs[i].scale, reach);
    const depth = (i + 1) / pairs.length;
    const filter = `brightness(${(0.92 - 0.52 * depth).toFixed(3)}) saturate(${(1 - 0.3 * depth).toFixed(3)}) contrast(${(1 - 0.1 * depth).toFixed(3)}) blur(${(depth * 1.6).toFixed(2)}px)`;
    const start = Math.max(0, from - (i + 1) * lag);
    for (const side of [-1, 1]) {
      copies.push(
        <div key={`${i}-${side}`} style={{ position: "absolute", inset: 0, opacity: Math.min(1, reach * 3), transformOrigin: "0 0",
          transform: `translate(${(hx + side * off).toFixed(2)}px, ${hy.toFixed(2)}px) scale(${s.toFixed(4)}) translate(${-hx}px, ${-hy}px)` }}>
          <div style={{ ...framed, WebkitMaskImage: mask, maskImage: mask }}>
            <OffthreadVideo src={staticFile(p.person)} startFrom={start} muted transparent style={{ width: W, height: H, filter }} />
          </div>
        </div>,
      );
    }
  }

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={framed}>
        <OffthreadVideo src={staticFile(p.clip)} startFrom={from} volume={p.volume ?? 1} style={{ width: W, height: H, filter: `brightness(${(1 - dim).toFixed(3)})` }} />
      </div>
      {copies}
      <div style={framed}>
        <OffthreadVideo src={staticFile(p.person)} startFrom={from} muted transparent style={{ width: W, height: H }} />
      </div>
      {pairs.map((_, i) => (
        <Sfx key={i} at={startAt + i * every} name="air-woosh-quick" volume={0.16 + 0.04 * i} on={p.sound ?? true} />
      ))}
    </AbsoluteFill>
  );
};
