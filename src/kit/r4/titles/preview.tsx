/**
 * Previews for the titles group (round 4, 2026-10-25), 1080x1350 at 30 fps, registered by ./entry.ts:
 *   npx remotion render src/kit/r4/titles/entry.ts R4-FeatureTag out/r4/R4-FeatureTag.mp4 --concurrency=2 --crf 16
 *
 * Every surface is a real campusai-demo capture from public/pass (dark, 1440 CSS wide at DPR 2). Every string on
 * screen is from a capture or its JSON:
 *   FeatureTag   "Resume Coach" and "Tailors your resume to one posting": the dashboard's What's new card, "New on
 *                CampusAI: Resume Coach can now tailor your resume to one posting" (dashboard.json). The control it
 *                grows out of is "Tailor resume" on the Deloitte posting (jobmatch.json, 939, 324, 130 x 38).
 *   ChapterMark  "Career": the nav row's own short label ("✦Career Advisor Career", dashboard.json, 8, 142, 199 x 36);
 *                jobmatch.jpg has the same row active at the same box. "Part 2" is film structure, not a product claim.
 *   QuestionHook "Ask CampusAI anything..." is the field's placeholder (dashboard.jpg, read off the pixels);
 *                "How should I prep for Evercore Coffee Chat?" is the dashboard's own Events starter (dashboard.json).
 *   StatLine     22: "22 open student roles at curated US employers, checked today at 5:12 AM" (jobmatch.json card
 *                text, captured 2026-10-23). The "22" glyphs measured at CSS x 270 to 283, y 139 to 150.
 */
import React from "react";
import { AbsoluteFill, Composition, staticFile } from "remotion";
import { brand, useBrandFonts } from "../../brand";
import type { PageCam, Rect } from "../../camera";
import { ChapterMark, chapterMarkTimes } from "./ChapterMark";
import { FeatureTag, featureTagTimes } from "./FeatureTag";
import { QuestionHook, questionHookTimes } from "./QuestionHook";
import { StatLine, statLineTimes } from "./StatLine";
import { PASS_MARK } from "./shared";

const B = brand("campusai");
const W = 1080;
const H = 1350;
const FPS = 30;
const PAGE = { w: 1440, h: 900 };

const Ground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useBrandFonts(B);
  return <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient, overflow: "hidden" }}>{children}</AbsoluteFill>;
};

/** Footage on top, the caption band below it (titles over product sit BELOW the footage). */
const VIEW_BAND: Rect = { x: 36, y: 96, w: 1008, h: 900 };
const BAND: Rect = { x: 84, y: 1040, w: 912, h: 250 };

/* ------------------------------------------------------------ FeatureTag */

const FT = { at: 32, name: "Resume Coach", line: "Tailors your resume to one posting" };
const FT_T = featureTagTimes(FT);
const FT_DUR = FT_T.end + 10;
const FT_OPEN: PageCam = { cx: 820, cy: 400, cw: 1000 };
const FT_ON: PageCam = { cx: 1010, cy: 390, cw: 700 };
const FeatureTagPreview: React.FC = () => (
  <Ground>
    <FeatureTag
      brand={B}
      page={{ src: staticFile("pass/jobmatch.jpg"), size: PAGE }}
      view={VIEW_BAND}
      mark={PASS_MARK}
      cams={[
        { t: 0, cam: FT_OPEN },
        { t: 4, cam: FT_OPEN },
        { t: 28, cam: FT_ON },
        { t: FT_DUR, cam: { ...FT_ON, cw: FT_ON.cw * 0.97 } },
      ]}
      element={{ x: 939, y: 324, w: 130, h: 38 }}
      radius={8}
      name={FT.name}
      line={FT.line}
      band={BAND}
      at={FT.at}
      size={76}
    />
  </Ground>
);

/* ------------------------------------------------------------ ChapterMark */

