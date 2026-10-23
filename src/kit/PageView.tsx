/**
 * A captured product page seen through the page camera, inside the view rectangle. Frameless (no
 * browser chrome, ever), lit by the brand's own glow. `children` render in page coordinates
 * converted with `toCanvas`, so overlays (a pointer, a patch, a lift) stay glued to the page.
 */
import React from "react";
import { Img } from "remotion";
import type { Brand } from "./brand";
import { glow } from "./brand";
import type { PageCam, Rect, Size } from "./camera";
import { toCanvas } from "./camera";

export const PageView: React.FC<{
  /** The page image (a staticFile path or URL). */
  src: string;
  page: Size;
  cam: PageCam;
  view: Rect;
  brand: Brand;
  radius?: number;
  /** 0 to 1: darken and soften the page while something lifts off it. */
  dim?: number;
  children?: React.ReactNode;
}> = ({ src, page, cam, view, brand, radius = 34, dim = 0, children }) => {
  const o = toCanvas(cam, view, 0, 0);
  const s = view.w / cam.cw;
  return (
    <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h, overflow: "hidden", borderRadius: radius,
      background: brand.color.bg, boxShadow: `0 0 0 1.5px rgba(255,255,255,.08), 0 40px 120px rgba(0,0,0,.6), 0 0 140px ${glow(brand, 0.13)}` }}>
      <Img src={src} style={{ position: "absolute", left: o.x - view.x, top: o.y - view.y, width: page.w * s, height: page.h * s, maxWidth: "none",
        filter: dim ? `brightness(${1 - dim * 0.72}) saturate(${1 - dim * 0.6}) blur(${dim > 0.8 ? 6 : dim * 3}px)` : undefined }} />
      <div style={{ position: "absolute", left: -view.x, top: -view.y }}>{children}</div>
    </div>
  );
};
