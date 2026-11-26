/**
 * /glow-sketch (2026-11-17, from the Nov 17 Muse sends: Matt Penny's ten Claude animation styles, Karam Mahaan's six
 * skills where relevant; prompts gated and unseen, so this is our own build of the look). Read frame by frame: a pure
 * black ground, thin glowing amber line art made of fine dots and strokes drawing itself on (a suspension bridge across
 * the lower third, dotted, with a soft dotted reflection under it), a paper plane in glowing amber lines with a dotted
 * trail and a warm bloom halo behind it, a faint dotted circle, and a title in a warm glowing face.
 *
 * Ours, student-first at Maryland (round 2, Jacob 11/17: show the real product, and open on something UMD): the UMD M
 * pops in and tags up top, the student's line glows on, McKeldin Library draws itself in amber over its own dotted
 * reflection, the outline of the week sketches itself in light (frame, day columns, due lane), two paper planes carry the
 * two feeds (each labelled) along dotted trails onto the real thing each one becomes, and the real My Calendar capture
 * fades up inside the sketch, crisp, with dotted rings on where they landed. Glow is SVG blur added back onto the line
 * (feComposite arithmetic), never on the capture. Marcellus throughout.
 */
import React, { useMemo } from "react";
import { loadFont } from "@remotion/google-fonts/Marcellus";
import { getLength, getPointAtLength, getTangentAtLength } from "@remotion/paths";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { CURVE } from "../system/motion";
import { Cue, clamp, ramp } from "./common";
import { UmdOpen } from "./UmdOpen";
import { World } from "./world";

const { fontFamily: FACE } = loadFont("normal", { weights: ["400"], subsets: ["latin"] });

const GROUND = "#020100";
const CORE = "#FFE7B8"; // the hot centre of a line
const AMBER = "#FFB54A";
const EMBER = "#FF7A2A"; // the outer bloom leans red
const glowText = (k = 1) =>
  `0 0 ${4 * k}px rgba(255,214,150,0.95), 0 0 ${14 * k}px rgba(255,170,70,0.75), 0 0 ${38 * k}px rgba(255,120,40,0.5), 0 0 ${80 * k}px rgba(255,90,30,0.28)`;

export type GlowSketchProps = {
  /** Who the student is, small, first. */
  who: string;
  /** Their question, in their words. */
  ask: string;
  /** The two things the planes carry, one label each. */
  feeds: [string, string];
  /** The answer, two lines. */
  answer: [string, string];
  /** The small print under the scene, true on main. */
  source: string;
  /** The real capture the planes land in (public/), its size in capture pixels and how much of its height shows. */
  shot: { src: string; w: number; h: number; fullH: number };
  /** Where each plane lands on the capture (capture pixels), and the dotted ring's radii round it. */
  marks: [Mark, Mark];
  /** The capture's day-column edges and lane lines (capture pixels), sketched in light before it shows. */
  columns: number[];
  rows: number[];
  cta?: string;
};
type Mark = { x: number; y: number; rx: number; ry: number };
/** Where the capture sits on screen. */
const PANEL = { x: 80, y: 486, w: 920 };

// motion: the beats, in frames at 30 fps (the question holds its reading time, 50 letters = 4.8 s)
const T = { horizon: 0, who: 4, ask: 14, build: 10, sketch: 60, askOut: 160, planeA: 150, planeB: 176, flight: 74, answer: 196, reveal: 246, source: 150, end: 366 };
export const glowEnd = (_p: GlowSketchProps) => T.end;

/* ---------- dots along a path ---------- */
const sampleCache = new Map<string, { x: number; y: number }[]>();
const sample = (d: string, gap: number) => {
  const key = `${gap}|${d}`;
  const hit = sampleCache.get(key);
  if (hit) return hit;
  const len = getLength(d);
  const n = Math.max(2, Math.floor(len / gap));
  const pts = [...Array(n + 1)].map((_, i) => getPointAtLength(d, (i / n) * len) ?? { x: 0, y: 0 });
  sampleCache.set(key, pts);
  return pts;
};

