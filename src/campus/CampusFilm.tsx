/**
 * CampusAI, "this week" (2026-10-21, round 2). 9:16, 30fps, about 18.4s, music and sound.
 *
 * The companion to the platform tour (Flock film): that one is the career side, this one is the
 * student's week. Round 2 is built around My Calendar, from Jacob's notes on round 1: keep the
 * events scrolling with a different scroll, drop the flash and black screen, go from the press
 * straight into the calendar and show the event landing there, show suggested events and
 * assignments, add Find time to study, cut clubs.
 *
 *   beats 0-2       the wordmark draws itself (letterspace-materialize)
 *   beats 2-6       the week's events on a date rail, braking on Fri 23 (timeline-travel, vertical)
 *   beats 6-8.6     the bootcamp lifts, Add to CampusAI Calendar, On your calendar
 *   beats 8.6-12    it flies into its own Friday slot, where it was a dashed suggestion, landing on the drop
 *   beats 12-15     the whole week, then the due row, Quiz 2
 *   beats 15-20     Ask CampusAI, Find time to study for Quiz 2, the answer, its add button, the study
 *                   block lands on Wednesday 6:30pm on the kick
 *   beats 20-22     pull back and tilt, the full week
 *   beats 22-26.5   ring to spark to wordmark, "Your whole week, in one place." (logo-shrink-wordmark-lockup)
 *
 * Captures: `capture/campus-film.cjs` against campusai-demo.vercel.app, dark mode, one run in the
 * order a student would do it. The Deloitte coffee chat was moved to Thursday 4pm in the demo's own
 * fixture for this film so the week shows two suggestions (Jacob's call). NOTE before posting:
 * "Add to CampusAI Calendar", My Calendar and its suggestions are demo-only on 2026-10-21.
 * Sounds and music are Mixkit free license, from `shots/audio/`.
 */
import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { useZodiak } from "../kit/parts";
import { Grain, Vignette } from "../shots/_fixtures/Polish";
import { ANSWER_AT, ASK_AT, ASK_PRESS, B, DROP, FILM_FRAMES, FLY_AT, MUSIC_TRIM, OUTRO_AT, PILL_PRESS, PRESS_AT, RAIL_AT, STOP_AT, STUDY_LAND } from "./beats";
import { End } from "./End";
import { Rail } from "./Rail";
import { Week } from "./Week";

export { FPS as CAMPUS_FPS, SIZE as CAMPUS_SIZE } from "./beats";
export const CAMPUS_FRAMES = FILM_FRAMES;

const a = (f: string) => staticFile(`campus/audio/${f}`);
const CUES: { at: number; src: string; volume: number; name: string }[] = [
  { at: 2, src: a("light-aura.mp3"), volume: 0.3, name: "wordmark draws" },
  { at: RAIL_AT - 3, src: a("sweep-short.mp3"), volume: 0.35, name: "rail" },
  { at: B(2.9) - 1, src: a("switch-click-quick.mp3"), volume: 0.22, name: "Wed" },
  { at: B(4.3) - 1, src: a("switch-click-quick.mp3"), volume: 0.22, name: "Thu" },
  { at: STOP_AT - 1, src: a("switch-click-quick.mp3"), volume: 0.45, name: "brake on Fri" },
  { at: PRESS_AT - 1, src: a("ui-select-click.mp3"), volume: 0.5, name: "press" },
  { at: PRESS_AT + 3, src: a("ui-success-soft.mp3"), volume: 0.35, name: "on your calendar" },
  { at: FLY_AT, src: a("whoosh-swirl.mp3"), volume: 0.3, name: "card flies" },
  { at: DROP - 2, src: a("impact-cine-big.mp3"), volume: 0.5, name: "lands on Friday" },
  { at: ASK_AT, src: a("sweep-fast-small.mp3"), volume: 0.3, name: "ask card" },
  { at: ASK_PRESS - 1, src: a("ui-select-click.mp3"), volume: 0.45, name: "find time to study" },
  { at: ANSWER_AT, src: a("ui-message-pop.mp3"), volume: 0.4, name: "answer" },
  { at: PILL_PRESS - 1, src: a("ui-select-click.mp3"), volume: 0.45, name: "add study block" },
  { at: PILL_PRESS + 3, src: a("ui-success-soft.mp3"), volume: 0.3, name: "added" },
  { at: STUDY_LAND - 1, src: a("transition-snap.mp3"), volume: 0.4, name: "study lands" },
  { at: OUTRO_AT + 2, src: a("air-zoom-vacuum.mp3"), volume: 0.45, name: "ring shrinks" },
];

export const CampusFilm: React.FC = () => {
  useZodiak();
  return (
    <AbsoluteFill style={{ background: "#0b0708" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 40% at 50% 47%, rgba(226,24,51,0.22) 0%, rgba(226,24,51,0.05) 55%, rgba(226,24,51,0) 80%)" }} />
      <Rail />
      <Week />
      <End />
      <Vignette strength={0.5} inner={0.48} color="#060304" />
      <Grain opacity={0.08} blend="soft-light" />
      <Audio src={a("g-eazy-nba-type.mp3")} trimBefore={MUSIC_TRIM}
        volume={(fr) => 0.8 * Math.min(1, fr / 6) * Math.min(1, Math.max(0, (FILM_FRAMES - fr) / 20))} />
      {CUES.map((c) => (
        <Sequence key={c.name} from={Math.round(c.at)} name={c.name}>
          <Audio src={c.src} volume={() => c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
