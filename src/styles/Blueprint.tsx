/**
 * /blueprint (2026-11-05, name from the Muse send "10 Claude animation styles", its prompts gated and unseen): a
 * plan drawn as an architect's elevation on blueprint paper. One floor per year, one room per term, each room
 * dimensioned in credits, and the camera rides up the building floor by floor while it draws, then pulls back to the
 * whole sheet: the overall dimension goes on in red pencil (the architect's redline, the one accent), and the title
 * block fills in with the notes and their sources.
 *
 * Real blueprints letter in a stencil or monospace hand. We never use monospace, so the lettering is the venture's own:
 * Zodiak for the title and the sheet name, Inter for room labels and dimensions, Caveat for the drafter's notes.
 */
import React from "react";
import { loadFont } from "@remotion/google-fonts/Caveat";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR } from "../system/motion";
import { readHold } from "../system/motion";
import { B, Clip, Cue, INTER, PAPER, RED, Title, ZODIAK, clamp, ramp } from "./common";

const { fontFamily: HAND } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export type BlueprintProps = {
  /** The line above the drawing while it draws. */
  title: string;
  /** Bottom floor first. Two rooms per floor, and the dimension written inside each room. */
  floors: { label: string; rooms: [string, string]; dim: string }[];
  /** Written beside the flag on the roof. */
  roof: string;
  /** The overall height dimension, up the right side. */
  height: string;
  /** The overall width dimension across the top, in red pencil. */
  total: string;
  /** The title block in the corner of the sheet. */
  block: { name: string; scale: string; notes: string[]; source: string };
  /** The closing line, naming CampusAI. Replaces the title once the sheet is whole. */
  payoff: string;
};

// The paper. brand.ts has no blue: a blueprint is blue by definition, so these two are the style's ground (like
// FlatCartoon's seat tan). Every line on it is the brand's ink, and the one redline is the brand's red.
const BLUE = "#174a86";
const BLUE_DEEP = "#0c2b55";
const LINE = B.color.ink;

// the sheet sits high: everything that reads stays above the bottom fifth, where a reel's caption and buttons go
const X0 = 170, X1 = 910, MID = 540, G = 1196, FH = 166;
const POLE = 770;
const top = (i: number) => G - (i + 1) * FH;
const FLOOR0 = 2;
const FLOOR_STEP = 38; // motion: one floor every 1.27 s, the camera's ride up has to keep reading pace with the drawing

export const blueprintPlan = (p: BlueprintProps) => {
  const n = p.floors.length;
  const S = (i: number) => FLOOR0 + i * FLOOR_STEP;
  const roofAt = S(n - 1) + 26;
  const pull = roofAt + 14;
  const sideAt = pull + 32;
  const redAt = sideAt + 22;
  const blockAt = redAt + 22;
  const payoffAt = blockAt + 46;
  const texts: [number, string][] = [
    [payoffAt + 12, p.payoff],
    ...p.block.notes.map((t, i) => [blockAt + 14 + (i + 2) * 8, t] as [number, string]),
    [blockAt + 14 + (p.block.notes.length + 2) * 8, p.block.source],
  ];
  const end = Math.max(...texts.map(([a, t]) => a + Math.ceil(readHold(t) * 30)));
  return { S, roofAt, pull, sideAt, redAt, blockAt, payoffAt, end };
};
export const blueprintEnd = (p: BlueprintProps) => blueprintPlan(p).end;

/** A drafted line, drawn on with stroke-dashoffset. */
const Ink: React.FC<{ d: string; at: number; dur?: number; w?: number; color?: string }> = ({ d, at, dur = 14, w = 5, color = LINE }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = ramp(f, at, at + dur, CURVE.quiet.standard);
  return <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="square" strokeLinejoin="miter" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />;
};

