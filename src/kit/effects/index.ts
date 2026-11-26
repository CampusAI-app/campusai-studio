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

// One take (2026-11-21, from Ilias Miah's Kestrel notifications film, instagram.com/reel/Df8Nh5iBFPO, Muse Nov 21; Jacob:
// "I love how this video looks for motion design"). Read frame by frame; our own build. Real captures as planes at their
// own depths and tilts in a pale void, one camera through them with no cuts (push-in that squares the target plane,
// lateral slides, the pull back to the opening frame for a loop), focus handed over by depth, an operated arrow with a
// press ring, and in-place state changes from real recordings. Worked example PostOneTake-4x5 (src/trials/) stays local.
export { OneTake, ONE_TAKE, oneTakeCam, planePoint, project as oneTakeProject } from "./OneTake";
export type { Plane as OneTakePlane, PlaneContent as OneTakeContent, CamKey as OneTakeKey, PointerKey as OneTakePointer } from "./OneTake";

// Section frame (2026-11-21, from Sultan Mahmud's (@sultanmotions, Sleeko) HowDo explainer breakdown,
// instagram.com/reel/DcLzGYovY9B, Muse Nov 21; Jacob: "I love this"). Read frame by frame; our own build in CampusAI's
// brand. A film inside a rounded card over the warm near-black ground with the red light from below, four labelled pills
// (Intro, Problem, Use Case, Call to Action) whose near-black highlight and red playhead advance with the sections, and a
// tick ruler. Worked example PostFitExplainerFrame-4x5 (src/trials/) stays local.
export { SectionFrame, SECTION_FRAME, sectionsFor } from "./SectionFrame";
export type { Section as SectionFrameSection } from "./SectionFrame";

// Keynote deck parts (2026-11-24, from bemx.studio's RunInfra launch film, instagram.com/reel/DgGtZyFKcLY, Muse Nov 24;
// Jacob: "do the same for campusai"). Read frame by frame; our own build. PixelDissolve breaks one scene into accent blocks
// that sweep across and leave the next behind (the deck's signature at open, middle and close). HandleHighlight marks one
// phrase or one piece of UI the way a design tool marks a selected object: a box with tiny square corner handles.
// Worked example PostKeynoteMonitor-9x16 (src/trials/, on ScreenStage) stays local.
export { PixelDissolve } from "./PixelDissolve";
export type { PixelDissolveProps } from "./PixelDissolve";
export { HandleHighlight } from "./HandleHighlight";
export type { HandleHighlightProps } from "./HandleHighlight";

// Living map parts (2026-11-24, from Gur's Waze brand film "The Living Map", instagram.com/reel/Df4eC2iIxQC, Muse Nov 24;
// Jacob: "how do we do this for campusAI"). PortraitFilmstrip: real people cut out onto flat colour cards on one strip
// sliding right to left, their own words in a chip, a giant word passing behind. ChipSentence: a huge sentence with the
// product's own UI cards set inside the words, chips popping around it, a colour flood turning the type. Worked example
// PostLivingCampus-16x9 (src/trials/) stays local.
export { PortraitFilmstrip } from "./PortraitFilmstrip";
export type { PortraitFilmstripProps, FilmstripCard } from "./PortraitFilmstrip";
export { ChipSentence } from "./ChipSentence";
export type { ChipSentenceProps, SentencePart, FloatChip } from "./ChipSentence";

// Presenter demo parts (2026-11-24, from Alex Prompter's Cicada demo, instagram.com/reel/DgFw8w-xrJD, Muse Nov 24;
// Jacob: "we should do one like this but for campusai"). CartoonPresenter: CampusAI's one recurring cartoon student
// (Open Peeps, CC0), bottom centre for a whole film, four poses (point, shrug, hold, proud) swapped on the beats.
// KaraokeKeyword: captions building word by word at the top, the key word in italic serif inside a red box with corner
// handles; takes word timings when there is a voice. Worked example PostPresenterDemo-9x16 (src/trials/) stays local.
export { CartoonPresenter } from "./CartoonPresenter";
export type { CartoonPresenterProps, PresenterPose } from "./CartoonPresenter";
export { KaraokeKeyword } from "./KaraokeKeyword";
export type { KaraokeKeywordProps, KaraokePhrase } from "./KaraokeKeyword";

// LivePart (2026-11-24, round 2 of the keynote film after Jacob's note "It's clearly a screenshot... I like showing the
// data flowing"). A real product card cut out of the demo (empty frame, full card, each row's box, each number re-shot
// through its count; captured by a script like films/post-keynote-monitor/capture-parts.mjs) played back arriving:
// the frame lands, the rows fill in one by one, numbers count up, bars draw. Worked example PostKeynoteMonitor-9x16.
export { LivePart, liveTimes, readingOrder } from "./LivePart";
export type { LiveLine, LiveManifest, LiveTiming } from "./LivePart";

// Storyboard vs final (2026-11-24, from bemx.studio's "Storyboard vs. Final" reel for Linear, Muse Nov 24; Jacob: "follow
// this for campusai"). Read frame by frame; our own build. The rough storyboard runs as a tilted strip above the finished
// film in a rounded card, in sync, with a dotted progress line under it; any film can be wrapped. The Rough* pieces sketch
// honest boards in a few lines. Worked example PostStoryboardFinal-4x5 (src/trials/) stays local.
export { StoryboardVsFinal, STORYBOARD_VS_FINAL, RoughBoard, RoughText, RoughBox, RoughPill, RoughBlock, RoughArrow } from "./StoryboardVsFinal";
export type { StoryBoard } from "./StoryboardVsFinal";

