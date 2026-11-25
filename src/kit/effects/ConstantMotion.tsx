/**
 * ConstantMotion (2026-11-24, Muse): the parts behind "always something moving to catch your eye on".
 * From bemx.studio's 29 s Lovable promo (instagram.com/reel/DgI-wb1K6Vj), read frame by frame at 0.5 s and 0.1 s:
 * a laptop in a dark room, the camera drifting by hand, and on the screen not one dead frame in the whole film.
 *
 * What the frames showed (seconds into the reel):
 *  - Inline bloom (0.6 to 1.5): an icon sitting inside a sentence grows to fill the screen in about 0.2 s, the ground
 *    flips to dark under gradient petals, holds about 0.6 s turning slowly, then collapses back into the sentence.
 *  - The question mark (2.4 to 3.6): a big gradient "?" draws itself under the line; the line then erases backwards
 *    a word at a time (about 0.1 s a word) instead of fading.
 *  - Words drop away (5.0 to 5.4): every word but the punch word leaves, the punch word turns colour, and a blob floods
 *    up from the bottom into the next scene.
 *  - Zoom through the logo (7.2 to 7.7): the wordmark scales until its letters are the background of the next scene.
 *  - The cursor is a character: an oversized gradient arrow, always travelling with intent; each click is punctuation.
 *  - Generation as spectacle (10.2 to 14.2): never a spinner. Finished screens multiply in 3D and tumble, then settle.
 *  - Zooms replace cuts, a dark breath before the ending, and the ending is a live edit: a word selected, deleted and
 *    retyped, the style swapped, then a press.
 *
 * Parts here: GradientCursor, InlineBloom, DrawQuestion, PieceStorm, typed(), and the numbers in CONSTANT_MOTION.
 * Worked example: PostConstantMotion-9x16 (src/trials/post-constant-motion.tsx, local with its captures).
 */
import React from "react";
import { Img, staticFile } from "remotion";

export const CONSTANT_MOTION = {
  bloomGrow: 6, // frames for the inline icon to fill the screen (0.2 s at 30 fps)
  bloomHold: 18,
  bloomCollapse: 9,
  eraseStep: 2.5, // frames per word when a line erases backwards
  typeCps: 30, // characters per second, one letter a frame
  zoomThrough: 14, // frames for the wordmark to become the next scene's background
  stormIn: 45, // pieces arriving scattered
  stormSettle: 34, // pieces converging onto the page
  cursorSize: 120, // px in a 1440 x 900 screen: about 8% of its width, as in the reel
};

/** Text typed one letter at a time from `at` (frames), `cps` characters a second at `fps`. */
export const typed = (text: string, f: number, at: number, cps = CONSTANT_MOTION.typeCps, fps = 30) =>
  text.slice(0, Math.max(0, Math.min(text.length, Math.floor(((f - at) / fps) * cps))));

/** The oversized gradient arrow. (x, y) is its tip. `press` 0..1 squashes it as it clicks; `ring` 0..1 draws a ripple. */
export const GradientCursor: React.FC<{
  x: number;
  y: number;
  size?: number;
  press?: number;
  ring?: number;
  from?: string;
  to?: string;
  opacity?: number;
}> = ({ x, y, size = CONSTANT_MOTION.cursorSize, press = 0, ring = 0, from = "#ff5c7a", to = "#D9202E", opacity = 1 }) => {
  const id = `gc${from.slice(1)}${to.slice(1)}`;
  const s = 1 - 0.14 * Math.sin(Math.min(1, press) * Math.PI);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity, pointerEvents: "none" }}>
      {ring > 0 && ring < 1 ? (
        <div style={{ position: "absolute", left: -size * 0.45 * ring, top: -size * 0.45 * ring, width: size * 0.9 * ring, height: size * 0.9 * ring, borderRadius: "50%", border: `${Math.max(1, 6 * (1 - ring))}px solid ${to}`, opacity: 1 - ring }} />
      ) : null}
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", left: -size * 0.12, top: -size * 0.08, overflow: "visible", transform: `scale(${s})`, transformOrigin: "12% 8%", filter: `drop-shadow(0 ${size * 0.06}px ${size * 0.1}px rgba(0,0,0,0.45))` }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        {/* a chunky arrow, rounded, its tip at (12, 8) */}
        <path d="M12 8 L84 46 Q90 49 84 52 L56 60 Q53 61 52 64 L42 90 Q39 96 36 90 L10 14 Q8 6 12 8 Z" fill={`url(#${id})`} stroke="rgba(255,255,255,0.85)" strokeWidth={3} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/**
 * The inline bloom: petals that sit inside a sentence at `iconSize`, grow to cover `cover` px, and collapse back.
 * `p` 0..1 is the size (0 = inline, 1 = full), `spin` turns it in degrees. Gradient petals, a dark core.
 */
