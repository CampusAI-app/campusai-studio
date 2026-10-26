/**
 * Feature loops, shared frame and helpers (round 4, 2026-10-25). A loop is 6 to 8 s, silent, one feature, one
 * press, and seamless: its last frame hands back to its first. Everything that is on screen for the whole loop
 * (the ground, the held CampusAI mark, the one caption) is constant, so only the product moves.
 *
 * Layout: 1x1 is the film system's own (system/parts/layout.ts, with captions). 9x16 (lead review, 2026-10-25:
 * "show the real product big", no empty Reels bottom): the mark stays top left at y 96, the product fills y 160
 * to 1540 (72% of the height), the caption band sits directly under it (y 1550 to 1626, above Instagram's bottom
 * ~300 px), and that bottom stays calm but not empty: the product's own red glow rising from the bottom edge.
 * Every view edge is softened (an inset fade in the film ground), so a word the frame edge cuts never ends on
 * a hard edge mid-word.
 *
 * The flying piece is canvas-materialize-moves A ("panel-to-canvas", shots/cards/interaction): the piece lifts
 * 3% with a deeper shadow, flies on a quadratic arc on spring(damping 17, stiffness 95, mass 0.9), its size
 * converges 3 frames after its position, the old content is gone by u 0.4 and the new one comes in from u 0.5
 * to 0.8 (never both at once), it lands with a 6 frame 0.97 squash, and the landing is marked by row-embed's
 * seam: a 2 px accent line along the bottom edge that opens from the centre in 5 frames and fades in 8.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile } from "remotion";
import type { Brand } from "../../kit/brand";
import { glow } from "../../kit/brand";
import type { PageCam, Rect, Size } from "../../kit/camera";
import { clampCam } from "../../kit/camera";
import { INTER } from "../../kit/parts";
import { makeLayout } from "../../system/parts/layout";

export type LoopAspect = "1x1" | "9x16";
export const FPS = 30;
export const PAGE: Size = { w: 1440, h: 900 };
export const SIZE: Record<LoopAspect, Size> = { "1x1": { w: 1080, h: 1080 }, "9x16": { w: 1080, h: 1920 } };

export type LoopLayout = {
  W: number;
  H: number;
  u: number;
  view: Rect;
  mark: { x: number; y: number; width: number };
  caption: Rect;
  captionSize: number;
};

export const loopLayout = (aspect: LoopAspect): LoopLayout => {
  const l = makeLayout(aspect, true);
  if (aspect === "9x16") {
    return { W: l.W, H: l.H, u: l.u, view: { x: 16, y: 160, w: l.W - 32, h: 1380 }, mark: l.mark, caption: { x: 70, y: 1550, w: 940, h: 76 },
      captionSize: l.captionSize };
  }
  return { W: l.W, H: l.H, u: l.u, view: l.view, mark: l.mark, caption: l.caption!, captionSize: l.captionSize };
};

export const img = (name: string) => staticFile(`loops/${name}.jpg`);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ramp = (v: number, a: number, b: number, easing?: (t: number) => number) =>
  interpolate(v, [a, b], [0, 1], easing ? { ...clamp, easing } : clamp);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const cam = (c: PageCam, view: Rect): PageCam => clampCam(c, PAGE, view);

/** The flight spring, stretched to `dur` frames (canvas-materialize A's config). 0 before `at`. */
export const fly = (f: number, at: number, dur: number) =>
  f < at ? 0 : spring({ frame: f - at, fps: FPS, config: { damping: 17, stiffness: 95, mass: 0.9 }, durationInFrames: dur });

/** First frame the flight is home (u >= 0.985): where the squash and seam start. */
export const landFrame = (at: number, dur: number) => {
  for (let f = at; f < at + dur * 3; f++) if (fly(f, at, dur) >= 0.985) return f;
  return at + dur;
};

/** The lift before a flight: element-body-moves' spring (damping 16, stiffness 120), 0 to 1. */
export const lift = (f: number, at: number) => (f < at ? 0 : spring({ frame: f - at, fps: FPS, config: { damping: 16, stiffness: 120 } }));

/** A point on the quadratic arc from a to b whose middle rises by `rise` canvas px. */
export const arc = (a: { x: number; y: number }, b: { x: number; y: number }, u: number, rise: number) => {
  const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - rise };
  const v = 1 - u;
  return { x: v * v * a.x + 2 * u * v * c.x + u * u * b.x, y: v * v * a.y + 2 * u * v * c.y + u * u * b.y };
};

