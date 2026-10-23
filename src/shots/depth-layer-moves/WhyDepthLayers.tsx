// CampusAI adaptation (2026-10-21), from the shot shelf (Content/video-studio/shots/, video-shotcraft, Apache-2.0):
// demos/camera/depth-layer-moves/MultiplaneReal.tsx + cards/camera/depth-layer-moves.md.
//
// Kept from the shot: one drive multiplied per layer on three speed tiers (far 0.35x, mid 0.7x, near 1.4x), the
// asymmetric rail curve bezier(0.45, 0, 0.18, 1), the 4px smooth drift while the rail is parked so the frame stays
// alive, the far layer's depth anchors (recede a notch, desaturate to 0.7, a same-colour air haze denser at the top),
// the mid layer's two-layer soft shadow at elevation 6 and no blur on anything being read, the near layer's
// velocity-driven directional blur (SpeedBlur amount 0.2, max 10), and the hero float as the rail settles
// (EASE.out lift, elevation 6 -> 26, -14px, 1.035x, finishing ~8f of the original after the rail; the outline fades
// in on EASE.snappy a beat after the lift starts). Original constants are retimed by dur / 165.
// Changed: the far layer is the real page frame (clipped to VIEW, dimmed by the haze as the pieces separate) instead
// of a blurred full-page texture, because a per-frame full-screen blur is the card's known render cost; the mid
// layer is crops of that same frame that peel off in place (their home on the page darkens into a socket so the
// parallax never doubles text); the near layer is the hero panel, which after peeling rises toward camera to a
// presented size (about 1000px wide, centred on VIEW) and holds readable. The one-way 130f rail became an out and
// back pair on the same curve, so every layer lands exactly home by the last frame (identity, the film cuts back to
// its live screen). The terracotta ring and the "In focus" badge are dropped (sample UI); the hero gets a white .16
// hairline instead. Shadow strength is raised because the page is near-black, where the sand look's values vanish.
import React from 'react';
import { Img } from 'remotion';
import { EASE, SpeedBlur, bezier, mix, ramp, softShadow, velocity } from '../_fixtures/Polish';

type Box = { x: number; y: number; w: number; h: number };

const SCREEN_W = 1440;
const SCREEN_H = 900;
const DRIVE_EASE = bezier(0.45, 0, 0.18, 1); // the shot's rail curve: soft start, even middle, very soft landing
const K_FAR = 0.35;
const K_MID = 0.7;
const K_NEAR = 1.4;
const HOLD_DRIFT = 4; // px, the parked rail keeps creeping
const FAR_RECEDE = 0.97; // far layer drops back a notch
const MID_E = 6; // mid layer elevation (shot: constant 6)
const LIFT_E0 = 6; // hero elevation before / after the lift (shot: 6 -> 26)
const LIFT_E1 = 26;
const LIFT_Y = -14; // shot: hero translateY -14 * lift
const LIFT_S = 0.035; // shot: hero scale 1 + 0.035 * lift
const SHADOW = { color: '#000000', strength: 2.4 }; // near-black page needs more shadow than the sand desk
const PANEL = '#21171f';
const BG = '11,7,8'; // #0b0708

const crop = (src: string, box: Box, w: number) => {
  const q = w / box.w; // canvas px per screen px right now
  return (
    <Img src={src} style={{
      position: 'absolute', left: -box.x * q, top: -box.y * q, width: SCREEN_W * q, height: SCREEN_H * q, maxWidth: 'none',
    }} />
  );
};

