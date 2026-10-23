/**
 * RoleCard (2026-10-22): the weekly "roles worth a look" layout. The REAL job card is cut out of the real
 * Job Match capture and lifts off its real page, which stays on screen behind it, dimmed, with an empty
 * slot where the card was. Then the card's own reason line and three of its own chips are called out bigger
 * below it, the key chip in the brand accent. `RoleSequence` steps through several roles: the card lands
 * back in its slot, the page camera scrolls the real list to the next card, and the next one lifts.
 *
 * From: "Weekly player recommendation cards" (@Luchigatica, Design/prompts/opus-motion-films.md): one item,
 * a one-line reason, three chips with the key one in the accent. The lift is the shelf's `element-body-moves`
 * (ported in src/shots/element-body-moves/ContactLift.tsx): spring damping 16 / stiffness 120, a contact
 * shadow and an ambient shadow that live on the surface and separate as it rises (alphas doubled for the
 * dark page), an in-cubic drop over 8 frames and a 2 frame 0.99 squash on landing.
 *
 * Numbers that matter: lift 4 to 26 f, reason in at 24 f (14 f blur-in), chips pop at 34 / 40 / 46 f, the
 * callout then holds for the reading rule (letters / 15 + 1.5 s) before the card goes home in 22 f.
 * Every string comes from the capture: pass the card's own reason and chips, never new copy.
 */
