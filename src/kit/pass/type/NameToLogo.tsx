/**
 * NameToLogo (2026-10-22): the ending. A short line, or the last thing pressed, resolves into the
 * real CampusAI logo; one light sheen passes across it; then a hold that keeps breathing.
 *
 * From Raylight's limelight and manicule endings (motion-raylight-templates.md: both end on the
 * name with a custom ease-out arrival and ONE linear shimmer, 2067 ms and 1711 ms; the library's
 * shimmer median is 1453 ms). Built on the kit's `LogoEnd`, which is used as is, never redefined.
 * Dictionary: blur dissolve into the mark, then a specular sweep (light sweep, shimmer).
 *
 * Two variants:
 * - `shimmer`: the line arrives word by word out of a blur (the kit's `BlurLines`, Zodiak), holds
 *   for its reading time, blurs out while the logo focus-pulls in at the same centre.
 * - `fromElement`: a real element crop (the Apply button) lifts off where it sits, glides to the
 *   centre and shrinks to the logo's width over 26 frames (EASE_CAMERA), then hands over: it blurs
 *   and fades over 10 frames while the logo arrives on top of it, so its red becomes the logo's glow.
 *
 * The sheen: 62 frames (2.07 s, limelight's number), LINEAR, a single pass left to right at 105
 * degrees. The logo is white, so a highlight alone would not show: for the first 12 frames the logo
 * eases down to 70% while the band is still off its left edge, and the band leaves it at full white
 * behind it, with a soft bloom riding the band. After that the only motion is LogoEnd's own 1% drift.
 *
 * The sheen overlay copies LogoEnd's scale curve (spring damping 14, stiffness 90, plus the 1% drift
 * over 4 s) so it sits exactly on the mark. If LogoEnd's curve changes, change `logoScale` with it.
 */
import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { Rect, Size } from "../../camera";
import { LogoEnd } from "../../LogoMoment";
import { BlurLines, ZODIAK } from "../../parts";
import { EASE, EASE_CAMERA } from "../../../lib/anim";
import { clamp } from "./shared";

export type NameToLogoElement = {
  src: string;
  page: Size;
  /** The element on the page, CSS px. */
  rect: Rect;
  /** Where it sits on the canvas when it lifts. */
  from: Rect;
  /** Corner radius on the page, CSS px. */
  radius?: number;
  /** Frame it lifts and starts gliding. */
  liftAt: number;
};

export type NameToLogoProps = {
  brand: Brand;
  variant: "shimmer" | "fromElement";
  /** Logo centre and width, canvas px. */
  x: number;
  y: number;
  width: number;
  /** Frame the logo arrives. */
  logoAt: number;
  /** Frame the sheen starts (keep it 30+ frames after `logoAt`, once the logo is sharp). */
  sheenAt: number;
  sheenFrames?: number;
  /** shimmer: the line and when it starts. Keep `logoAt - lineAt` at least its reading time. */
  line?: { text: string; at: number; size: number };
  /** fromElement: the crop. Its glide ends 4 frames after `logoAt`. */
  element?: NameToLogoElement;
};

/** LogoEnd's own scale curve, so overlays line up with it. */
export const logoScale = (f: number, at: number, fps: number) => {
  const p = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 90 } });
  const drift = interpolate(f, [at + 20, at + 20 + fps * 4], [0, 0.01], clamp);
  return 0.86 + 0.14 * p + drift;
};

