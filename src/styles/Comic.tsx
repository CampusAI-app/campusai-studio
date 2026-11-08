/**
 * /comic (2026-11-05, name from the Muse send "10 Claude animation styles", its prompts gated and unseen): a student
 * gag as a one-page comic. Four panels reveal in reading order (border inks on, the panel fills, the cast pops in,
 * then the balloon), the camera leans toward whichever panel is being read, and the last panel lands on one punchy
 * sound-effect word in the brand red over a red Ben-Day burst.
 *
 * Ben-Day dots are built in SVG: a 45 degree grid of dots whose radius follows a falloff, drawn as one path per panel,
 * so the shading is real halftone (dots grow, they never fade). The cast is Open Peeps (./peeps), never drawn by hand.
 * Balloons and captions letter in Caveat, the title and the sound effect in Zodiak. Sentence case, even the effect.
 */
import React from "react";
import { loadFont } from "@remotion/google-fonts/Caveat";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR } from "../system/motion";
import { readHold } from "../system/motion";
import { B, Clip, Cue, PAPER, PRINT, RED, ZODIAK, clamp, ramp } from "./common";
import { Peep, type BodyName, type FaceName } from "./peeps/Peep";

const { fontFamily: HAND } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

type Person = { face: FaceName; body?: BodyName };
export type ComicProps = {
  /** Above the page, Zodiak. */
  title: string;
  /** Panel 1: a caption box, the student, what they say. */
  open: { caption: string; person: Person; says: string };
  /** Panel 2: a caption, then the things that pile up (3 or 4 short labels). */
  pile: { caption: string; items: string[] };
  /** Panel 3: the student again, closer, and what they say. */
  worse: { person: Person; says: string };
  /** Panel 4: the sound effect (a short word, red), the student, and the line naming CampusAI. */
  payoff: { sfx: string; person: Person; says: string };
};

const BALLOON = B.color.accentInk; // white balloons on cream paper
const INK_W = 7;
const M = 48, GUT = 24, TOP = 286;

/** Panel boxes on the 1080 x 1920 page, reading order. */
const panels = (W: number, H: number) => {
  const w = W - M * 2, half = (w - GUT) / 2;
  // the page ends near 84% of the frame: below that a reel's caption and buttons sit
  const h1 = 400, h2 = 380, h4 = 380;
  const y2 = TOP + h1 + GUT, y4 = y2 + h2 + GUT;
  return [
    { x: M, y: TOP, w, h: h1 },
    { x: M, y: y2, w: half, h: h2 },
    { x: M + half + GUT, y: y2, w: half, h: h2 },
    { x: M, y: y4, w, h: Math.min(h4, H - 48 - y4) },
  ];
};

export const comicPlan = (p: ComicProps) => {
  const P = [0, 56, 116, 180];
  const says = [P[0] + 16, P[1] + 4, P[2] + 14, P[3] + 26];
  const texts: [number, string][] = [
    [6, p.open.caption], [says[0] + 6, p.open.says], [says[1] + 6, p.pile.caption], [says[2] + 6, p.worse.says], [says[3] + 6, p.payoff.says],
    ...p.pile.items.map((t, i) => [P[1] + 4 + i * 9, t] as [number, string]),
  ];
  const end = Math.max(...texts.map(([a, t]) => a + Math.ceil(readHold(t) * 30))) + 10;
  return { P, says, end };
};
export const comicEnd = (p: ComicProps) => comicPlan(p).end;

