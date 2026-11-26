/**
 * Proof of Narrator type (2026-11-26, Muse send 392a845c, John Stark's Spline explainer): the type tells it with no
 * voice. Every product word and picture is the demo's own, captured Nov 26 (films/campus-island/capture/): the map's
 * Van Munching Hall panel (its photo, and "Study here / Quiet study rooms, no booking / Rooms 1202, 1206, 1505, 1520").
 */
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { NarratorType, narratorTimes } from "../kit/effects/NarratorType";
import type { NarratorBeat } from "../kit/effects/NarratorType";

const RED = "#D9202E";
const P = "proof-narrator/";

const BEATS: NarratorBeat[] = [
  // frame 0 already carries the line: the strokes and the first words are in
  { frames: 40, strokes: true, offset: -8, lines: [[{ text: "What if", size: 80 }, { text: "I told you", size: 80 }]] },
  {
    frames: 52, enter: "whip",
    lines: [
      [{ text: "finding a quiet room", size: 64 }],
      [{ text: "shouldn't be", size: 40, weight: 500 }],
      [{ text: "complicated", size: 150, soft: true, at: 12 }],
    ],
  },
  { frames: 40, enter: "whip", lines: [[{ text: "With", size: 110 }, { text: "CampusAI", size: 110, select: true }]] },
  {
    frames: 96, enter: "sweep",
    lines: [
      [{ text: "Your", size: 112 }, { tile: `${P}vmh-photo.png`, w: 300, h: 120 }],
      [{ text: "study spot", size: 150, brush: true }],
      [{ tile: `${P}study-here.png`, w: 620, h: 230, radius: 22, at: 16 }],
    ],
  },
];
export const NARRATOR_FRAMES = BEATS.reduce((a, b) => a + b.frames, 0);

const Cue: React.FC<{ at: number; name: string; volume?: number }> = ({ at, name, volume = 0.45 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={45} layout="none">
    <Audio src={staticFile(`sound/cues/${name}.wav`)} volume={volume} />
  </Sequence>
);

export const ProofNarrator: React.FC = () => {
  const f = useCurrentFrame();
  const s = narratorTimes(BEATS);
  const end = s[3] + BEATS[3].frames;
  const logo = interpolate(f, [end - 30, end - 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <NarratorType beats={BEATS} accent={RED} />
      <Img src={staticFile("brand/campusai-logo.svg")} style={{ position: "absolute", left: 540 - 130, bottom: 150, width: 260, opacity: 0.25 + 0.75 * logo }} />
      <Cue at={0} name="type-switch-tap" />
      <Cue at={s[1] - 4} name="move-swoosh-quick" />
      <Cue at={s[1] + 12} name="land-ui-popup-dry" volume={0.35} />
      <Cue at={s[2] - 4} name="move-swoosh-quick" />
      <Cue at={s[2] + 11} name="press-ui-select-click" />
      <Cue at={s[3] - 6} name="arrive-wind-swoosh-short" />
      <Cue at={s[3] + 16} name="notify-ui-message-pop" volume={0.35} />
    </AbsoluteFill>
  );
};
