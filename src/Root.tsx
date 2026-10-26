import { SpeedrunFilm, SPEEDRUN_FPS, SPEEDRUN_FRAMES, SPEEDRUN_SIZE } from "./speedrun/SpeedrunFilm";
import { HowToFilm, HOWTO_FPS, HOWTO_FRAMES, HOWTO_SIZE } from "./speedrun/HowToFilm";
import "./index.css";

// src/private is gitignored; each file there that exports `Compositions` registers itself (see its README).
declare const require: { context(dir: string, deep: boolean, match: RegExp): { keys(): string[]; (key: string): { Compositions?: React.FC } } };
const privateFilms = require.context("./private", false, /\.tsx$/);
const PRIVATE = privateFilms.keys().flatMap((k) => privateFilms(k).Compositions ?? []);
import React from "react";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { DemoVideo, DemoVideoProps } from "./DemoVideo";
import { ChatVideo, chatVideoFrames } from "./ChatVideo";
import { HeroStill } from "./HeroStill";
import { CampusWall, WALL_FPS, WALL_FRAMES } from "./CampusWall";
import { CampusStory, STORY_FPS, STORY_FRAMES } from "./CampusStory";
import { CampusLaptop, LAPTOP_FPS, LAPTOP_FRAMES } from "./CampusLaptop";
import { CampusChat, CHAT_POST_FPS, chatPostFrames } from "./CampusChat";
import { JobMatchFilm, jobMatchFrames } from "./JobMatchFilm";
import { KitReel, KIT_FPS, KIT_FRAMES, KIT_SIZE } from "./KitReel";
import { MorningFilm, MORNING_FPS, MORNING_FRAMES, MORNING_SIZE } from "./MorningFilm";
import { SpotlightFilm, SPOTLIGHT_FPS, SPOTLIGHT_FRAMES, SPOTLIGHT_SIZE } from "./four/SpotlightFilm";
import { SwapFilm, SWAP_FPS, SWAP_FRAMES, SWAP_SIZE } from "./four/SwapFilm";
import { WeekFilm, WEEK_FPS, WEEK_FRAMES, WEEK_SIZE } from "./four/WeekFilm";
import { RegistrationFilm, REGISTRATION_FPS, REGISTRATION_FRAMES, REGISTRATION_SIZE } from "./four/RegistrationFilm";

/* The chat film's frame rate, in ONE place. Every beat in ChatVideo is authored
   in milliseconds and every sequence boundary is derived from this number, so
   raising it to 60 (where X caps) re-renders the same film with twice the
   samples and needs no other edit. Do not hand-double constants in a scene. */
const CHAT_FPS = 30;

