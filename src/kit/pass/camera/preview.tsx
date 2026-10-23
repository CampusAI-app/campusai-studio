/**
 * Previews of the camera group (2026-10-22), 1080x1350 at 30 fps, registered by `entry.ts`:
 *   npx remotion render src/kit/pass/camera/entry.ts Pass-SlowGlide out/pass/Pass-SlowGlide.mp4 --concurrency=2
 * Every surface is a real campusai-demo capture from public/pass; every line is a heading from
 * that capture's JSON.
 */
import React from "react";
import { AbsoluteFill, Composition, staticFile } from "remotion";
import { brand } from "../../brand";
import { CraneRise } from "./CraneRise";
import { FocusWalk } from "./FocusWalk";
import { SlowGlide } from "./SlowGlide";
import { MARK_BOX, MARK_COLOR_GOLDMAN, PASS_MARK } from "./shared";

const B = brand("campusai");
const W = 1080;
const H = 1350;
const FPS = 30;
const PAGE = { w: 1440, h: 900 };

const Ground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient }}>{children}</AbsoluteFill>
);

/* SlowGlide: dashboard, Job Match, planner, calendar. Crops start right of the sidebar. */
const SLOW_GLIDE_DUR = 255;
const SlowGlidePreview: React.FC = () => (
  <Ground>
    <SlowGlide
      brand={B}
      travel={222}
      surfaces={[
        { src: staticFile("pass/dashboard.jpg"), page: PAGE, crop: { x: 240, y: 24, w: 1176, h: 670 }, line: "Your daily brief" },
        { src: staticFile("pass/jobmatch.jpg"), page: PAGE, crop: { x: 240, y: 84, w: 1176, h: 700 }, line: "Jobs for you" },
        { src: staticFile("pass/planner-tall.jpg"), page: { w: 1440, h: 1991 }, crop: { x: 240, y: 255, w: 1176, h: 600 }, line: "Maya's 4-year plan" },
        { src: staticFile("pass/calendar.jpg"), page: PAGE, crop: { x: 224, y: 48, w: 1216, h: 712 }, line: "October 2026" },
      ]}
    />
  </Ground>
);

/* CraneRise: tight on "Moved, BMGT380, Reading Response 6" in Your daily brief, rise to the whole dashboard.
 * The row box is measured off the capture (its separators sit at CSS y 145 and 245; the column runs x 281 to 808). */
const CRANE_DUR = 156;
const CraneRisePreview: React.FC = () => (
  <Ground>
    <CraneRise
      brand={B}
      src={staticFile("pass/dashboard-tall.jpg")}
      page={{ w: 1440, h: 1565 }}
      start={{ x: 281, y: 146, w: 527, h: 98 }}
      view={{ x: 36, y: 128, w: 1008, h: 1094 }}
      mark={PASS_MARK}
    />
  </Ground>
);

/* FocusWalk: the Goldman detail. Boxes from public/pass/job-goldman.json; "Why this fits you" is
 * trimmed to its visible section (it ends where "About this role" starts, y 578); the two buttons are
 * Apply on company site (measured off the capture, it is a link so the JSON has no box) plus the JSON's
 * Tailor resume box. */
const FOCUS_DUR = 270;
const FocusWalkPreview: React.FC = () => (
  <Ground>
    <FocusWalk
      brand={B}
      src={staticFile("pass/job-goldman.jpg")}
      page={PAGE}
      view={{ x: 36, y: 236, w: 1008, h: 1078 }}
      lineBand={{ y: 132, size: 62 }}
      intro={{ cx: 520, cy: 470, cw: 600 }}
      outro={{ cx: 1054, cy: 450, cw: 700 }}
      mark={{ rect: MARK_BOX, color: MARK_COLOR_GOLDMAN }}
      stops={[
        { rect: { x: 269, y: 382, w: 436, h: 195 }, hold: 30 },
        { rect: { x: 742, y: 377, w: 624, h: 201 }, hold: 62, line: "Why this fits you" },
        { rect: { x: 746, y: 757, w: 300, h: 42 }, hold: 30 },
        { rect: { x: 742, y: 322, w: 327, h: 42 }, hold: 28 },
      ]}
    />
  </Ground>
);

export const CameraPassRoot: React.FC = () => (
  <>
    <Composition id="Pass-SlowGlide" component={SlowGlidePreview} durationInFrames={SLOW_GLIDE_DUR} fps={FPS} width={W} height={H} />
    <Composition id="Pass-CraneRise" component={CraneRisePreview} durationInFrames={CRANE_DUR} fps={FPS} width={W} height={H} />
    <Composition id="Pass-FocusWalk" component={FocusWalkPreview} durationInFrames={FOCUS_DUR} fps={FPS} width={W} height={H} />
  </>
);
