/**
 * SaaS pack (2026-11-25, Muse: Murad Guliyev's SaaSor reel, instagram.com/reel/DgH0E3OTIQM; Jacob: "NEEEED THESE ASAP").
 * SaaSor is a paid After Effects panel (mgulifes.com; on Gumroad SaaSor Plus is $79.99, the 3D Mockups add-on $17.99,
 * the Extension plus 14 add-ons $12.99). Nothing was bought and nothing was entered on their site. We work in Remotion,
 * so these are free equivalents of the scene types the reel shows, built from what was visible on screen:
 * - "Intro, Outro & CTA 1 to 6": a card per variant. The one he imports (CTA 3) is a magenta-violet gradient field with a
 *   frosted pill holding a round avatar and a URL, and a small second line; he retypes the placeholder to his URL.
 *   Ours: `CtaPill`, `CtaHeadline`, `CtaButton`, `CtaLogo`.
 * - "Gradient BG": `GradientBg` in three movements (aurora, mesh, sweep) with a fine grain.
 * - "GLB Model": a 3D object in the scene. Ours is CSS 3D, no new package: `ProductSlab` (a real capture as a thick slab
 *   turning in space, with a reflection) and `ProductStack` (real captures flying apart in depth, his "Z Depth" add-on).
 * Every scene reads the frame size, so one component renders 16:9 and 9:16; every word is a prop. CampusAI's look from
 * `kit/brand.ts` (red #D9202E, near-black #0b0708, Zodiak titles, Inter UI); grounds lean red (rules/campusai.md).
 * Default copy is the product's own words or lines we have used before, so the reel is true as rendered.
 * Preview reel: `SaasPack-Reel-16x9` and `SaasPack-Reel-9x16` page through every scene with its name in plain type.
 */
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { B, IN, Logo, OUT, k, mix } from "../../kit/effects/shared";
import { useBrandFonts } from "../../kit/brand";
import { PointerAt } from "../../kit/Pointer";
import { INTER } from "./parts";

const C = { red: "#D9202E", deep: "#0b0708", oxblood: "#4a0a10", wine: "#7a1020", coral: "#ff6a55", rose: "#f08a96", cream: "#f7efe6", ink: "#f7efe6" };
const ZODIAK = "Zodiak";
const smooth = (t: number) => t * t * (3 - 2 * t);
const usePortrait = () => {
  const { width, height } = useVideoConfig();
  return { width, height, portrait: height > width, u: Math.min(width, height) / 1080 };
};

/** A real capture: a still under public/ and its pixel size; `crop` shows one part of it. */
export type Shot = { src: string; w: number; h: number; crop?: { x: number; y: number; w: number; h: number } };
const DELOITTE: Shot = { src: "muse1125-triangle/flow/f00743.jpg", w: 2880, h: 1800 };
const TRACKER: Shot = { src: "muse1125-triangle/flow/f00156.jpg", w: 2880, h: 1800 };
const ROLES: Shot = { ...DELOITTE, crop: { x: 497, y: 613, w: 1281, h: 479 } };
const TODO: Shot = { ...DELOITTE, crop: { x: 1828, y: 613, w: 985, h: 375 } };

const ShotImg: React.FC<{ shot: Shot; width: number; radius?: number; style?: React.CSSProperties }> = ({ shot, width, radius = 0, style }) => {
  const c = shot.crop ?? { x: 0, y: 0, w: shot.w, h: shot.h };
  const s = width / c.w;
  return (
    <div style={{ position: "relative", width, height: c.h * s, overflow: "hidden", borderRadius: radius, ...style }}>
      <Img src={staticFile(shot.src)} style={{ position: "absolute", left: -c.x * s, top: -c.y * s, width: shot.w * s, height: shot.h * s, maxWidth: "none" }} />
    </div>
  );
};
const shotRatio = (s: Shot) => (s.crop ? s.crop.h / s.crop.w : s.h / s.w);

// ------------------------------------------------------------------------------------------------ GradientBg
export type GradientVariant = "aurora" | "mesh" | "sweep";

