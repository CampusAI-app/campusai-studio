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
 */
export const FPS = 30;
export const SIZE = { width: 1080, height: 1350 };

const MUSIC_T0 = 0.907;
const MUSIC_T = 60 / 105;
const START_BEAT = 60;
/** Where the film starts inside the track, in frames (the `trimBefore` of the music). */
export const MUSIC_TRIM = Math.round((MUSIC_T0 + START_BEAT * MUSIC_T) * FPS);
const OFFSET_S = MUSIC_T0 + START_BEAT * MUSIC_T - MUSIC_TRIM / FPS;

/** Film frame of film beat n (fractional beats allowed). */
export const B = (n: number) => (OFFSET_S + n * MUSIC_T) * FPS;
export const FILM_FRAMES = Math.round(B(58.6));
