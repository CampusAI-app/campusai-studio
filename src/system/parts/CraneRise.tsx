/**
 * crane-rise (2026-10-23, wave 2): the kit CraneRise move (kit/pass/camera/CraneRise.tsx, from shelf shot
 * opening/crane-rise-reveal) as a storyboard part. The camera starts where the shot begins (the previous
 * shot's close-up on the same surface, or `shot.focus` framed tight), holds a breath with a 1.5% push-in,
 * then rises and pulls back on the crane curve (zero-speed start, peak ~19% in, long settling tail) to the
 * shot's last camera key, the whole page. Only `props.row` is lit at the start; the rest of the page sits
 * at 38% and comes back over 28 frames of the rise, and the row keeps a faint accent edge to the end so
 * it can still be found in the whole. After the rise the shot's own camera (ctx.cam) takes over, so the
 * next shot on the same surface hands off without a jump.
 *
 * Numbers from the kit part: hold 24 f, rise 102 f, bezier(0.2, 0, 0.25, 1); others dim 0.62 cleared over
 * 28 f; vignette cleared over 60 f. The page laid out larger, never scaled.
 *
 * Props:
 *   row: Rect            the row the eye starts on, page px (default `shot.focus`).
 *   hold?, rise?: number frames (defaults 24 and 102, the kit's CRANE_TIMING).
 */
import React from "react";
import { Easing, interpolate } from "remotion";
import { glow } from "../../kit/brand";
import type { PageCam } from "../../kit/camera";
import { clampCam, rectOnCanvas } from "../../kit/camera";
import { CRANE_TIMING } from "../../kit/pass/camera/CraneRise";
import { clamp, num, padRect, rectProp, SurfaceView } from "./common";
import type { PartProps } from "./types";

// motion: the kit CraneRise curves, kept so the move reads as the part Jacob kept, not a re-tuned copy
const CRANE = Easing.bezier(0.2, 0, 0.25, 1);
const SMOOTH = Easing.bezier(0.45, 0, 0.55, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);

export const CraneRise: React.FC<PartProps> = ({ shot, surface, brand, f, layout, props, ctx }) => {
  if (!surface) return null;
  const hold = num(props.hold, CRANE_TIMING.hold);
  const rise = num(props.rise, CRANE_TIMING.rise);
  const row = rectProp(props.row) ?? shot.focus;
  const { view } = layout;
  const start = ctx.cam(0);
  const keys = shot.camera ?? [];
  const endKey = keys.length ? keys[keys.length - 1] : null;
  const end: PageCam = endKey ? clampCam(endKey.cam, surface.page, view) : ctx.cam(ctx.dur);
  const t = Math.max(0, f);
  const breath = interpolate(t, [0, hold], [0, 1], { ...clamp, easing: SMOOTH });
  const e = interpolate(t, [hold, hold + rise], [0, 1], { ...clamp, easing: CRANE });
  let cam: PageCam;
  if (t <= hold + rise) {
    const cw0 = start.cw / (1 + 0.015 * breath);
    cam = clampCam({ cx: start.cx + (end.cx - start.cx) * e, cy: start.cy + (end.cy - start.cy) * e, cw: cw0 + (end.cw - cw0) * e }, surface.page, view);
  } else {
    // after the rise the shot's own camera holds it (it drifts, so no frame is a freeze, and the next shot
    // on this surface starts exactly where this one ends); give `camera` one key at (hold + rise) / 30 s
    cam = ctx.cam(t);
  }
  const others = interpolate(t, [hold - 2, hold + 26], [0.62, 0], { ...clamp, easing: OUT });
  const vig = 1 - interpolate(t, [hold, hold + 60], [0, 1], { ...clamp, easing: OUT });
  const edge = interpolate(t, [hold + 20, hold + rise], [1, 0.45], clamp) * (1 - interpolate(t, [ctx.dur - 20, ctx.dur], [0, 1], clamp));
  const r = row ? rectOnCanvas(cam, view, padRect(row, 6)) : null;
  const s = view.w / cam.cw;
  const rad = 10 * s;
  return (
    <SurfaceView surface={surface} brand={brand} layout={layout} cam={cam}>
      {r ? (
        <>
          <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: rad,
            boxShadow: `0 0 0 4000px rgba(11,7,8,${others.toFixed(3)})` }} />
          <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: rad,
            background: glow(brand, 0.06 * edge), boxShadow: `inset 0 0 0 ${Math.max(1.5, 0.9 * s).toFixed(2)}px ${glow(brand, 0.55 * edge)}, 0 0 ${(40 * s * edge).toFixed(1)}px ${glow(brand, 0.18 * edge)}` }} />
        </>
      ) : null}
      {vig > 0.01 ? (
        <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h, opacity: vig,
          background: "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 52%, rgba(0,0,0,.42) 100%)" }} />
      ) : null}
    </SurfaceView>
  );
};
