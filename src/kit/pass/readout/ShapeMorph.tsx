/**
 * ShapeMorph (2026-10-22): one brand-red shape, never cut, morphing through CampusAI's real UI states while
 * the kit pointer drives every change with a press. Each state is a real component's own proportions,
 * corner radius and label, measured off the pass captures, and the last state turns the shape into the
 * sparkle of the CampusAI logo while the wordmark resolves around it.
 *
 * From: "Shape morphing through UI states" (@twoclipping, Design/prompts/opus-motion-films.md) and its
 * numbers from "14-second UI morph loop" (@flxrnc). Kept: one element on a beat grid (120 BPM, 15 frames a
 * beat), closed-form springs so every frame is a pure function of time, the stretchy indicator trick (each
 * edge rides its own spring and the edge that moves further leads: 0.24 s settle against 0.42 s, damping
 * ratio 0.8 so the overshoot stays under 2%), colour and radius on a critically damped 0.3 s spring, and the
 * content swap as a 12 px blur and fade, 0.1 s out then 0.1 s in, never overlapping. Changed: the camera zoom is folded into the shape's
 * own size (each state is laid out at the scale that fills `fill`), so nothing is transform-scaled.
 *
 * Holds come from `beats` per state. Size them so every label stays fully on screen for the reading rule
 * (letters / 15 + 1.5 s, at least 1.8 s); the incoming label is fully in 6 frames after the press, 10 when it waits for a big change of size.
 */
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../../brand";
import type { Rect, Size } from "../../camera";
import { PointerAt } from "../../Pointer";
import { INTER } from "../../parts";
import { EASE_CAMERA } from "../../../lib/anim";
import { mixRgb, rgbOf, rgba, springStep } from "./shared";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Lucide paths for the few icons the real states carry. */
const GLYPH = {
  check: ["M20 6 9 17l-5-5"],
  bell: ["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.94 1.94 0 0 0 3.4 0"],
  arrow: ["M7 7h10v10", "M7 17 17 7"],
} as const;

export type MorphLook = "solid" | "tint" | "quiet";
export type MorphRun = { text: string; accent?: boolean };

export type MorphState = {
  /** The real component's size and corner radius, CSS px. */
  w: number;
  h: number;
  radius: number;
  /** Its label, verbatim. Runs let part of it carry the accent ("6" in "6 new"). */
  label?: string | MorphRun[];
  icon?: keyof typeof GLYPH;
  iconSide?: "left" | "right";
  /** Accent on the icon only (the bell is red on a neutral button). */
  iconAccent?: boolean;
  /** solid = filled accent, tint = 12% accent with an accent border, quiet = the product's neutral surface. */
  look?: MorphLook;
  /** Label size in CSS px. Default 14. */
  fontSize?: number;
  /** A real capture as the content (a card): the page image, its size, and the component's box on it. */
  image?: { src: string; page: Size; rect: Rect };
  /** The last state: the shape becomes the logo's sparkle and the wordmark resolves around it. */
  logo?: boolean;
  /** Offset of this state's centre from the stage centre, canvas px. */
  dx?: number;
  dy?: number;
};

type Box = { l: number; r: number; t: number; b: number; rad: number; s: number };

const LOGO_VB = { w: 223, h: 53, sx: 217.176, sy: 5.824, ss: 11.648 };

