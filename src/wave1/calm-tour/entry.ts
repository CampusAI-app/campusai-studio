// Separate Remotion entry for the calm tour (wave 1), so Root.tsx is not edited.
// npx remotion render src/wave1/calm-tour/entry.ts Tour-16x9 out/w1/Tour-16x9.mp4 --crf 16 --concurrency=2 --gl=angle
import React from "react";
import { Composition, registerRoot } from "remotion";
import { CalmTour, DURATION, FPS, H, W } from "./CalmTour";

const CalmTourRoot: React.FC = () =>
  React.createElement(Composition, { id: "Tour-16x9", component: CalmTour, durationInFrames: DURATION, fps: FPS, width: W, height: H });

registerRoot(CalmTourRoot);
