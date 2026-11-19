/**
 * Dot globe (2026-11-18, ours, after @eightsenses.media's "PODCAST edited this, not me" reel, instagram.com/reel/Df447Vfj36j,
 * Muse Nov 18, 3.6 to 5.5 s, read frame by frame; the paid skill behind it was never bought or seen). What the reel does:
 * blue dots scatter in from around the frame and converge, and about a second later they have formed a dotted wireframe
 * sphere around the speaker's head, the head inside it, the sphere slowly turning.
 *
 * Ours: the sphere is meridians and parallels of dots on a sphere centred on the head, wider than the head so a dot only
 * changes layer out beside it. Layer order as in Orbit: the clip, the back half of the sphere, the person cutout, the
 * front half. Each dot flies in from a seeded point around the frame on a slight curve, with a short streak behind it,
 * lands on its (already turning) place and settles to its depth: far dots small and dim, near dots large and bright.
 * Nothing crosses the face: front dots fade to a trace inside the `face` ellipse. Every position comes from the frame
 * number and Remotion's seeded `random`, drawn to two canvases, so it renders headless and the same every time.
 *
 * Props: `clip` (with sound), `person` (the same clip cut out, alpha webm), `from` (frames into both), `frame` ({ zoom,
 * bottom, focusX }, as every person effect), `globe` (the GlobeSpec below), `volume`, `sound`.
 * The two halves are also exported on their own (`DotGlobeLayer`) for a film that stacks several effects on one person.
 *
 *   <DotGlobe clip="x/clip.mp4" person="x/person.webm" frame={{ zoom: 1.25, bottom: 1700 }}
 *     globe={{ head: { x: 540, y: 860 }, radius: 240, startAt: 12, face: { x: 540, y: 865, rx: 135, ry: 180 } }} />
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, OffthreadVideo, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { IN, OUT, Sfx, k, mix } from "./shared";
import { Framing, framingOf } from "./frameGrab";

export type GlobeSpec = {
  /** Centre of the head (the sphere's centre) and the sphere's radius, in clip px. */
  head: { x: number; y: number };
  radius: number;
  /** Frame the first dots start flying in. */
  startAt: number;
  /** Frames from the first dot leaving to the last one landing (default 32, the reel's ~1 s). */
  formFrames?: number;
  /** Optional frame the dots blow outward and fade (10 frames). */
  exitAt?: number;
  /** The face, in clip px. Front dots fade to a trace over it. */
  face?: { x: number; y: number; rx: number; ry: number };
  color?: string;
  meridians?: number;
  /** Latitudes of the parallels, degrees. */
  parallels?: number[];
  /** Turn speed, degrees per second, and the forward tilt of the axis, degrees. */
  spin?: number;
  tilt?: number;
  seed?: string;
};

type P3 = [number, number, number];
type Dot = { x: number; y: number; z: number; r: number; a: number; tx?: number; ty?: number };

/** Points of a dotted wireframe sphere (unit radius): meridians, then parallels. */
const spherePoints = (meridians: number, parallels: number[]): P3[] => {
  const pts: P3[] = [];
  const at = (lat: number, lon: number): P3 => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
  const perMeridian = 30;
  for (let m = 0; m < meridians; m++) {
    const lon = (m / meridians) * Math.PI * 2;
    for (let j = 1; j < perMeridian; j++) pts.push(at(-Math.PI / 2 + (j / perMeridian) * Math.PI, lon));
  }
  for (const deg of parallels) {
    const lat = (deg * Math.PI) / 180;
    const n = Math.max(8, Math.round(64 * Math.cos(lat)));
    for (let i = 0; i < n; i++) pts.push(at(lat, ((i + 0.5) / n) * Math.PI * 2));
  }
  return pts;
};

