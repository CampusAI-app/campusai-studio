// Remotion entry for wave 1's "Sunday night", so Root.tsx is not edited.
// npx remotion render src/wave1/sunday-night/entry.ts Sunday-4x5 out/w1/Sunday-4x5.mp4 --crf 16 --concurrency=2 --gl=angle
import React from "react";
import { Composition, registerRoot } from "remotion";
import { DURATION, FPS, H, SundayNight, W } from "./SundayNight";

const Root: React.FC = () =>
  React.createElement(Composition, { id: "Sunday-4x5", component: SundayNight, durationInFrames: DURATION, fps: FPS, width: W, height: H });

registerRoot(Root);
