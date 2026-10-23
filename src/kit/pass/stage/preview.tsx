/**
 * Previews for the stage group (motion pass, wave 0). Real captures only, the Maryland mark painted
 * out (public/pass/stage/*.jpg via cover-mark.py for the laptop screen; a DOM cover for ExplodedPage).
 */
import React from "react";
import { AbsoluteFill, Composition, Easing, staticFile } from "remotion";
import { brand } from "../../brand";
import { LaptopRoom, onScreen, roomPose, type RoomPreset } from "./LaptopRoom";
import { ExplodedPage, markCover, type ExplodeLayer } from "./ExplodedPage";
import type { CamKey } from "../../../four/real-laptop";

const B = brand("campusai");
export const W = 1080;
export const H = 1350;
export const FPS = 30;
const ASPECT = W / H;

/* LaptopRoom, lamp: three-quarter view drifting toward the screen, dashboard on the glass. */
export const LAPTOP_ROOM_FRAMES = 210;
const LAMP_CAM: CamKey[] = [
  { at: 0, ...roomPose([-0.6, 0.32, 0.73], [-1, 5, -3], 126) },
  { at: 196, ...onScreen(0.5, 0.5, 0.93, ASPECT), ease: Easing.bezier(0.42, 0, 0.5, 1) },
  { at: LAPTOP_ROOM_FRAMES, ...onScreen(0.5, 0.5, 0.945, ASPECT), ease: Easing.out(Easing.sin) },
];
export const LaptopRoomPreview: React.FC<{ preset?: RoomPreset }> = ({ preset = "lamp" }) => (
  <AbsoluteFill>
    <LaptopRoom screen={{ image: "pass/stage/dashboard.jpg" }} preset={preset} camera={LAMP_CAM} brand={B} />
  </AbsoluteFill>
);

/* LaptopRoom, night: low from the front right, pulling back around to the front, calendar on the glass. */
export const LAPTOP_NIGHT_FRAMES = 210;
const NIGHT_CAM: CamKey[] = [
  { at: 0, ...roomPose([0.46, 0.22, 0.86], [2.5, 6.5, -5], 124) },
  { at: 198, ...roomPose([-0.3, 0.27, 0.92], [0, 7, -5], 128), ease: Easing.bezier(0.42, 0, 0.5, 1) },
  { at: LAPTOP_NIGHT_FRAMES, ...roomPose([-0.33, 0.27, 0.91], [0, 7, -5], 130), ease: Easing.linear },
];
export const LaptopRoomNightPreview: React.FC = () => (
  <AbsoluteFill>
    <LaptopRoom screen={{ image: "pass/stage/calendar.jpg" }} preset="night" camera={NIGHT_CAM} brand={B} />
  </AbsoluteFill>
);

/* ExplodedPage: the Goldman detail comes apart into its four sections, then reassembles. Boxes from
   public/pass/job-goldman.json (heading y: 235, 394, 595, 767), lines are those headings' own text
   and the header's own match chip. */
export const EXPLODED_FRAMES = 255;
const GOLDMAN_LAYERS: ExplodeLayer[] = [
  { rect: { x: 731, y: 223, w: 646, h: 148 }, depth: 230, line: "Strong match", spark: true, radius: 10 },
  { rect: { x: 742, y: 377, w: 624, h: 202 }, depth: 170, line: "Why this fits you", spark: true, radius: 12 },
  { rect: { x: 742, y: 580, w: 624, h: 177 }, depth: 115, line: "About this role", radius: 4 },
  { rect: { x: 742, y: 758, w: 624, h: 42 }, depth: 60, line: "What they're looking for", radius: 4 },
];
export const ExplodedPagePreview: React.FC = () => (
  <ExplodedPage
    src={staticFile("pass/job-goldman.jpg")}
    page={{ w: 1440, h: 900 }}
    layers={GOLDMAN_LAYERS}
    cover={[markCover("rgb(29, 20, 21)")]}
    brand={B}
  />
);

export const StageRoot: React.FC = () => (
  <>
    <Composition id="Pass-LaptopRoom" component={LaptopRoomPreview} durationInFrames={LAPTOP_ROOM_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Pass-LaptopRoomNight" component={LaptopRoomNightPreview} durationInFrames={LAPTOP_NIGHT_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Pass-ExplodedPage" component={ExplodedPagePreview} durationInFrames={EXPLODED_FRAMES} fps={FPS} width={W} height={H} />
  </>
);
