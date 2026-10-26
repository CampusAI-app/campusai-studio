/**
 * DeckSwap (r4, 2026-10-25): page A tips back a little and slides under, while page B is dealt in on top of it
 * from below, like the next page of a stack landing on the last. With `carry`, one real piece of A (an event card,
 * a button) lifts off first, rides on top through the swap, and settles into its matching place on B, where it
 * hands over to B's own pixels: the event card shrinking into its block on My Calendar.
 *
 * Ported from three shelf shots (Content/video-studio/shots/demos):
 *   bottom-push-stack-wipe  the new page comes up from the bottom edge as one rigid sheet with a contact shadow
 *                           above its top edge (56 px, 0.42 to 0) and a 2 px lit top edge, both gone once it lands;
 *                           its heavy ease-out push. Changed: the old page is not shoved off frame, it gives way
 *                           backwards (the stack), so both are on screen as one motion.
 *   deck-deal-flyin         the per-card flight: a dive on bezier(0.3, 0, 0.2, 1) with a z arc, then a short
 *                           settle on bezier(0.3, 0, 0.25, 1.15) with a little overshoot, the shadow lagging the
 *                           card. Here at page scale: dive 0.78 of `dur`, settle the rest, z arc 40 px.
 *   card-stack              the dealt card's tilt converging to flat as it lands (here 3.5 deg roll and 10 deg
 *                           pitch, both to 0 by the end of the dive), and the depth from the stacking order alone.
 * Dictionary: card deal onto a stack (deck-deal-flyin), with a stack push (bottom-push-stack-wipe).
 *
 * Numbers (30 fps):
 *   dur 30 f     B rises from 1.04 view heights below to 12 px past its rest, then settles back (0.22 of dur).
 *                A, starting 2 f earlier on bezier(0.33, 0, 0.2, 1): pitches back 8 deg about its centre, moves up
 *                5% of the view and 200 px into depth (perspective 1800), and darkens to 0.4.
 *   carry        lifts at at - lead (12 f): 5 page px up, shadow, accent rim; travels over the whole swap on its own
 *                calm curve, bezier(0.45, 0, 0.2, 1), from its lifted place to its match on B, leaning toward B's
 *                live position as travel cubed (so it never dips toward the incoming page and lands as B settles); its pixels cross from A's piece to B's matching piece over 0.55 to 0.92
 *                of the travel, each kept at its own aspect; the rim lets go and the piece dissolves
 *                into B over the 12 f after B lands.
 *   after        B eases from `to.cam` toward `to.drift` (default 1.5% in over 150 f); pass drift = cam to hold.
 * Works at any aspect: every distance is a share of the view, and the view is any rect.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { PageCam, Rect } from "../../camera";
import { PageView } from "../../PageView";
import { MarkPatch, MARK_BOX } from "../../pass/camera/shared";
import type { PageSide } from "./shared";
import { PieceAt, camMap, clamp, driftCam, mixCam, mixRect, onMap } from "./shared";

const DIVE = Easing.bezier(0.3, 0, 0.2, 1);
const SETTLE = Easing.bezier(0.3, 0, 0.25, 1.15);
const GIVE = Easing.bezier(0.33, 0, 0.2, 1);
const LIFT = Easing.bezier(0.22, 1, 0.36, 1);
const CARRY = Easing.bezier(0.45, 0, 0.2, 1);
const PERSP = 1800;

export type DeckSwapProps = {
  brand: Brand;
  canvas: { w: number; h: number };
  view: Rect;
  from: PageSide;
  to: PageSide;
  /** The frame B starts its deal. */
  at: number;
  /** Frames of the swap (default 28). */
  dur?: number;
  /** A piece of A carried onto its matching place on B (page px each), with its corner radius (page px). */
  carry?: { from: Rect; to: Rect; radius?: number; lead?: number };
  settle?: number;
  viewRadius?: number;
};

/** B's vertical offset (canvas px) and dive progress at frame f. */
const dealY = (f: number, at: number, dur: number, view: Rect) => {
  const dive = Math.round(dur * 0.78);
  const start = view.h * 1.04;
  const over = -12;
  if (f < at) return { y: start, p: 0 };
  if (f < at + dive) {
    const p = interpolate(f, [at, at + dive], [0, 1], { ...clamp, easing: DIVE });
    return { y: start + (over - start) * p, p };
  }
  const q = interpolate(f, [at + dive, at + dur], [0, 1], { ...clamp, easing: SETTLE });
  return { y: over * (1 - q), p: 1 };
};

