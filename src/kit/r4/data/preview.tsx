/**
 * Previews for the data parts (2026-10-25), registered by `entry.ts` so Root.tsx is never edited:
 *   npx remotion render src/kit/r4/data/entry.ts R4-ListReRank out/r4/R4-ListReRank.mp4 --concurrency=2 --crf 16
 * Every pixel and string is a capture's:
 *   - R4-ListReRank: public/r4/data/jobs-best*, jobs-sort, jobs-newest* (capture/r4-data.cjs, 2026-10-25): Job Match
 *     sorted "Best match", the sort menu open, and the same list after picking "Newest". Nothing is saved by a sort.
 *   - R4-BlocksLand and R4-TallyRoll: public/r4/data/week/* (capture/r4-week.cjs, 2026-10-25): the Events page before
 *     and after five adds, and My Calendar for Oct 25 to 31 before any add (f00) and after each add (f01 to f05),
 *     full page with the chat dock hidden so the Show list reads crisp. The count is that page's own "Events" row,
 *     which the frames read 4, 5, 6, 7, 8, 9; its digit is painted out in the row's own colour and rolled.
 */
import React from "react";
import { AbsoluteFill, Composition, interpolate, staticFile, useCurrentFrame } from "remotion";
import { brand, useBrandFonts } from "../../brand";
import type { Rect } from "../../camera";
import { camAlong, rectOnCanvas, toCanvas } from "../../camera";
import { PointerAt } from "../../Pointer";
import { EASE } from "../../../lib/anim";
import { BlocksLand } from "./BlocksLand";
import type { LandItem } from "./BlocksLand";
import { JOBS_BEST_ROWS, JOBS_NEWEST_ORDER } from "./captures";
import { ListReRank } from "./ListReRank";
import { clamp, Cut, ease01, Ground, lerp, Stretch } from "./shared";
import { TallyRoll } from "./TallyRoll";
import type { TallyStep } from "./TallyRoll";

const B = brand("campusai");
const W = 1080;
const H = 1350;
const FPS = 30;
const PAGE = { w: 1440, h: 900 };

/* ------------------------------------------------------------ ListReRank */

const RR_VIEW = { x: 0, y: 0, w: W, h: H };
const RR_CAM = { cx: 487, cy: 388, cw: 474 };
const RR_DUR = 252;
const RR_CAMS = [
  { t: 0, cam: { ...RR_CAM, cw: 490 } },
  { t: 22, cam: RR_CAM },
  { t: 170, cam: RR_CAM },
  { t: RR_DUR, cam: { ...RR_CAM, cw: 466, cy: 392 } },
];
// the four cards that come to the top under "Newest", in order (jobs-newest.json)
const MOVERS = JOBS_NEWEST_ORDER.slice(0, 4);
// where the real sort control is called out: right end of the filter row (the control itself sits further right)
const TRIG_BEST: Rect = { x: 1262, y: 164, w: 133, h: 39 };
const TRIG_NEW: Rect = { x: 1285, y: 164, w: 110, h: 39 };
const TRIG_OPEN: Rect = { x: 1262, y: 164, w: 133, h: 39 };
const MENU: Rect = { x: 1188, y: 204, w: 204, h: 84 };
const OPT_NEW = { x: 1290, y: 263 };

