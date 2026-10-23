/**
 * The cue library: one sound per kind of thing that happens on screen (2026-10-23).
 *
 * The rule (shots/method/sound-design.md, and the pro research: "one cue per type of event, synced to the exact
 * frame, most elements left silent"): a film never picks sounds. It names the event, `cueFor(event)` answers with
 * the one sound the brand uses for it, so every CampusAI film sounds like the same product.
 *
 * How each was chosen. Nobody listened on headphones in this session: the picks come from (1) what Jacob already
 * approved, which beats any note, because the press, the land, the camera move, the notification and the logo hit
 * are exactly what "Plan your spring" (round 8) and "Platform tour, dashboard to Job Match" (round 4) in
 * Motion/Good to Go use; and (2) for the three kinds those films never had (page arrives, success, typing), the
 * shelf measured against the listening criteria "soft, not cartoonish, one soft hit per real action": short, no
 * pitched synth tone (spectral flatness), no long tail, and nothing from the shelf's own reject list in
 * sound-design.md §3.3 (the "tone / bleep / success / notification" synth family that read as a game).
 *
 * Every file is Mixkit, Sound Effects Free License (commercial use, no credit needed), decoded from
 * Content/video-studio/shots/audio/sfx/<dir>/<original name>.mp3 to public/sound/cues/<kind>-<original name>.wav
 * (48 kHz). WAV because the render measured the mp3 copies about 23 ms late: Remotion did not trim the mp3s'
 * encoder delay the way ffmpeg does, and a wav has none to trim. Source URLs are below and
 * in shots/audio/ATTRIBUTION.md. Five shelf files have NO traceable source (keyboard, pop, riser-cine, sparkle,
 * whoosh-big) and none of them is used here.
 *
 * Levels. `level` is the file's loudest 50 ms in dBFS and `hit` is where its 5 ms envelope peaks, both measured
 * on the copied file (48 kHz decode through `npx remotion ffmpeg`). `rel` is how far under the music bed the cue
 * sits, in dB, taken from the approved films' own mixes (e.g. the Spring press: select-click at 0.4 over Tonight
 * at 0.8 put the click's loudest 50 ms about 12.7 dB under the music's integrated loudness). Score turns those three
 * numbers into a volume, so a cue sounds the same over any track at any loudness.
 */
import { staticFile } from "remotion";

export type CueKind = "press" | "land" | "arrive" | "move" | "success" | "notify" | "type" | "logo";

export type Cue = {
  kind: CueKind;
  /** File under public/. */
  file: string;
  /** What it is, in plain words. */
  sound: string;
  /** Mixkit item, for the licence trail. */
  source: string;
  /** Seconds from the start of the file to its hit (5 ms envelope peak). Score lines this up with the event frame. */
  hit: number;
  /** Loudest 50 ms of the file, dBFS. */
  level: number;
  /** Where the cue's loudest 50 ms sits against the music's integrated loudness, dB (negative = under). */
  rel: number;
  /** How long to let it ring, seconds (long files are cut, short ones play out). */
  ring: number;
  /** Why this one. */
  why: string;
};