/** A thin line writing itself on, with a bright pen spark at its head while it draws. */
const Stroke: React.FC<{ d: string; k: number; w?: number; color?: string }> = ({ d, k, w = 2.2, color = CORE }) => {
  const len = useMemo(() => getLength(d), [d]);
  if (k <= 0) return null;
  const head = k < 1 ? getPointAtLength(d, len * k) : null;
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - k)} />
      {head ? <circle cx={head.x} cy={head.y} r={w * 2.4} fill="#FFF6E2" /> : null}
    </g>
  );
};

/** A dotted line revealing itself dot by dot. */
const Dots: React.FC<{ d: string; k: number; gap?: number; r?: number; color?: string; opacity?: number; map?: (p: { x: number; y: number }, i: number) => { x: number; y: number } }> = ({
  d, k, gap = 14, r = 2.2, color = AMBER, opacity = 1, map,
}) => {
  const pts = sample(d, gap);
  const shown = Math.floor(pts.length * Math.max(0, Math.min(1, k)));
  if (shown <= 0) return null;
  return (
    <g opacity={opacity}>
      {pts.slice(0, shown).map((p, i) => {
        const q = map ? map(p, i) : p;
        return <circle key={i} cx={q.x} cy={q.y} r={r} fill={color} />;
      })}
    </g>
  );
};

/* ---------- McKeldin Library, as a facade: wings, portico, pediment, drum, dome, lantern ---------- */
// local units: 700 wide, the ground at y 500 (same proportions as the /pov-doodle McKeldin)
const win = (x: number, y: number) => `M${x - 16} ${y + 50} V${y + 10} Q${x} ${y - 4} ${x + 16} ${y + 10} V${y + 50} Z`;
const MCK: { d: string; at: number; dur: number; dotted?: boolean }[] = [
  { d: "M0 500 H700", at: 0, dur: 20 },
  { d: "M210 515 H490 M190 530 H510", at: 8, dur: 14 },
  { d: "M0 500 V270 H230 M700 500 V270 H470", at: 12, dur: 24 },
  { d: "M-8 270 H232 M468 270 H708", at: 26, dur: 12 },
  ...[40, 100, 160, 540, 600, 660].map((x, i) => ({ d: `${win(x, 330)} ${win(x, 412)}`, at: 30 + i * 3, dur: 16 })),
  { d: "M220 290 L350 205 L480 290 Z", at: 34, dur: 22 },
  { d: "M232 290 V308 H468 V290 M262 268 L350 220 L438 268", at: 44, dur: 16 },
  ...[255, 315, 385, 445].map((x, i) => ({ d: `M${x - 7} 308 V500 M${x + 7} 308 V500 M${x - 12} 314 H${x + 12} M${x - 12} 494 H${x + 12}`, at: 46 + i * 4, dur: 18 })),
  { d: "M300 205 V130 H400 V205", at: 62, dur: 16 },
  ...[322, 350, 378].map((x, i) => ({ d: `M${x - 8} 192 V162 Q${x} 150 ${x + 8} 162 V192`, at: 70 + i * 3, dur: 12 })),
  { d: "M290 130 H410", at: 72, dur: 10 },
  { d: "M300 130 Q350 48 400 130", at: 76, dur: 20 },
  { d: "M318 104 Q350 60 382 104", at: 84, dur: 14, dotted: true },
  { d: "M342 75 V50 H358 V75 M338 50 H362 M350 50 V18", at: 90, dur: 14 },
];
const MCK_SCALE = 0.8;
const MCK_X = 540 - 350 * MCK_SCALE;
const BASE_Y = 1574; // the ground line on screen
const MCK_Y = BASE_Y - 500 * MCK_SCALE;

/* ---------- the paper plane, pointing +x, drawn in lines ---------- */
const PLANE = ["M58 0 L-46 -34 L-16 2 Z", "M58 0 L-16 2 L-32 24 Z", "M-16 2 L-26 14"];

