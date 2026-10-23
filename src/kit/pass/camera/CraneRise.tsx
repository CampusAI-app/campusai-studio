/**
 * CraneRise (2026-10-22): the camera starts tight on one real row, holds a breath, then rises and
 * pulls back to reveal the whole real page. "The row you were looking at is one piece of this."
 *
 * Ported from shelf shot opening/crane-rise-reveal (CraneRiseReveal.tsx, video-shotcraft). Kept:
 * - start at 3.0x the end framing (capped so the capture is never shown past its own DPR),
 * - a 24 frame close-up hold with a 1.5% breath push-in,
 * - a 102 frame rise on bezier(0.2, 0, 0.25, 1): zero-speed start, peak speed ~19% in, long tail
 *   that settles at the top (the crane feel), scale and focus point sharing the one curve,
 * - only the tracked row is lit in the close-up; the rest of the page sits at 38% and comes back
 *   to full over 28 frames from the start of the rise,
 * - a framing vignette in the close-up that clears over 60 frames of the rise,
 * - camera motion blur only while the move is fast (rise frames 1 to ~40), never on the slow tail,
 * - the page's shadow growing to its resting height as it lands, "an object on a stage".
 * Changed: the world is a real capture through the kit's PageView (laid out larger, never scaled);
 * the shelf's invented row-sweeps, KPI counter and status flip are dropped (no invented data);
 * the tracked row keeps a faint accent outline at the end so it can still be found in the whole.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { clampCam, rectOnCanvas } from "../../camera";
import { PageView } from "../../PageView";
import type { MarkPatchSpec } from "./shared";
import { MarkPatch, hexA, padRect } from "./shared";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CRANE = Easing.bezier(0.2, 0, 0.25, 1);
const SMOOTH = Easing.bezier(0.45, 0, 0.55, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);

export type CraneTiming = {
  /** Close-up hold with the breath, frames (shelf: 24). */
  hold: number;
  /** The rise, frames (shelf: 102). */
  rise: number;
  /** Rise frames wrapped in motion blur (shelf: 40). 0 turns it off. */
  blur: number;
};
export const CRANE_TIMING: CraneTiming = { hold: 24, rise: 102, blur: 40 };

type Props = {
  src: string;
  page: Size;
  /** The row to start on, page px (a layer box). */
  start: Rect;
  /** The end framing. Defaults to the whole page width, centred. */
  end?: PageCam;
  view: Rect;
  brand: Brand;
  at?: number;
  timing?: CraneTiming;
  /** Start zoom relative to the end framing (shelf: 3.0). */
  startZoom?: number;
  /** Capture pixel density; the close-up never magnifies past it. */
  dpr?: number;
  mark?: MarkPatchSpec | null;
};

const camAt = (f: number, p: Required<Pick<Props, "page" | "start" | "view" | "startZoom" | "dpr">> & { end: PageCam; at: number; timing: CraneTiming }) => {
  const { page, start, view, end, at, timing, startZoom, dpr } = p;
  const t = f - at;
  const s0max = end.cw / Math.max(view.w / dpr, 1);
  const s0 = Math.min(startZoom, s0max);
  const cw0 = end.cw / s0;
  // anchor: the row centred if it fits, else its left edge just inside the frame (the shelf's tracked mark)
  const cx0 = start.w <= cw0 * 0.9 ? start.x + start.w / 2 : start.x - cw0 * 0.04 + cw0 / 2;
  const cy0 = start.y + start.h / 2;
  const breath = interpolate(t, [0, timing.hold], [0, 1], { ...clamp, easing: SMOOTH });
  const e = interpolate(t, [timing.hold, timing.hold + timing.rise], [0, 1], { ...clamp, easing: CRANE });
  const sA = s0 * (1 + 0.015 * breath);
  const s = sA + (1 - sA) * e;
  // after the landing the camera keeps a 0.6% drift so the last frame is never a freeze
  const tail = interpolate(t, [timing.hold + timing.rise, timing.hold + timing.rise + 60], [0, 0.006], clamp);
  const a = clampCam({ cx: cx0, cy: cy0, cw: cw0 }, page, view);
  const cam = { cx: a.cx + (end.cx - a.cx) * e, cy: a.cy + (end.cy - a.cy) * e, cw: end.cw / s / (1 + tail) };
  return { cam: clampCam(cam, page, view), e, t };
};

const Scene: React.FC<Props & { end: PageCam; at: number; timing: CraneTiming; startZoom: number; dpr: number }> = (p) => {
  const f = useCurrentFrame();
  const { src, page, view, brand, start, timing, mark = null } = p;
  const { cam, t } = camAt(f, p);
  // the rest of the page at 38% in the close-up, back to full over 28 frames of the rise
  const others = interpolate(t, [timing.hold - 2, timing.hold + 26], [0.62, 0], { ...clamp, easing: OUT });
  const vig = 1 - interpolate(t, [timing.hold, timing.hold + 60], [0, 1], { ...clamp, easing: OUT });
  const outline = interpolate(t, [timing.hold + 20, timing.hold + timing.rise], [1, 0.45], clamp);
  const r = rectOnCanvas(cam, view, padRect(start, 6));
  const s = view.w / cam.cw;
  const rad = 10 * s;
  return (
    <PageView src={src} page={page} cam={cam} view={view} brand={brand}>
      <MarkPatch cam={cam} view={view} spec={mark} />
      {/* the tracked row lit, everything else held down */}
      <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: rad,
        boxShadow: `0 0 0 4000px ${hexA(brand.color.bg, others)}` }} />
      <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: rad,
        background: glow(brand, 0.06 * outline), boxShadow: `inset 0 0 0 ${Math.max(1.5, 0.9 * s).toFixed(2)}px ${glow(brand, 0.55 * outline)}, 0 0 ${(40 * s * outline).toFixed(1)}px ${glow(brand, 0.18 * outline)}` }} />
      {vig > 0.01 ? (
        <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h, opacity: vig,
          background: "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 52%, rgba(0,0,0,.42) 100%)" }} />
      ) : null}
    </PageView>
  );
};

export const CraneRise: React.FC<Props> = (props) => {
  const f = useCurrentFrame();
  const at = props.at ?? 0;
  const timing = props.timing ?? CRANE_TIMING;
  const end = props.end ?? { cx: props.page.w / 2, cy: props.page.h / 2, cw: props.page.w };
  const full = { ...props, at, timing, end, startZoom: props.startZoom ?? 3, dpr: props.dpr ?? 2 };
  const t = f - at;
  // the page's shadow rises to its resting height as it lands
  const elev = interpolate(t, [timing.hold + 30, timing.hold + timing.rise - 10], [0, 1], { ...clamp, easing: OUT });
  const fast = timing.blur > 0 && t > timing.hold + 1 && t < timing.hold + timing.blur;
  const v = props.view;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: v.x, top: v.y, width: v.w, height: v.h, borderRadius: 34,
        boxShadow: `0 ${(10 + 50 * elev).toFixed(1)}px ${(30 + 110 * elev).toFixed(1)}px rgba(0,0,0,${(0.3 + 0.35 * elev).toFixed(3)}), 0 0 ${(60 + 120 * elev).toFixed(0)}px ${glow(props.brand, 0.08 + 0.1 * elev)}` }} />
      {fast ? (
        <CameraMotionBlur shutterAngle={150} samples={10}>
          <Scene {...full} />
        </CameraMotionBlur>
      ) : (
        <Scene {...full} />
      )}
    </AbsoluteFill>
  );
};
