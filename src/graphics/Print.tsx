/**
 * Print set for campus tabling (2026-10-23). Four pieces, same family as Features.tsx (dark ground with the
 * product's red glow, logo and campusai.app on the top row, one Zodiak line, the real page big), plus the one
 * thing print adds: a QR code to https://campusai.app, drawn here from a matrix generated locally
 * (public/print/qr-campusai.json, Python `qrcode`, ECC M, version 2, 25 modules) on a white tile, dark modules,
 * so any phone camera reads it.
 *
 * Every size is in print pixels at 300 dpi INCLUDING 0.125 in bleed on every side; type and marks stay at least
 * 0.25 in inside the trim (SAFE below). PDFs and crop marks are assembled after render by
 * films/print-oct23/build_pdfs.py.
 *
 *   1. Flyer, US letter 8.5x11 in       Print-Flyer       2625x3375
 *   2. Table tent, two 6x4 in faces      Print-TentA/B     1875x1275 each (placed on one letter sheet in the PDF)
 *   3. QR poster, tabloid 11x17 in       Print-Poster      3375x5175
 *   4. Handout card, 3.5x2 in            Print-CardFront/Back 1125x675
 *
 * Captures: public/print/ (capture/print-surfaces.cjs, the system-flows b and d flows re-shot at DPR 4 so a
 * printed crop has real pixels). Words and sources: films/print-oct23/facts.md.
 *
 *   npx remotion still src/graphics/entry-print.ts Print-Flyer out/print/flyer.png
 */
import React from "react";
import { AbsoluteFill, Composition, Img, staticFile } from "remotion";
import { brand, INTER, PageView, useBrandFonts } from "../kit";
import type { PageCam, Rect, Size } from "../kit";
import QR from "../../public/print/qr-campusai.json";

const B = brand("campusai");
const ZODIAK = "Zodiak";
const IN = 300;
const BLEED = 0.125 * IN;
/** Trim plus the 0.25 in safe zone, from the bleed edge. */
const SAFE = BLEED + 0.25 * IN;
const pt = (n: number) => (n / 72) * IN;

const PAGE: Size = { w: 1440, h: 900 };
const JOBS = "print/job-0-list.jpg";
// The list scrolled to Fannie Mae and The Carlyle Group (capture/print-jobs-tent.cjs): reason lines, no deadline.
const JOBS_LATER = "print/job-tent-list.jpg";
const EVENTS = "print/cal-3-added.jpg";

/* ------------------------------------------------------------------ parts */

const Ground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useBrandFonts(B);
  return (
    <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient, fontFamily: INTER, overflow: "hidden" }}>
      {children}
    </AbsoluteFill>
  );
};

const RATIO = B.logo ? B.logo.ratio : 4;
const Logo: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) =>
  B.logo ? <Img src={staticFile(B.logo.onDark)} style={{ position: "absolute", left: x, top: y, width: w }} /> : null;

/** The address on the right of the top row, centred on the logo's height. */
const Addr: React.FC<{ right: number; y: number; logoW: number; size: number }> = ({ right, y, logoW, size }) => (
  <div style={{ position: "absolute", right, top: y + logoW / RATIO / 2 - size * 0.6, height: size * 1.2, lineHeight: `${size * 1.2}px`,
    fontSize: size, fontWeight: 600, color: B.color.inkSoft, letterSpacing: "-0.005em" }}>campusai.app</div>
);

const Line: React.FC<{ text: string; x: number; w: number; top: number; size: number }> = ({ text, x, w, top, size }) => (
  <div style={{ position: "absolute", left: x, width: w, top, fontFamily: ZODIAK, fontWeight: 700, fontSize: size, lineHeight: 1.08,
    letterSpacing: "-0.02em", color: B.color.ink, textWrap: "balance" } as React.CSSProperties}>{text}</div>
);

const Small: React.FC<{ text: string; x: number; top: number; size: number; w?: number; align?: "left" | "right" | "center" }> = ({ text, x, top, size, w, align = "left" }) => (
  <div style={{ position: "absolute", left: x, top, width: w, textAlign: align, fontSize: size, lineHeight: 1.25, fontWeight: 600,
    color: B.color.inkSoft, letterSpacing: "-0.005em" }}>{text}</div>
);