/* The Job Match rebuild's frame rate, in ONE place, same contract. */
const JOBMATCH_FPS = 30;
import { ClubsVideo, CLUBS_VIDEO_FRAMES } from "./ClubsVideo";
import { SpotlightHeroCard, SPOTLIGHT_HERO_CARD_DURATION } from "./shots/spotlight-hero-card/SpotlightHeroCard";
import { FlockFilm, FLOCK_FPS, FLOCK_FRAMES, FLOCK_SIZE } from "./flock/FlockFilm";
import { CampusFilm, CAMPUS_FPS, CAMPUS_FRAMES, CAMPUS_SIZE } from "./campus/CampusFilm";
import { BingoFilm, BINGO_FPS, BINGO_FRAMES, BINGO_SIZE } from "./bingo/BingoFilm";
import { WrappedFilm, WRAPPED_FPS, WRAPPED_FRAMES, WRAPPED_SIZE } from "./wrapped/WrappedFilm";
import { NoticesFilm, NOTICES_FPS, NOTICES_FRAMES, NOTICES_SIZE } from "./notices/NoticesFilm";
import { SpringFilm, SPRING_FPS, SPRING_FRAMES, SPRING_SIZE } from "./spring/SpringFilm";
import { LeftOnReadFilm, LEFT_ON_READ_FPS, LEFT_ON_READ_FRAMES, LEFT_ON_READ_SIZE } from "./leftonread/LeftOnReadFilm";
// Motion pass, wave 1 (2026-10-23): the five storyline films. Each also has its own entry in src/wave1/<film>/.
import { CalmTour, DURATION as TOUR_FRAMES, FPS as TOUR_FPS, W as TOUR_W, H as TOUR_H } from "./wave1/calm-tour/CalmTour";
import { AskFriend, DURATION as ASK_FRAMES, FPS as ASK_FPS, W as ASK_W, H as ASK_H } from "./wave1/ask-friend/AskFriend";
import { SundayNight, DURATION as SUNDAY_FRAMES, FPS as SUNDAY_FPS, W as SUNDAY_W, H as SUNDAY_H } from "./wave1/sunday-night/SundayNight";
import { PickedRoot } from "./wave1/picked-today/PickedRoot";
import { InsideMatchRoot } from "./wave1/inside-match/InsideMatch";
import { getVideoDuration } from "./lib/getVideoDuration";
import { StudySpotFilm, STUDY_FRAMES, STUDY_FPS, STUDY_SIZE } from "./studyspot/StudySpot";
import { OneShape, DURATION as ONE_SHAPE_FRAMES, FPS as ONE_SHAPE_FPS, W as ONE_SHAPE_W, H as ONE_SHAPE_H } from "./wave2a/one-shape/OneShape";
import { Letters, DURATION as LETTERS_FRAMES, FPS as LETTERS_FPS, W as LETTERS_W, H as LETTERS_H } from "./wave2a/letters/Letters";
import {
  JOB_MATCH_11,
  JOB_MATCH_169,
  JOB_MATCH_45,
  JOB_MATCH_916,
  RESUME_COACH_916,
  RESUME_COACH_45,
  RESUME_COACH_169,
  JOB_MATCH_916_FRAMES,
  SCRIPT,
} from "./script";

/**
 * Resolves every scene's length, then the total, accounting for the fact that
 * a crossfade overlaps two scenes and therefore shortens the timeline.
 */
