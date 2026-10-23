/**
 * ProductInLetters (2026-10-22): the real product glides inside giant display letters, then the
 * letters grow past the frame until the product is all you see. The word is the door, the product
 * is behind it.
 *
 * Ported from the shelf shot `text-as-mask` (shots/demos/opening/text-as-mask). Kept: the baseline
 * wipe-in with a 1.04 to 1 settle, the breath before the rush (letters to 0.965 over 8 frames), the
 * zoom pinned on a solid stem that is pulled to the frame centre as it grows. Changed (round 2, after
 * the first rush read as shards): the letters grow as whole shapes to about 9x (not 46x) on one
 * eased curve in log space, bezier(.5, 0, .2, 1) over 30 frames, while the page OUTSIDE the letters
 * fades up from the ground (rush 0.08 to 0.85), so the word opens into the page in one move. The
 * camera inside lands on the final framing on the same curve. One SVG clip instead of a CSS mask
 * scaled with transform, so the letters stay vector and the page image is laid out at size. The
 * hold keeps a linear drift. Built for wide frames (the website hero, 16:9 posts): in portrait a
 * six-letter word is too thin for the product to read inside it.
 * Dictionary: text-as-mask (type as window), then a mask expansion takeover.
 *
 * Dark product inside letters on a dark ground reads as nothing, so the letters get the product's
 * own light: the capture is lifted to 1.3 brightness inside them (eased back to 1 during the rush so
 * the takeover is seamless), a 2 px rim in the ink at 30%, and a soft red glow behind.
 */
