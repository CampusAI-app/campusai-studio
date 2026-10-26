/**
 * Previews of the annotate group (round 4, 2026-10-25), 1080x1350 at 30 fps, registered by `entry.ts`:
 *   npx remotion render src/kit/r4/annotate/entry.ts R4-Spotlight out/r4/R4-Spotlight.mp4 --concurrency=2 --crf 16
 * Every surface is a real campusai-demo capture from public/pass. Boxes come from that capture's JSON or are
 * measured off the capture (noted beside each); every caption is a string on that capture.
 */
import React from "react";
import { AbsoluteFill, Composition, staticFile } from "remotion";
import { brand } from "../../brand";
import { PASS_MARK } from "../../pass/camera/shared";
import { DrawnMark } from "./DrawnMark";
import { Loupe, loupeEnd } from "./Loupe";
import { PressMark, pressMarkTiming } from "./PressMark";
import { Spotlight, spotlightTiming } from "./Spotlight";

const B = brand("campusai");
const W = 1080;
const H = 1350;
const FPS = 30;
const PAGE = { w: 1440, h: 900 };

const Ground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient }}>{children}</AbsoluteFill>
);

/* Spotlight: the organizations page, Finance Association's "Why this fits you" box (heading plus the green
 * reason box, measured off the capture: x 405 to 1033, y 300 to 413). The framing is the card's left two
 * thirds (x 379 to 1045), so the Links column (an Instagram handle) stays out; the sidebar and its mark are
 * out of frame. */
const SPOT = { at: 22, close: 20, release: 22, hold: 70, label: "Why this fits you" };
const SPOT_T = spotlightTiming(SPOT);
const SPOT_DUR = SPOT_T.end + 24;
const SpotlightPreview: React.FC = () => (
  <Ground>
    <Spotlight
      brand={B}
      src={staticFile("pass/organizations.jpg")}
      page={PAGE}
      view={{ x: 36, y: 220, w: 1008, h: 800 }}
      cam={{ cx: 712, cy: 380, cw: 666 }}
      target={{ x: 405, y: 300, w: 628, h: 113 }}
      pad={7}
      push={0.025}
      labelBand={{ y: 1120, size: 48 }}
      {...SPOT}
    />
  </Ground>
);

/* DrawnMark: the Goldman Sachs detail. Boxes measured off job-goldman.jpg: "Closes Nov 1" x 1284 to 1364,
 * y 265 to 281; "so this is the summer that leads to an offer." x 911 to 1191, y 542 to 558; the Tailor
 * resume button is the JSON's box. The arrow rises from the empty end of the "Why this fits you" heading row. */
const DRAW_DUR = 216;
const DrawnMarkPreview: React.FC = () => (
  <Ground>
    <DrawnMark
      brand={B}
      src={staticFile("pass/job-goldman.jpg")}
      page={PAGE}
      view={{ x: 36, y: 200, w: 1008, h: 950 }}
      cams={[
        { t: 0, cam: { cx: 1054, cy: 405, cw: 700 } },
        { t: DRAW_DUR, cam: { cx: 1058, cy: 410, cw: 682 } },
      ]}
      marks={[
        { kind: "circle", rect: { x: 1284, y: 265, w: 80, h: 16 }, at: 12, seed: 3 },
        { kind: "underline", rect: { x: 911, y: 542, w: 280, h: 16 }, at: 74, seed: 2 },
        { kind: "arrow", rect: { x: 939, y: 324, w: 130, h: 38 }, at: 132, hold: 46, from: { x: 1190, y: 414 }, aim: { x: 1000, y: 364 }, bend: -0.24, seed: 1 },
      ]}
    />
  </Ground>
);

/* Loupe: the dashboard, wide enough that its small lines do not read (the sidebar is in frame, so its mark is
 * painted out). Points measured off dashboard.jpg:
 * the moved due date "Wed, Oct 14 → Sun, Oct 18" (x 289 to 459, y 223 to 237) and the event time
 * "Event · Fri · 7:00 PM - 8:30 PM" (x 855 to 1045, y 291 to 305). */
const LOUPE_STOPS = [
  { point: { x: 372, y: 230 }, at: 40, hold: 72 },
  { point: { x: 952, y: 298 }, at: 146, hold: 72 },
];
const LOUPE_DUR = loupeEnd(LOUPE_STOPS) + 18;
const LoupePreview: React.FC = () => (
  <Ground>
    <Loupe
      brand={B}
      src={staticFile("pass/dashboard.jpg")}
      page={PAGE}
      view={{ x: 36, y: 326, w: 1008, h: 698 }}
      cam={{ cx: 650, cy: 450, cw: 1300 }}
      stops={LOUPE_STOPS}
      from={{ x: 560, y: 520 }}
      mark={PASS_MARK}
    />
  </Ground>
);

/* PressMark: the events page. "Add to CampusAI Calendar" on Financial Modeling Bootcamp (JSON box) is
 * pressed; its pressed state is the real "On your calendar" button of the Evercore card on the same capture
 * (x 262 to 534, y 382 to 420). The result lands on "My Calendar" in the nav (JSON box). Tight on the card
 * for the press, then the camera widens BEFORE the dot leaves, so only one thing moves at a time. */
const PRESS_AT = 40;
const PRESS_T = pressMarkTiming({ pressAt: PRESS_AT, leave: 48, distancePx: 760 });
const PRESS_DUR = PRESS_T.land + 2 + 70 + 26;
const WIDE = { cx: 600, cy: 450, cw: 1200 };
const PressMarkPreview: React.FC = () => (
  <Ground>
    <PressMark
      brand={B}
      src={staticFile("pass/events.jpg")}
      page={PAGE}
      view={{ x: 36, y: 260, w: 1008, h: 756 }}
      cams={[
        { t: 0, cam: { cx: 1121, cy: 436, cw: 652 } },
        { t: PRESS_AT + 16, cam: { cx: 1121, cy: 432, cw: 640 } },
        { t: PRESS_AT + 44, cam: WIDE },
        { t: PRESS_DUR, cam: { cx: 590, cy: 450, cw: 1180 } },
      ]}
      control={{ x: 849, y: 384, w: 269, h: 34 }}
      after={{ x: 262, y: 382, w: 272, h: 38 }}
      pressAt={PRESS_AT}
      leave={48}
      target={{ x: 8, y: 104, w: 199, h: 36 }}
      label="My Calendar"
      labelHold={70}
      labelBand={{ y: 1110, size: 48 }}
      mark={PASS_MARK}
    />
  </Ground>
);

export const AnnotateRoot: React.FC = () => (
  <>
    <Composition id="R4-Spotlight" component={SpotlightPreview} durationInFrames={SPOT_DUR} fps={FPS} width={W} height={H} />
    <Composition id="R4-DrawnMark" component={DrawnMarkPreview} durationInFrames={DRAW_DUR} fps={FPS} width={W} height={H} />
    <Composition id="R4-Loupe" component={LoupePreview} durationInFrames={LOUPE_DUR} fps={FPS} width={W} height={H} />
    <Composition id="R4-PressMark" component={PressMarkPreview} durationInFrames={PRESS_DUR} fps={FPS} width={W} height={H} />
  </>
);
