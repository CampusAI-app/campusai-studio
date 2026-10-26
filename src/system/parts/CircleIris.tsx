/**
 * circle-handoff (2026-10-23, wave 2): the kit CircleHandoff (kit/pass/type/CircleHandoff.tsx, from shelf shot
 * transition/circle-match-iris) as a storyboard part. A round real element on this shot's page (the bell) gets a
 * focus ring and ripples, then opens as an iris into the next real page, and the circle travels and lands on a
 * DIFFERENT round element there (the first bundle's icon), so the thing pressed is the door.
 *
 * The shot's own surface is the page it starts on; `props.to` names the surface it opens into. The new page
 * comes to rest on `props.toCam`; give the next shot that same camera as its first key and `transition: "cut"`
 * on this shot, and the film carries on without a jump.
 *
 * Props (page px; times in seconds after the shot starts):
 *   to: string                      surface key of the page the iris opens into (required)
 *   fromCircle, toCircle: {cx,cy,r} the two round elements
 *   toCam: {cx,cy,cw}               where the new page rests
 *   focus, open, land: number       the dim-down, the open, the landing (kit: focus 14 f, iris 30 f)
 *   pulses?: number[]               ripples off the anchor
 */
import React from "react";
import { Sequence, useCurrentFrame } from "remotion";
import type { PageCam } from "../../kit/camera";
import { CircleHandoff } from "../../kit/pass/type/CircleHandoff";
import type { Circle } from "../../kit/pass/type/CircleHandoff";
import { FPS } from "../motion";
import { asset, num } from "./common";
import type { PartProps } from "./types";

// motion: the sidebar colour behind the Maryland mark on the dark captures (rules.json maskRects note)
const SIDEBAR = "rgb(33, 21, 21)";

export const CircleIris: React.FC<PartProps> = ({ surface, brand, f, layout, props, ctx }) => {
  const now = useCurrentFrame();
  const to = typeof props.to === "string" ? ctx.board.surfaces[props.to] : undefined;
  const fc = props.fromCircle as Circle | undefined;
  const tc = props.toCircle as Circle | undefined;
  const rest = props.toCam as PageCam | undefined;
  if (!surface || !to || !fc || !tc || !rest) return null;
  // the start page's own camera, sampled every 4 frames so the kit part follows the planned move
  const cams: { t: number; cam: PageCam }[] = [];
  for (let t = 0; t <= ctx.dur; t += 4) cams.push({ t, cam: ctx.cam(t) });
  const s = (k: string, d: number) => Math.round(num(props[k], d) * FPS);
  const times = {
    focus: s("focus", 0.6),
    open: s("open", 1.4),
    land: s("land", 2.4),
    pulses: Array.isArray(props.pulses) ? (props.pulses as number[]).map((p) => Math.round(p * FPS)) : undefined,
  };
  return (
    <Sequence from={now - f} layout="none">
      <CircleHandoff brand={brand} view={layout.view}
        from={{ src: asset(surface.src), page: surface.page, cams, circle: fc, patch: SIDEBAR }}
        to={{ src: asset(to.src), page: to.page, rest, drift: rest, circle: tc, patch: SIDEBAR }}
        times={times} />
    </Sequence>
  );
};
