// Separate Remotion entry for the sound preview, so Root.tsx is not edited.
// npx remotion render src/system/sound/entry.ts SoundPreview out/sound/SoundPreview.mp4
import React from "react";
import { Composition, registerRoot } from "remotion";
import { PREVIEW, SoundPreview } from "./preview";

const SoundRoot: React.FC = () =>
  React.createElement(
    React.Fragment,
    null,
    React.createElement(Composition, { id: "SoundPreview", component: SoundPreview, ...PREVIEW, defaultProps: { music: true } }),
    React.createElement(Composition, { id: "SoundPreview-cues", component: SoundPreview, ...PREVIEW, defaultProps: { music: false } }),
  );

registerRoot(SoundRoot);
