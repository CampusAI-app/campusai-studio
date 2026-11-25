/**
 * Storyboard vs final (2026-11-24, from bemx.studio's "Storyboard vs. Final" reel for Linear, Instagram, Muse Nov 24;
 * Jacob: "follow this for campusai"). Read frame by frame; our own build. Any film becomes a "here's the plan, here's
 * the film" post: the rough storyboard runs above the finished film, in sync, so one post sells the process and the
 * result at once.
 *
 * What the reel does, measured (1080 x 1152, 27.5 s):
 * - A light grey page (about #efefef). Top centre, a small white pill label. Under it a strip of storyboard frames,
 *   16:9, each about a third of the frame wide, about three in view, tilted a little in 3D toward the edges. The strip
 *   slides right to left so the board of the beat now playing sits centred.
 * - A second small pill (blue text in theirs, our accent here), then the finished film in a big rounded 16:9 card with a
 *   soft shadow, playing in sync with the strip.
 * - Under the card a thin dotted line with a small raised bump that travels along it with the film.
 *
 * Ours: the same layout, sized from the frame so it works at 4:5 (1080 x 1350) or the reel's 1080 x 1152. Labels are
 * small pills in sentence case and normal tracking ("Storyboard", "Output"), never all caps. `boards` lists one board per
 * beat with the composition frame it starts on. A board is either your own rough frame (`node`, drawn at the film's
 * size; the `Rough` parts below sketch one in a few lines) or, as a fallback for any film, a frozen frame of the film
 * itself (`at`), washed out to read as a draft. Honest boards are hand-made: use `at` only for a quick look.
 * The film inside is drawn at `film` size and scaled into the card. Keep its sound outside this part (pass a silent
 * film): frozen boards render the film again.
 *
 *   <StoryboardVsFinal boards={[{ from: 0, node: <MyRough1 /> }, { from: 84, node: <MyRough2 /> }]}><MyFilm muted /></StoryboardVsFinal>
 */
import React from "react";
import { AbsoluteFill, Freeze, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { B, SWING, clampX } from "./shared";

const inter = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] }).fontFamily;

/** Measured from the reel, as shares of the frame width unless named. */
export const STORYBOARD_VS_FINAL = {
  ground: "linear-gradient(180deg, #f1f1f1 0%, #ececec 100%)",
  /** One board is about a third of the frame wide, three in view. */
  board: 0.335,
  boardGap: 0.03,
  /** Degrees of tilt per board away from the centre, capped. */
  tilt: 16,
  /** The card's side margin. */
  side: 0.055,
  /** Frames the strip takes to slide to the next board; it starts a few frames before the beat so it arrives with it. */
  slide: 14,
  lead: 6,
} as const;

export type StoryBoard = {
  /** Composition frame the beat starts on. */
  from: number;
  /** Your rough frame, drawn at the film's size. */
  node?: React.ReactNode;
  /** Or: freeze the film at this composition frame and wash it out. */
  at?: number;
};

const Pill: React.FC<{ label: string; color: string; u: number }> = ({ label, color, u }) => (
  <div style={{ display: "inline-flex", alignItems: "center", height: 40 * u, padding: `0 ${18 * u}px`, borderRadius: 999, background: "#fff",
    boxShadow: `0 ${2 * u}px ${10 * u}px rgba(0, 0, 0, 0.08), 0 0 0 ${1 * u}px rgba(0, 0, 0, 0.04)`, fontFamily: inter, fontWeight: 500,
    fontSize: 18 * u, letterSpacing: "-0.005em", color, whiteSpace: "nowrap" }}>{label}</div>
);

