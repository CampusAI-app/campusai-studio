/**
 * The final film (2026-10-23): one storyboard rendered in any aspect it lists. `npm run make <id>`
 * renders it once per aspect from the same file, so cutdowns are automatic.
 *
 * What it does, in order:
 *   - lays the shots end to end (frames rounded the same way as the grey draft, so timing matches),
 *     drawing each with the part named in `shot.part` (parts/registry.tsx), framed for the aspect by
 *     `parts/layout.ts` on the shot's `focus`;
 *   - hands each shot to the next by its `transition`:
 *       camera (default)  same surface: the next shot starts from this shot's last camera and eases to
 *                         its own framing, so the cut is invisible. New surface: a braking whip pan
 *                         (shots/demos/transition/shot-transitions WhipBrakeReal): 3 frames of run-up,
 *                         a fast blurred pass, a long braking tail into the new page. Never a crossfade.
 *       carry             the next surface is framed so its matching element (its `props.carryFrom`
 *                         rect, else its focus) sits where this shot's focus was. The new page shows
 *                         only inside a mask that starts as that element, solid, and opens out to the
 *                         whole frame over 24 frames (sliding home where the page edge stopped an exact
 *                         match); the old page stays still underneath and is covered, never faded.
 *                         Two pages are never blended. Then the camera eases home.
 *       cut               a clean cut on the beat;
 *   - puts the logo in near the start without being asked: the kit LogoOpen arrives at 0.27 s and
 *     settles by 1.7 s into a small held mark top left (the Job Match watermark), hidden on any shot
 *     whose props say `logo: false` and gone before the end card;
 *   - draws `caption` lines in the caption band below the product, never over live UI, fully on screen
 *     from `at` for `hold` (default the reading rule); `hook` and `line` lines on parts that do not
 *     set them themselves go small above the product;
 *   - ends on the end-url part for `end.hold` seconds, the last product shot carrying into the logo.
 *
 *   - plays the score (sound/Score.tsx) from frame 0 when the storyboard has `music`, with cues on the frames
 *     the picture uses (filmCues); without `music` the film is silent;
 *   - renders a length cutdown when `cut` names one of the storyboard's `cuts`: only those shots, in that order,
 *     with the logo, handoffs, end card and sound all worked out again for the kept shots.
 *
 * Props: the Storyboard (storyboard.ts) spread, plus `aspect` (default the storyboard's first) and `cut`.
 */
import React from "react";
import { AbsoluteFill, CalculateMetadataFunction, Sequence, useCurrentFrame } from "remotion";
import type { Brand } from "../kit/brand";
import { brand as brandOf, useBrandFonts } from "../kit/brand";
import type { PageCam } from "../kit/camera";
import { rectOnCanvas } from "../kit/camera";
import { LogoOpen } from "../kit/LogoMoment";
import { BlurLines, ZODIAK } from "../kit/parts";
import { INTER } from "../kit/parts";
import { CURVE, DUR, FPS, readHold } from "./motion";
import { matchCam, planCamera, ramp, rectProp } from "./parts/common";
import { makeLayout } from "./parts/layout";
import type { SoundEvent } from "./sound/cues";
import { soundFromStoryboard } from "./sound/fromStoryboard";
import { Score } from "./sound/Score";
import { partFor } from "./parts/registry";
import type { Handoff, Layout, ShotCtx } from "./parts/types";
import type { Aspect, Shot, Storyboard, Surface, TextLine } from "./storyboard";
import { runtime, SIZE } from "./storyboard";

export type FilmProps = Storyboard & {
  aspect?: Aspect;
  /** A key of `cuts`: render only that cut's shots, in its order. */
  cut?: string;
  /** The cues-only master: the music muted (its beat grid kept), every cue in place. */
  cuesOnly?: boolean;
};

/** The storyboard a cut renders: only its shots, in its order, with its format. A wrong name or shot id fails loudly. */
export const applyCut = (sb: Storyboard, cut?: string): Storyboard => {
  if (!cut) return sb;
  const c = sb.cuts?.[cut];
  if (!c) throw new Error(`[film] no cut "${cut}" in ${sb.id}; it has: ${Object.keys(sb.cuts ?? {}).join(", ") || "none"}`);
  const byId = new Map(sb.shots.map((x) => [x.id, x] as const));
  const missing = c.shots.filter((id) => !byId.has(id));
  if (missing.length) throw new Error(`[film] cut "${cut}" names shots ${sb.id} does not have: ${missing.join(", ")}`);
  return { ...sb, format: c.format ?? sb.format, shots: c.shots.map((id) => byId.get(id) as Shot) };
};

