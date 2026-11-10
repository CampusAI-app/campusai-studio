/**
 * Orbit (2026-11-10, from @mrcreates.ai's "17 effects" reel, 0.0 to 1.0 s, stepped frame by frame). What the reel does:
 * three small rounded tiles travel together along a dashed elliptical path drawn around the speaker's chest. On the near
 * half they pass in front of him, on the far half they pass behind him (hidden by his body). The trick is the layer
 * order: the full clip, then the back half of the ring and any tile on it, then the person cutout, then the front half of
 * the ring and any tile on it. The clip under the cutout is the same pixels, so the cutout's edges only show where a back
 * tile passes under him, which is the point.
 *
 * Ours: full bleed, framed chest up by `frame` (zoom, and which clip y sits on the bottom edge, as in GreenScreen.tsx)
 * so the table and a cutout that stops at a ragged line are off frame. Make the ring wider than the body at its height,
 * so a tile changes layer out beside him (or past the frame edge), never through him.
 *
 * Props: `clip` (full clip with sound, path under public/), `person` (the same clip cut out, alpha webm, same size as the
 * frame), `from` (frames into both), `frame` ({ zoom, bottom, focusX }), `ring` (centre and radii in clip px, `tilt`
 * degrees), `items` (what the tiles carry: an image, or a still held from a video at `at` seconds), `tile` (frame px),
 * `spacing` (degrees between tiles), `phase` (start angle, degrees), `laps`, `startAt` (frame the ring arrives),
 * `exitAt` (optional frame they leave), `sound`.
 *
 *   <Orbit clip="founder/tuesday/clip.mp4" person="founder/tuesday/person.webm" frame={{ zoom: 1.55, bottom: 1250 }}
 *     ring={{ cx: 540, cy: 920, rx: 360, ry: 135, tilt: -4 }}
 *     items={[{ src: "broll/week-0841.mp4", video: true, at: 2 }, ...]} />
 */
import React from "react";
import { AbsoluteFill, Freeze, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { IN, OUT, Sfx, clampX, k, mix } from "./shared";

/** A picture for a tile or a frame: an image, or one frame of a video held still. */
export type StillSource = { src: string; video?: boolean; /** seconds into the video to hold */ at?: number; /** CSS object-position */ focus?: string };

/** Draws a StillSource to fill its box (cover). A video is held on one frame, muted. */
export const Still: React.FC<{ item: StillSource; style?: React.CSSProperties }> = ({ item, style }) => {
  const { fps } = useVideoConfig();
  const fill: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: item.focus ?? "50% 50%", ...style };
  if (!item.video) return <Img src={staticFile(item.src)} style={fill} />;
  return (
    <Freeze frame={Math.round((item.at ?? 0) * fps)}>
      <OffthreadVideo src={staticFile(item.src)} muted style={fill} />
    </Freeze>
  );
};

export type OrbitProps = {
  clip: string;
  person: string;
  from?: number;
  /** Zoom, the clip y that sits on the frame's bottom edge, and the clip x kept centred. */
  frame?: { zoom: number; bottom: number; focusX?: number };
  ring: { cx: number; cy: number; rx: number; ry: number; tilt?: number };
  items: StillSource[];
  tile?: number;
  spacing?: number;
  phase?: number;
  laps?: number;
  startAt?: number;
  exitAt?: number;
  volume?: number;
  sound?: boolean;
};

