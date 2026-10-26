/**
 * CardOpensPage (r4, 2026-10-25): a real card on page A lifts, grows to fill the frame, and becomes page B. The
 * card is a window from the start: under its own pixels sits the matching region of B (the Goldman card in the
 * list sits on the Goldman detail's header, the "Plan your Spring 2027 classes" row sits on the planner's Spring
 * 2027 term), so as the window opens, the card's content gives way to the same thing on the next page and the
 * window keeps opening until B is the whole frame.
 *
 * Moves: shared-element transition ("an element in the outgoing view moves and resizes into its matching position
 * in the incoming view"), carried by a container transform ("a card expands its bounds until it is the full
 * screen, its content fading in inside the expanding container"). Close to the chat group's AnswerToPage, which
 * grows a window onto the SAME page coordinates out of a link; this one crosses between two different pages and
 * maps the card onto a chosen region of B, so the match is the content, not the position.
 *
 * Numbers (30 fps, all props):
 *   lead 12 f    the card lifts before it opens: 6 page px up, a 1.5% grow, a soft drop shadow and an accent rim,
 *                the rest of A dims to 0.5 (brightness, no blur) on bezier(0.22, 1, 0.36, 1)
 *   dur 26 f     the open, on bezier(0.65, 0, 0.18, 1): slow while it is still the card, fast through the middle,
 *                a long soft landing. The window goes from the card's rect to the view; the page region inside it
 *                goes from `toRect` (shaped to the card) to what `to.cam` shows, in step, so B never jumps.
 *                The card's own pixels fade 0.08 to 0.45 of the open, kept at their own aspect (top aligned, never
 *                stretched). Radius goes from the card's corner to the view's 34 px.
 *   behind       A pulls back 6% about the card and dims to 0.6 while the window opens, so the card reads as
 *                coming forward off its page, not the page zooming.
 *   after        B eases from `to.cam` toward `to.drift` (default 1.5% in over 150 f). Pass `drift` equal to `cam`
 *                to land and hold exactly on `to.cam`, so the next shot can start there with a cut.
 * Pick `toRect` with roughly the card's aspect (the part reshapes it to the card's aspect about its centre), and
 * keep `to.cam` at or above the capture's DPR limit (cw >= view.w / 2).
 */
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { PageCam, Rect } from "../../camera";
import { PageView } from "../../PageView";
import { MarkPatch, MARK_BOX } from "../../pass/camera/shared";
import type { PageSide } from "./shared";
import { PageMapped, PieceAt, camMap, clamp, driftCam, mapRegion, mixCam, mixRect, onMap, regionOf, widenAbout } from "./shared";

const LIFT = Easing.bezier(0.22, 1, 0.36, 1);
const OPEN = Easing.bezier(0.65, 0, 0.18, 1);

export type CardOpensPageProps = {
  brand: Brand;
  /** The canvas size and the page rectangle on it (both pages share it). */
  canvas: { w: number; h: number };
  view: Rect;
  /** Page A and the card on it (page px) with its corner radius (page px). */
  from: PageSide & { card: Rect; radius?: number };
  /** Page B and the region of it the card turns into (page px). */
  to: PageSide & { toRect: Rect };
  /** The frame the open starts. */
  at: number;
  /** Frames of the open (default 26). */
  dur?: number;
  /** Frames of the lift before it (default 12). */
  lead?: number;
  /** Frames after landing over which B drifts to `to.drift` (default 150). */
  settle?: number;
  /** View corner radius, canvas px (PageView's is 34). */
  viewRadius?: number;
};