import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { camAlong, clampCam, rectOnCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { INTER, pop } from "../../parts";
import { EASE } from "../../../lib/anim";
import { MaskM, readFrames } from "./shared";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const inCubic = (t: number) => Math.pow(Math.min(1, Math.max(0, t)), 3);

export type Role = {
  /** The page image the card lives on, and its size in CSS px. */
  src: string;
  page: Size;
  /** The card's box on that page, CSS px (from the capture's JSON). */
  card: Rect;
  /** The card's own reason line, verbatim. */
  reason: string;
  /** Three of the card's own chips, verbatim (match level, pay or location, closing date). */
  chips: string[];
  /** Which chip carries the accent. Default 0. */
  keyChip?: number;
  /** The page camera while this role is up. Default: the card near the top, 680 page px wide. */
  cam?: PageCam;
};

export type RoleTiming = {
  /** Frames from the role's start: lift, callout in, callout fully in, hold end, landed. */
  lift: number;
  reasonIn: number;
  chipsIn: number[];
  readyAt: number;
  holdEnd: number;
  total: number;
};

/** The beat of one role, with the hold sized to its reason line. `hold` overrides the reading rule. */
export const roleTiming = (role: Role, fps: number, hold?: number): RoleTiming => {
  const readyAt = 50;
  const h = hold ?? Math.max(readFrames(role.reason, fps), ...role.chips.map((c) => readFrames(c, fps)));
  const holdEnd = 38 + h;
  return { lift: 4, reasonIn: 24, chipsIn: [34, 40, 46], readyAt, holdEnd, total: holdEnd + 28 };
};

/** Default page camera for a role: card near the top of the frame, kept inside the page. */
export const roleCam = (role: Role, view: Rect, cw = 680): PageCam => {
  if (role.cam) return role.cam;
  const ch = cw * (view.h / view.w);
  return clampCam({ cw, cx: role.card.x + role.card.w / 2 + 80, cy: role.card.y - 150 + ch / 2 }, role.page, view);
};

/** Where the lifted card is presented, and the callout under it, on a canvas of this view. */
const presentLayout = (role: Role, view: Rect, width: number, reasonSize: number) => {
  const s = width / role.card.w;
  const cardH = role.card.h * s;
  const perLine = Math.floor(width / (reasonSize * 0.53));
  const lines = Math.ceil(role.reason.length / perLine);
  const reasonH = lines * reasonSize * 1.28;
  const chipsH = reasonSize * 0.82 + 34;
  const total = cardH + 46 + reasonH + 40 + chipsH;
  const top = view.y + Math.max(60, (view.h - total) / 2 - 20);
  return { s, x: view.x + (view.w - width) / 2, top, cardH, reasonTop: top + cardH + 46, chipsTop: top + cardH + 46 + reasonH + 40 };
};

/**
 * One role's lift and callout, drawn over a page the caller renders (inside the same view). `f` is frames
 * since the role started. Exported so a film can put it over its own PageView.
 */
export const RoleCardLayer: React.FC<{
  brand: Brand;
  role: Role;
  f: number;
  cam: PageCam;
  view: Rect;
  timing: RoleTiming;
  /** Where the card is presented and called out, on the canvas. Default: the view. */
  stage?: Rect;
  /** Width of the presented card on the canvas. */
  width?: number;
  reasonSize?: number;
}> = ({ brand, role, f, cam, view, timing, stage, width = 960, reasonSize = 44 }) => {
  const { fps } = useVideoConfig();
  if (f < 0 || f > timing.total + 2) return null;
  const home = rectOnCanvas(cam, view, role.card);
  const L = presentLayout(role, stage ?? view, width, reasonSize);
  const back = timing.holdEnd + 4;
  const land = timing.total - 2;

  // lift: the shelf's pick spring, then the drop home
  const k = spring({ frame: f - timing.lift, fps, config: { damping: 16, stiffness: 120 } });
  const down = inCubic((f - (land - 8)) / 8);
  const l = Math.max(0, Math.min(1, k * (1 - down)));
  const go = interpolate(f, [timing.lift, timing.lift + 22], [0, 1], { ...clamp, easing: EASE })
    * (1 - interpolate(f, [back, land], [0, 1], { ...clamp, easing: EASE }));
  const squash = f >= land ? 0.99 + 0.01 * Math.min(1, (f - land) / 2) : 1;
  const w = (home.w + (width - home.w) * go) * squash;
  const h = w * (role.card.h / role.card.w);
  const cx = home.x + home.w / 2 + (L.x + width / 2 - (home.x + home.w / 2)) * go;
  const cy = home.y + home.h / 2 + (L.top + L.cardH / 2 - (home.y + home.h / 2)) * go - 18 * l;
  const s = w / role.card.w;
  const radius = 12 * s;

  // callout: reason then chips, all out together before the card travels home
  const out = interpolate(f, [timing.holdEnd, timing.holdEnd + 10], [0, 1], clamp);
  const rIn = interpolate(f, [timing.reasonIn, timing.reasonIn + 14], [0, 1], { ...clamp, easing: EASE });
  const key = role.keyChip ?? 0;

  return (
    <>
      {/* the empty slot the card left */}
      <div style={{ position: "absolute", left: home.x, top: home.y, width: home.w, height: home.h, borderRadius: 12 * (home.w / role.card.w),
        background: brand.color.bg, opacity: 0.9 * Math.min(1, go * 1.6) * (1 - down), boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.07)" }} />
      {/* shadows on the surface, never on the piece */}
      <div style={{ position: "absolute", left: cx - w / 2 + 10 + 40 * l, top: cy - h / 2 + 16 + 60 * l, width: w * (1 + 0.06 * l), height: h,
        borderRadius: radius, background: "#000", opacity: 0.18 + 0.26 * l, filter: `blur(${14 + 40 * l}px)` }} />
      <div style={{ position: "absolute", left: cx - w / 2 + 2 + 18 * l, top: cy - h / 2 + 4 + 36 * l, width: w * (0.99 + 0.05 * l), height: h,
        borderRadius: radius, background: "#000", opacity: 0.64 - 0.36 * l, filter: `blur(${3 + 22 * l}px)` }} />
      {/* the real card, cut from the real page (laid out larger, never transform-scaled) */}
      <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: radius, overflow: "hidden",
        boxShadow: `0 0 0 1.5px rgba(255,255,255,${(0.06 + 0.08 * l).toFixed(3)})` }}>
        <Img src={role.src} style={{ position: "absolute", left: -role.card.x * s, top: -role.card.y * s, width: role.page.w * s, height: role.page.h * s, maxWidth: "none" }} />
      </div>
      {/* the reason, bigger */}
      <div style={{ position: "absolute", left: L.x, top: L.reasonTop + (1 - rIn) * 22, width, fontFamily: INTER, fontWeight: 600, fontSize: reasonSize,
        lineHeight: 1.28, letterSpacing: "-0.02em", color: brand.color.ink, opacity: rIn * (1 - out), filter: rIn < 1 ? `blur(${((1 - rIn) * 10).toFixed(2)}px)` : undefined }}>
        {role.reason}
      </div>
      {/* the three chips, the key one in the accent */}
      <div style={{ position: "absolute", left: L.x, top: L.chipsTop, width, display: "flex", gap: 18, flexWrap: "wrap" }}>
        {role.chips.map((c, i) => {
          const p = pop(f, timing.chipsIn[i] ?? timing.chipsIn[timing.chipsIn.length - 1], fps, 15);
          const isKey = i === key;
          return (
            <div key={i} style={{ fontFamily: INTER, fontWeight: 600, fontSize: reasonSize * 0.82, lineHeight: 1, padding: "17px 28px", borderRadius: 16,
              whiteSpace: "nowrap", color: isKey ? brand.color.accentInk : brand.color.ink,
              background: isKey ? brand.color.accent : "rgba(255,255,255,.06)",
              boxShadow: isKey ? `0 10px 40px rgba(${brand.color.glowRgb}, .35)` : "inset 0 0 0 1.5px rgba(255,255,255,.14)",
              opacity: Math.min(1, p * 1.5) * (1 - out), transform: `translateY(${((1 - p) * 26).toFixed(2)}px)` }}>
              {c}
            </div>
          );
        })}
      </div>
    </>
  );
};

