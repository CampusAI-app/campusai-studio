// CampusAI adaptation (2026-10-21), from the shot shelf (Content/video-studio/shots/, video-shotcraft, Apache-2.0):
// demos/effects/scan-bracket-sweep. An overlay on the film's live screen: CampusAI reading the job posting.
// Changes: the skeleton shot-list document, its pop-in, the row lighting and the backdrop/grain are gone (the real
// screen is the document). Brackets are white, the scan light is brand red on screen blend (the original multiplies
// indigo onto white paper, which would only darken a dark UI). Everything fades out over the last 10 frames.
//
// Kept from the original, as fractions of the shot (t = f / (dur - 1)), so it retimes proportionally to dur:
//   brackets   t0 = 0.08 + i * 0.022, opacity over 0.03, travel over 0.055 on EASE.overshoot (~8% past, then seats),
//              8 units of diagonal travel from outside, 34-unit arms, 1.6-unit round stroke, set 7-8 units outside the rect
//   scan       window 0.17 -> 0.95 linear, PASSES = 5, inOutSine inside each pass, last 12% of each pass a dead stop
//   light      1.2-unit core + 10-unit symmetric glow + a trail up to 82 units that stretches with speed (0 at the stops)
//              and hangs on the side it came from (above going down, below going up), gradient flipped with it
//   fades      scan in over 0.16 -> 0.20, out over 0.93 -> 0.99; the whole overlay out over the last 10 frames
// "unit" = min(rect.w, rect.h) / 178, the original document's short edge, so the brackets keep their proportions.
import React from 'react';
import { EASE } from '../_fixtures/Polish';

const RED = '232,41,59'; // #E8293B as rgb components, so alpha can be appended
const PASSES = 5;
const TAIL = 82;
const DOC_SHORT = 178;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (t: number, t0: number, t1: number) => clamp01((t - t0) / (t1 - t0));
const inOutSin = (x: number) => 0.5 - Math.cos(Math.PI * clamp01(x)) / 2;

// the four L brackets, drawn in a 36-unit box (34-unit arm + stroke); dx/dy point inward
const CS = 36;
const CORNERS = [
  { d: 'M1 35V1h34', ax: 0, ay: 0, dx: 1, dy: 1 },
  { d: 'M1 1h34v34', ax: 1, ay: 0, dx: -1, dy: 1 },
  { d: 'M35 1v34H1', ax: 1, ay: 1, dx: -1, dy: -1 },
  { d: 'M35 35H1V1', ax: 0, ay: 1, dx: 1, dy: -1 },
];

export const ScanBrackets: React.FC<{
  f: number;
  dur: number;
  rect: { x: number; y: number; w: number; h: number };
}> = ({ f, dur, rect }) => {
  const t = Math.min(1, Math.max(0, f / Math.max(1, dur - 1)));
  const dt = 1 / Math.max(1, dur - 1);
  const u = Math.min(rect.w, rect.h) / DOC_SHORT;
  const H = rect.h;

  // scan position (rect-local y, 0 -> H) and direction, a pure function of t so speed can be differenced
  const scanAt = (tt: number) => {
    const sp = seg(tt, 0.17, 0.95);
    const raw = sp * PASSES;
    const pi = Math.min(PASSES - 1, Math.floor(raw));
    const local = clamp01((raw - pi) / 0.88);
    const dir = pi % 2 === 0 ? 1 : -1;
    const prog = inOutSin(local);
    return { y: dir > 0 ? prog * H : H - prog * H, dir };
  };
  const { y, dir } = scanAt(t);
  const speed = Math.abs(scanAt(t + dt / 2).y - scanAt(t - dt / 2).y);
  const PEAK = (H * Math.PI) / 2 / (((0.78 * dur) / PASSES) * 0.88);
  const tail = TAIL * u * Math.pow(clamp01(speed / PEAK), 0.75);

  const out = 1 - clamp01((f - (dur - 11)) / 10); // whole overlay, last ~10 frames
  const scanOp = seg(t, 0.16, 0.2) * (1 - seg(t, 0.93, 0.99));

  const radius = Math.min(10 * u, 22);
  const core = 1.2 * u;
  const glow = 10 * u;
  const inset = 8 * u; // brackets sit this far outside the rect
  const cs = CS * u;

  return (
    <div style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, opacity: out, pointerEvents: 'none' }}>
      {/* scan light, clipped to the rect */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: radius, overflow: 'hidden', opacity: scanOp }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 0, transform: `translateY(${y.toFixed(2)}px)` }}>
          {/* trail: hangs on the side it came from, length follows speed */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: tail,
              top: dir > 0 ? -tail : 0,
              mixBlendMode: 'screen',
              background: `linear-gradient(${dir > 0 ? 180 : 0}deg, rgba(${RED},0) 0%, rgba(${RED},0.06) 55%, rgba(${RED},0.2) 100%)`,
            }}
          />
          {/* glow */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: -glow / 2,
              height: glow,
              mixBlendMode: 'screen',
              background: `linear-gradient(180deg, rgba(${RED},0) 0%, rgba(${RED},0.32) 50%, rgba(${RED},0) 100%)`,
            }}
          />
          {/* core: red line, hot in the middle */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: -core / 2,
              height: core,
              background: `linear-gradient(90deg, rgba(${RED},0.55) 0%, rgb(${RED}) 18%, #ff8a95 50%, rgb(${RED}) 82%, rgba(${RED},0.55) 100%)`,
              boxShadow: `0 0 ${(2.5 * u).toFixed(1)}px rgba(${RED},0.75)`,
            }}
          />
        </div>
      </div>

      {/* corner brackets: staggered, drop in diagonally from outside with a light overshoot */}
      {CORNERS.map((c, i) => {
        const t0 = 0.08 + i * 0.022;
        const a = seg(t, t0, t0 + 0.03);
        const p = EASE.overshoot(clamp01((t - t0) / 0.055));
        const off = (1 - p) * 8 * u;
        const left = c.ax ? rect.w + inset - cs : -inset;
        const top = c.ay ? rect.h + inset - cs : -inset;
        return (
          <svg
            key={i}
            width={cs}
            height={cs}
            viewBox={`0 0 ${CS} ${CS}`}
            style={{
              position: 'absolute',
              left,
              top,
              overflow: 'visible',
              opacity: a,
              transform: `translate(${(-off * c.dx).toFixed(2)}px,${(-off * c.dy).toFixed(2)}px)`,
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
            }}
          >
            <path d={c.d} fill="none" stroke="#ffffff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      })}
    </div>
  );
};
