/**
 * Day dial (2026-11-15, from Skill Stack Store's "20 Claude Effects" reel, #3, 2.75 to 3.6 s, stepped frame by frame).
 * What the reel does: a cream clock-face disc (radial tick lines, big numerals, italic "day" labels around the rim)
 * slides in from the right BEHIND the speaker, his cutout staying in front, and turns slowly. About 0.9 s.
 *
 * Ours: the disc rolls in from the right edge like a wheel (it turns by the distance it travels, 16 frames, hard
 * ease-out), so the arrival and the turn are one motion. Two rings: the outer band carries the labels you pass in
 * (`labels`, italic serif along the curve), the inner face carries 60 ticks and four big numerals and keeps turning
 * slowly (`drift`). A fixed red needle points straight up; `stops` turn the outer band so the named label sits under it
 * (14 frames, ease-in-out), and that label turns red. The disc casts a soft shadow on the wall; the cutout sits on top.
 *
 * Props: `clip`, `person` (alpha webm), `from`, `frame` ({ zoom, bottom, focusX }), `dial` (centre and radius, frame
 * px), `labels` (around the band, clockwise from the top), `numerals` (four, at 12/3/6/9), `stops` ({ label, at }),
 * `enterAt`, `drift` (degrees per second), `exitAt` (optional: rolls back out to the right), `colors`, `sound`.
 *
 *   <DayDial clip="x/clip.mp4" person="x/person.webm" frame={{ zoom: 1.55, bottom: 1250 }}
 *     dial={{ cx: 720, cy: 720, r: 560 }} labels={["Monday", ...]} stops={[{ label: "Friday", at: 10 }]} />
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Fraunces";
import { IN, OUT, Sfx, SWING, k } from "./shared";
import { Framing, framingOf } from "./frameGrab";

const fraunces = loadFont("normal", { weights: ["400", "600"], subsets: ["latin"] });
loadFont("italic", { weights: ["400", "600"], subsets: ["latin"] });

export type DayDialProps = {
  clip: string;
  person: string;
  from?: number;
  frame?: Framing;
  dial: { cx: number; cy: number; r: number };
  labels: string[];
  numerals?: [string, string, string, string];
  stops: { label: string; at: number }[];
  enterAt?: number;
  drift?: number;
  exitAt?: number;
  colors?: { face: string; edge: string; ink: string; accent: string };
  volume?: number;
  sound?: boolean;
};

const COLORS = { face: "#F5EDDF", edge: "#E2D1B4", ink: "#2B1D17", accent: "#C33A2C" };

export const DayDial: React.FC<DayDialProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const from = p.from ?? 0;
  const enterAt = p.enterAt ?? 6;
  const c = p.colors ?? COLORS;
  const { cx, cy, r } = p.dial;
  const { zoom, tx, ty } = framingOf(W, H, p.frame);
  const framed: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` };

  const n = p.labels.length;
  const step = 360 / n;
  const indexOf = (label: string) => Math.max(0, p.labels.indexOf(label));

  // the band's rotation: hold each stop's label under the needle, turning between stops
  let band = -indexOf(p.stops[0]?.label ?? p.labels[0]) * step;
  let current = indexOf(p.stops[0]?.label ?? p.labels[0]);
  let blend = 1;
  for (let i = 1; i < p.stops.length; i++) {
    const s = p.stops[i];
    const prevAngle = band;
    let target = -indexOf(s.label) * step;
    // always turn the short way
    while (target - prevAngle > 180) target -= 360;
    while (target - prevAngle < -180) target += 360;
    const t = k(f, s.at, s.at + 14, SWING);
    band = prevAngle + (target - prevAngle) * t;
    if (t > 0) {
      blend = t;
      current = indexOf(s.label);
    }
  }
  const previous = (() => {
    for (let i = p.stops.length - 1; i >= 1; i--) if (f >= p.stops[i].at) return indexOf(p.stops[i - 1].label);
    return -1;
  })();

  // the roll: from off the right edge to its place; the disc turns by the distance it travels
  const enter = k(f, enterAt, enterAt + 16, OUT);
  const leave = p.exitAt === undefined ? 0 : k(f, p.exitAt, p.exitAt + 12, IN);
  const away = W - cx + r + 60;
  const dx = away * (1 - enter) + away * leave;
  const roll = (dx / r) * (180 / Math.PI);
  const drift = (p.drift ?? 4) * Math.max(0, f - enterAt) / fps;
  const visible = enter > 0 && leave < 1;

  const numerals = p.numerals ?? ["12", "3", "6", "9"];
  const bandOuter = r * 0.985;
  const bandInner = r * 0.79;
  const labelR = r * 0.865;
  const labelSize = r * 0.084;
  const arcHalf = 70;
  const arc = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(labelR * Math.cos(a)).toFixed(2)} ${(labelR * Math.sin(a)).toFixed(2)}`;
  };
  const arcId = "day-dial-arc";
  const grainId = "day-dial-grain";

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={framed}>
        <OffthreadVideo src={staticFile(p.clip)} startFrom={from} volume={p.volume ?? 1} style={{ width: W, height: H }} />
      </div>

      {visible ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <radialGradient id="day-dial-face" cx="0.42" cy="0.38" r="0.75">
              <stop offset="0" stopColor={c.face} />
              <stop offset="0.7" stopColor={c.face} />
              <stop offset="1" stopColor={c.edge} />
            </radialGradient>
            <filter id={grainId} x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.15  0 0 0 0.09 0" result="g" />
              <feComposite in="g" in2="SourceAlpha" operator="in" result="gi" />
              <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="gi" /></feMerge>
            </filter>
            <filter id="day-dial-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="-14" dy="26" stdDeviation="28" floodColor="#000" floodOpacity="0.55" />
            </filter>
            <path id={arcId} d={`M ${arc(-arcHalf)} A ${labelR} ${labelR} 0 0 1 ${arc(arcHalf)}`} />
          </defs>
          <g transform={`translate(${(cx + dx).toFixed(2)} ${cy})`}>
            {/* the disc and its shadow */}
            <circle r={r} fill="url(#day-dial-face)" filter="url(#day-dial-shadow)" />
            <g filter={`url(#${grainId})`}>
              <circle r={r} fill="url(#day-dial-face)" />
            </g>

            {/* the inner face: ticks and numerals, turning slowly */}
            <g transform={`rotate(${(roll + drift).toFixed(3)})`}>
              {Array.from({ length: 60 }, (_, i) => {
                const major = i % 5 === 0;
                const a = (i * 6 * Math.PI) / 180;
                const r1 = r * (major ? 0.66 : 0.705);
                const r2 = r * 0.76;
                return (
                  <line key={i} x1={(r1 * Math.sin(a)).toFixed(2)} y1={(-r1 * Math.cos(a)).toFixed(2)} x2={(r2 * Math.sin(a)).toFixed(2)} y2={(-r2 * Math.cos(a)).toFixed(2)}
                    stroke={c.ink} strokeWidth={major ? 4 : 1.6} strokeLinecap="round" opacity={major ? 0.9 : 0.55} />
                );
              })}
              {numerals.map((t, i) => {
                const a = (i * 90 * Math.PI) / 180;
                const rr = r * 0.47;
                return (
                  <text key={i} x={(rr * Math.sin(a)).toFixed(2)} y={(-rr * Math.cos(a)).toFixed(2)} textAnchor="middle" dominantBaseline="central"
                    fontFamily={fraunces.fontFamily} fontWeight={400} fontSize={r * 0.3} fill={c.ink} style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
                    {t}
                  </text>
                );
              })}
              <circle r={r * 0.2} fill="none" stroke={c.ink} strokeWidth={1.2} opacity={0.35} />
            </g>

            {/* the band: hairlines and the labels along the curve */}
            <circle r={bandOuter} fill="none" stroke={c.ink} strokeWidth={2} opacity={0.75} />
            <circle r={bandInner} fill="none" stroke={c.ink} strokeWidth={2} opacity={0.75} />
            <circle r={bandInner - 9} fill="none" stroke={c.ink} strokeWidth={1} opacity={0.4} />
            <g transform={`rotate(${(roll + band).toFixed(3)})`}>
              {p.labels.map((label, i) => {
                const on = i === current ? blend : i === previous ? 1 - blend : 0;
                const ink = on > 0.5 ? c.accent : c.ink;
                return (
                  <g key={label} transform={`rotate(${i * step})`}>
                    <line x1={0} y1={-bandInner} x2={0} y2={-bandOuter} stroke={c.ink} strokeWidth={1.2} opacity={0.35}
                      transform={`rotate(${step / 2})`} />
                    <text fontFamily={fraunces.fontFamily} fontStyle="italic" fontWeight={on > 0.5 ? 600 : 400} fontSize={labelSize}
                      fill={ink} textAnchor="middle" dominantBaseline="central">
                      <textPath href={`#${arcId}`} startOffset="50%">{label}</textPath>
                    </text>
                  </g>
                );
              })}
            </g>

            {/* the needle: fixed, pointing up */}
            <g>
              <line x1={0} y1={r * 0.12} x2={0} y2={-r * 0.74} stroke={c.accent} strokeWidth={5} strokeLinecap="round" />
              <path d={`M 0 ${-r * 0.79} L ${r * 0.028} ${-r * 0.72} L ${-r * 0.028} ${-r * 0.72} Z`} fill={c.accent} />
              <circle r={r * 0.035} fill={c.accent} />
              <circle r={r * 0.012} fill={c.face} />
            </g>
          </g>
        </svg>
      ) : null}

      <div style={framed}>
        <OffthreadVideo src={staticFile(p.person)} startFrom={from} muted transparent style={{ width: W, height: H }} />
      </div>
      <Sfx at={enterAt} name="swoosh-slow" volume={0.22} on={p.sound ?? true} />
      {p.stops.slice(1).map((s, i) => (
        <Sfx key={i} at={s.at} name="switch-tap" volume={0.25} on={p.sound ?? true} />
      ))}
    </AbsoluteFill>
  );
};

