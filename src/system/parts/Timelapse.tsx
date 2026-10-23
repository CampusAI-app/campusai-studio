/**
 * timelapse (2026-10-23): a long real process compressed into the shot, with a small visible clock so
 * the speed-up is honest, not hidden. Two sources:
 *   - a recorded frame sequence (`sequence`: a frames.json of { clip, frames: [{ t, name }] }, the
 *     capture/pass-chat format), each frame laid onto the shot's surface at its clip, so the process
 *     plays inside the real page;
 *   - or a list of stills (`stills`: surface keys, or public/ paths), stepped evenly.
 * The clock sits top right on the layout's label row (opposite the held mark; inside the feed crop on 9x16): a ring filling with real time, the real
 * seconds elapsed and the speed ("1.6x"). Both numbers come from the recording, never typed.
 *
 * Props:
 *   sequence?: string      public/ path of a frames.json.
 *   clip?: Rect            where the frames sit on the page, page px. Default: the sequence's clip.
 *   from?, to?: number     the stretch of real time to play, seconds. Default: all of it.
 *   stills?: string[]      surface keys or public/ paths, instead of a sequence.
 *   realSeconds?: number   for stills: how long the real process took, for the clock.
 *   clock?: boolean        show the clock. Default true.
 */
import React from "react";
import { INTER } from "../../kit/parts";
import { DUR, FPS } from "../motion";
import { num, ramp, rectProp, SurfaceView, useFrameSeq } from "./common";
import type { PartProps } from "./types";

const fmt = (s: number) => (s < 60 ? `${s.toFixed(1)} s` : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`);

export const Timelapse: React.FC<PartProps> = ({ surface, brand, f, layout, props, ctx }) => {
  const seq = useFrameSeq(typeof props.sequence === "string" ? props.sequence : undefined);
  if (!surface) return null;
  const cam = ctx.cam(f);
  const p = Math.min(1, Math.max(0, f / ctx.dur));
  let overlays: { src: string; rect: { x: number; y: number; w: number; h: number } }[] = [];
  let src: string | undefined;
  let real = 0;
  let span = 0;
  if (seq && seq.frames.length) {
    const t0 = num(props.from, seq.frames[0].t);
    const t1 = num(props.to, seq.frames[seq.frames.length - 1].t);
    span = t1 - t0;
    const t = t0 + p * span;
    real = t - t0;
    let i = 0;
    while (i + 1 < seq.frames.length && seq.frames[i + 1].t <= t) i++;
    const clip = rectProp(props.clip) ?? seq.clip ?? { x: 0, y: 0, w: surface.page.w, h: surface.page.h };
    overlays = [{ src: seq.dir + seq.frames[i].name, rect: clip }];
  } else if (Array.isArray(props.stills) && props.stills.length) {
    const list = props.stills as string[];
    const i = Math.min(list.length - 1, Math.floor(p * list.length));
    const key = list[i];
    src = ctx.board.surfaces[key]?.src ?? key;
    span = num(props.realSeconds, 0);
    real = p * span;
  }
  const speed = span > 0 ? span / (ctx.dur / FPS) : 0;
  const showClock = props.clock !== false && span > 0;
  const { u } = layout;
  const size = 30 * u;
  const ringR = 15 * u;
  const shown = ramp(f, 0, DUR.panel) * (1 - ramp(f, ctx.dur - DUR.panel, ctx.dur));
  const circ = 2 * Math.PI * ringR;
  return (
    <>
      <SurfaceView surface={surface} brand={brand} layout={layout} cam={cam} overlays={overlays} src={src} />
      {showClock ? (
        <div style={{ position: "absolute", right: layout.W - layout.label.right, top: layout.label.cy - 30 * u, height: 60 * u,
          display: "flex", alignItems: "center", gap: 14 * u, opacity: shown, fontFamily: INTER, fontWeight: 500, fontSize: size,
          fontVariantNumeric: "tabular-nums", color: brand.color.ink, whiteSpace: "nowrap" }}>
          <svg width={ringR * 2 + 4} height={ringR * 2 + 4} style={{ overflow: "visible" }}>
            <circle cx={ringR + 2} cy={ringR + 2} r={ringR} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={3 * u} />
            <circle cx={ringR + 2} cy={ringR + 2} r={ringR} fill="none" stroke={brand.color.accent} strokeWidth={3 * u} strokeLinecap="round"
              strokeDasharray={`${(circ * p).toFixed(2)} ${circ.toFixed(2)}`} transform={`rotate(-90 ${ringR + 2} ${ringR + 2})`} />
          </svg>
          <span>{fmt(real)}</span>
          <span style={{ color: brand.color.inkSoft }}>{`${speed.toFixed(1)}x`}</span>
        </div>
      ) : null}
    </>
  );
};
