/**
 * Previews of the r4 transitions group (2026-10-25), 30 fps, registered by `entry.ts`:
 *   npx remotion render src/kit/r4/transitions/entry.ts R4-CardOpensPage out/r4/R4-CardOpensPage.mp4 --concurrency=2 --crf 16
 * The R4-<Part> previews are 1080x1350 (4x5); each part also has a second aspect (9x16 or 16x9) on a different
 * real pair, to prove the part holds at any shape. Every surface is a campusai-demo capture from public/pass;
 * every box is from that capture's JSON or measured off its pixels (noted where measured). No text is added.
 */
import React from "react";
import { AbsoluteFill, Composition, staticFile } from "remotion";
import { brand } from "../../brand";
import type { Rect } from "../../camera";
import { CardOpensPage } from "./CardOpensPage";
import { DeckSwap } from "./DeckSwap";
import { MaskHandoff } from "./MaskHandoff";

const B = brand("campusai");
const FPS = 30;
const PAGE = { w: 1440, h: 900 };
const SIDEBAR = "rgb(33, 21, 21)";
const SIDEBAR_GOLDMAN = "rgb(29, 20, 21)";
const p = (name: string) => staticFile(`pass/${name}.jpg`);

const F45 = { w: 1080, h: 1350 };
const F916 = { w: 1080, h: 1920 };
const F169 = { w: 1920, h: 1080 };
const V45: Rect = { x: 40, y: 60, w: 1000, h: 1230 };
const V916: Rect = { x: 36, y: 100, w: 1008, h: 1720 };
const V169: Rect = { x: 60, y: 54, w: 1800, h: 972 };

const Ground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient }}>{children}</AbsoluteFill>
);

/* CardOpensPage, 4x5: the Goldman Sachs card in the Job Match list opens into the Goldman detail. The card is the
 * JSON's Goldman card; it lands on the detail's header (logo, title, company, the buttons), which is cut to the
 * card's shape (721, 214, 666 wide). */
const CARD_DUR = 150;
const CardOpensPagePreview: React.FC = () => (
  <Ground>
    <CardOpensPage brand={B} canvas={F45} view={V45} at={42}
      from={{ src: p("jobmatch"), page: PAGE, cam: { cx: 545, cy: 450, cw: 732 }, drift: { cx: 540, cy: 450, cw: 716 }, mark: SIDEBAR,
        card: { x: 269, y: 382, w: 436, h: 195 }, radius: 12 }}
      to={{ src: p("job-goldman"), page: PAGE, cam: { cx: 1054, cy: 450, cw: 732 }, mark: SIDEBAR_GOLDMAN, toRect: { x: 721, y: 214, w: 666, h: 298 } }} />
  </Ground>
);

/* CardOpensPage, 9x16: "Plan your Spring 2027 classes" in the dashboard's Worth a look opens into the Spring 2027
 * term of the 4-year plan. Row measured off the capture (separators at y 154 and 212, column x 848 to 1375); the
 * term's header is the top of the JSON's Spring 2027 card. */
const CardOpensPage916: React.FC = () => (
  <Ground>
    <CardOpensPage brand={B} canvas={F916} view={V916} at={42}
      from={{ src: p("dashboard-tall"), page: { w: 1440, h: 1565 }, cam: { cx: 1112, cy: 480, cw: 560 }, drift: { cx: 1112, cy: 470, cw: 548 }, mark: SIDEBAR,
        card: { x: 848, y: 155, w: 527, h: 57 }, radius: 10 }}
      to={{ src: p("planner-tall"), page: { w: 1440, h: 1991 }, cam: { cx: 1111, cy: 1400, cw: 600 }, mark: SIDEBAR, toRect: { x: 835, y: 939, w: 552, h: 60 } }} />
  </Ground>
);

/* MaskHandoff, 4x5: the dashboard's "Open My Calendar" pill (measured off the capture: x 520 to 744, y 163 to 191,
 * fill rgb(41, 24, 32)) is pressed and opens into My Calendar. */
