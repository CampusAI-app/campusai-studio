/**
 * ListReRank (2026-10-25): a real list re-orders on screen. The rows are the list's own cards, cut out of a
 * capture by their measured boxes; the list area under them is cleared to its panel (the panel's own pixels,
 * stretched), so the rows are the only thing that moves. The rows that land at the top come up one at a time,
 * lifted, from below the frame, while every row they pass slides down to make room (FLIP, done as a sum of
 * per-move deltas so moves can overlap and the whole thing stays a pure function of the frame). When a row
 * lands, its own reason (a line on that card, measured, e.g. "Posted today") is ringed in the accent, so the
 * viewer reads why it moved on the row itself. Then everything below the fold settles into the final order.
 *
 * From: the shelf's `list-stack-press` (ui-entrance; cards arrive one by one and the stack answers each
 * landing) and `list-reveal` (per-row entrance on its own window over a group motion), taken from "arrive" to
 * "re-order". Distinct from the readout RoleCard (one card lifts out and goes home to the SAME slot) and the
 * film system's CardDrift (parallax past a wall): here the slots themselves change.
 *
 * Numbers that matter: each mover travels `travel` frames (default 30) on EASE_CAMERA (ease in and out, so it never
 * pops in from the frame edge; EASE's fast start covered 60% of the trip in 2 frames), rises
 * 3% and casts a two-layer shadow that separates with height; the rows it passes move on the same window,
 * 3 frames late on the same curve, so the hole opens as it arrives, never ahead of it. Movers start `step` frames apart (default 24, so about one
 * subject at a time); a mover from far below starts just under the frame instead of streaking across the page.
 * The reason ring draws in 10 frames from 70% of the travel and stays.
 *
 * Every string on screen is the capture's: pass the before and after orders from two real captures of the
 * same list (e.g. Job Match sorted "Best match", then "Newest").
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { camAlong, rectOnCanvas, toCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { EASE, EASE_CAMERA } from "../../../lib/anim";
import { clamp, Cut, ease01, Stretch } from "./shared";

export type RerankRow = {
  id: string;
  /** The row's box in the cut image, page px (a tall capture's box equals its page box). */
  box: Rect;
  /** The row's own reason line in the cut image, page px (absolute). Ringed when it lands. */
  reason?: Rect;
};

export type ListReRankProps = {
  brand: Brand;
  /** The page behind the list (a viewport capture) and its size. */
  page: { src: string; size: Size };
  /** Where the rows are cut from (usually the tall capture of the same page). Default: `page`. */
  cut?: { src: string; size: Size };
  /** Every row in the list, in any order; the before order is read from `box.y`. */
  rows: RerankRow[];
  /** Row ids top to bottom after the change (from the second capture). Rows not listed keep their place at the end. */
  after: string[];
  /** Ids that come up one at a time, in order. Each goes to its index in `after`; they must be its top rows. */
  movers: string[];
  /** The list (page px): x and w of the rows, y the top of the first row. */
  column: Rect;
  /** The area cleared to the panel (page px), runs to the page's bottom. Default `column`; make it wider when the
   *  page draws a ring or glow round a selected row, or that glow stays behind when the row moves. */
  clear?: Rect;
  /** A plain strip of the panel the list sits on (page px), stretched across `column`. */
  strip: Rect;
  /** Gap between rows, page px. Default 10 (Job Match's own). */
  gap?: number;
  view: Rect;
  /** Page camera keys (frames). */
  cams: { t: number; cam: PageCam }[];
  /** First mover's start, frames. */
  at: number;
  step?: number;
  travel?: number;
  /** When the rest settle into the final order. Default: one step after the last mover. */
  settleAt?: number;
  radius?: number;
  /** Extra overlays in canvas coordinates, drawn inside the page (e.g. a mark patch). */
  children?: (cam: PageCam) => React.ReactNode;
};

const stack = (order: string[], byId: Map<string, RerankRow>, top: number, gap: number) => {
  const y = new Map<string, number>();
  let t = top;
  order.forEach((id) => {
    y.set(id, t);
    t += (byId.get(id)?.box.h ?? 0) + gap;
  });
  return y;
};

/** The orders the list passes through: before, one per mover, then the final order. */
export const rerankOrders = (rows: RerankRow[], after: string[], movers: string[]) => {
  const before = [...rows].sort((a, b) => a.box.y - b.box.y).map((r) => r.id);
  const final = [...after, ...before.filter((id) => !after.includes(id))];
  const orders = [before];
  movers.forEach((id) => {
    const o = orders[orders.length - 1].filter((x) => x !== id);
    o.splice(Math.max(0, final.indexOf(id)), 0, id);
    orders.push(o);
  });
  orders.push(final);
  return orders;
};

