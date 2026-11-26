/**
 * ScreenLaunch (kit, 2026-11-25): the parts of a launch film that plays on one curved ultrawide monitor in a warm dark
 * room, the whole film on that screen. Read frame by frame from Roshan Studio's spec launch film for Kinso (Instagram,
 * 44 s, 9x16, music only), sent by Jacob through Muse ("lets remake this almost exactly for campusai"). Worked example:
 * `src/trials/post-kinso-campusai.tsx` (`PostKinso-9x16`, local, it carries the demo captures).
 *
 * Every part draws in the screen's own coordinates (a 1600 x 900 screen by default) and takes `f`, the frame counted
 * from the part's own start, so a film can sequence them by hand:
 *  - UltrawideRoom: the locked shot. A curved ultrawide on a desk, warm orange LED strip and back glow, keyboard and
 *    mouse in front. Children are the screen, `screen` px wide and tall.
 *  - GradientField: the soft light screen ground (coral bottom left, blush top right, a faint grid). Dark variant too.
 *  - PillWord: a giant word with a tall white pill of app icons standing in it as if it were a letter ("he[pill]re"),
 *    the letters on each side swapping to new ones around the pill ("some[pill]where"), then the pill tipping flat.
 *  - HalftoneCard: a word on a tilted white card over a halftone dot field, one letter a red pill that stretches wide
 *    and shrinks to a dot while the card settles small and flat ("W[o]ah").
 *  - HighlightSweep: a line whose last words get a gradient bar sweeping in behind them ("You are a really [busy Terp]").
 *  - BarSweep: a full-width gradient bar wiping across with one line in it, then opening to fill the screen.
 *  - StrokeMark: any SVG path drawn on as an outline stroke, then filled.
 *  - CountUp: a number counting to a target with commas and an optional suffix (tabular, so it does not jitter).
 *  - Orb: the soft glowing ball, any size, breathing.
 *  - Crosshair: the dark grid with thin white lines sliding across it.
 * Numbers (sizes, timing) were measured from the reference at 0.25 s steps; see each part.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const SL_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const SL_IN = Easing.bezier(0.55, 0, 0.85, 0.35);
export const SL_SWING = Easing.bezier(0.65, 0, 0.35, 1);
/** 0..1 between two frames with an easing. */
export const kk = (f: number, a: number, b: number, e: (t: number) => number = SL_OUT) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });
const mx = (a: number, b: number, t: number) => a + (b - a) * t;

/** The film's colours: a red family around the brand red, warm room light. */
export const SL = {
  ink: "#1b1517",
  inkSoft: "#6f6266",
  red: "#D9202E",
  coral: "#FF7A59",
  grad: "linear-gradient(90deg, #D9202E 0%, #F0473F 45%, #FF8A5C 100%)",
  room: "255, 132, 48",
};

/* ================================================================ the room */

/** Where the curved screen sits in a 1080 x 1920 frame, and how much its top and bottom edges bow. */
export const ULTRAWIDE = { x: 18, y: 612, w: 1044, bow: 16 };

/** The screen's outline in screen px: top and bottom edges bow in toward the middle, the way a curved panel reads. */
const screenPath = (w: number, h: number, bow: number) => `M0,0 Q${w / 2},${bow * 2} ${w},0 L${w},${h} Q${w / 2},${h - bow * 2} 0,${h} Z`;

