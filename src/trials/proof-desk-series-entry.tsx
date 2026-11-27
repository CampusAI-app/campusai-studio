// Remotion entry for the desk series proof (2026-11-27, Muse), kept out of Root.tsx.
//   npx remotion render src/trials/proof-desk-series-entry.tsx ProofDeskSeries-9x16 out/proof-desk-series.mp4
import React from "react";
import { Composition, registerRoot } from "remotion";
import { PDS_FPS, PDS_FRAMES, ProofDeskSeries } from "./proof-desk-series";

const Root: React.FC = () => (
  <Composition id="ProofDeskSeries-9x16" component={ProofDeskSeries} durationInFrames={PDS_FRAMES} fps={PDS_FPS} width={1080} height={1920} />
);

registerRoot(Root);
