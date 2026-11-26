// Remotion entry for the Edge-turn card proof (2026-11-26, Muse d7d623c9), kept out of Root.tsx.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { EDGE_FRAMES, ProofEdgeTurn } from "./proof-edge-turn";

const Root: React.FC = () => (
  <Composition id="ProofEdgeTurn-4x5" component={ProofEdgeTurn} durationInFrames={EDGE_FRAMES} fps={30} width={1080} height={1350} />
);

registerRoot(Root);
