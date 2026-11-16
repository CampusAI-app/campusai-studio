/**
 * /perspective-floor (2026-11-15, our own build of Bloop's "Perspective shot" template, bloop.wtf, via Muse; watched in
 * jj.finds_'s reel and on the site, numbers in films/bloop-styles/facts.md). Real pages of the product lie in one single
 * file on a dusk floor that runs to the horizon, and the file steps toward the camera one page at a time: the front page
 * slides out under the lens, the next one takes its place, a new one comes up out of the haze at the back. The front
 * page's own name sits in the sky.
 *
 * Every page is a REAL capture, never rebuilt. Each name is the product's own sidebar label or page heading.
 *
 * Motion in numbers (30 fps), Bloop's defaults where it has one: the floor is tilted 58 deg (cameraAngle), perspective
 * depth 72% (1544 px), the front page anchored at 80% of the frame height (Bloop's 72% is a 16:9 frame; a vertical frame
 * needs the sky for the words). Pages sit 4% of a page apart. The file moves one page per step, 1.4 s a step at 1x
 * (Bloop: 2 s), the move taking 85% of the step on the Sharp curve (0.83, 0, 0.17, 1), so each page lands and rests.
 * The first step starts at 0.45 s so the floor is already moving inside the hook. Twelve pages show behind the front one
 * (the file loops round, as Bloop's does), each further one paler with haze; the grid on the floor travels with them.
 */
import React from "react";
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/RedHatDisplay";
import { CURVE, readHold } from "../system/motion";
import { Cue, clamp, ramp } from "./common";
import { World } from "./world";
import type { Format } from "./common";

const { fontFamily: REDHAT } = loadFont("normal", { weights: ["500", "700", "900"], subsets: ["latin"] });

// its own world: a dusk sky going coral at the horizon over an oxblood floor with a fine grid
const SKY_TOP = "#F7C7B4";
const SKY_LOW = "#EC7660";
const HAZE = "#E9806A";
const FLOOR = "#3A0B0F";
const FLOOR_LINE = "rgba(255,150,120,0.16)";
const INK = "#3A090D";
const FPS = 30;

type Box = { x: number; y: number; w: number; h: number };
export type FloorCard = { src: string; image: { w: number; h: number }; crop: Box; label: string };
export type FloorEasing = "linear" | "smooth" | "sharp" | "spring";

export type PerspectiveFloorProps = {
  format?: Format;
  /** One short true line in the sky. */
  headline: string;
  /** The pages, front first, each a real capture with its crop and its own name. */
  cards: FloorCard[];
  source: string;
  cta?: string;
  /** Bloop's knobs. forward: the file comes toward the camera; backward: it walks away and new pages come from under the lens. */
  direction?: "forward" | "backward";
  /** Floor tilt in degrees, 10 to 75 (Bloop 58). */
  cameraAngle?: number;
  /** 0 to 1, how strong the perspective is (Bloop 0.72). */
  depth?: number;
  /** Where the front page sits, as a share of the frame height, 0.35 to 0.9. */
  vertical?: number;
  /** Space between pages as a share of a page's length (Bloop's spacing, about 0.04). */
  gap?: number;
  /** Seconds per step at 1x, and the speed multiplier. */
  stepSeconds?: number;
  speed?: number;
  easing?: FloorEasing;
  /** How many pages show behind the front one (the file loops round when there are fewer). */
  visible?: number;
};

const CURVES: Record<Exclude<FloorEasing, "spring">, (t: number) => number> = {
  linear: (t) => t,
  smooth: Easing.bezier(0.45, 0, 0.55, 1),
  sharp: Easing.bezier(0.83, 0, 0.17, 1),
};

export const floorPlan = (p: PerspectiveFloorProps) => {
  const stepF = Math.round(((p.stepSeconds ?? 1.4) * FPS) / (p.speed ?? 1));
  const first = 14;
  const steps = Math.max(0, p.cards.length - 1);
  const settled = first + steps * stepF;
  const end = settled + Math.max(36, Math.round(readHold(p.cards[p.cards.length - 1]?.label ?? "") * FPS * 0.6));
  return { stepF, first, steps, settled, end };
};
export const floorEnd = (p: PerspectiveFloorProps) => floorPlan(p).end;

