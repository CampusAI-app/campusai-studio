/**
 * The end (shelf `logo-shrink-wordmark-lockup`), beats 22 to 26.5: a red slit ring shrinks fast
 * into the wordmark's own i dot (the red spark) with a brake, the spark slides to its place, the
 * letters of the real wordmark slide in left to right behind it, then "Your whole week, in one place."
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { EASE, bezier, mix, ramp } from "../shots/_fixtures/Polish";
import { OUTRO_AT } from "./beats";
import { LOGO_PATHS, LOGO_VB } from "./logo";

const RED = "#E21833";

/* ---------- the end: ring to dot to wordmark ---------- */
const LW = 760;
const LS = LW / LOGO_VB.w;
const LH = LOGO_VB.h * LS;
const LX = 540 - LW / 2;
const LY = 860 - LH / 2;
const DOT = { x: LX + 217 * LS, y: LY + 5.8 * LS, r: 6 * LS };
const T1 = OUTRO_AT + 18; // the ring has become the dot
const startX = LOGO_PATHS.map((d) => parseFloat(d.slice(1)));
const rankOf = LOGO_PATHS.map((_, i) => [...startX.slice(0, -1)].sort((a, b) => a - b).indexOf(startX[i]));

// the logo's own i dot (a four-point spark), drawn at any point in film coordinates
const Spark: React.FC<{ x: number; y: number; k?: number }> = ({ x, y, k = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${LS * k}) translate(-217 -5.8)`} style={{ filter: "drop-shadow(0 0 3px rgba(255,80,104,0.7))" }}>
    <path d={LOGO_PATHS[LOGO_PATHS.length - 1]} fill="url(#cf-end-dot3)" />
  </g>
);

const arc = (r: number, a0: number, a1: number) => {
  const p = (a: number) => [r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};

const Lockup: React.FC<{ f: number }> = ({ f }) => {
  if (f < OUTRO_AT + 2) return null;
  const shrink = ramp(f, OUTRO_AT + 2, 16, bezier(0.7, 0, 0.2, 1.08));
  const r = mix(470, DOT.r, shrink);
  const spin = mix(0, 150, ramp(f, OUTRO_AT + 2, 16, EASE.out));
  const ringOp = 1 - ramp(f, T1 - 2, 3, EASE.linear);
  const slide = ramp(f, T1 + 1, 14, EASE.swift);
  const dx = mix(540, DOT.x, slide);
  const dy = mix(900, DOT.y, slide);
  const shock = ramp(f, T1, 16, EASE.out);
  const line = (at: number) => ramp(f, at, 14, EASE.out);
  const push = 1 + 0.035 * ramp(f, T1, 76, EASE.linear); // the end card keeps breathing
  return (
    <AbsoluteFill style={{ transform: `scale(${push})` }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 30% at 50% 46%, rgba(226,24,51,${(0.4 * (1 - shrink * 0.5)).toFixed(3)}) 0%, rgba(226,24,51,0) 70%)` }} />
      {ringOp > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(540 900) rotate(${spin})`} opacity={ringOp}>
            {[0, 180].map((o) => (
              <g key={o}>
                <path d={arc(r, o + 10, o + 160)} fill="none" stroke="#FF5068" strokeWidth={Math.max(6, r * 0.05)} strokeLinecap="round" style={{ filter: "blur(10px)" }} opacity={0.8} />
                <path d={arc(r, o + 10, o + 160)} fill="none" stroke="#ffd9dd" strokeWidth={Math.max(3, r * 0.018)} strokeLinecap="round" />
              </g>
            ))}
            {shrink > 0.85 && <Spark x={0} y={0} />}
          </g>
          <defs>
            <linearGradient id="cf-end-dot3" x1="217" y1="0" x2="217" y2="11.6" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF5068" /><stop offset="1" stopColor={RED} />
            </linearGradient>
          </defs>
        </svg>
      )}
      {f >= T1 && shock < 1 && (
        <div style={{ position: "absolute", left: 540 - 200, top: 900 - 200, width: 400, height: 400, borderRadius: 200,
          transform: `scale(${0.1 + shock})`, opacity: (1 - shock) * 0.8, boxShadow: "0 0 0 2px rgba(255,160,170,0.9), 0 0 40px rgba(226,24,51,0.6)" }} />
      )}
      {f >= T1 - 1 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <linearGradient id="cf-end-dot3" x1="217" y1="0" x2="217" y2="11.6" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF5068" /><stop offset="1" stopColor={RED} />
            </linearGradient>
          </defs>
          {slide < 1 && <Spark x={dx} y={dy} />}
          <g transform={`translate(${LX} ${LY}) scale(${LS})`}>
            {slide >= 1 && <path d={LOGO_PATHS[LOGO_PATHS.length - 1]} fill="url(#cf-end-dot3)" />}
            {LOGO_PATHS.slice(0, -1).map((d, i) => {
              const k = ramp(f, T1 + 3 + rankOf[i] * 2.5, 10, EASE.out);
              return <path key={i} d={d} fill="#f7efe6" opacity={k} transform={`translate(${(-8 / LS) * (1 - k)} 0)`}
                style={{ filter: k < 1 ? `blur(${((1 - k) * 2.5) / LS}px)` : undefined }} />;
            })}
          </g>
        </svg>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1010, textAlign: "center", fontFamily: "Zodiak", fontSize: 64, lineHeight: 1.15, color: "#f7efe6", letterSpacing: "-0.01em" }}>
        {[["Your", 0, false], ["whole", 1, false], ["week,", 2, false]].map(([w, n]) => {
          const k = line(T1 + 20 + (n as number) * 3);
          return <span key={w as string} style={{ display: "inline-block", marginRight: 16, fontWeight: 700, opacity: k, transform: `translateY(${(1 - k) * 22}px)`, filter: `blur(${((1 - k) * 6).toFixed(1)}px)` }}>{w}</span>;
        })}
        <br />
        {["in", "one", "place."].map((w, n) => {
          const k = line(T1 + 28 + n * 3);
          return <span key={w} style={{ display: "inline-block", marginRight: 14, fontStyle: "italic", fontWeight: 400, color: "#ff8090", opacity: k, transform: `translateY(${(1 - k) * 22}px)`, filter: `blur(${((1 - k) * 6).toFixed(1)}px)` }}>{w}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

export const End: React.FC = () => {
  const f = useCurrentFrame();
  if (f < OUTRO_AT) return null;
  return <Lockup f={f} />;
};
