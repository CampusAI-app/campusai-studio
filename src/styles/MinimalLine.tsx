/**
 * /minimal-line (2026-11-17, from the Nov 17 Muse sends: Matt Penny's ten Claude animation styles, Karam Mahaan's six
 * skills where relevant; prompts gated and unseen, so this is our own build of the look). Two references merged, read
 * frame by frame. Karam Mahaan's /minimalistic-graphics, "black and white line art, one moving dot": a black ground, a
 * tall column building line by line as stacked white rules on a baseline, a white dot riding up it, two short lowercase
 * lines of small text at the top that swap, tiny sparkles orbiting the dot once it reaches the top. And Matt Penny's
 * minimal stick-figure look: a white stick figure of a few joined strokes, a dotted circle building round it, thin
 * concentric rings.
 *
 * Ours, student-first at Maryland (round 2, Jacob 11/17: show the real product or be a little funny, best both, and open
 * on something UMD): the UMD M pops in and tags up top, the figure stands at the baseline asking, the column builds one
 * rule per gen ed credit while the dot climbs and the small text gets self-serious about it, the top rule is the one red
 * line, then the dot leaps off the top and lands on the real General Education card (a capture) where what is left
 * begins, and the rings open there. Work Sans, lowercase, small, calm. One white, one red.
 */
import React, { useMemo } from "react";
import { loadFont } from "@remotion/google-fonts/WorkSans";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { CURVE } from "../system/motion";
import { RED, Cue, clamp, ramp } from "./common";
import { UmdOpen } from "./UmdOpen";
import { World } from "./world";

const { fontFamily: FACE } = loadFont("normal", { weights: ["400", "500"], subsets: ["latin"] });

const BLACK = "#000000";
const WHITE = "#F4F3EF";

export type MinimalLineProps = {
  /** Three pairs of short lowercase lines that swap at the top: the student's, the count, the answer. */
  pairs: [[string, string], [string, string], [string, string]];
  /** How many rules the column builds: the true count. */
  count: number;
  source: string;
  /** The real card the dot lands on (public/), its size in capture pixels, and the landing point on it. */
  card: { src: string; w: number; h: number; land: { x: number; y: number } };
  cta?: string;
};
const CARD = { x: 50, y: 490, w: 980 }; // where the card sits on screen

// motion: one rule every 3 frames, so 40 rules build in 4 s; each pair holds its reading time (letters / 15 + 1.5 s)
const STEP = 3;
const readFrames = (pair: [string, string]) => Math.ceil(((pair[0].length + pair[1].length) / 15 + 1.5) * 30) + 14;
export const minimalPlan = (p: MinimalLineProps) => {
  const pair1 = 4;
  const pair2 = pair1 + readFrames(p.pairs[0]);
  const build = pair2 + 6;
  const top = build + p.count * STEP + 4;
  const pair3 = Math.max(top - 2, pair2 + readFrames(p.pairs[1]));
  const end = pair3 + readFrames(p.pairs[2]) + 6;
  return { pair1, pair2, build, top, pair3, end };
};
export const minimalEnd = (p: MinimalLineProps) => minimalPlan(p).end;

const BASE_Y = 1580;
const COL_W = 240;
const CX = 560;