// motion: the whip window is DUR.reframe long, split 6 frames before the boundary and 18 after, so the
// fast blurred pass straddles the cut and the braking tail lands on the new page (WhipBrakeReal's shape)
const WHIP = DUR.reframe;
const WHIP_LEAD = 6;
const WHIP_TAIL = WHIP - WHIP_LEAD;

/** Whip progress 0 to 1: velocity = smoothstep run-up over the first 12% times exp(-5u), integrated. */
const WHIP_TABLE = (() => {
  const n = 400;
  const vel = (u: number) => {
    const r = Math.min(1, u / 0.12);
    return r * r * (3 - 2 * r) * Math.exp(-5 * u);
  };
  const out = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) out[i] = out[i - 1] + (vel((i - 1) / n) + vel(i / n)) / 2 / n;
  for (let i = 0; i <= n; i++) out[i] /= out[n];
  return out;
})();
/**
 * A carry's hand-off, DUR.reframe long. Never a blend: the new page appears only inside a mask that starts
 * as the matched element (solid, sitting where the old element was) and opens out to the whole frame, so
 * the old page is covered, never faded.
 */
const CARRY = DUR.reframe;

const whip = (u: number) => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const x = u * 400;
  const i = Math.floor(x);
  return WHIP_TABLE[i] + (WHIP_TABLE[i + 1] - WHIP_TABLE[i]) * (x - i);
};

type Planned = {
  shot: Shot;
  surface?: Surface;
  start: number;
  dur: number;
  pre: number;
  post: number;
  /** Carry in: canvas offset from where the previous focus sat to where this shot's matching element sits. */
  shift: { x: number; y: number };
  /** Carry in: the matched element on the canvas, in this shot's own (unshifted) coordinates. */
  carryRect?: { x: number; y: number; w: number; h: number };
  ctx: ShotCtx;
};

const isCaption = (t: TextLine) => t.role === "caption";

export const planFilm = (sb: Storyboard, aspect: Aspect) => {
  const hasCaptions = sb.shots.some((s) => (s.text ?? []).some(isCaption));
  const layout = makeLayout(aspect, hasCaptions);
  // a trailing end-url shot is the end card itself: it is merged with `end`, never drawn twice
  const lastIsEnd = sb.shots.length > 0 && sb.shots[sb.shots.length - 1].part === "end-url";
  const shots = lastIsEnd ? sb.shots.slice(0, -1) : sb.shots;
  const planned: Planned[] = [];
  let acc = 0;
  shots.forEach((shot, i) => {
    const start = Math.round(acc * FPS);
    acc += shot.seconds;
    const dur = Math.round(acc * FPS) - start;
    const surface = shot.surface ? sb.surfaces[shot.surface] : undefined;
    const next = shots[i + 1];
    const tr = shot.transition ?? "camera";
    const same = !!next && !!shot.surface && next.surface === shot.surface;
    const out: Handoff["out"] = !next ? "end" : tr === "cut" ? "cut" : tr === "carry" ? "carry" : same ? "camera-same" : "camera-whip";
    const prev = planned[i - 1];
    const inn: Handoff["in"] = prev ? (prev.ctx.handoff.out === "end" ? "cut" : prev.ctx.handoff.out) : "start";
    let enter: PageCam | undefined;
    let shift = { x: 0, y: 0 };
    let hold = 0;
    let carryRect: Planned["carryRect"];
    if (prev && surface && prev.surface) {
      const prevEnd = prev.ctx.cam(prev.dur);
      if (inn === "camera-same") enter = prevEnd;
      if (inn === "carry") {
        if (prev.shot.surface === shot.surface) enter = prevEnd;
        else {
          const from = prev.shot.focus ?? { x: 0, y: 0, w: prev.surface.page.w, h: prev.surface.page.h };
          const to = rectProp(shot.props?.carryFrom) ?? shot.focus ?? { x: 0, y: 0, w: surface.page.w, h: surface.page.h };
          enter = matchCam(prevEnd, from, to, surface, layout);
          // the page edge can stop the match (clampCam): whatever is left, the two layers slide together to close
          const a = rectOnCanvas(prevEnd, layout.view, from);
          const b = rectOnCanvas(enter, layout.view, to);
          shift = { x: b.x + b.w / 2 - (a.x + a.w / 2), y: b.y + b.h / 2 - (a.y + a.h / 2) };
          carryRect = b;
          hold = CARRY;
        }
      }
    }
    const cam = surface ? planCamera(shot, surface, layout, enter, hold) : () => ({ cx: 0, cy: 0, cw: 1 });
    const pre = inn === "camera-whip" ? WHIP_LEAD : 0;
    const post = out === "camera-whip" ? WHIP_TAIL : out === "carry" ? CARRY : 0;
    planned.push({ shot, surface, start, dur, pre, post, shift, carryRect, ctx: { board: sb, dur, cam, handoff: { in: inn, out } } });
  });
  const endStart = Math.round(acc * FPS);
  const total = Math.max(endStart + 1, Math.round(runtime(sb) * FPS));
  const last = planned[planned.length - 1];
  const endShot: Shot = lastIsEnd
    ? sb.shots[sb.shots.length - 1]
    : { id: "end", seconds: sb.end.hold, part: "end-url", action: "the end card: logo plus address, held" };
  const endCtx: ShotCtx = {
    board: sb,
    dur: total - endStart,
    cam: () => ({ cx: 0, cy: 0, cw: 1 }),
    handoff: { in: last ? "carry" : "start", out: "end" },
    prev: last ? { surface: last.surface, cam: last.ctx.cam(last.dur), focus: last.shot.focus } : undefined,
  };
  return { layout, planned, endStart, total, endShot, endCtx };
};

