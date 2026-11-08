/**
 * Your campus guide: its own Remotion entry (2026-11-05), so it never touches the shared styles entry.
 *   npx remotion render src/campusguide/entry.ts CampusGuide-9x16 out/campus-guide/CampusGuide-9x16.mp4
 * Footage: put the clips in public/campus-guide/ and set each stop's `footage` in CAMPUS_GUIDE (CampusGuide.tsx).
 */
import React from "react";
import { Composition, registerRoot } from "remotion";
import { END_FRAMES } from "../styles/common";
import { CAMPUS_GUIDE, CampusGuide, guideEnd } from "./CampusGuide";

/* eslint-disable @typescript-eslint/no-explicit-any */
const Root: React.FC = () =>
  React.createElement(Composition, {
    id: "CampusGuide-9x16",
    component: CampusGuide,
    defaultProps: CAMPUS_GUIDE,
    durationInFrames: guideEnd(CAMPUS_GUIDE) + END_FRAMES + 12,
    fps: 30,
    width: 1080,
    height: 1920,
  } as any);

registerRoot(Root);
