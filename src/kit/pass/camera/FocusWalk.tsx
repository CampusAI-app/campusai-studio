/**
 * FocusWalk (2026-10-22): one real screen held still in a frame while the camera shifts focus part
 * to part. It moves to a region, the rest of the page dims and softens a little, it holds, it moves
 * to the next. Optionally one Zodiak line per stop, small and above the screen.
 *
 * Inspired by Raylight's "Desktop app presentation": the screen never moves, only the camera and
 * the light do. Built on the kit's PageView + camAlong + dim. The numbers:
 * - moves 24 frames (0.8 s) on EASE_CAMERA, the kit's soft camera curve; the lit region slides
 *   with the camera on the same curve, so camera and light arrive together,
 * - dim 0.5 while walking: PageView's own treatment, so brightness 0.64, saturation 0.7, blur
 *   1.5 px on everything outside the region (softens, never hides),
 * - every hold drifts the camera in 1.5%, linear, so no frame is a freeze,
 * - framing: the region at `pad` of the view (default 1.18), never tighter than the capture's DPR
 *   allows (cw >= view.w / dpr), and clamped so the view stays on the page,
 * - a line shows from the start of the move into its stop to the end of the move out, so the
 *   piece that uses it must give the stop hold enough that it stays letters / 15 + 1.5 s.
 */
