/**
 * Scene 3: the flock (shelf shot `card-flock-tumble`), with the end card on top of it.
 *
 * Three real Job Match cards (round 4; rounds 1-3 used Planner / My Calendar / Job Match screens) tumble in from
 * edge-on along one Catmull-Rom spline, keep turning once they stand (the card's "never stop"
 * rule), then get sucked into the centre in ten frames. The collapse lands on the music's drop:
 * a white-hot core, one turbulent smoke ring, and the CampusAI wordmark slamming in.
 * Kept from the shelf card's verdicts: no blur on the cards, one ring only, no particles, fast
 * collapse. Changed for us: 9:16 stepped vertically, the aurora palette swapped for one red
 * family, the outline word wall says what a semester holds, the giant word is the real wordmark,
 * and the line under it gets a marker stroke (shelf shot `marker-underline-title`).
 */
import React, { useId } from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EASE, Grain, Vignette, mix, ramp } from "../shots/_fixtures/Polish";
import { DROP } from "./beats";

const W = 1080;
const CX = 540;
const CY = 960 + 30;
const RED = "#D9202E";

// Local timeline (frames from the start of this scene), from the shelf card, ring on the drop.
const T0 = Math.round(DROP) - 70;
const FLIGHT = [2, 54] as const; // was [10, 54]: the cards sat edge-on for 0.3s before flying (Aiden, Oct 21)
const CARD_OUT = [62, 72] as const;
const RING_T0 = 70;
const MARK_T0 = 74;
export const TUMBLE_START = T0;

type Pose = { x: number; y: number; rx: number; ry: number; rz: number; s: number };
const KEYS: (keyof Pose)[] = ["x", "y", "rx", "ry", "rz", "s"];
const catmull = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};
const splinePose = (k: Pose[], u: number): Pose => {
  const seg = u < 0.55 ? 0 : 1;
  const lt = seg === 0 ? u / 0.55 : (u - 0.55) / 0.45;
  const out = {} as Pose;
  for (const key of KEYS) out[key] = catmull(k[Math.max(0, seg - 1)][key], k[seg][key], k[seg + 1][key], k[Math.min(2, seg + 2)][key], lt);
  return out;
};
const lerpPose = (a: Pose, b: Pose, t: number): Pose => {
  const out = {} as Pose;
  for (const key of KEYS) out[key] = a[key] + (b[key] - a[key]) * t;
  return out;
};

// Round 4: three real Job Match cards (Goldman at the back, Capital One, Deloitte in front) in place
// of the round 1-3 full screens. s scales the card's own 436px width. Stepped down the frame.
const CARDS: { src: string; w: number; h: number; k: [Pose, Pose, Pose]; conv: Pose }[] = [
  { src: "flock/parts/job3.png", w: 436, h: 195,
    k: [{ x: -10, y: -30, rx: 9, ry: 88, rz: 12, s: 1.2 }, { x: -60, y: -400, rx: 16, ry: 44, rz: -8, s: 1.6 }, { x: -46, y: -350, rx: 4, ry: 13, rz: -2, s: 1.86 }],
    conv: { x: -10, y: -14, rx: 0, ry: 55, rz: 4, s: 0.12 } },
  { src: "flock/parts/job2.png", w: 436, h: 170,
    k: [{ x: 0, y: 0, rx: 8, ry: 89, rz: 12, s: 1.2 }, { x: -10, y: -20, rx: 13, ry: 38, rz: -7, s: 1.7 }, { x: -4, y: -6, rx: 3, ry: 11, rz: -2, s: 1.96 }],
    conv: { x: 0, y: 0, rx: 0, ry: 60, rz: 4, s: 0.12 } },
  { src: "flock/parts/job.png", w: 436, h: 158,
    k: [{ x: 10, y: 30, rx: 7, ry: 90, rz: 12, s: 1.2 }, { x: 54, y: 370, rx: 11, ry: 34, rz: -6, s: 1.8 }, { x: 40, y: 340, rx: 2, ry: 9, rz: -1, s: 2.06 }],
    conv: { x: 8, y: 12, rx: 0, ry: 65, rz: 4, s: 0.12 } },
];
const idleAt = (f: number) => {
  const t = Math.min(f, CARD_OUT[0]) - FLIGHT[1] * 0.86;
  if (t <= 0) return { ry: 0, rx: 0, rz: 0 };
  const r = Math.min(1, t / 14) ** 2;
  return { ry: t * 0.34 * r, rx: t * -0.1 * r, rz: t * 0.05 * r };
};

