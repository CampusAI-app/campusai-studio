/**
 * Spotlight (round 4, 2026-10-25): one element on a real page stays lit while the rest of the page dims and
 * softens around it. The light closes in from the whole frame onto the element like a stage pool narrowing,
 * holds, then opens back out and the page comes up clean. A short label naming the element sits in the
 * caption band below the footage. One subject only.
 *
 * Where it came from: the shelf shot `spotlight-hero-card` (its card-shaped soft hole: a tight blur on the
 * card's shape plus a faint wide spill, so light falls off instead of stopping at an edge), without its 3D
 * lift and beam laps. Dictionary: limelight / iris-in to a subject. Different from the kit FocusWalk on
 * purpose: FocusWalk walks the camera between several regions with a hard-edged lit box; Spotlight never
 * walks, the camera only leans in a few percent, and the light itself is the move.
 *
 * Numbers (30 fps):
 * - close 20 frames on EASE_CAMERA: the pool shrinks from the whole view (padded 30%) to the element padded
 *   `pad` page px, while the page outside dims to `dim` (default 0.62: brightness 0.55, saturation 0.63, blur
 *   1.9 px, PageView's own treatment),
 * - feather 14 page px on the pool edge, a 16% spill 2.6x wider,
 * - the camera leans `push` (default 5%) toward the element over close + hold, linear after the close, so the
 *   hold never freezes; the release eases it back to where it started,
 * - the label rises in at the end of the close and holds at least letters / 15 + 1.5 s (the hold is
 *   lengthened to fit it if needed), out 6 frames before the release,
 * - release 22 frames: the pool opens back past the frame edge and the dim clears together.
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { glow, useBrandFonts } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { clampCam, mixCam, rectOnCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { EASE_CAMERA } from "../../../lib/anim";
import type { MarkPatchSpec } from "../../pass/camera/shared";
import { MarkPatch } from "../../pass/camera/shared";
import { CaptionBand, clamp, featherMask, LitCrop, mixRect, padRect, readFramesFor } from "./shared";

export type SpotlightProps = {
  src: string;
  page: Size;
  view: Rect;
  brand: Brand;
  /** The framing before and after the light (page px). */
  cam: PageCam;
  /** The one element, page px. */
  target: Rect;
  /** Frame the light starts closing. */
  at?: number;
  /** Frames the pool takes to close and to open. */
  close?: number;
  release?: number;
  /** Frames held fully lit (lengthened to the label's reading time if shorter). */
  hold?: number;
  dim?: number;
  /** Page px of air around the element inside the pool, and its corner radius. */
  pad?: number;
  radius?: number;
  feather?: number;
  push?: number;
  /** The element's name, in the product's words. Shown in the caption band below the view. */
  label?: string;
  labelBand?: { y: number; size: number };
  mark?: MarkPatchSpec | null;
};

/** The frames a Spotlight occupies: when the light is fully closed, when it starts to open, when it is gone. */
export const spotlightTiming = (o: { at?: number; close?: number; hold?: number; release?: number; label?: string }) => {
  const at = o.at ?? 0;
  const close = o.close ?? 20;
  const release = o.release ?? 22;
  const hold = Math.max(o.hold ?? 60, o.label ? readFramesFor(o.label) + 10 : 0);
  const lit = at + close;
  const open = lit + hold;
  return { at, close, release, hold, lit, open, end: open + release };
};

export const Spotlight: React.FC<SpotlightProps> = ({
  src, page, view, brand, cam: base, target, at, close, release, hold, dim = 0.62, pad = 10, radius = 14, feather = 14, push = 0.05,
  label, labelBand, mark = null,
}) => {
  useBrandFonts(brand);
  const f = useCurrentFrame();
  const T = spotlightTiming({ at, close, hold, release, label });

  // the light: 0 open, 1 closed on the element
  const shut = interpolate(f, [T.at, T.lit], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const openK = interpolate(f, [T.open, T.end], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const k = shut * (1 - openK);

  // the camera leans toward the element: eased through the close, linear through the hold, eased home
  // it leans a third of the way toward the element, never re-centres on it
  const leanTo = clampCam({ cx: base.cx + (target.x + target.w / 2 - base.cx) * 0.33, cy: base.cy + (target.y + target.h / 2 - base.cy) * 0.33, cw: base.cw * (1 - push) }, page, view);
  const lean = interpolate(f, [T.at, T.lit], [0, 0.55], { ...clamp, easing: EASE_CAMERA })
    + interpolate(f, [T.lit, T.open], [0, 0.45], clamp);
  const cam = clampCam(mixCam(base, leanTo, lean * (1 - openK)), page, view);
  const s = view.w / cam.cw;

  // the pool, in page px: from the whole view (padded) to the element (padded)
  const viewInPage: Rect = { x: cam.cx - cam.cw / 2, y: cam.cy - (cam.cw * view.h) / view.w / 2, w: cam.cw, h: (cam.cw * view.h) / view.w };
  const wide = padRect(viewInPage, cam.cw * 0.3);
  const tight = padRect(target, pad);
  const pool = mixRect(wide, tight, k);
  const poolC = rectOnCanvas(cam, view, pool);
  const local: Rect = { x: poolC.x - view.x, y: poolC.y - view.y, w: poolC.w, h: poolC.h };
  const rx = (radius + pad + (1 - k) * 260) * s;
  const mask = featherMask(view.w, view.h, local, rx, feather * s);

  const d = dim * k;
  const rim = rectOnCanvas(cam, view, tight);
  const labelFrom = T.lit - 4;
  const labelTo = T.open - 6;
  const band = labelBand ?? { y: view.y + view.h + 90, size: 46 };

  return (
    <>
      <PageView src={src} page={page} cam={cam} view={view} brand={brand} dim={d}>
        {d > 0.004 ? (
          <LitCrop src={src} page={page} cam={cam} view={view} clip={view}
            style={{ WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }} />
        ) : null}
        {/* a hairline of the product's own light on the pool edge, only once it has closed */}
        {k > 0.6 ? (
          <div style={{ position: "absolute", left: rim.x, top: rim.y, width: rim.w, height: rim.h, borderRadius: (radius + pad) * s,
            boxShadow: `inset 0 0 0 ${Math.max(1, 0.7 * s).toFixed(2)}px rgba(255,255,255,${(0.12 * (k - 0.6) / 0.4).toFixed(3)}), 0 0 ${(60 * s).toFixed(0)}px ${glow(brand, 0.16 * (k - 0.6) / 0.4)}` }} />
        ) : null}
        <MarkPatch cam={cam} view={view} spec={mark} />
      </PageView>
      {label ? <CaptionBand text={label} f={f} from={labelFrom} to={labelTo} brand={brand} y={band.y} size={band.size} /> : null}
    </>
  );
};
