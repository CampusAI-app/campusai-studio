/**
 * Frame break (2026-11-10, from @mrcreates.ai's "17 Video Effects" reel, 3.7 to 4.8 s, stepped frame by frame). What the
 * reel does: the presenter sits inside a rounded card on a light ground. The card insets (its edges pull in) while he
 * stays the same size, and because his cutout is drawn ON TOP of the card, his shoulders and gesturing hand now stick
 * out past the card's edges. Thin line chevrons mark the edge where he breaks it. It leaves with a quick motion blur.
 *
 * Ours: the card holds the full clip (the real backdrop), the ground is a soft off-white with a faint grid, the inset
 * lands hard and settles (OUT) and is timed so a gesture is what breaks the edge, and the exit is a fast upward pull
 * with a stretched blur standing in for motion blur. The cutout fades out above its own bottom edge (`fade`), so a
 * cutout that stops at a table or a ragged line never shows that line outside the card.
 *
 * Props (all positions in the clip's own pixels; the clip and cutout are the composition's size):
 * - clip: the full clip under public/ (its sound plays). person: the same clip cut out (alpha webm, drawn muted).
 * - card: where the card lands. radius: its corner. shift: px the whole scene moves down as it lands (default centres
 *   the card in the frame).
 * - insetAt / insetFrames: when the card pulls in. exitAt / exitFrames: the motion-blur exit (omit to hold).
 * - fade: the cutout is solid above `from` and gone at `to` (keep `to` at or above the card bottom).
 * - choke: px the cutout's edge is pulled in, so the old backdrop's dark fringe never rims him on the light ground.
 * - breaks: chevrons on the card edge where the person crosses it, each with its side, its y, and when it appears.
 * - sfx: one soft sound on the landing, one quick one on the exit.
 *
 *   <FrameBreak clip="x/clip.mp4" person="x/person.webm" card={{ x: 160, y: 260, w: 760, h: 1020 }} insetAt={17}
 *     fade={{ from: 1170, to: 1270 }} breaks={[{ side: "right", y: 900 }]} exitAt={221} />
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { IN, Sfx, k, mix } from "./shared";

export type FrameBreakEdge = { side: "left" | "right" | "top"; y: number; x?: number; at?: number };

export type FrameBreakProps = {
  clip: string;
  person: string;
  /** Frames into the clip (and the cutout) to start from. */
  startFrom?: number;
  card: { x: number; y: number; w: number; h: number };
  radius?: number;
  shift?: number;
  insetAt: number;
  insetFrames?: number;
  exitAt?: number;
  exitFrames?: number;
  fade: { from: number; to: number };
  /** px the cutout's edge is pulled in (clip pixels), so the old backdrop's dark fringe never rims him on the ground. */
  choke?: number;
  breaks?: FrameBreakEdge[];
  ground?: string;
  ink?: string;
  sfx?: boolean;
};

/** Two thin chevrons pointing out of the card, the way the reel marks a break. */
const Chevrons: React.FC<{ dir: "left" | "right" | "up"; color: string }> = ({ dir, color }) => {
  const rot = dir === "right" ? 0 : dir === "left" ? 180 : -90;
  return (
    <svg width={56} height={44} viewBox="0 0 56 44" style={{ transform: `rotate(${rot}deg)`, overflow: "visible" }}>
      <path d="M6 6 L22 22 L6 38" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 6 L42 22 L26 38" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
    </svg>
  );
};

