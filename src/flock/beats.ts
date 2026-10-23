/**
 * Flock film, the beat grid every cut hangs off (2026-10-21).
 *
 * Music is Mixkit "Cat Walk" (Arulo, Mixkit Stock Music Free License, commercial use, no credit),
 * from the shot shelf's `audio/bgm/`. Measured with the shelf's method (`method/music-beat-sync.md`,
 * librosa beat track + least-squares grid): 129.99 BPM, t0 0.708s, T 0.4616s, residual 9ms.
 * The kick enters at music beat 30 and the big drop lands on beat 62 (29.327s).
 *
 * The film starts on music beat 32, so the drop falls on film beat 30, which is where the cards
 * collapse and the smoke ring bursts (round 4 moved the start 8 beats earlier to make room for the
 * Job Match section). Everything else is placed in beats, converted to frames here
 * and nowhere else, so a retime is one edit.
 */
export const FPS = 30;
export const SIZE = { width: 1080, height: 1920 };

const MUSIC_T0 = 0.708;
const MUSIC_T = 0.4616;
const START_BEAT = 32;
/** Where the film starts inside the track, in frames (the `trimBefore` of the music). */
export const MUSIC_TRIM = Math.round((MUSIC_T0 + START_BEAT * MUSIC_T) * FPS);
const OFFSET_S = MUSIC_T0 + START_BEAT * MUSIC_T - MUSIC_TRIM / FPS;

/** Film frame of film beat n (fractional beats allowed). */
export const B = (n: number) => (OFFSET_S + n * MUSIC_T) * FPS;
export const BEAT_F = MUSIC_T * FPS;

// Scene boundaries, in beats.
export const FIELD_END = B(8); // logo open + component stack, then the crash zoom into the daily brief
export const TOUR_END = B(17); // graze tour over the real dashboard, then Job Match
export const DROP = B(30); // job cards collapse, ring bursts
export const FILM_FRAMES = Math.round(B(37.75));
