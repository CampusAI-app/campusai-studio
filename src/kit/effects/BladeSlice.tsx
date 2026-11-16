/**
 * Blade slice (2026-11-15, ours, after Skill Stack Store's "20 Claude Effects" reel, 15.6 to 16.1 s). What the reel
 * does: a dark diagonal slash (lower left to upper right, about 25 degrees) cuts across the speaker's face, the picture
 * splits along it and the top half slides along the cut, then the two halves heal. About 0.5 s.
 *
 * Ours, on a spoken word: the camera punches in 10% over the 3 frames before the cut (so the sliding half never shows
 * the frame edge), a blade streak crosses the frame in 3 frames along the cut line, then the halves shear `shift` px
 * apart along the cut (each half going half of it) and the top lifts off the line in 4 frames, opening a dark seam with a hot white edge. The frame shakes
 * and settles, the halves hold, then slide home in 7 frames and the seam closes with a last flash. Both halves are the
 * same playing clip, clipped to either side of the line, so the speech never stops.
 *
 * Props: `clip` (path under public/), `from` (frames trimmed off its start), `at` (frame the blade lands, put it on
 * the word), `center` (a point on the cut, frame px, usually the face), `angle` (degrees above horizontal, default
 * 25), `shift` (px along the cut, default 80), `hold` (frames), `sound`.
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { IN, OUT, SWING, Sfx, clampX, k } from "./shared";

export type BladeSliceProps = {
  clip: string;
  from?: number;
  volume?: number;
  at: number;
  center: { x: number; y: number };
  angle?: number;
  shift?: number;
  hold?: number;
  sound?: boolean;
};

const L = 4000;

export const BladeSlice: React.FC<BladeSliceProps> = (p) => {
  const f = useCurrentFrame();
  const at = p.at;
  const hold = p.hold ?? 6;
  const shift = p.shift ?? 80;
  const a = ((p.angle ?? 25) * Math.PI) / 180;
  // along the cut (towards upper right) and across it (towards lower right)
  const d = { x: Math.cos(a), y: -Math.sin(a) };
  const n = { x: -d.y, y: d.x };
  const c = p.center;

  const openAt = at;
  const openEnd = at + 4;
  const healAt = openEnd + hold;
  const healEnd = healAt + 7;

  // punch in before the cut, back out after the heal
  const punch = k(f, at - 3, at, OUT) * (1 - k(f, healEnd, healEnd + 8, SWING));
  const zoom = 1 + 0.1 * punch;

  // the split: open fast, hold, heal
  const open = k(f, openAt, openEnd, OUT) * (1 - k(f, healAt, healEnd, SWING));
  const along = shift * open;
  const gap = 18 * open;

  // shake on impact, decaying over 8 frames
  const sh = f >= at && f < at + 8 ? (1 - (f - at) / 8) * 9 : 0;
  const shakeX = sh * Math.sin(f * 2.9);
  const shakeY = sh * Math.cos(f * 3.7);

  // the blade streak: head and tail race across in 3 frames, along the cut line
  const head = interpolate(f, [at - 3, at], [-1, 1.15], { ...clampX, easing: OUT });
  const tail = interpolate(f, [at - 2, at + 1], [-1, 1.15], { ...clampX, easing: IN });
  const streakOn = f >= at - 3 && f <= at + 1;
  const span = 1400;
  const hx = c.x + d.x * head * span;
  const hy = c.y + d.y * head * span;
  const tx = c.x + d.x * tail * span;
  const ty = c.y + d.y * tail * span;

  // the seam glows white-hot as it opens and once more as it closes
  const flash = Math.max(1 - k(f, at, at + 5), f >= healEnd - 2 ? 1 - k(f, healEnd - 2, healEnd + 4) : 0);

  const poly = (side: 1 | -1) => {
    const p1 = { x: c.x - d.x * L, y: c.y - d.y * L };
    const p2 = { x: c.x + d.x * L, y: c.y + d.y * L };
    const p3 = { x: p2.x + side * n.x * L, y: p2.y + side * n.y * L };
    const p4 = { x: p1.x + side * n.x * L, y: p1.y + side * n.y * L };
    return `polygon(${[p1, p2, p3, p4].map((q) => `${q.x.toFixed(1)}px ${q.y.toFixed(1)}px`).join(", ")})`;
  };

  const blur = open > 0.02 && open < 0.98 && f < openEnd ? 2.5 : 0;
  const camera: React.CSSProperties = {
    position: "absolute", inset: 0, transformOrigin: `${c.x}px ${c.y}px`,
    transform: `translate(${shakeX.toFixed(2)}px, ${shakeY.toFixed(2)}px) scale(${zoom.toFixed(4)})`,
  };
  const video = (muted: boolean) => (
    <OffthreadVideo src={staticFile(p.clip)} trimBefore={p.from ?? 0} muted={muted} volume={muted ? 0 : p.volume ?? 1}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
  );
  const seamAngle = -(p.angle ?? 25);

  return (
    <AbsoluteFill style={{ background: "#050505", overflow: "hidden" }}>
      <div style={camera}>
        {/* bottom half slides the other way: each half takes half the shift, so neither shows the frame edge */}
        <div style={{ position: "absolute", inset: 0, clipPath: poly(1),
          transform: `translate(${(-d.x * along * 0.5).toFixed(2)}px, ${(-d.y * along * 0.5).toFixed(2)}px)`, filter: blur ? `blur(${blur}px)` : undefined }}>
          {video(false)}
        </div>
        {/* the seam: dark, with a thin hot edge on the lower lip */}
        {open > 0.01 && (
          <div style={{ position: "absolute", left: c.x - L, top: c.y - gap - 2, width: L * 2, height: gap + 6, transformOrigin: `${L}px ${gap + 2}px`,
            transform: `rotate(${seamAngle}deg)`, background: "linear-gradient(#000 0%, #120806 70%, rgba(255,240,225,0.9) 92%, rgba(255,255,255,0) 100%)",
            boxShadow: `0 0 ${(18 * flash + 6).toFixed(1)}px rgba(255,230,210,${(0.25 + 0.6 * flash).toFixed(3)})` }} />
        )}
        {/* top half slides along the cut and lifts off it */}
        <div style={{ position: "absolute", inset: 0, clipPath: poly(-1),
          transform: `translate(${(d.x * along * 0.5 - n.x * gap).toFixed(2)}px, ${(d.y * along * 0.5 - n.y * gap).toFixed(2)}px)`,
          filter: blur ? `blur(${blur}px)` : undefined }}>
          {video(true)}
        </div>
      </div>

      {streakOn && (
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <linearGradient id="blade-streak" gradientUnits="userSpaceOnUse" x1={tx} y1={ty} x2={hx} y2={hy}>
              <stop offset="0" stopColor="#fff" stopOpacity={0} />
              <stop offset="0.75" stopColor="#fff" stopOpacity={0.85} />
              <stop offset="1" stopColor="#fff" stopOpacity={1} />
            </linearGradient>
          </defs>
          <line x1={tx} y1={ty} x2={hx} y2={hy} stroke="#000" strokeOpacity={0.55} strokeWidth={16} strokeLinecap="round" />
          <line x1={tx} y1={ty} x2={hx} y2={hy} stroke="url(#blade-streak)" strokeWidth={5} strokeLinecap="round" />
        </svg>
      )}

      {/* a one-frame lift of the whole picture on impact */}
      <AbsoluteFill style={{ background: "#fff", opacity: f === at ? 0.18 : 0, pointerEvents: "none" }} />

      <Sfx at={at - 4} name="air-woosh-quick" volume={0.45} on={p.sound ?? true} />
      <Sfx at={at} name="bass-hit-short" volume={0.35} on={p.sound ?? true} />
      <Sfx at={healAt} name="paper-move-quick" volume={0.25} on={p.sound ?? true} />
    </AbsoluteFill>
  );
};

