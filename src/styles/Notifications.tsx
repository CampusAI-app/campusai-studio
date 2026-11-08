/**
 * /notifications (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). Notifications arriving: a bell rings at the top with its badge counting up, and real notification rows drop
 * in one at a time, each landing on top and pushing the others down, the newest lit at its edge. Every row is cut
 * straight out of a real desktop capture of the product's Notifications page (Jacob 11/06: desktop only, never a
 * phone screen, never rebuilt UI). The bell is drawn; nothing that reads as product UI is.
 */
import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR, readHold } from "../system/motion";
import { B, Clip, Cue, INTER, RED, Title, ZODIAK, clamp, ramp } from "./common";

export type NotificationsProps = {
  title: string;
  /** A real capture under public/ and its pixel size. */
  image: { src: string; w: number; h: number };
  /** The rows to cut out of it, in image pixels, in the order they arrive. */
  rows: { x: number; y: number; w: number; h: number }[];
  caption: string;
  source: string;
  cta?: string;
};

const FPS = 30;
const FIRST = 16;
const GAP = 30; // motion: frames between arrivals, one every second
export const notifEnd = (p: NotificationsProps) => FIRST + (p.rows.length - 1) * GAP + 30 + Math.round((readHold(p.caption) + 1.2) * FPS);

export const Notifications: React.FC<NotificationsProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const end = notifEnd(p);
  const W = width - 112;
  const arrive = p.rows.map((_, i) => FIRST + i * GAP);
  const count = arrive.filter((a) => f >= a).length;
  const lastHit = [...arrive].reverse().find((a) => f >= a) ?? -99;
  const ring = f - lastHit < 18 ? Math.sin((f - lastHit) * 1.4) * 16 * Math.exp(-(f - lastHit) / 6) : 0; // degrees
  const top0 = height * 0.25;
  const heights = p.rows.map((r) => r.h * (W / r.w));
  const capAt = arrive[arrive.length - 1] + 26;
  const cap = ramp(f, capAt, capAt + DUR.arrive, CURVE.quiet.enter);
  return (
    <Clip endAt={end} cta={p.cta}>
      <Title out={end}>{p.title}</Title>
      {/* the bell and its badge */}
      <div style={{ position: "absolute", left: width - 200, top: 70, width: 120, height: 120 }}>
        <svg viewBox="0 0 24 24" width={120} height={120} style={{ transform: `rotate(${ring.toFixed(2)}deg)`, transformOrigin: "50% 8%" }}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" fill="none" stroke={B.color.ink} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" fill="none" stroke={B.color.ink} strokeWidth={1.6} strokeLinecap="round" />
        </svg>
        {count > 0 ? (
          <div style={{ position: "absolute", right: -6, top: -4, minWidth: 54, height: 54, borderRadius: 27, background: RED, color: B.color.accentInk, display: "flex", alignItems: "center",
            justifyContent: "center", fontFamily: INTER, fontWeight: 700, fontSize: 32, transform: `scale(${(1 + 0.25 * Math.max(0, 1 - (f - lastHit) / 8)).toFixed(3)})` }}>{count}</div>
        ) : null}
      </div>
      {/* the rows, newest on top */}
      {p.rows.map((r, i) => {
        if (f < arrive[i]) return null;
        const s = spring({ frame: f - arrive[i], fps, config: { damping: 15, stiffness: 150 } });
        // how far down this row has been pushed by the rows that arrived after it
        const pushed = p.rows.slice(i + 1).reduce((y, _, k) => {
          const j = i + 1 + k;
          const sj = spring({ frame: f - arrive[j], fps, config: { damping: 15, stiffness: 150 } });
          return y + (f >= arrive[j] ? (heights[j] + 22) * Math.min(1, sj) : 0);
        }, 0);
        const y = top0 + pushed - (1 - Math.min(1, s)) * 120;
        const scale = W / r.w;
        const newest = i === count - 1;
        return (
          <div key={i} style={{ position: "absolute", left: 56, top: y, width: W, height: heights[i], borderRadius: 20, overflow: "hidden", opacity: interpolate(s, [0, 0.4], [0, 1], clamp),
            boxShadow: `0 24px 60px rgba(0,0,0,.55), inset 0 0 0 ${newest ? 3 : 0}px rgba(${B.color.glowRgb},.8)`, zIndex: 10 + i }}>
            <Img src={staticFile(p.image.src)} style={{ position: "absolute", left: -r.x * scale, top: -r.y * scale, width: p.image.w * scale, height: p.image.h * scale }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.76, fontFamily: ZODIAK, fontWeight: 700, fontSize: 58, lineHeight: 1.1, color: B.color.ink, zIndex: 40,
        opacity: cap, transform: `translateY(${(1 - cap) * 14}px)` }}>{p.caption}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.76 + 150, fontFamily: INTER, fontSize: 32, color: B.color.ink, zIndex: 40, opacity: ramp(f, capAt + 12, capAt + 24) }}>{p.source}</div>
      {arrive.map((a, i) => <Cue key={i} at={a} name="chime-crystal" volume={0.3} />)}
    </Clip>
  );
};
