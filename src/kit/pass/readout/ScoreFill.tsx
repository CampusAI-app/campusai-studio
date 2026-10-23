/**
 * ScoreFill (2026-10-22): the profile strength ring filling as real steps land. The real sidebar profile
 * chip ("Maya Chen, 80%") lifts off its real dashboard and grows into view; its ring, in the brand red,
 * turns once as it lifts (the reset to `from` happens edge-on, never on screen) and then fills step by step while the percent rolls, and each step's label lands as a
 * row under it, pressing the stack. When the ring reaches `to`, the chip's real next action fades in.
 *
 * From the shelf: `list-stack-press` (rows fly up and the growing stack compresses on every landing while a
 * counter advances in sync) and `gauge-readout-moves` (the readout races to its value). The counter is the
 * kit `Odometer`; the lift is `element-body-moves` (spring damping 16 / stiffness 120).
 *
 * The chip is redrawn from campusai-demo's own source (layout/sidebar.tsx + profile/profile-strength-ring.tsx):
 * a 34 px ring with a 2 px stroke and round cap around the 28 px avatar, the name at 12 px semibold, the
 * subline at 10 px "{percent}% · {next action}". The avatar itself is cut from the capture. Each fill step
 * uses the ring's own transition, 600 ms cubic-bezier(0.4, 0, 0.2, 1), which is the kit's EASE_CAMERA.
 * Step labels and points come from the demo's strength model (lib/backend/demo-fixtures.ts), never invented.
 */
