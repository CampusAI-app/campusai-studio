/**
 * Campus film, the beat grid every cut hangs off (2026-10-21, round 2).
 *
 * Music is Mixkit "G Eazy NBA type" (Arulo, Mixkit Stock Music Free License, commercial use, no credit),
 * from the shot shelf's `audio/bgm/`. Measured with the shelf's method (`method/music-beat-sync.md`,
 * librosa beat track + least-squares grid): 86.67 BPM, t0 12.944s, T 0.69231s, residual 16ms.
 * Loudness per beat: 82 kicks (1.4), 84 to 87 dip, 88 is the drop (rms 0.21, kick 4.0, the loudest
 * kick in the track), 96 and 101 kick again (3.4, 3.6).
 *
 * Round 2 starts on music beat 76, so the rail brakes on the kick at film beat 6, the bootcamp lands
 * in its Friday slot on the drop at film beat 12, and the study block lands on the kick at 20.
 */
export const FPS = 30;
export const SIZE = { width: 1080, height: 1920 };

const MUSIC_T0 = 12.9441;
const MUSIC_T = 0.69231;
const START_BEAT = 76;
/** Where the film starts inside the track, in frames (the `trimBefore` of the music). */
export const MUSIC_TRIM = Math.round((MUSIC_T0 + START_BEAT * MUSIC_T) * FPS);
const OFFSET_S = MUSIC_T0 + START_BEAT * MUSIC_T - MUSIC_TRIM / FPS;

/** Film frame of film beat n (fractional beats allowed). */
export const B = (n: number) => (OFFSET_S + n * MUSIC_T) * FPS;
export const BEAT_F = MUSIC_T * FPS;

// Scene boundaries, in beats.
export const RAIL_AT = B(2); // the date rail starts moving
export const STOP_AT = B(6); // the rail brakes on Friday 23
export const PRESS_AT = B(8); // Add to CampusAI Calendar
export const FLY_AT = B(8.6); // the card leaves the rail for its slot
export const DROP = B(12); // the bootcamp lands in Friday 5pm, on the drop
export const QUIZ_AT = B(14.6); // the due row, Quiz 2 lights up
export const ASK_AT = B(15.2); // the Ask card slides in
export const ASK_PRESS = B(16); // Find time to study for Quiz 2
export const ANSWER_AT = B(16.5); // the chat's answer
export const PILL_PRESS = B(18); // the answer's add button
export const STUDY_LAND = B(20); // the study block lands on Wednesday 6:30pm, on the kick
export const OUTRO_AT = B(22); // ring shrinks into the i dot, the wordmark locks up
export const FILM_FRAMES = Math.round(B(26.5));
