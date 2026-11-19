/**
 * Ribbon wrap (2026-11-18, ours, after Shaan Johari's reel "I filmed this. Claude edited it." instagram.com/reel/Df4TGYjEZLu,
 * 3.65 to 4.75 s, stepped at 0.25 s and 0.05 s; nothing behind it was bought or seen). What the reel does: one frame of a
 * white silhouette on black (3.65), then black on white (3.70) and it holds; a small italic serif "behind" blurs in at
 * 3.80, "my" at 4.00, and at 3.90 a wide (about 50 px at 1080) gold to bronze ribbon sweeps in from the top, curls down
 * the left, crosses BEHIND the neck to the right edge, comes back off frame and crosses IN FRONT of the arm and body
 * lower down (whole by 4.25). The huge bold serif italic "head?" lands at 4.10, partly hidden behind the head. Hard cut
 * back to the footage at 4.75.
 *
 * Ours: the matte hold is MatteLayer (black on white by default, `detail` keeps a trace of the clothing). The ribbon is a
 * path of cubic curves in frame px, each segment marked "back" (drawn under the silhouette) or "front" (over it, with a
 * soft shadow on the person); put the switch where the ribbon is off frame or hidden, so no seam shows. It draws on from
 * its tip along the path's length over `drawFrames` (default 12) on a strong ease out, so the sweep from the top is
 * mostly there in 3 to 4 frames, then drifts up `drift` px a second so the hold never freezes. Look: a 50 px band, a
 * body gradient #A0703A to #C89656 to #A0703A across the frame, a soft #7E552A shade along one edge and a soft #F1D3A2
 * sheen along the other (the gloss), round ends, no outline. Sampled to a polyline in JS, so the draw is exact and needs no DOM measuring. `ribbonAround` builds the reel's
 * shape from two heights (neck and body); `follow` (a face track) moves it with the person on a handheld shot. Title: the lead words (DM Serif Display italic, small) land as said, each
 * out of a 3 frame blur; the big word (same face, huge) lands on its first frame out of a 16 px blur in 4 frames, then
 * pushes 3%, and sits BEHIND the silhouette so the head covers part of it. Words from the clip's captions.json only.
 *
 * Props: `clip`, `person`, `from`, `frame` (footage), `matteFrame`, `at` (the cut), `flashIn` (default 1), `hold`
 * (frames), `back`, `mode`, `detail`, `ribbon` (RibbonSpec), `title` (RibbonTitle), `volume`, `sound`. `RibbonLayer` is
 * one half of the ribbon alone, to wrap any person shot.
 *
 *   <RibbonWrap clip="x/clip.mp4" person="x/person.webm" matteFrame={{ zoom: 1.7, bottom: 1330 }} at={188} hold={42}
 *     ribbon={{ segments: ribbonAround({ neckY: 1180, bodyY: 1560 }), drawAt: 191 }}
 *     title={{ words, lead: [22, 23], word: [24, 24], leadAt: { x: 300, y: 380 }, wordAt: { x: 540, y: 640 } }} />
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { IN, OUT, Sfx, clampX, k, mix } from "./shared";
import { Framing, framingOf } from "./frameGrab";
import { FaceTrack, trackAt } from "./ArcWords";
import type { CaptionWord } from "./CommentDrop";
import { DMSERIF, MatteLayer, MatteMode, framedStyle, matteLook } from "./MatteReveal";

type P = [number, number];
export type RibbonSeg = { layer: "back" | "front"; curves: [P, P, P, P][] };
export type RibbonSpec = {
  segments: RibbonSeg[];
  drawAt: number;
  drawFrames?: number;
  width?: number;
  colors?: { edge: string; from: string; to: string; sheen: string };
  drift?: number;
  outAt?: number;
  /** A face track, the shot's framing and the clip trim: the ribbon moves with the tracked face from `drawAt` on. */
  follow?: { track: FaceTrack; frame?: Framing; from?: number };
};

/** The reel's wrap, in frame px: in from the top, a curl down the left, behind the neck at `neckY` to the right edge,
 * round off frame, and back across the front of the body at `bodyY` (rising to the right) to the left edge. */
export const ribbonAround = ({ neckY, bodyY, W = 1080 }: { neckY: number; bodyY: number; W?: number }): RibbonSeg[] => [
  {
    layer: "back",
    curves: [
      [[0.44 * W, -140], [0.12 * W, -60], [-0.04 * W, neckY - 300], [0.1 * W, neckY - 70]],
      [[0.1 * W, neckY - 70], [0.2 * W, neckY + 30], [0.5 * W, neckY + 20], [0.78 * W, neckY - 8]],
      [[0.78 * W, neckY - 8], [0.95 * W, neckY - 20], [1.08 * W, neckY - 10], [1.18 * W, neckY + 40]],
      [[1.18 * W, neckY + 40], [1.34 * W, neckY + 140], [1.34 * W, bodyY - 150], [1.18 * W, bodyY - 90]],
    ],
  },
  {
    layer: "front",
    curves: [[[1.18 * W, bodyY - 90], [0.8 * W, bodyY - 40], [0.3 * W, bodyY + 40], [-0.18 * W, bodyY + 150]]],
  },
];

