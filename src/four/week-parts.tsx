/**
 * Parts for the Week film, round 2 (2026-10-19). Everything that shows the product is a crop of a
 * real capture (public/four/week, capture-week2.cjs): My Calendar at the product's own narrow layout
 * (760 css wide), Mon to Sat, at DPR 5, in three states read from one session: wk-init (before the
 * demo's own two Adds, with the dashed suggestions), wk-full (after them) and wk-empty (every block
 * hidden). Block rects are the page's own DOM rects (meta2.json), in css px inside the crop.
 */
import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { ZODIAK, ramp } from "../kit/parts";

export const W = 1080;
export const H = 1920;
export const RED = "#D9202E";
export const BG = "#0b0708";

/* ---------------------------------------------------------------- the grid */

/** The crop in css px (Mon's left edge to Sat's right, day header to the end of the 8pm row). */
export const GRID = { w: 591, h: 716 };
export const S = W / GRID.w; // css px to frame px, 1.827
export const CAL_H = GRID.h * S; // 1308
export const CAL_TOP = H - CAL_H; // 612, the band above is the headline's
export const PITCH = 98.43; // one day column, css px

export type Rect = { x: number; y: number; w: number; h: number };
export const r = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

/** Frame position of a rect's centre, and its width in frame px. */
export const slotCentre = (b: Rect): [number, number] => [(b.x + b.w / 2) * S, CAL_TOP + (b.y + b.h / 2) * S];

export const IMG = {
  full: "four/week/wk-full.png",
  init: "four/week/wk-init.png",
  empty: "four/week/wk-empty.png",
};

/**
 * The week sorted by KIND, the point of the film: each kind normally lives somewhere else.
 * Rects from meta2.json (fullBlocks / initBlocks).
 */
export const KIND = {
  classes: [
    r(2.3, 276, 93.3, 53), // Mon BMGT343 Investments (the hero)
    r(2.3, 408, 93.3, 53), // Mon BMGT380
    r(100.6, 210, 44.6, 53), // Tue BMGT310
    r(100.6, 408, 93.3, 53), // Tue BMGT364
    r(198.9, 276, 93.3, 53), // Wed BMGT343
    r(198.9, 408, 93.3, 53), // Wed BMGT380
    r(297.2, 210, 93.3, 53), // Thu BMGT310
    r(297.2, 408, 93.3, 53), // Thu BMGT364
  ],
  assignments: [
    r(4.4, 61, 89.4, 23), // Mon Problem set 3
    r(102.9, 61, 89.4, 23), // Tue Reading Ch. 6-7
    r(102.9, 88, 89.4, 23), // Tue Case Analysis
    r(201.3, 61, 89.4, 23), // Wed Reading Response 5
    r(299.7, 61, 89.4, 23), // Thu Quiz 2
    r(299.7, 88, 89.4, 23), // Thu Reading Ch. 8
    r(299.7, 120, 89.4, 19), // Thu +1 more
    r(398.1, 61, 89.4, 23), // Fri Quiz 4
    r(398.1, 88, 89.4, 23), // Fri Peer Review
  ],
  chat: [r(149.2, 232, 44.6, 64)], // Tue Evercore Coffee Chat
  club: [r(297.2, 606, 93.3, 64)], // Thu Smith Finance Group Stock Pitch Night
  shifts: [r(2.3, 496, 93.3, 86), r(198.9, 496, 93.3, 86)], // Mon and Wed Work shift
  fair: r(395.4, 232, 93.3, 218), // Fri, dashed in init, solid in full
  ms: r(493.7, 584, 93.3, 64), // Sat Morgan Stanley, dashed in both
  study: r(198.9, 584, 93.3, 86), // Wed 6 to 8pm, only in full
  quiz2: r(299.7, 61, 89.4, 23),
};

/**
 * A piece of a capture: rect `b` (css px) cut out of `src`, shown `k` frame px per css px.
 * Used for grid blocks (k = S) and for a block pulled out large.
 */
