/**
 * soundFromStoryboard: a film's whole sound, derived from its storyboard, with no hand placement (2026-10-23).
 *
 * API (what Film.tsx calls):
 *
 *   import { soundFromStoryboard } from "./sound/fromStoryboard";
 *   import { Score } from "./sound/Score";
 *
 *   const sound = soundFromStoryboard(storyboard);          // ScoreProps plus the numbers it used
 *   <Score {...sound} />                                    // inside the film's composition, at frame 0
 *
 *   soundFromStoryboard(storyboard, {
 *     fps: 30,                   // default rules.json fps
 *     extra: [{ kind: "success", frame: 212 }],            // events the storyboard cannot express (typing, a success)
 *     duck: [{ from: 40, to: 95, name: "hook line" }],      // moments the music should sit under
 *     music: false,              // the cues-only master (music muted, grid kept)
 *   })
 *
 * The rules, in the order a film plays:
 *   - Music: `storyboard.music.track` from `startAt` (track seconds). With no `startAt`, `chooseStart` picks a bar
 *     line so the hero shot's start lands on one of the track's big lifts and the end card on a downbeat. No
 *     `music` in the storyboard means no music (cues only).
 *   - Shot arrivals: every shot after the first gets one cue at its first frame. A shot reached by a camera move
 *     (the previous shot's `transition` is "camera", the default) gets the MOVE cue; one reached by a cut or a
 *     carried element gets the ARRIVE cue. The first shot gets none: the music starting is its sound.
 *   - Presses: every `shot.press` becomes a PRESS cue on its exact frame (shot start + press.at). A press is the
 *     most important sound in a product film, so an arrival cue within 8 frames of a press is dropped.
 *   - The end: the LOGO cue on the end card's first frame, and the music fades out under the card.
 *   - Nothing snaps by default. Presses and shot starts are where the picture is; moving their sound to the beat
 *     would put sound and picture apart. To cut to the beat, the film (or the storyboard author) should snap the
 *     picture with `beatGrid(track, startAt).snapToBeat(...)` first, and the sound follows for free.
 *   - Cues never stack: two cues closer than 4 frames keep the more important one (logo > press > notify >
 *     success > land > move > arrive > type).
 *
 * What it does not do (named so nobody assumes it): it does not add typing ticks (a storyboard has no typing
 * events yet), it does not mark the result of a press landing (`press.lands` names a shot, not a moment), and it
 * does not duck under text (pass `duck` when a line needs the room).
 */
import rules from "../rules.json";
import { runtime, type Storyboard } from "../storyboard";
import { chooseStart } from "./beats";
import type { CueKind, SoundEvent } from "./cues";
import type { Duck, ScoreProps } from "./Score";

export type SoundOptions = {
  fps?: number;
  extra?: SoundEvent[];
  duck?: Duck[];
  /** false: the cues-only master (the track's grid still places snapped events, no music plays). */
  music?: boolean;
  target?: number;
};

export type DerivedSound = ScoreProps & {
  events: SoundEvent[];
  durationInFrames: number;
  /** Where the music starts in the track, seconds (chosen when the storyboard did not say). */
  startAt: number | null;
  startChosen: boolean;
};

const RANK: CueKind[] = ["logo", "press", "notify", "success", "land", "move", "arrive", "type"];

export function soundFromStoryboard(sb: Storyboard, opts: SoundOptions = {}): DerivedSound {
  const fps = opts.fps ?? rules.fps;
  const total = runtime(sb);
  const durationInFrames = Math.round(total * fps);
  const events: SoundEvent[] = [];

  let t = 0;
  let heroAt: number | undefined;
  sb.shots.forEach((shot, i) => {
    const startF = Math.round(t * fps);
    if (shot.hero && heroAt === undefined) heroAt = t;
    if (i > 0) {
      const via = sb.shots[i - 1].transition ?? "camera";
      events.push({ kind: via === "camera" ? "move" : "arrive", frame: startF, name: `${via === "camera" ? "move to" : "arrive"}: ${shot.id}` });
    }
    if (shot.press) events.push({ kind: "press", frame: Math.round((t + shot.press.at) * fps), name: `press: ${shot.id}` });
    t += shot.seconds;
  });
  const endF = Math.round(t * fps);
  events.push({ kind: "logo", frame: endF, name: "logo: end card" });
  events.push(...(opts.extra ?? []));

  // presses win over arrivals near them, then nothing closer than 4 frames
  const presses = events.filter((e) => e.kind === "press").map((e) => e.frame);
  const kept = events
    .filter((e) => !((e.kind === "arrive" || e.kind === "move") && presses.some((p) => Math.abs(p - e.frame) <= 8)))
    .sort((a, b) => RANK.indexOf(a.kind) - RANK.indexOf(b.kind));
  const placed: SoundEvent[] = [];
  for (const e of kept) if (!placed.some((p) => Math.abs(p.frame - e.frame) < 4)) placed.push(e);
  placed.sort((a, b) => a.frame - b.frame);

  let music: ScoreProps["music"] = null;
  let startAt: number | null = null;
  let chosen = false;
  if (sb.music) {
    startAt = sb.music.startAt ?? null;
    if (startAt === null) {
      startAt = chooseStart(sb.music.track, { runtime: total, heroAt, endAt: t });
      chosen = true;
    }
    music = { track: sb.music.track, startAt, mute: opts.music === false };
  }

  return {
    music,
    events: placed,
    duck: opts.duck ?? [],
    end: { from: endF },
    target: opts.target,
    durationInFrames,
    startAt,
    startChosen: chosen,
  };
}