export const WhyDepthLayers: React.FC<{
  f: number;
  dur: number;
  src: string;
  page: { x: number; y: number; s: number };
  layers: Box[];
  hero: Box;
  view: Box;
}> = ({ f, dur, src, page, layers, hero, view }) => {
  const r = dur / 165; // original shot length
  const T = (n: number) => Math.round((n * dur) / 103); // structure laid out at dur 103, scales with dur
  // ── timeline (frames at dur 103 in brackets) ──
  const SEP_IN = T(2); // [2] pieces peel off in place
  const SEP_LEN = Math.round(22 * r); // [14] shot's lift length
  const RAIL_IN = Math.round(6 * r); // [4] shot: rail starts at 6
  const RAIL_LEN = T(34); // [34] out half of the shot's 130f rail
  const RAIL_PARK = RAIL_IN + RAIL_LEN; // [38]
  const RISE_IN = SEP_IN + SEP_LEN; // [16] hero starts toward camera once the pieces are off the page
  const RISE_LEN = T(26); // [42] presented
  const LIFT_LEN = Math.round(22 * r); // [14] shot: lift 22f on EASE.out
  const LIFT_IN = RAIL_PARK + Math.round(8 * r) - LIFT_LEN; // [29] shot: lift lands ~8f after the rail
  const RING_IN = LIFT_IN + Math.round(6 * r); // [33] shot: ring 6f after lift
  const RING_LEN = Math.round(16 * r); // [10]
  const BACK_RAIL_IN = dur - T(27); // [76] rail drives home on the same curve
  const BACK_RAIL_LEN = T(24); // [100]
  const LIFT_DOWN_IN = dur - T(25); // [78]
  const LIFT_DOWN_LEN = T(14); // [92]
  const BACK_HERO_IN = dur - T(23); // [80] hero travels home
  const BACK_HERO_LEN = T(19); // [99]
  const SEP_BACK_IN = dur - T(15); // [88] pieces land back into the page
  const SEP_BACK_LEN = dur - 2 - SEP_BACK_IN; // [101] identity from dur-2 on

  // drive amplitude: about a tenth of the window, capped so the peeled pieces (mid rail) never leave the canvas;
  // the rail runs toward whichever side has more room (the shot slides left)
  const s0 = page.s;
  const roomL = Math.min(...layers.map((b) => page.x + b.x * s0)) - 8;
  const roomR = 1080 - 8 - Math.max(...layers.map((b) => page.x + (b.x + b.w) * s0));
  const DIR = roomR > roomL ? -1 : 1;
  const D = DIR * Math.max(0, Math.min(0.1 * view.w, Math.max(roomL, roomR) / K_MID));
  const driveAt = (x: number) =>
    (D * ramp(x, RAIL_IN, RAIL_LEN, DRIVE_EASE) + HOLD_DRIFT * ramp(x, RAIL_PARK, BACK_RAIL_IN - RAIL_PARK, EASE.smooth)) *
    (1 - ramp(x, BACK_RAIL_IN, BACK_RAIL_LEN, DRIVE_EASE));
  const sepAt = (x: number) => ramp(x, SEP_IN, SEP_LEN, EASE.out) * (1 - ramp(x, SEP_BACK_IN, SEP_BACK_LEN, EASE.swift));
  const riseAt = (x: number) => ramp(x, RISE_IN, RISE_LEN, EASE.swift) * (1 - ramp(x, BACK_HERO_IN, BACK_HERO_LEN, EASE.swift));
  const liftAt = (x: number) => ramp(x, LIFT_IN, LIFT_LEN, EASE.out) * (1 - ramp(x, LIFT_DOWN_IN, LIFT_DOWN_LEN, EASE.smooth));

  const drive = driveAt(f);
  const sep = sepAt(f);
  const lift = liftAt(f);
  const ring = ramp(f, RING_IN, RING_LEN, EASE.snappy) * (1 - ramp(f, LIFT_DOWN_IN, LIFT_DOWN_LEN, EASE.smooth));
  const s = page.s;

  // hero: home on the near rail -> presented toward camera
  const homeW = hero.w * s;
  const homeH = hero.h * s;
  const presW = Math.min(1000, hero.w * 3.2, (view.h * 0.8 * hero.w) / hero.h, 1080 - 80);
  const heroAt = (x: number) => {
    const p = riseAt(x);
    const w = mix(homeW, presW, p);
    const cx = mix(page.x + hero.x * s + homeW / 2 - driveAt(x) * K_NEAR, 540, p);
    const cy = mix(page.y + hero.y * s + homeH / 2, view.y + view.h * 0.45, p);
    return { p, w, h: (w * hero.h) / hero.w, cx, cy };
  };
  const H = heroAt(f);
  const vx = -K_NEAR * velocity(driveAt, f) * (1 - H.p); // the shot blurs the near layer by its rail speed only
  const heroE = mix(LIFT_E0 * sep, LIFT_E1, lift) * (1 + H.p);
  const shadowOn = Math.max(sep, H.p);

  return (
    <>
      {/* far 0.35x: the real page, clipped to the screen window; recedes, desaturates and hazes as the pieces leave */}
      <div style={{ position: 'absolute', left: view.x, top: view.y, width: view.w, height: view.h, borderRadius: 34, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: page.x - view.x, top: page.y - view.y, width: SCREEN_W * s, height: SCREEN_H * s,
          transformOrigin: `${(view.x + view.w / 2 - page.x).toFixed(1)}px ${(view.y + view.h / 2 - page.y).toFixed(1)}px`,
          transform: `translateX(${(-drive * K_FAR).toFixed(2)}px) scale(${mix(1, FAR_RECEDE, sep).toFixed(4)})`,
        }}>
          <Img src={src} style={{
            position: 'absolute', left: 0, top: 0, width: SCREEN_W * s, height: SCREEN_H * s, maxWidth: 'none',
            filter: sep > 0.001 ? `saturate(${mix(1, 0.7, sep).toFixed(3)})` : undefined,
          }} />
          {/* sockets: where each piece came from, so the slower page never shows a second copy of its text */}
          {[...layers, hero].map((b, i) => (
            <div key={i} style={{
              position: 'absolute', left: b.x * s, top: b.y * s, width: b.w * s, height: b.h * s, borderRadius: i === layers.length ? 16 : 12,
              background: `rgba(${BG},${(0.9 * sep).toFixed(3)})`,
              boxShadow: `inset 0 ${(10 * sep).toFixed(1)}px ${(24 * sep).toFixed(1)}px rgba(0,0,0,${(0.5 * sep).toFixed(3)})`,
              display: sep > 0.001 ? undefined : 'none',
            }} />
          ))}
        </div>
        {/* air haze over the far layer, denser at the top (the shot's atmospheric perspective) */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, rgba(${BG},${(0.66 * sep).toFixed(3)}) 0%, rgba(${BG},${(0.54 * sep).toFixed(3)}) 50%, rgba(${BG},${(0.48 * sep).toFixed(3)}) 100%)`,
        }} />
      </div>

      {/* mid 0.7x: the page's own pieces, sharp (they are read), peeled off in place with a two-layer soft shadow */}
      {layers.map((b, i) => (
        <div key={i} style={{
          position: 'absolute', left: page.x + b.x * s, top: page.y + b.y * s, width: b.w * s, height: b.h * s,
          borderRadius: 12, overflow: 'hidden', background: PANEL,
          transform: `translate(${(-drive * K_MID).toFixed(2)}px, ${(-6 * sep).toFixed(2)}px) scale(${(1 + 0.012 * sep).toFixed(4)})`,
          boxShadow: sep > 0.001
            ? `inset 0 0 0 1px rgba(255,255,255,${(0.1 * sep).toFixed(3)}), ${softShadow(MID_E * sep, { ...SHADOW, strength: SHADOW.strength * sep })}`
            : undefined,
        }}>
          {crop(src, b, b.w * s)}
        </div>
      ))}

      {/* near 1.4x: the hero, rides the fast rail, then floats up toward camera and holds readable */}
      <SpeedBlur vx={vx} amount={0.2} max={10}>
        <div style={{
          position: 'absolute', left: H.cx - H.w / 2, top: H.cy - H.h / 2, width: H.w, height: H.h,
          borderRadius: 16, overflow: 'hidden', background: PANEL,
          transform: `translateY(${(LIFT_Y * lift).toFixed(2)}px) scale(${(1 + LIFT_S * lift).toFixed(4)})`,
          boxShadow: shadowOn > 0.001 ? softShadow(heroE, { ...SHADOW, strength: SHADOW.strength * Math.min(1, shadowOn) }) : undefined,
        }}>
          {crop(src, hero, H.w)}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 16,
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,${(0.16 * Math.max(0.6 * sep, ring)).toFixed(3)})`,
          }} />
        </div>
      </SpeedBlur>
    </>
  );
};
