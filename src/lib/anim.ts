import { Easing, interpolate } from "remotion";

/** The one easing curve used for everything. Fast out, long settle. */
export const EASE = Easing.bezier(0.22, 1, 0.36, 1);

/** Softer curve for camera moves, so zooms never feel snappy. */
export const EASE_CAMERA = Easing.bezier(0.4, 0, 0.2, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Fade + rise, the default entrance for any piece of text. */
export const enter = (frame: number, from: number, length = 18) => {
  const p = interpolate(frame, [from, from + length], [0, 1], {
    ...clamp,
    easing: EASE,
  });
  return { opacity: p, y: (1 - p) * 24, progress: p };
};

/** Fade + fall, the mirror of enter(). */
export const exit = (frame: number, at: number, length = 14) => {
  const p = interpolate(frame, [at, at + length], [0, 1], {
    ...clamp,
    easing: EASE,
  });
  return { opacity: 1 - p, y: p * -16, progress: p };
};

/** Combined in/out envelope for anything with a start and a duration. */
export const envelope = (
  frame: number,
  from: number,
  duration: number,
  inLength = 18,
  outLength = 14,
) => {
  const i = enter(frame, from, inLength);
  const o = exit(frame, from + duration - outLength, outLength);
  return {
    opacity: Math.min(i.opacity, o.opacity),
    y: i.y + o.y,
    visible: frame >= from - 1 && frame <= from + duration + 1,
  };
};

/** Interpolate one channel across an arbitrary set of keyframes. */
export const keyframes = (
  frame: number,
  points: { at: number; value: number }[],
  easing = EASE_CAMERA,
) => {
  if (points.length === 0) return 0;
  if (points.length === 1) return points[0].value;
  return interpolate(
    frame,
    points.map((p) => p.at),
    points.map((p) => p.value),
    { ...clamp, easing },
  );
};
