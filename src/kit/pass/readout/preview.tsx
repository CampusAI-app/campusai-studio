/**
 * Previews for the readout parts (2026-10-22), registered by `entry.ts` so Root.tsx is never edited:
 *   npx remotion render src/kit/pass/readout/entry.ts Pass-RoleCard out/pass/Pass-RoleCard.mp4 --concurrency=2
 * Every string is read off the pass captures (public/pass/*.jpg and their JSON) or the campusai-demo source.
 */
import React from "react";
import { AbsoluteFill, Composition, staticFile } from "remotion";
import { brand, useBrandFonts } from "../../brand";
import type { Role } from "./RoleCard";
import { RoleSequence, roleSchedule } from "./RoleCard";
import type { ScoreStep } from "./ScoreFill";
import { ScoreFill } from "./ScoreFill";
import type { MorphState } from "./ShapeMorph";
import { ShapeMorph } from "./ShapeMorph";
import { Ground } from "./shared";

const B = brand("campusai");
const W = 1080;
const H = 1350;
const FPS = 30;
const VIEW = { x: 0, y: 0, w: W, h: H };
const PAGE = { w: 1440, h: 900 };

/* ---------------------------------------------------------------- RoleCard */

// Two real cards from the first screen of the Job Match capture (jobmatch.json boxes; text read off the same
// capture). The whole page stays in frame behind them, so the start and the end are the full page.
const FULL = { cx: 720, cy: 450, cw: 1440 };
const ROLES: Role[] = [
  {
    src: staticFile("pass/jobmatch.jpg"),
    page: PAGE,
    card: { x: 269, y: 382, w: 436, h: 195 },
    reason: "You have financial statement analysis and Excel, plus a credit internship and an investment fund role.",
    chips: ["✦ Strong match", "$110k/yr", "Closes Nov 1"],
    cam: FULL,
  },
  {
    src: staticFile("pass/jobmatch.jpg"),
    page: PAGE,
    card: { x: 269, y: 586, w: 436, h: 170 },
    reason: "You have financial statement analysis and Excel, plus a credit internship.",
    // this card shows no closing date, so its third chip is its own posted line
    chips: ["✦ Strong match", "$42-$46/hr", "Posted 3d ago"],
    cam: FULL,
  },
];
// the page at full width, centred in the portrait frame
const PAGE_VIEW = { x: 0, y: (H - (W * PAGE.h) / PAGE.w) / 2, w: W, h: (W * PAGE.h) / PAGE.w };
const ROLE_DUR = roleSchedule(ROLES, FPS, 14, 24, 45).total;

const RoleCardPreview: React.FC = () => {
  useBrandFonts(B);
  return (
    <AbsoluteFill>
      <Ground brand={B}>
        <RoleSequence brand={B} roles={ROLES} view={PAGE_VIEW} stage={VIEW} radius={0} gap={24} />
      </Ground>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------------- ScoreFill */

// Maya Chen's real profile strength, campusai-demo lib/backend/demo-fixtures.ts STRENGTH_MODEL: the
// "min" variant (just finished onboarding: Your basics + Photo) is 15, the "full" variant is 80. These are
// the components "full" adds, in the model's order, with their real points (Interests is the section label
// for its two 5-point parts). The next action at 80 is SECTION_CTA.academics, "Connect Canvas".
const STEPS: ScoreStep[] = [
  { label: "Interests", points: 10 },
  { label: "North Star", points: 15 },
  { label: "Preferred locations", points: 5 },
  { label: "Resume", points: 15 },
  { label: "Course history", points: 10 },
  { label: "Class and assignment tracking", points: 5 },
  { label: "Organizations", points: 5 },
];
const SCORE_DUR = 248;

const ScoreFillPreview: React.FC = () => {
  useBrandFonts(B);
  return (
    <AbsoluteFill>
      <Ground brand={B}>
        <ScoreFill
          brand={B}
          src={staticFile("pass/dashboard.jpg")}
          page={PAGE}
          view={VIEW}
          cams={[
            { t: 0, cam: { cx: 330, cy: 525, cw: 680 } },
            { t: 16, cam: { cx: 300, cy: 525, cw: 600 } },
          ]}
          chip={{ box: { x: 14, y: 851, w: 130, h: 41 }, ring: { cx: 36, cy: 871.5 }, name: "Maya Chen", next: "Connect Canvas" }}
          from={15}
          to={80}
          steps={STEPS}
          timing={{ lift: 14, firstStep: 50, stepGap: 18 }}
          present={{ x: 186, y: 250, s: 4.6 }}
          rows={{ x: 206, y: 520, gap: 78, size: 40 }}
        />
      </Ground>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------- ShapeMorph */

// Each state is the real component, measured on the pass captures (CSS px): events.json for the two
// calendar buttons, the header bell button ("6 new", dashboard.json), the Goldman card (jobmatch.json),
// and "Apply on company site" measured off job-goldman.jpg (it is a link, so it is not in the JSON).
const STATES: MorphState[] = [
  { w: 269, h: 34, radius: 8, label: "Add to CampusAI Calendar", look: "solid" },
  { w: 269, h: 36, radius: 8, label: "On your calendar", icon: "check", look: "tint" },
  { w: 83, h: 34, radius: 17, label: [{ text: "6", accent: true }, { text: " new" }], icon: "bell", iconAccent: true, look: "quiet", dx: 90, dy: -30 },
  { w: 436, h: 195, radius: 12, look: "quiet", image: { src: staticFile("pass/jobmatch.jpg"), page: PAGE, rect: { x: 269, y: 382, w: 436, h: 195 } } },
  { w: 189, h: 35, radius: 7, label: "Apply on company site", icon: "arrow", iconSide: "right", look: "solid", dx: -40, dy: 30 },
  { w: 0, h: 0, radius: 0, logo: true },
];
const BEATS = [6, 6, 4, 4, 7, 3];
const MORPH_DUR = 453;

const ShapeMorphPreview: React.FC = () => {
  useBrandFonts(B);
  return (
    <AbsoluteFill>
      <Ground brand={B}>
        <ShapeMorph brand={B} states={STATES} beats={BEATS} center={{ x: 540, y: 650 }} fill={{ w: 860, h: 600 }} maxScale={4.2} logoWidth={560} />
      </Ground>
    </AbsoluteFill>
  );
};

export const ReadoutRoot: React.FC = () => (
  <>
    <Composition id="Pass-RoleCard" component={RoleCardPreview} durationInFrames={ROLE_DUR} fps={FPS} width={W} height={H} />
    <Composition id="Pass-ScoreFill" component={ScoreFillPreview} durationInFrames={SCORE_DUR} fps={FPS} width={W} height={H} />
    <Composition id="Pass-ShapeMorph" component={ShapeMorphPreview} durationInFrames={MORPH_DUR} fps={FPS} width={W} height={H} />
  </>
);
