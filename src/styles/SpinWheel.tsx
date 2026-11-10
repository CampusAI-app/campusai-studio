/**
 * /spin-wheel (2026-11-10, name from Shaan Johari's "Black Friday Styles Part 6" reel, where it was /spin-to-win, via
 * Muse; his prompts were gated and never seen, so this is our own build). A game-show prize wheel on a deep oxblood
 * stage: a chrome rim studded with bulbs, red and oxblood wedges with their labels set radially, a fixed chrome hub
 * carrying the logo, a chrome flapper at the top that the rim pegs knock as they pass.
 *
 * The CampusAI twist is the point of the piece: a wheel picks at random and CampusAI does not. The wedges are real
 * things on the demo's events page, the wheel lands on one, then the nameplate on the stand turns over to the pick
 * line and the real event card (a capture, never rebuilt) rises out of the pedestal with its reason.
 *
 * Motion in numbers (30 fps): the wheel is already spinning on frame 0 (about 70 degrees a frame) and decelerates
 * over 118 frames with a quartic ease out through six turns, blurred while it is fast; the camera starts close and
 * low (scale 1.75, tilted 24 degrees up at the wheel) and levels to straight on over 32 frames. On the landing the
 * winning wedge brightens over 8 frames and the bulbs pulse together. About 1.5 s later the flapper lifts away, the
 * camera pulls back 16% and up to show the pedestal and its glowing ring, the wheel dims and the card springs up out
 * of the pedestal; a red line draws under the card's reason over 18 frames and the reason is quoted big above it.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as displayFont } from "@remotion/google-fonts/LilitaOne";
import { loadFont as textFont } from "@remotion/google-fonts/Figtree";
import { CURVE, readHold } from "../system/motion";
import { B, Cue, clamp, ramp } from "./common";
import { World } from "./world";

const { fontFamily: SHOW } = displayFont("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: TEXT } = textFont("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });

// its own world: a game-show stage in deep oxblood, a lacquered floor, out-of-focus marquee bulbs on the back wall
const RED = "#D9202E";
const HOT = "#FF4A3A";
const OX = "#5C0A14";
const INK = "#FFF1E6";
const BULB = "#FFE6C2";
const STAGE = "#2A0509";

export type SpinWheelProps = {
  /** The hook over the spinning wheel, a short question. */
  title: string;
  /** 6 to 10 wedges, each a real thing, short (a word or two). */
  segments: string[];
  /** Index of the wedge the wheel lands on. */
  land: number;
  /** On the stand's nameplate when the wheel lands. */
  randomLine: string;
  /** The nameplate turns over to this. */
  pickLine: string;
  /** One word of pickLine set in red. */
  pickRed?: string;
  /** A real capture of one pick, its pixel size, and the box (in capture pixels) of the reason line to underline. */
  card: { src: string; w: number; h: number; mark: { x: number; y: number; w: number } };
  /** The reason, exactly as the capture says it; quoted big. */
  reason: string;
  source: string;
  cta?: string;
};

const FPS = 30;
const SPIN = 118; // frames from full speed to the stop
const TURNS = 6;
const CAM = 32; // frames for the opening pull back and level

export const spinPlan = (p: SpinWheelProps) => {
  const land = SPIN;
  // the random line only has to land, not be studied: about 1.7 s, while the camera creeps in on the winner
  const twist = land + 8 + Math.min(44, Math.round(readHold(p.randomLine) * FPS * 0.6));
  const markAt = twist + 30;
  const quoteAt = markAt + 12;
  // the pick line has been up since the twist, so the hold is the reason's own reading time; the quote writes on
  // word by word at reading pace inside it, so the long read is never a held frame
  const end = quoteAt + Math.round(readHold(p.reason) * FPS);
  return { land, twist, markAt, quoteAt, end };
};
export const spinWheelEnd = (p: SpinWheelProps) => spinPlan(p).end;

// the wheel's angle (clockwise degrees) on a frame: full speed at 0, quartic ease out to the stop
const angleAt = (f: number, final: number) => {
  const t = Math.min(1, Math.max(0, f / SPIN));
  return final * (1 - Math.pow(1 - t, 4));
};

