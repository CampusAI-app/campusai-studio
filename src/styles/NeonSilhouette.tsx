/**
 * /neon-silhouette (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). A person drawn in neon on a dark wall: the outline lights from top to bottom like a tube warming, flickers
 * twice and holds, with a soft red glow on the wall behind it; then a neon line of text lights beside them the same way.
 * The person is Open Peeps (CC0, `peeps/`), never drawn by hand: their ink lines become the tube. Red is the tube,
 * the brand's warm ink is the hot white core.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR, readHold } from "../system/motion";
import { B, Clip, Cue, INTER, RED, ZODIAK, ramp } from "./common";
import { Peep, type BodyName, type FaceName, type HairName } from "./peeps/Peep";

export type NeonSilhouetteProps = {
  person: { face: FaceName; body: BodyName; hair?: HairName };
  /** The neon line, one or two short lines. */
  lines: string[];
  /** A smaller line under it, plain light. */
  sub: string;
  source: string;
  cta?: string;
};

const FPS = 30;
const PERSON_AT = 0;
const WARM = 30; // motion: frames for the tube to light top to bottom
// a neon tube's start: dark, a stutter, full, a dip, full
const FLICKER = [0, 1, 0.15, 1, 1, 1, 0.3, 1];
const flick = (f: number, at: number) => (f < at ? 0 : f - at < FLICKER.length * 2 ? FLICKER[Math.floor((f - at) / 2)] : 1);

export const neonPlan = (p: NeonSilhouetteProps) => {
  const textAt = PERSON_AT + WARM + 18;
  const subAt = textAt + 26;
  const end = subAt + Math.round((readHold(`${p.lines.join(" ")} ${p.sub}`) + 0.4) * FPS);
  return { textAt, subAt, end };
};
export const neonEnd = (p: NeonSilhouetteProps) => neonPlan(p).end;

export const NeonSilhouette: React.FC<NeonSilhouetteProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { textAt, subAt, end } = neonPlan(p);
  const pw = width * 0.62;
  const top = height * 0.43;
  const subTop = height * 0.15 + p.lines.length * 110 + 34;
  const warm = ramp(f, PERSON_AT, PERSON_AT + WARM, CURVE.quiet.standard);
  const onP = flick(f, PERSON_AT + WARM - 4);
  const lit = Math.max(0.6, warm * 0.85, onP);
  const onT = flick(f, textAt);
  const hum = 0.94 + 0.06 * Math.sin(f / 3.3) * Math.sin(f / 7.1); // the steady hum of a lit tube
  const drift = 1 + ramp(f, 0, end, CURVE.quiet.standard) * 0.04;
  const sub = ramp(f, subAt, subAt + DUR.arrive, CURVE.quiet.enter);
  const tube = (glow: boolean) => (
    <Peep face={p.person.face} body={p.person.body} hair={p.person.hair} ink={glow ? RED : B.color.ink} fill="transparent" width={pw}
      style={{ position: "absolute", left: (width - pw) / 2, top, filter: glow ? `blur(10px) drop-shadow(0 0 26px ${RED})` : `drop-shadow(0 0 3px ${RED}) drop-shadow(0 0 10px ${RED})` }} />
  );
  return (
    <Clip endAt={end} cta={p.cta}>
      {/* the wall: brick-less, just a faint vertical grain so the glow has something to land on */}
      <AbsoluteFill style={{ background: `repeating-linear-gradient(90deg, rgba(247,239,230,.018) 0 2px, transparent 2px 9px)` }} />
      <AbsoluteFill style={{ transform: `scale(${drift.toFixed(4)})` }}>
        {/* the glow the tube throws on the wall */}
        <div style={{ position: "absolute", left: width * 0.1, width: width * 0.8, top: top + pw * 0.2, height: pw * 1.1, borderRadius: "50%",
          background: `radial-gradient(closest-side, rgba(${B.color.glowRgb},${(0.32 * lit * hum).toFixed(3)}), transparent)` }} />
        {/* the tube lights from the top down while it warms */}
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 ${((1 - Math.min(1, 0.35 + warm * 0.7)) * 100).toFixed(1)}% 0)`, opacity: lit * hum }}>
          {tube(true)}
          {tube(false)}
        </div>
        {/* the neon line */}
        <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.15, textAlign: "center", opacity: onT * hum }}>
          {p.lines.map((l, i) => (
            <div key={i} style={{ fontFamily: ZODIAK, fontWeight: 700, fontStyle: "italic", fontSize: 104, lineHeight: 1.04, letterSpacing: "-0.02em", color: B.color.ink,
              textShadow: `0 0 4px ${RED}, 0 0 14px ${RED}, 0 0 34px ${RED}, 0 0 64px rgba(${B.color.glowRgb},.7)` }}>{l}</div>
          ))}
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 64, right: 64, top: subTop, textAlign: "center", fontFamily: ZODIAK, fontWeight: 700, fontSize: 50, lineHeight: 1.1, color: B.color.ink,
        opacity: sub, transform: `translateY(${(1 - sub) * 14}px)` }}>{p.sub}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: subTop + 80, textAlign: "center", fontFamily: INTER, fontSize: 32, color: B.color.inkSoft,
        opacity: ramp(f, subAt + 12, subAt + 24) }}>{p.source}</div>
      <Cue at={PERSON_AT + WARM - 4} name="switch-tap" volume={0.5} />
      <Cue at={textAt} name="switch-tap" volume={0.45} />
      <Cue at={textAt + 2} name="data-scan" volume={0.15} />
    </Clip>
  );
};
