/**
 * /pixel-art (2026-11-17, from the Nov 17 Muse sends: Matt Penny's ten Claude animation styles, Karam Mahaan's six skills
 * where relevant; prompts gated and unseen, so this is our own build of the look). Read frame by frame: a bright blue sky,
 * chunky pixel clouds and a pixel sun, a pixel skyline of towers in green, yellow, pink and blue with lit window grids and
 * little pixel trees, a pixel plane crossing, a pixel-font title banner.
 *
 * Ours, student-first at Maryland (round 2, Jacob 11/17: show the real product or be a little funny, best both, and open
 * on something UMD): the UMD M pops in and tags up top, a pixel campus rises (McKeldin in brick with its dome, towers
 * beside it), a student walks in and asks in a pixel speech box, a red plane tows the page's own heading across the sky,
 * a chunky pixel phone rises out of the plaza with the real Clubs & Orgs page on its screen (a capture, crisp, never
 * pixelated), CampusAI answers in the page's own words, and windows across campus turn red. The world sits on a 6 px grid
 * (drawn at 180 x 320, scaled up with crisp edges) and moves in whole grid steps at 12 fps. Pixelify Sans, a
 * proportional pixel face, never a monospace one.
 */
import React, { useMemo } from "react";
import { loadFont } from "@remotion/google-fonts/PixelifySans";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { RED, Cue, ramp } from "./common";
import { UmdOpen } from "./UmdOpen";
import { World } from "./world";

const { fontFamily: PIXEL } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

export type PixelArtProps = {
  /** Who the student is, first line of their speech box. */
  who: string;
  /** Their question. */
  ask: string;
  /** The words on the banner the plane tows. */
  banner: string;
  /** CampusAI's answer, two short lines. */
  answer: [string, string];
  source: string;
  /** The real phone capture shown on the pixel phone (public/), its size in capture pixels. */
  screen: { src: string; w: number; h: number };
  cta?: string;
};

const W = 180; // the scene in grid units; one unit is 6 px
const H = 320;
const STEP_F = 2.5; // motion: 12 fps steps, so every move lands on whole grid units like the reference
const T = { walk: 0, walkEnd: 26, ask: 8, askOut: 168, plane: 140, planeEnd: 300, phone: 176, answer: 196, light: 232, source: 206, end: 350 };
export const pixelEnd = (_p: PixelArtProps) => T.end;

const SKY = ["#2F8CF5", "#3E9BFA", "#55AAFF", "#6DBBFF", "#86CAFF"];
const INK = "#16213E";
const LIT = "#FFE07A";
const GROUND_Y = 240;

/* ---------- pixel helpers ---------- */
const Px: React.FC<{ x: number; y: number; w: number; h: number; c: string; o?: number }> = ({ x, y, w, h, c, o }) => (
  <rect x={Math.round(x)} y={Math.round(y)} width={w} height={h} fill={c} opacity={o} />
);

/** A sprite from rows of characters; each character is a palette key, "." is empty. Runs are merged into one rect. */
const Sprite: React.FC<{ rows: string[]; pal: Record<string, string>; x: number; y: number; flip?: boolean; s?: number }> = ({ rows, pal, x, y, flip, s = 1 }) => {
  const out: React.ReactNode[] = [];
  const wdt = Math.max(...rows.map((r) => r.length));
  rows.forEach((row, j) => {
    const r = flip ? row.padEnd(wdt, ".").split("").reverse().join("") : row;
    let i = 0;
    while (i < r.length) {
      const ch = r[i];
      if (ch === "." || !pal[ch]) { i++; continue; }
      let k = i;
      while (k < r.length && r[k] === ch) k++;
      out.push(<rect key={`${j}-${i}`} x={Math.round(x) + i * s} y={Math.round(y) + j * s} width={(k - i) * s} height={s} fill={pal[ch]} />);
      i = k;
    }
  });
  return <g>{out}</g>;
};