// a point at clock angle a (degrees from top, clockwise), radius r, around 0,0
const pt = (a: number, r: number) => {
  const rad = (a * Math.PI) / 180;
  return [r * Math.sin(rad), -r * Math.cos(rad)];
};
const wedge = (a0: number, a1: number, r: number) => {
  const [x0, y0] = pt(a0, r);
  const [x1, y1] = pt(a1, r);
  return `M0,0 L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
};

const Chrome: React.FC<{ id: string; x1?: string; y1?: string; x2?: string; y2?: string }> = ({ id, x1 = "0", y1 = "0", x2 = "1", y2 = "1" }) => (
  <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
    <stop offset="0" stopColor="#FFFFFF" />
    <stop offset="0.22" stopColor="#B9BBC2" />
    <stop offset="0.42" stopColor="#5E6068" />
    <stop offset="0.55" stopColor="#F4F4F7" />
    <stop offset="0.74" stopColor="#7C7E86" />
    <stop offset="1" stopColor="#D8D9DE" />
  </linearGradient>
);

export const SpinWheel: React.FC<SpinWheelProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { land, twist, markAt, quoteAt, end } = spinPlan(p);
  const n = p.segments.length;
  const seg = 360 / n;
  // land a little off the wedge's centre, the way a real wheel stops
  const final = TURNS * 360 - p.land * seg + seg * 0.2;
  const R = angleAt(f, final);
  const v = Math.abs(angleAt(f + 1, final) - R);
  const blur = interpolate(v, [3, 40], [0, 5], clamp);

  // the scene, in its own coordinates; the camera moves it
  const cx = width / 2;
  const cy = 880;
  const RIM = 440;
  const FACE = 398;
  const HUB = 122;
  const pedTop = 1590;

  // camera: close, low and tilted up, levelling over CAM frames; after the twist it pulls back and up to the pedestal
  const open = ramp(f, 0, CAM, CURVE.showy.enter);
  const back = ramp(f, twist, twist + 26, CURVE.quiet.standard);
  const creep = ramp(f, land, twist + 6, CURVE.quiet.standard) * (1 - back);
  const camScale = interpolate(open, [0, 1], [1.75, 1]) * interpolate(back, [0, 1], [1, 0.84]) * (1 + 0.05 * creep) * (1 - 0.03 * ramp(f, twist + 26, end, CURVE.quiet.standard));
  const camTilt = interpolate(open, [0, 1], [24, 0]);
  const camY = interpolate(open, [0, 1], [170, 0]) + interpolate(back, [0, 1], [0, -150]) + creep * 30;

  // the win: the wedge brightens and the bulbs pulse; the twist dims the wheel behind the card
  const win = ramp(f, land, land + 8, CURVE.quiet.enter) * (1 - ramp(f, twist + 4, twist + 18));
  const dim = ramp(f, twist + 4, twist + 22);
  const pulse = f >= land ? 0.5 + 0.5 * Math.cos(((f - land) / 7) * Math.PI) : 0;

  // the flapper: knocked by each peg as it passes, then lifted away at the twist
  const phase = (((R + seg / 2) % seg) + seg) % seg / seg;
  const knock = (phase > 0.8 ? (phase - 0.8) / 0.2 : Math.max(0, 1 - phase / 0.1)) * 20;
  const lift = ramp(f, twist, twist + 12, CURVE.showy.exit);

  // ticks: one for each peg passing the flapper, never closer than 2 frames
  const ticks: number[] = [];
  let last = -9;
  for (let k = 1; k <= land; k++) {
    const a = Math.floor((angleAt(k, final) + seg / 2) / seg);
    const b = Math.floor((angleAt(k - 1, final) + seg / 2) / seg);
    if (a !== b && k - last >= 2) { ticks.push(k); last = k; }
  }

  // the nameplate on the stand turns over from the random line to the pick line
  const plateIn = ramp(f, land + 4, land + 14, CURVE.quiet.enter);
  const turn = interpolate(f, [twist + 2, twist + 14], [0, 180], { ...clamp, easing: CURVE.quiet.standard });
  const plateFace = turn < 90 ? 0 : 1;
  const plateRot = plateFace === 0 ? turn : turn - 180;

  // the card springs up out of the pedestal
  const rise = spring({ frame: f - (twist + 10), fps, config: { damping: 15, stiffness: 95 } });
  const CW = 1000;
  const cs = CW / p.card.w;
  const CH = p.card.h * cs;
  const cardCy = 760;
  const pedScreen = cy + (pedTop - cy) * 0.84 - 150; // where the pedestal top lands after the pull back
  const cardY = interpolate(rise, [0, 1], [pedScreen - CH * 0.1, cardCy - CH / 2]);
  // a slow push on the card through the held read, so the last beat keeps moving
  const drift = ramp(f, twist + 30, end, CURVE.quiet.standard);
  const markK = ramp(f, markAt, markAt + 18, CURVE.quiet.standard);
  const quote = ramp(f, quoteAt, quoteAt + 14, CURVE.quiet.enter);
  const title = ramp(f, 2, 12, CURVE.quiet.enter) * (1 - ramp(f, land - 10, land, CURVE.quiet.exit));

  const pickWords = p.pickLine.split(" ");

  return (
    <World endAt={end} cta={p.cta} font={SHOW} fontWeight={400} ink={INK} logo="white" logoSpot="none" end="drop" endGround={OX}
      ground={`radial-gradient(ellipse 62% 40% at 50% 44%, #8E1520 0%, #4E0911 48%, ${STAGE} 100%)`}>
      {/* the back wall: out-of-focus marquee bulbs in three arcs, twinkling slowly */}
      <AbsoluteFill style={{ transform: `translateY(${(camY * 0.25).toFixed(1)}px) scale(${(1 + (camScale - 1) * 0.3).toFixed(4)})`, transformOrigin: `50% ${cy}px` }}>
        {[640, 760, 880].map((r, ring) =>
          [...Array(15 + ring * 4)].map((_, i, arr) => {
            const a = -80 + (160 * i) / (arr.length - 1);
            const [x, y] = pt(a, r);
            const tw = 0.35 + 0.25 * Math.sin(f / 11 + i * 1.7 + ring);
            return <div key={`${ring}-${i}`} style={{ position: "absolute", left: cx + x - 16, top: cy + y * 0.9 - 16, width: 32, height: 32, borderRadius: 16,
              background: BULB, opacity: tw * (0.5 - ring * 0.12), filter: "blur(9px)" }} />;
          }),
        )}
      </AbsoluteFill>
      {/* the lacquered floor and the pedestal ring's reflection in it */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1560 + camY * 0.6 + (back * 40), bottom: 0,
        background: `linear-gradient(180deg, rgba(10,1,3,.0) 0%, rgba(10,1,3,.55) 22%, #120205 100%)` }} />

      <AbsoluteFill style={{ perspective: 1500, perspectiveOrigin: `50% ${cy}px` }}>
        <AbsoluteFill style={{ transform: `translateY(${camY.toFixed(1)}px) scale(${camScale.toFixed(4)}) rotateX(${camTilt.toFixed(2)}deg)`, transformOrigin: `50% ${cy}px` }}>
          <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              <Chrome id="sw-chrome" />
              <Chrome id="sw-chrome-v" x1="0" y1="0" x2="0" y2="1" />
              <radialGradient id="sw-ring" cx="50%" cy="50%" r="50%">
                <stop offset="0.62" stopColor={HOT} stopOpacity={0} />
                <stop offset="0.82" stopColor={HOT} stopOpacity={0.95} />
                <stop offset="1" stopColor={HOT} stopOpacity={0} />
              </radialGradient>
              <linearGradient id="sw-ped" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#1C0306" />
                <stop offset="0.45" stopColor="#5A0B14" />
                <stop offset="0.6" stopColor="#7A1420" />
                <stop offset="1" stopColor="#1C0306" />
              </linearGradient>
            </defs>
            {/* the stand */}
            <rect x={cx - 34} y={cy + RIM - 20} width={68} height={pedTop - cy - RIM + 30} fill="url(#sw-chrome)" />
            {/* the pedestal: a drum with a glowing ring round its top */}
            <ellipse cx={cx} cy={pedTop + 150} rx={330} ry={58} fill="#0C0103" opacity={0.8} />
            <path d={`M${cx - 300},${pedTop} L${cx - 300},${pedTop + 140} A300,56 0 0 0 ${cx + 300},${pedTop + 140} L${cx + 300},${pedTop} Z`} fill="url(#sw-ped)" />
            <ellipse cx={cx} cy={pedTop} rx={300} ry={56} fill="#300509" />
            <ellipse cx={cx} cy={pedTop} rx={340} ry={80} fill="url(#sw-ring)" opacity={0.55 + 0.35 * back + 0.1 * Math.sin(f / 6)} />
            <ellipse cx={cx} cy={pedTop} rx={300} ry={56} fill="none" stroke={HOT} strokeWidth={5} opacity={0.9} />
            <ellipse cx={cx} cy={pedTop} rx={220} ry={38} fill="none" stroke="url(#sw-chrome)" strokeWidth={3} opacity={0.6} />
          </svg>

          {/* the wheel face and everything on it turns; the chrome rim and hub stay put so their light does not spin */}
          <div style={{ position: "absolute", left: cx - RIM, top: cy - RIM, width: RIM * 2, height: RIM * 2, opacity: 1 - dim * 0.62,
            filter: `${blur > 0.2 ? `blur(${blur.toFixed(2)}px) ` : ""}brightness(${(1 - dim * 0.25).toFixed(3)})` }}>
            <svg width={RIM * 2} height={RIM * 2} viewBox={`${-RIM} ${-RIM} ${RIM * 2} ${RIM * 2}`} style={{ position: "absolute", inset: 0, transform: `rotate(${R.toFixed(3)}deg)` }}>
              {p.segments.map((label, i) => {
                const a = i * seg;
                const isWin = i === p.land;
                const base = i % 2 === 0 ? RED : OX;
                const fill = isWin && win > 0 ? HOT : base;
                const fit = Math.min(58, (FACE - 30 - HUB - 26) / (label.length * 0.5));
                const world = (((a + final) % 360) + 360) % 360;
                const flip = world > 190 && world < 350;
                return (
                  <g key={label + i}>
                    <path d={wedge(a - seg / 2, a + seg / 2, FACE)} fill={fill} opacity={isWin ? 1 : 1 - win * 0.25} />
                    {isWin ? <path d={wedge(a - seg / 2, a + seg / 2, FACE)} fill="#FFD9B8" opacity={win * (0.12 + 0.12 * pulse)} /> : null}
                    {/* labels on the left half of the stopped wheel turn over so the held frame reads upright */}
                    <g transform={`rotate(${a - 90})`}>
                      <text x={flip ? HUB + 26 : FACE - 30} y={0} textAnchor={flip ? "start" : "end"} dominantBaseline="central" fontFamily={SHOW} fontSize={fit} fill={INK}
                        transform={flip ? `rotate(180 ${(FACE - 30 + HUB + 26) / 2} 0)` : undefined}
                        style={{ paintOrder: "stroke", stroke: "rgba(40,2,6,.35)", strokeWidth: 3 }}>{label}</text>
                    </g>
                  </g>
                );
              })}
              {/* wedge dividers, thin chrome */}
              {p.segments.map((_, i) => {
                const [x, y] = pt(i * seg + seg / 2, FACE);
                return <line key={`d${i}`} x1={0} y1={0} x2={x} y2={y} stroke="#F0D9CC" strokeOpacity={0.35} strokeWidth={3} />;
              })}
              {/* pegs at each divider */}
              {p.segments.map((_, i) => {
                const [x, y] = pt(i * seg + seg / 2, FACE + 4);
                return <circle key={`p${i}`} cx={x} cy={y} r={11} fill="url(#sw-chrome)" stroke="#2A2B30" strokeWidth={2} />;
              })}
            </svg>
            {/* the chrome rim, fixed so its highlights stay where the light is */}
            <svg width={RIM * 2} height={RIM * 2} viewBox={`${-RIM} ${-RIM} ${RIM * 2} ${RIM * 2}`} style={{ position: "absolute", inset: 0 }}>
              <circle r={RIM - 20} fill="none" stroke="url(#sw-chrome)" strokeWidth={40} strokeOpacity={0.9} style={{ mixBlendMode: "normal" }} />
              <circle r={RIM - 1} fill="none" stroke="#1A1B1F" strokeWidth={3} />
              <circle r={FACE + 1} fill="none" stroke="#2A2B30" strokeWidth={3} />
            </svg>
            <svg width={RIM * 2} height={RIM * 2} viewBox={`${-RIM} ${-RIM} ${RIM * 2} ${RIM * 2}`} style={{ position: "absolute", inset: 0, transform: `rotate(${R.toFixed(3)}deg)` }}>
              {[...Array(n * 3)].map((_, i) => {
                const a = (i * 360) / (n * 3);
                const [x, y] = pt(a, RIM - 20);
                const chase = f < land ? 0.45 + 0.55 * ((i + Math.floor(f / 3)) % 3 === 0 ? 1 : 0.25) : 0.55 + 0.45 * pulse * (1 - dim);
                return (
                  <g key={`c${i}`}>
                    <circle cx={x} cy={y} r={11} fill="#3A2A22" />
                    <circle cx={x} cy={y} r={8.5} fill={BULB} opacity={0.3 + chase * 0.7} />
                    <circle cx={x} cy={y} r={22} fill={BULB} opacity={chase * 0.28} style={{ filter: "blur(7px)" }} />
                  </g>
                );
              })}
            </svg>
          </div>
          {/* the hub, fixed: a chrome cap carrying the logo */}
          <div style={{ position: "absolute", left: cx - HUB, top: cy - HUB, width: HUB * 2, height: HUB * 2, borderRadius: HUB, opacity: 1 - dim * 0.55,
            background: "conic-gradient(from 200deg, #FFFFFF, #8C8E95, #F2F2F5, #55575E, #E2E3E7, #9A9CA3, #FFFFFF)", boxShadow: "0 10px 30px rgba(0,0,0,.55)" }}>
            <div style={{ position: "absolute", inset: 14, borderRadius: HUB, background: `radial-gradient(circle at 40% 35%, #6E0F19, ${STAGE})`, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "inset 0 4px 14px rgba(0,0,0,.6)" }}>
              <Img src={staticFile(B.logo!.onDark)} style={{ width: 170, height: "auto" }} />
            </div>
          </div>
          {/* the flapper at the top, knocked by the pegs */}
          <div style={{ position: "absolute", left: cx - 40, top: cy - RIM - 74, width: 80, height: 130, transformOrigin: "40px 28px",
            transform: `translateY(${(-lift * 260).toFixed(1)}px) rotate(${(-knock * (1 - lift) - lift * 30).toFixed(2)}deg)`, opacity: 1 - lift }}>
            <svg width={80} height={130} viewBox="0 0 80 130">
              <path d="M40,124 C30,96 14,62 14,34 A26,26 0 0 1 66,34 C66,62 50,96 40,124 Z" fill="url(#sw-chrome-v)" stroke="#1A1B1F" strokeWidth={3} />
              <circle cx={40} cy={30} r={10} fill={RED} stroke="#1A1B1F" strokeWidth={2} />
            </svg>
          </div>
          {/* the nameplate on the stand: the random line, turning over to the pick line */}
          <div style={{ position: "absolute", left: 90, right: 90, top: 1372, height: 150, perspective: 1200, opacity: plateIn, transform: `translateY(${((1 - plateIn) * 30).toFixed(1)}px)` }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 26, padding: 6, background: "linear-gradient(180deg, #FFFFFF, #8C8E95 45%, #E9E9EC 60%, #6B6D74)",
              transform: `rotateX(${plateRot.toFixed(2)}deg)`, boxShadow: "0 16px 40px rgba(0,0,0,.55)" }}>
              <div style={{ width: "100%", height: "100%", borderRadius: 21, background: plateFace === 0 ? `linear-gradient(180deg, #3A060C, ${STAGE})` : `linear-gradient(180deg, #4A0810, #2A0509)`,
                display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SHOW, fontSize: 66, color: INK, letterSpacing: "0.005em", whiteSpace: "nowrap" }}>
                {plateFace === 0 ? p.randomLine : pickWords.map((w, i) => {
                  const bare = w.replace(/[.,!?]$/, "");
                  const red = p.pickRed && bare === p.pickRed;
                  return <span key={i} style={{ color: red ? HOT : INK, marginRight: i < pickWords.length - 1 ? "0.24em" : 0 }}>{w}</span>;
                })}
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* the hook, over the spinning wheel */}
      <div style={{ position: "absolute", left: 60, right: 60, top: 160, textAlign: "center", fontFamily: SHOW, fontSize: 80, lineHeight: 1.0, color: INK,
        opacity: title, transform: `translateY(${((1 - title) * 18).toFixed(1)}px)`, textShadow: "0 6px 30px rgba(20,0,3,.7)" }}>{p.title}</div>

      {/* the real pick, rising out of the pedestal */}
      {f >= twist + 8 ? (
        <div style={{ position: "absolute", left: (width - CW) / 2, top: cardY, width: CW, height: CH, opacity: Math.min(1, rise * 4),
          transform: `perspective(1800px) rotateX(${((1 - rise) * 28).toFixed(2)}deg) scale(${((0.86 + 0.14 * rise) * (1 + 0.025 * drift)).toFixed(4)})`, transformOrigin: "50% 100%" }}>
          <div style={{ position: "absolute", inset: -40, borderRadius: 60, background: HOT, opacity: 0.22 * rise, filter: "blur(40px)" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: 26, overflow: "hidden", boxShadow: "0 40px 90px rgba(0,0,0,.65), 0 0 0 2px rgba(255,241,230,.10)" }}>
            <Img src={staticFile(p.card.src)} style={{ width: CW, height: CH, display: "block" }} />
          </div>
          {/* the red line under the reason, drawn on the real card */}
          <div style={{ position: "absolute", left: p.card.mark.x * cs, top: p.card.mark.y * cs, height: 6, borderRadius: 3, background: HOT,
            width: p.card.mark.w * cs * markK, boxShadow: `0 0 14px ${HOT}` }} />
        </div>
      ) : null}

      {/* the reason, quoted big above the card */}
      <div style={{ position: "absolute", left: 70, right: 70, top: 150, fontFamily: TEXT, fontWeight: 600, fontSize: 58, lineHeight: 1.16, color: INK, letterSpacing: "-0.01em",
        opacity: quote, transform: `translateY(${((1 - quote) * 16).toFixed(1)}px)` }}>
        <span style={{ fontFamily: SHOW, color: HOT, fontSize: 110, lineHeight: 0, verticalAlign: "-0.32em", marginRight: 8 }}>“</span>
        {(() => {
          let letters = 0;
          return p.reason.split(" ").map((w, i) => {
            const at = quoteAt + Math.round((letters / 15) * FPS * 0.8);
            letters += (w.match(/[\p{L}\p{N}]/gu) ?? []).length;
            const k = ramp(f, at, at + 6, CURVE.quiet.enter);
            return <span key={i} style={{ opacity: k, display: "inline-block", transform: `translateY(${((1 - k) * 10).toFixed(1)}px)`, marginRight: "0.26em" }}>{w}</span>;
          });
        })()}
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 1600, textAlign: "center", fontFamily: TEXT, fontWeight: 500, fontSize: 32, color: INK,
        opacity: 0.72 * ramp(f, quoteAt + 8, quoteAt + 20) }}>{p.source}</div>

      <Cue at={0} name="swoosh-slow" volume={0.35} />
      {ticks.map((t) => <Cue key={t} at={t} name="switch-tap" volume={interpolate(t, [0, land], [0.12, 0.3], clamp)} />)}
      <Cue at={land} name="chime-crystal" volume={0.55} />
      <Cue at={twist} name="air-woosh-quick" volume={0.4} />
      <Cue at={twist + 10} name="bass-hit-short" volume={0.45} />
      <Cue at={markAt} name="marker-pen-line" volume={0.4} />
    </World>
  );
};
