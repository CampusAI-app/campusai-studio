/**
 * /spiral-scatter (2026-11-15, our own build of Bloop's "Spiral" template, bloop.wtf, via Muse; watched in jj.finds_'s
 * reel and on the site, numbers in films/bloop-styles/facts.md). Real cards ride a helix that runs the height of a rose
 * silk ground, the axis leaning, the near cards big and sharp, the far ones small and soft, each turned a little to
 * follow the curve. The helix climbs one slot at a time, then opens wider and wider (Bloop's spiral width dragged from
 * 70% to 200% in the reel) until the cards scatter off the frame and the one card that matters most rises in their place.
 *
 * Every card is a REAL crop of a demo capture, never rebuilt. The words come from the page.
 *
 * Motion in numbers (30 fps): density 1.1 gives 18 slots on 2 turns; the axis leans 10 deg (top right to bottom left);
 * spiral width 0.7 of the frame (radius 0.35 W) widening 15% while it climbs, then to 2.1 over 1.2 s for the scatter;
 * perspective 1600 px, so the nearest card is about 2x the farthest (capped so a card never balloons past 1.6x). One slot per step, 0.8 s a step at 1x (Bloop:
 * 2 s), Sharp curve over 80% of the step. Card curve "inward" turns each card up to 30 deg on Y to face the axis; up to
 * 6 deg of Z turn per card, fixed by its index so it never jitters. Far cards fade to 70% and blur up to 3 px. The hero
 * rises 18 frames after the scatter starts, from 0.7x and 18 px blur to sharp on a spring (damping 15, stiffness 120).
 */
import React from "react";
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/BodoniModa";
import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import { CURVE, readHold } from "../system/motion";
import { Cue, clamp, ramp } from "./common";
import { World } from "./world";
import type { Format } from "./common";

const { fontFamily: BODONI } = loadFont("italic", { weights: ["500", "700"], subsets: ["latin"] });
const { fontFamily: HANKEN } = loadHanken("normal", { weights: ["500", "600"], subsets: ["latin"] });

// its own world: rose silk, lighter in the middle where the helix turns, deeper at the foot
const ROSE_TOP = "#F2B2A2";
const ROSE_MID = "#F8D3C7";
const ROSE_LOW = "#DE6F5E";
const INK = "#4A0B12";
const FPS = 30;

type Box = { x: number; y: number; w: number; h: number };
export type SpiralCard = { src: string; image: { w: number; h: number }; crop: Box };
export type SpiralEasing = "linear" | "smooth" | "sharp" | "spring";

export type SpiralScatterProps = {
  format?: Format;
  headline: string;
  /** The cards on the helix, each a real crop. They repeat round the helix when there are fewer than the slots. */
  cards: SpiralCard[];
  /** The one card that rises when the spiral scatters, a real crop. */
  hero: SpiralCard;
  source: string;
  cta?: string;
  /** Bloop's knobs. */
  direction?: "up" | "down";
  /** Spiral width as a share of the frame width, 0.5 to 2 (Bloop 0.7), and where it opens to for the scatter. */
  width?: number;
  widthEnd?: number;
  /** 0.5 to 2: how many cards on the helix (1 = 16 slots). */
  density?: number;
  /** 1 to 4 full turns over the height. */
  turns?: number;
  /** Which way each card turns to follow the curve. */
  curve?: "inward" | "flat" | "outward";
  /** How far the axis leans, degrees. */
  tilt?: number;
  /** Up to this many degrees of fixed Z turn per card. */
  jitter?: number;
  stepSeconds?: number;
  speed?: number;
  easing?: SpiralEasing;
};

const CURVES: Record<Exclude<SpiralEasing, "spring">, (t: number) => number> = {
  linear: (t) => t,
  smooth: Easing.bezier(0.45, 0, 0.55, 1),
  sharp: Easing.bezier(0.83, 0, 0.17, 1),
};

