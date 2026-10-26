/**
 * A flow recorded with `npm run flow <film>` (2026-10-26): your own path through the real CampusAI demo,
 * played back at true speed with the pointer drawn where it went and pressed. Like ChatRecording, it shows
 * the last recorded frame at or before the current time.
 *
 *   <FlowRecording src="<film>/flow/frames.json" />             fills the frame, cover, pointer on
 *   <FlowRecording src="..." from={2.4} pointer={false} />      start 2.4 s in, no pointer
 *
 * The pointer is placed for a recording that fills the whole composition (the usual case); inside a
 * smaller box or a moving camera, set pointer={false} and place PointerAt yourself from frames.json's
 * `moves` (page px). The step marks are in frames.json too, in seconds, for timing a cut or a camera.
 */
import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { asset, useFrameSeq } from "../system/parts/common";
import { brand } from "./brand";
import { PointerAt } from "./Pointer";

type Pt = { x: number; y: number };
type Move = { from: Pt; to: Pt; start: number; end: number; click?: number };
type FlowFile = { vw: number; vh: number; moves?: Move[] };

const pointerAt = (moves: Move[], t: number) => {
  let p: Pt | null = moves.length ? moves[0].from : null;
  let click: number | null = null;
  for (const m of moves) {
    if (t < m.start) break;
    if (t < m.end) {
      const k = (t - m.start) / (m.end - m.start);
      const e = 1 - Math.pow(1 - k, 3); // the same ease the recorder moved the mouse with
      p = { x: m.from.x + (m.to.x - m.from.x) * e, y: m.from.y + (m.to.y - m.from.y) * e };
    } else p = m.to;
    if (m.click !== undefined && m.click <= t) click = m.click;
  }
  return { p, since: click === null || t - click > 0.6 ? null : t - click };
};

export const FlowRecording: React.FC<{
  src: string;
  /** Seconds into the recording at this element's first frame. */
  from?: number;
  /** 1 is real time. */
  speed?: number;
  fit?: "cover" | "contain";
  pointer?: boolean;
  style?: React.CSSProperties;
}> = ({ src, from = 0, speed = 1, fit = "cover", pointer = true, style }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const seq = useFrameSeq(src) as (ReturnType<typeof useFrameSeq> & Partial<FlowFile>) | null;
  if (!seq || !seq.frames.length) return null;
  const t = from + (f / fps) * speed;
  let shown = seq.frames[0];
  for (const fr of seq.frames) {
    if (fr.t <= t) shown = fr;
    else break;
  }
  // page px to composition px, for the frame laid out with object-fit
  const vw = seq.vw ?? width, vh = seq.vh ?? height;
  const s = fit === "cover" ? Math.max(width / vw, height / vh) : Math.min(width / vw, height / vh);
  const ox = (width - vw * s) / 2, oy = (height - vh * s) / 2;
  const at = pointer && seq.moves ? pointerAt(seq.moves, t) : null;
  return (
    <AbsoluteFill style={style}>
      <Img src={asset(seq.dir + shown.name)} style={{ width: "100%", height: "100%", objectFit: fit }} />
      {at?.p && (
        <PointerAt x={ox + at.p.x * s} y={oy + at.p.y * s} since={at.since} accent={brand("campusai").color.accent} size={Math.round(26 * s)} />
      )}
    </AbsoluteFill>
  );
};
