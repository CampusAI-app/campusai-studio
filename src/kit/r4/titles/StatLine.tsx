/**
 * StatLine (round 4 titles, 2026-10-25): one true number with its source line under it, in the caption band below
 * the footage. The number counts in on rolling columns (Zodiak), holds with its source (Inter) for the reading rule,
 * then travels up into the real page and lands on the UI element that shows the same number, dissolving into the
 * real pixels while that element takes a short accent underline. Cause and effect: the big number IS the one on
 * the page.
 *
 * From the shelf shot typography/countdown-arc-scatter: the winning number does not leave, it travels and becomes
 * the first character of the line it belongs to (here, the product's own line), on a 20 f asymmetric in-out with no
 * pause between the stop and the travel. The count uses the kit Odometer's carry rule (`ZDigits`, shared.tsx), so
 * the units spin and the tens turn over only on the carry.
 *
 * Honest numbers only: `value` must be a number the capture shows at `target` (a count from its JSON or read off
 * the page), and `source` says where it is from in plain words. `sourceNote` is not drawn; it travels with the props
 * so the film's facts.md can cite it.
 *
 * Numbers: count 36 f on CURVE.showy.enter (fast, then a long settle; a stat is the one showy beat), hold readFrames
 * of number plus source after the count lands, camera push to the target on DUR.travel while the number holds, then
 * the travel (24 f, DEMOTE) with the dissolve over its last 40 %, then a marker block (accent 24 %) and an underline
 * draw under the real number in 10 f, hold 24 f, fade 12 f.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { clampCam, mixCam, rectOnCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { INTER } from "../../parts";
import { CURVE, DUR } from "../../../system/motion";
import type { MarkPatchSpec } from "./shared";
import { DEMOTE, MarkPatch, ZDigits, drifted, lerp, ramp, readFrames } from "./shared";

export type StatLineProps = {
  brand: Brand;
  page: { src: string; size: Size };
  view: Rect;
  mark: MarkPatchSpec | null;
  /** The framing while the number counts and holds. */
  wide: PageCam;
  /** The framing it lands in: close enough that the real number reads. */
  close: PageCam;
  value: number;
  /** The real number's glyphs on the page, page px (measured off the capture). */
  target: Rect;
  /** Plain words: what the number counts and where it is shown. Drawn under the number. */
  source: string;
  /** Not drawn: the capture and date, for facts.md. */
  sourceNote?: string;
  /** The caption band below the footage, canvas px. The number and source centre in it. */
  band: Rect;
  /** Number size, canvas px. Default 0.74 of the band height. */
  size?: number;
  /** Frame the count starts. Default 4. */
  at?: number;
  countFrames?: number;
};

export const statLineTimes = (p: Pick<StatLineProps, "value" | "source" | "at" | "countFrames">) => {
  const at = p.at ?? 4;
  const counted = at + (p.countFrames ?? 36);
  const flyAt = counted + readFrames(`${p.value} ${p.source}`);
  const pushAt = flyAt - DUR.travel;
  const landed = flyAt + 24;
  return { at, counted, pushAt, flyAt, landed, end: landed + 10 + 24 + 12 };
};

