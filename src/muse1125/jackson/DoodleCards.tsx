/**
 * Doodle cards (Muse pass 2026-11-25, from @byjacksonsword's "5-part storytelling structure" and "tension loops"
 * TikToks, stepped frame by frame). Hand-drawn cards on torn paper that pop in around a speaker on the word that names
 * them, the way his edits build an outline on screen while he talks.
 *
 * What the frames showed (73 s and 68 s, 0.5 s apart, 0.067 s around the pops):
 * - Cards pop HARD: absent on one frame, whole on the next, gone on a cut. No fade, no slide. List items stack one
 *   every 2 frames; a title gets one scrap per spoken word ("5" / "PART" / "STORY" / "TELLING").
 * - Titles are red marker caps on cream torn scraps; list items are black hand print on cream with a scribbled edge;
 *   icons are black line doodles on lined or plain paper; turns get a red starburst behind the card.
 * - Captions are small boxes of 1 to 3 words at the bottom: red with white over the speaker, black with white over
 *   the flat orange ground, where the speaker sits in a small box on the left and the doodles fill the right.
 *
 * Assembled from what the studio already had: the 4-frame "boil" and the self-drawing stroke from /ink-doodle and
 * /pov-doodle (src/styles/InkDoodle.tsx), Permanent Marker from /ink-doodle's title. New here: the torn scrap, the
 * pop, the glide into a rail (so an open question can stay pinned on screen), the starburst and the caption chip.
 *
 *   <DoodleCard at={12} x={700} y={420} w={300} text="TENSION" tone="marker" />
 *   <DoodleCard at={40} x={760} y={900} w={260} icon="clock" paper="lined" rot={-4} />
 *   <DoodleCard at={60} x={540} y={600} w={420} icon="envelope" label="their reply" move={{ at: 90, x: 200, y: 300, w: 180 }} />
 *   <Starburst at={30} x={540} y={700} r={260} />   <Chip at={0} to={20} text="left on read" />
 */
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadMarker } from "@remotion/google-fonts/PermanentMarker";
import { loadFont as loadHand } from "@remotion/google-fonts/ArchitectsDaughter";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: MARKER } = loadMarker("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: HAND } = loadHand("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: CHIP } = loadInter("normal", { weights: ["700"], subsets: ["latin"] });
export { MARKER, HAND, CHIP };

/** The look, measured off the reference frames and pulled toward the brand red (rules/campusai.md: colour leans red). */
export const DOODLE = {
  paper: "#F4EFE4",
  paperLine: "rgba(70,110,170,.28)",
  ink: "#17120F",
  red: "#D9202E",
  ground: "#EE4B36",
  chipRed: "#D9202E",
  chipInk: "#141011",
} as const;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SNAP = Easing.bezier(0.2, 1.4, 0.4, 1); // motion: pop, a 3 frame settle from 112% with a touch of overshoot
const GLIDE = Easing.bezier(0.65, 0, 0.35, 1); // motion: the glide into the rail, in and out

