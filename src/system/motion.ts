/**
 * Motion tokens: the one place a film takes its timing and curves from (2026-10-23).
 *
 * Why: until now every film hand-tuned its own frames and beziers, so no two felt like the same brand and
 * every round re-argued pace. The shape is IBM Carbon's published motion system
 * (carbondesignsystem.com/elements/motion/overview): two modes, three curves each, a duration scale where
 * longer travel gets longer time. The values are ours, kept continuous with the films Jacob approved:
 *   - quiet.enter is the house EASE (lib/anim.ts, every approved film's entrances)
 *   - quiet.standard is EASE_CAMERA (the how-to film's camera, which Jacob called smooth)
 *   - the camera durations come from the approved films and the kit (FocusWalk 24 f moves, CraneRise rise)
 *
 * The rule: a film uses these names. A value typed into a film instead needs a comment saying why
 * (`// motion: <reason>`), the way Lago requires documented evidence for any exception.
 *
 * Modes:
 *   quiet  everything that moves inside the product: the camera, a card lifting, a press. Most of a film.
 *   showy  the one hero moment and the end card. Rare on purpose ("if people notice it, reduce it").
 */
import { Easing } from "remotion";
import rules from "./rules.json";
import { readHold as hold } from "./storyboard";

export const FPS = rules.fps;

type Curves = { standard: (t: number) => number; enter: (t: number) => number; exit: (t: number) => number };

export const CURVE: { quiet: Curves; showy: Curves } = {
  quiet: {
    standard: Easing.bezier(0.4, 0, 0.2, 1),
    enter: Easing.bezier(0.22, 1, 0.36, 1),
    exit: Easing.bezier(0.4, 0, 1, 1),
  },
  showy: {
    standard: Easing.bezier(0.4, 0.14, 0.3, 1),
    enter: Easing.bezier(0.16, 1, 0.3, 1),
    exit: Easing.bezier(0.7, 0, 0.84, 0),
  },
};

/**
 * Durations in frames at 30 fps. UI steps follow Carbon's 70/110/150/240/400/700 ms; camera steps are
 * film-scale and come from our approved films.
 */
export const DUR = {
  /** A colour or state flip: a button lighting, a check appearing. */
  flip: 2,
  /** A small element appearing: a chip, a caret, a label swap half. */
  small: 3,
  /** A press: the squash and release of a pointer on a control. */
  press: 5,
  /** A card or panel entering or leaving. */
  panel: 7,
  /** A big element arriving: a headline, a lifted card settling. */
  arrive: 12,
  /** The showy beat: the hero reveal, the end card's logo. */
  hero: 21,
  /** Camera: reframing between two parts of one page (FocusWalk). */
  reframe: 24,
  /** Camera: crossing a page or changing scale a lot. */
  travel: 36,
  /** Camera: a long reveal (crane rise, a pull back to the whole product). */
  reveal: 60,
} as const;

/** Longer travel gets longer time, never linearly: ~0.9 frames per sqrt(px), clamped to the camera scale. */
export const durFor = (distancePx: number, mode: "quiet" | "showy" = "quiet") => {
  const f = 8 + 0.9 * Math.sqrt(Math.max(0, distancePx));
  const lo = mode === "quiet" ? DUR.panel : DUR.arrive;
  return Math.round(Math.min(DUR.reveal, Math.max(lo, f)));
};

/** Spring presets for things with weight. `land` is the kit LogoEnd's, `pop` the kit's pop(). */
export const SPRING = {
  land: { damping: 14, stiffness: 90 },
  pop: { damping: 13, stiffness: 120 },
  soft: { damping: 20, stiffness: 70 },
} as const;

/** Seconds a line must stay fully on screen (rules.json, the studio reading rule). */
export const readHold = (text: string) => hold(text, rules.reading);
/** Same, in frames. */
export const readFrames = (text: string) => Math.ceil(readHold(text) * FPS);
/** A caption under a spoken line: the line plus 0.6 s, never under the reading minimum. */
export const captionHold = (spokenSeconds: number) => Math.max(rules.reading.min, spokenSeconds + rules.reading.captionPad);

/** Holds that keep breathing: the last frame of anything is never fully still. */
export const DRIFT = {
  /** Scale added over a hold, per second (the kit's 1% over four seconds). */
  scalePerSecond: 0.0025,
  /** Page-camera drift during a hold, as a share of the view width per second. */
  camPerSecond: 0.004,
} as const;
