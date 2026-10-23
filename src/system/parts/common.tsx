/**
 * Shared by every part (2026-10-23): framing a focus rect in any aspect, the shot camera, the real
 * page drawn with its patches (the Maryland M painted out automatically), a FocusWalk-style lit
 * region, and loading a recorded frame sequence.
 */
import React from "react";
import { continueRender, delayRender, Img, interpolate, staticFile } from "remotion";
import type { Brand } from "../../kit/brand";
import { glow } from "../../kit/brand";
import type { PageCam, Rect } from "../../kit/camera";
import { camAlong, clampCam, rectOnCanvas, toCanvas } from "../../kit/camera";
import { PageView } from "../../kit/PageView";
import { CURVE, DRIFT, DUR, FPS, durFor } from "../motion";
import rules from "../rules.json";
import type { Shot, Surface } from "../storyboard";
import type { Layout } from "./types";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ramp = (f: number, a: number, b: number, easing = CURVE.quiet.standard) =>
  b <= a ? (f >= b ? 1 : 0) : interpolate(f, [a, b], [0, 1], { ...clamp, easing });

/** A public/ path or a URL, ready for <Img>. */
export const asset = (src: string) => (/^(https?:|data:)/.test(src) ? src : staticFile(src.replace(/^\/+/, "")));

export const mixRect = (a: Rect, b: Rect, k: number): Rect => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  w: a.w + (b.w - a.w) * k,
  h: a.h + (b.h - a.h) * k,
});
export const padRect = (r: Rect, p: number): Rect => ({ x: r.x - p, y: r.y - p, w: r.w + p * 2, h: r.h + p * 2 });

const wholePage = (sf: Surface): Rect => ({ x: 0, y: 0, w: sf.page.w, h: sf.page.h });

/**
 * The camera that frames `r` inside the layout's focus box: the rect fits with `pad` air, its centre
 * lands on the focus box centre, the page always covers the view (no letterbox inside the panel), and
 * the zoom never passes the capture's sharp limit (canvas px per page px <= dpr x `sharp`).
 */
export const frameFocus = (r: Rect | undefined, sf: Surface, layout: Layout, pad = 1.15, sharp = 1): PageCam => {
  const rect = r ?? wholePage(sf);
  const { view, focusBox: fb } = layout;
  const dpr = sf.dpr ?? 2;
  const sFit = Math.min(fb.w / (rect.w * pad), fb.h / (rect.h * pad));
  const sCover = Math.max(view.w / sf.page.w, view.h / sf.page.h);
  const s = Math.max(sCover, Math.min(sFit, dpr * sharp));
  const cw = view.w / s;
  const cx = rect.x + rect.w / 2 - (fb.x + fb.w / 2 - (view.x + view.w / 2)) / s;
  const cy = rect.y + rect.h / 2 - (fb.y + fb.h / 2 - (view.y + view.h / 2)) / s;
  return clampCam({ cx, cy, cw }, sf.page, view);
};

/** Canvas distance between two cameras, for durFor (longer travel, longer time). */
export const camDistance = (a: PageCam, b: PageCam, layout: Layout) => {
  const s = layout.view.w / Math.min(a.cw, b.cw);
  return Math.hypot(a.cx - b.cx, a.cy - b.cy) * s + Math.abs(a.cw - b.cw) * s * 0.5;
};

/**
 * The shot camera. With `shot.camera` keys it follows them (t in seconds); without, it frames `focus`.
 * `enter` is where the previous shot left the camera on the same surface (or the matched framing of a
 * carry): the shot starts there (held `enterHold` frames) and eases to its own framing, so the handoff has no cut feel. Every
 * hold after the last key drifts in (DRIFT.camPerSecond), so no frame is a freeze.
 */
export const planCamera = (shot: Shot, sf: Surface, layout: Layout, enter?: PageCam, enterHold = 0): ((f: number) => PageCam) => {
  let keys: { t: number; cam: PageCam }[];
  if (shot.camera && shot.camera.length) {
    keys = shot.camera.map((k) => ({ t: k.t * FPS, cam: clampCam(k.cam, sf.page, layout.view) }));
    if (enter) {
      const first = keys[0];
      const lead = Math.max(first.t, enterHold + durFor(camDistance(enter, first.cam, layout)));
      keys = [{ t: 0, cam: enter }, ...(enterHold ? [{ t: enterHold, cam: enter }] : []), { t: lead, cam: first.cam },
        ...keys.slice(1).map((k) => ({ ...k, t: Math.max(k.t, lead + 1) }))];
    }
  } else {
    const target = frameFocus(shot.focus, sf, layout);
    if (enter) {
      keys = [{ t: 0, cam: enter }, ...(enterHold ? [{ t: enterHold, cam: enter }] : []),
        { t: enterHold + durFor(camDistance(enter, target, layout)), cam: target }];
    } else {
      // a fresh surface arrives a touch wide and settles in, so the first frame already moves
      keys = [{ t: 0, cam: clampCam({ ...target, cw: target.cw * 1.04 }, sf.page, layout.view) }, { t: DUR.travel, cam: target }];
    }
  }
  const last = keys[keys.length - 1];
  return (f: number) => {
    const t = Math.max(0, f);
    if (t <= last.t) return camAlong(t, keys, CURVE.quiet.standard);
    const k = 1 - DRIFT.camPerSecond * ((t - last.t) / FPS);
    return clampCam({ ...last.cam, cw: last.cam.cw * k }, sf.page, layout.view);
  };
};

