/**
 * Pastel launch (2026-11-20, from ClickUp's 3 min 30 s launch film, x.com/wallstengine/status/2123809287814476146,
 * Muse Nov 20; Jacob: "do one for CampusAi on web with basically the exact same layout / flow / visuals"). Read frame by
 * frame in his Chrome (1 s steps across all of it, 0.15 to 0.25 s around the cold open, a chapter card, the VISION beat,
 * the prompt bar and the close); every number below was measured on the 1920x1080 frames, our own build.
 *
 * The system, five parts that share one look:
 * - `PastelVoid`     the ground: near-white with a magenta wash top left, lavender mid left, blue bottom right, drifting.
 * - `KineticType`    a sentence builds word by word in small ink type; the one key word lands HUGE in a gradient.
 * - `FloatingScreen` a dark product capture floating tilted in 3D with a soft shadow, always turning a little.
 * - `ChapterCard`    black: logo at 31% height, "A way to ___ it." at 50% with the verb in a gradient, underlined,
 *                    and the feature name small at 69%.
 * - `GlowPrompt`     the product's own ask field drawn big, dark, with a slowly turning gradient rim, typing.
 * Gradient is reserved for one word (or one short phrase) per beat. Product screens stay real captures (`Capture`).
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { B, Shot, clampX, k, mix, OUT, IN } from "./shared";
import type { Capture } from "./shared";

// The film's face is a geometric grotesk with tight tracking; Plus Jakarta Sans is the closest free match.
const { fontFamily: JAKARTA } = loadJakarta("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });
export const LAUNCH_FONT = JAKARTA;

/** Measured from the film (1080p frames). Sizes are px at 1920x1080. */
export const LAUNCH = {
  /** Small sentence type: ink, 60 to 64 px, weight 500 to 600, tracking about -0.02em. */
  small: 62,
  /** The gradient word: 4x the sentence (IDEA. 177 px caps, SAME APP. 226 px caps), weight 700, tracking -0.035em. */
  big: 250,
  /** Chapter card headline: about 150 px white, weight 500. Underline 10 px, about 40 px under the baseline. */
  card: 150,
  /** Feature name under the card headline: about 36 px in the verb's gradient. */
  cardName: 38,
  ink: "#16161a",
  /** A new word arrives light grey and settles to ink in about 0.3 s. */
  arriving: "#a9a9b2",
  /** Words in a sentence land about 0.2 to 0.3 s apart, at speaking pace. */
  wordStep: 7,
  /** The gradient word fades up from washed out over 0.3 s (9 frames). */
  bigIn: 9,
  /** The chapter card: words 0.2 s apart, underline draws over 0.4 s, held about 1 s, 2.6 s in all, hard cuts both ends. */
  cardFrames: 78,
} as const;

/**
 * Gradients, left to right. `clickup*` are the film's own stops; the CampusAI ones keep its violet start and land on
 * the brand red, the way the film's "see" and "personalize" verbs run magenta into red-pink.
 */
export const LAUNCH_GRADIENTS = {
  clickupHero: ["#6546F4", "#4B5BF8", "#1E7BFD"],
  clickupSee: ["#FF0ADC", "#FF1EAC", "#FF3476"],
  clickupBuild: ["#6547F4", "#5850F9", "#4461F5"],
  clickupGrow: ["#F746CC", "#B559DA", "#9261E1"],
  clickupAutomate: ["#1F7CFB", "#0294EC", "#2399AB"],
  campus: ["#6546F4", "#A33FE0", "#E0287A", "#D9202E"],
  campusWarm: ["#E0289A", "#E8285A", "#D9202E"],
  campusCool: ["#6546F4", "#7A4BEE", "#C23BD2"],
} as const;
export const gradientCss = (stops: readonly string[], angle = 90) => `linear-gradient(${angle}deg, ${stops.join(", ")})`;

// ---------------------------------------------------------------------------------------------------------------
// PastelVoid

