/**
 * /money-stack (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). A true cost broken into its parts, each part a stack of bundles that drop in and land with a small squash,
 * one column per part, while the total above counts up only as bundles land, so the number is always the sum of what
 * is on screen. Every bundle is the same stated amount (the legend says how much), and a part's last bundle is cut to
 * its true remainder, so the heights are honest. The bundles are plain paper slabs with a band, never drawn currency.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, readHold } from "../system/motion";
import { loadFont as serif } from "@remotion/google-fonts/DMSerifDisplay";
import { loadFont as sans } from "@remotion/google-fonts/Manrope";
import { Cue, clamp, ramp } from "./common";
import { World } from "./world";

const { fontFamily: DISPLAY } = serif("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: SANS } = sans("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });
// rebuilt 11/08 as its own world: a terracotta photo studio with a soft floor, cash-cream bundles with red straps,
// the total in DM Serif Display, labels in Manrope
const STUDIO = "#B4513F";
const INK = "#2B0B08";
const CREAM = "#FFF1E4";
const RED = "#D9202E";

export type MoneyStackProps = {
  title: string;
  /** Each part and its amount in whole dollars. Biggest first reads best. */
  parts: { label: string; amount: number }[];
  /** What one bundle stands for, in dollars. */
  per: number;
  /** The total's own label, and its source. The total is the sum of the parts, never typed in. */
  totalLabel: string;
  note?: string;
  source: string;
  cta?: string;
};

const START = 16;
const DROP = 3; // motion: frames between bundles, a quick rhythmic drop
const FALL = 9; // motion: frames a bundle falls
const FPS = 30;
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

type Bundle = { col: number; i: number; value: number; at: number };
export const stackPlan = (p: MoneyStackProps) => {
  const bundles: Bundle[] = [];
  let t = START;
  p.parts.forEach((part, col) => {
    const n = Math.ceil(part.amount / p.per);
    for (let i = 0; i < n; i++) {
      const value = Math.min(p.per, part.amount - i * p.per);
      bundles.push({ col, i, value, at: t });
      t += DROP;
    }
    t += 6;
  });
  const landed = t + FALL;
  const total = p.parts.reduce((s, x) => s + x.amount, 0);
  const end = landed + 18 + Math.round((readHold(`${p.title} ${usd(total)} ${p.totalLabel}`) + 0.4) * FPS);
  return { bundles, landed, total, end };
};
export const stackEnd = (p: MoneyStackProps) => stackPlan(p).end;

