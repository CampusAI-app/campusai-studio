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

// From Skill Stack Store's "20 Claude Effects in 20 Secs" (2026-11-15, Muse, Base 1056). Our own builds from the reel,
// watched frame by frame (films/effects-skillstack/facts.md); the paid skill was never bought or seen. Person effects take
// `clip` and the cutout `person` (or `matte`). Tested on footage that stays on Jacob's Mac, so no sample is in the repo.
export { InkScreen, framedStyle, framedPoint } from "./InkScreen";
export type { InkScreenProps, Framing } from "./InkScreen";
export { grabFrame, framingOf, drawFramed } from "./frameGrab";
export { PressFont, PressPage } from "./PressFont";
export type { PressFontProps, PressPageProps } from "./PressFont";
export { ImpactFrame } from "./ImpactFrame";
export type { ImpactFrameProps } from "./ImpactFrame";
export { BankNote } from "./BankNote";
export type { BankNoteProps } from "./BankNote";
export { LetterDive } from "./LetterDive";
export type { LetterDiveProps } from "./LetterDive";
export { PaperTear } from "./PaperTear";
export type { PaperTearProps } from "./PaperTear";
export { LayerExplode } from "./LayerExplode";
export type { LayerExplodeProps } from "./LayerExplode";
export { CloneRow } from "./CloneRow";
export type { CloneRowProps, ClonePair } from "./CloneRow";
export { DayDial } from "./DayDial";
export type { DayDialProps } from "./DayDial";
export { CodeBody } from "./CodeBody";
export type { CodeBodyProps } from "./CodeBody";
export { PostWall } from "./PostWall";
export type { PostWallProps } from "./PostWall";
export { SketchWords } from "./SketchWords";
export type { SketchWordsProps } from "./SketchWords";
export { HeadStack } from "./HeadStack";
export type { HeadStackProps } from "./HeadStack";
export { BlowAway } from "./BlowAway";
export type { BlowAwayProps } from "./BlowAway";
export { LiveCursor } from "./LiveCursor";
export type { LiveCursorProps } from "./LiveCursor";
export { CommentDrop } from "./CommentDrop";
export type { CommentDropProps, CaptionWord } from "./CommentDrop";
export { BladeSlice } from "./BladeSlice";
export type { BladeSliceProps } from "./BladeSlice";
export { PredictKeys } from "./PredictKeys";
export type { PredictKeysProps } from "./PredictKeys";
export { RackFocus } from "./RackFocus";
export type { RackFocusProps, FocusTarget } from "./RackFocus";
export { VoiceNote } from "./VoiceNote";
export type { VoiceNoteProps } from "./VoiceNote";

// From the Nov 15 trials of React Postprocessing and PixelFX (Muse), ported Nov 16 after Jacob approved them.
// Samples: Effect-GlowFocus and Effect-PixelBurst in samples.tsx, on captures in public/sys/ (local, not in the repo).
export { GlowFocus } from "./GlowFocus";
export type { GlowFocusProps, GlowSpot } from "./GlowFocus";
export { PixelBurst } from "./PixelBurst";
export type { PixelBurstProps } from "./PixelBurst";