/** When each role starts, and the full length, for a run of roles. `gap` is the camera move between them. */
export const roleSchedule = (roles: Role[], fps: number, lead = 14, gap = 30, tail = 30) => {
  const timings = roles.map((r) => roleTiming(r, fps));
  const starts: number[] = [];
  let t = lead;
  timings.forEach((tm) => {
    starts.push(t);
    t += tm.total + gap;
  });
  return { timings, starts, total: t - gap + tail };
};

/**
 * Several roles, one after another, on their real page. The page camera holds on each card, the card lifts
 * and is called out, lands home, and the camera scrolls the real list to the next one.
 */
export const RoleSequence: React.FC<{
  brand: Brand;
  roles: Role[];
  /** The page's own rectangle on the canvas. */
  view: Rect;
  /** Where cards are presented and called out (default: the view). Give the whole canvas when the page is framed smaller. */
  stage?: Rect;
  /** Page corner radius; 0 when the page fills the frame. */
  radius?: number;
  lead?: number;
  gap?: number;
  width?: number;
  reasonSize?: number;
}> = ({ brand, roles, view, stage, radius = 0, lead = 14, gap = 30, width, reasonSize }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { timings, starts } = roleSchedule(roles, fps, lead, gap);
  const cams = roles.map((r) => roleCam(r, view));

  // camera keys: a slight push-in on the first card, a hold through each role, a scroll between roles
  const first = cams[0];
  const keys: { t: number; cam: PageCam }[] = [
    { t: 0, cam: clampCam({ ...first, cw: Math.min(first.cw * 1.1, roles[0].page.w) }, roles[0].page, view) },
    { t: lead + 6, cam: first },
  ];
  roles.forEach((_, i) => {
    if (i === 0) return;
    const prevEnd = starts[i - 1] + timings[i - 1].total;
    keys.push({ t: prevEnd, cam: cams[i - 1] }, { t: starts[i] - 4, cam: cams[i] });
  });
  // the end never goes fully still: a slow 1.5% push after the last card lands
  const lastEnd = starts[roles.length - 1] + timings[roles.length - 1].total;
  const lastCam = cams[roles.length - 1];
  keys.push({ t: lastEnd, cam: lastCam }, { t: lastEnd + 90, cam: { ...lastCam, cw: lastCam.cw * 0.985 } });
  const cam = camAlong(f, keys);

  // the page in view belongs to the role being shown, switching when the camera starts toward the next
  let idx = 0;
  roles.forEach((_, i) => {
    if (i > 0 && f >= starts[i - 1] + timings[i - 1].total) idx = i;
  });
  const role = roles[idx];
  const local = f - starts[idx];
  const tm = timings[idx];
  // a scroll between two framings passes through the page dimmed, so a stitched tall capture's seam never reads
  let scrollDim = 0;
  roles.forEach((_, i) => {
    if (i === 0 || Math.abs(cams[i].cy - cams[i - 1].cy) + Math.abs(cams[i].cx - cams[i - 1].cx) < 1) return;
    const a = starts[i - 1] + timings[i - 1].total;
    const k = interpolate(f, [a, starts[i] - 4], [0, 1], clamp);
    scrollDim = Math.max(scrollDim, 0.62 * Math.sin(Math.PI * k));
  });
  const dim = Math.max(scrollDim, interpolate(local, [tm.lift, tm.lift + 22, tm.holdEnd + 8, tm.total], [0, 0.74, 0.74, 0], clamp));

  return (
    <>
      <PageView src={role.src} page={role.page} cam={cam} view={view} brand={brand} radius={radius} dim={dim}>
        <MaskM cam={cam} view={view} />
      </PageView>
      <RoleCardLayer brand={brand} role={role} f={local} cam={cam} view={view} stage={stage} timing={tm} width={width} reasonSize={reasonSize} />
    </>
  );
};