/** Seeded number, so every render draws the same torn edge and the same jitter. */
const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** A torn edge as a clip-path polygon, in percent, a few px of tear every ~5% of each side. */
const tear = (seed: number, amt = 1.6) => {
  const pts: string[] = [];
  const n = 18;
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${rnd(seed + i) * amt}%`);
  for (let i = 1; i <= n; i++) pts.push(`${100 - rnd(seed + 40 + i) * amt * 0.6}% ${(i / n) * 100}%`);
  for (let i = n - 1; i >= 0; i--) pts.push(`${(i / n) * 100}% ${100 - rnd(seed + 80 + i) * amt}%`);
  for (let i = n - 1; i >= 1; i--) pts.push(`${rnd(seed + 120 + i) * amt * 0.6}% ${(i / n) * 100}%`);
  return `polygon(${pts.join(",")})`;
};

/** The boil: line art redrawn every 4 frames, so a still doodle reads as drawn by hand (from /ink-doodle). */
export const Boil: React.FC<{ id: string; scale?: number }> = ({ id, scale = 2.2 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={Math.floor(f / 4) % 7} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
};

export type IconName =
  | "envelope" | "envelopeOpen" | "question" | "plane" | "hearts" | "clock" | "ghost" | "check" | "person"
  | "note" | "bell" | "box" | "boxTicked" | "read" | "calendar";

/** Line doodles on a 100 x 100 grid. `t` is frames since the card popped, for the few that move. */
export const Icon: React.FC<{ name: IconName; t: number; color?: string; accent?: string }> = ({ name, t, color = DOODLE.ink, accent = DOODLE.red }) => {
  const s = { stroke: color, strokeWidth: 4.2, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "envelope":
      return (
        <g {...s}>
          <path d="M12 28 L88 27 L89 76 L11 77 Z" />
          <path d="M12 29 L50 56 L88 28" />
          <path d="M12 76 L40 51 M88 75 L61 51" />
        </g>
      );
    case "envelopeOpen":
      return (
        <g {...s}>
          <path d="M22 50 L22 14 L78 14 L78 50" fill={DOODLE.paper} />
          <path d="M30 26 H70 M30 34 H66 M30 42 H60" strokeWidth={3} />
          <path d="M12 44 L88 44 L89 86 L11 87 Z" fill={DOODLE.paper} />
          <path d="M12 45 L50 70 L88 45" />
        </g>
      );
    case "question":
      return (
        <g {...s} stroke={accent} strokeWidth={7}>
          <path d="M33 34 C33 16 67 14 67 34 C67 48 50 48 50 62" />
          <path d="M50 78 L50.5 80" strokeWidth={9} />
        </g>
      );
    case "plane": {
      const dx = Math.min(10, t * 0.6);
      return (
        <g {...s} transform={`translate(${dx} ${-dx * 0.5})`}>
          <path d="M10 52 L88 18 L66 84 L48 60 Z" />
          <path d="M48 60 L88 18" />
          <path d="M48 60 L44 80 L56 68" />
          <path d="M6 72 C-2 78 -6 86 -10 92" strokeDasharray="4 7" strokeWidth={3} />
        </g>
      );
    }
    case "hearts":
      return (
        <g {...s}>
          <circle cx="50" cy="52" r="38" />
          <path d="M30 40 c0 -8 12 -8 12 0 c0 -8 12 -8 12 0" fill="none" transform="translate(-6 0)" />
          <path d="M26 38 c-4 -8 -14 -2 -8 6 l8 8 l8 -8 c6 -8 -4 -14 -8 -6 z" fill={accent} stroke={accent} strokeWidth={2} />
          <path d="M66 38 c-4 -8 -14 -2 -8 6 l8 8 l8 -8 c6 -8 -4 -14 -8 -6 z" fill={accent} stroke={accent} strokeWidth={2} />
          <path d="M32 64 C40 76 60 76 68 64" />
        </g>
      );
    case "clock": {
      const a = (t * 14) % 360; // motion: the minute hand runs, 14 degrees a frame, so waiting reads as time passing
      return (
        <g {...s}>
          <circle cx="50" cy="50" r="38" />
          <path d="M50 50 L50 28" transform={`rotate(${a} 50 50)`} />
          <path d="M50 50 L64 56" transform={`rotate(${a / 12} 50 50)`} />
          <path d="M50 14 V19 M86 50 H81 M50 86 V81 M14 50 H19" strokeWidth={3} />
        </g>
      );
    }
    case "ghost": {
      const bob = Math.sin(t / 5) * 3;
      return (
        <g {...s} transform={`translate(0 ${bob})`}>
          <path d="M24 84 L24 44 C24 12 76 12 76 44 L76 84 L67 76 L58 84 L50 76 L42 84 L33 76 Z" fill={DOODLE.paper} />
          <circle cx="40" cy="44" r="3.5" fill={color} />
          <circle cx="60" cy="44" r="3.5" fill={color} />
          <path d="M44 58 C47 62 53 62 56 58" />
        </g>
      );
    }
    case "check":
      return <path d="M18 54 L40 76 L84 22" {...s} stroke={accent} strokeWidth={9} />;
    case "person":
      return (
        <g {...s}>
          <circle cx="50" cy="32" r="16" />
          <path d="M18 88 C18 62 82 62 82 88" />
          <path d="M44 31 h0.5 M56 31 h0.5" strokeWidth={5} />
          <path d="M44 39 C47 42 53 42 56 39" strokeWidth={3} />
        </g>
      );
    case "note":
      return (
        <g {...s}>
          <path d="M20 12 L80 12 L80 88 L20 88 Z" />
          <path d="M30 30 H70 M30 44 H70 M30 58 H58" strokeWidth={3} />
          <path d="M60 86 L88 40 L94 46 L68 92 Z" fill={DOODLE.paper} />
        </g>
      );
    case "bell": {
      const r = Math.sin(t / 2.2) * Math.max(0, 14 - t * 0.6);
      return (
        <g {...s} transform={`rotate(${r} 50 14)`}>
          <path d="M26 70 C30 60 28 30 50 24 C72 30 70 60 74 70 Z" />
          <path d="M20 72 H80" />
          <path d="M44 80 C46 86 54 86 56 80" />
          <path d="M50 24 V16" />
        </g>
      );
    }
    case "calendar":
      return (
        <g {...s}>
          <path d="M14 24 H86 V86 H14 Z" />
          <path d="M14 40 H86 M32 14 V30 M68 14 V30" />
          <path d="M28 54 h6 M47 54 h6 M66 54 h6 M28 70 h6 M47 70 h6" strokeWidth={5} />
          <circle cx="69" cy="71" r="9" stroke={accent} />
        </g>
      );
    case "box":
      return <path d="M14 16 L86 14 L88 86 L12 88 Z" {...s} />;
    case "boxTicked":
      return (
        <g>
          <path d="M14 16 L86 14 L88 86 L12 88 Z" {...s} />
          <path d="M22 50 L44 74 L92 6" {...s} stroke={accent} strokeWidth={10} />
        </g>
      );
    case "read":
      return (
        <g {...s}>
          <path d="M10 18 H90 V66 H44 L24 84 L28 66 H10 Z" />
          <path d="M28 40 L36 48 L50 32 M44 40 L52 48 L66 32" stroke={accent} strokeWidth={5} />
        </g>
      );
  }
};

export type DoodleCardProps = {
  /** Frame it pops on (hard, the reference's way). */
  at: number;
  /** Frame it leaves on (a hard cut). Omit to stay. */
  out?: number;
  /** Centre, canvas px, and width. Height follows the content. */
  x: number;
  y: number;
  w: number;
  rot?: number;
  /** Words on the card: red marker caps (a title scrap) or black hand print (a list or label scrap). */
  text?: string;
  tone?: "marker" | "hand";
  /** A doodle above the words, or alone. */
  icon?: IconName;
  /** A small hand-printed line under the icon. */
  label?: string;
  paper?: "plain" | "lined" | "none";
  /** Text size; defaults from the width. */
  size?: number;
  /** Glide to a new place and size (a rail pin), over 7 frames from `at`. */
  move?: { at: number; x: number; y: number; w: number; rot?: number };
  /** Swap the icon at a frame (a box gets its tick, the envelope opens). */
  swap?: { at: number; icon: IconName; label?: string };
  seed?: number;
  /** Starburst behind it. */
  burst?: boolean;
  /** A rough ink outline round the scrap (the list scraps have one). */
  edge?: boolean;
};

/** One card. Positions are its centre, so cards can be laid out in canvas px straight off the reference frames. */
export const DoodleCard: React.FC<DoodleCardProps> = (p) => {
  const f = useCurrentFrame();
  if (f < p.at || (p.out !== undefined && f >= p.out)) return null;
  const t = f - p.at;
  const pop = interpolate(t, [0, 3], [1.12, 1], { ...clamp, easing: SNAP });
  const mk = p.move ? interpolate(f, [p.move.at, p.move.at + 7], [0, 1], { ...clamp, easing: GLIDE }) : 0;
  const x = p.move ? p.x + (p.move.x - p.x) * mk : p.x;
  const y = p.move ? p.y + (p.move.y - p.y) * mk : p.y;
  const w = p.move ? p.w + (p.move.w - p.w) * mk : p.w;
  const rot = p.move ? (p.rot ?? 0) + ((p.move.rot ?? p.rot ?? 0) - (p.rot ?? 0)) * mk : p.rot ?? 0;
  const seed = p.seed ?? Math.round(p.x * 3 + p.y * 7 + p.at);
  const id = `boil-${seed}`;
  const swapped = p.swap && f >= p.swap.at;
  const icon = swapped ? p.swap!.icon : p.icon;
  const label = swapped && p.swap!.label !== undefined ? p.swap!.label : p.label;
  const swapPop = swapped ? interpolate(f - p.swap!.at, [0, 3], [1.18, 1], { ...clamp, easing: SNAP }) : 1;
  const k = w / p.w; // everything inside scales with the card, so the glide shrinks it whole
  const tone = p.tone ?? "marker";
  // fit the longest line inside the scrap (Permanent Marker runs ~0.66 em a letter, Architects Daughter ~0.55)
  const longest = Math.max(1, ...(p.text ?? "").split("\n").map((l) => l.length));
  const fit = (p.w * 0.84) / (longest * (tone === "marker" ? 0.66 : 0.55));
  const size = Math.min(p.size ?? (tone === "marker" ? p.w * 0.3 : p.w * 0.16), fit) * k;
  const paper = p.paper ?? "plain";
  const iconW = (p.text ? 0.62 : 0.82) * w;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${pop * swapPop})` }}>
      <Boil id={id} />
      {p.burst ? (
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0 }}>
          <Starburst at={p.at} x={0} y={0} r={w * 0.78} inline />
        </div>
      ) : null}
      <div style={{ position: "relative", filter: "drop-shadow(0 4px 6px rgba(0,0,0,.28))" }}>
        <div style={{
          clipPath: paper === "none" ? undefined : tear(seed),
          background: paper === "none" ? "transparent" : paper === "lined"
            ? `repeating-linear-gradient(transparent 0 ${22 * k}px, ${DOODLE.paperLine} ${22 * k}px ${24 * k}px), ${DOODLE.paper}`
            : `radial-gradient(120% 90% at 30% 20%, #FBF8F1 0%, ${DOODLE.paper} 60%, #E9E2D3 100%)`,
          padding: `${(p.text ? 0.07 : 0.1) * w}px ${0.08 * w}px`,
          display: "flex", flexDirection: "column", alignItems: "center",
          filter: `url(#${id})`,
        }}>
          {icon ? (
            <svg viewBox="0 0 100 100" width={iconW} height={iconW} style={{ overflow: "visible" }}>
              <Icon name={icon} t={t} />
            </svg>
          ) : null}
          {label ? (
            <div style={{ fontFamily: HAND, fontSize: 0.13 * w, color: DOODLE.ink, lineHeight: 1.05, textAlign: "center", marginTop: 4 * k }}>{label}</div>
          ) : null}
          {p.text ? (
            <div style={{ fontFamily: tone === "marker" ? MARKER : HAND, fontSize: size, lineHeight: 1.02, textAlign: "center",
              color: tone === "marker" ? DOODLE.red : DOODLE.ink, whiteSpace: "pre-line", fontWeight: tone === "hand" ? 400 : undefined }}>
              {p.text}
            </div>
          ) : null}
        </div>
        {p.edge && paper !== "none" ? (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", filter: `url(#${id})` }}>
            <path d="M1.5 3 L98 1.5 L98.5 97 L2 98.5 Z" fill="none" stroke={DOODLE.ink} strokeWidth={1.4} vectorEffect="non-scaling-stroke" strokeLinejoin="round"
              style={{ strokeWidth: 3 }} />
          </svg>
        ) : null}
      </div>
    </div>
  );
};

