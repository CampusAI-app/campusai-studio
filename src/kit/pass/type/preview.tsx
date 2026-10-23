/**
 * Previews for the type group (2026-10-22), 1080x1350 at 30 fps, each on real campusai-demo captures
 * from public/pass (dark, 1440x900 CSS at DPR 2). Registered by ./entry.ts so Root.tsx is untouched:
 *   npx remotion render src/kit/pass/type/entry.ts Pass-WordSwap out/pass/Pass-WordSwap.mp4 --concurrency=2
 * Every string on screen is from a capture, its JSON, or the brief (the WordSwap hook lines).
 */
import React from "react";
import { AbsoluteFill, Composition, interpolate, staticFile, useCurrentFrame } from "remotion";
import { brand, useBrandFonts } from "../../brand";
import type { PageCam } from "../../camera";
import { camAlong, rectOnCanvas, toCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { PointerAt } from "../../Pointer";
import { EASE } from "../../../lib/anim";
import { CircleHandoff } from "./CircleHandoff";
import { NameToLogo } from "./NameToLogo";
import { ProductInLetters } from "./ProductInLetters";
import type { Phrase, WordSwapHandoff } from "./WordSwap";
import { WordSwap, wordSwapTimeline } from "./WordSwap";
import { MPatch, SIDEBAR, clamp, readFrames } from "./shared";

const B = brand("campusai");
const W = 1080;
const H = 1350;
const FPS = 30;
const PAGE = { w: 1440, h: 900 };
const VIEW = { x: 40, y: 362, w: 1000, h: 625 };
const FULL: PageCam = { cx: 720, cy: 450, cw: 1440 };

const Ground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useBrandFonts(B);
  return <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient, overflow: "hidden" }}>{children}</AbsoluteFill>;
};

/* ------------------------------------------------------------ WordSwap */

const PHRASES: Phrase[] = [{ text: "Six tabs." }, { text: "Three portals." }, { text: "One deadline you missed.", accent: "missed" }];
const HANDOFF: WordSwapHandoff = {
  src: staticFile("pass/dashboard.jpg"),
  page: PAGE,
  view: { x: 40, y: 480, w: 1000, h: 625 },
  patch: SIDEBAR.dashboard,
  headline: { y: 330, scale: 0.42 },
};
const WS_END = wordSwapTimeline({ phrases: PHRASES, at: 2, handoff: HANDOFF }, FPS).end;

const WordSwapPreview: React.FC = () => (
  <Ground>
    <WordSwap brand={B} phrases={PHRASES} at={2} size={132} maxWidth={960} x={540} y={640} handoff={HANDOFF} />
  </Ground>
);

/* ---------------------------------------------------- ProductInLetters */

// built for wide frames (the website hero, 16:9 posts), so this preview is 1920x1080; the portrait
// version was dropped because a six-letter word is too thin there for the product to read inside it
const PIL_TIMES = { in: 0, glideEnd: 104, rush: 108, rushEnd: 140, land: 146 };
const PIL_SIZE = 470;
const PIL_BASE = 650;

const ProductInLettersPreview: React.FC = () => (
  <Ground>
    <ProductInLetters
      brand={B}
      word="campus"
      src={staticFile("pass/dashboard.jpg")}
      page={PAGE}
      glide={{ from: { cx: 600, cy: 262, cw: 1000 }, to: { cx: 960, cy: 290, cw: 1000 } }}
      final={{ cx: 720, cy: 405, cw: 1440 }}
      finalDrift={{ cx: 720, cy: 398, cw: 1400 }}
      size={PIL_SIZE}
      baseline={PIL_BASE}
      track="-0.04em"
      origin={{ x: 1117, y: 690 }}
      maxScale={9}
      times={PIL_TIMES}
      patch={SIDEBAR.dashboard}
    />
  </Ground>
);

/* ---------------------------------------------------------- NameToLogo */

const LINE = { text: "CampusAI", at: 8, size: 118 };
// the line lands 14 frames after it starts, then holds its full reading time before it hands over
const NTL_LOGO = LINE.at + 14 + readFrames(LINE.text, FPS) + 4;
const NTL_SHEEN = NTL_LOGO + 34;

const NameToLogoPreview: React.FC = () => (
  <Ground>
    <NameToLogo brand={B} variant="shimmer" x={540} y={675} width={600} logoAt={NTL_LOGO} sheenAt={NTL_SHEEN} line={LINE} />
  </Ground>
);

// "Apply on company site" on the Goldman detail. Not in job-goldman.json (it is a link, the JSON
// lists buttons), so measured from the capture: same row as "Tailor resume" (x 939, y 324, h 38).
const APPLY = { x: 742, y: 324, w: 189, h: 38 };
const GS_CAMS = [
  { t: 0, cam: FULL },
  { t: 10, cam: FULL },
  { t: 46, cam: { cx: 836, cy: 343, cw: 340 } },
];
const LIFT = 62;
const NTLE_LOGO = LIFT + 26 - 4;
const NTLE_SHEEN = NTLE_LOGO + 34;

