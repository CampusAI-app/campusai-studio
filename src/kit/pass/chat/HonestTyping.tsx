/**
 * HonestTyping (motion pass, 2026-10-22): a question typed into the REAL chat box at a student's pace, with a
 * hesitation, a deleted word and a faster retype, then the real answer streaming in the chat's soft trail.
 *
 * Move: typewriter-reveal, "characters appear one at a time from left to right at a steady pace, as though being
 * typed in real time", in its error-retype form. Ported from the shelf shot `typewriter-moves`
 * (shots/demos/typography/typewriter-moves, TypewriterErrorRetype.tsx), inspired by Raylight's ChatGPT-style
 * prompt beat (linear-agent scene 2: the prompt typed per character, then the answer cascade).
 *
 * What it keeps from the shot, because the shot's card says these are the whole act: three speeds you can feel
 * (type about 2.4 f a character with a human wobble, delete 2 f, retype 1.6 f with no hesitation), a caret that is
 * steady while typing or deleting and blinks only in the pause (4 f half period), and text laid out at a fixed
 * left edge so arriving letters never reflow the line. What it changes: no monospace, no marker, no title card.
 * The text is drawn in Inter 400 into the real field's box at the field's own size and colour (measured by
 * capture/pass-chat.cjs: 13 px on a 21.1 px line, rgb 242 241 239), over a capture of the focused empty field, and
 * the send button takes its real lit state (a crop of the typed capture) the moment there is text. On send it cuts
 * straight to the real recording, because the product clears the field the instant it sends, which is what the
 * recording's first frame shows. With `follow` the camera stays close on the answer (body text about 26 px on a
 * 1080 canvas at cw 510) and rides its writing edge, eased by a 10 frame average, with `timeline` trimming the
 * loader wait and slowing the stream so that follow stays calm (Jacob: the product big). The demo's chat already
 * streams with its own soft trail (each new character fades in), so the recording carries it and `trail` stays 0;
 * set it for a recording without one.
 */
import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { camAlong, clampCam, mixCam, rectOnCanvas, toCanvas } from "../../camera";
import { PageView } from "../../PageView";
import type { Recording } from "./shared";
import { FrameSeq, INTER_400, MarkPatch, PageCrop, inflate } from "./shared";

export type TypeStep =
  | { type: "type"; text: string; perChar: number; wobble?: number }
  | { type: "pause"; frames: number }
  | { type: "delete"; count: number; perChar: number };

type Mode = "idle" | "type" | "pause" | "delete" | "done";

/** A steady pseudo-random 0..1 per character, so the wobble is the same on every render. */
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Where the script is at frame f (frames since the script started). */
export const typingState = (steps: TypeStep[], f: number) => {
  let text = "";
  let t = 0;
  let k = 0; // a running character index for the wobble
  for (const s of steps) {
    if (s.type === "pause") {
      if (f < t + s.frames) return { text, mode: "pause" as Mode, since: f - t, end: false };
      t += s.frames;
    } else if (s.type === "delete") {
      for (let i = 0; i < s.count; i++) {
        if (f < t) return { text, mode: "delete" as Mode, since: 0, end: false };
        text = text.slice(0, -1);
        t += s.perChar;
      }
    } else {
      for (const ch of s.text) {
        if (f < t) return { text, mode: "type" as Mode, since: 0, end: false };
        text += ch;
        const w = s.wobble ?? 0;
        // a little longer after a space or a word boundary, a little shorter mid-word
        t += s.perChar * (1 + w * (rnd(k++) - 0.5) * 2) * (ch === " " ? 1.35 : 1);
      }
    }
  }
  return { text, mode: (f < t ? "type" : "done") as Mode, since: f - t, end: f >= t };
};

/** Total frames a script takes. */
export const scriptFrames = (steps: TypeStep[]) => {
  let k = 0;
  let t = 0;
  for (const s of steps) {
    if (s.type === "pause") t += s.frames;
    else if (s.type === "delete") t += s.count * s.perChar;
    else for (const ch of s.text) t += s.perChar * (1 + (s.wobble ?? 0) * (rnd(k++) - 0.5) * 2) * (ch === " " ? 1.35 : 1);
  }
  return Math.ceil(t);
};

/** Recording time with the skipped ranges stepped over. */
export const recTime = (t: number, skip: [number, number][] = []) => {
  let r = t;
  for (const [a, b] of skip) if (r >= a) r += b - a;
  return r;
};

