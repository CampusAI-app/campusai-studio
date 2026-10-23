/**
 * CampusAI "Week", round 2 (2026-10-19), 9:16, 20s. Type 3 of the four-video batch
 * (../../four-videos/BRIEF.md, round 2 at the bottom wins; note at ../../four-videos/Week.md).
 *
 * The point Jacob asked to land: a week is made of DIFFERENT KINDS of things that normally live in
 * different places, and CampusAI puts them in ONE calendar. So the week fills by kind, not by day.
 * "How many places do you check?" Then classes, assignments, a coffee chat, your club and work
 * shifts each fly in from the side of the frame (somewhere else), shown big enough to read, and
 * travel into the real My Calendar week while the sentence above types itself kind by kind.
 * "All in one calendar." Then what only CampusAI adds: its real dashed suggestions (the fair's
 * card grows out of its slot, the hand presses + Add, it travels back and turns solid), and the
 * study time it found from what it knows (Quiz 2 on Thursday lights, the real answer that put a
 * study block on Wednesday 6 to 8pm travels into that slot). The CampusAI logo lands, Link in bio.
 *
 * Motion borrowed from Jacob's Elevations picks, driven by frame: gc-open-sheet (a slot grows into
 * its panel and folds back, spring 0.45s, no bounce) and gc-add-travel (a copy travels into My
 * Calendar, spring 0.5s, bounce 0.1). The product is the frame: the week fills it edge to edge and
 * the band above is its own header colour extended (band.png). No laptop, no rising bars.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BlurLines, Hand, Ink, ZODIAK, pop, ramp, useZodiak } from "../kit/parts";
import { Img, staticFile } from "remotion";
import {
  AppIcon, BG, Block, CAL_H, CAL_TOP, CARDS, Card, CardImg, Crop, IMG, KIND, KindSentence, PITCH, RED, Rect, S, W, cardH, slotCentre,
} from "./week-parts";

export const WEEK_FPS = 30;
export const WEEK_SIZE = { width: 1080, height: 1920 };

const INK: Ink = { ink: "#ffffff", soft: "rgba(255,255,255,.6)", accent: RED, surface: "#141114", line: "rgba(255,255,255,.08)" };
const lerp = (p: number, a: number, b: number) => a + (b - a) * p;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ------------------------------------------------------------ timing */

const INTRO = 50; // icon, hook, the empty week opens
const KIND_LEN = 48; // ~1.6s a kind: in from the side, read, travel into its slots
const kindAt = (i: number) => INTRO + i * KIND_LEN;
const ONE = kindAt(5); // 290, "All in one calendar."
const SUG = ONE + 42; // 332, suggestions and the one press
const STUDY = SUG + 96; // 428, the study block it found
const END = STUDY + 86; // 514
export const WEEK_FRAMES = END + 86; // 600, 20s

// inside a kind
const IN = 0; // hero starts in from the side
const GO = 28; // hero travels to its slot
const LAND = 40; // its slot fills, the rest of the kind follows

const HERO = { x: W / 2, y: 1230 };

// gc-add-travel's TRAVEL (0.5s, bounce 0.1) and gc-open-sheet's GROW (0.45s, no bounce), by frame
const travel = (f: number, at: number, fps: number) => spring({ frame: f - at, fps, config: { damping: 17, stiffness: 150, mass: 0.9 } });
const grow = (f: number, at: number, fps: number) => spring({ frame: f - at, fps, config: { damping: 200 }, durationInFrames: 14 });

/* ------------------------------------------------------------ kinds */

type Hero = { kind: keyof typeof KIND; side: -1 | 1; dy: number; card?: Card; crop?: { b: Rect; k: number }; target?: { x: number; y: number; s: number } };
const KINDS: Hero[] = [
  { kind: "classes", side: -1, dy: -60, crop: { b: KIND.classes[0], k: 5.4 } },
  { kind: "assignments", side: 1, dy: 80, card: CARDS.tasks },
  { kind: "chat", side: -1, dy: 120, card: CARDS.evercore },
  { kind: "club", side: 1, dy: -80, card: CARDS.pitch },
  { kind: "shifts", side: -1, dy: 60, crop: { b: KIND.shifts[0], k: 5 } },
];
const heroSize = (h: Hero): [number, number] =>
  h.card ? [h.card.dw, cardH(h.card)] : [(h.crop!.b.w + 4) * h.crop!.k, (h.crop!.b.h + 4) * h.crop!.k];