/** The red starburst for a turn (his "inflection points"), 14 uneven points with a thin paper rim. */
export const Starburst: React.FC<{ at: number; out?: number; x: number; y: number; r: number; inline?: boolean; rot?: number }> = ({ at, out, x, y, r, inline, rot = -8 }) => {
  const f = useCurrentFrame();
  if (!inline && (f < at || (out !== undefined && f >= out))) return null;
  const pts = [...Array(28)].map((_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const rr = i % 2 === 0 ? 1 - rnd(i + 3) * 0.12 : 0.52 + rnd(i + 9) * 0.1;
    return `${(50 + Math.cos(a) * 48 * rr).toFixed(1)},${(50 + Math.sin(a) * 48 * rr).toFixed(1)}`;
  });
  const pop = interpolate(f - at, [0, 3], [1.15, 1], { ...clamp, easing: SNAP });
  return (
    <svg viewBox="0 0 100 100" width={r * 2} height={r * 2}
      style={{ position: "absolute", left: x - r, top: y - r, transform: `rotate(${rot}deg) scale(${pop})`, overflow: "visible" }}>
      <polygon points={pts.join(" ")} fill={DOODLE.red} stroke={DOODLE.paper} strokeWidth={1.2} strokeLinejoin="round" />
    </svg>
  );
};