const MASK_DUR = 165;
const DASH_PILL = { x: 520, y: 163, w: 224, h: 28 };
const MaskHandoffPreview: React.FC = () => (
  <Ground>
    <MaskHandoff brand={B} canvas={F45} view={V45} at={52} pointer={{ dx: 230, dy: 300 }}
      from={{ src: p("dashboard"), page: PAGE, cam: { cx: 560, cy: 450, cw: 732 }, drift: { cx: 560, cy: 445, cw: 716 }, mark: SIDEBAR,
        control: DASH_PILL, surface: "rgb(41, 24, 32)" }}
      to={{ src: p("calendar"), page: PAGE, cam: { cx: 1074, cy: 450, cw: 732 }, mark: SIDEBAR }} />
  </Ground>
);

/* MaskHandoff, 16x9: the same press, wide. */
const MaskHandoff169: React.FC = () => (
  <Ground>
    <MaskHandoff brand={B} canvas={F169} view={V169} at={52} pointer={{ dx: 260, dy: 240 }}
      from={{ src: p("dashboard"), page: PAGE, cam: { cx: 820, cy: 360, cw: 1240 }, drift: { cx: 820, cy: 356, cw: 1215 }, mark: SIDEBAR,
        control: DASH_PILL, surface: "rgb(41, 24, 32)" }}
      to={{ src: p("calendar"), page: PAGE, cam: { cx: 830, cy: 380, cw: 1240 }, mark: SIDEBAR }} />
  </Ground>
);

/* DeckSwap, 4x5: Events goes under, My Calendar is dealt on top, and the Evercore Coffee Chat card (JSON box)
 * rides the swap into its block on Saturday the 24th (measured off the capture: x 1311 to 1438, y 279 to 343). */
const DECK_DUR = 165;
const DeckSwapPreview: React.FC = () => (
  <Ground>
    <DeckSwap brand={B} canvas={F45} view={V45} at={48}
      from={{ src: p("events"), page: PAGE, cam: { cx: 545, cy: 450, cw: 732 }, drift: { cx: 545, cy: 445, cw: 716 }, mark: SIDEBAR }}
      to={{ src: p("calendar"), page: PAGE, cam: { cx: 1074, cy: 450, cw: 732 }, mark: SIDEBAR }}
      carry={{ from: { x: 248, y: 225, w: 574, h: 210 }, to: { x: 1311, y: 279, w: 127, h: 64 }, radius: 12 }} />
  </Ground>
);

/* DeckSwap, 9x16: the Goldman detail goes under, Resume Review is dealt on top, and "Tailor resume" (x 940 to 1068,
 * y 325 to 359, measured) rides into "Tailor to a specific job" (x 1205 to 1383, y 584 to 620, measured). */
const DeckSwap916: React.FC = () => (
  <Ground>
    <DeckSwap brand={B} canvas={F916} view={V916} at={48}
      from={{ src: p("job-goldman"), page: PAGE, cam: { cx: 1054, cy: 450, cw: 527 }, drift: { cx: 1054, cy: 450, cw: 516 }, mark: SIDEBAR_GOLDMAN }}
      to={{ src: p("resume"), page: PAGE, cam: { cx: 1140, cy: 450, cw: 527 }, mark: SIDEBAR }}
      carry={{ from: { x: 940, y: 325, w: 128, h: 34 }, to: { x: 1205, y: 584, w: 178, h: 36 }, radius: 8 }} />
  </Ground>
);

export const TransitionsRoot: React.FC = () => (
  <>
    <Composition id="R4-CardOpensPage" component={CardOpensPagePreview} durationInFrames={CARD_DUR} fps={FPS} width={F45.w} height={F45.h} />
    <Composition id="R4-CardOpensPage-9x16" component={CardOpensPage916} durationInFrames={CARD_DUR} fps={FPS} width={F916.w} height={F916.h} />
    <Composition id="R4-MaskHandoff" component={MaskHandoffPreview} durationInFrames={MASK_DUR} fps={FPS} width={F45.w} height={F45.h} />
    <Composition id="R4-MaskHandoff-16x9" component={MaskHandoff169} durationInFrames={MASK_DUR} fps={FPS} width={F169.w} height={F169.h} />
    <Composition id="R4-DeckSwap" component={DeckSwapPreview} durationInFrames={DECK_DUR} fps={FPS} width={F45.w} height={F45.h} />
    <Composition id="R4-DeckSwap-9x16" component={DeckSwap916} durationInFrames={DECK_DUR} fps={FPS} width={F916.w} height={F916.h} />
  </>
);
