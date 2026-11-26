/**
 * Phone move (2026-11-26, from thejimmy.vision's NestPay product walkthrough, Muse Nov 26; Jacob: "let's make one of
 * these for mobile", and on the earlier NestPay send: "It's more about the transition and how it moves it"). Read frame
 * by frame (Lucius's watch notes, Nov 26); our own build.
 *
 * The idea: the phone is the subject and every scene change is a move of the phone itself, never a cut.
 *   rise      the phone climbs into frame from below while the camera pushes in on its number (NestPay 2.3 to 3.1 s)
 *   roll away the screen scrolls, then the phone tilts and rolls out of frame (3.5 to 4.3 s)
 *   lay flat  a standing phone tips forward into a 3D close-up lying flat, the screen read in perspective (10.7 to 11.1 s)
 *   lift      a card rises out of the flat screen and stands up to face the viewer (11.5 to 13.9 s)
 *   spin      the phone turns in 3D, back shown, then edge-on, and swings round to face front on the next screen
 *             (14.3 to 14.7 s)
 *   orbit     chips float round the phone low in frame, layered in front and behind, and drift into it (15.1 to 18.7 s)
 *
 * Phone3D draws a thick CSS 3D phone (front glass, titanium sides as stacked slices so it reads solid edge-on, a back
 * with the camera plateau) from a pose. `poseAt` blends pose keys with an ease per key. `phoneMetrics` gives the
 * screen size for a width so screen content can be laid out in the capture's own pixels (`ScreenPx`). Screens are real
 * captures (simulator screenshots of the app), never drawn. Velocity blur is `poseBlur`. Worked example:
 * PostPhoneWalk-9x16 (src/phonewalk/).
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";

export type PhonePose = {
  /** Frame this pose is reached. */
  t: number;
  x: number;
  y: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  s?: number;
  /** Ease of the move INTO this key. */
  ease?: (t: number) => number;
};
export type PoseState = { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number };

// motion: NestPay's moves land hard and settle soft (strong ease-out); turns swing through the middle.
export const PHONE_EASE = {
  land: Easing.bezier(0.16, 1, 0.3, 1),
  swing: Easing.bezier(0.65, 0, 0.35, 1),
  leave: Easing.bezier(0.55, 0, 0.85, 0.35),
};

const full = (p: PhonePose): PoseState => ({ x: p.x, y: p.y, z: p.z ?? 0, rx: p.rx ?? 0, ry: p.ry ?? 0, rz: p.rz ?? 0, s: p.s ?? 1 });

export const poseAt = (keys: PhonePose[], f: number): PoseState => {
  if (f <= keys[0].t) return full(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    if (f <= b.t) {
      const a = full(keys[i - 1]);
      const B = full(b);
      const e = (b.ease ?? PHONE_EASE.swing)(Math.min(1, Math.max(0, (f - keys[i - 1].t) / (b.t - keys[i - 1].t))));
      const m = (u: number, v: number) => u + (v - u) * e;
      return { x: m(a.x, B.x), y: m(a.y, B.y), z: m(a.z, B.z), rx: m(a.rx, B.rx), ry: m(a.ry, B.ry), rz: m(a.rz, B.rz), s: m(a.s, B.s) };
    }
  }
  return full(keys[keys.length - 1]);
};

/** How fast the phone moves at f, in px per frame plus degrees per frame, for a soft motion blur on fast moves. */
export const poseBlur = (keys: PhonePose[], f: number, k = 0.06, max = 14) => {
  const a = poseAt(keys, f - 0.5);
  const b = poseAt(keys, f + 0.5);
  const v = Math.hypot(b.x - a.x, b.y - a.y) + Math.abs(b.rx - a.rx) * 6 + Math.abs(b.ry - a.ry) * 3 + Math.abs(b.rz - a.rz) * 6 + Math.abs(b.s - a.s) * 900;
  return Math.min(max, Math.max(0, (v - 8) * k));
};