/** A moving gradient ground. Colours default to CampusAI's reds; `speed` 1 is one slow loop about every 8 s. */
export const GradientBg: React.FC<{ variant?: GradientVariant; colors?: string[]; ground?: string; speed?: number; grain?: boolean }> = ({
  variant = "aurora", colors = [C.red, C.coral, C.wine, C.rose], ground = C.deep, speed = 1, grain = true,
}) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = (f / fps) * speed * ((Math.PI * 2) / 8);
  let bg: string;
  if (variant === "sweep") {
    const a = (f / fps) * 24 * speed;
    bg = `radial-gradient(120% 90% at 50% 120%, ${colors[0]}cc 0%, transparent 60%), conic-gradient(from ${a.toFixed(1)}deg at 50% 55%, ${ground}, ${colors[2]}, ${colors[0]}, ${colors[1]}, ${colors[2]}, ${ground})`;
  } else if (variant === "mesh") {
    const p = (i: number) => {
      const ang = t + (i * Math.PI) / 2;
      return `${(50 + Math.cos(ang) * 38).toFixed(1)}% ${(50 + Math.sin(ang * 1.3) * 38).toFixed(1)}%`;
    };
    bg = colors.map((c, i) => `radial-gradient(60% 60% at ${p(i)}, ${c} 0%, transparent 70%)`).join(", ") + `, ${ground}`;
  } else {
    const blob = (i: number, rx: number, ry: number) => {
      const x = 50 + Math.sin(t * (0.7 + i * 0.23) + i * 1.7) * rx;
      const y = 50 + Math.cos(t * (0.5 + i * 0.19) + i) * ry;
      return `radial-gradient(42% 38% at ${x.toFixed(1)}% ${y.toFixed(1)}%, ${colors[i % colors.length]}d9 0%, transparent 72%)`;
    };
    bg = [blob(0, 30, 24), blob(1, 34, 30), blob(2, 26, 34), blob(3, 36, 20)].join(", ") + `, ${ground}`;
  }
  const seed = Math.floor(f / 2) % 8;
  return (
    <AbsoluteFill style={{ background: bg }}>
      {grain ? (
        <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: 0.1, mixBlendMode: "overlay" }}>
          <filter id={`g${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} /></filter>
          <rect width="100%" height="100%" filter={`url(#g${seed})`} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ CtaPill
/** CTA 1, after SaaSor's CTA 3: a frosted pill with the mark and a URL typing in, a pointer pressing it, a line under. */
export const CtaPill: React.FC<{ headline?: string; url?: string; variant?: GradientVariant }> = ({
  headline = "Ask CampusAI anything.", url = "campusai.app", variant = "aurora",
}) => {
  useBrandFonts(B);
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height, u } = usePortrait();
  const pop = spring({ frame: f - 6, fps, config: { damping: 15, stiffness: 140 } });
  const typed = Math.max(0, Math.min(url.length, Math.floor((f - 18) / 1.5)));
  const pw = 640 * u, ph = 128 * u, cx = width / 2, cy = height / 2;
  const press = 58;
  const px = interpolate(f, [34, 56], [cx + 420 * u, cx + 90 * u], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: OUT });
  const py = interpolate(f, [34, 56], [cy + 320 * u, cy + 20 * u], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: OUT });
  const squash = f >= press ? 1 - 0.04 * Math.max(0, 1 - (f - press) / 6) : 1;
  return (
    <AbsoluteFill>
      <GradientBg variant={variant} />
      <div style={{ position: "absolute", left: cx - pw / 2, top: cy - ph / 2, width: pw, height: ph, borderRadius: ph / 2,
        background: "rgba(255,255,255,0.13)", border: `${1.5 * u}px solid rgba(255,255,255,0.35)`, boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,0.35)`,
        transform: `scale(${(mix(0.7, 1, pop) * squash).toFixed(4)})`, opacity: Math.min(1, pop * 1.5), display: "flex", alignItems: "center", gap: 26 * u, paddingLeft: 22 * u, boxSizing: "border-box" }}>
        <div style={{ width: ph - 44 * u, height: ph - 44 * u, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <span style={{ font: `700 ${44 * u}px ${INTER}`, color: "#fff", lineHeight: 1 }}>{"\u2726"}</span>
        </div>
        <div style={{ font: `600 ${52 * u}px ${INTER}`, color: C.cream, letterSpacing: "-0.02em", whiteSpace: "pre" }}>
          {url.slice(0, typed)}<span style={{ opacity: f < 18 + url.length * 1.5 + 10 && Math.floor(f / 8) % 2 === 0 ? 1 : 0 }}>|</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, width, top: cy + ph / 2 + 44 * u, textAlign: "center", font: `700 ${60 * u}px ${ZODIAK}`, color: C.cream,
        opacity: k(f, 24, 36), transform: `translateY(${((1 - k(f, 24, 36)) * 20 * u).toFixed(1)}px)` }}>{headline}</div>
      {f >= 34 ? <PointerAt x={px} y={py} since={f >= press ? (f - press) / fps : null} accent={C.red} size={58 * u} /> : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ CtaHeadline
/** CTA 2 (an intro): the headline rising word by word out of a blur, one accent word, the logo landing under it. */
export const CtaHeadline: React.FC<{ lines?: string[]; accent?: string; variant?: GradientVariant }> = ({
  lines = ["Made for", "Terps."], accent = "Terps.", variant = "sweep",
}) => {
  useBrandFonts(B);
  const f = useCurrentFrame();
  const { width, height, portrait, u } = usePortrait();
  const size = (portrait ? 170 : 150) * u;
  let n = 0;
  return (
    <AbsoluteFill>
      <GradientBg variant={variant} colors={[C.wine, C.red, C.oxblood, C.rose]} />
      <AbsoluteFill style={{ background: "rgba(11,7,8,0.35)" }} />
      <div style={{ position: "absolute", left: 0, width, top: height / 2 - (lines.length * size * 1.02) / 2 - 70 * u, textAlign: "center" }}>
        {lines.map((line, li) => (
          <div key={li} style={{ font: `700 ${size}px ${ZODIAK}`, lineHeight: 1.02, color: C.cream, letterSpacing: "-0.03em" }}>
            {line.split(" ").map((w, wi) => {
              const at = 4 + n++ * 5;
              const p = k(f, at, at + 12);
              const isAccent = w === accent;
              return (
                <span key={wi} style={{ display: "inline-block", marginRight: "0.22em", opacity: p, color: isAccent ? C.red : C.cream,
                  fontStyle: isAccent ? "italic" : "normal", fontWeight: isAccent ? 400 : 700,
                  transform: `translateY(${((1 - p) * 60 * u).toFixed(1)}px)`, filter: `blur(${((1 - p) * 12).toFixed(1)}px)` }}>{w}</span>
              );
            })}
          </div>
        ))}
      </div>
      <Logo at={30} x={width / 2} y={height / 2 + (lines.length * size * 1.02) / 2 + 40 * u} width={360 * u} spring />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ CtaButton
/** CTA 3 (an outro): a light card, the headline, a red button the pointer presses; the button turns into the URL. */
export const CtaButton: React.FC<{ headline?: string; button?: string; url?: string }> = ({
  headline = "Network with UMD alumni.", button = "Find them", url = "campusai.app",
}) => {
  useBrandFonts(B);
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height, portrait, u } = usePortrait();
  const cx = width / 2, cy = height / 2 + (portrait ? 40 : 60) * u;
  const press = 44;
  const pop = spring({ frame: f - 12, fps, config: { damping: 13, stiffness: 160 } });
  const swap = k(f, press + 6, press + 16);
  const bw = mix(380, 470, swap) * u, bh = 112 * u;
  const px = interpolate(f, [24, 42], [cx + 380 * u, cx + 40 * u], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: OUT });
  const py = interpolate(f, [24, 42], [cy + 300 * u, cy + 10 * u], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: OUT });
  const ripple = k(f, press, press + 18);
  const squash = f >= press && f < press + 6 ? 0.95 : 1;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(90% 70% at 50% 110%, ${C.rose} 0%, ${C.cream} 62%)` }}>
      <div style={{ position: "absolute", left: 60 * u, right: 60 * u, top: cy - 300 * u, textAlign: "center", font: `700 ${(portrait ? 112 : 104) * u}px ${ZODIAK}`,
        lineHeight: 1.05, color: C.deep, letterSpacing: "-0.03em", opacity: k(f, 0, 12), transform: `translateY(${((1 - k(f, 0, 12)) * 30 * u).toFixed(1)}px)` }}>{headline}</div>
      <div style={{ position: "absolute", left: cx - bw / 2, top: cy + 30 * u, width: bw, height: bh, borderRadius: bh / 2,
        background: mix(0, 1, swap) > 0.5 ? C.deep : C.red, transform: `scale(${(mix(0.6, 1, pop) * squash).toFixed(4)})`, opacity: Math.min(1, pop * 1.5),
        display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 ${20 * u}px ${50 * u}px rgba(217,32,46,0.35)`, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: bw * 2 * ripple, height: bw * 2 * ripple, borderRadius: "50%", background: "rgba(255,255,255,0.25)", opacity: 1 - ripple }} />
        <span style={{ font: `600 ${46 * u}px ${INTER}`, color: "#fff", letterSpacing: "-0.01em", opacity: 1 - Math.min(1, swap * 2), position: "absolute" }}>{button}</span>
        <span style={{ font: `600 ${46 * u}px ${INTER}`, color: "#fff", letterSpacing: "-0.01em", opacity: Math.max(0, swap * 2 - 1), position: "absolute" }}>{url}</span>
      </div>
      {f >= 24 ? <PointerAt x={px} y={py} since={f >= press ? (f - press) / fps : null} accent={C.red} size={58 * u} /> : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ CtaLogo
/** CTA 4 (an end card): the wordmark out of a blur on a moving red ground, the URL and a short line under it. */
export const CtaLogo: React.FC<{ url?: string; line?: string }> = ({ url = "campusai.app", line = "Link in bio." }) => {
  const f = useCurrentFrame();
  const { width, height, u } = usePortrait();
  return (
    <AbsoluteFill>
      <GradientBg variant="mesh" colors={[C.red, C.wine, C.coral, C.oxblood]} ground={C.oxblood} />
      <Logo at={4} x={width / 2} y={height / 2 - 30 * u} width={560 * u} spring />
      <div style={{ position: "absolute", left: 0, width, top: height / 2 + 70 * u, textAlign: "center", font: `600 ${50 * u}px ${INTER}`, color: C.cream,
        letterSpacing: "-0.02em", opacity: k(f, 18, 28) }}>{url}</div>
      <div style={{ position: "absolute", left: 0, width, top: height / 2 + 140 * u, textAlign: "center", font: `500 ${38 * u}px ${INTER}`, color: "rgba(247,239,230,0.75)",
        opacity: k(f, 26, 36) }}>{line}</div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ ProductSlab
/** A real capture as a thick slab turning in space over a gradient, with a soft reflection, then settling front on. */
export const ProductSlab: React.FC<{ shot?: Shot; headline?: string; variant?: GradientVariant }> = ({
  shot = TRACKER, headline = "Company Tracker", variant = "mesh",
}) => {
  useBrandFonts(B);
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height, portrait, u } = usePortrait();
  const sw = (portrait ? 0.9 * width : 0.62 * width);
  const sh = sw * shotRatio(shot);
  const turn = spring({ frame: f - 2, fps, config: { damping: 22, stiffness: 40, mass: 1.2 } });
  const ry = mix(-38, -6, turn) + Math.sin(f / 24) * 2;
  const rx = mix(18, 6, turn);
  const bob = Math.sin(f / 18) * 8 * u;
  const cy = portrait ? height * 0.56 : height * 0.55;
  const depth = 14;
  const slab = (
    <div style={{ position: "relative", width: sw, height: sh, transformStyle: "preserve-3d" }}>
      {Array.from({ length: depth }).map((_, i) => (
        <div key={i} style={{ position: "absolute", inset: 0, borderRadius: 18 * u, background: i === depth - 1 ? "#1a1012" : "#2a1418",
          transform: `translateZ(${(-(depth - i) * 2.2 * u).toFixed(1)}px)` }} />
      ))}
      <ShotImg shot={shot} width={sw} radius={18 * u} style={{ position: "absolute", inset: 0, boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }} />
    </div>
  );
  return (
    <AbsoluteFill>
      <GradientBg variant={variant} colors={[C.wine, C.red, C.oxblood, C.coral]} />
      <div style={{ position: "absolute", left: 0, width, top: portrait ? height * 0.16 : height * 0.08, textAlign: "center", font: `700 ${(portrait ? 120 : 96) * u}px ${ZODIAK}`,
        color: C.cream, letterSpacing: "-0.03em", opacity: k(f, 8, 20) }}>{headline}</div>
      <div style={{ position: "absolute", left: width / 2 - sw / 2, top: cy - sh / 2 + bob, width: sw, height: sh, perspective: 2400 * u }}>
        <div style={{ transformStyle: "preserve-3d", transform: `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)` }}>{slab}</div>
        <div style={{ position: "absolute", left: 0, top: sh + 18 * u, width: sw, height: sh * 0.4, overflow: "hidden", opacity: 0.22,
          transform: `perspective(${2400 * u}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scaleY(-1)`, transformOrigin: "50% 0%",
          maskImage: "linear-gradient(0deg, black, transparent 70%)", WebkitMaskImage: "linear-gradient(0deg, black, transparent 70%)" }}>
          <ShotImg shot={shot} width={sw} radius={18 * u} style={{ position: "absolute", bottom: 0 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ ProductStack
/** Real captures flying apart in depth (his "Z Depth"), tilted, then the front one comes forward. */
export const ProductStack: React.FC<{ shots?: Shot[]; headline?: string }> = ({
  shots = [DELOITTE, ROLES, TODO], headline = "Built from the roles you save.",
}) => {
  useBrandFonts(B);
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height, portrait, u } = usePortrait();
  const open = spring({ frame: f - 4, fps, config: { damping: 18, stiffness: 60 } });
  const forward = k(f, 60, 84, smooth);
  const cy = portrait ? height * 0.57 : height * 0.56;
  const base = portrait ? 0.86 * width : 0.56 * width;
  return (
    <AbsoluteFill>
      <GradientBg variant="aurora" colors={[C.red, C.wine, C.rose, C.oxblood]} />
      <div style={{ position: "absolute", left: 60 * u, right: 60 * u, top: portrait ? height * 0.12 : height * 0.07, textAlign: "center",
        font: `700 ${(portrait ? 104 : 84) * u}px ${ZODIAK}`, lineHeight: 1.05, color: C.cream, letterSpacing: "-0.03em", opacity: k(f, 8, 20) }}>{headline}</div>
      <div style={{ position: "absolute", left: width / 2, top: cy, perspective: 2000 * u }}>
        <div style={{ transformStyle: "preserve-3d", transform: `rotateX(${mix(24, 14, forward).toFixed(2)}deg) rotateY(${mix(-24, -8, forward).toFixed(2)}deg)` }}>
          {shots.map((s, i) => {
            const w = base * (i === 0 ? 1 : 0.8);
            const h = w * shotRatio(s);
            const z = mix(0, (i === 0 ? -1 : i) * 170 * u, open) + (i === 1 ? forward * 260 * u : 0);
            const x = mix(0, (i - 1) * (portrait ? 40 : 160) * u, open);
            const y = mix(0, (i - 1) * (portrait ? 230 : 110) * u, open);
            return (
              <div key={i} style={{ position: "absolute", left: -w / 2 + x, top: -h / 2 + y, transform: `translateZ(${z.toFixed(1)}px)`,
                boxShadow: `0 ${30 * u}px ${70 * u}px rgba(0,0,0,0.45)`, borderRadius: 16 * u }}>
                <ShotImg shot={s} width={w} radius={16 * u} />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------ the pack and its reel
export type PackScene = { id: string; name: string; frames: number; node: React.ReactNode };
export const PACK: PackScene[] = [
  { id: "CtaPill", name: "Intro, outro and CTA 1, glass pill", frames: 90, node: <CtaPill /> },
  { id: "CtaHeadline", name: "Intro, outro and CTA 2, headline and logo", frames: 84, node: <CtaHeadline /> },
  { id: "CtaButton", name: "Intro, outro and CTA 3, button press", frames: 84, node: <CtaButton /> },
  { id: "CtaLogo", name: "Intro, outro and CTA 4, end card", frames: 72, node: <CtaLogo /> },
  { id: "GradientAurora", name: "Gradient background, aurora", frames: 60, node: <GradientBg variant="aurora" /> },
  { id: "GradientMesh", name: "Gradient background, mesh", frames: 60, node: <GradientBg variant="mesh" /> },
  { id: "GradientSweep", name: "Gradient background, sweep", frames: 60, node: <GradientBg variant="sweep" /> },
  { id: "ProductSlab", name: "3D product, slab", frames: 96, node: <ProductSlab /> },
  { id: "ProductStack", name: "3D product, depth stack", frames: 96, node: <ProductStack /> },
];
export const PACK_FRAMES = PACK.reduce((a, s) => a + s.frames, 0);

/** Every scene back to back, each named in plain type in a corner. */
export const SaasPackReel: React.FC = () => {
  const { u, portrait } = usePortrait();
  let t = 0;
  return (
    <AbsoluteFill style={{ background: C.deep }}>
      {PACK.map((s, i) => {
        const from = t;
        t += s.frames;
        return (
          <Sequence key={s.id} from={from} durationInFrames={s.frames}>
            <AbsoluteFill>{s.node}</AbsoluteFill>
            <div style={{ position: "absolute", left: 40 * u, [portrait ? "top" : "bottom"]: (portrait ? 70 : 36) * u, padding: `${10 * u}px ${18 * u}px`,
              borderRadius: 12 * u, background: "rgba(11,7,8,0.72)", font: `600 ${30 * u}px ${INTER}`, color: C.cream, letterSpacing: "-0.01em" } as React.CSSProperties}>
              {i + 1}. {s.name}
            </div>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export { IN };
