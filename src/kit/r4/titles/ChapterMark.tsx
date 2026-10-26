/**
 * ChapterMark (round 4 titles, 2026-10-25): a chapter marker for longer tours that is made of the product's own
 * navigation. The real sidebar row of the next chapter ("Career Advisor") lights, lifts off the page and grows up
 * into the band above the footage, where it turns into the chapter word in Zodiak ("Career", the nav's own short
 * label). While the word holds for its reading time, the page underneath changes to that chapter's page. Then the
 * word hands back: it turns into the NEW page's row (now the active one) and flies down into its slot, which takes
 * one soft accent pulse. The viewer sees where the chapter lives in the product, twice.
 *
 * From the shelf shot typography/title-demote-to-label: a title that changes role instead of leaving (headline to
 * section label), one continuous tween on bezier(0.6, 0, 0.18, 1) over 26 f with the size and the position on the
 * SAME curve (split into two moves it reads as two actions), a hold of at least 18 f before it moves again, and
 * nothing else moving on its path. Here it runs out of the page and back into it. The crop-to-word dissolve borrows
 * ControlTitle's rule (system/parts): the lifted control is the same capture drawn at the travelling size, so in
 * its slot it lines up pixel for pixel with the page.
 *
 * Numbers: row light 8 f (accent at 16 %, the product's own active-row look), travel 26 f out and 26 f back, the
 * crop dissolves into the word over the last 55 % of the trip out (and the reverse on the way back), the crop
 * grows to 2x its slot (still sharp: the captures are DPR 2). The word holds readFrames(kicker + title); the page
 * changes 6 f after the word lands, over DUR.arrive. Landing pulse 20 f.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { camAlong, clampCam, rectOnCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { INTER } from "../../parts";
import { CURVE, DUR } from "../../../system/motion";
import type { MarkPatchSpec } from "./shared";
import { DEMOTE, MarkPatch, PageCrop, lerp, mixRect, ramp, readFrames } from "./shared";

type Surface = { src: string; size: Size; mark: MarkPatchSpec | null };

export type ChapterMarkProps = {
  brand: Brand;
  /** The page the tour is on, and the chapter's page it changes to. */
  from: Surface;
  to: Surface;
  view: Rect;
  /** Camera keys in frames, for the whole part. Keep the sidebar in view from `at` until the hand back lands. */
  cams: { t: number; cam: PageCam }[];
  /** The chapter's nav row on `from`, page px, and on `to` (default the same box). */
  nav: Rect;
  navTo?: Rect;
  /** The chapter word: the nav's own label, never a new name. */
  title: string;
  /** Optional small line over the word ("Part 2"). */
  kicker?: string;
  /** Canvas centre of the word, in the band above the footage. */
  titleAt: { x: number; y: number };
  /** Word size, canvas px. Default 74. */
  size?: number;
  /** Frame the row lights. */
  at: number;
};

export const chapterMarkTimes = (p: Pick<ChapterMarkProps, "at" | "title" | "kicker">) => {
  const liftAt = p.at + 10;
  const landed = liftAt + 26;
  const swapAt = landed + 6;
  const backAt = landed + readFrames(`${p.kicker ?? ""} ${p.title}`);
  const home = backAt + 26;
  return { liftAt, landed, swapAt, swapEnd: swapAt + DUR.arrive, backAt, home, end: home + 20 };
};

