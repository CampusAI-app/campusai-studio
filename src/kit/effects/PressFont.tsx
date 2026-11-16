/**
 * Press font (2026-11-15, effect 19 of Skill Stack Store's "20 Claude Effects in 20 Secs" reel, 22.75 to 24.1 s, stepped
 * frame by frame; facts in films/effects-skillstack/facts.md). What the reel does: a hard cut to a cream newspaper
 * front page: a condensed serif caps headline, an italic serif deck under it, hairline rules, small body columns either
 * side, and the speaker's LIVE footage in the middle printed as black halftone dots. Held about 1.35 s.
 *
 * Ours: the same page, set as a real broadsheet: a blackletter masthead between double rules, the headline in Instrument
 * Serif caps, the deck in its italic, Old Standard for the furniture, newsprint grain, and the footage screened live
 * through InkScreen (45 degree dot screen, renders headless). The page lands with a 3 frame press (the headline settles
 * from 104%) and pushes in 3% over the hold. Body copy is printed as grey type lines, so no words are invented; only the
 * column heads are words. `PressPage` is the page alone, so Paper tear (or anything) can take it.
 *
 *   <PressFont clip="x/clip.mp4" at={74} outAt={118} masthead="Week one" headline="One simple goal"
 *     deck="Bring students together and break the digital divide." columns={["Last week", "The goal"]}
 *     photo={{ x: 537, y: 900, zoom: 0.62 }} />
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadFraktur } from "@remotion/google-fonts/UnifrakturMaguntia";
import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadOldStandard } from "@remotion/google-fonts/OldStandardTT";
import { Sfx, k, mix } from "./shared";
import { Framing, InkScreen, framedStyle, rng } from "./InkScreen";

const { fontFamily: FRAKTUR } = loadFraktur("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: INSTRUMENT } = loadInstrument("normal", { weights: ["400"], subsets: ["latin"] });
loadInstrument("italic", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: OLDSTD } = loadOldStandard("normal", { weights: ["400", "700"], subsets: ["latin"] });

const PAPER = "#EFE7D6";
const INK = "#1A1714";

export type PressPageProps = {
  /** The footage printed in the middle (path under public/). */
  clip: string;
  /** Frames into the clip, so the printed picture stays in sync with the voice. */
  startFrom?: number;
  /** The clip pixel kept at the photo's centre, and the clip's scale inside the photo. */
  photo: { x: number; y: number; zoom: number };
  masthead: string;
  headline: string;
  deck: string;
  /** The two body column heads, left and right. Body text is printed as type lines, never invented words. */
  columns?: [string, string];
  /** A small neutral line in the dateline row (left). */
  dateline?: string;
  /** Halftone cell, px. */
  dot?: number;
  /** Frames since the page appeared (drives the press and the push). */
  since?: number;
  /** Headline size, px. The default fits about ten capitals a line. */
  headlineSize?: number;
};

/** A column of printed type lines: grey bars at newspaper leading, ragged only on paragraph ends. */
const TypeLines: React.FC<{ width: number; lines: number; seed: number; lead?: number; size?: number }> = ({ width, lines, seed, lead = 21, size = 6 }) => {
  const r = rng(seed);
  const rows: { w: number; indent: number; gap: boolean }[] = [];
  let sinceBreak = 0;
  for (let i = 0; i < lines; i++) {
    const end = sinceBreak > 4 && r() < 0.22;
    rows.push({ w: end ? width * (0.3 + r() * 0.5) : width, indent: sinceBreak === 0 ? 18 : 0, gap: false });
    sinceBreak = end ? 0 : sinceBreak + 1;
  }
  return (
    <svg width={width} height={lines * lead} style={{ display: "block" }}>
      {rows.map((row, i) => {
        // each line is a run of word-sized bars, so it reads as type, not a stripe
        const words: React.ReactNode[] = [];
        let x = row.indent;
        const rr = rng(seed * 31 + i);
        while (x < row.w - 8) {
          const ww = Math.min(row.w - x, 14 + rr() * 46);
          words.push(<rect key={x} x={x} y={i * lead + (lead - size) / 2} width={ww} height={size} rx={1.5} fill={INK} opacity={0.42} />);
          x += ww + 6;
        }
        return <g key={i}>{words}</g>;
      })}
    </svg>
  );
};

const Rule: React.FC<{ w: number; double?: boolean; heavy?: boolean }> = ({ w, double, heavy }) => (
  <div style={{ width: w }}>
    <div style={{ height: heavy ? 5 : 1.5, background: INK }} />
    {double ? <div style={{ height: 1.5, background: INK, marginTop: 5 }} /> : null}
  </div>
);

const Grain: React.FC<{ id: string }> = ({ id }) => (
  <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.22, mixBlendMode: "multiply", pointerEvents: "none" }}>
    <filter id={id}>
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={11} />
      <feColorMatrix values="0 0 0 0 0.32  0 0 0 0 0.26  0 0 0 0 0.18  0 0 0 0.55 0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#${id})`} />
  </svg>
);

