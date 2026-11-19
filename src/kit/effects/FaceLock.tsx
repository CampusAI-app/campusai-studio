/**
 * Face lock (2026-11-18, ours, after Shaan Johari's reel "I filmed this. Claude edited it." instagram.com/reel/Df4TGYjEZLu,
 * read frame by frame from contact sheets, 0 to 2.1 s; we never saw his prompt or files). What the reel does: four thin
 * yellow L corners (#F5C518-ish) sit on the face and follow it; a tiny readout beside the box ("FACE 0.927",
 * "X 0646 Y 0677") changes about every frame, the claim being that it tracks "10x a second"; a big yellow stat ("10x", a
 * light condensed face, very large, top right of the head) types on a character every ~2 frames (1.05 s "10", 1.10 s
 * "10x"), holds, and clears a character at a time (2.05 to 2.10 s); a caption word under the face blurs out with it.
 *
 * Ours: the face comes from a real 10 Hz track (`effects/scripts/facetrack.py`, YuNet), so the readout is the detector's
 * own numbers: centre in source px and the score, stepping at exactly 10 Hz (that IS the "10x a second" look). Between
 * samples the box eases toward the new sample (cubic ease-out across the 0.1 s), so it follows smoothly while the numbers
 * tick. It locks on at `lockAt`: in from 145% over 6 frames. The stat types one character every 2 frames from `stat.in`
 * and clears one every 2 frames from `stat.out`, last character first. The `sub` word sits under the face, out of a blur
 * in 4 frames and back into one on its way out. Every word on screen comes from the clip's captions.json (props carry
 * them in, the caller picks them).
 *
 * Numbers: corners 4 px at 1080 wide, arm 26% of the box's short side, box 1.3x the face width by 1.1x its height;
 * readout Inter 600 22 px, tabular, 14 px off the box's left edge (its right edge when the box is near the frame's left); stat Barlow Condensed 300, 230 px, centred
 * 0.42 of a box width right of the face, sitting just above the box, kept inside the frame. Colours default to #F5C518 with a soft glow.
 *
 * Props: `clip`, `from` (frames trimmed), `frame` (the person effects' framing), `track` (facetrack JSON), `lockAt`,
 * `stat` ({ text, in, out, size }), `sub` ({ text, in, out }), `readout` (default on), `colors`. `FaceLockLayer` is the
 * same without the footage, to stack on other effects. `faceAt` gives the eased face box on screen at a clip time.
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { INTER } from "../parts";
import { IN, OUT, k, mix } from "./shared";
import { Framing, framingOf } from "./frameGrab";

const barlow = loadFont("normal", { weights: ["300"], subsets: ["latin"] });

export type FaceSample = { t: number; x: number; y: number; w: number; h?: number; conf: number };
/** The JSON `effects/scripts/facetrack.py` writes, in the clip's own pixels. */
export type FaceTrack = { rate: number; width: number; height: number; samples: FaceSample[] };
/** A face box on screen, frame px: centre, size, and the sample the readout shows. */
export type FaceBox = { cx: number; cy: number; w: number; h: number; sample: FaceSample };

const easeOut3 = (p: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);

/** The face on screen at clip second `t`: eases from the previous sample to the current one across each 1 / rate step. */
export const faceAt = (track: FaceTrack, t: number, W: number, H: number, frame?: Framing): FaceBox => {
  const s = track.samples;
  const i = Math.max(0, Math.min(s.length - 1, Math.floor(t * track.rate + 1e-6)));
  const a = s[Math.max(0, i - 1)];
  const b = s[i];
  const p = easeOut3((t - b.t) * track.rate);
  const { zoom, tx, ty } = framingOf(W, H, frame);
  // the clip is drawn W x H before the framing, so source px scale by W / track.width first
  const sx = (W / track.width) * zoom;
  const sy = (H / track.height) * zoom;
  const ah = a.h ?? a.w * 1.35;
  const bh = b.h ?? b.w * 1.35;
  return {
    cx: mix(a.x, b.x, p) * sx + tx,
    cy: mix(a.y, b.y, p) * sy + ty,
    w: mix(a.w, b.w, p) * sx,
    h: mix(ah, bh, p) * sy,
    sample: b,
  };
};

export type FaceLockStat = { text: string; in: number; out: number; size?: number };
export type FaceLockSub = { text: string; in: number; out: number };
export type FaceLockSpec = {
  track: FaceTrack;
  frame?: Framing;
  lockAt?: number;
  stat?: FaceLockStat;
  sub?: FaceLockSub;
  readout?: boolean;
  colors?: { bracket?: string; stat?: string; readout?: string; sub?: string };
};

const YELLOW = "#F5C518";
const pad4 = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, "0");

/** How many characters of the stat show at frame f: one more every 2 frames from `in`, one fewer every 2 from `out`. */
export const statChars = (stat: FaceLockStat, f: number, per = 2) => {
  const n = stat.text.length;
  if (f < stat.in) return 0;
  const typed = Math.min(n, Math.floor((f - stat.in) / per) + 1);
  if (f < stat.out) return typed;
  return Math.max(0, typed - (Math.floor((f - stat.out) / per) + 1));
};

const Corners: React.FC<{ x: number; y: number; w: number; h: number; arm: number; stroke: number; color: string; o: number }> = ({
  x, y, w, h, arm, stroke, color, o,
}) => {
  const d = (px: number, py: number, sx: number, sy: number) => `M ${px} ${py + sy * arm} L ${px} ${py} L ${px + sx * arm} ${py}`;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: o, filter: `drop-shadow(0 0 6px rgba(0,0,0,0.35))` }} width={1} height={1}>
      {[d(x, y, 1, 1), d(x + w, y, -1, 1), d(x + w, y + h, -1, -1), d(x, y + h, 1, -1)].map((p, i) => (
        <path key={i} d={p} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="square" />
      ))}
    </svg>
  );
};

