/**
 * Loop 2, "Why this fits you" (round 4, 2026-10-25): 7.5 s, seamless, silent.
 *
 * Job Match, framed on the list. The pointer is already moving toward Goldman Sachs, 2027 Summer Analyst in
 * frame one; it presses, the card takes the red selected border and the detail panel becomes Goldman's (the
 * real after capture). The camera glides across to the detail, and "Why this fits you" writes itself out line
 * by line, each line wiping in left to right with a soft trailing edge, the way the product streams an answer.
 * It holds on the whole reason, then the camera glides back to the list while the page returns to its state
 * before the press, settling into exactly frame one.
 *
 * Why Goldman: its reason is the most specific one on the page and every clause is true of Maya on the demo
 * (her credit internship, her Smith Investment Fund role, her May 2028 graduation against the role's window).
 * Moves: the kit camera (camAlong on EASE_CAMERA, DUR.travel), FocusWalk's 1.5% hold drift, and a line-by-line
 * wipe (document-typewriter-reveal's reveal, done per line over the real text instead of per letter).
 */
import React from "react";
import { Img, useCurrentFrame } from "remotion";
import { brand as getBrand, useBrandFonts } from "../../kit/brand";
import type { PageCam } from "../../kit/camera";
import { camAlong, rectOnCanvas, toCanvas } from "../../kit/camera";
import { PageView } from "../../kit/PageView";
import { PointerAt } from "../../kit/Pointer";
import { CURVE, DUR } from "../../system/motion";
import type { LoopAspect } from "./shared";
import { cam, img, lerp, LoopFrame, loopLayout, PAGE, ramp, ViewClip, ViewOverlay } from "./shared";

export const WHY_LOOP_FRAMES = 225;

const PRESS = { x: 501, y: 456 };
const REST = { x: 652, y: 652 };
const WHY_CENTER = { x: 1054, y: 478 };
/** The reason's six lines on job-after (measured: text tops and right ends, CSS px; left edge 763). */
const LINES = [
  { y: 430.5, x1: 1314.5 },
  { y: 453.5, x1: 1294 },
  { y: 476.5, x1: 1338.5 },
  { y: 498.5, x1: 1335.5 },
  { y: 521.5, x1: 1289.5 },
  { y: 544.5, x1: 1189 },
];

const T = {
  press: 25,
  go: 30, // camera to the reason
  lines: 62, // first line starts
  stagger: 7,
  wipe: 16,
  back: 186, // camera back to the list
  reset: 204, // page returns to before the press, late in the glide (the detail is mostly out of frame)
};

const CAMS: Record<LoopAspect, { list: PageCam; why: PageCam }> = {
  "1x1": { list: { cx: 500, cy: 480, cw: 600 }, why: { cx: 1054, cy: 410, cw: 640 } },
  "9x16": { list: { cx: 492, cy: 480, cw: 470 }, why: { cx: 1054, cy: 430, cw: 620 } },
};

export const WhyFitsLoop: React.FC<{ aspect: LoopAspect }> = ({ aspect }) => {
  const f = useCurrentFrame();
  const B = getBrand("campusai");
  useBrandFonts(B);
  const L = loopLayout(aspect);
  const view = L.view;
  const list = cam(CAMS[aspect].list, view);
  const why = cam(CAMS[aspect].why, view);
  const whyIn = cam({ cx: lerp(why.cx, WHY_CENTER.x, 0.08), cy: lerp(why.cy, WHY_CENTER.y, 0.08), cw: why.cw * 0.985 }, view);
  const lastLine = T.lines + T.stagger * (LINES.length - 1) + T.wipe;
  const c = camAlong(f, [
    { t: T.go, cam: list },
    { t: T.go + DUR.travel + 2, cam: why },
    { t: lastLine, cam: why },
    { t: T.back, cam: whyIn },
    { t: T.back + DUR.travel, cam: list },
  ], CURVE.quiet.standard);

  // pointer: rest to the Goldman card, pressed at 25; back to rest while it is out of frame (the reason is up)
  const kp = ramp(f, 0, T.press - 1, CURVE.quiet.standard);
  const bow = Math.sin(Math.PI * kp) * 20;
  const kr = ramp(f, 120, 170, CURVE.quiet.standard);
  const at = f < T.press
    ? { x: lerp(REST.x, PRESS.x, kp) - bow * 0.5, y: lerp(REST.y, PRESS.y, kp) + bow * 0.3 }
    : { x: lerp(PRESS.x, REST.x, kr), y: lerp(PRESS.y, REST.y, kr) };
  const since = f >= T.press && f < T.press + 30 ? (f - T.press) / 30 : null;
  const p = toCanvas(c, view, at.x, at.y);

  const pressed = f >= T.press + 1;
  const reset = ramp(f, T.reset, T.reset + 8);
  const s = view.w / c.cw;
  const o = toCanvas(c, view, 0, 0);

  return (
    <LoopFrame brand={B} layout={L} caption="Open a role to see why it fits you.">
      <ViewClip layout={L}>
        {(!pressed || reset > 0) && <PageView src={img("job-before")} page={PAGE} cam={c} view={view} brand={B} />}
        {pressed && reset < 1 && (
          <div style={{ opacity: 1 - reset }}>
            <PageView src={img("job-blank")} page={PAGE} cam={c} view={view} brand={B}>
              {LINES.map((ln, i) => {
                const k = ramp(f, T.lines + T.stagger * i, T.lines + T.stagger * i + T.wipe, CURVE.quiet.enter);
                if (k <= 0) return null;
                const r = rectOnCanvas(c, view, { x: 759, y: ln.y - 5, w: ln.x1 - 759 + 6, h: 23 });
                const feather = 46 * L.u;
                const shown = r.w * k;
                return (
                  <div key={i} style={{ position: "absolute", left: r.x, top: r.y, width: Math.min(r.w, shown + feather), height: r.h, overflow: "hidden",
                    WebkitMaskImage: k < 1 ? `linear-gradient(to right, black ${Math.max(0, shown - feather * 0.2)}px, transparent ${shown + feather}px)` : undefined }}>
                    <Img src={img("job-after")} style={{ position: "absolute", left: o.x - r.x, top: o.y - r.y, width: PAGE.w * s, height: PAGE.h * s, maxWidth: "none" }} />
                  </div>
                );
              })}
            </PageView>
          </div>
        )}
      </ViewClip>
      <ViewOverlay view={view}>
        <PointerAt x={p.x} y={p.y} since={since} accent={B.color.accent} size={58} />
      </ViewOverlay>
    </LoopFrame>
  );
};