export const InlineBloom: React.FC<{ p: number; iconSize: number; cover: number; spin?: number; colors?: [string, string, string] }> = ({ p, iconSize, cover, spin = 0, colors = ["#ff8fa3", "#D9202E", "#5b0a12"] }) => {
  const size = iconSize + (cover - iconSize) * p;
  const n = 8;
  return (
    <div style={{ position: "relative", width: size, height: size, transform: `rotate(${spin}deg)` }}>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: size * 0.25,
            top: 0,
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: "50% 50% 46% 46%",
            transformOrigin: "50% 100%",
            transform: `rotate(${(360 / n) * i}deg)`,
            background: `radial-gradient(circle at 50% 80%, ${colors[2]} 0%, ${colors[1]} 45%, ${colors[0]} 100%)`,
            opacity: 0.92,
            mixBlendMode: "screen",
          }}
        />
      ))}
      <div style={{ position: "absolute", left: size * 0.38, top: size * 0.38, width: size * 0.24, height: size * 0.24, borderRadius: "50%", background: `radial-gradient(circle, #fff 0%, ${colors[0]} 60%, rgba(0,0,0,0) 100%)`, opacity: 0.85 }} />
    </div>
  );
};

/** A big gradient question mark that draws itself (`p` 0..1), its dot landing last. */
export const DrawQuestion: React.FC<{ p: number; size: number; from?: string; to?: string }> = ({ p, size, from = "#ffc2cc", to = "#D9202E" }) => {
  const stroke = Math.min(1, p / 0.8);
  const dot = Math.max(0, (p - 0.8) / 0.2);
  return (
    <svg width={size * 0.66} height={size} viewBox="0 0 66 100" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="dq" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <path d="M10 28 Q10 6 33 6 Q56 6 56 27 Q56 41 41 49 Q33 54 33 66" fill="none" stroke="url(#dq)" strokeWidth={13} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - stroke} />
      <circle cx={33} cy={86} r={8 * dot} fill="url(#dq)" />
    </svg>
  );
};

/** A crop of a capture (CSS px of the page it was cut from) that can fly, tilt and settle. */
export type StormPiece = { x: number; y: number; w: number; h: number; radius?: number };

/**
 * Real pieces of one page arriving as a scattered 3D collage, then converging onto their places in the page.
 * `src` is the page capture (its CSS size `pageW` x `pageH`, any dpr). `arrive` 0..1 brings each piece in from deep and
 * blurred to its scattered spot (staggered); `settle` 0..1 flies them home. `t` (frames) keeps the collage drifting.
 */
export const PieceStorm: React.FC<{
  src: string;
  pageW: number;
  pageH: number;
  pieces: StormPiece[];
  arrive: number;
  settle: number;
  t: number;
  seed?: number;
}> = ({ src, pageW, pageH, pieces, arrive, settle, t, seed = 7 }) => {
  const rnd = (i: number, k: number) => {
    const v = Math.sin((i + 1) * 127.1 + k * 311.7 + seed * 74.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
  const swing = (x: number) => {
    const c = Math.max(0, Math.min(1, x));
    return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
  };
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1400, perspectiveOrigin: "50% 50%" }}>
      {pieces.map((pc, i) => {
        const n = pieces.length;
        const a = ease(arrive * (1 + n * 0.12) - i * 0.12); // staggered arrival
        const s = swing(settle * 1.25 - (i / n) * 0.25); // settle, a slight stagger
        if (a <= 0) return null;
        // the scattered spot: around the centre, at its own depth and tilt
        const ang = rnd(i, 1) * Math.PI * 2;
        const rad = 160 + rnd(i, 2) * 300;
        const sx = pageW / 2 + Math.cos(ang) * rad * 1.5 - pc.w / 2 + Math.sin(t / 40 + i) * 14;
        const sy = pageH / 2 + Math.sin(ang) * rad * 0.8 - pc.h / 2 + Math.cos(t / 46 + i) * 10;
        const sz = -300 - rnd(i, 3) * 500;
        const rx = (rnd(i, 4) - 0.5) * 50, ry = (rnd(i, 5) - 0.5) * 70, rz = (rnd(i, 6) - 0.5) * 24;
        // arrival comes from far behind, blurred
        const az = -2200 * (1 - a);
        const x = sx + (pc.x - sx) * s, y = sy + (pc.y - sy) * s, z = (sz + az) * (1 - s);
        const blur = (1 - a) * 10 + Math.abs(z) / 260 * (1 - s) * 0.6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: pc.w,
              height: pc.h,
              overflow: "hidden",
              borderRadius: pc.radius ?? 14,
              transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx * (1 - s)}deg) rotateY(${ry * (1 - s)}deg) rotateZ(${rz * (1 - s)}deg)`,
              opacity: Math.min(1, a * 1.6),
              filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined,
              boxShadow: `0 ${30 * (1 - s)}px ${60 * (1 - s)}px rgba(0,0,0,${0.55 * (1 - s)})`,
            }}
          >
            <Img src={staticFile(src)} style={{ position: "absolute", left: -pc.x, top: -pc.y, width: pageW, height: pageH, maxWidth: "none" }} />
          </div>
        );
      })}
    </div>
  );
};
