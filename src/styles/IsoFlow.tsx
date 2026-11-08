/**
 * /iso-flow (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). How something moves, drawn as an isometric diagram: blocks rise out of the floor one by one, each with its
 * label floating above, channels draw between them along the iso grid, and small red packets run down the channels
 * into the block they feed, which lifts a little each time one lands. Every block and every arrow is a true step.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR, readHold } from "../system/motion";
import { B, Clip, Cue, INTER, RED, Title, ZODIAK, clamp, ramp } from "./common";

export type IsoFlowProps = {
  title: string;
  /** Blocks on an iso grid: x runs down-right, y runs down-left, both in cells. `big` makes the block the destination. */
  nodes: { id: string; label: string; sub?: string; x: number; y: number; big?: boolean }[];
  /** Channels between blocks, in order. */
  edges: { from: string; to: string }[];
  caption: string;
  source: string;
  cta?: string;
};

const FPS = 30;
const RISE = 12; // motion: frames per block rising
const STEP = 9;
const DRAW = 18; // motion: frames per channel drawing

export const isoPlan = (p: IsoFlowProps) => {
  const nodeAt = p.nodes.map((_, i) => 10 + i * STEP);
  const edgeAt = p.edges.map((_, i) => nodeAt[nodeAt.length - 1] + RISE + 6 + i * 10);
  const flowAt = edgeAt[edgeAt.length - 1] + DRAW;
  const capAt = flowAt + 30;
  const end = capAt + Math.round((readHold(`${p.caption} ${p.nodes.map((n) => n.label).join(" ")}`) * 0.6 + 0.6) * FPS);
  return { nodeAt, edgeAt, flowAt, capAt, end };
};
export const isoEnd = (p: IsoFlowProps) => isoPlan(p).end;