/** When each block of each kind lands: the hero's slot first, the rest outward from it. */
const landAt = (i: number, j: number) => {
  const k = kindAt(i) + LAND;
  if (KINDS[i].kind === "assignments") return k - 4 + j * 2; // pills left to right as the list folds into the strip
  const bs = KIND[KINDS[i].kind] as Rect[];
  const order = bs.map((_, n) => n).sort((a, c) => dist(bs[a], bs[0]) - dist(bs[c], bs[0]));
  return k + order.indexOf(j) * 2;
};
const dist = (a: Rect, b: Rect) => Math.hypot(a.x - b.x, a.y - b.y);

const arrive = (f: number, at: number, fps: number) => {
  if (f < at) return { s: 0.8, o: 0 };
  const p = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 210, mass: 0.6 } });
  return { s: 0.8 + 0.2 * p, o: ramp(f, at, at + 4) };
};

/* ------------------------------------------------------------ the week */

const Week: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // "All in one calendar": each column lifts once, left to right
  const ripple = (b: Rect) => {
    const d = Math.floor((b.x + 4) / PITCH);
    const t = interpolate(f, [ONE + 4 + d * 3, ONE + 14 + d * 3], [0, 1], clamp);
    return 1 + 0.06 * Math.sin(t * Math.PI);
  };
  // the week steps back while something is out in front of it
  let dim = 0;
  for (let i = 0; i < 5; i++) dim = Math.max(dim, ramp(f, kindAt(i) + 2, kindAt(i) + 12) * (1 - ramp(f, kindAt(i) + GO, kindAt(i) + LAND)));
  const sugDim = ramp(f, SUG + 4, SUG + 16) * (1 - ramp(f, SUG + 72, SUG + 86));
  const stDim = ramp(f, STUDY + 2, STUDY + 12) * (1 - ramp(f, STUDY + 64, STUDY + 78));
  const fairSolid = f >= SUG + 70;

  const blocks: React.ReactNode[] = [];
  KINDS.forEach((h, i) => (KIND[h.kind] as Rect[]).forEach((b, j) => {
    const a = arrive(f, landAt(i, j), fps);
    blocks.push(<Block key={`${i}-${j}`} b={b} src={IMG.full} s={a.s * ripple(b)} o={a.o} />);
  }));
  const quizPulse = 1 + 0.16 * Math.sin(interpolate(f, [STUDY + 6, STUDY + 20], [0, 1], clamp) * Math.PI)
    + 0.1 * Math.sin(interpolate(f, [STUDY + 22, STUDY + 34], [0, 1], clamp) * Math.PI);
  const study = arrive(f, STUDY + 62, fps);
  const fairA = arrive(f, fairSolid ? SUG + 70 : SUG + 6, fps);
  const msA = arrive(f, SUG + 10, fps);
  return (
    <>
      <Img src={staticFile(IMG.empty)} style={{ position: "absolute", left: 0, top: 0, width: W, height: CAL_H }} />
      {blocks}
      {f >= SUG + 86 ? <Block b={KIND.fair} src={IMG.full} /> : null}
      <div style={{ position: "absolute", inset: 0, background: BG, opacity: Math.max(dim * 0.55, sugDim * 0.5, stDim * 0.5) }} />
      {/* above the dim: what each later beat is about */}
      {f < SUG + 86 ? <Block b={KIND.fair} src={fairSolid ? IMG.full : IMG.init} s={fairA.s} o={fairA.o} /> : null}
      <Block b={KIND.ms} src={IMG.init} s={msA.s} o={msA.o} />
      {f >= STUDY ? <Block b={KIND.quiz2} src={IMG.full} s={quizPulse} /> : null}
      <Block b={KIND.study} src={IMG.full} s={study.s} o={study.o} />
    </>
  );
};

