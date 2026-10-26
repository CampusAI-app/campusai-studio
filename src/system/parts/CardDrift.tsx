/**
 * card-drift (2026-10-23, wave 2, "Find your people"): layered parallax over a real page. The page's own
 * cards, cut from the capture one by one, slide past in three depths (far: small, slow, soft; middle: the
 * focus plane, sharp; near: big, fast, out of focus), the way a camera trucking past a wall of cards sees
 * them. One card in the middle layer floats forward to the centre of the frame, holds, then glides home into
 * its own slot on the page while the other layers fall away and the page comes up from dim. The last frame
 * is the plain page with that card in place, so the next shot (same surface) carries on without a cut.
 * Dictionary: parallax truck (depth-layer-moves), then a lift to camera (element-body-moves).
 *
 * Props:
 *   cards: { src, w, h }[]   element cuts (public/ paths) with their CSS size, every card in the drift.
 *   hero: number             index into `cards` of the one that floats forward; its slot is `shot.focus`.
 *   liftAt?: number          share of the shot when the hero starts forward. Default 0.34.
 *   homeAt?: number          share of the shot when it starts home. Default 0.62.
 *
 * Numbers that matter: cards 0.36 / 0.62 / 0.95 of the view wide, speeds 2.4 / 6 / 12 px a frame
 * (x layout.u), the near layer blurred 6 px and the far 3 px at 42%; the hero rises on SPRING.soft and
 * goes home on the quiet camera curve over DUR.travel.
 */
import React from "react";
import { Img, spring } from "remotion";
import { glow } from "../../kit/brand";
import { rectOnCanvas } from "../../kit/camera";
import { CURVE, DUR, FPS, SPRING } from "../motion";
import { asset, num, ramp, SurfaceView } from "./common";
import type { PartProps } from "./types";

type Card = { src: string; w: number; h: number };

const LAYERS = [
  // far, middle (the focus plane, where the hero rides), near
  { width: 0.36, speed: 2.4, blur: 3, alpha: 0.42, rows: [0.16, 0.74], gap: 0.22 },
  { width: 0.62, speed: 6.0, blur: 0, alpha: 1, rows: [0.45], gap: 0.12 },
  { width: 0.95, speed: 12, blur: 6, alpha: 0.85, rows: [0.98], gap: 0.2 },
] as const;

export const CardDrift: React.FC<PartProps> = ({ shot, surface, brand, f, layout, props, ctx }) => {
  const cards = (Array.isArray(props.cards) ? props.cards : []) as Card[];
  if (!surface || !cards.length || !shot.focus) return null;
  const { view, u } = layout;
  const D = ctx.dur;
  const hero = Math.max(0, Math.min(cards.length - 1, num(props.hero, 0)));
  const liftAt = num(props.liftAt, 0.34) * D;
  const homeAt = num(props.homeAt, 0.62) * D;
  const cam = ctx.cam(f);
  const slot = rectOnCanvas(cam, view, shot.focus);

  // the page under it all: dim while the cards drift, up to full as the hero lands
  const pageDim = 0.82 * (1 - ramp(f, homeAt, D - 4, CURVE.quiet.standard));
  // the drift layers fall away once the hero is out front
  const fall = ramp(f, homeAt - DUR.arrive, homeAt + DUR.arrive, CURVE.quiet.exit);

  const others = cards.map((c, i) => ({ c, i })).filter((x) => x.i !== hero);
  const tiles: React.ReactNode[] = [];
  let heroDrift: { x: number; y: number; w: number; h: number } | null = null;
  let k = 0;
  LAYERS.forEach((L, li) => {
    const w = L.width * view.w;
    const step = w * (1 + L.gap);
    L.rows.forEach((ry, ri) => {
      // each row starts at its own offset so the columns never line up across rows
      const off = ((ri * 0.37 + li * 0.21) % 1) * step;
      const shift = (f + 6) * L.speed * u; // the drift is already moving on frame one
      const count = Math.ceil((view.w + step * 2 + D * L.speed * u) / step) + 1;
      for (let n = 0; n < count; n++) {
        const x = view.x - step + off + n * step - shift + D * L.speed * u * 0.5;
        if (x > view.x + view.w + step || x + w < view.x - step) {
          k++;
          continue;
        }
        // the hero sits in the middle layer, first row, in the column that is near the centre at liftAt
        const isHeroSlot = li === 1 && ri === 0 && (() => {
          const xAtLift = view.x - step + off + n * step - (liftAt + 6) * L.speed * u + D * L.speed * u * 0.5;
          return Math.abs(xAtLift + w / 2 - (view.x + view.w * 0.42)) < step / 2;
        })();
        const card = isHeroSlot ? cards[hero] : others[k % others.length].c;
        k++;
        const h = w * (card.h / card.w);
        const y = view.y + view.h * ry - h / 2;
        if (isHeroSlot) {
          heroDrift = { x, y, w, h };
          continue;
        }
        tiles.push(
          <div key={`${li}-${ri}-${n}`} style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 14 * (w / card.w),
            overflow: "hidden", opacity: L.alpha * (1 - fall), filter: L.blur ? `blur(${(L.blur * u).toFixed(2)}px)` : undefined,
            boxShadow: `0 ${18 * u}px ${50 * u}px rgba(0,0,0,.55)` }}>
            <Img src={asset(card.src)} style={{ width: "100%", height: "100%", display: "block" }} />
          </div>,
        );
      }
    });
  });

  // the hero: drifts with its layer, floats forward to the centre, then glides home into its slot
  const hd = heroDrift as { x: number; y: number; w: number; h: number } | null;
  const hc = cards[hero];
  const presentW = view.w * 0.82;
  const present = { w: presentW, h: presentW * (hc.h / hc.w), x: view.x + (view.w - presentW) / 2, y: 0 };
  present.y = view.y + view.h * 0.46 - present.h / 2;
  const up = spring({ frame: f - liftAt, fps: FPS, config: SPRING.soft });
  const home = ramp(f, homeAt, homeAt + DUR.travel, CURVE.quiet.standard);
  const from = hd ?? { x: view.x + view.w * 0.42 - (view.w * 0.7) / 2, y: view.y + view.h * 0.2, w: view.w * 0.7, h: view.w * 0.7 * (hc.h / hc.w) };
  const mid = { x: from.x + (present.x - from.x) * up, y: from.y + (present.y - from.y) * up, w: from.w + (present.w - from.w) * up, h: from.h + (present.h - from.h) * up };
  const r = { x: mid.x + (slot.x - mid.x) * home, y: mid.y + (slot.y - mid.y) * home, w: mid.w + (slot.w - mid.w) * home, h: mid.h + (slot.h - mid.h) * home };
  const lifted = Math.min(1, up) * (1 - home);
  const heroTile = (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 14 * (r.w / hc.w), overflow: "hidden",
      boxShadow: `0 ${(30 * u * lifted).toFixed(1)}px ${(90 * u * lifted).toFixed(1)}px rgba(0,0,0,${(0.6 * lifted).toFixed(3)}), 0 0 ${(80 * u * lifted).toFixed(0)}px ${glow(brand, 0.32 * lifted)}` }}>
      <Img src={asset(hc.src)} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );

  return (
    <SurfaceView surface={surface} brand={brand} layout={layout} cam={cam} dim={pageDim}>
      {/* children are canvas coordinates, clipped to the page view by PageView */}
      {tiles}
      {/* once it is home the page's own pixels take over (the cut is the same pixels), so it is not drawn twice */}
      {home < 1 ? heroTile : null}
    </SurfaceView>
  );
};