/** A horizontal or vertical dimension: extension ticks, the line, slash ticks at both ends, and its label on a knockout. */
const Dim: React.FC<{ a: [number, number]; b: [number, number]; at: number; label: string; color?: string; size?: number; tag?: boolean }> = ({ a, b, at, label, color = LINE, size = 30, tag }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = ramp(f, at, at + 14, CURVE.quiet.standard);
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const vertical = a[0] === b[0];
  // the line grows out from the middle both ways, the way a dimension is pulled
  const p1 = [mx + (a[0] - mx) * k, my + (a[1] - my) * k], p2 = [mx + (b[0] - mx) * k, my + (b[1] - my) * k];
  const tick = (x: number, y: number) => `M${x - 10} ${y + 10} L${x + 10} ${y - 10}`;
  const ext = (x: number, y: number) => (vertical ? `M${x - 16} ${y} L${x + 16} ${y}` : `M${x} ${y - 16} L${x} ${y + 16}`);
  const lk = ramp(f, at + 10, at + 10 + DUR.arrive, CURVE.quiet.enter);
  const tw = label.length * size * 0.56 + 28;
  const th = size + 16;
  return (
    <g>
      <path d={`M${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]}`} stroke={color} strokeWidth={tag ? 5 : 2.4} fill="none" />
      <g opacity={ramp(f, at + 10, at + 14)}>
        <path d={`${ext(a[0], a[1])} ${ext(b[0], b[1])}`} stroke={color} strokeWidth={tag ? 4 : 2} />
        <path d={`${tick(a[0], a[1])} ${tick(b[0], b[1])}`} stroke={color} strokeWidth={tag ? 6 : 3.4} strokeLinecap="round" />
      </g>
      <g opacity={lk} transform={`translate(${mx} ${my}) ${vertical ? "rotate(-90)" : ""} scale(${(0.9 + 0.1 * lk).toFixed(3)})`}>
        <rect x={-tw / 2} y={-th / 2} width={tw} height={th} rx={tag ? th / 2 : 4} fill={tag ? PAPER : BLUE} />
        <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={INTER} fontWeight={tag ? 700 : 500} fontSize={size} fill={tag ? RED : color} letterSpacing="-0.01em">{label}</text>
      </g>
    </g>
  );
};

/** Handwritten note, wiped on left to right. */
const Note: React.FC<{ x: number; y: number; at: number; size?: number; anchor?: "start" | "middle" | "end"; children: string }> = ({ x, y, at, size = 50, anchor = "start", children }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = ramp(f, at, at + Math.max(8, children.length * 1.1), CURVE.quiet.standard);
  const w = children.length * size * 0.5 + 20;
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  const id = `bp-note-${children.replace(/[^\w]/g, "")}`;
  return (
    <>
      <clipPath id={id}><rect x={x0 - 10} y={y - size * 1.2} width={(w + 20) * k} height={size * 1.8} /></clipPath>
      <text x={x} y={y} textAnchor={anchor} fontFamily={HAND} fontWeight={700} fontSize={size} fill={LINE} clipPath={`url(#${id})`}>{children}</text>
    </>
  );
};