/** A kind arriving from the side of the frame, held to be read, then travelling into its slot. */
const KindHero: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const h = KINDS[i];
  const k = kindAt(i);
  if (f < k + IN || f > k + LAND + 2) return null;
  const [w, hh] = heroSize(h);
  const e = travel(f, k + IN, fps);
  const g = grow(f, k + GO, fps);
  const slot = (KIND[h.kind] as Rect[])[0];
  let [tx, ty] = slotCentre(slot);
  let ts = ((slot.w + 4) * S) / w;
  if (h.kind === "assignments") { tx = 250 * S; ty = CAL_TOP + 100 * S; ts = 0.26; }
  const sx = h.side < 0 ? -w * 0.7 : W + w * 0.7;
  const x = g > 0 ? lerp(g, HERO.x, tx) : lerp(e, sx, HERO.x);
  const y = g > 0 ? lerp(g, HERO.y, ty) : lerp(e, HERO.y + h.dy, HERO.y);
  const sc = g > 0 ? lerp(g, 1, ts) : 1;
  const rot = (1 - e) * h.side * -9;
  const op = 1 - ramp(f, k + LAND - 6, k + LAND + 1);
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - hh / 2, width: w, height: hh, opacity: op, zIndex: 50,
      transform: `rotate(${rot}deg) scale(${sc})` }}>
      {h.card ? <CardImg card={h.card} /> : (
        <Crop src={IMG.full} b={h.crop!.b} k={h.crop!.k} radius={8 * h.crop!.k}
          style={{ boxShadow: "0 50px 110px rgba(0,0,0,.65)" }} />
      )}
    </div>
  );
};

/** A real card that grows out of its slot (gc-open-sheet) or comes in from the side, then travels into a slot. */
const SlotCard: React.FC<{ card: Card; slot: Rect; outAt: number; backAt: number; fromSide?: 1; tapAt?: number }> = ({ card, slot, outAt, backAt, fromSide, tapAt }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < outAt || f > backAt + 16) return null;
  const dh = cardH(card);
  const [sx, sy] = slotCentre(slot);
  const small = ((slot.w + 4) * S) / card.dw;
  const o = fromSide ? travel(f, outAt, fps) : grow(f, outAt, fps);
  const b = travel(f, backAt, fps);
  const startX = fromSide ? W + card.dw * 0.7 : sx;
  const startY = fromSide ? HERO.y - 60 : sy;
  const x = f >= backAt ? lerp(b, HERO.x, sx) : lerp(o, startX, HERO.x);
  const y = f >= backAt ? lerp(b, HERO.y, sy) : lerp(o, startY, HERO.y);
  const sc = f >= backAt ? lerp(Math.min(1, b), 1, small) : fromSide ? 1 : lerp(o, small, 1);
  const tap = tapAt === undefined ? 1 : interpolate(f, [tapAt - 2, tapAt + 2, tapAt + 9], [1, 0.965, 1], clamp);
  const rot = fromSide ? (1 - o) * 9 : 0;
  const op = Math.min(ramp(f, outAt, outAt + 4), 1 - ramp(f, backAt + 9, backAt + 15));
  return (
    <div style={{ position: "absolute", left: x - card.dw / 2, top: y - dh / 2, width: card.dw, height: dh, opacity: op, zIndex: 50,
      transform: `rotate(${rot}deg) scale(${sc * tap})` }}>
      <CardImg card={card} />
    </div>
  );
};

/* ------------------------------------------------------------ the film */

// + Add on the fair card (fair.png, 900x594 at 3x): the button runs x 45 to 441 at y 494. The fingertip
// sits at the left of its label so "+ Add" stays readable under the press.
const FAIR_H = cardH(CARDS.fair);
const FAIR_ADD: [number, number] = [HERO.x - CARDS.fair.dw / 2 + (125 / 900) * CARDS.fair.dw, HERO.y - FAIR_H / 2 + (494 / 594) * FAIR_H];
const TAP = SUG + 52;

