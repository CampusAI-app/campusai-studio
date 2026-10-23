/**
 * page-walk (2026-10-23): the real page big through the kit PageView and page camera. The camera
 * follows `shot.camera` keys or frames `shot.focus`; holds drift. Optional:
 *   - a press (`shot.press`): the kit PointerAt glides in, arrives early, squashes and drops its ring,
 *     and the pressed element lifts lightly off the page (3.5% and a soft shadow, quiet curves);
 *   - `dim` around the focus, the way the kit FocusWalk lights one region and softens the rest.
 *
 * Props:
 *   dim?: number          0 to 1, how far the page outside `focus` dims (FocusWalk uses 0.5). Default 0.
 *   pressRect?: Rect      the element that lifts on the press, page px. Default: 150 x 40 around the press.
 *   lift?: boolean        lift the pressed element. Default true.
 *   pointerFrom?: {x,y}   where the pointer starts, page px. Default: down and right of the press.
 */
import React from "react";
import { Img } from "remotion";
import { glow } from "../../kit/brand";
import { rectOnCanvas, toCanvas } from "../../kit/camera";
import { PointerAt } from "../../kit/Pointer";
import { CURVE, DUR, FPS } from "../motion";
import { asset, num, ramp, rectProp, SurfaceView } from "./common";
import type { PartProps } from "./types";

export const PageWalk: React.FC<PartProps> = ({ shot, surface, brand, f, layout, props, ctx }) => {
  if (!surface) return null;
  const cam = ctx.cam(f);
  const { view } = layout;
  const dimTo = num(props.dim, 0);
  // the light comes up as the camera arrives and goes back down before a handoff, so nothing pops at the boundary
  const dimOut = ctx.handoff.out === "camera-whip" || ctx.handoff.out === "cut" ? 1 : 1 - ramp(f, ctx.dur - DUR.reframe, ctx.dur);
  const dim = dimTo * ramp(f, DUR.panel, DUR.panel + DUR.reframe) * dimOut;

  const press = shot.press;
  let pointer: React.ReactNode = null;
  let lifted: React.ReactNode = null;
  if (press) {
    const pf = press.at * FPS;
    const from = (props.pointerFrom as { x: number; y: number } | undefined) ?? null;
    const target = toCanvas(cam, view, press.x, press.y);
    const start = from ? toCanvas(cam, view, from.x, from.y) : { x: target.x + 0.2 * layout.W, y: target.y + 0.16 * layout.H };
    // arrive early: the glide ends 4 frames before the press
    const g = ramp(f, pf - 4 - DUR.travel, pf - 4, CURVE.quiet.standard);
    const shown = ramp(f, pf - 4 - DUR.travel - DUR.small, pf - 4 - DUR.travel + DUR.panel) * (1 - ramp(f, ctx.dur - DUR.panel, ctx.dur));
    const since = f >= pf && f - pf < FPS ? (f - pf) / FPS : null;
    pointer = shown > 0.01 ? (
      <PointerAt x={start.x + (target.x - start.x) * g} y={start.y + (target.y - start.y) * g} since={since} accent={brand.color.accent}
        size={58 * layout.u} opacity={shown} />
    ) : null;
    if (props.lift !== false) {
      const pr = rectProp(props.pressRect) ?? { x: press.x - 75, y: press.y - 20, w: 150, h: 40 };
      const k = ramp(f, pf + DUR.press, pf + DUR.press + DUR.panel, CURVE.quiet.enter) * (1 - ramp(f, ctx.dur - DUR.panel, ctx.dur));
      if (k > 0.001) {
        const r = rectOnCanvas(cam, view, pr);
        const s = view.w / cam.cw;
        const o = toCanvas(cam, view, 0, 0);
        lifted = (
          <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 9 * s, overflow: "hidden",
            transform: `translateY(${(-6 * layout.u * k).toFixed(2)}px) scale(${(1 + 0.035 * k).toFixed(4)})`,
            boxShadow: `0 ${(18 * k).toFixed(1)}px ${(40 * k).toFixed(1)}px rgba(0,0,0,${(0.55 * k).toFixed(3)}), 0 0 ${(36 * k).toFixed(0)}px ${glow(brand, 0.28 * k)}` }}>
            <Img src={asset(surface.src)} style={{ position: "absolute", left: o.x - r.x, top: o.y - r.y, width: surface.page.w * s, height: surface.page.h * s, maxWidth: "none" }} />
          </div>
        );
      }
    }
  }
  return (
    <SurfaceView surface={surface} brand={brand} layout={layout} cam={cam} dim={dim} spot={shot.focus}>
      {lifted}
      {pointer}
    </SurfaceView>
  );
};
