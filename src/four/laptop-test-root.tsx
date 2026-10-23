import React from "react";
import { Composition } from "remotion";
import { LAPTOP_TEST_FRAMES, LaptopProbe, LaptopTest } from "./LaptopTest";

export const LaptopTestRoot: React.FC = () => (
  <>
    <Composition id="LaptopTest-9x16" component={LaptopTest} durationInFrames={LAPTOP_TEST_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ aspect: 1080 / 1920 }} />
    <Composition id="LaptopTest-16x9" component={LaptopTest} durationInFrames={LAPTOP_TEST_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ aspect: 1920 / 1080 }} />
    <Composition
      id="LaptopProbe"
      component={LaptopProbe}
      durationInFrames={1}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{ camera: { pos: [-52, 38, 92] as [number, number, number], target: [0, 6, -4] as [number, number, number], fov: 30 }, lid: 1, spin: 0, finish: "spaceBlack" as const }}
    />
  </>
);