/**
 * The sound cues, from the frames the picture actually uses (sound/fromStoryboard.ts counts its own frames from
 * the storyboard; these replace its events so a cue lands on the handoff, not the nominal boundary):
 *   whip     MOVE on the whip's fastest frame (2 frames into its window, 4 before the boundary)
 *   camera   MOVE on the boundary, where the same-surface camera starts to travel
 *   carry, cut   ARRIVE on the boundary (the carry's mask starts opening there)
 *   press    PRESS on the frame the pointer squashes (control-title reads `props.pressAt`, the rest `press.at`)
 *   end      LOGO on the end card's first frame
 * Then fromStoryboard's own rules: an arrival within 8 frames of a press is dropped, and no two cues sit closer
 * than 4 frames (the more important one stays).
 */
const RANK: SoundEvent["kind"][] = ["logo", "press", "notify", "success", "land", "move", "arrive", "type"];
export const filmCues = (plan: ReturnType<typeof planFilm>): SoundEvent[] => {
  const events: SoundEvent[] = [];
  plan.planned.forEach((p, i) => {
    if (i > 0) {
      const h = p.ctx.handoff.in;
      if (h === "camera-whip") events.push({ kind: "move", frame: p.start - WHIP_LEAD + 2, name: `whip to: ${p.shot.id}` });
      else if (h === "camera-same") events.push({ kind: "move", frame: p.start, name: `move to: ${p.shot.id}` });
      else events.push({ kind: "arrive", frame: p.start, name: `${h} to: ${p.shot.id}` });
    }
    const at = p.shot.part === "control-title"
      ? (typeof p.shot.props?.pressAt === "number" ? (p.shot.props.pressAt as number) : p.shot.press?.at ?? 1.4)
      : p.shot.press?.at;
    if (at !== undefined) events.push({ kind: "press", frame: p.start + Math.round(at * FPS), name: `press: ${p.shot.id}` });
  });
  events.push({ kind: "logo", frame: plan.endStart, name: "logo: end card" });
  const presses = events.filter((e) => e.kind === "press").map((e) => e.frame);
  const kept = events
    .filter((e) => !((e.kind === "arrive" || e.kind === "move") && presses.some((q) => Math.abs(q - e.frame) <= 8)))
    .sort((a, b) => RANK.indexOf(a.kind) - RANK.indexOf(b.kind));
  const placed: SoundEvent[] = [];
  for (const e of kept) if (!placed.some((q) => Math.abs(q.frame - e.frame) < 4)) placed.push(e);
  return placed.sort((a, b) => a.frame - b.frame);
};