export const spiralPlan = (p: SpiralScatterProps) => {
  const stepF = Math.round(((p.stepSeconds ?? 0.8) * FPS) / (p.speed ?? 1));
  const climb = 7 * stepF;
  const scatter = 6 + climb;
  const heroAt = scatter + 18;
  const end = heroAt + 20 + Math.round(readHold(p.headline) * FPS * 0.7);
  return { stepF, scatter, heroAt, end };
};
export const spiralEnd = (p: SpiralScatterProps) => spiralPlan(p).end;

const Crop: React.FC<{ c: SpiralCard; w: number }> = ({ c, w }) => {
  const s = w / c.crop.w;
  return <Img src={staticFile(c.src)} style={{ position: "absolute", left: -c.crop.x * s, top: -c.crop.y * s, width: c.image.w * s, height: c.image.h * s, maxWidth: "none" }} />;
};

// a fixed pseudo-random turn per card, so the scatter is the same every render
const seeded = (i: number) => {
  const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return x - Math.floor(x);
};

export const SpiralScatter: React.FC<SpiralScatterProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const { stepF, scatter, heroAt, end } = spiralPlan(p);
  const slots = Math.max(6, Math.round(16 * (p.density ?? 1.1)));
  const turns = p.turns ?? 2;
  const tilt = ((p.tilt ?? 10) * Math.PI) / 180;
  const easing = p.easing ?? "sharp";
  // pos: slots travelled, stepping
  const t = f / stepF;
  const n = Math.floor(t);
  const local = Math.min(1, (t - n) / 0.8);
  const k = easing === "spring" ? Math.min(1, spring({ frame: (t - n) * stepF, fps, config: { damping: 15, stiffness: 120 } })) : CURVES[easing](local);
  const pos = (n + k) * (p.direction === "down" ? -1 : 1);
  const open = ramp(f, scatter, scatter + 36, CURVE.showy.standard);
  const w0 = p.width ?? 0.7;
  const widthNow = interpolate(f, [0, scatter], [w0, w0 * 1.15], clamp) + ((p.widthEnd ?? 2.1) - w0 * 1.15) * open;
  const R = (widthNow * W) / 2;
  const PERSP = 1600;
  const cardW = W * 0.33;
  const cx = W / 2;
  const cy = H / 2;
  const span = H * 1.3;
  const top = cy - span / 2;
  const curve = p.curve ?? "inward";
  const jitter = p.jitter ?? 6;

  const items = Array.from({ length: slots }, (_, s) => {
    let u = (s - pos) / slots;
    u = u - Math.floor(u);
    const theta = 2 * Math.PI * turns * u;
    const y = top + u * span;
    const ax = cx - (y - cy) * Math.tan(tilt);
    const x = ax + R * Math.sin(theta);
    const z = (R * Math.cos(theta)) * 0.85;
    const scale = PERSP / (PERSP - Math.min(z, PERSP * 0.38));
    const sx = cx + (x - cx) * scale;
    const sy = cy + (y - cy) * scale;
    const turnY = curve === "flat" ? 0 : (curve === "inward" ? -1 : 1) * 30 * Math.sin(theta);
    const turnZ = (seeded(s) - 0.5) * 2 * jitter;
    const far = interpolate(z, [-R * 0.85, R * 0.85], [1, 0], clamp);
    return { s, sx, sy, z, scale, turnY, turnZ, far, card: p.cards[s % p.cards.length] };
  }).sort((a, b) => a.z - b.z);

  const head = ramp(f, 0, 12, CURVE.quiet.enter);
  const heroK = spring({ frame: f - heroAt, fps, config: { damping: 15, stiffness: 120 } });
  const heroIn = f >= heroAt ? Math.min(1, heroK) : 0;
  const heroW = Math.min(W * 0.88, 960);
  const heroH = heroW * (p.hero.crop.h / p.hero.crop.w);
  const heroDrift = interpolate(f, [heroAt, end], [1, 1.03], clamp);
  const srcK = ramp(f, heroAt + 14, heroAt + 30, CURVE.quiet.enter);
  return (
    <World endAt={end} cta={p.cta} font={BODONI} fontWeight={700} ink={INK} logo="dark" logoSpot="top-left" end="iris" endGround={ROSE_MID}
      ground={`radial-gradient(ellipse 70% 45% at 50% 52%, ${ROSE_MID}, rgba(248,211,199,0) 75%), linear-gradient(180deg, ${ROSE_TOP} 0%, ${ROSE_MID} 50%, ${ROSE_LOW} 100%)`}>
      {/* the sheen of silk: long soft diagonal bands, fixed */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.35, mixBlendMode: "soft-light",
        background: "repeating-linear-gradient(115deg, rgba(255,255,255,.0) 0px, rgba(255,255,255,.55) 140px, rgba(255,255,255,0) 300px, rgba(120,20,20,.25) 460px, rgba(255,255,255,0) 620px)" }} />

      {items.map((it) => {
        const h = cardW * (it.card.crop.h / it.card.crop.w);
        const out = open > 0 ? interpolate(open, [0.4, 1], [1, 0], clamp) : 1;
        return (
          <div key={it.s} style={{ position: "absolute", left: it.sx - cardW / 2, top: it.sy - h / 2, width: cardW, height: h, borderRadius: 12, overflow: "hidden", background: "#0b0708",
            opacity: (1 - 0.3 * it.far) * out,
            filter: it.far > 0.55 ? `blur(${((it.far - 0.55) * 7).toFixed(1)}px)` : undefined,
            transform: `perspective(1400px) scale(${it.scale.toFixed(4)}) rotateY(${it.turnY.toFixed(2)}deg) rotateZ(${it.turnZ.toFixed(2)}deg)`,
            boxShadow: `0 ${(10 + 20 * (1 - it.far)).toFixed(0)}px ${(24 + 30 * (1 - it.far)).toFixed(0)}px rgba(90,12,16,${(0.22 + 0.25 * (1 - it.far)).toFixed(2)})` }}>
            <Crop c={it.card} w={cardW} />
          </div>
        );
      })}

      {/* the top stays clear for the words: the ground drawn back over the helix's top end */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: H * 0.26, background: `linear-gradient(180deg, ${ROSE_TOP} 55%, rgba(242,178,162,0))`, opacity: 1 - open * 0.6 }} />

      {f >= heroAt - 2 ? (
        <div style={{ position: "absolute", left: (W - heroW) / 2, top: H * 0.56 - heroH / 2, width: heroW, height: heroH, borderRadius: 22, overflow: "hidden", background: "#0b0708",
          opacity: heroIn, filter: heroIn < 0.98 ? `blur(${((1 - heroIn) * 18).toFixed(1)}px)` : undefined,
          transform: `translateY(${((1 - heroIn) * 120).toFixed(1)}px) scale(${((0.7 + 0.3 * heroIn) * heroDrift).toFixed(4)})`,
          boxShadow: "0 40px 90px rgba(90,12,16,.45), 0 0 0 2px rgba(255,255,255,.08)" }}>
          <Crop c={p.hero} w={heroW} />
        </div>
      ) : null}

      <div style={{ position: "absolute", left: 72, right: 72, top: H * 0.085 + 60, textAlign: "center", fontFamily: BODONI, fontStyle: "italic", fontWeight: 700,
        fontSize: Math.round(W * 0.078), lineHeight: 1.02, letterSpacing: "-0.02em", color: INK, opacity: head, transform: `translateY(${((1 - head) * 16).toFixed(1)}px)` }}>
        {p.headline}
      </div>
      <div style={{ position: "absolute", left: 72, right: 72, top: H * 0.56 + heroH / 2 + 60, textAlign: "center", fontFamily: HANKEN, fontWeight: 500, fontSize: Math.round(W * 0.03),
        color: INK, opacity: 0.85 * srcK }}>{p.source}</div>

      <Cue at={0} name="swoosh-slow" volume={0.3} />
      {Array.from({ length: 7 }, (_, i) => <Cue key={i} at={i * stepF + 2} name="paper-move-quick" volume={0.22} />)}
      <Cue at={scatter} name="air-woosh-quick" volume={0.5} />
      <Cue at={heroAt + 4} name="bass-hit-short" volume={0.5} />
    </World>
  );
};
