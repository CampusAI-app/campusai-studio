/**
 * /basket (2026-11-10, name from Shaan Johari's "Black Friday Styles Part 6, made with Claude Code" reel via Muse; his
 * prompts are DM-gated and were never seen, and the reel only shows this one as a still in its final grid, so the motion
 * is our own). A bubblegum pink page with a small line, a serif headline asking a playful question, and a red wire
 * shopping basket in perspective. Real cards cut from a demo capture drop into the basket one by one, each with a bounce
 * that jostles the basket; then a dark pill pops under the headline with the true answer, and the CampusAI logo sits at
 * the foot where the reel had "YOUR BRAND".
 *
 * Every item in the basket is a REAL crop of a demo capture (club cards from the Organizations page by default), never a
 * rebuilt card. The basket is drawn in SVG.
 *
 * Motion in numbers (30 fps): the small line fades in at frame 2, the headline sets word by word 3 frames apart from
 * frame 4 (each word rising 30 px from blurred), the basket springs up 700 px from the foot from frame 8 (damping 13,
 * stiffness 120). Items start falling at frame 30, 11 frames apart, from 1000 px above on a bouncy spring (damping 9,
 * stiffness 130) with 14 deg of extra turn; each landing dips the basket 14 px and rocks it 1.6 deg, alternating sides,
 * decaying over about 12 frames. The pill pops 12 frames after the last item (spring, damping 10, stiffness 190, from
 * 0.6x), and the basket sways 0.6 deg through the hold.
 */
import React from "react";
import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/YoungSerif";
import { loadFont as loadSans } from "@remotion/google-fonts/Gabarito";
import { CURVE, readHold } from "../system/motion";
import { B, Cue, ramp } from "./common";
import { World } from "./world";

const { fontFamily: SERIF } = loadSerif("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: GABARITO } = loadSans("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });

// its own world: hot bubblegum pink, plum ink, a brand-red wire basket
const PINK = "#FF7DB8";
const PINK_LIGHT = "#FFA3CF";
const PINK_DEEP = "#F2559F";
const PLUM = "#3B0A24";
const WIRE = "#D9202E";
const WIRE_HI = "#FF6874";
const WIRE_LO = "#8E0F1C";
const FPS = 30;

type Box = { x: number; y: number; w: number; h: number };

export type BasketProps = {
  /** The small line above the headline, sentence case. */
  kicker: string;
  /** The headline; the part after `turn` sets in italic. */
  headline: string;
  turn?: string;
  /** The capture the items are cut from, in `public/`, and its pixel size. */
  itemSrc: string;
  itemImage: { w: number; h: number };
  /** 3 to 5 crops, in the capture's pixels, dropped in this order. */
  items: Box[];
  /** The answer in the dark pill, true on the capture. */
  pill: string;
  source: string;
  cta?: string;
};

// where each item rests in the basket: centre x, top y, turn. Later ones sit in front.
// stacked like a hand of cards, each 75 px lower, so every title and its tags stay readable above the next
const RESTS: [number, number, number][] = [[515, 860, -4], [565, 935, 3], [515, 1010, -3], [565, 1085, 4], [540, 1150, -2]];
const ITEM_W = 560;
const FIRST = 30;
const GAP = 11;
const LAND = 7; // frames from the start of a fall to its first touch

// the basket, in frame pixels: back rim, front rim, front foot
const BACK = { y: 1080, l: 300, r: 780 };
const FRONT = { y: 1205, l: 168, r: 912 };
const FOOT = { y: 1545, l: 250, r: 830 };
const FLOOR = { y: 1450, l: 340, r: 740 };

