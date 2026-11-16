/**
 * Read the pixels of one frame of a clip, headless and deterministic (2026-11-15, for CodeBody and BlowAway).
 * OffthreadVideo draws an <img> we cannot read, so these effects decode the frame themselves with mediabunny (already a
 * studio dependency, WebCodecs underneath) and draw it onto a canvas framed exactly like the video layers.
 */
import { ALL_FORMATS, CanvasSink, Input, UrlSource } from "mediabunny";
import { staticFile } from "remotion";

const sinks = new Map<string, Promise<CanvasSink>>();

const sinkFor = (src: string) => {
  let s = sinks.get(src);
  if (!s) {
    s = (async () => {
      const input = new Input({ formats: ALL_FORMATS, source: new UrlSource(staticFile(src)) });
      const track = await input.getPrimaryVideoTrack();
      if (!track) throw new Error(`frameGrab: no video track in ${src}`);
      return new CanvasSink(track, { poolSize: 0 });
    })();
    sinks.set(src, s);
  }
  return s;
};

/** The clip's own frame number `n` (at `fps`), as a canvas at the clip's size. */
export const grabFrame = async (src: string, n: number, fps: number) => {
  const sink = await sinkFor(src);
  // the middle of the frame's slot, so float error never lands on the frame before
  const w = await sink.getCanvas((Math.max(0, n) + 0.5) / fps);
  if (!w) throw new Error(`frameGrab: no frame ${n} in ${src}`);
  return w.canvas;
};

/** The framing every person effect uses: zoom, the clip y on the frame's bottom edge, the clip x kept centred. */
export type Framing = { zoom: number; bottom: number; focusX?: number };

export const framingOf = (W: number, H: number, frame?: Framing) => {
  const zoom = frame?.zoom ?? 1;
  const bottom = frame?.bottom ?? H;
  const focusX = frame?.focusX ?? W / 2;
  const tx = W / 2 - focusX * zoom;
  const ty = H - bottom * zoom;
  return { zoom, tx, ty };
};

/** Draw a grabbed clip frame onto a W x H canvas context with the same framing as the video layers. */
export const drawFramed = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  img: CanvasImageSource,
  W: number,
  H: number,
  frame?: Framing,
) => {
  const { zoom, tx, ty } = framingOf(W, H, frame);
  ctx.setTransform(zoom, 0, 0, zoom, tx, ty);
  ctx.drawImage(img, 0, 0, W, H);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