/** The real page through the kit camera. */
const Product: React.FC<{ src: string; cam: PageCam; view: Rect; radius: number }> = ({ src, cam, view, radius }) => (
  <PageView src={staticFile(src)} page={PAGE} cam={cam} view={view} brand={B} radius={radius} />
);

/**
 * The QR code on a white tile. `code` is the width of the 25 modules; the tile adds a 3-module quiet zone on
 * every side (ISO asks 4; 3 on a white tile surrounded by a dark ground reads fine, tested by decoding).
 */
const QUIET = 3;
const QRTile: React.FC<{ x: number; y: number; code: number; radius?: number }> = ({ x, y, code, radius = 0.05 }) => {
  const n = QR.size;
  const m = code / n;
  const tile = code + 2 * QUIET * m;
  const rects: React.ReactNode[] = [];
  QR.rows.forEach((row, r) => {
    // Runs of dark modules in a row become one rect, so there are no hairline seams between modules.
    let c = 0;
    while (c < n) {
      if (row[c] !== "1") { c++; continue; }
      let e = c;
      while (e < n && row[e] === "1") e++;
      rects.push(<rect key={`${r}-${c}`} x={c} y={r} width={e - c} height={1} />);
      c = e;
    }
  });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: tile, height: tile, background: "#ffffff", borderRadius: tile * radius }}>
      <svg viewBox={`0 0 ${n} ${n}`} width={code} height={code} shapeRendering="crispEdges"
        style={{ position: "absolute", left: QUIET * m, top: QUIET * m }}>
        <g fill={B.color.bgDeep}>{rects}</g>
      </svg>
    </div>
  );
};
const tileOf = (code: number) => code + (2 * QUIET * code) / QR.size;

/* ------------------------------------------------------------------ the words (every one in facts.md) */

const JOBS_LINE = "Jobs picked for you, and why each one fits.";
const EVENTS_LINE = "Campus events, picked for you.";
const SCAN = "Scan to open campusai.app";
const ONE_PLACE = "Jobs, classes and events in one place.";

/* ------------------------------------------------------------------ crops (page px of the 1440x900 capture) */

// Job Match list column: "Jobs for you", then the Deloitte, Goldman Sachs and Capital One cards, each with its
// one-line reason. The column runs x 269 to 705; the detail panel beside it (x 722+) names Sandy Spring and is
// always kept out of frame.
const JOBS_COL = { x0: 256, x1: 718 };
const jobsCam = (cy: number): PageCam => ({ cx: (JOBS_COL.x0 + JOBS_COL.x1) / 2, cy, cw: JOBS_COL.x1 - JOBS_COL.x0 });
// Events: "Recommended for you" and the card grid (x 248 to 1408). Left column alone is x 248 to 822.
const EVENTS_ALL = { x0: 236, x1: 1420 };
const EVENTS_LEFT = { x0: 236, x1: 834 };

/* ------------------------------------------------------------------ 1. flyer, letter */

const FLYER = { W: 8.75 * IN, H: 11.25 * IN };
const Flyer: React.FC = () => {
  const { W, H } = FLYER;
  const logoW = 2 * IN;
  const view = { x: SAFE, y: 900, w: W - 2 * SAFE, h: 1760 };
  const code = 1.35 * IN;
  const tile = tileOf(code);
  const tileY = H - SAFE - tile;
  const ch = (JOBS_COL.x1 - JOBS_COL.x0) * (view.h / view.w);
  return (
    <Ground>
      <Logo x={SAFE} y={SAFE + 30} w={logoW} />
      <Addr right={SAFE} y={SAFE + 30} logoW={logoW} size={pt(20)} />
      <Line text={JOBS_LINE} x={SAFE} w={W - 2 * SAFE} top={410} size={pt(50)} />
      {/* From the Goldman Sachs card (y 382) through Capital One's reason line (y 712). Deloitte's "Closes Oct 24" stays
          out, so the flyer does not date itself this weekend. */}
      <Product src={JOBS} cam={jobsCam(376 + ch / 2)} view={view} radius={44} />
      {/* The list keeps going: Capital One's card fades out instead of being cut through its reason line. */}
      <div style={{ position: "absolute", left: view.x, width: view.w, top: view.y + view.h - 300, height: 302, borderRadius: "0 0 44px 44px",
        background: `linear-gradient(180deg, rgba(11,7,8,0) 0%, ${B.color.bgDeep} 92%)` }} />
      <Small text="Scan to open" x={SAFE} top={tileY + tile / 2 - pt(26) * 1.3} size={pt(26)} />
      <div style={{ position: "absolute", left: SAFE, top: tileY + tile / 2 + 6, fontFamily: ZODIAK, fontWeight: 700, fontSize: pt(40),
        lineHeight: 1.05, letterSpacing: "-0.02em", color: B.color.ink }}>campusai.app</div>
      <QRTile x={W - SAFE - tile} y={tileY} code={code} />
    </Ground>
  );
};

