/**
 * UI world (2026-11-10, effect 03 of @mrcreates.ai's "17 effects" reel, stepped frame by frame). What the reel does: the
 * subject fills the frame for about 0.15 s, then a fast pull-back (about 0.15 s, hard ease-out) reveals the subject is
 * sitting INSIDE an interface, and the interface builds itself around it one piece at a time, each piece fading and
 * sharpening out of a blur in about 0.1 s (a drop zone, then a file chip, then an input that types "make it pop", then
 * the send button turns into a check). About 1.45 s in all, then a hard cut. The reel's interface is flat; ours puts the
 * pieces in depth around the subject (Jacob's brief: UI floating in 3D space around the subject), with a slow orbit.
 *
 * Ours: the subject is a phrase; the pieces are crops of real CampusAI captures, each at its own depth; one of them can
 * change state on screen (`swap`, a second real capture of the same crop: the reel's send-to-check beat); the ending
 * pushes through the phrase into the logo. The camera is real 3D (CSS perspective), so the pull-back is the camera
 * moving back, not a zoom.
 *
 *   <UIWorld phrase="All in one place." panels={[{ shot, width: 520, x: -560, y: -300, z: -120, turn: 14 }, ...]} />
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Geist";
import { Bed, Capture, IN, Logo, OUT, SWING, Sfx, Shot, clampX, k, mix, readFrames, shotHeight } from "./shared";

const { fontFamily: GEIST } = loadFont("normal", { weights: ["500", "700"], subsets: ["latin"] });

export type UIWorldPanel = {
  shot: Capture;
  width: number;
  /** Centre, in px from the frame's centre, and depth (negative is further away). */
  x: number;
  y: number;
  z: number;
  /** Turn on its vertical axis, degrees, so it faces the subject. */
  turn?: number;
  /** A second real capture of the same crop that replaces it at `at` (a press landing). */
  swap?: { src: string; at: number };
};

export type UIWorldProps = {
  phrase: string;
  panels: UIWorldPanel[];
  sound?: boolean;
};

const PERSPECTIVE = 1800;
const CLOSE = 1100; // camera z at the start: the phrase fills the frame (1800 / 700, about 2.6x)
const T = { pull: 5, pulled: 13, build: 14, every: 7, pieceIn: 5 };
const END = 50;

export const uiWorldTimes = (p: UIWorldProps) => {
  const built = T.build + p.panels.length * T.every + T.pieceIn;
  const swaps = p.panels.map((x) => (x.swap ? x.swap.at + 45 : 0));
  const endAt = Math.max(170, readFrames(p.phrase) + 20, built + 60, ...swaps);
  return { endAt, total: endAt + END };
};