/**
 * The camera for a carry: the incoming surface framed so its focus sits exactly where the outgoing
 * focus was on the canvas, so the same element appears to move from one shot into the next.
 */
export const matchCam = (fromCam: PageCam, fromFocus: Rect, toFocus: Rect, sf: Surface, layout: Layout): PageCam => {
  const r = rectOnCanvas(fromCam, layout.view, fromFocus);
  const { view } = layout;
  const sCover = Math.max(view.w / sf.page.w, view.h / sf.page.h);
  const s = Math.max(sCover, Math.min((sf.dpr ?? 2) * 1.2, Math.min(r.w / toFocus.w, r.h / toFocus.h)));
  const cx = toFocus.x + toFocus.w / 2 - (r.x + r.w / 2 - (view.x + view.w / 2)) / s;
  const cy = toFocus.y + toFocus.h / 2 - (r.y + r.h / 2 - (view.y + view.h / 2)) / s;
  return clampCam({ cx, cy, cw: view.w / s }, sf.page, view);
};

/** The Maryland M patch, from rules.json, plus the surface's own patches. */
const MARK = rules.maskRects["maryland-m"];
const MARK_COLOR = "rgb(33, 21, 21)"; // sampled right of the mark on the pass captures; job-goldman and the chat page are rgb(29, 20, 21)
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
/** Any full product page (1440 CSS px wide, the sidebar at its left) gets the M patch unless it brings its own. */
export const patchesFor = (sf: Surface): (Rect & { color?: string })[] => {
  const own = sf.patch ?? [];
  const hasSidebar = sf.page.w >= 1200;
  const hasM = own.some((p) => overlaps(p, MARK));
  return hasSidebar && !hasM ? [...own, { ...MARK, color: MARK_COLOR }] : own;
};

/**
 * The page's own colour around each patch that brings no `color`: the capture is read once into a canvas
 * and a ring 3 to 7 page px outside the rect is sampled, per channel median, so text or an icon in the
 * ring does not tint it. Cached per image; the frame is held until the image has been read.
 */
