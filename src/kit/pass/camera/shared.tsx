/**
 * Small helpers the camera group shares (2026-10-22). Kept in this folder so the kit is not edited.
 *
 * MarkPatch paints out the Maryland "M" beside the logo at the sidebar's top left, in the sidebar's
 * own colour. Box measured on the pass captures: CSS x 116 to 156, y 10 to 46 (the red pixels run
 * x 108 to 144, y 18 to 34; the box keeps a margin). Its colour is sampled from the capture itself,
 * right of the mark: rgb(33, 21, 21) on most pages, rgb(29, 20, 21) on job-goldman.
 */
import React from "react";
import type { PageCam, Rect } from "../../camera";
import { rectOnCanvas } from "../../camera";

export const MARK_BOX: Rect = { x: 116, y: 10, w: 40, h: 36 };
/** Sampled from the pass captures (dashboard, jobmatch, planner, calendar). */
export const MARK_COLOR = "rgb(33, 21, 21)";
/** Sampled from job-goldman.jpg, whose sidebar is a shade darker. */
export const MARK_COLOR_GOLDMAN = "rgb(29, 20, 21)";

export type MarkPatchSpec = { rect: Rect; color: string };
export const PASS_MARK: MarkPatchSpec = { rect: MARK_BOX, color: MARK_COLOR };

/** The patch in canvas px, for use inside a PageView (children there are canvas coordinates). */
export const MarkPatch: React.FC<{ cam: PageCam; view: Rect; spec: MarkPatchSpec | null }> = ({ cam, view, spec }) => {
  if (!spec) return null;
  const r = rectOnCanvas(cam, view, spec.rect);
  return <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, background: spec.color }} />;
};

/** A hex colour ("#070709") at an alpha. */
export const hexA = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/** Grow a rect by `p` page px on every side. */
export const padRect = (r: Rect, p: number): Rect => ({ x: r.x - p, y: r.y - p, w: r.w + p * 2, h: r.h + p * 2 });

/** Straight blend of two rects. */
export const mixRect = (a: Rect, b: Rect, k: number): Rect => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  w: a.w + (b.w - a.w) * k,
  h: a.h + (b.h - a.h) * k,
});