export const WeekFilm: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // intro: the icon pops in the middle of the frame, then the empty week opens behind it
  const icon = pop(f, 0, fps, 13);
  const iconGo = ramp(f, 20, 34, Easing.in(Easing.cubic));
  const open = ramp(f, 18, 44);
  // end: the week steps back, the logo lands with one settle
  const away = ramp(f, END + 14, END + 30, Easing.inOut(Easing.cubic));
  const calScale = lerp(open, 1.05, 1) * (1 - 0.05 * away);
  const calBlur = open < 1 ? (1 - open) * 12 : away * 14;
  const calOp = open * (1 - away * 0.8);

  const sentence = [
    [{ text: "Classes,", at: kindAt(0) + 4, until: kindAt(1) + 4 }, { text: "assignments,", at: kindAt(1) + 4, until: kindAt(2) + 4 }],
    [{ text: "a coffee chat,", at: kindAt(2) + 4, until: kindAt(3) + 4 }, { text: "your club,", at: kindAt(3) + 4, until: kindAt(4) + 4 }],
    [{ text: "work shifts.", at: kindAt(4) + 4, until: ONE - 4 }],
  ];

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      {/* the product is the frame: the week edge to edge, the band above it is its own header colour */}
      <div style={{ position: "absolute", inset: 0, opacity: calOp, filter: calBlur > 0.01 ? `blur(${calBlur}px)` : undefined,
        transform: `scale(${calScale})`, transformOrigin: "50% 64%" }}>
        <Img src={staticFile("four/week/band.png")} style={{ position: "absolute", left: 0, top: 0, width: W, height: CAL_TOP + 2 }} />
        <div style={{ position: "absolute", left: 0, top: CAL_TOP, width: W, height: CAL_H,
          maskImage: "linear-gradient(#000 0, #000 calc(100% - 60px), transparent)" }}>
          <Week />
        </div>
      </div>

      {KINDS.map((_, i) => <KindHero key={i} i={i} />)}
      <SlotCard card={CARDS.fair} slot={KIND.fair} outAt={SUG + 18} backAt={SUG + 58} tapAt={TAP} />
      {f >= SUG + 24 && f < TAP + 30 ? (
        <AbsoluteFill style={{ zIndex: 60 }}>
          <Hand from={[1000, 1820]} to={FAIR_ADD} at={SUG + 26} tapAt={TAP} leaveAt={TAP + 4} size={150} />
        </AbsoluteFill>
      ) : null}
      <SlotCard card={CARDS.study} slot={KIND.study} outAt={STUDY + 12} backAt={STUDY + 50} fromSide={1} />

      {/* the band: one line at a time, never on the product */}
      <Band at={0} until={INTRO - 4} top={200}>
        <BlurLines at={8} size={84} ink={INK} face={ZODIAK} outAt={INTRO - 8} align="left" lines={[{ text: "How many places" }, { text: "do you check?", accent: true }]} />
      </Band>
      <Band at={INTRO} until={ONE + 8} top={170}>
        <KindSentence lines={sentence} size={70} outAt={ONE - 2} />
      </Band>
      <Band at={ONE} until={SUG + 6} top={200}>
        <BlurLines at={ONE + 4} size={88} ink={INK} face={ZODIAK} outAt={SUG - 6} align="left" lines={[{ text: "All in" }, { text: "one calendar.", accent: true }]} />
      </Band>
      <Band at={SUG} until={STUDY + 6} top={210}>
        <BlurLines at={SUG + 2} size={78} ink={INK} face={ZODIAK} outAt={STUDY - 6} align="left" lines={[{ text: "Plus what CampusAI" }, { text: "suggests.", accent: true }]} />
      </Band>
      <Band at={STUDY} until={END + 30} top={210}>
        <BlurLines at={STUDY + 2} size={78} ink={INK} face={ZODIAK} outAt={END + 14} align="left" lines={[{ text: "And time to study," }, { text: "before the quiz.", accent: true }]} />
      </Band>

      {f < 36 ? (
        <div style={{ position: "absolute", left: W / 2, top: HERO.y, transform: `translate(-50%,-50%) scale(${icon * (1 - iconGo * 0.35)})`, opacity: 1 - iconGo }}>
          <AppIcon size={230} glow={0.35} />
        </div>
      ) : null}
      {f >= END + 20 ? <EndCard at={END + 20} /> : null}
    </AbsoluteFill>
  );
};

const Band: React.FC<{ at: number; until: number; top: number; children: React.ReactNode }> = ({ at, until, top, children }) => {
  const f = useCurrentFrame();
  if (f < at || f >= until) return null;
  return <div style={{ position: "absolute", left: 84, right: 60, top, zIndex: 70 }}>{children}</div>;
};

/** The logo lands with one settle, then "Link in bio." Nothing rises from below. */
const EndCard: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 140, mass: 0.8 } });
  const t = ramp(f, at + 16, at + 28);
  return (
    <AbsoluteFill style={{ alignItems: "center", zIndex: 80 }}>
      <div style={{ marginTop: 760, transform: `scale(${0.6 + 0.4 * s})`, opacity: ramp(f, at, at + 5) }}>
        <AppIcon size={250} glow={0.32} />
      </div>
      <div style={{ marginTop: 56, fontFamily: ZODIAK.family, fontWeight: 700, fontSize: 54, letterSpacing: ZODIAK.track, color: "#fff",
        opacity: t, filter: t < 1 ? `blur(${(1 - t) * 10}px)` : undefined }}>Link in bio.</div>
    </AbsoluteFill>
  );
};
