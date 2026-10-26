/**
 * One shape (2026-10-23, wave 2, motion lane): a 14 s vertical loop. One red shape, never cut, morphs
 * through CampusAI's real states (the kit ShapeMorph): Add to CampusAI Calendar, On your calendar, the bell
 * with 6 new, the Goldman Sachs Job Match card, Apply on company site, then the logo. Each label is fully
 * gone before the next arrives (ShapeMorph's 3 frames out, 3 frames in, never overlapping).
 *
 * The answer to "pieces on black" (rejected three times): the morph happens ON the product. Behind each state
 * sits the real page that component lives on, laid out at the shape's own scale with the component exactly
 * under the shape, dimmed to a third and softly out of focus, so the shape reads as the page's own control
 * lifted toward you. When the shape changes state, the page behind changes with it (a 12 frame blur dissolve,
 * the old page easing back 4%).
 *
 * Loop: the logo holds 0.8 s, then the opening frame (the red button over Events) dissolves back in over
 * 12 frames, so the last frame hands to the first.
 * Logo: the held mark arrives top left at 0.3 s (the Job Match watermark) and leaves before the logo state.
 *
 * Every string is the product's own: the labels from the captures in public/sys2/one-shape/ (their json),
 * nothing typed. Sandy Spring sits in the Job Match detail panel on two of the pages and is patched over.
 */
