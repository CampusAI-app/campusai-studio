/**
 * BlocksLand (2026-10-25): items travel from where they were pressed on one page into a calendar week, and each
 * lands in its real slot. Two real pages are on screen at once, the source above and the week below, so the
 * cause and the effect share the frame (Jacob's note on an earlier film: "not clear it's moving from the
 * button"). For each item: the pointer presses the item's own button, the button turns into its pressed state
 * (a cut of that state from the same capture), and a piece the shape of the button lifts off it, flies an arc
 * down to the week and turns into the item's real calendar block on the way (cross-fading from the button cut
 * to the block cut of the AFTER capture). On touchdown the after capture's pixels for that region come up under
 * it (so neighbours that make room, e.g. a column that splits, are the product's own layout, not a guess), the
 * block settles with a small squash, and the slot flashes once in the accent. The week fills.
 *
 * From: the shelf's `element-body-moves` (the lift: spring, contact and ambient shadows) and `research-card-stack-scroll`
 * (the squash on landing), taken from a stack to a grid. Different from the film system's Timelapse (which plays
 * the recorded frames of the week filling, with a clock) and TermTravel (a truck along columns): here each item
 * visibly comes FROM its press and lands IN its slot.
 *
 * Numbers that matter: press at `at`, lift 0 to 8 f after it, travel 30 f on EASE along an arc that bows up
 * 18% of the drop, the piece keeps the button's shape while it shrinks to the block's area (0 to 50%) and takes the block's shape late (45% to 80%), the button's label out by 46% and the block's in from 50% over a beat of plain colour (button red to the block's fill), so no label is ever squashed or doubled, touchdown squash 1.06 / 0.97 / 1 over 10 f,
 * slot flash 18 f. Items 60 f apart by default, so one subject moves at a time.
 *
 * Every pixel is a capture's: `before` and `after` are two real captures of the same week, the after one taken
 * after the item really was added (e.g. capture/r4-week.cjs, which presses "Add to CampusAI Calendar"
 * in a headless browser whose adds stay in its own storage).
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { camAlong, rectOnCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { PointerAt } from "../../Pointer";
import { EASE } from "../../../lib/anim";
import { clamp, Cut, ease01, lerp } from "./shared";
import { rgbOf } from "../../pass/readout/shared";

export type LandItem = {
  /** The button pressed on the source page (page px). The traveller starts as this rectangle. */
  button: Rect;
  /** The button's pressed state (page px of `source.after`, or of the source itself), drawn over `button` after the press. */
  pressed?: Rect;
  /** The item's block on the week's AFTER capture (page px). */
  land: Rect;
  /** The region of the week that changes when it lands (page px). Default: `land`. */
  region?: Rect;
  /** The press, in frames. */
  at: number;
};

export type PageSpec = { src: string; size: Size; view: Rect; cams: { t: number; cam: PageCam }[]; radius?: number };

export type BlocksLandProps = {
  brand: Brand;
  /** The page pressed on; `after` is the same page once every item was added (its buttons in their pressed state). */
  source: PageSpec & { after?: string };
  /** The week: `src` is the BEFORE capture, `after` the same week once every item was added. */
  week: PageSpec & { after: string };
  items: LandItem[];
  travel?: number;
  /** Show the pointer pressing each button. Default true. */
  pointer?: boolean;
  /** The fill of an event block on the week, sampled from the capture; the piece passes through it between labels. */
  blockFill?: string;
};

const pad = (r: Rect, p: number): Rect => ({ x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p });