export const ChapterMark: React.FC<ChapterMarkProps> = (props) => {
  const { brand, from, to, view, cams, nav, title, kicker, titleAt, at } = props;
  const navTo = props.navTo ?? nav;
  const f = useCurrentFrame();
  const T = chapterMarkTimes(props);
  const cam = clampCam(camAlong(f, cams), from.size, view);
  const size = props.size ?? 74;

  const slotFrom = rectOnCanvas(cam, view, nav);
  const slotTo = rectOnCanvas(cam, view, navTo);
  const s = slotFrom.w / nav.w;
  // the crop at the word: twice its slot, centred on the word
  const big = (r: Rect): Rect => {
    const w = r.w * 2;
    const h = r.h * 2;
    return { x: titleAt.x - w / 2, y: titleAt.y - h / 2, w, h };
  };

  const light = ramp(f, at, at + 8) * (1 - ramp(f, T.liftAt + 6, T.liftAt + 18));
  const out = ramp(f, T.liftAt, T.landed, DEMOTE);
  const back = ramp(f, T.backAt, T.home, DEMOTE);
  const goingBack = f >= T.backAt;
  // the crop: from's row on the way out, to's row on the way back
  const cropRect = goingBack ? mixRect(big(slotTo), slotTo, back) : mixRect(slotFrom, big(slotFrom), out);
  const cropOpacity = goingBack ? ramp(f, T.backAt, T.backAt + 26 * 0.55) : 1 - ramp(f, T.liftAt + 26 * 0.45, T.landed);
  const flying = (f >= T.liftAt && f < T.landed) || (goingBack && f < T.home);
  // the word: out of a blur as the crop dissolves, back into one as it returns
  const wordIn = goingBack ? 1 - ramp(f, T.backAt, T.backAt + 26 * 0.55) : ramp(f, T.liftAt + 26 * 0.45, T.landed + 4);
  const wordScale = goingBack ? lerp(1, 0.6, ramp(f, T.backAt, T.backAt + 26 * 0.55, DEMOTE)) : lerp(0.6, 1, ramp(f, T.liftAt + 26 * 0.3, T.landed, DEMOTE));
  const lift = Math.sin(Math.PI * (goingBack ? back : out));
  const swap = ramp(f, T.swapAt, T.swapEnd, CURVE.quiet.standard);
  const pulse = ramp(f, T.home - 2, T.home + 4) * (1 - ramp(f, T.home + 4, T.home + 20));
  const kickerSize = size * 0.34;

  return (
    <>
      <PageView src={from.src} page={from.size} cam={cam} view={view} brand={brand}>
        <MarkPatch cam={cam} view={view} spec={from.mark} />
        {light > 0.001 ? (
          <div style={{ position: "absolute", left: slotFrom.x, top: slotFrom.y, width: slotFrom.w, height: slotFrom.h, borderRadius: 8 * s,
            background: brand.color.accent, opacity: 0.16 * light }} />
        ) : null}
      </PageView>
      {swap > 0.001 ? (
        <div style={{ position: "absolute", inset: 0, opacity: swap }}>
          <PageView src={to.src} page={to.size} cam={cam} view={view} brand={brand}>
            <MarkPatch cam={cam} view={view} spec={to.mark} />
            {pulse > 0.001 ? (
              <div style={{ position: "absolute", left: slotTo.x, top: slotTo.y, width: slotTo.w, height: slotTo.h, borderRadius: 8 * s, boxSizing: "border-box",
                border: `2px solid ${brand.color.accent}`, opacity: pulse * 0.8, boxShadow: `0 0 30px ${glow(brand, 0.6 * pulse)}` }} />
            ) : null}
          </PageView>
        </div>
      ) : null}
      {flying && cropOpacity > 0.001 ? (
        <PageCrop src={goingBack ? to.src : from.src} page={goingBack ? to.size : from.size} from={goingBack ? navTo : nav} to={cropRect}
          style={{ borderRadius: (8 * cropRect.w) / nav.w, opacity: cropOpacity,
            boxShadow: `0 ${(18 * lift).toFixed(1)}px ${(50 * lift).toFixed(1)}px rgba(0,0,0,${(0.55 * lift).toFixed(3)}), 0 0 ${(60 * lift).toFixed(0)}px ${glow(brand, 0.25 * lift)}` }} />
      ) : null}
      {wordIn > 0.001 && f < T.home ? (
        <div style={{ position: "absolute", left: titleAt.x - 600, width: 1200, top: titleAt.y - size * 0.62 - (kicker ? kickerSize * 0.75 : 0), textAlign: "center",
          opacity: wordIn, filter: wordIn < 1 ? `blur(${((1 - wordIn) * 12).toFixed(2)}px)` : undefined,
          transform: `scale(${wordScale.toFixed(4)})`, transformOrigin: `50% ${size * 0.62 + (kicker ? kickerSize * 0.75 : 0)}px` }}>
          {kicker ? (
            <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: kickerSize, lineHeight: `${kickerSize * 1.5}px`, color: brand.color.inkSoft, letterSpacing: "-0.005em" }}>
              {kicker}
            </div>
          ) : null}
          <div style={{ fontFamily: "Zodiak", fontWeight: 700, fontSize: size, lineHeight: `${size * 1.24}px`, color: brand.color.ink, letterSpacing: "-0.02em" }}>{title}</div>
        </div>
      ) : null}
    </>
  );
};
