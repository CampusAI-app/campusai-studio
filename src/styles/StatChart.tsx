/**
 * /stat-chart: one true number grows while its line draws. The pen tip drives the number, so the two can
 * never disagree. A line, never rising bars (red bars read as AI, 10/19). Ends on its source.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR } from "../system/motion";
import { B, Clip, Cue, INTER, RED, Title, ZODIAK, clamp, ramp } from "./common";

export type StatChartProps = { title: string; unit: string; points: { label: string; value: number }[]; callout: string; source: string; floor: number; ceil: number };
export const STAT_END = 268;
const DRAW_FROM = 6;
const DRAW_TO = 136;

export const StatChart: React.FC<StatChartProps> = ({ title, unit, points, callout, source, floor, ceil }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const X0 = 90, X1 = width - 110, Y0 = height * 0.8, Y1 = height * 0.47;
  const px = (i: number) => X0 + (i / (points.length - 1)) * (X1 - X0);
  const py = (v: number) => Y0 + ((v - floor) / (ceil - floor)) * (Y1 - Y0);
  const t = interpolate(f, [DRAW_FROM, DRAW_TO], [0, points.length - 1], { ...clamp, easing: CURVE.quiet.standard });
  const i0 = Math.floor(t), k = t - i0;
  const a = points[i0], b = points[Math.min(i0 + 1, points.length - 1)];
  const value = a.value + (b.value - a.value) * k;
  const tip = { x: px(t), y: py(value) };
  const drawn = [...points.slice(0, i0 + 1).map((p, i) => `${px(i)},${py(p.value)}`), `${tip.x},${tip.y}`].join(" ");
  const area = `M${px(0)},${Y0} L${drawn.split(" ").join(" L")} L${tip.x},${Y0} Z`;
  const landed = ramp(f, DRAW_TO, DRAW_TO + DUR.arrive, CURVE.showy.enter);
  const fade = (at: number) => ramp(f, at, at + DUR.arrive, CURVE.quiet.enter);
  return (
    <Clip endAt={STAT_END}>
      <AbsoluteFill style={{ background: `radial-gradient(circle 380px at ${tip.x}px ${tip.y}px, rgba(${B.color.glowRgb},0.3), transparent 72%)` }} />
      <Title out={STAT_END}>{title}</Title>
      <div style={{ position: "absolute", left: 60, top: height * 0.235, fontFamily: ZODIAK, fontWeight: 700, fontSize: 340, lineHeight: 1, letterSpacing: "-0.03em", color: B.color.ink, fontVariantNumeric: "tabular-nums",
        transform: `scale(${(1 + landed * 0.03 - ramp(f, DRAW_TO + 6, DRAW_TO + 20) * 0.03).toFixed(4)})`, transformOrigin: "0 100%" }}>
        {Math.round(value)}
      </div>
      <div style={{ position: "absolute", left: 66, top: height * 0.425, fontFamily: INTER, fontWeight: 500, fontSize: 38, color: B.color.inkSoft }}>{unit}</div>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <defs><linearGradient id="st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={RED} stopOpacity={0.28} /><stop offset="1" stopColor={RED} stopOpacity={0} /></linearGradient></defs>
        {[floor, ceil].map((v) => (
          <g key={v} opacity={fade(2)}>
            <line x1={X0} x2={X1} y1={py(v)} y2={py(v)} stroke={B.color.ink} strokeOpacity={0.14} strokeWidth={2} />
            <text x={X1 + 12} y={py(v) + 11} fill={B.color.inkSoft} fontFamily={INTER} fontSize={32}>{v}</text>
          </g>
        ))}
        <path d={area} fill="url(#st)" />
        <polyline points={drawn} fill="none" stroke={RED} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (t >= i ? <circle key={i} cx={px(i)} cy={py(p.value)} r={6} fill={B.color.bgDeep} stroke={RED} strokeWidth={4} /> : null))}
        <circle cx={tip.x} cy={tip.y} r={14 + landed * 6} fill={RED} />
      </svg>
      <div style={{ position: "absolute", left: X0, top: Y0 + 20, fontFamily: INTER, fontSize: 34, color: B.color.inkSoft, opacity: fade(2) }}>{points[0].label}</div>
      <div style={{ position: "absolute", right: 110, top: Y0 + 20, fontFamily: INTER, fontSize: 34, color: B.color.inkSoft, opacity: fade(DRAW_TO - 10) }}>{points[points.length - 1].label}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: Y0 + 84, fontFamily: ZODIAK, fontWeight: 700, fontSize: 62, lineHeight: 1.1, color: B.color.ink, opacity: fade(DRAW_TO + 6), transform: `translateY(${(1 - fade(DRAW_TO + 6)) * 14}px)` }}>{callout}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: Y0 + 168, fontFamily: INTER, fontSize: 30, color: B.color.inkSoft, opacity: fade(DRAW_TO + 18) }}>{source}</div>
      <Cue at={DRAW_FROM} name="data-scan" volume={0.28} />
      <Cue at={DRAW_FROM + 40} name="counter" volume={0.25} />
      <Cue at={DRAW_TO} name="bass-hit-short" volume={0.6} />
    </Clip>
  );
};