export const StatLine: React.FC<StatLineProps> = (props) => {
  const { brand, page, view, mark, wide, close, value, target, source, band } = props;
  const f = useCurrentFrame();
  const T = statLineTimes(props);
  const size = props.size ?? band.h * 0.74;
  const digits = String(Math.round(value)).length;

  // camera: hold wide (breathing), push to the target while the number still holds, then breathe on the landing
  const hold = drifted(wide, Math.min(f, T.pushAt), 0);
  const cam = clampCam(f < T.pushAt ? hold : mixCam(hold, drifted(close, f, T.flyAt), ramp(f, T.pushAt, T.flyAt, CURVE.quiet.standard)), page.size, view);

  // the count: in out of a blur, then the columns roll to the value
  const inP = ramp(f, T.at, T.at + DUR.arrive);
  const v = value * ramp(f, T.at, T.counted, CURVE.showy.enter);

  // the number's box in the band, and the real number's box on the canvas
  const cellW = size * 0.62;
  const numW = cellW * digits;
  const numH = size * 1.08;
  const srcSize = Math.max(26, size * 0.17);
  const blockH = numH + srcSize * 1.9;
  const home = { x: band.x + (band.w - numW) / 2, y: band.y + (band.h - blockH) / 2, w: numW, h: numH };
  const tgt = rectOnCanvas(cam, view, target);
  // the travel ends with the number's digit height on the real glyph height (Zodiak figures ~0.7 em, cell 1.08 em)
  const kEnd = (tgt.h / 0.7) / size;
  const endBox = { x: tgt.x + tgt.w / 2 - (numW * kEnd) / 2, y: tgt.y + tgt.h / 2 - (numH * kEnd) / 2, w: numW * kEnd, h: numH * kEnd };
  const tr = ramp(f, T.flyAt, T.landed, DEMOTE);
  const k = lerp(1, kEnd, tr);
  const x = lerp(home.x, endBox.x, tr);
  const y = lerp(home.y, endBox.y, tr);
  const dissolve = ramp(f, T.flyAt + 24 * 0.6, T.landed + 2);
  const numOpacity = Math.min(1, inP * 1.4) * (1 - dissolve);

  // the source holds in the band, and leaves as the number does
  const srcIn = ramp(f, T.at + 10, T.at + 10 + 20);
  const srcOut = ramp(f, T.flyAt, T.flyAt + 12, CURVE.quiet.exit);

  // the landing: an accent underline draws under the real number, holds, fades
  const ul = ramp(f, T.landed - 2, T.landed + 8) * (1 - ramp(f, T.landed + 34, T.landed + 46));
  const ulW = tgt.w * 1.15;
  // and a marker block behind it (product-card-progressive-assemble's highlighter, accent at 22 %)
  const mk = ramp(f, T.landed - 4, T.landed + 6) * (1 - ramp(f, T.landed + 34, T.landed + 46));

  return (
    <>
      <PageView src={page.src} page={page.size} cam={cam} view={view} brand={brand}>
        <MarkPatch cam={cam} view={view} spec={mark} />
        {mk > 0.001 ? (
          <div style={{ position: "absolute", left: tgt.x - tgt.h * 0.35, top: tgt.y - tgt.h * 0.32, width: (tgt.w + tgt.h * 0.7) * Math.min(1, mk * 1.4), height: tgt.h * 1.64,
            borderRadius: tgt.h * 0.3, background: brand.color.accent, opacity: 0.24 * mk }} />
        ) : null}
        {ul > 0.001 ? (
          <div style={{ position: "absolute", left: tgt.x + tgt.w / 2 - ulW / 2, top: tgt.y + tgt.h + tgt.h * 0.28, width: ulW * Math.min(1, ul * 1.3), height: Math.max(3, tgt.h * 0.12),
            borderRadius: 4, background: brand.color.accent, opacity: Math.min(1, ul * 1.5), boxShadow: `0 0 ${(tgt.h * 1.2).toFixed(0)}px ${glow(brand, 0.55 * ul)}` }} />
        ) : null}
      </PageView>
      {numOpacity > 0.001 ? (
        <div style={{ position: "absolute", left: x, top: y, width: numW, height: numH, transform: `scale(${k.toFixed(4)})`, transformOrigin: "0 0",
          opacity: numOpacity, filter: inP < 1 ? `blur(${((1 - inP) * 14).toFixed(2)}px)` : undefined,
          textShadow: tr > 0 ? `0 10px 40px rgba(0,0,0,${(0.5 * Math.sin(Math.PI * tr)).toFixed(3)})` : undefined }}>
          <ZDigits value={v} digits={digits} size={size} color={brand.color.ink} family="Zodiak" weight={700} />
        </div>
      ) : null}
      {srcIn * (1 - srcOut) > 0.001 ? (
        <div style={{ position: "absolute", left: band.x, width: band.w, top: home.y + numH + srcSize * 0.5, textAlign: "center",
          fontFamily: INTER, fontWeight: 500, fontSize: srcSize, lineHeight: 1.3, color: brand.color.inkSoft, letterSpacing: "-0.01em",
          opacity: srcIn * (1 - srcOut), transform: `translateY(${((1 - srcIn) * 14 - srcOut * 10).toFixed(2)}px)` }}>
          {source}
        </div>
      ) : null}
    </>
  );
};
