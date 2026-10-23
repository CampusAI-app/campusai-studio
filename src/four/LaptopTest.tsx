/**
 * Proof compositions for real-laptop.tsx. Not part of any film; registered only by
 * laptop-test-entry.ts so Root.tsx stays untouched.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { RealLaptop, laptopIntro, type CamKey, type RealLaptopProps } from "./real-laptop";

const BG = "#0b0708";

const Backdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(60% 38% at 50% 46%, rgba(217,32,46,0.20) 0%, rgba(217,32,46,0.06) 45%, rgba(11,7,8,0) 75%), ${BG}`,
    }}
  />
);

export const LAPTOP_TEST_FRAMES = 160;

/** The standard sequence: from above shut, opens, three-quarter hero, push-in. */
export const LaptopTest: React.FC<{ aspect: number }> = ({ aspect }) => {
  const { camera, lid } = laptopIntro({ aspect });
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Backdrop />
      <RealLaptop
        screen={{ image: "wall/D_jobs.jpg" }}
        camera={camera}
        lid={lid}
        focus={{ x: 0.5, y: aspect < 1 ? 0.47 : 0.5, radius: aspect < 1 ? 0.62 : 0.4 }}
        blur={[
          { at: 96, open: 0 },
          { at: 140, open: aspect < 1 ? 9 : 12 },
        ]}
      />
    </AbsoluteFill>
  );
};

/** A fixed pose, for probing the model: pass camera, lid, spin as props. */
export const LaptopProbe: React.FC<{ camera: Omit<CamKey, "at">; lid: number; spin?: number; finish?: RealLaptopProps["finish"] }> = ({ camera, lid, spin, finish }) => (
  <AbsoluteFill style={{ background: BG }}>
    <Backdrop />
    <RealLaptop screen={{ image: "wall/D_jobs.jpg" }} camera={camera} lid={lid} spin={spin} finish={finish} />
  </AbsoluteFill>
);