/* ------------------------------------------------------------------ 2. table tent, two 6x4 faces */

const TENT = { W: 6.25 * IN, H: 4.25 * IN };
const TentFace: React.FC<{ face: "jobs" | "events" }> = ({ face }) => {
  const { W, H } = TENT;
  const colW = 2.55 * IN;
  const logoW = 1.35 * IN;
  // The product runs off the right edge and the bottom, so it is the ground of that half, not a cut-out.
  const view = { x: SAFE + colW + 0.2 * IN, y: SAFE, w: W - (SAFE + colW + 0.2 * IN) + 60, h: H - SAFE + 60 };
  const code = 0.95 * IN;
  const tile = tileOf(code);
  // Events: the left column cropped at x 756, so its 800 px of height ends above the docked chat bar (y 805).
  const col = face === "jobs" ? JOBS_COL : { x0: EVENTS_LEFT.x0, x1: 756 };
  const cw = col.x1 - col.x0;
  // Jobs: Fannie Mae (y 70) and The Carlyle Group (to y 401), neither with a "Closes" date, since the tent sits on
  // a table for weeks. Its window ends under Carlyle and sits centred on the face, running off the right edge only.
  const top = face === "jobs" ? 62 : 140;
  const v = face === "jobs" ? { ...view, h: (414 - top) * (view.w / cw) } : view;
  const vv = face === "jobs" ? { ...v, y: (H - v.h) / 2 } : v;
  const cam: PageCam = { cx: (col.x0 + col.x1) / 2, cy: top + (cw * (vv.h / vv.w)) / 2, cw };
  return (
    <Ground>
      <Product src={face === "jobs" ? JOBS_LATER : EVENTS} cam={cam} view={vv} radius={36} />
      <Logo x={SAFE} y={SAFE + 6} w={logoW} />
      <Line text={face === "jobs" ? JOBS_LINE : EVENTS_LINE} x={SAFE} w={colW} top={SAFE + logoW / RATIO + 0.32 * IN} size={pt(25)} />
      <QRTile x={SAFE} y={H - SAFE - tile} code={code} />
      <Small text="Scan to open" x={SAFE + tile + 0.16 * IN} top={H - SAFE - tile / 2 - pt(11) * 1.3} size={pt(11)} />
      <div style={{ position: "absolute", left: SAFE + tile + 0.16 * IN, top: H - SAFE - tile / 2 + 2, fontSize: pt(13), fontWeight: 700,
        color: B.color.ink, letterSpacing: "-0.01em" }}>campusai.app</div>
    </Ground>
  );
};

/* ------------------------------------------------------------------ 3. QR poster, tabloid */

