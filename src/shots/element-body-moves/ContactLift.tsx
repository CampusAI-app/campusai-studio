// CampusAI adaptation (2026-10-21), from the shot shelf (Content/video-studio/shots/, video-shotcraft, Apache-2.0):
// demos/ui-entrance/element-body-moves/ContactShadowLift.tsx + cards/ui-entrance/element-body-moves.md.
//
// Kept from the shot: the "pick" lift (spring damping 16 / stiffness 120, lift = 1.15 * k, scale 1 + 0.05 * min(1.2, k)),
// the hover breathe (0.04 * sin over a 40f period, eased in over 20f), the landing (8f in-cubic drop, retimed, then a
// 2f 0.99 squash that springs back to 1 over 2f), and the two shadows that live ON THE SURFACE, never on the piece:
// contact core (alpha 0.32 -> 0.14, blur 3 -> 25, offset (2+18l, 4+36l), scale 0.99 + 0.05l) and ambient
// (alpha 0.09 -> 0.22, blur 14 -> 54, offset (10+40l, 16+60l), scale 1 + 0.06l). The piece itself has no box-shadow.
// Changed: one real piece of a run frame instead of three sample cards; after it lifts it travels to a presented spot
// in VIEW (its shadow travels under it on the surface), holds readable, then travels home and lands. The shot's
// 2.5D desk (rotateX) is dropped because the piece sits on the flat page, so LIFT_Z becomes the card's 2D rule:
// 28px up. Shadow alphas are doubled because the page is near-black, where the shot's porcelain values vanish.
import React from 'react';
import { Img } from 'remotion';
import { EASE, mix, ramp } from '../_fixtures/Polish';
import { springAt } from '../_fixtures/Look';

const LIFT_PX = 28; // 2D lift (card: never under 28px of visible travel)
const LIFT_S = 1.05;
const SHADOW_GAIN = 2; // dark page needs more shadow than the porcelain desk
const SCREEN_W = 1440;
const SCREEN_H = 900;
const PRESENT_CY = 1005 - 12; // VIEW centre, a touch high (the lift adds 28px more)

const outCubic = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const inCubic = (t: number) => Math.pow(Math.min(1, Math.max(0, t)), 3);

export const ContactLift: React.FC<{
  f: number;
  dur: number;
  src: string;
  box: { x: number; y: number; w: number; h: number };
  from: { x: number; y: number; s: number };
  maxScale?: number;
}> = ({ f, dur, src, box, from, maxScale }) => {
  const r = dur / 150; // original shot length
  // ── timeline (frames at dur 89 in brackets) ──
  const TRAVEL_IN = 8; // leave once the spring is ~90% up
  const TRAVEL_LEN = 18; // [8 -> 26]
  const LAND = dur - 3; // [86] touch-down frame
  const DROP = Math.max(4, Math.round(8 * r)); // [5] in-cubic drop (8f in the shot)
  const BACK_LEN = 9; // [dur-15 -> dur-6]
  const BACK_IN = dur - 15;

  // lift: spring up, breathe while held, in-cubic down
  const k = springAt(f, 0, { damping: 16, stiffness: 120 });
  const breathe = f > 16 ? 0.04 * Math.sin(((f - 16) / 40) * Math.PI * 2) * ramp(f, 16, 20, EASE.smooth) : 0;
  const down = inCubic((f - (LAND - DROP)) / DROP);
  const lift = (1.15 * k + breathe) * (1 - down);
  let s = 1 + (LIFT_S - 1) * Math.min(1.2, k) * (1 - down);
  if (f >= LAND) s = 0.99 + 0.01 * outCubic((f - LAND) / 2); // 2f squash, back to 1 at dur-1
  else if (f >= LAND - 1) s = 0.99;
  const l = Math.max(0, Math.min(1, lift)); // shadows read the clamped lift, as in the shot

  // ground rect: home -> presented -> home
  const p = ramp(f, TRAVEL_IN, TRAVEL_LEN, EASE.swift) * (1 - ramp(f, BACK_IN, BACK_LEN, EASE.swift));
  const homeW = box.w * from.s;
  const homeH = box.h * from.s;
  const presW = Math.min(1000, box.w * (maxScale ?? 3.2));
  const presH = (presW * box.h) / box.w;
  const w = mix(homeW, presW, p);
  const h = mix(homeH, presH, p);
  const cx = mix(from.x + homeW / 2, 540, p);
  const cy = mix(from.y + homeH / 2, PRESENT_CY, p);
  const x = cx - w / 2;
  const y = cy - h / 2;
  const q = w / box.w; // canvas px per screen px right now

  const rect: React.CSSProperties = { position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 16 };

  return (
    <>
      {/* ambient shadow, on the surface */}
      <div style={{
        ...rect,
        background: `rgba(0,0,0,${Math.min(1, SHADOW_GAIN * (0.09 + 0.13 * l)).toFixed(3)})`,
        filter: `blur(${(14 + 40 * l).toFixed(1)}px)`,
        transform: `translate(${(10 + 40 * l).toFixed(1)}px, ${(16 + 60 * l).toFixed(1)}px) scale(${(1 + 0.06 * l).toFixed(4)})`,
      }} />
      {/* contact core, on the surface: tight when down, larger, softer and fainter as it lifts */}
      <div style={{
        ...rect,
        background: `rgba(0,0,0,${Math.min(1, SHADOW_GAIN * (0.32 - 0.18 * l)).toFixed(3)})`,
        filter: `blur(${(3 + 22 * l).toFixed(1)}px)`,
        transform: `translate(${(2 + 18 * l).toFixed(1)}px, ${(4 + 36 * l).toFixed(1)}px) scale(${(0.99 + 0.05 * l).toFixed(4)})`,
      }} />
      {/* the piece: a crop of the real frame, lifted off the surface, no shadow of its own */}
      <div style={{
        ...rect, overflow: 'hidden', background: '#21171f',
        transform: `translateY(${(-LIFT_PX * lift).toFixed(2)}px) scale(${s.toFixed(4)})`,
      }}>
        <Img src={src} style={{
          position: 'absolute', left: -box.x * q, top: -box.y * q, width: SCREEN_W * q, height: SCREEN_H * q, maxWidth: 'none',
        }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, boxShadow: `inset 0 0 0 1px rgba(255,255,255,${(0.16 * l).toFixed(3)})` }} />
      </div>
    </>
  );
};