/** A four point sparkle. */
const Sparkle: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => (
  <path d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`} fill={WHITE} opacity={o} />
);

/** Two short lines of small lowercase text, fading through each other. */
const Pair: React.FC<{ lines: [string, string]; at: number; out: number; f: number }> = ({ lines, at, out, f }) => {
  const a = ramp(f, at, at + 12, CURVE.quiet.enter) * (1 - ramp(f, out - 10, out, CURVE.quiet.exit));
  const b = ramp(f, at + 8, at + 20, CURVE.quiet.enter) * (1 - ramp(f, out - 10, out, CURVE.quiet.exit));
  if (a <= 0 && b <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 300, textAlign: "center", fontFamily: FACE, fontWeight: 400, fontSize: 48, lineHeight: 1.4, color: WHITE, letterSpacing: "0.005em" }}>
      <div style={{ opacity: a, transform: `translateY(${((1 - a) * 8).toFixed(1)}px)` }}>{lines[0]}</div>
      <div style={{ opacity: b * 0.62, transform: `translateY(${((1 - b) * 8).toFixed(1)}px)` }}>{lines[1]}</div>
    </div>
  );
};

export const MinimalLine: React.FC<MinimalLineProps> = (p) => {
  const f = useCurrentFrame();
  const plan = minimalPlan(p);
  const gap = Math.min(20, 760 / p.count);
  const topY = BASE_Y - 20 - (p.count - 1) * gap;

  // how far the column has built, and where the dot sits on it
  const built = interpolate(f, [plan.build, plan.build + p.count * STEP], [0, p.count], clamp);
  // the dot sits on the newest rule, riding up as each one draws (a rule reads as drawn once half out)
  const riding = Math.max(0, Math.min(p.count, interpolate(f, [plan.build + 3, plan.build + 3 + p.count * STEP], [0, p.count], clamp)));
  const dotY = riding <= 0 ? BASE_Y - 16 : BASE_Y - 20 - (riding - 1) * gap - 16;
  const arrived = ramp(f, plan.top, plan.top + 20, CURVE.quiet.enter);
  const settle = arrived > 0 ? Math.sin((f - plan.top) * 0.35) * Math.exp(-(f - plan.top) / 9) * 10 : 0;
  // then it leaps off the top rule in one arc and lands on the real card, where what is left begins
  const cs = CARD.w / p.card.w;
  const land = { x: CARD.x + p.card.land.x * cs, y: CARD.y + p.card.land.y * cs };
  const cardK = ramp(f, plan.top + 4, plan.top + 22, CURVE.quiet.enter);
  const leap = ramp(f, plan.top + 14, plan.top + 36, CURVE.quiet.standard);
  const landAt = plan.top + 36;
  const bounce = f >= landAt ? Math.sin((f - landAt) * 0.45) * Math.exp(-(f - landAt) / 7) * 8 : 0;
  const dotX = CX + (land.x - CX) * leap;
  const landed = ramp(f, landAt, landAt + 20, CURVE.quiet.enter);
  const dotYNow = leap <= 0 ? dotY - settle : (topY - 16) + (land.y - (topY - 16)) * leap - Math.sin(Math.PI * leap) * 150 - bounce;

  // the figure: a few joined strokes, head tipping back to look up as the column grows
  const figX = 270;
  const look = ramp(f, plan.build, plan.top, CURVE.quiet.standard);
  const figK = ramp(f, 2, 26, CURVE.quiet.enter);
  const head = { x: figX + 4 * look, y: BASE_Y - 168 - 4 * look };
  const reach = ramp(f, plan.top + 6, plan.top + 26, CURVE.quiet.enter);
  const handR = { x: interpolate(reach, [0, 1], [figX + 34, figX + 58]), y: interpolate(reach, [0, 1], [BASE_Y - 70, BASE_Y - 196]) };

  // the dotted circle round the figure first, then the rings round the dot at the top
  const figRing = ramp(f, 10, 70, CURVE.quiet.standard) * (1 - ramp(f, plan.build + 20, plan.build + 50, CURVE.quiet.exit));
  const topRing = ramp(f, landAt, landAt + 40, CURVE.quiet.standard);
  const baseK = ramp(f, 0, 14, CURVE.quiet.enter);
  const breathe = 1 + Math.sin(f * 0.06) * 0.012;
  const counter = Math.max(0, Math.min(p.count, Math.round(built)));

  const ringDots = (cx: number, cy: number, r: number, n: number, k: number, rot: number, size: number, o: number) =>
    [...Array(Math.floor(n * k))].map((_, i) => {
      const a = rot + (i / n) * Math.PI * 2 - Math.PI / 2;
      return <circle key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={size} fill={WHITE} opacity={o} />;
    });

  const sparkles = useMemo(() => [0, 1, 2, 3, 4].map((i) => ({ r: 46 + (i % 3) * 16, sp: 0.05 + i * 0.012, ph: i * 1.3, s: 7 + (i % 2) * 4 })), []);
  const srcK = ramp(f, plan.pair2 + 12, plan.pair2 + 28, CURVE.quiet.enter);

  return (
    <World endAt={plan.end} ground={BLACK} ink={WHITE} logo="white" logoSpot="top-right" font={FACE} fontWeight={400} end="drop" endGround={BLACK}>
      <AbsoluteFill>
        <svg viewBox="0 0 1080 1920" style={{ width: "100%", height: "100%" }}>
          {/* the baseline */}
          <path d={`M${540 - 380 * baseK} ${BASE_Y} H${540 + 380 * baseK}`} stroke={WHITE} strokeWidth={3} strokeLinecap="round" />

          {/* the dotted circle round the figure while they ask */}
          <g opacity={0.7}>{ringDots(figX, BASE_Y - 120, 150, 56, figRing, f * 0.004, 2.6, 1)}</g>

          {/* the column: one rule per credit, each drawing out from the middle; the top one is the red line */}
          {[...Array(p.count)].map((_, i) => {
            const k = ramp(f, plan.build + i * STEP, plan.build + i * STEP + 6, CURVE.quiet.enter);
            if (k <= 0) return null;
            const y = BASE_Y - 20 - i * gap;
            const isTop = i === p.count - 1;
            const w = (COL_W / 2) * k;
            return <path key={i} d={`M${CX - w} ${y} H${CX + w}`} stroke={isTop ? RED : WHITE} strokeWidth={isTop ? 4 : 2.6} strokeLinecap="round" opacity={isTop ? 1 : 0.92} />;
          })}

          {/* the running count beside the dot, the rules counted, never typed in */}
          {f >= plan.build && f < plan.end ? (
            <text x={CX + COL_W / 2 + 34} y={dotY + 28} fontFamily={FACE} fontSize={30} fill={counter === p.count ? RED : WHITE}
              opacity={0.75 * ramp(f, plan.build, plan.build + 10) * (1 - leap)}>{counter}</text>
          ) : null}

          {/* the real card: a capture of the product's own General Education card, never redrawn */}
          {cardK > 0 ? (
            <g opacity={cardK} transform={`translate(0 ${((1 - cardK) * 10).toFixed(1)})`}>
              <image href={staticFile(p.card.src)} x={CARD.x} y={CARD.y} width={CARD.w} height={p.card.h * cs} />
            </g>
          ) : null}

          {/* the rings open round the dot where it lands */}
          <g transform={`translate(${land.x} ${land.y}) scale(${breathe}) translate(${-land.x} ${-land.y})`}>
            {ringDots(land.x, land.y, 64, 36, topRing, -f * 0.004, 2.4, 0.9)}
            {[104, 150, 210].map((r, i) => {
              const k = ramp(f, landAt + 6 + i * 8, landAt + 36 + i * 8, CURVE.quiet.enter);
              return k > 0 ? <circle key={r} cx={land.x} cy={land.y} r={r * (0.85 + 0.15 * k)} fill="none" stroke={WHITE} strokeWidth={1.4} opacity={(0.34 - i * 0.09) * k} /> : null;
            })}
          </g>

          {/* the dot and its sparkles */}
          <circle cx={dotX} cy={dotYNow} r={14} fill={WHITE} opacity={ramp(f, plan.pair2, plan.pair2 + 10)} />
          {landed > 0
            ? sparkles.map((s, i) => {
                const a = s.ph + (f - landAt) * s.sp;
                const tw = 0.5 + 0.5 * Math.sin(f * 0.3 + i * 2);
                return <Sparkle key={i} x={dotX + Math.cos(a) * s.r} y={dotYNow + Math.sin(a) * s.r * 0.8} s={s.s * (0.6 + 0.4 * tw) * landed} o={landed * (0.4 + 0.6 * tw)} />;
              })
            : null}

          {/* the figure */}
          <g stroke={WHITE} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={figK}>
            <circle cx={head.x} cy={head.y} r={24} />
            <path d={`M${figX} ${BASE_Y - 142} L${figX - 2} ${BASE_Y - 62} L${figX - 24} ${BASE_Y - 2} M${figX - 2} ${BASE_Y - 62} L${figX + 20} ${BASE_Y - 2}`} />
            <path d={`M${figX - 32} ${BASE_Y - 74} L${figX - 1} ${BASE_Y - 126} L${handR.x} ${handR.y}`} />
          </g>
        </svg>
      </AbsoluteFill>

      <Pair lines={p.pairs[0]} at={plan.pair1} out={plan.pair2} f={f} />
      <Pair lines={p.pairs[1]} at={plan.pair2} out={plan.pair3} f={f} />
      <Pair lines={p.pairs[2]} at={plan.pair3} out={plan.end + 4} f={f} />
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 190, textAlign: "center", fontFamily: FACE, fontSize: 28, color: WHITE, opacity: 0.42 * srcK }}>{p.source}</div>

      {f >= plan.end + 12 ? <QuietEnd at={plan.end + 12} cta={p.cta} /> : null}

      <Cue at={plan.build} name="data-scan" volume={0.2} />
      <Cue at={plan.top} name="chime-crystal" volume={0.3} />
      <Cue at={plan.top + 36} name="hit-weak" volume={0.4} />
      {/* the UMD M first, so a Maryland student knows it is theirs (Jacob 11/17), last so it sits on top */}
      <UmdOpen shadow={false} bigCy={880} tagCx={540} tagCy={120} />
    </World>
  );
};

/** World draws the logo and campusai.app; this adds the small lowercase line and the thin rings, in this style's voice. */
const QuietEnd: React.FC<{ at: number; cta?: string }> = ({ at, cta }) => {
  const f = useCurrentFrame();
  const k = ramp(f, at + 8, at + 24, CURVE.quiet.enter);
  return (
    <AbsoluteFill style={{ zIndex: 70 }}>
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", width: "100%", height: "100%" }}>
        {[360, 430].map((r, i) => {
          const rk = ramp(f, at + i * 6, at + 30 + i * 6, CURVE.quiet.enter);
          return <circle key={r} cx={540} cy={960} r={r * (0.9 + 0.1 * rk)} fill="none" stroke={WHITE} strokeWidth={1.4} opacity={(0.3 - i * 0.12) * rk} />;
        })}
      </svg>
      {cta ? (
        <div style={{ position: "absolute", left: 80, right: 80, top: 800, textAlign: "center", fontFamily: FACE, fontSize: 44, color: WHITE, opacity: k * 0.9,
          transform: `translateY(${((1 - k) * 8).toFixed(1)}px)` }}>{cta}</div>
      ) : null}
    </AbsoluteFill>
  );
};
