/**
 * Glass type (2026-11-10, effect 17 of @mrcreates.ai's "17 effects" reel, stepped frame by frame). What the reel does:
 * a hard cut to a loud gradient ground (blue to violet to pink, a soft yellow sun top left), then about 0.13 s later a
 * frosted rounded panel holding one huge word fades and sharpens in (4 frames) BEHIND the subject, so the subject
 * covers the bottom of the letters. The letters are white outlines with a frosted fill; the panel blurs the sun through
 * it. It holds about 0.8 s and leaves with a 3 frame blur-out. Ours: the ground leans red (crimson to coral to pink),
 * the subject in front is a real capture, a sheen crosses the glass once, and the ending keeps the glass: the panel
 * shrinks to a tile that holds the logo.
 *
 * The frost is faked, never `backdrop-filter` (it may not render headless): the panel draws its own blurred copy of the
 * ground, clipped to its shape, under a white veil.
 *
 *   <GlassType word="Match" subject={{ shot, width: 860 }} caption="Every role tells you why it fits you." />
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Outfit";
import { Bed, Capture, IN, Logo, Sfx, Shot, clampX, k, mix, readFrames, shotHeight } from "./shared";

const { fontFamily: OUTFIT } = loadFont("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });

export type GlassTypeProps = {
  /** One short word, sentence case. */
  word: string;
  /** The real capture standing in front of the glass. */
  subject: { shot: Capture; width: number };
  caption?: string;
  /** Ground colours, top-left to bottom-right, and the sun. */
  ground?: { stops: [string, string, string, string]; sun: string };
  sound?: boolean;
};

const END = 46;
const GLASS_AT = 4; // the reel's glass arrives 4 frames after the cut

export const glassTimes = (p: GlassTypeProps) => {
  const endAt = Math.max(150, (p.caption ? readFrames(p.caption) : 0) + 30);
  return { endAt, total: endAt + END };
};

const DEFAULT_GROUND: NonNullable<GlassTypeProps["ground"]> = { stops: ["#9E0F1C", "#D9202E", "#F0566A", "#FFB3BC"], sun: "#FFC861" };