const NameToLogoFromElementPreview: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAlong(f, GS_CAMS);
  const k = interpolate(f, [24, 50], [0, 1], { ...clamp, easing: EASE });
  const pp = toCanvas(cam, VIEW, 1110 + (836 - 1110) * k, 640 + (343 - 640) * k);
  const since = f >= 54 ? (f - 54) / FPS : null;
  const dim = interpolate(f, [LIFT, LIFT + 18], [0, 1], { ...clamp, easing: EASE });
  const gone = interpolate(f, [LIFT + 8, LIFT + 34], [0, 1], { ...clamp, easing: EASE });
  const from = rectOnCanvas(camAlong(LIFT, GS_CAMS), VIEW, APPLY);
  return (
    <Ground>
      {gone < 1 && (
        <div style={{ opacity: 1 - gone }}>
          <PageView src={staticFile("pass/job-goldman.jpg")} page={PAGE} cam={cam} view={VIEW} brand={B} dim={0.7 * dim}>
            <MPatch cam={cam} view={VIEW} color={SIDEBAR["job-goldman"]} />
          </PageView>
        </div>
      )}
      <PointerAt x={pp.x} y={pp.y} since={since} accent={B.color.accent} opacity={1 - interpolate(f, [58, 66], [0, 1], clamp)} />
      <NameToLogo brand={B} variant="fromElement" x={540} y={675} width={460} logoAt={NTLE_LOGO} sheenAt={NTLE_SHEEN}
        element={{ src: staticFile("pass/job-goldman.jpg"), page: PAGE, rect: APPLY, from, radius: 7, liftAt: LIFT }} />
    </Ground>
  );
};

/* -------------------------------------------------------- CircleHandoff */

// the bell glyph inside the "6 new" pill (pill x 1225, y 17, 83 x 34 in dashboard.json), measured
// from the capture; the same pill sits in the same place on the notifications page
const BELL = { cx: 1245.5, cy: 34, r: 15 };
// where it lands: the graduation-cap icon of the first notification ("BMGT380 assignment moved"),
// measured from notifications.jpg (the icon is a bare glyph, so the ring is drawn round it)
const CAP = { cx: 306, cy: 188.5, r: 15 };
const CH_CAMS = [
  { t: 0, cam: FULL },
  { t: 12, cam: FULL },
  { t: 48, cam: { cx: 1230, cy: 131, cw: 420 } },
];
const CH_TIMES = { focus: 46, pulses: [56], open: 64, land: 110 };

const CircleHandoffPreview: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAlong(f, CH_CAMS);
  const k = interpolate(f, [20, 50], [0, 1], { ...clamp, easing: EASE });
  const pp = toCanvas(cam, VIEW, 960 + (BELL.cx - 960) * k, 520 + (BELL.cy + 2 - 520) * k);
  const since = f >= 56 ? (f - 56) / FPS : null;
  return (
    <Ground>
      <CircleHandoff
        brand={B}
        view={VIEW}
        from={{ src: staticFile("pass/dashboard.jpg"), page: PAGE, cams: CH_CAMS, circle: BELL, patch: SIDEBAR.dashboard }}
        to={{ src: staticFile("pass/notifications.jpg"), page: PAGE, rest: { cx: 832, cy: 373, cw: 1192 }, circle: CAP, patch: SIDEBAR.notifications }}
        times={CH_TIMES}
      />
      {f < CH_TIMES.open + 4 && (
        <PointerAt x={pp.x} y={pp.y} since={since} accent={B.color.accent} opacity={1 - interpolate(f, [CH_TIMES.open - 4, CH_TIMES.open + 4], [0, 1], clamp)} />
      )}
    </Ground>
  );
};

export const TypePassRoot: React.FC = () => (
  <>
    <Composition id="Pass-WordSwap" component={WordSwapPreview} durationInFrames={WS_END} fps={FPS} width={W} height={H} />
    <Composition id="Pass-ProductInLetters" component={ProductInLettersPreview} durationInFrames={186} fps={FPS} width={1920} height={1080} />
    <Composition id="Pass-NameToLogo" component={NameToLogoPreview} durationInFrames={NTL_SHEEN + 62 + 34} fps={FPS} width={W} height={H} />
    <Composition id="Pass-NameToLogoFromElement" component={NameToLogoFromElementPreview} durationInFrames={NTLE_SHEEN + 62 + 34} fps={FPS} width={W} height={H} />
    <Composition id="Pass-CircleHandoff" component={CircleHandoffPreview} durationInFrames={160} fps={FPS} width={W} height={H} />
  </>
);
