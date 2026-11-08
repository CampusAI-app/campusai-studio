/**
 * /type-slam (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse). Rebuilt the same day on
 * Jacob's note that the first 20 all looked the same: this one is a poster world. Full-bleed red grounds that change
 * with every card (brand red, oxblood, coral), words in Anton, a heavy condensed face, set huge and tight so a sentence
 * fills the frame edge to edge. Each word drops in from oversize and lands hard; the frame kicks with the hit.
 */
import React from "react";
import { loadFont } from "@remotion/google-fonts/Anton";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, readHold } from "../system/motion";
import { Cue, clamp, ramp } from "./common";
import { World } from "./world";

const { fontFamily: ANTON } = loadFont("normal", { weights: ["400"], subsets: ["latin"] });

export type TypeSlamProps = {
  /** One card per sentence. Keep each to a few words. `accent` is one word from the line, set in the card's accent ink. */
  cards: { text: string; accent?: string }[];
  source: string;
  cta?: string;
};

// The style's own grounds (11/08 rule: colour leans red, grounds vary). Each card takes the next one.
const CARDS = [
  { ground: "#D9202E", ink: "#170405", accent: "#FBE7D6" },
  { ground: "#2A0608", ink: "#F6D5C8", accent: "#FF4B3E" },
  { ground: "#FF6A4D", ink: "#1C0506", accent: "#FFF1E6" },
  { ground: "#F4D9CC", ink: "#3A0A0D", accent: "#D9202E" },
];

const PER_WORD = 6; // motion: frames between slams
const LAND = 5; // motion: frames from drop to landed
const FPS = 30;

const cardLen = (text: string) => 4 + text.split(" ").length * PER_WORD + Math.round(readHold(text) * FPS);
export const slamPlan = (p: TypeSlamProps) => {
  let t = 0;
  return p.cards.map((c, i) => { const at = t; t += cardLen(c.text); return { ...c, at, len: t - at, look: CARDS[i % CARDS.length] }; });
};
export const slamEnd = (p: TypeSlamProps) => slamPlan(p).reduce((s, c) => s + c.len, 0);

const kick = (f: number, hits: number[]) => {
  let x = 0, y = 0, r = 0;
  for (const h of hits) {
    const d = f - h - LAND;
    if (d < 0 || d > 10) continue;
    const a = Math.exp(-d / 2.6);
    x += 26 * a * Math.sin(d * 2.1 + h); y += 18 * a * Math.cos(d * 2.9 + h); r += 1.4 * a * Math.sin(d * 1.7 + h);
  }
  return { x, y, r };
};

const Card: React.FC<{ text: string; accent?: string; look: (typeof CARDS)[number]; last: boolean; source: string; len: number }> = ({ text, accent, look, last, source, len }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  const words = text.split(" ");
  const hits = words.map((_, i) => 4 + i * PER_WORD);
  const k = kick(f, hits);
  // two or three words a line, sized so the longest line fills the width
  const lines: string[][] = [];
  words.forEach((w) => { const cur = lines[lines.length - 1]; if (cur && cur.join(" ").length + w.length < 9) cur.push(w); else lines.push([w]); });
  // each line is sized on its own to fill the width, the way a poster is set (measured, the face is loaded before render)
  const fit = (t: string) => {
    const c = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
    if (!c) return 260;
    c.font = `400 100px ${ANTON}`;
    return Math.min(520, ((width - 100) / c.measureText(t).width) * 100 * 0.97);
  };
  const push = interpolate(f, [hits[hits.length - 1] + LAND, len], [1, 1.05], clamp); // motion: slow push while it holds
  let wi = 0;
  return (
    <AbsoluteFill style={{ background: look.ground, justifyContent: "center", padding: "0 50px" }}>
      <div style={{ transform: `translate(${k.x.toFixed(1)}px, ${k.y.toFixed(1)}px) rotate(${k.r.toFixed(2)}deg) scale(${push.toFixed(4)})`, transformOrigin: "50% 50%" }}>
        {lines.map((l, li) => (
          <div key={li} style={{ fontFamily: ANTON, fontSize: fit(l.join(" ")), lineHeight: 0.9, letterSpacing: "-0.01em", color: look.ink, whiteSpace: "nowrap" }}>
            {l.map((w) => {
              const i = wi++;
              const kk = ramp(f, hits[i], hits[i] + LAND, CURVE.showy.enter);
              const isAccent = accent && w.replace(/[.,?!]/g, "") === accent;
              return (
                <span key={i} style={{ display: "inline-block", marginRight: "0.22em", opacity: f < hits[i] ? 0 : 1, color: isAccent ? look.accent : look.ink,
                  transform: `scale(${(2.6 - 1.6 * kk).toFixed(3)})`, transformOrigin: "50% 70%", filter: `blur(${((1 - kk) * 16).toFixed(1)}px)` }}>{w}</span>
              );
            })}
          </div>
        ))}
      </div>
      {last ? (
        <div style={{ position: "absolute", left: 56, right: 56, bottom: 380, fontFamily: ANTON, fontSize: 34, letterSpacing: "0.01em", color: look.ink, opacity: 0.85 * ramp(f, hits[hits.length - 1] + 10, hits[hits.length - 1] + 22) }}>{source}</div>
      ) : null}
    </AbsoluteFill>
  );
};

export const TypeSlam: React.FC<TypeSlamProps> = (p) => {
  const plan = slamPlan(p);
  const end = slamEnd(p);
  return (
    <World endAt={end} ground={CARDS[0].ground} ink="#F6D5C8" logo="white" logoSpot="top-left" font={ANTON} fontWeight={400} cta={p.cta}
      end="wipe-up" endGround="#2A0608">
      {plan.map((c, i) => (
        <Sequence key={i} from={c.at} durationInFrames={c.len + (i === plan.length - 1 ? 200 : 0)}>
          <Card text={c.text} accent={c.accent} look={c.look} last={i === plan.length - 1} source={p.source} len={c.len} />
        </Sequence>
      ))}
      {plan.flatMap((c, i) => c.text.split(" ").map((_, j, arr) => (
        <Cue key={`${i}-${j}`} at={c.at + 4 + j * PER_WORD + LAND - 1} name={j === arr.length - 1 ? "bass-hit-short" : "hit-weak"} volume={j === arr.length - 1 ? 0.55 : 0.42} />
      )))}
    </World>
  );
};
