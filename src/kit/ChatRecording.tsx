/**
 * A chat recorded with `npm run chat <film>` (2026-10-23): the real CampusAI chat answering the question in
 * films/<film>/chat.json, played back at true speed. Shows the last recorded frame at or before the current
 * time, so it holds still before the recording starts and after it ends.
 *
 *   <ChatRecording src="<film>/chat/frames.json" />            fills its box, cover
 *   <ChatRecording src="..." from={2.4} />                      start 2.4 s into the recording
 *
 * The recording's marks (typeStart, send, done) are in frames.json, in seconds, for timing a cut or a camera.
 */
import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { asset, useFrameSeq } from "../system/parts/common";

export const ChatRecording: React.FC<{
  src: string;
  /** Seconds into the recording at this element's first frame. */
  from?: number;
  /** 1 is real time. */
  speed?: number;
  fit?: "cover" | "contain";
  style?: React.CSSProperties;
}> = ({ src, from = 0, speed = 1, fit = "cover", style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seq = useFrameSeq(src);
  if (!seq || !seq.frames.length) return null;
  const t = from + (f / fps) * speed;
  let shown = seq.frames[0];
  for (const fr of seq.frames) {
    if (fr.t <= t) shown = fr;
    else break;
  }
  return (
    <AbsoluteFill style={style}>
      <Img src={asset(seq.dir + shown.name)} style={{ width: "100%", height: "100%", objectFit: fit }} />
    </AbsoluteFill>
  );
};
