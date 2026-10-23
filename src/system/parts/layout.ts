/**
 * One layout per aspect (2026-10-23): where the logo mark, headlines, the product and captions go.
 * The product is the frame (shown big, bleeding to a thin margin); headlines sit small ABOVE it and
 * captions in a band BELOW it, never over live UI (studio rules). Parts frame `focus` into
 * `focusBox`, so a cutdown reframes on the focal point instead of cropping blind.
 *
 * 9x16 obeys lib/safeArea.ts: the Reels player covers the bottom ~420 px and the right rail, and the
 * feed crops to y 285 to 1635, so every word and every focus lands inside y 285 to 1500. The held
 * mark goes in the real top-left corner at y 96 (Jacob, 2026-08-28: seen in the Reels player,
 * cropped from the feed thumbnail, accepted).
 */
import { safeLayout } from "../../lib/safeArea";
import type { Rect } from "../../kit/camera";
import type { Aspect } from "../storyboard";
import { SIZE } from "../storyboard";
import type { Layout } from "./types";

const inset = (r: Rect, dx: number, dy: number): Rect => ({ x: r.x + dx, y: r.y + dy, w: r.w - dx * 2, h: r.h - dy * 2 });
const intersect = (a: Rect, b: Rect): Rect => {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  return { x, y, w: Math.min(a.x + a.w, b.x + b.w) - x, h: Math.min(a.y + a.h, b.y + b.h) - y };
};

export const makeLayout = (aspect: Aspect, hasCaptions: boolean): Layout => {
  const { w: W, h: H } = SIZE[aspect];
  const u = Math.min(W, H) / 1080;
  const tall = safeLayout(W, H).stageTopRatio > 0;
  let top: Rect;
  let view: Rect;
  let caption: Rect | null;
  let safe: Rect = { x: 0, y: 0, w: W, h: H };
  let mark: Layout["mark"];
  let headline: Layout["headline"];
  let bigLine: Layout["bigLine"];
  let captionSize = 40;
  if (aspect === "9x16" || tall) {
    // Reels safe band: y 285 (feed crop) to 1500 (Reels caption strip), right rail kept clear of words
    safe = { x: 60, y: 285, w: 900, h: 1215 };
    // the headline row sits inside the feed crop (y 285 on), so a Reel shown in the feed keeps its words
    // the product fills the safe height edge to edge: under the headline row to y 1360, captions in the
    // strip below it (to 1490, above the Reels caption strip); without captions it runs to 1490
    top = { x: 0, y: 0, w: W, h: 376 };
    view = { x: 16, y: 376, w: W - 32, h: hasCaptions ? 984 : 1114 };
    caption = hasCaptions ? { x: 70, y: 1372, w: 880, h: 118 } : null;
    mark = { x: 59, y: 96, width: 180 };
    headline = { cx: W / 2, cy: 328, size: 40, maxW: 900 };
    bigLine = { size: 96, maxW: 900 };
    captionSize = 46;
  } else if (aspect === "4x5") {
    top = { x: 0, y: 0, w: W, h: 132 };
    view = { x: 36, y: 132, w: W - 72, h: hasCaptions ? 960 : 1182 };
    caption = hasCaptions ? { x: 60, y: 1104, w: W - 120, h: 220 } : null;
    mark = { x: 44, y: 46, width: 150 };
    headline = { cx: W / 2, cy: 66, size: 32, maxW: 620 };
    bigLine = { size: 88, maxW: 860 };
  } else if (aspect === "16x9") {
    top = { x: 0, y: 0, w: W, h: 104 };
    view = { x: 60, y: 104, w: W - 120, h: hasCaptions ? 792 : 940 };
    caption = hasCaptions ? { x: 160, y: 908, w: W - 320, h: 150 } : null;
    mark = { x: 60, y: 34, width: 160 };
    headline = { cx: W / 2, cy: 54, size: 34, maxW: 1300 };
    bigLine = { size: 96, maxW: 1400 };
  } else {
    top = { x: 0, y: 0, w: W, h: 112 };
    view = { x: 36, y: 112, w: W - 72, h: hasCaptions ? 762 : 932 };
    caption = hasCaptions ? { x: 60, y: 886, w: W - 120, h: 170 } : null;
    mark = { x: 44, y: 40, width: 150 };
    headline = { cx: W / 2, cy: 58, size: 30, maxW: 620 };
    bigLine = { size: 84, maxW: 860 };
    captionSize = 38;
  }
  const label = { right: view.x + view.w, cy: aspect === "9x16" || tall ? headline.cy : mark.y + mark.width / (223 / 53) / 2 };
  const air = inset(view, view.w * 0.04, view.h * 0.04);
  const focusBox = aspect === "9x16" ? intersect(air, { x: 0, y: safe.y, w: W, h: safe.h }) : air;
  return { aspect, W, H, u, top, view, focusBox, caption, safe, mark, headline, label, captionSize, bigLine, radius: Math.round(28 * u) };
};
