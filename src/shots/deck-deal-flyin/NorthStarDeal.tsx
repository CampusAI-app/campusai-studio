// CampusAI adaptation (2026-10-21) of shelf shot ui-entrance/deck-deal-flyin (DeckDealFlyin.tsx, video-shotcraft).
// What the North Star steers: the student's picked roles sit at the top, and the four career surfaces it moves are
// dealt out of a physical stack into a 2x2 grid of real product screens.
// Kept (retimed by dur / 150 unless noted): the physical stack (STACK_STEP 3px per card, deterministic jitter
// px/py = ((k*7)%9-4)*2 / ((k*5)%7-3)*2, rotZ ((k*11)%7)-3, small per-card shadow, heavy shadow under the bottom
// card, the top-light shade 0.08 on the pile until the light comes up); the orbit opening on a monotone cubic
// Hermite camera spline (same spline code, same angles: rotX 48 / rotY -30 / rotZ 9 swinging to 42 / 24 / -6,
// persp 1100 scaled by zoom); the anticipation beat (frames 26 to 36: pile pressed 48px, top card pulled back 30px
// against its deal direction, easeOut quad, released 2f after the first deal); the hard-accelerating deal cue
// curve cue = 36 + 4k - 0.0792 k(k-1), sampled across its whole range so 4 cards keep the 26-card acceleration;
// the per-card flight kept as physical feel, unscaled (8f dive on bezier(.3,0,.2,1) with a +110px z arc and a
// 1.06 scale peak, 4f settle on bezier(.3,0,.25,1.15) overshoot, 0.996 press over 2f, identity transform once
// landed); the flight ghost (6% path lag, blur 7px, opacity .28(1-t)); the shadow that lags the card by ~3f
// (cue+8 to cue+15); the light coming up from the pile over frames 34 to 64 (bezier .5,0,.6,1); the camera
// chasing the deal down the layout; the hold with only a ~1.5% push-in.
// Changed: the graphite table, paper board, title, mono counter and Shotcraft mark are gone (the film owns the
// background); the 26 page-slice cards are the 4 real screens; the pile sits at the grid centre (a vertical canvas
// has no room beside the grid) and at 0.72 scale so it does not cover the labels, growing to full size in flight;
// the camera ends flat and front-on instead of the runway overhead so the screens and labels read; the North Star
// block is screen-fixed at the top; each landing draws one thin red line from it to that screen.
import React from 'react';
import { Easing, Img, interpolate } from 'remotion';
import { INTER } from '../../kit/parts';

const ORIG_DUR = 150;
const RED = '#E8293B';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Layout (canvas px).
const CENTER_Y = 520;
const SW = 470; // screen width
const SH = Math.round((SW * 10) / 16); // 294, 16:10
const GAP_X = 24;
const LABEL_GAP = 16;
const LABEL_H = 44;
const ROW_GAP = 32;
const CELL_H = SH + LABEL_GAP + LABEL_H;
const GRID_C = { x: 540, y: 1150 };
const GRID_TOP = Math.round(GRID_C.y - (CELL_H * 2 + ROW_GAP) / 2);
const COL_X = [540 - GAP_X / 2 - SW, 540 + GAP_X / 2];
const ROW_Y = [GRID_TOP, GRID_TOP + CELL_H + ROW_GAP];

// The stack (original physics).
const STACK_STEP = 3;
const PILE_S = 0.72;
const HOVER_H = 40;
const DIVE_EASE = Easing.bezier(0.3, 0, 0.2, 1);
const SETTLE_EASE = Easing.bezier(0.3, 0, 0.25, 1.15);
const LIGHT_EASE = Easing.bezier(0.5, 0, 0.6, 1);
const SHADOW_EASE = Easing.bezier(0.22, 1, 0.36, 1);

// Monotone cubic Hermite (verbatim from the original camera).
const hermite = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d = xs.slice(0, -1).map((x, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - x));
  const m = xs.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? 0 : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};