export const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/** The ground, the held mark and the caption: identical on every frame, so they never break the loop. */
export const LoopFrame: React.FC<{ brand: Brand; layout: LoopLayout; caption: string; children: React.ReactNode }> = ({
  brand, layout, caption, children,
}) => {
  const { mark, caption: band, captionSize, view, u, H } = layout;
  const tall = H > layout.W * 1.5;
  return (
    <AbsoluteFill style={{ background: brand.color.bgDeep, backgroundImage: brand.color.gradient }}>
      {tall && (
        <div style={{ position: "absolute", left: 0, top: band.y + band.h, width: layout.W, height: H - band.y - band.h,
          background: `radial-gradient(70% 90% at 50% 100%, ${glow(brand, 0.2)}, transparent)` }} />
      )}
      {children}
      {/* soft edges: words cut by the frame fade into the ground instead of stopping mid-word on a hard line */}
      <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h, borderRadius: 34, pointerEvents: "none",
        boxShadow: `inset 0 0 ${60 * u}px ${24 * u}px rgba(11, 7, 8, 0.95)` }} />
      {brand.logo && (
        <Img src={staticFile(brand.logo.onDark)} style={{ position: "absolute", left: mark.x, top: mark.y, width: mark.width, height: "auto", opacity: 0.92 }} />
      )}
      <div style={{ position: "absolute", left: band.x, top: band.y, width: band.w, height: band.h, display: "flex", alignItems: "center",
        justifyContent: "center", textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: captionSize, lineHeight: 1.2,
        letterSpacing: "-0.01em", color: brand.color.ink }}>
        {caption}
      </div>
    </AbsoluteFill>
  );
};

/** Pages slide inside this band (the view plus a hair), so nothing ever crosses the mark or the caption. */
export const ViewClip: React.FC<{ layout: LoopLayout; children: React.ReactNode }> = ({ layout, children }) => {
  const pad = 14 * layout.u;
  const top = layout.view.y - pad;
  return (
    <div style={{ position: "absolute", left: 0, top, width: layout.W, height: layout.view.h + pad * 2, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: -top }}>{children}</div>
    </div>
  );
};

/**
 * The piece in flight: a rounded surface whose ground blends from the source's to the target's, carrying the
 * source crop until u 0.4 and the target crop from u 0.5. Both crops are drawn at the box's width with their
 * own aspect (cover, anchored top left), so neither is ever squeezed. Canvas px.
 */
export const FlyPiece: React.FC<{
  box: Rect;
  radius: number;
  from: string;
  to: string;
  u: number;
  ground: [string, string];
  /** 0 to 1 while lifted or flying: the shadow it casts. */
  air: number;
  /** Frames since landing, or null in the air. */
  landed: number | null;
  brand: Brand;
  u1: number;
  /** The target's own width on canvas: its content is never drawn wider, so it arrives at its real size. */
  toW: number;
}> = ({ box, radius, from, to, u, ground, air, landed, brand, u1, toW }) => {
  // canvas-materialize swaps at 0.4 / 0.5 to 0.8; our target is 4 to 11 times smaller than the source, so the
  // source rides longer (a shrinking copy reads as "going in") and the target's content waits until the box is
  // drawn at its own final width (else its text shows huge mid-flight): source out 0.35 to 0.6, target in 0.62 to 0.86
  const fromOp = 1 - ramp(u, 0.35, 0.6);
  const toOp = ramp(u, 0.62, 0.86);
  const squash = landed === null ? 1 : interpolate(landed, [0, 2, 6], [1, 0.97, 1], clamp);
  const seamOpen = landed === null ? 0 : ramp(landed, 0, 5, Easing.out(Easing.cubic));
  const seamOp = landed === null ? 0 : 1 - ramp(landed, 5, 13);
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: radius, overflow: "hidden",
      transform: squash === 1 ? undefined : `scaleY(${squash.toFixed(4)})`, transformOrigin: "50% 100%",
      background: u < 0.7 ? ground[0] : ground[1],
      boxShadow: `0 ${(4 + 26 * air) * u1}px ${(10 + 50 * air) * u1}px rgba(0,0,0,${(0.35 + 0.3 * air).toFixed(3)}), 0 0 ${(40 * air) * u1}px ${glow(brand, 0.22 * air)}` }}>
      {fromOp > 0 && <Img src={from} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "auto", opacity: fromOp }} />}
      {toOp > 0 && <Img src={to} style={{ position: "absolute", left: 0, top: 0, width: Math.min(box.w, toW), height: "auto", opacity: toOp }} />}
      {seamOp > 0 && (
        <div style={{ position: "absolute", left: box.w * (0.5 - seamOpen / 2), width: box.w * seamOpen, bottom: 0, height: 2 * u1,
          background: brand.color.accent, boxShadow: `0 0 ${7 * u1}px ${brand.color.accent}`, opacity: seamOp }} />
      )}
    </div>
  );
};

/** Canvas-coordinate overlay clipped exactly to the page view (the pointer goes here, so it leaves with the page). */
export const ViewOverlay: React.FC<{ view: Rect; radius?: number; children: React.ReactNode }> = ({ view, radius = 34, children }) => (
  <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h, overflow: "hidden", borderRadius: radius }}>
    <div style={{ position: "absolute", left: -view.x, top: -view.y }}>{children}</div>
  </div>
);
