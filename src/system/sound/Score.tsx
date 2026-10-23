/**
 * Score: the whole sound of a film in one component (2026-10-23).
 *
 *   <Score music={{ track: "cat-walk", startAt: 14.77 }}
 *          events={[{ kind: "press", frame: 42 }, { kind: "land", frame: 60, snap: "beat" }]}
 *          duck={[{ from: 90, to: 140, name: "hero line" }]}
 *          end={{ from: 210 }} />
 *
 * What it does:
 *   - plays the track from `startAt` (track seconds, rounded to a frame), with a short fade in
 *   - places each event's cue so the cue's HIT (not its file start) lands on the event's frame; an event with
 *     `snap` is first moved to the nearest beat / downbeat / half beat (`beatGrid(...).snapToBeat`)
 *   - ducks the music under each named moment (default 7 dB, 6 frame ramps)
 *   - fades the music out under the end card, reaching silence on the last frame
 *   - sets every level from measurements, not by ear: the music gain comes from the track's measured loudness
 *     (EBU R128, in its beat map) corrected for the loudness of the part actually used, and each cue sits a fixed
 *     number of dB under that bed (cues.ts `rel`). Aim: the finished film at -14 LUFS integrated, true peak under
 *     -1 dBTP. Checked on the preview render with ffmpeg loudnorm (see preview.tsx for the numbers).
 *
 * `music: { ..., mute: true }` renders the cues alone, still snapped to the track's grid (the silent-music master
 * the pro research recommends shipping beside the mixed one); `music: null` means no track at all. Everything Score decides is also returned by `mixPlan()`, so a checker or a test can read the
 * exact frames and volumes without rendering.
 */