const CM = { at: 18, title: "Career", kicker: "Part 2" };
const CM_T = chapterMarkTimes(CM);
const CM_DUR = CM_T.end + 40;
const CM_VIEW: Rect = { x: 36, y: 250, w: 1008, h: 1060 };
const CM_SIDE: PageCam = { cx: 420, cy: 446, cw: 840 };
const CM_JOBS: PageCam = { cx: 700, cy: 446, cw: 840 };
const ChapterMarkPreview: React.FC = () => (
  <Ground>
    <ChapterMark
      brand={B}
      from={{ src: staticFile("pass/dashboard.jpg"), size: PAGE, mark: PASS_MARK }}
      to={{ src: staticFile("pass/jobmatch.jpg"), size: PAGE, mark: PASS_MARK }}
      view={CM_VIEW}
      cams={[
        { t: 0, cam: { ...CM_SIDE, cw: CM_SIDE.cw * 1.02 } },
        { t: CM_T.home, cam: CM_SIDE },
        { t: CM_T.end + 30, cam: CM_JOBS },
      ]}
      nav={{ x: 8, y: 142, w: 199, h: 36 }}
      title={CM.title}
      kicker={CM.kicker}
      titleAt={{ x: 540, y: 132 }}
      at={CM.at}
    />
  </Ground>
);

/* ------------------------------------------------------------ QuestionHook */

const QH = { question: "How should I prep for Evercore Coffee Chat?", typeAt: 9, perChar: 1.6, send: { x: 1354, y: 630, w: 32, h: 32 } };
const QH_T = questionHookTimes(QH);
const QH_DUR = QH_T.end + 6;
const QuestionHookPreview: React.FC = () => (
  <Ground>
    <QuestionHook
      brand={B}
      page={{ src: staticFile("pass/dashboard-tall.jpg"), size: { w: 1440, h: 1565 } }}
      view={{ x: 36, y: 140, w: 1008, h: 1070 }}
      mark={PASS_MARK}
      field={{ x: 261, y: 620, w: 1134, h: 51, fill: "rgb(43, 31, 33)" }}
      text={{ x: 270.5, baseline: 642.5, size: 13, color: "rgb(242, 241, 239)" }}
      placeholder={{ text: "Ask CampusAI anything...", color: "rgb(170, 160, 161)", rect: { x: 268, y: 630, w: 158, h: 19 } }}
      question={QH.question}
      typeAt={QH.typeAt}
      perChar={QH.perChar}
      tight={{ cx: 420, cy: 640, cw: 332 }}
      wide={{ cx: 822, cy: 600, cw: 1200 }}
      send={QH.send}
    />
  </Ground>
);

/* ------------------------------------------------------------ StatLine */

const SL = { value: 22, source: "Open student roles on Job Match" };
const SL_T = statLineTimes(SL);
const SL_DUR = SL_T.end + 14;
const StatLinePreview: React.FC = () => (
  <Ground>
    <StatLine
      brand={B}
      page={{ src: staticFile("pass/jobmatch.jpg"), size: PAGE }}
      view={VIEW_BAND}
      mark={PASS_MARK}
      wide={{ cx: 700, cy: 450, cw: 940 }}
      close={{ cx: 492, cy: 250, cw: 520 }}
      value={SL.value}
      target={{ x: 270, y: 139, w: 13, h: 11 }}
      source={SL.source}
      sourceNote="jobmatch.jpg / jobmatch.json, campusai-demo /career?view=jobs, captured 2026-10-23: '22 open student roles at curated US employers, checked today at 5:12 AM'"
      band={BAND}
    />
  </Ground>
);

export const TitlesR4Root: React.FC = () => (
  <>
    <Composition id="R4-FeatureTag" component={FeatureTagPreview} durationInFrames={FT_DUR} fps={FPS} width={W} height={H} />
    <Composition id="R4-ChapterMark" component={ChapterMarkPreview} durationInFrames={CM_DUR} fps={FPS} width={W} height={H} />
    <Composition id="R4-QuestionHook" component={QuestionHookPreview} durationInFrames={QH_DUR} fps={FPS} width={W} height={H} />
    <Composition id="R4-StatLine" component={StatLinePreview} durationInFrames={SL_DUR} fps={FPS} width={W} height={H} />
  </>
);
