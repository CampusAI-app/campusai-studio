/**
 * Section frame (2026-11-21, from Sultan Mahmud's (@sultanmotions, Sleeko) "HowDo" 40 s SaaS explainer breakdown,
 * instagram.com/reel/DcLzGYovY9B, Muse Nov 21; Jacob: "I love this"). Read frame by frame in his Chrome; our own build in
 * CampusAI's brand, none of their art or their violet.
 *
 * What the reel does, in numbers (1440 x 1080, 30 fps, 44.4 s):
 * - The explainer plays inside a big rounded card (x 7 to 93%, y 12 to 77% of the frame, corner about 3.3% of the width)
 *   over a dark-top, violet-to-magenta backdrop, with a thin glow line under the card's bottom edge and the studio's
 *   wordmark small at the top centre (about 7% down).
 * - Under the card, four equal white pills (y 84 to 92%, gap about 1.5% of the width): Intro, Problem, Use Case, Call to
 *   Action. The pill of the section playing is black with white text, and a glowing playhead line (a bright stroke with
 *   a bulb on top and a soft trail behind it) travels left to right across that pill over the section's whole length.
 * - Hand-off: the old pill fades black to grey to white while the new one fades white to grey to black, about 0.3 s
 *   (2.6 to 2.9 s; 13.5 to 13.8 s; 38.3 to 38.6 s). The playhead restarts at the new pill's left edge.
 * - A thin ruler of ticks runs under the pills (y about 97%), even spacing, quiet.
 * - Section lengths in the 44.4 s film: Intro 0 to 2.7 s (6%), Problem 2.7 to 13.7 s (25%), Use Case 13.7 to 38.5 s
 *   (56%), Call to Action 38.5 to 44.4 s (13%).
 *
 * Ours: a film (children) inside the card, CampusAI's ground (warm near-black with the red light coming up from below
 * where theirs is violet and magenta), white pills with Inter, the active pill near-black with the red playhead. The
 * labels and their frames come in as `sections`, in this composition's frames, so the same part frames a whole film or
 * a cut-down of it. The film inside is drawn at `film` size and scaled into the card: a film that reads
 * useVideoConfig() for its layout (OneTake does) must be the same size as this composition.
 *
 *   <SectionFrame sections={[{ label: "Intro", from: 0, to: 78 }, ...]}><MyFilm /></SectionFrame>
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { B, Logo, OUT, clampX, k } from "./shared";

const inter = loadInter("normal", { weights: ["500", "600"], subsets: ["latin"] }).fontFamily;

/** Measured from the reel, as fractions of the frame. */
export const SECTION_FRAME = {
  /** The four labels the reel uses, in order. */
  labels: ["Intro", "Problem", "Use Case", "Call to Action"] as const,
  /** Share of a ~40 s explainer each section took (6 / 25 / 56 / 13%). */
  shares: [0.06, 0.25, 0.56, 0.13] as const,
  /** Pill hand-off: old pill out and new pill in over about 0.3 s. */
  handoff: 9,
  /** Ground: warm near-black, the red coming up from under the pills like light. */
  ground: [
    "radial-gradient(70% 38% at 50% 104%, rgba(255, 92, 104, 0.95) 0%, rgba(217, 32, 46, 0.85) 38%, rgba(217, 32, 46, 0) 100%)",
    "radial-gradient(60% 40% at 14% 8%, rgba(217, 32, 46, 0.16) 0%, rgba(217, 32, 46, 0) 100%)",
    "linear-gradient(180deg, #0b0708 0%, #120a0b 45%, #3a0d12 78%, #7a1620 100%)",
  ].join(", "),
  ink: "#120B0D",
  pill: "#FBF7F6",
  /** The playhead: brand red as light, the product's own on-dark red for the bright core. */
  head: "#FF4050",
} as const;

export type Section = { label: string; from: number; to: number };

/** The breakdown frame: a film in a rounded card over the brand ground, labelled pills whose highlight and playhead
 *  advance with the sections, and a tick ruler under them. */