type Cam = { cx: number; cy: number; zoom: number; rotX: number; rotY: number; rotZ: number; persp: number };
const PARAMS: (keyof Cam)[] = ['cx', 'cy', 'zoom', 'rotX', 'rotY', 'rotZ', 'persp'];
// Anchors in ORIGINAL frames; the world point (cx, cy) is drawn at the grid centre GRID_C.
const ANCHORS: (Cam & { frame: number })[] = [
  { frame: 0, cx: GRID_C.x - 20, cy: GRID_C.y + 40, zoom: 1.9, rotX: 48, rotY: -30, rotZ: 9, persp: 1100 },
  { frame: 30, cx: GRID_C.x + 12, cy: GRID_C.y + 26, zoom: 1.8, rotX: 42, rotY: 24, rotZ: -6, persp: 1100 },
  { frame: 62, cx: 540, cy: ROW_Y[0] + 280, zoom: 1.06, rotX: 16, rotY: 0, rotZ: 2, persp: 1700 },
  { frame: 86, cx: 540, cy: ROW_Y[1] + 30, zoom: 1.02, rotX: 6, rotY: -2, rotZ: -1.5, persp: 2500 },
  { frame: 110, cx: GRID_C.x, cy: GRID_C.y, zoom: 1, rotX: 0, rotY: 0, rotZ: 0, persp: 3300 },
  { frame: 150, cx: GRID_C.x, cy: GRID_C.y, zoom: 1.015, rotX: 0, rotY: 0, rotZ: 0, persp: 3300 },
];

const rad = (d: number) => (d * Math.PI) / 180;
// Where a world point (x, y, 0) lands on the canvas, with the same math CSS applies below.
const project = (x: number, y: number, c: Cam): [number, number] => {
  let px = x - c.cx, py = y - c.cy, pz = 0;
  const cz = Math.cos(rad(c.rotZ)), sz = Math.sin(rad(c.rotZ));
  [px, py] = [px * cz - py * sz, px * sz + py * cz];
  const cx = Math.cos(rad(c.rotX)), sx = Math.sin(rad(c.rotX));
  [py, pz] = [py * cx - pz * sx, py * sx + pz * cx];
  const cy = Math.cos(rad(c.rotY)), sy = Math.sin(rad(c.rotY));
  [px, pz] = [px * cy + pz * sy, -px * sy + pz * cy];
  const d = c.persp * c.zoom;
  const k = d / (d - pz * c.zoom);
  return [GRID_C.x + px * c.zoom * k, GRID_C.y + py * c.zoom * k];
};

