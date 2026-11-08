/**
 * /ink-doodle (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). A page of notes that annotate themselves: each line writes on in handwriting, then a pen doodles on it
 * (an underline, a tick, a circle around the number that matters, an arrow down to the next line), the strokes drawing
 * themselves with a little overshoot, all under the same 4-frame "boil" as /pov-doodle so it reads as hand-animated.
 * Paper ground and ink; the one red is the circle. Headline in Zodiak, the notes in Caveat.
 */
import React from "react";
import { loadFont } from "@remotion/google-fonts/Caveat";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, readHold } from "../system/motion";
import { Clip, Cue, INTER, PAPER, PRINT, RED, ZODIAK, ramp } from "./common";

const { fontFamily: HAND } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export type InkDoodleProps = {
  title: string;
  /** Each note, with the doodle it gets. `circle` is a word from the line that gets the red circle. */
  notes: { text: string; mark: "underline" | "tick" | "circle" | "arrow"; circle?: string }[];
  source: string;
  cta?: string;
};

const FPS = 30;
const W_CHAR = 1.3; // motion: frames per handwritten character
const MARK = 14; // motion: frames for a doodle stroke to draw
const GAP = 10;

export const doodlePlan = (p: InkDoodleProps) => {
  let t = 10;
  const notes = p.notes.map((n) => {
    const at = t;
    const written = at + Math.round(n.text.length * W_CHAR);
    const markAt = written + 4;
    t = markAt + MARK + GAP + Math.round(readHold(n.text) * FPS * 0.35);
    return { ...n, at, written, markAt };
  });
  const end = t + Math.round((readHold(p.notes.map((n) => n.text).join(" ")) * 0.4 + 0.6) * FPS);
  return { notes, end };
};
export const doodleEnd = (p: InkDoodleProps) => doodlePlan(p).end;

/** A stroke that draws itself: pathLength 1, dash offset from 1 to 0. */
const Stroke: React.FC<{ d: string; at: number; color?: string; w?: number }> = ({ d, at, color = PRINT, w = 7 }) => {
  const f = useCurrentFrame();
  const k = ramp(f, at, at + MARK, CURVE.quiet.standard);
  if (f < at) return null;
  return <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />;
};

export const InkDoodle: React.FC<InkDoodleProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { notes, end } = doodlePlan(p);
  const left = 128;
  const lineH = 210;
  const top0 = height * 0.3;
  const titleK = ramp(f, 4, 16, CURVE.quiet.enter);
  // measure the handwriting so every doodle lands on its words (the font is loaded before render starts)
  const measure = (t: string) => {
    const c = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
    if (!c) return t.length * 34;
    c.font = `700 84px ${HAND}`;
    return c.measureText(t).width;
  };
  return (
    <Clip endAt={end} light ground={PAPER} cta={p.cta}>
      {/* ruled paper */}
      <AbsoluteFill style={{ background: `repeating-linear-gradient(transparent 0 ${lineH / 2 - 2}px, rgba(11,7,8,.07) ${lineH / 2 - 2}px ${lineH / 2}px)`, backgroundPosition: `0 ${top0 + 26}px` }} />
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="inkboil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={Math.floor(f / 4) % 7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: "url(#inkboil)" }}>
        <div style={{ position: "absolute", left: 64, right: 64, top: 200, fontFamily: ZODIAK, fontWeight: 700, fontSize: 72, lineHeight: 1.06, letterSpacing: "-0.02em", color: PRINT,
          opacity: titleK, transform: `translateY(${(1 - titleK) * 12}px)` }}>{p.title}</div>
        {notes.map((n, i) => {
          const y = top0 + i * lineH;
          const shown = Math.max(0, Math.min(n.text.length, Math.floor((f - n.at) / W_CHAR)));
          const textW = measure(n.text);
          const ci = n.circle ? n.text.indexOf(n.circle) : -1;
          return (
            <React.Fragment key={i}>
              <div style={{ position: "absolute", left, top: y, fontFamily: HAND, fontWeight: 700, fontSize: 84, lineHeight: 1, color: PRINT, whiteSpace: "nowrap" }}>
                {ci >= 0 && n.mark === "circle" ? (
                  <>
                    {n.text.slice(0, Math.min(shown, ci))}
                    {/* the circled word carries its own circle, so the ring can never drift off it */}
                    <span style={{ position: "relative", display: "inline-block" }}>
                      {n.text.slice(ci, Math.max(ci, Math.min(shown, ci + n.circle!.length)))}
                      {shown >= ci + n.circle!.length ? (
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", left: -34, top: -18, width: "calc(100% + 68px)", height: "calc(100% + 36px)", overflow: "visible" }}>
                          <Stroke at={n.markAt} color={RED} w={8} d={[...Array(23)].map((_, k) => {
                            const a2 = -1.2 + (k / 22) * Math.PI * 2.25, rr = 1 + Math.sin(k * 1.7) * 0.05;
                            return `${k ? "L" : "M"}${(50 + Math.cos(a2) * 42 * rr).toFixed(1)},${(52 + Math.sin(a2) * 46 * rr).toFixed(1)}`;
                          }).join(" ")} />
                        </svg>
                      ) : null}
                    </span>
                    {n.text.slice(ci + n.circle!.length, Math.max(ci + n.circle!.length, shown))}
                  </>
                ) : n.text.slice(0, shown)}
              </div>
              <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                {n.mark === "underline" ? <Stroke at={n.markAt} d={`M${left - 6},${y + 92} C${left + textW * 0.3},${y + 84} ${left + textW * 0.7},${y + 98} ${left + textW + 10},${y + 88}`} /> : null}
                {n.mark === "tick" ? <Stroke at={n.markAt} d={`M${left - 64},${y + 40} L${left - 46},${y + 62} L${left - 14},${y + 6}`} /> : null}
                {n.mark === "arrow" ? (
                  <>
                    <Stroke at={n.markAt} d={`M${left + textW + 30},${y + 40} C${left + textW + 120},${y + 60} ${left + textW + 110},${y + lineH - 10} ${left + textW - 20},${y + lineH + 20}`} />
                    <Stroke at={n.markAt + MARK - 4} d={`M${left + textW + 6},${y + lineH + 2} L${left + textW - 20},${y + lineH + 20} L${left + textW + 4},${y + lineH + 40}`} />
                  </>
                ) : null}

              </svg>
            </React.Fragment>
          );
        })}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 64, right: 64, top: top0 + notes.length * lineH + 40, fontFamily: INTER, fontSize: 34, color: PRINT,
        opacity: ramp(f, notes[notes.length - 1].markAt + MARK, notes[notes.length - 1].markAt + MARK + 12) }}>{p.source}</div>
      {notes.map((n, i) => (
        <React.Fragment key={i}>
          <Cue at={n.at} name="typewriter-hit-soft" volume={0.2} />
          <Cue at={n.markAt} name="marker-pen-line" volume={0.4} />
        </React.Fragment>
      ))}
    </Clip>
  );
};
