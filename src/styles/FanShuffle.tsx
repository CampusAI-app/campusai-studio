/**
 * /fan-shuffle (2026-11-15, our own build of Bloop's "Fan Shuffle" template, bloop.wtf, via Muse; read off the site,
 * numbers in films/bloop-styles/facts.md). One real card sits on red card-table felt, then the deck behind it fans out
 * up and to the right like a dealer's spread, gathers back, and the table becomes a whole wall of real cards whose rows
 * slide past each other in opposite directions while the camera pulls back.
 *
 * Every card is a REAL crop of a demo capture, never rebuilt. The deck shows the next cards in the page's own order,
 * as Bloop cycles its uploaded media. The words come from the page.
 *
 * Motion in numbers (30 fps), Bloop's defaults: deck of 6, fan spread 7.8% of a card per card, fan angle -47 deg,
 * 3 columns, card gap 2.5%, row shift 77% of a card over the wall, wall pull-back 0.8 (three columns fill 80% of the
 * width at the end). The curve is Bloop's 0.65, 0, 0.35, 1. Timeline at 1x: the hero holds 0.6 s; the fan opens over
 * 1 s; holds 0.5 s; gathers in 0.6 s; the wall fades in round it from the centre out over 0.8 s (2 frames later per
 * card away from the centre), then the rows slide and the camera pulls back from the hero's size over 3.3 s and keeps
 * drifting while the words land.
 */
import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/FamiljenGrotesk";
import { CURVE, readHold } from "../system/motion";
import { Cue, clamp, ramp } from "./common";
import { World } from "./world";
import type { Format } from "./common";

const { fontFamily: FAMILJEN } = loadFont("normal", { weights: ["500", "700"], subsets: ["latin"] });

// its own world: red baize on a card table, a warm lamp over the middle, the edges falling to oxblood
const FELT = "#A0161F";
const FELT_LIGHT = "#C42A2C";
const FELT_DEEP = "#4A060B";
const CREAM = "#FFF1E6";
const FPS = 30;

type Box = { x: number; y: number; w: number; h: number };
export type FanCard = { src: string; image: { w: number; h: number }; crop: Box };

export type FanShuffleProps = {
  format?: Format;
  /** One or two short lines (a line break splits them). */
  headline: string;
  /** The cards, the hero first, then the rest in the page's own order. */
  cards: FanCard[];
  source: string;
  cta?: string;
  /** Bloop's knobs. */
  deckCards?: number;
  /** Offset per deck card as a share of a card's width. */
  fanSpread?: number;
  /** Direction the deck fans, degrees (negative is up and to the right). */
  fanAngle?: number;
  columns?: number;
  /** Gap between wall cards as a share of the frame width. */
  cardGap?: number;
  /** How far the rows slide over the wall, as a share of a card's width. */
  rowShift?: number;
  /** 0.5 to 1: how far the camera pulls back (at 0.8 the columns fill 80% of the width). */
  pullBack?: number;
  speed?: number;
  /** Cubic bezier points for every move. */
  bezier?: [number, number, number, number];
};

export const fanPlan = (p: FanShuffleProps) => {
  const s = (x: number) => Math.round(x / (p.speed ?? 1));
  const fanAt = s(18);
  const fanEnd = fanAt + s(30);
  const gather = fanEnd + s(15);
  const gatherEnd = gather + s(18);
  const wallAt = gatherEnd - s(4);
  const wallIn = wallAt + s(24);
  const pullEnd = wallIn + s(100);
  const words = wallIn + s(10);
  const end = Math.max(pullEnd, words + Math.round(readHold(p.headline) * FPS) + s(24));
  return { fanAt, fanEnd, gather, gatherEnd, wallAt, wallIn, pullEnd, words, end };
};
export const fanEnd = (p: FanShuffleProps) => fanPlan(p).end;

const Crop: React.FC<{ c: FanCard; w: number }> = ({ c, w }) => {
  const s = w / c.crop.w;
  return <Img src={staticFile(c.src)} style={{ position: "absolute", left: -c.crop.x * s, top: -c.crop.y * s, width: c.image.w * s, height: c.image.h * s, maxWidth: "none" }} />;
};

