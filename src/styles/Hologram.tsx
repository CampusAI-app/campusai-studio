/**
 * /hologram (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). A projector disc on the floor throws a cone of light, and in it a figure builds up out of scan lines:
 * a big true number and its label, or a real capture, floating and turning slightly, with drifting scan lines,
 * a faint second image offset by a few pixels, and a stutter now and then. Projected in the brand's warm ink with
 * red light, never a sci-fi cyan. A capture shown this way is still the real capture, only lit.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR, readHold } from "../system/motion";
import { B, Clip, Cue, INTER, RED, Title, ZODIAK, clamp, ramp } from "./common";

export type HologramProps = {
  title: string;
  /** What is projected: a figure and its label, or a real capture (path under public/, with its pixel width and height). */
  figure?: { value: string; label: string };
  image?: { src: string; w: number; h: number };
  caption: string;
  source: string;
  cta?: string;
};

const FPS = 30;
const BUILD_AT = 8;
const BUILD = 36; // motion: frames for the projection to scan in, bottom to top

export const hologramEnd = (p: HologramProps) => BUILD_AT + BUILD + 20 + Math.round((readHold(`${p.figure?.value ?? ""} ${p.figure?.label ?? ""} ${p.caption}`) + 0.6) * FPS);

export const Hologram: React.FC<HologramProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const end = hologramEnd(p);
  const disc = { x: width / 2, y: height * 0.67, rx: width * 0.3, ry: 46 };
  const discOn = ramp(f, 2, 14, CURVE.quiet.enter);
  const build = ramp(f, BUILD_AT, BUILD_AT + BUILD, CURVE.quiet.standard);
  const stutter = [37, 38, 91, 140, 141].includes(f % 160) ? 0.35 : 1; // a stutter now and then, like a real projection
  const turn = Math.sin(f / 40) * 12; // slow turn, degrees
  const float = Math.sin(f / 26) * 10;
  const capAt = BUILD_AT + BUILD + 8;
  const cap = ramp(f, capAt, capAt + DUR.arrive, CURVE.quiet.enter);
  const content = (ghost: boolean) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
      transform: ghost ? "translate(7px, -3px)" : undefined, opacity: ghost ? 0.28 : 1, mixBlendMode: ghost ? "screen" : undefined }}>
      {p.image ? (
        <Img src={staticFile(p.image.src)} style={{ width: width * 0.8, height: "auto", filter: "grayscale(1) contrast(1.2) brightness(1.3) sepia(.35)", mixBlendMode: "screen" }} />
      ) : p.figure ? (
        <>
          <div style={{ fontFamily: ZODIAK, fontWeight: 700, fontSize: 420, lineHeight: 0.9, letterSpacing: "-0.04em", color: B.color.ink,
            textShadow: `0 0 18px rgba(${B.color.glowRgb},.9), 0 0 60px rgba(${B.color.glowRgb},.6)` }}>{p.figure.value}</div>
          <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 46, color: B.color.ink, marginTop: 10, textShadow: `0 0 12px rgba(${B.color.glowRgb},.9)` }}>{p.figure.label}</div>
        </>
      ) : null}
    </div>
  );
  const projTop = height * 0.2, projBottom = disc.y - 90;
  return (
    <Clip endAt={end} cta={p.cta}>
      <Title out={end}>{p.title}</Title>
      {/* the cone of light */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: discOn }}>
        <defs>
          <linearGradient id="cone" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={RED} stopOpacity={0.42 * stutter} />
            <stop offset="1" stopColor={RED} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={`M${disc.x - disc.rx * 0.8},${disc.y} L${width * 0.06},${projTop} L${width * 0.94},${projTop} L${disc.x + disc.rx * 0.8},${disc.y} Z`} fill="url(#cone)" opacity={build} />
        <ellipse cx={disc.x} cy={disc.y + 16} rx={disc.rx} ry={disc.ry} fill={B.color.surface} stroke={B.color.ink} strokeOpacity={0.25} strokeWidth={3} />
        <ellipse cx={disc.x} cy={disc.y} rx={disc.rx * 0.82} ry={disc.ry * 0.7} fill={RED} opacity={0.75 * stutter} />
        <ellipse cx={disc.x} cy={disc.y} rx={disc.rx * 0.82} ry={disc.ry * 0.7} fill="none" stroke={B.color.ink} strokeOpacity={0.6} strokeWidth={3} />
      </svg>
      {/* the projection: scans in bottom to top, scan lines drifting through it */}
      <AbsoluteFill style={{ perspective: 1400 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: projTop, height: projBottom - projTop, transform: `translateY(${float.toFixed(1)}px) rotateY(${turn.toFixed(2)}deg)`,
          clipPath: `inset(${((1 - build) * 100).toFixed(1)}% 0 0 0)`, opacity: stutter * interpolate(build, [0, 0.2, 1], [0, 0.8, 0.94], clamp),
          WebkitMaskImage: `repeating-linear-gradient(0deg, #000 0 3px, rgba(0,0,0,.45) 3px 6px)`, maskImage: `repeating-linear-gradient(0deg, #000 0 3px, rgba(0,0,0,.45) 3px 6px)` }}>
          {content(true)}
          {content(false)}
          {/* the bright band scanning up */}
          <div style={{ position: "absolute", left: "16%", right: "16%", height: 26, top: `${(((f * 2.4) % 140) - 20).toFixed(1)}%`, background: `linear-gradient(transparent, rgba(247,239,230,.22), transparent)` }} />
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 64, right: 64, top: disc.y + 90, textAlign: "center", fontFamily: ZODIAK, fontWeight: 700, fontSize: 56, lineHeight: 1.1, color: B.color.ink,
        opacity: cap, transform: `translateY(${(1 - cap) * 14}px)` }}>{p.caption}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: disc.y + 240, textAlign: "center", fontFamily: INTER, fontSize: 28, color: B.color.inkSoft, opacity: ramp(f, capAt + 12, capAt + 24) }}>{p.source}</div>
      <Cue at={2} name="switch-tap" volume={0.4} />
      <Cue at={BUILD_AT} name="data-scan" volume={0.35} />
      <Cue at={capAt} name="chime-crystal" volume={0.3} />
    </Clip>
  );
};