export const Orbit: React.FC<OrbitProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const from = p.from ?? 0;
  const startAt = p.startAt ?? 3;

  // framing: the same transform on the clip and the cutout, so they stay locked together
  const zoom = p.frame?.zoom ?? 1;
  const bottom = p.frame?.bottom ?? H;
  const focusX = p.frame?.focusX ?? W / 2;
  const tx = W / 2 - focusX * zoom;
  const ty = H - bottom * zoom;
  const framed: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` };

  const cx = tx + p.ring.cx * zoom;
  const cy = ty + p.ring.cy * zoom;
  const rx = p.ring.rx * zoom;
  const ry = p.ring.ry * zoom;
  const tiltDeg = p.ring.tilt ?? 0;
  const tilt = (tiltDeg * Math.PI) / 180;
  const tileW = p.tile ?? 190;
  const spacing = p.spacing ?? 34;

  // the ring arrives, lands and settles; the orbit runs at a steady speed with a hard-landing push at the start
  const ringIn = k(f, startAt, startAt + 14, OUT);
  const exit = p.exitAt === undefined ? 0 : k(f, p.exitAt, p.exitAt + 10, IN);
  const laps = p.laps ?? 1.6;
  const run = interpolate(f, [startAt, durationInFrames], [0, 1], clampX);
  const lead = (p.phase ?? 40) + run * laps * 360 + 70 * k(f, startAt, startAt + 24, OUT);

  // a point on the ring at angle a (degrees): frame position plus depth (1 = nearest, -1 = furthest)
  const at = (a: number) => {
    const r = (a * Math.PI) / 180;
    const ex = rx * Math.cos(r);
    const ey = ry * Math.sin(r);
    return { x: cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), y: cy + ex * Math.sin(tilt) + ey * Math.cos(tilt), d: Math.sin(r) };
  };

  const tiles = p.items.map((item, i) => {
    const pt = at(lead - i * spacing);
    const pop = spring({ frame: f - (startAt + 4 + i * 3), fps, config: { damping: 12, stiffness: 170 } });
    const leave = p.exitAt === undefined ? 0 : k(f, p.exitAt + i * 2, p.exitAt + i * 2 + 8, IN);
    return { item, i, ...pt, scale: (1 + 0.22 * pt.d) * pop * (1 - leave) };
  });

  const ringStroke = (front: boolean) => {
    // the half of the ellipse nearer the camera (sin > 0) or further from it
    const a = at(0);
    const b = at(180);
    const sc = mix(0.7, 1, ringIn) * (1 - 0.15 * exit);
    const o = ringIn * (1 - exit) * (front ? 0.9 : 0.55);
    const d = `M ${a.x} ${a.y} A ${rx} ${ry} ${tiltDeg} 0 ${front ? 1 : 0} ${b.x} ${b.y}`;
    // marching dashes in the direction of travel
    const dash = -(lead * 1.2);
    return (
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: o }}>
        <g transform={`translate(${cx} ${cy}) scale(${sc}) translate(${-cx} ${-cy})`}>
          <path d={d} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={8} strokeDasharray="18 13" strokeDashoffset={dash} strokeLinecap="round" transform="translate(0 3)" />
          <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeDasharray="18 13" strokeDashoffset={dash} strokeLinecap="round" />
        </g>
      </svg>
    );
  };

  const drawTile = (t: (typeof tiles)[number]) => {
    if (t.scale <= 0.001) return null;
    const far = Math.max(0, -t.d);
    const r = Math.round(tileW * 0.16);
    return (
      <div key={t.i} style={{ position: "absolute", left: t.x - tileW / 2, top: t.y - tileW / 2, width: tileW, height: tileW,
        transform: `scale(${t.scale.toFixed(4)})`, borderRadius: r, overflow: "hidden",
        boxShadow: `0 ${(20 + 10 * t.d).toFixed(1)}px ${(40 + 14 * t.d).toFixed(1)}px rgba(0,0,0,${(0.4 + 0.1 * t.d).toFixed(3)})`,
        filter: `brightness(${(1 - 0.16 * far).toFixed(3)}) blur(${(far * 1.2).toFixed(2)}px)` }}>
        <Still item={t.item} />
        <div style={{ position: "absolute", inset: 0, borderRadius: r, boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.22)" }} />
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={framed}>
        <OffthreadVideo src={staticFile(p.clip)} startFrom={from} volume={p.volume ?? 1} style={{ width: W, height: H }} />
      </div>
      {ringStroke(false)}
      {tiles.filter((t) => t.d < 0).sort((a, b) => a.d - b.d).map(drawTile)}
      <div style={framed}>
        <OffthreadVideo src={staticFile(p.person)} startFrom={from} muted transparent style={{ width: W, height: H }} />
      </div>
      {ringStroke(true)}
      {tiles.filter((t) => t.d >= 0).sort((a, b) => a.d - b.d).map(drawTile)}
      <Sfx at={startAt} name="transition-soft" volume={0.25} on={p.sound ?? true} />
    </AbsoluteFill>
  );
};
