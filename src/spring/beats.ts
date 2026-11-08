/**
 * Spring film, the beat grid every cut hangs off (round 5, 2026-10-22).
 *
 * Music is Mixkit "Tonight" (hip hop, Mixkit Stock Music Free License, commercial use, no credit), from the shot
 * shelf's `audio/bgm/`. Grid from the shelf's method (`method/music-beat-sync.md`): 105.00 BPM, t0 0.907s,
 * T 0.5714s. Loudness per beat, measured with librosa RMS: a medium level with a dip on the last beat of each
 * 8-beat phrase, stepping up into the full section on beats 88 and 89 (0.47, 0.64), steady until 124.
 *
 * Round 3 is slower (Jacob: "a little too quick"): most steps get two beats instead of one. Round 4 slows the
 * opening and the preferences again and adds the template swap, and round 5 opens faster
 * and skips two answers, so the film starts on music beat 60 and the picks start at film beat 29.3 (music 89.3),
 * on the step up. `B(n)` is FILM beat n.
 *
 * Round 9 (2026-10-30): no music (Jacob adds a trending song on Instagram and TikTok), the grid stays as the
 * film's clock. The opening plays faster (Jacob: "a bit quicker"): film beats 0 to OPEN_END run at QUICK of a
 * beat each, everything after shifts earlier by the time saved.
 */
export const FPS = 30;
export const SIZE = { width: 1080, height: 1350 };

const MUSIC_T0 = 0.907;
const MUSIC_T = 60 / 105;
const START_BEAT = 60;
/** Where the film starts inside the track, in frames (the `trimBefore` of the music). */
export const MUSIC_TRIM = Math.round((MUSIC_T0 + START_BEAT * MUSIC_T) * FPS);
const OFFSET_S = MUSIC_T0 + START_BEAT * MUSIC_T - MUSIC_TRIM / FPS;

const OPEN_END = 5.3; // where you stand appears
const QUICK = 0.65;
const warp0 = (n: number) => (n <= OPEN_END ? n * QUICK : n - OPEN_END * (1 - QUICK));
const unwarp0 = (t: number) => (t <= OPEN_END * QUICK ? t / QUICK : t + OPEN_END * (1 - QUICK));
/**
 * Round 14: holds inserted into the film. At film beat `at` the screen and the camera stop for `d` beats while an
 * animation on top plays (the lock snapping on, the template coming apart, the spotlight on why). Everything after
 * `at` moves later by `d`.
 */
export const HOLDS: { at: number; d: number }[] = [
  { at: 25.8, d: 1.2 }, // the lock snaps on
  { at: 26.2, d: 2.8 }, // the template comes apart
  { at: 33.2, d: 4.2 }, // the spotlight on why
];
const warp = (n: number) => warp0(n) + HOLDS.filter((h) => h.at < n).reduce((s, h) => s + h.d, 0);

/** Film frame of film beat n (fractional beats allowed). */
export const B = (n: number) => (OFFSET_S + warp(n) * MUSIC_T) * FPS;
/** Film beat at frame f (the inverse of B); inside a hold it stays on the hold's beat. */
export const beatAt = (f: number) => {
  let t = (f / FPS - OFFSET_S) / MUSIC_T;
  let shift = 0;
  for (const h of HOLDS) {
    const a = warp0(h.at) + shift;
    if (t <= a) break;
    if (t < a + h.d) return h.at;
    shift += h.d;
  }
  return unwarp0(t - shift);
};
/** The frames a hold runs: [first, last]. */
export const holdFrames = (at: number) => { const h = HOLDS.find((x) => x.at === at)!; return [B(at), B(at) + h.d * MUSIC_T * FPS] as const; };
export const FILM_FRAMES = Math.round(B(60.2)); // END_AT 56.2 plus the end card (the holds are inside B)
