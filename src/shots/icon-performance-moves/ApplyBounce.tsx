// CampusAI adaptation (2026-10-21), from the shot shelf (Content/video-studio/shots/, video-shotcraft, Apache-2.0):
// effects/icon-performance-moves (AttentionBounce). The performer is the real "Apply on company site" button, not an
// app icon. Kept: the escalating projectile jumps (peaks 0.35 / 0.6 / 0.85 / 1.2, airtime proportional to the root of
// the height), the stretch by vertical speed, the 2f contact squash that grows 0.1 to 0.2 per landing, the pre-jump
// crouch, the damped cosine settle after the last landing, the near and far ground shadows that thin with height, and
// the landing ripple with splash dots. Retimed by 0.64 so the four jumps end at f62 (the shot ran them 6 to 98 of 156).
// Dropped: the Dock, neighbour icons and their rack focus, the camera push, badge and feature panel (the film owns the
// page and the camera). Added: a brand red glow that steps up on every landing, a short wind-up, and the press
// (scale dips to about 0.9 and back, a red ring expands from the button).
import React from "react";
import { spring } from "remotion";
import { EASE, mix, ramp } from "../_fixtures/Polish";

export const APPLY_BOUNCE_DURATION = 81;

const RED = "232,41,59"; // #E8293B
const BASE = 81; // every frame constant below is authored at 81f and scaled by dur / 81

// Four jumps: take-off frame, airtime, peak (x REF). Contacts between jumps stay 2f, as in the shot.
const JUMPS = [
  { start: 5, dur: 9, peak: 0.35 },
  { start: 16, dur: 11.6, peak: 0.6 },
  { start: 29.6, dur: 14.1, peak: 0.85 },
  { start: 45.7, dur: 16.7, peak: 1.2 },
];
const LAND_FINAL = JUMPS[3].start + JUMPS[3].dur; // 62.4
const WIND = 67; // wind-up before the press
const PRESS = 73; // press starts dur - 8
const RIPPLE = 11.5; // the shot's 18f ripple, retimed
const GLOW_STEP = [0.16, 0.22, 0.28, 0.34]; // glow added by each landing (sums to 1)

const hs = (n: number) => {
  const x = Math.sin(n * 91.345 + 47.853) * 43758.5453;
  return x - Math.floor(x);
};

type Rect = { x: number; y: number; w: number; h: number };

