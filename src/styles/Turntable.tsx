/**
 * /turntable (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). A product shot on a turntable: a real capture mounted on a thin slab stands on a lit disc, spins one full
 * turn with weight (fast through the back, slowing into the front), the light sweeping across its face as it turns,
 * a soft reflection in the disc, then settles facing us and the camera eases in. The back of the slab is the brand
 * surface with the logo, so a turn never shows a mirrored screen. The capture is the real product, never rebuilt.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR, readHold } from "../system/motion";
import { B, Clip, Cue, INTER, RED, Title, ZODIAK, clamp, ramp } from "./common";

export type TurntableProps = {
  title: string;
  /** A real capture under public/, its pixel size, and the part of it to mount. */
  image: { src: string; w: number; h: number };
  crop: { x: number; y: number; w: number; h: number };
  caption: string;
  source: string;
  cta?: string;
};

const FPS = 30;
const SPIN_AT = 14;
const SPIN = 84; // motion: frames for the full turn, quick through the back and easing into the front

export const turntableEnd = (p: TurntableProps) => SPIN_AT + SPIN + 24 + Math.round((readHold(p.caption) + 0.6) * FPS);

export const Turntable: React.FC<TurntableProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const end = turntableEnd(p);
  const W = width * 0.8;
  const H = W * (p.crop.h / p.crop.w);
  const scale = W / p.crop.w;
  // start a quarter turn in so the first frame already shows the slab at an angle (the hook), then one full turn plus
  const angle = interpolate(f, [0, SPIN_AT, SPIN_AT + SPIN], [-70, -70, 360], { ...clamp, easing: CURVE.showy.standard });
  const settle = ramp(f, SPIN_AT + SPIN - 6, SPIN_AT + SPIN + DUR.reveal, CURVE.quiet.standard);
  const push = 1 + settle * 0.08;
  const front = Math.cos((angle * Math.PI) / 180) > 0;
  const sweep = ((angle % 360) + 360) % 360; // the light crosses the face as it turns
  const cy = height * 0.48;
  const disc = { y: cy + H / 2 + 26, rx: W * 0.62, ry: 70 };
  const cap = ramp(f, SPIN_AT + SPIN + 10, SPIN_AT + SPIN + 10 + DUR.arrive, CURVE.quiet.enter);
  const face: React.CSSProperties = { position: "absolute", inset: 0, borderRadius: 18, overflow: "hidden", backfaceVisibility: "hidden" };
  return (
    <Clip endAt={end} cta={p.cta}>
      <Title out={end}>{p.title}</Title>
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})`, transformOrigin: `50% ${cy}px` }}>
        {/* the disc and its light */}
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id="tt-disc" cx="50%" cy="40%" r="60%">
              <stop offset="0" stopColor={B.color.ink} stopOpacity={0.16} />
              <stop offset="1" stopColor={B.color.ink} stopOpacity={0.02} />
            </radialGradient>
          </defs>
          <ellipse cx={width / 2} cy={disc.y + 18} rx={disc.rx} ry={disc.ry} fill={B.color.bg} />
          <ellipse cx={width / 2} cy={disc.y} rx={disc.rx} ry={disc.ry} fill="url(#tt-disc)" stroke={B.color.ink} strokeOpacity={0.18} strokeWidth={2} />
          {/* the key light's pool on the platter, and the slab's contact shadow */}
          <ellipse cx={width / 2} cy={disc.y - 6} rx={disc.rx * 0.7} ry={disc.ry * 0.55} fill={B.color.ink} opacity={0.1} />
          <ellipse cx={width / 2} cy={disc.y - 18} rx={(W / 2) * Math.max(0.15, Math.abs(Math.cos((angle * Math.PI) / 180)))} ry={10} fill={B.color.bg} opacity={0.55} />
          {/* the disc's rim marks turn with it */}
          {[...Array(24)].map((_, i) => {
            const a = ((i * 15 + angle) * Math.PI) / 180;
            if (Math.sin(a) < 0) return null;
            return <circle key={i} cx={width / 2 + Math.cos(a) * disc.rx * 0.93} cy={disc.y + Math.sin(a) * disc.ry * 0.93} r={3} fill={i % 6 === 0 ? RED : B.color.ink} opacity={0.45} />;
          })}
        </svg>
        <div style={{ position: "absolute", left: (width - W) / 2, top: cy - H / 2, width: W, height: H, perspective: 2200 }}>
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${angle.toFixed(2)}deg)` }}>
            <div style={{ ...face, boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}>
              <Img src={staticFile(p.image.src)} style={{ position: "absolute", left: -p.crop.x * scale, top: -p.crop.y * scale, width: p.image.w * scale, height: p.image.h * scale }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(100deg, transparent ${sweep / 3.6 - 30}%, rgba(247,239,230,.16) ${sweep / 3.6 - 12}%, transparent ${sweep / 3.6 + 6}%)` }} />
            </div>
            <div style={{ ...face, transform: "rotateY(180deg)", background: B.color.surface, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "inset 0 0 0 2px rgba(247,239,230,.08)" }}>
              <Img src={staticFile(B.logo!.onDark)} style={{ width: W * 0.36, height: "auto", opacity: 0.85 }} />
            </div>
          </div>
        </div>
        {/* the reflection in the disc: the face, flipped and faint, only while it faces us */}
        <div style={{ position: "absolute", left: (width - W) / 2, top: cy + H / 2 + 8, width: W, height: H * 0.22, overflow: "hidden", opacity: front ? 0.12 : 0,
          transform: `perspective(2200px) rotateY(${angle.toFixed(2)}deg) scaleY(-1)`, transformOrigin: "50% 0%",
          WebkitMaskImage: "linear-gradient(transparent 0%, #000 100%)", maskImage: "linear-gradient(transparent 0%, #000 100%)" }}>
          <Img src={staticFile(p.image.src)} style={{ position: "absolute", left: -p.crop.x * scale, top: -(p.crop.y + p.crop.h) * scale + H * 0.22, width: p.image.w * scale, height: p.image.h * scale }} />
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.74, fontFamily: ZODIAK, fontWeight: 700, fontSize: 60, lineHeight: 1.1, color: B.color.ink,
        opacity: cap, transform: `translateY(${(1 - cap) * 14}px)` }}>{p.caption}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.74 + 170, fontFamily: INTER, fontSize: 34, color: B.color.ink, opacity: ramp(f, SPIN_AT + SPIN + 22, SPIN_AT + SPIN + 34) }}>{p.source}</div>
      <Cue at={SPIN_AT} name="swoosh-slow" volume={0.4} />
      <Cue at={SPIN_AT + SPIN - 8} name="bass-hit-short" volume={0.45} />
    </Clip>
  );
};