const mod = (a: number, n: number) => ((a % n) + n) % n;

export const FanShuffle: React.FC<FanShuffleProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const plan = fanPlan(p);
  const [a, b, c, d] = p.bezier ?? [0.65, 0, 0.35, 1];
  const ease = Easing.bezier(a, b, c, d);
  const cols = p.columns ?? 3;
  const pull = p.pullBack ?? 0.8;
  const gapPx = W * (p.cardGap ?? 0.025);
  const tileW = (W * pull - gapPx * (cols - 1)) / cols;
  const tallest = Math.max(...p.cards.map((k) => k.crop.h / k.crop.w));
  const slotH = tileW * tallest + gapPx;
  const slotW = tileW + gapPx;
  const heroW = Math.min(W * 0.82, 900);
  const s0 = heroW / tileW;
  // the camera: hero-sized through the fan, then pulling back to 1 (the columns filling `pull` of the width)
  const pullK = interpolate(f, [plan.wallIn, plan.pullEnd], [0, 1], { ...clamp, easing: ease });
  const cam = (s0 + (1 - s0) * pullK) * interpolate(f, [plan.pullEnd, plan.end], [1, 0.97], clamp);
  // the fan: open, hold, gather
  const fanK = interpolate(f, [plan.fanAt, plan.fanEnd], [0, 1], { ...clamp, easing: ease }) * (1 - interpolate(f, [plan.gather, plan.gatherEnd], [0, 1], { ...clamp, easing: ease }));
  const deckN = Math.max(2, p.deckCards ?? 6);
  const ang = ((p.fanAngle ?? -47) * Math.PI) / 180;
  const spread = (p.fanSpread ?? 0.078) * tileW;
  const shiftK = interpolate(f, [plan.wallIn, plan.end], [0, 1], { ...clamp, easing: Easing.bezier(0.33, 0, 0.2, 1) });
  const shift = (p.rowShift ?? 0.77) * tileW * shiftK;
  const n = p.cards.length;
  const rows = Math.ceil(H / (slotH * 1) / 2) + 2;
  const colsSpan = Math.ceil(W / slotW / 2) + 3;
  const centre = { x: W / 2, y: H * 0.52 };
  // the wall's first row reads left to right in page order round the hero: (0,0) is the hero
  const pick = (r: number, cc: number) => (r === 0 && cc === 0 ? 0 : 1 + mod(r * (cols + 2) + cc - 1, n - 1));

  const tiles: React.ReactNode[] = [];
  if (f >= plan.wallAt) {
    for (let r = -rows; r <= rows; r++) {
      const dir = r % 2 === 0 ? -1 : 1;
      for (let cc = -colsSpan; cc <= colsSpan; cc++) {
        if (r === 0 && cc === 0) continue;
        const card = p.cards[pick(r, cc)];
        const h = tileW * (card.crop.h / card.crop.w);
        const dist = Math.hypot(r * 1.4, cc);
        const appear = ramp(f, plan.wallAt + dist * 2, plan.wallAt + dist * 2 + 14, CURVE.quiet.enter);
        if (appear <= 0) continue;
        const x = cc * slotW + dir * shift;
        const y = r * slotH;
        tiles.push(
          <div key={`${r}:${cc}`} style={{ position: "absolute", left: x - tileW / 2, top: y - h / 2, width: tileW, height: h, borderRadius: 10, overflow: "hidden", background: "#0b0708",
            opacity: appear, transform: `scale(${(0.9 + 0.1 * appear).toFixed(4)})`, boxShadow: "0 10px 24px rgba(40,2,6,.5)" }}>
            <Crop c={card} w={tileW} />
          </div>,
        );
      }
    }
  }
  const hero = p.cards[0];
  const heroH = tileW * (hero.crop.h / hero.crop.w);
  const heroX = -shift; // the hero's row slides like the others
  const deck = Array.from({ length: deckN - 1 }, (_, i) => deckN - 1 - i).map((i) => {
    const card = p.cards[mod(i, n)];
    const h = tileW * (card.crop.h / card.crop.w);
    const off = i * spread * fanK;
    return (
      <div key={`d${i}`} style={{ position: "absolute", left: heroX + Math.cos(ang) * off - tileW / 2, top: Math.sin(ang) * off - h / 2, width: tileW, height: h, borderRadius: 10,
        overflow: "hidden", background: "#0b0708", opacity: fanK > 0.001 ? 1 : 0, boxShadow: "0 6px 16px rgba(40,2,6,.45)",
        transform: `rotate(${(i * 0.8 * fanK).toFixed(2)}deg)` }}>
        <Crop c={card} w={tileW} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(40,2,6,1)", opacity: 0.1 + 0.05 * i }} />
      </div>
    );
  });
  const breathe = interpolate(f, [0, plan.fanAt], [1.02, 1], clamp);
  const words = ramp(f, plan.words, plan.words + 16, CURVE.showy.enter);
  const srcK = ramp(f, plan.words + 14, plan.words + 30, CURVE.quiet.enter);
  return (
    <World endAt={plan.end} cta={p.cta} font={FAMILJEN} fontWeight={700} ink={CREAM} logo="white" logoSpot="top-left" end="wipe-left" endGround={FELT}
      ground={`radial-gradient(ellipse 75% 55% at 50% 45%, ${FELT_LIGHT}, ${FELT} 55%, ${FELT_DEEP} 115%)`}>
      {/* baize: a fine nap that never moves */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 0.55 }}>
        <filter id="fs-nap"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={2} seed={3} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.02  0 0 0 0 0.04  0 0 0 -1.2 0.85" /></filter>
        <rect width="100%" height="100%" filter="url(#fs-nap)" />
      </svg>

      <div style={{ position: "absolute", left: centre.x, top: centre.y, width: 0, height: 0, transform: `scale(${cam.toFixed(4)})` }}>
        {tiles}
        {deck}
        <div style={{ position: "absolute", left: heroX - tileW / 2, top: -heroH / 2, width: tileW, height: heroH, borderRadius: 10, overflow: "hidden", background: "#0b0708",
          transform: `scale(${breathe.toFixed(4)})`, boxShadow: `0 ${(14 / cam).toFixed(1)}px ${(34 / cam).toFixed(1)}px rgba(40,2,6,.6)` }}>
          <Crop c={hero} w={tileW} />
          {/* once the wall is up, a thin cream ring keeps the eye on the first card */}
          <div style={{ position: "absolute", inset: 0, borderRadius: 10, boxShadow: `inset 0 0 0 ${(3 / cam).toFixed(2)}px ${CREAM}`, opacity: ramp(f, plan.wallIn, plan.wallIn + 12, CURVE.quiet.enter) }} />
        </div>
      </div>

      {/* the lamp falls off at the top and foot, so the words sit on felt, not on cards */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: H * 0.27, opacity: words, background: `linear-gradient(180deg, ${FELT_DEEP} 0%, rgba(74,6,11,.92) 55%, rgba(74,6,11,0))` }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: H * 0.16, opacity: srcK, background: `linear-gradient(0deg, ${FELT_DEEP} 0%, rgba(74,6,11,.85) 50%, rgba(74,6,11,0))` }} />
      <div style={{ position: "absolute", left: 64, right: 64, top: H * 0.1 + 40, textAlign: "center", fontFamily: FAMILJEN, fontWeight: 700, fontSize: Math.round(W * 0.085),
        lineHeight: 1.0, letterSpacing: "-0.03em", color: CREAM, opacity: words, transform: `translateY(${((1 - words) * 24).toFixed(1)}px)`,
        textShadow: "0 6px 24px rgba(40,2,6,.5)", whiteSpace: "pre-line" }}>{p.headline}</div>
      <div style={{ position: "absolute", left: 64, right: 64, bottom: H * 0.05, textAlign: "center", fontFamily: FAMILJEN, fontWeight: 500, fontSize: Math.round(W * 0.03),
        color: CREAM, opacity: 0.85 * srcK }}>{p.source}</div>

      <Cue at={plan.fanAt} name="paper-slide" volume={0.45} />
      <Cue at={plan.gather} name="paper-move-quick" volume={0.4} />
      <Cue at={plan.wallAt} name="swoosh-slow" volume={0.45} />
      <Cue at={plan.words} name="bass-hit-short" volume={0.45} />
    </World>
  );
};