import React from "react";
import { Easing, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { PageCam, Size } from "../../camera";
import { mixCam, toCanvas } from "../../camera";
import { ZODIAK } from "../../parts";
import { EASE } from "../../../lib/anim";
import { M_RECT, clamp } from "./shared";

export type ProductInLettersTimes = {
  /** Letters wipe up from the baseline. */
  in: number;
  /** The camera glides from `glide.from` to `glide.to` between these frames. */
  glideEnd: number;
  /** Breath, then the rush. */
  rush: number;
  rushEnd: number;
  /** The camera lands on `final` here (a little after the rush, the follow-through). */
  land: number;
};

export type ProductInLettersProps = {
  brand: Brand;
  word: string;
  src: string;
  /** The capture's CSS size (a tall capture: 1440 by its `tallH`). */
  page: Size;
  glide: { from: PageCam; to: PageCam };
  /** The framing once the letters are gone. Keep it clear of the sidebar mark or pass `patch`. */
  final: PageCam;
  /** Where the final framing drifts to over the hold (linear). Default: 3% tighter. */
  finalDrift?: PageCam;
  /** Font size and baseline, canvas px. The word is centred on the canvas. */
  size: number;
  baseline: number;
  /** Letter spacing. Default Zodiak's own -0.02em. */
  track?: string;
  /** A point on a solid stroke of the word, canvas px. The zoom grows about it. Render a still and check it sits inside a stem. */
  origin: { x: number; y: number };
  times: ProductInLettersTimes;
  /** Sidebar colour, to patch the Maryland mark if the camera ever reaches it. */
  patch?: string;
  maxScale?: number;
};

const SNAPPY = Easing.bezier(0.16, 1, 0.3, 1);
const SWIFT = Easing.bezier(0.4, 0, 0.2, 1);
const GROW = Easing.bezier(0.5, 0, 0.2, 1);

export const ProductInLetters: React.FC<ProductInLettersProps> = ({
  brand, word, src, page, glide, final, finalDrift, size, baseline, track = ZODIAK.track, origin, times, patch, maxScale = 9,
}) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const id = React.useId().replace(/:/g, "");
  const T = times;

  // letters: wipe up from the baseline and settle 1.04 to 1
  const intro = interpolate(f, [T.in, T.in + 18], [0, 1], { ...clamp, easing: SNAPPY });
  const wipe = interpolate(f, [T.in, T.in + 16], [0, 1], { ...clamp, easing: EASE });
  const introS = 1.04 - 0.04 * intro;
  const breath = interpolate(f, [T.rush - 8, T.rush], [0, 1], { ...clamp, easing: SWIFT });
  const rushT = interpolate(f, [T.rush, T.rushEnd], [0, 1], clamp);
  // one continuous move in log space: eases in, travels, settles (no snap at either end)
  const rush = GROW(rushT);
  const s0 = introS * (1 - 0.035 * breath);
  const S = s0 * Math.pow(maxScale / s0, rush);
  const ox = origin.x + (W / 2 - origin.x) * rush;
  const oy = origin.y + (H / 2 - origin.y) * rush;
  const textT = `translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${S.toFixed(5)}) translate(${-origin.x} ${-origin.y})`;

  // camera: a constant-speed glide (linear, the ambient drift), then the landing with expo-out
  const g = interpolate(f, [T.in, T.glideEnd], [0, 1], clamp);
  const glideCam = mixCam(glide.from, glide.to, g);
  const land = interpolate(f, [T.rush, T.land], [0, 1], { ...clamp, easing: GROW });
  const drift = finalDrift ?? { ...final, cw: final.cw * 0.97 };
  const hold = interpolate(f, [T.land, T.land + 150], [0, 1], clamp);
  const cam = land < 1 ? mixCam(glideCam, final, land) : mixCam(final, drift, hold);

  const view = { x: 0, y: 0, w: W, h: H };
  const o = toCanvas(cam, view, 0, 0);
  const img = { x: o.x, y: o.y, w: page.w * o.s, h: page.h * o.s };
  const m = toCanvas(cam, view, M_RECT.x, M_RECT.y);

  // the page outside the letters fades up from the ground while they grow, so the word opens into
  // the page instead of breaking into stray shards against black
  const reveal = interpolate(rushT, [0.08, 0.85], [0, 1], { ...clamp, easing: SWIFT });
  const lift = 1 + 0.3 * (1 - reveal);
  const rim = 1 - interpolate(rushT, [0, 0.3], [0, 1], clamp);
  const cover = reveal;
  const wipeTop = baseline + 0.32 * size - wipe * 1.2 * size;

  const textProps = {
    x: W / 2, y: baseline, textAnchor: "middle" as const, fontFamily: ZODIAK.family, fontWeight: ZODIAK.weight, fontSize: size,
    letterSpacing: track, transform: textT,
  };
  // HTML image laid out at size (Remotion waits for <Img>; an SVG <image> it would not), clipped by
  // the SVG text through CSS clip-path
  const picture = (filter?: string) => (
    <>
      <Img src={src} style={{ position: "absolute", left: img.x, top: img.y, width: img.w, height: img.h, maxWidth: "none", filter }} />
      {patch && <div style={{ position: "absolute", left: m.x, top: m.y, width: M_RECT.w * o.s, height: M_RECT.h * o.s, background: patch }} />}
    </>
  );
  const full: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H };

  return (
    <div style={full}>
      {cover > 0 && <div style={{ ...full, opacity: cover }}>{picture()}</div>}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id={`w${id}`} clipPathUnits="userSpaceOnUse"><text {...textProps}>{word}</text></clipPath>
          {/* the wipe as a user-space rect: a CSS inset() on an SVG shape clips to the shape's own box */}
          <clipPath id={`r${id}`} clipPathUnits="userSpaceOnUse"><rect x={0} y={Math.max(0, wipeTop)} width={W} height={H} /></clipPath>
          <filter id={`b${id}`} x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation={26} /></filter>
        </defs>
        {cover < 1 && (
          // the product's own red light behind the word
          <g clipPath={`url(#r${id})`}>
            <text {...textProps} fill={glow(brand, 0.5 * rim)} filter={`url(#b${id})`} opacity={intro}>{word}</text>
          </g>
        )}
      </svg>
      {cover < 1 && (
        <div style={{ ...full, clipPath: `inset(${Math.max(0, wipeTop).toFixed(1)}px 0 0 0)`, opacity: intro }}>
          <div style={{ ...full, clipPath: `url(#w${id})`, background: brand.color.bg }}>{picture(`brightness(${lift.toFixed(3)})`)}</div>
        </div>
      )}
      {cover < 1 && (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, clipPath: `inset(${Math.max(0, wipeTop).toFixed(1)}px 0 0 0)` }}>
          <text {...textProps} fill="none" stroke={brand.color.ink} strokeOpacity={0.3 * rim * intro} strokeWidth={2} vectorEffect="non-scaling-stroke">{word}</text>
        </svg>
      )}
    </div>
  );
};
