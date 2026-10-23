// CampusAI adaptation (2026-10-21), from the shot shelf (Content/video-studio/shots/, video-shotcraft, Apache-2.0):
// demos/ui-entrance/carousel-3d/Carousel3D.tsx + cards/ui-entrance/carousel-3d.md.
//
// Kept from the shot: the ring layout (rotateY(i*360/N) translateZ(RADIUS), cards never turn on X or Z), the
// double-sided face with backface-visibility hidden, the turn = 50% even base + 50% stepped (dock DWELL, then a
// smooth move) rhythm, the 44px push-out of the front card from hl = smooth(1 - |azimuth|/26), the air
// perspective darkening (1 - cos)/2 * 0.7, the fixed camera (perspective + rotateX(-9deg), front card at z=0),
// the floor disc, the 96-tick floor ring that turns with the ring, and the mirrored reflection ring (8% leaf
// opacity, mask fade from 62%).
// Changed: the ring now has an end. It turns STEPS x 45deg and brakes (the even base is a decelerating curve,
// the last step lands with zero speed) so the target card ends front and centre, then a red ring + glow lands
// on it and the rest dim. Faces are the real job card stills (wide 872x390). No caption, no wordmark, no Stage
// background (the film owns it). Colours are ours: white hairlines, brand red only on the target.
import React from 'react';
import { Img } from 'remotion';
import { EASE, ramp } from '../_fixtures/Polish';
import { alpha } from '../_fixtures/Look';

const N = 8;
const CW = 700; // front card width on the canvas (z=0 renders at native size)
const CH = Math.round((CW * 390) / 872); // 313
const RADIUS = 960; // wide cards: 8 x 45deg chords (0.765R) just clear the 700px card
const CX = 540;
const CY = 1005; // VIEW centre
const FLOOR = CH / 2 + 10;
const RED = '#E8293B';
const INK_BG = '#0b0708';