export const FaceLockLayer: React.FC<{ spec: FaceLockSpec; from?: number }> = ({ spec, from = 0 }) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const u = W / 1080;
  const t = (f + from) / fps;
  const lockAt = spec.lockAt ?? 0;
  if (f < lockAt) return null;
  const c = { bracket: YELLOW, stat: YELLOW, readout: YELLOW, sub: "#FFFFFF", ...spec.colors };
  const face = faceAt(spec.track, t, W, H, spec.frame);

  // the lock: in from 145% over 6 frames
  const lock = k(f, lockAt, lockAt + 6, OUT);
  const grow = mix(1.45, 1, lock);
  const bw = face.w * 1.3 * grow;
  const bh = face.h * 1.1 * grow;
  const bx = face.cx - bw / 2;
  const by = face.cy - bh / 2;
  const arm = Math.min(bw, bh) * 0.26;
  const o = k(f, lockAt, lockAt + 3);

  // the stat stays where the face was when it started typing, so the big type never jitters with the head
  let statEl: React.ReactNode = null;
  if (spec.stat) {
    const n = statChars(spec.stat, f);
    if (n > 0) {
      const at = faceAt(spec.track, (spec.stat.in + from) / fps, W, H, spec.frame);
      const size = (spec.stat.size ?? 230) * u;
      const sbw = at.w * 1.3;
      const sby = at.cy - (at.h * 1.1) / 2;
      // keep the whole word in frame: Barlow Condensed light runs about 0.34 em a character
      const half = Math.min(W / 2 - 40 * u, (spec.stat.text.length * size * 0.34) / 2);
      const cxStat = Math.max(40 * u + half, Math.min(W - 40 * u - half, at.cx + sbw * 0.42));
      statEl = (
        <div style={{ position: "absolute", left: cxStat - W, width: W * 2, top: sby - size * 0.98, textAlign: "center",
          fontFamily: barlow.fontFamily, fontWeight: 300, fontSize: size, lineHeight: 1, color: c.stat, whiteSpace: "pre",
          textShadow: `0 0 ${18 * u}px rgba(245,197,24,0.35), 0 4px ${24 * u}px rgba(0,0,0,0.35)` }}>
          {/* the full word laid out, unshown characters kept as invisible space so typed ones never shift */}
          <span>{spec.stat.text.slice(0, n)}</span>
          <span style={{ opacity: 0 }}>{spec.stat.text.slice(n)}</span>
        </div>
      );
    }
  }

  let subEl: React.ReactNode = null;
  if (spec.sub && f >= spec.sub.in && f < spec.sub.out + 5) {
    const a = k(f, spec.sub.in, spec.sub.in + 4, OUT);
    const z = k(f, spec.sub.out, spec.sub.out + 5, IN);
    const at = faceAt(spec.track, (spec.sub.in + from) / fps, W, H, spec.frame);
    subEl = (
      <div style={{ position: "absolute", left: Math.max(40 * u + 200 * u, Math.min(W - 240 * u, at.cx)) - W, width: W * 2, top: at.cy + (at.h * 1.1) / 2 + 22 * u, textAlign: "center",
        fontFamily: INTER, fontWeight: 700, fontSize: 56 * u, lineHeight: 1.1, letterSpacing: "-0.02em", color: c.sub,
        opacity: a * (1 - z), filter: `blur(${((1 - a) * 10 + z * 12).toFixed(2)}px)`, textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}>
        {spec.sub.text}
      </div>
    );
  }

  const ro = k(f, lockAt + 4, lockAt + 6);
  const s = face.sample;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Corners x={bx} y={by} w={bw} h={bh} arm={arm} stroke={4 * u} color={c.bracket} o={o} />
      {spec.readout !== false && ro > 0 ? (
        <div style={{ position: "absolute", top: by + 2 * u, opacity: ro,
          // left of the box like the reel; to its right when the box is too near the left edge for it (~180 px)
          ...(bx - 14 * u - 180 * u >= 30 * u
            ? { left: bx - 14 * u - 400 * u, width: 400 * u, textAlign: "right" as const }
            : { left: bx + bw + 14 * u, width: 400 * u, textAlign: "left" as const }),
          fontFamily: INTER, fontWeight: 600, fontSize: 22 * u, lineHeight: 1.25, letterSpacing: "0.02em", color: c.readout,
          fontVariantNumeric: "tabular-nums", textShadow: "0 1px 6px rgba(0,0,0,0.55)", whiteSpace: "pre" }}>
          <div>FACE {s.conf.toFixed(3)}</div>
          <div>X {pad4(s.x)}  Y {pad4(s.y)}</div>
        </div>
      ) : null}
      {statEl}
      {subEl}
    </AbsoluteFill>
  );
};

export type FaceLockProps = FaceLockSpec & { clip: string; from?: number; volume?: number };

export const FaceLock: React.FC<FaceLockProps> = (p) => {
  const { width: W, height: H } = useVideoConfig();
  const { zoom, tx, ty } = framingOf(W, H, p.frame);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` }}>
        <OffthreadVideo src={staticFile(p.clip)} startFrom={p.from ?? 0} volume={p.volume ?? 1} style={{ width: W, height: H }} />
      </div>
      <FaceLockLayer spec={p} from={p.from ?? 0} />
    </AbsoluteFill>
  );
};
