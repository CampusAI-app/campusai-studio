/**
 * PressMark (round 4, 2026-10-25): shows that a press happened and where its result lands. The pointer
 * presses a real control, a ripple spreads inside it and the control takes its real pressed state; then a
 * small dot of light leaves the control and travels, drawing a thin line behind it, to the place in the
 * product where the result shows up (an event's "Add to CampusAI Calendar" toward "My Calendar" in the nav).
 * The destination lifts and rings as the dot lands, the line gathers itself into it, and a caption below the
 * footage can name it. Jacob's rule, made into a part: every press shows where it lands.
 *
 * Where it came from: the kit Pointer (press squash and ring), RedDot's landing (lift plus a ring of the
 * brand's light, kit/pass/chat/RedDot.tsx) and the dictionary's "connector line draw / data packet travel"
 * (a dot travelling a path with its trail). The pressed state is honest: `after` is a crop of the same
 * control in its pressed state from a real capture, laid over the control, never a redraw.
 *
 * Numbers (30 fps):
 * - pointer glides in over 22 frames on EASE_CAMERA, arrives 8 frames early, press squash from the kit,
 * - ripple: a filled circle of the accent at 22% growing from the press point to cover the control over
 *   14 frames, clipped to the control, fading out over the last 8; the kit pointer's ring sits on top,
 * - pressed state crossfades in over 4 frames, 3 frames after the press,
 * - the dot leaves `leave` frames after the press (default 16), travels a curve bent 18% of its length for
 *   ~0.9 frames per sqrt(canvas px) (the house durFor) on bezier(0.5, 0, 0.2, 1), with a 2.5 px line behind
 *   it fading toward the start,
 * - landing: the destination lifts 3 page px with a soft shadow over 10 frames and a ring grows 10 page px
 *   off its box and fades over 24 frames; the line's tail runs into the destination over 14 frames.
 */
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { glow, useBrandFonts } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { camAlong, clampCam, rectOnCanvas, toCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { PointerAt } from "../../Pointer";
import { EASE, EASE_CAMERA } from "../../../lib/anim";
import type { MarkPatchSpec } from "../../pass/camera/shared";
import { MarkPatch } from "../../pass/camera/shared";
import { CaptionBand, clamp, LitCrop } from "./shared";

const TRAVEL = Easing.bezier(0.5, 0, 0.2, 1);
type Pt = { x: number; y: number };

export type PressMarkProps = {
  src: string;
  page: Size;
  view: Rect;
  brand: Brand;
  cams: { t: number; cam: PageCam }[];
  /** The control pressed, page px, and the frame of the press. */
  control: Rect;
  pressAt: number;
  /** Corner radius of the control, page px (clips the ripple). */
  controlRadius?: number;
  /** The pressed state: a page rect of the same image showing the control pressed, laid over `control`. */
  after?: Rect;
  /** Where the pointer starts, page px. */
  pointerFrom?: Pt;
  /** Where the result shows up, page px. */
  target: Rect;
  targetRadius?: number;
  /** Frames after the press the dot leaves, and the travel length (default from distance). */
  leave?: number;
  travel?: number;
  /** Bend of the path as a share of its length, signed. */
  bend?: number;
  /** Optional name of the destination, in the caption band below the view; held to the reading rule. */
  label?: string;
  labelHold?: number;
  labelBand?: { y: number; size: number };
  mark?: MarkPatchSpec | null;
};

const bez = (a: Pt, c: Pt, b: Pt, t: number): Pt => {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
};

/** The frames a PressMark uses. `travel` is computed from the canvas distance when not given. */
export const pressMarkTiming = (o: { pressAt: number; leave?: number; travel?: number; distancePx?: number }) => {
  const leave = o.pressAt + (o.leave ?? 16);
  const travel = o.travel ?? Math.round(Math.min(48, Math.max(20, 8 + 0.9 * Math.sqrt(o.distancePx ?? 600))));
  const land = leave + travel;
  return { leave, travel, land, settled: land + 24 };
};

export const PressMark: React.FC<PressMarkProps> = ({
  src, page, view, brand, cams, control, pressAt, controlRadius = 6, after, pointerFrom, target, targetRadius = 8,
  leave, travel, bend = 0.18, label, labelHold, labelBand, mark = null,
}) => {
  useBrandFonts(brand);
  const f = useCurrentFrame();
  const cam = clampCam(camAlong(f, cams), page, view);
  const s = view.w / cam.cw;
  const tc = (p: Pt) => toCanvas(cam, view, p.x, p.y);

  // the press
  const pressPt = { x: control.x + control.w * 0.42, y: control.y + control.h * 0.55 };
  const pFrom = pointerFrom ?? { x: pressPt.x + 120, y: pressPt.y + 150 };
  const glide = interpolate(f, [pressAt - 30, pressAt - 8], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const ptr = { x: pFrom.x + (pressPt.x - pFrom.x) * glide, y: pFrom.y + (pressPt.y - pFrom.y) * glide };
  const ptrC = toCanvas(cam, view, ptr.x, ptr.y);
  const ptrOp = interpolate(f, [pressAt - 30, pressAt - 24], [0, 1], clamp) * (1 - interpolate(f, [pressAt + 12, pressAt + 22], [0, 1], clamp));
  const since = f >= pressAt ? (f - pressAt) / 30 : null;

  const ctrlC = rectOnCanvas(cam, view, control);
  const ripK = interpolate(f, [pressAt, pressAt + 14], [0, 1], { ...clamp, easing: EASE });
  const ripOp = f < pressAt ? 0 : 1 - interpolate(f, [pressAt + 8, pressAt + 18], [0, 1], clamp);
  const ripR = Math.hypot(ctrlC.w, ctrlC.h) * ripK;
  const pressC = toCanvas(cam, view, pressPt.x, pressPt.y);
  const afterK = interpolate(f, [pressAt + 3, pressAt + 7], [0, 1], clamp);
  // the pressed crop is centred on the control
  const afterAt = after ? { x: control.x + (control.w - after.w) / 2, y: control.y + (control.h - after.h) / 2, w: after.w, h: after.h } : null;

  // the travel, from the top edge of the control to the near edge of the target
  const a: Pt = { x: control.x + control.w / 2, y: control.y };
  const b: Pt = { x: target.x + target.w * 0.62, y: target.y + target.h / 2 };
  const ac = toCanvas(cam, view, a.x, a.y);
  const bc = toCanvas(cam, view, b.x, b.y);
  const T = pressMarkTiming({ pressAt, leave, travel, distancePx: Math.hypot(bc.x - ac.x, bc.y - ac.y) });
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  const ctrl: Pt = { x: (a.x + b.x) / 2 + (-(b.y - a.y) / L) * L * bend, y: (a.y + b.y) / 2 + ((b.x - a.x) / L) * L * bend };
  const head = interpolate(f, [T.leave, T.land], [0, 1], { ...clamp, easing: TRAVEL });
  const tail = interpolate(f, [T.land, T.land + 14], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const N = 40;
  const line: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = tail + (head - tail) * (i / N);
    line.push(tc(bez(a, ctrl, b, t)));
  }
  const dotP = tc(bez(a, ctrl, b, head));
  const travelling = f >= T.leave && f <= T.land + 14;
  const dotOp = interpolate(f, [T.leave, T.leave + 3], [0, 1], clamp) * (1 - interpolate(f, [T.land + 2, T.land + 10], [0, 1], clamp));
  const dotR = 7.5 * Math.max(0.9, Math.min(1.4, s));
  const lineStart = line[0];

  // the landing
  const lift = interpolate(f, [T.land - 2, T.land + 8], [0, 1], { ...clamp, easing: EASE }) * (1 - interpolate(f, [T.land + 40, T.land + 60], [0, 1], { ...clamp, easing: EASE_CAMERA }));
  const ring = interpolate(f, [T.land, T.land + 24], [0, 1], { ...clamp, easing: EASE });
  const tgtC = rectOnCanvas(cam, view, target);
  const ringPad = 10 * s * ring;
  const band = labelBand ?? { y: view.y + view.h + 90, size: 46 };
  const hold = labelHold ?? 70;

  return (
    <>
      <PageView src={src} page={page} cam={cam} view={view} brand={brand}>
        <MarkPatch cam={cam} view={view} spec={mark} />
        {/* pressed state, a real crop of the same control pressed */}
        {after && afterAt && afterK > 0 ? (
          <div style={{ position: "absolute", opacity: afterK }}>
            <LitCrop src={src} page={page} cam={{ ...cam, cx: cam.cx + (after.x - afterAt.x), cy: cam.cy + (after.y - afterAt.y) }} view={view}
              clip={rectOnCanvas(cam, view, afterAt)} />
          </div>
        ) : null}
        {/* the ripple, inside the control */}
        {ripOp > 0 ? (
          <div style={{ position: "absolute", left: ctrlC.x, top: ctrlC.y, width: ctrlC.w, height: ctrlC.h, borderRadius: controlRadius * s, overflow: "hidden", opacity: ripOp }}>
            <div style={{ position: "absolute", left: pressC.x - ctrlC.x - ripR, top: pressC.y - ctrlC.y - ripR, width: ripR * 2, height: ripR * 2, borderRadius: "50%",
              background: "rgba(255,255,255,0.22)" }} />
          </div>
        ) : null}
        {/* the destination lifts and rings */}
        {lift > 0.002 ? (
          <LitCrop src={src} page={page} cam={cam} view={view} clip={tgtC} radius={targetRadius * s}
            style={{ transform: `translateY(${(-3 * s * lift).toFixed(2)}px)`, boxShadow: `0 ${(10 * lift).toFixed(1)}px ${(26 * lift).toFixed(1)}px rgba(0,0,0,${(0.5 * lift).toFixed(2)}), inset 0 0 0 ${(1.5 * lift).toFixed(2)}px ${glow(brand, 0.75 * lift)}` }} />
        ) : null}
        {ring > 0 && ring < 1 ? (
          <div style={{ position: "absolute", left: tgtC.x - ringPad, top: tgtC.y - ringPad, width: tgtC.w + ringPad * 2, height: tgtC.h + ringPad * 2,
            borderRadius: targetRadius * s + ringPad, border: `2px solid ${brand.color.accent}`, opacity: 1 - ring, boxShadow: `0 0 ${(30 * (1 - ring)).toFixed(0)}px ${glow(brand, 0.5 * (1 - ring))}` }} />
        ) : null}
        {/* the line and the dot */}
        {travelling ? (
          <svg width={view.x + view.w} height={view.y + view.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <defs>
              <linearGradient id="pm-line" gradientUnits="userSpaceOnUse" x1={lineStart.x} y1={lineStart.y} x2={dotP.x} y2={dotP.y}>
                <stop offset="0" stopColor={brand.color.accent} stopOpacity={0.12} />
                <stop offset="1" stopColor={brand.color.accent} stopOpacity={0.95} />
              </linearGradient>
            </defs>
            <path d={line.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")} fill="none" stroke="url(#pm-line)" strokeWidth={2.5} strokeLinecap="round" />
            {dotOp > 0 ? (
              <g opacity={dotOp}>
                <circle cx={dotP.x} cy={dotP.y} r={dotR * 2.6} fill={glow(brand, 0.22)} />
                <circle cx={dotP.x} cy={dotP.y} r={dotR} fill={brand.color.accent} />
                <circle cx={dotP.x} cy={dotP.y} r={dotR * 0.42} fill="rgba(255,255,255,0.9)" />
              </g>
            ) : null}
          </svg>
        ) : null}
        <PointerAt x={ptrC.x} y={ptrC.y} since={since} accent={brand.color.accent} opacity={ptrOp} />
      </PageView>
      {label ? <CaptionBand text={label} f={f} from={T.land + 2} to={T.land + 2 + hold} brand={brand} y={band.y} size={band.size} /> : null}
    </>
  );
};
