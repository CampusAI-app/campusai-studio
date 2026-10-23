/**
 * SlowGlide (2026-10-22): several real page captures, each tilted in 3D and lit by the product's own
 * red glow, glide past one after another while the camera drifts. Each can carry one short Zodiak
 * line above it. Calm, no cuts: one continuous train.
 *
 * From Raylight's Limelight and Manicule (motion-raylight-templates.md), the "held layer under a
 * moving camera": the captures themselves do nothing. Numbers kept from those beat sheets:
 * - tilt about 30 to 34 degrees (Limelight 28 to 53, Manicule 30 to 40; 34 is their median pick),
 * - a LINEAR glide (they ban linear for entrances but use it for long drifts), here with short
 *   eased ends only so the first and last capture can rest,
 * - an ambient camera drift on top: a dolly to x1.05 over the whole piece (their rule: drift no
 *   more than ~1.06) and a slow 6 degree arc, both linear,
 * - vignette 0.45 and a soft depth of field on the captures away from the centre,
 * - about 2.5 s per capture (their scenes run 3.0 to 4.7 s each; ours overlap, so the eye still
 *   gets ~3 s on every line).
 * Each capture is laid out at its final size (no transform: scale on an image) and cropped by
 * `crop`, which is also how the Maryland mark stays out: crop right of the sidebar.
 */
import React from "react";
import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../../brand";
import { glow, useBrandFonts } from "../../brand";
import type { Rect, Size } from "../../camera";
import { ZODIAK } from "../../parts";

export type GlideSurface = {
  /** The page image (staticFile path). */
  src: string;
  /** The page size in CSS px (the image is laid out to this). */
  page: Size;
  /** The part of the page shown, in CSS px. */
  crop: Rect;
  /** One short line above it, from the capture. */
  line?: string;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/**
 * Train position 0..1 over `len` frames: constant speed with eased ends of `ramp` frames
 * (velocity rises and falls on a sine, so there is no corner). Integrated numerically.
 */
const glidePos = (t: number, len: number, ramp: number) => {
  if (t <= 0) return 0;
  if (t >= len) return 1;
  const v = (x: number) => Math.min(1, Math.sin((Math.PI / 2) * Math.min(1, x / ramp)), Math.sin((Math.PI / 2) * Math.min(1, (len - x) / ramp)));
  const steps = 240;
  let total = 0;
  let upto = 0;
  for (let i = 0; i < steps; i++) {
    const x = ((i + 0.5) / steps) * len;
    const d = v(x) * (len / steps);
    total += d;
    if (x < t) upto += d;
  }
  return upto / total;
};

export const SlowGlide: React.FC<{
  surfaces: GlideSurface[];
  brand: Brand;
  /** Frame the glide starts (the first capture is already centred and lit here). */
  at?: number;
  /** Frames from the first capture centred to the last capture centred. */
  travel: number;
  /** Eased ends of the glide, frames. */
  ramp?: number;
  /** Capture width on the canvas, px. */
  cardWidth?: number;
  /** Distance between captures along the train, px. */
  pitch?: number;
  /** The captures' tilt in degrees. */
  tilt?: { x: number; y: number; z: number };
  /** Dolly over the whole piece (Limelight's ambient drift, at most ~1.06). */
  drift?: number;
  lineSize?: number;
}> = ({ surfaces, brand, at = 0, travel, ramp = 30, cardWidth = 980, pitch = 640, tilt = { x: 24, y: -20, z: 4 }, drift = 1.05, lineSize = 56 }) => {
  useBrandFonts(brand);
  const f = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const n = surfaces.length;
  const p = glidePos(f - at, travel, ramp);
  const offset = p * (n - 1) * pitch;
  // the camera's own drift, linear over the whole composition
  const life = interpolate(f, [0, durationInFrames], [0, 1], clamp);
  const dolly = 1 + (drift - 1) * life;
  const arc = interpolate(life, [0, 1], [3, -3]);
  const perspective = 1800;
  const pushZ = perspective * (1 - 1 / dolly);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", perspective, perspectiveOrigin: `${width / 2}px ${height * 0.5}px` }}>
      {/* the product's own light behind the train */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 42% at 50% 52%, ${glow(brand, 0.16)}, transparent 70%)` }} />
      <div style={{ position: "absolute", left: width / 2, top: height / 2, transformStyle: "preserve-3d",
        transform: `translateZ(${pushZ.toFixed(2)}px) rotateY(${arc.toFixed(3)}deg)` }}>
        {surfaces.map((s, i) => {
          const d = (i * pitch - offset) / pitch; // capture distance from centre, in captures
          if (Math.abs(d) > 2.2) return null;
          const ad = Math.abs(d);
          const lit = 1 - smooth((ad - 0.12) / 0.9);
          const lineOn = 1 - smooth((ad - 0.6) / 0.45);
          const k = cardWidth / s.crop.w;
          const ch = s.crop.h * k;
          // train runs bottom-left to top-right, the way the captures face
          const x = (i * pitch - offset) * -0.16;
          const y = (i * pitch - offset);
          return (
            <div key={i} style={{ position: "absolute", left: x - cardWidth / 2, top: y - ch / 2, width: cardWidth, height: ch, transformStyle: "preserve-3d",
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateZ(${tilt.z}deg)` }}>
              {s.line ? (
                <div style={{ position: "absolute", left: 6, bottom: ch + lineSize * 0.42, whiteSpace: "nowrap", fontFamily: ZODIAK.family, fontWeight: ZODIAK.weight,
                  fontSize: lineSize, lineHeight: 1.1, letterSpacing: ZODIAK.track, color: brand.color.ink, opacity: lineOn,
                  filter: lineOn < 0.99 ? `blur(${((1 - lineOn) * 10).toFixed(2)}px)` : undefined }}>{s.line}</div>
              ) : null}
              <div style={{ position: "absolute", inset: 0, borderRadius: 24, overflow: "hidden", background: brand.color.bg,
                boxShadow: `0 0 0 1.5px rgba(255,255,255,${(0.05 + 0.05 * lit).toFixed(3)}), 0 50px 110px rgba(0,0,0,.6), 0 0 ${(150 * lit).toFixed(0)}px ${glow(brand, 0.3 * lit)}`,
                filter: lit < 0.995 ? `brightness(${(0.42 + 0.58 * lit).toFixed(3)}) saturate(${(0.7 + 0.3 * lit).toFixed(3)}) blur(${((1 - lit) * 2.4).toFixed(2)}px)` : undefined }}>
                <Img src={s.src} style={{ position: "absolute", left: -s.crop.x * k, top: -s.crop.y * k, width: s.page.w * k, height: s.page.h * k, maxWidth: "none" }} />
              </div>
            </div>
          );
        })}
      </div>
      {/* vignette 0.45, Limelight's uniform value */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 72% at 50% 50%, transparent 55%, rgba(0,0,0,.45) 100%)" }} />
    </div>
  );
};
