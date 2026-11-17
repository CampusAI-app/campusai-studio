/**
 * /stick-story (2026-11-16, from Shaan Johari's Animation Styles reel via Muse; his /ink-doodle, prompt DM-gated and
 * unseen, so this is our own build of the look. Our /ink-doodle name was already the notes-on-paper style, so this one
 * is /stick-story). Watched frame by frame: one flat hand-drawn scene (sky, clouds, a sign, a tree, a bench), a stick
 * figure with round white head and scribbled brown hair; wind throws things across from the right with speed lines,
 * a phone pops in top right with an overshoot, one red stroke lands on it, the figure's arms swing up behind the head.
 *
 * Ours, told student-first at Maryland (11/16 rule): the sign says who they are, a bubble asks the question, the things
 * a student juggles blow in and circle their head, the phone pops in with the real CampusAI logo, everything flies into
 * it, a red marker circle lands, and the student leans back. Same 4-frame boil as /pov-doodle; the logo stays crisp.
 */
import React from "react";
import { loadFont } from "@remotion/google-fonts/Caveat";
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE } from "../system/motion";
import { B, Cue, RED, clamp, ramp } from "./common";
import { McKeldin } from "./PovDoodle";
import { World } from "./world";

const { fontFamily: HAND } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

const INK = "#1B1414";
const SKY = "#BFE3F5";
const GRASS = "#9BCB6B";
const BRICK = "#C8664A";
const WOOD = "#B5763F";
const HAIR = "#7A4423";
const LEAF = "#6DAA45";

export type StickStoryProps = {
  /** The sign over the scene: who the student is. */
  sign: string;
  /** What they ask, in their own words. */
  ask: string;
  /** 3 or 4 short things that blow in and circle their head. */
  things: string[];
  /** The line once everything lands in the phone. */
  answer: string;
  /** Draw McKeldin behind the bench (Maryland), or leave the sky open. */
  place?: "mckeldin" | "none";
  source: string;
  cta?: string;
};

const GAP = 20; // frames between things blowing in
const firstIn = 40;
export const stickPlan = (p: StickStoryProps) => {
  const lastIn = firstIn + (p.things.length - 1) * GAP;
  const phone = lastIn + 46; // the circle runs a beat before the phone answers it
  const intoPhone = phone + 14;
  const lastInto = intoPhone + (p.things.length - 1) * 7 + 16;
  const relax = lastInto + 2;
  const circle = relax + 4;
  const answerAt = relax + 10;
  const end = answerAt + 78;
  return { lastIn, phone, intoPhone, relax, circle, answerAt, end };
};
export const stickEnd = (p: StickStoryProps) => stickPlan(p).end;

const line = { fill: "none", stroke: INK, strokeWidth: 6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpP = (a: [number, number], b: [number, number], t: number): [number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/** A drawn stroke that writes itself on over `dur` frames. */
const Drawn: React.FC<{ d: string; at: number; dur?: number; f: number; color?: string; w?: number; len?: number }> = ({ d, at, dur = 14, f, color = INK, w = 6, len = 1600 }) => {
  const k = ramp(f, at, at + dur, CURVE.quiet.enter);
  if (k <= 0) return null;
  return <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - k)} />;
};

const Cloud: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 40 Q0 10 30 12 Q40 -14 72 0 Q100 -10 112 18 Q140 18 138 40 Z" {...line} fill="#fff" strokeWidth={5 / s} />
);

/** A sheet of paper with a few words on it, the thing being juggled. */
const Sheet: React.FC<{ text: string }> = ({ text }) => (
  <g>
    <rect x={-135} y={-68} width={270} height={136} rx={8} {...line} fill="#fff" strokeWidth={5} />
    <path d="M-110 -40 H60 M-110 40 H90" stroke={INK} strokeOpacity={0.18} strokeWidth={4} strokeLinecap="round" />
    <text x={0} y={16} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={46} fill={INK}>{text}</text>
  </g>
);

const Bubble: React.FC<{ x: number; y: number; w: number; h: number; tail: [number, number]; text: string; k: number; size: number }> = ({ x, y, w, h, tail, text, k, size }) => {
  if (k <= 0) return null;
  const cx = x + w / 2;
  return (
    <g style={{ opacity: Math.min(1, k * 1.5) }} transform={`translate(${cx} ${y + h}) scale(${0.85 + 0.15 * k}) translate(${-cx} ${-(y + h)})`}>
      <path d={`M${x + w * 0.42} ${y + h - 2} L${tail[0]} ${tail[1]} L${x + w * 0.58} ${y + h - 2}`} {...line} fill="#fff" />
      <rect x={x} y={y} width={w} height={h} rx={h / 2} {...line} fill="#fff" />
      <path d={`M${x + w * 0.42 + 4} ${y + h - 3} H${x + w * 0.58 - 4}`} stroke="#fff" strokeWidth={8} />
      <text x={cx} y={y + h / 2 + size * 0.34} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={size} fill={INK}>{text}</text>
    </g>
  );
};