/** Every dot's screen position, depth (-1 far to 1 near), size and opacity at frame f. */
const globeDots = (f: number, fps: number, W: number, H: number, spec: GlobeSpec, frame: Framing | undefined, pts: P3[]): Dot[] => {
  const { zoom, tx, ty } = framingOf(W, H, frame);
  const cx = tx + spec.head.x * zoom;
  const cy = ty + spec.head.y * zoom;
  const R = spec.radius * zoom;
  const form = spec.formFrames ?? 32;
  const seed = spec.seed ?? "globe";
  const tilt = ((spec.tilt ?? 16) * Math.PI) / 180;
  const theta = (((spec.spin ?? 22) * (f - spec.startAt)) / fps) * (Math.PI / 180) + 0.4;
  const gone = spec.exitAt === undefined ? 0 : k(f, spec.exitAt, spec.exitAt + 10, IN);
  const face = spec.face
    ? { x: tx + spec.face.x * zoom, y: ty + spec.face.y * zoom, rx: spec.face.rx * zoom, ry: spec.face.ry * zoom }
    : null;
  // flight times: the last dot lands at startAt + form
  const maxDelay = Math.round(form * 0.32);
  const out: Dot[] = [];
  pts.forEach(([x0, y0, z0], i) => {
    const delay = random(`${seed}-d-${i}`) * maxDelay;
    const dur = form - maxDelay - 4 + random(`${seed}-t-${i}`) * 4;
    const t = (f - spec.startAt - delay) / dur;
    if (t <= 0) return;
    const e = OUT(Math.min(1, t));
    // turn about the vertical axis, then tip the axis toward the camera
    const x1 = x0 * Math.cos(theta) + z0 * Math.sin(theta);
    const z1 = -x0 * Math.sin(theta) + z0 * Math.cos(theta);
    const y2 = y0 * Math.cos(tilt) - z1 * Math.sin(tilt);
    const z2 = y0 * Math.sin(tilt) + z1 * Math.cos(tilt);
    const persp = 1 + 0.1 * z2;
    const gx = cx + R * x1 * persp;
    const gy = cy - R * y2 * persp;
    // where it flies in from: a seeded point around the frame, 1.6 to 3.2 radii out
    const ang = random(`${seed}-a-${i}`) * Math.PI * 2;
    const dist = R * (1.6 + 1.6 * random(`${seed}-r-${i}`));
    const sx = cx + Math.cos(ang) * dist;
    const sy = cy + Math.sin(ang) * dist * 1.25;
    const swirl = (random(`${seed}-s-${i}`) - 0.5) * 2 * R * 0.45;
    const pos = (u: number) => {
      const bx = mix(sx, gx, u);
      const by = mix(sy, gy, u);
      const dx = gx - sx;
      const dy = gy - sy;
      const dl = Math.hypot(dx, dy) || 1;
      const s = Math.sin(Math.PI * u) * swirl;
      return [bx - (dy / dl) * s, by + (dx / dl) * s] as const;
    };
    const [px, py] = pos(e);
    const depth = (z2 + 1) / 2;
    let r = mix(1.8, 4.0, depth) * (1 + 0.7 * (1 - e));
    let a = mix(0.26, 1, depth) * Math.min(1, t * 4);
    if (face && z2 >= 0) {
      const d = ((px - face.x) / face.rx) ** 2 + ((py - face.y) / face.ry) ** 2;
      if (d < 1) a *= 0.1 + 0.9 * Math.max(0, (d - 0.7) / 0.3);
    }
    // exit: blown outward from the centre while fading
    const blow = 1 + 1.5 * gone;
    const ox = cx + (px - cx) * blow;
    const oy = cy + (py - cy) * blow;
    a *= 1 - gone;
    r *= 1 + 0.5 * gone;
    const dot: Dot = { x: ox, y: oy, z: z2, r, a };
    if (t < 1) {
      const [qx, qy] = pos(OUT(Math.max(0, Math.min(1, t) - 0.05)));
      dot.tx = qx;
      dot.ty = qy;
    }
    out.push(dot);
  });
  return out;
};

/** One half of the globe, drawn to a full-frame canvas: the far half (behind the person) or the near half. */
export const DotGlobeLayer: React.FC<{ half: "back" | "front"; globe: GlobeSpec; frame?: Framing }> = ({ half, globe, frame }) => {
  const f = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const pts = useMemo(
    () => spherePoints(globe.meridians ?? 12, globe.parallels ?? [-60, -30, 0, 30, 60]),
    [globe.meridians, globe.parallels],
  );
  const color = globe.color ?? "#4C9BFF";

  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (f < globe.startAt) return;
    const dots = globeDots(f, fps, W, H, globe, frame, pts)
      .filter((d) => (half === "front" ? d.z >= 0 : d.z < 0))
      .sort((a, b) => a.z - b.z);
    ctx.lineCap = "round";
    for (const d of dots) {
      if (d.a <= 0.003) continue;
      // the streak of a dot still in flight
      if (d.tx !== undefined && d.ty !== undefined) {
        ctx.globalAlpha = d.a * 0.35;
        ctx.strokeStyle = color;
        ctx.lineWidth = d.r * 0.9;
        ctx.beginPath();
        ctx.moveTo(d.tx, d.ty);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }
      // soft glow, then the dot, with a lighter core on the near side
      ctx.globalAlpha = d.a * 0.16;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = d.a;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
      if (d.z > 0.35) {
        ctx.globalAlpha = d.a * (d.z - 0.35) * 1.2;
        ctx.fillStyle = "#DCEBFF";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }, [f, fps, W, H, globe, frame, pts, half, color]);

  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0, width: W, height: H }} />;
};

export type DotGlobeProps = {
  clip: string;
  person: string;
  from?: number;
  frame?: Framing;
  globe: GlobeSpec;
  volume?: number;
  sound?: boolean;
};

export const DotGlobe: React.FC<DotGlobeProps> = (p) => {
  const { width: W, height: H } = useVideoConfig();
  const from = p.from ?? 0;
  const { zoom, tx, ty } = framingOf(W, H, p.frame);
  const framed: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` };
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={framed}>
        <OffthreadVideo src={staticFile(p.clip)} startFrom={from} volume={p.volume ?? 1} style={{ width: W, height: H }} />
      </div>
      <DotGlobeLayer half="back" globe={p.globe} frame={p.frame} />
      <div style={framed}>
        <OffthreadVideo src={staticFile(p.person)} startFrom={from} muted transparent style={{ width: W, height: H }} />
      </div>
      <DotGlobeLayer half="front" globe={p.globe} frame={p.frame} />
      <Sfx at={p.globe.startAt} name="data-scan" volume={0.22} on={p.sound ?? true} />
    </AbsoluteFill>
  );
};

/** The frame the globe has fully formed (the last dot lands). */
export const globeFormed = (g: GlobeSpec) => g.startAt + (g.formFrames ?? 32);
