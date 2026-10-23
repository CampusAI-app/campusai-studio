/**
 * CampusAI, "everything in one place" (2026-10-21). 9:16, 30fps, about 17.4s, music and sound.
 *
 * Jacob picked the card flock tumble from the shot shelf and asked for more components combined,
 * the graze face tour in it, and the shelf's beats used. Every cut sits on the grid in `beats.ts`:
 *
 *   beats 0-8    the wordmark opens and demotes to a label (title-demote-to-label), then five real
 *                components spring up one per beat into a pile, fan out on beat 6, and a
 *                crash zoom drives into the daily brief (card-stack, crash-zoom-punch). Round 2:
 *                this replaced the round 1 icon field and "This week you have" slot line, which
 *                Jacob cut ("just show the different components"); IconField.tsx is kept, unused.
 *   beats 8-17   graze tour over the real dashboard, rows floating and landing (graze-face-tour)
 *   beats 17-25  into Job Match: the Deloitte card pops off the page, Why this fits you rises (round 4)
 *   beats 25-30  three real job cards tumble in and collapse on the drop (card-flock-tumble)
 *   beats 30-38  smoke ring, wordmark slam, "Everything for your semester, in one place." with a
 *                marker stroke under the last words (marker-underline-title)
 *
 * Captures: `capture/flock-film.cjs` against campusai-demo.vercel.app, dark mode. Nothing on screen
 * is drawn product UI. Sounds and music are Mixkit free license, from `shots/audio/`.
 */
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { useZodiak } from "../kit/parts";
import { B, FIELD_END, FILM_FRAMES, MUSIC_TRIM, TOUR_END } from "./beats";
import { ComponentStack, LOGO_DEMOTE, START as CARD_START } from "./ComponentStack";
import { GrazeTour } from "./GrazeTour";
import { JobMatch } from "./JobMatch";
import { Tumble, TUMBLE_START } from "./Tumble";

export { FPS as FLOCK_FPS, SIZE as FLOCK_SIZE } from "./beats";
export const FLOCK_FRAMES = FILM_FRAMES;

const a = (f: string) => staticFile(`flock/audio/${f}`);
const CUES: { at: number; src: string; volume: number; name: string }[] = [
  { at: LOGO_DEMOTE, src: a("swoosh-quick.mp3"), volume: 0.22, name: "logo demotes" },
  ...CARD_START.map((s, n) => ({ at: s + 6, src: a("ui-popup-dry.mp3"), volume: 0.32, name: `card ${n} lands` })),
  { at: B(6) - 2, src: a("swoosh-quick.mp3"), volume: 0.4, name: "fan" },
  { at: FIELD_END - 8, src: a("zoom-air-fast.mp3"), volume: 0.5, name: "crash zoom" },
  { at: FIELD_END, src: a("whoosh-swirl.mp3"), volume: 0.28, name: "tour glide" },
  { at: B(19), src: a("ui-message-pop.mp3"), volume: 0.45, name: "card lifts" },
  { at: B(21) - 2, src: a("swoosh-quick.mp3"), volume: 0.35, name: "why panel" },
  { at: TUMBLE_START, src: a("whoosh-fast.mp3"), volume: 0.45, name: "cards fly" },
  { at: TUMBLE_START + 58, src: a("air-zoom-vacuum.mp3"), volume: 0.5, name: "collapse" },
  { at: TUMBLE_START + 70, src: a("bass-hit-futuristic.mp3"), volume: 0.6, name: "ring" },
  { at: TUMBLE_START + 114, src: a("marker-pen-line.mp3"), volume: 0.4, name: "marker" },
];

export const FlockFilm: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0b0708" }}>
      {f < FIELD_END + 1 && <ComponentStack />}
      {f >= FIELD_END && f < TOUR_END + 1 && <GrazeTour />}
      {f >= TOUR_END - 6 && f < TUMBLE_START + 1 && <JobMatch />}
      {f >= TUMBLE_START - 5 && <Tumble />}
      <Audio src={a("cat-walk.mp3")} trimBefore={MUSIC_TRIM}
        volume={(fr) => 0.75 * Math.min(1, fr / 6) * Math.min(1, Math.max(0, (FILM_FRAMES - fr) / 18))} />
      {CUES.map((c) => (
        <Sequence key={c.name} from={Math.round(c.at)} name={c.name}>
          <Audio src={c.src} volume={() => c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
