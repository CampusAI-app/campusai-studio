/**
 * Helpers the type group shares (2026-10-22). Kept in this folder on purpose: the brief keeps
 * shared files out of `kit/index.ts` until a part is promoted.
 *
 * MPatch: the Maryland mark beside the logo is never shown. On the 2026-10-22 pass captures the mark
 * sits at CSS x 128 to 146, y 19 to 37 with its divider at x 120 (measured from the pixels; the
 * coordinator's corrected box is x 108 to 156, y 10 to 46). The patch covers x 113 to 156, y 10 to 46
 * in the sidebar's own colour, sampled per page. It stops at x 113 on purpose: x 108 to 111 is the
 * red sparkle of the CampusAI logo itself, which stays.
 */
import React from "react";
import type { PageCam, Rect } from "../../camera";
import { rectOnCanvas } from "../../camera";

/** The mark plus the divider, in page CSS px. */
export const M_RECT: Rect = { x: 113, y: 10, w: 43, h: 36 };

/** Sidebar colour behind the mark, sampled from each capture at CSS (165, 10). */
export const SIDEBAR = {
  dashboard: "rgb(33, 21, 21)",
  notifications: "rgb(33, 21, 21)",
  "job-goldman": "rgb(29, 20, 21)",
} as const;

/** A patch over the mark, as a child of `PageView` (children draw in canvas px). */
export const MPatch: React.FC<{ cam: PageCam; view: Rect; color: string }> = ({ cam, view, color }) => {
  const r = rectOnCanvas(cam, view, M_RECT);
  return <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, background: color }} />;
};

/**
 * Frames a line must stay fully on screen: letters / 15 + 1.5 s, never under 1.8 s (studio rule).
 * Counts letters and digits, the rule's own unit (spaces and punctuation are not letters).
 */
export const readFrames = (text: string, fps: number) =>
  Math.ceil(Math.max(1.8, (text.match(/[\p{L}\p{N}]/gu)?.length ?? 0) / 15 + 1.5) * fps);

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