export const ListReRank: React.FC<ListReRankProps> = ({
  brand, page, cut, rows, after, movers, column, clear, strip, gap = 10, view, cams, at, step = 24, travel = 30, settleAt, radius = 0, children,
}) => {
  const f = useCurrentFrame();
  const src = cut ?? page;
  const cam = camAlong(f, cams);
  const s = view.w / cam.cw;
  const byId = new Map(rows.map((r) => [r.id, r]));
  const orders = rerankOrders(rows, after, movers);
  const ys = orders.map((o) => stack(o, byId, column.y, gap));
  const starts = movers.map((_, k) => at + k * step);
  starts.push(settleAt ?? at + movers.length * step);
  const bottom = view.y + view.h;

  // every row: its page y as a sum of the per-step deltas, each eased on its own window
  const placed = rows.map((r) => {
    let y = ys[0].get(r.id) ?? r.box.y;
    ys.slice(1).forEach((yn, k) => {
      const d = (yn.get(r.id) ?? 0) - (ys[k].get(r.id) ?? 0);
      if (!d) return;
      const own = movers[k] === r.id;
      y += d * ease01(f, starts[k] + (own ? 0 : 3), travel, EASE_CAMERA);
    });
    const k = movers.indexOf(r.id);
    let canvasY = toCanvas(cam, view, 0, y).y;
    let lift = 0;
    if (k >= 0 && f >= starts[k]) {
      // a mover from far below starts just under the frame, then travels to its slot
      const yStart = toCanvas(cam, view, 0, ys[k].get(r.id) ?? 0).y;
      const yEnd = toCanvas(cam, view, 0, ys[k + 1].get(r.id) ?? 0).y;
      const p = ease01(f, starts[k], travel, EASE_CAMERA);
      canvasY = Math.min(yStart, bottom + 30) + (yEnd - Math.min(yStart, bottom + 30)) * p;
      lift = Math.sin(Math.PI * Math.min(1, (f - starts[k]) / travel));
    }
    return { r, canvasY, lift, k };
  });

  const left = toCanvas(cam, view, column.x, 0).x;
  const area = clear ?? column;
  const colCanvas = rectOnCanvas(cam, view, { ...area, h: page.size.h - area.y });

  return (
    <PageView src={page.src} page={page.size} cam={cam} view={view} brand={brand} radius={radius}>
      <Stretch src={page.src} page={page.size} strip={strip} area={area} to={colCanvas} s={s} />
      {children?.(cam)}
      {[...placed].sort((a, b) => a.lift - b.lift).map(({ r, canvasY, lift, k }) => {
        const w0 = r.box.w * s;
        const h0 = r.box.h * s;
        if (canvasY > bottom + 40 || canvasY + h0 < view.y - 40) return null;
        const grow = 1 + 0.03 * lift;
        const w = w0 * grow;
        const h = h0 * grow;
        const x = left - (w - w0) / 2;
        const y = canvasY - (h - h0) / 2;
        const ring = k >= 0 && r.reason ? interpolate(f, [starts[k] + travel * 0.7, starts[k] + travel * 0.7 + 10], [0, 1], { ...clamp, easing: EASE }) : 0;
        const rr = r.reason ? { x: x + (r.reason.x - r.box.x) * s * grow, y: y + (r.reason.y - r.box.y) * s * grow, w: r.reason.w * s * grow, h: r.reason.h * s * grow } : null;
        return (
          <React.Fragment key={r.id}>
            {lift > 0.01 ? (
              <>
                <div style={{ position: "absolute", left: x + 10, top: y + 18 + 40 * lift, width: w, height: h, borderRadius: 12 * s, background: "#000",
                  opacity: 0.3 + 0.25 * lift, filter: `blur(${(16 + 30 * lift).toFixed(1)}px)` }} />
                <div style={{ position: "absolute", left: x + 2, top: y + 4 + 12 * lift, width: w, height: h, borderRadius: 12 * s, background: "#000",
                  opacity: 0.5 - 0.2 * lift, filter: `blur(${(4 + 10 * lift).toFixed(1)}px)` }} />
              </>
            ) : null}
            <Cut src={src.src} page={src.size} from={r.box} to={{ x, y, w, h }} radius={12 * s * grow}
              style={{ boxShadow: lift > 0.01 ? `0 0 0 ${1.5}px rgba(255,255,255,${(0.08 + 0.1 * lift).toFixed(3)})` : undefined }} />
            {rr && ring > 0 ? (
              <div style={{ position: "absolute", left: rr.x - 7 * s * 0.6, top: rr.y - 4 * s * 0.6, width: rr.w + 14 * s * 0.6, height: rr.h + 8 * s * 0.6,
                borderRadius: 999, border: `${(1.4 * s).toFixed(2)}px solid ${brand.color.accent}`, background: glow(brand, 0.16 * ring),
                boxShadow: `0 0 ${(18 * s).toFixed(0)}px ${glow(brand, 0.35 * ring)}`, opacity: ring,
                clipPath: `inset(0 ${((1 - ring) * 100).toFixed(1)}% 0 0 round 999px)` }} />
            ) : null}
          </React.Fragment>
        );
      })}
    </PageView>
  );
};
