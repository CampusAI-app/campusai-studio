/**
 * The chat film's timeline, in one place, because two things read it: the film
 * itself (`ChatVideo.tsx`) and its soundtrack (`ChatSoundtrack.tsx`).
 *
 * Sound cues have to land on real moments — the send press, each thinking step,
 * the gather. Those moments are defined by the beat lengths below. If the cues
 * carried their own copy of the arithmetic, lengthening one beat would move the
 * picture and leave the sound behind, and nothing would fail loudly: the film
 * would just quietly go out of sync. One rule, two readers.
 *
 * Everything here is TIME, never frames. `msToFrames` converts at whatever fps
 * the composition declares in Root.tsx.
 */

/** Beat lengths in seconds. */
export const BEATS = {
  hook: 2.0,
  ask: 3.6, // drawn: settle 620ms, placeholder, then 45ms/char + the press
  think: 3.7, // four rows at 800ms, camera walking each one, then the gather
  answer: 5.0, // block 1 streams word by word, camera pulls out, 2 and 3 land
  breadth: 2.6,
  cta: 2.2,
} as const;

export type BeatName = keyof typeof BEATS;

/** Register changes: text -> UI, UI -> graphic. Dips through the dark ground. */
export const DISSOLVE_MS = 300;
/** Cuts WITHIN one screen: composer -> trace -> answer. A shorter, softer cut. */
export const BEAT_CUT_MS = 467;

/**
 * Which transition precedes each beat. `hook` opens the film, so it has none.
 * This mirrors the T() / B() order in ChatVideo's TransitionSeries exactly.
 */
const LEAD_IN: Record<BeatName, number> = {
  hook: 0,
  ask: DISSOLVE_MS,
  think: BEAT_CUT_MS,
  answer: BEAT_CUT_MS,
  breadth: DISSOLVE_MS,
  cta: DISSOLVE_MS,
};

const ORDER: BeatName[] = ["hook", "ask", "think", "answer", "breadth", "cta"];

/**
 * Absolute start of every beat, in milliseconds from the first frame.
 *
 * A TransitionSeries overlaps each sequence with its neighbour by the length of
 * the transition between them, so a beat starts earlier than the plain sum of
 * the beats before it — by exactly its own lead-in.
 *
 * At the current values: hook 0, ask 1700, think 4833, answer 8066,
 * breadth 12766, cta 15066, ending at 17266ms (17.27s).
 */
export const BEAT_START_MS: Record<BeatName, number> = (() => {
  const out = {} as Record<BeatName, number>;
  let cursor = 0;
  for (const name of ORDER) {
    cursor -= LEAD_IN[name];
    out[name] = cursor;
    cursor += BEATS[name] * 1000;
  }
  return out;
})();

/** Total run time in milliseconds. */
export const CHAT_VIDEO_MS =
  Object.values(BEATS).reduce((a, b) => a + b, 0) * 1000 -
  Object.values(LEAD_IN).reduce((a, b) => a + b, 0);