const calculateMetadata: CalculateMetadataFunction<DemoVideoProps> = async ({
  props,
}) => {
  const { script } = props;

  const resolvedDurations = await Promise.all(
    script.scenes.map(async (scene) => {
      if (scene.type !== "footage") return scene.durationInFrames;
      if (scene.durationInFrames !== "auto") return scene.durationInFrames;

      try {
        const seconds = await getVideoDuration(
          staticFile(`footage/${scene.src}`),
        );
        const total = Math.floor(seconds * script.fps);
        const usable = total - (scene.trimStart ?? 0);
        // Guard against a bad probe returning something nonsensical.
        return usable > 1 ? usable : script.fallbackFootageFrames;
      } catch {
        return script.fallbackFootageFrames;
      }
    }),
  );

  const sum = resolvedDurations.reduce((a, b) => a + b, 0);
  const overlap = script.transitionFrames * Math.max(0, script.scenes.length - 1);

  return {
    durationInFrames: Math.max(1, sum - overlap),
    fps: script.fps,
    width: script.width,
    height: script.height,
    props: { ...props, resolvedDurations },
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Post 1 — Job Match. 4:5 is the primary: it is the tallest an Instagram
          feed post can be without being a Reel, and it gives the card a natural
          band underneath for the caption. The other two render from the same
          script and the same captures at no extra authoring cost, because we
          are composing card-shaped art rather than cropping a screen capture. */}
      {(
        [
          ["ResumeCoach-9x16", RESUME_COACH_916],
          ["ResumeCoach-4x5", RESUME_COACH_45],
          ["ResumeCoach-16x9", RESUME_COACH_169],
          ["JobMatch-9x16", JOB_MATCH_916],
          ["JobMatch-4x5", JOB_MATCH_45],
          ["JobMatch-16x9", JOB_MATCH_169],
          ["JobMatch-1x1", JOB_MATCH_11],
          // Frame export only, never rendered to video.
          ["JobMatch-9x16-Frames", JOB_MATCH_916_FRAMES],
        ] as const
      ).map(([id, script]) => (
        <Composition
          key={id}
          id={id}
          component={DemoVideo}
          durationInFrames={300}
          fps={script.fps}
          width={script.width}
          height={script.height}
          defaultProps={{ script, resolvedDurations: [] }}
          calculateMetadata={calculateMetadata}
        />
      ))}
      {/* CampusAI "ask anything" chat film. Its own composition rather than a
          script.ts scene: it is full-bleed footage under a camera chain, not
          the card-shaped scene model the other posts use, and folding it in
          would have dragged their script around for no gain. */}
      {(
        [
          ["ChatAsk-16x9", 1920, 1080, "dark"],
          ["ChatAsk-16x9-Light", 1920, 1080, "light"],
        ] as const
      ).map(([id, cw, ch, mode]) => (
        <Composition
          key={id}
          id={id}
          component={ChatVideo}
          durationInFrames={chatVideoFrames(CHAT_FPS)}
          fps={CHAT_FPS}
          width={cw}
          height={ch}
          defaultProps={{ mode }}
        />
      ))}
      {/* CampusAI wall loop, 2026-10-16. Silent, seamless 10s loop of the
          Instagram / LinkedIn wall graphic. Line a = "Your student operating
          system", line b = "Every part of college, connected". */}
      {(
        [
          ["CampusWall-4x5", 1080, 1350],
          ["CampusWall-9x16", 1080, 1920],
          ["CampusWall-16x9", 1920, 1080],
        ] as const
      ).map(([id, cw, ch]) => (
        <Composition
          key={id}
          id={id}
          component={CampusWall}
          durationInFrames={WALL_FRAMES}
          fps={WALL_FPS}
          width={cw}
          height={ch}
          defaultProps={{ line: "a" as const }}
        />
      ))}
      {/* CampusAI story cut, 2026-10-16: the wall with the words building and a
          real card lifting per word. Instagram cuts end on "Link in bio", the
          LinkedIn 16:9 holds on the logo and line. */}
      {(
        [
          ["CampusStory-4x5", 1080, 1350, "ig"],
          ["CampusStory-9x16", 1080, 1920, "ig"],
          ["CampusStory-16x9", 1920, 1080, "linkedin"],
        ] as const
      ).map(([id, cw, ch, ending]) => (
        <Composition
          key={id}
          id={id}
          component={CampusStory}
          durationInFrames={STORY_FRAMES}
          fps={STORY_FPS}
          width={cw}
          height={ch}
          defaultProps={{ ending }}
        />
      ))}
      {/* CampusAI post 1, "What CampusAI actually is", 2026-10-16: one laptop,
          the camera moving across its screen, two-beat words per screen. */}
      {(
        [
          ["CampusLaptop-9x16", 1080, 1920, "ig"],
          ["CampusLaptop-4x5", 1080, 1350, "ig"],
          ["CampusLaptop-16x9", 1920, 1080, "linkedin"],
        ] as const
      ).map(([id, cw, ch, ending]) => (
        <Composition
          key={id}
          id={id}
          component={CampusLaptop}
          durationInFrames={LAPTOP_FRAMES}
          fps={LAPTOP_FPS}
          width={cw}
          height={ch}
          defaultProps={{ ending }}
        />
      ))}
      {/* CampusAI post 2, "What can CampusAI do that ChatGPT can't?", 2026-10-16:
          three real chat recordings, each under a big line. */}
      {(
        [
          ["CampusChat-9x16", 1080, 1920],
          ["CampusChat-4x5", 1080, 1350],
        ] as const
      ).map(([id, cw, ch]) => (
        <Composition
          key={id}
          id={id}
          component={CampusChat}
          durationInFrames={chatPostFrames(cw, ch)}
          fps={CHAT_POST_FPS}
          width={cw}
          height={ch}
          defaultProps={{ ending: "ig" as const }}
        />
      ))}
      {/* Raylight-style hero STILLS. One frame each, exported with
          `npm run still <id>`. Not films — these are the feed/press/deck image
          format, and they cost a single frame instead of a render. Art-direct
          them from the HERO block in HeroStill.tsx. */}
      {(
        [
          ["HeroStill-4x5", 1080, 1350],
          ["HeroStill-9x16", 1080, 1920],
          ["HeroStill-16x9", 1920, 1080],
        ] as const
      ).map(([id, cw, ch]) => (
        <Composition
          key={id}
          id={id}
          component={HeroStill}
          durationInFrames={1}
          fps={30}
          width={cw}
          height={ch}
        />
      ))}
      {/* CampusAI Job Match, 2026-09 rebuild. Its own composition rather than a
          script.ts scene, for the same reason the chat film is: this one
          composites captured product pixels under a light-and-camera model, not
          the card-shaped art the older posts compose. The August JobMatch-*
          compositions above are untouched and still render.
          4:5 is the primary — the tallest an Instagram feed post can be without
          being a Reel. 9:16 places its content through safeArea.ts. */}
      {(
        [
          ["JobMatchFilm-4x5", 1080, 1350],
          ["JobMatchFilm-9x16", 1080, 1920],
          ["JobMatchFilm-16x9", 1920, 1080],
        ] as const
      ).map(([id, cw, ch]) => (
        <Composition
          key={id}
          id={id}
          component={JobMatchFilm}
          durationInFrames={jobMatchFrames(JOBMATCH_FPS)}
          fps={JOBMATCH_FPS}
          width={cw}
          height={ch}
        />
      ))}
      {/* CampusAI clubs loop, for the SUSA Involvement Fair table. Silent and
          seamless by design.
          NO 9:16 YET, deliberately. The composer bar and the answer bubble are
          fixed at 1370 / 1290px and the reason lines have fixed heights so that
          streaming text cannot reflow them. Squeezing that into a 1080-wide
          frame overflows the bar and breaks every reserved height. Vertical
          needs its own layout pass, not a scale factor. */}
      <Composition
        id="ClubsFair-16x9"
        component={ClubsVideo}
        durationInFrames={CLUBS_VIDEO_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* "Left on read" street interview with a chat story over it (2026-10-21). */}
      <Composition
        id="LeftOnRead-9x16"
        component={LeftOnReadFilm}
        durationInFrames={LEFT_ON_READ_FRAMES}
        fps={LEFT_ON_READ_FPS}
        width={LEFT_ON_READ_SIZE.width}
        height={LEFT_ON_READ_SIZE.height}
      />
      {/* Launch-film parts kit, every part once in story order (2026-10-19). */}
      <Composition
        id="KitReel-4x5"
        component={KitReel}
        durationInFrames={KIT_FRAMES}
        fps={KIT_FPS}
        width={KIT_SIZE.width}
        height={KIT_SIZE.height}
        defaultProps={{ labels: true }}
      />
      {/* CampusAI launch film, "the morning" (2026-10-19), built from the kit. */}
      <Composition
        id="Morning-4x5"
        component={MorningFilm}
        durationInFrames={MORNING_FRAMES}
        fps={MORNING_FPS}
        width={MORNING_SIZE.width}
        height={MORNING_SIZE.height}
      />
      {/* CampusAI four-video batch (2026-10-19), one film per type, see four-videos/BRIEF.md. */}
      <Composition id="Spotlight-9x16" component={SpotlightFilm} durationInFrames={SPOTLIGHT_FRAMES} fps={SPOTLIGHT_FPS} width={SPOTLIGHT_SIZE.width} height={SPOTLIGHT_SIZE.height} />
      <Composition id="Swap-9x16" component={SwapFilm} durationInFrames={SWAP_FRAMES} fps={SWAP_FPS} width={SWAP_SIZE.width} height={SWAP_SIZE.height} />
      <Composition id="Week-9x16" component={WeekFilm} durationInFrames={WEEK_FRAMES} fps={WEEK_FPS} width={WEEK_SIZE.width} height={WEEK_SIZE.height} />
      <Composition id="Registration-9x16" component={RegistrationFilm} durationInFrames={REGISTRATION_FRAMES} fps={REGISTRATION_FPS} width={REGISTRATION_SIZE.width} height={REGISTRATION_SIZE.height} />
      {/* Shot shelf proof (2026-10-21): spotlight-hero-card on the real Job Match page. See ../shots/README.md. */}
      <Composition id="Spring-4x5" component={SpringFilm} durationInFrames={SPRING_FRAMES} fps={SPRING_FPS} width={SPRING_SIZE.width} height={SPRING_SIZE.height} />
      <Composition id="Notices-9x16" component={NoticesFilm} durationInFrames={NOTICES_FRAMES} fps={NOTICES_FPS} width={NOTICES_SIZE.width} height={NOTICES_SIZE.height} />
      <Composition id="Wrapped-9x16" component={WrappedFilm} durationInFrames={WRAPPED_FRAMES} fps={WRAPPED_FPS} width={WRAPPED_SIZE.width} height={WRAPPED_SIZE.height} />
      <Composition id="Bingo-9x16" component={BingoFilm} durationInFrames={BINGO_FRAMES} fps={BINGO_FPS} width={BINGO_SIZE.width} height={BINGO_SIZE.height} />
      <Composition id="Speedrun-9x16" component={SpeedrunFilm} durationInFrames={SPEEDRUN_FRAMES} fps={SPEEDRUN_FPS} width={SPEEDRUN_SIZE.width} height={SPEEDRUN_SIZE.height} />
      <Composition id="HowTo-9x16" component={HowToFilm} durationInFrames={HOWTO_FRAMES} fps={HOWTO_FPS} width={HOWTO_SIZE.width} height={HOWTO_SIZE.height} />
      <Composition id="Campus-9x16" component={CampusFilm} durationInFrames={CAMPUS_FRAMES} fps={CAMPUS_FPS} width={CAMPUS_SIZE.width} height={CAMPUS_SIZE.height} />
      <Composition id="Flock-9x16" component={FlockFilm} durationInFrames={FLOCK_FRAMES} fps={FLOCK_FPS} width={FLOCK_SIZE.width} height={FLOCK_SIZE.height} />
      <Composition id="Shelf-SpotlightHeroCard" component={SpotlightHeroCard} durationInFrames={SPOTLIGHT_HERO_CARD_DURATION} fps={30} width={1920} height={1080} />
      {/* Films that stay on this machine (src/private, gitignored): other ventures and client jobs. */}
      {PRIVATE.map((C, i) => (
        <C key={i} />
      ))}
      <Composition
        id="DemoVideo"
        component={DemoVideo}
        durationInFrames={300}
        fps={SCRIPT.fps}
        width={SCRIPT.width}
        height={SCRIPT.height}
        defaultProps={{ script: SCRIPT, resolvedDurations: [] }}
        calculateMetadata={calculateMetadata}
      />
      <Composition id="Tour-16x9" component={CalmTour} durationInFrames={TOUR_FRAMES} fps={TOUR_FPS} width={TOUR_W} height={TOUR_H} />
      <Composition id="AskFriend-9x16" component={AskFriend} durationInFrames={ASK_FRAMES} fps={ASK_FPS} width={ASK_W} height={ASK_H} />
      <Composition id="Sunday-4x5" component={SundayNight} durationInFrames={SUNDAY_FRAMES} fps={SUNDAY_FPS} width={SUNDAY_W} height={SUNDAY_H} />
      {/* Ashley's favorite study spot interview, lifted (2026-10-23). */}
      <Composition id="StudySpot-9x16" component={StudySpotFilm} durationInFrames={STUDY_FRAMES} fps={STUDY_FPS} width={STUDY_SIZE.width} height={STUDY_SIZE.height} />
      <PickedRoot />
      <InsideMatchRoot />
      {/* Wave 2 motion loops (2026-10-23): one shape through the real states, the product inside the letters. */}
      <Composition id="OneShape-9x16" component={OneShape} durationInFrames={ONE_SHAPE_FRAMES} fps={ONE_SHAPE_FPS} width={ONE_SHAPE_W} height={ONE_SHAPE_H} />
      <Composition id="Letters-16x9" component={Letters} durationInFrames={LETTERS_FRAMES} fps={LETTERS_FPS} width={LETTERS_W} height={LETTERS_H} />
    </>
  );
};
