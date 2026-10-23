/**
 * Spring film parts (2026-10-21). Every product pixel is a still from `capture/spring-film.cjs` (one live run of
 * Plan my spring on campusai-demo.vercel.app) or `capture/spring-planner.cjs`; these parts only place, crop and
 * move those stills. Page px below are CSS px of the 1100x1400 capture viewport; the stills are 3x.
 */
import React from "react";
import { Img, staticFile } from "remotion";
import { EASE, mix, ramp } from "../shots/_fixtures/Polish";
import { springAt } from "../shots/_fixtures/Look";
import type { Box } from "./data";

export const PAGE = { w: 1100, h: 1400 };
/** The canvas point a camera centres on: the frame's middle, nudged below the headline band. */
export const VIEW = { cx: 540, cy: 1150 };
export const BG = "#0b0708";
export const RED = "#D9202E";
export const INK = { ink: "#F4EFEF", soft: "rgba(244,239,239,0.62)", accent: "#E8424E", surface: "#1a1214", line: "rgba(255,255,255,0.08)" };

/** Round 2 stills (from the dashboard, `spring-story.cjs`) by name; `spring/<name>` reaches round 1's planner-page run. */
export const still = (name: string) => staticFile(name.includes("/") ? `${name}.jpg` : `spring2/${name}.jpg`);

/** x, y = the page point shown at VIEW; s = canvas px per page px. */
export type Cam = { x: number; y: number; s: number };
export const mixCam = (a: Cam, b: Cam, t: number): Cam => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), s: mix(a.s, b.s, t) });
export const toCanvas = (cam: Cam, px: number, py: number) => ({ x: VIEW.cx + (px - cam.x) * cam.s, y: VIEW.cy + (py - cam.y) * cam.s });

/** A whole still as a flat page under a camera. `clip` keeps only page rows [top, bottom). */
export const Page: React.FC<{ src: string; cam: Cam; dy?: number; clip?: { top: number; bottom: number }; style?: React.CSSProperties }> = ({
  src, cam, dy = 0, clip, style,
}) => {
  const left = VIEW.cx - cam.x * cam.s;
  const top = VIEW.cy - cam.y * cam.s + dy;
  const clipPath = clip ? `inset(${(clip.top * cam.s).toFixed(1)}px 0 ${((PAGE.h - clip.bottom) * cam.s).toFixed(1)}px 0)` : undefined;
  return (
    <Img src={src} style={{ position: "absolute", left, top, width: PAGE.w * cam.s, height: PAGE.h * cam.s, maxWidth: "none", clipPath, ...style }} />
  );
};

/** One region of a still, drawn into a canvas rect. */
export const Crop: React.FC<{ src: string; box: Box; rect: { x: number; y: number; w: number; h: number }; radius?: number; style?: React.CSSProperties }> = ({
  src, box, rect, radius = 0, style,
}) => {
  const q = rect.w / box.w;
  return (
    <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, overflow: "hidden", borderRadius: radius, ...style }}>
      <Img src={src} style={{ position: "absolute", left: -box.x * q, top: -box.y * q, width: PAGE.w * q, height: PAGE.h * q, maxWidth: "none" }} />
    </div>
  );
};

/* ---------- cursor (shelf `cursor-flyover`: an SVG pointer that arrives, presses, and leaves a ripple) ---------- */

export type CursorKey = { at: number; x: number; y: number; press?: boolean };
/** Cursor tip position at frame f along keys (eased hops between them, holding at each). */
export const cursorAt = (f: number, keys: CursorKey[]) => {
  let p = { x: keys[0].x, y: keys[0].y };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    const hop = Math.min(16, b.at - a.at);
    const t = ramp(f, b.at - hop, hop, EASE.swift);
    if (f >= b.at - hop) p = { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) };
  }
  return p;
};
export const Cursor: React.FC<{ f: number; keys: CursorKey[]; from: number; to: number }> = ({ f, keys, from, to }) => {
  if (f < from || f > to) return null;
  const { x, y } = cursorAt(f, keys);
  const vis = ramp(f, from, 6, EASE.out) * (1 - ramp(f, to - 5, 5, EASE.exit));
  const presses = keys.filter((k) => k.press);
  const dip = presses.reduce((d, k) => Math.max(d, f >= k.at - 3 && f < k.at + 4 ? 1 - Math.abs(f - k.at) / 4 : 0), 0);
  return (
    <>
      {presses.map((k) => {
        const r = ramp(f, k.at, 16, EASE.out);
        if (f < k.at || f > k.at + 16) return null;
        return (
          <div key={k.at} style={{ position: "absolute", left: k.x - 70 * r, top: k.y - 70 * r, width: 140 * r, height: 140 * r, borderRadius: "50%",
            border: `4px solid rgba(255,255,255,${(0.7 * (1 - r)).toFixed(3)})`, background: `rgba(232,66,78,${(0.22 * (1 - r)).toFixed(3)})` }} />
        );
      })}
      <svg width={64} height={86} viewBox="0 0 32 43" style={{ position: "absolute", left: x - 4, top: y - 2, opacity: vis,
        transform: `scale(${(1 - 0.14 * dip).toFixed(3)})`, transformOrigin: "4px 2px", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.55))" }}>
        <path d="M2 1 L2 33 L10 26 L15.5 39 L21 36.6 L15.6 24 L26 24 Z" fill="#fff" stroke="#120c0d" strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </>
  );
};