// Elbow route (org-chart style) in world px, corners as sampled quadratics.
const route = (pts: [number, number][], r: number): [number, number][] => {
  const out: [number, number][] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], [cx, cy] = pts[i + 1];
    const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy - by);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const p0: [number, number] = [bx - ((bx - ax) / l1) * rr, by - ((by - ay) / l1) * rr];
    const p2: [number, number] = [bx + ((cx - bx) / l2) * rr, by + ((cy - by) / l2) * rr];
    for (let s = 0; s <= 8; s++) {
      const u = s / 8;
      out.push([(1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * bx + u * u * p2[0], (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * by + u * u * p2[1]]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

export const NorthStarDeal: React.FC<{
  f: number;
  dur: number;
  center: React.ReactNode;
  centerSize: { w: number; h: number };
  screens: { src: string; label: string }[];
}> = ({ f, dur, center, centerSize, screens }) => {
  const kT = dur / ORIG_DUR;
  const T = (x: number) => x * kT;

  const curves = Object.fromEntries(
    PARAMS.map((p) => [p, hermite(ANCHORS.map((a) => T(a.frame)), ANCHORS.map((a) => a[p]))]),
  ) as Record<keyof Cam, (x: number) => number>;
  const cam = Object.fromEntries(PARAMS.map((p) => [p, curves[p](f)])) as Cam;

  const n = screens.length;
  const pile = { x: GRID_C.x, y: GRID_C.y };
  const centerBottom = CENTER_Y + centerSize.h / 2;

  const cards = screens.map((s, k) => {
    const col = k % 2, row = Math.floor(k / 2);
    const x = COL_X[col], y = ROW_Y[row];
    // Sample the original 26-card cue curve across its full range so 4 cards keep its acceleration.
    const kk = n > 1 ? (k * 25) / (n - 1) : 0;
    const cue = T(36 + 4 * kk - 0.0792 * kk * (kk - 1));
    return {
      ...s, k, x, y, row, cue,
      jx: (((k * 7) % 9) - 4) * 2,
      jy: (((k * 5) % 7) - 3) * 2,
      protZ: ((k * 11) % 7) - 3,
      pz: (n - k) * STACK_STEP,
    };
  });

  const lightUp = interpolate(f, [T(34), T(64)], [0, 1], { ...clamp, easing: LIGHT_EASE });
  const antFrom = T(26), antTo = T(36);
  const antT = interpolate(f, [antFrom, antTo], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const c0 = cards[0];
  const pullLen = c0 ? Math.hypot(c0.x + SW / 2 - pile.x, c0.y + SH / 2 - pile.y) || 1 : 1;
  const pullDir = c0 ? [(c0.x + SW / 2 - pile.x) / pullLen, (c0.y + SH / 2 - pile.y) / pullLen] : [0, 0];

  const persp = cam.persp * cam.zoom;
  const worldTransform =
    `translate(${(GRID_C.x - cam.cx).toFixed(3)}px, ${(GRID_C.y - cam.cy).toFixed(3)}px) ` +
    `scale3d(${cam.zoom.toFixed(5)}, ${cam.zoom.toFixed(5)}, ${cam.zoom.toFixed(5)}) ` +
    `rotateY(${cam.rotY.toFixed(3)}deg) rotateX(${cam.rotX.toFixed(3)}deg) rotateZ(${cam.rotZ.toFixed(3)}deg)`;

  // Lines: the whole route is projected from the world (so it stays on the cards while the camera moves), then
  // clipped where it leaves the screen-fixed North Star block, so it always starts at the block's bottom edge.
  const yJ0 = (centerBottom + ROW_Y[0]) / 2;
  const yJ1 = ROW_Y[1] - ROW_GAP / 2;
  const startY = centerBottom - 2;
  const lines = cards.map((c) => {
    const cx = c.x + SW / 2;
    const yJ = c.row === 0 ? yJ0 : yJ1;
    const world = route([[540, CENTER_Y], [540, yJ], [cx, yJ], [cx, c.y]], c.row === 0 ? 30 : 14);
    const proj = world.map(([x, y]) => project(x, y, cam));
    let pts: [number, number][];
    const cut = proj.findIndex((p) => p[1] >= startY);
    if (cut <= 0) {
      const first = proj[Math.max(0, cut)];
      pts = [[first[0], startY], ...proj.slice(Math.max(0, cut))];
    } else {
      const a = proj[cut - 1], b = proj[cut];
      const u = (startY - a[1]) / (b[1] - a[1]);
      pts = [[a[0] + (b[0] - a[0]) * u, startY], ...proj.slice(cut)];
    }
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const grow = interpolate(f, [c.cue + 5, c.cue + 15], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    return { d: 'M ' + pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' L '), len, grow };
  });

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* North Star -> surface lines, under the cards. One group opacity so shared trunks do not stack. */}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <g opacity={0.6}>
          {lines.map((l, i) =>
            l.grow > 0 ? (
              <path key={i} d={l.d} fill="none" stroke={RED} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={`${(l.len * l.grow).toFixed(2)} ${(l.len + 20).toFixed(2)}`} />
            ) : null,
          )}
        </g>
      </svg>

      {/* The world under the camera. */}
      <div style={{ position: 'absolute', inset: 0, perspective: `${persp.toFixed(2)}px`, perspectiveOrigin: `${GRID_C.x}px ${GRID_C.y}px` }}>
        <div
          style={{
            position: 'absolute', left: 0, top: 0, width: 1080, height: 1920,
            transformOrigin: `${cam.cx.toFixed(2)}px ${cam.cy.toFixed(2)}px`,
            transform: worldTransform,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Top light on the stack, opening up and fading as the light reaches the grid. */}
          {lightUp < 1 && (
            <div
              style={{
                position: 'absolute',
                left: pile.x - (520 + 700 * lightUp), top: pile.y - (420 + 600 * lightUp),
                width: 2 * (520 + 700 * lightUp), height: 2 * (420 + 600 * lightUp),
                background: `radial-gradient(closest-side, rgba(255,236,238,${(0.11 * (1 - lightUp)).toFixed(3)}), rgba(255,220,224,${(0.04 * (1 - lightUp)).toFixed(3)}) 50%, transparent 100%)`,
              }}
            />
          )}

          {cards.map((c, i) => {
            const { cue } = c;
            const toX = pile.x - (c.x + SW / 2) + c.jx;
            const toY = pile.y - (c.y + SH / 2) + c.jy;
            const diveT = interpolate(f, [cue, cue + 8], [0, 1], { ...clamp, easing: DIVE_EASE });
            const settleT = interpolate(f, [cue + 8, cue + 12], [0, 1], { ...clamp, easing: SETTLE_EASE });
            const dx = toX * (1 - diveT);
            const dy = toY * (1 - diveT);
            const rotFlight = c.protZ * (1 - diveT);
            const arc = Math.sin(diveT * Math.PI) * 110;
            const zDive = interpolate(diveT, [0, 1], [c.pz, HOVER_H]) + arc;
            const z = f < cue ? c.pz : zDive * (1 - settleT);
            const grow = PILE_S + (1 - PILE_S) * diveT;
            const dealScale = 1 + Math.sin(diveT * Math.PI) * 0.06;
            const press = interpolate(f, [cue + 10, cue + 11, cue + 12], [1, 0.996, 1], clamp);
            const scale = grow * dealScale * press;
            const isLanded = f >= cue + 12;
            const inPile = f < cue;
            const antDy = inPile && f < antTo + 2 ? 48 * antT : 0;
            const pull = i === 0 && inPile ? 30 * antT : 0;
            const transform = isLanded
              ? 'translate3d(0px, 0px, 0px)'
              : inPile
                ? `translate3d(${(toX - pullDir[0] * pull).toFixed(2)}px, ${(toY - pullDir[1] * pull + antDy).toFixed(2)}px, ${c.pz}px) rotateZ(${c.protZ}deg) scale(${PILE_S})`
                : `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, ${z.toFixed(2)}px) rotateZ(${rotFlight.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
            const shadowLag = interpolate(f, [cue + 8, cue + 15], [0, 1], { ...clamp, easing: SHADOW_EASE });
            const shadow = isLanded
              ? `0 ${(10 + 14 * (1 - shadowLag)).toFixed(1)}px ${(30 + 30 * (1 - shadowLag)).toFixed(1)}px -8px rgba(0,0,0,${(0.55 + 0.12 * (1 - shadowLag)).toFixed(3)})`
              : inPile
                ? i === n - 1
                  ? '0 1px 3px rgba(0,0,0,.4), 0 26px 60px rgba(0,0,0,0.75)'
                  : '0 1px 2px rgba(0,0,0,.35)'
                : `0 ${(36 - 24 * settleT).toFixed(1)}px ${(70 - 50 * settleT).toFixed(1)}px rgba(0,0,0,${(0.45 - 0.25 * settleT).toFixed(3)})`;
            const showGhost = diveT > 0.02 && diveT < 0.98;
            const pileShade = inPile ? 0.08 * (1 - lightUp) : 0;
            const labelT = interpolate(f, [cue + 8, cue + 8 + T(12)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
            const face = (
              <>
                <Img src={c.src} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', boxSizing: 'border-box' }} />
              </>
            );
            return (
              <div key={i} style={{ transformStyle: 'preserve-3d' }}>
                {showGhost && (
                  <div
                    style={{
                      position: 'absolute', left: c.x, top: c.y, width: SW, height: SH, borderRadius: 18, overflow: 'hidden',
                      transform: `translate3d(${(dx + toX * 0.06).toFixed(2)}px, ${(dy + toY * 0.06).toFixed(2)}px, ${z.toFixed(2)}px) rotateZ(${rotFlight.toFixed(3)}deg) scale(${scale.toFixed(4)})`,
                      opacity: 0.28 * (1 - diveT), filter: 'blur(7px)',
                    }}
                  >
                    {face}
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute', left: c.x, top: c.y, width: SW, height: SH, borderRadius: 18, overflow: 'hidden',
                    background: '#140d0f', transform, boxShadow: shadow,
                  }}
                >
                  {face}
                  {pileShade > 0.005 && <div style={{ position: 'absolute', inset: 0, background: `rgba(10,10,12,${pileShade.toFixed(3)})` }} />}
                </div>
                {labelT > 0 && (
                  <div
                    style={{
                      position: 'absolute', left: c.x, top: c.y + SH + LABEL_GAP, width: SW, height: LABEL_H, textAlign: 'center',
                      fontFamily: 'Zodiak, serif', fontWeight: 700, fontSize: 40, lineHeight: `${LABEL_H}px`, letterSpacing: '-0.025em', color: '#fff',
                      whiteSpace: 'nowrap', opacity: labelT,
                      transform: `translate3d(0px, ${((1 - labelT) * 12).toFixed(2)}px, 16px)`,
                    }}
                  >
                    {c.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* The North Star, screen-fixed at the top for the whole shot. */}
      <div
        style={{
          position: 'absolute', left: 0, width: 1080, top: CENTER_Y - centerSize.h / 2 - 14 - 36, height: 36,
          textAlign: 'center', fontFamily: INTER, fontWeight: 600, fontSize: 30, lineHeight: '36px', color: 'rgba(255,255,255,0.6)',
        }}
      >
        Your North Star
      </div>
      <div
        style={{
          position: 'absolute', left: 540 - centerSize.w / 2, top: CENTER_Y - centerSize.h / 2,
          width: centerSize.w, height: centerSize.h,
        }}
      >
        {center}
      </div>
    </div>
  );
};