export type HonestTypingProps = {
  brand: Brand;
  /** The focused, empty field page (capture: chat-focus.jpg). */
  page: { src: string; size: Size };
  view: Rect;
  /** Camera keys in frames. One framing while typing (Jacob: the camera never swings while typing). */
  cams: { t: number; cam: PageCam }[];
  /** The real field's text box and type style, page px (chat-focus.json: textarea + style). */
  field: { x: number; y: number; w: number; h: number; fontSize: number; lineHeight: number; color: string };
  /** The typing script, starting at frame `at`. */
  script: { at: number; steps: TypeStep[] };
  /** The placeholder goes the moment there is text, as in the product: an empty stretch of the same field
   *  (`blankFrom`) is laid over it (`rect`), both page px. */
  placeholder?: { rect: Rect; blankFrom: Rect };
  /** The lit send button, cropped from the typed capture, shown while there is text. */
  sendLit?: { src: string; rect: Rect };
  /** The real recording of the send and the answer. `from` is the recording's send moment (seconds). */
  answer?: { rec: Recording; from: number; at: number; trail?: number; trailRect?: Rect; trailFrom?: number;
    /** Recording-time ranges to step over (the demo shows raw markdown asterisks for a quarter second before a
     *  bold link resolves; cutting it reads as one burst of words). */
    skip?: [number, number][];
    /** Recording time by segments, overriding `from` and `skip`: each plays `from` to `to` (recording seconds) over
     *  `frames` output frames, in order, so a wait can be trimmed and the stream slowed for a close camera. After the
     *  last segment the recording holds. */
    timeline?: { frames: number; from: number; to: number }[];
    /** Keep the camera close on the answer and follow its writing edge. `track` is the edge per recording time
     *  (page px, measured off the frames: public/pass/chat/answer/edge.json); `x0`..`x1` the answer's line extent;
     *  the edge rides `lead` of the view width in from the right; `lag` frames of averaging make the follow ease,
     *  including the carriage return to a new line; `blend` frames ease in from the typing framing. */
    follow?: { track: { t: number; x: number; y: number }[]; cw: number; cy: number; x0: number; x1: number; lead?: number; lag?: number; blend?: number;
      /** Recording seconds the camera stays on a finished line's end after the next line starts, so its last words
       *  finish their fade before the carriage return. */
      breakHold?: number } };
  /** The sidebar colour behind the Maryland mark on this capture. */
  markColor: string;
};

export const HonestTyping: React.FC<HonestTypingProps> = ({ brand, page, view, cams, field, script, placeholder, sendLit, answer, markColor }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // recording time for an output frame
  const recAt = (frame: number) => {
    if (!answer) return 0;
    const local = frame - answer.at;
    if (!answer.timeline) return recTime(answer.from + local / fps, answer.skip);
    let k = Math.max(0, local);
    for (const sgm of answer.timeline) {
      if (k <= sgm.frames) return sgm.from + (sgm.to - sgm.from) * (k / sgm.frames);
      k -= sgm.frames;
    }
    return answer.timeline[answer.timeline.length - 1].to;
  };
  let cam = clampCam(camAlong(f, cams), page.size, view);
  const fo = answer?.follow;
  if (answer && fo && f >= answer.at) {
    const lead = fo.lead ?? 0.2;
    const lag = fo.lag ?? 14;
    const hold = fo.breakHold ?? 0;
    const edgeAt = (t: number) => {
      if (t < fo.track[0].t) return { ...fo.track[0], x: fo.x0 };
      let e = fo.track[0];
      let prev = e;
      let lineStart = e.t;
      for (const q of fo.track) {
        if (q.t > t) break;
        if (q.y !== e.y) { prev = e; lineStart = q.t; }
        e = q;
      }
      // just after a line break, stay on the line that finished
      return t - lineStart < hold && prev.y !== e.y ? prev : e;
    };
    const lo = fo.x0 + fo.cw / 2 - 24;
    const hi = fo.x1 - fo.cw / 2 + 24;
    const target = (frame: number) => Math.min(hi, Math.max(lo, edgeAt(recAt(frame)).x - fo.cw * (0.5 - lead) ));
    let cx = 0;
    for (let i = 0; i < lag; i++) cx += target(Math.max(answer.at, f - i)) / lag;
    const followCam = { cx, cy: fo.cy, cw: fo.cw };
    const w = interpolate(f, [answer.at, answer.at + (fo.blend ?? 18)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 0.2, 1) });
    cam = clampCam(mixCam(cam, followCam, w), page.size, view);
  }
  const st = typingState(script.steps, f - script.at);
  const handoff = answer ? interpolate(f, [answer.at, answer.at + 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const p = toCanvas(cam, view, field.x, field.y);
  // caret: steady while typing or deleting, blinks in a pause (4 frame half period), blinks slowly once done
  const caretOn = f < script.at ? Math.floor(f / 15) % 2 === 0
    : st.mode === "pause" ? Math.floor(st.since / 4) % 2 === 0
      : st.mode === "done" ? Math.floor(st.since / 12) % 2 === 0
        : true;
  return (
    <PageView src={page.src} page={page.size} cam={cam} view={view} brand={brand}>
      <MarkPatch cam={cam} view={view} color={markColor} />
      {placeholder && st.text.length > 0 && handoff < 1 ? (
        <PageCrop src={page.src} page={page.size} from={placeholder.blankFrom} to={rectOnCanvas(cam, view, placeholder.rect)} />
      ) : null}
      {sendLit && st.text.length > 0 && handoff < 1 ? (
        <PageCrop src={sendLit.src} page={page.size} from={inflate(sendLit.rect, 3)} to={rectOnCanvas(cam, view, inflate(sendLit.rect, 3))} />
      ) : null}
      {handoff < 1 ? (
        <div style={{ position: "absolute", left: p.x, top: p.y, height: field.lineHeight * p.s, width: field.w * p.s, opacity: 1 - handoff,
          fontFamily: INTER_400, fontWeight: 400, fontSize: field.fontSize * p.s, lineHeight: `${field.lineHeight * p.s}px`, color: field.color,
          whiteSpace: "pre", display: "flex", alignItems: "center" }}>
          <span>{st.text}</span>
          <span style={{ display: "inline-block", width: Math.max(2, 1.2 * p.s), height: field.fontSize * 1.25 * p.s, marginLeft: 0.6 * p.s,
            background: field.color, opacity: caretOn ? 1 : 0 }} />
        </div>
      ) : null}
      {answer && f >= answer.at ? (
        <FrameSeq rec={answer.rec} t={recAt(f)} cam={cam} view={view} trail={answer.trail ?? 0} trailRect={answer.trailRect} trailFrom={answer.trailFrom} opacity={handoff} />
      ) : null}
    </PageView>
  );
};
