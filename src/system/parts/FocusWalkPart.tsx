/**
 * focus-walk (2026-10-23, wave 2 round 2): the kit FocusWalk (kit/pass/camera/FocusWalk.tsx, from Raylight's
 * "Desktop app presentation"; Jacob favorited it on 2026-10-23) as a storyboard part. One real screen held in
 * frame while the light walks it: a lit region moves from part to part and everything outside it dims and
 * softens. The camera follows `shot.camera` (ctx.cam), so a film can keep the frame's edges on gaps in the page
 * and still walk several rows; the lit region does the walking.
 *
 * Differences from page-walk, on purpose: the dim is held for the whole shot (page-walk lets it rise and fall
 * each shot, which pulses on a run of short shots), and it can start already dim, so text the frame edge cuts
 * is never shown sharp. At `dim` 0.85 the rest of the page is darkened and blurred to a texture (PageView).
 *
 * Props (page px; times in seconds after the shot starts):
 *   stops: { rect: Rect, at: number }[]   the lit region arrives at `rect` at `at` (it travels for DUR.reframe before)
 *   dim?: number                          how dark the rest sits. Default 0.5 (the kit's).
 *   dimIn?: boolean                       ramp the dim in over the first DUR.reframe frames. Default false.
 *   dimOut?: boolean                      ramp it out over the last DUR.reframe frames. Default false.
 *   pressRect?: Rect                      with `shot.press`: the element that lifts on the press (as page-walk).
 */
import React from "react";
import { Img } from "remotion";
import { glow } from "../../kit/brand";
import type { Rect } from "../../kit/camera";
import { rectOnCanvas, toCanvas } from "../../kit/camera";
import { PointerAt } from "../../kit/Pointer";
import { CURVE, DUR, FPS } from "../motion";
import { asset, mixRect, num, ramp, rectProp, SurfaceView } from "./common";
import type { PartProps } from "./types";

type Stop = { rect: Rect; at: number };

export const FocusWalkPart: React.FC<PartProps> = ({ shot, surface, brand, f, layout, props, ctx }) => {
  if (!surface) return null;
  const cam = ctx.cam(f);
  const { view } = layout;
  const stops = (Array.isArray(props.stops) ? props.stops : []) as Stop[];
  let spot: Rect | undefined = stops[0]?.rect ?? shot.focus;
  for (let i = 1; i < stops.length; i++) {
    const at = stops[i].at * FPS;
    const k = ramp(f, at - DUR.reframe, at, CURVE.quiet.standard);
    if (k > 0) spot = mixRect(stops[i - 1].rect, stops[i].rect, k);
  }
  const dimTo = num(props.dim, 0.5);
  const inK = props.dimIn === true ? ramp(f, 0, DUR.reframe) : 1;
  const outK = props.dimOut === true ? 1 - ramp(f, ctx.dur - DUR.reframe, ctx.dur) : 1;
  const dim = dimTo * inK * outK;

  // a press, drawn the way page-walk draws it (the pointer arrives early, squashes; the element lifts lightly)
  const press = shot.press;
  let pointer: React.ReactNode = null;
  let lifted: React.ReactNode = null;
  if (press) {
    const pf = press.at * FPS;
    const target = toCanvas(cam, view, press.x, press.y);
    const start = { x: target.x + 0.2 * layout.W, y: target.y + 0.16 * layout.H };
    const g = ramp(f, pf - 4 - DUR.travel, pf - 4, CURVE.quiet.standard);
    const shown = ramp(f, pf - 4 - DUR.travel - DUR.small, pf - 4 - DUR.travel + DUR.panel) * (1 - ramp(f, ctx.dur - DUR.panel, ctx.dur));
    const since = f >= pf && f - pf < FPS ? (f - pf) / FPS : null;
    pointer = shown > 0.01 ? (
      <PointerAt x={start.x + (target.x - start.x) * g} y={start.y + (target.y - start.y) * g} since={since} accent={brand.color.accent}
        size={58 * layout.u} opacity={shown} />
    ) : null;
    const pr = rectProp(props.pressRect);
    if (pr) {
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
  // SurfaceView paints patches with the dim filter even inside the lit region; a patch that sits in the lit
  // region (and gives its own colour) is painted again here, undimmed, so it reads as the page and not a dark bar
  const litPatches = dim > 0.005 && spot
    ? (surface.patch ?? []).filter((p) => p.color && p.x >= spot.x - 8 && p.y >= spot.y - 8 && p.x + p.w <= spot.x + spot.w + 8 && p.y + p.h <= spot.y + spot.h + 8)
    : [];
  return (
    <SurfaceView surface={surface} brand={brand} layout={layout} cam={cam} dim={dim} spot={spot}>
      {litPatches.map((p, i) => {
        const r = rectOnCanvas(cam, view, p);
        return <div key={`lp${i}`} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, background: p.color }} />;
      })}
      {lifted}
      {pointer}
    </SurfaceView>
  );
};
