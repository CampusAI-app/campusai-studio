/**
 * /agent-swarm (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). One question in the middle; a swarm of small agents bursts out of it and splits toward the sources around
 * it, circles each one like it is reading, then streams back carrying red pieces that gather under the question as the
 * answer line. The agents are small arrow marks in ink with short trails, the sources are labelled cards, nothing
 * here imitates product UI. Every source named is one the real answer is built from.
 */
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR, readHold } from "../system/motion";
import { B, Clip, Cue, INTER, RED, Title, ZODIAK, ramp } from "./common";

export type AgentSwarmProps = {
  title: string;
  /** The question, in quotes on screen. */
  question: string;
  /** 3 to 5 sources the answer really draws on. */
  sources: string[];
  /** The line that lands under the question when the agents are back. */
  answer: string;
  source: string;
  cta?: string;
};

const FPS = 30;
const PER = 14; // agents per source
const OUT = 30, READ = 34, BACK = 30; // motion: out, circle while reading, back
const START = 18;
export const swarmPlan = (p: AgentSwarmProps) => {
  const back = START + OUT + READ;
  const answerAt = back + BACK + 4;
  const end = answerAt + Math.round((readHold(`${p.question} ${p.answer}`) * 0.7 + 0.6) * FPS);
  return { back, answerAt, end };
};
export const swarmEnd = (p: AgentSwarmProps) => swarmPlan(p).end;
const hash = (n: number) => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; };

export const AgentSwarm: React.FC<AgentSwarmProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { back, answerAt, end } = swarmPlan(p);
  const c = { x: width / 2, y: height * 0.5 };
  const R = width * 0.36;
  const src = p.sources.map((s, i) => {
    const a = -Math.PI / 2 + (i / p.sources.length) * Math.PI * 2 + Math.PI / p.sources.length;
    return { label: s, x: c.x + Math.cos(a) * R, y: c.y + Math.sin(a) * R * 1.25 };
  });
  const qK = ramp(f, 4, 4 + DUR.arrive, CURVE.quiet.enter);
  const aK = ramp(f, answerAt, answerAt + DUR.arrive, CURVE.quiet.enter);
  // where one agent is at frame t: out along a curve, an orbit round its source, back along another curve
  const agentAt = (s: number, k: number, t: number) => {
    const S = src[s];
    const j = hash(s * 97 + k), j2 = hash(s * 131 + k + 7);
    const delay = j * 10;
    const t0 = START + delay;
    const bend = (j2 - 0.5) * 220;
    const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2 + bend * -(b.y - a.y) / 600, y: (a.y + b.y) / 2 + bend * (b.x - a.x) / 600 });
    const orbit = (u: number) => ({ x: S.x + Math.cos(u * 6.28 * 1.4 + j * 6.28) * (70 + j2 * 40), y: S.y + Math.sin(u * 6.28 * 1.4 + j * 6.28) * (50 + j2 * 30) });
    const quad = (a: { x: number; y: number }, m: { x: number; y: number }, b: { x: number; y: number }, u: number) =>
      ({ x: (1 - u) ** 2 * a.x + 2 * (1 - u) * u * m.x + u * u * b.x, y: (1 - u) ** 2 * a.y + 2 * (1 - u) * u * m.y + u * u * b.y });
    if (t < t0) return null;
    if (t < t0 + OUT) { const u = CURVE.quiet.standard((t - t0) / OUT); const o = orbit(0); return { ...quad(c, mid(c, o), o, u), carry: false }; }
    if (t < back + delay) { const u = (t - t0 - OUT) / Math.max(1, back + delay - t0 - OUT); return { ...orbit(u), carry: false }; }
    const u = Math.min(1, CURVE.quiet.standard((t - back - delay) / BACK));
    const o = orbit(1);
    const home = { x: c.x + (j - 0.5) * 300, y: c.y + 120 + (j2 - 0.5) * 30 };
    return u >= 1 ? null : { ...quad(o, mid(o, home), home, u), carry: true };
  };
  return (
    <Clip endAt={end} cta={p.cta}>
      <Title out={end}>{p.title}</Title>
      {/* the sources */}
      {src.map((s, i) => {
        const k = ramp(f, 8 + i * 4, 8 + i * 4 + DUR.arrive, CURVE.quiet.enter);
        const reading = f > START + OUT && f < back + 10;
        return (
          <div key={i} style={{ position: "absolute", left: s.x - 150, width: 300, top: s.y - 44, height: 88, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 20, background: B.color.surface, boxShadow: `inset 0 0 0 ${reading ? 3 : 2}px rgba(${reading ? B.color.glowRgb : "247,239,230"},${reading ? 0.7 : 0.12})`,
            opacity: k, transform: `scale(${(0.9 + 0.1 * k).toFixed(3)})`, fontFamily: INTER, fontWeight: 600, fontSize: 34, color: B.color.ink }}>{s.label}</div>
        );
      })}
      {/* the agents, each with a short trail */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {src.flatMap((_, s) => [...Array(PER)].map((__, k) => {
          const now = agentAt(s, k, f);
          if (!now) return null;
          const prev = agentAt(s, k, f - 2) ?? now;
          const ang = Math.atan2(now.y - prev.y, now.x - prev.x);
          const tip = { x: now.x + Math.cos(ang) * 12, y: now.y + Math.sin(ang) * 12 };
          const l = { x: now.x + Math.cos(ang + 2.5) * 10, y: now.y + Math.sin(ang + 2.5) * 10 };
          const r = { x: now.x + Math.cos(ang - 2.5) * 10, y: now.y + Math.sin(ang - 2.5) * 10 };
          return (
            <g key={`${s}-${k}`}>
              <line x1={prev.x} y1={prev.y} x2={now.x} y2={now.y} stroke={B.color.ink} strokeOpacity={0.25} strokeWidth={4} strokeLinecap="round" />
              <polygon points={`${tip.x},${tip.y} ${l.x},${l.y} ${r.x},${r.y}`} fill={B.color.ink} />
              {now.carry ? <circle cx={now.x - Math.cos(ang) * 10} cy={now.y - Math.sin(ang) * 10} r={5} fill={RED} /> : null}
            </g>
          );
        }))}
      </svg>
      {/* the question, and the answer gathering under it */}
      <div style={{ position: "absolute", left: 80, right: 80, top: c.y - 120, textAlign: "center", fontFamily: ZODIAK, fontWeight: 700, fontSize: 56, lineHeight: 1.1, color: B.color.ink,
        opacity: qK, transform: `translateY(${(1 - qK) * 12}px)` }}>"{p.question}"</div>
      <div style={{ position: "absolute", left: 80, right: 80, top: c.y + 70, textAlign: "center", fontFamily: ZODIAK, fontWeight: 700, fontSize: 48, lineHeight: 1.12, color: RED,
        opacity: aK, transform: `scale(${(0.96 + 0.04 * aK).toFixed(3)})` }}>{p.answer}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.8, textAlign: "center", fontFamily: INTER, fontSize: 32, color: B.color.ink, opacity: ramp(f, answerAt + 12, answerAt + 24) }}>{p.source}</div>
      <Cue at={START} name="air-woosh-quick" volume={0.45} />
      <Cue at={START + OUT} name="data-scan" volume={0.25} />
      <Cue at={back} name="swoosh-slow" volume={0.3} />
      <Cue at={answerAt} name="chime-crystal" volume={0.35} />
    </Clip>
  );
};