/** Captions in the band below the product; hook and line text small above it when the part does not set them. */
const ShotText: React.FC<{ shot: Shot; f: number; start: number; layout: Layout; brand: Brand }> = ({ shot, f, start, layout, brand }) => {
  const lines = shot.text ?? [];
  const partSetsTop = shot.part === "like-when-line";
  const { u } = layout;
  return (
    <>
      {lines.map((t, i) => {
        const a = (t.at ?? 0) * FPS;
        const h = (t.hold ?? readHold(t.text)) * FPS;
        if (f < a - DUR.panel - 1 || f > a + h + DUR.panel + 1) return null;
        if (isCaption(t) && layout.caption) {
          // fully on screen from `at` for `hold`: the fade runs before and after, never inside
          const k = ramp(f, a - DUR.panel, a, CURVE.quiet.enter) * (1 - ramp(f, a + h, a + h + DUR.panel, CURVE.quiet.exit));
          const band = layout.caption;
          return (
            <div key={i} style={{ position: "absolute", left: band.x, top: band.y, width: band.w, height: band.h, display: "flex",
              alignItems: "center", justifyContent: "center", textAlign: "center", opacity: k,
              transform: `translateY(${((1 - k) * 14 * u).toFixed(2)}px)` }}>
              <span style={{ fontFamily: INTER, fontWeight: 500, fontSize: layout.captionSize, letterSpacing: "-0.01em", lineHeight: 1.25, color: brand.color.ink }}>{t.text}</span>
            </div>
          );
        }
        if ((t.role === "line" || t.role === "hook") && !partSetsTop) {
          const hd = layout.headline;
          return (
            <div key={i} style={{ position: "absolute", left: hd.cx - hd.maxW / 2, width: hd.maxW, top: hd.cy - hd.size * 0.6, display: "flex", justifyContent: "center" }}>
              <BlurLines lines={[{ text: t.text }]} at={Math.round(start + a - DUR.arrive)} outAt={Math.round(start + a + h)} size={hd.size * u}
                stagger={3} face={ZODIAK}
                ink={{ ink: brand.color.ink, soft: brand.color.inkSoft, accent: brand.color.accent, surface: brand.color.surface, line: "transparent" }} />
            </div>
          );
        }
        return null;
      })}
    </>
  );
};

/** The end card, inside its own Sequence so kit parts that read the frame (LogoEnd) count from its start. */
const EndCard: React.FC<{ shot: Shot; ctx: ShotCtx; layout: Layout; brand: Brand; aspect: Aspect; surfaces: Storyboard["surfaces"] }> = ({ shot, ctx, layout, brand, aspect, surfaces }) => {
  const f = useCurrentFrame();
  const Part = partFor("end-url");
  return <Part shot={shot} surface={shot.surface ? surfaces[shot.surface] : undefined} brand={brand} aspect={aspect} f={f} layout={layout} props={shot.props ?? {}} ctx={ctx} />;
};