import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { camAlong, clampCam, rectOnCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { Icon, INTER, Odometer } from "../../parts";
import { EASE, EASE_CAMERA } from "../../../lib/anim";
import { MaskM, rgba } from "./shared";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type ScoreStep = { label: string; points: number };

export type ScoreChip = {
  /** The chip's box on the page, CSS px. */
  box: Rect;
  /** Ring centre on the page, CSS px (the ring is 34 px across, the avatar 28). */
  ring: { cx: number; cy: number };
  name: string;
  /** The chip's real next action, shown after the percent once the ring reaches `to`. */
  next?: string;
};

export type ScoreFillTiming = {
  /** Frame the chip starts to lift. */
  lift: number;
  /** Frame the first step lands, and the frames between steps. */
  firstStep: number;
  stepGap: number;
};

const RING = 34;
const STROKE = 2;
const AVATAR = 28;

/** Frame the chip is edge-on in its turn: before it the chip shows its real value, after it `from`. */
const turnAt = (t: ScoreFillTiming) => t.lift + 12;

/**
 * The percent shown at frame f: the chip's real value until it is edge-on in the lift's turn, `from` after it
 * (the reset is never on screen), then one eased step per row. On screen the number only counts up.
 */
export const scoreAt = (f: number, from: number, to: number, steps: ScoreStep[], t: ScoreFillTiming, fps: number) => {
  const ease = Math.round(0.6 * fps);
  let v = f < turnAt(t) ? to : from;
  steps.forEach((s, i) => {
    v += s.points * interpolate(f, [t.firstStep + i * t.stepGap, t.firstStep + i * t.stepGap + ease], [0, 1], { ...clamp, easing: EASE_CAMERA });
  });
  return v;
};

/** The chip, redrawn at `s` canvas px per CSS px, with its top-left at (x, y). */
const Chip: React.FC<{
  brand: Brand;
  src: string;
  page: Size;
  chip: ScoreChip;
  x: number;
  y: number;
  s: number;
  value: number;
  digits: number;
  nextK: number;
}> = ({ brand, src, page, chip, x, y, s, value, digits, nextK }) => {
  const r = (RING - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  // ring centre inside the chip box, from the capture
  const rx = (chip.ring.cx - chip.box.x) * s;
  const ry = (chip.ring.cy - chip.box.y) * s;
  const textX = rx + (RING / 2 + 10) * s;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: chip.box.w * s, height: chip.box.h * s }}>
      {/* avatar, cut from the real capture */}
      <div style={{ position: "absolute", left: rx - (AVATAR / 2) * s, top: ry - (AVATAR / 2) * s, width: AVATAR * s, height: AVATAR * s,
        borderRadius: "50%", overflow: "hidden" }}>
        <Img src={src} style={{ position: "absolute", left: -(chip.ring.cx - AVATAR / 2) * s, top: -(chip.ring.cy - AVATAR / 2) * s,
          width: page.w * s, height: page.h * s, maxWidth: "none" }} />
      </div>
      {/* the ring: track, then the arc from twelve o'clock */}
      <svg width={RING * s} height={RING * s} viewBox={`0 0 ${RING} ${RING}`}
        style={{ position: "absolute", left: rx - (RING / 2) * s, top: ry - (RING / 2) * s, transform: "rotate(-90deg)", overflow: "visible" }}>
        <circle cx={RING / 2} cy={RING / 2} r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={STROKE} />
        <circle cx={RING / 2} cy={RING / 2} r={r} fill="none" stroke={brand.color.accent} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ filter: `drop-shadow(0 0 ${(1.4).toFixed(1)}px rgba(${brand.color.glowRgb}, .7))` }} />
      </svg>
      {/* name and subline */}
      <div style={{ position: "absolute", left: textX, top: ry - 14 * s, fontFamily: INTER, whiteSpace: "nowrap" }}>
        <div style={{ fontSize: 12 * s, fontWeight: 600, color: brand.color.ink, lineHeight: 1.25, letterSpacing: "-0.01em" }}>{chip.name}</div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 10 * s, lineHeight: 1.2, color: brand.color.inkSoft, marginTop: 1.5 * s }}>
          <Odometer value={value} digits={digits} size={10 * s} color={brand.color.ink} weight={600} />
          <span style={{ fontWeight: 600, color: brand.color.ink }}>%</span>
          {chip.next ? (
            <span style={{ opacity: nextK, marginLeft: 0.3 * 10 * s, filter: nextK < 1 ? `blur(${((1 - nextK) * 6).toFixed(2)}px)` : undefined }}>
              {"· "}{chip.next}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/**
 * The whole move on its page. The caller gives the page, its camera keys, and where the chip is presented.
 */
export const ScoreFill: React.FC<{
  brand: Brand;
  src: string;
  page: Size;
  view: Rect;
  /** Page camera keys (frames). The camera holds still while the chip moves. */
  cams: { t: number; cam: PageCam }[];
  chip: ScoreChip;
  from: number;
  to: number;
  steps: ScoreStep[];
  timing: ScoreFillTiming;
  /** Presented chip: top-left on the canvas and canvas px per CSS px. */
  present: { x: number; y: number; s: number };
  /** Rows: top on the canvas, spacing, and type size. */
  rows?: { x: number; y: number; gap: number; size: number };
  /** Frame the chip goes home again, if it does. */
  returnAt?: number;
}> = ({ brand, src, page, view, cams, chip, from, to, steps, timing, present, rows, returnAt }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = clampCam(camAlong(f, cams), page, view);
  const home = rectOnCanvas(cam, view, chip.box);
  const homeS = home.w / chip.box.w;

  const k = spring({ frame: f - timing.lift, fps, config: { damping: 16, stiffness: 120 } });
  let go = interpolate(f, [timing.lift, timing.lift + 24], [0, 1], { ...clamp, easing: EASE });
  if (returnAt !== undefined) go *= 1 - interpolate(f, [returnAt, returnAt + 22], [0, 1], { ...clamp, easing: EASE });
  const lifted = f >= timing.lift;
  const s = homeS + (present.s - homeS) * go;
  const x = home.x + (present.x - home.x) * go;
  const y = home.y + (present.y - home.y) * go - 14 * Math.min(1, k) * (1 - go);
  const dim = interpolate(go, [0, 1], [0, 0.74]);

  const value = scoreAt(f, from, to, steps, timing, fps);
  // the number ticks in whole percents: a step of 10 passes through ten numbers in 18 frames, too fast for a
  // rolling column to ever sit still, so every frame shows crisp whole digits while the ring sweeps smoothly
  const shown = Math.round(value);
  // the turn: 0 to 90 degrees into edge-on, then from -90 back to flat, with a little blur at the edge
  const ta = turnAt(timing);
  const turn = f < ta ? interpolate(f, [timing.lift + 2, ta], [0, 90], { ...clamp, easing: EASE_CAMERA })
    : interpolate(f, [ta, ta + 12], [-90, 0], { ...clamp, easing: EASE });
  const edgeBlur = (Math.abs(turn) / 90) * 6;
  const digits = String(Math.max(from, to)).length;
  const lastLand = timing.firstStep + (steps.length - 1) * timing.stepGap + Math.round(0.6 * fps);
  const nextK = interpolate(f, [lastLand, lastLand + 12], [0, 1], { ...clamp, easing: EASE });
  // the hold keeps breathing: everything presented drifts up 8 px over three seconds
  const drift = interpolate(f, [lastLand, lastLand + 90], [0, 8], clamp);

  const R = rows ?? { x: present.x + 24, y: present.y + chip.box.h * present.s + 70, gap: 76, size: 40 };
  // the stack presses a little on every landing (list-stack-press): rows already down dip 5 px and recover
  const bump = (j: number) => {
    const at = timing.firstStep + j * timing.stepGap;
    return interpolate(f, [at + 3, at + 6, at + 14], [0, 1, 0], clamp);
  };

  // the slot the chip left, in the sidebar's own colour
  const slot = lifted ? rectOnCanvas(cam, view, { x: chip.box.x - 2, y: chip.box.y - 2, w: chip.box.w + 4, h: chip.box.h + 4 }) : null;

  return (
    <PageView src={src} page={page} cam={cam} view={view} brand={brand} radius={0} dim={dim}>
      <MaskM cam={cam} view={view} />
      {slot ? <div style={{ position: "absolute", left: slot.x, top: slot.y, width: slot.w, height: slot.h, borderRadius: 8,
        background: rgba([33, 21, 21].map((c) => c * (1 - dim * 0.72))), opacity: Math.min(1, go * 3) }} /> : null}
      {lifted ? (
        <>
          <div style={{ position: "absolute", left: x + 20 * go, top: y + 40 * go, width: chip.box.w * s, height: chip.box.h * s, borderRadius: 30,
            background: "#000", opacity: 0.35 * go, filter: `blur(${(10 + 40 * go).toFixed(1)}px)` }} />
          <div style={{ position: "absolute", inset: 0, perspective: 1800, perspectiveOrigin: `${x + (chip.box.w * s) / 2}px ${y}px` }}>
            <div style={{ position: "absolute", inset: 0, transform: `rotateY(${turn.toFixed(2)}deg)`, transformOrigin: `${x + (chip.box.w * s) / 2}px ${y}px`,
              filter: edgeBlur > 0.05 ? `blur(${edgeBlur.toFixed(2)}px)` : undefined }}>
              <Chip brand={brand} src={src} page={page} chip={chip} x={x} y={y - drift} s={s} value={shown} digits={digits} nextK={nextK} />
            </div>
          </div>
        </>
      ) : null}
      {steps.map((st, i) => {
        const at = timing.firstStep + i * timing.stepGap;
        const p = spring({ frame: f - at, fps, config: { damping: 15, stiffness: 150, mass: 0.7 } });
        if (f < at) return null;
        const press = steps.reduce((n, _, j) => (j > i ? n + bump(j) : n), 0);
        const yRow = R.y + i * R.gap + (1 - p) * 70 + press * 5 - drift;
        return (
          <div key={i} style={{ position: "absolute", left: R.x, top: yRow, display: "flex", alignItems: "center", gap: R.size * 0.5,
            fontFamily: INTER, fontWeight: 600, fontSize: R.size, color: brand.color.ink, whiteSpace: "nowrap", letterSpacing: "-0.015em",
            opacity: Math.min(1, p * 1.6), filter: p < 0.9 ? `blur(${((0.9 - p) * 8).toFixed(2)}px)` : undefined }}>
            <div style={{ width: R.size * 1.1, height: R.size * 1.1, borderRadius: "50%", background: brand.color.accent, display: "grid", placeItems: "center",
              boxShadow: `0 6px 24px rgba(${brand.color.glowRgb}, .35)` }}>
              <Icon name="check" size={R.size * 0.66} color={brand.color.accentInk} stroke={3} />
            </div>
            {st.label}
          </div>
        );
      })}
    </PageView>
  );
};
