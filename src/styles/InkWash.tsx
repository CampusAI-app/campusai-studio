/**
 * /ink-wash: a title card. A red sun blooms on paper, ink spreads into three ranges of mountains, the title
 * stamps in Zodiak, the logo lands beneath it. Nothing on the shelf does this, so it is drawn here: each wash
 * is a ridge seen through a growing mask, and turbulence on the mask edge is what makes ink read as ink.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR } from "../system/motion";
import { Bed, B, Cue, HeldLogo, EndCard, PAPER, PRINT, RED, ZODIAK, clamp, ramp } from "./common";
import { useBrandFonts } from "../kit/brand";

export type InkWashProps = { title: string };
export const INK_END = 165;
export const INK_TOTAL = 255;

const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const ridge = (w: number, h: number, base: number, amp: number, seed: number) => {
  const r = rng(seed); const n = 26; const peaks = Array.from({ length: 6 }, () => r());
  let d = `M-60 ${h + 60}`;
  for (let i = 0; i <= n; i++) {
    const x = -60 + (i / n) * (w + 120), t = i / n;
    const y = base - amp * (peaks.reduce((a, p, k) => a + Math.sin(t * Math.PI * (k + 1.2) * 1.6 + p * 6.28) / (k + 1), 0) * 0.6 + 0.5) - (r() - 0.5) * amp * 0.1;
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d} L${w + 60} ${h + 60} Z`;
};
const WASHES = [
  { base: 0.68, amp: 300, seed: 4111, op: 0.34, at: 18, cx: 0.74 },
  { base: 0.78, amp: 330, seed: 9973, op: 0.62, at: 36, cx: 0.22 },
  { base: 0.96, amp: 300, seed: 7001, op: 0.8, at: 54, cx: 0.6 },
];

export const InkWash: React.FC<InkWashProps> = ({ title }) => {
  useBrandFonts(B);
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const paths = useMemo(() => WASHES.map((m) => ridge(W, H, H * m.base, m.amp, m.seed)), [W, H]);
  const sun = ramp(f, 0, 22, CURVE.quiet.enter);
  const words = title.split(" ");
  const drift = interpolate(f, [0, INK_TOTAL], [1.05, 1], clamp);
  const leave = ramp(f, INK_END, INK_END + DUR.arrive, CURVE.quiet.exit);
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <Bed total={INK_TOTAL} volume={0.34} />
      <AbsoluteFill style={{ transform: `scale(${drift.toFixed(4)})` }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="edge" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves={4} seed={7} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={150} />
              <feGaussianBlur stdDeviation={10} />
            </filter>
            <filter id="ridge" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.011 0.028" numOctaves={5} seed={3} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={34} result="shape" />
              <feGaussianBlur in="shape" stdDeviation={0.9} result="wet" />
              {/* dry brush: fine vertical streaks cut into the wash, so it reads as bristle, not blur */}
              <feTurbulence type="fractalNoise" baseFrequency="0.085 0.004" numOctaves={4} seed={5} result="fibre" />
              <feColorMatrix in="fibre" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.4 2.5" result="strokes" />
              <feComposite in="wet" in2="strokes" operator="in" />
            </filter>
            <filter id="sun" x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={3} seed={11} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={22} />
              <feGaussianBlur stdDeviation={1.2} />
            </filter>
            <filter id="bleed" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.006 0.016" numOctaves={3} seed={21} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={90} />
              <feGaussianBlur stdDeviation={34} />
            </filter>
            <linearGradient id="fall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0.3" stopColor={PRINT} stopOpacity={1} />
              <stop offset="0.6" stopColor={PRINT} stopOpacity={0.4} />
              <stop offset="0.92" stopColor={PRINT} stopOpacity={0} />
            </linearGradient>
            {WASHES.map((m, i) => {
              const k = ramp(f, m.at, m.at + 70, CURVE.quiet.enter);
              return (
                <mask key={i} id={`bloom${i}`} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
                  <circle cx={W * m.cx} cy={H * (m.base - 0.13)} r={Math.max(1, k * H * 0.82)} fill="white" filter="url(#edge)" />
                </mask>
              );
            })}
          </defs>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={2} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.08  0 0 0 0.16 0" />
          </filter>
          <rect width={W} height={H} filter="url(#grain)" />
          <circle cx={W * 0.72} cy={H * 0.365} r={Math.max(1, 150 * sun)} fill={RED} opacity={0.94} filter="url(#sun)" />
          {WASHES.map((m, i) => (
            <g key={i} mask={`url(#bloom${i})`} opacity={m.op * (1 - leave * 0.93)}>
              <path d={paths[i]} fill="url(#fall)" filter="url(#bleed)" opacity={0.3} />
              <path d={paths[i]} fill="url(#fall)" filter="url(#ridge)" opacity={0.96} />
            </g>
          ))}
        </svg>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 64, right: 64, top: 196, fontFamily: ZODIAK, fontWeight: 700, fontSize: 148, lineHeight: 1.02, letterSpacing: "-0.025em", color: PRINT }}>
        {words.map((w, i) => {
          const at = 84 + i * 9;
          const k = ramp(f, at, at + 7, CURVE.showy.enter);
          return <span key={i} style={{ display: "inline-block", marginRight: "0.24em", opacity: f < at ? 0 : k, transform: `scale(${(1.4 - 0.4 * k).toFixed(3)})`, filter: `blur(${((1 - k) * 7).toFixed(1)}px)` }}>{w}</span>;
        })}
      </div>
      <div style={{ opacity: 1 - leave }}><HeldLogo light out={INK_END} /></div>
      <EndCard at={INK_END + 6} light y={H * 0.56} />
      <Cue at={0} name="swoosh-slow" volume={0.35} />
      <Cue at={18} name="paper-page-turn" volume={0.22} />
      {words.map((_, i) => <Cue key={i} at={84 + i * 9} name="typewriter-hit-soft" volume={0.55} />)}
      <Cue at={INK_END + 6} name="chime-crystal" volume={0.3} />
    </AbsoluteFill>
  );
};