/** The storyboard strip above the finished film, in sync. */
export const StoryboardVsFinal: React.FC<{
  boards: StoryBoard[];
  children: React.ReactNode;
  /** The film's own size. Default 1920 x 1080. */
  film?: { width: number; height: number };
  labels?: { top: string; bottom: string };
  /** Text colour of the second pill and the dotted line's bump. Default the brand accent. */
  accent?: string;
  ground?: string;
  /** Optional mark held under the dotted line (a small logo, so the brand is on screen from the first frame). */
  footer?: React.ReactNode;
}> = ({ boards, children, film = { width: 1920, height: 1080 }, labels = { top: "Storyboard", bottom: "Output" }, accent = B.color.accent,
  ground = STORYBOARD_VS_FINAL.ground, footer }) => {
  const f = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const u = W / 1080;
  const S = STORYBOARD_VS_FINAL;

  // sizes
  const bw = W * S.board, bh = (bw * film.height) / film.width, gap = W * S.boardGap;
  const cw = W - W * S.side * 2, ch = (cw * film.height) / film.width;
  const pillH = 40 * u, stripH = bh * 1.1;
  const stack = [pillH, 22 * u, stripH, 34 * u, pillH, 24 * u, ch, 40 * u, 18 * u, footer ? 56 * u : 0];
  const total = stack.reduce((a, b) => a + b, 0);
  let y = Math.max(24 * u, (H - total) / 2);
  const at = stack.map((h) => { const t = y; y += h; return t; });
  const [topPillY, , stripY, , botPillY, , cardY, , dotsY, footY] = at;

  // where the strip is: a float index that eases to each board as its beat starts
  const sorted = [...boards].sort((a, b) => a.from - b.from);
  let s = 0;
  for (let i = 1; i < sorted.length; i++) {
    const start = sorted[i].from - S.lead;
    s += interpolate(f, [start, start + S.slide], [0, 1], { ...clampX, easing: SWING });
  }

  const filmProgress = Math.min(1, f / Math.max(1, durationInFrames - 1));
  const cardX = (W - cw) / 2;
  const dotStep = 9 * u, dots = Math.floor(cw / dotStep);

  return (
    <AbsoluteFill style={{ background: ground, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: topPillY, display: "flex", justifyContent: "center" }}>
        <Pill label={labels.top} color="#1d1b1c" u={u} />
      </div>

      {/* the strip */}
      <div style={{ position: "absolute", left: 0, top: stripY, width: W, height: stripH, perspective: 1500 * u }}>
        {sorted.map((b, i) => {
          const d = i - s;
          if (Math.abs(d) > 2.6) return null;
          const cx = W / 2 + d * (bw + gap);
          // boards turn away at the outer edges, like frames on a slow wheel
          const rot = Math.max(-40, Math.min(40, d * S.tilt));
          const scale = 1 - Math.min(1, Math.abs(d)) * 0.04;
          return (
            <div key={i} style={{ position: "absolute", left: cx - bw / 2, top: (stripH - bh) / 2, width: bw, height: bh,
              transform: `rotateY(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`, transformStyle: "preserve-3d",
              borderRadius: 6 * u, overflow: "hidden", background: "#fff", opacity: 1 - Math.min(1.6, Math.abs(d)) * 0.1,
              boxShadow: `0 ${6 * u}px ${18 * u}px -${4 * u}px rgba(0, 0, 0, 0.16), 0 0 0 ${1 * u}px rgba(0, 0, 0, 0.05)` }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: film.width, height: film.height, transform: `scale(${bw / film.width})`,
                transformOrigin: "0 0", filter: b.node ? undefined : "grayscale(1) contrast(0.5) brightness(1.18)" }}>
                {b.node ?? (b.at !== undefined ? <Freeze frame={b.at}>{children}</Freeze> : null)}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: botPillY, display: "flex", justifyContent: "center" }}>
        <Pill label={labels.bottom} color={accent} u={u} />
      </div>

      {/* the finished film */}
      <div style={{ position: "absolute", left: cardX, top: cardY, width: cw, height: ch, borderRadius: cw * 0.022, overflow: "hidden", background: "#fff",
        boxShadow: `0 ${26 * u}px ${60 * u}px -${18 * u}px rgba(0, 0, 0, 0.28), 0 ${4 * u}px ${14 * u}px rgba(0, 0, 0, 0.06)` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: film.width, height: film.height, transform: `scale(${cw / film.width})`, transformOrigin: "0 0" }}>
          {children}
        </div>
      </div>

      {/* the dotted line and its travelling bump */}
      {Array.from({ length: dots + 1 }, (_, i) => {
        const x = cardX + (i / dots) * cw;
        const dx = (x - (cardX + filmProgress * cw)) / (26 * u);
        const lift = Math.exp(-dx * dx);
        return (
          <div key={i} style={{ position: "absolute", left: x - 1.6 * u, top: dotsY + 9 * u - lift * 11 * u - 1.6 * u, width: 3.2 * u, height: 3.2 * u,
            borderRadius: 99, background: lift > 0.05 ? accent : "rgba(40, 30, 32, 0.32)", opacity: 0.55 + lift * 0.45 }} />
        );
      })}

      {footer ? <div style={{ position: "absolute", left: 0, right: 0, top: footY, height: 56 * u, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>{footer}</div> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// Rough: a few plain pieces for drawing honest storyboard frames, in the film's own pixels (1920 x 1080 by default).
// The look of a quick Figma board: plain type, flat fills, grey boxes with a cross where a photo or capture will go,
// dashed arrows for motion. No polish on purpose.

const ROUGH_INK = "#2a2627";
const ROUGH_LINE = "#a9a3a4";

/** A board's page: flat ground, a faint safe-area guide. */
export const RoughBoard: React.FC<{ ground?: string; children?: React.ReactNode; w?: number; h?: number }> = ({ ground = "#fff", children, w = 1920, h = 1080 }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, background: ground, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 60, top: 60, right: 60, bottom: 60, border: `2px dashed rgba(120, 110, 112, 0.22)`, borderRadius: 8 }} />
    {children}
  </div>
);

/** Plain type, centred on (x, y). */
export const RoughText: React.FC<{ x: number; y: number; size?: number; color?: string; weight?: number; align?: "left" | "center"; children: React.ReactNode }> = ({
  x, y, size = 72, color = ROUGH_INK, weight = 500, align = "center", children,
}) => (
  <div style={{ position: "absolute", left: align === "center" ? x - 1400 : x, top: y - size * 0.62, width: align === "center" ? 2800 : 2000, textAlign: align,
    fontFamily: inter, fontWeight: weight, fontSize: size, lineHeight: 1.2, color, whiteSpace: "nowrap" }}>{children}</div>
);

/** A placeholder: grey outline with a cross, and an optional small label. */
export const RoughBox: React.FC<{ x: number; y: number; w: number; h: number; label?: string; radius?: number; fill?: string; dark?: boolean }> = ({
  x, y, w, h, label, radius = 10, fill = "rgba(0, 0, 0, 0.03)", dark,
}) => {
  const line = dark ? "rgba(255, 255, 255, 0.35)" : ROUGH_LINE;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: radius, border: `3px solid ${line}`, background: fill, overflow: "hidden" }}>
      <svg width={w} height={h} style={{ position: "absolute", left: -3, top: -3 }}>
        <line x1={0} y1={0} x2={w} y2={h} stroke={line} strokeWidth={2} />
        <line x1={w} y1={0} x2={0} y2={h} stroke={line} strokeWidth={2} />
      </svg>
      {label ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", fontFamily: inter, fontWeight: 500, fontSize: Math.max(22, Math.min(34, w / 9)),
          color: dark ? "rgba(255, 255, 255, 0.6)" : "#8d8687" }}><span style={{ background: dark ? "#1a1617" : "#fff", padding: "2px 10px", borderRadius: 6 }}>{label}</span></div>
      ) : null}
    </div>
  );
};

/** A rounded outline with a word in it (a pill or a card edge). */
export const RoughPill: React.FC<{ x: number; y: number; w: number; h: number; text?: string; size?: number; color?: string; line?: string; fill?: string }> = ({
  x, y, w, h, text, size = 64, color = ROUGH_INK, line = ROUGH_INK, fill = "transparent",
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 999, border: `4px solid ${line}`, background: fill, display: "flex",
    alignItems: "center", justifyContent: "center", fontFamily: inter, fontWeight: 500, fontSize: size, color }}>{text}</div>
);

/** A flat block of colour. */
export const RoughBlock: React.FC<{ x: number; y: number; w: number; h: number; color: string; radius?: number }> = ({ x, y, w, h, color, radius = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: color, borderRadius: radius }} />
);

/** A dashed motion arrow from (x1, y1) to (x2, y2). */
export const RoughArrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; color?: string }> = ({ x1, y1, x2, y2, color = "#8d8687" }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), hl = 26;
  const p = (s: number) => `${x2 - hl * Math.cos(a + s)},${y2 - hl * Math.sin(a + s)}`;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={4} strokeDasharray="14 12" strokeLinecap="round" />
      <polyline points={`${p(0.45)} ${x2},${y2} ${p(-0.45)}`} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
