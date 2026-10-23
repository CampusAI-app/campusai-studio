/**
 * RedDot (motion pass, 2026-10-22): a small brand-red dot that stands for CampusAI hops between real elements on a
 * real page, using their measured boxes. It arcs, squashes a little on landing, stands on the element's top edge,
 * and each landing gives that element a gentle lift and a ring of light. Then it goes home and settles.
 *
 * From the Opus film notes (Design/prompts/opus-motion-films.md): "a carrier object that lives on the real UI ...
 * it only stands on top edges of real elements; the cursor is the user, the mascot is the software."
 * Moves: bouncing-ball-word-marker, "a small ball or marker hops from word to word across a lyric line, landing on
 * each word", built from hop-cycle (squash, launch, airborne, land) and squash-and-stretch kept small and
 * volume-preserving.
 *
 * Numbers (30 fps): a hop is `hop` frames (default 20) on an ease-in-out, arc height 0.32 x the distance (at least
 * 46 page px); 3 frames of take-off squash (x 1.14, y 0.86), a 1.08 stretch along the arc mid-air, a landing squash
 * of x 1.2, y 0.8 that springs back in 9 frames. The element lifts 4 page px with a soft shadow over 10 frames and
 * a ring of the brand's light grows 10 page px off its box and fades over 24 frames; it settles back when the dot
 * leaves. The camera is given as keys and should move only while the dot is standing (one subject at a time).
 * Optional `line` per stop is set in a caption band below the view (captions never sit on live UI).
 */