import React from "react";
import { Img, interpolate, useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { glow, useBrandFonts } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { camAlong, clampCam, rectOnCanvas, toCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { BlurLines, ZODIAK } from "../../parts";
import { EASE_CAMERA } from "../../../lib/anim";
import type { MarkPatchSpec } from "./shared";
import { MarkPatch, mixRect, padRect } from "./shared";

export type FocusStop = {
  /** The region, page px. */
  rect: Rect;
  /** Frames held on it. */
  hold: number;
  /** One short line from the capture, shown above the screen. */
  line?: string;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** The camera that frames a region. */
export const frameRect = (r: Rect, page: Size, view: Rect, pad = 1.18, dpr = 2): PageCam => {
  const cw = Math.max(r.w * pad, r.h * pad * (view.w / view.h), view.w / dpr);
  return clampCam({ cx: r.x + r.w / 2, cy: r.y + r.h / 2, cw }, page, view);
};

/** Frame-by-frame plan of a walk: camera keys, region keys, dim keys and each line's window. */
export const planWalk = (o: { stops: FocusStop[]; page: Size; view: Rect; intro: PageCam; outro?: PageCam; at: number; move: number; release: number; pad: number; dpr: number }) => {
  const cams: { t: number; cam: PageCam }[] = [{ t: o.at, cam: o.intro }];
  const rects: { t: number; r: Rect }[] = [];
  const lines: { text: string; from: number; to: number }[] = [];
  let t = o.at;
  o.stops.forEach((s, i) => {
    const cam = frameRect(s.rect, o.page, o.view, o.pad, o.dpr);
    const arrive = t + o.move;
    const leave = arrive + s.hold;
    cams.push({ t: arrive, cam }, { t: leave, cam: clampCam({ ...cam, cw: cam.cw * 0.985 }, o.page, o.view) });
    rects.push({ t: arrive, r: s.rect }, { t: leave, r: s.rect });
    if (s.line) lines.push({ text: s.line, from: t, to: leave + (i < o.stops.length - 1 ? o.move : o.release) });
    t = leave;
  });
  const last = cams[cams.length - 1].cam;
  const end = t + o.release;
  // the release eases to `outro`, or a third of the way back toward the opening framing
  const back = { cx: last.cx + (o.intro.cx - last.cx) * 0.35, cy: last.cy + (o.intro.cy - last.cy) * 0.35, cw: last.cw + (o.intro.cw - last.cw) * 0.35 };
  cams.push({ t: end, cam: clampCam(o.outro ?? back, o.page, o.view) });
  return { cams, rects, lines, firstArrive: o.at + o.move, lastLeave: t, end };
};

const rectAlong = (t: number, keys: { t: number; r: Rect }[]) => {
  if (t <= keys[0].t) return keys[0].r;
  const last = keys[keys.length - 1];
  if (t >= last.t) return last.r;
  const i = keys.findIndex((k, n) => t >= k.t && t < keys[n + 1].t);
  const k = interpolate(t, [keys[i].t, keys[i + 1].t], [0, 1], { ...clamp, easing: EASE_CAMERA });
  return mixRect(keys[i].r, keys[i + 1].r, k);
};

export const FocusWalk: React.FC<{
  src: string;
  page: Size;
  view: Rect;
  brand: Brand;
  stops: FocusStop[];
  /** The opening framing, before the first stop. Defaults to the first stop pulled back 40%. */
  intro?: PageCam;
  /** The framing the release eases to. Defaults to a third of the way back toward `intro`. */
  outro?: PageCam;
  at?: number;
  /** Frames per move between stops (0.8 s default). */
  move?: number;
  /** Frames to release the light and ease back at the end. */
  release?: number;
  dim?: number;
  pad?: number;
  dpr?: number;
  /** Where the stop lines sit: their centre line on the canvas and size. */
  lineBand?: { y: number; size: number };
  mark?: MarkPatchSpec | null;
}> = ({ src, page, view, brand, stops, intro, outro, at = 0, move = 24, release = 24, dim = 0.5, pad = 1.18, dpr = 2, lineBand, mark = null }) => {
  useBrandFonts(brand);
  const f = useCurrentFrame();
  const first = frameRect(stops[0].rect, page, view, pad, dpr);
  const open = intro ?? clampCam({ ...first, cw: first.cw * 1.4 }, page, view);
  const plan = planWalk({ stops, page, view, intro: open, outro, at, move, release, pad, dpr });
  const cam = camAlong(f, plan.cams);
  const d = dim * Math.min(
    interpolate(f, [at + move * 0.25, plan.firstArrive], [0, 1], { ...clamp, easing: EASE_CAMERA }),
    1 - interpolate(f, [plan.lastLeave, plan.end], [0, 1], { ...clamp, easing: EASE_CAMERA }),
  );
  const region = padRect(rectAlong(f, plan.rects), 8);
  const r = rectOnCanvas(cam, view, region);
  const o = toCanvas(cam, view, 0, 0);
  const s = view.w / cam.cw;
  const rad = 12 * s;
  const band = lineBand ?? { y: view.y / 2, size: 58 };
  return (
    <>
      <PageView src={src} page={page} cam={cam} view={view} brand={brand} dim={d}>
        {/* the region, undimmed: the same image, clipped to the region, on top of the dimmed page */}
        {d > 0.005 ? (
          <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: rad, overflow: "hidden",
            boxShadow: `0 0 0 ${Math.max(1.2, 0.8 * s).toFixed(2)}px ${glow(brand, 0.5 * (d / dim))}, 0 0 ${(70 * (d / dim)).toFixed(0)}px ${glow(brand, 0.2 * (d / dim))}` }}>
            <Img src={src} style={{ position: "absolute", left: o.x - r.x, top: o.y - r.y, width: page.w * s, height: page.h * s, maxWidth: "none" }} />
          </div>
        ) : null}
        <MarkPatch cam={cam} view={view} spec={mark} />
      </PageView>
      {plan.lines.map((l, i) =>
        f >= l.from - 1 && f <= l.to + 12 ? (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: band.y - band.size * 0.6, display: "flex", justifyContent: "center" }}>
            <BlurLines lines={[{ text: l.text }]} at={l.from} outAt={l.to - 6} size={band.size} stagger={3}
              ink={{ ink: brand.color.ink, soft: brand.color.inkSoft, accent: brand.color.accent, surface: brand.color.surface, line: "transparent" }} face={ZODIAK} />
          </div>
        ) : null,
      )}
    </>
  );
};
