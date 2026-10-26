/**
 * word-swap (2026-10-23, wave 2): the kit WordSwap hook (kit/pass/type/WordSwap.tsx, Raylight "Fetch Saas":
 * letters cascading in out of a blur, 0.8 frame apart) set OVER the real page of the shot, dimmed, never on
 * black (Jacob 2026-09-16: orientation plays over the thing). Each phrase holds for its reading time; the last
 * one leaves with the kit's blur-lift exit while the page brightens, so only the product is left: no headline
 * stays to compete with the product beat (Jacob 2026-10-23).
 *
 * The phrases are the shot's text lines with role "hook" (or "line"), in order; each line's `hold` sets its
 * hold (the checker has already held it to the reading rule), `at` the first line's start. Film draws nothing
 * for these lines itself (Film.tsx treats this part like like-when-line).
 *
 * Props:
 *   accent?: string[]   one word per phrase set in the italic accent (by phrase index).
 *   size?: number       type size in "1080 short side" px. Default the layout's big line x 1.15.
 *   dim?: number        how dark the page sits under the words. Default 0.8.
 *   y?: number          the phrase centre as a share of the view height. Default 0.46.
 *   maxW?: number       the width a phrase wraps at, canvas px. Default the layout's big line width.
 */
import React from "react";
import { Sequence, useCurrentFrame } from "remotion";
import { WordSwap, wordSwapTimeline } from "../../kit/pass/type/WordSwap";
import { useZodiak } from "../../kit/parts";
import { CURVE, DUR, FPS, readHold } from "../motion";
import { num, ramp, SurfaceView } from "./common";
import type { PartProps } from "./types";

export const WordSwapLine: React.FC<PartProps> = ({ shot, surface, brand, f, layout, props, ctx }) => {
  useZodiak();
  const now = useCurrentFrame();
  const lines = (shot.text ?? []).filter((t) => t.role === "hook" || t.role === "line");
  const accent = Array.isArray(props.accent) ? (props.accent as string[]) : [];
  const phrases = lines.map((t, i) => ({ text: t.text, accent: accent[i] }));
  const at = Math.round((lines[0]?.at ?? 0) * FPS);
  const holds = lines.map((t) => Math.ceil((t.hold ?? readHold(t.text)) * FPS));
  const tl = wordSwapTimeline({ phrases, at, holds }, FPS);
  const last = tl.beats[tl.beats.length - 1];
  // the page comes up as the last phrase leaves, on the quiet camera curve
  const up = last ? ramp(f, last.exit, last.exit + DUR.reframe, CURVE.quiet.standard) : 1;
  const dim = num(props.dim, 0.8) * (1 - up);
  const cam = surface ? ctx.cam(f) : null;
  const { view, u } = layout;
  const size = num(props.size, layout.bigLine.size * 1.15);
  return (
    <>
      {surface && cam ? <SurfaceView surface={surface} brand={brand} layout={layout} cam={cam} dim={dim} /> : null}
      {phrases.length ? (
        // the kit part reads the global frame: shift it so its frame 0 is this shot's frame 0
        <Sequence from={now - f} layout="none">
          <div style={{ position: "absolute", inset: 0, textShadow: `0 ${4 * u}px ${40 * u}px rgba(0,0,0,0.55)` }}>
            <WordSwap brand={brand} phrases={phrases} at={at} holds={holds} size={size} maxWidth={num(props.maxW, layout.bigLine.maxW)}
              x={layout.W / 2} y={view.y + view.h * num(props.y, 0.46)} />
          </div>
        </Sequence>
      ) : null}
    </>
  );
};