const Plane: React.FC<{ d: string; t: number; draw: number; label: string; labelK: number; labelDy?: number }> = ({ d, t, draw, label, labelK, labelDy = 100 }) => {
  const len = useMemo(() => getLength(d), [d]);
  const at = Math.max(0.001, Math.min(1, t)) * len;
  const p = getPointAtLength(d, at) ?? { x: 0, y: 0 };
  const tan = getTangentAtLength(d, at) ?? { x: 1, y: 0 };
  const ang = (Math.atan2(tan.y, tan.x) * 180) / Math.PI;
  const shrink = interpolate(t, [0.86, 1], [1, 0.15], clamp);
  const gone = t >= 1;
  // the dotted trail behind it, the oldest dots fading
  const pts = sample(d, 16);
  const shown = Math.floor(pts.length * Math.min(1, t));
  return (
    <g>
      <g>
        {pts.slice(0, shown).map((q, i) => (
          <circle key={i} cx={q.x} cy={q.y} r={2.3} fill={AMBER} opacity={0.15 + 0.85 * Math.pow(i / Math.max(1, shown), 1.6)} />
        ))}
      </g>
      {!gone ? (
        <g transform={`translate(${p.x} ${p.y}) rotate(${ang}) scale(${shrink * 1.5})`}>
          <circle r={95} fill="url(#planeHalo)" />
          {PLANE.map((s, i) => <Stroke key={i} d={s} k={ramp(draw, i * 0.2, 0.6 + i * 0.2)} w={2.6} />)}
        </g>
      ) : null}
      {labelK > 0 ? (
        <text x={Math.max(230, Math.min(850, p.x))} y={p.y + labelDy} textAnchor="middle" fontFamily={FACE} fontSize={44} fill="#FFE2B0" opacity={labelK} filter="url(#glowSoft)">{label}</text>
      ) : null}
    </g>
  );
};

