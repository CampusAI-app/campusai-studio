/**
 * Head stack (2026-11-15, from Skill Stack Store's "20 Claude Effects" reel, #13, 16.5 to 17.4 s, stepped frame by
 * frame). What the reel does: small white paper tags with typewriter words pop up near the speaker's head one at a time,
 * each at a different angle, stacking; at the end the whole stack is flicked away upward with motion blur.
 *
 * Ours: each tag lands on the word it carries (`tags`, frame per tag, taken from the captions), slapped down from 135%
 * on a stiff spring with its shadow tightening as it lands, and its letters strike on one a frame. Tags pile beside his
 * head, never over the face, each a few degrees off from the last. On `flickAt` the stack leaves upward, top tag first,
 * accelerating out of frame in 8 frames with a vertical motion blur that follows its speed (an SVG blur, so it renders
 * headless). The face is Cutive, a proportional typewriter serif (no monospace, by the taste law), on warm white paper.
 *
 * Tags sit in front of him, so this one needs no cutout. Props: `clip`, `from`, `frame` ({ zoom, bottom, focusX }), `tags` ({ text, at }), `anchor`
 * (frame px where the first tag lands; later tags stack up from it), `rise` (px each tag sits above the last),
 * `angles` (degrees, cycled), `flickAt`, `size` (font px), `sound`.
 *
 *   <HeadStack clip="x/clip.mp4" frame={{ zoom: 1.55, bottom: 1245 }} anchor={{ x: 830, y: 1060 }}
 *     tags={[{ text: "Thursday", at: 8 }, { text: "two events", at: 42 }]} flickAt={99} />
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Cutive";
import { IN, Sfx, k } from "./shared";
import { Framing, framingOf } from "./frameGrab";

const cutive = loadFont("normal", { weights: ["400"], subsets: ["latin"] });

export type HeadStackProps = {
  clip: string;
  from?: number;
  frame?: Framing;
  tags: { text: string; at: number }[];
  anchor: { x: number; y: number };
  rise?: number;
  angles?: number[];
  flickAt?: number;
  size?: number;
  volume?: number;
  sound?: boolean;
};

const ANGLES = [-6, 5, -3, 8, -8, 3];
// small sideways steps so the pile looks dropped by hand, not aligned
const NUDGE = [0, 34, -22, 18, -30, 26];

export const HeadStack: React.FC<HeadStackProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const from = p.from ?? 0;
  const rise = p.rise ?? 84;
  const angles = p.angles ?? ANGLES;
  const size = p.size ?? 46;
  const { zoom, tx, ty } = framingOf(W, H, p.frame);
  const framed: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` };
  const n = p.tags.length;

  const tags = p.tags.map((t, i) => {
    if (f < t.at) return null;
    const land = spring({ frame: f - t.at, fps, config: { damping: 16, stiffness: 320, mass: 0.6 } });
    const letters = Math.min(t.text.length, Math.floor((f - t.at) * 1.5) + 1);
    // the flick: top of the stack first, one frame apart, accelerating
    const order = n - 1 - i;
    const fa = p.flickAt === undefined ? Infinity : p.flickAt + order;
    const fl = k(f, fa, fa + 8, IN);
    if (fl >= 1) return null;
    const prevFl = k(f - 1, fa, fa + 8, IN);
    const speed = (fl - prevFl) * 2100;
    const id = `head-stack-blur-${i}`;
    const x = p.anchor.x + NUDGE[i % NUDGE.length];
    const y = p.anchor.y - i * rise - fl * 2100;
    const rot = angles[i % angles.length] + (1 - land) * 7 + fl * (i % 2 ? 22 : -22);
    const scale = 1.35 - 0.35 * land;
    return (
      <React.Fragment key={i}>
        {speed > 1 ? (
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <filter id={id} x="-20%" y="-200%" width="140%" height="500%">
              <feGaussianBlur stdDeviation={`0 ${(speed * 0.22).toFixed(2)}`} />
            </filter>
          </svg>
        ) : null}
        <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot.toFixed(3)}deg) scale(${scale.toFixed(4)})`,
          filter: speed > 1 ? `url(#${id})` : undefined, opacity: Math.min(1, land * 4) }}>
          <div style={{ position: "relative", padding: `${Math.round(size * 0.32)}px ${Math.round(size * 0.55)}px ${Math.round(size * 0.28)}px`,
            background: "linear-gradient(170deg, #FFFDF8 0%, #F7F1E6 100%)", borderRadius: 3,
            boxShadow: `0 ${(2 + 10 * (1 - land) + 6).toFixed(1)}px ${(6 + 26 * (1 - land) + 10).toFixed(1)}px rgba(0,0,0,${(0.42 - 0.12 * (1 - land)).toFixed(3)}), 0 1px 2px rgba(0,0,0,0.25)`,
            fontFamily: cutive.fontFamily, fontSize: size, lineHeight: 1, color: "#1d1a17", whiteSpace: "nowrap", letterSpacing: "0.01em" }}>
            {/* the full word sets the size; the struck letters show over it */}
            <span style={{ visibility: "hidden" }}>{t.text}</span>
            <span style={{ position: "absolute", left: Math.round(size * 0.55), top: Math.round(size * 0.32) }}>{t.text.slice(0, letters)}</span>
          </div>
        </div>
      </React.Fragment>
    );
  });

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={framed}>
        <OffthreadVideo src={staticFile(p.clip)} startFrom={from} volume={p.volume ?? 1} style={{ width: W, height: H }} />
      </div>
      {tags}
      {p.tags.map((t, i) => (
        <Sfx key={i} at={t.at} name="typewriter-hit-soft" volume={0.45} on={p.sound ?? true} />
      ))}
      {p.flickAt !== undefined ? <Sfx at={p.flickAt} name="air-woosh-quick" volume={0.4} on={p.sound ?? true} /> : null}
    </AbsoluteFill>
  );
};