export const UIWorld: React.FC<UIWorldProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const sound = p.sound ?? true;
  const { endAt, total } = uiWorldTimes(p);

  const pull = k(f, T.pull, T.pulled, OUT);
  const push = k(f, endAt, endAt + 9, IN);
  const camZ = mix(CLOSE, 0, pull) + push * 1500;
  const orbit = interpolate(f, [T.pulled, endAt], [0, 1], { ...clampX, easing: SWING });
  const ry = mix(-6, 5, orbit);
  const rx = mix(6, 3, orbit);
  const worldO = 1 - k(f, endAt + 4, endAt + 9);

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: GEIST,
      background: "radial-gradient(ellipse 75% 70% at 50% 44%, #6E111B 0%, #3B070D 50%, #1B0306 100%)" }}>
      <Bed total={total} on={sound} />
      <Sfx at={T.pull} name="swoosh-slow" volume={0.45} on={sound} />
      {p.panels.map((x, i) => <Sfx key={i} at={T.build + i * T.every} name="hit-weak" volume={0.35} on={sound} />)}
      {p.panels.filter((x) => x.swap).map((x, i) => <Sfx key={`s${i}`} at={x.swap!.at} name="switch-tap" volume={0.55} on={sound} />)}
      <Sfx at={endAt} name="air-woosh-quick" volume={0.55} on={sound} />

      <AbsoluteFill style={{ perspective: PERSPECTIVE, perspectiveOrigin: "50% 50%", opacity: worldO }}>
        <div style={{ position: "absolute", left: width / 2, top: height / 2, transformStyle: "preserve-3d",
          transform: `translateZ(${camZ.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)` }}>
          {/* a floor of faint red lines, so the space reads as a space */}
          <div style={{ position: "absolute", left: -2400, top: -2400, width: 4800, height: 4800,
            transform: "translateY(560px) rotateX(90deg)",
            backgroundImage: "linear-gradient(rgba(255,120,130,0.16) 2px, transparent 2px), linear-gradient(90deg, rgba(255,120,130,0.16) 2px, transparent 2px)",
            backgroundSize: "120px 120px",
            WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 0%, transparent 38%)", maskImage: "radial-gradient(circle at 50% 50%, black 0%, transparent 38%)",
            opacity: pull }} />

          {/* the subject */}
          <div style={{ position: "absolute", left: -1000, width: 2000, top: -96, textAlign: "center", color: "#FFF1EE", fontWeight: 700,
            fontSize: 150, letterSpacing: "-0.045em", lineHeight: 1.2, whiteSpace: "nowrap",
            textShadow: "0 0 60px rgba(255, 90, 100, 0.35)", filter: `blur(${(push * 18).toFixed(2)}px)` }}>
            {p.phrase}
          </div>

          {/* the pieces, built one at a time */}
          {p.panels.map((x, i) => {
            const at = T.build + i * T.every;
            const a = k(f, at, at + T.pieceIn);
            if (f < at) return null;
            const h = shotHeight(x.shot, x.width);
            const bob = Math.sin(f / 38 + i * 1.7) * 7;
            const zz = x.z + (1 - a) * -380 + push * (x.z > -100 ? 600 : 300);
            const swapK = x.swap ? k(f, x.swap.at, x.swap.at + 3) : 0;
            const ring = x.swap ? interpolate(f, [x.swap.at, x.swap.at + 16], [0, 1], clampX) : 0;
            const spread = push * 1.6;
            return (
              <div key={i} style={{ position: "absolute", left: x.x * (1 + spread) - x.width / 2, top: x.y * (1 + spread) - h / 2 + bob, width: x.width, height: h,
                transform: `translateZ(${zz.toFixed(2)}px) rotateY(${(x.turn ?? 0).toFixed(2)}deg)`, opacity: a }}>
                <div style={{ position: "absolute", inset: 0, filter: `blur(${((1 - a) * 16).toFixed(2)}px)`,
                  boxShadow: "0 40px 80px rgba(10, 0, 2, 0.55), 0 0 0 1px rgba(255, 160, 170, 0.18)", borderRadius: 16 }}>
                  <Shot shot={x.shot} width={x.width} radius={16} />
                  {x.swap && swapK > 0 ? (
                    <div style={{ position: "absolute", inset: 0, opacity: swapK }}>
                      <Shot shot={{ ...x.shot, src: x.swap.src }} width={x.width} radius={16} />
                    </div>
                  ) : null}
                </div>
                {x.swap && ring > 0 && ring < 1 ? (
                  <div style={{ position: "absolute", inset: -10, borderRadius: 24, border: "3px solid rgba(255, 110, 120, 0.9)",
                    opacity: 1 - ring, transform: `scale(${(1 + ring * 0.06).toFixed(4)})` }} />
                ) : null}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* the logo inside the first second, then the ending */}
      <Logo at={10} x={150} y={74} width={190} out={endAt} />
      <Logo at={endAt + 8} x={width / 2} y={height / 2 - 30} width={620} spring />
      {f >= endAt + 16 ? (
        <div style={{ position: "absolute", left: 0, width, top: height / 2 + 60, textAlign: "center", color: "#FFE9E6", fontWeight: 500,
          fontSize: 44, letterSpacing: "-0.02em", opacity: k(f, endAt + 16, endAt + 26) }}>campusai.app</div>
      ) : null}
    </AbsoluteFill>
  );
};
