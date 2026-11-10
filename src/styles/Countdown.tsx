/**
 * /countdown (2026-11-10, name from Shaan Johari's "Black Friday Styles Part 6, made with Claude Code" reel via Muse;
 * his prompts are DM-gated and were never seen, so this is our own build). An airy product shot: a dawn sky going from
 * pale blue to rose at the horizon, soft clouds drifting, a glossy white round podium with the product standing on it,
 * a glossy red sphere floating beside it. At the top a white pill counter with four digit pairs (days, hours, minutes,
 * seconds) rolls in like a slot machine and lands, then the seconds tick down once a second; at the bottom a white
 * search bar types the address letter by letter.
 *
 * The count is arithmetic, never typed in: `target` minus `asOf`, both ISO times with their offset, and each tick takes
 * one second off. The product on the podium is a REAL capture, never rebuilt UI. The reel's ground was sky blue; this
 * one runs blue into rose because pure blush is already Before After's and Laptop Reveal's, and pure blue has no red,
 * so the red lives in the sphere, the colons and the search glyph.
 *
 * Motion in numbers (30 fps): each digit rolls in over 9 frames (0.3 s, as in the reel), scrolling down through 12
 * digits with a vertical blur that fades as it slows, the four pairs staggered 3 frames apart from frame 4. The first
 * tick lands on frame 36 and one follows every 30 frames, each changed digit rolling down one place over 6 frames.
 * Typing starts at frame 24, 3 frames a letter, the caret blinking every 16 frames. The sphere bobs 14 px behind the slab on a 3 s sine,
 * the clouds drift 0.4 px a frame, and the camera pushes in 4% over the piece.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE } from "../system/motion";
import { loadFont } from "@remotion/google-fonts/Fredoka";
import { B, Cue, clamp, ramp } from "./common";
import { World } from "./world";

const { fontFamily: FREDOKA } = loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

// its own world: a dawn sky, glossy white plastic, one glossy red sphere
const SKY = "linear-gradient(180deg, #A8C4EA 0%, #C9DAF2 34%, #EED7DE 64%, #F8E2DE 82%, #F4D2CF 100%)";
const INK = "#2E1016";
const RED = "#D9202E";
const WHITE = "#FFFFFF";

type Shot = { src: string; w: number; h: number; crop: { x: number; y: number; w: number; h: number } };

export type CountdownProps = {
  /** The line above the counter, sentence case: what the count runs to. */
  lead: string;
  /** The moment the count runs to, ISO with its offset, e.g. "2026-12-14T00:00:00-05:00". */
  target: string;
  /** The moment the count starts from (the "as of"), ISO with its offset. */
  asOf: string;
  /** The four labels under the pairs. */
  units?: [string, string, string, string];
  /** What the search bar types. */
  url: string;
  /** The product on the podium: a real capture and the part to show. */
  product: Shot;
  source: string;
  cta?: string;
};

const ROLL = 9;
const ROLL_AT = 4;
const STAGGER = 3;
const FIRST_TICK = 36;
const TICK = 30;
const TYPE_AT = 24;
const PER_CHAR = 3;
const DH = 150; // digit cell height

export const countdownPlan = (p: CountdownProps) => {
  const typed = TYPE_AT + p.url.length * PER_CHAR;
  // at least four ticks, and long enough to read the lead and the source
  const end = Math.max(FIRST_TICK + TICK * 4 + 6, typed + 50);
  return { typed, end };
};
export const countdownEnd = (p: CountdownProps) => countdownPlan(p).end;

/** Seconds from `asOf` to `target`, worked out from the two dates. */
export const countdownSeconds = (p: CountdownProps) => Math.round((Date.parse(p.target) - Date.parse(p.asOf)) / 1000);

const split = (s: number) => {
  const v = Math.max(0, s);
  return [Math.floor(v / 86400), Math.floor((v % 86400) / 3600), Math.floor((v % 3600) / 60), v % 60];
};

/** One digit window: a strip of digits scrolling down, blurred while fast. `pos` is how many places it still has to fall. */
const Digit: React.FC<{ strip: number[]; pos: number; speed: number }> = ({ strip, pos, speed }) => {
  const blur = speed > 0.9 ? "url(#cd-blur3)" : speed > 0.45 ? "url(#cd-blur2)" : speed > 0.12 ? "url(#cd-blur1)" : undefined;
  return (
    <div style={{ position: "relative", width: 82, height: DH, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 82, transform: `translateY(${(pos * DH).toFixed(2)}px)`, filter: blur }}>
        {strip.map((d, i) => (
          <div key={i} style={{ position: "absolute", left: 0, width: 82, top: -i * DH, height: DH, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: FREDOKA, fontWeight: 600, fontSize: 132, color: INK, fontVariantNumeric: "tabular-nums" }}>{d}</div>
        ))}
      </div>
    </div>
  );
};