const Sheen: React.FC<{ brand: Brand; x: number; y: number; width: number; logoAt: number; at: number; frames: number }> = ({
  brand, x, y, width, logoAt, at, frames,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!brand.logo || f < at) return null;
  const h = width / brand.logo.ratio;
  const s = logoScale(f, logoAt, fps);
  // band centre travels from well off the left edge to well off the right, at constant speed
  const k = interpolate(f, [at, at + frames], [0, 1], clamp);
  const pos = -40 + 180 * k; // percent of the logo width
  const dim = 0.3 * interpolate(f, [at, at + 12], [0, 1], { ...clamp, easing: EASE });
  const deep = brand.color.bgDeep;
  const shade = (a: number) => `color-mix(in srgb, ${deep} ${Math.round(a * 100)}%, transparent)`;
  const mask = `url(${staticFile(brand.logo.onDark)})`;
  const masked: React.CSSProperties = { position: "absolute", inset: 0, WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" };
  const box: React.CSSProperties = { position: "absolute", left: x, top: y, width, height: h, transform: `translate(-50%, -50%) scale(${s.toFixed(4)})` };
  const bandOn = k > 0 && k < 1;
  return (
    <>
      {/* ahead of the band the logo rests a little dim; behind it, full white */}
      <div style={box}>
        <div style={{ ...masked, background: `linear-gradient(105deg, transparent ${pos - 6}%, ${shade(dim)} ${pos + 6}%, ${shade(dim)} 100%)` }} />
      </div>
      {/* the bloom riding the band, outside the letters too */}
      {bandOn && (
        <div style={{ ...box, filter: "blur(10px)", opacity: 0.9 * Math.sin(Math.PI * k) }}>
          <div style={{ ...masked, background: `linear-gradient(105deg, transparent ${pos - 7}%, rgba(255,255,255,.95) ${pos}%, transparent ${pos + 7}%)` }} />
        </div>
      )}
    </>
  );
};

const LiftedElement: React.FC<{ el: NameToLogoElement; x: number; y: number; width: number; logoAt: number; brand: Brand }> = ({
  el, x, y, width, logoAt, brand,
}) => {
  const f = useCurrentFrame();
  if (f < el.liftAt) return null;
  const glideEnd = logoAt + 4;
  const g = interpolate(f, [el.liftAt, glideEnd], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const aspect = el.rect.w / el.rect.h;
  const to = { w: width, h: width / aspect };
  const w = el.from.w + (to.w - el.from.w) * g;
  const h = el.from.h + (to.h - el.from.h) * g;
  const cx = el.from.x + el.from.w / 2 + (x - (el.from.x + el.from.w / 2)) * g;
  const cy = el.from.y + el.from.h / 2 + (y - (el.from.y + el.from.h / 2)) * g;
  const out = interpolate(f, [logoAt - 2, logoAt + 8], [0, 1], { ...clamp, easing: EASE });
  if (out >= 1) return null;
  const s = w / el.rect.w;
  const lift = interpolate(f, [el.liftAt, el.liftAt + 10], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, overflow: "hidden", borderRadius: (el.radius ?? 6) * s,
      opacity: 1 - out, filter: out > 0 ? `blur(${(out * 12).toFixed(2)}px)` : undefined,
      boxShadow: `0 ${18 * lift}px ${50 * lift}px rgba(0,0,0,${0.55 * lift}), 0 0 ${60 * lift}px ${glow(brand, 0.45 * lift)}` }}>
      <Img src={el.src} style={{ position: "absolute", left: -el.rect.x * s, top: -el.rect.y * s, width: el.page.w * s, height: el.page.h * s, maxWidth: "none" }} />
    </div>
  );
};

export const NameToLogo: React.FC<NameToLogoProps> = ({ brand, variant, x, y, width, logoAt, sheenAt, sheenFrames = 62, line, element }) => {
  const { width: W } = useVideoConfig();
  const ink = { ink: brand.color.ink, soft: brand.color.inkSoft, accent: brand.color.accent, surface: brand.color.surface, line: brand.color.inkSoft };
  return (
    <>
      {variant === "shimmer" && line && (
        // BlurLines puts 0.24em after every word, so the line is nudged right by that much to sit centred
        <div style={{ position: "absolute", left: 0, top: y, width: W, transform: "translateY(-50%)", paddingLeft: line.size * 0.24, boxSizing: "border-box" }}>
          <BlurLines lines={[{ text: line.text }]} at={line.at} size={line.size} ink={ink} face={ZODIAK} outAt={logoAt - 4} />
        </div>
      )}
      {variant === "fromElement" && element && <LiftedElement el={element} x={x} y={y} width={width} logoAt={logoAt} brand={brand} />}
      <LogoEnd brand={brand} at={logoAt} x={x} y={y} width={width} />
      <Sheen brand={brand} x={x} y={y} width={width} logoAt={logoAt} at={sheenAt} frames={sheenFrames} />
    </>
  );
};