export const CardOpensPage: React.FC<CardOpensPageProps> = ({ brand, canvas, view, from, to, at, dur = 26, lead = 12, settle = 150, viewRadius = 34 }) => {
  const f = useCurrentFrame();
  const lift = interpolate(f, [at - lead, at], [0, 1], { ...clamp, easing: LIFT });
  const k = interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: OPEN });
  const done = f >= at + dur;

  // B on its own after the open
  if (done) {
    const camB = mixCam(to.cam, to.drift ?? { ...to.cam, cw: to.cam.cw * 0.985 }, interpolate(f, [at + dur, at + dur + settle], [0, 1], clamp));
    return (
      <PageView src={to.src} page={to.page} cam={camB} view={view} brand={brand}>
        {to.mark ? <MarkPatch cam={camB} view={view} spec={{ rect: MARK_BOX, color: to.mark }} /> : null}
      </PageView>
    );
  }

  // A: its drift up to the open, then pulled back about the card while the window opens
  const c = from.card;
  const baseA: PageCam = driftCam(from, Math.min(f, at), 0, at);
  const camA = widenAbout(baseA, view, c.x + c.w / 2, c.y + c.h / 2, 1 + 0.06 * k);
  const mapA0 = camMap(baseA, view);
  const dimA = 0.5 * lift + 0.2 * k;

  // the window: the lifted card at the open, growing to the view
  const card0 = onMap(mapA0, c);
  const grow = 0.015 * lift;
  const raise = 6 * mapA0.s * lift;
  const W0: Rect = { x: card0.x - (card0.w * grow) / 2, y: card0.y - (card0.h * grow) / 2 - raise, w: card0.w * (1 + grow), h: card0.h * (1 + grow) };
  const W = mixRect(W0, view, k);
  const r0 = (from.radius ?? 12) * mapA0.s;
  const radius = r0 + (viewRadius - r0) * k;

  // the region of B inside the window: toRect shaped to the card, growing to what to.cam shows
  const t = to.toRect;
  const h0 = (t.w * W0.h) / W0.w;
  const R0: Rect = { x: t.x, y: t.y + t.h / 2 - h0 / 2, w: t.w, h: h0 };
  const R = mixRect(R0, regionOf(to.cam, view), k);
  const mapB = mapRegion(R, W);

  const cardFade = 1 - interpolate(k, [0.08, 0.45], [0, 1], clamp);
  const rim = lift * (1 - interpolate(k, [0.3, 0.8], [0, 1], clamp));
  const shadow = lift * (1 - k);

  return (
    <>
      <PageView src={from.src} page={from.page} cam={camA} view={view} brand={brand} dim={0}>
        {from.mark ? <MarkPatch cam={camA} view={view} spec={{ rect: MARK_BOX, color: from.mark }} /> : null}
        {/* the rest of A drops back (a plain darkening, so nothing softens) */}
        {dimA > 0 ? <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h, background: `rgba(0,0,0,${(dimA * 0.75).toFixed(3)})` }} /> : null}
      </PageView>
      {/* the lifted card's shadow and rim, under the window */}
      {lift > 0 ? (
        <div style={{ position: "absolute", left: W.x, top: W.y, width: W.w, height: W.h, borderRadius: radius,
          boxShadow: `0 ${(26 * shadow).toFixed(1)}px ${(60 * shadow).toFixed(1)}px rgba(0,0,0,${(0.6 * shadow).toFixed(3)}), 0 0 0 ${(1.6 * rim).toFixed(2)}px ${glow(brand, 0.75 * rim)}, 0 0 ${(70 * rim).toFixed(0)}px ${glow(brand, 0.28 * rim)}` }} />
      ) : null}
      {/* the window: B underneath, the card's own pixels on top until they give way */}
      <PageMapped src={to.src} page={to.page} map={mapB} clip={W} radius={radius} canvas={canvas} mark={to.mark}
        opacity={k > 0 ? 1 : 0}>
        {cardFade > 0 ? <PieceAt src={from.src} page={from.page} from={c} to={{ x: W.x, y: W.y, w: W.w, h: (W.w * c.h) / c.w }}
          style={{ opacity: cardFade, maskImage: "linear-gradient(to bottom, #000 82%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, #000 82%, transparent)" }} /> : null}
      </PageMapped>
      {k === 0 && lift > 0 ? (
        <PieceAt src={from.src} page={from.page} from={c} to={W} fill style={{ borderRadius: radius }} />
      ) : null}
    </>
  );
};

/** The camera B rests on at frame f (for a following shot that wants to continue from it). */
export const cardOpensPageCamB = (to: PageSide, at: number, dur = 26, settle = 150, f = at + dur): PageCam =>
  mixCam(to.cam, to.drift ?? { ...to.cam, cw: to.cam.cw * 0.985 }, interpolate(f, [at + dur, at + dur + settle], [0, 1], clamp));
