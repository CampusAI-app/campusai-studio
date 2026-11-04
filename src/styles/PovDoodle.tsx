/**
 * /pov-doodle (2026-11-04, name from Shaan Johari's Animation Styles Part 5, his prompt is DM-gated and unseen):
 * the cartoon diary. A hand-drawn student, a POV line, and a running tally that piles up beside them while their
 * face gets worse, then one line clears the pile and the face lands happy. The person is Open Peeps (./peeps).
 * Everything drawn sits under one "boil" filter whose noise reseeds every 4 frames, which is what makes still
 * line art read as hand-animated instead of a sticker sliding around.
 */
import React from "react";
import { loadFont } from "@remotion/google-fonts/Caveat";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR } from "../system/motion";
import { B, Clip, Cue, PRINT, RED, ZODIAK, clamp, ramp } from "./common";
import { Peep, type FaceName } from "./peeps/Peep";

const { fontFamily: HAND } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export type PovDoodleProps = {
  /** The POV line, top of frame. */
  pov: string;
  /** What the tally counts, e.g. "Tabs open". */
  tally: string;
  /** One sticky note per thing piling up, in order. 3 to 5 reads best. */
  notes: string[];
  /** The face after each note lands, same length as notes. */
  faces: FaceName[];
  /** The line that clears the pile, and the one word in it drawn in red. */
  payoff: string;
  accent: string;
  /** What the tally reads after the pile clears. */
  after: number;
};

const FIRST = 34;
const GAP = 24;
const notesEnd = (n: number) => FIRST + (n - 1) * GAP + DUR.arrive;
export const povEnd = (n: number) => notesEnd(n) + 40 + 74;
export const POV_END = povEnd(4);

const Boil: React.FC<{ f: number }> = ({ f }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id="boil" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={Math.floor(f / 4) % 7} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={5} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

/** A hand-drawn underline, drawn with the pen. */
const Scribble: React.FC<{ w: number; k: number }> = ({ w, k }) => {
  const d = `M4 18 C ${w * 0.3} 6, ${w * 0.6} 26, ${w - 4} 10`;
  return (
    <svg width={w} height={30} style={{ position: "absolute", left: 0, bottom: -26, overflow: "visible" }}>
      <path d={d} fill="none" stroke={RED} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
    </svg>
  );
};

export const PovDoodle: React.FC<PovDoodleProps> = ({ pov, tally, notes, faces, payoff, accent, after }) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const n = notes.length;
  const clear = notesEnd(n) + 40;
  const END = povEnd(n);
  const landed = notes.filter((_, i) => f >= FIRST + i * GAP + 6).length;
  const swept = ramp(f, clear, clear + DUR.travel * 0.6, CURVE.showy.exit);
  const count = f >= clear + 14 ? after : landed;
  const face: FaceName = f >= clear + 10 ? "SmileBig" : landed === 0 ? "Calm" : faces[landed - 1];
  const peepIn = spring({ frame: f - 6, fps, config: { damping: 13, stiffness: 120 } });
  const bob = Math.sin(f / 9) * 6;
  const povK = ramp(f, 2, 2 + DUR.arrive, CURVE.quiet.enter) * (1 - ramp(f, clear, clear + DUR.panel, CURVE.quiet.exit));
  const words = payoff.split(" ");
  const pay = (i: number) => ramp(f, clear + 16 + i * 6, clear + 16 + i * 6 + DUR.panel, CURVE.showy.enter);
  const lineK = ramp(f, clear + 16 + words.length * 6, clear + 16 + words.length * 6 + 16, CURVE.quiet.standard);
  const tickAt = (i: number) => FIRST + i * GAP + 6;
  const lastTick = [...notes.map((_, i) => tickAt(i)), clear + 14].filter((t) => t <= f).pop() ?? -99;
  const pop = 1 + 0.18 * (1 - ramp(f, lastTick, lastTick + 8, CURVE.quiet.standard));
  return (
    <Clip endAt={END} light>
      <Boil f={f} />
      <AbsoluteFill style={{ filter: "url(#boil)" }}>
        <div style={{ position: "absolute", left: 64, right: 64, top: 196, fontFamily: ZODIAK, fontWeight: 700, fontSize: 76, lineHeight: 1.06,
          letterSpacing: "-0.02em", color: PRINT, opacity: povK, transform: `translateY(${(1 - povK) * 14}px)` }}>
          {pov}
        </div>
        <div style={{ position: "absolute", left: 64, top: 196, right: 64, fontFamily: ZODIAK, fontWeight: 700, fontSize: 104, lineHeight: 1.04, letterSpacing: "-0.025em", color: PRINT }}>
          {words.map((w, i) => {
            const isAccent = w.replace(/[^\w]/g, "") === accent;
            return (
              <span key={i} style={{ position: "relative", display: "inline-block", marginRight: "0.24em", opacity: f < clear + 16 + i * 6 ? 0 : pay(i),
                transform: `scale(${(1.3 - 0.3 * pay(i)).toFixed(3)})`, color: isAccent ? RED : PRINT }}>
                {w}
                {isAccent ? <Scribble w={w.length * 52} k={lineK} /> : null}
              </span>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 70, top: 470, fontFamily: HAND, fontSize: 64, color: PRINT, opacity: ramp(f, 20, 32) }}>
          {tally}:{" "}
          <span style={{ display: "inline-block", color: RED, fontSize: 96, transform: `scale(${pop.toFixed(3)})`, transformOrigin: "30% 70%" }}>{count}</span>
        </div>
        <div style={{ position: "absolute", left: -90, top: H * 0.4 + bob, transform: `scale(${peepIn.toFixed(4)})`, transformOrigin: "50% 100%" }}>
          <Peep face={face} body="Device" ink={PRINT} fill={B.color.ink} width={W * 0.72} />
        </div>
        {notes.map((label, i) => {
          const at = FIRST + i * GAP;
          const drop = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 140 } });
          const rot = (i % 2 ? 5 : -6) + (i === 1 ? 3 : 0);
          const y = H * 0.8 - i * 150;
          const off = swept * (W * 1.1 + i * 60);
          return f < at ? null : (
            <div key={i} style={{ position: "absolute", left: W * 0.6 + (i % 2) * 18, top: y - (1 - drop) * 520, width: 370, padding: "26px 30px",
              background: i === n - 1 ? "#fff6c9" : "#fffdf8", border: `5px solid ${PRINT}`, borderRadius: "14px 22px 12px 26px",
              boxShadow: `6px 8px 0 ${PRINT}`, transform: `translateX(${off}px) rotate(${rot + swept * 40}deg)`,
              fontFamily: HAND, fontSize: 60, lineHeight: 1, color: PRINT, opacity: interpolate(drop, [0, 0.2], [0, 1], clamp) }}>
              {label}
            </div>
          );
        })}
      </AbsoluteFill>
      {notes.map((_, i) => <Cue key={i} at={FIRST + i * GAP + 4} name="paper-slide" volume={0.45} />)}
      {notes.map((_, i) => <Cue key={`t${i}`} at={tickAt(i)} name="switch-tap" volume={0.35} />)}
      <Cue at={clear} name="paper-move-quick" volume={0.6} />
      <Cue at={clear + 16 + words.length * 6} name="marker-pen-line" volume={0.5} />
    </Clip>
  );
};