export const DeckSwap: React.FC<DeckSwapProps> = ({ brand, canvas, view, from, to, at, dur = 30, carry, settle = 150, viewRadius = 34 }) => {
  const f = useCurrentFrame();
  const end = at + dur;
  const camB = f <= end ? to.cam : mixCam(to.cam, to.drift ?? { ...to.cam, cw: to.cam.cw * 0.985 }, interpolate(f, [end, end + settle], [0, 1], clamp));
  const camA = driftCam(from, Math.min(f, at), 0, at);

  const give = interpolate(f, [at - 2, end], [0, 1], { ...clamp, easing: GIVE });
  const deal = dealY(f, at, dur, view);
  const flying = f >= at && f < end;
  const arc = Math.sin(Math.PI * deal.p) * 40 * (deal.p < 1 ? 1 : 0);
  const roll = -3.5 * (1 - deal.p);
  const pitch = 10 * (1 - deal.p);
  const seam = flying ? 1 - interpolate(f, [end - 6, end], [0, 1], clamp) : 0;

  const origin = `${view.x + view.w / 2}px ${view.y + view.h / 2}px`;

  // the carried piece
  const lead = carry?.lead ?? 12;
  const lift = carry ? interpolate(f, [at - lead, at], [0, 1], { ...clamp, easing: LIFT }) : 0;
  let piece: React.ReactNode = null;
  if (carry && lift > 0) {
    const mA = camMap(camA, view);
    const startR = onMap(mA, carry.from);
    const raise = 5 * mA.s * lift;
    const P0: Rect = { ...startR, y: startR.y - raise };
    const mB = camMap(camB, view);
    const target = onMap(mB, carry.to);
    // the piece flies on its own calm curve to where its match will rest, and only follows B through the settle
    // (over the whole swap, so B is already under it when it settles; it leans toward B's live position as it
    // nears, travel cubed, so it never drops toward the incoming page early and never waits in the air)
    const travel = interpolate(f, [at, end], [0, 1], { ...clamp, easing: CARRY });
    const targetNow: Rect = { ...target, y: target.y + (f < end ? deal.y * travel ** 3 : 0) };
    const P = mixRect(P0, targetNow, travel);
    const swap = interpolate(travel, [0.55, 0.92], [0, 1], clamp);
    const gone = interpolate(f, [end, end + 12], [0, 1], clamp);
    const rad = ((carry.radius ?? 10) * (mA.s * (1 - travel) + mB.s * travel));
    const rim = lift * (1 - gone);
    const shadow = lift * (1 - gone);
    if (gone < 1) {
      piece = (
        <div style={{ position: "absolute", left: 0, top: 0, width: canvas.w, height: canvas.h, opacity: 1 - gone * gone }}>
          <div style={{ position: "absolute", left: P.x, top: P.y, width: P.w, height: P.h, borderRadius: rad, overflow: "hidden",
            boxShadow: `0 ${(22 * shadow).toFixed(1)}px ${(50 * shadow).toFixed(1)}px rgba(0,0,0,${(0.55 * shadow).toFixed(3)}), 0 0 0 ${(1.6 * rim).toFixed(2)}px ${glow(brand, 0.8 * rim)}, 0 0 ${(50 * rim).toFixed(0)}px ${glow(brand, 0.3 * rim)}` }}>
            {/* B's match underneath at full strength once the cross starts, A's piece fading off the top, so the piece is never see-through */}
            <PieceAt src={to.src} page={to.page} from={carry.to} to={{ x: 0, y: 0, w: P.w, h: (P.w * carry.to.h) / carry.to.w }} style={{ opacity: Math.min(1, swap * 4) }} />
            <PieceAt src={from.src} page={from.page} from={carry.from} to={{ x: 0, y: 0, w: P.w, h: (P.w * carry.from.h) / carry.from.w }} style={{ opacity: 1 - swap }} />
          </div>
        </div>
      );
    }
  }

  return (
    <>
      <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: origin }}>
        {f < end ? (
          <AbsoluteFill style={{ transformOrigin: origin,
            transform: `translateY(${(-0.05 * view.h * give).toFixed(2)}px) translateZ(${(-200 * give).toFixed(2)}px) rotateX(${(8 * give).toFixed(3)}deg)` }}>
            <PageView src={from.src} page={from.page} cam={camA} view={view} brand={brand}>
              {from.mark ? <MarkPatch cam={camA} view={view} spec={{ rect: MARK_BOX, color: from.mark }} /> : null}
              {/* the slot the carried piece left, then the page darkening as it goes under */}
              {carry && lift > 0 ? (() => {
                const s = onMap(camMap(camA, view), carry.from);
                return <div style={{ position: "absolute", left: s.x, top: s.y, width: s.w, height: s.h, borderRadius: (carry.radius ?? 10) * camMap(camA, view).s,
                  background: `rgba(0,0,0,${(0.5 * lift).toFixed(3)})` }} />;
              })() : null}
              <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h, background: `rgba(0,0,0,${(0.6 * give + 0.18 * lift * (1 - give)).toFixed(3)})` }} />
            </PageView>
          </AbsoluteFill>
        ) : null}
        {f >= at ? (
          <AbsoluteFill style={{ transformOrigin: origin,
            transform: `translateY(${deal.y.toFixed(2)}px) translateZ(${arc.toFixed(2)}px) rotateX(${pitch.toFixed(3)}deg) rotateZ(${roll.toFixed(3)}deg)` }}>
            {/* the contact shadow the new page throws on the old one, and its lit top edge */}
            {seam > 0 ? (
              <>
                <div style={{ position: "absolute", left: view.x + 12, top: view.y - 56, width: view.w - 24, height: 56,
                  background: `linear-gradient(to top, rgba(0,0,0,${(0.42 * seam).toFixed(3)}), rgba(0,0,0,${(0.12 * seam).toFixed(3)}) 40%, rgba(0,0,0,0))` }} />
              </>
            ) : null}
            <PageView src={to.src} page={to.page} cam={camB} view={view} brand={brand} radius={viewRadius}>
              {to.mark ? <MarkPatch cam={camB} view={view} spec={{ rect: MARK_BOX, color: to.mark }} /> : null}
              {seam > 0 ? <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: 2, background: `rgba(255,255,255,${(0.22 * seam).toFixed(3)})` }} /> : null}
            </PageView>
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
      {piece}
    </>
  );
};

/** B's camera at frame f, for a following shot. */
export const deckSwapCamB = (to: PageSide, at: number, dur = 30, settle = 150, f = at + dur): PageCam =>
  mixCam(to.cam, to.drift ?? { ...to.cam, cw: to.cam.cw * 0.985 }, interpolate(f, [at + dur, at + dur + settle], [0, 1], clamp));