/** Measured corner and centre colours of the void, per chapter tint. */
export const VOID_TINTS = {
  /** Cold open: TL #E97BCB, ML #CAC9EE, BR #7AACF5, centre #FAFAFA, top centre #E2E5E6. */
  idea: { tl: "#E97BCB", ml: "#CAC9EE", br: "#7AACF5", bc: "#E9DAE7", base: "#EBEBEE" },
  /** Video Studio chapter: hotter pink top left, saturated blue bottom right. */
  pink: { tl: "#FF51C9", ml: "#BDBAF2", br: "#3685F6", bc: "#FFE5F7", base: "#F7F6F9" },
  /** Personal Software and Control chapters. */
  violet: { tl: "#9175FF", ml: "#ABC1FB", br: "#3684F5", bc: "#E8E4F9", base: "#F6F6FA" },
  /** AI Workflows chapter. */
  green: { tl: "#60C683", ml: "#B5DBE9", br: "#73ADFF", bc: "#E7F6EC", base: "#F7F9F8" },
  /** Personalize chapter and the recap: pink top left, peach bottom right. */
  peach: { tl: "#E882CC", ml: "#F3D2DA", br: "#F5C6BA", bc: "#E9DAE7", base: "#ECEBED" },
  /** CampusAI: the film's pink and lavender with a coral wash bottom right instead of blue, toward the brand red. */
  campus: { tl: "#E97BCB", ml: "#CAC9EE", br: "#F49A9A", bc: "#F1DCE4", base: "#EDECEF" },
} as const;
export type VoidTint = keyof typeof VOID_TINTS;

