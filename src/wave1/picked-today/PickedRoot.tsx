import React from "react";
import { Composition } from "remotion";
import { PickedToday, PICKED_FPS, PICKED_FRAMES, PICKED_SIZE } from "./PickedToday";

export const PickedRoot: React.FC = () => (
  <Composition id="Picked-9x16" component={PickedToday} durationInFrames={PICKED_FRAMES} fps={PICKED_FPS}
    width={PICKED_SIZE.width} height={PICKED_SIZE.height} />
);
