/**
 * One sample per effect, on real campusai-demo captures already in public/ (they are local files, not in the repo).
 * Every word and number on screen is in films/effects-mrcreates/facts.md with its source.
 */
import React from "react";
import { AbsoluteFill, Composition, Sequence } from "remotion";
import { Checklist, ChecklistProps, checklistTimes } from "./Checklist";
import { CoverStory, CoverStoryProps, coverTimes } from "./CoverStory";
import { GlassType, GlassTypeProps, glassTimes } from "./GlassType";
import { UIWorld, UIWorldProps, uiWorldTimes } from "./UIWorld";
import { GlowFocus, GlowFocusProps } from "./GlowFocus";
import { PixelBurst } from "./PixelBurst";
import { Shot } from "./shared";
import type { Capture } from "./shared";

const DESK = { w: 2880, h: 1800 };
const cap = (src: string, x: number, y: number, w: number, h: number, image = DESK): Capture => ({ src, image, crop: { x, y, w, h } });

// the Goldman Sachs card, selected, on Job Match (sys/job-2-why: page px x 2.88)
const GOLDMAN = cap("sys/job-2-why.jpg", 539, 576, 873, 389);

export const CHECKLIST: ChecklistProps = {
  heading: { count: "4", rest: "things in one place", italic: "inside" },
  items: [
    { name: "Job Match", shot: cap("sys/job-2-why.jpg", 539, 236, 2240, 1400), focus: { x: 0.2, y: 0.38 }, zoom: 1.2 },
    { name: "Events", shot: cap("sys/cal-3-added.jpg", 495, 150, 2321, 1451), focus: { x: 0.63, y: 0.75 }, zoom: 1.18 },
    { name: "Four-year planner", shot: cap("gfx/planner-scrolled.jpg", 495, 43, 2321, 1451), focus: { x: 0.16, y: 0.06 }, zoom: 1.2 },
    { name: "Notifications", shot: cap("gfx/notifications-scrolled.jpg", 495, 216, 2212, 1382), focus: { x: 0.17, y: 0.04 }, zoom: 1.2 },
  ],
};

export const GLASS: GlassTypeProps = {
  word: "Match",
  subject: { shot: GOLDMAN, width: 860 },
  caption: "Every role tells you why it fits you.",
};

export const COVER: CoverStoryProps = {
  masthead: "Your week",
  issue: "Week of Nov 8",
  subject: { shot: cap("launch-transitions/week.png", 0, 0, 2904, 1977, { w: 2904, h: 1977 }), width: 1000 },
  big: { value: "44", lines: ["assignments in,", "from Canvas"] },
  label: "All in one place",
};

export const UI_WORLD: UIWorldProps = {
  phrase: "All in one place.",
  panels: [
    { shot: GOLDMAN, width: 600, x: -540, y: -215, z: -40, turn: 16 },
    { shot: cap("sys/job-2-why.jpg", 1483, 230, 1253, 360), width: 680, x: 540, y: -290, z: -200, turn: -14 },
    { shot: cap("sys/cal-0-events.jpg", 1669, 454, 1148, 413), width: 640, x: 540, y: 280, z: 80, turn: -16, swap: { src: "sys/cal-3-added.jpg", at: 80 } },
    { shot: cap("gfx/planner-scrolled.jpg", 495, 52, 2321, 524), width: 780, x: -530, y: 310, z: -120, turn: 14 },
    { shot: cap("gfx/ask-chat-page-1024.jpg", 584, 205, 1321, 358, { w: 2048, h: 1800 }), width: 640, x: 0, y: -310, z: -900 },
    { shot: cap("gfx/notifications-scrolled.jpg", 495, 216, 2321, 331), width: 900, x: 0, y: 270, z: -900 },
  ],
};

// Nov 16: Glow focus and Pixel burst (the Nov 15 trials), on campusai-demo /events (sys/cal-*: page px x 2). No words on
// screen. The Bootcamp card's "Strong match" chip glows, then its Add button, the press swaps in the after-capture, and
// "On your calendar" glows and stays lit.
const EVENTS = cap("sys/cal-0-events.jpg", 0, 0, 2880, 1800);
export const GLOW_FOCUS: GlowFocusProps = {
  page: EVENTS,
  after: { src: "sys/cal-3-added.jpg", at: 112 },
  focus: { x: 1668, y: 450, w: 1148, h: 420 },
  glows: [
    { box: { x: 1698, y: 600, w: 206, h: 36 }, from: 36, to: 92, peak: 3.2, radius: 18 },
    { box: { x: 1698, y: 768, w: 538, h: 68 }, from: 80, to: 112, peak: 1.1 },
    { box: { x: 1698, y: 762, w: 538, h: 72 }, from: 112, rise: 14, peak: 3.4, settle: 2.1 },
  ],
};

// The press on Add to CampusAI Calendar, then confetti off "On your calendar" (its centre is 1967, 798 in the capture).
const BURST_CROP = { x: 1560, y: 200, size: 1300 };
const BURST_K = 1080 / BURST_CROP.size;
const burstShot = (src: string) => cap(src, BURST_CROP.x, BURST_CROP.y, BURST_CROP.size, BURST_CROP.size);
export const PixelBurstSample: React.FC = () => (
  <AbsoluteFill style={{ background: "#0b0708", overflow: "hidden" }}>
    <Sequence durationInFrames={24} layout="none"><Shot shot={burstShot("sys/cal-2-pressed.jpg")} width={1080} /></Sequence>
    <Sequence from={24} layout="none">
      <Shot shot={burstShot("sys/cal-3-added.jpg")} width={1080} />
    </Sequence>
    <PixelBurst sheet="pixelfx/confetti-crimson.json" x={(1967 - BURST_CROP.x) * BURST_K} y={(798 - BURST_CROP.y) * BURST_K} from={24} scale={3} />
  </AbsoluteFill>
);

export const EffectSamples: React.FC = () => (
  <>
    <Composition id="Effect-Checklist" component={Checklist} defaultProps={CHECKLIST} durationInFrames={checklistTimes(CHECKLIST).total} fps={30} width={1080} height={1920} />
    <Composition id="Effect-GlassType" component={GlassType} defaultProps={GLASS} durationInFrames={glassTimes(GLASS).total} fps={30} width={1080} height={1080} />
    <Composition id="Effect-CoverStory" component={CoverStory} defaultProps={COVER} durationInFrames={coverTimes(COVER).total} fps={30} width={1080} height={1350} />
    <Composition id="Effect-UIWorld" component={UIWorld} defaultProps={UI_WORLD} durationInFrames={uiWorldTimes(UI_WORLD).total} fps={30} width={1920} height={1080} />
    <Composition id="Effect-GlowFocus" component={GlowFocus} defaultProps={GLOW_FOCUS} durationInFrames={180} fps={30} width={1080} height={1080} />
    <Composition id="Effect-PixelBurst" component={PixelBurstSample} durationInFrames={132} fps={30} width={1080} height={1080} />
  </>
);