// Original: 168f, BEAT 21 (8 dock + 13 move). Scaled by dur/168.
const ORIGINAL_DUR = 168;
const STEPS = 6; // 6 x 45deg = 270deg of travel before the brake
const RING_IN = 16; // the red ring lands over the last ~15 frames

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const JobCarousel3D: React.FC<{ f: number; dur: number; cards: string[]; target: number }> = ({ f, dur, cards, target }) => {
  const k = dur / ORIGINAL_DUR;
  const BEAT = Math.max(6, Math.round(21 * k)); // 11 at dur 89
  const DWELL = Math.max(2, Math.round(8 * k)); // 4 at dur 89
  const T_END = STEPS * BEAT; // 66 at dur 89: the ring is parked from here
  const ringStart = dur - RING_IN;

  // Stepped layer: dock DWELL, then smooth move; clamps to STEPS once parked.
  const stepPart = (t: number) => {
    if (t >= T_END) return STEPS;
    const b = Math.floor(t / BEAT);
    const local = t - b * BEAT;
    return b + EASE.smooth(clamp01((local - DWELL) / (BEAT - DWELL)));
  };
  // Even layer, braking: 1 - (1 - u)^2 starts at twice the mean speed and arrives at zero speed.
  const evenPart = (t: number) => {
    const u = clamp01(t / T_END);
    return STEPS * (1 - (1 - u) * (1 - u));
  };
  // Start angle chosen so the target is dead front at the end.
  const spin0 = target * 45 - STEPS * 45;
  const spin = spin0 + 45 * (0.5 * evenPart(f) + 0.5 * stepPart(f));

  const azimuth = (i: number) => ((((i * 360) / N - spin) % 360) + 540) % 360 - 180;
  const depthOf = (i: number) => (1 - Math.cos((azimuth(i) * Math.PI) / 180)) / 2;
  const hlOf = (i: number) => EASE.smooth(clamp01(1 - Math.abs(azimuth(i)) / 26));

  // Final beat: red ring on the target, others dim.
  const sel = ramp(f, ringStart, 10, EASE.out);

  const renderCard = (i: number, reflect: boolean) => {
    const d = depthOf(i);
    const hl = reflect ? 0 : hlOf(i);
    const isT = i === target;
    const red = isT && !reflect ? sel : 0;
    const face: React.CSSProperties = {
      position: 'absolute', inset: 0, borderRadius: 20, overflow: 'hidden', boxSizing: 'border-box',
      backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
      background: '#21171f',
      ...(reflect
        ? {
            // opacity only on the leaf: on a preserve-3d parent it flattens the ring
            opacity: 0.08,
            WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,0.85) 100%)',
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,0.85) 100%)',
          }
        : {}),
    };
    const body = (
      <>
        <Img src={cards[i % cards.length]} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
        {/* hairline that brightens as a card docks front */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 20,
          boxShadow: `inset 0 0 0 1.5px ${alpha('#ffffff', 0.08 + 0.22 * hl)}`,
        }} />
        {/* air perspective: the further back, the darker */}
        <div style={{ position: 'absolute', inset: 0, background: INK_BG, opacity: +(0.7 * d + (isT ? 0 : 0.5 * sel) * (1 - 0.7 * d)).toFixed(3) }} />
      </>
    );
    return (
      <div key={`${reflect ? 'r' : 'c'}${i}`} style={{
        position: 'absolute', left: -CW / 2, top: -CH / 2, width: CW, height: CH, transformStyle: 'preserve-3d',
        transform: `rotateY(${(i * 360) / N}deg) translateZ(${(RADIUS + 44 * hlOf(i)).toFixed(2)}px)`,
      }}>
        <div style={face}>{body}</div>
        <div style={{ ...face, transform: 'rotateY(180deg)' }}>{body}</div>
        {red > 0.001 && (
          // the red ring sits just in front of the face so it renders over the card edge
          <div style={{
            position: 'absolute', left: -6, top: -6, right: -6, bottom: -6, borderRadius: 26,
            border: `6px solid ${RED}`, opacity: red,
            transform: `translateZ(1px) scale(${(1.04 - 0.04 * red).toFixed(4)})`,
            boxShadow: `0 0 ${(28 * red).toFixed(1)}px ${alpha(RED, 0.55)}, 0 0 ${(70 * red).toFixed(1)}px ${alpha(RED, 0.3)}, inset 0 0 ${(18 * red).toFixed(1)}px ${alpha(RED, 0.25)}`,
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          }} />
        )}
      </div>
    );
  };

  return (
    <>
      {/* soft floor light under the front slot (screen-fixed, like the shot's under-light) */}
      <div style={{
        position: 'absolute', left: CX - 520, top: CY + 90, width: 1040, height: 420, borderRadius: '50%',
        background: `radial-gradient(ellipse at 50% 40%, ${alpha(RED, 0.1 + 0.08 * sel)} 0%, ${alpha(RED, 0)} 65%)`,
      }} />

      <div style={{ position: 'absolute', inset: 0, perspective: '2600px', perspectiveOrigin: `${CX}px ${CY - 60}px` }}>
        <div style={{
          position: 'absolute', left: CX, top: CY, width: 0, height: 0, transformStyle: 'preserve-3d',
          transform: `translateZ(${-RADIUS}px) rotateX(-9deg)`,
        }}>
          {/* floor disc + tick ring */}
          <div style={{
            position: 'absolute', left: -RADIUS * 1.35, top: FLOOR - RADIUS * 1.35, width: RADIUS * 2.7, height: RADIUS * 2.7, borderRadius: '50%',
            transform: 'rotateX(90deg)',
            background: `radial-gradient(circle, ${alpha('#ffffff', 0.05)} 0%, ${alpha('#ffffff', 0.015)} 45%, transparent 66%)`,
          }} />
          <svg width={RADIUS * 2.4} height={RADIUS * 2.4} viewBox={`${-RADIUS * 1.2} ${-RADIUS * 1.2} ${RADIUS * 2.4} ${RADIUS * 2.4}`}
            style={{ position: 'absolute', left: -RADIUS * 1.2, top: FLOOR - RADIUS * 1.2, transform: `rotateX(90deg) rotateZ(${spin}deg)`, overflow: 'visible' }}>
            <circle r={RADIUS * 1.08} fill="none" stroke={alpha('#ffffff', 0.07)} strokeWidth={2} />
            {Array.from({ length: 96 }, (_, t) => {
              const a = (t / 96) * Math.PI * 2;
              const r0 = RADIUS * (t % 12 === 0 ? 1.02 : 1.05);
              return <line key={t} x1={r0 * Math.cos(a)} y1={r0 * Math.sin(a)} x2={RADIUS * 1.08 * Math.cos(a)} y2={RADIUS * 1.08 * Math.sin(a)}
                stroke={t % 12 === 0 ? alpha('#ffffff', 0.3) : alpha('#ffffff', 0.1)} strokeWidth={t % 12 === 0 ? 3 : 2} />;
            })}
          </svg>
          {/* reflection ring, mirrored in the floor */}
          <div style={{ position: 'absolute', transformStyle: 'preserve-3d', transform: `translateY(${FLOOR * 2}px) scaleY(-1) rotateY(${-spin}deg)` }}>
            {Array.from({ length: N }, (_, i) => renderCard(i, true))}
          </div>
          {/* the ring: the only per-frame variable */}
          <div style={{ position: 'absolute', transformStyle: 'preserve-3d', transform: `rotateY(${-spin}deg)` }}>
            {Array.from({ length: N }, (_, i) => renderCard(i, false))}
          </div>
        </div>
      </div>
    </>
  );
};