export const MoneyStack: React.FC<MoneyStackProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { bundles, landed, end } = stackPlan(p);
  const cols = p.parts.length;
  const gap = 14;
  const colW = (width - 128 - gap * (cols - 1)) / cols;
  const floorY = height * 0.74;
  const maxN = Math.max(...p.parts.map((x) => Math.ceil(x.amount / p.per)));
  const slab = Math.min(54, (floorY - height * 0.43) / maxN);
  const sum = bundles.reduce((s, b) => s + (f >= b.at + FALL ? b.value : 0), 0);
  const done = ramp(f, landed, landed + 12, CURVE.showy.enter);
  return (
    <World endAt={end} cta={p.cta} font={DISPLAY} fontWeight={400} ink={CREAM} logo="white" logoSpot="top-right" end="iris" endGround={INK}
      ground={`radial-gradient(ellipse 80% 40% at 50% 80%, rgba(255,214,190,.45), transparent 70%), linear-gradient(180deg, #8E3426 0%, ${STUDIO} 55%, #D9806A 100%)`}>
      <div style={{ position: "absolute", left: 64, right: 300, top: 170, fontFamily: SANS, fontWeight: 800, fontSize: 44, lineHeight: 1.1, color: CREAM, opacity: ramp(f, 2, 14) }}>{p.title}</div>
      <div style={{ position: "absolute", left: 64, top: height * 0.25, fontFamily: DISPLAY, fontWeight: 400, fontSize: 210, lineHeight: 1, letterSpacing: "-0.02em",
        color: CREAM, textShadow: done > 0.5 ? `0 8px 0 ${RED}` : "none", fontVariantNumeric: "tabular-nums", transform: `scale(${(1 + done * 0.03 - ramp(f, landed + 8, landed + 22) * 0.03).toFixed(4)})`, transformOrigin: "0 100%" }}>
        {usd(sum)}
      </div>
      <div style={{ position: "absolute", left: 70, top: height * 0.25 + 200, fontFamily: SANS, fontWeight: 500, fontSize: 36, color: "#FFD9C6" }}>{p.totalLabel}</div>
      {bundles.map((b, k) => {
        const s = spring({ frame: f - b.at - FALL, fps, config: { damping: 12, stiffness: 220 } });
        const fall = interpolate(f, [b.at, b.at + FALL], [-160, 0], { ...clamp, easing: CURVE.quiet.exit });
        const appear = interpolate(f, [b.at, b.at + 2], [0, 1], clamp);
        if (f < b.at) return null;
        const hgt = slab * (b.value / p.per);
        const below = bundles.filter((o) => o.col === b.col && o.i < b.i).reduce((s2, o) => s2 + slab * (o.value / p.per), 0);
        const squash = f >= b.at + FALL ? 1 - (1 - Math.min(1, s)) * 0.25 : 1;
        return (
          <div key={k} style={{ position: "absolute", left: 64 + b.col * (colW + gap) + 4, width: colW - 8, top: floorY - below - hgt + fall, height: Math.max(3, hgt - 3),
            background: CREAM, borderRadius: 4, opacity: appear, transform: `scaleY(${squash.toFixed(3)})`, transformOrigin: "50% 100%",
            boxShadow: `inset 0 0 0 2px #E8D3BD, inset 0 -4px 0 rgba(43,11,8,.18), 0 6px 10px rgba(43,11,8,.25)` }}>
            {/* a bill's inner border and the paper strap round the bundle */}
            {hgt > 14 ? <div style={{ position: "absolute", left: 7, right: 7, top: 5, bottom: 6, border: `2px solid rgba(11,7,8,.22)`, borderRadius: 2 }} /> : null}
            {hgt > 10 ? <div style={{ position: "absolute", left: "44%", width: "12%", top: 0, bottom: 0, background: "#A3121C" }} /> : null}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 44, right: 44, top: floorY, height: 26, borderRadius: 3, background: "repeating-linear-gradient(90deg, #8A5A3A 0 120px, #6E4429 120px 128px)", boxShadow: "0 18px 30px rgba(43,11,8,.4)" }} />
      {p.parts.map((part, col) => {
        const last = bundles.filter((b) => b.col === col).pop()!;
        const k = ramp(f, last.at + FALL, last.at + FALL + 10, CURVE.quiet.enter);
        return (
          <div key={col} style={{ position: "absolute", left: 64 + col * (colW + gap) - 8, width: colW + 16, top: floorY + 44, textAlign: "center", opacity: k }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 28, color: CREAM, fontVariantNumeric: "tabular-nums" }}>{usd(part.amount)}</div>
            <div style={{ fontFamily: SANS, fontSize: 24, lineHeight: 1.15, color: "#FFD9C6", marginTop: 6 }}>{part.label}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 64, right: 64, top: floorY + 160, fontFamily: SANS, fontSize: 28, color: "#FFD9C6", opacity: ramp(f, START, START + 12) }}>
        One block is {usd(p.per)}.{p.note ? ` ${p.note}` : ""}
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, top: floorY + 230, fontFamily: SANS, fontSize: 32, color: CREAM, opacity: ramp(f, landed, landed + 12) }}>{p.source}</div>
      {p.parts.map((_, col) => {
        const first = bundles.find((b) => b.col === col)!;
        return <Cue key={col} at={first.at + FALL} name="paper-move-quick" volume={0.4} />;
      })}
      <Cue at={START + FALL} name="counter" volume={0.25} />
      <Cue at={landed} name="bass-hit-short" volume={0.6} />
    </World>
  );
};
