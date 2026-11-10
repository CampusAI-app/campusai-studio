/**
 * Shared bits for the four effects from @mrcreates.ai's "17 effects" reel (2026-11-10): a crop of a real capture, the
 * logo on any ground, and the sound. Kept small on purpose: each effect owns its own look.
 */
import React from "react";
import { Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { brand } from "../brand";

export const B = brand("campusai");
export const FPS = 30;
export const clampX = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** 0 to 1 between frames a and b. */
export const k = (f: number, a: number, b: number, easing: (t: number) => number = OUT) =>
  interpolate(f, [a, b], [0, 1], { ...clampX, easing });
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
// motion: the reel's entrances land hard and settle (strong ease-out); its exits speed up (ease-in).
export const OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const IN = Easing.bezier(0.55, 0, 0.85, 0.35);
export const SWING = Easing.bezier(0.65, 0, 0.35, 1);

/** Reading time from the studio rule: letters / 15 + 1.5 s, never under 1.8 s. In frames. */
export const readFrames = (text: string) => Math.round(Math.max(1.8, text.replace(/\s/g, "").length / 15 + 1.5) * FPS);

/** A rectangle of a real capture, in the image's own pixels. */
export type Crop = { x: number; y: number; w: number; h: number };
/** A real capture: a path under public/, its pixel size, and the part of it to show. Never a drawn screen. */
export type Capture = { src: string; image: { w: number; h: number }; crop: Crop };

/** A crop of a real capture drawn `width` px wide. `zoom` and `focus` (0 to 1 inside the crop) push in on one spot. */
export const Shot: React.FC<{
  shot: Capture;
  width: number;
  radius?: number;
  zoom?: number;
  focus?: { x: number; y: number };
  style?: React.CSSProperties;
}> = ({ shot, width, radius = 0, zoom = 1, focus = { x: 0.5, y: 0.5 }, style }) => {
  const s = (width / shot.crop.w) * zoom;
  const h = (shot.crop.h / shot.crop.w) * width;
  // keep the focus point still in the frame as the zoom grows
  const fx = shot.crop.x + focus.x * shot.crop.w;
  const fy = shot.crop.y + focus.y * shot.crop.h;
  const left = focus.x * width - fx * s;
  const top = focus.y * h - fy * s;
  return (
    <div style={{ position: "relative", width, height: h, overflow: "hidden", borderRadius: radius, ...style }}>
      <Img src={staticFile(shot.src)} style={{ position: "absolute", left, top, width: shot.image.w * s, height: shot.image.h * s, maxWidth: "none" }} />
    </div>
  );
};
export const shotHeight = (shot: Capture, width: number) => (shot.crop.h / shot.crop.w) * width;

/** The CampusAI logo, centred on (x, y), arriving out of a blur. `light` picks the file that reads on a light ground. */
export const Logo: React.FC<{ at: number; x: number; y: number; width: number; light?: boolean; out?: number; spring?: boolean }> = ({
  at, x, y, width, light, out, spring: springy,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at || !B.logo) return null;
  const a = springy ? spring({ frame: f - at, fps, config: { damping: 14, stiffness: 120 } }) : k(f, at, at + 8);
  const o = out === undefined ? 0 : k(f, out, out + 5, IN);
  // the held logo keeps breathing so the last frame is never a freeze
  const breathe = springy ? interpolate(f, [at + 12, at + 90], [1, 1.03], clampX) : 1;
  const h = width / B.logo.ratio;
  return (
    <div style={{ position: "absolute", left: x - width / 2, top: y - h / 2, width, height: h, opacity: Math.min(1, a) * (1 - o),
      transform: `scale(${((springy ? 0.82 + 0.18 * a : 1) * breathe).toFixed(4)})`, filter: `blur(${((1 - Math.min(1, a)) * 10 + o * 10).toFixed(2)}px)` }}>
      <Img src={staticFile(light ? B.logo.onLight : B.logo.onDark)} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
};

/** One licensed sound from the styles shelf (Mixkit, public/styles/sfx). */
export const Sfx: React.FC<{ at: number; name: string; volume?: number; on: boolean }> = ({ at, name, volume = 0.55, on }) =>
  on ? (
    <Sequence from={Math.max(0, Math.round(at))} layout="none">
      <Audio src={staticFile(`styles/sfx/${name}.mp3`)} volume={volume} />
    </Sequence>
  ) : null;

/** The shelf's music bed, faded in and out. */
export const Bed: React.FC<{ total: number; on: boolean; volume?: number }> = ({ total, on, volume = 0.38 }) =>
  on ? (
    <Audio src={staticFile("styles/sfx/bed.mp3")} volume={(f) => volume * interpolate(f, [0, 10, total - 20, total], [0, 1, 1, 0], clampX)} />
  ) : null;
