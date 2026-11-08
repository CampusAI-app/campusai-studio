/**
 * /type-slam (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; his prompts were gated and
 * never seen, so this is our own build of the name). Short true sentences, one card each, words slamming in one at a
 * time: each word drops from big and blurred, lands hard, and the frame shakes with the hit and settles. The card then
 * holds for the reading rule before a hard cut to the next. One red word per card at most, the last card names
 * CampusAI, the source sits small on the last card.
 */
import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, readHold } from "../system/motion";
import { B, Clip, Cue, INTER, RED, ZODIAK, clamp, ramp } from "./common";

export type TypeSlamProps = {
  /** One card per sentence. Keep each to a few words. `accent` is one word from the line, set in red. */
  cards: { text: string; accent?: string }[];
  /** Under the last card, small. Where the claims come from. */
  source: string;
  cta?: string;
};

const PER_WORD = 6; // motion: frames between slams, a hit every fifth of a second
const LAND = 5; // motion: frames from drop to landed, fast enough to read as an impact
const FPS = 30;

const cardLen = (text: string) => {
  const words = text.split(" ").length;
  return 4 + words * PER_WORD + Math.round(readHold(text) * FPS);
};

export const slamPlan = (p: TypeSlamProps) => {
  let t = 0;
  return p.cards.map((c) => {
    const at = t;
    t += cardLen(c.text);
    return { ...c, at, len: t - at };
  });
};
export const slamEnd = (p: TypeSlamProps) => slamPlan(p).reduce((s, c) => s + c.len, 0);

/** The camera shake after a hit: a fast decaying wobble, never more than a few pixels after the first frames. */
const shake = (f: number, hits: number[]) => {
  let x = 0, y = 0;
  for (const h of hits) {
    const d = f - h - LAND;
    if (d < 0 || d > 12) continue;
    const a = 22 * Math.exp(-d / 3);
    x += a * Math.sin(d * 2.3 + h);
    y += a * 0.7 * Math.cos(d * 3.1 + h);
  }
  return { x, y };
};

const Card: React.FC<{ text: string; accent?: string; last: boolean; source: string; len: number }> = ({ text, accent, last, source, len }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  const words = text.split(" ");
  const hits = words.map((_, i) => 4 + i * PER_WORD);
  const s = shake(f, hits);
  // Size the type to the longest word so nothing ever leaves the frame.
  const longest = Math.max(...words.map((w) => w.length));
  const size = Math.min(230, ((width - 128) / Math.max(4, longest)) * 1.55);
  const drift = interpolate(f, [hits[hits.length - 1] + LAND, len], [1, 1.035], clamp); // motion: slow push while it holds, so the hold is never still
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 64px", transform: `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) scale(${drift.toFixed(4)})` }}>
      <div style={{ fontFamily: ZODIAK, fontWeight: 700, fontSize: size, lineHeight: 0.98, letterSpacing: "-0.035em", color: B.color.ink }}>
        {words.map((w, i) => {
          const k = ramp(f, hits[i], hits[i] + LAND, CURVE.showy.enter);
          const isAccent = accent && w.replace(/[.,?!]/g, "") === accent;
          return (
            <span key={i} style={{ display: "inline-block", marginRight: "0.22em", opacity: f < hits[i] ? 0 : Math.min(1, k * 1.6),
              transform: `scale(${(2.4 - 1.4 * k).toFixed(3)}) translateY(${((1 - k) * -40).toFixed(1)}px)`, transformOrigin: "50% 60%",
              filter: `blur(${((1 - k) * 14).toFixed(1)}px)`, color: isAccent ? RED : B.color.ink, fontStyle: isAccent ? "italic" : "normal" }}>{w}</span>
          );
        })}
      </div>
      {last ? (
        <div style={{ position: "absolute", left: 64, right: 64, top: "calc(50% + 430px)", fontFamily: INTER, fontSize: 34, color: B.color.ink,
          opacity: ramp(f, hits[hits.length - 1] + 10, hits[hits.length - 1] + 22) }}>{source}</div>
      ) : null}
      {/* the flash of each hit, one frame of light under the word */}
      <AbsoluteFill style={{ background: B.color.ink, opacity: hits.some((h) => f === h + LAND) ? 0.015 : 0, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

export const TypeSlam: React.FC<TypeSlamProps> = (p) => {
  const plan = slamPlan(p);
  const end = slamEnd(p);
  return (
    <Clip endAt={end} cta={p.cta}>
      {plan.map((c, i) => (
        <Sequence key={i} from={c.at} durationInFrames={c.len + (i === plan.length - 1 ? 200 : 0)}>
          <Card text={c.text} accent={c.accent} last={i === plan.length - 1} source={p.source} len={c.len} />
        </Sequence>
      ))}
      {plan.flatMap((c, i) => c.text.split(" ").map((_, j) => (
        <Cue key={`${i}-${j}`} at={c.at + 4 + j * PER_WORD + LAND - 1} name={j === c.text.split(" ").length - 1 ? "bass-hit-short" : "hit-weak"} volume={j === c.text.split(" ").length - 1 ? 0.55 : 0.4} />
      )))}
    </Clip>
  );
};
