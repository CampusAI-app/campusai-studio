/**
 * Helpers shared by the readout parts (RoleCard, ScoreFill, ShapeMorph), 2026-10-22. Kept in the group
 * folder on purpose (BRIEF.md: a shared helper lives in your own group folder, never in kit/index.ts).
 *
 * - `MaskM`: covers the Maryland mark beside the sidebar logo with the sidebar's own colour. Measured on
 *   every pass capture by pixel: the divider sits at CSS x 120, the M at x 130 to 145, y 18 to 36, on a flat
 *   sidebar of rgb(33, 21, 21). The patch runs x 114 to 172, y 6 to 50, covering the coordinator's corrected
 *   box (x 108 to 156) except x 108 to 113, which is the CampusAI logo's own "i" and sparkle, not the mark.
 *   It stops short of the collapse button at x 179. Render it inside a `PageView` so it stays glued to the page.
 * - `readFrames`: Jacob's reading rule, letters / 15 + 1.5 s, never under 1.8 s, in frames.
 * - `springStep`: a closed-form spring step response (damping ratio and 2% settle time), so a value that
 *   changes target many times is a sum of steps and stays a pure function of the frame (@twoclipping).
 */
import React from "react";
import type { Brand } from "../../brand";
import type { PageCam, Rect } from "../../camera";
import { rectOnCanvas } from "../../camera";

export const M_PATCH: Rect = { x: 114, y: 6, w: 58, h: 44 };
const SIDEBAR = "rgb(33, 21, 21)";

/** The Maryland mark, covered. Pass the same cam and view the PageView uses. */
export const MaskM: React.FC<{ cam: PageCam; view: Rect }> = ({ cam, view }) => {
  const r = rectOnCanvas(cam, view, M_PATCH);
  if (r.y + r.h < view.y || r.x + r.w < view.x) return null;
  return <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, background: SIDEBAR }} />;
};

/** Frames a line must stay fully on screen: letters / 15 + 1.5 s, at least 1.8 s. */
export const readFrames = (text: string, fps: number) => Math.ceil(Math.max(1.8, text.length / 15 + 1.5) * fps);

/** Unit step response of a spring, 0 before t = 0, settling to 1. `settle` is the 2% settle time in seconds. */
export const springStep = (t: number, zeta: number, settle: number) => {
  if (t <= 0) return 0;
  const wn = 4 / (zeta * settle);
  if (zeta >= 1) {
    const x = wn * t;
    return 1 - Math.exp(-x) * (1 + x);
  }
  const wd = wn * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * wn * t) * (Math.cos(wd * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t));
};

/** "#rrggbb" to [r, g, b]. */
export const rgbOf = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
export const mixRgb = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k);
export const rgba = (c: number[], a = 1) => `rgba(${c.map((v) => Math.round(v)).join(", ")}, ${a.toFixed(3)})`;

/** The film ground every readout preview sits on: the brand's near-black with its red gradient. */
export const Ground: React.FC<{ brand: Brand; children: React.ReactNode }> = ({ brand, children }) => (
  <div style={{ position: "absolute", inset: 0, background: brand.color.bgDeep, backgroundImage: brand.color.gradient, overflow: "hidden" }}>
    {children}
  </div>
);
