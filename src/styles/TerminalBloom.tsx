/**
 * /terminal-bloom (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). A command line, then a bloom: a prompt types a question at a blinking caret, Return is pressed, and the
 * answers burst out of the caret as cards that open like petals around it, settling into a ring. A terminal is
 * normally a monospace face, which is banned, so this one is drawn in our type: the prompt and caret in Inter, the
 * answers on cards. It reads as a command line by its shape (prompt mark, caret, Return), never by a fake window.
 */
import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR, readHold } from "../system/motion";
import { B, Clip, Cue, INTER, RED, Title, ZODIAK, ramp } from "./common";

export type TerminalBloomProps = {
  title: string;
  /** What is typed at the prompt. */
  command: string;
  /** The answers that bloom out, 3 to 6. `accent` cards get the red edge. */
  results: { label: string; sub: string; accent?: boolean }[];
  caption: string;
  source: string;
  cta?: string;
};

const FPS = 30;
const TYPE_AT = 10;
const PER_CHAR = 1.4; // motion: frames per typed character, a quick typist
export const bloomPlan = (p: TerminalBloomProps) => {
  const typed = TYPE_AT + Math.round(p.command.length * PER_CHAR);
  const enter = typed + 8;
  const bloomed = enter + 10 + p.results.length * 4 + 16;
  const capAt = bloomed + 4;
  const end = capAt + Math.round((readHold(`${p.caption} ${p.results.map((r) => `${r.label} ${r.sub}`).join(" ")}`) * 0.6 + 0.6) * FPS);
  return { typed, enter, capAt, end };
};
export const bloomEnd = (p: TerminalBloomProps) => bloomPlan(p).end;

export const TerminalBloom: React.FC<TerminalBloomProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { enter, capAt, end } = bloomPlan(p);
  const shown = Math.max(0, Math.min(p.command.length, Math.floor((f - TYPE_AT) / PER_CHAR)));
  const caretOn = f < enter + 4 ? Math.floor(f / 8) % 2 === 0 || (f >= TYPE_AT && f < enter) : false;
  const promptY = height * 0.27;
  const centre = { x: width / 2, y: height * 0.55 };
  const R = width * 0.33;
  const press = ramp(f, enter, enter + 3) * (1 - ramp(f, enter + 3, enter + 10));
  const ring = ramp(f, enter, enter + 20, CURVE.quiet.exit);
  return (
    <Clip endAt={end} cta={p.cta}>
      <Title out={end}>{p.title}</Title>
      {/* the prompt line */}
      <div style={{ position: "absolute", left: 64, right: 64, top: promptY, display: "flex", alignItems: "center", gap: 18, fontFamily: INTER, fontWeight: 600, fontSize: 46,
        color: B.color.ink, transform: `translateY(${(-press * 4).toFixed(1)}px)` }}>
        <span style={{ color: RED, fontWeight: 700 }}>›</span>
        <span>{p.command.slice(0, shown)}<span style={{ display: "inline-block", width: 24, height: 50, marginLeft: 4, verticalAlign: "-8px", background: B.color.ink, opacity: caretOn ? 0.9 : 0 }} /></span>
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, top: promptY + 64, height: 2, background: B.color.ink, opacity: 0.12 }} />
      {/* the burst ring from the press */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {f >= enter ? <circle cx={centre.x} cy={centre.y} r={20 + ring * R * 1.3} fill="none" stroke={RED} strokeWidth={4 * (1 - ring)} opacity={1 - ring} /> : null}
        {p.results.map((_, i) => {
          const a = -Math.PI / 2 + (i / p.results.length) * Math.PI * 2;
          const s = spring({ frame: f - enter - 6 - i * 4, fps, config: { damping: 13, stiffness: 120 } });
          return <line key={i} x1={centre.x} y1={centre.y} x2={centre.x + Math.cos(a) * R * Math.min(1, s) * 0.8} y2={centre.y + Math.sin(a) * R * Math.min(1, s) * 0.8}
            stroke={B.color.ink} strokeOpacity={0.14} strokeWidth={3} />;
        })}
        <circle cx={centre.x} cy={centre.y} r={14 * ramp(f, enter, enter + 8, CURVE.showy.enter)} fill={RED} />
      </svg>
      {p.results.map((r, i) => {
        const a = -Math.PI / 2 + (i / p.results.length) * Math.PI * 2;
        const s = spring({ frame: f - enter - 6 - i * 4, fps, config: { damping: 13, stiffness: 120 } });
        if (f < enter + 6 + i * 4) return null;
        const x = centre.x + Math.cos(a) * R * s, y = centre.y + Math.sin(a) * R * s;
        return (
          <div key={i} style={{ position: "absolute", left: x - 140, top: y - 62, width: 280, height: 124, borderRadius: 26, background: B.color.surface, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", transform: `scale(${(0.3 + 0.7 * Math.min(1.05, s)).toFixed(3)}) rotate(${((1 - Math.min(1, s)) * (i % 2 ? 18 : -18)).toFixed(1)}deg)`,
            boxShadow: `inset 0 0 0 ${r.accent ? 4 : 2}px ${r.accent ? RED : "rgba(247,239,230,.14)"}, 0 16px 40px rgba(0,0,0,.5)` }}>
            <div style={{ fontFamily: ZODIAK, fontWeight: 700, fontSize: 44, color: B.color.ink, lineHeight: 1 }}>{r.label}</div>
            <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 28, color: r.accent ? RED : B.color.inkSoft, marginTop: 8 }}>{r.sub}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.78, fontFamily: ZODIAK, fontWeight: 700, fontSize: 56, lineHeight: 1.1, color: B.color.ink,
        opacity: ramp(f, capAt, capAt + DUR.arrive, CURVE.quiet.enter) }}>{p.caption}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.78 + 150, fontFamily: INTER, fontSize: 32, color: B.color.ink, opacity: ramp(f, capAt + 12, capAt + 24) }}>{p.source}</div>
      {[...Array(Math.ceil(p.command.length / 3))].map((_, i) => <Cue key={i} at={TYPE_AT + Math.round(i * 3 * PER_CHAR)} name="typewriter-hit-soft" volume={0.18} />)}
      <Cue at={enter} name="switch-tap" volume={0.55} />
      <Cue at={enter + 4} name="air-woosh-quick" volume={0.4} />
    </Clip>
  );
};
