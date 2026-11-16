/**
 * Pixel burst (2026-11-16, ported from the Nov 15 PixelFX trial, Jacob approved Nov 16). A pixel-art effect from PixelFX
 * (github.com/patch-gg/pixelfx, MIT, licence in public/pixelfx/LICENSE-pixelfx.txt) played over a capture at one point,
 * such as confetti bursting off the button a student just pressed. Drop it into any scene above the capture; it draws
 * nothing before `from`.
 *
 * It plays a PixelFX sprite sheet: a PNG of every frame in a grid plus its Aseprite-style JSON. Frame size, columns,
 * frame count, the sheet's own fps and the pivot (the point of the effect that sits on `x, y`) are all read from the
 * JSON's `meta.pixelfx`, and the PNG from `meta.image` next to the JSON, so a new sheet needs no code change. Pixels stay
 * hard at any `scale` (image-rendering: pixelated). A one-shot effect holds its last frame (confetti settled on the
 * floor) unless `hold` is false; a looping one loops.
 *
 * Shipped sheet: public/pixelfx/confetti-crimson.json (+ .png), PixelFX's "ui/confetti" in a crimson ramp, 200 x 140
 * frames, 9 columns, 103 frames at 30 fps, pivot 100,126.
 *
 * Another effect or palette: clone PixelFX somewhere outside the studio and run, in the clone,
 *   node tools/render.mjs <id> --sheet --opts '{"palette":["#2a0508","#6e0d16","#b3121f","#e0283a","#ff7a85","#ffe3e6"]}'
 * where <id> is an effect id such as ui/confetti or fire/torch (`node tools/list.mjs` lists them) and the palette is a
 * dark-to-bright ramp of hex colours (the one above is an example crimson ramp). It writes `<name>.png` and `<name>.json`
 * under records/<id>/. Copy both into public/pixelfx/ with the same base name (rename both, and set `meta.image` in the
 * JSON to the new PNG name), and add the PNG to the `!public/pixelfx/` exception in .gitignore so it ships with the repo.
 *
 *   import { PixelBurst } from "../kit";
 *   <PixelBurst sheet="pixelfx/confetti-crimson.json" x={447} y={651} from={24} scale={3} />
 * Sample: Effect-PixelBurst in src/kit/effects/samples.tsx (render from src/kit/effects/entry.ts).
 */
import React, { useEffect, useState } from "react";
import { Img, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export type PixelBurstProps = {
  /** The sheet's JSON, a path under public/. */
  sheet: string;
  /** Where the effect's pivot lands, in frame pixels of the parent. */
  x: number;
  y: number;
  /** Frame the effect starts. */
  from: number;
  /** Size of one sheet pixel in frame pixels (default 3). */
  scale?: number;
  /** Speed multiplier on the sheet's own fps (default 1). */
  speed?: number;
  /** One-shot effects hold their last frame by default. */
  hold?: boolean;
  /** Mirror left to right. */
  flip?: boolean;
  style?: React.CSSProperties;
};

type SheetMeta = {
  image: string;
  size: { w: number; h: number };
  fps: number;
  loop: boolean;
  frames: number;
  frameSize: [number, number];
  pivot: [number, number];
  columns: number;
};

const cache = new Map<string, Promise<SheetMeta>>();
const loadMeta = (sheet: string) => {
  let m = cache.get(sheet);
  if (!m) {
    m = fetch(staticFile(sheet))
      .then((r) => {
        if (!r.ok) throw new Error(`PixelBurst: ${sheet} returned ${r.status}`);
        return r.json();
      })
      .then((j) => {
        const px = j.meta?.pixelfx;
        if (!px) throw new Error(`PixelBurst: ${sheet} has no meta.pixelfx (render it with tools/render.mjs --sheet)`);
        const dir = sheet.includes("/") ? sheet.slice(0, sheet.lastIndexOf("/") + 1) : "";
        return {
          image: dir + j.meta.image,
          size: j.meta.size,
          fps: px.fps,
          loop: px.loop,
          frames: px.frames,
          frameSize: px.frameSize,
          pivot: px.pivot,
          columns: px.columns,
        } as SheetMeta;
      });
    cache.set(sheet, m);
  }
  return m;
};

export const PixelBurst: React.FC<PixelBurstProps> = ({ sheet, x, y, from, scale = 3, speed = 1, hold = true, flip, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [meta, setMeta] = useState<SheetMeta | null>(null);
  const [handle] = useState(() => delayRender(`PixelBurst sheet ${sheet}`));
  useEffect(() => {
    loadMeta(sheet)
      .then((m) => {
        setMeta(m);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [sheet, handle]);

  if (!meta || f < from) return null;
  let n = Math.floor(((f - from) * meta.fps * speed) / fps);
  if (meta.loop) n %= meta.frames;
  else if (n >= meta.frames) {
    if (!hold) return null;
    n = meta.frames - 1;
  }
  const [fw, fh] = meta.frameSize;
  const col = n % meta.columns;
  const row = Math.floor(n / meta.columns);
  return (
    <div style={{ position: "absolute", left: x - meta.pivot[0] * scale, top: y - meta.pivot[1] * scale, width: fw * scale, height: fh * scale,
      overflow: "hidden", pointerEvents: "none", transform: flip ? "scaleX(-1)" : undefined, transformOrigin: `${meta.pivot[0] * scale}px 0`, ...style }}>
      <Img src={staticFile(meta.image)} style={{ position: "absolute", left: -col * fw * scale, top: -row * fh * scale,
        width: meta.size.w * scale, height: meta.size.h * scale, maxWidth: "none", imageRendering: "pixelated" }} />
    </div>
  );
};