/** Where the file is, in pages travelled (0 = first page in front). */
const travel = (f: number, p: PerspectiveFloorProps, fps: number) => {
  const { stepF, first, steps } = floorPlan(p);
  if (f < first) return 0;
  const t = (f - first) / stepF;
  const n = Math.floor(t);
  if (n >= steps) return steps;
  const local = (t - n) / 0.85;
  const easing = p.easing ?? "sharp";
  const k = easing === "spring"
    ? Math.min(1, spring({ frame: (t - n) * stepF, fps, config: { damping: 15, stiffness: 120 } }))
    : CURVES[easing](Math.min(1, local));
  return n + k;
};

const Crop: React.FC<{ c: FloorCard; w: number; h: number }> = ({ c, w, h }) => {
  const s = w / c.crop.w;
  return (
    <Img src={staticFile(c.src)} style={{ position: "absolute", left: -c.crop.x * s, top: -c.crop.y * s, width: c.image.w * s, height: c.image.h * s, maxWidth: "none" }} />
  );
};

export const PerspectiveFloor: React.FC<PerspectiveFloorProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const { end, settled } = floorPlan(p);
  const angle = p.cameraAngle ?? 58;
  const depth = p.depth ?? 0.72;
  const P = interpolate(depth, [0, 1], [3200, 900]);
  const rad = (angle * Math.PI) / 180;
  const anchorY = H * (p.vertical ?? 0.8);
  // the vanishing line of a floor tilted `angle` with the eye level at the anchor
  const horizon = anchorY - P / Math.tan(rad);
  const ratio = p.cards[0].crop.h / p.cards[0].crop.w;
  const cardW = Math.min(W * 0.86, H * 0.62 / ratio);
  const cardH = cardW * ratio;
  const pitch = cardH * (1 + (p.gap ?? 0.04));
  const visible = p.visible ?? 12;
  const pos = travel(f, p, fps);
  const back = p.direction === "backward";
  // the camera eases in a touch through the whole piece, so even the rests breathe
  const push = interpolate(f, [0, end], [1.0, 1.035], clamp);
  const front = Math.min(p.cards.length - 1, Math.max(0, Math.round(pos)));
  const label = p.cards[front].label;
  const between = Math.abs((pos % 1) - 0.5);
  const labelK = f < 10 ? ramp(f, 2, 10, CURVE.quiet.enter) : interpolate(between, [0.12, 0.38], [0, 1], clamp);
  const head = ramp(f, 0, 12, CURVE.quiet.enter);
  const src = ramp(f, settled - 10, settled + 8, CURVE.quiet.enter);
  const grid = pitch / 2;
  const travelPx = (back ? -pos : pos) * pitch;
  return (
    <World endAt={end} cta={p.cta} font={REDHAT} fontWeight={900} ink={INK} logo="dark" logoSpot="top-left" end="drop" endGround={SKY_TOP}
      ground={`linear-gradient(180deg, ${SKY_TOP} 0%, ${SKY_LOW} ${Math.round((horizon / H) * 100)}%, ${FLOOR} ${Math.round((horizon / H) * 100) + 1}%)`}>
      {/* the sun sitting on the horizon */}
      <div style={{ position: "absolute", left: 0, right: 0, top: horizon - 260, height: 520,
        background: `radial-gradient(ellipse 55% 50% at 50% 50%, rgba(255,226,200,.85), rgba(255,180,150,0) 70%)` }} />

      <div style={{ position: "absolute", inset: 0, perspective: P, perspectiveOrigin: `50% ${anchorY}px`, transform: `scale(${push.toFixed(4)})`, transformOrigin: `50% ${anchorY}px` }}>
        <div style={{ position: "absolute", left: (W - cardW) / 2, top: anchorY, width: cardW, height: 0, transformStyle: "preserve-3d",
          transform: `rotateX(${angle}deg)`, transformOrigin: "50% 0" }}>
          {/* the floor, its grid travelling with the pages */}
          <div style={{ position: "absolute", left: -4000, width: cardW + 8000, top: -16000, height: 17000, backgroundColor: FLOOR,
            backgroundImage: `linear-gradient(0deg, ${FLOOR_LINE} 2px, transparent 2px), linear-gradient(90deg, ${FLOOR_LINE} 2px, transparent 2px)`,
            backgroundSize: `${grid.toFixed(2)}px ${grid.toFixed(2)}px`, backgroundPosition: `${((cardW / 2) % grid).toFixed(2)}px ${(travelPx % grid).toFixed(2)}px` }} />
          {/* the file runs on past the last page, the pages coming round again in the haze, as Bloop loops its media */}
          {Array.from({ length: p.cards.length + visible + 2 }, (_, k) => {
            const c = p.cards[k % p.cards.length];
            const slot = back ? pos - k : k - pos;
            if (slot < -1.6 || slot > visible + 0.6) return null;
            const h = cardW * (c.crop.h / c.crop.w);
            // slot 0 sits a little in front of the anchor so its near edge runs off the foot of the frame
            const y = -slot * pitch - h * 0.12;
            const fog = interpolate(slot, [0.4, 4, visible], [0, 0.45, 0.8], clamp);
            const fade = interpolate(slot, [visible - 0.6, visible + 0.5], [1, 0], clamp) * interpolate(slot, [-1.6, -1.1], [0, 1], clamp);
            return (
              <div key={k} style={{ position: "absolute", left: 0, top: y, width: cardW, height: h, borderRadius: 16, overflow: "hidden", background: "#0b0708", opacity: fade,
                boxShadow: "0 24px 60px rgba(20,0,2,.55), 0 0 0 2px rgba(255,170,150,.18)" }}>
                <Crop c={c} w={cardW} h={h} />
                <div style={{ position: "absolute", inset: 0, background: HAZE, opacity: fog }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* the haze where the floor meets the sky */}
      <div style={{ position: "absolute", left: 0, right: 0, top: horizon - 30, height: 190,
        background: `linear-gradient(180deg, ${HAZE} 0%, rgba(233,128,106,.55) 30%, rgba(233,128,106,0) 100%)` }} />

      {/* the words, in the sky */}
      <div style={{ position: "absolute", left: 64, right: 64, top: Math.max(170, horizon * 0.26), textAlign: "center", fontFamily: REDHAT, fontWeight: 900,
        fontSize: Math.round(W * 0.085), lineHeight: 0.98, letterSpacing: "-0.035em", color: INK, opacity: head, transform: `translateY(${((1 - head) * 18).toFixed(1)}px)` }}>
        {p.headline}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: Math.max(400, horizon * 0.62), display: "flex", justifyContent: "center", alignItems: "baseline", gap: 18,
        fontFamily: REDHAT, color: INK, opacity: labelK, transform: `translateY(${((1 - labelK) * 14).toFixed(1)}px)` }}>
        <span style={{ fontWeight: 700, fontSize: Math.round(W * 0.056), letterSpacing: "-0.02em", background: INK, color: SKY_TOP, padding: "10px 30px 14px", borderRadius: 999 }}>{label}</span>
        <span style={{ fontWeight: 500, fontSize: Math.round(W * 0.03), opacity: 0.75 }}>{front + 1} of {p.cards.length}</span>
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, top: Math.max(520, horizon * 0.8), textAlign: "center", fontFamily: REDHAT, fontWeight: 500, fontSize: Math.round(W * 0.028),
        color: INK, opacity: 0.8 * src }}>{p.source}</div>

      <Cue at={0} name="swoosh-slow" volume={0.35} />
      {p.cards.slice(1).map((_, i) => <Cue key={i} at={floorPlan(p).first + i * floorPlan(p).stepF + 2} name={i % 2 ? "paper-slide" : "paper-move-quick"} volume={0.32} />)}
      <Cue at={settled} name="switch-tap" volume={0.35} />
    </World>
  );
};