export const FrameBreak: React.FC<FrameBreakProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const ground = p.ground ?? "#F3F1EC";
  const ink = p.ink ?? "rgba(24, 22, 28, 0.62)";
  const insetFrames = p.insetFrames ?? 12;
  const landed = p.insetAt + insetFrames;
  const shift = p.shift ?? H / 2 - (p.card.y + p.card.h / 2);

  // motion: the inset lands hard and settles (OUT, 12 frames); the card's corners round as it pulls in
  const t = k(f, p.insetAt, landed);
  const cx = mix(0, p.card.x, t);
  const cy = mix(0, p.card.y, t);
  const cw = mix(W, p.card.w, t);
  const ch = mix(H, p.card.h, t);
  const radius = mix(0, p.radius ?? 44, t);
  const dy = shift * t;

  // motion: the exit speeds up (IN) and pulls everything off the top, stretched and blurred like a whip
  const exitFrames = p.exitFrames ?? 7;
  const e = p.exitAt === undefined ? 0 : k(f, p.exitAt, p.exitAt + exitFrames, IN);
  const exitY = -e * H * 1.15;
  const exitBlur = e * 26;
  const stretch = 1 + e * 0.14;

  const startFrom = p.startFrom ?? 0;
  const choke = p.choke ?? 2;
  const chokeId = "frame-break-choke";
  const mask = `linear-gradient(to bottom, #000 ${p.fade.from}px, transparent ${p.fade.to}px)`;

  return (
    <AbsoluteFill style={{ background: ground }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={chokeId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="erode" radius={choke} result="a" />
          <feGaussianBlur in="a" stdDeviation={Math.max(0.6, choke * 0.6)} result="ab" />
          <feComposite in="SourceGraphic" in2="ab" operator="in" />
        </filter>
      </svg>
      {/* the ground: soft off-white and a faint grid, fixed while the scene moves */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(30, 28, 36, 0.055) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(30, 28, 36, 0.055) 1.5px, transparent 1.5px)",
          backgroundSize: "72px 72px",
          backgroundPosition: "36px 24px",
        }}
      />
      <AbsoluteFill
        style={{
          transform: `translateY(${(dy + exitY).toFixed(2)}px) scaleY(${stretch.toFixed(4)})`,
          transformOrigin: "50% 100%",
          filter: exitBlur > 0.1 ? `blur(${exitBlur.toFixed(2)}px)` : undefined,
        }}
      >
        {/* the card: a window onto the full clip, which stays put while the window closes in */}
        <div
          style={{
            position: "absolute",
            left: cx,
            top: cy,
            width: cw,
            height: ch,
            borderRadius: radius,
            overflow: "hidden",
            boxShadow: `0 ${(28 * t).toFixed(1)}px ${(70 * t).toFixed(1)}px rgba(20, 16, 30, ${(0.22 * t).toFixed(3)})`,
          }}
        >
          <OffthreadVideo src={staticFile(p.clip)} startFrom={startFrom} style={{ position: "absolute", left: -cx, top: -cy, width: W, height: H }} />
        </div>
        {/* the break marks sit on the card's plane, under the person, so a hand crossing one covers it */}
        {(p.breaks ?? []).map((b, i) => {
          const at = b.at ?? landed - 2;
          // motion: each mark slides out 14px from the edge and fades up over 8 frames, then drifts 3px so it never freezes
          const a = k(f, at + i * 3, at + i * 3 + 8);
          const drift = Math.sin((f - at) / 9) * 3 * a;
          const off = 22 + (1 - a) * -14 + drift;
          const style: React.CSSProperties = { position: "absolute", opacity: a };
          if (b.side === "right") Object.assign(style, { left: p.card.x + p.card.w + off, top: b.y - 22 });
          if (b.side === "left") Object.assign(style, { left: p.card.x - off - 56, top: b.y - 22 });
          if (b.side === "top") Object.assign(style, { left: (b.x ?? W / 2) - 28, top: p.card.y - off - 44 });
          return (
            <div key={i} style={style}>
              <Chevrons dir={b.side === "top" ? "up" : b.side} color={ink} />
            </div>
          );
        })}
        {/* the person, on top of the card, so whatever crosses the card's edge is drawn over the ground */}
        {f >= p.insetAt ? (
          <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>
            <OffthreadVideo
              src={staticFile(p.person)}
              startFrom={startFrom}
              transparent
              muted
              style={{ width: W, height: H, filter: `${choke > 0 ? `url(#${chokeId}) ` : ""}drop-shadow(0 ${(14 * t).toFixed(1)}px ${(22 * t).toFixed(1)}px rgba(20, 16, 30, ${(0.28 * t).toFixed(3)}))` }}
            />
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
      <Sfx at={p.insetAt + 1} name="transition-soft" volume={0.28} on={!!p.sfx} />
      {p.exitAt !== undefined ? <Sfx at={p.exitAt - 2} name="air-woosh-quick" volume={0.25} on={!!p.sfx} /> : null}
    </AbsoluteFill>
  );
};