export const PastelVoid: React.FC<{ tint?: VoidTint; drift?: number; children?: React.ReactNode }> = ({ tint = "idea", drift = 1, children }) => {
  const f = useCurrentFrame();
  const c = VOID_TINTS[tint];
  // the washes breathe on slow, unrelated periods so the ground never sits still and never loops visibly
  const s = (p: number, a: number) => Math.sin((f / 30) * ((Math.PI * 2) / p)) * a * drift;
  const bg = [
    `radial-gradient(48% 62% at ${-4 + s(13, 3)}% ${-6 + s(11, 4)}%, ${c.tl} 0%, ${c.tl}00 100%)`,
    `radial-gradient(38% 55% at ${-6 + s(17, 3)}% ${56 + s(9, 5)}%, ${c.ml} 0%, ${c.ml}00 100%)`,
    `radial-gradient(52% 64% at ${104 + s(15, 3)}% ${106 + s(12, 4)}%, ${c.br} 0%, ${c.br}00 100%)`,
    `radial-gradient(60% 40% at ${50 + s(19, 6)}% ${108}%, ${c.bc} 0%, ${c.bc}00 100%)`,
    `radial-gradient(55% 55% at ${52 + s(23, 4)}% ${46 + s(21, 3)}%, #ffffffcc 0%, #ffffff00 100%)`,
    c.base,
  ].join(", ");
  return <AbsoluteFill style={{ background: bg, overflow: "hidden", fontFamily: JAKARTA }}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------------------------------------------------------
// KineticType

/** One word of a kinetic sentence. `g` paints it in the gradient (a small accent word, like "design" in "One to design it."). */
export type KWord = { text: string; at: number; g?: boolean };

/** Splits "One to *plan* it." into words that land `step` frames apart from `at`; *starred* words get the gradient. */
export const words = (line: string, at: number, step: number = LAUNCH.wordStep): KWord[] =>
  line.split(" ").filter(Boolean).map((w, i) => ({ text: w.replace(/\*/g, ""), g: w.includes("*"), at: at + i * step }));

const wordStyle = (f: number, at: number) => {
  // arrives light, settles to ink: opacity over 3 frames, colour over 8
  const o = k(f, at, at + 3, OUT);
  const c = k(f, at, at + 8, OUT);
  return { opacity: o, c };
};

const GradText: React.FC<{ stops: readonly string[]; style?: React.CSSProperties; children: React.ReactNode }> = ({ stops, style, children }) => (
  <span style={{ backgroundImage: gradientCss(stops), WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent", ...style }}>
    {children}
  </span>
);

/** A row of words, each arriving at its own frame. Dark grounds (`dark`) settle to white instead of ink. */
export const WordRow: React.FC<{
  items: KWord[];
  size?: number;
  weight?: number;
  dark?: boolean;
  stops?: readonly string[];
  style?: React.CSSProperties;
  /** keep room for words not yet arrived, so a centred line never re-centres (true); a pill grows instead (false) */
  reserve?: boolean;
}> = ({ items, size = LAUNCH.small, weight = 600, dark = false, stops = LAUNCH_GRADIENTS.campus, style, reserve = true }) => {
  const f = useCurrentFrame();
  const ink = dark ? [255, 255, 255] : [22, 22, 26];
  const from = dark ? [90, 90, 98] : [178, 178, 186];
  return (
    <div style={{ fontFamily: JAKARTA, fontSize: size, fontWeight: weight, letterSpacing: "-0.025em", lineHeight: 1.18, whiteSpace: "nowrap", ...style }}>
      {items.map((w, i) => {
        if (f < w.at) return reserve ? <span key={i} style={{ opacity: 0 }}>{w.text}{i < items.length - 1 ? " " : ""}</span> : null;
        const { opacity, c } = wordStyle(f, w.at);
        const rgb = from.map((v, j) => Math.round(mix(v, ink[j], c)));
        const body = w.g ? (
          <GradText stops={stops} style={{ opacity: 0.45 + 0.55 * c }}>{w.text}</GradText>
        ) : (
          <span style={{ color: `rgb(${rgb.join(",")})` }}>{w.text}</span>
        );
        return (
          <span key={i} style={{ opacity }}>
            {body}
            {i < items.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
};

/** The huge gradient word: fades up from washed out (0.3 s), a touch of blur and a 3% settle. */
export const BigWord: React.FC<{ text: string; at: number; size?: number; stops?: readonly string[]; style?: React.CSSProperties; weight?: number }> = ({
  text, at, size = LAUNCH.big, stops = LAUNCH_GRADIENTS.campus, style, weight = 700,
}) => {
  const f = useCurrentFrame();
  const t = f < at ? 0 : k(f, at, at + LAUNCH.bigIn, OUT);
  return (
    <div style={{ fontFamily: JAKARTA, fontSize: size, fontWeight: weight, letterSpacing: "-0.035em", lineHeight: 1, whiteSpace: "nowrap",
      opacity: f < at ? 0 : 0.25 + 0.75 * t, filter: `blur(${((1 - t) * 6).toFixed(2)}px) saturate(${(0.35 + 0.65 * t).toFixed(3)})`,
      transform: `scale(${mix(0.97, 1, t).toFixed(4)})`, ...style }}>
      <GradText stops={stops}>{text}</GradText>
    </div>
  );
};

/**
 * One kinetic beat, centred: a small sentence (one or two lines) that builds word by word, then the big gradient word
 * under it. `out` (frame) takes the whole beat away in 5 frames; the film mostly hard-cuts instead.
 */
export const KineticType: React.FC<{
  lines: KWord[][];
  big?: { text: string; at: number; size?: number };
  y?: number;
  dark?: boolean;
  size?: number;
  stops?: readonly string[];
  out?: number;
  align?: "center" | "left";
  x?: number;
}> = ({ lines, big, y = 540, dark = false, size = LAUNCH.small, stops = LAUNCH_GRADIENTS.campus, out, align = "center", x }) => {
  const f = useCurrentFrame();
  const o = out === undefined ? 1 : 1 - k(f, out, out + 5, IN);
  return (
    <div style={{ position: "absolute", left: align === "center" ? 0 : x ?? 160, right: align === "center" ? 0 : undefined, top: y,
      transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start", opacity: o }}>
      {lines.map((l, i) => <WordRow key={i} items={l} size={size} dark={dark} stops={stops} />)}
      {big ? <BigWord text={big.text} at={big.at} size={big.size} stops={stops} style={{ marginTop: size * 0.12 }} /> : null}
    </div>
  );
};

/**
 * A white caption pill at the bottom centre that builds word by word (the cold open's "Then come the tools."). The line's
 * place is set by the whole sentence, so arrived words never move; the pill grows to the right as words land.
 */
export const CaptionPill: React.FC<{ items: KWord[]; y?: number; size?: number; stops?: readonly string[]; out?: number }> = ({
  items, y = 1000, size = 40, stops = LAUNCH_GRADIENTS.campus, out,
}) => {
  const f = useCurrentFrame();
  if (!items.length || f < items[0].at) return null;
  const a = k(f, items[0].at, items[0].at + 6, OUT);
  const o = out === undefined ? 1 : 1 - k(f, out, out + 5, IN);
  const pad = `${size * 0.32}px ${size * 0.55}px`;
  const total = items.map((w) => w.text).join(" ").length;
  const padFrac = (size * 1.1) / (total * size * 0.55 + size * 1.1);
  let grown = padFrac;
  items.forEach((w, i) => {
    const share = (w.text.length + (i ? 1 : 0)) / total;
    grown += share * (1 - padFrac) * k(f, w.at, w.at + 5, OUT);
  });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", opacity: a * o }}>
      <div style={{ position: "relative", transform: `translateY(-100%) translateY(${(1 - a) * 12}px)` }}>
        {/* the whole line, unseen, holds the place */}
        <div style={{ padding: pad, visibility: "hidden" }}>
          <WordRow items={items.map((w) => ({ ...w, at: -1 }))} size={size} weight={600} stops={stops} />
        </div>
        {/* the pill is the whole line's size, clipped to the words landed so far (by letters), easing as each lands */}
        <div style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 10px 22px rgba(40,30,60,0.14))" }}>
          <div style={{ position: "absolute", inset: 0, background: "#ffffff", borderRadius: 14,
          clipPath: `inset(0 ${((1 - grown) * 100).toFixed(2)}% 0 0 round 14px)` }} />
        </div>
        <div style={{ position: "absolute", left: 0, top: 0, padding: pad }}>
          <WordRow items={items} size={size} weight={600} stops={stops} reserve={false} />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// FloatingScreen

export type Pose = { x: number; y: number; w: number; rx?: number; ry?: number; rz?: number; o?: number };

/**
 * A real capture floating in the void: arrives from `from` to `to` over `inFrames` (strong ease-out), then keeps turning
 * `spin` degrees a second around Y and pushing in `push` (scale per second), the film's slow drift (about 2.5 deg/s).
 * Measured: settled screens sit at rotateY -6 to -11 deg with almost no Z roll; cold-open windows fly in at 15 to 25 deg.
 */
export const FloatingScreen: React.FC<{
  shot: Capture;
  at: number;
  from?: Pose;
  to: Pose;
  inFrames?: number;
  spin?: number;
  push?: number;
  out?: { at: number; to: Pose; frames?: number };
  radius?: number;
  dark?: boolean;
  shadow?: boolean;
}> = ({ shot, at, from, to, inFrames = 18, spin = -2.5, push = 0.015, out, radius = 18, dark = true, shadow = true }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const a = from ? k(f, at, at + inFrames, OUT) : 1;
  const t = (f - at) / 30;
  let p: Required<Pose> = {
    x: mix(from?.x ?? to.x, to.x, a), y: mix(from?.y ?? to.y, to.y, a), w: mix(from?.w ?? to.w, to.w, a),
    rx: mix(from?.rx ?? to.rx ?? 0, to.rx ?? 0, a), ry: mix(from?.ry ?? to.ry ?? 0, to.ry ?? 0, a) + spin * t,
    rz: mix(from?.rz ?? to.rz ?? 0, to.rz ?? 0, a), o: mix(from?.o ?? 1, to.o ?? 1, a),
  };
  if (out && f >= out.at) {
    const b = k(f, out.at, out.at + (out.frames ?? 12), IN);
    p = { x: mix(p.x, out.to.x, b), y: mix(p.y, out.to.y, b), w: mix(p.w, out.to.w, b), rx: mix(p.rx, out.to.rx ?? p.rx, b),
      ry: mix(p.ry, out.to.ry ?? p.ry, b), rz: mix(p.rz, out.to.rz ?? p.rz, b), o: mix(p.o, out.to.o ?? 0, b) };
  }
  const scale = 1 + push * t;
  const h = (shot.crop.h / shot.crop.w) * p.w;
  return (
    <div style={{ position: "absolute", left: p.x - p.w / 2, top: p.y - h / 2, width: p.w, height: h, perspective: 2200, opacity: p.o }}>
      <div style={{ width: "100%", height: "100%", transform: `scale(${scale.toFixed(4)}) rotateX(${p.rx.toFixed(3)}deg) rotateY(${p.ry.toFixed(3)}deg) rotateZ(${p.rz.toFixed(3)}deg)`,
        transformStyle: "preserve-3d", borderRadius: radius,
        boxShadow: shadow ? (dark ? "0 40px 90px rgba(30,16,40,0.35), 0 12px 30px rgba(30,16,40,0.25)" : "0 30px 70px rgba(60,40,90,0.18), 0 8px 20px rgba(60,40,90,0.12)") : undefined }}>
        <Shot shot={shot} width={p.w} radius={radius} />
        <div style={{ position: "absolute", inset: 0, borderRadius: radius, boxShadow: dark ? "inset 0 0 0 1.5px rgba(255,255,255,0.10)" : "inset 0 0 0 1px rgba(0,0,0,0.06)" }} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// ChapterCard

/**
 * Black, hard cut in and out. Logo at 31% height, "A way to <verb> it." at 50%, the feature name at 69%.
 * Words 6 frames apart; the verb in its gradient with the underline drawing left to right over 12 frames.
 * The ground carries a blue glow top right and a magenta haze along the bottom, as in the film.
 */
export const ChapterCard: React.FC<{
  at: number;
  verb: string;
  name: string;
  stops?: readonly string[];
  lead?: string;
  tail?: string;
  logo?: React.ReactNode;
}> = ({ at, verb, name, stops = LAUNCH_GRADIENTS.campusWarm, lead = "A way to", tail = "it.", logo }) => {
  const f = useCurrentFrame();
  const leadW = lead.split(" ").map((w, i) => ({ text: w, at: at + 4 + i * 6 }));
  const verbAt = at + 4 + leadW.length * 6;
  const tailAt = verbAt + 8;
  const nameW = name.split(" ").map((w, i) => ({ text: w, at: tailAt + 8 + i * 6 }));
  const line = k(f, verbAt + 3, verbAt + 15, Easing.bezier(0.65, 0, 0.35, 1));
  const v = k(f, verbAt, verbAt + 6, OUT);
  const glow = interpolate(f - at, [0, 40], [0.6, 1], clampX);
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: JAKARTA, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: [
        `radial-gradient(40% 45% at 104% -6%, rgba(40,70,200,${0.42 * glow}) 0%, rgba(40,70,200,0) 100%)`,
        `radial-gradient(55% 30% at 40% 112%, rgba(200,40,140,${0.38 * glow}) 0%, rgba(200,40,140,0) 100%)`,
        `radial-gradient(40% 40% at 100% 100%, rgba(217,32,46,${0.22 * glow}) 0%, rgba(217,32,46,0) 100%)`,
      ].join(", ") }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1080 * 0.31, transform: "translateY(-50%)", display: "flex", justifyContent: "center",
        opacity: k(f, at, at + 5, OUT) }}>
        {logo ?? (B.logo ? <Img src={staticFile(B.logo.onDark)} style={{ height: 62 }} /> : null)}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1080 * 0.5, transform: "translateY(-50%)", display: "flex", justifyContent: "center",
        alignItems: "baseline", fontSize: LAUNCH.card, fontWeight: 500, letterSpacing: "-0.03em", color: "#fff", whiteSpace: "nowrap" }}>
        <WordRow items={leadW} size={LAUNCH.card} weight={500} dark />
        <span style={{ display: "inline-block", width: LAUNCH.card * 0.26 }} />
        <span style={{ position: "relative", opacity: f >= verbAt ? 0.3 + 0.7 * v : 0 }}>
          <GradText stops={stops}>{verb}</GradText>
          <span style={{ position: "absolute", left: 0, bottom: -LAUNCH.card * 0.12, height: 9, width: `${line * 100}%`, borderRadius: 5, backgroundImage: gradientCss(stops) }} />
        </span>
        <span style={{ display: "inline-block", width: LAUNCH.card * 0.26 }} />
        <WordRow items={[{ text: tail, at: tailAt }]} size={LAUNCH.card} weight={500} dark />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1080 * 0.69, transform: "translateY(-50%)", display: "flex", justifyContent: "center" }}>
        <div style={{ fontSize: LAUNCH.cardName, fontWeight: 500, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
          {nameW.map((w, i) => (
            <span key={i} style={{ opacity: f >= w.at ? k(f, w.at, w.at + 5, OUT) : 0 }}><GradText stops={stops}>{w.text}</GradText>{i < nameW.length - 1 ? " " : ""}</span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// GlowPrompt

/**
 * The product's ask field, drawn big and dark with a slowly turning gradient rim and outer glow (the film's prompt bar).
 * Types one letter a frame from `typeAt`. Pass the product's own placeholder and chip words, never invented ones.
 */
export const GlowPrompt: React.FC<{
  at: number;
  typeAt: number;
  text: string;
  placeholder?: string;
  chip?: string;
  width?: number;
  x?: number;
  y?: number;
  pressAt?: number;
  size?: number;
}> = ({ at, typeAt, text, placeholder = "Ask CampusAI anything...", chip, width = 1300, x = 960, y = 540, pressAt, size = 44 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const a = k(f, at, at + 14, OUT);
  const n = Math.max(0, Math.min(text.length, f - typeAt));
  const shown = text.slice(0, n);
  const caret = n < text.length ? 1 : 0.55 + 0.45 * Math.cos(((f - typeAt - text.length) / 30) * Math.PI * 2);
  const ang = (f * 2.2) % 360;
  const h = size * 3.6;
  const press = pressAt === undefined ? 0 : interpolate(f, [pressAt, pressAt + 3, pressAt + 9], [0, 1, 0], clampX);
  return (
    <div style={{ position: "absolute", left: x - width / 2, top: y - h / 2, width, height: h, perspective: 2000,
      opacity: a, transform: `translateY(${(1 - a) * 40}px)` }}>
      <div style={{ position: "absolute", inset: -40, borderRadius: 60, filter: "blur(38px)", opacity: 0.55,
        background: `conic-gradient(from ${ang}deg, #6546F4, #1E7BFD, #E0287A, #FF8A3D, #6546F4)` }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 30, padding: 2.5, background: `conic-gradient(from ${ang}deg, #6546F4, #1E7BFD, #E0287A, #FF8A3D, #6546F4)` }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 28, background: "linear-gradient(180deg, #17121a 0%, #0d0a0e 100%)",
          display: "flex", alignItems: "center", padding: `0 ${size * 0.8}px`, gap: size * 0.4, fontFamily: JAKARTA }}>
          {chip ? <span style={{ color: "#E8424F", fontSize: size * 0.72, fontWeight: 600, whiteSpace: "nowrap" }}>{chip}</span> : null}
          <div style={{ flex: 1, fontSize: size, fontWeight: 500, letterSpacing: "-0.01em", color: n ? "#f4eef0" : "#7d7579", whiteSpace: "nowrap", overflow: "hidden" }}>
            {n ? shown : f < typeAt ? placeholder : ""}
            <span style={{ display: "inline-block", width: 3, height: size * 1.05, marginLeft: 3, verticalAlign: "-0.18em", background: "#f4eef0", opacity: caret }} />
          </div>
          <div style={{ width: size * 1.6, height: size * 1.6, borderRadius: "50%", background: "linear-gradient(135deg, #E0287A, #D9202E)",
            display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 - press * 0.12})`, boxShadow: "0 6px 20px rgba(217,32,46,0.45)" }}>
            <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
