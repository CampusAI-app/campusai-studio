/**
 * Loop 1, "Add to CampusAI Calendar" (round 4, 2026-10-25): 8 s, seamless, silent.
 *
 * The pointer is already moving toward the red "Add to CampusAI Calendar" on Financial Modeling Bootcamp in
 * frame one. It presses, the button turns into "On your calendar" (the real after capture), and a copy of the
 * card lifts off. Events slides up and away while My Calendar (Oct 25 to 31) arrives from below, and the card
 * drops through the air, turning into its own calendar block, into Sunday 5 to 7 PM, where it lands with a
 * squash and a red seam. A hold on the week, then the calendar slides up and a fresh Events page (before the
 * press) arrives from below and settles into exactly frame one. The conveyor only ever runs upward, so the
 * wrap from the last frame to the first is the same move as every other page change.
 *
 * Moves: canvas-materialize-moves A (the card becomes the block in flight) + row-embed's landing seam, on a
 * vertical page conveyor (pages travel 36 frames on the quiet camera curve, 64 px apart).
 * Real material: public/loops/events-*, cal-* (prepare.py, from public/sys captures of 2026-10-23).
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { brand as getBrand, useBrandFonts } from "../../kit/brand";
import type { PageCam, Rect } from "../../kit/camera";
import { rectOnCanvas, toCanvas } from "../../kit/camera";
import { PageView } from "../../kit/PageView";
import { PointerAt } from "../../kit/Pointer";
import { CURVE, DUR } from "../../system/motion";
import type { LoopAspect } from "./shared";
import { arc, cam, center, FlyPiece, fly, img, landFrame, lerp, lift, LoopFrame, loopLayout, PAGE, ramp, ViewClip } from "./shared";

export const CALENDAR_LOOP_FRAMES = 240;

const CARD: Rect = { x: 833, y: 224, w: 576, h: 212 };
const BLOCK: Rect = { x: 522, y: 500, w: 126, h: 87 };
const PRESS = { x: 984, y: 401 };
const REST = { x: 1196, y: 528 };

const T = {
  press: 27,
  lift: 30,
  out: 44, // Events leaves, My Calendar arrives
  flyAt: 44,
  flyDur: 42,
  back: 196, // My Calendar leaves, Events (before) arrives
};
const LAND = landFrame(T.flyAt, T.flyDur);
const TRAVEL = DUR.travel; // 36

const CAMS: Record<LoopAspect, { ev: PageCam; cal: PageCam }> = {
  "1x1": { ev: { cx: 1121, cy: 380, cw: 640 }, cal: { cx: 800, cy: 340, cw: 660 } },
  "9x16": { ev: { cx: 1121, cy: 518, cw: 580 }, cal: { cx: 765, cy: 418, cw: 560 } },
};

const shifted = (v: Rect, dy: number): Rect => ({ ...v, y: v.y + dy });

export const CalendarLoop: React.FC<{ aspect: LoopAspect }> = ({ aspect }) => {
  const f = useCurrentFrame();
  const B = getBrand("campusai");
  useBrandFonts(B);
  const L = loopLayout(aspect);
  const view = L.view;
  const ev = cam(CAMS[aspect].ev, view);
  const cal0 = cam(CAMS[aspect].cal, view);
  // the hold drifts 1.5% in, toward the block, so no frame of the hold is a freeze
  const drift = ramp(f, LAND + 6, T.back, CURVE.quiet.standard);
  const calDrift = cam({ cx: lerp(cal0.cx, BLOCK.x + BLOCK.w / 2, 0.06), cy: lerp(cal0.cy, BLOCK.y + BLOCK.h / 2, 0.06), cw: cal0.cw * 0.985 }, view);
  const calCam: PageCam = { cx: lerp(cal0.cx, calDrift.cx, drift), cy: lerp(cal0.cy, calDrift.cy, drift), cw: lerp(cal0.cw, calDrift.cw, drift) };

  const shift = view.h + 64 * L.u;
  const kOut = ramp(f, T.out, T.out + TRAVEL, CURVE.quiet.standard);
  const kBack = ramp(f, T.back, T.back + TRAVEL, CURVE.quiet.standard);
  const evA = f < T.out + TRAVEL + 1; // the page that is pressed, leaving
  const evB = f >= T.back; // the fresh page arriving, which is frame one again
  const calOn = f >= T.out && f < T.back + TRAVEL + 1;
  const evAView = shifted(view, -shift * kOut);
  const evBView = shifted(view, shift * (1 - kBack));
  const calView = shifted(view, f < T.back ? shift * (1 - kOut) : -shift * kBack);

  // pointer: rest to the button on frame 0 to 26, a slight bow, pressed at 27; it rides its page after that
  const kp = ramp(f, 0, T.press - 1, CURVE.quiet.standard);
  const bow = Math.sin(Math.PI * kp) * 22;
  const pointerPage = f < T.press ? { x: lerp(REST.x, PRESS.x, kp) + bow * 0.4, y: lerp(REST.y, PRESS.y, kp) + bow } : PRESS;
  const since = f >= T.press ? (f - T.press) / 30 : null;

  // the copy of the card: lifted on its page at rest, then flown to Sunday 5 PM on the arriving calendar
  const up = lift(f, T.lift);
  const u = fly(f, T.flyAt, T.flyDur);
  const uSize = fly(f, T.flyAt + 3, T.flyDur);
  const from = rectOnCanvas(ev, view, CARD);
  const to = rectOnCanvas(cal0, view, BLOCK);
  const grow = 1 + 0.03 * up * (1 - uSize);
  const w = lerp(from.w, to.w, uSize) * grow;
  const h = lerp(from.h, to.h, uSize) * grow;
  const c = arc(center(from), center(to), u, 120 * L.u);
  const box: Rect = { x: c.x - w / 2, y: c.y - h / 2, w, h };
  const landed = f >= LAND ? f - LAND : null;
  const pieceOn = f >= T.lift && f < LAND + 7;
  const sE = view.w / ev.cw;
  const sC = view.w / cal0.cw;
  const radius = lerp(12 * sE, 6 * sC, uSize);
  // the calendar swaps to its real after capture under the landed piece, in the squash, before the piece goes
  const calAfter = ramp(f, LAND + 1, LAND + 5);

  return (
    <LoopFrame brand={B} layout={L} caption="One press puts it on your calendar.">
      <ViewClip layout={L}>
        {calOn && (
          <>
            <PageView src={img("cal-before")} page={PAGE} cam={calCam} view={calView} brand={B} />
            {calAfter > 0 && (
              <div style={{ opacity: calAfter }}>
                <PageView src={img("cal-after")} page={PAGE} cam={calCam} view={calView} brand={B} />
              </div>
            )}
          </>
        )}
        {evA && (
          <PageView src={img(f < T.press + 1 ? "events-before" : "events-after")} page={PAGE} cam={ev} view={evAView} brand={B}>
            <Pointer at={pointerPage} cam={ev} view={evAView} since={since} accent={B.color.accent} />
          </PageView>
        )}
        {evB && (
          <PageView src={img("events-before")} page={PAGE} cam={ev} view={evBView} brand={B}>
            <Pointer at={REST} cam={ev} view={evBView} since={null} accent={B.color.accent} />
          </PageView>
        )}
      </ViewClip>
      {pieceOn && (
        <FlyPiece box={box} radius={radius} from={img("cal-card")} to={img("cal-block")} u={uSize} ground={["rgb(34, 22, 24)", "rgb(54, 11, 18)"]}
          air={landed !== null ? 0 : Math.max(up, u > 0 ? 1 - 0.5 * u : 0)} landed={landed} brand={B} u1={L.u} toW={to.w} />
      )}
    </LoopFrame>
  );
};

const Pointer: React.FC<{ at: { x: number; y: number }; cam: PageCam; view: Rect; since: number | null; accent: string }> = ({ at, cam: c, view, since, accent }) => {
  const p = toCanvas(c, view, at.x, at.y);
  return <PointerAt x={p.x} y={p.y} since={since} accent={accent} size={58} />;
};
