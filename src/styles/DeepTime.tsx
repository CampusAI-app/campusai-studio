/**
 * /deep-time (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). Scale, felt by zooming out. A timeline starts on something small (one term) filling the frame, then pulls
 * back in long smooth stages, each stage a step up in scale (the term inside four years, the four years inside the
 * whole history), the tick marks re-ruling themselves from months to years to decades as it goes, and the small thing
 * shrinking to a red sliver. Dated marks come into view as the range reaches them. One line lands at the end.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR, readHold } from "../system/motion";
import { B, Clip, Cue, INTER, RED, Title, ZODIAK, clamp, ramp } from "./common";

export type DeepTimeProps = {
  title: string;
  /** The small thing, in decimal years (2026.66 is about Aug 31, 2026). */
  focus: { label: string; from: number; to: number };
  /** The stages the camera pulls back through, each a range in decimal years with a caption. */
  stages: { from: number; to: number; caption: string }[];
  /** Dated marks on the line. */
  marks: { year: number; label: string }[];
  line: string;
  source: string;
  cta?: string;
};

const FPS = 30;
const HOLD0 = 40;
const MOVE = 54; // motion: frames per zoom stage, long and smooth so the scale is felt
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const deepPlan = (p: DeepTimeProps) => {
  const stageAt: number[] = [];
  let t = HOLD0;
  p.stages.forEach((s) => { stageAt.push(t); t += MOVE + Math.round(readHold(s.caption) * FPS * 0.6); });
  const lineAt = t;
  const end = lineAt + Math.round((readHold(p.line) + 0.5) * FPS);
  return { stageAt, lineAt, end };
};
export const deepEnd = (p: DeepTimeProps) => deepPlan(p).end;

