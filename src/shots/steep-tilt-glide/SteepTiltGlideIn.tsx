// CampusAI adaptation (2026-10-21) of shelf shot camera/steep-tilt-glide (SteepTiltGlide.tsx, video-shotcraft).
// Kept: the fixed camera (perspective 1100, rotateY -60deg, rotateZ -2deg, constant for the whole glide), the page
// gliding along its own 3D plane (local translateX is the only thing that moves while the camera holds), the
// original glide curve's start (bezier 0.3, 0.12), three speed-ghost layers at f-1.6 / -3.2 / -4.8 with opacity
// proportional to glide speed (0.021 / 0.014 / 0.008, capped .3 / .2 / .11), the dark-to-lit reveal
// (shade .7 -> .4 -> 0, retimed), the left-edge shadow and the screen-space depth fog on the far end.
// Changed: the page is the real product screen (children), not the drawn 6200px panel; no text-settling layer;
// unlike the original it LANDS: after the glide the wall unwinds to flat and settles exactly on `view`
// (identity transform, full opacity) by dur - 12, so the film can cut to its live screen with no jump.
// The glide tail now eases to rest (the original never stops), because it has to hand off to the landing.
// The glide runs far -> near (the original runs near -> far): a one-screen page cannot fill the frame the way the
// 6200px panel did, so it arrives out of the far end of the wall and comes toward the lens before it lands.
import React from 'react';
import { Easing, interpolate } from 'remotion';

type Rect = { x: number; y: number; w: number; h: number };

const ORIG_DUR = 120; // original shot length the timing table was tuned on
const CAM = { persp: 1100, rotY: -60, rotZ: -2 };
const RADIUS = 34;

// Glide framing on the 1080x1920 canvas (the original's left 40% / top 15% / scale .62, refit for vertical).
const TX0 = 200; // page anchor (its left edge) sits this far right of view.x while it is a wall
const TY0 = -60;
const S0 = 0.72;
const LX0 = -1150; // page starts this far back along its own plane (the far, left end) and glides toward the lens

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const glideEase = Easing.bezier(0.3, 0.12, 0.25, 1); // original start, settled tail
const landEase = Easing.bezier(0.65, 0, 0.35, 1);

export const SteepTiltGlideIn: React.FC<{
  f: number;
  dur: number;
  view: Rect;
  children: React.ReactNode;
}> = ({ f, dur, view, children }) => {
  const k = dur / ORIG_DUR;
  const landEnd = dur - 12; // identity from here to the last frame
  const glideEnd = landEnd - 4;
  const unwindStart = Math.round(dur * 0.42);

  const lxAt = (t: number) => interpolate(t, [0, glideEnd], [LX0, 0], { ...clamp, easing: glideEase });
  const landAt = (t: number) => interpolate(t, [unwindStart, landEnd], [0, 1], { ...clamp, easing: landEase });

  const transformAt = (t: number) => {
    const L = landAt(t);
    const ry = CAM.rotY * (1 - L);
    const rz = CAM.rotZ * (1 - L);
    const tx = TX0 * (1 - L);
    const ty = TY0 * (1 - L);
    const s = S0 + (1 - S0) * L;
    const lx = lxAt(t);
    if (t >= landEnd) return 'none'; // exact identity: the film cuts to its live screen here
    return `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${s.toFixed(4)}) translateX(${lx.toFixed(2)}px)`;
  };

  // Panel dark mask: dark at the start, fully lit ~1.4s in (original 0 / 18 / 44 frames, retimed).
  const shade = interpolate(f, [0, 18 * k, 44 * k], [0.7, 0.4, 0], clamp);
  // Ghost strength follows glide speed (trail = past positions reprojected through the same fixed camera).
  const speed = Math.abs(lxAt(f - 1) - lxAt(f + 1)) / 2;
  const live = f < landEnd;
  const g1 = live ? Math.min(0.3, speed * 0.021) : 0;
  const g2 = live ? Math.min(0.2, speed * 0.014) : 0;
  const g3 = live ? Math.min(0.11, speed * 0.008) : 0;
  const land = landAt(f);
  const glow = 1 - land;

  const layer = (t: number, opacity: number, key: string) => (
    <div
      key={key}
      style={{
        position: 'absolute',
        left: view.x,
        top: view.y,
        width: view.w,
        height: view.h,
        opacity,
        transform: transformAt(t),
        transformOrigin: '0px 50%',
        borderRadius: RADIUS,
        overflow: 'hidden',
        boxShadow: glow > 0.01 ? `0 0 ${(160 * glow).toFixed(1)}px rgba(232,41,59,${(0.28 * glow).toFixed(3)})` : 'none',
      }}
    >
      {children}
      {shade > 0.001 && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: '#070304', opacity: shade }} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(7,3,4,0.9), rgba(7,3,4,0) 42%)',
              opacity: Math.min(1, shade * 1.6),
            }}
          />
        </>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        perspective: CAM.persp,
        perspectiveOrigin: `${view.x + TX0 - 60}px ${view.y + view.h / 2 + 90}px`,
        pointerEvents: 'none',
      }}
    >
      {g3 > 0.02 && layer(f - 4.8, g3, 'g3')}
      {g2 > 0.02 && layer(f - 3.2, g2, 'g2')}
      {g1 > 0.02 && layer(f - 1.6, g1, 'g1')}
      {layer(f, 1, 'body')}
      {/* Depth fog: the far end of the wall (canvas left) sinks into the dark; gone once it lands. */}
      {glow > 0.01 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: glow,
            background: 'linear-gradient(100deg, rgba(11,7,8,0.62) 0%, rgba(11,7,8,0.28) 18%, rgba(11,7,8,0) 40%)',
          }}
        />
      )}
    </div>
  );
};
