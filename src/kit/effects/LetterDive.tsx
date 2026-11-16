/**
 * Letter dive (2026-11-15, effect 8 of Skill Stack Store's "20 Claude Effects in 20 Secs" reel, 7.88 to 8.6 s, stepped
 * frame by frame; facts in films/effects-skillstack/facts.md). What the reel does: a one-frame cut to flat cream, giant
 * high-contrast Didone letters type on one every ~0.08 s, the footage visible only THROUGH the letterforms, a slow
 * push, then (8.36 to 8.52 s, 5 frames) a huge scale into one letter until its stroke fills the frame and the footage
 * takes over. About 0.75 s.
 *
 * Ours: the same beats in Abril Fatface (a Didone with fat stems, so there is a lot of footage in each letter). The
 * footage never moves: the paper is an SVG layer with letter-shaped holes (a mask) over the live, full-frame clip, so when the dive ends the shot
 * is exactly the one underneath and the hand-off has no seam. The letters are laid out from measured glyph widths
 * (canvas measureText once the font is loaded), so the dive can aim at a point inside one letter (`dive.letter`,
 * `dive.fx`, `dive.fy`: fractions of that letter's box; aim at a thick stem). A soft shade inside each letter's edge
 * sinks the footage below the paper. The dive is an exponential zoom (constant feel of speed) about the aim point.
 *
 *   <LetterDive clip="x/clip.mp4" word="UMD" at={27} diveAt={41} dive={{ letter: 1, fx: 0.16, fy: 0.5 }} />
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadAbril } from "@remotion/google-fonts/AbrilFatface";
import { IN, Sfx, clampX, k } from "./shared";
import { Framing, framedStyle } from "./InkScreen";

const { fontFamily: ABRIL, waitUntilDone } = loadAbril("normal", { weights: ["400"], subsets: ["latin"] });

export type LetterDiveProps = {
  clip: string;
  startFrom?: number;
  frame?: Framing;
  word: string;
  /** Frame of the cut to the page (the first letter lands here). */
  at: number;
  /** Frames between letters (the reel: about 2.4). */
  every?: number;
  /** Frame the dive starts, and its length (the reel: 5). */
  diveAt: number;
  diveFrames?: number;
  /** The aim: which letter, and where in its box (0 to 1 across, 0 to 1 from the cap top to the baseline). */
  dive: { letter: number; fx: number; fy: number };
  paper?: string;
  /** Baseline height as a fraction of the frame. */
  baseline?: number;
  sound?: boolean;
};

let measureCtx: CanvasRenderingContext2D | null = null;
const measure = (text: string, font: string) => {
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
  measureCtx!.font = font;
  return measureCtx!.measureText(text).width;
};

export const LetterDive: React.FC<LetterDiveProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const paper = p.paper ?? "#F2EADB";
  const every = p.every ?? 2.4;
  const diveFrames = p.diveFrames ?? 5;
  const end = p.diveAt + diveFrames;
  const letters = p.word.split("");
  // measure only once the face is in, so the layout (and the aim) never uses a fallback font's widths
  const [handle] = React.useState(() => delayRender("LetterDive font"));
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    waitUntilDone().then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);

  // layout at 100 px, then fit the word to 94% of the width (and never taller than 46% of the frame)
  const w100 = letters.map((l) => (ready ? measure(l, `400 100px ${ABRIL}`) : 60));
  const total100 = w100.reduce((a, b) => a + b, 0) || 1;
  const size = Math.min((W * 0.94 * 100) / total100, H * 0.46 / 0.72);
  const widths = w100.map((w) => (w * size) / 100);
  const startX = (W - widths.reduce((a, b) => a + b, 0)) / 2;
  const xs = widths.map((_, i) => startX + widths.slice(0, i).reduce((a, b) => a + b, 0));
  const base = H * (p.baseline ?? 0.56);
  const cap = size * 0.72; // Abril's cap height, about 0.72 em

  const sound = p.sound ?? true;
  const audio = <Audio src={staticFile(p.clip)} trimBefore={p.startFrom || undefined} />;
  const footage = (
    <div style={framedStyle(W, H, p.frame)}>
      <OffthreadVideo src={staticFile(p.clip)} startFrom={p.startFrom ?? 0} muted style={{ width: W, height: H }} />
    </div>
  );
  const sfx = (
    <>
      {letters.map((_, i) => <Sfx key={i} at={p.at + Math.round(i * every)} name="typewriter-hit-hard" volume={0.45} on={sound} />)}
      <Sfx at={p.diveAt - 3} name="air-woosh-quick" volume={0.45} on={sound} />
    </>
  );
  if (f < p.at || f >= end) {
    return <AbsoluteFill style={{ background: "#000" }}>{audio}{footage}{sfx}</AbsoluteFill>;
  }

  const shown = letters.filter((_, i) => f >= p.at + Math.round(i * every)).length;
  const L = Math.min(Math.max(0, p.dive.letter), letters.length - 1);
  const aim = { x: xs[L] + widths[L] * p.dive.fx, y: base - cap + cap * p.dive.fy };
  // motion: the push is linear and slow (4% over the hold); the dive is exponential, 1 to 90x in `diveFrames`, eased in
  const push = 1 + 0.04 * interpolate(f, [p.at, p.diveAt], [0, 1], clampX);
  const dive = Math.exp(Math.log(90) * k(f, p.diveAt, end, IN));
  const s = push * dive;
  const cam = `translate(${aim.x.toFixed(2)} ${aim.y.toFixed(2)}) scale(${s.toFixed(5)}) translate(${(-aim.x).toFixed(2)} ${(-aim.y).toFixed(2)})`;
  const glyphs = letters.slice(0, shown).map((l, i) => (
    <text key={i} x={xs[i]} y={base} fontFamily={ABRIL} fontSize={size}>{l}</text>
  ));

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {audio}
      {footage}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          {/* the paper with letter-shaped holes: white keeps paper, black glyphs cut it away */}
          <mask id="letter-dive-holes" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
            <rect width={W} height={H} fill="#fff" />
            <g transform={cam} fill="#000">{glyphs}</g>
          </mask>
          <mask id="letter-dive-inside" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
            <g transform={cam} fill="#fff">{glyphs}</g>
          </mask>
          <filter id="letter-dive-soft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={7} />
          </filter>
        </defs>
        <rect width={W} height={H} fill={paper} mask="url(#letter-dive-holes)" />
        {/* the deboss: a soft shade just inside each letter's edge, so the footage sits below the paper */}
        <g mask="url(#letter-dive-inside)" opacity={0.55}>
          <g filter="url(#letter-dive-soft)">
            <g transform={cam} fill="none" stroke="#2A1A0E" strokeWidth={(18 / s).toFixed(3)}>{glyphs}</g>
          </g>
        </g>
      </svg>
      {sfx}
    </AbsoluteFill>
  );
};
