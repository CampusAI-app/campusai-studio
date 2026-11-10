/**
 * One sample per effect, on real campusai-demo captures already in public/ (they are local files, not in the repo).
 * Every word and number on screen is in films/effects-mrcreates/facts.md with its source.
 */
import React from "react";
import { Composition } from "remotion";
import { Checklist, ChecklistProps, checklistTimes } from "./Checklist";
import { CoverStory, CoverStoryProps, coverTimes } from "./CoverStory";
import { GlassType, GlassTypeProps, glassTimes } from "./GlassType";
import { UIWorld, UIWorldProps, uiWorldTimes } from "./UIWorld";
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

export const EffectSamples: React.FC = () => (
  <>
    <Composition id="Effect-Checklist" component={Checklist} defaultProps={CHECKLIST} durationInFrames={checklistTimes(CHECKLIST).total} fps={30} width={1080} height={1920} />
    <Composition id="Effect-GlassType" component={GlassType} defaultProps={GLASS} durationInFrames={glassTimes(GLASS).total} fps={30} width={1080} height={1080} />
    <Composition id="Effect-CoverStory" component={CoverStory} defaultProps={COVER} durationInFrames={coverTimes(COVER).total} fps={30} width={1080} height={1350} />
    <Composition id="Effect-UIWorld" component={UIWorld} defaultProps={UI_WORLD} durationInFrames={uiWorldTimes(UI_WORLD).total} fps={30} width={1920} height={1080} />
  </>
);
