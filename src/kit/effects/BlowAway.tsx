/**
 * Blow away (2026-11-15, from Skill Stack Store's "20 Claude Effects" reel, #21, 24.75 to 25.7 s, stepped frame by
 * frame). What the reel does: the speaker disintegrates into dust that drifts right and up, the break sweeping left to
 * right across his body, revealing the empty chair behind him (a clean background plate). About 0.9 s.
 *
 * The honest part: our footage has no clean plate (nobody filmed the set empty), and filling the hole he leaves from the
 * pixels around him leaves a dark ghost of his outline (tried 2026-11-15, rejected on sight). So this effect reveals a
 * `ground` you choose. Best: two seconds of the empty set filmed on the day, and then it is the reel's effect exactly.
 * Without one: a new place (the sample uses campus b-roll), and the wall behind him dissolves into it a few frames ahead
 * of the dust, so the whole frame blows over to the next shot rather than leaving a hole.
 *
 * How: at `at` the frame freezes (his voice keeps playing). That one frame and its matte are decoded (frameGrab,
 * mediabunny) and every 3 x 3 px cell of him becomes a particle carrying its own colour. A release map sweeps left to
 * right across his width over `frames` (default 30, the reel's 0.9 s), broken up by soft noise so the edge is ragged.
 * Each cell glows a little lighter for 3 frames, lets go, and drifts right and up with a slow curl, shrinking and fading
 * to a warm dust colour over 0.7 to 1.4 s. Everything is drawn per frame on a canvas from fixed seeds, so the headless
 * render is deterministic.
 *
 * Props: `clip` (its sound plays throughout), `matte` (white = person), `from`, `frame` ({ zoom, bottom, focusX }), `at`
 * (frame the dust starts), `frames` (the sweep), `ground` (what is revealed: an image, or a video with `startFrom`;
 * `dim` 0 to 1), `drift` (px per frame, right and up), `sound`.
 *
 *   <BlowAway clip="x/clip.mp4" matte="x/matte.mp4" frame={{ zoom: 1.55, bottom: 1245 }} at={41}
 *     ground={{ src: "broll/umd-0125.mp4", video: true, startFrom: 30 }} />
 */
import React, { useEffect, useRef } from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Sfx, k } from "./shared";
import { Framing, drawFramed, framingOf, grabFrame } from "./frameGrab";

export type BlowAwayProps = {
  clip: string;
  matte: string;
  from?: number;
  frame?: Framing;
  at: number;
  frames?: number;
  ground: { src: string; video?: boolean; startFrom?: number; dim?: number };
  drift?: { x: number; y: number };
  volume?: number;
  sound?: boolean;
};

const CELL = 3;
const LIFE_MAX = 42;
const LEAD = 5; // frames the wall dissolves ahead of the dust
const SOFT = 10; // frames over which a piece of wall fades

