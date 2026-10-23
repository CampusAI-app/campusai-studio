// CampusAI adaptation (2026-10-21), from the shot shelf (Content/video-studio/shots/, video-shotcraft, Apache-2.0):
// demos/data/before-after-slider-scrub. Before = the real Current line, after = the real Suggested line, in a dark card.
// Changes: no FakeDashboard, no fake "unprocessed" blur/grey on the before (the card's own rule: the before must be the
// real state), no Before/After pills inside the layers (the crops carry the product's own Current / Suggested labels;
// optional labels sit above the card instead), no grain. The ending is new: the slow scrub goes FORWARD to 100% so the
// shot ends fully on the rewritten line, then holds ~20 frames. Dark-ground shadows instead of the light-paper ones.
//
// Kept from the original (positions in % of the card width; frames scaled by k = (dur - 20) / 104, the original
// action length, so the action fills everything but the final hold):
//   wind-up  f 10k -> 14k   8% -> 6.5%  EASE.smooth   (pull back before the throw)
//   fling    f 14k -> 26k   6.5% -> 76% EASE.out      (12 frames, the hit)
//   bounce   f 26k -> 38k   76% -> 70%  EASE.smooth
//   hold     f 38k -> 56k   70%
//   scrub    f 56k -> dur-20  70% -> 100% EASE.smooth (slow read, now forward)
//   handle   scaleX squish up to 1.18 with speed, a 6% "pinch" through the throw, directional SpeedBlur (amount 0.12),
//            knob shadow grows with speed; speed thresholds scaled from the original 1920 px width to the card width.
import React from 'react';
import { EASE, SpeedBlur, mix, ramp, softShadow, velocity } from '../_fixtures/Polish';
import { INTER } from '../../kit/parts';

const RED = '#E8293B';
const ORIG_W = 1920;

export const RewriteSlider: React.FC<{
  f: number;
  dur: number;
  x: number;
  y: number;
  w: number;
  h: number;
  before: React.ReactNode;
  after: React.ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
}> = ({ f, dur, x, y, w, h, before, after, beforeLabel, afterLabel }) => {
  const k = (dur - 20) / 104;
  const PRE = 10 * k;
  const T0 = 14 * k;
  const FLING = 26 * k;
  const BOUNCE = 38 * k;
  const HOLD = 56 * k;
  const SCRUB = dur - 20;

  const posAt = (fr: number): number => {
    if (fr < T0) return mix(8, 6.5, ramp(fr, PRE, T0 - PRE, EASE.smooth));
    if (fr < FLING) return mix(6.5, 76, ramp(fr, T0, FLING - T0, EASE.out));
    if (fr < BOUNCE) return mix(76, 70, ramp(fr, FLING, BOUNCE - FLING, EASE.smooth));
    if (fr < HOLD) return 70;
    return mix(70, 100, ramp(fr, HOLD, SCRUB - HOLD, EASE.smooth));
  };

  const p = posAt(f);
  const hx = (p / 100) * w; // handle x inside the card
  const sc = w / ORIG_W; // original-to-card scale for speed thresholds
  const vx = velocity((fr) => (posAt(fr) / 100) * w, f);
  const speed = Math.abs(vx);
  const squish = 1 + Math.min(speed / (110 * sc), 1) * 0.18;
  const press = 1 - 0.06 * Math.sin(Math.PI * ramp(f, PRE, FLING - PRE, EASE.linear));

  const knob = Math.max(36, Math.min(64, h * 0.62));
  const ks = knob / 76; // original knob was 76 px

  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      {/* optional labels above the card corners; the before label dims as its side is used up */}
      {beforeLabel && (
        <div style={{ position: 'absolute', left: 4, bottom: h + 14, fontFamily: INTER, fontWeight: 600, fontSize: 26, color: 'rgba(255,255,255,.55)', opacity: 1 - (p / 100) * 0.8, whiteSpace: 'nowrap' }}>
          {beforeLabel}
        </div>
      )}
      {afterLabel && (
        <div style={{ position: 'absolute', right: 4, bottom: h + 14, fontFamily: INTER, fontWeight: 600, fontSize: 26, color: RED, whiteSpace: 'nowrap' }}>
          {afterLabel}
        </div>
      )}

      {/* the card */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 16,
          background: '#21171f',
          boxShadow: '0 0 0 1px rgba(255,255,255,.16), 0 30px 80px rgba(0,0,0,.55), 0 8px 24px rgba(0,0,0,.35)',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>{before}</div>
        {/* after: revealed on the left of the handle */}
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${Math.max(0, w - hx).toFixed(2)}px 0 0)`, background: '#21171f' }}>
          {after}
          {/* contact shade on the after side of the edge, so the two layers read front and back */}
          <div style={{ position: 'absolute', left: hx - 24, top: 0, width: 24, height: h, background: 'linear-gradient(90deg, rgba(0,0,0,0), rgba(0,0,0,0.28))' }} />
        </div>
      </div>

      {/* handle: 4px white line + white knob, squish and directional blur with speed */}
      <SpeedBlur vx={vx} amount={0.12} max={14 * sc}>
        <div
          style={{
            position: 'absolute',
            left: hx - 2,
            top: 0,
            width: 4,
            height: h,
            borderRadius: 2,
            background: '#ffffff',
            boxShadow: '0 0 18px rgba(0,0,0,0.55)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: hx - knob / 2,
            top: h / 2 - knob / 2,
            width: knob,
            height: knob,
            borderRadius: knob / 2,
            background: 'linear-gradient(180deg, #ffffff, #f1eef0)',
            boxShadow: `inset 0 1px 0 #ffffff, ${softShadow((14 + Math.min(speed / (8 * sc), 18)) * ks, { color: '#000000', strength: 2 })}`,
            transform: `scale(${press * squish}, ${press})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={36 * ks} height={20 * ks} viewBox="0 0 36 20" style={{ display: 'block' }}>
            <path d="M11 3 L4 10 L11 17" fill="none" stroke="#21171f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M25 3 L32 10 L25 17" fill="none" stroke="#21171f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </SpeedBlur>
    </div>
  );
};
