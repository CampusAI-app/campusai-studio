/**
 * score-fill (2026-10-23, wave 2): the kit ScoreFill move (kit/pass/readout/ScoreFill.tsx, from the shelf's
 * list-stack-press and gauge-readout-moves) as a storyboard part. The real sidebar profile chip lifts off its
 * real page (which stays behind it, dimmed, with an empty slot where the chip was) and grows into view; its
 * ring then fills step by step while the percent rolls, and each step's label lands as a row under it,
 * pressing the stack. When the ring reaches `to`, the chip's real next action fades in.
 *
 * One change from the kit part, on purpose: the kit chip shows `to` until it is edge-on in a turn and then
 * resets to `from`. Here the page under the chip already reads `from`, so the chip starts at `from` and only
 * ever counts up, with no turn. Every number and label is a capture's: `from` is the chip on the page, `to` the
 * chip after the steps were really done, each step the panel row that was saved, `next` the chip's own line.
 *
 * The chip is redrawn from campusai-demo's source (sidebar.tsx + profile-strength-ring.tsx) as the kit does:
 * a 34 px ring with a 2 px round-capped stroke round the 28 px avatar (cut from the capture), the name at 12 px
 * semibold, "{percent}% · {next}" at 10 px. Each fill uses the ring's own 600 ms ease (bezier .4 0 .2 1).
 *
 * Props (page px; times in seconds after the shot starts):
 *   chip: { box, ring: {cx, cy}, name, next? }   the chip on the shot's surface
 *   from, to: number                             the chip's value before and after
 *   steps: { label, points }[]                   what was done, in order; points sum to to - from
 *   lift?, firstStep?, stepGap?: number          defaults 0.5, 1.6, 0.6
 *   scale?: number                               presented size, canvas px per CSS px. Default fits 80% of the view width.
 */
import React from "react";
import { Img, interpolate, spring } from "remotion";
import type { Rect } from "../../kit/camera";
import { rectOnCanvas } from "../../kit/camera";
import { Icon, INTER, Odometer } from "../../kit/parts";
import { CURVE, DUR, FPS, SPRING } from "../motion";
import { asset, clamp, num, ramp, SurfaceView } from "./common";
import type { PartProps } from "./types";

type Chip = { box: Rect; ring: { cx: number; cy: number }; name: string; next?: string };
type Step = { label: string; points: number };

const RING = 34;
const STROKE = 2;
const AVATAR = 28;
// motion: profile-strength-ring.tsx animates its stroke over 600 ms on cubic-bezier(0.4, 0, 0.2, 1), which is CURVE.quiet.standard
const FILL = Math.round(0.6 * FPS);