const bez = (c: [P, P, P, P], t: number): P => {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
  return [a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0], a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1]];
};

type Sampled = { layer: "back" | "front"; pts: P[]; len: number[] };
/** The ribbon as polylines with cumulative lengths along the whole ribbon. */
const sample = (segs: RibbonSeg[]) => {
  const out: Sampled[] = [];
  let total = 0;
  let last: P | null = null;
  for (const s of segs) {
    const pts: P[] = [];
    const len: number[] = [];
    for (const c of s.curves) {
      for (let j = 0; j <= 60; j++) {
        if (j === 0 && pts.length) continue;
        const p = bez(c, j / 60);
        if (last) total += Math.hypot(p[0] - last[0], p[1] - last[1]);
        pts.push(p);
        len.push(total);
        last = p;
      }
    }
    out.push({ layer: s.layer, pts, len });
  }
  return { parts: out, total };
};

/** The points of one sampled part up to length D. */
const upTo = (s: Sampled, D: number): P[] => {
  if (!s.pts.length || D <= s.len[0]) return [];
  const res: P[] = [];
  for (let i = 0; i < s.pts.length; i++) {
    if (s.len[i] <= D) {
      res.push(s.pts[i]);
      continue;
    }
    const a = s.pts[i - 1];
    const b = s.pts[i];
    const t = (D - s.len[i - 1]) / Math.max(0.001, s.len[i] - s.len[i - 1]);
    res.push([mix(a[0], b[0], t), mix(a[1], b[1], t)]);
    break;
  }
  return res;
};

/** The same polyline moved `o` px along its left normal (for the sheen). */
const offset = (pts: P[], o: number): P[] =>
  pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [p[0] + (dy / l) * o, p[1] - (dx / l) * o];
  });

