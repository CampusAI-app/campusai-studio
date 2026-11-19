/**
 * The music bed for named styles and kit effects (2026-11-18). Before this, both `Bed`s played one file,
 * styles/sfx/bed.mp3 (Mixkit "Infinity"), from its first second, so every style and every Muse pass film sounded the
 * same (Jacob, Nov 18: "why do all the muse passes use the same exact audio. it shouldnt do that").
 *
 * Now a bed is one of the measured, licensed tracks in public/sound/music (tracks.ts, Mixkit Stock Music Free License).
 * Pass `track` to choose it for a film. Left out, the composition id picks one, so different films get different
 * music and the same film always renders with the same music. The track starts on the downbeat of its first big lift
 * (the drop) when the rest of the track is long enough, else on its first downbeat, and its level is matched to the
 * old bed's measured loudness, so a film is no louder or quieter than before.
 */
import { TRACKS } from "./tracks";

/** The old bed's integrated loudness (infinity.mp3, measured 2026-10-23), so existing volume props keep their level. */
const REF_LUFS = -12.23;

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

export type BedPick = { track: string; file: string; startAt: number; gain: number };

/** The track, where it starts (track seconds) and the gain that matches the reference loudness. */
export const pickBed = (id: string, seconds: number, track?: string): BedPick => {
  const names = Object.keys(TRACKS).sort();
  const name = track && TRACKS[track] ? track : names[hash(id) % names.length];
  const map = TRACKS[name];
  const downs = map.downbeats.filter((t) => t >= 0);
  const drop = map.moments.find((m) => m.big && m.kind === "lift");
  const atDrop = drop ? [...downs].reverse().find((t) => t <= drop.t + 0.05) : undefined;
  const fits = (t: number | undefined) => t !== undefined && map.duration - t >= seconds + 1;
  const startAt = fits(atDrop) ? atDrop! : (downs[0] ?? 0);
  const lufs = map.loudness?.integratedLufs ?? REF_LUFS;
  return { track: name, file: map.file, startAt, gain: Math.pow(10, (REF_LUFS - lufs) / 20) };
};
