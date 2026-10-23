/**
 * CircleHandoff (2026-10-22): a round real element (the notifications bell, the Ask CampusAI
 * sparkle) opens as an iris into the next real scene, and the circle lands on a matching round
 * element there. A match cut that the viewer can follow: the thing pressed is the door.
 *
 * Ported from the shelf shot `circle-match-iris` (shots/demos/transition/circle-match-iris). Kept:
 * one shared centre that every circle reads (anchor, ripples, iris, rim), the focus beat before the
 * open (the rest of the page dims to about 45%, ripples off the anchor), the iris starting at the
 * anchor's own radius and growing on bezier(.62, 0, .32, 1) over 30 frames so it is slow while it is
 * still the anchor and fast once it is a transition, the old page pushed away about the anchor
 * (1 to 1.22 tighter, brightness down) so the new scene presses in on top, and a rim light on the
 * iris edge only in the first frames of the open. Changed: both scenes are real captures through
 * the page camera; the new page STARTS framed so its matching circle is concentric with the old one
 * and the same size on screen, then, once the iris is half open (14 frames), its camera pulls back to its rest framing
 * (expo-out), carrying the
 * iris centre with it, so the circle travels and lands on the match. The card's ring-sweep chart
 * is dropped (it was the demo's own scene B).
 * Dictionary: iris wipe as a match cut (circle match iris).
 *
 * The accent ring that marks the anchor rides the matching circle through the pull-back and lets go
 * 12 frames after it lands, so the eye follows the circle to its new place. Land it on a DIFFERENT
 * element from the one that opened it (bell to the first notification's icon), or the iris reads as
 * a lens over the same spot rather than a change of place.
 *
 * Every circle is in PAGE px and mapped through each page's camera, so the match holds at any
 * framing. The anchor must read as a true circle: on a pill (the "6 new" bell) the ring is drawn
 * round the glyph, not the pill.
 */
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { camAlong, mixCam, toCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { EASE } from "../../../lib/anim";
import { MPatch, clamp } from "./shared";

export type Circle = { cx: number; cy: number; r: number };

export type CircleHandoffProps = {
  brand: Brand;
  /** The page rectangle on the canvas; both scenes share it. */
  view: Rect;
  from: { src: string; page: Size; cams: { t: number; cam: PageCam }[]; circle: Circle; patch: string };
  to: { src: string; page: Size; rest: PageCam; drift?: PageCam; circle: Circle; patch: string };
  times: {
    /** The rest of the page dims from here (14 frames). */
    focus: number;
    /** Ripples off the anchor at these frames (22 frames each). */
    pulses?: number[];
    /** The iris opens here. */
    open: number;
    /** The new page's camera lands on `rest` here. */
    land: number;
  };
};

const IRIS = Easing.bezier(0.62, 0, 0.32, 1);
const SNAPPY = Easing.bezier(0.16, 1, 0.3, 1);
const PREP = Easing.bezier(0.4, 0, 0.2, 1);
const IRIS_FRAMES = 30;
const LAND_DELAY = 14;

/** The same camera, tighter by `k`, with page point (px, py) held where it was on the canvas. */
const tighten = (cam: PageCam, view: Rect, px: number, py: number, k: number): PageCam => {
  const a = toCanvas(cam, view, px, py);
  const cw = cam.cw / k;
  const s = view.w / cw;
  return { cw, cx: px - (a.x - view.x - view.w / 2) / s, cy: py - (a.y - view.y - view.h / 2) / s };
};

export const CircleHandoff: React.FC<CircleHandoffProps> = ({ brand, view, from, to, times }) => {
  const f = useCurrentFrame();
  const T = times;
  const fc = from.circle;

  // scene A: its own camera, a small anticipation before the open, then pushed away about the anchor
  const prep = interpolate(f, [T.open - 7, T.open], [0, 1], { ...clamp, easing: PREP });
  const away = interpolate(f, [T.open, T.open + 34], [0, 1], { ...clamp, easing: Easing.bezier(0.55, 0, 1, 0.45) });
  const baseA = camAlong(f, from.cams);
  const camA = tighten(baseA, view, fc.cx, fc.cy, 1 + 0.22 * away);
  const anchor = toCanvas(camA, view, fc.cx, fc.cy);
  const anchorR = fc.r * anchor.s * (1 - 0.1 * prep * (1 - away));
  const focus = interpolate(f, [T.focus, T.focus + 14], [0, 1], { ...clamp, easing: EASE });

  // scene B: framed at the open so its circle sits on the anchor at the anchor's size, then lands
  const a0 = toCanvas(tighten(camAlong(T.open, from.cams), view, fc.cx, fc.cy, 1), view, fc.cx, fc.cy);
  const s0 = (fc.r * a0.s * 0.9) / to.circle.r;
  const match: PageCam = {
    cw: view.w / s0,
    cx: to.circle.cx - (a0.x - view.x - view.w / 2) / s0,
    cy: to.circle.cy - (a0.y - view.y - view.h / 2) / s0,
  };
  // the circles stay concentric while the iris opens; the pull-back starts once it is half open
  const land = interpolate(f, [T.open + LAND_DELAY, T.land], [0, 1], { ...clamp, easing: SNAPPY });
  const hold = interpolate(f, [T.land, T.land + 150], [0, 1], clamp);
  const camB = land < 1 ? mixCam(match, to.rest, land) : mixCam(to.rest, to.drift ?? { ...to.rest, cw: to.rest.cw * 0.97 }, hold);
  const target = toCanvas(camB, view, to.circle.cx, to.circle.cy);
  const targetR = to.circle.r * target.s;

  const opened = f >= T.open;
  const maxR = Math.hypot(view.w, view.h) + 40;
  const grow = interpolate(f, [T.open + 2, T.open + 2 + IRIS_FRAMES], [0, 1], { ...clamp, easing: IRIS });
  const irisR = targetR + 4 + maxR * grow;
  const covered = opened && grow >= 1;
  // the ring stays on the circle through the travel, holds 12 frames once it lands, then fades
  const ring = opened ? 1 - interpolate(f, [T.land + 12, T.land + 30], [0, 1], { ...clamp, easing: EASE }) : 0;
  const rim = opened ? (1 - interpolate(f, [T.open + 10, T.open + 24], [0, 1], clamp)) * interpolate(f, [T.open, T.open + 4], [0, 1], clamp) : 0;

  return (
    <>
      {!covered && (
        <PageView src={from.src} page={from.page} cam={camA} view={view} brand={brand} dim={0.55 * away}>
          <MPatch cam={camA} view={view} color={from.patch} />
          {/* the focus: everything but the anchor drops back */}
          {focus > 0 && (
            <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h, opacity: focus * (1 - away),
              background: `radial-gradient(circle at ${anchor.x - view.x}px ${anchor.y - view.y}px, rgba(0,0,0,0) ${anchorR * 1.6}px, rgba(0,0,0,.55) ${anchorR * 4}px)` }} />
          )}
          {/* the true circle round the glyph, and the ripples */}
          {focus > 0 && !opened && (
            <div style={{ position: "absolute", left: anchor.x - anchorR, top: anchor.y - anchorR, width: anchorR * 2, height: anchorR * 2, borderRadius: "50%",
              boxShadow: `0 0 0 ${2.5 * focus}px ${brand.color.accent}, 0 0 ${28 * focus}px ${glow(brand, 0.5 * focus)}` }} />
          )}
          {(T.pulses ?? []).map((at) => {
            const p = interpolate(f, [at, at + 22], [0, 1], { ...clamp, easing: EASE });
            if (f < at || p >= 1) return null;
            const r = anchorR + 6 + p * anchorR * 2.2;
            return <div key={at} style={{ position: "absolute", left: anchor.x - r, top: anchor.y - r, width: r * 2, height: r * 2, borderRadius: "50%",
              border: `${(3 - 2 * p).toFixed(2)}px solid ${brand.color.accent}`, opacity: 0.85 * (1 - p) }} />;
          })}
        </PageView>
      )}
      {opened && (
        <>
          {/* the new scene presses in: a soft shadow just outside the iris */}
          {!covered && (
            <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h, borderRadius: 34, overflow: "hidden",
              background: `radial-gradient(circle at ${target.x - view.x}px ${target.y - view.y}px, rgba(0,0,0,0) ${irisR}px, rgba(0,0,0,.45) ${irisR + 1}px, rgba(0,0,0,0) ${irisR + 90}px)` }} />
          )}
          <div style={{ position: "absolute", inset: 0, clipPath: covered ? undefined : `circle(${irisR.toFixed(1)}px at ${target.x.toFixed(1)}px ${target.y.toFixed(1)}px)` }}>
            <PageView src={to.src} page={to.page} cam={camB} view={view} brand={brand}>
              <MPatch cam={camB} view={view} color={to.patch} />
            </PageView>
          </div>
          {/* the circle itself, carried from the anchor to where it lands, then let go */}
          {ring > 0 && (
            <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h, borderRadius: 34, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: target.x - view.x - targetR, top: target.y - view.y - targetR, width: targetR * 2, height: targetR * 2,
                borderRadius: "50%", boxShadow: `0 0 0 ${2.5 * ring}px ${brand.color.accent}, 0 0 ${28 * ring}px ${glow(brand, 0.5 * ring)}` }} />
            </div>
          )}
          {rim > 0 && (
            <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h, borderRadius: 34, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: target.x - view.x - irisR, top: target.y - view.y - irisR, width: irisR * 2, height: irisR * 2, borderRadius: "50%",
                boxShadow: `0 0 0 2.5px ${glow(brand, 0.9 * rim)}, 0 0 30px ${glow(brand, 0.5 * rim)}` }} />
            </div>
          )}
        </>
      )}
    </>
  );
};
