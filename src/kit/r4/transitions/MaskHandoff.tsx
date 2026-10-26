/**
 * MaskHandoff (r4, 2026-10-25): a real control on page A (a button, a chip, a pill) is pressed and opens up into
 * page B. B is revealed through the control's own shape: its rounded rect grows from the control to the whole
 * frame with a crisp edge, and for the first beats the inside still wears the control's own surface and label, so
 * what the eye sees is the button opening, not a wipe passing over it.
 *
 * Moves: matte reveal through a shape ("the next shot shows through a shape that grows out of an element in the
 * outgoing shot"), from the shelf's shot-transitions "portal mask wipe" and the kit's CircleHandoff (iris through
 * a round element, ported from circle-match-iris). Different on purpose: the mask is the control's own rounded
 * rect, not a circle, B holds its place and does not travel, and the control's surface and label ride the first
 * part of the open so it reads as the control itself unfolding.
 *
 * Numbers (30 fps, all props):
 *   lead 16 f    focus: the rest of A darkens to 0.42 (no blur); the control keeps its light and gains a thin accent
 *                rim. With `pointer`, the kit pointer glides in on the camera curve and presses at at - 6 (its own
 *                squash and ring), and the control dips 3% on the press.
 *   dur 24 f     the open on bezier(0.7, 0, 0.16, 1): slow while it is still the control, then it opens fast and
 *                lands softly. Mask rect from the control to the view, corner from the control's (a pill is
 *                h / 2) to the view's 34 px, kept crisp with clip-path (no blur, no feather).
 *                Inside: B on its own camera, starting 5% tight about the mask centre and settling to `to.cam`
 *                on the same curve (the depth that sells "opening"); over it the control's surface colour 1 to 0
 *                across 0 to 0.4 of the open, and the control's label held at its own size and place, fading over
 *                0 to 0.22. A thin accent rim rides the edge and lets go across 0.55 to 1.
 *   behind       A pulls back 5% about the control and keeps darkening while the mask opens.
 *   after        B eases from `to.cam` toward `to.drift` (default 1.5% in over 150 f); pass drift = cam to hold.
 * Give `surface` as the control's own fill, sampled from the capture (the dashboard's "Open My Calendar" pill is
 * rgb(41, 24, 32)). Only show a press that the product really does: the control has to open that page.
 */
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { PageCam, Rect } from "../../camera";
import { PageView } from "../../PageView";
import { PointerAt } from "../../Pointer";
import { EASE_CAMERA } from "../../../lib/anim";
import { MarkPatch, MARK_BOX } from "../../pass/camera/shared";
import type { PageSide } from "./shared";
import { PageMapped, PieceAt, camMap, clamp, driftCam, mixCam, mixRect, onMap, roundClip, widenAbout } from "./shared";

const OPEN = Easing.bezier(0.7, 0, 0.16, 1);
const FOCUS = Easing.bezier(0.22, 1, 0.36, 1);

export type MaskHandoffProps = {
  brand: Brand;
  canvas: { w: number; h: number };
  view: Rect;
  /** Page A and the control on it (page px), its corner radius (page px; default h / 2, a pill) and its fill. */
  from: PageSide & { control: Rect; radius?: number; surface: string };
  to: PageSide;
  /** The frame the mask starts opening. */
  at: number;
  /** Frames of the open (default 24). */
  dur?: number;
  /** Frames of the focus before it (default 16). */
  lead?: number;
  /** Show the kit pointer gliding in from this canvas offset (relative to the control's centre) and pressing. */
  pointer?: { dx: number; dy: number; travel?: number };
  settle?: number;
  viewRadius?: number;
};