export const DeepTime: React.FC<DeepTimeProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { stageAt, lineAt, end } = deepPlan(p);
  // the view, as a centre and a log span, eased between stages
  const views = [{ from: p.focus.from - (p.focus.to - p.focus.from) * 0.12, to: p.focus.to + (p.focus.to - p.focus.from) * 0.12 }, ...p.stages];
  let a = views[0].from, b = views[0].to;
  for (let i = 0; i < p.stages.length; i++) {
    const k = ramp(f, stageAt[i], stageAt[i] + MOVE, CURVE.quiet.standard);
    const v0 = views[i], v1 = views[i + 1];
    const span = Math.exp(Math.log(v0.to - v0.from) * (1 - k) + Math.log(v1.to - v1.from) * k);
    const c0 = (v0.from + v0.to) / 2, c1 = (v1.from + v1.to) / 2;
    // the centre moves in step with the log of the span, so the zoom reads as one continuous pull back
    const kc = (Math.log(span) - Math.log(v0.to - v0.from)) / (Math.log(v1.to - v1.from) - Math.log(v0.to - v0.from) || 1);
    const c = c0 + (c1 - c0) * kc;
    if (f >= stageAt[i]) { a = c - span / 2; b = c + span / 2; }
  }
  const span = b - a;
  const L = 60, R = width - 60;
  const X = (y: number) => L + ((y - a) / span) * (R - L);
  const axisY = height * 0.55;
  // pick the ruling for this span: months, years, decades
  const ticks: { x: number; major: boolean; label?: string }[] = [];
  if (span < 3) {
    for (let y = Math.floor(a * 12) / 12; y <= b; y += 1 / 12) {
      const m = Math.round((y - Math.floor(y)) * 12) % 12;
      ticks.push({ x: X(y), major: m === 0, label: span < 1.6 ? MONTHS[m] : m === 0 ? String(Math.round(y)) : undefined });
    }
  } else if (span < 40) {
    for (let y = Math.ceil(a); y <= b; y++) ticks.push({ x: X(y), major: y % 5 === 0, label: span < 14 || y % 5 === 0 ? String(y) : undefined });
  } else {
    for (let y = Math.ceil(a / 10) * 10; y <= b; y += 10) ticks.push({ x: X(y), major: y % 50 === 0, label: y % (span > 120 ? 50 : 10) === 0 ? String(y) : undefined });
  }
  const fx0 = X(p.focus.from), fx1 = X(p.focus.to);
  const stageIdx = stageAt.filter((s) => f >= s + MOVE * 0.6).length; // which caption is up
  const caption = stageIdx === 0 ? p.focus.label : p.stages[stageIdx - 1].caption;
  const capK = ramp(f, stageIdx === 0 ? 6 : stageAt[stageIdx - 1] + MOVE * 0.6, (stageIdx === 0 ? 6 : stageAt[stageIdx - 1] + MOVE * 0.6) + DUR.arrive, CURVE.quiet.enter);
  const lineK = ramp(f, lineAt, lineAt + DUR.arrive, CURVE.quiet.enter);
  return (
    <Clip endAt={end} cta={p.cta}>
      <Title out={end} size={58}>{p.title}</Title>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <line x1={0} x2={width} y1={axisY} y2={axisY} stroke={B.color.ink} strokeOpacity={0.35} strokeWidth={3} />
        {ticks.map((t, i) => (t.x < -10 || t.x > width + 10 ? null : (
          <g key={i}>
            <line x1={t.x} x2={t.x} y1={axisY - (t.major ? 28 : 14)} y2={axisY + (t.major ? 28 : 14)} stroke={B.color.ink} strokeOpacity={t.major ? 0.7 : 0.35} strokeWidth={t.major ? 3 : 2} />
            {t.label ? <text x={t.x} y={axisY + 72} textAnchor="middle" fill={B.color.inkSoft} fontFamily={INTER} fontSize={30}>{t.label}</text> : null}
          </g>
        )))}
        {/* the small thing, never thinner than a visible sliver */}
        <rect x={fx0} y={axisY + 20 - Math.min(110, Math.max(40, (fx1 - fx0) * 0.5))} width={Math.max(4, fx1 - fx0)} height={Math.min(110, Math.max(40, (fx1 - fx0) * 0.5))} rx={Math.min(10, (fx1 - fx0) / 2)} fill={RED} opacity={0.92} />
      </svg>
      {p.marks.map((m, i) => {
        const x = X(m.year);
        const k = x > 40 && x < width - 40 ? 1 : 0;
        const up = i % 2 === 0;
        return (
          <div key={i} style={{ position: "absolute", left: Math.min(width - 300, Math.max(20, x - 140)), width: 280, top: up ? axisY - 250 : axisY + 120, textAlign: "center",
            opacity: k * interpolate(span, [20, 60], [0, 1], clamp) }}>
            <div style={{ fontFamily: ZODIAK, fontWeight: 700, fontSize: 44, color: B.color.ink, lineHeight: 1 }}>{m.year}</div>
            <div style={{ fontFamily: INTER, fontSize: 26, color: B.color.inkSoft, marginTop: 6, lineHeight: 1.2 }}>{m.label}</div>
          </div>
        );
      })}
      {p.marks.map((m, i) => {
        const x = X(m.year);
        const up = i % 2 === 0;
        return <AbsoluteFill key={`l${i}`} style={{ pointerEvents: "none" }}>
          <svg width={width} height={height} style={{ opacity: interpolate(span, [20, 60], [0, 1], clamp) }}>
            <line x1={x} x2={x} y1={up ? axisY - 160 : axisY + 40} y2={up ? axisY - 40 : axisY + 116} stroke={B.color.ink} strokeOpacity={0.5} strokeWidth={2} />
          </svg>
        </AbsoluteFill>;
      })}
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.27, fontFamily: ZODIAK, fontWeight: 700, fontSize: 64, lineHeight: 1.08, color: B.color.ink,
        opacity: capK * (1 - lineK), transform: `translateY(${(1 - capK) * 14}px)` }}>{caption}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.27, fontFamily: ZODIAK, fontWeight: 700, fontSize: 72, lineHeight: 1.06, color: B.color.ink,
        opacity: lineK, transform: `translateY(${(1 - lineK) * 14}px)` }}>{p.line}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.76, fontFamily: INTER, fontSize: 32, color: B.color.ink, opacity: ramp(f, lineAt + 10, lineAt + 22) }}>{p.source}</div>
      {stageAt.map((s, i) => <Cue key={i} at={s} name="swoosh-slow" volume={0.32} />)}
      <Cue at={lineAt} name="bass-hit-short" volume={0.5} />
    </Clip>
  );
};
