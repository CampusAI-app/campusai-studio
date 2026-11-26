/**
 * Pill type (2026-11-26, from thejimmy.vision's Pulse explainer, Muse Nov 26; Jacob: "I love this one also"). Read frame
 * by frame (Lucius's watch notes, Nov 26); our own build.
 *
 * PillType: a headline that types in letter by letter behind a caret, and the key word lives inside a filled pill. The
 * pill opens as its first letter arrives and grows with the word, so the eye lands on it ("You just got [22] warm
 * leads", "But which video actually [sent them]?", "Stop making content for [views]."). One accent, the rest plain ink.
 *
 * PillFunnel: a row of dark pills joined by accent arrows, each arrow carrying a % tag ("7K Clicks -> 177 Leads -> 12
 * Calls"), pills landing one after another and the whole row sliding left like a ticker. Numbers must come from a
 * capture or the facts file. Worked example: PillType-Proof-9x16 (src/phonewalk/), and the question beat of
 * PostPhoneWalk-9x16.
 */
import React from "react";
import { Easing, interpolate } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const LAND = Easing.bezier(0.16, 1, 0.3, 1);

export type PillRun = { text: string; pill?: boolean };

export const PillType: React.FC<{
  f: number;
  at: number;
  runs: PillRun[];
  size: number;
  font: string;
  weight?: number;
  ink: string;
  pillBg: string;
  pillInk: string;
  /** Letters per frame. Pulse types about 1.1 a frame at 30 fps. */
  speed?: number;
  /** Line breaks: index of runs that start a new line. */
  breaks?: number[];
  align?: "left" | "center";
  italicPill?: boolean;
  caret?: boolean;
  out?: number;
}> = ({ f, at, runs, size, font, weight = 700, ink, pillBg, pillInk, speed = 1.1, breaks = [], align = "center", italicPill, caret = true, out }) => {
  if (f < at) return null;
  const typed = (f - at) * speed;
  let used = 0;
  const lines: React.ReactNode[][] = [[]];
  let caretShown = false;
  const total = runs.reduce((n, r) => n + r.text.length, 0);
  runs.forEach((r, i) => {
    if (breaks.includes(i) && i > 0) lines.push([]);
    const start = used;
    used += r.text.length;
    const n = Math.max(0, Math.min(r.text.length, Math.floor(typed - start)));
    const visible = r.text.slice(0, n);
    const hidden = r.text.slice(n);
    const isTyping = typed >= start && typed < used;
    const cur = lines[lines.length - 1];
    if (r.pill) {
      if (typed < start) return;
      const open = interpolate(typed - start, [0, 3], [0, 1], { ...clamp, easing: LAND });
      cur.push(
        <span key={i} style={{ display: "inline-block", position: "relative", padding: `${size * 0.02}px ${size * 0.26}px ${size * 0.06}px`, margin: `0 ${size * 0.05}px`,
          borderRadius: size * 0.36, background: pillBg, color: pillInk, fontStyle: italicPill ? "italic" : undefined,
          transform: `scale(${0.7 + 0.3 * open})`, transformOrigin: "left center", verticalAlign: "baseline" }}>
          {visible}
          <span style={{ opacity: 0 }}>{hidden}</span>
        </span>,
      );
    } else {
      cur.push(
        <span key={i}>
          {visible}
          {isTyping && caret ? <Caret size={size} color={ink} f={f} /> : null}
          <span style={{ opacity: 0 }}>{hidden}</span>
        </span>,
      );
      if (isTyping) caretShown = true;
    }
  });
  const done = typed >= total;
  const o = out === undefined ? 1 : interpolate(f, [out, out + 8], [1, 0], clamp);
  return (
    <div data-typing style={{ fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.16, color: ink, letterSpacing: "-0.02em", textAlign: align, opacity: o,
      filter: out !== undefined && f > out ? `blur(${interpolate(f, [out, out + 8], [0, 10], clamp)}px)` : undefined }}>
      {lines.map((l, i) => (
        <div key={i} style={{ whiteSpace: "nowrap" }}>
          {l}
          {i === lines.length - 1 && caret && !caretShown && !done ? <Caret size={size} color={ink} f={f} /> : null}
          {i === lines.length - 1 && caret && done && Math.floor((f - at) / 8) % 2 === 0 && (f - at - total / speed) < 40 ? <Caret size={size} color={ink} f={f} /> : null}
        </div>
      ))}
    </div>
  );
};

const Caret: React.FC<{ size: number; color: string; f: number }> = ({ size, color }) => (
  <span style={{ display: "inline-block", width: Math.max(3, size * 0.06), height: size * 0.86, background: color, marginLeft: size * 0.04, verticalAlign: "-0.1em", borderRadius: 2 }} />
);

export type FunnelStep = { value: string; label: string; tag?: string };

export const PillFunnel: React.FC<{
  f: number;
  at: number;
  steps: FunnelStep[];
  size: number;
  font: string;
  pill: string;
  pillInk: string;
  soft: string;
  accent: string;
  /** Frames between pills landing. */
  every?: number;
  /** Ticker slide after the last pill lands, px over the rest of the shot. */
  drift?: number;
  gap?: number;
}> = ({ f, at, steps, size, font, pill, pillInk, soft, accent, every = 12, drift = 0, gap = 24 }) => {
  const last = at + every * (steps.length - 1) + 14;
  const slide = drift ? -interpolate(f, [at, last + 90], [0, drift], { ...clamp, easing: Easing.bezier(0.33, 0, 0.67, 1) }) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap, fontFamily: font, transform: `translateX(${slide}px)`, whiteSpace: "nowrap" }}>
      {steps.map((s, i) => {
        const a = interpolate(f, [at + i * every, at + i * every + 12], [0, 1], { ...clamp, easing: LAND });
        const arr = interpolate(f, [at + i * every - 6, at + i * every + 6], [0, 1], { ...clamp, easing: LAND });
        return (
          <React.Fragment key={i}>
            {i > 0 ? (
              <div style={{ display: "flex", alignItems: "center", opacity: arr }}>
                <div style={{ width: size * 0.5 * arr, height: 4, borderRadius: 2, background: accent }} />
                {s.tag ? (
                  <div style={{ fontSize: size * 0.4, fontWeight: 700, color: "#fff", background: accent, padding: `${size * 0.16}px ${size * 0.2}px`, borderRadius: size * 0.18,
                    transform: `scale(${0.6 + 0.4 * arr})`, boxShadow: `0 0 ${size * 0.5}px ${accent}66` }}>{s.tag}</div>
                ) : null}
                <svg width={size * 0.7} height={size * 0.5} viewBox="0 0 28 20">
                  <path d={`M0 10 H${(24 * arr).toFixed(1)}`} stroke={accent} strokeWidth={4} strokeLinecap="round" />
                  <path d="M17 3 L25 10 L17 17" stroke={accent} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={arr} />
                </svg>
              </div>
            ) : null}
            <div style={{ background: pill, color: pillInk, borderRadius: size * 0.8, padding: `${size * 0.3}px ${size * 0.55}px`, opacity: a,
              transform: `translateY(${(1 - a) * 30}px) scale(${0.85 + 0.15 * a})`, boxShadow: "0 18px 40px rgba(0,0,0,0.28)" }}>
              <div style={{ fontSize: size, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: size * 0.42, fontWeight: 500, color: soft, marginTop: size * 0.12 }}>{s.label}</div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