export const Countdown: React.FC<CountdownProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { end } = countdownPlan(p);
  const units = p.units ?? ["days", "hours", "min", "sec"];
  const total = countdownSeconds(p);
  const ticks = f < FIRST_TICK ? 0 : Math.floor((f - FIRST_TICK) / TICK) + 1;
  const tickAt = FIRST_TICK + (ticks - 1) * TICK;
  const now = split(total - ticks);
  const before = split(total - Math.max(0, ticks - 1));
  const push = interpolate(f, [0, end], [1, 1.04], clamp);
  const bob = Math.sin((f / 90) * Math.PI * 2) * 14;
  const cloud = f * 0.4;

  // the product slab on the podium
  const slabW = 480;
  const slabH = slabW * (p.product.crop.h / p.product.crop.w);
  const podTop = 1190; // everything sits above the bottom 330 px the app's own controls cover
  const s = slabW / p.product.crop.w;

  // typing
  const shown = Math.max(0, Math.min(p.url.length, Math.floor((f - TYPE_AT) / PER_CHAR) + 1));
  const caretOn = Math.floor(f / 16) % 2 === 0 || (f >= TYPE_AT && shown < p.url.length);
  const barK = ramp(f, 8, 20, CURVE.quiet.enter);

  const pairs = now.map((v, g) => {
    const digits = String(v).padStart(2, "0").slice(-2).split("").map(Number);
    const prev = String(before[g]).padStart(2, "0").slice(-2).split("").map(Number);
    return digits.map((d, k) => {
      const start = ROLL_AT + g * STAGGER + k;
      if (f < start + ROLL) {
        // the roll in: every window is already spinning on frame one and stops in turn, the last 9 frames slowing onto
        // the landed digit; it falls 1.4 places a frame at full speed
        const stop = start + ROLL;
        const n = Math.round(stop * 1.4);
        const e = ramp(f, 0, stop, CURVE.showy.enter);
        const strip = [...Array(n + 1)].map((_, i) => (d + i) % 10);
        return <Digit key={k} strip={strip} pos={n * (1 - e)} speed={Math.min(1.6, (stop - f) / ROLL)} />;
      }
      if (ticks > 0 && d !== prev[k] && f < tickAt + 6) {
        const e = ramp(f, tickAt, tickAt + 6, CURVE.quiet.enter);
        return <Digit key={k} strip={[d, prev[k]]} pos={1 - e} speed={(1 - e) * 0.6} />;
      }
      return <Digit key={k} strip={[d]} pos={0} speed={0} />;
    });
  });

  return (
    <World endAt={end} cta={p.cta} font={FREDOKA} fontWeight={600} ink={INK} logo="dark" logoSpot="none" end="wipe-up" endGround="linear-gradient(180deg, #F8E2DE, #EFC6C6)" ground={SKY}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="cd-blur1"><feGaussianBlur stdDeviation="0 3" /></filter>
        <filter id="cd-blur2"><feGaussianBlur stdDeviation="0 7" /></filter>
        <filter id="cd-blur3"><feGaussianBlur stdDeviation="0 12" /></filter>
      </svg>
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})`, transformOrigin: "50% 50%" }}>
        {/* soft clouds */}
        {[
          { x: 120, y: 700, w: 520, h: 120, k: 1 },
          { x: 640, y: 820, w: 600, h: 140, k: 0.7 },
          { x: -200, y: 980, w: 700, h: 150, k: 0.5 },
          { x: 700, y: 640, w: 380, h: 90, k: 1.2 },
        ].map((c, i) => (
          <div key={i} style={{ position: "absolute", left: c.x + cloud * c.k, top: c.y, width: c.w, height: c.h, borderRadius: "50%", background: "rgba(255,255,255,.7)", filter: "blur(30px)" }} />
        ))}
        {/* the horizon floor */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 1240, bottom: 0, background: "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,240,238,.7) 30%, #F6DCD8)" }} />

        {/* the glossy white podium, two tiers */}
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="cd-side" x1="0" x2="1">
              <stop offset="0" stopColor="#E4DCE2" /><stop offset="0.32" stopColor="#FFFFFF" /><stop offset="0.5" stopColor="#F7F2F4" /><stop offset="1" stopColor="#D8CDD4" />
            </linearGradient>
            <radialGradient id="cd-top" cx="0.42" cy="0.4" r="0.7">
              <stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#EEE6EA" />
            </radialGradient>
            <radialGradient id="cd-ball" cx="0.34" cy="0.3" r="0.75">
              <stop offset="0" stopColor="#FF8A8E" /><stop offset="0.35" stopColor={RED} /><stop offset="0.85" stopColor="#7E0E18" /><stop offset="1" stopColor="#5A0812" />
            </radialGradient>
          </defs>
          <ellipse cx={width / 2} cy={podTop + 252} rx={480} ry={30} fill="#B98C92" opacity={0.26} />
          {/* lower tier */}
          <path d={`M${width / 2 - 470},${podTop + 142} L${width / 2 - 470},${podTop + 196} A470,52 0 0 0 ${width / 2 + 470},${podTop + 196} L${width / 2 + 470},${podTop + 142} Z`} fill="url(#cd-side)" />
          <ellipse cx={width / 2} cy={podTop + 142} rx={470} ry={52} fill="url(#cd-top)" />
          {/* upper tier */}
          <path d={`M${width / 2 - 400},${podTop} L${width / 2 - 400},${podTop + 120} A400,56 0 0 0 ${width / 2 + 400},${podTop + 120} L${width / 2 + 400},${podTop} Z`} fill="url(#cd-side)" />
          <ellipse cx={width / 2} cy={podTop} rx={400} ry={56} fill="url(#cd-top)" />
          <ellipse cx={width / 2 - 120} cy={podTop - 16} rx={170} ry={14} fill="#FFFFFF" opacity={0.9} />
          {/* the slab's soft shadow on the podium */}
          <ellipse cx={width / 2} cy={podTop + 6} rx={slabW / 2 - 20} ry={16} fill="#8C5F68" opacity={0.28} />
        </svg>

        {/* the glossy red sphere, floating behind the slab's shoulder */}
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          
          <circle cx={286} cy={podTop - slabH + 120 + bob} r={92} fill="url(#cd-ball)" />
          <ellipse cx={256} cy={podTop - slabH + 84 + bob} rx={28} ry={17} fill="#FFFFFF" opacity={0.7} transform={`rotate(-30 256 ${podTop - slabH + 84 + bob})`} />
        </svg>
        {/* the product, standing on the podium */}
        <div style={{ position: "absolute", left: (width - slabW) / 2, top: podTop - slabH, width: slabW, height: slabH, borderRadius: 26, overflow: "hidden",
          boxShadow: "0 0 0 9px #FFFFFF, 0 24px 60px rgba(120,60,72,.35)", background: "#120608" }}>
          <Img src={staticFile(p.product.src)} style={{ position: "absolute", left: -p.product.crop.x * s, top: -p.product.crop.y * s, width: p.product.w * s, height: p.product.h * s }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(150deg, rgba(255,255,255,.16), transparent 35%)" }} />
        </div>

      </AbsoluteFill>

      {/* the brand line and the lead */}
      <Img src={staticFile(B.logo!.onLight)} style={{ position: "absolute", left: width / 2 - 100, top: 104, width: 200, height: "auto", opacity: ramp(f, 3, 12, CURVE.quiet.enter) }} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 196, textAlign: "center", fontFamily: FREDOKA, fontWeight: 500, fontSize: 54, color: INK,
        opacity: ramp(f, 2, 12, CURVE.quiet.enter) }}>{p.lead}</div>

      {/* the counter pill */}
      <div style={{ position: "absolute", left: 50, right: 50, top: 300, height: 260, borderRadius: 72, background: WHITE,
        boxShadow: "0 24px 60px rgba(120,70,90,.22), inset 0 -6px 0 rgba(200,180,190,.25)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        opacity: ramp(f, 0, 6), transform: `scale(${(0.94 + 0.06 * ramp(f, 0, 8, CURVE.showy.enter)).toFixed(3)})` }}>
        {pairs.map((pair, g) => (
          <React.Fragment key={g}>
            {g > 0 ? <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 96, color: RED, marginTop: -54, width: 26, textAlign: "center" }}>:</div> : null}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", marginTop: -10 }}>{pair}</div>
              <div style={{ fontFamily: FREDOKA, fontWeight: 500, fontSize: 32, color: INK, opacity: 0.6, marginTop: -8 }}>{units[g]}</div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* the search bar */}
      <div style={{ position: "absolute", left: 80, right: 80, top: 1452, height: 112, borderRadius: 58, background: WHITE, display: "flex", alignItems: "center", gap: 22, padding: "0 40px",
        boxShadow: "0 18px 44px rgba(120,70,90,.2)", opacity: barK, transform: `translateY(${((1 - barK) * 30).toFixed(1)}px)` }}>
        <svg width={44} height={44} viewBox="0 0 44 44"><circle cx={19} cy={19} r={12.5} stroke={RED} strokeWidth={4.5} fill="none" />
          <path d="M28.5 28.5 L38 38" stroke={RED} strokeWidth={4.5} strokeLinecap="round" /></svg>
        <div style={{ fontFamily: FREDOKA, fontWeight: 500, fontSize: 48, color: INK, display: "flex", alignItems: "center" }}>
          {p.url.slice(0, f < TYPE_AT ? 0 : shown)}
          <span style={{ display: "inline-block", width: 4, height: 54, marginLeft: 4, background: RED, opacity: caretOn ? 1 : 0 }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, top: 580, textAlign: "center", fontFamily: FREDOKA, fontWeight: 400, fontSize: 28, color: INK, textWrap: "balance", opacity: 0.72 * ramp(f, 14, 26) }}>{p.source}</div>

      {[0, 1, 2, 3].map((g) => <Cue key={`r${g}`} at={ROLL_AT + g * STAGGER} name="counter" volume={0.35} />)}
      {[...Array(5)].map((_, i) => <Cue key={`t${i}`} at={FIRST_TICK + i * TICK} name="switch-tap" volume={0.3} />)}
      {[...Array(p.url.length)].map((_, i) => <Cue key={`k${i}`} at={TYPE_AT + i * PER_CHAR} name="typewriter-hit-soft" volume={0.16} />)}
    </World>
  );
};
