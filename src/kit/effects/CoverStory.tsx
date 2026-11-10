/**
 * Cover story (2026-11-10, effect 16 of @mrcreates.ai's "17 effects" reel, stepped frame by frame). What the reel does:
 * a hard cut to a cream page with the subject already on it, then the cover builds around the subject one piece at a
 * time. A huge red Didone masthead drops in from above the frame in about 3 frames (0.1 s) and lands BEHIND the
 * subject's head; the small issue line top right at +0.25 s; a big red number at the left at +0.35 s; a black label box
 * lower left that sharpens out of a blur at +0.55 s; a barcode bottom right at +0.65 s. Held about 1 s, then a 3 frame
 * blur-out. Ours: the subject is a real capture lifted as the cover photo, it holds for the reading rule, and the
 * ending swaps the masthead for the logo, the way a cover carries its name.
 *
 *   <CoverStory masthead="Your week" issue="Week of Nov 8" subject={{ shot, width: 960 }}
 *     big={{ value: "44", lines: ["assignments in,", "from Canvas"] }} label="All in one place" />
 */
import React from "react";
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadBodoni } from "@remotion/google-fonts/BodoniModa";
import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import { B, Bed, Capture, IN, Logo, Sfx, Shot, k, mix, readFrames, shotHeight } from "./shared";

const { fontFamily: BODONI } = loadBodoni("normal", { weights: ["800", "900"], subsets: ["latin"] });
const { fontFamily: HANKEN } = loadHanken("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });

const PAPER = "#F3E8D9";
const INK = "#1E0A0C";
const RED = B.color.accent;

export type CoverStoryProps = {
  /** The cover's name, sentence case, a few letters wide. */
  masthead: string;
  /** The small line top right. */
  issue: string;
  /** The real capture lifted as the cover photo. */
  subject: { shot: Capture; width: number };
  /** The big red number and the cover line beside it. */
  big: { value: string; lines: string[] };
  /** The black label box. */
  label: string;
  sound?: boolean;
};

const END = 48;
const T = { mast: 5, issue: 12, big: 18, lines: 24, label: 32, code: 38 };

export const coverTimes = (p: CoverStoryProps) => {
  const endAt = Math.max(165, T.lines + readFrames(p.big.lines.join(" ")) + 10, T.label + readFrames(p.label) + 10);
  return { endAt, total: endAt + END };
};

/** A barcode is a prop of the cover, never a claim: fixed bars from a seed. */
const Barcode: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const bars: { x: number; bw: number }[] = [];
  let x = 0;
  let s = 7;
  while (x < w) {
    s = (s * 9301 + 49297) % 233280;
    const bw = 2 + (s % 4) * 2;
    bars.push({ x, bw });
    x += bw + 3 + ((s >> 3) % 3) * 2;
  }
  return (
    <div style={{ position: "relative", width: w, height: h, background: "#FFFDF8", padding: 8, boxSizing: "content-box" }}>
      {bars.filter((b) => b.x + b.bw <= w).map((b, i) => <div key={i} style={{ position: "absolute", left: 8 + b.x, top: 8, width: b.bw, height: h, background: INK }} />)}
    </div>
  );
};

const Grain: React.FC = () => (
  <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.16, mixBlendMode: "multiply" }}>
    <filter id="cover-grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={4} /><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0.6 0" /></filter>
    <rect width="100%" height="100%" filter="url(#cover-grain)" />
  </svg>
);

