/**
 * Glow focus (2026-11-16, ported from the Nov 15 React Postprocessing trial, Jacob approved Nov 16). A real capture lies
 * tilted in 3D. The camera pushes in from below and to the side onto one region (`focus`, usually a card) while the rest
 * of the page dims, and chosen spots on it glow in turn under a real bloom pass, with film grain and a vignette over
 * everything. At `after.at` the page swaps to the after-capture (the same page after the press), so a button can glow,
 * be pressed, and its new state glow.
 *
 * How the glow is selective: bloom only catches pixels above a brightness threshold (0.9). The page is drawn at 0.5 to
 * 0.9 brightness, so nothing on it blooms. Each glowing spot is the same pixels of the same capture, cut out with its
 * own rounded corners and laid a hair above the page, pushed above the threshold by `peak`. Only that spot blooms.
 *
 * Built with @react-three/postprocessing (EffectComposer, Bloom, Noise, Vignette) inside Remotion's <ThreeCanvas>.
 * Its composer is made in an effect after mount, so the first frame each render tab draws would come out black; `Kick`
 * holds that frame until the composer exists and draws it again. Keep it.
 *
 * Coordinates are the capture's own pixels (a 1440 x 900 page at 2x is 2880 x 1800). Motion in numbers (30 fps, the
 * trial's): the push runs frames 0 to 100 on (0.45, 0, 0.2, 1) from 1.8x the end distance to a framing where `focus`
 * fills `fill` of the frame width, then drifts in a further 15% to the last frame. The page dims 0.9 to 0.5 over frames
 * 30 to 70. A glow rises over 16 frames to `peak`, and either falls over 16 frames ending at `to`, or settles to
 * `settle` over the next 24 frames and holds.
 *
 *   import { GlowFocus } from "../kit";
 *   <GlowFocus page={...} after={{ src: "sys/cal-3-added.jpg", at: 112 }} focus={card} glows={[...]} />
 * Sample: Effect-GlowFocus in src/kit/effects/samples.tsx (render from src/kit/effects/entry.ts).
 */
