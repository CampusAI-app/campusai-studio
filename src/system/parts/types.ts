/**
 * What every scene part receives (2026-10-23). A part is a component that draws one shot of a
 * storyboard for any aspect: it frames by `shot.focus` through `layout`, so the same storyboard
 * renders in 9x16, 4x5, 16x9 and 1x1 without a blind crop.
 */
import type { Brand } from "../../kit/brand";
import type { PageCam, Rect } from "../../kit/camera";
import type { Aspect, Shot, Storyboard, Surface } from "../storyboard";

/** Where things go on the canvas for one aspect. All canvas px. */
export type Layout = {
  aspect: Aspect;
  W: number;
  H: number;
  /** Canvas px per "1080 px short side" unit: multiply any design size by it. */
  u: number;
  /** The band above the product: the held logo mark (left) and small headlines (centre). */
  top: Rect;
  /** Where the real page is drawn. */
  view: Rect;
  /** Where the focus is framed: inside the view, and inside the Reels safe band on 9x16. */
  focusBox: Rect;
  /** The caption band below the product, or null when the film has no captions (the view takes the room). */
  caption: Rect | null;
  /** The band every word must stay inside (9x16: y 285 to 1500, clear of the Reels UI and the feed crop). */
  safe: Rect;
  /** The held logo mark: left edge, top, width. */
  mark: { x: number; y: number; width: number };
  /** Small headline: centre line, size, the widest it may run. */
  headline: { cx: number; cy: number; size: number; maxW: number };
  /** A small label row opposite the mark (the timelapse clock): its right edge and centre line. */
  label: { right: number; cy: number };
  /** Caption type size (Inter 500), canvas px. */
  captionSize: number;
  /** The big line of a "Like when..." opener: size and widest line. */
  bigLine: { size: number; maxW: number };
  /** Corner radius of the page view. */
  radius: number;
};

/** How a shot meets its neighbours, worked out by Film. */
export type Handoff = {
  /** How the previous shot hands into this one. */
  in: "start" | "cut" | "camera-same" | "camera-whip" | "carry";
  /** How this shot hands to the next. "end" when the end card follows. */
  out: "end" | "cut" | "camera-same" | "camera-whip" | "carry";
};

/** Everything a part needs beyond the shot itself, prepared by Film. */
export type ShotCtx = {
  board: Storyboard;
  /** Shot length in frames. */
  dur: number;
  /** The page camera at a frame in the shot (Film plans it so a same-surface handoff never jumps). */
  cam: (f: number) => PageCam;
  handoff: Handoff;
  /** For the end card: the shot before it, so its product can carry into the logo. */
  prev?: { surface?: Surface; cam: PageCam; focus?: Rect };
};

export type PartProps = {
  shot: Shot;
  surface?: Surface;
  brand: Brand;
  aspect: Aspect;
  /** Frame inside the shot. Can run below 0 or past `ctx.dur` while a handoff overlaps two shots: hold the edge state. */
  f: number;
  layout: Layout;
  /** `shot.props`, never undefined. */
  props: Record<string, unknown>;
  ctx: ShotCtx;
};
