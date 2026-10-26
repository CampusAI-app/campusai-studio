/**
 * TallyRoll (2026-10-25): a count in the real UI rolls from one value to the next, digit by digit, and only
 * after the thing it counts has visibly arrived. Two real views share the frame: the items' page (where each
 * new item drops into its place) and the count's page (the row that holds the number). For each step the item
 * arrives first: the next real capture's pixels for the region that changed come in, the new item itself falling
 * the last few pixels into its slot and settling; then, `lag` frames later, the count's digit column rolls one
 * notch (the kit's Odometer, so a carry turns the tens only on the carry) and the count's row warms for a beat.
 *
 * From: the shelf's `list-stack-press` (its DigitRoll counter that advances one cell per landing, "the counter
 * and the landing must stay in step") and the kit's `Odometer`, here put into the product's own row instead of a
 * standalone number. Different from the readout ScoreFill (a ring that fills as steps land, with labels): here
 * the number is the product's own small count, in its own type, and each step is a separate real capture.
 *
 * Numbers that matter: the item falls 26 page px over 12 f with a 2 f 0.985 squash on touchdown; the region
 * cross-fades in over 6 f; the digit rolls over 12 f on EASE starting `lag` (default 8) frames after the item
 * lands. The patch under the digit is the row's own colour, sampled from the capture.
 *
 * Values come only from captures: pass `steps` with each step's capture and the count it shows.
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { Rect } from "../../camera";
import { camAlong, rectOnCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { Odometer } from "../../parts";
import { EASE } from "../../../lib/anim";
import type { PageSpec } from "./BlocksLand";
import { clamp, Cut, ease01 } from "./shared";

export type TallyStep = {
  /** The capture after this item arrived (same page and size as `items.src`). */
  src: string;
  /** The region that changed from the previous capture (page px). */
  region: Rect;
  /** The item itself in this capture (page px): it falls into this slot. */
  item: Rect;
  /** The count this capture shows. */
  value: number;
  /** When the item lands, frames. */
  at: number;
};

export type TallyRollProps = {
  brand: Brand;
  /** The items' page; `src` is the capture before the first step. */
  items: PageSpec;
  /** The count's page (may be the same capture or another of the same screen). */
  count: PageSpec & {
    /** The digit box on that page (page px), right edge is where the number ends. */
    digit: Rect;
    /** The row the count belongs to (page px), warmed on each roll. */
    row: Rect;
    /** The row's own colour under the digit, sampled from the capture. */
    patch: string;
    /** The digit's own colour, sampled from the capture. */
    ink: string;
    /** The count before the first step. */
    from: number;
    /** CSS px of the UI's digit text. Default 12.5. */
    fontSize?: number;
    weight?: number;
  };
  steps: TallyStep[];
  lag?: number;
};

export const TallyRoll: React.FC<TallyRollProps> = ({ brand, items, count, steps, lag = 8 }) => {
  const f = useCurrentFrame();
  const iCam = camAlong(f, items.cams);
  const cCam = camAlong(f, count.cams);

  // the value: each step rolls one notch, `lag` frames after its item lands
  let value = count.from;
  let warm = 0;
  steps.forEach((st, i) => {
    const prev = i === 0 ? count.from : steps[i - 1].value;
    const k = ease01(f, st.at + lag, 12, EASE);
    value += (st.value - prev) * k;
    warm = Math.max(warm, interpolate(f, [st.at + lag, st.at + lag + 4, st.at + lag + 26], [0, 1, 0], clamp));
  });
  const digits = Math.max(String(Math.round(Math.max(count.from, ...steps.map((s) => s.value)))).length, 1);

  const d = rectOnCanvas(cCam, count.view, count.digit);
  const row = rectOnCanvas(cCam, count.view, count.row);
  const s = count.view.w / cCam.cw;
  const size = (count.fontSize ?? 12.5) * s;
  const cellW = size * 0.62;
  const odoW = cellW * digits;
  const odoH = size * 1.05;

  return (
    <>
      <PageView src={items.src} page={items.size} cam={iCam} view={items.view} brand={brand} radius={items.radius ?? 28}>
        {steps.map((st, i) => {
          if (f < st.at - 12) return null;
          const reg = rectOnCanvas(iCam, items.view, st.region);
          const fall = ease01(f, st.at - 12, 12, EASE);
          const regIn = interpolate(f, [st.at - 2, st.at + 4], [0, 1], clamp);
          const it = rectOnCanvas(iCam, items.view, st.item);
          const sIt = items.view.w / iCam.cw;
          const squash = interpolate(f, [st.at, st.at + 2, st.at + 5], [1, 0.985, 1], clamp);
          const dy = -26 * sIt * (1 - fall);
          const flash = interpolate(f, [st.at, st.at + 4, st.at + 22], [0, 1, 0], clamp);
          return (
            <React.Fragment key={i}>
              {/* the region of this capture (neighbours that made room), under the falling item */}
              <Cut src={st.src} page={items.size} from={st.region} to={reg} opacity={regIn} />
              {/* the item, falling the last few px into its slot */}
              {f < st.at + 6 ? (
                <Cut src={st.src} page={items.size} from={st.item}
                  to={{ x: it.x + (it.w * (1 - squash)) / 2, y: it.y + dy, w: it.w * squash, h: it.h * (2 - squash) }}
                  radius={6} opacity={Math.min(1, fall * 1.6)} style={{ boxShadow: `0 ${(14 * (1 - fall)).toFixed(1)}px ${(26 * (1 - fall)).toFixed(1)}px rgba(0,0,0,.45)` }} />
              ) : null}
              {flash > 0 ? <div style={{ position: "absolute", left: it.x - 2, top: it.y - 2, width: it.w + 4, height: it.h + 4, borderRadius: 7,
                boxShadow: `0 0 0 2px ${glow(brand, 0.85 * flash)}, 0 0 36px ${glow(brand, 0.5 * flash)}` }} /> : null}
            </React.Fragment>
          );
        })}
      </PageView>

      <PageView src={count.src} page={count.size} cam={cCam} view={count.view} brand={brand} radius={count.radius ?? 28}>
        {warm > 0 ? <div style={{ position: "absolute", left: row.x - 6, top: row.y - 2, width: row.w + 12, height: row.h + 4, borderRadius: 8 * s,
          background: glow(brand, 0.1 * warm), boxShadow: `inset 0 0 0 ${(0.8 * s).toFixed(1)}px ${glow(brand, 0.45 * warm)}` }} /> : null}
        {/* the capture's own digit, painted out in the row's own colour, and the rolling number in its place */}
        <div style={{ position: "absolute", left: d.x + d.w - odoW - 2 * s, top: d.y - 1.5 * s, width: odoW + 4 * s, height: d.h + 3 * s, background: count.patch }} />
        <div style={{ position: "absolute", left: d.x + d.w - odoW + cellW * 0.08, top: d.y + d.h / 2 - odoH / 2 }}>
          <Odometer value={value} digits={digits} size={size} color={count.ink} weight={count.weight ?? 500} />
        </div>
      </PageView>
    </>
  );
};