export const basketPlan = (p: BasketProps) => {
  const starts = p.items.map((_, i) => FIRST + i * GAP);
  const lands = starts.map((s) => s + LAND);
  const pillAt = lands[lands.length - 1] + 12;
  const end = pillAt + 8 + Math.round(readHold(p.pill) * FPS); // the headline has been up since frame 30, so the hold is for the pill
  return { starts, lands, pillAt, end };
};
export const basketEnd = (p: BasketProps) => basketPlan(p).end;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const Wires: React.FC<{ front: boolean }> = ({ front }) => {
  // a face of the basket as a grid of wires: verticals between its top and bottom edges, bands across it
  const top = front ? FRONT : BACK;
  const bot = front ? FOOT : FLOOR;
  const cols = front ? 17 : 13;
  const sw = front ? 7 : 5;
  const verticals = [...Array(cols + 1)].map((_, i) => {
    const t = i / cols;
    return [lerp(top.l, top.r, t), top.y, lerp(bot.l, bot.r, t), bot.y];
  });
  const bands = [0.3, 0.58, 0.84].map((t) => [lerp(top.l, bot.l, t), lerp(top.y, bot.y, t), lerp(top.r, bot.r, t), lerp(top.y, bot.y, t)]);
  const color = front ? WIRE : WIRE_LO;
  return (
    <g opacity={front ? 1 : 0.75}>
      {verticals.map(([x1, y1, x2, y2], i) => <line key={`v${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={sw} strokeLinecap="round" />)}
      {bands.map(([x1, y1, x2, y2], i) => <line key={`b${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={sw + 1} strokeLinecap="round" />)}
      {front ? verticals.map(([x1, y1, x2, y2], i) => <line key={`h${i}`} x1={x1 - 2} y1={y1 + 6} x2={x2 - 2} y2={y2 - 6} stroke={WIRE_HI} strokeWidth={2} opacity={0.7} />) : null}
    </g>
  );
};

const Item: React.FC<{ p: BasketProps; box: Box; i: number; start: number }> = ({ p, box, i, start }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < start) return null;
  const [cx, top, rot] = RESTS[i % RESTS.length];
  const k = spring({ frame: f - start, fps, config: { damping: 9, stiffness: 130 } });
  const h = (ITEM_W * box.h) / box.w;
  const s = ITEM_W / box.w;
  const y = top - 1000 * (1 - k);
  const turn = rot + (i % 2 ? -14 : 14) * (1 - k);
  return (
    <div style={{ position: "absolute", left: cx - ITEM_W / 2, top: y, width: ITEM_W, height: h, borderRadius: 16, overflow: "hidden", background: "#0b0708",
      transform: `rotate(${turn.toFixed(2)}deg)`, boxShadow: "0 14px 30px rgba(59,10,36,.35)" }}>
      <Img src={staticFile(p.itemSrc)} style={{ position: "absolute", width: p.itemImage.w * s, height: p.itemImage.h * s, left: -box.x * s, top: -box.y * s, maxWidth: "none" }} />
    </div>
  );
};

export const Basket: React.FC<BasketProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { starts, lands, pillAt, end } = basketPlan(p);
  // the basket arrives, then every landing dips and rocks it
  const enter = spring({ frame: f - 8, fps, config: { damping: 13, stiffness: 120 } });
  let dip = 0;
  let rock = 0;
  lands.forEach((l, i) => {
    if (f < l) return;
    const t = f - l;
    const e = Math.exp(-t / 5);
    dip += 14 * e * Math.cos(t * 0.75);
    rock += (i % 2 ? -1.6 : 1.6) * e * Math.sin(t * 0.7 + 0.6);
  });
  const sway = 0.6 * Math.sin(Math.max(0, f - pillAt) / 16) * ramp(f, pillAt, pillAt + 20);
  const basketT = `translateY(${((1 - enter) * 700 + dip).toFixed(1)}px) rotate(${(rock + sway).toFixed(3)}deg)`;
  const words = p.headline.split(" ");
  const turnWords = p.turn ? p.turn.split(" ") : [];
  const pillK = spring({ frame: f - pillAt, fps, config: { damping: 10, stiffness: 190 } });
  const logoK = ramp(f, 12, 26, CURVE.quiet.enter);
  const srcK = ramp(f, pillAt + 10, pillAt + 24, CURVE.quiet.enter);
  const logoW = 300;
  const push = 1 + 0.04 * ramp(f, pillAt, end, CURVE.quiet.standard);
  const Word: React.FC<{ w: string; n: number; italic?: boolean }> = ({ w, n, italic }) => {
    const k = ramp(f, 4 + n * 3, 4 + n * 3 + 10, CURVE.showy.enter);
    return <span style={{ display: "inline-block", marginRight: "0.24em", opacity: k, fontStyle: italic ? "italic" : "normal", transform: `translateY(${((1 - k) * 30).toFixed(1)}px)`,
      filter: k < 0.98 ? `blur(${((1 - k) * 8).toFixed(1)}px)` : undefined, color: italic ? WIRE : PLUM }}>{w}</span>;
  };
  return (
    <World endAt={end} cta={p.cta} font={SERIF} fontWeight={400} ink="#FFF1F7" logo="dark" logoSpot="none" end="iris" endGround={WIRE} endLogo="white"
      ground={`radial-gradient(ellipse 75% 50% at 50% 30%, ${PINK_LIGHT}, transparent 72%), radial-gradient(ellipse 100% 60% at 50% 105%, ${PINK_DEEP}, transparent 70%), ${PINK}`}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push.toFixed(4)})`, transformOrigin: "50% 45%" }}>
      {/* a soft gloss band, like a printed card stock */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(255,255,255,.14), transparent 30%, transparent 70%, rgba(120,0,50,.10))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 168, textAlign: "center", fontFamily: GABARITO, fontWeight: 600, fontSize: 40, color: PLUM, opacity: ramp(f, 2, 12) * 0.85 }}>{p.kicker}</div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 240, textAlign: "center", fontFamily: SERIF, fontWeight: 400, fontSize: 112, lineHeight: 1.02, letterSpacing: "-0.02em" }}>
        {words.map((w, i) => <Word key={`w${i}`} w={w} n={i} />)}
        {turnWords.map((w, i) => <Word key={`t${i}`} w={w} n={words.length + i + 1} italic />)}
      </div>
      {/* the answer */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", justifyContent: "center", opacity: f < pillAt ? 0 : Math.min(1, pillK * 2),
        transform: `scale(${(0.6 + 0.4 * pillK).toFixed(4)})` }}>
        <div style={{ background: PLUM, color: "#FFE3F0", fontFamily: GABARITO, fontWeight: 600, fontSize: 48, padding: "20px 44px 24px", borderRadius: 999,
          boxShadow: "0 14px 34px rgba(59,10,36,.35)" }}>{p.pill}</div>
      </div>

      {/* the basket and what is in it, one body */}
      <div style={{ position: "absolute", inset: 0, transform: basketT, transformOrigin: `540px ${FOOT.y}px` }}>
        <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
          <ellipse cx={540} cy={FOOT.y + 18} rx={350} ry={30} fill="rgba(90,0,40,.22)" />
          {/* inside: back wall, side walls, floor */}
          <path d={`M${BACK.l},${BACK.y} L${BACK.r},${BACK.y} L${FLOOR.r},${FLOOR.y} L${FLOOR.l},${FLOOR.y} Z`} fill="rgba(120,10,50,.16)" />
          <path d={`M${BACK.l},${BACK.y} L${FRONT.l},${FRONT.y} L${FOOT.l},${FOOT.y} L${FLOOR.l},${FLOOR.y} Z`} fill="rgba(120,10,50,.10)" />
          <path d={`M${BACK.r},${BACK.y} L${FRONT.r},${FRONT.y} L${FOOT.r},${FOOT.y} L${FLOOR.r},${FLOOR.y} Z`} fill="rgba(120,10,50,.10)" />
          <Wires front={false} />
          <line x1={BACK.l} y1={BACK.y} x2={BACK.r} y2={BACK.y} stroke={WIRE_LO} strokeWidth={13} strokeLinecap="round" />
        </svg>
        {p.items.map((box, i) => <Item key={i} p={p} box={box} i={i} start={starts[i]} />)}
        <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={`M${FRONT.l},${FRONT.y} L${FRONT.r},${FRONT.y} L${FOOT.r},${FOOT.y} L${FOOT.l},${FOOT.y} Z`} fill="rgba(217,32,46,.10)" />
          {/* side walls, seen edge on */}
          {[[BACK.l, FRONT.l, FLOOR.l, FOOT.l], [BACK.r, FRONT.r, FLOOR.r, FOOT.r]].map(([bx, fx, flx, ftx], i) => (
            <g key={`s${i}`}>
              {[0.25, 0.5, 0.75].map((t) => <line key={t} x1={lerp(bx, fx, t)} y1={lerp(BACK.y, FRONT.y, t)} x2={lerp(flx, ftx, t)} y2={lerp(FLOOR.y, FOOT.y, t)} stroke={WIRE} strokeWidth={6} opacity={0.85} />)}
              <line x1={bx} y1={BACK.y} x2={fx} y2={FRONT.y} stroke={WIRE} strokeWidth={13} strokeLinecap="round" />
              <line x1={fx} y1={FRONT.y} x2={ftx} y2={FOOT.y} stroke={WIRE} strokeWidth={12} strokeLinecap="round" />
            </g>
          ))}
          <Wires front />
          {/* rims and foot */}
          <line x1={FRONT.l} y1={FRONT.y} x2={FRONT.r} y2={FRONT.y} stroke={WIRE} strokeWidth={18} strokeLinecap="round" />
          <line x1={FRONT.l + 10} y1={FRONT.y - 5} x2={FRONT.r - 10} y2={FRONT.y - 5} stroke={WIRE_HI} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
          <line x1={FOOT.l} y1={FOOT.y} x2={FOOT.r} y2={FOOT.y} stroke={WIRE} strokeWidth={14} strokeLinecap="round" />
          {/* the handle folded down over the front, with its plum grip */}
          <path d={`M380,${FRONT.y + 4} C390,${FRONT.y + 120} 410,${FRONT.y + 150} 450,${FRONT.y + 150} L630,${FRONT.y + 150} C670,${FRONT.y + 150} 690,${FRONT.y + 120} 700,${FRONT.y + 4}`}
            fill="none" stroke={WIRE} strokeWidth={12} strokeLinecap="round" />
          <rect x={455} y={FRONT.y + 132} width={170} height={36} rx={18} fill={PLUM} />
          <rect x={470} y={FRONT.y + 138} width={140} height={8} rx={4} fill="rgba(255,255,255,.18)" />
        </svg>
      </div>

      {/* the brand at the foot, where the reel had "YOUR BRAND" */}
      <Img src={staticFile(B.logo!.onLight)} style={{ position: "absolute", left: width / 2 - logoW / 2, top: 1640, width: logoW, height: "auto", opacity: logoK,
        transform: `translateY(${((1 - logoK) * 14).toFixed(1)}px)` }} />
      <div style={{ position: "absolute", left: 64, right: 64, top: 1736, textAlign: "center", fontFamily: GABARITO, fontWeight: 500, fontSize: 28, color: PLUM, opacity: 0.75 * srcK }}>{p.source}</div>

      </div>
      <Cue at={8} name="air-woosh-quick" volume={0.35} />
      {starts.map((s, i) => <Cue key={`d${i}`} at={s} name="paper-slide" volume={0.22} />)}
      {lands.map((l, i) => <Cue key={`l${i}`} at={l} name="hit-weak" volume={0.5} />)}
      <Cue at={pillAt} name="switch-tap" volume={0.5} />
    </World>
  );
};