import React from "react";
import { AbsoluteFill, Freeze, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { brand as brandOf, useBrandFonts } from "../../kit/brand";
import type { Rect, Size } from "../../kit/camera";
import { ShapeMorph } from "../../kit/pass/readout/ShapeMorph";
import type { MorphState } from "../../kit/pass/readout/ShapeMorph";
import { springStep } from "../../kit/pass/readout/shared";
import { SurfaceView } from "../../system/parts/common";
import type { Layout } from "../../system/parts/types";
import type { Surface } from "../../system/storyboard";

const B = brandOf("campusai");
export const W = 1080;
export const H = 1920;
export const FPS = 30;
const PAGE: Size = { w: 1440, h: 900 };
const CENTER = { x: 540, y: 930 };
const FILL = { w: 860, h: 560 };
const MAX_SCALE = 4.2;
const BEAT = 15; // 120 bpm

// Sandy Spring in the Job Match detail panel (jobs.json, goldman.json): painted in the page's own colour
const SANDY = { x: 752, y: 418, w: 600, h: 126 };
const surf = (name: string, patch: Rect[] = []): Surface => ({ src: `sys2/one-shape/${name}.jpg`, page: PAGE, dpr: 2, patch });

type Step = { state: MorphState; page: Surface; rect: Rect; frames: number };

// frames each state holds before the next press: the reading rule (letters / 15 + 1.5 s) plus the 6 frames a
// label takes to arrive; the card is a picture, held 1.6 s
const STEPS: Step[] = [
  { state: { w: 269, h: 34, radius: 8, label: "Add to CampusAI Calendar", look: "solid" },
    page: surf("events"), rect: { x: 849, y: 384, w: 269, h: 34 }, frames: 87 },
  { state: { w: 269, h: 36, radius: 8, label: "On your calendar", icon: "check", look: "tint" },
    page: surf("events-added"), rect: { x: 849, y: 381, w: 269, h: 36 }, frames: 79 },
  { state: { w: 83, h: 34, radius: 17, label: [{ text: "6", accent: true }, { text: " new" }], icon: "bell", iconAccent: true, look: "quiet" },
    page: surf("dashboard"), rect: { x: 1225, y: 17, w: 83, h: 34 }, frames: 60 },
  { state: { w: 436, h: 195, radius: 12, look: "quiet", image: { src: staticFile("sys2/one-shape/jobs.jpg"), page: PAGE, rect: { x: 269, y: 561, w: 436, h: 195 } } },
    page: surf("jobs", [SANDY]), rect: { x: 269, y: 561, w: 436, h: 195 }, frames: 48 },
  { state: { w: 189, h: 36, radius: 7, label: "Apply on company site", icon: "arrow", iconSide: "right", look: "solid" },
    page: surf("goldman", [SANDY]), rect: { x: 742, y: 325, w: 189, h: 36 }, frames: 87 },
];
const LOGO: MorphState = { w: 0, h: 0, radius: 0, logo: true };
const OFFSET = 3;
const PRESSES = STEPS.reduce<number[]>((a, s) => [...a, (a.length ? a[a.length - 1] : OFFSET) + s.frames], []);
const LOGO_IN = PRESSES[PRESSES.length - 1] + 19; // ShapeMorph's logo is fully in 19 frames after the last press
const LOOP = 12;
export const DURATION = LOGO_IN + 26 + LOOP;

const scaleOf = (st: MorphState) => Math.min(MAX_SCALE, FILL.w / st.w, FILL.h / st.h);
const NO_LAYOUT = { radius: 0 } as unknown as Layout;

/** The page a state lives on, laid out at the shape's scale with the component under the shape. */
const Behind: React.FC<{ step: Step; alpha: number; push: number }> = ({ step, alpha, push }) => {
  if (alpha <= 0.002) return null;
  const s = scaleOf(step.state) * (1 + push);
  const cw = W / s;
  const cam = { cx: step.rect.x + step.rect.w / 2, cy: step.rect.y + step.rect.h / 2 - (CENTER.y - H / 2) / s, cw };
  return (
    <AbsoluteFill style={{ opacity: alpha }}>
      <SurfaceView surface={step.page} brand={B} layout={NO_LAYOUT} cam={cam} view={{ x: 0, y: 0, w: W, h: H }} radius={0} dim={0.95} />
    </AbsoluteFill>
  );
};

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  // which page is behind: each press starts a 12 frame dissolve to the next state's page
  const layers = STEPS.map((step, i) => {
    const inAt = i === 0 ? -1e9 : PRESSES[i - 1];
    const outAt = i < STEPS.length - 1 ? PRESSES[i] : PRESSES[i] + 6; // the last page leaves as the logo forms
    const a = interpolate(f, [inAt, inAt + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      * (1 - interpolate(f, [outAt, outAt + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    const push = 0.04 * springStep((f - outAt) / FPS, 1, 0.5);
    return <Behind key={i} step={step} alpha={a} push={push} />;
  });
  const mark = interpolate(f, [9, 21], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    * (1 - interpolate(f, [PRESSES[PRESSES.length - 2], PRESSES[PRESSES.length - 2] + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <AbsoluteFill style={{ background: B.color.bgDeep, overflow: "hidden" }}>
      {layers}
      {/* the film's red-black gradient over the page, so the page reads as ground, never as a second subject */}
      <AbsoluteFill style={{ background: `radial-gradient(70% 45% at 50% 48%, rgba(11,7,8,0) 0%, rgba(11,7,8,.55) 70%, rgba(11,7,8,.9) 100%)` }} />
      <ShapeMorph brand={B} states={[...STEPS.map((s) => s.state), LOGO]} beats={[...STEPS.map((s) => s.frames / BEAT), 3]} offset={OFFSET}
        center={CENTER} fill={FILL} maxScale={MAX_SCALE} logoWidth={600} pointerFrom={{ x: W * 0.84, y: H * 0.72 }} />
      {mark > 0.002 && B.logo ? (
        <Img src={staticFile(B.logo.onDark)} style={{ position: "absolute", left: 59, top: 96, width: 180, opacity: 0.92 * mark }} />
      ) : null}
    </AbsoluteFill>
  );
};

export const OneShape: React.FC = () => {
  useBrandFonts(B);
  const f = useCurrentFrame();
  const back = interpolate(f, [DURATION - LOOP, DURATION - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Scene />
      {back > 0 ? (
        <AbsoluteFill style={{ opacity: back, filter: back < 1 ? `blur(${((1 - back) * 10).toFixed(2)}px)` : undefined }}>
          <Freeze frame={0}>
            <Scene />
          </Freeze>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