import React from "react";
import { AbsoluteFill, Easing, continueRender, delayRender, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { useCaptureTexture } from "./captureTexture";
import type { Capture, Crop } from "./shared";

export type GlowSpot = {
  /** The spot to light, in the capture's pixels. */
  box: Crop;
  /** Frame the glow starts rising. */
  from: number;
  /** Frame the glow is fully out again. Leave it off to keep it lit. */
  to?: number;
  /** How far above the page it is pushed; the bloom grows with it (the trial: 3.2 a chip, 1.1 a button, 3.4 a pressed button). */
  peak?: number;
  /** When there is no `to`, the level it settles to after the peak. */
  settle?: number;
  /** Rise length in frames (default 16). */
  rise?: number;
  /** Corner radius in capture pixels (default 14). */
  radius?: number;
};

export type GlowFocusProps = {
  /** The page: a real capture and the part of it that is the page plane (usually the whole image). */
  page: Capture;
  /** The same page after the press, same size, swapped in at frame `at`. */
  after?: { src: string; at: number };
  /** The region the camera pushes onto and that stays lit while the page dims. */
  focus: Crop;
  /** Corner radius of `focus`, in capture pixels (default 24, a CampusAI card at 2x). */
  focusRadius?: number;
  glows: GlowSpot[];
  /** Frames of the push in (default [0, 100]). */
  push?: [number, number];
  /** Share of the frame width `focus` fills at the end of the push (default 0.86). */
  fill?: number;
  /** Page brightness before and after the dim (default [0.9, 0.5]) and the frames it dims over (default [30, 70]). */
  dim?: [number, number];
  dimFrames?: [number, number];
  /** Bloom strength (3.2), grain opacity (0.32), vignette darkness (0.78). */
  bloom?: number;
  grain?: number;
  vignette?: number;
  ground?: string;
};

const EASE = Easing.bezier(0.45, 0, 0.2, 1);
const PW = 14.4; // the page plane is always 14.4 world units wide
const FOV = 32;
const clampE = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const glowAt = (f: number, g: GlowSpot) => {
  const rise = g.rise ?? 16;
  const peak = g.peak ?? 2;
  let v = peak * interpolate(f, [g.from, g.from + rise], [0, 1], { ...clampE, easing: EASE });
  if (g.to !== undefined) v *= 1 - interpolate(f, [g.to - 16, g.to], [0, 1], { ...clampE, easing: EASE });
  else if (g.settle !== undefined) v -= (peak - g.settle) * interpolate(f, [g.from + rise, g.from + rise + 24], [0, 1], clampE);
  return v;
};

type Geo = { s: number; PH: number; page: Capture };
const toWorld = (g: Geo, b: Crop) =>
  [(b.x - g.page.crop.x + b.w / 2) * g.s - PW / 2, g.PH / 2 - (b.y - g.page.crop.y + b.h / 2) * g.s] as const;

/** A piece of the page drawn on its own plane, `z` above it, at brightness `level`. */
const Piece: React.FC<{ src: string; geo: Geo; box: Crop; radius: number; z: number; level: number; visible?: boolean }> = ({ src, geo, box, radius, z, level, visible = true }) => {
  const tex = useCaptureTexture(src, box, radius);
  const [x, y] = toWorld(geo, box);
  return (
    <mesh position={[x, y, z]} visible={visible}>
      <planeGeometry args={[box.w * geo.s, box.h * geo.s]} />
      <meshBasicMaterial map={tex} color={new THREE.Color(level, level, level)} toneMapped={false} transparent />
    </mesh>
  );
};

const Scene: React.FC<GlowFocusProps> = (p) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const { camera } = useThree();
  const s = PW / p.page.crop.w;
  const geo: Geo = { s, PH: p.page.crop.h * s, page: p.page };
  const pressed = p.after !== undefined && frame >= p.after.at;
  const src = pressed ? p.after!.src : p.page.src;

  // camera: the end distance frames `focus` at `fill` of the width (or height, whichever binds)
  const fill = p.fill ?? 0.86;
  const halfH = Math.tan(((FOV / 2) * Math.PI) / 180);
  const halfW = halfH * (width / height);
  const fw = p.focus.w * s;
  const fh = p.focus.h * s;
  const end = Math.max(fw / fill / (2 * halfW), fh / fill / (2 * halfH));
  const r = end / 11.6; // the trial's offsets were set at an end distance of 11.6
  const [a, b] = p.push ?? [0, 100];
  const k = interpolate(frame, [a, b], [0, 1], { ...clampE, easing: EASE });
  const k2 = interpolate(frame, [b, durationInFrames - 2], [0, 1], { ...clampE, easing: EASE });
  const [cx, cy] = toWorld(geo, p.focus);
  const tx = interpolate(k, [0, 1], [cx * 0.3, cx]);
  const ty = interpolate(k, [0, 1], [cy * 0.3 - 0.95 * r, cy]);
  const dist = interpolate(k, [0, 1], [end * 1.81, end]) - k2 * end * 0.147;
  camera.position.set(tx - (2.2 * (1 - k) + 0.25 * k2) * r, ty - (3.4 * (1 - k) + 0.6) * r, dist);
  camera.lookAt(tx, ty, 0);
  camera.updateProjectionMatrix();

  const [d0, d1] = p.dim ?? [0.9, 0.5];
  const [df0, df1] = p.dimFrames ?? [30, 70];
  const dim = interpolate(frame, [df0, df1], [d0, d1], clampE);

  return (
    <>
      <Piece src={src} geo={geo} box={p.page.crop} radius={0} z={0} level={dim} />
      {/* the focus stays near full brightness while the page around it dims */}
      <Piece src={src} geo={geo} box={p.focus} radius={p.focusRadius ?? 24} z={0.001} level={0.86} />
      {p.glows.map((g, i) => {
        const gain = glowAt(frame, g);
        // a glow lights whichever capture is showing: its own frames decide (before the swap or after it)
        return <Piece key={i} src={src} geo={geo} box={g.box} radius={g.radius ?? 14} z={0.002} level={1 + Math.max(0, gain)} visible={gain > 0.001} />;
      })}
    </>
  );
};

// react-postprocessing builds its composer in an effect after mount, so the first frame a render tab draws would be
// blank. Hold the frame until the composer exists, then draw that frame again.
const Kick: React.FC = () => {
  const { advance } = useThree();
  React.useEffect(() => {
    const h = delayRender("postprocessing composer mount");
    const t = setTimeout(() => {
      advance(performance.now());
      continueRender(h);
    }, 120);
    return () => clearTimeout(t);
  }, [advance]);
  return null;
};

export const GlowFocus: React.FC<GlowFocusProps> = (p) => {
  const { width, height } = useVideoConfig();
  const ground = p.ground ?? "#0b0708";
  return (
    <AbsoluteFill style={{ background: ground }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: FOV, position: [0, 0, 20], near: 0.1, far: 100 }}
        gl={{ antialias: false, alpha: false, preserveDrawingBuffer: true }}>
        <color attach="background" args={[ground]} />
        <Scene {...p} />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.08} intensity={p.bloom ?? 3.2} radius={0.8} />
          <Noise blendFunction={BlendFunction.MULTIPLY} opacity={p.grain ?? 0.32} />
          <Vignette offset={0.28} darkness={p.vignette ?? 0.78} />
        </EffectComposer>
        <Kick />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