const Fade: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const f = useCurrentFrame();
  return <g opacity={ramp(f, at, at + 8, CURVE.quiet.enter)}>{children}</g>;
};

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h} Z`;

export const Blueprint: React.FC<BlueprintProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const n = p.floors.length;
  const plan = blueprintPlan(p);
  const { S, roofAt, pull, sideAt, redAt, blockAt, payoffAt, end } = plan;
  const roofY = top(n - 1);

  // The camera rides up the building as each floor draws, then pulls back to the whole sheet.
  const times = [0, ...p.floors.slice(1).map((_, i) => S(i + 1) + 6), pull, pull + DUR.reveal];
  const ys = [...p.floors.map((_, i) => top(i) + FH / 2 - 10), roofY + 40, 960];
  const ss = [...p.floors.map((_, i) => 1.08 - i * 0.01), 1.05, 1];
  const seg = Math.max(0, times.findIndex((t, i) => i > 0 && f < t) - 1);
  const i0 = seg < 0 ? times.length - 2 : seg;
  const t0 = times[i0], t1 = times[Math.min(i0 + 1, times.length - 1)];
  const kk = f >= times[times.length - 1] ? 1 : CURVE.quiet.standard(Math.min(1, Math.max(0, (f - t0) / Math.max(1, t1 - t0))));
  const done = f >= times[times.length - 1];
  const cy = done ? ys[ys.length - 1] : ys[i0] + (ys[Math.min(i0 + 1, ys.length - 1)] - ys[i0]) * kk;
  const sc = done ? ss[ss.length - 1] : ss[i0] + (ss[Math.min(i0 + 1, ss.length - 1)] - ss[i0]) * kk;
  const drift = interpolate(f, [pull + DUR.reveal, end], [1, 1.025], clamp);
  const cam = `translate(${W / 2}px, ${H / 2}px) scale(${(sc * drift).toFixed(4)}) translate(${-W / 2}px, ${-cy}px)`;

  return (
    <Clip endAt={end} ground={BLUE_DEEP}>
      <AbsoluteFill style={{ transform: cam, transformOrigin: "0 0" }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <pattern id="bp-minor" width={30} height={30} patternUnits="userSpaceOnUse"><path d="M30 0 L0 0 L0 30" fill="none" stroke={LINE} strokeWidth={1} opacity={0.1} /></pattern>
            <pattern id="bp-major" width={150} height={150} patternUnits="userSpaceOnUse"><path d="M150 0 L0 0 L0 150" fill="none" stroke={LINE} strokeWidth={1.6} opacity={0.17} /></pattern>
            <radialGradient id="bp-paper" cx="50%" cy="45%" r="70%"><stop offset="0" stopColor={BLUE} /><stop offset="1" stopColor={BLUE_DEEP} /></radialGradient>
            <filter id="bp-grain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={9} />
              <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.14 0 0 0 -0.03" />
            </filter>
            <filter id="bp-mottle" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.003" numOctaves={3} seed={4} />
              <feColorMatrix type="matrix" values="0 0 0 0 0.02  0 0 0 0 0.08  0 0 0 0 0.2  0.9 0 0 0 -0.35" />
            </filter>
            {/* blueprint lines bleed a little into the paper */}
            <filter id="bp-bleed" x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={2.2} result="b" />
              <feComponentTransfer in="b" result="soft"><feFuncA type="linear" slope={0.45} /></feComponentTransfer>
              <feMerge><feMergeNode in="soft" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <pattern id="bp-hatch" width={18} height={18} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 L0 18" stroke={LINE} strokeWidth={2} opacity={0.6} /></pattern>
          </defs>
          {/* the sheet, larger than the frame so the pull back never shows an edge */}
          <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="url(#bp-paper)" />
          <rect x={-300} y={-300} width={W + 600} height={H + 600} filter="url(#bp-mottle)" />
          <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="url(#bp-minor)" />
          <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="url(#bp-major)" />
          {/* the sheet was folded: one crease each way */}
          <path d={`M-300 ${H * 0.52} L${W + 300} ${H * 0.52}`} stroke={LINE} strokeWidth={3} opacity={0.06} />
          <path d={`M${W * 0.5} -300 L${W * 0.5} ${H + 300}`} stroke={LINE} strokeWidth={3} opacity={0.05} />
          <rect x={-300} y={-300} width={W + 600} height={H + 600} filter="url(#bp-grain)" />

          <g filter="url(#bp-bleed)">
            {/* ground line and earth hatching: the first stroke, from frame 0 */}
            <Ink d={`M${X0 - 90} ${G} L${X1 + 90} ${G}`} at={0} dur={12} w={6} />
            <g opacity={ramp(f, 4, 16)}><rect x={X0 - 90} y={G + 3} width={X1 - X0 + 180} height={34} fill="url(#bp-hatch)" /></g>

            {p.floors.map((fl, i) => {
              const s = S(i), y = top(i);
              const rooms = [X0, MID];
              return (
                <g key={i}>
                  <Ink d={`M${X0} ${y + FH} L${X0} ${y} L${X1} ${y} L${X1} ${y + FH}`} at={s} dur={16} w={6} />
                  <Ink d={`M${X0 - 24} ${y} L${X1 + 24} ${y}`} at={s} dur={8} w={1.4} />
                  <Ink d={`M${MID} ${y} L${MID} ${y + FH}`} at={s + 8} dur={10} w={4} />
                  {rooms.map((rx, r) => (
                    <g key={r}>
                      {[rx + 74, rx + 236].map((wx, j) => (
                        <Ink key={j} dur={6} d={`${rect(wx, y + 54, 64, 54)} M${wx + 32} ${y + 54} L${wx + 32} ${y + 108} M${wx} ${y + 81} L${wx + 64} ${y + 81}`} at={s + 12 + r * 3 + j * 2} w={2.4} />
                      ))}
                      <Fade at={s + 18 + r * 3}>
                        <text x={rx + 22} y={y + 42} fontFamily={INTER} fontWeight={600} fontSize={32} fill={LINE} letterSpacing="-0.01em">{fl.rooms[r]}</text>
                      </Fade>
                      <Dim a={[rx + 22, y + FH - 28]} b={[rx + 348, y + FH - 28]} at={s + 22 + r * 3} label={fl.dim} size={34} />
                    </g>
                  ))}
                  <g transform={`translate(${X0 - 30} ${y + FH / 2}) rotate(-90)`}>
                    <Note x={0} y={0} at={s + 16} size={48} anchor="middle">{fl.label}</Note>
                  </g>
                </g>
              );
            })}

            {/* roof: parapet, flag pole, flag */}
            <Ink d={`M${X0 - 14} ${roofY} L${X0 - 14} ${roofY - 26} L${X1 + 14} ${roofY - 26} L${X1 + 14} ${roofY}`} at={roofAt - 10} dur={12} w={5} />
            <Ink d={`M${POLE} ${roofY - 26} L${POLE} ${roofY - 134}`} at={roofAt} dur={10} w={4} />
            <Ink d={`M${POLE} ${roofY - 134} L${POLE + 92} ${roofY - 112} L${POLE} ${roofY - 90}`} at={roofAt + 8} dur={10} w={4} />
            <Note x={POLE - 24} y={roofY - 62} at={roofAt + 14} size={50} anchor="end">{p.roof}</Note>

            {/* overall dimensions once the whole sheet is in view */}
            <Dim a={[X1 + 74, G]} b={[X1 + 74, roofY]} at={sideAt} label={p.height} size={34} />
          </g>
          <Dim a={[X0, roofY - 182]} b={[X1, roofY - 182]} at={redAt} label={p.total} color={RED} size={40} tag />

          {/* the title block: name and scale, then the notes, then the sources, all above the bottom fifth */}
          <g filter="url(#bp-bleed)">
            <Ink d={rect(60, 1280, W - 120, 306)} at={blockAt} dur={18} w={4} />
            <Ink d={`M60 1368 L${W - 60} 1368 M60 1530 L${W - 60} 1530`} at={blockAt + 8} dur={12} w={2.4} />
            <Fade at={blockAt + 10}>
              <text x={88} y={1344} fontFamily={ZODIAK} fontWeight={700} fontSize={54} fill={LINE} letterSpacing="-0.02em">{p.block.name}</text>
              <text x={W - 88} y={1340} textAnchor="end" fontFamily={INTER} fontWeight={500} fontSize={30} fill={LINE} opacity={0.9}>{p.block.scale}</text>
            </Fade>
            {p.block.notes.map((t, i) => (
              <Fade key={i} at={blockAt + 14 + (i + 2) * 8}>
                <text x={88} y={1414 + i * 48} fontFamily={INTER} fontWeight={500} fontSize={34} fill={LINE} letterSpacing="-0.01em">{`${i + 1}. ${t}`}</text>
              </Fade>
            ))}
            <Fade at={blockAt + 14 + (p.block.notes.length + 2) * 8}>
              <text x={88} y={1570} fontFamily={INTER} fontWeight={500} fontSize={28} fill={LINE} opacity={0.88}>{p.block.source}</text>
            </Fade>
          </g>
        </svg>
      </AbsoluteFill>
      {/* a soft fall of paper behind the title and the held logo, so the drawing never fights them */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${BLUE_DEEP} 0%, ${BLUE_DEEP}d9 14%, ${BLUE_DEEP}00 26%)`, opacity: 1 - ramp(f, pull, pull + DUR.reveal) * 0.6 }} />
      <Title out={payoffAt}>{p.title}</Title>
      <Title at={payoffAt + 2} out={end + 30} size={56}>{p.payoff}</Title>
      <Cue at={0} name="marker-pen-line" volume={0.4} />
      {p.floors.map((_, i) => <Cue key={i} at={S(i)} name="marker-pen-line" volume={0.3} />)}
      <Cue at={pull} name="swoosh-slow" volume={0.35} />
      <Cue at={redAt} name="marker-pen-line" volume={0.5} />
      <Cue at={blockAt} name="paper-slide" volume={0.35} />
      <Cue at={payoffAt} name="transition-soft" volume={0.4} />
    </Clip>
  );
};