export const IsoFlow: React.FC<IsoFlowProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { nodeAt, edgeAt, flowAt, capAt, end } = isoPlan(p);
  const cell = width * 0.12;
  const ox = width / 2, oy = height * 0.36;
  // iso projection: 2:1 diamond
  const P = (x: number, y: number, z = 0) => ({ X: ox + (x - y) * cell, Y: oy + (x + y) * cell * 0.5 - z });
  const byId = Object.fromEntries(p.nodes.map((n) => [n.id, n]));
  const drift = 1 + ramp(f, 0, end, CURVE.quiet.standard) * 0.035;
  // a block's lift when a packet lands in it
  const lands = (id: string) => p.edges.filter((e) => e.to === id).flatMap((_, k) => [0, 1, 2].map((j) => flowAt + k * 9 + j * 26 + 22));
  const block = (n: IsoFlowProps["nodes"][number], i: number) => {
    const s = spring({ frame: f - nodeAt[i], fps, config: { damping: 14, stiffness: 140 } });
    const h = (n.big ? cell * 0.75 : cell * 0.42) * Math.min(1.05, s);
    const bump = lands(n.id).reduce((a, t) => a + Math.max(0, 1 - Math.abs(f - t) / 5) * 8, 0);
    const r = n.big ? 0.62 : 0.42; // half size in cells
    const c = [P(n.x - r, n.y - r, h + bump), P(n.x + r, n.y - r, h + bump), P(n.x + r, n.y + r, h + bump), P(n.x - r, n.y + r, h + bump)];
    const b = [P(n.x + r, n.y - r, bump), P(n.x + r, n.y + r, bump), P(n.x - r, n.y + r, bump)];
    const pt = (q: { X: number; Y: number }) => `${q.X.toFixed(1)},${q.Y.toFixed(1)}`;
    if (f < nodeAt[i]) return null;
    return (
      <g key={n.id}>
        <polygon points={[c[1], c[2], b[1], b[0]].map(pt).join(" ")} fill={n.big ? RED : B.color.inkSoft} opacity={n.big ? 0.8 : 0.55} />
        <polygon points={[c[2], c[3], b[2], b[1]].map(pt).join(" ")} fill={n.big ? RED : B.color.inkSoft} opacity={n.big ? 0.6 : 0.35} />
        <polygon points={c.map(pt).join(" ")} fill={n.big ? RED : B.color.ink} />
      </g>
    );
  };
  return (
    <Clip endAt={end} cta={p.cta}>
      <Title out={end}>{p.title}</Title>
      <AbsoluteFill style={{ transform: `scale(${drift.toFixed(4)})` }}>
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          {/* the floor grid */}
          {[...Array(9)].map((_, i) => {
            const k = ramp(f, i * 1.5, i * 1.5 + 16, CURVE.quiet.standard);
            const a = P(-2, i - 3.5), b2 = P(-2 + 6.5 * k, i - 3.5), c = P(i - 3.5, -2), d = P(i - 3.5, -2 + 6.5 * k);
            return <g key={i} stroke={B.color.ink} strokeOpacity={0.08} strokeWidth={2}><line x1={a.X} y1={a.Y} x2={b2.X} y2={b2.Y} /><line x1={c.X} y1={c.Y} x2={d.X} y2={d.Y} /></g>;
          })}
          {/* the channels, drawn along the grid: first along x, then along y */}
          {p.edges.map((e, i) => {
            const a = byId[e.from], b = byId[e.to];
            const m = P(b.x, a.y), s0 = P(a.x, a.y), s1 = P(b.x, b.y);
            const k = ramp(f, edgeAt[i], edgeAt[i] + DRAW, CURVE.quiet.standard);
            const path = `M${s0.X},${s0.Y} L${m.X},${m.Y} L${s1.X},${s1.Y}`;
            return <path key={i} d={path} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} stroke={B.color.ink} strokeOpacity={0.85} strokeWidth={9} fill="none" strokeLinecap="round" />;
          })}
          {/* packets */}
          {p.edges.flatMap((e, i) => [0, 1, 2].map((j) => {
            const a = byId[e.from], b = byId[e.to];
            const t0 = flowAt + i * 9 + j * 26;
            const t = interpolate(f, [t0, t0 + 22], [0, 1], { ...clamp, easing: CURVE.quiet.standard });
            if (f < t0 || f > t0 + 22) return null;
            const lx = Math.abs(b.x - a.x), ly = Math.abs(b.y - a.y);
            const d = t * (lx + ly);
            const q = d < lx ? P(a.x + Math.sign(b.x - a.x) * d, a.y, 10) : P(b.x, a.y + Math.sign(b.y - a.y) * (d - lx), 10);
            return <polygon key={`${i}-${j}`} points={`${q.X},${q.Y - 20} ${q.X + 32},${q.Y} ${q.X},${q.Y + 20} ${q.X - 32},${q.Y}`} fill={RED} stroke={B.color.ink} strokeWidth={3} />;
          }))}
          {/* blocks, back to front */}
          {p.nodes.map((n, i) => ({ n, i })).sort((u, v) => u.n.x + u.n.y - (v.n.x + v.n.y)).map(({ n, i }) => block(n, i))}
        </svg>
        {p.nodes.map((n, i) => {
          const q = P(n.x, n.y, (n.big ? cell * 0.75 : cell * 0.42) + 70);
          const k = ramp(f, nodeAt[i] + 6, nodeAt[i] + 6 + DUR.arrive, CURVE.quiet.enter);
          return (
            <div key={n.id} style={{ position: "absolute", left: q.X - 200, width: 400, top: q.Y - 90, textAlign: "center", opacity: k, transform: `translateY(${(1 - k) * 10}px)` }}>
              <div style={{ display: "inline-block", padding: "8px 18px", borderRadius: 14, background: "rgba(11,7,8,.78)" }}>
                <div style={{ fontFamily: ZODIAK, fontWeight: 700, fontSize: n.big ? 48 : 40, color: n.big ? B.color.ink : B.color.ink, lineHeight: 1.05 }}>{n.label}</div>
                {n.sub ? <div style={{ fontFamily: INTER, fontSize: 28, color: B.color.inkSoft, marginTop: 4 }}>{n.sub}</div> : null}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.72, fontFamily: ZODIAK, fontWeight: 700, fontSize: 60, lineHeight: 1.1, color: B.color.ink,
        opacity: ramp(f, capAt, capAt + DUR.arrive, CURVE.quiet.enter) }}>{p.caption}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.72 + 170, fontFamily: INTER, fontSize: 34, color: B.color.ink, opacity: ramp(f, capAt + 12, capAt + 24) }}>{p.source}</div>
      {p.nodes.map((_, i) => <Cue key={i} at={nodeAt[i]} name="paper-move-quick" volume={0.3} />)}
      <Cue at={flowAt} name="data-scan" volume={0.3} />
      <Cue at={capAt} name="chime-crystal" volume={0.3} />
    </Clip>
  );
};