export const BlocksLand: React.FC<BlocksLandProps> = ({ brand, source, week, items, travel = 30, pointer = true, blockFill = "rgb(72, 12, 20)" }) => {
  const f = useCurrentFrame();
  const sCam = camAlong(f, source.cams);
  const wCam = camAlong(f, week.cams);

  // the pointer: glides to each button, presses, drifts off a little while the piece flies
  let px = source.view.x + source.view.w * 0.82;
  let py = source.view.y + source.view.h + 60;
  let since: number | null = null;
  let pOp = 0;
  items.forEach((it, i) => {
    const b = rectOnCanvas(sCam, source.view, it.button);
    const tx = b.x + b.w * 0.62;
    const ty = b.y + b.h * 0.55;
    const from = i === 0 ? { x: px, y: py } : (() => { const pb = rectOnCanvas(sCam, source.view, items[i - 1].button); return { x: pb.x + pb.w * 0.62 + 40, y: pb.y + pb.h * 0.55 + 70 }; })();
    const a = it.at - 22;
    if (f >= a) {
      const k = ease01(f, a, 20, EASE);
      px = lerp(from.x, tx, k);
      py = lerp(from.y, ty, k);
      if (f >= it.at) {
        since = (f - it.at) / 30;
        const away = ease01(f, it.at + 6, 24, EASE);
        px = tx + 40 * away;
        py = ty + 70 * away;
      }
    }
    pOp = Math.max(pOp, interpolate(f, [items[0].at - 24, items[0].at - 16], [0, 1], clamp));
  });
  const last = items[items.length - 1];
  pOp *= 1 - interpolate(f, [last.at + 16, last.at + 30], [0, 1], clamp);

  return (
    <>
      {/* the source page, with each pressed button turned to its pressed state */}
      <PageView src={source.src} page={source.size} cam={sCam} view={source.view} brand={brand} radius={source.radius ?? 28}>
        {items.map((it, i) => {
          const b = rectOnCanvas(sCam, source.view, it.button);
          const glowK = interpolate(f, [it.at - 14, it.at - 4, it.at + 2, it.at + 22], [0, 1, 1, 0], clamp);
          const squash = interpolate(f, [it.at - 2, it.at + 2, it.at + 9], [1, 0.95, 1], clamp);
          const pr = it.pressed ?? null;
          const prTo = pr ? rectOnCanvas(sCam, source.view, { x: it.button.x + (it.button.w - pr.w) / 2, y: it.button.y + (it.button.h - pr.h) / 2, w: pr.w, h: pr.h }) : null;
          const pIn = interpolate(f, [it.at + 2, it.at + 8], [0, 1], clamp);
          return (
            <React.Fragment key={i}>
              {glowK > 0 ? <div style={{ position: "absolute", left: b.x - 6, top: b.y - 6, width: b.w + 12, height: b.h + 12, borderRadius: 14,
                boxShadow: `0 0 0 2px ${glow(brand, 0.8 * glowK)}, 0 0 34px ${glow(brand, 0.45 * glowK)}` }} /> : null}
              {f >= it.at - 2 && f < it.at + 9 ? (
                <Cut src={source.src} page={source.size} from={it.button}
                  to={{ x: b.x + (b.w * (1 - squash)) / 2, y: b.y + (b.h * (1 - squash)) / 2, w: b.w * squash, h: b.h * squash }} radius={8} />
              ) : null}
              {pr && prTo && pIn > 0 ? <Cut src={source.after ?? source.src} page={source.size} from={pr} to={prTo} opacity={pIn} radius={8} /> : null}
            </React.Fragment>
          );
        })}
      </PageView>

      {/* the week: before, with each landed region of the after capture coming up on touchdown */}
      <PageView src={week.src} page={week.size} cam={wCam} view={week.view} brand={brand} radius={week.radius ?? 28}>
        {items.map((it, i) => {
          const down = it.at + 8 + travel;
          const reg = it.region ?? it.land;
          const r = rectOnCanvas(wCam, week.view, reg);
          const k = interpolate(f, [down - 2, down + 4], [0, 1], clamp);
          const flash = interpolate(f, [down, down + 4, down + 22], [0, 1, 0], clamp);
          const l = rectOnCanvas(wCam, week.view, pad(it.land, 2));
          return (
            <React.Fragment key={i}>
              <Cut src={week.after} page={week.size} from={reg} to={r} opacity={k} />
              {flash > 0 ? <div style={{ position: "absolute", left: l.x, top: l.y, width: l.w, height: l.h, borderRadius: 8,
                boxShadow: `0 0 0 2px ${glow(brand, 0.9 * flash)}, 0 0 40px ${glow(brand, 0.55 * flash)}` }} /> : null}
            </React.Fragment>
          );
        })}
      </PageView>

      {/* the travellers, above both pages */}
      {items.map((it, i) => {
        const start = it.at + 2;
        const lift = ease01(f, start, 8, EASE);
        const t0 = it.at + 8;
        const down = t0 + travel;
        if (f < start || f > down + 10) return null;
        const a = rectOnCanvas(sCam, source.view, it.button);
        const b = rectOnCanvas(wCam, week.view, it.land);
        const p = ease01(f, t0, travel, EASE);
        // the piece keeps the button's shape while it shrinks to the block's area, then takes the block's shape late,
        // so neither the button's label nor the block's ever reads squashed
        const m = Math.sqrt((b.w * b.h) / (a.w * a.h));
        const q = interpolate(p, [0, 0.5], [1, m], clamp);
        const r = interpolate(p, [0.45, 0.8], [0, 1], { ...clamp, easing: EASE });
        const cx0 = lerp(a.x + a.w / 2, b.x + b.w / 2, p);
        const cy0 = lerp(a.y + a.h / 2, b.y + b.h / 2, p);
        const bw = lerp(a.w * q, b.w, r);
        const bh = lerp(a.h * q, b.h, r);
        const box = { x: cx0 - bw / 2, y: cy0 - bh / 2, w: bw, h: bh };
        // an arc: bows up by 18% of the drop at the middle of the travel
        const bow = -0.18 * Math.abs(b.y - a.y) * Math.sin(Math.PI * p);
        // touchdown squash
        const sq = interpolate(f, [down, down + 3, down + 6, down + 10], [1, 1.06, 0.97, 1], clamp);
        const up = 1 + 0.05 * lift * (1 - p);
        const w = box.w * up * (f >= down ? sq : 1);
        const h = box.h * up * (f >= down ? (2 - sq) : 1);
        const x = box.x + (box.w - w) / 2;
        const y = box.y + bow - 10 * lift * (1 - p) + (box.h - h) / 2;
        // the labels never overlap: the button's goes, a beat of plain colour (button red to block fill), then the block's
        const outA = interpolate(p, [0.36, 0.46], [1, 0], clamp);
        const mix = interpolate(p, [0.5, 0.62], [0, 1], clamp);
        const tint = interpolate(p, [0.36, 0.55], [0, 1], clamp);
        const [ar, ag, ab] = rgbOf(brand.color.accent);
        const fill = blockFill.match(/\d+/g)?.map(Number) ?? [72, 12, 20];
        const base = `rgb(${Math.round(lerp(ar, fill[0], tint))}, ${Math.round(lerp(ag, fill[1], tint))}, ${Math.round(lerp(ab, fill[2], tint))})`;
        const fade = interpolate(f, [down + 6, down + 10], [1, 0], clamp);
        const shadow = (1 - p) * lift + Math.sin(Math.PI * p) * 0.6;
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: 0, opacity: fade }}>
            <div style={{ position: "absolute", left: x + 6, top: y + 14 + 26 * shadow, width: w, height: h, borderRadius: 10, background: "#000",
              opacity: 0.35 * shadow, filter: `blur(${(10 + 22 * shadow).toFixed(1)}px)` }} />
            <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 7, background: base }} />
            <Cut src={source.src} page={source.size} from={it.button} to={{ x, y, w, h }} radius={7} opacity={outA} fit="cover" />
            <Cut src={week.after} page={week.size} from={it.land} to={{ x, y, w, h }} radius={6} opacity={mix} fit="cover" align="top-left"
              style={{ boxShadow: `0 0 ${(30 * (1 - p) + 10).toFixed(0)}px ${glow(brand, 0.35)}` }} />
          </div>
        );
      })}

      {pointer && pOp > 0 ? <PointerAt x={px} y={py} since={since} accent={brand.color.accent} opacity={pOp} size={54} /> : null}
    </>
  );
};