/** The ground, drawn twice: sharp behind everything, blurred inside the glass. */
const Ground: React.FC<{ g: NonNullable<GlassTypeProps["ground"]>; f: number; w: number; h: number }> = ({ g, f, w, h }) => {
  const sx = mix(0.2, 0.3, f / 240) * w;
  const sy = mix(0.24, 0.2, f / 240) * h;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(150deg, ${g.stops[0]} 0%, ${g.stops[1]} 38%, ${g.stops[2]} 72%, ${g.stops[3]} 100%)` }}>
      <div style={{ position: "absolute", left: sx - 230, top: sy - 230, width: 460, height: 460, borderRadius: "50%",
        background: `radial-gradient(circle, ${g.sun} 0%, ${g.sun}cc 35%, ${g.sun}00 70%)` }} />
      <div style={{ position: "absolute", right: -200, bottom: -260, width: 760, height: 760, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255, 214, 224, 0.7) 0%, rgba(255, 214, 224, 0) 68%)" }} />
    </AbsoluteFill>
  );
};

export const GlassType: React.FC<GlassTypeProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const g = p.ground ?? DEFAULT_GROUND;
  const sound = p.sound ?? true;
  const { endAt, total } = glassTimes(p);

  // the panel: full size in the scene, a logo tile in the ending
  const shrink = k(f, endAt + 2, endAt + 14);
  const pw = mix(width - 140, 620, shrink);
  const ph = mix(height * 0.34, 250, shrink);
  const px = (width - pw) / 2;
  const py = mix(height * 0.12, (height - 250) / 2 - 30, shrink);
  const inK = k(f, GLASS_AT, GLASS_AT + 4);
  const sceneOut = k(f, endAt, endAt + 3, IN); // the reel's 3 frame blur-out
  const wordO = inK * (1 - sceneOut);

  const fontSize = Math.min(330, (width - 260) / (p.word.length * 0.6));
  const sheen = interpolate(f, [26, 62], [-0.4, 1.4], clampX);
  const subjH = shotHeight(p.subject.shot, p.subject.width);
  const subjTop = height * 0.46 - 95 + (1 - k(f, 0, 10)) * 30;

  const clip = `inset(${py}px ${width - px - pw}px ${height - py - ph}px ${px}px round 46px)`;
  const textStyle: React.CSSProperties = {
    position: "absolute", left: 0, width, top: height * 0.12 + height * 0.34 * 0.56 - fontSize * 0.62, textAlign: "center",
    fontFamily: OUTFIT, fontWeight: 800, fontSize, letterSpacing: "-0.03em", lineHeight: 1.2,
  };

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: OUTFIT }}>
      <Bed total={total} on={sound} />
      <Sfx at={GLASS_AT} name="air-woosh-quick" volume={0.5} on={sound} />
      <Sfx at={endAt} name="transition-soft" volume={0.5} on={sound} />
      <Ground g={g} f={f} w={width} h={height} />

      {/* the glass panel: its own blurred copy of the ground, a white veil, a hairline edge */}
      <AbsoluteFill style={{ clipPath: clip, opacity: f < GLASS_AT ? 0 : Math.max(inK, shrink) }}>
        <AbsoluteFill style={{ filter: "blur(36px)", transform: "scale(1.08)" }}><Ground g={g} f={f} w={width} h={height} /></AbsoluteFill>
        <AbsoluteFill style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.32), rgba(255,255,255,0.12) 55%, rgba(255,255,255,0.2))" }} />
        <div style={{ position: "absolute", left: px + (sheen - 0.2) * pw, top: py - 100, width: pw * 0.18, height: ph + 200,
          background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.32), rgba(255,255,255,0))", transform: "skewX(-18deg)" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: px, top: py, width: pw, height: ph, borderRadius: 46, opacity: f < GLASS_AT ? 0 : Math.max(inK, shrink),
        border: "2px solid rgba(255,255,255,0.6)", boxShadow: "inset 0 2px 0 rgba(255,255,255,0.55), 0 30px 80px rgba(90, 0, 12, 0.28)",
        filter: `blur(${((1 - inK) * 14).toFixed(2)}px)` }} />

      {/* the word: frosted fill (a white gradient clipped to the letters), white outline, soft glow */}
      <div style={{ ...textStyle, opacity: wordO, filter: `blur(${((1 - inK) * 14 + sceneOut * 16).toFixed(2)}px)`,
        transform: `scale(${(1.04 - 0.04 * inK).toFixed(4)})` }}>
        <span style={{ color: "rgba(255,255,255,0.2)", WebkitTextStroke: "3px rgba(255,255,255,0.92)",
          textShadow: "0 0 34px rgba(255,255,255,0.45), 0 10px 40px rgba(120, 0, 20, 0.25)" }}>{p.word}</span>
      </div>
      <div style={{ ...textStyle, opacity: wordO * 0.85,
        background: "linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.18) 55%, rgba(255,255,255,0.4) 100%)",
        WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
        filter: `blur(${((1 - inK) * 14 + sceneOut * 16).toFixed(2)}px)`, transform: `scale(${(1.04 - 0.04 * inK).toFixed(4)})` }}>
        {p.word}
      </div>

      {/* the subject, in front of the glass */}
      <div style={{ position: "absolute", left: (width - p.subject.width) / 2, top: subjTop, opacity: k(f, 0, 6) * (1 - sceneOut),
        filter: `blur(${(sceneOut * 16).toFixed(2)}px) drop-shadow(0 34px 60px rgba(70, 0, 10, 0.45))` }}>
        <Shot shot={p.subject.shot} width={p.subject.width} radius={26} />
      </div>

      {p.caption ? (
        <div style={{ position: "absolute", left: 60, right: 60, top: subjTop + subjH + 44, textAlign: "center", color: "#FFFFFF",
          fontWeight: 500, fontSize: 46, letterSpacing: "-0.015em", lineHeight: 1.2, textShadow: "0 4px 24px rgba(90, 0, 12, 0.35)",
          opacity: k(f, 10, 20) * (1 - sceneOut), transform: `translateY(${((1 - k(f, 10, 20)) * 14).toFixed(2)}px)` }}>
          {p.caption}
        </div>
      ) : null}

      {/* the logo: small inside the first second, then held in the glass tile at the end */}
      <Logo at={8} x={140} y={86} width={190} out={endAt} />
      <Logo at={endAt + 10} x={width / 2} y={py + ph / 2} width={430} spring />
      {f >= endAt + 18 ? (
        <div style={{ position: "absolute", left: 0, width, top: py + ph + 34, textAlign: "center", color: "#FFFFFF", fontWeight: 500,
          fontSize: 40, opacity: k(f, endAt + 18, endAt + 28) }}>campusai.app</div>
      ) : null}
    </AbsoluteFill>
  );
};