const rand = (i: number, salt: number) => {
  let h = (i * 374761393 + salt * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

/** Smooth value noise in 0..1, cells `s` px wide. */
const noise = (x: number, y: number, s: number, salt: number) => {
  const gx = x / s, gy = y / s;
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const v = (a: number, b: number) => rand(a * 7919 + b * 104729, salt);
  const top = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * sx;
  const bot = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * sx;
  return top + (bot - top) * sy;
};

type Prepared = {
  pixels: Uint8ClampedArray; // the frozen frame, framed
  matte: Uint8ClampedArray; // its matte, framed (red channel)
  cols: number;
  releasePerson: Float32Array; // per cell, frames after `at`
  releaseWall: Float32Array;
  particles: { cell: number; x: number; y: number; r: number; g: number; b: number; rel: number; vx: number; vy: number; ax: number; ay: number; curl: number; phase: number; life: number }[];
};

const cache = new Map<string, Promise<Prepared>>();

const prepare = (clip: string, matte: string, n: number, fps: number, W: number, H: number, frame: Framing | undefined, frames: number) => {
  const key = `${clip}|${matte}|${n}|${W}x${H}|${JSON.stringify(frame ?? null)}|${frames}`;
  let p = cache.get(key);
  if (p) return p;
  p = (async () => {
    const [img, mat] = await Promise.all([grabFrame(clip, n, fps), grabFrame(matte, n, fps)]);
    const cv = new OffscreenCanvas(W, H);
    const ctx = cv.getContext("2d", { willReadFrequently: true })!;
    drawFramed(ctx, img, W, H, frame);
    const pixels = ctx.getImageData(0, 0, W, H).data;
    ctx.clearRect(0, 0, W, H);
    drawFramed(ctx, mat, W, H, frame);
    const matteData = ctx.getImageData(0, 0, W, H).data;

    const cols = Math.ceil(W / CELL);
    const rows = Math.ceil(H / CELL);
    // his width, so the sweep crosses exactly him
    let xmin = W, xmax = 0;
    for (let y = 0; y < H; y += 6) for (let x = 0; x < W; x += 6) if (matteData[(y * W + x) * 4] > 127) { xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); }
    if (xmax <= xmin) { xmin = 0; xmax = W; }
    const releasePerson = new Float32Array(cols * rows);
    const releaseWall = new Float32Array(cols * rows);
    const particles: Prepared["particles"] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * CELL + 1, y = r * CELL + 1;
        const cell = r * cols + c;
        const across = Math.min(1, Math.max(0, (x - xmin) / (xmax - xmin)));
        // mostly the left-to-right sweep, a soft wander, and a grain of per-cell chance so the edge crumbles like dust
        releasePerson[cell] = frames * (0.74 * across + 0.16 * noise(x, y, 60, 1) + 0.1 * rand(cell, 5));
        // the wall goes on a broader, softer edge than he does
        releaseWall[cell] = frames * (0.8 * (x / W) + 0.2 * noise(x, y, 140, 3)) - LEAD;
        const xi = Math.min(W - 1, x), yi = Math.min(H - 1, y);
        const i = (yi * W + xi) * 4;
        if (matteData[i] < 128) continue;
        const s = cell;
        particles.push({
          cell, x: c * CELL, y: r * CELL, r: pixels[i], g: pixels[i + 1], b: pixels[i + 2], rel: releasePerson[cell],
          vx: 2.5 + 6 * rand(s, 11), vy: 1.5 + 4.5 * rand(s, 12), ax: 0.12 + 0.3 * rand(s, 13), ay: 0.05 + 0.18 * rand(s, 14),
          curl: 0.4 + 1.4 * rand(s, 15), phase: rand(s, 16) * Math.PI * 2, life: 22 + (LIFE_MAX - 22) * rand(s, 17),
        });
      }
    }
    return { pixels, matte: matteData, cols, releasePerson, releaseWall, particles };
  })();
  cache.set(key, p);
  return p;
};

