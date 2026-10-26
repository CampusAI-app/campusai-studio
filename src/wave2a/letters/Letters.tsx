/**
 * Product inside the letters (2026-10-23, wave 2, motion lane): a wide 16x9 loop, about 9.5 s. The real
 * CampusAI dashboard glides inside the giant Zodiak word "campus" (the kit ProductInLetters), the letters
 * breathe in, then grow past the frame until the dashboard is all you see; the dashboard then folds down
 * into the CampusAI logo (the end turns the product into the logo), the logo holds and breathes, and fades
 * back to the ground the word rises from, so the last frame hands to the first.
 *
 * Wide only, on purpose: in portrait a six-letter word is too thin for the product to read inside it (the
 * part's own note). Logo near the start: the held mark sits top left from 0.3 s and leaves as the letters rush (the
 * dashboard's own logo then takes that corner). Every pixel inside the letters is the real page (public/sys2/letters/dashboard.jpg, campusai-demo,
 * dark, 2026-10-23), the Maryland mark patched in the sidebar's colour.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { brand as brandOf, useBrandFonts } from "../../kit/brand";
import type { PageCam } from "../../kit/camera";
import { LogoEnd } from "../../kit/LogoMoment";
import { ProductInLetters } from "../../kit/pass/type/ProductInLetters";
import { SIDEBAR } from "../../kit/pass/type/shared";
import { EASE } from "../../lib/anim";
import { CURVE } from "../../system/motion";
import { SurfaceView } from "../../system/parts/common";
import type { Layout } from "../../system/parts/types";

const B = brandOf("campusai");
export const W = 1920;
export const H = 1080;
export const FPS = 30;
const PAGE = { w: 1440, h: 900 };
const SRC = "sys2/letters/dashboard.jpg";
const TIMES = { in: 0, glideEnd: 104, rush: 108, rushEnd: 140, land: 146 };
const FINAL: PageCam = { cx: 720, cy: 405, cw: 1440 };
const DRIFT: PageCam = { cx: 720, cy: 398, cw: 1400 };
// the fold into the logo: the page (on its drift) shrinks into the logo's box
const FOLD = 196;
const FOLD_LEN = 20;
const LOGO_AT = FOLD + 8;
const HOLD_END = LOGO_AT + 64;
const BACK = 14;
export const DURATION = HOLD_END + BACK;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const NO_LAYOUT = { radius: 0 } as unknown as Layout;

export const Letters: React.FC = () => {
  useBrandFonts(B);
  const f = useCurrentFrame();
  const logoW = 620;
  const ratio = B.logo?.ratio ?? 4;
  const box = { x: W / 2 - logoW / 2, y: H / 2 - logoW / ratio / 2, w: logoW, h: logoW / ratio };
  const c = interpolate(f, [FOLD, FOLD + FOLD_LEN], [0, 1], { ...clamp, easing: CURVE.showy.enter });
  const view = { x: box.x * c, y: box.y * c, w: W + (box.w - W) * c, h: H + (box.h - H) * c };
  const out = interpolate(f, [FOLD + 6, FOLD + FOLD_LEN], [0, 1], clamp);
  // the drift the part itself uses after landing, continued under the fold so nothing jumps
  const hold = interpolate(f, [TIMES.land, TIMES.land + 150], [0, 1], clamp);
  const cam = { cx: FINAL.cx + (DRIFT.cx - FINAL.cx) * hold, cy: FINAL.cy + (DRIFT.cy - FINAL.cy) * hold, cw: FINAL.cw + (DRIFT.cw - FINAL.cw) * hold };
  const back = interpolate(f, [HOLD_END, DURATION - 1], [0, 1], { ...clamp, easing: EASE });
  // the mark leaves as the letters rush, before the dashboard's own logo comes into view
  const mark = interpolate(f, [9, 21], [0, 1], clamp) * (1 - interpolate(f, [TIMES.rush - 6, TIMES.rush + 6], [0, 1], clamp));
  return (
    <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient, overflow: "hidden" }}>
      {f < FOLD ? (
        <ProductInLetters brand={B} word="campus" src={staticFile(SRC)} page={PAGE}
          glide={{ from: { cx: 600, cy: 262, cw: 1000 }, to: { cx: 960, cy: 290, cw: 1000 } }}
          final={FINAL} finalDrift={DRIFT} size={470} baseline={650} track="-0.04em" origin={{ x: 1117, y: 690 }} maxScale={9}
          times={TIMES} patch={SIDEBAR.dashboard} />
      ) : (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - out, filter: c > 0.4 ? `blur(${((c - 0.4) * 16).toFixed(2)}px)` : undefined }}>
          <SurfaceView surface={{ src: SRC, page: PAGE, dpr: 2 }} brand={B} layout={NO_LAYOUT} cam={cam} view={view} radius={18 * c} dim={0.5 * c} />
        </div>
      )}
      <Sequence from={LOGO_AT} layout="none">
        <div style={{ position: "absolute", inset: 0, opacity: 1 - back, filter: back > 0 ? `blur(${(back * 12).toFixed(2)}px)` : undefined }}>
          <LogoEnd brand={B} at={0} x={W / 2} y={H / 2} width={logoW} />
        </div>
      </Sequence>
      {mark > 0.002 && B.logo ? (
        <Img src={staticFile(B.logo.onDark)} style={{ position: "absolute", left: 60, top: 40, width: 150, opacity: 0.9 * mark }} />
      ) : null}
    </AbsoluteFill>
  );
};