export const Crop: React.FC<{ src: string; b: Rect; k: number; pad?: number; radius?: number; style?: React.CSSProperties }> = ({
  src, b, k, pad = 2, radius = 0, style,
}) => (
  <div style={{ position: "relative", width: (b.w + pad * 2) * k, height: (b.h + pad * 2) * k, overflow: "hidden", borderRadius: radius, ...style }}>
    <Img src={staticFile(src)} style={{ position: "absolute", left: -(b.x - pad) * k, top: -(b.y - pad) * k, width: GRID.w * k, height: GRID.h * k, maxWidth: "none" }} />
  </div>
);

/** A grid block in place on the week, popped by `s` and faded by `o`. */
export const Block: React.FC<{ b: Rect; src: string; s?: number; o?: number }> = ({ b, src, s = 1, o = 1 }) => {
  if (o <= 0) return null;
  const pad = 2;
  return (
    <div style={{ position: "absolute", left: (b.x - pad) * S, top: (b.y - pad) * S, opacity: o, transform: `scale(${s})`, transformOrigin: "50% 50%" }}>
      <Crop src={src} b={b} k={S} pad={pad} />
    </div>
  );
};

/* ---------------------------------------------------------------- cards */

/** A real card capture (native px), shown `dw` frame px wide, rounded, lifted off the page. */
export type Card = { src: string; w: number; h: number; dw: number; radius: number; cropB?: number; cropT?: number };
export const cardH = (c: Card) => ((c.h - (c.cropB ?? 0) - (c.cropT ?? 0)) * c.dw) / c.w;

export const CardImg: React.FC<{ card: Card }> = ({ card }) => (
  <div style={{ width: card.dw, height: cardH(card), borderRadius: card.radius, overflow: "hidden", position: "relative",
    boxShadow: "0 50px 110px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.09)" }}>
    <Img src={staticFile(card.src)} style={{ position: "absolute", left: 0, top: -((card.cropT ?? 0) * card.dw) / card.w, width: card.dw, height: (card.h * card.dw) / card.w, maxWidth: "none" }} />
  </div>
);

export const CARDS = {
  tasks: { src: "four/week/tasks.png", w: 2100, h: 1605, dw: 960, radius: 30, cropB: 40 } as Card,
  evercore: { src: "four/week/evercore.png", w: 1446, h: 1158, dw: 900, radius: 30 } as Card,
  pitch: { src: "four/week/pitch.png", w: 1446, h: 642, dw: 960, radius: 30 } as Card,
  fair: { src: "four/week/fair.png", w: 900, h: 594, dw: 800, radius: 34 } as Card,
  study: { src: "four/week/study.png", w: 1224, h: 957, dw: 920, radius: 30, cropT: 84 } as Card,
};

/* ---------------------------------------------------------------- type */

/**
 * The kinds sentence. Its words sit in fixed places from the first frame, so the sentence types
 * itself into position kind by kind; the kind arriving now is red, the ones already in are white.
 * Colour only, never a style switch, so nothing reflows.
 */
export const KindSentence: React.FC<{ lines: { text: string; at: number; until: number }[][]; size: number; outAt: number }> = ({ lines, size, outAt }) => {
  const f = useCurrentFrame();
  const out = ramp(f, outAt, outAt + 10);
  return (
    <div style={{ textAlign: "left", fontFamily: ZODIAK.family, fontWeight: 700, fontSize: size, letterSpacing: ZODIAK.track, lineHeight: 1.16,
      opacity: 1 - out, filter: out ? `blur(${out * 14}px)` : undefined }}>
      {lines.map((line, li) => (
        <div key={li}>
          {line.map((ph, i) => {
            const p = ramp(f, ph.at, ph.at + 12);
            const white = ramp(f, ph.until, ph.until + 8);
            return (
              <span key={i} style={{ display: "inline-block", marginRight: i < line.length - 1 ? "0.26em" : 0, opacity: p,
                filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined, transform: `translateY(${(1 - p) * 0.25 * size}px)`,
                color: mix(white) }}>{ph.text}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Red to white. */
const mix = (t: number) => {
  const a = [217, 32, 46];
  const c = a.map((v) => Math.round(v + (255 - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export const AppIcon: React.FC<{ size: number; glow: number }> = ({ size, glow }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.235, overflow: "hidden", boxShadow: `0 30px 100px rgba(217,32,46,${glow})` }}>
    <Img src={staticFile("kit/app-icon.png")} style={{ width: "100%", height: "100%", display: "block" }} />
  </div>
);
