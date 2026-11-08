/**
 * /chalkboard (2026-11-05, name from the Muse send "10 Claude animation styles", its prompts gated and unseen): one
 * academic idea worked out at the board, the way a professor would. A formula, two cases side by side, one note, then
 * the line that names CampusAI. Everything writes itself on in chalk: text is wiped on behind a chalk tip, lines are
 * drawn with stroke-dashoffset, and every stroke sheds a little dust. Chalk white plus ONE red chalk mark, the circle
 * around the case that is the point.
 *
 * The chalk look is one SVG filter: fine noise punched out of each stroke (dry chalk never covers fully), a soft halo
 * under it (dust on the board), and a slight wobble whose noise reseeds every 4 frames. The board is two noises: wide
 * eraser smears and a fine grain.
 */
import React from "react";
import { loadFont } from "@remotion/google-fonts/Caveat";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE } from "../system/motion";
import { readHold } from "../system/motion";
import { B, Clip, Cue, INTER, RED, ZODIAK, clamp } from "./common";

const { fontFamily: HAND } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export type ChalkboardProps = {
  /** The idea, in a few words. Zodiak, written in chalk. */
  title: string;
  /** One handwritten line under it. */
  sub: string;
  /** The formula: left side, then a fraction. */
  formula: { left: string; top: string; bottom: string };
  /** The two cases, side by side. `big` is one or two characters, written large. The right one gets the red circle. */
  left: { big: string; lines: string[] };
  right: { big: string; lines: string[] };
  /** The left case's arrow runs up into the bottom of the fraction (it counts there). */
  arrow?: boolean;
  /** A handwritten note under the cases, one entry per line. */
  note: string[];
  /** The closing lines, Zodiak, naming CampusAI. */
  payoff: string[];
  source: string;
};

// The board itself. brand.ts has no green: a chalkboard is green-black by definition, so these two are the style's
// ground (like FlatCartoon's seat tan). Every mark on the board is the brand's ink and its one red.
const SLATE = "#1d2924";
const SLATE_EDGE = "#0e1412";
const CHALK = B.color.ink;

const W_CHAR = 1.05; // motion: frames per written character, quick hand-lettering pace
const GAP = 3;
const BREAK = 9;

type Item = { key: string; at: number; end: number; text?: string };

/** The writing order, worked out from the words, so a longer subject simply takes longer. */
export const chalkPlan = (p: ChalkboardProps) => {
  const items: Item[] = [];
  let t = 0;
  const write = (key: string, text: string, gap = GAP, min = 8) => {
    const at = t + (items.length ? gap : 0);
    const end = at + Math.max(min, Math.round(text.length * W_CHAR));
    items.push({ key, at, end, text });
    t = end;
  };
  const stroke = (key: string, dur: number, gap = GAP) => {
    const at = t + gap;
    items.push({ key, at, end: at + dur });
    t = at + dur;
  };
  write("title", p.title, 0, 12);
  write("sub", p.sub);
  write("fl", p.formula.left, BREAK);
  write("ft", p.formula.top);
  stroke("bar", 8);
  write("fb", p.formula.bottom);
  stroke("divider", 10, BREAK);
  write("lb", p.left.big, GAP, 9);
  p.left.lines.forEach((l, i) => write(`l${i}`, l));
  if (p.arrow) stroke("arrow", 14);
  write("rb", p.right.big, BREAK, 9);
  p.right.lines.forEach((l, i) => write(`r${i}`, l));
  stroke("circle", 18);
  stroke("underline", 8);
  p.note.forEach((l, i) => write(`n${i}`, l, i ? GAP : BREAK));
  p.payoff.forEach((l, i) => write(`p${i}`, l, i ? GAP : BREAK));
  stroke("source", 12, 4);
  const at = Object.fromEntries(items.map((x) => [x.key, x]));
  // every line holds its reading time once written, before the board shrinks into the logo
  const end = Math.max(t + 20, ...items.filter((x) => x.text).map((x) => x.end + Math.ceil(readHold(x.text!) * 30)));
  return { at, end };
};
export const chalkEnd = (p: ChalkboardProps) => chalkPlan(p).end;

const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const prog = (f: number, it?: Item) => (it ? interpolate(f, [it.at, it.end], [0, 1], { ...clamp, easing: CURVE.quiet.standard }) : 0);