export const MaskHandoff: React.FC<MaskHandoffProps> = ({ brand, canvas, view, from, to, at, dur = 24, lead = 16, pointer, settle = 150, viewRadius = 34 }) => {
  const f = useCurrentFrame();
  const focus = interpolate(f, [at - lead, at - 4], [0, 1], { ...clamp, easing: FOCUS });
  const k = interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: OPEN });
  const pressAt = at - 6;
  const done = f >= at + dur;

  if (done) {
    const camB = mixCam(to.cam, to.drift ?? { ...to.cam, cw: to.cam.cw * 0.985 }, interpolate(f, [at + dur, at + dur + settle], [0, 1], clamp));
    return (
      <PageView src={to.src} page={to.page} cam={camB} view={view} brand={brand}>
        {to.mark ? <MarkPatch cam={camB} view={view} spec={{ rect: MARK_BOX, color: to.mark }} /> : null}
      </PageView>
    );
  }

  const c = from.control;
  const cxP = c.x + c.w / 2;
  const cyP = c.y + c.h / 2;
  const baseA = driftCam(from, Math.min(f, at), 0, at);
  const camA = widenAbout(baseA, view, cxP, cyP, 1 + 0.05 * k);
  const ctl = onMap(camMap(camA, view), c);
  const ctl0 = onMap(camMap(baseA, view), c);
  const dip = f >= pressAt && k === 0 ? 0.03 * (1 - interpolate(f, [pressAt + 2, at], [0, 1], clamp)) : 0;
  const ctlNow: Rect = { x: ctl.x + (ctl.w * dip) / 2, y: ctl.y + (ctl.h * dip) / 2, w: ctl.w * (1 - dip), h: ctl.h * (1 - dip) };

  // the mask: the control at the open, growing to the view
  const M = mixRect(ctl0, view, k);
  const rad0 = (from.radius ?? c.h / 2) * camMap(baseA, view).s;
  const radius = rad0 + (viewRadius - rad0) * k;

  // B inside: 5% tight about the mask centre, settling to its rest camera on the same curve
  const mid = { x: M.x + M.w / 2, y: M.y + M.h / 2 };
  const restMap = camMap(to.cam, view);
  const atMid = { x: (mid.x - restMap.x) / restMap.s, y: (mid.y - restMap.y) / restMap.s };
  const camB = widenAbout(to.cam, view, atMid.x, atMid.y, 1 / (1.05 - 0.05 * k));
  const mapB = camMap(camB, view);

  const dimA = 0.42 * focus + 0.25 * k;
  const surface = 1 - interpolate(k, [0, 0.4], [0, 1], clamp);
  const label = 1 - interpolate(k, [0, 0.22], [0, 1], clamp);
  const rimIn = k > 0 ? 1 : focus;
  const rim = rimIn * (1 - interpolate(k, [0.55, 1], [0, 1], clamp));

  // the pointer: glides in over the focus beat, presses, then leaves with the open
  const travel = pointer?.travel ?? lead + 10;
  const pk = interpolate(f, [pressAt - travel, pressAt - 2], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const pTip = { x: ctl0.x + ctl0.w * 0.62, y: ctl0.y + ctl0.h * 0.55 };
  const pPos = pointer ? { x: pTip.x + pointer.dx * (1 - pk), y: pTip.y + pointer.dy * (1 - pk) } : pTip;
  const pOpacity = pointer ? interpolate(f, [pressAt - travel, pressAt - travel + 6], [0, 1], clamp) * (1 - interpolate(k, [0, 0.25], [0, 1], clamp)) : 0;

  return (
    <>
      <PageView src={from.src} page={from.page} cam={camA} view={view} brand={brand}>
        {from.mark ? <MarkPatch cam={camA} view={view} spec={{ rect: MARK_BOX, color: from.mark }} /> : null}
        {dimA > 0 ? <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h, background: `rgba(0,0,0,${(dimA * 0.8).toFixed(3)})` }} /> : null}
      </PageView>
      {/* the control keeps its light through the focus, and dips on the press */}
      {k === 0 && focus > 0 ? (
        <>
          <PieceAt src={from.src} page={from.page} from={c} to={ctlNow} fill style={{ borderRadius: rad0 }} />
          <div style={{ position: "absolute", left: ctlNow.x, top: ctlNow.y, width: ctlNow.w, height: ctlNow.h, borderRadius: rad0,
            boxShadow: `0 0 0 ${(1.6 * rim).toFixed(2)}px ${glow(brand, 0.8 * rim)}, 0 0 ${(40 * rim).toFixed(0)}px ${glow(brand, 0.3 * rim)}` }} />
        </>
      ) : null}
      {k > 0 ? (
        <>
          <PageMapped src={to.src} page={to.page} map={mapB} clip={M} radius={radius} canvas={canvas} mark={to.mark}>
            {/* the control's own surface and label, riding the first part of the open */}
            {surface > 0 ? <div style={{ position: "absolute", left: M.x, top: M.y, width: M.w, height: M.h, background: from.surface, opacity: surface }} /> : null}
            {label > 0 ? <PieceAt src={from.src} page={from.page} from={c} to={{ x: mid.x - ctl0.w / 2, y: mid.y - ctl0.h / 2, w: ctl0.w, h: ctl0.h }} style={{ opacity: label }} /> : null}
          </PageMapped>
          {rim > 0 ? (
            <div style={{ position: "absolute", left: 0, top: 0, width: canvas.w, height: canvas.h, clipPath: roundClip({ x: M.x - 3, y: M.y - 3, w: M.w + 6, h: M.h + 6 }, radius + 3, canvas) }}>
              <div style={{ position: "absolute", left: M.x, top: M.y, width: M.w, height: M.h, borderRadius: radius,
                boxShadow: `0 0 0 ${(1.6 * rim).toFixed(2)}px ${glow(brand, 0.85 * rim)}` }} />
            </div>
          ) : null}
        </>
      ) : null}
      {pOpacity > 0 ? <PointerAt x={pPos.x} y={pPos.y} since={f >= pressAt ? (f - pressAt) / 30 : null} accent={brand.color.accent} opacity={pOpacity} /> : null}
    </>
  );
};

/** B's camera at frame f, for a following shot. */
export const maskHandoffCamB = (to: PageSide, at: number, dur = 24, settle = 150, f = at + dur): PageCam =>
  mixCam(to.cam, to.drift ?? { ...to.cam, cw: to.cam.cw * 0.985 }, interpolate(f, [at + dur, at + dur + settle], [0, 1], clamp));