const Grain: React.FC<{ f: number; amount: number }> = ({ f, amount }) => {
  const seed = Math.floor(random(`slg${f}`) * 1000);
  return (
    <AbsoluteFill style={{ opacity: amount, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={`slg${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter={`url(#slg${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

/**
 * The locked shot: a curved ultrawide monitor on a desk in a dark room lit warm orange. `glow` 0..1 is how bright the
 * screen is (it lights the wall and desk), `f` drives grain and a slow drift of the camera.
 */
export const UltrawideRoom: React.FC<{ f: number; screen?: [number, number]; glow?: number; zoom?: number; children: React.ReactNode }> = ({ f, screen = [1600, 900], glow = 1, zoom = 1, children }) => {
  const [sw, sh] = screen;
  const { x, y, w, bow } = ULTRAWIDE;
  const s = w / sw;
  const h = sh * s;
  const cx = x + w / 2;
  const deskTop = y + h + 150;
  const L = SL.room;
  // a hand-held drift, small: the reference camera is locked, ours breathes 0.6% so no frame is ever still
  const drift = (1 + 0.006 * Math.sin(f / 70)) * zoom; // zoom: the camera walking in on the screen when the product talks
  const dx = 3 * Math.sin(f / 53);
  const dy = 2 * Math.cos(f / 61);
  return (
    <AbsoluteFill style={{ background: "#0b0605", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${drift})`, transformOrigin: `${cx}px ${y + h / 2}px` }}>
        {/* the wall, warm and dark, lit from the strip and the screen */}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 95% 55% at 50% 38%, #2a140b 0%, #170a06 55%, #090404 100%)" }} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 22% at 50% ${((y + h / 2) / 19.2).toFixed(1)}%, rgba(${L}, ${0.34 * glow}) 0%, rgba(${L}, 0.08) 55%, rgba(0,0,0,0) 80%)`, mixBlendMode: "screen" }} />
        {/* the LED strip on the wall above the monitor */}
        <div style={{ position: "absolute", left: -20, top: y - 150, width: 1120, height: 6, borderRadius: 3, background: `rgba(${L}, 0.95)`, boxShadow: `0 0 18px 4px rgba(${L}, 0.8), 0 0 80px 26px rgba(${L}, 0.35)` }} />
        <div style={{ position: "absolute", left: -20, top: y - 150, width: 1120, height: 260, background: `linear-gradient(180deg, rgba(${L},0.16) 0%, rgba(0,0,0,0) 100%)` }} />
        {/* back glow around the panel */}
        <div style={{ position: "absolute", left: x - 30, top: y - 30, width: w + 60, height: h + 60, borderRadius: 40, boxShadow: `0 0 140px 50px rgba(${L}, ${0.22 * glow})` }} />
        {/* the stand */}
        <div style={{ position: "absolute", left: cx - 26, top: y + h, width: 52, height: 120, background: "linear-gradient(90deg,#090808,#1d1a18,#090808)" }} />
        <div style={{ position: "absolute", left: cx - 150, top: y + h + 112, width: 300, height: 22, borderRadius: 11, background: "linear-gradient(180deg,#24201d,#0a0908)" }} />
        {/* the desk: dark wood with the orange rim light on its front edge */}
        <div style={{ position: "absolute", left: 0, top: deskTop, width: 1080, height: 1920 - deskTop, background: "linear-gradient(180deg,#1c0f09 0%,#120905 45%,#070302 100%)" }} />
        <div style={{ position: "absolute", left: 0, top: deskTop, width: 1080, height: 3, background: `rgba(${L},0.55)`, boxShadow: `0 0 26px 6px rgba(${L},0.35)` }} />
        <div style={{ position: "absolute", left: 0, top: deskTop, width: 1080, height: 360, background: `radial-gradient(ellipse 60% 80% at 50% 0%, rgba(${L}, ${0.2 * glow}) 0%, rgba(0,0,0,0) 70%)`, mixBlendMode: "screen" }} />
        {/* keyboard and mouse, in shadow, an orange line along their near edges */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="slkb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a1715" /><stop offset="1" stopColor="#0a0908" /></linearGradient>
            <pattern id="slkeys" width="34" height="30" patternUnits="userSpaceOnUse"><rect x="2" y="2" width="29" height="25" rx="5" fill="#141110" stroke="#262220" strokeWidth="1" /></pattern>
          </defs>
          <polygon points={`200,${deskTop + 120} 800,${deskTop + 120} 850,${deskTop + 300} 150,${deskTop + 300}`} fill="url(#slkb)" />
          <polygon points={`214,${deskTop + 132} 786,${deskTop + 132} 830,${deskTop + 286} 170,${deskTop + 286}`} fill="url(#slkeys)" opacity={0.85} />
          <line x1={150} y1={deskTop + 301} x2={850} y2={deskTop + 301} stroke={`rgba(${L},0.55)`} strokeWidth={2} />
          <ellipse cx={940} cy={deskTop + 220} rx={50} ry={78} fill="url(#slkb)" />
          <path d={`M ${892} ${deskTop + 236} Q 940 ${deskTop + 312} 988 ${deskTop + 236}`} stroke={`rgba(${L},0.5)`} strokeWidth={2} fill="none" />
        </svg>
        {/* the bezel, bowed like the panel */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${x},${y}) scale(${s})`}>
            <path d={screenPath(sw, sh, bow)} fill="#060606" stroke="#060606" strokeWidth={30 / s} strokeLinejoin="round" />
            <path d={screenPath(sw, sh, bow)} fill="none" stroke="#2c2724" strokeWidth={2 / s} transform={`translate(${-14 / s},${-14 / s}) scale(${(sw + 28 / s) / sw},${(sh + 28 / s) / sh})`} />
          </g>
        </svg>
        {/* the screen */}
        <div style={{ position: "absolute", left: x, top: y, width: sw, height: sh, transform: `scale(${s})`, transformOrigin: "0 0", clipPath: `path('${screenPath(sw, sh, bow)}')`, overflow: "hidden", background: "#000" }}>
          {children}
          {/* the curve: the panel's ends turn toward us, so they catch a little more light and a little more falloff */}
          <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 12%, rgba(0,0,0,0) 88%, rgba(0,0,0,0.18) 100%)", pointerEvents: "none" }} />
          <AbsoluteFill style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 28%)", pointerEvents: "none" }} />
        </div>
        {/* falloff to the corners */}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 62% at 50% 46%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)" }} />
      </AbsoluteFill>
      <Grain f={f} amount={0.1} />
    </AbsoluteFill>
  );
};

/* ================================================================ grounds */

/** The light screen ground: coral bottom left, blush top right, near white middle, a faint grid. `dark` for the black one. */
export const GradientField: React.FC<{ dark?: boolean; grid?: number; shift?: number }> = ({ dark = false, grid = 1, shift = 0 }) =>
  dark ? (
    <AbsoluteFill style={{ background: "#070506" }}>
      <AbsoluteFill style={{ opacity: 0.07 * grid, backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "80px 80px", backgroundPosition: `${shift}px 0` }} />
    </AbsoluteFill>
  ) : (
    <AbsoluteFill style={{ background: "#f7f1ee" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 85% at ${-4 + shift}% 108%, rgba(244,128,96,0.95) 0%, rgba(247,166,140,0.55) 38%, rgba(247,241,238,0) 72%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 75% at ${104 - shift}% -6%, rgba(232,150,170,0.85) 0%, rgba(240,196,206,0.45) 40%, rgba(247,241,238,0) 74%)` }} />
      <AbsoluteFill style={{ opacity: 0.05 * grid, backgroundImage: "linear-gradient(rgba(60,20,20,1) 1px, transparent 1px), linear-gradient(90deg, rgba(60,20,20,1) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
    </AbsoluteFill>
  );

/* ================================================================ the pill in the word */

export type PillIcon = { src: string; fit?: "contain" | "cover"; bg?: string };

/**
 * A giant word with a pill of app icons standing in it as a letter. Centred on (cx, cy), in screen px.
 * Timeline (frames from `f` 0): `open` the letters part and the pill drops in, `badges` red dots pop one icon at a
 * time, `swap` the side letters leave and `left2`/`right2` slide in around the pill, `tip` the pill tips flat and slides
 * under the word while the word blurs away.
 */
export const PillWord: React.FC<{
  f: number;
  left: string;
  right: string;
  left2?: string;
  right2?: string;
  icons: PillIcon[];
  size: number;
  cx: number;
  cy: number;
  open: number;
  badges: number;
  swap?: number;
  tip?: number;
  font: string;
  /** Gradients on the left and right letters (before the swap), so one sweep runs across the whole word. */
  gradient?: [string, string];
}> = ({ f, left, right, left2, right2, icons, size, cx, cy, open, badges, swap, tip, font, gradient }) => {
  const pillW = size * 0.7;
  const pillH = size * 2.05;
  const o = kk(f, open, open + 14, SL_SWING);
  const gap = pillW * o + size * 0.08 * o;
  const sw = swap === undefined ? 0 : kk(f, swap, swap + 14, SL_SWING);
  const tp = tip === undefined ? 0 : kk(f, tip, tip + 14, SL_SWING);
  const wordBlur = tp * 26;
  const letters = (txt: string, side: "l" | "r", out: number, inn: number, isNew: boolean) => {
    const dir = side === "l" ? -1 : 1;
    const p = isNew ? 1 - inn : out;
    return (
      <span style={{ position: "absolute", [side === "l" ? "right" : "left"]: 0, top: 0, whiteSpace: "nowrap", opacity: isNew ? inn : 1 - out,
        transform: `translateX(${dir * p * size * 1.1}px)`, filter: `blur(${(p * 18).toFixed(1)}px)`,
        ...(gradient && !isNew ? { backgroundImage: gradient[side === "l" ? 0 : 1], WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : {}) }}>
        {txt}
      </span>
    );
  };
  const slot = size * 4;
  const drop = 1 - kk(f, open + 2, open + 16, SL_OUT);
  return (
    <div style={{ position: "absolute", left: cx, top: cy, width: 0, height: 0 }}>
      <div style={{ position: "absolute", left: 0, top: 0, filter: `blur(${wordBlur.toFixed(1)}px)`, opacity: 1 - tp * 0.9 }}>
        <div style={{ position: "absolute", right: gap / 2, top: -size * 0.62, width: slot, height: size * 1.3, fontFamily: font, fontSize: size, fontWeight: 400, letterSpacing: "-0.04em", color: SL.ink, lineHeight: 1.2 }}>
          {letters(left, "l", sw, 0, false)}
          {left2 ? letters(left2, "l", 0, sw, true) : null}
        </div>
        <div style={{ position: "absolute", left: gap / 2, top: -size * 0.62, width: slot, height: size * 1.3, fontFamily: font, fontSize: size, fontWeight: 400, letterSpacing: "-0.04em", color: SL.ink, lineHeight: 1.2 }}>
          {letters(right, "r", sw, 0, false)}
          {right2 ? letters(right2, "r", 0, sw, true) : null}
        </div>
      </div>
      {/* the pill: a tall white capsule, four icons, a red badge on each */}
      <div style={{ position: "absolute", left: -pillW / 2, top: -pillH / 2 + size * 0.04, width: pillW, height: pillH, borderRadius: pillW / 2.4,
        background: "rgba(255,255,255,0.96)", boxShadow: "0 18px 50px rgba(120,40,30,0.18), inset 0 0 0 1px rgba(0,0,0,0.05)", opacity: o,
        transform: `translateY(${(-drop * size * 0.9 + tp * size * 0.95).toFixed(1)}px) rotate(${(tp * 90).toFixed(1)}deg) scale(${(1 - tp * 0.25).toFixed(3)})`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly", padding: `${pillW * 0.12}px 0` }}>
        {icons.map((ic, i) => {
          const b = kk(f, badges + i * 4, badges + i * 4 + 6, Easing.out(Easing.back(2.2)));
          const t = pillW * 0.74;
          return (
            <div key={i} style={{ position: "relative", width: t, height: t, borderRadius: t * 0.24, background: ic.bg || "#fff", boxShadow: "0 3px 10px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible", transform: `rotate(${(-tp * 90).toFixed(1)}deg)` }}>
              <div style={{ width: "100%", height: "100%", borderRadius: t * 0.24, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Img src={staticFile(ic.src)} style={ic.fit === "cover" ? { width: "100%", height: "100%", objectFit: "cover" } : { width: "78%", height: "78%", objectFit: "contain" }} />
              </div>
              <div style={{ position: "absolute", right: -t * 0.12, top: -t * 0.12, width: t * 0.3, height: t * 0.3, borderRadius: "50%", background: SL.red, border: `${t * 0.04}px solid #fff`, transform: `scale(${b})` }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================================================================ the halftone card */

/** A halftone dot field: dense in the middle, gone at the edges. */
export const Halftone: React.FC<{ f: number; color?: string; amount?: number }> = ({ f, color = "232, 70, 50", amount = 1 }) => (
  <AbsoluteFill style={{ background: "#fbf3ef" }}>
    <AbsoluteFill style={{ opacity: amount, backgroundImage: `radial-gradient(circle, rgba(${color},0.9) 34%, rgba(${color},0) 38%)`, backgroundSize: "16px 16px",
      backgroundPosition: `${(f * 0.4) % 16}px 0`,
      WebkitMaskImage: "radial-gradient(ellipse 42% 58% at 50% 50%, #000 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0) 100%)", maskImage: "radial-gradient(ellipse 42% 58% at 50% 50%, #000 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0) 100%)" }} />
    <AbsoluteFill style={{ opacity: 0.55 * amount, background: `radial-gradient(ellipse 38% 50% at 50% 50%, rgba(${color},0.35) 0%, rgba(${color},0) 70%)` }} />
  </AbsoluteFill>
);

/**
 * "W[o]ah" on a white card. The middle letter is a red pill: a thin bar at 0, stretched wide by `stretch`, a dot by
 * `dot`; the card starts big and tilted (-20 deg) and settles small and flat by `settle` + 20.
 */
export const HalftoneCard: React.FC<{ f: number; before: string; after: string; size: number; stretch: number; dot: number; settle: number; font: string; cx?: number; cy?: number }> = ({ f, before, after, size, stretch, dot, settle, font, cx = 800, cy = 450 }) => {
  const st = kk(f, stretch, stretch + 12, SL_SWING);
  const dt = kk(f, dot, dot + 12, SL_SWING);
  const se = kk(f, settle, settle + 22, SL_SWING);
  const inK = kk(f, 0, 10, SL_OUT);
  const ow = mx(mx(size * 0.12, size * 1.2, st), size * 0.3, dt);
  const oh = mx(size * 0.66, size * 0.3, dt);
  const rot = mx(-20, 0, se) + (1 - inK) * -12;
  const sc = mx(1.25, 0.72, se) * mx(1.5, 1, inK);
  return (
    <div style={{ position: "absolute", left: cx, top: cy, transform: `translate(-50%,-50%) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`, opacity: inK }}>
      <div style={{ display: "flex", alignItems: "center", gap: size * 0.08, padding: `${size * 0.32}px ${size * 0.62}px`, background: "#fff", borderRadius: size * 0.38,
        boxShadow: `0 0 0 ${size * 0.06}px rgba(255,214,196,0.9), 0 30px 80px rgba(160,50,30,0.28)`, fontFamily: font, fontSize: size, fontWeight: 600, letterSpacing: "-0.03em", color: SL.ink, lineHeight: 1 }}>
        <span>{before}</span>
        <span style={{ display: "inline-block", width: ow, height: oh, borderRadius: oh / 2, background: SL.red, boxShadow: `0 0 ${size * 0.3}px rgba(217,32,46,0.45)` }} />
        <span>{after}</span>
      </div>
    </div>
  );
};

/* ================================================================ highlight and bar */

/** A line; the words in `mark` get a gradient bar sweeping in behind them at `sweep`, and turn white. Words land from `at`. */
export const HighlightSweep: React.FC<{ f: number; lead: string; mark: string; size: number; font: string; sweep: number; at?: number; color?: string; cx?: number; cy?: number }> = ({ f, lead, mark, size, font, sweep, at = 0, color = "#f5ecea", cx = 800, cy = 450 }) => {
  const words = lead.split(" ");
  const sw = kk(f, sweep, sweep + 10, SL_SWING);
  return (
    <div style={{ position: "absolute", left: cx, top: cy, transform: "translate(-50%,-50%)", display: "flex", alignItems: "center", gap: size * 0.26, fontFamily: font, fontSize: size, fontWeight: 400, letterSpacing: "-0.02em", color, whiteSpace: "nowrap" }}>
      {words.map((w, i) => {
        const p = kk(f, at + i * 3, at + i * 3 + 9);
        return <span key={i} style={{ opacity: p, transform: `translateY(${((1 - p) * size * 0.4).toFixed(1)}px)`, filter: `blur(${((1 - p) * 8).toFixed(1)}px)` }}>{w}</span>;
      })}
      <span style={{ position: "relative", padding: `${size * 0.04}px ${size * 0.16}px`, opacity: kk(f, at + words.length * 3, at + words.length * 3 + 9) }}>
        <span style={{ position: "absolute", inset: 0, borderRadius: size * 0.12, background: SL.grad, transformOrigin: "0 50%", transform: `scaleX(${sw})`, boxShadow: `0 ${size * 0.25}px ${size * 0.7}px rgba(217,32,46,${0.35 * sw})` }} />
        <span style={{ position: "relative", fontWeight: 600, color: sw > 0.5 ? "#fff" : color }}>{mark}</span>
      </span>
    </div>
  );
};

/** A gradient bar wipes across the middle with a line in it, then (from `open`) grows to fill the screen. */
export const BarSweep: React.FC<{ f: number; text: string; size: number; font: string; open?: number; w?: number; h?: number }> = ({ f, text, size, font, open, w = 1600, h = 900 }) => {
  const sweep = kk(f, 0, 10, SL_SWING);
  const t = kk(f, 6, 16);
  const op = open === undefined ? 0 : kk(f, open, open + 12, SL_SWING);
  const bh = mx(size * 2.2, h, op);
  return (
    <div style={{ position: "absolute", left: 0, top: h / 2 - bh / 2, width: w, height: bh, background: SL.grad, transformOrigin: "0 50%", transform: `scaleX(${sweep})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: font, fontSize: size, fontWeight: 600, color: "#fff", letterSpacing: "-0.02em", opacity: t * (1 - op), transform: `translateX(${((1 - t) * 40).toFixed(1)}px)` }}>{text}</span>
    </div>
  );
};

/* ================================================================ marks, counters, orbs */

/** An SVG path drawn on as a stroke over `draw` frames, then filled over `fill` frames. `box` is the path's viewBox. */
export const StrokeMark: React.FC<{ f: number; d: string; box: string; size: number; draw: number; fill: number; stroke?: string; fillPaint?: string; style?: React.CSSProperties }> = ({ f, d, box, size, draw, fill, stroke = SL.ink, fillPaint = SL.red, style }) => {
  const p = kk(f, 0, draw, SL_SWING);
  const q = kk(f, draw, draw + fill);
  const vb = box.split(" ").map(Number);
  const sw = (vb[2] / size) * 2.4;
  return (
    <svg viewBox={box} width={size} height={(size * vb[3]) / vb[2]} style={{ overflow: "visible", ...style }}>
      <defs><linearGradient id="slmark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF5068" /><stop offset="1" stopColor="#E21833" /></linearGradient></defs>
      <path d={d} fill={fillPaint === "spark" ? "url(#slmark)" : fillPaint} fillOpacity={q} stroke={stroke} strokeOpacity={1 - q} strokeWidth={sw} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} strokeLinejoin="round" />
    </svg>
  );
};

/** A number counting from 0 to `to` between frames `from` and `until`, commas in, `suffix` landing at the end. */
export const CountUp: React.FC<{ f: number; to: number; from: number; until: number; suffix?: string; style?: React.CSSProperties }> = ({ f, to, from, until, suffix = "", style }) => {
  const p = kk(f, from, until, Easing.bezier(0.2, 0.7, 0.2, 1));
  const n = Math.round(to * p);
  const sfx = kk(f, until - 2, until + 6, Easing.out(Easing.back(2)));
  return (
    <span data-snap="" style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", ...style }}>
      {n.toLocaleString("en-US")}
      <span style={{ display: "inline-block", width: `${(0.62 * sfx).toFixed(3)}em`, opacity: sfx, transform: `scale(${sfx})`, transformOrigin: "0 60%" }}>{suffix}</span>
    </span>
  );
};

/** The soft glowing ball. `r` radius in px. */
export const Orb: React.FC<{ f: number; x: number; y: number; r: number; opacity?: number }> = ({ f, x, y, r, opacity = 1 }) => {
  const b = 1 + 0.03 * Math.sin(f / 9);
  return (
    <div style={{ position: "absolute", left: x - r, top: y - r + Math.sin(f / 14) * r * 0.06, width: r * 2, height: r * 2, borderRadius: "50%", opacity, transform: `scale(${b})`,
      background: "radial-gradient(circle at 38% 34%, #fff4ec 0%, #ffc7a6 26%, #ff8d6a 58%, rgba(232,70,60,0.85) 82%, rgba(217,32,46,0) 100%)",
      boxShadow: `0 0 ${r * 0.9}px ${r * 0.3}px rgba(255,138,92,0.45)` }} />
  );
};

/** The dark grid with thin white crosshair lines sliding across it. */
export const Crosshair: React.FC<{ f: number; w?: number; h?: number }> = ({ f, w = 1600, h = 900 }) => {
  const lines = [
    { v: true, base: 0.18, sp: 0.7 }, { v: true, base: 0.79, sp: -0.5 },
    { v: false, base: 0.22, sp: 0.4 }, { v: false, base: 0.78, sp: -0.35 },
  ];
  return (
    <AbsoluteFill>
      <GradientField dark />
      {lines.map((l, i) => {
        const pos = (l.v ? w : h) * l.base + f * l.sp;
        return <div key={i} style={{ position: "absolute", left: l.v ? pos : 0, top: l.v ? 0 : pos, width: l.v ? 1.5 : w, height: l.v ? h : 1.5, background: "rgba(255,255,255,0.55)", boxShadow: "0 0 6px rgba(255,255,255,0.35)" }} />;
      })}
    </AbsoluteFill>
  );
};

/** Small red corner ticks around a box (the reference frames its word stacks with them). */
export const CornerTicks: React.FC<{ x: number; y: number; w: number; h: number; p: number; len?: number }> = ({ x, y, w, h, p, len = 18 }) => {
  const L = len * p;
  const s: React.CSSProperties = { position: "absolute", background: SL.red, opacity: p };
  return (
    <>
      <div style={{ ...s, left: x, top: y, width: 4, height: L }} /><div style={{ ...s, left: x, top: y, width: L, height: 4 }} />
      <div style={{ ...s, left: x + w - 4, top: y + h - L, width: 4, height: L }} /><div style={{ ...s, left: x + w - L, top: y + h - 4, width: L, height: 4 }} />
    </>
  );
};