export const CUES: Record<CueKind, Cue> = {
  press: {
    kind: "press",
    file: "sound/cues/press-ui-select-click.wav",
    sound: "a dry, small click",
    source: "Mixkit 'Select click' https://assets.mixkit.co/active_storage/sfx/1109/1109-preview.wav",
    hit: 0.065,
    level: -13.4,
    rel: -12.5,
    ring: 0.4,
    why: "Every press in Plan your spring (Good to Go) uses it, at 0.32 to 0.5. Short, no pitch, no tail.",
  },
  land: {
    kind: "land",
    file: "sound/cues/land-ui-popup-dry.wav",
    sound: "a soft, dry pop, 0.3 s",
    source: "Mixkit 'Dry pop up notification alert' https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.wav",
    hit: 0.134,
    level: -17.4,
    rel: -13,
    ring: 0.3,
    why: "Both Good to Go films use it for a card landing (Platform tour's card stack, Spring's classes). " +
      "sound-design.md lists it with the synth alerts; Jacob's approval of it twice in context is the stronger evidence.",
  },
  arrive: {
    kind: "arrive",
    file: "sound/cues/arrive-wind-swoosh-short.wav",
    sound: "a short, low breath of air",
    source: "Mixkit 'Short wind swoosh' https://assets.mixkit.co/active_storage/sfx/1461/1461-preview.wav",
    hit: 0.164,
    level: -12.1,
    rel: -14,
    ring: 0.6,
    why: "New pick (no approved film had a page-arrives sound). Lowest, softest air on the shelf (centroid ~660 Hz), " +
      "peaks fast and is gone by 0.3 s, so it marks a new page without sounding like a transition effect.",
  },
  move: {
    kind: "move",
    file: "sound/cues/move-swoosh-quick.wav",
    sound: "a small, quick sweep",
    source: "Mixkit 'Fast small sweep transition' https://assets.mixkit.co/active_storage/sfx/166/166-preview.wav",
    hit: 0.296,
    level: -12,
    rel: -9.5,
    ring: 0.7,
    why: "Both Good to Go films use it for a camera or panel move (the fan, the why panel, 'to advisor').",
  },
  success: {
    kind: "success",
    file: "sound/cues/success-chime-crystal.wav",
    sound: "one glassy chime, kept low",
    source: "Mixkit 'Crystal chime' https://assets.mixkit.co/active_storage/sfx/3108/3108-preview.wav",
    hit: 0.227,
    level: -14.5,
    rel: -15,
    ring: 1.2,
    why: "New pick. A real glass sound, not a synth 'success' tone (sound-design.md: the synth success tones read as " +
      "a game). Weakest pick of the set: it has not been heard in a film yet. Fallback: no sound, since the press " +
      "that caused the success already has one.",
  },
  notify: {
    kind: "notify",
    file: "sound/cues/notify-ui-message-pop.wav",
    sound: "a round, quiet pop",
    source: "Mixkit 'Message pop alert' https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.wav",
    hit: 0.056,
    level: -21.4,
    rel: -12.5,
    ring: 0.3,
    why: "Platform tour (Good to Go) uses it when a card lifts. A notification on screen is the one place a " +
      "notification-like sound is literal rather than decoration.",
  },
  type: {
    kind: "type",
    file: "sound/cues/type-switch-tap.wav",
    sound: "a tiny real switch tap, 20 ms",
    source: "Mixkit 'On or off light switch tap' https://assets.mixkit.co/active_storage/sfx/2585/2585-preview.wav",
    hit: 0.004,
    level: -18.7,
    rel: -19,
    ring: 0.12,
    why: "New pick. Closest thing on the shelf to a modern key: a real switch, no pitch, 20 ms long. The typewriter " +
      "files read as old-fashioned and the shelf keyboard has no licence trail. Alternates with `type-alt`.",
  },
  logo: {
    kind: "logo",
    file: "sound/cues/logo-bass-hit-futuristic.wav",
    sound: "a soft bass hit with a short tail",
    source: "Mixkit 'Futuristic bass hit' https://assets.mixkit.co/active_storage/sfx/2303/2303-preview.wav",
    hit: 0.206,
    level: -8.3,
    rel: -2,
    ring: 2.5,
    why: "Spring (Good to Go) lands its logo on it, and Platform tour uses it on its biggest beat.",
  },
};

/** The second typing sample, so a run of keys alternates instead of repeating one file (sound-design.md §4.2). */
export const TYPE_ALT: Cue = {
  ...CUES.type,
  file: "sound/cues/type-alt-switch-light.wav",
  sound: "a lighter switch click",
  source: "Mixkit 'Light switch sound' https://assets.mixkit.co/active_storage/sfx/2579/2579-preview.wav",
  hit: 0.065,
  level: -27,
  why: "Partner to the switch tap: same family, different file, so typing never machine-guns one sample.",
};

/** A thing that happens on screen, in film frames. */
export type SoundEvent = {
  kind: CueKind;
  /** Film frame the action happens on (the press lands, the card settles, the page is in place). */
  frame: number;
  /** Extra trim in dB on top of the brand level (negative = quieter). Default 0. */
  db?: number;
  /** Snap this event to the music before placing it: "beat", "downbeat" or "half" (half beats). Default none. */
  snap?: "beat" | "downbeat" | "half";
  /** Name for the timeline, e.g. "press: Ask CampusAI". */
  name?: string;
  /** For typing runs: which key in the run this is (alternates the sample and steps the level down). */
  index?: number;
};

/**
 * The cue for an event. Typing alternates its two samples by `index` and steps down 0.4 dB a key (the shelf's
 * "volume staircase" against machine-gunning), floored at -4 dB.
 */
export function cueFor(event: SoundEvent | CueKind): Cue & { src: string; trimDb: number } {
  const e: SoundEvent = typeof event === "string" ? { kind: event, frame: 0 } : event;
  let cue = CUES[e.kind];
  let trim = e.db ?? 0;
  if (e.kind === "type" && e.index !== undefined) {
    if (e.index % 2 === 1) cue = TYPE_ALT;
    trim += Math.max(-4, -0.4 * e.index);
  }
  return { ...cue, src: staticFile(cue.file), trimDb: trim };
}
