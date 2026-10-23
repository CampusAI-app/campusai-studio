/**
 * Sound for the chat film.
 *
 * Pattern taken from Nutlope/inspo's `teaser/src/LaunchSoundtrack.tsx` (MIT):
 * named UI sounds from `@remotion/sfx`, each fired from its own `Sequence` at a
 * frame that corresponds to a real story moment, all at low volume.
 *
 * Three rules this file keeps, and they are the whole craft of it:
 *
 *   1. ONE CUE PER EVENT. A sound marks something that happened — the press,
 *      a step completing, the camera moving. It never decorates.
 *   2. NOTHING ABOVE 0.55. This plays under a film whose subject is fine text.
 *      The sound is a floor, not a layer you notice.
 *   3. CUES ARE TIME, NOT FRAMES. Every moment below is derived from
 *      `BEAT_START_MS` plus the scene's own internal offsets, so lengthening a
 *      beat moves the picture AND the sound together. Never hardcode a frame.
 *
 * NOTE ON RENDERING: `@remotion/sfx` does not bundle audio files. Every export
 * is a URL on `https://remotion.media`, so a render of this composition needs
 * an internet connection. A render with no network drops the audio silently
 * rather than failing, which is exactly the class of quiet failure worth
 * knowing about before a deadline.
 */
import React from "react";
import { Sequence, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ding, mouseClick, uiSwitch, whoosh } from "@remotion/sfx";
import { BEAT_START_MS } from "./lib/chat-timeline";
import { msToFrames } from "./lib/timing";

/* Offsets INSIDE each beat, read off the scene components rather than guessed.
   Change one of these only when the scene it mirrors changes. */

// Composer: TYPE_START 1000 + 36 chars * CHAR_MS 45 = 2620, and the send button
// commits 180ms after the line finishes.
const SEND_PRESS = 2800;

// ThinkingTrace: STEP_AT, the product's own 800ms cadence, then GATHER_AT.
const STEP_AT = [0, 800, 1600, 2400];
const GATHER_AT = 2950;

// AnswerMessage: STREAM_DONE 2838, the camera pull opens 150ms later, and
// blocks two and three land at +300 and +1000.
const CAM_PULL = 2988;
const BLOCK_2 = 3138;
const BLOCK_3 = 3838;

// CallToAction: the wordmark blurs in and "Ask CampusAI." starts at 240ms.
const MARK_LANDS = 240;

type Cue = {
  /** Absolute milliseconds from the first frame of the film. */
  at: number;
  src: string;
  volume: number;
  /** Shown in the Remotion timeline, so a cue can be found by name. */
  name: string;
};

const CUES: Cue[] = [
  // The student commits the question. The one cue that is allowed to be heard.
  { at: BEAT_START_MS.ask + SEND_PRESS, src: mouseClick, volume: 0.55, name: "sfx: send" },

  // The agent's four steps. Deliberately the quietest recurring cue in the
  // film: four of anything at 800ms apart becomes a rhythm, and a rhythm the
  // viewer starts counting is louder than its volume suggests.
  ...STEP_AT.map((offset, i) => ({
    at: BEAT_START_MS.think + offset,
    src: uiSwitch,
    volume: 0.14,
    name: `sfx: step ${i + 1}`,
  })),

  // The rows compress upward and the camera pulls back. This is the film's
  // hinge, thinking becoming answer, so it gets the clearest move cue.
  { at: BEAT_START_MS.think + GATHER_AT, src: whoosh, volume: 0.34, name: "sfx: gather" },

  // The camera widens off the first event to reveal all three.
  { at: BEAT_START_MS.answer + CAM_PULL, src: whoosh, volume: 0.22, name: "sfx: pull back" },
  { at: BEAT_START_MS.answer + BLOCK_2, src: uiSwitch, volume: 0.12, name: "sfx: event 2" },
  { at: BEAT_START_MS.answer + BLOCK_3, src: uiSwitch, volume: 0.12, name: "sfx: event 3" },

  // Out of the product and into the film's own register.
  { at: BEAT_START_MS.breadth, src: whoosh, volume: 0.28, name: "sfx: breadth" },

  // The wordmark lands. The only cue with any brightness, and it closes.
  { at: BEAT_START_MS.cta + MARK_LANDS, src: ding, volume: 0.22, name: "sfx: mark" },
];

export const ChatSoundtrack: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      {CUES.map((cue) => (
        <Sequence key={cue.name} from={msToFrames(cue.at, fps)} name={cue.name}>
          {/* Callback form, not a bare number: Remotion's lint requires it, and
              it is the hook for a per-cue envelope if one ever earns its place.
              These are one-shots, so the level is flat for now. */}
          <Audio src={cue.src} volume={() => cue.volume} />
        </Sequence>
      ))}
    </>
  );
};