/** iPhone 17 Pro proportions: the screen is 1206 x 2622 capture px. */
export const CAPTURE = { w: 1206, h: 2622 };
export const phoneMetrics = (width: number) => {
  const bez = width * 0.034;
  const sw = width - bez * 2;
  const sh = (sw * CAPTURE.h) / CAPTURE.w;
  return { w: width, h: sh + bez * 2, bez, sw, sh, r: width * 0.165, sr: width * 0.165 - bez, d: width * 0.1, px: sw / CAPTURE.w };
};

/** Lays its children out in capture pixels (1206 x 2622), scaled to the phone's screen. */
export const ScreenPx: React.FC<{ width: number; children: React.ReactNode }> = ({ width, children }) => {
  const m = phoneMetrics(width);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: CAPTURE.w, height: CAPTURE.h, transform: `scale(${m.px})`, transformOrigin: "0 0" }}>
      {children}
    </div>
  );
};

const TITANIUM = "linear-gradient(90deg, #1d1c20 0%, #4a4950 18%, #2b2a2f 50%, #55545b 82%, #1b1a1e 100%)";

export const Phone3D: React.FC<{
  width: number;
  screen: React.ReactNode;
  pose: PoseState;
  /** Light from the left (0) to the right (1), moves the glass sheen. */
  sheen?: number;
  slices?: number;
}> = ({ width, screen, pose, sheen, slices = 26 }) => {
  const m = phoneMetrics(width);
  const layers = [];
  for (let i = 0; i < slices; i++) {
    const z = -m.d / 2 + (m.d * (i + 0.5)) / slices;
    layers.push(
      <div key={i} style={{ position: "absolute", inset: 0, borderRadius: m.r, background: TITANIUM, transform: `translateZ(${z.toFixed(2)}px)`, boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.05)" }} />,
    );
  }
  const sh = sheen ?? 0.5 + Math.sin((pose.ry * Math.PI) / 180) * 0.4 - (pose.rz / 90) * 0.2;
  return (
    <div
      style={{
        position: "absolute", left: pose.x - m.w / 2, top: pose.y - m.h / 2, width: m.w, height: m.h, transformStyle: "preserve-3d",
        transform: `translateZ(${pose.z.toFixed(1)}px) rotateX(${pose.rx.toFixed(2)}deg) rotateY(${pose.ry.toFixed(2)}deg) rotateZ(${pose.rz.toFixed(2)}deg) scale(${pose.s.toFixed(4)})`,
      }}
    >
      {layers}
      {/* back: glass with the camera plateau, seen when the phone turns */}
      <div style={{ position: "absolute", inset: 0, borderRadius: m.r, transform: `rotateY(180deg) translateZ(${(m.d / 2 + 0.6).toFixed(2)}px)`, backfaceVisibility: "hidden",
        background: "linear-gradient(160deg, #3a3238 0%, #231e22 45%, #17131a 100%)", boxShadow: "inset 0 0 0 3px #5a585f" }}>
        <div style={{ position: "absolute", left: m.w * 0.06, top: m.w * 0.06, width: m.w * 0.88, height: m.w * 0.46, borderRadius: m.r * 0.8, background: "linear-gradient(160deg,#4a4248,#2a2428)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.08)" }}>
          {[[0.17, 0.27], [0.17, 0.73], [0.43, 0.5]].map(([cx, cy], i) => (
            <div key={i} style={{ position: "absolute", left: m.w * 0.88 * cx - m.w * 0.09 + (i === 2 ? m.w * 0.0 : 0), top: m.w * 0.46 * cy - m.w * 0.09, width: m.w * 0.18, height: m.w * 0.18, borderRadius: "50%",
              background: "radial-gradient(circle at 40% 35%, #3b4a66 0%, #0c0d12 45%, #050507 70%)", boxShadow: "0 0 0 5px #1a171b, 0 0 0 7px #6a666e" }} />
          ))}
          <div style={{ position: "absolute", left: m.w * 0.66, top: m.w * 0.06, width: m.w * 0.08, height: m.w * 0.08, borderRadius: "50%", background: "#d9d3c6", opacity: 0.85 }} />
        </div>
        <svg width={m.w * 0.16} height={m.w * 0.16} viewBox="0 0 24 24" style={{ position: "absolute", left: m.w * 0.42, top: m.h * 0.52, opacity: 0.35 }}>
          <path d="M12 0C12.9 6.6 17.4 11.1 24 12C17.4 12.9 12.9 17.4 12 24C11.1 17.4 6.6 12.9 0 12C6.6 11.1 11.1 6.6 12 0Z" fill="#cfc6cc" />
        </svg>
      </div>
      {/* front: black bezel, the screen, a glass sheen that follows the turn */}
      <div style={{ position: "absolute", inset: 0, borderRadius: m.r, transform: `translateZ(${(m.d / 2 + 0.6).toFixed(2)}px)`, backfaceVisibility: "hidden", background: "#050506", boxShadow: "inset 0 0 0 2px #6b6a70" }}>
        <div style={{ position: "absolute", left: m.bez, top: m.bez, width: m.sw, height: m.sh, borderRadius: m.sr, overflow: "hidden", background: "#000" }}>
          {screen}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
            background: `linear-gradient(115deg, rgba(255,255,255,0) ${(sh * 100 - 30).toFixed(1)}%, rgba(255,255,255,0.07) ${(sh * 100).toFixed(1)}%, rgba(255,255,255,0) ${(sh * 100 + 22).toFixed(1)}%)` }} />
        </div>
      </div>
    </div>
  );
};

