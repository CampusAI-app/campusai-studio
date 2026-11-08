/**
 * /before-after (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build on the shelf shot `before-after-slider-scrub`). Two real captures of the same page from the same camera, one
 * over the other. A divider with a round handle flings across fast, overshoots and settles, holds so the change can be
 * read, then sweeps back slowly to show it twice, and a red ring finds the thing that changed. The fast fling says
 * something changed; the slow sweep shows where. Both images must be real captures (a real before, never a made-ugly
 * one) and must share layout and framing, or the wipe reads as two different pages.
 */
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, readHold } from "../system/motion";
import { B, Clip, Cue, INTER, RED, Title, ZODIAK, clamp, ramp } from "./common";

export type BeforeAfterProps = {
  title: string;
  /** Paths under public/. Same size, same page, same framing. */
  before: { src: string; label: string };
  after: { src: string; label: string };
  /** The images' pixel size, and the part of them to show. */
  image: { w: number; h: number };
  crop: { x: number; y: number; w: number; h: number };
  /** The thing that changed, in image pixels. The ring lands on it. */
  focus: { x: number; y: number; w: number; h: number };
  caption: string;
  source: string;
  cta?: string;
};

// The divider's path, as a fraction of the picture's width (shelf card: rest, fling, overshoot, hold, slow sweep).
const KEYS = [0, 14, 26, 38, 54, 96, 128, 140];
const FPS = 30;

/** Rest just past the right edge of the thing that changed, so the ring always lands on the after. */
const positions = (p: BeforeAfterProps) => {
  const rest = Math.min(0.94, (p.focus.x + p.focus.w - p.crop.x) / p.crop.w + 0.08);
  return [0.06, 0.06, 0.86, 0.8, 0.8, 0.2, rest, rest];
};

export const beforeAfterEnd = (p: BeforeAfterProps) => KEYS[KEYS.length - 1] + 16 + Math.round((readHold(p.caption) + 0.5) * FPS);

export const BeforeAfter: React.FC<BeforeAfterProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const end = beforeAfterEnd(p);
  const W = width - 96;
  const scale = W / p.crop.w;
  const H = Math.min(p.crop.h * scale, height * 0.56);
  const left = 48;
  const top = height * 0.5 - H / 2 + 20;
  const POS = positions(p);
  const x = interpolate(f, KEYS, POS, { ...clamp, easing: CURVE.quiet.standard });
  // speed stretches the handle a little, so the fling has weight
  const speed = Math.abs(interpolate(f + 1, KEYS, POS, clamp) - interpolate(f, KEYS, POS, clamp));
  const stretch = 1 + Math.min(0.2, speed * 4);
  const imgStyle: React.CSSProperties = { position: "absolute", left: -p.crop.x * scale, top: -p.crop.y * scale, width: p.image.w * scale, height: p.image.h * scale };
  const fx = (p.focus.x - p.crop.x) * scale, fy = (p.focus.y - p.crop.y) * scale;
  const ringAt = KEYS[6] + 2;
  const ring = ramp(f, ringAt, ringAt + 14, CURVE.showy.enter);
  const cap = ramp(f, ringAt + 6, ringAt + 18, CURVE.quiet.enter);
  const label = (text: string, side: "left" | "right", on: number) => (
    <div style={{ position: "absolute", top: 18, [side]: 18, padding: "10px 22px", borderRadius: 999, background: "rgba(11,7,8,.82)", color: B.color.ink,
      fontFamily: INTER, fontWeight: 600, fontSize: 30, opacity: on }}>{text}</div>
  );
  return (
    <Clip endAt={end} cta={p.cta}>
      <Title out={end}>{p.title}</Title>
      <div style={{ position: "absolute", left, top, width: W, height: H, overflow: "hidden", borderRadius: 22, boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}>
        <Img src={staticFile(p.before.src)} style={imgStyle} />
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${((1 - x) * 100).toFixed(2)}% 0 0)` }}>
          <Img src={staticFile(p.after.src)} style={imgStyle} />
        </div>
        {label(p.after.label, "left", ramp(f, 20, 30) * (x > 0.25 ? 1 : 0.4))}
        {label(p.before.label, "right", ramp(f, 4, 14))}
        {/* the ring on what changed */}
        <div style={{ position: "absolute", left: fx - 14, top: fy - 14, width: p.focus.w * scale + 28, height: p.focus.h * scale + 28, borderRadius: 18,
          border: `9px solid ${RED}`, opacity: ring, boxShadow: `0 0 0 4000px rgba(11,7,8,${(0.42 * ring).toFixed(3)})`, transform: `scale(${(1.25 - 0.25 * ring).toFixed(3)})` }} />
        {/* the divider */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: x * W - 3, width: 6, background: B.color.ink, boxShadow: "0 0 18px rgba(0,0,0,.5)" }} />
        <div style={{ position: "absolute", top: H / 2 - 40, left: x * W - 40, width: 80, height: 80, borderRadius: 40, background: B.color.ink,
          transform: `scaleX(${stretch.toFixed(3)})`, boxShadow: "0 6px 20px rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={44} height={24} viewBox="0 0 44 24"><path d="M14 4 L4 12 L14 20 M30 4 L40 12 L30 20" stroke={B.color.bgDeep} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, top: top + H + 46, fontFamily: ZODIAK, fontWeight: 700, fontSize: 58, lineHeight: 1.1, color: B.color.ink,
        opacity: cap, transform: `translateY(${(1 - cap) * 14}px)` }}>{p.caption}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: top + H + 200, fontFamily: INTER, fontSize: 34, color: B.color.ink, opacity: ramp(f, ringAt + 16, ringAt + 28) }}>{p.source}</div>
      <Cue at={KEYS[1]} name="air-woosh-quick" volume={0.5} />
      <Cue at={KEYS[2]} name="switch-tap" volume={0.35} />
      <Cue at={ringAt} name="marker-pen-line" volume={0.35} />
    </Clip>
  );
};