// Constant motion (2026-11-24, Muse: bemx.studio's Lovable promo, Jacob: "always something moving to catch ur eye on").
// Read frame by frame; our own build. Inline bloom, a drawing "?", an oversized gradient cursor, real pieces storming
// in and settling. Worked example PostConstantMotion-9x16 (src/trials/, on ScreenStage) stays local.
export { GradientCursor, InlineBloom, DrawQuestion, PieceStorm, typed, CONSTANT_MOTION } from "./ConstantMotion";
export type { StormPiece } from "./ConstantMotion";

// Kinetic confession (2026-11-25, Muse: Adrian's spec film for Bitstack, Jacob: "I LOVE THIS"). Read frame by frame; our
// own build. Banners landing in one slot and pushing the pile up, a boiling marker, a word that curls into a ring around
// another, coin-flipping letter tiles. Worked example PostFriendStory-9x16 (src/trials/) stays local.
export { NoticeStack, BoilMarker, OrbitWord, FlipTile, KINETIC_CONFESSION } from "./KineticConfession";
export type { Notice } from "./KineticConfession";

// Desk flow (2026-11-25, Muse: XZE Creative's "Flow.ai" spec film, instagram.com/reel/DgHAfQtI8GM; Jacob: "I want one
// almost exact like this"). Read frame by frame; our own build. The screen moves of a film played on one monitor in a
// dark room (use with ScreenStage): ribbon sweep, the spark tumbling in with the wordmark typed beside it, the hook in a
// glowing pill, cards bending into a spinning ring. Worked example PostDeskFlow-9x16 (src/trials/) stays local.
export { RibbonSweep, Spark3D, SparkLockup, GlowPill, VortexRing, measureLine, SPARK_D, SPARK_HOME, WORDMARK, WORDMARK_LETTERS, DESK_FLOW } from "./DeskFlow";
export type { VortexItem } from "./DeskFlow";

// From Ildari's Strava concept ad (2026-11-25, Muse): a walk on a real campus map with a live bar. Reuse for the Campus Map film.
export { CampusWalk, WalkFigure, RunFigure, clockText } from "./CampusWalk";
export type { CampusWalkProps, WalkWorld } from "./CampusWalk";

// From Roshan Studio's Kinso launch film (2026-11-25, Muse: "lets remake this almost exactly for campusai"): the whole
// film on one curved ultrawide in a warm dark room, a pill of app icons standing in a word as a letter, the halftone
// "Woah" card, the highlight and bar sweeps, the outline mark, a counter, the orb. Worked example PostKinso-9x16 stays local.
export { UltrawideRoom, ULTRAWIDE, GradientField, PillWord, Halftone, HalftoneCard, HighlightSweep, BarSweep, StrokeMark, CountUp, Orb, Crosshair, CornerTicks, SL } from "./ScreenLaunch";
export type { PillIcon } from "./ScreenLaunch";

// Island morph, Edge-turn card, Narrator type (2026-11-26, three Muse sends: dnyx's Find My Dynamic Island, Studio Size's
// Medallia system slide 9, John Stark's Spline explainer). Read frame by frame; our own builds. Worked examples:
// src/trials/post-campus-island.tsx (PostCampusIsland-9x16), proof-edge-turn.tsx, proof-narrator.tsx (own entry files).
export { IslandMorph, IslandWords, IslandPin, IslandComet, IslandFlash, IslandParticleLogo, islandProject, ISLAND } from "./IslandMorph";
export type { IslandState, IslandTilt } from "./IslandMorph";
export { EdgeTurnCard, GrowBars, StatTile, edgeTurnTimes, EDGE_TURN } from "./EdgeTurnCard";
export type { EdgePage, Bar as EdgeBar } from "./EdgeTurnCard";
export { NarratorType, narratorTimes, NARRATOR } from "./NarratorType";
export type { NarratorBeat, NarratorWord } from "./NarratorType";

// Nov 26 Muse pass (Lucius's frame-by-frame watch notes; our own builds). PhoneMove: the phone as the subject, every scene
// change a move of the phone (rise, roll away, lay flat, a card lifting out, the spin edge-on, chips orbiting in), from
// thejimmy.vision's NestPay walkthrough. PillType: a typed line with the key word in a filled pill, and the pill funnel,
// from thejimmy.vision's Pulse explainer. InlineIcon: a real app icon dropping into a gap in the headline, from Halmarr's
// Placed film. FrostDepth: the warm mesh world and frosted cards in depth, from Halmarr's JustPaid film. Worked examples:
// PostPhoneWalk-9x16 and the three *-Proof-9x16 clips (src/phonewalk/, entry src/phonewalk/entry.ts; captures stay local).
export { Phone3D, PhoneStage, PhoneShadow, ScreenPx, PressRing, poseAt, poseBlur, phoneMetrics, focusOn, PHONE_EASE, CAPTURE as PHONE_CAPTURE } from "./PhoneMove";
export type { PhonePose, PoseState } from "./PhoneMove";
export { PillType, PillFunnel } from "./PillType";
export type { PillRun, FunnelStep } from "./PillType";
export { InlineIcon } from "./InlineIcon";
export { MeshWorld, FrostCard } from "./FrostDepth";
