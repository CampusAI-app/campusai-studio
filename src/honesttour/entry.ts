/**
 * The honest campus tour's own Remotion entry (2026-11-05), so it never touches the shared styles entry.
 *   npx remotion render src/honesttour/entry.ts HonestTour-9x16 out/honest-tour.mp4
 * Footage: put the clips in public/honest-tour/ and set each stop's `footage` in HONEST_TOUR (HonestTour.tsx).
 * A stop without footage renders a grey stand-in that names the clip it needs.
 */
import React from "react";
import { Composition, registerRoot } from "remotion";
import { END_FRAMES } from "../styles/common";
import { HONEST_TOUR, HonestTour, honestEnd } from "./HonestTour";

/* eslint-disable @typescript-eslint/no-explicit-any */
const Root: React.FC = () =>
  React.createElement(Composition, {
    id: "HonestTour-9x16",
    component: HonestTour,
    defaultProps: HONEST_TOUR,
    durationInFrames: honestEnd(HONEST_TOUR) + END_FRAMES + 12,
    fps: 30,
    width: 1080,
    height: 1920,
  } as any);

registerRoot(Root);