export const CoverStory: React.FC<CoverStoryProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const sound = p.sound ?? true;
  const { endAt, total } = coverTimes(p);
  const out = k(f, endAt, endAt + 4, IN); // the reel's blur-out
  const gone = (o = 1) => ({ opacity: o * (1 - out), filter: `blur(${(out * 14).toFixed(2)}px)` });

  // the masthead: fitted to the page, dropped from above the frame
  const mastSize = Math.min(250, (width - 100) / (p.masthead.length * 0.6));
  const mastTop = 96;
  const drop = spring({ frame: f - T.mast, fps, config: { damping: 15, stiffness: 340 } });
  const lift = k(f, endAt, endAt + 6, IN);
  const mastY = f < T.mast ? -mastSize * 1.6 : mix(-mastSize * 1.6, 0, drop) - lift * mastSize * 1.8;

  const subjTop = mastTop + mastSize * 0.8;
  const subjH = shotHeight(p.subject.shot, p.subject.width);
  const drift = mix(1, 1.025, f / Math.max(1, endAt));
  const bigTop = subjTop + subjH - 110;

  const bigK = k(f, T.big, T.big + 5);
  const linesK = k(f, T.lines, T.lines + 7);
  const labelK = k(f, T.label, T.label + 5);
  const codeK = k(f, T.code, T.code + 5);

  return (
    <AbsoluteFill style={{ background: PAPER, color: INK, fontFamily: HANKEN, overflow: "hidden" }}>
      <Bed total={total} on={sound} />
      <Sfx at={T.mast} name="paper-move-quick" volume={0.55} on={sound} />
      <Sfx at={T.label} name="typewriter-hit-soft" volume={0.5} on={sound} />
      <Sfx at={endAt} name="paper-page-turn" volume={0.55} on={sound} />
      <Grain />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,250,240,0.5), rgba(255,250,240,0) 70%)" }} />

      {/* masthead, behind the subject */}
      <div style={{ position: "absolute", left: 0, width, top: mastTop, textAlign: "center", fontFamily: BODONI, fontWeight: 900,
        fontSize: mastSize, lineHeight: 0.86, letterSpacing: "-0.045em", color: RED, whiteSpace: "nowrap",
        transform: `translateY(${mastY.toFixed(2)}px)` }}>
        {p.masthead}
      </div>

      {/* the logo and the issue line */}
      <div style={{ position: "absolute", left: 50, top: 38, ...gone(k(f, T.issue, T.issue + 6)) }}>
        <Img src={staticFile(B.logo!.onLight)} style={{ height: 40, width: "auto", display: "block" }} />
      </div>
      <div style={{ position: "absolute", right: 52, top: 44, fontWeight: 700, fontSize: 28, letterSpacing: "-0.01em", ...gone(k(f, T.issue, T.issue + 6)) }}>
        {p.issue}
      </div>

      {/* the subject: a real capture, on the page from frame 0 */}
      <div style={{ position: "absolute", left: (width - p.subject.width) / 2, top: subjTop, ...gone(),
        transform: `scale(${drift.toFixed(4)}) translateY(${(out * 40).toFixed(2)}px)`, transformOrigin: "50% 30%" }}>
        <div style={{ filter: "drop-shadow(0 30px 50px rgba(60, 10, 12, 0.38))" }}>
          <Shot shot={p.subject.shot} width={p.subject.width} radius={22} />
        </div>
      </div>

      {/* the big number and its cover line */}
      <div style={{ position: "absolute", left: 50, top: bigTop, display: "flex", alignItems: "flex-end", gap: 26, ...gone(bigK) }}>
        <div style={{ fontFamily: BODONI, fontWeight: 900, fontSize: 300, lineHeight: 0.82, color: RED, letterSpacing: "-0.04em",
          transform: `scale(${(1.3 - 0.3 * bigK).toFixed(4)})`, transformOrigin: "0% 100%",
          textShadow: `0 0 0 ${PAPER}, 3px 3px 0 ${PAPER}, -3px 3px 0 ${PAPER}` }}>
          {p.big.value}
        </div>
        <div style={{ paddingBottom: 8, opacity: linesK, transform: `translateY(${((1 - linesK) * 16).toFixed(2)}px)` }}>
          {p.big.lines.map((l, i) => (
            <div key={i} style={{ fontWeight: 800, fontSize: 54, lineHeight: 1.08, letterSpacing: "-0.02em" }}>{l}</div>
          ))}
        </div>
      </div>

      {/* label box and barcode */}
      <div style={{ position: "absolute", left: 50, bottom: 70, padding: "12px 22px", background: INK, color: "#FFF6EC", fontWeight: 800,
        fontSize: 38, letterSpacing: "-0.01em", opacity: labelK * (1 - out), filter: `blur(${((1 - labelK) * 10 + out * 14).toFixed(2)}px)` }}>
        {p.label}
      </div>
      <div style={{ position: "absolute", right: 52, bottom: 62, opacity: codeK * (1 - out), filter: `blur(${((1 - codeK) * 10 + out * 14).toFixed(2)}px)` }}>
        <Barcode w={170} h={86} />
      </div>

      {/* the ending: the logo takes the masthead's place, a red rule under it */}
      <Logo at={endAt + 6} x={width / 2} y={560} width={640} light spring />
      {f >= endAt + 12 ? (
        <>
          <div style={{ position: "absolute", left: width / 2 - 260, top: 680, width: 520 * k(f, endAt + 12, endAt + 26), height: 6, background: RED }} />
          <div style={{ position: "absolute", left: 0, width, top: 716, textAlign: "center", fontWeight: 700, fontSize: 42,
            letterSpacing: "-0.015em", opacity: k(f, endAt + 16, endAt + 26) }}>campusai.app</div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