const SortPress: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAlong(f, RR_CAMS);
  const k = W / cam.cw;
  // the control's right edge sits at page x 716, the end of the visible filter row, on the row's own line
  const anchor = toCanvas(cam, RR_VIEW, 716, 183.5);
  const right = anchor.x;
  const rowY = anchor.y;
  const at = (r: Rect, anchorRight: number): Rect => ({ x: right - (anchorRight - r.x) * k, y: rowY - (183.5 - r.y) * k, w: r.w * k, h: r.h * k });
  const tb = at(TRIG_BEST, 1395);
  const menu = at(MENU, 1395);
  const tn = at(TRIG_NEW, 1395);
  const inK = ease01(f, 4, 12, EASE);
  const open = interpolate(f, [22, 27], [0, 1], clamp);
  const close = interpolate(f, [43, 48], [0, 1], clamp);
  const press1 = interpolate(f, [20, 22, 27], [1, 0.95, 1], clamp);
  const lift = { boxShadow: `0 18px 50px rgba(0,0,0,.55), 0 0 0 1.5px rgba(255,255,255,.1)` };
  // pointer
  const p0 = { x: W * 0.78, y: H * 0.42 };
  const p1 = { x: tb.x + tb.w * 0.55, y: tb.y + tb.h * 0.6 };
  const p2 = { x: right - (1395 - OPT_NEW.x) * k, y: rowY - (183.5 - OPT_NEW.y) * k };
  const k1 = ease01(f, 6, 14, EASE);
  const k2 = ease01(f, 28, 12, EASE);
  const k3 = ease01(f, 48, 16, EASE);
  const px = lerp(lerp(lerp(p0.x, p1.x, k1), p2.x, k2), p2.x + 60, k3);
  const py = lerp(lerp(lerp(p0.y, p1.y, k1), p2.y, k2), p2.y + 140, k3);
  const since = f >= 42 ? (f - 42) / 30 : f >= 21 ? (f - 21) / 30 : null;
  const pOp = interpolate(f, [5, 10, 52, 64], [0, 1, 1, 0], clamp);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: inK, transform: `translateY(${((1 - inK) * -14).toFixed(2)}px)` }}>
        <Cut src={staticFile("r4/data/jobs-best.jpg")} page={PAGE} from={TRIG_BEST}
          to={{ x: tb.x + (tb.w * (1 - press1)) / 2, y: tb.y + (tb.h * (1 - press1)) / 2, w: tb.w * press1, h: tb.h * press1 }}
          radius={10} opacity={1 - Math.max(open * (1 - close), close)} style={lift} />
        <Cut src={staticFile("r4/data/jobs-sort.jpg")} page={PAGE} from={TRIG_OPEN} to={tb} radius={10} opacity={open * (1 - close)} style={lift} />
        <Cut src={staticFile("r4/data/jobs-sort.jpg")} page={PAGE} from={MENU} to={menu} radius={14} opacity={open * (1 - close)} style={lift} />
        <Cut src={staticFile("r4/data/jobs-newest.jpg")} page={PAGE} from={TRIG_NEW} to={tn} radius={10} opacity={close} style={lift} />
      </div>
      {pOp > 0 ? <PointerAt x={px} y={py} since={since} accent={B.color.accent} opacity={pOp} /> : null}
    </>
  );
};