import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { camAlong, clampCam, rectOnCanvas, toCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { INTER } from "../../parts";
import { MarkPatch, PageCrop } from "./shared";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const HOP = Easing.bezier(0.45, 0, 0.35, 1);

export type DotStop = {
  rect: Rect;
  /** Where along the top edge it lands, 0 (left) to 1 (right). Default 0.08. */
  ax?: number;
  /** Frame the dot lands here. */
  at: number;
  /** Lift and ring this element on landing (default true). */
  lift?: boolean;
  /** Optional caption line, set below the view. Real strings only. */
  line?: string;
};

export type RedDotProps = {
  brand: Brand;
  page: { src: string; size: Size };
  view: Rect;
  cams: { t: number; cam: PageCam }[];
  /** Where the dot appears (it pops in on this element's top edge at `appear`). */
  start: { rect: Rect; ax?: number; appear: number };
  stops: DotStop[];
  /** The last stop it goes home to and settles on (no lift; it breathes). */
  home?: { rect: Rect; ax?: number; at: number };
  /** Hop length in frames. */
  hop?: number;
  /** Dot diameter in page px. */
  size?: number;
  markColor: string;
  caption?: { y: number; size: number };
};

const landPoint = (r: Rect, ax = 0.08, d: number) => ({ x: r.x + Math.max(d, Math.min(r.w - d, r.w * ax)), y: r.y - d / 2 });

export const RedDot: React.FC<RedDotProps> = ({ brand, page, view, cams, start, stops, home, hop = 20, size = 15, markColor, caption }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = clampCam(camAlong(f, cams), page.size, view);
  const legs = [
    { p: landPoint(start.rect, start.ax ?? 0.5, size), at: start.appear },
    ...stops.map((s) => ({ p: landPoint(s.rect, s.ax, size), at: s.at })),
    ...(home ? [{ p: landPoint(home.rect, home.ax ?? 0.5, size), at: home.at }] : []),
  ];

  // the dot's page position and squash at frame f
  let x = legs[0].p.x;
  let y = legs[0].p.y;
  let sx = 1;
  let sy = 1;
  let lastLand = legs[0].at;
  for (let i = 1; i < legs.length; i++) {
    const a = legs[i - 1].p;
    const b = legs[i].p;
    const t1 = legs[i].at;
    const t0 = t1 - hop;
    if (f < t0) break;
    if (f < t1) {
      const k = interpolate(f, [t0, t1], [0, 1], { ...clamp, easing: HOP });
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const h = Math.max(46, dist * 0.32);
      x = a.x + (b.x - a.x) * k;
      y = a.y + (b.y - a.y) * k - 4 * h * k * (1 - k);
      const mid = Math.sin(Math.PI * k);
      sy = 1 + 0.08 * mid;
      sx = 1 - 0.06 * mid;
      lastLand = -1;
      break;
    }
    x = b.x;
    y = b.y;
    lastLand = t1;
  }
  // take-off squash in the 3 frames before each hop
  const nextHop = legs.find((l, i) => i > 0 && f < l.at - hop && f >= l.at - hop - 3);
  if (nextHop) {
    const k = interpolate(f, [nextHop.at - hop - 3, nextHop.at - hop], [0, 1], clamp);
    sx = 1 + 0.14 * k;
    sy = 1 - 0.14 * k;
  }
  // landing squash, springing back
  if (lastLand >= 0 && f >= lastLand && f < lastLand + 12 && lastLand !== legs[0].at) {
    const r = spring({ frame: f - lastLand, fps, config: { damping: 11, stiffness: 260, mass: 0.6 }, durationInFrames: 9 });
    sx = 1.2 - 0.2 * r;
    sy = 0.8 + 0.2 * r;
  }
  const appear = spring({ frame: f - start.appear, fps, config: { damping: 12, stiffness: 180, mass: 0.6 } });
  const p = toCanvas(cam, view, x, y);
  const d = size * p.s;
  const settled = home && f >= home.at ? f - home.at : -1;
  const breathe = settled >= 0 ? 1 + 0.06 * Math.sin((settled / fps) * Math.PI * 1.2) * Math.min(1, settled / 20) : 1;

  // the element under the dot right now, and how long it has been there
  const active = stops.map((s, i) => {
    const leave = (legs[i + 2]?.at ?? Infinity) - hop;
    const on = interpolate(f, [s.at - 2, s.at + 8], [0, 1], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) });
    const off = interpolate(f, [leave, leave + 12], [0, 1], clamp);
    return { s, k: s.lift === false ? 0 : on * (1 - off), ring: interpolate(f, [s.at, s.at + 24], [0, 1], clamp), seen: f >= s.at };
  });
  const lineNow = [...stops].reverse().find((s) => f >= s.at && s.line);

  return (
    <>
      <PageView src={page.src} page={page.size} cam={cam} view={view} brand={brand}>
        <MarkPatch cam={cam} view={view} color={markColor} />
        {active.map(({ s, k, ring, seen }, i) => {
          if (!seen) return null;
          const r = rectOnCanvas(cam, view, s.rect);
          const up = 4 * k * p.s;
          const grow = 10 * ring * p.s;
          return (
            <React.Fragment key={i}>
              {ring < 1 ? (
                <div style={{ position: "absolute", left: r.x - 6 * p.s - grow, top: r.y - 5 * p.s - grow, width: r.w + 12 * p.s + grow * 2,
                  height: r.h + 10 * p.s + grow * 2, borderRadius: 12 * p.s + grow, border: `${1.5 * p.s}px solid ${glow(brand, 0.7 * (1 - ring))}`,
                  boxShadow: `0 0 ${24 * p.s}px ${glow(brand, 0.45 * (1 - ring))}` }} />
              ) : null}
              {k > 0.001 ? (
                <PageCrop src={page.src} page={page.size} from={s.rect} to={{ ...r, y: r.y - up }}
                  style={{ borderRadius: 8 * p.s, filter: `brightness(${1 + 0.08 * k})`,
                    boxShadow: `0 ${10 * k * p.s}px ${22 * k * p.s}px rgba(0,0,0,${0.5 * k}), 0 0 0 ${1 * p.s}px ${glow(brand, 0.35 * k)}` }} />
              ) : null}
            </React.Fragment>
          );
        })}
        {f >= start.appear ? (
          <div style={{ position: "absolute", left: p.x - (d * sx * breathe) / 2, top: p.y + d / 2 - d * sy * breathe, width: d * sx * breathe, height: d * sy * breathe,
            borderRadius: "50%", background: brand.color.accent, opacity: Math.min(1, appear * 1.5),
            transform: `scale(${appear.toFixed(4)})`, transformOrigin: "50% 100%",
            boxShadow: `0 0 ${d * 0.9}px ${glow(brand, 0.75)}, 0 0 ${d * 2.4}px ${glow(brand, 0.35 * breathe)}, inset 0 ${-d * 0.18}px ${d * 0.3}px rgba(0,0,0,.25)` }} />
        ) : null}
      </PageView>
      {caption && lineNow ? (
        <div style={{ position: "absolute", left: view.x, width: view.w, top: caption.y, textAlign: "center", fontFamily: INTER, fontWeight: 500,
          fontSize: caption.size, color: brand.color.ink, opacity: interpolate(f, [lineNow.at, lineNow.at + 10], [0, 1], clamp) }}>
          {lineNow.line}
        </div>
      ) : null}
    </>
  );
};