const POSTER = { W: 11.25 * IN, H: 17.25 * IN };
const Poster: React.FC = () => {
  const { W, H } = POSTER;
  const logoW = 2.6 * IN;
  // 5.8 in of code: 0.232 in (5.9 mm) modules, about 13.5 to 1 at 2 m. Tested by decoding a 2 m phone-sized copy.
  const code = 5.8 * IN;
  const tile = tileOf(code);
  const tileY = H - SAFE - tile;
  const scanY = tileY - 0.3 * IN - pt(30) * 1.25;
  const top = 3.85 * IN;
  const view = { x: SAFE, y: top, w: W - 2 * SAFE, h: scanY - 0.35 * IN - top };
  const cw = EVENTS_ALL.x1 - EVENTS_ALL.x0;
  const ch = cw * (view.h / view.w);
  return (
    <Ground>
      <Logo x={SAFE} y={SAFE + 40} w={logoW} />
      <Addr right={SAFE} y={SAFE + 40} logoW={logoW} size={pt(26)} />
      <Line text={EVENTS_LINE} x={SAFE} w={W - 2 * SAFE} top={1.45 * IN} size={pt(64)} />
      <Product src={EVENTS} cam={{ cx: (EVENTS_ALL.x0 + EVENTS_ALL.x1) / 2, cy: 140 + ch / 2, cw }} view={view} radius={56} />
      <Small text={SCAN} x={0} w={W} align="center" top={scanY} size={pt(30)} />
      <QRTile x={(W - tile) / 2} y={tileY} code={code} radius={0.04} />
    </Ground>
  );
};

/* ------------------------------------------------------------------ 4. handout card, 3.5x2 */

const CARD = { W: 3.75 * IN, H: 2.25 * IN };
const CardFront: React.FC = () => {
  const { W, H } = CARD;
  const logoW = 0.95 * IN;
  // The Goldman Sachs card and its reason line, running off the bottom and both sides.
  const view = { x: -20, y: 0.93 * IN, w: W + 40, h: H - 0.93 * IN + 20 };
  return (
    <Ground>
      <Product src={JOBS} cam={{ cx: 487, cy: 383 + ((436 + 40) * (view.h / view.w)) / 2 - 6, cw: 436 + 40 }} view={view} radius={0} />
      {/* The ground eases into the page instead of meeting it on a hard edge. */}
      <div style={{ position: "absolute", left: 0, right: 0, top: view.y - 2, height: 0.16 * IN,
        background: `linear-gradient(180deg, ${B.color.bgDeep} 0%, rgba(11,7,8,0) 100%)` }} />
      <Logo x={SAFE} y={SAFE} w={logoW} />
      <Line text="Jobs picked for you, and why." x={SAFE} w={W - 2 * SAFE} top={SAFE + logoW / RATIO + 0.08 * IN} size={pt(12)} />
    </Ground>
  );
};

const CardBack: React.FC = () => {
  const { W, H } = CARD;
  const code = 1.05 * IN;
  const tile = tileOf(code);
  const tx = W - SAFE - tile;
  const ty = (H - tile) / 2;
  const logoW = 1.1 * IN;
  return (
    <Ground>
      <Logo x={SAFE} y={SAFE + 4} w={logoW} />
      <div style={{ position: "absolute", left: SAFE, top: H / 2 - pt(16) * 0.4, fontFamily: ZODIAK, fontWeight: 700, fontSize: pt(16),
        lineHeight: 1.05, letterSpacing: "-0.02em", color: B.color.ink }}>campusai.app</div>
      <Small text={ONE_PLACE} x={SAFE} w={tx - SAFE - 0.12 * IN} top={H - SAFE - pt(9) * 1.25 * 2} size={pt(9)} />
      <QRTile x={tx} y={ty} code={code} radius={0.07} />
    </Ground>
  );
};

/* ------------------------------------------------------------------ registry */

export const PrintRoot: React.FC = () => (
  <>
    <Composition id="Print-Flyer" component={Flyer} durationInFrames={1} fps={30} width={FLYER.W} height={FLYER.H} />
    <Composition id="Print-TentA" component={TentFace} durationInFrames={1} fps={30} width={TENT.W} height={TENT.H} defaultProps={{ face: "jobs" as const }} />
    <Composition id="Print-TentB" component={TentFace} durationInFrames={1} fps={30} width={TENT.W} height={TENT.H} defaultProps={{ face: "events" as const }} />
    <Composition id="Print-Poster" component={Poster} durationInFrames={1} fps={30} width={POSTER.W} height={POSTER.H} />
    <Composition id="Print-CardFront" component={CardFront} durationInFrames={1} fps={30} width={CARD.W} height={CARD.H} />
    <Composition id="Print-CardBack" component={CardBack} durationInFrames={1} fps={30} width={CARD.W} height={CARD.H} />
  </>
);