export const ApplyBounce: React.FC<{ f: number; dur: number; rect: Rect; children: React.ReactNode }> = ({ f: frame, dur, rect, children }) => {
  const T = dur / BASE;
  const f = frame / T; // work in authored frames
  const { w, h } = rect;
  const cx = rect.x + w / 2;
  const ground = rect.y + h;
  const rad = h * 0.17;

  // Jump scale: the shot used the icon's side; the button's long side is the readable size. Capped so the top of the
  // highest jump stays below the screen window's top edge (y 450).
  const ref = Math.min(w * 0.8, Math.max(0, rect.y - 450) / 1.2);

  // body(): height above ground, normalised vertical speed, contact squash (same math as the shot)
  let y = 0, v = 0, squash = 0;
  JUMPS.forEach((j, ji) => {
    const t = (f - j.start) / j.dur;
    if (t > 0 && t < 1) {
      y = j.peak * ref * 4 * t * (1 - t);
      v = 1 - 2 * t;
    }
    const land = j.start + j.dur;
    const q = 0.1 + 0.1 * (ji / 3);
    if (ji < 3 && f >= land && f < land + 2) squash = q * (1 - (f - land) / 2) + q * 0.4;
  });
  if (f >= 1 && f < JUMPS[0].start) squash = 0.08 * EASE.out((f - 1) / (JUMPS[0].start - 1)); // crouch
  if (f >= LAND_FINAL) {
    const k = (f - LAND_FINAL) * T; // the settle is a physical feel, so it runs in real frames
    squash = 0.2 * Math.exp(-k * 0.38) * Math.cos(k * 0.72);
  }
  const stretch = Math.abs(v) * 0.1 * (y > 0 ? 1 : 0);
  const sx = 1 + squash - stretch * 0.5;
  const sy = 1 - squash + stretch;
  const lift = ref > 0 ? y / (1.2 * ref) : 0;

  // Red glow: steps up on each landing, then the wind-up and the press push it further
  const landed = JUMPS.reduce((s, j, i) => s + GLOW_STEP[i] * ramp(f, j.start + j.dur, 6, EASE.out), 0);
  const wind = ramp(f, WIND, PRESS - WIND, EASE.out);
  const pressSpring = spring({ frame: frame - PRESS * T, fps: 30, config: { damping: 12, stiffness: 220 } });
  const pressing = frame >= PRESS * T ? Math.sin(Math.min(1, pressSpring) * Math.PI) : 0;
  const flash = frame >= PRESS * T ? Math.exp(-(frame - PRESS * T) / 4) : 0;
  const glow = Math.min(1.4, landed + 0.15 * wind + 0.25 * flash);

  // Press: a small wind-up swell (1.04), then the press dips to about 0.9 and springs back
  const swell = 0.04 * wind * (1 - ramp(f, PRESS, 3, EASE.out));
  const pressScale = (1 + swell) * (1 - 0.1 * pressing);

  // Ring from the press, out to the last frame
  const ringT = frame >= PRESS * T ? ramp(frame, PRESS * T, dur - 1 - PRESS * T, EASE.linear) : 0;
  const ringGrow = mix(2, h * 1.1, 1 - (1 - ringT) * (1 - ringT));

  return (
    <>
      {/* floor glow: red, grows with each landing, thins with height */}
      <div style={{
        position: "absolute", left: cx - w * 0.75, width: w * 1.5, top: ground - h * 0.55, height: h * 1.1, borderRadius: "50%",
        background: `radial-gradient(ellipse closest-side, rgba(${RED},${(0.42 * glow).toFixed(3)}) 0%, rgba(${RED},0) 100%)`,
        opacity: 1 - lift * 0.6, filter: "blur(10px)",
      }} />

      {/* landing ripple + splash dots */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {JUMPS.map((j, k) => {
          const at = j.start + j.dur;
          const t = (f - at) / RIPPLE;
          if (t <= 0 || t >= 1) return null;
          const e = EASE.snappy(t);
          const strength = 0.5 + k * 0.17;
          return (
            <g key={k}>
              <ellipse cx={cx} cy={ground + 3} rx={mix(w * 0.48, w * (0.7 + 0.12 * k), e)} ry={mix(h * 0.12, h * (0.42 + 0.08 * k), e)}
                fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={mix(5, 1.5, e)} opacity={(1 - t) * strength * 0.35} style={{ filter: "blur(1.5px)" }} />
              {Array.from({ length: 4 }, (_, i) => {
                const side = i % 2 ? 1 : -1;
                const dx = side * (w * 0.5 + (16 + 26 * hs(k * 7 + i)) * e * (0.7 + k * 0.25));
                const dy = -(14 + 20 * hs(k * 11 + i)) * 4 * t * (1 - t) * (0.6 + k * 0.2);
                return <circle key={i} cx={cx + dx} cy={ground - 2 + dy} r={2.5 + 2 * hs(i + k)} fill={`rgb(${RED})`} opacity={(1 - t) * 0.8} />;
              })}
            </g>
          );
        })}
      </svg>

      {/* contact shadow: small and firm near the ground, fades fast with height */}
      <div style={{
        position: "absolute", left: cx - w * 0.42 * sx * (1 - lift * 0.4), width: w * 0.84 * sx * (1 - lift * 0.4),
        top: ground - h * 0.12, height: h * 0.3, borderRadius: "50%", background: "rgba(0,0,0,0.6)", filter: "blur(6px)",
        opacity: Math.max(0, 1 - lift * 1.8),
      }} />
      {/* far shadow: large and soft */}
      <div style={{
        position: "absolute", left: cx - w * 0.52 * (1 - lift * 0.25), width: w * 1.04 * (1 - lift * 0.25),
        top: ground - h * 0.2, height: h * 0.6, borderRadius: "50%", background: "rgba(0,0,0,0.4)", filter: "blur(14px)",
        opacity: 1 - lift * 0.6,
      }} />

      {/* press ring */}
      {ringT > 0 && (
        <div style={{
          position: "absolute", left: rect.x - ringGrow, top: rect.y - ringGrow, width: w + ringGrow * 2, height: h + ringGrow * 2,
          borderRadius: rad + ringGrow, boxSizing: "border-box", border: `${mix(8, 3, ringT).toFixed(2)}px solid rgba(${RED},1)`,
          opacity: Math.pow(1 - ringT, 0.8), boxShadow: `0 0 18px rgba(${RED},${(0.5 * (1 - ringT)).toFixed(3)})`,
        }} />
      )}

      {/* the button: squash and stretch from its bottom centre, press from its centre */}
      <div style={{
        position: "absolute", left: rect.x, top: rect.y - y, width: w, height: h,
        transform: `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`, transformOrigin: "50% 100%",
      }}>
        {/* halo behind the button */}
        <div style={{
          position: "absolute", left: -w * 0.6, top: -h * 1.6, width: w * 2.2, height: h * 4.2, borderRadius: "50%",
          background: `radial-gradient(ellipse closest-side, rgba(${RED},${(0.34 * glow).toFixed(3)}) 0%, rgba(${RED},${(0.1 * glow).toFixed(3)}) 45%, rgba(${RED},0) 100%)`,
        }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: rad, overflow: "hidden",
          transform: `scale(${pressScale.toFixed(4)})`, transformOrigin: "50% 50%",
          boxShadow: `0 ${(4 + lift * 18).toFixed(1)}px ${(10 + lift * 30).toFixed(1)}px rgba(0,0,0,0.45), 0 0 ${(6 + 34 * glow).toFixed(1)}px ${(1 + 4 * glow).toFixed(1)}px rgba(${RED},${(0.55 * Math.min(1, glow)).toFixed(3)})`,
        }}>
          {children}
        </div>
      </div>
    </>
  );
};
