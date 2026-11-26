// Remotion entry for the Narrator type proof (2026-11-26, Muse 392a845c), kept out of Root.tsx.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { NARRATOR_FRAMES, ProofNarrator } from "./proof-narrator";

const Root: React.FC = () => (
  <Composition id="ProofNarrator-9x16" component={ProofNarrator} durationInFrames={NARRATOR_FRAMES} fps={30} width={1080} height={1920} />
);

registerRoot(Root);