const CLOUD = ["....WWWW......", "..WWWWWWWW.WW.", ".WWWWWWWWWWWWW", "WWWWWWWWWWWWWWW", "SSSWWWWWWWSSSS.", ".SSSSSSSSSSSS.."];
const TREE = ["..GGGG..", ".GGLGGG.", "GGGGGLGG", "GLGGGGGG", ".GGGGGG.", "...TT...", "...TT..."];
const PLANE = [
  "..RR..................",
  "..RRR.................",
  "..RRRR.....RR.........",
  ".RRRRRRRRRRRRRRRRRR...",
  "RWWWWWWWWWWWWWWWWBBRR.",
  ".RRRRRRRRRRRRRRRRRRRR.",
  "..........RRR.........",
  "..........RR..........",
];
const STUDENT_TOP = [
  "...HHHHHH...",
  "..HHHHHHHH..",
  "..HSSSSSSH..",
  "..SSKSSKSS..",
  "...SSSSSS...",
  "....SSSS....",
  "..RRRRRRRR..",
  ".RRRRRRRRRR.",
  ".SRRRRRRRRS.",
  ".SRRRRRRRRS.",
  "..RRRRRRRR..",
  "..BBBBBBBB..",
];
const LEGS = [
  ["..BBB..BBB..", "..BBB..BBB..", "..BBB..BBB..", "..KKK..KKK.."],
  [".BBB....BBB.", ".BBB....BBB.", "BBB......BB.", "KKK......KK."],
];

/** A box with notched pixel corners and a border, popping open in three steps. */
const PixelBox: React.FC<{ x: number; y: number; w: number; h: number; k: number; border: string; bw?: number; tail?: { x: number; y: number }; children?: React.ReactNode }> = ({
  x, y, w, h, k, border, bw = 1, tail, children,
}) => {
  if (k <= 0) return null;
  const s = k < 0.34 ? 0.5 : k < 0.67 ? 0.8 : 1; // stepped pop
  const cx = x + w / 2, cy = y + h;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
      {tail ? (
        // the tail: a staircase from the box toward the speaker
        [...Array(6)].map((_, i) => {
          const tx = Math.round(x + 14 + (tail.x - (x + 14)) * (i / 5));
          const ty = y + h + i * Math.max(1, Math.round((tail.y - (y + h)) / 6));
          return <g key={i}><Px x={tx - 1} y={ty} w={4 - Math.floor(i / 2)} h={2} c={border} /><Px x={tx} y={ty} w={Math.max(1, 2 - Math.floor(i / 2))} h={1} c="#FFFFFF" /></g>;
        })
      ) : null}
      <Px x={x + bw} y={y} w={w - bw * 2} h={h} c={border} />
      <Px x={x} y={y + bw} w={w} h={h - bw * 2} c={border} />
      <Px x={x + bw} y={y + bw} w={w - bw * 2} h={h - bw * 2} c="#FFFFFF" />
      <Px x={x + bw} y={y + h - bw - 1} w={w - bw * 2} h={1} c="#D9E4F2" />
      {k >= 0.67 ? children : null}
    </g>
  );
};

/** Pixel text that types on in whole characters. */
const Typed: React.FC<{ text: string; x: number; y: number; size: number; at: number; f: number; color: string; weight?: number; anchor?: "start" | "middle"; cps?: number }> = ({
  text, x, y, size, at, f, color, weight = 600, anchor = "start", cps = 1.6,
}) => {
  const n = Math.max(0, Math.min(text.length, Math.floor(((f - at) / 2.5) * cps)));
  if (n <= 0) return null;
  return <text x={x} y={y} fontFamily={PIXEL} fontWeight={weight} fontSize={size} fill={color} textAnchor={anchor}>{text.slice(0, n)}</text>;
};