const toD = (pts: P[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

export const RibbonLayer: React.FC<{ half: "back" | "front"; spec: RibbonSpec; id?: string }> = ({ half, spec, id = "ribbon" }) => {
  const f = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  if (f < spec.drawAt) return null;
  const { parts, total } = sample(spec.segments);
  const D = total * k(f, spec.drawAt, spec.drawAt + (spec.drawFrames ?? 12), OUT);
  const w = spec.width ?? 50;
  const c = spec.colors ?? { edge: "#7E552A", from: "#A0703A", to: "#C89656", sheen: "#F1D3A2" };
  const drift = ((spec.drift ?? 10) * (f - spec.drawAt)) / fps;
  let fx = 0;
  let fy = 0;
  if (spec.follow) {
    const { zoom } = framingOf(W, H, spec.follow.frame);
    const from = spec.follow.from ?? 0;
    const a = trackAt(spec.follow.track, (spec.drawAt + from) / fps);
    const b = trackAt(spec.follow.track, (f + from) / fps);
    fx = (b.x - a.x) * zoom;
    fy = (b.y - a.y) * zoom;
  }
  const out = spec.outAt === undefined ? 0 : k(f, spec.outAt, spec.outAt + 4, IN);
  const gid = `${id}-${half}`;
  const mine = parts.filter((p) => p.layer === half).map((p) => upTo(p, D)).filter((p) => p.length > 1);
  if (!mine.length) return null;
  return (
    <svg width={W} height={H} style={{
      position: "absolute", inset: 0, overflow: "visible", opacity: 1 - out,
      transform: `translate(${fx.toFixed(2)}px, ${(fy - drift).toFixed(2)}px)`,
      filter: half === "front" ? "drop-shadow(0 12px 16px rgba(0,0,0,0.3))" : "drop-shadow(0 6px 10px rgba(0,0,0,0.12))",
    }}>
      <defs>
        <linearGradient id={`${gid}-body`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={W} y2={H}>
          <stop offset="0" stopColor={c.from} />
          <stop offset="0.5" stopColor={c.to} />
          <stop offset="1" stopColor={c.from} />
        </linearGradient>
        <filter id={`${gid}-soft`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={2.2} />
        </filter>
      </defs>
      {mine.map((pts, i) => (
        <g key={i} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={toD(pts)} stroke={`url(#${gid}-body)`} strokeWidth={w} />
          <path d={toD(offset(pts, -w * 0.3))} stroke={c.edge} strokeWidth={w * 0.3} opacity={0.6} filter={`url(#${gid}-soft)`} />
          <path d={toD(offset(pts, w * 0.14))} stroke={c.sheen} strokeWidth={w * 0.22} opacity={0.65} filter={`url(#${gid}-soft)`} />
        </g>
      ))}
    </svg>
  );
};

const strip = (w: string) => w.replace(/[.,!;:"]+$/g, "").replace(/^["]+/, "");

export type RibbonTitle = {
  words: CaptionWord[];
  lead?: [number, number];
  word: [number, number];
  /** Frame px: centre of the lead line and centre of the big word. */
  leadAt: { x: number; y: number };
  wordAt: { x: number; y: number };
  leadSize?: number;
  wordSize?: number;
};

/** The lead line (front) or the big word (behind the person). Frames are composition frames; `from` = clip trim. */
export const RibbonTitleLayer: React.FC<{ part: "lead" | "word"; title: RibbonTitle; from?: number; showAt: number; color: string; outAt?: number }> = ({
  part, title, from = 0, showAt, color, outAt,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = outAt === undefined ? 0 : k(f, outAt, outAt + 4, IN);
  const landOf = (i: number) => Math.max(showAt, Math.round(title.words[i].start * fps - from));
  if (part === "lead") {
    if (!title.lead) return null;
    const ws = title.words.slice(title.lead[0], title.lead[1] + 1);
    return (
      <div style={{
        position: "absolute", left: title.leadAt.x, top: title.leadAt.y, transform: "translate(-50%, -50%)", whiteSpace: "nowrap", color,
        fontFamily: DMSERIF, fontStyle: "italic", fontWeight: 400, fontSize: title.leadSize ?? 70, lineHeight: 1, opacity: 1 - out,
      }}>
        {ws.map((w, j) => {
          const at = landOf(title.lead![0] + j);
          const t = k(f, at, at + 3, OUT);
          return (
            <span key={j} style={{ display: "inline-block", marginRight: j < ws.length - 1 ? "0.24em" : 0, opacity: f < at ? 0 : Math.min(1, 0.35 + t),
              filter: t < 0.99 ? `blur(${((1 - t) * 9).toFixed(2)}px)` : undefined }}>
              {strip(w.w).toLowerCase()}
            </span>
          );
        })}
      </div>
    );
  }
  const at = landOf(title.word[0]);
  if (f < at) return null;
  const t = k(f, at, at + 4, OUT);
  const push = interpolate(f, [at + 4, at + 60], [1, 1.03], clampX);
  const text = title.words.slice(title.word[0], title.word[1] + 1).map((w) => strip(w.w)).join(" ").toLowerCase();
  const size = title.wordSize ?? 300;
  return (
    <div style={{
      position: "absolute", left: title.wordAt.x, top: title.wordAt.y, whiteSpace: "nowrap", color,
      transform: `translate(-50%, -50%) scale(${(mix(1.15, 1, t) * push).toFixed(4)})`,
      fontFamily: DMSERIF, fontStyle: "italic", fontWeight: 400, fontSize: size, lineHeight: 1, letterSpacing: "-0.02em",
      opacity: Math.min(1, (f - at + 1) / 2) * (1 - out), filter: t < 0.99 || out > 0 ? `blur(${((1 - t) * 16 + out * 8).toFixed(2)}px)` : undefined,
    }}>
      {text}
    </div>
  );
};

export type RibbonWrapProps = {
  clip: string;
  person: string;
  from?: number;
  frame?: Framing;
  matteFrame?: Framing;
  at: number;
  flashIn?: number;
  hold: number;
  back?: boolean;
  mode?: MatteMode;
  detail?: number;
  ribbon: RibbonSpec;
  title?: RibbonTitle;
  volume?: number;
  sound?: boolean;
};

export const RibbonWrap: React.FC<RibbonWrapProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const from = p.from ?? 0;
  const mode = p.mode ?? "black-on-white";
  const flashIn = p.flashIn ?? 1;
  const end = p.at + flashIn + p.hold;
  const inMatte = f >= p.at && f < end;
  const flashing = f < p.at + flashIn;
  const showFootage = f < p.at || (f >= end && (p.back ?? true));
  const look = matteLook(mode, flashing);
  const showAt = p.at + flashIn;
  return (
    <AbsoluteFill style={{ background: showFootage || inMatte ? "#000" : "transparent", overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: showFootage ? 1 : 0 }}>
        <div style={framedStyle(W, H, p.frame)}>
          <OffthreadVideo src={staticFile(p.clip)} startFrom={from} volume={p.volume ?? 1} style={{ width: W, height: H }} />
        </div>
      </AbsoluteFill>
      {inMatte ? (
        <MatteLayer person={p.person} from={from} frame={p.matteFrame ?? p.frame} mode={mode} inverted={flashing} arcs={false} detail={p.detail}
          behind={
            flashing ? null : (
              <>
                <RibbonLayer half="back" spec={p.ribbon} />
                {p.title ? <RibbonTitleLayer part="word" title={p.title} from={from} showAt={showAt} color={look.text} /> : null}
              </>
            )
          }
          front={
            flashing ? null : (
              <>
                <RibbonLayer half="front" spec={p.ribbon} />
                {p.title ? <RibbonTitleLayer part="lead" title={p.title} from={from} showAt={showAt} color={look.text} /> : null}
              </>
            )
          }
        />
      ) : null}
      <Sfx at={p.at} name="hit-weak" volume={0.35} on={p.sound ?? true} />
      <Sfx at={p.ribbon.drawAt} name="swoosh-slow" volume={0.3} on={p.sound ?? true} />
    </AbsoluteFill>
  );
};