/** The front page alone, full frame. */
export const PressPage: React.FC<PressPageProps> = (p) => {
  const { width: W, height: H } = useVideoConfig();
  const since = p.since ?? 99;
  const M = 54;
  const inner = W - M * 2;
  const gut = 26;
  const colW = 236;
  const photoW = inner - colW * 2 - gut * 2;
  const photoH = 760;
  const hs = p.headlineSize ?? 168;
  // motion: the press. The headline lands at 104% and settles in 3 frames; the whole page then pushes in 3% over the hold.
  const press = k(Math.max(0, since), 0, 3);
  const push = 1 + 0.03 * k(Math.max(0, since), 0, 60, (x) => x);
  const cols = p.columns ?? ["", ""];

  return (
    <AbsoluteFill style={{ background: PAPER, color: INK, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(255,251,240,0.55), rgba(255,251,240,0) 70%)" }} />
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})`, transformOrigin: "50% 46%" }}>
        <div style={{ position: "absolute", left: M, top: 64, width: inner, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Rule w={inner} double />
          {/* masthead */}
          <div style={{ fontFamily: FRAKTUR, fontSize: Math.min(150, inner / (p.masthead.length * 0.5)), lineHeight: 1.12, marginTop: 14, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
            {p.masthead}
          </div>
          <Rule w={inner} heavy />
          <div style={{ width: inner, display: "flex", justifyContent: "space-between", fontFamily: OLDSTD, fontSize: 24, padding: "7px 2px" }}>
            <span>{p.dateline ?? ""}</span>
            <span style={{ fontStyle: "italic" }}>Front page</span>
          </div>
          <Rule w={inner} />

          {/* headline and deck */}
          <div style={{ marginTop: 30, fontFamily: INSTRUMENT, fontSize: hs, lineHeight: 0.9, textAlign: "center", textTransform: "uppercase",
            letterSpacing: "-0.012em", textWrap: "balance", width: inner,
            transform: `scale(${mix(1.04, 1, press).toFixed(4)})`, opacity: mix(0.82, 1, press) } as React.CSSProperties}>
            {p.headline}
          </div>
          <div style={{ marginTop: 22, fontFamily: INSTRUMENT, fontStyle: "italic", fontSize: 50, lineHeight: 1.12, textAlign: "center", width: inner - 120, textWrap: "balance" } as React.CSSProperties}>
            {p.deck}
          </div>
          <div style={{ marginTop: 26 }}><Rule w={inner} /></div>

          {/* columns either side, the live picture in the middle */}
          <div style={{ marginTop: 22, width: inner, display: "flex", gap: gut, alignItems: "flex-start" }}>
            <div style={{ width: colW }}>
              <div style={{ fontFamily: OLDSTD, fontWeight: 700, fontSize: 31, lineHeight: 1.1, marginBottom: 12 }}>{cols[0]}</div>
              <TypeLines width={colW} lines={33} seed={3} />
            </div>
            <div style={{ width: photoW, borderLeft: `1.5px solid ${INK}`, borderRight: `1.5px solid ${INK}`, padding: `0 ${gut / 2}px`, boxSizing: "border-box" }}>
              <InkScreen id="press-photo" src={p.clip} startFrom={p.startFrom} width={photoW - gut} height={photoH}
                place={p.photo} pattern="dots" cell={p.dot ?? 9} angle={45} ink={INK} contrast={1.22} brightness={1.2} />
              <div style={{ height: 1.5, background: INK, marginTop: 10 }} />
              <TypeLines width={photoW - gut} lines={2} seed={41} />
            </div>
            <div style={{ width: colW }}>
              <div style={{ fontFamily: OLDSTD, fontWeight: 700, fontSize: 31, lineHeight: 1.1, marginBottom: 12 }}>{cols[1]}</div>
              <TypeLines width={colW} lines={33} seed={8} />
            </div>
          </div>
          <div style={{ marginTop: 18 }}><Rule w={inner} double /></div>
          <div style={{ marginTop: 18, width: inner, display: "flex", gap: gut }}>
            {[0, 1, 2, 3].map((i) => (
              <TypeLines key={i} width={(inner - gut * 3) / 4} lines={9} seed={60 + i} />
            ))}
          </div>
        </div>
      </AbsoluteFill>
      <Grain id="press-grain" />
      {/* soft page shadow at the edges, so it reads as paper not a flat fill */}
      <AbsoluteFill style={{ boxShadow: "inset 0 0 160px rgba(80, 60, 30, 0.22)", height: H }} />
    </AbsoluteFill>
  );
};

export type PressFontProps = PressPageProps & {
  /** Frame of the hard cut to the page, and the frame the footage comes back. */
  at: number;
  outAt: number;
  /** Framing of the full-frame footage before and after. */
  frame?: Framing;
  sound?: boolean;
};

/** The whole effect: footage, a hard cut to the front page, a hard cut back. The voice runs underneath throughout. */
export const PressFont: React.FC<PressFontProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const onPage = f >= p.at && f < p.outAt;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile(p.clip)} trimBefore={p.startFrom || undefined} />
      {onPage ? (
        <PressPage {...p} since={f - p.at} />
      ) : (
        <div style={framedStyle(W, H, p.frame)}>
          <OffthreadVideo src={staticFile(p.clip)} startFrom={p.startFrom ?? 0} muted style={{ width: W, height: H }} />
        </div>
      )}
      <Sfx at={p.at} name="paper-move-quick" volume={0.5} on={p.sound ?? true} />
    </AbsoluteFill>
  );
};