import React from "react";
import { Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { beatGrid, getTrack, type BeatGrid } from "./beats";
import { cueFor, type SoundEvent } from "./cues";

export type Duck = { from: number; to: number; /** dB under the bed, default 7 */ db?: number; name?: string };

export type ScoreProps = {
  music?: {
    track: string;
    /** Track seconds where the film starts. Default 0. */
    startAt?: number;
    /** Trim in dB. */
    db?: number;
    /** Keep the track's beat grid (snapping still works) but play no music: the cues-only master. */
    mute?: boolean;
  } | null;
  events?: SoundEvent[];
  duck?: Duck[];
  /** The end card: the music fades out from `from` to the last frame. */
  end?: { from: number };
  /** Integrated loudness to aim the film at, LUFS. Default -14 (Instagram, TikTok, YouTube all normalise near it). */
  target?: number;
};

/**
 * The measured delay of a rendered mp4's audio against its picture, in frames: 42.7 ms = 2048 samples at 48 kHz,
 * the AAC encoder's priming, which the mp4 does not declare (shots/method/sound-design.md §4.6 predicted 1.28 f).
 * Measured 2026-10-23 on SoundPreview by cross-correlating the music source against the render: +42.7 ms.
 * Pipeline: Remotion 4.0.515, h264 + AAC 48 kHz, mp4. Re-measure (scripts/sound-check.py) if any of those change.
 * Cues start this much earlier; the music starts one frame further into the track (33 ms), leaving it ~10 ms late.
 */
export const OUTPUT_AUDIO_OFFSET_F = 1.28;
/** Cues sit this far under the music bed's own target (cues.ts `rel` is relative to the bed). */
const BED_UNDER_TARGET_DB = 0.6;
const FADE_IN_F = 6; // motion: 0.2 s, long enough not to click, short enough that the hook has its music
const DUCK_RAMP_F = 6; // motion: matches the DUR.press/panel scale, a duck faster than this pumps audibly
/**
 * The highest mono sample peak the music bed may reach, dBFS. On four calibration renders the finished stereo mix's
 * true peak sat 0.2 to 0.5 dB over (mono peak + gain), logo hit included, so -1.6 keeps a film at or under -1 dBTP.
 */
const MUSIC_PEAK_CEIL = -1.6;
/**
 * The estimate above (excerpt K-loudness from the beat map, the gated envelope) came out 1.0 dB quiet on every
 * calibration render (2026-10-23, SoundPreview over tech-house-vibes, slow-walk, lofi-01, cat-walk: -0.8, -1.2,
 * -0.9, -1.2 dB against the prediction), so the music gets that dB back. Re-measure with scripts/sound-check.py.
 */
const LOUDNESS_CAL_DB = 1.0;
/** The largest gain Score will apply (a quiet track is lifted at most this much). */
const MAX_GAIN = 2;

const dbToGain = (db: number) => Math.pow(10, db / 20);

/**
 * Loudness of the part of the track a film uses: the track's measured LUFS plus the difference between the
 * excerpt's and the whole track's K-weighted power (per beat, from the beat map), both relatively gated the way
 * EBU R128 gates (beats more than 10 dB under the mean are left out). Also the excerpt's highest sample peak.
 */
export function excerptLufs(track: string, startAt: number, seconds: number): { lufs: number; peak: number } {
  const m = getTrack(track);
  const lufs = m.loudness?.integratedLufs ?? -14;
  const k = m.kLoud ?? m.energy;
  const gated = (dbs: number[]) => {
    const mean = dbs.reduce((a, d) => a + Math.pow(10, d / 10), 0) / Math.max(1, dbs.length);
    const keep = dbs.filter((d) => Math.pow(10, d / 10) > 0.1 * mean);
    return 10 * Math.log10(keep.reduce((a, d) => a + Math.pow(10, d / 10), 0) / Math.max(1, keep.length));
  };
  const idx = m.beats.map((t, i) => [t, i] as const).filter(([t]) => t >= startAt && t < startAt + seconds).map(([, i]) => i);
  if (!idx.length) return { lufs, peak: m.loudness?.truePeakDb ?? 0 };
  const peak = m.peak ? Math.max(...idx.map((i) => m.peak![i])) : (m.loudness?.truePeakDb ?? 0);
  return { lufs: lufs + (gated(idx.map((i) => k[i])) - gated(k)), peak };
}

export type PlacedCue = {
  name: string;
  kind: SoundEvent["kind"];
  src: string;
  /** The frame the event asked for, after snapping. */
  frame: number;
  /** The Sequence start: frame minus the cue's hit, minus the output offset. */
  from: number;
  /** Frames to cut off the start of the file when `from` would be negative. */
  trimBefore: number;
  durationInFrames: number;
  volume: number;
};

export type MixPlan = {
  grid: BeatGrid | null;
  musicSrc: string | null;
  musicStartFrame: number;
  musicGain: number;
  bedLufs: number;
  /** True when the peak ceiling, not the loudness target, set the music gain (the film will land under -14). */
  peakLimited: boolean;
  cues: PlacedCue[];
  musicVolumeAt: (frame: number) => number;
};

export function mixPlan(p: ScoreProps, fps: number, durationInFrames: number): MixPlan {
  const target = p.target ?? -14;
  const bed = target - BED_UNDER_TARGET_DB;
  const grid = p.music ? beatGrid(p.music.track, p.music.startAt ?? 0, fps) : null;
  const playing = !!p.music && !p.music.mute;
  const ramp = (f: number, a: number, b: number) => Math.min(1, Math.max(0, (f - a) / Math.max(1, b - a)));
  const smooth = (x: number) => x * x * (3 - 2 * x);
  // the logo hit gets the room: the music dips 4 dB under it (it sat on the loudest peak of the preview mix)
  const ducks: Duck[] = [
    ...(p.duck ?? []),
    ...(p.events ?? []).filter((e) => e.kind === "logo").map((e) => ({ from: e.frame, to: e.frame + 24, db: 4, name: "logo" })),
  ];
  // the envelope (fade in, ducks, end fade) without the gain
  const shape = (f: number) => {
    let v = smooth(ramp(f, 0, FADE_IN_F));
    for (const d of ducks) {
      const depth = 1 - dbToGain(-(d.db ?? 7));
      const k = smooth(ramp(f, d.from - DUCK_RAMP_F, d.from)) * (1 - smooth(ramp(f, d.to, d.to + DUCK_RAMP_F)));
      v *= 1 - depth * k;
    }
    if (p.end) {
      // equal-power fade from the end card's start to silence on the last frame
      const k = ramp(f, p.end.from, durationInFrames - 1);
      v *= Math.cos((k * Math.PI) / 2);
    }
    return v;
  };
  let musicGain = 0;
  let peakLimited = false;
  if (playing && p.music && grid) {
    // the part of the track used, then the film's own envelope: integrated loudness is the mean power over the
    // blocks that pass EBU R128's relative gate (about 10 LU under the mean), so the ducks and the end fade lower
    // it, and the gain makes up for exactly that much
    const ex = excerptLufs(p.music.track, grid.startFrame / fps, durationInFrames / fps);
    const pw = Array.from({ length: durationInFrames }, (_, f) => shape(f) ** 2);
    const mean = pw.reduce((a, b) => a + b, 0) / Math.max(1, pw.length);
    const passing = pw.filter((x) => x > 0.1 * mean);
    const envDb = 10 * Math.log10(passing.reduce((a, b) => a + b, 0) / Math.max(1, passing.length) || 1);
    // loudness asks for this much; the peak ceiling may ask for less, and the ceiling wins (clipping is worse than
    // a film 1 dB under -14, which every platform's normaliser evens out anyway)
    const wantDb = bed - ex.lufs - envDb + LOUDNESS_CAL_DB + (p.music.db ?? 0);
    const ceilDb = MUSIC_PEAK_CEIL - ex.peak;
    musicGain = Math.min(MAX_GAIN, dbToGain(Math.min(wantDb, ceilDb)));
    peakLimited = ceilDb < wantDb;
  }
  const musicVolumeAt = (f: number) => (playing ? musicGain * shape(f) : 0);
  const cues = (p.events ?? []).map((e, i): PlacedCue => {
    const cue = cueFor(e);
    const frame = e.snap && grid ? grid.snapToBeat(e.frame, e.snap) : Math.round(e.frame);
    const start = Math.round(frame - cue.hit * fps - OUTPUT_AUDIO_OFFSET_F);
    return {
      name: e.name ?? `${e.kind} ${i}`,
      kind: e.kind,
      src: cue.src,
      frame,
      from: Math.max(0, start),
      trimBefore: Math.max(0, -start),
      durationInFrames: Math.max(1, Math.round(cue.ring * fps)),
      volume: Math.min(MAX_GAIN, dbToGain(bed + cue.rel + cue.trimDb - cue.level)),
    };
  });
  return {
    grid,
    musicSrc: playing && p.music ? staticFile(getTrack(p.music.track).file) : null,
    // one frame further into the track makes up for most of the encoder's 1.28 frame delay
    musicStartFrame: (grid?.startFrame ?? 0) + Math.round(OUTPUT_AUDIO_OFFSET_F),
    musicGain,
    bedLufs: bed,
    peakLimited,
    cues,
    musicVolumeAt,
  };
}

export const Score: React.FC<ScoreProps> = (p) => {
  const { fps, durationInFrames } = useVideoConfig();
  const plan = React.useMemo(() => mixPlan(p, fps, durationInFrames), [p, fps, durationInFrames]);
  return (
    <>
      {plan.musicSrc && (
        <Sequence name="music" layout="none">
          <Audio src={plan.musicSrc} trimBefore={plan.musicStartFrame} volume={(f) => plan.musicVolumeAt(f)} />
        </Sequence>
      )}
      {plan.cues.map((c, i) => (
        <Sequence key={`${c.name}-${i}`} name={c.name} from={c.from} durationInFrames={c.durationInFrames} layout="none">
          <Audio src={c.src} trimBefore={c.trimBefore || undefined} volume={() => c.volume} />
        </Sequence>
      ))}
    </>
  );
};