export const ShapeMorph: React.FC<{
  brand: Brand;
  states: MorphState[];
  /** Beats each state holds before the next press; the last one is the end hold. */
  beats: number[];
  bpm?: number;
  /** Frames before the first beat (a downbeat offset). */
  offset?: number;
  /** Stage centre, the box each state fills, and the largest scale a small state may take. */
  center: { x: number; y: number };
  fill: { w: number; h: number };
  maxScale?: number;
  /** Logo width on the canvas for the final state. */
  logoWidth?: number;
  /** Where the pointer enters from, canvas px. */
  pointerFrom?: { x: number; y: number };
}> = ({ brand, states, beats, bpm = 120, offset = 3, center, fill, maxScale = 4.2, logoWidth = 560, pointerFrom }) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const beatF = (fps * 60) / bpm;
  const presses: number[] = [];
  let acc = offset;
  for (let i = 0; i < states.length - 1; i++) {
    acc += beats[i] * beatF;
    presses.push(Math.round(acc));
  }

  const A = rgbOf(brand.color.accent);
  const S = rgbOf(brand.color.surface);
  const I = rgbOf(brand.color.ink);
  const AI = rgbOf(brand.color.accentInk);
  const look = (st: MorphState) => {
    const l = st.logo ? "solid" : st.look ?? "solid";
    if (l === "solid") return { bg: A, line: [...A, 0], text: AI };
    if (l === "tint") return { bg: mixRgb(S, A, 0.16), line: [...A, 0.55], text: A };
    return { bg: mixRgb(S, I, 0.07), line: [...I, 0.14], text: I };
  };

  // target box of every state on the canvas
  const logoH = logoWidth * (LOGO_VB.h / LOGO_VB.w);
  const boxes: Box[] = states.map((st) => {
    const cx = center.x + (st.dx ?? 0);
    const cy = center.y + (st.dy ?? 0);
    if (st.logo) {
      const k = logoWidth / LOGO_VB.w;
      const sx = cx - logoWidth / 2 + LOGO_VB.sx * k;
      const sy = cy - logoH / 2 + LOGO_VB.sy * k;
      const sz = LOGO_VB.ss * k * 0.62;
      return { l: sx - sz / 2, r: sx + sz / 2, t: sy - sz / 2, b: sy + sz / 2, rad: sz / 2, s: k };
    }
    const s = Math.min(maxScale, fill.w / st.w, fill.h / st.h);
    return { l: cx - (st.w * s) / 2, r: cx + (st.w * s) / 2, t: cy - (st.h * s) / 2, b: cy + (st.h * s) / 2, rad: st.radius * s, s };
  });

  // every channel is the first value plus one spring per change of target
  const t = (k: number) => (f - presses[k]) / fps;
  const edge = (pick: (b: Box) => number, other: (b: Box) => number) => {
    let v = pick(boxes[0]);
    for (let k = 0; k < presses.length; k++) {
      const d = pick(boxes[k + 1]) - pick(boxes[k]);
      const leads = Math.abs(d) >= Math.abs(other(boxes[k + 1]) - other(boxes[k]));
      v += d * springStep(t(k), 0.8, leads ? 0.24 : 0.42);
    }
    return v;
  };
  const L = edge((b) => b.l, (b) => b.r);
  const R = edge((b) => b.r, (b) => b.l);
  const T = edge((b) => b.t, (b) => b.b);
  const B = edge((b) => b.b, (b) => b.t);
  const soft = (vals: number[][]) => {
    let v = vals[0];
    for (let k = 0; k < presses.length; k++) {
      const p = springStep(t(k), 1, 0.3);
      v = v.map((x, i) => x + (vals[k + 1][i] - vals[k][i]) * p);
    }
    return v;
  };
  const looks = states.map(look);
  const bg = soft(looks.map((x) => x.bg));
  const line = soft(looks.map((x) => x.line));
  const [rad] = soft(boxes.map((b) => [b.rad]));
  const w = Math.max(2, R - L);
  const h = Math.max(2, B - T);

  // the final state: shape out, logo in
  const last = states.length - 1;
  const logoAt = states[last].logo ? presses[last - 1] : null;
  const logoK = logoAt === null ? 0 : interpolate(f, [logoAt + 9, logoAt + 19], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const shapeOp = logoAt === null ? 1 : 1 - interpolate(f, [logoAt + 13, logoAt + 20], [0, 1], clamp);

  // pointer: arrive early, hold, press; leaves after the last press
  const target = (k: number) => {
    const b = boxes[k];
    return { x: b.l + (b.r - b.l) * 0.78, y: b.t + (b.b - b.t) * 0.62 };
  };
  const from = pointerFrom ?? { x: W * 0.86, y: H * 0.84 };
  const legs: { a: number; b: number; p: { x: number; y: number }; q: { x: number; y: number } }[] = [];
  presses.forEach((c, k) => {
    const p = k === 0 ? from : target(k - 1);
    const startAt = k === 0 ? 0 : Math.max(presses[k - 1] + 6, c - 30);
    const endAt = k === 0 ? Math.min(c - 12, 52) : c - 8;
    legs.push({ a: startAt, b: endAt, p, q: target(k) });
  });
  let pt = from;
  legs.forEach((g) => {
    if (f >= g.a) {
      const e = interpolate(f, [g.a, g.b], [0, 1], { ...clamp, easing: EASE_CAMERA });
      pt = { x: g.p.x + (g.q.x - g.p.x) * e, y: g.p.y + (g.q.y - g.p.y) * e };
    }
  });
  const lastPress = presses[presses.length - 1];
  const leave = interpolate(f, [lastPress + 4, lastPress + 16], [0, 1], clamp);
  pt = { x: pt.x + 60 * leave, y: pt.y + 90 * leave };
  const recent = [...presses].reverse().find((c) => f >= c && f < c + 15);
  const since = recent === undefined ? null : (f - recent) / fps;

  // content of each state, at that state's own scale
  const content = (st: MorphState, i: number) => {
    if (st.logo) return null;
    const inAt = i === 0 ? -99 : presses[i - 1];
    const outAt = i < presses.length ? presses[i] : 1e9;
    // a label waits for the shape when the size change is big (out of a card), so it never sits in the wrong box
    const prevB = i > 0 ? boxes[i - 1] : null;
    const big = prevB ? Math.abs((prevB.r - prevB.l) - (boxes[i].r - boxes[i].l)) + Math.abs((prevB.b - prevB.t) - (boxes[i].b - boxes[i].t)) > 360 : false;
    // the old label is fully out (3 f) before the new one starts (3 f), so two labels never share a frame
    const late = st.image ? 6 : big ? 7 : 3;
    const kIn = interpolate(f, [inAt + late, inAt + late + (st.image ? 8 : 3)], [0, 1], clamp);
    const kOut = interpolate(f, [outAt, outAt + 3], [0, 1], clamp);
    const k = kIn * (1 - kOut);
    if (k <= 0) return null;
    const b = boxes[i];
    const cx = (L + R) / 2;
    const cy = (T + B) / 2;
    const blur = (1 - k) * 12;
    if (st.image) {
      const s = b.s;
      return (
        <div key={i} style={{ position: "absolute", left: cx - (st.w * s) / 2, top: cy - (st.h * s) / 2, width: st.w * s, height: st.h * s,
          borderRadius: st.radius * s, overflow: "hidden", opacity: k, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
          <Img src={st.image.src} style={{ position: "absolute", left: -st.image.rect.x * s, top: -st.image.rect.y * s,
            width: st.image.page.w * s, height: st.image.page.h * s, maxWidth: "none" }} />
        </div>
      );
    }
    const fs = (st.fontSize ?? 14) * b.s;
    const col = rgba(looks[i].text);
    const runs: MorphRun[] = typeof st.label === "string" ? [{ text: st.label }] : st.label ?? [];
    const icon = st.icon ? (
      <svg width={fs * 1.05} height={fs * 1.05} viewBox="0 0 24 24" fill="none" stroke={st.iconAccent ? brand.color.accent : col}
        strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
        {GLYPH[st.icon].map((d, j) => <path key={j} d={d} />)}
      </svg>
    ) : null;
    return (
      <div key={i} style={{ position: "absolute", left: cx, top: cy, transform: "translate(-50%, -50%)", display: "flex", alignItems: "center",
        gap: fs * 0.42, whiteSpace: "nowrap", fontFamily: INTER, fontWeight: 600, fontSize: fs, lineHeight: 1, letterSpacing: "-0.01em", color: col,
        opacity: k, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
        {st.iconSide !== "right" ? icon : null}
        <span>{runs.map((r, j) => <span key={j} style={{ color: r.accent ? brand.color.accent : undefined }}>{r.text}</span>)}</span>
        {st.iconSide === "right" ? icon : null}
      </div>
    );
  };

  const drift = logoAt === null ? 0 : interpolate(f, [logoAt + 19, logoAt + 19 + fps * 3], [0, 0.012], clamp);
  const lw = logoWidth * (1 + drift);
  const lh = lw * (LOGO_VB.h / LOGO_VB.w);
  const cxs = (L + R) / 2;
  const cys = (T + B) / 2;

  return (
    <>
      {/* the product's own light under the shape */}
      <div style={{ position: "absolute", left: cxs - w * 0.9, top: cys - h * 0.9 - 40, width: w * 1.8, height: h * 1.8 + 80, borderRadius: "50%",
        background: `radial-gradient(closest-side, rgba(${brand.color.glowRgb}, .16), rgba(${brand.color.glowRgb}, 0))`, opacity: shapeOp }} />
      <div style={{ position: "absolute", left: L, top: T, width: w, height: h, borderRadius: Math.min(rad, w / 2, h / 2), background: rgba(bg),
        boxShadow: `inset 0 0 0 ${Math.max(1.5, boxes[0].s * 0.5).toFixed(2)}px ${rgba(line.slice(0, 3), line[3])}, 0 24px 60px rgba(0,0,0,.45)`,
        opacity: shapeOp }} />
      {states.map(content)}
      {logoAt !== null && logoK > 0 ? (
        <div style={{ position: "absolute", left: center.x + (states[last].dx ?? 0) - lw / 2, top: center.y + (states[last].dy ?? 0) - lh / 2, width: lw,
          opacity: logoK, filter: `${logoK < 1 ? `blur(${((1 - logoK) * 12).toFixed(2)}px) ` : ""}drop-shadow(0 0 40px rgba(${brand.color.glowRgb}, ${(0.45 * logoK).toFixed(3)}))` }}>
          {brand.logo ? <Img src={staticFile(brand.logo.onDark)} style={{ display: "block", width: "100%", height: "auto" }} /> : null}
        </div>
      ) : null}
      <PointerAt x={pt.x} y={pt.y} since={since} accent={brand.color.accent} opacity={1 - leave} />
    </>
  );
};
