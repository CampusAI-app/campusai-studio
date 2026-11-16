/**
 * Rack focus (2026-11-15, ours, after Skill Stack Store's "20 Claude Effects" reel, 17.5 to 18.3 s). What the reel
 * does: focus pulls between the speaker's hands in front and his face and the background. At laptop scale it was too
 * subtle to read.
 *
 * Ours separates the person from the room with the clip's matte and blurs one, then the other, hard enough to read on
 * a phone: in focus on the person the room sits at `blur` px; pulled to the room, the room snaps sharp and the person
 * falls to `personBlur` px. Each pull takes `frames` (default 14, a slow start and a firm landing), then runs a hair
 * past the mark and hunts back the way a real lens does, and the picture breathes (a 3.5% scale toward the room)
 * and the out of focus layer drops a little exposure, so the eye is pushed to the sharp one.
 *
 * How the two layers are made: a sharp and a blurred copy of the clip, each multiplied by the matte (the person) or
 * its inverse (the room), then added (`plus-lighter`). Same frames, so the seams line up exactly; no cutout edge.
 *
 * Props: `clip` (path under public/), `matte` (the clip's black and white matte, white is the person, same size and
 * length), `from` (frames trimmed off both), `start` (where focus begins: "person" or "room"), `pulls` (each { at:
 * frame the pull starts, to: "person" | "room" }), `blur`, `personBlur`, `frames`, `sound`.
 */
import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { SWING, Sfx, k, mix } from "./shared";

const PULL = Easing.bezier(0.5, 0, 0.2, 1);

export type FocusTarget = "person" | "room";
export type RackFocusProps = {
  clip: string;
  matte: string;
  from?: number;
  volume?: number;
  start?: FocusTarget;
  pulls: { at: number; to: FocusTarget }[];
  blur?: number;
  personBlur?: number;
  frames?: number;
  breathe?: number;
  sound?: boolean;
};

export const RackFocus: React.FC<RackFocusProps> = (p) => {
  const f = useCurrentFrame();
  const from = p.from ?? 0;
  const frames = p.frames ?? 14;

  // focus: 0 = on the person, 1 = on the room
  let focus = p.start === "room" ? 1 : 0;
  for (const pull of p.pulls) {
    if (f < pull.at) break;
    const target = pull.to === "room" ? 1 : 0;
    // the pull eases across `frames`, then runs a hair past the mark and hunts back over the next few frames
    const t = k(f, pull.at, pull.at + frames, PULL);
    const hunt = 0.12 * Math.sin(Math.PI * k(f, pull.at + frames * 0.75, pull.at + frames * 1.4, SWING));
    focus = mix(focus, target, t + hunt);
  }
  const roomBlur = Math.max(0, (1 - focus) * (p.blur ?? 26));
  const personBlur = Math.max(0, focus * (p.personBlur ?? 20));
  // breathing: the lens grows a touch as it focuses further away
  const scale = 1.04 + (p.breathe ?? 0.035) * focus;
  const roomDim = mix(0.82, 1, Math.min(1, Math.max(0, focus)));
  const personDim = mix(1, 0.86, Math.min(1, Math.max(0, focus)));
  // one softness for both mattes, so the two layers always add back to one picture; it widens as the person
  // defocuses, so a soft edge spreads the way a lens spreads it
  const edge = 1.2 + personBlur * 0.5;

  const layer = (blur: number, dim: number, matteBlur: number, invert: boolean, audible: boolean): React.ReactNode => (
    <AbsoluteFill style={{ isolation: "isolate", mixBlendMode: invert ? "normal" : "plus-lighter" }}>
      <AbsoluteFill style={{ filter: `blur(${blur.toFixed(2)}px) brightness(${dim.toFixed(3)})` }}>
        <OffthreadVideo src={staticFile(p.clip)} trimBefore={from} muted={!audible} volume={audible ? p.volume ?? 1 : 0}
          style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ mixBlendMode: "multiply", filter: `${invert ? "invert(1) " : ""}blur(${matteBlur.toFixed(2)}px)` }}>
        <OffthreadVideo src={staticFile(p.matte)} trimBefore={from} muted style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${scale.toFixed(4)})`, isolation: "isolate" }}>
        {/* the room: matte inverted */}
        {layer(roomBlur, roomDim, edge, true, true)}
        {/* the person: matte as is */}
        {layer(personBlur, personDim, edge, false, false)}
      </AbsoluteFill>
      {/* a soft vignette keeps the eye in */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 65% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)" }} />
      {p.pulls.map((pull, i) => (
        <Sfx key={i} at={pull.at} name="swoosh-slow" volume={0.16} on={p.sound ?? true} />
      ))}
    </AbsoluteFill>
  );
};