const ListReRankPreview: React.FC = () => {
  useBrandFonts(B);
  return (
    <AbsoluteFill>
      <Ground brand={B}>
        <ListReRank
          brand={B}
          page={{ src: staticFile("r4/data/jobs-best.jpg"), size: PAGE }}
          cut={{ src: staticFile("r4/data/jobs-best-tall.jpg"), size: { w: 1440, h: 3600 } }}
          rows={JOBS_BEST_ROWS}
          after={JOBS_NEWEST_ORDER}
          movers={MOVERS}
          column={{ x: 269, y: 214, w: 436, h: 0 }}
          clear={{ x: 260, y: 204, w: 454, h: 0 }}
          strip={{ x: 252, y: 0, w: 10, h: 900 }}
          view={RR_VIEW}
          cams={RR_CAMS}
          children={(cam) => {
            // the detail panel's first pixels sit on the frame's right edge: cleared to the list panel, like the list
            const s = RR_VIEW.w / cam.cw;
            const area = { x: 712, y: 205, w: 60, h: 695 };
            const r = rectOnCanvas(cam, RR_VIEW, area);
            return <Stretch src={staticFile("r4/data/jobs-best.jpg")} page={PAGE} strip={{ x: 252, y: 0, w: 10, h: 900 }} area={area} to={r} s={s} />;
          }}
          at={54}
          step={24}
          travel={30}
        />
        <SortPress />
      </Ground>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ BlocksLand */

const WK = (p: string) => staticFile(`r4/data/week/${p}`);
const EV_SIZE = { w: 1440, h: 1872 };
const CAL_SIZE = { w: 1440, h: 1033 };
// Buttons measured on week/events.json, their pressed state on week/events-after.json; blocks on f05.json and the
// changed regions from the pixel diff of each frame against the one before.
const LAND: LandItem[] = [
  { button: { x: 849, y: 384, w: 269, h: 34 }, pressed: { x: 849, y: 383, w: 269, h: 36 }, land: { x: 785, y: 588, w: 126, h: 86 }, region: { x: 783, y: 586, w: 130, h: 90 }, at: 28 },
  { button: { x: 849, y: 606, w: 269, h: 34 }, pressed: { x: 849, y: 605, w: 269, h: 36 }, land: { x: 1113, y: 280, w: 61, h: 218 }, region: { x: 1087, y: 263, w: 88, h: 248 }, at: 94 },
  { button: { x: 263, y: 827, w: 269, h: 34 }, pressed: { x: 263, y: 826, w: 269, h: 36 }, land: { x: 1311, y: 632, w: 126, h: 64 }, region: { x: 1309, y: 630, w: 130, h: 68 }, at: 160 },
];
// the source camera holds on each pressed card, and moves only between items (when nothing else is moving)
const CARD_CAM = [
  { cx: 1121, cy: 334, cw: 596 },
  { cx: 1121, cy: 556, cw: 596 },
  { cx: 535, cy: 777, cw: 596 },
];
const BL_DUR = 252;

const BlocksLandPreview: React.FC = () => {
  useBrandFonts(B);
  const src = { x: 24, y: 24, w: W - 48, h: 380 };
  // Tue to Sat, cut on the Tuesday column's own border, with the day headers in
  const wk = { x: 80, y: 424, w: 920, h: 902 };
  const sCams = [{ t: 0, cam: CARD_CAM[0] }];
  LAND.forEach((it, i) => {
    if (i === 0) return;
    const prevDown = LAND[i - 1].at + 8 + 30;
    sCams.push({ t: prevDown + 4, cam: CARD_CAM[i - 1] }, { t: it.at - 26, cam: CARD_CAM[i] });
  });
  return (
    <AbsoluteFill>
      <Ground brand={B}>
        <BlocksLand
          brand={B}
          source={{ src: WK("events.jpg"), after: WK("events-after.jpg"), size: EV_SIZE, view: src, cams: sCams }}
          week={{ src: WK("f00.jpg"), after: WK("f05.jpg"), size: CAL_SIZE, view: wk,
            cams: [{ t: 0, cam: { cx: 1111.5, cy: 380, cw: 657 } }, { t: 200, cam: { cx: 1111.5, cy: 380, cw: 657 } }, { t: BL_DUR, cam: { cx: 1114, cy: 384, cw: 646 } }] }}
          items={LAND}
        />
      </Ground>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- TallyRoll */

// One add per frame of the week run (capture/r4-week.cjs); each region is the pixel diff from the frame before
// (padded), each item the added event's block on that frame, each value what that frame's own "Events" row reads.
const STEPS: TallyStep[] = [
  { src: WK("f01.jpg"), region: { x: 783, y: 586, w: 130, h: 90 }, item: { x: 785, y: 588, w: 126, h: 86 }, value: 5, at: 34 },
  { src: WK("f02.jpg"), region: { x: 1087, y: 263, w: 88, h: 248 }, item: { x: 1113, y: 280, w: 61, h: 218 }, value: 6, at: 70 },
  { src: WK("f03.jpg"), region: { x: 1309, y: 630, w: 130, h: 68 }, item: { x: 1311, y: 632, w: 126, h: 64 }, value: 7, at: 106 },
  { src: WK("f04.jpg"), region: { x: 1177, y: 630, w: 131, h: 68 }, item: { x: 1179, y: 632, w: 127, h: 64 }, value: 8, at: 142 },
  { src: WK("f05.jpg"), region: { x: 651, y: 542, w: 131, h: 90 }, item: { x: 653, y: 544, w: 61, h: 42 }, value: 9, at: 178 },
];
const TR_DUR = 262;

const TallyRollPreview: React.FC = () => {
  useBrandFonts(B);
  const items = { x: 24, y: 24, w: W - 48, h: 820 };
  const count = { x: 120, y: 870, w: W - 240, h: 456 };
  return (
    <AbsoluteFill>
      <Ground brand={B}>
        <TallyRoll
          brand={B}
          items={{ src: WK("f00.jpg"), size: CAL_SIZE, view: items,
            cams: [{ t: 0, cam: { cx: 1040, cy: 379, cw: 800 } }, { t: TR_DUR, cam: { cx: 1046, cy: 383, cw: 784 } }] }}
          count={{ src: WK("f00.jpg"), size: CAL_SIZE, view: count,
            cams: [{ t: 0, cam: { cx: 346, cy: 805, cw: 280 } }, { t: TR_DUR, cam: { cx: 346, cy: 806, cw: 274 } }],
            digit: { x: 444, y: 835, w: 7, h: 13 }, row: { x: 232, y: 830, w: 223, h: 25 },
            patch: "rgb(20, 16, 15)", ink: "rgb(151, 143, 140)", from: 4 }}
          steps={STEPS}
        />
      </Ground>
    </AbsoluteFill>
  );
};

export const DataRoot: React.FC = () => (
  <>
    <Composition id="R4-ListReRank" component={ListReRankPreview} durationInFrames={RR_DUR} fps={FPS} width={W} height={H} />
    <Composition id="R4-BlocksLand" component={BlocksLandPreview} durationInFrames={BL_DUR} fps={FPS} width={W} height={H} />
    <Composition id="R4-TallyRoll" component={TallyRollPreview} durationInFrames={TR_DUR} fps={FPS} width={W} height={H} />
  </>
);