/* ---------- the campus ---------- */
type Tower = { x: number; w: number; top: number; c: string; dark: string; at: number };
const TOWERS: Tower[] = [
  { x: 0, w: 20, top: 178, c: "#3FBF6F", dark: "#2A8F50", at: 0 },
  { x: 94, w: 22, top: 188, c: "#FFC43D", dark: "#D99A16", at: 5 },
  { x: 118, w: 26, top: 152, c: "#FF6FA5", dark: "#D9467C", at: 10 },
  { x: 146, w: 34, top: 172, c: "#4C74FF", dark: "#2F4FD1", at: 15 },
];
const MCK_DX = -34; // McKeldin sits left of centre so the phone can rise on the right

const towerWindows = (t: Tower) => {
  const out: { x: number; y: number }[] = [];
  for (let y = t.top + 6; y < GROUND_Y - 8; y += 7) for (let x = t.x + 3; x < t.x + t.w - 4; x += 5) out.push({ x, y });
  return out;
};

const McKeldin: React.FC = () => {
  const BRICK = "#B8432F", BRICK_D = "#8E2E20", STONE = "#F2EBDD", STONE_D = "#CFC4B0", DOME = "#8FB3BF", DOME_D = "#6C94A2";
  const wingWin = [62, 69, 108, 115].flatMap((x) => [198, 208].map((y) => ({ x, y })));
  return (
    <g>
      {/* wings */}
      <Px x={56} y={192} w={68} h={28} c={BRICK} />
      <Px x={56} y={190} w={68} h={2} c={STONE} />
      <Px x={56} y={218} w={68} h={2} c={BRICK_D} />
      {wingWin.map((p, i) => <Px key={i} x={p.x} y={p.y} w={3} h={5} c={STONE} />)}
      {/* portico: pediment in stepped rows, entablature, four columns */}
      {[0, 1, 2, 3, 4, 5].map((r) => <Px key={r} x={78 - 1 + (5 - r) * 2} y={174 + r * 2} w={26 - (5 - r) * 4 + 2} h={2} c={r === 5 ? STONE_D : STONE} />)}
      <Px x={77} y={186} w={26} h={3} c={STONE} />
      <Px x={78} y={189} w={24} h={31} c={BRICK_D} />
      {[80, 86, 92, 98].map((x) => <g key={x}><Px x={x} y={189} w={2} h={31} c={STONE} /><Px x={x + 1} y={189} w={1} h={31} c={STONE_D} /></g>)}
      <Px x={74} y={218} w={32} h={2} c={STONE_D} />
      {/* drum, dome, lantern, spire */}
      <Px x={82} y={160} w={16} h={14} c={STONE} />
      {[84, 88, 92].map((x) => <Px key={x} x={x + 1} y={163} w={2} h={6} c={DOME_D} />)}
      {[0, 1, 2, 3, 4, 5].map((r) => <Px key={r} x={82 + [7, 5, 3, 2, 1, 0][r]} y={148 + r * 2} w={16 - [7, 5, 3, 2, 1, 0][r] * 2} h={2} c={r % 2 ? DOME_D : DOME} />)}
      <Px x={88} y={142} w={4} h={6} c={STONE} />
      <Px x={89} y={136} w={2} h={6} c={STONE_D} />
    </g>
  );
};