export const BlowAway: React.FC<BlowAwayProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);
  const from = p.from ?? 0;
  const frames = p.frames ?? 30;
  const drift = p.drift ?? { x: 1, y: 1 };
  const t = f - p.at;
  const live = t >= 0 && t <= frames + LIFE_MAX + 2;
  const { zoom, tx, ty } = framingOf(W, H, p.frame);
  const framed: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` };

  useEffect(() => {
    if (!live) return;
    const handle = delayRender(`blow away frame ${f}`);
    (async () => {
      const d = await prepare(p.clip, p.matte, from + p.at, fps, W, H, p.frame, frames);
      const el = canvas.current;
      if (!el) return;
      const ctx = el.getContext("2d")!;
      const out = ctx.createImageData(W, H);
      const o = out.data;
      const px = d.pixels, mt = d.matte, cols = d.cols;
      // the frozen frame: wall still standing plus the parts of him not yet released
      for (let y = 0; y < H; y++) {
        const rowCell = ((y / CELL) | 0) * cols;
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const cell = rowCell + ((x / CELL) | 0);
          const a = mt[i] / 255;
          const rp = d.releasePerson[cell] - t;
          const held = rp > 0 ? 1 : 0;
          const wall = Math.min(1, Math.max(0, (d.releaseWall[cell] - t) / SOFT + 1));
          const alpha = a * held + (1 - a) * wall;
          if (alpha <= 0) continue;
          let r = px[i], g = px[i + 1], b = px[i + 2];
          // a brief light glow just before a piece lets go
          if (held && a > 0.5 && rp < 3) {
            const glow = (1 - rp / 3) * 0.45;
            r += (255 - r) * glow; g += (236 - g) * glow; b += (210 - b) * glow;
          }
          o[i] = r; o[i + 1] = g; o[i + 2] = b; o[i + 3] = alpha * 255;
        }
      }
      // the dust
      for (const q of d.particles) {
        const age = t - q.rel;
        if (age < 0 || age > q.life) continue;
        const life = age / q.life;
        const x = q.x + (q.vx * age + 0.5 * q.ax * age * age) * drift.x + Math.sin(q.phase + age * 0.22) * q.curl * age * 0.5;
        const y = q.y - (q.vy * age + 0.5 * q.ay * age * age) * drift.y + Math.cos(q.phase + age * 0.18) * q.curl * age * 0.25;
        const size = Math.max(1, Math.round(CELL * (1 - 0.6 * life)));
        const alpha = Math.pow(1 - life, 1.4) * 0.95;
        const m = Math.min(1, life * 1.3) * 0.55;
        const r = q.r + (232 - q.r) * m, g = q.g + (218 - q.g) * m, b = q.b + (198 - q.b) * m;
        const x0 = Math.round(x), y0 = Math.round(y);
        for (let yy = y0; yy < y0 + size; yy++) {
          if (yy < 0 || yy >= H) continue;
          for (let xx = x0; xx < x0 + size; xx++) {
            if (xx < 0 || xx >= W) continue;
            const i = (yy * W + xx) * 4;
            const da = o[i + 3] / 255;
            const oa = alpha + da * (1 - alpha);
            if (oa <= 0) continue;
            o[i] = (r * alpha + o[i] * da * (1 - alpha)) / oa;
            o[i + 1] = (g * alpha + o[i + 1] * da * (1 - alpha)) / oa;
            o[i + 2] = (b * alpha + o[i + 2] * da * (1 - alpha)) / oa;
            o[i + 3] = oa * 255;
          }
        }
      }
      ctx.putImageData(out, 0, 0);
    })()
      .then(() => continueRender(handle))
      .catch((e) => cancelRender(e));
  }, [live, f, t, from, fps, W, H, frames, drift.x, drift.y, p.at, p.clip, p.matte, p.frame]);

  const g = p.ground;
  // motion: the new ground settles from 6% in over the sweep, so it arrives rather than sits
  const settle = 1.06 - 0.06 * k(f, p.at, p.at + frames + 20);
  const groundStyle: React.CSSProperties = { position: "absolute", inset: 0, width: W, height: H, objectFit: "cover", transform: `scale(${settle.toFixed(4)})`, filter: g.dim ? `brightness(${1 - g.dim})` : undefined };

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <Audio src={staticFile(p.clip)} trimBefore={from || undefined} volume={p.volume ?? 1} />
      {t < 0 ? (
        <div style={framed}>
          <OffthreadVideo src={staticFile(p.clip)} startFrom={from} muted style={{ width: W, height: H }} />
        </div>
      ) : (
        <>
          {g.video ? (
            <Sequence from={p.at} layout="none">
              <OffthreadVideo src={staticFile(g.src)} startFrom={g.startFrom ?? 0} muted style={groundStyle} />
            </Sequence>
          ) : (
            <Img src={staticFile(g.src)} style={groundStyle} />
          )}
          {live ? <canvas ref={canvas} width={W} height={H} style={{ position: "absolute", inset: 0, width: W, height: H }} /> : null}
        </>
      )}
      <Sfx at={p.at} name="swoosh-slow" volume={0.4} on={p.sound ?? true} />
    </AbsoluteFill>
  );
};
