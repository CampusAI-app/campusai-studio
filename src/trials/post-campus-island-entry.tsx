// Remotion entry for the Campus island post (2026-11-26, Muse 1918bcf7), kept out of Root.tsx.
// Render through the Node API with the public folder symlinked: node ../films/campus-island/render.mjs video <out.mp4>
import React from "react";
import { Composition, registerRoot } from "remotion";
import { ISLAND_FPS, ISLAND_FRAMES, PostCampusIsland } from "./post-campus-island";

const Root: React.FC = () => (
  <Composition id="PostCampusIsland-9x16" component={PostCampusIsland} durationInFrames={ISLAND_FRAMES} fps={ISLAND_FPS} width={1080} height={1920} />
);

registerRoot(Root);
