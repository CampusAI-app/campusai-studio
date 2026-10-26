/**
 * QuestionHook (round 4 titles, 2026-10-25): the opening hook as a real student question, typed with the product's
 * own caret into the real Ask CampusAI field on the dashboard capture, held tight until it reads, then the camera
 * pulls back to the whole Ask CampusAI card and the pointer presses send. `questionHookTimes` gives the press frame,
 * so a film cuts to the answer (a ChatRecording, AnswerToPage) on it.
 *
 * Move: typewriter-reveal, "characters appear one at a time from left to right at a steady pace", in its clean form,
 * then a pull-back reveal. How it differs from the kit's HonestTyping (chat group): that part is a hesitant typist in
 * the docked chat panel that runs into a recorded answer; this one is the FIRST frame of a film. Frame 0 already
 * shows the product's own placeholder ("Ask CampusAI anything...", read off the capture) with the caret blinking in
 * it, so there is something to watch inside 0.5 s; typing is clean (no error-retype, which would be noise in a hook);
 * the framing is a title framing (the field fills the width, the question at about 34 px on a 1080 canvas) and it
 * holds for the reading rule (letters / 15 + 1.5 s) before anything else moves. Typing timing reuses HonestTyping's
 * `typingState` (about 1.7 f a character with a small human wobble, a little longer after a space).
 *
 * The placeholder and the question are drawn as live text at the field's own measured position, size and colour
 * (dashboard.jpg: field CSS x 261 to 1395, y 620 to 671, fill rgb(43, 31, 33); placeholder Inter 400 13 px,
 * baseline y 642.5, x 270.5, about rgb(170, 160, 161)), so they stay crisp at a zoom past the capture's DPR. The
 * captured placeholder is covered with the field's own fill, so it never doubles.
 *
 * Numbers: caret 1.5 CSS px, blinks on a 15 f half period while idle, steady while typing (the product's caret).
 * The pull back is DUR.travel (36 f) on CURVE.quiet.standard; the pointer glides on for 24 f and presses 8 f after
 * the camera lands; nothing else moves while the camera moves.
 */
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { clampCam, mixCam, rectOnCanvas, toCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { PointerAt } from "../../Pointer";
import { scriptFrames, typingState } from "../../pass/chat/HonestTyping";
import type { TypeStep } from "../../pass/chat/HonestTyping";
import { CURVE, DUR } from "../../../system/motion";
import type { MarkPatchSpec } from "./shared";
import { INTER_400, MarkPatch, drifted, ramp, readFrames } from "./shared";

export type QuestionHookProps = {
  brand: Brand;
  page: { src: string; size: Size };
  view: Rect;
  mark: MarkPatchSpec | null;
  /** The field box, page px, and its fill (to cover the captured placeholder). */
  field: Rect & { fill: string };
  /** Where the text sits in the field, page px: left edge, baseline, size, typed colour. */
  text: { x: number; baseline: number; size: number; color: string };
  /** The product's own placeholder, as captured. */
  placeholder: { text: string; color: string; rect: Rect };
  question: string;
  /** Frame typing starts. Default 9 (0.3 s): the placeholder and caret carry the first frames. */
  typeAt?: number;
  /** Frames a character. Default 1.7. */
  perChar?: number;
  /** The tight title framing while typing and reading. */
  tight: PageCam;
  /** The pulled-back framing: the whole Ask CampusAI card, send button in view. */
  wide: PageCam;
  /** The send button, page px. Omit to stop after the pull back (a film then cuts on `pullEnd`). */
  send?: Rect;
};

/** The part's timeline in frames: typing end, the read hold, the pull back, the press. */
export const questionHookTimes = (p: Pick<QuestionHookProps, "question" | "typeAt" | "perChar" | "send">) => {
  const typeAt = p.typeAt ?? 9;
  const steps: TypeStep[] = [{ type: "type", text: p.question, perChar: p.perChar ?? 1.7, wobble: 0.3 }];
  const typedEnd = typeAt + scriptFrames(steps);
  const pullAt = typedEnd + readFrames(p.question);
  const pullEnd = pullAt + DUR.travel;
  const pressAt = p.send ? pullEnd + 8 : pullEnd;
  return { steps, typeAt, typedEnd, pullAt, pullEnd, pressAt, end: pressAt + DUR.arrive };
};

export const QuestionHook: React.FC<QuestionHookProps> = (props) => {
  const { brand, page, view, mark, field, text, placeholder, tight, wide, send } = props;
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = questionHookTimes(props);
  // one framing while typing and reading (it breathes, never swings), then the pull back
  const held = drifted(tight, Math.min(f, T.pullAt), 0);
  const cam = clampCam(
    f < T.pullAt ? held : mixCam(held, drifted(wide, f, T.pullEnd), ramp(f, T.pullAt, T.pullEnd, CURVE.quiet.standard)),
    page.size, view,
  );
  const st = typingState(T.steps, f - T.typeAt);
  const typed = f >= T.typeAt ? st.text : "";
  const p = toCanvas(cam, view, text.x, text.baseline);
  const sz = text.size * p.s;
  const caretOn = typed.length === 0 ? Math.floor(f / 15) % 2 === 0 : st.mode === "type" ? true : Math.floor(st.since / 15) % 2 === 0;
  const cover = rectOnCanvas(cam, view, placeholder.rect);

  // pointer: glides onto the send button once the camera has landed, presses on T.pressAt
  let pointer: React.ReactNode = null;
  if (send) {
    const sb = rectOnCanvas(cam, view, send);
    const tx = sb.x + sb.w * 0.52;
    const ty = sb.y + sb.h * 0.58;
    const g = ramp(f, T.pressAt - 4 - 24, T.pressAt - 4, CURVE.quiet.standard);
    const x = tx + (1 - g) * view.w * 0.16;
    const y = ty + (1 - g) * view.h * 0.2;
    const shown = ramp(f, T.pressAt - 4 - 24, T.pressAt - 4 - 24 + DUR.panel);
    const since = f >= T.pressAt ? (f - T.pressAt) / fps : null;
    pointer = shown > 0.01 ? <PointerAt x={x} y={y} since={since} accent={brand.color.accent} size={Math.max(56, 30 * p.s)} opacity={shown} /> : null;
  }

  return (
    <>
      <PageView src={page.src} page={page.size} cam={cam} view={view} brand={brand}>
        <MarkPatch cam={cam} view={view} spec={mark} />
        {/* the captured placeholder, covered with the field's own fill; the same words are drawn live below */}
        <div style={{ position: "absolute", left: cover.x, top: cover.y, width: cover.w, height: cover.h, background: field.fill }} />
        <div style={{ position: "absolute", left: p.x, top: p.y - sz * 0.97, height: sz * 1.2, display: "flex", alignItems: "center", whiteSpace: "pre",
          fontFamily: INTER_400, fontWeight: 400, fontSize: sz, lineHeight: `${sz * 1.2}px`, letterSpacing: 0 }}>
          {typed.length === 0 ? (
            <>
              {/* the caret sits at the start of the empty field, in front of the placeholder, without moving it */}
              <span style={{ position: "absolute", left: -0.8 * p.s, top: sz * 0.01, width: Math.max(2, 1.5 * p.s), height: sz * 1.18, background: text.color, opacity: caretOn ? 1 : 0 }} />
              <span style={{ color: placeholder.color }}>{placeholder.text}</span>
            </>
          ) : (
            <>
              <span style={{ color: text.color }}>{typed}</span>
              <span style={{ display: "inline-block", width: Math.max(2, 1.5 * p.s), height: sz * 1.18, background: text.color, opacity: caretOn ? 1 : 0, marginLeft: 0.6 * p.s }} />
            </>
          )}
        </div>
      </PageView>
      {pointer}
    </>
  );
};