/** A caption chip: 1 to 3 spoken words in a small box, bottom centre. `dark` is the black box used over the flat ground. */
export const Chip: React.FC<{ at: number; to: number; text: string; y?: number; dark?: boolean; size?: number }> = ({ at, to, text, y = 1400, dark, size = 50 }) => {
  const f = useCurrentFrame();
  if (f < at || f >= to) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: CHIP, fontWeight: 700, fontSize: size, lineHeight: 1.12, color: "#fff", letterSpacing: "-0.01em",
        background: dark ? DOODLE.chipInk : DOODLE.chipRed, padding: `${size * 0.1}px ${size * 0.26}px`, borderRadius: 4 }}>{text}</div>
    </div>
  );
};

/** A red marker ring that draws itself round something (canvas px box), 12 frames, like /ink-doodle's circle. */
export const MarkerRing: React.FC<{ at: number; out?: number; x: number; y: number; w: number; h: number }> = ({ at, out, x, y, w, h }) => {
  const f = useCurrentFrame();
  if (f < at || (out !== undefined && f >= out)) return null;
  const k = interpolate(f, [at, at + 12], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const d = [...Array(27)].map((_, i) => {
    const a = -1.3 + (i / 26) * Math.PI * 2.18;
    const rr = 1 + Math.sin(i * 1.7) * 0.03;
    return `${i ? "L" : "M"}${(50 + Math.cos(a) * 50 * rr).toFixed(1)},${(50 + Math.sin(a) * 50 * rr).toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "visible" }}>
      <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} stroke={DOODLE.red} strokeWidth={7} fill="none"
        strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

/**
 * An open question pinned on screen: a scrap with a short hand-printed question and empty boxes that tick one by one
 * as the video answers them, then a big red tick when the last one lands. Jackson's rule made visible: keep two or
 * three things pending, answer every one by the end.
 */
export const PinList: React.FC<{
  at: number;
  out?: number;
  x: number;
  y: number;
  w: number;
  rot?: number;
  title: string;
  /** Each row: its label once ticked (a "?" before), and the frame it ticks. */
  items: { label: string; tickAt: number }[];
  /** The big tick over the whole card. */
  closeAt?: number;
  move?: { at: number; x: number; y: number; w: number; rot?: number };
  seed?: number;
}> = (p) => {
  const f = useCurrentFrame();
  if (f < p.at || (p.out !== undefined && f >= p.out)) return null;
  const t = f - p.at;
  const pop = interpolate(t, [0, 3], [1.12, 1], { ...clamp, easing: SNAP });
  const mk = p.move ? interpolate(f, [p.move.at, p.move.at + 7], [0, 1], { ...clamp, easing: GLIDE }) : 0;
  const x = p.move ? p.x + (p.move.x - p.x) * mk : p.x;
  const y = p.move ? p.y + (p.move.y - p.y) * mk : p.y;
  const w = p.move ? p.w + (p.move.w - p.w) * mk : p.w;
  const rot = p.move ? (p.rot ?? 0) + ((p.move.rot ?? p.rot ?? 0) - (p.rot ?? 0)) * mk : p.rot ?? 0;
  const seed = p.seed ?? 77;
  const id = `boil-pin-${seed}`;
  const closed = p.closeAt !== undefined && f >= p.closeAt;
  const closePop = closed ? interpolate(f - p.closeAt!, [0, 4], [1.4, 1], { ...clamp, easing: SNAP }) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${pop})` }}>
      <Boil id={id} />
      <div style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,.28))" }}>
        <div style={{ clipPath: tear(seed), background: `repeating-linear-gradient(transparent 0 ${w * 0.11}px, ${DOODLE.paperLine} ${w * 0.11}px ${w * 0.115}px), #FFF6C9`,
          padding: `${w * 0.06}px ${w * 0.07}px ${w * 0.07}px`, filter: `url(#${id})` }}>
          <div style={{ fontFamily: HAND, fontSize: w * 0.1, color: DOODLE.ink, lineHeight: 1.05, marginBottom: w * 0.03 }}>{p.title}</div>
          {p.items.map((it, i) => {
            const on = f >= it.tickAt;
            const k = on ? interpolate(f - it.tickAt, [0, 3], [1.3, 1], { ...clamp, easing: SNAP }) : 1;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: w * 0.04, marginTop: w * 0.018 }}>
                <svg viewBox="0 0 100 100" width={w * 0.13} height={w * 0.13} style={{ overflow: "visible", flex: "none", transform: `scale(${k})` }}>
                  <Icon name={on ? "boxTicked" : "box"} t={t} />
                </svg>
                <div style={{ fontFamily: on ? HAND : MARKER, fontSize: w * (on ? 0.095 : 0.11), color: on ? DOODLE.ink : DOODLE.red, lineHeight: 1, whiteSpace: "nowrap" }}>
                  {on ? it.label : "?"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {closed ? (
        <svg viewBox="0 0 100 100" width={w * 0.5} height={w * 0.5}
          style={{ position: "absolute", right: -w * 0.36, top: -w * 0.05, overflow: "visible", transform: `scale(${closePop})`, filter: `url(#${id})` }}>
          <Icon name="check" t={t} />
        </svg>
      ) : null}
    </div>
  );
};