export const GlowSketch: React.FC<GlowSketchProps> = (p) => {
  const f = useCurrentFrame();
  const shot = p.shot;
  const sx = PANEL.x, sy = PANEL.y, sw = PANEL.w, sc = sw / shot.w, sh = shot.h * sc;
  const at = (m: Mark) => ({ x: sx + m.x * sc, y: sy + m.y * sc });
  const aim = [at(p.marks[0]), at(p.marks[1])];
  const moon = { x: 790, y: 1330, r: 96 };

  // the two flight paths, each ending on the real thing it carries
  const pathA = `M-140 980 C 140 760, 380 420, ${aim[0].x} ${aim[0].y}`;
  const pathB = `M1220 1560 C 1120 1400, 980 1260, ${aim[1].x} ${aim[1].y}`;
  const tA = ramp(f, T.planeA, T.planeA + T.flight, CURVE.quiet.standard);
  const tB = ramp(f, T.planeB, T.planeB + T.flight, CURVE.quiet.standard);
  const landA = T.planeA + T.flight;
  const landB = T.planeB + T.flight;

  const sketch = ramp(f, T.sketch, T.sketch + 34, CURVE.quiet.standard);
  const grid = ramp(f, T.sketch + 16, T.sketch + 50, CURVE.quiet.standard);
  const reveal = ramp(f, T.reveal, T.reveal + 26, CURVE.quiet.enter);
  const pulse = (a: number) => (f < a ? 0 : Math.exp(-(f - a) / 8));

  const askK = ramp(f, T.who, T.who + 16, CURVE.quiet.enter) * (1 - ramp(f, T.askOut - 10, T.askOut, CURVE.quiet.exit));
  const ansK = ramp(f, T.answer, T.answer + 20, CURVE.quiet.enter);
  const srcK = ramp(f, T.source, T.source + 16, CURVE.quiet.enter);

  // a slow drift so the frame is never still
  const drift = interpolate(f, [0, T.end], [0, -10]);
  const push = interpolate(f, [T.reveal, T.end], [1, 1.035], clamp);
  const dust = useMemo(() => [...Array(36)].map((_, i) => ({ x: (i * 397) % 1080, y: 200 + ((i * 631) % 1600), s: 0.6 + ((i * 7) % 5) * 0.25, ph: i * 1.7 })), []);

  const letters = (s: string, a: number, step: number) =>
    s.split("").map((c, i) => {
      const k = ramp(f, a + i * step, a + i * step + 10, CURVE.quiet.enter);
      return <span key={i} style={{ opacity: k, filter: `blur(${((1 - k) * 6).toFixed(2)}px)` }}>{c}</span>;
    });

  const frame = `M${sx + 24} ${sy} H${sx + sw - 24} Q${sx + sw} ${sy} ${sx + sw} ${sy + 24} V${sy + sh - 24} Q${sx + sw} ${sy + sh} ${sx + sw - 24} ${sy + sh} H${sx + 24} Q${sx} ${sy + sh} ${sx} ${sy + sh - 24} V${sy + 24} Q${sx} ${sy} ${sx + 24} ${sy} Z`;

  return (
    <World endAt={T.end} ground={GROUND} ink={CORE} logo="white" logoSpot="top-right" font={FACE} fontWeight={400} end="iris" endGround={GROUND}>
      <AbsoluteFill>
        <svg viewBox="0 0 1080 1920" style={{ width: "100%", height: "100%" }}>
          <defs>
            {/* additive glow: two blurs of the line added back onto it */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b2" />
              <feColorMatrix in="b2" type="matrix" values="1 0 0 0 0  0 0.55 0 0 0  0 0 0.2 0 0  0 0 0 1.4 0" result="b2w" />
              <feComposite in="b1" in2="b2w" operator="arithmetic" k1={0} k2={1.1} k3={1} k4={0} result="g" />
              <feComposite in="SourceGraphic" in2="g" operator="arithmetic" k1={0} k2={1} k3={1} k4={0} />
            </filter>
            <filter id="glowSoft" x="-30%" y="-60%" width="160%" height="220%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
              <feComposite in="SourceGraphic" in2="b" operator="arithmetic" k1={0} k2={1} k3={0.55} k4={0} />
            </filter>
            <radialGradient id="planeHalo">
              <stop offset="0%" stopColor={AMBER} stopOpacity={0.55} />
              <stop offset="45%" stopColor={EMBER} stopOpacity={0.18} />
              <stop offset="100%" stopColor={EMBER} stopOpacity={0} />
            </radialGradient>
            <radialGradient id="moonBloom">
              <stop offset="0%" stopColor={AMBER} stopOpacity={0.22} />
              <stop offset="55%" stopColor={EMBER} stopOpacity={0.06} />
              <stop offset="100%" stopColor={EMBER} stopOpacity={0} />
            </radialGradient>
            <clipPath id="panelClip"><path d={frame} /></clipPath>
          </defs>

          <g transform={`translate(0 ${drift.toFixed(2)})`}>
            {dust.map((d, i) => (
              <circle key={i} cx={d.x + Math.sin(f * 0.02 + d.ph) * 10} cy={d.y - f * 0.25 * d.s} r={1.3 * d.s} fill={AMBER}
                opacity={0.12 + 0.12 * Math.sin(f * 0.07 + d.ph)} />
            ))}

            <g filter="url(#glow)">
              {/* the dotted circle behind the dome */}
              <circle cx={moon.x} cy={moon.y} r={moon.r * 2} fill="url(#moonBloom)" opacity={0.6} />
              <g transform={`rotate(${f * 0.12} ${moon.x} ${moon.y})`} opacity={0.45 * ramp(f, 0, 24)}>
                {[...Array(48)].map((_, i) => {
                  const a = (i / 48) * Math.PI * 2;
                  return <circle key={i} cx={moon.x + Math.cos(a) * moon.r} cy={moon.y + Math.sin(a) * moon.r} r={2.2} fill={AMBER} />;
                })}
              </g>

              {/* the horizon, dotted, from the middle out */}
              <Dots d={`M540 ${BASE_Y} H-20`} k={ramp(f, T.horizon, T.horizon + 30)} gap={13} r={2} />
              <Dots d={`M540 ${BASE_Y} H1100`} k={ramp(f, T.horizon, T.horizon + 30)} gap={13} r={2} />

              {/* McKeldin, drawn on, and its dotted reflection a beat behind */}
              <g transform={`translate(${MCK_X} ${MCK_Y}) scale(${MCK_SCALE})`}>
                {MCK.map((st, i) => {
                  const k = ramp(f, T.build + st.at, T.build + st.at + st.dur, CURVE.quiet.standard);
                  return st.dotted ? <Dots key={i} d={st.d} k={k} gap={7} r={1.5} color={CORE} /> : <Stroke key={i} d={st.d} k={k} w={2.2} />;
                })}
              </g>
              <g transform={`translate(${MCK_X} ${BASE_Y + 12}) scale(${MCK_SCALE} ${-MCK_SCALE * 0.42}) translate(0 -500)`} opacity={0.42}>
                {MCK.map((st, i) => (
                  <Dots key={i} d={st.d} k={ramp(f, T.build + st.at + 12, T.build + st.at + st.dur + 12, CURVE.quiet.standard)} gap={10} r={1.8}
                    map={(q, j) => ({ x: q.x + Math.sin(q.y * 0.09 + f * 0.12 + j * 0.3) * 3, y: q.y })} />
                ))}
              </g>

              {/* the week, sketched in light before the real one shows through: its frame, its day columns, its due lane */}
              <g opacity={1 - 0.55 * reveal}>
                <Stroke d={frame} k={sketch} w={2} color={AMBER} />
                {p.columns.map((x, i) => (
                  <Dots key={i} d={`M${sx + x * sc} ${sy + 6} V${sy + sh - 6}`} k={ramp(grid, i * 0.08, 0.5 + i * 0.08)} gap={12} r={1.6} opacity={1 - reveal} />
                ))}
                {p.rows.map((y, i) => (
                  <Dots key={i} d={`M${sx + 6} ${sy + y * sc} H${sx + sw - 6}`} k={ramp(grid, 0.2 + i * 0.1, 0.8 + i * 0.1)} gap={12} r={1.6} opacity={1 - reveal} />
                ))}
              </g>
            </g>
          </g>

          {/* the real My Calendar, crisp, fading up inside the sketch: never glowed, never redrawn */}
          {reveal > 0 ? (
            <g clipPath="url(#panelClip)" opacity={reveal} transform={`translate(${sx + sw / 2} ${sy + sh / 2}) scale(${push}) translate(${-(sx + sw / 2)} ${-(sy + sh / 2)})`}>
              <image href={staticFile(shot.src)} x={sx} y={sy} width={sw} height={shot.fullH * sc} preserveAspectRatio="xMidYMin slice" />
            </g>
          ) : null}

          <g filter="url(#glow)">
            {/* where each one landed, ringed in dots once the real week is up */}
            {p.marks.map((m, i) => {
              const c = at(m);
              const k = ramp(f, T.reveal + 14 + i * 10, T.reveal + 40 + i * 10, CURVE.quiet.standard);
              const n = 44;
              return (
                <g key={i}>
                  {[...Array(Math.floor(n * k))].map((_, j) => {
                    const a = -Math.PI / 2 + (j / n) * Math.PI * 2;
                    return <circle key={j} cx={c.x + Math.cos(a) * m.rx * sc} cy={c.y + Math.sin(a) * m.ry * sc} r={2.6} fill={AMBER} />;
                  })}
                </g>
              );
            })}
            {[landA, landB].map((l, i) => {
              const k = pulse(l);
              return k > 0.02 ? <circle key={i} cx={aim[i].x} cy={aim[i].y} r={20 + (1 - k) * 60} fill="none" stroke={CORE} strokeWidth={3} opacity={k} /> : null;
            })}
            {f >= T.planeA ? (
              <Plane d={pathA} t={tA} draw={ramp(f, T.planeA, T.planeA + 12)} label={p.feeds[0]}
                labelK={ramp(f, T.planeA + 6, T.planeA + 18) * (1 - ramp(f, landA - 24, landA - 12))} />
            ) : null}
            {f >= T.planeB ? (
              <Plane d={pathB} t={tB} draw={ramp(f, T.planeB, T.planeB + 12)} label={p.feeds[1]} labelDy={-84}
                labelK={ramp(f, T.planeB + 20, T.planeB + 32) * (1 - ramp(f, landB - 24, landB - 12))} />
            ) : null}
          </g>
        </svg>
      </AbsoluteFill>

      {/* the words: the student's question, then the answer in its place */}
      <div style={{ position: "absolute", left: 76, right: 76, top: 206, fontFamily: FACE, color: CORE, opacity: askK }}>
        <div style={{ fontSize: 48, lineHeight: 1.1, color: "#FFD9A0", textShadow: glowText(0.8) }}>{letters(p.who, T.who, 0.7)}</div>
        <div style={{ fontSize: 76, lineHeight: 1.06, marginTop: 14, maxWidth: 720, textShadow: glowText(1) }}>{letters(p.ask, T.ask, 0.9)}</div>
      </div>
      {f >= T.answer ? (
        <div style={{ position: "absolute", left: 76, right: 76, top: 206, fontFamily: FACE, color: CORE, opacity: ansK, transform: `translateY(${((1 - ansK) * 12).toFixed(1)}px)` }}>
          <div style={{ fontSize: 88, lineHeight: 1.04, textShadow: glowText(1) }}>{letters(p.answer[0], T.answer, 0.8)}</div>
          <div style={{ fontSize: 88, lineHeight: 1.04, textShadow: glowText(1.15 + reveal * 0.4), color: "#FFF1D2" }}>{letters(p.answer[1], T.reveal - 6, 0.8)}</div>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 64, textAlign: "center", fontFamily: FACE, fontSize: 30, lineHeight: 1.3, color: "#F2C98C",
        opacity: srcK * 0.85, textShadow: glowText(0.45) }}>{p.source}</div>

      {/* the ending in the same light: the CTA glows, a dotted ring draws round the logo */}
      {f >= T.end + 12 ? <GlowEnd at={T.end + 12} cta={p.cta} /> : null}

      <Cue at={T.build + 4} name="marker-pen-line" volume={0.25} />
      <Cue at={T.planeA} name="swoosh-slow" volume={0.4} />
      <Cue at={T.planeB} name="air-woosh-quick" volume={0.35} />
      <Cue at={T.reveal} name="chime-crystal" volume={0.45} />
      {/* the UMD M first, so a Maryland student knows it is theirs (Jacob 11/17), last so it sits on top */}
      <UmdOpen shadow={false} bigCy={820} tagCx={540} tagCy={120} />
    </World>
  );
};

/** World draws the logo and campusai.app; this adds the style's own light on top: a glowing CTA and a dotted ring. */
const GlowEnd: React.FC<{ at: number; cta?: string }> = ({ at, cta }) => {
  const f = useCurrentFrame();
  const k = ramp(f, at + 6, at + 26, CURVE.quiet.enter);
  const ring = ramp(f, at, at + 40, CURVE.quiet.standard);
  const n = 84;
  const cy = 960;
  return (
    <AbsoluteFill style={{ zIndex: 70 }}>
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", width: "100%", height: "100%" }}>
        <g transform={`rotate(${-90 + f * 0.2} 540 ${cy})`}>
          {[...Array(Math.floor(n * ring))].map((_, i) => {
            const a = (i / n) * Math.PI * 2;
            return <circle key={i} cx={540 + Math.cos(a) * 340} cy={cy + Math.sin(a) * 340} r={2.6} fill={AMBER} opacity={0.75} />;
          })}
        </g>
      </svg>
      {cta ? (
        <div style={{ position: "absolute", left: 72, right: 72, bottom: 1920 - (cy - 340 - 34), textAlign: "center", fontFamily: FACE, fontSize: 76,
          lineHeight: 1.05, color: CORE, opacity: k, textShadow: glowText(1), transform: `translateY(${((1 - k) * 14).toFixed(1)}px)` }}>{cta}</div>
      ) : null}
    </AbsoluteFill>
  );
};