export const Film: React.FC<FilmProps> = (props) => {
  const aspect = props.aspect ?? props.aspects[0];
  const sb = React.useMemo(() => applyCut(props, props.cut), [props]);
  const B = brandOf(sb.brand);
  useBrandFonts(B);
  const frame = useCurrentFrame();
  const plan = React.useMemo(() => planFilm(sb, aspect), [sb, aspect]);
  const { layout, planned, endStart, total } = plan;
  // sound only when the storyboard names music; its cues come from the planned frames above
  const sound = React.useMemo(() => (sb.music ? { ...soundFromStoryboard(sb, { music: props.cuesOnly !== true }), events: filmCues(plan) } : null), [sb, plan, props.cuesOnly]);
  const D = layout.W + 60 * layout.u;

  // the held mark: hidden on shots that say logo: false, gone before the end card
  const current = planned.find((p) => frame >= p.start && frame < p.start + p.dur);
  const hiddenNow = current?.shot.props?.logo === false;
  const markVis = (hiddenNow ? 0 : 1) * (1 - ramp(frame, endStart - DUR.panel - 2, endStart - 2));
  const ratio = B.logo?.ratio ?? 4;
  const m = layout.mark;
  const arriveW = Math.min(layout.W, layout.H) * 0.34;

  return (
    <AbsoluteFill style={{ background: B.color.bgDeep }}>
      {sound ? <Score music={sound.music} events={sound.events} duck={sound.duck} end={sound.end} target={sound.target} /> : null}
      {B.color.gradient ? <AbsoluteFill style={{ background: B.color.gradient }} /> : null}
      {planned.map((p) => {
        const f = frame - p.start;
        if (f < -p.pre || f >= p.dur + p.post) return null;
        const Part = partFor(p.shot.part);
        let x = 0;
        let v = 0;
        if (p.ctx.handoff.in === "camera-whip" && f < WHIP_TAIL) {
          const u0 = (f + WHIP_LEAD) / WHIP;
          x = (1 - whip(u0)) * D;
          v = (whip(u0 + 0.5 / WHIP) - whip(u0 - 0.5 / WHIP)) * D;
        }
        if (p.ctx.handoff.out === "camera-whip" && f >= p.dur - WHIP_LEAD) {
          const u0 = (f - (p.dur - WHIP_LEAD)) / WHIP;
          x = -whip(u0) * D;
          v = (whip(u0 + 0.5 / WHIP) - whip(u0 - 0.5 / WHIP)) * D;
        }
        let y = 0;
        let clip: string | undefined;
        if (p.ctx.handoff.in === "carry" && p.carryRect && f < CARRY) {
          // the new page shows only inside the mask: the element first, then opening out to the frame
          const k = ramp(f, 0, CARRY, CURVE.quiet.standard);
          const open = ramp(f, 2, CARRY, CURVE.quiet.standard);
          x = -p.shift.x * (1 - k);
          y = -p.shift.y * (1 - k);
          const r = p.carryRect;
          const L = r.x * (1 - open);
          const T = r.y * (1 - open);
          const R = (layout.W - (r.x + r.w)) * (1 - open);
          const Bm = (layout.H - (r.y + r.h)) * (1 - open);
          clip = `inset(${T.toFixed(2)}px ${R.toFixed(2)}px ${Bm.toFixed(2)}px ${L.toFixed(2)}px round ${(14 * layout.u * (1 - open)).toFixed(2)}px)`;
        }
        // horizontal-only motion blur, from the pass's own speed (WhipBrakeReal's SpeedBlur)
        const sd = Math.min(42, Math.abs(v) * 0.35);
        const fid = `whip-${p.shot.id}`.replace(/[^a-zA-Z0-9-]/g, "");
        return (
          <AbsoluteFill key={p.shot.id} style={{ transform: x || y ? `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)` : undefined, clipPath: clip,
            filter: sd > 0.4 ? `url(#${fid})` : undefined }}>
            {sd > 0.4 ? (
              <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
                <filter id={fid} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
                  <feGaussianBlur stdDeviation={`${sd.toFixed(2)} 0`} edgeMode="none" />
                </filter>
              </svg>
            ) : null}
            <Part shot={p.shot} surface={p.surface} brand={B} aspect={aspect} f={f} layout={layout} props={p.shot.props ?? {}} ctx={p.ctx} />
            <ShotText shot={p.shot} f={f} start={p.start} layout={layout} brand={B} />
          </AbsoluteFill>
        );
      })}
      <Sequence from={endStart} durationInFrames={Math.max(1, total - endStart)} layout="none">
        <EndCard shot={plan.endShot} ctx={plan.endCtx} layout={layout} brand={B} aspect={aspect} surfaces={sb.surfaces} />
      </Sequence>
      {markVis > 0.001 ? (
        <AbsoluteFill style={{ opacity: markVis }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.92 }}>
            <LogoOpen brand={B} at={8} x={layout.W / 2} y={layout.top.h / 2} width={arriveW}
              settle={{ at: 36, x: m.x + m.width / 2, y: m.y + m.width / ratio / 2, width: m.width }} />
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export const filmMetadata: CalculateMetadataFunction<FilmProps> = ({ props }) => {
  const aspect = props.aspect ?? props.aspects[0];
  const { w, h } = SIZE[aspect];
  return { width: w, height: h, fps: FPS, durationInFrames: Math.max(1, Math.round(runtime(applyCut(props, props.cut)) * FPS)) };
};