/** Ben-Day dots on a 45 degree grid; `fall(u, v)` gives each dot's size from 0 to 1 at that point of the box. */
const Halftone: React.FC<{ w: number; h: number; step: number; color: string; k: number; fall: (u: number, v: number) => number; opacity?: number }> = ({ w, h, step, color, k, fall, opacity = 1 }) => {
  let d = "";
  const c = Math.SQRT1_2;
  const R = Math.hypot(w, h);
  for (let a = -R; a <= R; a += step) {
    for (let b = -R; b <= R; b += step) {
      const x = w / 2 + (a - b) * c, y = h / 2 + (a + b) * c;
      if (x < -step || y < -step || x > w + step || y > h + step) continue;
      const r = step * 0.5 * Math.min(1, Math.max(0, fall(x / w, y / h))) * k;
      if (r < 0.6) continue;
      d += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0`;
    }
  }
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      <path d={d} fill={color} opacity={opacity} />
    </svg>
  );
};

/** The panel: its border inks on clockwise, the paper inside flashes in, and its contents are clipped to it. */
const Panel: React.FC<{ box: { x: number; y: number; w: number; h: number }; at: number; children: React.ReactNode }> = ({ box, at, children }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  // border and paper arrive together, so no frame shows an empty half-drawn box
  const line = ramp(f, at, at + 4, CURVE.quiet.standard);
  const fill = ramp(f, at, at + 3, CURVE.quiet.enter);
  return (
    <>
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, overflow: "hidden", background: PAPER, opacity: fill,
        transform: `scale(${(0.97 + 0.03 * fill).toFixed(4)})` }}>
        {children}
      </div>
      <svg width={box.w + 20} height={box.h + 20} style={{ position: "absolute", left: box.x - 10, top: box.y - 10, overflow: "visible" }}>
        <rect x={10} y={10} width={box.w} height={box.h} fill="none" stroke={PRINT} strokeWidth={INK_W} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - line} />
      </svg>
    </>
  );
};

/** A speech balloon that pops out of its tail. `tail` is the tip, in the panel's own coordinates. */
const Balloon: React.FC<{ x: number; y: number; w: number; h: number; tail: [number, number]; at: number; size?: number; children: string }> = ({ x, y, w, h, tail, at, size = 54, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const k = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 170 } });
  // the tail leaves the balloon on the side facing its tip: two points on the ellipse either side of that direction
  const cx = x + w / 2, cy = y + h / 2, a = Math.atan2((tail[1] - cy) / (h / 2), (tail[0] - cx) / (w / 2));
  const on = (t: number, r: number) => `${(cx + Math.cos(t) * (w / 2) * r).toFixed(1)} ${(cy + Math.sin(t) * (h / 2) * r).toFixed(1)}`;
  const ox = ((tail[0] - x) / w) * 100, oy = ((tail[1] - y) / h) * 100;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", transformOrigin: `${tail[0]}px ${tail[1]}px`, transform: `scale(${k.toFixed(4)})`, opacity: Math.min(1, k * 3) }}>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
        <path d={`M${on(a - 0.2, 0.97)} L${tail[0]} ${tail[1]} L${on(a + 0.2, 0.97)}`} fill={BALLOON} stroke={PRINT} strokeWidth={5} strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: "50%", background: BALLOON, border: `5px solid ${PRINT}`,
        display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 40px", boxSizing: "border-box",
        fontFamily: HAND, fontWeight: 700, fontSize: size, lineHeight: 1.02, color: PRINT, transformOrigin: `${ox}% ${oy}%` }}>
        {children}
      </div>
      {/* opens the balloon's own outline where the tail joins it */}
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
        <path d={`M${on(a - 0.15, 0.9)} L${on(a - 0.15, 1.06)} L${on(a + 0.15, 1.06)} L${on(a + 0.15, 0.9)} Z`} fill={BALLOON} />
      </svg>
    </div>
  );
};

/** A caption box in the panel's corner. */
const Caption: React.FC<{ at: number; children: string; right?: boolean }> = ({ at, children, right }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = ramp(f, at, at + DUR.panel, CURVE.quiet.enter);
  return (
    <div style={{ position: "absolute", top: -INK_W, [right ? "right" : "left"]: -INK_W, padding: "18px 26px 16px", background: PAPER, border: `${INK_W - 2}px solid ${PRINT}`,
      fontFamily: HAND, fontWeight: 700, fontSize: 44, lineHeight: 1, color: PRINT, opacity: k, transform: `translateX(${(1 - k) * (right ? 30 : -30)}px)` }}>
      {children}
    </div>
  );
};

const Cast: React.FC<{ person: Person; at: number; left: number; top: number; width: number; flip?: boolean }> = ({ person, at, left, top, width, flip }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const k = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 140 } });
  const bob = Math.sin((f - at) / 8) * 4;
  return (
    <div style={{ position: "absolute", left, top: top + (1 - k) * 120 + bob, transform: `scaleX(${flip ? -1 : 1})` }}>
      <Peep face={person.face} body={person.body ?? "Device"} ink={PRINT} fill={BALLOON} width={width} />
    </div>
  );
};

/** Speed lines behind something arriving, from a point outward. */
const Speed: React.FC<{ w: number; h: number; cx: number; cy: number; k: number }> = ({ w, h, cx, cy, k }) => (
  <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
    {Array.from({ length: 28 }, (_, i) => {
      const a = (i / 28) * Math.PI * 2 + (i % 3) * 0.05;
      const r0 = 150 + (i % 4) * 30, r1 = Math.hypot(w, h);
      return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke={PRINT} strokeWidth={2 + (i % 3) * 2} opacity={0.5 * k} />;
    })}
  </svg>
);

/** The burst behind the sound effect: a jagged star. */
const burst = (cx: number, cy: number, r0: number, r1: number, n: number) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? r0 : r1 * (0.86 + 0.14 * ((i * 7) % 5) / 4);
    return `${i ? "L" : "M"}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ") + " Z";

export const Comic: React.FC<ComicProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const { P, says, end } = comicPlan(p);
  const box = panels(W, H);

  // A slow push on the whole page. (A lean toward each panel was tried in round 1 and cropped the title off the left.)
  const s = interpolate(f, [0, end], [1, 1.025], clamp);
  const tx = (W - W * s) / 2, ty = (H - H * s) * 0.3;

  const [b1, b2, b3, b4] = box;
  const halftone = (at: number) => ramp(f, at, at + 10, CURVE.quiet.enter);
  const sfxAt = P[3] + 2;
  const sfxK = spring({ frame: f - sfxAt, fps, config: { damping: 9, stiffness: 190 } });
  const shake = f >= sfxAt && f < sfxAt + 10 ? Math.sin((f - sfxAt) * 2.4) * (10 - (f - sfxAt)) * 0.8 : 0;
  const titleK = ramp(f, 2, 2 + DUR.arrive, CURVE.quiet.enter);

  return (
    <Clip endAt={end} light>
      <AbsoluteFill style={{ transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(4)})`, transformOrigin: "0 0" }}>
        {/* the page: a faint dot screen over the whole sheet, the way newsprint carries it */}
        <Halftone w={W} h={H} step={22} color={PRINT} k={1} opacity={0.06} fall={() => 0.5} />
        <div style={{ position: "absolute", left: 64, right: 64, top: 186, fontFamily: ZODIAK, fontWeight: 700, fontSize: 70, lineHeight: 1.04, letterSpacing: "-0.02em", color: PRINT,
          opacity: titleK, transform: `translateY(${(1 - titleK) * 14}px)` }}>{p.title}</div>

        <Panel box={b1} at={P[0]}>
          <Halftone w={b1.w} h={b1.h} step={18} color={PRINT} k={halftone(P[0])} opacity={0.5} fall={(u, v) => (u * 0.6 + v * 0.7) - 0.45} />
          <Cast person={p.open.person} at={P[0]} left={b1.w - 470} top={70} width={430} />
          <Caption at={P[0] + 6}>{p.open.caption}</Caption>
          <Balloon x={40} y={150} w={500} h={210} tail={[620, 250]} at={says[0]} size={52}>{p.open.says}</Balloon>
        </Panel>

        <Panel box={b2} at={P[1]}>
          <Halftone w={b2.w} h={b2.h} step={16} color={PRINT} k={halftone(P[1])} opacity={0.55} fall={(u, v) => 0.95 - Math.hypot(u - 0.5, v - 0.6) * 1.2} />
          <Speed w={b2.w} h={b2.h} cx={b2.w / 2} cy={b2.h * 0.6} k={ramp(f, P[1] + 6, P[1] + 14) * (1 - ramp(f, P[1] + 40, P[1] + 60))} />
          {p.pile.items.map((t, i) => {
            const at = P[1] + 4 + i * 9;
            if (f < at) return null;
            const k = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 160 } });
            const rot = [-8, 6, -3, 9][i % 4];
            const y = b2.h - 84 - i * 72;
            return (
              <div key={i} style={{ position: "absolute", left: 34 + (i % 2) * 62, top: y - (1 - k) * 360, width: 320, padding: "12px 20px", background: BALLOON,
                border: `5px solid ${PRINT}`, boxShadow: `7px 8px 0 ${PRINT}`, transform: `rotate(${rot * (0.6 + 0.4 * k)}deg)`,
                fontFamily: HAND, fontWeight: 700, fontSize: 44, lineHeight: 1, color: PRINT, opacity: Math.min(1, k * 3) }}>{t}</div>
            );
          })}
          <Caption at={says[1]}>{p.pile.caption}</Caption>
        </Panel>

        <Panel box={b3} at={P[2]}>
          <Halftone w={b3.w} h={b3.h} step={16} color={PRINT} k={halftone(P[2])} opacity={0.6} fall={(u, v) => 0.25 + v * 0.75 - Math.abs(u - 0.5) * 0.3} />
          <Cast person={p.worse.person} at={P[2]} left={-40} top={112} width={480} />
          <Balloon x={60} y={22} w={380} h={180} tail={[250, 262]} at={says[2]} size={46}>{p.worse.says}</Balloon>
        </Panel>

        <Panel box={b4} at={P[3]}>
          <Halftone w={b4.w} h={b4.h} step={20} color={RED} k={halftone(P[3])} opacity={0.85} fall={(u, v) => 1.05 - Math.hypot((u - 0.66) * 1.4, v - 0.42) * 1.4} />
          <Cast person={p.payoff.person} at={P[3]} left={10} top={40} width={300} />
          {/* the phone pings: short ink strokes off it as the effect lands */}
          <svg width={b4.w} height={b4.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {[-0.9, -0.45, 0].map((ang, i) => {
              const ph = [10 + 300 * 0.78, 40 + 300 * (1200 / 850) * 0.66];
              const k = ramp(f, sfxAt + i, sfxAt + i + 6, CURVE.quiet.enter);
              return <line key={i} x1={ph[0] + Math.cos(ang) * 40} y1={ph[1] + Math.sin(ang) * 40} x2={ph[0] + Math.cos(ang) * (40 + 46 * k)} y2={ph[1] + Math.sin(ang) * (40 + 46 * k)}
                stroke={PRINT} strokeWidth={7} strokeLinecap="round" opacity={f < sfxAt ? 0 : 1} />;
            })}
          </svg>
          <svg width={b4.w} height={b4.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <g transform={`translate(${shake.toFixed(1)} 0)`} opacity={f < sfxAt ? 0 : 1}>
              <path d={burst(b4.w * 0.68, b4.h * 0.36, 120 * sfxK, 230 * sfxK, 13)} fill={BALLOON} stroke={PRINT} strokeWidth={6} strokeLinejoin="round" />
            </g>
          </svg>
          <div style={{ position: "absolute", left: b4.w * 0.68 - 300, width: 600, top: b4.h * 0.36 - 92, textAlign: "center", fontFamily: ZODIAK, fontWeight: 700, fontStyle: "italic",
            fontSize: 172, lineHeight: 1, letterSpacing: "-0.03em", color: RED, WebkitTextStroke: `7px ${PRINT}`, paintOrder: "stroke fill",
            textShadow: `8px 9px 0 ${PRINT}`, opacity: f < sfxAt ? 0 : 1,
            transform: `translate(${shake.toFixed(1)}px, 0) rotate(-8deg) scale(${(0.4 + 0.6 * sfxK).toFixed(4)})` }}>{p.payoff.sfx}</div>
          <Balloon x={b4.w - 560} y={b4.h - 166} w={520} h={150} tail={[330, b4.h - 190]} at={says[3]} size={54}>{p.payoff.says}</Balloon>
        </Panel>
      </AbsoluteFill>
      <Cue at={0} name="paper-slide" volume={0.4} />
      {P.slice(1).map((t, i) => <Cue key={i} at={t} name="paper-move-quick" volume={0.35} />)}
      {p.pile.items.map((_, i) => <Cue key={`p${i}`} at={P[1] + 4 + i * 9} name="paper-slide" volume={0.35} />)}
      {says.map((t, i) => <Cue key={`s${i}`} at={t} name="switch-tap" volume={0.3} />)}
      <Cue at={sfxAt} name="chime-crystal" volume={0.55} />
      <Cue at={sfxAt} name="bass-hit-short" volume={0.45} />
    </Clip>
  );
};
