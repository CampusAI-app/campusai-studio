import React from "react";
import { AbsoluteFill, Composition, Img, registerRoot, staticFile, useCurrentFrame } from "remotion";
import { useZodiak } from "../../kit/parts";
import { ApplyBounce, APPLY_BOUNCE_DURATION } from "./ApplyBounce";

const BOX = { x: 741.67, y: 205.69, w: 189.45, h: 35.5 }; // screen CSS px in a 1440x900 frame
const S = 1.5;
const RECT = { x: 400, y: 900, w: BOX.w * S, h: BOX.h * S };

const Crop: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <Img src={staticFile("speedrun/run/f02020.jpg")} style={{
      position: "absolute", left: -BOX.x * S, top: -BOX.y * S, width: 1440 * S, height: 900 * S, maxWidth: "none",
    }} />
  </div>
);

const Scene: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0b0708" }}>
      <ApplyBounce f={f} dur={APPLY_BOUNCE_DURATION} rect={RECT}><Crop /></ApplyBounce>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <Composition id="Preview-ApplyBounce" component={Scene} width={1080} height={1920} fps={30} durationInFrames={APPLY_BOUNCE_DURATION} />
);

registerRoot(Root);
