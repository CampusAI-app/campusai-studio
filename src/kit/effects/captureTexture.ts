/**
 * A crop of a real capture as a three.js texture (2026-11-16, for GlowFocus and /card-drop). Loads the capture through
 * R3F's `useLoader`, which suspends, so the <ThreeCanvas> holds the frame until the picture is in. The crop is cut on a
 * canvas with rounded corners (transparent outside them), so a card cut from a page keeps the page's own radius.
 * Use it inside a <ThreeCanvas> only.
 */
import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { staticFile } from "remotion";
import * as THREE from "three";
import type { Crop } from "./shared";

/** `radius` is in the capture's own pixels. */
export const cutTexture = (img: CanvasImageSource, crop: Crop, radius = 0) => {
  const c = document.createElement("canvas");
  c.width = Math.round(crop.w);
  c.height = Math.round(crop.h);
  const ctx = c.getContext("2d")!;
  if (radius > 0) {
    ctx.beginPath();
    ctx.roundRect(0, 0, c.width, c.height, Math.min(radius, c.height / 2, c.width / 2));
    ctx.clip();
  }
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
};

/** `src` is a path under public/. */
export const useCaptureTexture = (src: string, crop: Crop, radius = 0) => {
  const base = useLoader(THREE.TextureLoader, staticFile(src));
  return useMemo(
    () => cutTexture(base.image as CanvasImageSource, crop, radius),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, crop.x, crop.y, crop.w, crop.h, radius],
  );
};