const PATCH_CACHE = new Map<string, Map<string, string>>();
const keyOf = (r: Rect) => `${r.x},${r.y},${r.w},${r.h}`;
const samplePatchColors = (img: HTMLImageElement, sf: Surface, rects: Rect[]) => {
  const out = new Map<string, string>();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const g = c.getContext("2d");
  if (!g) return out;
  g.drawImage(img, 0, 0);
  const k = img.naturalWidth / sf.page.w;
  for (const r of rects) {
    const ch: number[][] = [[], [], []];
    const take = (x: number, y: number) => {
      const px = Math.round(x * k);
      const py = Math.round(y * k);
      if (px < 0 || py < 0 || px >= c.width || py >= c.height) return;
      const d = g.getImageData(px, py, 1, 1).data;
      ch[0].push(d[0]);
      ch[1].push(d[1]);
      ch[2].push(d[2]);
    };
    for (let d = 3; d <= 7; d += 2) {
      for (let x = r.x - d; x <= r.x + r.w + d; x += 3) {
        take(x, r.y - d);
        take(x, r.y + r.h + d);
      }
      for (let y = r.y - d; y <= r.y + r.h + d; y += 3) {
        take(r.x - d, y);
        take(r.x + r.w + d, y);
      }
    }
    const med = (a: number[]) => (a.length ? a.sort((p, q) => p - q)[Math.floor(a.length / 2)] : 0);
    out.set(keyOf(r), `rgb(${med(ch[0])}, ${med(ch[1])}, ${med(ch[2])})`);
  }
  return out;
};
const usePatchColors = (sf: Surface, src: string, rects: Rect[]) => {
  const need = rects.length > 0 && !PATCH_CACHE.has(src);
  const [, setDone] = React.useState(0);
  const [handle] = React.useState(() => (need ? delayRender(`patch colours ${src}`) : null));
  React.useEffect(() => {
    if (handle === null) return;
    const img = new Image();
    img.onload = () => {
      try {
        PATCH_CACHE.set(src, samplePatchColors(img, sf, rects));
      } catch {
        PATCH_CACHE.set(src, new Map());
      }
      setDone((n) => n + 1);
      continueRender(handle);
    };
    img.onerror = () => {
      PATCH_CACHE.set(src, new Map());
      continueRender(handle);
    };
    img.src = asset(src);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);
  return PATCH_CACHE.get(src);
};

/**
 * The real page through the page camera, frameless, with its patches painted on and, when `dim` is up,
 * the `spot` region kept lit the way the kit FocusWalk does (the same image clipped to the region, on
 * top of the dimmed page, with a fine ring of the brand light). Children are canvas coordinates.
 */
export const SurfaceView: React.FC<{
  surface: Surface;
  brand: Brand;
  layout: Layout;
  cam: PageCam;
  view?: Rect;
  dim?: number;
  spot?: Rect;
  /** Images laid onto the page at page rects (a recorded frame over its clip). */
  overlays?: { src: string; rect: Rect }[];
  /** Replace the page image (a still in a timelapse). */
  src?: string;
  radius?: number;
  children?: React.ReactNode;
}> = ({ surface, brand, layout, cam, view = layout.view, dim = 0, spot, overlays = [], src, radius = layout.radius, children }) => {
  const img = asset(src ?? surface.src);
  const s = view.w / cam.cw;
  const o = toCanvas(cam, view, 0, 0);
  const lit = dim > 0.005 && spot ? rectOnCanvas(cam, view, padRect(spot, 8)) : null;
  const k = Math.min(1, dim / 0.5);
  const patches = patchesFor(surface);
  const sampled = usePatchColors(surface, surface.src, patches.filter((p) => !p.color));
  const feather = Math.max(1, 1.6 * s);
  return (
    <PageView src={img} page={surface.page} cam={cam} view={view} brand={brand} dim={dim} radius={radius}>
      {overlays.map((ov, i) => {
        const r = rectOnCanvas(cam, view, ov.rect);
        return <Img key={i} src={asset(ov.src)} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, maxWidth: "none",
          filter: dim ? `brightness(${1 - dim * 0.72}) saturate(${1 - dim * 0.6})` : undefined }} />;
      })}
      {lit ? (
        <div style={{ position: "absolute", left: lit.x, top: lit.y, width: lit.w, height: lit.h, borderRadius: 12 * s, overflow: "hidden",
          boxShadow: `0 0 0 ${Math.max(1.2, 0.8 * s).toFixed(2)}px ${glow(brand, 0.5 * k)}, 0 0 ${(70 * k).toFixed(0)}px ${glow(brand, 0.2 * k)}` }}>
          <Img src={img} style={{ position: "absolute", left: o.x - lit.x, top: o.y - lit.y, width: surface.page.w * s, height: surface.page.h * s, maxWidth: "none" }} />
          {overlays.map((ov, i) => {
            const r = rectOnCanvas(cam, view, ov.rect);
            return <Img key={i} src={asset(ov.src)} style={{ position: "absolute", left: r.x - lit.x, top: r.y - lit.y, width: r.w, height: r.h, maxWidth: "none" }} />;
          })}
        </div>
      ) : null}
      {patches.map((p, i) => {
        // a patch reads as empty page: the page's own colour (given, or sampled around it), edges feathered
        const r = rectOnCanvas(cam, view, { x: p.x - 1.5, y: p.y - 1.5, w: p.w + 3, h: p.h + 3 });
        const color = p.color ?? sampled?.get(keyOf(p)) ?? MARK_COLOR;
        return <div key={`p${i}`} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, background: color, borderRadius: feather,
          filter: `blur(${feather.toFixed(2)}px)${dim ? ` brightness(${1 - dim * 0.72})` : ""}` }} />;
      })}
      {children}
    </PageView>
  );
};

/** A recorded frame sequence: { clip, frames: [{ t, name }] } next to its frames (public/pass/chat/answer/frames.json). */
export type FrameSeq = { clip?: Rect; dpr?: number; frames: { t: number; name: string }[]; dir: string };
const SEQ_CACHE = new Map<string, FrameSeq>();
export const useFrameSeq = (path: string | undefined): FrameSeq | null => {
  const [seq, setSeq] = React.useState<FrameSeq | null>(() => (path ? SEQ_CACHE.get(path) ?? null : null));
  const [handle] = React.useState(() => (path && !SEQ_CACHE.has(path) ? delayRender(`frames ${path}`) : null));
  React.useEffect(() => {
    if (!path || handle === null) return;
    fetch(asset(path))
      .then((r) => r.json())
      .then((j: Omit<FrameSeq, "dir">) => {
        const value: FrameSeq = { ...j, dir: path.replace(/[^/]*$/, "") };
        SEQ_CACHE.set(path, value);
        setSeq(value);
      })
      .finally(() => continueRender(handle));
  }, [path, handle]);
  return seq;
};

export const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
export const rectProp = (v: unknown): Rect | undefined =>
  v && typeof v === "object" && ["x", "y", "w", "h"].every((k) => typeof (v as Record<string, unknown>)[k] === "number") ? (v as Rect) : undefined;
