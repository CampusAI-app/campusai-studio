/**
 * Instagram puts TWO conflicting constraints on the same 9:16 frame, and a Reel
 * has to satisfy both at once.
 *
 * 1. The Reels player draws its own UI over our video: the caption, username and
 *    audio strip along the bottom (~420px of 1920), and the like / comment /
 *    share rail up the right. Anything we put down there is covered.
 * 2. When that same Reel appears in the main FEED, Instagram crops it to the
 *    centre 4:5 — y 285 to 1635 of 1920. Anything outside that band is simply
 *    missing for feed viewers.
 *
 * Intersect them and the genuinely safe band is y 285 -> 1500. These ratios put
 * the chip, the card and the captions inside it.
 *
 * Anything that is not 9:16-tall returns the numbers this project already used,
 * so the 4:5 and 16:9 cuts render byte-identical. The gate is height/width >=
 * 1.5: 9:16 is 1.778, 4:5 is 1.25, 1:1 is 1.0, 16:9 is 0.5625.
 */
export type SafeLayout = {
  /** PunchCaption distance from the bottom edge, as a ratio of height. */
  captionY: number;
  /** Vertical centre of the evidence card, as a ratio of height. */
  contentY: number;
  /** Top of the North Star chip, as a ratio of height. */
  chipY: number;
  /** Top of the "card this panel opened from" thumbnail, ratio of height. */
  aboveY: number;
  /** Height of the caption band a card scene keeps clear, ratio of height. */
  bandRatio: number;
  /** Top of the stage in a card scene, as a ratio of height. */
  stageTopRatio: number;
  /** Watermark top, as a ratio of height. */
  watermarkY: number;
};

const STANDARD: SafeLayout = {
  captionY: 0.09,
  contentY: 0.46,
  chipY: 0.085,
  aboveY: 0.045,
  bandRatio: 0.28,
  stageTopRatio: 0,
  watermarkY: 0.032,
};

/** 9:16. Every number is inside y 285-1500 of 1920. */
const REELS: SafeLayout = {
  // Caption bottom lands at y 1382 of 1920: clear of the Reels UI by ~120px and
  // well inside the 4:5 feed crop, which ends at 1635.
  captionY: 0.28,
  // Card centre 845, so the card spans 541-1149 and clears the caption.
  contentY: 0.44,
  chipY: 0.22,
  aboveY: 0.2,
  // Stage runs 384 -> 1152, so the watermark clears the product panel either
  // way. Jacob's call (2026-08-28): the mark goes in the actual top-left
  // corner, y 96, not tucked down at 288 inside the feed crop. Trade-off he
  // accepted: the centre 4:5 crop Instagram applies in the FEED starts at
  // y 285, so the mark is visible in the Reels player and cropped out of the
  // feed thumbnail.
  bandRatio: 0.4,
  stageTopRatio: 0.2,
  watermarkY: 0.05,
};

export const safeLayout = (width: number, height: number): SafeLayout =>
  height / width >= 1.5 ? REELS : STANDARD;
