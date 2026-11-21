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

// From Claudian's Fable 5.2 résumé film (2026-11-16, films/claudian-checklist/facts.md): a card folds into a paper plane
// and lands where its result goes. Worked example: src/claudianchecklist/ (ClaudianChecklist-9x16).
export { FoldAway, foldAwayTimes, FOLD } from "./FoldAway";
export type { FoldAwayProps } from "./FoldAway";

// House look (2026-11-18, from @eightsenses.media's "4 speakers one skill" reel, instagram.com/reel/Df5QrYGkgiR, Muse
// Nov 18; our own build from the frames). One look (palette, caption, frosted card, italic serif accent, ring colour)
// applied to every clip in a series, and the reel's fanned-cards opener. Tested on Connyct footage, sample is private.
export { HOUSE_LOOKS, HOUSE_FONTS, houseLook } from "./houseLook";
export type { HouseLook, HouseLookName, HouseSans, HouseSerif } from "./houseLook";
export { HouseEdit, houseEditFrames, housePhrases, HOUSE_FAMILY } from "./HouseEdit";
export type { HouseEditProps, HouseCard, HouseRing } from "./HouseEdit";
export { SpeakerFan } from "./SpeakerFan";
export type { SpeakerFanProps } from "./SpeakerFan";

// Podcast edit (2026-11-18, from @eightsenses.media's "PODCAST edited this, not me" reel, instagram.com/reel/Df447Vfj36j,
// Muse Nov 18; our own builds from the frames, the paid skill was never bought or seen). Person effects take `clip`, the
// cutout `person` and a `frame`; each also exports its layer alone to stack on one person. Sample is private (Connyct).
export { DotGlobe, DotGlobeLayer, globeFormed } from "./DotGlobe";
export type { DotGlobeProps, GlobeSpec } from "./DotGlobe";
export { BehindWord, BehindWordLayer, behindTimes } from "./BehindWord";
export type { BehindWordProps, BehindWordSpec, BehindBeat } from "./BehindWord";
export { ReededTitle } from "./ReededTitle";
export type { ReededTitleProps } from "./ReededTitle";

// Talking-head edit (2026-11-18, from Shaan Johari's "I filmed this. Claude edited it." reel, instagram.com/reel/Df4TGYjEZLu,
// Muse Nov 18; read frame by frame, his breakdown is DM-gated and was never seen, so these are our own builds). FaceLock
// reads a 10 Hz face track from effects/scripts/facetrack.py. PlacedCaptions puts each line in an open spot clear of the
// face, other faces and the platform's own buttons (src/lib/platformUI.ts). Sample: CampusAI street interview, private.
export { FaceLock, FaceLockLayer, faceAt, statChars } from "./FaceLock";
export type { FaceLockProps, FaceLockSpec, FaceLockStat, FaceLockSub, FaceTrack, FaceSample, FaceBox } from "./FaceLock";
export { PlacedCaptions, PlacedCaptionsLayer, placeLines, lineTimes, autoLines, approxMeasure } from "./PlacedCaptions";
export type { PlacedCaptionsProps, PlacedCaptionsSpec, PlaceSpot, CaptionLine, Avoid, AvoidRect, PlacedLine } from "./PlacedCaptions";
export { MatteReveal, MatteLayer, MatteTitle, Silhouette, matteLook, matteState } from "./MatteReveal";
export type { MatteRevealProps, MatteMode, MatteTitleSpec } from "./MatteReveal";
export { GlowIn, GlowInLayer, GlowWordLayer, glowWhite } from "./GlowIn";
export type { GlowInProps, GlowInSpec, GlowWord } from "./GlowIn";
export { ArcWords, ArcWordsLayer, arcPlaces, trackAt } from "./ArcWords";
export type { ArcWordsProps, ArcSpec, ArcFace, FaceTrack as ArcTrack } from "./ArcWords";
export { RibbonWrap, RibbonLayer, RibbonTitleLayer, ribbonAround } from "./RibbonWrap";
export type { RibbonWrapProps, RibbonSpec, RibbonSeg, RibbonTitle } from "./RibbonWrap";

// Desk stage (2026-11-20, from XZE Creative's Notion spec film, instagram.com/reel/Df5Ozz2KVRR, Muse Nov 20; read frame
// by frame, our own build). A product film plays on a big monitor in a dark desk scene, camera locked off, the room lit
// by the screen. Code-drawn room by default; pass `plate` (a real filmed desk plus the screen's four corners) to pin the
// film onto real footage. The worked example (PostDeskStage-9x16, src/trials/) stays on Jacob's Mac with its captures.
export { ScreenStage, quadMatrix, DESK } from "./ScreenStage";
export type { ScreenStageProps, ScreenStagePlate, Quad, Pt } from "./ScreenStage";

// Word phone (2026-11-20, from DrillUp's "I turned a song into an iPhone" reel, instagram.com/reel/Df60v8ChJhT, Muse
// Nov 20; read frame by frame, the maker's method is comment-gated and was never seen, so this is our build). The words
// of the piece land as a drawn phone's own text (suggestion bar, search, notifications, a counter, the Dynamic Island,
// a pill that grows into an alert card) under one camera of whips, 3D tilts and push-ins, motion-blurred when fast.
// The phone is the student's, never CampusAI's (web only until the app ships). Worked example PostWordPhone-9x16
// (src/trials/) stays on Jacob's Mac with its voice and captures.
export { WordPhone, wordPhoneEvents, camAt as wordPhoneCamAt } from "./WordPhone";
export type { WordPhoneProps, PhoneScene, PhoneCam, PhoneNote, PhoneIsland, Spoken, SearchScene, LockScene, AlertScene, DialerScene } from "./WordPhone";

// Pastel launch (2026-11-20, from ClickUp's 3:30 launch film, x.com/wallstengine/status/2123809287814476146, Muse Nov 20;
// Jacob: "basically the exact same layout / flow / visuals ... but context of campus AI"). Read frame by frame, numbers
// measured off the frames (films/launch-film/system.md, local); our own build. A pastel void, dark product captures
// floating tilted in it, kinetic type that builds word by word with one huge gradient word per beat, the black
// "A way to ___ it." chapter card, and the glowing ask field. Worked example LaunchFilm-16x9 (src/trials/) stays local.
export {
  PastelVoid, KineticType, WordRow, BigWord, CaptionPill, FloatingScreen, ChapterCard, GlowPrompt, words as launchWords,
  LAUNCH, LAUNCH_GRADIENTS, LAUNCH_FONT, VOID_TINTS, gradientCss,
} from "./PastelLaunch";
export type { KWord, Pose, VoidTint } from "./PastelLaunch";
