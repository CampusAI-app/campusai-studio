/**
 * Effects from @mrcreates.ai's "17 effects" reel (2026-11-10), each its own look, each taking its content as props.
 * Samples: `samples.tsx`, rendered from `entry.ts` (Effect-Checklist, Effect-GlassType, Effect-CoverStory, Effect-UIWorld).
 * The six person effects (Orbit, CouchWall, FrameBreak, GreenScreen, DigitalZoom, Vertigo) take a person's clip and
 * their cutout (VP9 alpha webm). They were tested on footage that stays on Jacob's Mac, so they have no sample here.
 */
export { Checklist, checklistTimes } from "./Checklist";
export type { ChecklistItem, ChecklistProps } from "./Checklist";
export { GlassType, glassTimes } from "./GlassType";
export type { GlassTypeProps } from "./GlassType";
export { CoverStory, coverTimes } from "./CoverStory";
export type { CoverStoryProps } from "./CoverStory";
export { UIWorld, uiWorldTimes } from "./UIWorld";
export type { UIWorldPanel, UIWorldProps } from "./UIWorld";
export { Orbit, Still } from "./Orbit";
export type { OrbitProps, StillSource } from "./Orbit";
export { CouchWall } from "./CouchWall";
export type { CouchWallProps, WallPicture } from "./CouchWall";
export { FrameBreak } from "./FrameBreak";
export type { FrameBreakProps, FrameBreakEdge } from "./FrameBreak";
export { GreenScreen } from "./GreenScreen";
export type { GreenScreenProps } from "./GreenScreen";
export { DigitalZoom } from "./DigitalZoom";
export type { DigitalZoomProps, ZoomStep } from "./DigitalZoom";
export { Vertigo } from "./Vertigo";
export type { VertigoProps } from "./Vertigo";
export type { Capture, Crop } from "./shared";
