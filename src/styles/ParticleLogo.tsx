/**
 * /particle-logo (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). A logo sting: a field of loose particles drifts in the dark, then they stream in on curved paths and pack
 * into the CampusAI wordmark exactly where the end card's logo sits, the red dot of the "i" last; the real logo
 * cross-fades in over the particles as they settle, so the sting hands straight to the end card with no jump. The
 * particle positions are sampled from the real logo file at render time, never redrawn.
 */
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, readHold } from "../system/motion";
import { B, Clip, Cue, RED, ZODIAK, clamp, ramp } from "./common";

export type ParticleLogoProps = {
  /** A line above the logo once it has formed. */
  line: string;
  /** How many particles (the logo is sampled down to about this many). */
  count?: number;
};

const FPS = 30;
const DRIFT = 26;
const GATHER = 64; // motion: frames for the stream into the wordmark
// The end card (and its real logo) arrives as the particles settle; it then holds END_FRAMES, which covers the line's
// reading time (checked below), so the sting itself ends here.
export const particleEnd = (p: ParticleLogoProps) => Math.max(DRIFT + GATHER - 6, Math.round(readHold(p.line) * FPS) - 90 + DRIFT + GATHER - 6);

type Pt = { x: number; y: number; red: boolean };
const rng = (seed: number) => { let s = (seed * 2654435761) >>> 0; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

/** Sample the logo's own pixels into points, in logo units (0..1 across its width). */
const useLogoPoints = (src: string, count: number) => {
  const [pts, setPts] = useState<Pt[] | null>(null);
  const [handle] = useState(() => delayRender("sampling the logo"));
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const W = 892, H = Math.round(W / B.logo!.ratio);
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, W, H);
      const d = ctx.getImageData(0, 0, W, H).data;
      const all: Pt[] = [];
      for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
        const i = (y * W + x) * 4;
        if (d[i + 3] > 128) all.push({ x: x / W, y: y / W, red: d[i] > 150 && d[i + 1] < 90 });
      }
      const r = rng(11);
      const keep = all.filter(() => r() < count / all.length);
      setPts(keep);
      continueRender(handle);
    };
    img.src = staticFile(B.logo!.onDark);
  }, [count, handle]);
  return pts;
};

export const ParticleLogo: React.FC<ParticleLogoProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const end = particleEnd(p);
  const pts = useLogoPoints(B.logo!.onDark, p.count ?? 1800);
  // land exactly where the end card's logo sits (common.tsx EndCard: centred, 0.47 down, min(width / 2, 560) wide)
  const logoW = Math.min(width * 0.5, 560);
  const lx = width / 2 - logoW / 2, ly = height * 0.47 - logoW / B.logo!.ratio / 2;
  const line = ramp(f, DRIFT + GATHER - 4, DRIFT + GATHER + 10, CURVE.quiet.enter);
  const hand = ramp(f, DRIFT + GATHER - 10, DRIFT + GATHER + 6, CURVE.quiet.standard); // particles hand over to the real logo
  return (
    <Clip endAt={end} noCarry noLogo>
      <AbsoluteFill>
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          {pts?.map((q, i) => {
            const r = rng(i * 7 + 3);
            const sx = r() * width, sy = r() * height, phase = r() * 6.28, delay = (q.red ? 0.75 : 0) + r() * 0.22 + q.x * 0.18;
            const tx = lx + q.x * logoW, ty = ly + q.y * logoW;
            const t0 = DRIFT + delay * GATHER * 0.6;
            const k = interpolate(f, [t0, t0 + GATHER * 0.5], [0, 1], { ...clamp, easing: CURVE.showy.enter });
            const wob = (1 - k) * 18;
            // a curved path: start, a bend point off to the side, target
            const bx = (sx + tx) / 2 + Math.sin(phase) * 260, by = (sy + ty) / 2 + Math.cos(phase) * 260;
            const pull = Math.min(1, f / DRIFT) * 0.12; // a gentle inward drift before the stream, so frame one already points somewhere
            const px0 = sx + (width / 2 - sx) * pull, py0 = sy + (height * 0.47 - sy) * pull;
            const x = (1 - k) * (1 - k) * (px0 + Math.sin(f / 14 + phase) * wob) + 2 * (1 - k) * k * bx + k * k * tx;
            const y = (1 - k) * (1 - k) * (py0 + Math.cos(f / 17 + phase) * wob) + 2 * (1 - k) * k * by + k * k * ty;
            const size = q.red ? 3.4 : 2.6 + (1 - k) * 1.6;
            return <circle key={i} cx={x} cy={y} r={size} fill={q.red ? RED : B.color.ink} opacity={(0.35 + 0.65 * Math.max(k, ramp(f, 0, 12))) * (1 - hand)} />;
          })}
        </svg>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 64, right: 64, top: ly - 170, textAlign: "center", fontFamily: ZODIAK, fontWeight: 700, fontSize: 68, lineHeight: 1.08, color: B.color.ink,
        opacity: line, transform: `translateY(${(1 - line) * 14}px)` }}>{p.line}</div>
      <Cue at={DRIFT} name="swoosh-slow" volume={0.4} />
      <Cue at={DRIFT + GATHER - 6} name="chime-crystal" volume={0.4} />
    </Clip>
  );
};
