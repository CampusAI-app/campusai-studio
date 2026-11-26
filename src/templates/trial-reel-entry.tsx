// Remotion entry for the Light trial reel template (2026-11-25), kept out of Root.tsx.
//   npx remotion studio src/templates/trial-reel-entry.tsx
//   npx remotion render src/templates/trial-reel-entry.tsx Template-TrialReel-9x16 out/template-trial-reel-9x16.mp4 --gl=angle
// A new reel: copy trial-reel.example.json, change its captures, lines and boxes, and pass it with --props=<file>.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { TR_FPS, TR_W, TrialReel, resolveTrialReelProps, trialReelFrames, type TrialReelProps } from "./TrialReel";
import example from "./trial-reel.example.json";

const defaultProps = example as unknown as TrialReelProps;
// checks every file the reel names (missing optional sound or photo is left out; a missing capture says how to make it)
const calculateMetadata = async ({ props, compositionId }: { props: TrialReelProps; compositionId: string }) => {
  const resolved = await resolveTrialReelProps(props, compositionId);
  return { props: resolved, durationInFrames: trialReelFrames(resolved) };
};
const c = { component: TrialReel, fps: TR_FPS, width: TR_W, durationInFrames: trialReelFrames(defaultProps), defaultProps, calculateMetadata } as const;

const Root: React.FC = () => (
  <>
    <Composition id="Template-TrialReel-9x16" {...c} height={1920} />
    <Composition id="Template-TrialReel-4x5" {...c} height={1350} />
  </>
);

registerRoot(Root);
