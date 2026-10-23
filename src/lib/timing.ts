/**
 * Frame-rate independence for this studio.
 *
 * Taken from the idea in Nutlope/inspo's `teaser/src/timing.ts` (MIT), but
 * deliberately NOT a copy of it. Inspo's scenes are authored as 30fps FRAME
 * NUMBERS, so their shim rescales the current frame back to that scale. Ours
 * are not: every scene here computes
 *
 *     const ms = (useCurrentFrame() / useVideoConfig().fps) * 1000;
 *
 * and animates off milliseconds, which is already fps-independent and is the
 * better of the two models — there is nothing to rescale.
 *
 * What WAS nailed to 30 is the sequence arithmetic: the `f(seconds)` helper
 * and the transition lengths that decide where each beat starts and how long
 * the composition runs. Those are frame counts, and they were computed against
 * a module-level `const FPS = 30` that had no relationship to the fps the
 * composition actually renders at.
 *
 * With these helpers, fps lives in `Root.tsx` alone. Raising a composition to
 * 60 is a one-line change there: every beat lands on the same millisecond, with
 * twice as many samples of every interpolation. Do not hand-double constants
 * inside a scene.
 *
 * NOTE: nothing in this studio renders at 60 yet. Every composition is still
 * 30fps, on purpose, so this change moved no frame. It only made the move
 * possible without a re-tune.
 */

/** Whole frames for a duration in seconds, at this composition's fps. */
export const secondsToFrames = (seconds: number, fps: number) =>
  Math.round(seconds * fps);

/** Whole frames for a duration in milliseconds, at this composition's fps. */
export const msToFrames = (ms: number, fps: number) =>
  Math.round((ms / 1000) * fps);