/* ---------- backdrop: outline word wall + red key light ---------- */
const WALL = ["classes  jobs  events  clubs  deadlines  ", "advisors  dining  internships  quizzes  ", "coffee chats  planning  registration  "];
const Backdrop: React.FC<{ f: number }> = ({ f }) => {
  const up = ramp(f, 4, 16, EASE.out);
  const k = ramp(f, CARD_OUT[0], CARD_OUT[1] - CARD_OUT[0] + 4, EASE.exit);
  const bloom = mix(0.5, 0.34, ramp(f, CARD_OUT[0], 14, EASE.smooth));
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #120709 0%, #0b0708 55%, #080506 100%)", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 36% at 50% ${(CY / 19.2).toFixed(1)}%, rgba(217,32,46,${bloom}) 0%, rgba(255,90,100,${(bloom * 0.25).toFixed(3)}) 40%, rgba(217,32,46,0) 72%)` }} />
      <AbsoluteFill style={{ opacity: up * (1 - k), transform: `scale(${mix(1, 0.7, k).toFixed(4)})` }}>
        {WALL.map((row, i) => (
          <div key={i} style={{ position: "absolute", top: 200 + i * 600, left: 0, whiteSpace: "nowrap", fontFamily: "Zodiak", fontStyle: "italic",
            fontWeight: 400, fontSize: 250, lineHeight: 1, letterSpacing: "-0.02em", color: "transparent",
            WebkitTextStroke: `2.5px rgba(255,140,140,${i === 1 ? 0.1 : 0.15})`,
            transform: `translateX(${((i % 2 ? 1 : -1) * f * 2.6 - (i % 2 ? 1600 : 200)).toFixed(1)}px)` }}>{row.repeat(3)}</div>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CoreFlash: React.FC<{ f: number }> = ({ f }) => {
  const t = f - RING_T0;
  if (t < -1 || t > 14) return null;
  const a = t < 0 ? 0.4 : Math.exp(-t / 3.2);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      <div style={{ position: "absolute", left: CX - 460, top: CY - 460, width: 920, height: 920, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(255,250,248,${a.toFixed(3)}) 0%, rgba(255,214,206,${(0.85 * a).toFixed(3)}) 9%, rgba(255,90,100,${(0.45 * a).toFixed(3)}) 22%, rgba(217,32,46,${(0.22 * a).toFixed(3)}) 44%, rgba(217,32,46,0) 70%)` }} />
      <AbsoluteFill style={{ background: `rgba(255,230,226,${(0.12 * a).toFixed(3)})` }} />
    </AbsoluteFill>
  );
};

const SmokeRing: React.FC<{ f: number }> = ({ f }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const t = f - RING_T0;
  if (t < 0) return null;
  const grow = Easing.out(Easing.cubic)(Math.min(1, t / 52));
  const R = 46 + 330 * grow + Math.max(0, t - 52) * 1.6;
  const op = interpolate(t, [0, 4, 30, 60], [0, 1, 0.94, 0.76], { extrapolateRight: "clamp" });
  const w = R * interpolate(t, [0, 52], [0.36, 0.27], { extrapolateRight: "clamp" });
  const disp = 60 + grow * 90;
  const rot = t * 0.35;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          {[["A", "0.013 0.016", 4, 11, 1], ["B", "0.021 0.018", 4, 37, 0.85], ["C", "0.019 0.023", 3, 73, 1.1]].map(([id, bf, oct, seed, k]) => (
            <filter key={id as string} id={`smoke${id}-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
              <feTurbulence type="fractalNoise" baseFrequency={bf as string} numOctaves={oct as number} seed={seed as number} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={disp * (k as number)} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          ))}
          <linearGradient id={`ring-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsla(12 92% 80% / 0.92)" />
            <stop offset="38%" stopColor="hsla(356 84% 60% / 0.9)" />
            <stop offset="100%" stopColor="hsla(348 80% 38% / 0.9)" />
          </linearGradient>
        </defs>
        <g transform={`rotate(${rot} ${CX} ${CY})`} opacity={op}>
          <g style={{ filter: `url(#smokeA-${uid})` }}>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="hsla(354 75% 48% / 0.3)" strokeWidth={w * 1.9} style={{ filter: "blur(22px)" }} />
          </g>
          <g style={{ filter: `url(#smokeA-${uid})` }}>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke={`url(#ring-${uid})`} strokeWidth={w} style={{ filter: "blur(9px)" }} opacity={0.88} />
          </g>
          <g style={{ filter: `url(#smokeB-${uid})` }}>
            <circle cx={CX} cy={CY} r={R * 0.99} fill="none" stroke="hsla(8 95% 90% / 0.6)" strokeWidth={w * 0.42} style={{ filter: "blur(6px)" }} />
          </g>
          <g style={{ filter: `url(#smokeC-${uid})` }}>
            <circle cx={CX} cy={CY} r={R * 1.005} fill="none" stroke="hsla(350 50% 6% / 0.4)" strokeWidth={w * 0.4} style={{ filter: "blur(7px)" }} />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ---------- marker stroke (shelf `marker-underline-title`), drawn in brand red behind the words ---------- */
const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const buildStroke = (len: number, seed: number) => {
  const rand = mulberry32(seed);
  const N = 40;
  const top: string[] = [];
  const bot: string[] = [];
  const wob = Array.from({ length: N + 1 }, () => rand() - 0.5);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = t * len;
    const mid = 19 - t * 9 + Math.sin(t * Math.PI * 1.6 + 0.4) * 2.6 + wob[i] * 1.6;
    const wBase = 14 + Math.sin(t * Math.PI) * 6 - Math.max(0, t - 0.86) * 46 - Math.max(0, 0.06 - t) * 70;
    const w = Math.max(2.2, wBase + wob[i] * 3);
    top.push(`${x.toFixed(1)},${(mid - w / 2).toFixed(1)}`);
    bot.push(`${x.toFixed(1)},${(mid + w / 2).toFixed(1)}`);
  }
  return `M${top.join("L")}L${bot.reverse().join("L")}Z`;
};
const MARK_LEN = 252;
const MARK_PATH = buildStroke(MARK_LEN, 77);
// height is the stroke's weight, kept at its round-4 value so a longer line stretches the stroke instead of thickening it
const Marker: React.FC<{ draw: number; width: number; height?: number }> = ({ draw, width, height = 84 }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const k = height / 44;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${MARK_LEN} 44`} preserveAspectRatio="none" style={{ position: "absolute", left: -0.04 * width, bottom: -16 * k, overflow: "visible", zIndex: -1 }}>
      <defs>
        <clipPath id={`r-${uid}`}><rect x={0} y={-20} width={draw * (MARK_LEN + 6)} height={60} /></clipPath>
        <filter id={`d-${uid}`} x="-5%" y="-40%" width="110%" height="180%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.09 0.5" numOctaves={2} seed={7} result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale={1.8} xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.9" numOctaves={2} seed={19} result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -16 11.4" result="holes" />
          <feComposite in="rough" in2="holes" operator="in" />
        </filter>
      </defs>
      {draw > 0 && <g clipPath={`url(#r-${uid})`}><path d={MARK_PATH} fill={RED} fillOpacity={0.9} filter={`url(#d-${uid})`} /></g>}
    </svg>
  );
};

const Words: React.FC<{ f: number; at: number; text: string; italic?: boolean }> = ({ f, at, text, italic }) => (
  <>
    {text.split(" ").map((w, i) => {
      const p = ramp(f, at + i * 4, 14, EASE.snappy);
      return (
        <span key={i} style={{ display: "inline-block", marginRight: "0.24em", opacity: p, filter: `blur(${((1 - p) * 14).toFixed(2)}px)`,
          transform: `translateY(${((1 - p) * 18).toFixed(2)}px)`, ...(italic ? { fontStyle: "italic", fontWeight: 400 } : null) }}>{w}</span>
      );
    })}
  </>
);

export const Tumble: React.FC = () => {
  const g = useCurrentFrame();
  const f = g - T0;
  const st = f - MARK_T0;
  const slam = ramp(f, MARK_T0, 14, EASE.snappy);
  const markScale = mix(1.22, 1, slam) + Math.max(0, st - 14) * 0.0008;
  const glowK = 0.6 + 0.4 * Math.exp(-Math.max(0, st) / 10);
  const fadeIn = ramp(f, -5, 6, EASE.out);
  const draw = ramp(f, MARK_T0 + 40, 12, EASE.swift);
  return (
    <AbsoluteFill style={{ background: "#0b0708", opacity: fadeIn }}>
      <Backdrop f={f} />
      {f < CARD_OUT[1] + 2 && (
        <AbsoluteFill style={{ perspective: 1500 }}>
          {CARDS.map((c, i) => {
            let pose: Pose;
            let op = 1;
            const d = idleAt(f);
            if (f < FLIGHT[0]) pose = c.k[0];
            else if (f < CARD_OUT[0]) {
              const raw = Math.min(1, (f - FLIGHT[0]) / (FLIGHT[1] - FLIGHT[0]));
              const p = splinePose(c.k, Easing.out(Easing.cubic)(raw));
              pose = { ...p, ry: p.ry + d.ry, rx: p.rx + d.rx, rz: p.rz + d.rz };
            } else {
              const r = Math.min(1, (f - CARD_OUT[0]) / (CARD_OUT[1] - CARD_OUT[0]));
              const from = { ...c.k[2], ry: c.k[2].ry + d.ry, rx: c.k[2].rx + d.rx, rz: c.k[2].rz + d.rz };
              pose = lerpPose(from, c.conv, Easing.in(Easing.quad)(r));
              op = 1 - Easing.in(Easing.cubic)(Math.max(0, (r - 0.55) / 0.45));
            }
            return (
              <div key={i} style={{ position: "absolute", left: CX - c.w / 2, top: CY - c.h / 2, width: c.w, height: c.h, opacity: op, zIndex: 10 + i,
                transform: `translate3d(${pose.x}px, ${pose.y}px, 0) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) rotateZ(${pose.rz}deg) scale(${pose.s})` }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden",
                  boxShadow: "0 0 0 1px rgba(255,140,140,0.22), 0 0 50px rgba(217,32,46,0.36), 0 20px 50px rgba(0,0,0,0.65)" }}>
                  <Img src={staticFile(c.src)} style={{ width: c.w, height: c.h, display: "block" }} />
                  {i < 2 && <div style={{ position: "absolute", inset: 0, background: "#0b0708", opacity: i === 0 ? 0.22 : 0.1 }} />}
                </div>
              </div>
            );
          })}
        </AbsoluteFill>
      )}
      <SmokeRing f={f} />
      <CoreFlash f={f} />
      {st >= 0 && (
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 0, right: 0, top: CY - 112, display: "flex", justifyContent: "center",
            opacity: ramp(f, MARK_T0, 5, EASE.out), transform: `scale(${markScale.toFixed(4)})`,
            filter: `drop-shadow(0 0 ${(18 * glowK).toFixed(1)}px rgba(255,90,100,${(0.6 * glowK).toFixed(3)})) drop-shadow(0 0 ${(64 * glowK).toFixed(1)}px rgba(217,32,46,${(0.55 * glowK).toFixed(3)}))` }}>
            <Img src={staticFile("brand/campusai-logo-white.svg")} style={{ width: 860, height: 860 * (53 / 223), display: "block" }} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: CY + 260, textAlign: "center", fontFamily: "Zodiak", fontWeight: 700, fontSize: 66,
            lineHeight: 1.16, letterSpacing: "-0.02em", color: "#fff" }}>
            <div><Words f={f} at={MARK_T0 + 18} text="Your personalized" /></div>
            <div><Words f={f} at={MARK_T0 + 30} text="student" italic /><span style={{ position: "relative", display: "inline-block", isolation: "isolate" }}>
              <Marker draw={draw} width={640} />
              <Words f={f} at={MARK_T0 + 34} text="operating system." italic />
            </span></div>
          </div>
        </AbsoluteFill>
      )}
      <Vignette strength={0.5} inner={0.48} color="#060304" />
      <Grain opacity={0.08} blend="soft-light" />
    </AbsoluteFill>
  );
};
