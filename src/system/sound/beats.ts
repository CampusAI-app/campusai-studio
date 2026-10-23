/**
 * A track's beat map (written by scripts/beats.mjs into public/sound/beats/<track>.json) and the grid a film uses
 * to put things on the music (2026-10-23).
 *
 * Times in a BeatMap are float seconds into the TRACK. A film starts somewhere inside the track (`startAt`), so the
 * grid converts once, here: film frame = (track seconds - start) * fps. The start is rounded to a whole frame first,
 * because the music's `trimBefore` can only cut on a frame, and every beat is then exact against that cut.
 */
import { TRACKS } from "./tracks";

export type Moment = {
  kind: "lift" | "breakdown" | "near-silence";
  /** Track seconds. */
  t: number;
  /** Beat index in `beats`. */
  beat: number;
  /** dB of the step (lift, breakdown) or how far under the median (near-silence). */
  strength: number;
  /** One of the track's three strongest lifts: a drop or the full section arriving. */
  big?: boolean;
  /** Near-silence only: how many beats it lasts. */
  beats?: number;
};

export type BeatMap = {
  track: string;
  /** Under public/, for staticFile. */
  file: string;
  source: { url: string | null; licence: string | null } | null;
  duration: number;
  bpm: number;
  /** Seconds per beat. */
  period: number;
  /** First beat, track seconds (the attack of the kick or hat, half-rise point). */
  t0: number;
  barPhase: number;
  beats: number[];
  downbeats: number[];
  /** Per-beat loudness, dB RMS. */
  energy: number[];
  /** Per-beat K-weighted mean square, dB (mono): the LUFS building block. */
  kLoud?: number[];
  /** Per-beat sample peak, dBFS (mono). */
  peak?: number[];
  moments: Moment[];
  sections: { from: number; to: number; level: "quiet" | "mid" | "full" }[];
  ending: { lastFullBar: number | null; quietFrom: number; seconds: number };
  loudness: { integratedLufs: number; truePeakDb: number; lra: number } | null;
  fit: Record<string, unknown>;
};

export const trackNames = () => Object.keys(TRACKS);

export function getTrack(name: string): BeatMap {
  const m = TRACKS[name.replace(/\.mp3$/, "")];
  if (!m) throw new Error(`No beat map for "${name}". Run: node scripts/beats.mjs ${name}   (known: ${trackNames().join(", ")})`);
  return m;
}

export type Snap = "beat" | "downbeat" | "half";

export type BeatGrid = {
  map: BeatMap;
  fps: number;
  /** The whole frame the film starts on inside the track (the music's trimBefore). */
  startFrame: number;
  /** Film frame (fractional) of every beat at or after the film's start. */
  beatFrames: number[];
  downbeatFrames: number[];
  /** Film frame of track beat index n (fractional; may be negative for beats before the start). */
  beatFrame: (n: number) => number;
  /** The nearest beat (or downbeat, or half beat) to a film frame, as a whole frame. */
  snapToBeat: (frame: number, to?: Snap) => number;
  /** The track's moments in film frames, only the ones inside [0, duration). */
  momentsIn: (durationInFrames: number) => (Moment & { frame: number })[];
};

export function beatGrid(track: string | BeatMap, startAt = 0, fps = 30): BeatGrid {
  const map = typeof track === "string" ? getTrack(track) : track;
  const startFrame = Math.round(startAt * fps);
  const s = startFrame / fps;
  const toFrame = (t: number) => (t - s) * fps;
  const beatFrame = (n: number) => toFrame(map.t0 + n * map.period);
  const beatFrames = map.beats.map(toFrame).filter((f) => f >= -0.5);
  const downbeatFrames = map.downbeats.map(toFrame).filter((f) => f >= -0.5);
  const snapToBeat = (frame: number, to: Snap = "beat") => {
    const step = to === "downbeat" ? 4 * map.period : to === "half" ? map.period / 2 : map.period;
    const origin = to === "downbeat" ? (map.downbeats[0] ?? map.t0) : map.t0;
    const t = s + frame / fps;
    const k = Math.round((t - origin) / step);
    return Math.max(0, Math.round(toFrame(origin + k * step)));
  };
  const momentsIn = (d: number) =>
    map.moments.map((m) => ({ ...m, frame: toFrame(m.t) })).filter((m) => m.frame >= 0 && m.frame < d);
  return { map, fps, startFrame, beatFrames, downbeatFrames, beatFrame, snapToBeat, momentsIn };
}

/**
 * Where in the track a film should start, when the storyboard does not say. Candidates are the track's downbeats
 * (so frame 0 is a bar line). Each is scored:
 *   - the hero shot's start lands on one of the track's big lifts (a drop), within a beat: the strongest reward
 *   - the end card's start lands on a downbeat
 *   - the whole film fits before the track's quiet ending (hard requirement)
 *   - the film does not open inside a quiet section (the hook needs the music already there)
 * Returns track seconds.
 */
export function chooseStart(
  track: string | BeatMap,
  film: { runtime: number; heroAt?: number; endAt?: number },
): number {
  const map = typeof track === "string" ? getTrack(track) : track;
  const usable = map.ending.quietFrom > 0 ? map.ending.quietFrom : map.duration;
  const lifts = map.moments.filter((m) => m.kind === "lift");
  const big = lifts.filter((m) => m.big);
  const levelAt = (t: number) => map.sections.find((x) => t >= x.from && t < x.to)?.level ?? "mid";
  let best = { start: map.downbeats[0] ?? 0, score: -Infinity };
  for (const d of map.downbeats) {
    if (d + film.runtime > usable) break;
    let score = 0;
    if (film.heroAt !== undefined) {
      const h = d + film.heroAt;
      const near = (big.length ? big : lifts).map((m) => Math.abs(m.t - h)).sort((a, b) => a - b)[0];
      if (near !== undefined && near < map.period) score += 3 * (1 - near / map.period);
    }
    if (film.endAt !== undefined) {
      const e = d + film.endAt;
      const off = Math.min(...map.downbeats.map((x) => Math.abs(x - e)));
      score += 1 - Math.min(1, off / map.period);
    }
    if (levelAt(d + 0.1) === "quiet") score -= 1.5;
    score -= d / 600; // gentle preference for earlier starts, so ties pick the first good bar
    if (score > best.score) best = { start: d, score };
  }
  return best.start;
}