/* ---------- the lift (shelf `element-body-moves`, via studio/src/shots/element-body-moves/ContactLift.tsx) ----------
 * Kept: spring lift (damping 16 / stiffness 120), lift = 1.15k plus a 0.04 breathe, scale 1 + 0.05k, the in-cubic drop
 * and 2f squash on landing, and both shadows living ON THE SURFACE (contact core tightens and darkens as it comes
 * down, ambient grows as it rises), doubled for the near-black page. Changed: the piece lifts in place, because at
 * this camera the row already fills the frame's width; the page behind it dims while it is up. */
const inCubic = (t: number) => Math.pow(Math.min(1, Math.max(0, t)), 3);
export const LiftPiece: React.FC<{ f: number; dur: number; src: string; box: Box; cam: Cam }> = ({ f, dur, src, box, cam }) => {
  if (f < 0 || f > dur + 2) return null;
  const LAND = dur - 3;
  const DROP = 6;
  const k = springAt(f, 0, { damping: 16, stiffness: 120 });
  const breathe = f > 16 ? 0.04 * Math.sin(((f - 16) / 40) * Math.PI * 2) * ramp(f, 16, 20, EASE.smooth) : 0;
  const down = inCubic((f - (LAND - DROP)) / DROP);
  const lift = (1.15 * k + breathe) * (1 - down);
  let s = 1 + 0.05 * Math.min(1.2, k) * (1 - down);
  if (f >= LAND) s = 0.99 + 0.01 * (1 - Math.pow(1 - Math.min(1, (f - LAND) / 2), 3));
  else if (f >= LAND - 1) s = 0.99;
  const l = Math.max(0, Math.min(1, lift));
  const p = toCanvas(cam, box.x, box.y);
  const rect: React.CSSProperties = { position: "absolute", left: p.x, top: p.y, width: box.w * cam.s, height: box.h * cam.s, borderRadius: 14 };
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: `rgba(8,5,6,${(0.5 * l).toFixed(3)})` }} />
      <div style={{ ...rect, background: `rgba(0,0,0,${Math.min(1, 2 * (0.09 + 0.13 * l)).toFixed(3)})`, filter: `blur(${(14 + 40 * l).toFixed(1)}px)`,
        transform: `translate(${(10 + 40 * l).toFixed(1)}px, ${(16 + 60 * l).toFixed(1)}px) scale(${(1 + 0.06 * l).toFixed(4)})` }} />
      <div style={{ ...rect, background: `rgba(0,0,0,${Math.min(1, 2 * (0.32 - 0.18 * l)).toFixed(3)})`, filter: `blur(${(3 + 22 * l).toFixed(1)}px)`,
        transform: `translate(${(2 + 18 * l).toFixed(1)}px, ${(4 + 36 * l).toFixed(1)}px) scale(${(0.99 + 0.05 * l).toFixed(4)})` }} />
      <div style={{ ...rect, transform: `translateY(${(-28 * lift).toFixed(2)}px) scale(${s.toFixed(4)})` }}>
        <Crop src={src} box={box} rect={{ x: 0, y: 0, w: box.w * cam.s, h: box.h * cam.s }} radius={14} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 14, boxShadow: `inset 0 0 0 2px rgba(232,66,78,${(0.55 * l).toFixed(3)})` }} />
      </div>
    </>
  );
};

/** Dark band behind the headline, so the page can run full bleed under it with no seam. */
export const TopShade: React.FC = () => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 600,
    background: `linear-gradient(180deg, ${BG} 0%, ${BG} 46%, rgba(11,7,8,0.86) 60%, rgba(11,7,8,0) 100%)` }} />
);
