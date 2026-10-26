/**
 * Loop 3, "Pick a time" in the spring planner (round 4, 2026-10-25): 7 s, seamless, silent.
 *
 * The planner chat, on "BMGT440. Pick a time." with its five real sections. The pointer is already moving
 * toward "Tue and Thu, 2pm to 3:15pm" in frame one; it presses, and two copies of that row lift and arc left
 * across the page while the camera follows them to "Your week", each one turning into its own BMGT440 2pm
 * block on the way and landing on Tuesday and Thursday (6 frames apart, squash and red seam). The panel then
 * shows the real after state: "1 class . 3 cr" and the summary "BMGT440 0301, Tue, Thu . 2pm to 3:15pm". A hold,
 * then the camera glides back to the sections while the week empties behind the move, settling into frame one.
 *
 * Moves: canvas-materialize-moves A (rows arc out and become canvas cards, staggered 6 frames, the camera moving
 * with them) + row-embed's landing seam + the kit camera (camAlong, EASE_CAMERA). The product's own line under
 * the empty week reads "Each section you pick lands here.", which is exactly this loop.
 * Real material: public/loops/plan-* (prepare.py; the Testudo link is painted out of plan-before).
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { brand as getBrand, useBrandFonts } from "../../kit/brand";
import type { PageCam, Rect } from "../../kit/camera";
import { camAlong, rectOnCanvas, toCanvas } from "../../kit/camera";
import { PageView } from "../../kit/PageView";
import { PointerAt } from "../../kit/Pointer";
import { CURVE, DUR } from "../../system/motion";
import type { LoopAspect } from "./shared";
import { arc, cam, center, FlyPiece, fly, img, landFrame, lerp, lift, LoopFrame, loopLayout, PAGE, ramp, ViewClip, ViewOverlay } from "./shared";

export const PLANNER_LOOP_FRAMES = 210;

const ROW: Rect = { x: 706, y: 400, w: 666, h: 56 };
const TUE: Rect = { x: 372, y: 532, w: 60, h: 37 };
const THU: Rect = { x: 497, y: 532, w: 60, h: 37 };
const PRESS = { x: 1000, y: 420 };
const REST = { x: 1190, y: 566 };
const WEEK_CENTER = { x: 450, y: 520 };

const T = {
  press: 23,
  lift: 25,
  go: 30, // camera to Your week
  goDur: 40,
  tueAt: 32,
  thuAt: 38,
  flyDur: 42,
  back: 170,
  reset: 186,
};
const LAND_TUE = landFrame(T.tueAt, T.flyDur);
const LAND_THU = landFrame(T.thuAt, T.flyDur);

const CAMS: Record<LoopAspect, { opts: PageCam; week: PageCam }> = {
  "1x1": { opts: { cx: 1040, cy: 470, cw: 680 }, week: { cx: 470, cy: 495, cw: 560 } },
  "9x16": { opts: { cx: 940, cy: 470, cw: 560 }, week: { cx: 442, cy: 440, cw: 440 } },
};

export const PlannerLoop: React.FC<{ aspect: LoopAspect }> = ({ aspect }) => {
  const f = useCurrentFrame();
  const B = getBrand("campusai");
  useBrandFonts(B);
  const L = loopLayout(aspect);
  const view = L.view;
  const opts = cam(CAMS[aspect].opts, view);
  const week = cam(CAMS[aspect].week, view);
  const weekIn = cam({ cx: lerp(week.cx, WEEK_CENTER.x, 0.08), cy: lerp(week.cy, WEEK_CENTER.y, 0.08), cw: week.cw * 0.985 }, view);
  const c = camAlong(f, [
    { t: T.go, cam: opts },
    { t: T.go + T.goDur, cam: week },
    { t: LAND_THU + 6, cam: week },
    { t: T.back, cam: weekIn },
    { t: T.back + DUR.travel, cam: opts },
  ], CURVE.quiet.standard);

  // pointer: rest to the first section, pressed at 23; back to rest while the week is up (it is out of frame)
  const kp = ramp(f, 0, T.press - 1, CURVE.quiet.standard);
  const bow = Math.sin(Math.PI * kp) * 20;
  const kr = ramp(f, 110, 160, CURVE.quiet.standard);
  const at = f < T.press
    ? { x: lerp(REST.x, PRESS.x, kp) + bow * 0.4, y: lerp(REST.y, PRESS.y, kp) + bow }
    : { x: lerp(PRESS.x, REST.x, kr), y: lerp(PRESS.y, REST.y, kr) };
  const since = f >= T.press && f < T.press + 30 ? (f - T.press) / 30 : null;
  const p = toCanvas(c, view, at.x, at.y);

  const after = Math.min(ramp(f, LAND_THU + 1, LAND_THU + 5), 1 - ramp(f, T.reset, T.reset + 12));
  const s = view.w / c.cw;
  const up = lift(f, T.lift);

  const piece = (target: Rect, at0: number, land: number, key: string, src: string) => {
    if (f < T.lift || f >= LAND_THU + 7) return null;
    const u = fly(f, at0, T.flyDur);
    const uSize = fly(f, at0 + 3, T.flyDur);
    // fly in PAGE space, so the piece crosses the page while the camera follows it; the arc rises in canvas px
    const from = rectOnCanvas(c, view, ROW);
    const to = rectOnCanvas(c, view, target);
    const grow = 1 + 0.03 * up * (1 - uSize);
    const w = lerp(from.w, to.w, uSize) * grow;
    const h = lerp(from.h, to.h, uSize) * grow;
    const m = arc(center(from), center(to), u, 110 * L.u);
    const landed = f >= land ? f - land : null;
    return (
      <FlyPiece key={key} box={{ x: m.x - w / 2, y: m.y - h / 2, w, h }} radius={lerp(12, 4, uSize) * s} from={img("plan-row")} to={img(src)} u={uSize}
        ground={["rgb(24, 23, 29)", "rgb(41, 38, 55)"]} air={landed !== null ? 0 : Math.max(up, u > 0 ? 1 - 0.5 * u : 0)} landed={landed} brand={B} u1={L.u} toW={to.w} />
    );
  };

  return (
    <LoopFrame brand={B} layout={L} caption="Pick a time and it lands on your week.">
      <ViewClip layout={L}>
        <PageView src={img("plan-before")} page={PAGE} cam={c} view={view} brand={B} />
        {after > 0 && (
          <div style={{ opacity: after }}>
            <PageView src={img("plan-after")} page={PAGE} cam={c} view={view} brand={B} />
          </div>
        )}
      </ViewClip>
      <ViewOverlay view={view}>
        {piece(THU, T.thuAt, LAND_THU, "thu", "plan-thu")}
        {piece(TUE, T.tueAt, LAND_TUE, "tue", "plan-tue")}
        <PointerAt x={p.x} y={p.y} since={since} accent={B.color.accent} size={58} />
      </ViewOverlay>
    </LoopFrame>
  );
};