export const SectionFrame: React.FC<{
  sections: Section[];
  /** The film's own size, scaled into the card. Default: this composition's size. */
  film?: { width: number; height: number };
  children: React.ReactNode;
  /** Show the CampusAI logo small at the top centre. */
  logo?: boolean;
}> = ({ sections, film, children, logo = true }) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const fw = film?.width ?? W, fh = film?.height ?? H;
  const u = Math.min(W, H) / 1080; // one unit at 1080 px on the short side

  // layout: logo strip on top, the card as big as fits, then pills and ruler (the reel's proportions, scaled)
  const top = (logo ? 104 : 48) * u;
  const pillH = 72 * u, pillGap = 16 * u, rulerH = 26 * u, below = pillH + rulerH + 92 * u;
  const side = W * 0.07;
  const availW = W - side * 2, availH = H - top - below;
  const scale = Math.min(availW / fw, availH / fh);
  const cw = fw * scale, ch = fh * scale;
  const cx = (W - cw) / 2, cy = top;
  const radius = Math.max(cw, ch) * 0.035;
  const rowW = Math.max(cw, Math.min(W - side * 2, 960 * u));
  const rowX = (W - rowW) / 2, rowY = cy + ch + 36 * u;
  const n = sections.length;
  const pw = (rowW - pillGap * (n - 1)) / n;

  const hf = SECTION_FRAME.handoff;
  // how dark each pill is (0 white, 1 black): the new pill fades in over the first `hf` frames of its section while the
  // old one fades out over the same frames
  const dark = (i: number) => {
    const s = sections[i];
    const inA = i === 0 ? 1 : k(f, s.from, s.from + hf, OUT);
    const next = sections[i + 1];
    const outA = next ? k(f, next.from, next.from + hf, OUT) : 0;
    return f < s.from ? 0 : inA * (1 - outA);
  };
  const progress = (i: number) => {
    const s = sections[i];
    return interpolate(f, [s.from, s.to], [0, 1], clampX);
  };
  const filmProgress = interpolate(f, [sections[0].from, sections[n - 1].to], [0, 1], clampX);
  const ticks = Math.round(rowW / (15 * u));

  return (
    <AbsoluteFill style={{ background: SECTION_FRAME.ground, overflow: "hidden" }}>
      {logo ? <Logo at={-20} x={W / 2} y={top / 2 + 4 * u} width={150 * u} /> : null}
      {/* the glow line under the card, the reel's one bit of light on the ground */}
      <div style={{ position: "absolute", left: cx + cw * 0.22, width: cw * 0.56, top: cy + ch - 6 * u, height: 14 * u, borderRadius: 999,
        background: `rgba(${B.color.glowRgb}, 0.9)`, filter: `blur(${10 * u}px)` }} />
      {/* the card, with the film scaled into it */}
      <div style={{ position: "absolute", left: cx, top: cy, width: cw, height: ch, borderRadius: radius, overflow: "hidden",
        boxShadow: `0 ${30 * u}px ${80 * u}px -${20 * u}px rgba(0, 0, 0, 0.6), 0 0 0 ${1.5 * u}px rgba(255, 255, 255, 0.10)`, background: "#fff" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: fw, height: fh, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          {children}
        </div>
      </div>
      {/* the pills */}
      {sections.map((s, i) => {
        const d = dark(i);
        const bg = mixHex(SECTION_FRAME.pill, SECTION_FRAME.ink, d);
        const ink = mixHex(SECTION_FRAME.ink, "#FFFFFF", d);
        const p = progress(i);
        // the playhead shows on any pill that is still dark, so the old one fades out with its pill instead of vanishing
        const show = d > 0.02;
        return (
          <div key={s.label} style={{ position: "absolute", left: rowX + i * (pw + pillGap), top: rowY, width: pw, height: pillH, borderRadius: 14 * u,
            background: bg, overflow: "hidden", boxShadow: `0 ${6 * u}px ${18 * u}px -${8 * u}px rgba(0, 0, 0, 0.45)` }}>
            {show ? (
              <>
                {/* the trail: red light fading out behind the playhead */}
                <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${p * 100}%`, opacity: d,
                  background: `linear-gradient(90deg, rgba(${B.color.glowRgb}, 0) 0%, rgba(${B.color.glowRgb}, 0) 55%, rgba(${B.color.glowRgb}, 0.38) 100%)` }} />
                <div style={{ position: "absolute", top: 0, bottom: 0, left: `calc(${p * 100}% - ${1.5 * u}px)`, width: 3 * u, opacity: d,
                  background: SECTION_FRAME.head, boxShadow: `0 0 ${10 * u}px ${2 * u}px rgba(${B.color.glowRgb}, 0.9), 0 0 ${24 * u}px ${6 * u}px rgba(${B.color.glowRgb}, 0.45)` }} />
                <div style={{ position: "absolute", top: -6 * u, left: `calc(${p * 100}% - ${6 * u}px)`, width: 12 * u, height: 16 * u, opacity: d,
                  borderRadius: `0 0 ${6 * u}px ${6 * u}px`, background: "#FFD9DC", boxShadow: `0 0 ${12 * u}px ${4 * u}px rgba(${B.color.glowRgb}, 0.8)` }} />
              </>
            ) : null}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: inter,
              fontWeight: 600, fontSize: 25 * u, letterSpacing: "-0.01em", color: ink, whiteSpace: "nowrap" }}>{s.label}</div>
          </div>
        );
      })}
      {/* the ruler: even ticks, the one nearest the playhead taller and red */}
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const x = rowX + (i / ticks) * rowW;
        const near = Math.abs(i / ticks - filmProgress) * ticks;
        const lift = Math.max(0, 1 - near / 1.5);
        return (
          <div key={i} style={{ position: "absolute", left: x - 0.75 * u, top: rowY + pillH + 30 * u - lift * 8 * u, width: 1.5 * u,
            height: (14 + lift * 8) * u, borderRadius: u, background: lift > 0.01 ? mixHex("#2a1a1d", SECTION_FRAME.head, lift) : "rgba(30, 14, 17, 0.55)" }} />
        );
      })}
    </AbsoluteFill>
  );
};

/** Section frames for a film of `total` frames in the reel's proportions (6 / 25 / 56 / 13%), labels in order. */
export const sectionsFor = (total: number, labels: readonly string[] = SECTION_FRAME.labels): Section[] => {
  let at = 0;
  return labels.map((label, i) => {
    const len = i === labels.length - 1 ? total - at : Math.round(total * SECTION_FRAME.shares[i]);
    const s = { label, from: at, to: at + len };
    at += len;
    return s;
  });
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, t: number) => {
  const A = hex(a), Bc = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (Bc[i] - v) * t)).join(", ")})`;
};
