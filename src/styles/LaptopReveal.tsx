/**
 * /laptop-reveal (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). The product revealed on a real laptop: the shut laptop sits low in frame, the lid swings open on its hinge
 * as the camera rises from the desk to the three-quarter hero, and the screen is already playing a real desktop
 * recording; the camera then pushes in toward the screen while the recording runs. Desktop only (Jacob 11/06: no
 * phone screens), the device is `four/real-laptop.tsx` (photoreal, never the drawn Laptop3D), the screen a real
 * capture. Renders need `--gl=angle`.
 */
import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { RealLaptop, type CamKey } from "../four/real-laptop";
import { CURVE, DUR, readHold } from "../system/motion";
import { loadFont as DISPLAYFont } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as TEXTFont } from "@remotion/google-fonts/Manrope";
import { Cue, ramp } from "./common";
import { Heading, World } from "./world";

// rebuilt 11/08 as its own world: a warm blush desk under daylight, the caption in Instrument Serif
const { fontFamily: DISPLAY } = DISPLAYFont("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: TEXT } = TEXTFont("normal", { weights: ["500", "700"], subsets: ["latin"] });
const INK = "#3A0E12";

export type LaptopRevealProps = {
  title: string;
  /** A real desktop recording as a frame list (paths under public/), sampled at 30 fps. */
  frames: string[];
  caption: string;
  source: string;
  cta?: string;
};

const FPS = 30;
const OPEN = 42; // motion: frames for the lid to swing open while the camera rises
export const laptopEnd = (p: LaptopRevealProps) => Math.max(p.frames.length - 6, OPEN + 60 + Math.round((readHold(p.caption) + 0.6) * FPS));

export const LaptopReveal: React.FC<LaptopRevealProps> = (p) => {
  const f = useCurrentFrame();
  const { height } = useVideoConfig();
  const end = laptopEnd(p);
  const ease = Easing.bezier(0.4, 0, 0.2, 1);
  // the camera: low at the desk's front edge, rising to the hero, then a slow push toward the glass
  // framed for a vertical frame: the hero distance roughly doubled so the whole laptop fits the narrow width
  const camera: CamKey[] = [
    { at: 0, pos: [0, 10, 150], target: [0, 4, 0], fov: 32 },
    { at: OPEN + 6, pos: [-60, 52, 150], target: [0, 8, -4], fov: 30, ease },
    { at: end, pos: [-38, 34, 112], target: [0, 9, -8], fov: 30, ease },
  ];
  const capAt = OPEN + 30;
  const cap = ramp(f, capAt, capAt + DUR.arrive, CURVE.quiet.enter);
  return (
    <World endAt={end} cta={p.cta} font={DISPLAY} fontWeight={400} ink="#FFEDE4" logo="dark" endLogo="white" logoSpot="top-right" end="wipe-left" endGround="#3A0E12" ground="radial-gradient(ellipse 90% 60% at 50% 45%, #F7DCD2 0%, #E8BBAE 60%, #C98E80 100%)">
      <Heading font={DISPLAY} color={INK} size={88} weight={400} tracking="-0.01em" out={end}>{p.title}</Heading>
      <AbsoluteFill style={{ top: -height * 0.04 }}>
        <RealLaptop screen={{ frames: p.frames, fps: FPS, startAt: 0 }} camera={camera} lid={[{ at: 4, open: 0 }, { at: OPEN, open: 1, ease }]} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.7, fontFamily: DISPLAY, fontWeight: 400, fontSize: 64, lineHeight: 1.1, color: INK,
        opacity: cap, transform: `translateY(${(1 - cap) * 14}px)` }}>{p.caption}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.7 + 200, fontFamily: TEXT, fontSize: 32, color: INK, opacity: ramp(f, capAt + 12, capAt + 24) }}>{p.source}</div>
      <Cue at={4} name="paper-slide" volume={0.35} />
      <Cue at={OPEN - 6} name="switch-tap" volume={0.4} />
    </World>
  );
};
