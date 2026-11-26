import React from "react";
import { Composition } from "remotion";
import { CollegeLife, FPS, TOTAL_S } from "./CollegeLife";

// Muse pass 2026-11-25, booqra. Register this folder's compositions here only.
// The plan marks come from public/muse1125-booqra/flow-plan/frames.json (recorded Nov 25).
const PLAN = { ask: 1.806, plan: 23.7428, presstime: 33.0847 };

export const MuseBooqraRoot: React.FC = () => (
  <>
    <Composition id="MuseBooqra-CollegeLife-9x16" component={CollegeLife} durationInFrames={Math.round(TOTAL_S * FPS)} fps={FPS} width={1080} height={1920}
      defaultProps={{ plan: PLAN, standStill: "f00404.jpg", voice: true }} />
    <Composition id="MuseBooqra-CollegeLifeText-9x16" component={CollegeLife} durationInFrames={Math.round(TOTAL_S * FPS)} fps={FPS} width={1080} height={1920}
      defaultProps={{ plan: PLAN, standStill: "f00404.jpg", voice: false }} />
  </>
);
