/**
 * term-travel (2026-10-23, wave 2, "Four years, one screen"): timeline travel. The real term columns of a
 * plan (each cut from its own year tab) stand side by side at the page's own spacing, and the camera trucks
 * along them from the first term, picking up speed, then brakes hard and settles on one term (next spring).
 * The real page sits behind, dimmed, moving at a fifth of the speed, so the travel has depth. On the last
 * frames the columns that are not on the real page fall away and the page comes up: the target and its
 * left neighbour are laid at exactly their page positions, so the strip becomes the page with no seam and
 * the next shot on the same surface carries on.
 * Dictionary: timeline travel (a truck along a row), braking into a hold (WhipBrakeReal's long tail).
 *
 * Props:
 *   terms: { src, w, h, term }[]  the columns, in order (public/ paths, CSS size).
 *   target: number                index of the term the camera brakes on; its slot is `shot.focus`.
 *   gap?: number                  CSS px between columns. Default 14 (the planner's own gap).
 *   moveFrom?, moveTo?: number    share of the shot the travel runs over. Default 0.04 to 0.78.
 *   speedUp?: number              share of the travel spent getting up to speed. Default 0.18.
 */
import React from "react";
import { Img } from "remotion";
import { glow } from "../../kit/brand";
import { rectOnCanvas } from "../../kit/camera";
import { CURVE, DUR } from "../motion";
import { asset, num, ramp, SurfaceView } from "./common";
import type { PartProps } from "./types";

type Term = { src: string; w: number; h: number; term?: string };

/** Truck progress 0 to 1: a smooth run-up, then exp braking (velocity ~ e^-4u), integrated and normalised. */
const TABLE = (up: number) => {
  const n = 400;
  const vel = (u: number) => {
    const r = Math.min(1, u / up);
    return r * r * (3 - 2 * r) * Math.exp(-4 * Math.max(0, u - up * 0.6));
  };
  const out = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) out[i] = out[i - 1] + (vel((i - 1) / n) + vel(i / n)) / 2 / n;
  for (let i = 0; i <= n; i++) out[i] /= out[n];
  return out;
};
const CACHE = new Map<number, Float64Array>();
const truck = (u: number, up: number) => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  let t = CACHE.get(up);
  if (!t) CACHE.set(up, (t = TABLE(up)));
  const x = u * 400;
  const i = Math.floor(x);
  return t[i] + (t[i + 1] - t[i]) * (x - i);
};

export const TermTravel: React.FC<PartProps> = ({ shot, surface, brand, f, layout, props, ctx }) => {
  const terms = (Array.isArray(props.terms) ? props.terms : []) as Term[];
  if (!surface || !terms.length || !shot.focus) return null;
  const { view, u } = layout;
  const D = ctx.dur;
  const target = Math.max(0, Math.min(terms.length - 1, num(props.target, terms.length - 1)));
  const gap = num(props.gap, 14);
  const end = ctx.cam(D);
  const slotEnd = rectOnCanvas(end, view, shot.focus);
  const s = slotEnd.w / terms[target].w; // canvas px per CSS px, the scale the strip lives at
  const pitch = (terms[0].w + gap) * s;

  const u0 = (f - num(props.moveFrom, 0.04) * D) / ((num(props.moveTo, 0.78) - num(props.moveFrom, 0.04)) * D);
  const p = truck(u0, num(props.speedUp, 0.18));
  // the strip offset: the first term centred at the start, the target in its slot at the end
  const dx = (target * pitch) * (1 - p);
  const settle = ramp(f, num(props.moveTo, 0.78) * D - DUR.arrive, D - 2, CURVE.quiet.standard);

  // the page behind: a fifth of the speed, dimmed until the strip has settled
  const cam = ctx.cam(f);
  const pageCam = { ...cam, cx: cam.cx - (dx / (view.w / cam.cw)) * 0.2 };
  const pageDim = 0.86 * (1 - settle);
  // the slot moves with the camera's own settle, so the strip and the page stay glued at the end
  const slot = rectOnCanvas(cam, view, shot.focus);
  const sNow = slot.w / terms[target].w;
  const pitchNow = (terms[0].w + gap) * sNow;

  return (
    <SurfaceView surface={surface} brand={brand} layout={layout} cam={pageCam} dim={pageDim}>
      {terms.map((t, i) => {
        const x = slot.x + (i - target) * pitchNow + dx * (sNow / s);
        const w = t.w * sNow;
        const h = t.h * sNow;
        if (x > view.x + view.w + 40 || x + w < view.x - 40) return null;
        // the target and its left neighbour stay (they are on the real page); the rest fall away
        const onPage = i === target || i === target - 1;
        const a = onPage ? 1 : 1 - settle;
        if (a <= 0.001) return null;
        const lit = i === target ? ramp(f, num(props.moveTo, 0.78) * D - DUR.arrive, num(props.moveTo, 0.78) * D + DUR.panel) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: slot.y, width: w, height: h, borderRadius: 14 * sNow, overflow: "hidden", opacity: a,
            boxShadow: `0 ${24 * u}px ${70 * u}px rgba(0,0,0,${(0.5 * (1 - settle)).toFixed(3)}), 0 0 ${(70 * u * lit * (1 - settle)).toFixed(0)}px ${glow(brand, 0.3 * lit)}` }}>
            <Img src={asset(t.src)} style={{ width: "100%", height: "100%", display: "block" }} />
          </div>
        );
      })}
    </SurfaceView>
  );
};