/** A stick of chalk at the writing point, only while it writes. */
const Stick: React.FC<{ x: number | string; y: number | string; show: number }> = ({ x, y, show }) =>
  show <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity: show }}>
      <div style={{ position: "absolute", left: -2, top: -66, width: 20, height: 70, borderRadius: "6px 6px 9px 9px", transform: "rotate(28deg)", transformOrigin: "50% 100%",
        background: `linear-gradient(90deg, ${CHALK} 0%, ${CHALK} 55%, rgba(0,0,0,0.18) 100%), ${CHALK}`, boxShadow: "4px 6px 10px rgba(0,0,0,0.45)" }} />
    </div>
  );

/** Dust shed while something is written: falls, drifts, fades. `e` is where along the stroke it left (0 to 1). */
const dustFor = (seed: number, it: Item, f: number) => {
  const out: { e: number; dx: number; dy: number; r: number; o: number }[] = [];
  const n = Math.round((it.end - it.at) * 0.9);
  for (let j = 0; j < n; j++) {
    const born = it.at + j / 0.9;
    const age = f - born;
    if (age < 0 || age > 18) continue;
    const r1 = rnd(seed * 97 + j), r2 = rnd(seed * 53 + j * 7), r3 = rnd(seed * 31 + j * 13);
    out.push({
      e: Math.min(1, j / n),
      dx: (r1 - 0.5) * 2.2 * age,
      dy: (1.5 + r2 * 2.5) * age + 0.18 * age * age,
      r: 1.2 + r3 * 2.4,
      o: 0.45 * (1 - age / 18),
    });
  }
  return out;
};