export const StickStory: React.FC<StickStoryProps> = (p) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const plan = stickPlan(p);
  const n = p.things.length;

  // the head and the orbit the things circle on
  const head: [number, number] = [540, 1075];
  const orbit = { cx: 540, cy: 1040, rx: 330, ry: 270 };
  const phoneC: [number, number] = [792, 598]; // inside the 1.2x world: lands at about (842, 640) on screen

  const windy = ramp(f, firstIn - 4, firstIn + 10) * (1 - ramp(f, plan.intoPhone, plan.relax));
  const worry = ramp(f, firstIn + GAP, firstIn + GAP + 10) * (1 - ramp(f, plan.relax - 4, plan.relax + 6));
  const calm = ramp(f, plan.relax, plan.relax + 14, CURVE.showy.enter);

  // the sign and the phone pop with an overshoot, the way the reel's phone does
  const signK = spring({ frame: f - 2, fps, config: { damping: 11, stiffness: 170 } });
  const phoneK = f < plan.phone ? 0 : spring({ frame: f - plan.phone, fps, config: { damping: 9, stiffness: 180 } });

  const askShown = Math.floor(Math.max(0, Math.min(p.ask.length, (f - 10) / 1.1)));
  const askK = ramp(f, 8, 16) * (1 - ramp(f, plan.phone - 10, plan.phone));
  const ansShown = Math.floor(Math.max(0, Math.min(p.answer.length, (f - plan.answerAt) / 1.1)));
  const ansK = ramp(f, plan.answerAt - 4, plan.answerAt + 6);

  // arms: hands on knees, flailing a little in the wind, then swung up behind the head
  const sh: [number, number][] = [[505, 1172], [575, 1172]];
  const elbowA: [number, number][] = [[462, 1232], [618, 1232]];
  const handA: [number, number][] = [[488, 1292], [592, 1292]];
  const elbowB: [number, number][] = [[418, 1062], [662, 1062]];
  const handB: [number, number][] = [[505, 1030], [575, 1030]];
  const flail = Math.sin(f * 0.9) * 16 * worry;
  const arm = (i: number) => {
    const e = lerpP(elbowA[i], elbowB[i], calm);
    const h = lerpP(handA[i], handB[i], calm);
    const s = i ? 1 : -1;
    return `M${sh[i][0]} ${sh[i][1]} L${e[0] + s * flail * 0.4} ${e[1] - Math.abs(flail)} L${h[0] + s * flail} ${h[1] - Math.abs(flail) * 2}`;
  };

  // scribbled mop of hair, blown left while the wind is up
  const blow = windy * (8 + Math.sin(f * 1.3) * 6);
  const hairPts: string[] = [];
  for (let k = 0; k <= 22; k++) {
    const a = Math.PI * (1.02 + (k / 22) * 0.96);
    const r = k % 2 ? 74 : 98 + ((k * 7) % 5) * 3;
    const lean = -blow * (0.4 + 0.6 * Math.max(0, Math.cos(a - Math.PI * 1.5)));
    hairPts.push(`${(head[0] + Math.cos(a) * r + lean).toFixed(1)},${(head[1] - 6 + Math.sin(a) * r).toFixed(1)}`);
  }
  const hair = `M${head[0] - 68},${head[1] + 4} L${hairPts.join(" L")} L${head[0] + 68},${head[1] + 4} Q${head[0]},${head[1] - 50} ${head[0] - 68},${head[1] + 4} Z`;

  const ex = [head[0] - 24, head[0] + 24];
  const ey = head[1] + 6;

  const logoW = 150;
  const logoH = logoW / B.logo!.ratio;

  return (
    <World endAt={plan.end} cta={p.cta} font={HAND} fontWeight={700} ink={INK} logo="dark" ground={SKY} logoSpot="top-left" end="iris" endGround={SKY}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="stickboil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={Math.floor(f / 4) % 7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: "url(#stickboil)" }}>
        <svg viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
          {/* the world is drawn 1.2x and lowered so the student fills the frame; sign and bubbles stay put */}
          <g transform="translate(540 1290) scale(1.2) translate(-540 -1140)">
          {/* the ground: sky, grass, McKeldin Mall's brick */}
          <rect x={0} y={0} width={1080} height={1190} fill={SKY} />
          <rect x={0} y={1190} width={1080} height={90} fill={GRASS} />
          <rect x={0} y={1280} width={1080} height={640} fill={BRICK} />
          {[...Array(11)].map((_, r) => (
            <g key={r}>
              <path d={`M0 ${1340 + r * 60} H1080`} stroke="#8E3B28" strokeWidth={3} />
              {[...Array(10)].map((__, c) => <path key={c} d={`M${c * 120 + (r % 2) * 60} ${1280 + r * 60} v60`} stroke="#8E3B28" strokeWidth={3} />)}
            </g>
          ))}
          <path d="M0 1190 H1080 M0 1280 H1080" {...line} />
          <Cloud x={130 + f * 0.35} y={560} s={1.1} />
          <Cloud x={760 - f * 0.25} y={420} s={0.9} />
          {p.place !== "none" ? (
            <g transform="translate(250 750)" opacity={0.6}>
              <McKeldin w={580} ink={INK} />
            </g>
          ) : null}

          {/* tree and lamp post */}
          <path d="M150 1250 C146 1150 158 1060 150 960" stroke="#7A4A26" strokeWidth={30} strokeLinecap="round" fill="none" />
          <path d="M150 1250 C146 1150 158 1060 150 960" {...line} strokeWidth={4} opacity={0.5} />
          {[[150, 880, 120], [70, 960, 80], [235, 950, 85], [150, 990, 70]].map(([x, y, r], i) => (
            <circle key={i} cx={x + Math.sin(f * 0.2 + i) * 4 * windy} cy={y} r={r} {...line} fill={LEAF} strokeWidth={5} />
          ))}
          <path d="M955 1260 V860 M925 860 H985 L975 820 H935 Z" {...line} fill="#fff" />

          {/* the bench, back slats behind the student */}
          <rect x={310} y={1150} width={460} height={28} rx={6} {...line} fill={WOOD} strokeWidth={5} />
          <rect x={310} y={1192} width={460} height={28} rx={6} {...line} fill={WOOD} strokeWidth={5} />
          <path d="M340 1150 V1290 M740 1150 V1290" {...line} />

          {/* the student: arms first so the head covers hands behind it */}
          <path d={arm(0)} {...line} strokeWidth={7} />
          <path d={arm(1)} {...line} strokeWidth={7} />
          <path d={`M540 1143 V1288`} {...line} strokeWidth={7} />
          <path d="M512 1300 L500 1400 H470 M568 1300 L580 1400 H610" {...line} strokeWidth={7} />
          <rect x={300} y={1282} width={480} height={32} rx={6} {...line} fill={WOOD} strokeWidth={5} />
          <path d="M330 1314 V1400 M750 1314 V1400" {...line} strokeWidth={8} />
          <circle cx={head[0]} cy={head[1]} r={68} {...line} fill="#fff" />
          <path d={hair} {...line} fill={HAIR} strokeWidth={5} />
          {/* face: open, then worried, then eyes shut and a grin */}
          {calm < 0.5 ? (
            <>
              <circle cx={ex[0]} cy={ey} r={6 + 3 * worry} fill={INK} />
              <circle cx={ex[1]} cy={ey} r={6 + 3 * worry} fill={INK} />
              <path d={`M${ex[0] - 14} ${ey - 22 + 6 * worry} L${ex[0] + 10} ${ey - 22 - 4 * worry} M${ex[1] + 14} ${ey - 22 + 6 * worry} L${ex[1] - 10} ${ey - 22 - 4 * worry}`} {...line} strokeWidth={4} opacity={worry} />
              <path d={worry > 0.5 ? `M${head[0] - 20} ${ey + 34} l10 -7 l10 7 l10 -7 l10 7` : `M${head[0] - 14} ${ey + 32} H${head[0] + 14}`} {...line} strokeWidth={4} />
              <path d={`M${head[0] + 66} ${head[1] - 30} q10 18 0 26 q-10 -8 0 -26`} {...line} fill="#8FD0F0" strokeWidth={3} opacity={worry} />
            </>
          ) : (
            <>
              <path d={`M${ex[0] - 12} ${ey} q12 -12 24 0 M${ex[1] - 12} ${ey} q12 -12 24 0`} {...line} strokeWidth={4} />
              <path d={`M${head[0] - 22} ${ey + 24} q22 22 44 0`} {...line} strokeWidth={4} />
            </>
          )}

          {/* the wind: leaves and streaks from the right */}
          {[0, 1, 2, 3, 4].map((i) => {
            const t = (f - firstIn + i * 9) / 36;
            if (windy <= 0 || t < 0) return null;
            const x = 1150 - ((t * 1300) % 1400);
            const y = 820 + i * 95 + Math.sin(t * 6 + i) * 30;
            return (
              <g key={i} opacity={windy}>
                <path d={`M${x + 40} ${y} h${90 + i * 10} M${x + 60} ${y + 16} h60`} {...line} strokeWidth={3} />
                <ellipse cx={x} cy={y} rx={16} ry={8} transform={`rotate(${f * 12 + i * 40} ${x} ${y})`} {...line} fill={LEAF} strokeWidth={3} />
              </g>
            );
          })}

          </g>
          {/* the sign */}
          <g transform={`translate(540 300) scale(${Math.max(0, signK)}) translate(-540 -300)`}>
            <rect x={150} y={232} width={780} height={136} rx={12} {...line} fill="#fff" />
            <text x={540} y={328} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={92} fill={INK}>{p.sign}</text>
          </g>

          <Bubble x={140} y={430} w={800} h={150} tail={[540, 1110]} text={p.ask.slice(0, askShown)} k={askK} size={80} />

          <g transform="translate(540 1290) scale(1.2) translate(-540 -1140)">
          {/* the phone, the logo goes on top of it outside the boil */}
          {phoneK > 0 ? (
            <g transform={`translate(${phoneC[0]} ${phoneC[1]}) scale(${phoneK}) rotate(${(1 - Math.min(1, phoneK)) * -18})`}>
              <rect x={-110} y={-195} width={220} height={390} rx={34} {...line} fill="#fff" strokeWidth={7} />
              <path d="M-30 -172 H30" {...line} strokeWidth={6} />
              <circle cx={0} cy={168} r={9} {...line} strokeWidth={4} />
            </g>
          ) : null}
          <Drawn f={f} at={plan.circle} dur={16} color={RED} w={10} len={1700}
            d={[...Array(27)].map((_, k) => {
              const a = -1.9 + (k / 26) * Math.PI * 2.2, rr = 1 + Math.sin(k * 1.9) * 0.04;
              return `${k ? "L" : "M"}${(phoneC[0] + Math.cos(a) * 165 * rr).toFixed(1)},${(phoneC[1] + Math.sin(a) * 250 * rr).toFixed(1)}`;
            }).join(" ")} />

          {/* the things blow in, circle the head, then fly into the phone */}
          {p.things.map((t, i) => {
            const at = firstIn + i * GAP;
            if (f < at) return null;
            const inK = ramp(f, at, at + 16, CURVE.showy.enter);
            const outAt = plan.intoPhone + i * 7;
            const outK = ramp(f, outAt, outAt + 16, CURVE.showy.exit);
            if (outK >= 1) return null;
            const ang = -2.6 + (i / n) * Math.PI * 2 * 0.62 + (f - firstIn) * 0.014;
            const slot: [number, number] = [orbit.cx + Math.cos(ang) * orbit.rx, orbit.cy + Math.sin(ang) * orbit.ry * 0.9 - 140];
            const from: [number, number] = [1300, 640 + i * 150];
            let pos = lerpP(from, slot, inK);
            pos = lerpP(pos, phoneC, outK);
            const rot = Math.sin(f * 0.15 + i * 2) * 10 + (1 - inK) * -30;
            const sc = lerp(1, 0.12, outK);
            return (
              <g key={i}>
                {inK < 1 ? <path d={`M${pos[0] + 150} ${pos[1] - 30} h${120 * (1 - inK)} M${pos[0] + 150} ${pos[1] + 20} h${80 * (1 - inK)}`} {...line} strokeWidth={4} opacity={1 - inK} /> : null}
                <g transform={`translate(${pos[0]} ${pos[1]}) rotate(${rot}) scale(${sc})`}>
                  <Sheet text={t} />
                </g>
              </g>
            );
          })}

          </g>
          <Bubble x={70} y={430} w={600} h={150} tail={[520, 1110]} text={p.answer.slice(0, ansShown)} k={ansK} size={74} />
        </svg>
      </AbsoluteFill>
      {/* the real logo on the phone, crisp: the product is never wobbled */}
      <AbsoluteFill>
        <svg viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
          {phoneK > 0 ? (<g transform="translate(540 1290) scale(1.2) translate(-540 -1140)">
            <g transform={`translate(${phoneC[0]} ${phoneC[1]}) scale(${phoneK}) rotate(${(1 - Math.min(1, phoneK)) * -18})`}>
              <image href={staticFile(B.logo!.onLight)} x={-logoW / 2} y={-logoH / 2 - 10} width={logoW} height={logoH} />
            </g></g>
          ) : null}
          <text x={540} y={1830} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={42} fill="#fff"
            opacity={interpolate(f, [plan.answerAt + 20, plan.answerAt + 32], [0, 0.9], clamp)}>{p.source}</text>
        </svg>
      </AbsoluteFill>
      <Cue at={2} name="switch-tap" volume={0.4} />
      <Cue at={firstIn - 4} name="air-woosh-quick" volume={0.45} />
      {p.things.map((_, i) => <Cue key={i} at={firstIn + i * GAP} name="paper-move-quick" volume={0.35} />)}
      <Cue at={plan.phone} name="hit-weak" volume={0.45} />
      <Cue at={plan.intoPhone} name="paper-slide" volume={0.4} />
      <Cue at={plan.circle} name="marker-pen-line" volume={0.45} />
    </World>
  );
};