/** A stage for Phone3D and anything else that moves in the same 3D space, with a soft velocity blur. */
export const PhoneStage: React.FC<{ perspective?: number; blur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ perspective = 2600, blur = 0, children, style }) => (
  <AbsoluteFill style={{ filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined, ...style }}>
    <AbsoluteFill style={{ perspective, perspectiveOrigin: "50% 45%", transformStyle: "preserve-3d" }}>{children}</AbsoluteFill>
  </AbsoluteFill>
);

/** The soft contact shadow under a phone, in screen space. */
export const PhoneShadow: React.FC<{ pose: PoseState; width: number; y?: number; opacity?: number; color?: string }> = ({ pose, width, y, opacity = 0.35, color = "0,0,0" }) => {
  const m = phoneMetrics(width);
  const w = m.w * pose.s * 1.1;
  return (
    <div style={{ position: "absolute", left: pose.x - w / 2, top: (y ?? pose.y + (m.h * pose.s) / 2) - 30, width: w, height: 60, borderRadius: "50%",
      background: `radial-gradient(closest-side, rgba(${color},${opacity}), rgba(${color},0))`, filter: "blur(8px)" }} />
  );
};

/** Where to put the phone centre so capture point (cx, cy) lands on (fx, fy) at scale s, standing straight. */
export const focusOn = (width: number, cx: number, cy: number, s: number, fx: number, fy: number) => {
  const m = phoneMetrics(width);
  const dx = (cx * m.px + m.bez - m.w / 2) * s;
  const dy = (cy * m.px + m.bez - m.h / 2) * s;
  return { x: fx - dx, y: fy - dy };
};

/** A press: a ring that grows and fades where a finger lands, in capture px. */
export const PressRing: React.FC<{ f: number; at: number; x: number; y: number; size?: number }> = ({ f, at, x, y, size = 150 }) => {
  if (f < at - 4 || f > at + 18) return null;
  const down = interpolate(f, [at - 4, at, at + 4], [0, 1, 0.85], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ring = interpolate(f, [at, at + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: PHONE_EASE.land });
  return (
    <>
      <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: "50%", background: "rgba(255,255,255,0.28)", opacity: down * (1 - ring), transform: `scale(${0.7 + 0.2 * down})` }} />
      <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: "50%", border: "5px solid rgba(255,255,255,0.8)", opacity: (1 - ring) * (f >= at ? 1 : 0), transform: `scale(${0.6 + 1.1 * ring})` }} />
    </>
  );
};