/** A line of chalk writing, wiped on left to right behind the stick. */
const Chalk: React.FC<{ it?: Item; seed: number; style: React.CSSProperties; children: string }> = ({ it, seed, style, children }) => {
  const f = useCurrentFrame();
  if (!it || f < it.at) return null;
  const p = prog(f, it);
  const writing = f <= it.end + 2 ? 1 - interpolate(f, [it.end, it.end + 4], [0, 1], clamp) : 0;
  return (
    <span style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-block", clipPath: `inset(-30% ${((1 - p) * 110 - 10).toFixed(2)}% -30% -8%)`, filter: "url(#chalk)", color: CHALK, ...style }}>{children}</span>
      {dustFor(seed, it, f).map((d, i) => (
        <span key={i} style={{ position: "absolute", left: `${(d.e * 100).toFixed(2)}%`, top: "72%", width: d.r * 2, height: d.r * 2, borderRadius: "50%",
          background: CHALK, opacity: d.o, transform: `translate(${d.dx.toFixed(1)}px, ${d.dy.toFixed(1)}px)` }} />
      ))}
      <Stick x={`${(p * 100).toFixed(2)}%`} y="62%" show={writing} />
    </span>
  );
};

type Pt = [number, number];
const lenOf = (pts: Pt[]) => {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return acc;
};
const at = (pts: Pt[], acc: number[], p: number): Pt => {
  const L = acc[acc.length - 1] * p;
  let i = 1;
  while (i < acc.length - 1 && acc[i] < L) i++;
  const k = (L - acc[i - 1]) / Math.max(0.001, acc[i] - acc[i - 1]);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
};

/** A drawn chalk line through points, revealed with stroke-dashoffset, with its stick and dust. */
const Stroke: React.FC<{ pts: Pt[]; it?: Item; seed: number; color?: string; width?: number; head?: boolean }> = ({ pts, it, seed, color = CHALK, width = 7, head }) => {
  const f = useCurrentFrame();
  if (!it || f < it.at) return null;
  const p = prog(f, it);
  const acc = lenOf(pts);
  const d = pts.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ");
  const tip = at(pts, acc, p);
  const writing = f <= it.end + 2 ? 1 - interpolate(f, [it.end, it.end + 4], [0, 1], clamp) : 0;
  const last = pts[pts.length - 1], prev = pts[pts.length - 4] ?? pts[0];
  const ang = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
  const hk = interpolate(f, [it.end, it.end + 6], [0, 1], clamp);
  return (
    <>
      <g filter="url(#chalk)">
        <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
        {head && hk > 0 ? (
          <path d={`M${last[0] + Math.cos(ang + 2.6) * 38 * hk} ${last[1] + Math.sin(ang + 2.6) * 38 * hk} L${last[0]} ${last[1]} L${last[0] + Math.cos(ang - 2.6) * 38 * hk} ${last[1] + Math.sin(ang - 2.6) * 38 * hk}`}
            fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
      </g>
      {dustFor(seed, it, f).map((q, i) => {
        const o = at(pts, acc, q.e);
        return <circle key={i} cx={o[0] + q.dx} cy={o[1] + 6 + q.dy} r={q.r} fill={CHALK} opacity={q.o} />;
      })}
      {writing > 0 ? (
        <foreignObject x={tip[0]} y={tip[1]} width={1} height={1} style={{ overflow: "visible" }}>
          <Stick x={0} y={0} show={writing} />
        </foreignObject>
      ) : null}
    </>
  );
};

const ellipse = (cx: number, cy: number, rx: number, ry: number, turns: number, start: number): Pt[] =>
  Array.from({ length: 90 }, (_, i) => {
    const a = start + (i / 89) * Math.PI * 2 * turns;
    const wob = 1 + 0.025 * Math.sin(i * 0.11 + 1) + (i / 89) * 0.07;
    return [cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob];
  });
const curve = (a: Pt, c: Pt, b: Pt): Pt[] =>
  Array.from({ length: 40 }, (_, i) => {
    const t = i / 39;
    return [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
  });
const wobbly = (a: Pt, b: Pt, amp = 3): Pt[] =>
  Array.from({ length: 24 }, (_, i) => {
    const t = i / 23;
    return [a[0] + (b[0] - a[0]) * t + Math.sin(t * 9) * amp * (b[1] === a[1] ? 0 : 1), a[1] + (b[1] - a[1]) * t + Math.sin(t * 7) * amp * (b[1] === a[1] ? 1 : 0)];
  });

const Board: React.FC<{ f: number; W: number; H: number }> = ({ f, W, H }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <filter id="chalk" x="-15%" y="-30%" width="130%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} result="g" />
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -2.6 0 0 0 2.05" result="holes" />
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={Math.floor(f / 4) % 6} result="w" />
        <feDisplacementMap in="SourceGraphic" in2="w" scale={3} xChannelSelector="R" yChannelSelector="G" result="shaky" />
        <feComposite in="shaky" in2="holes" operator="in" result="dry" />
        <feGaussianBlur in="shaky" stdDeviation={3} result="halo" />
        <feComponentTransfer in="halo" result="soft"><feFuncA type="linear" slope={0.16} /></feComponentTransfer>
        <feMerge><feMergeNode in="soft" /><feMergeNode in="dry" /></feMerge>
      </filter>
      <filter id="smear" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0024 0.0034" numOctaves={4} seed={8} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.93  0 0 0 0 0.96  0 0 0 0 0.93  0.7 0 0 0 -0.3" />
      </filter>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves={2} seed={5} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.9  0 0 0 0 0.95  0 0 0 0 0.9  0.22 0 0 0 -0.05" />
      </filter>
      <filter id="erase"><feGaussianBlur stdDeviation={10} /></filter>
      <radialGradient id="board" cx="50%" cy="42%" r="75%">
        <stop offset="0" stopColor={SLATE} />
        <stop offset="1" stopColor={SLATE_EDGE} />
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#board)" />
    <rect width={W} height={H} filter="url(#smear)" opacity={0.4} />
    {/* old lessons wiped with an eraser: broad faint swipes, never legible */}
    <g filter="url(#erase)" opacity={0.07} stroke={CHALK} fill="none" strokeWidth={70} strokeLinecap="round">
      <path d={`M${W * 0.05} ${H * 0.22} C ${W * 0.3} ${H * 0.3}, ${W * 0.45} ${H * 0.18}, ${W * 0.7} ${H * 0.27}`} />
      <path d={`M${W * 0.62} ${H * 0.46} C ${W * 0.8} ${H * 0.4}, ${W * 0.9} ${H * 0.55}, ${W * 1.02} ${H * 0.5}`} />
      <path d={`M${W * -0.02} ${H * 0.7} C ${W * 0.2} ${H * 0.62}, ${W * 0.35} ${H * 0.8}, ${W * 0.55} ${H * 0.74}`} />
      <path d={`M${W * 0.5} ${H * 0.9} C ${W * 0.7} ${H * 0.86}, ${W * 0.8} ${H * 0.95}, ${W * 1.02} ${H * 0.88}`} />
    </g>
    <rect width={W} height={H} filter="url(#grain)" />
  </svg>
);

export const Chalkboard: React.FC<ChalkboardProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const { at: A, end } = chalkPlan(p);
  const push = interpolate(f, [0, end], [1.0, 1.035], clamp);
  const hand = (size: number): React.CSSProperties => ({ fontFamily: HAND, fontWeight: 700, fontSize: size, lineHeight: 1.05 });
  const title: React.CSSProperties = { fontFamily: ZODIAK, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.06 };
  const row = (top: number, left: number, width: number, align: "left" | "center" = "left"): React.CSSProperties => ({ position: "absolute", top, left, width, textAlign: align });
  const COL_L = { x: 60, w: 450 }, COL_R = { x: 570, w: 450 };
  const sourceK = interpolate(f, [A.source.at, A.source.end], [0, 0.6], clamp);
  return (
    <Clip endAt={end} ground={SLATE_EDGE}>
      <Board f={f} W={W} H={H} />
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})`, transformOrigin: "50% 45%" }}>
        <div style={row(208, 64, W - 128)}><Chalk it={A.title} seed={1} style={{ ...title, fontSize: 112 }}>{p.title}</Chalk></div>
        <div style={row(340, 70, W - 140)}><Chalk it={A.sub} seed={2} style={hand(58)}>{p.sub}</Chalk></div>
        <div style={row(572, 70, 300)}><Chalk it={A.fl} seed={3} style={hand(96)}>{p.formula.left}</Chalk></div>
        <div style={row(520, 330, 700, "center")}><Chalk it={A.ft} seed={4} style={hand(76)}>{p.formula.top}</Chalk></div>
        <div style={row(640, 330, 700, "center")}><Chalk it={A.fb} seed={5} style={hand(76)}>{p.formula.bottom}</Chalk></div>
        <div style={row(800, COL_L.x, COL_L.w, "center")}><Chalk it={A.lb} seed={6} style={hand(220)}>{p.left.big}</Chalk></div>
        {p.left.lines.map((l, i) => (
          <div key={i} style={row(1040 + i * 60, COL_L.x, COL_L.w, "center")}><Chalk it={A[`l${i}`]} seed={7 + i} style={hand(52)}>{l}</Chalk></div>
        ))}
        <div style={row(800, COL_R.x, COL_R.w, "center")}><Chalk it={A.rb} seed={12} style={hand(220)}>{p.right.big}</Chalk></div>
        {p.right.lines.map((l, i) => (
          <div key={i} style={row(1040 + i * 60, COL_R.x, COL_R.w, "center")}><Chalk it={A[`r${i}`]} seed={13 + i} style={hand(52)}>{l}</Chalk></div>
        ))}
        {p.note.map((l, i) => (
          <div key={i} style={row(1182 + i * 56, 70, W - 140)}><Chalk it={A[`n${i}`]} seed={20 + i} style={hand(50)}>{l}</Chalk></div>
        ))}
        {p.payoff.map((l, i) => (
          <div key={i} style={row(1306 + i * 88, 64, W - 128)}><Chalk it={A[`p${i}`]} seed={30 + i} style={{ ...title, fontSize: 82 }}>{l}</Chalk></div>
        ))}
        <div style={{ ...row(1500, 66, W - 132), fontFamily: INTER, fontSize: 26, color: CHALK, opacity: sourceK, filter: "url(#chalk)" }}>{p.source}</div>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Stroke it={A.bar} seed={40} width={7} pts={wobbly([400, 636], [960, 634])} />
          <Stroke it={A.divider} seed={41} width={5} pts={wobbly([540, 830], [542, 1150], 4)} />
          {p.arrow ? <Stroke it={A.arrow} seed={42} width={6} head pts={curve([300, 822], [296, 706], [432, 694])} /> : null}
          <Stroke it={A.circle} seed={43} width={9} color={RED} pts={ellipse(800, 920, 152, 136, 1.08, -2.2)} />
          <Stroke it={A.underline} seed={44} width={6} pts={wobbly([620, 1114], [970, 1110])} />
        </svg>
      </AbsoluteFill>
      {Object.entries(A).filter(([k]) => k !== "source").map(([k, it]) => (
        <Cue key={k} at={it.at} name="marker-pen-line" volume={k === "circle" ? 0.45 : ["bar", "divider", "arrow", "underline"].includes(k) ? 0.28 : 0.12} />
      ))}
    </Clip>
  );
};