export const ScoreChip: React.FC<PartProps> = ({ surface, brand, f, layout, props, ctx }) => {
  const chip = props.chip as Chip | undefined;
  const steps = (Array.isArray(props.steps) ? props.steps : []) as Step[];
  if (!surface || !chip) return null;
  const from = num(props.from, 0);
  const to = num(props.to, from);
  const lift = num(props.lift, 0.5) * FPS;
  const first = num(props.firstStep, 1.6) * FPS;
  const gap = num(props.stepGap, 0.6) * FPS;
  const { view, u } = layout;
  const cam = ctx.cam(f);
  const home = rectOnCanvas(cam, view, chip.box);
  const homeS = home.w / chip.box.w;
  const S = num(props.scale, (view.w * 0.8) / chip.box.w);
  const present = { x: view.x + (view.w - chip.box.w * S) / 2, y: view.y + view.h * 0.12 };

  const k = spring({ frame: f - lift, fps: FPS, config: SPRING.pop });
  const go = ramp(f, lift, lift + DUR.reframe, CURVE.quiet.enter);
  const s = homeS + (S - homeS) * go;
  const x = home.x + (present.x - home.x) * go;
  const y = home.y + (present.y - home.y) * go - 14 * u * Math.min(1, k) * (1 - go);
  const dim = 0.74 * go;

  let value = from;
  steps.forEach((st, i) => {
    value += st.points * interpolate(f, [first + i * gap, first + i * gap + FILL], [0, 1], { ...clamp, easing: CURVE.quiet.standard });
  });
  const shown = Math.round(value);
  const lastLand = first + (steps.length - 1) * gap + FILL;
  const nextK = ramp(f, lastLand, lastLand + DUR.arrive, CURVE.quiet.enter);
  const drift = interpolate(f, [lastLand, lastLand + 90], [0, 8 * u], clamp);
  const lifted = f >= lift;

  const rowSize = 46 * u;
  const rowGap = 84 * u;
  const rowX = present.x + 30 * u;
  const rowY = present.y + chip.box.h * S + 70 * u;
  const bump = (j: number) => {
    const at = first + j * gap;
    return interpolate(f, [at + 3, at + 6, at + 14], [0, 1, 0], clamp);
  };
  const slot = lifted ? rectOnCanvas(cam, view, { x: chip.box.x - 2, y: chip.box.y - 2, w: chip.box.w + 4, h: chip.box.h + 4 }) : null;

  // the chip, redrawn at scale s
  const r = (RING - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const rx = (chip.ring.cx - chip.box.x) * s;
  const ry = (chip.ring.cy - chip.box.y) * s;
  const digits = String(Math.max(from, to)).length;

  return (
    <SurfaceView surface={surface} brand={brand} layout={layout} cam={cam} dim={dim}>
      {slot ? <div style={{ position: "absolute", left: slot.x, top: slot.y, width: slot.w, height: slot.h, borderRadius: 8 * homeS,
        background: `rgb(${[33, 21, 21].map((v) => Math.round(v * (1 - dim * 0.72))).join(",")})`, opacity: Math.min(1, go * 3) }} /> : null}
      {lifted ? (
        <>
          <div style={{ position: "absolute", left: x + 20 * go, top: y + 40 * go, width: chip.box.w * s, height: chip.box.h * s, borderRadius: 30,
            background: "#000", opacity: 0.35 * go, filter: `blur(${(10 + 40 * go).toFixed(1)}px)` }} />
          <div style={{ position: "absolute", left: x, top: y - drift, width: chip.box.w * s, height: chip.box.h * s }}>
            <div style={{ position: "absolute", left: rx - (AVATAR / 2) * s, top: ry - (AVATAR / 2) * s, width: AVATAR * s, height: AVATAR * s,
              borderRadius: "50%", overflow: "hidden" }}>
              <Img src={asset(surface.src)} style={{ position: "absolute", left: -(chip.ring.cx - AVATAR / 2) * s, top: -(chip.ring.cy - AVATAR / 2) * s,
                width: surface.page.w * s, height: surface.page.h * s, maxWidth: "none" }} />
            </div>
            <svg width={RING * s} height={RING * s} viewBox={`0 0 ${RING} ${RING}`}
              style={{ position: "absolute", left: rx - (RING / 2) * s, top: ry - (RING / 2) * s, transform: "rotate(-90deg)", overflow: "visible" }}>
              <circle cx={RING / 2} cy={RING / 2} r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={STROKE} />
              <circle cx={RING / 2} cy={RING / 2} r={r} fill="none" stroke={brand.color.accent} strokeWidth={STROKE} strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ filter: `drop-shadow(0 0 1.4px rgba(${brand.color.glowRgb}, .7))` }} />
            </svg>
            <div style={{ position: "absolute", left: rx + (RING / 2 + 10) * s, top: ry - 14 * s, fontFamily: INTER, whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 12 * s, fontWeight: 600, color: brand.color.ink, lineHeight: 1.25, letterSpacing: "-0.01em" }}>{chip.name}</div>
              <div style={{ display: "flex", alignItems: "center", fontSize: 10 * s, lineHeight: 1.2, color: brand.color.inkSoft, marginTop: 1.5 * s }}>
                <Odometer value={shown} digits={digits} size={10 * s} color={brand.color.ink} weight={600} />
                <span style={{ fontWeight: 600, color: brand.color.ink }}>%</span>
                {chip.next ? (
                  <span style={{ opacity: nextK, marginLeft: 3 * s, filter: nextK < 1 ? `blur(${((1 - nextK) * 6).toFixed(2)}px)` : undefined }}>{"· "}{chip.next}</span>
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : null}
      {steps.map((st, i) => {
        const at = first + i * gap;
        if (f < at) return null;
        const p = spring({ frame: f - at, fps: FPS, config: { damping: 15, stiffness: 150, mass: 0.7 } });
        const press = steps.reduce((n, _, j) => (j > i ? n + bump(j) : n), 0);
        const yRow = rowY + i * rowGap + (1 - p) * 70 * u + press * 5 * u - drift;
        return (
          <div key={i} style={{ position: "absolute", left: rowX, top: yRow, display: "flex", alignItems: "center", gap: rowSize * 0.5,
            fontFamily: INTER, fontWeight: 600, fontSize: rowSize, color: brand.color.ink, whiteSpace: "nowrap", letterSpacing: "-0.015em",
            opacity: Math.min(1, p * 1.6), filter: p < 0.9 ? `blur(${((0.9 - p) * 8).toFixed(2)}px)` : undefined }}>
            <div style={{ width: rowSize * 1.1, height: rowSize * 1.1, borderRadius: "50%", background: brand.color.accent, display: "grid", placeItems: "center",
              boxShadow: `0 6px 24px rgba(${brand.color.glowRgb}, .35)` }}>
              <Icon name="check" size={rowSize * 0.66} color={brand.color.accentInk} stroke={3} />
            </div>
            {st.label}
          </div>
        );
      })}
    </SurfaceView>
  );
};
