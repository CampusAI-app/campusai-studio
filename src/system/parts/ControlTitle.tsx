/**
 * control-title (2026-10-23): the product's own control is the title card (the What Ships finding:
 * winners open on something pressable). The real button, cropped from the capture, sits enlarged to
 * headline size over its own page (dimmed, in context, never on black), holds, the pointer presses
 * it, and as it is pressed it flies back down into its slot while the page brightens around it: the
 * frame carries into the page it belongs to. The camera then settles on `shot.focus`.
 *
 * Props:
 *   rect: Rect           the control, page px (required; falls back to `shot.focus`).
 *   pressAt?: number     seconds after the shot starts. Default 1.4 (or `shot.press.at`).
 *   width?: number       title width as a share of the view. Default 0.62, capped at 1.6x the
 *                        capture's sharp zoom so the label stays crisp enough to read.
 *   dim?: number         how dark the page sits under the title. Default 0.82.
 */
import React from "react";
import { Img, interpolate, spring } from "remotion";
import { glow } from "../../kit/brand";
import { rectOnCanvas } from "../../kit/camera";
import { PointerAt } from "../../kit/Pointer";
import { CURVE, DUR, FPS, SPRING } from "../motion";
import { asset, clamp, mixRect, num, ramp, rectProp, SurfaceView } from "./common";
import type { PartProps } from "./types";

export const ControlTitle: React.FC<PartProps> = ({ shot, surface, brand, f, layout, props, ctx }) => {
  const rect = rectProp(props.rect) ?? shot.focus;
  if (!surface || !rect) return null;
  const cam = ctx.cam(f);
  const { view, u } = layout;
  const dpr = surface.dpr ?? 2;
  const pf = num(props.pressAt, shot.press?.at ?? 1.4) * FPS;

  // the title: enlarged, centred a little above the middle of the view
  const sTitle = Math.min((num(props.width, 0.62) * view.w) / rect.w, dpr * 1.6);
  const tw = rect.w * sTitle;
  const th = rect.h * sTitle;
  const titleRect = { x: view.x + (view.w - tw) / 2, y: view.y + view.h * 0.44 - th / 2, w: tw, h: th };
  const slot = rectOnCanvas(cam, view, rect);

  const arrive = spring({ frame: f - 2, fps: FPS, config: SPRING.land });
  // the carry: starts once the press has released, travels on the quiet camera curve
  const carryAt = pf + DUR.press + 3;
  const carry = ramp(f, carryAt, carryAt + DUR.travel, CURVE.quiet.standard);
  const r = mixRect(titleRect, slot, carry);
  const sNow = r.w / rect.w;
  const squash = f >= pf ? interpolate((f - pf) / FPS, [0, 0.08, 0.25], [0.94, 0.94, 1], clamp) : 1;
  const scale = (0.9 + 0.1 * arrive) * squash;
  const dim = num(props.dim, 0.82) * (1 - carry);
  const lit = 1 - carry;

  // the pointer glides onto the title, presses, then rides the button home and leaves
  const target = { x: r.x + r.w * 0.5, y: r.y + r.h * 0.62 };
  const start = { x: titleRect.x + tw * 0.5 + 0.22 * layout.W, y: titleRect.y + th * 0.62 + 0.2 * layout.H };
  const g = ramp(f, pf - 4 - DUR.travel, pf - 4, CURVE.quiet.standard);
  const px = f < carryAt ? start.x + (titleRect.x + tw * 0.5 - start.x) * g : target.x;
  const py = f < carryAt ? start.y + (titleRect.y + th * 0.62 - start.y) * g : target.y;
  const pShown = ramp(f, pf - 4 - DUR.travel - DUR.small, pf - 4 - DUR.travel + DUR.panel) * (1 - ramp(f, carryAt + DUR.travel * 0.5, carryAt + DUR.travel));
  const since = f >= pf && f - pf < FPS ? (f - pf) / FPS : null;

  return (
    <>
      <SurfaceView surface={surface} brand={brand} layout={layout} cam={cam} dim={dim} />
      {carry < 0.999 ? (
        <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 7 * sNow, overflow: "hidden",
          opacity: Math.min(1, arrive * 1.6), transform: `scale(${scale.toFixed(4)})`,
          filter: arrive < 0.98 ? `blur(${((1 - arrive) * 10).toFixed(2)}px)` : undefined,
          boxShadow: `0 ${(30 * u * lit).toFixed(1)}px ${(80 * u * lit).toFixed(1)}px rgba(0,0,0,${(0.6 * lit).toFixed(3)}), 0 0 ${(90 * u * lit).toFixed(0)}px ${glow(brand, 0.3 * lit)}` }}>
          {/* the same capture, drawn at the title's zoom: in its slot it lines up pixel for pixel with the page */}
          <Img src={asset(surface.src)} style={{ position: "absolute", left: -rect.x * sNow, top: -rect.y * sNow, width: surface.page.w * sNow,
            height: surface.page.h * sNow, maxWidth: "none" }} />
        </div>
      ) : null}
      {pShown > 0.01 ? <PointerAt x={px} y={py} since={since} accent={brand.color.accent} size={64 * u} opacity={pShown} /> : null}
    </>
  );
};