export const PixelArt: React.FC<PixelArtProps> = (p) => {
  const f = useCurrentFrame();
  const sf = Math.floor(f / STEP_F) * STEP_F; // the stepped clock
  const step = Math.floor(f / STEP_F);
  const k = (a: number, b: number) => ramp(sf, a, b);

  // the campus rises in whole-unit steps
  const rise = (at: number) => Math.round((1 - ramp(sf, at, at + 22)) * 110);
  const mckRise = rise(4);

  // the student walks in, then stands; a two-frame walk
  const walkK = k(T.walk, T.walkEnd);
  const stuX = Math.round(-26 + walkK * 30);
  const walking = walkK > 0 && walkK < 1;
  const legs = walking ? LEGS[step % 2] : LEGS[0];
  const bob = !walking && f >= T.ask && f < T.askOut && step % 4 < 2 ? -1 : 0;

  // the plane crosses right to left, towing the banner
  const planeK = k(T.plane, T.planeEnd);
  const planeX = Math.round(190 - planeK * 300);
  const planeY = 94 + (step % 8 < 4 ? 0 : 1);

  const askK = k(T.ask, T.ask + 6) * (1 - k(T.askOut - 3, T.askOut));
  const ansK = k(T.answer, T.answer + 6);
  const srcK = k(T.source, T.source + 6);

  // the windows: lit yellow from the start, then they turn red one by one across campus (the hero)
  const allWin = useMemo(() => TOWERS.flatMap((t, ti) => towerWindows(t).map((w) => ({ ...w, ti }))), []);
  const order = useMemo(() => allWin.map((_, i) => (i * 37) % allWin.length), [allWin]);

  // chunky clouds, each sprite pixel 3 grid units, drifting left a whole unit at a time
  const wrap = (v: number) => ((v % 260) + 260) % 260 - 50;
  const clouds = [
    { x: wrap(170 - Math.floor(step * 0.5)), y: 104 },
    { x: wrap(80 - Math.floor(step * 0.35)), y: 132 },
    { x: wrap(250 - Math.floor(step * 0.25)), y: 156 },
  ];

  return (
    <World endAt={T.end} ground={SKY[2]} ink="#FFFFFF" logo="white" logoSpot="top-right" font={PIXEL} fontWeight={700} cta={p.cta} end="wipe-left" endGround={SKY[1]}>
      <AbsoluteFill>
        <svg viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" style={{ width: "100%", height: "100%", fontVariantLigatures: "none" }}>
          {/* the sky in bands, the sun with stepped rays */}
          {SKY.map((c, i) => <Px key={c} x={0} y={i * 44} w={W} h={i === SKY.length - 1 ? GROUND_Y - i * 44 : 44} c={c} />)}
          <g>
            {[[-1, 12, 3], [0, 12, 0]].map(() => null)}
            {[...Array(21)].map((_, j) => {
              const dy = j - 10;
              const half = Math.round(Math.sqrt(Math.max(0, 100 - dy * dy)));
              return half > 0 ? <Px key={j} x={26 - half} y={30 + dy} w={half * 2} h={1} c={Math.abs(dy) > 7 || half > 8 ? "#FFB02E" : "#FFD84A"} /> : null;
            })}
            {(step % 6 < 3 ? [0, 2, 4, 6] : [1, 3, 5, 7]).map((r) => {
              const a = (r / 8) * Math.PI * 2;
              return <Px key={r} x={26 + Math.round(Math.cos(a) * 15) - 1} y={30 + Math.round(Math.sin(a) * 15) - 1} w={3} h={3} c="#FFD84A" />;
            })}
          </g>
          {clouds.map((c, i) => <Sprite key={i} rows={CLOUD} pal={{ W: "#FFFFFF", S: "#CFE6FF" }} x={c.x} y={c.y} s={3} />)}

          {/* the skyline, clipped at the ground so it rises out of it */}
          <defs><clipPath id="aboveGround"><rect x={0} y={0} width={W} height={GROUND_Y} /></clipPath></defs>
          <g clipPath="url(#aboveGround)">
            {TOWERS.map((t, ti) => {
              const dy = rise(t.at);
              return (
                <g key={ti} transform={`translate(0 ${dy})`}>
                  <Px x={t.x} y={t.top} w={t.w} h={GROUND_Y - t.top} c={t.c} />
                  <Px x={t.x + t.w - 3} y={t.top} w={3} h={GROUND_Y - t.top} c={t.dark} />
                  <Px x={t.x} y={t.top} w={t.w} h={2} c={t.dark} />
                  <Px x={t.x + Math.floor(t.w / 2) - 1} y={t.top - 6} w={2} h={6} c={t.dark} />
                </g>
              );
            })}
            {allWin.map((w, i) => {
              const dy = rise(TOWERS[w.ti].at);
              const turn = sf >= T.light + order[i] * (40 / allWin.length) * 1.0;
              const lit = (i * 13) % 5 !== 0 || turn;
              return <Px key={i} x={w.x} y={w.y + dy} w={2} h={3} c={turn ? RED : lit ? LIT : "#24305E"} />;
            })}
            <g transform={`translate(${MCK_DX} ${GROUND_Y - 220 + mckRise})`}><McKeldin /></g>
          </g>

          {/* ground: grass, trees, the brick plaza */}
          <Px x={0} y={GROUND_Y} w={W} h={12} c="#4CC35A" />
          <Px x={0} y={GROUND_Y} w={W} h={2} c="#2E9B46" />
          {[0, 4, 9, 16].map((x, i) => <Px key={i} x={20 + x * 9} y={GROUND_Y + 4 + (i % 2) * 3} w={2} h={1} c="#2E9B46" />)}
          {[20, 92, 120, 164].map((x, i) => (
            <g key={x} transform={`translate(0 ${Math.round((1 - k(26 + i * 3, 36 + i * 3)) * 8)})`}>
              <Sprite rows={TREE} pal={{ G: "#2FA34A", L: "#6FD86A", T: "#7A4A26" }} x={x - 4} y={GROUND_Y - 7} />
            </g>
          ))}
          <Px x={0} y={GROUND_Y + 12} w={W} h={H - GROUND_Y - 12} c="#C2624A" />
          {[...Array(16)].map((_, r) => (
            <g key={r}>
              <Px x={0} y={GROUND_Y + 12 + r * 6} w={W} h={1} c="#A04A35" />
              {[...Array(10)].map((__, c) => <Px key={c} x={c * 18 + (r % 2) * 9} y={GROUND_Y + 13 + r * 6} w={1} h={5} c="#A04A35" />)}
            </g>
          ))}

          {/* the student */}
          <g>
            <Px x={stuX + 2} y={300} w={22} h={2} c="#8E3B28" />
            <Sprite rows={[...STUDENT_TOP, ...legs]} pal={{ H: "#5A3418", S: "#F2C29B", K: INK, R: RED, B: "#2F4FA8" }} x={stuX} y={268 + bob * 2} s={2} />
          </g>

          {/* the pixel phone rises out of the plaza in whole steps; its screen is the real Clubs & Orgs page, crisp */}
          {f >= T.phone ? (() => {
            const PX = 98, PW = 78, SW = PW - 6, SH = Math.round((SW * p.screen.h) / p.screen.w), PH = SH + 12;
            const top = 110 + Math.round((1 - k(T.phone, T.phone + 16)) * 220);
            return (
              <g>
                <Px x={PX + 2} y={top} w={PW - 4} h={PH} c="#1B1B2E" />
                <Px x={PX} y={top + 2} w={PW} h={PH - 4} c="#1B1B2E" />
                <Px x={PX + 1} y={top + 1} w={PW - 2} h={PH - 2} c="#1B1B2E" />
                <Px x={PX + 2} y={top + 2} w={PW - 4} h={1} c="#3A3A5C" />
                <Px x={PX + PW / 2 - 6} y={top + 3} w={12} h={2} c="#3A3A5C" />
                <Px x={PX + PW} y={top + 22} w={1} h={10} c="#3A3A5C" />
                <image href={staticFile(p.screen.src)} x={PX + 3} y={top + 7} width={SW} height={SH} style={{ imageRendering: "auto" }} />
                <Px x={PX + PW / 2 - 8} y={top + PH - 4} w={16} h={2} c="#3A3A5C" />
              </g>
            );
          })() : null}
          {/* pixel sparkles burst round the phone as it lands */}
          {f >= T.phone + 16 && f < T.phone + 70 ? [[92, 112], [180, 120], [90, 200], [178, 210], [136, 100], [96, 156]].map(([x, y], i) => {
            const t = Math.floor((sf - T.phone - 16) / STEP_F);
            const r = Math.min(4, 1 + Math.floor(t / 2));
            const on = (t + i) % 3 !== 2 && t < 18;
            return on ? <g key={i}><Px x={x - r} y={y} w={r * 2 + 1} h={1} c="#FFF6B0" /><Px x={x} y={y - r} w={1} h={r * 2 + 1} c="#FFF6B0" /></g> : null;
          }) : null}

          {/* the plane and its banner */}
          {f >= T.plane && planeK < 1 ? (
            <g>
              <Sprite rows={PLANE} pal={{ R: RED, W: "#FFFFFF", B: "#9ED8FF" }} x={planeX} y={planeY} flip />
              {[...Array(6)].map((_, i) => <Px key={i} x={planeX + 22 + i * 2} y={planeY + 4 + (i % 2)} w={2} h={1} c={INK} />)}
              <Px x={planeX + 34} y={planeY - 3} w={96} h={16} c="#FFFFFF" />
              <Px x={planeX + 34} y={planeY - 3} w={96} h={1} c={INK} />
              <Px x={planeX + 34} y={planeY + 12} w={96} h={1} c={INK} />
              <Px x={planeX + 129} y={planeY - 3} w={1} h={16} c={INK} />
              {[0, 1, 2].map((i) => <Px key={i} x={planeX + 130 + i * 2} y={planeY - 3 + i * 3 + (step % 2)} w={2} h={10 - i * 3} c={RED} />)}
              <text x={planeX + 82} y={planeY + 8} textAnchor="middle" fontFamily={PIXEL} fontWeight={700} fontSize={9} fill={INK}>{p.banner}</text>
            </g>
          ) : null}

          {/* the student's speech box */}
          <PixelBox x={36} y={250} w={140} h={36} k={askK} border={INK} tail={{ x: stuX + 22, y: 268 }}>
            <Typed text={p.who} x={43} y={264} size={8} at={T.ask + 6} f={f} color="#4A5578" weight={600} cps={2.4} />
            <Typed text={p.ask} x={43} y={277} size={9} at={T.ask + 20} f={f} color={INK} weight={700} cps={2} />
          </PixelBox>

          {/* CampusAI answers in a box of its own, red bordered */}
          <PixelBox x={10} y={38} w={160} h={46} k={ansK} border={RED} bw={2}>
            <Typed text="CampusAI" x={17} y={51} size={8} at={T.answer + 4} f={f} color={RED} weight={600} cps={3} />
            <Typed text={p.answer[0]} x={17} y={64} size={9} at={T.answer + 10} f={f} color={INK} weight={700} cps={2.2} />
            <Typed text={p.answer[1]} x={17} y={76} size={9} at={T.answer + 10 + p.answer[0].length / 2.2 * 2.5} f={f} color={INK} weight={700} cps={2.2} />
          </PixelBox>

          {/* the small print on the plaza */}
          {srcK > 0 ? (
            <g opacity={srcK}>
              <Px x={8} y={306} w={164} h={11} c="#8E3B28" o={0.85} />
              <text x={90} y={313.5} textAnchor="middle" fontFamily={PIXEL} fontWeight={500} fontSize={5.4} fill="#FFE9DF">{p.source}</text>
            </g>
          ) : null}
        </svg>
      </AbsoluteFill>
      <Cue at={T.ask} name="typewriter-hit-soft" volume={0.35} />
      <Cue at={T.plane} name="air-woosh-quick" volume={0.35} />
      <Cue at={T.answer} name="typewriter-hit-soft" volume={0.35} />
      <Cue at={T.phone} name="hit-weak" volume={0.4} />
      <Cue at={T.light} name="chime-crystal" volume={0.4} />
      {/* the UMD M first, so a Maryland student knows it is theirs (Jacob 11/17), last so it sits on top */}
      <UmdOpen bigCy={820} tagCx={540} tagCy={120} />
    </World>
  );
};
