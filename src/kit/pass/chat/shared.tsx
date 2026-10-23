/**
 * Shared pieces for the chat group (HonestTyping, AnswerToPage, RedDot), kept in this folder so the kit index is
 * not touched (wave 0 brief). All positions are PAGE px of a captured campusai-demo page (1440 x 900 CSS, DPR 2)
 * and are drawn through the page camera (`toCanvas`, `rectOnCanvas`), so everything stays glued to the page.
 *
 *   MarkPatch    covers the Maryland mark beside the sidebar logo with the sidebar's own colour. Measured on the
 *                pass captures at CSS x 129 to 146, y 18 to 40 (the patch also takes the thin divider before it,
 *                so the logo stands alone). The brief's "x 172 to 210" is the collapse button on these captures.
 *   PageCrop     a piece of a page image drawn at any canvas rect (a lifted row, the name travelling to a title).
 *   PageWindow   a window onto a second page image, aligned to the page (the reveal in AnswerToPage).
 *   FrameSeq     a recorded frame sequence (a clip of the page) played at a recording time, with the chat's soft
 *                trail: the last `trail` seconds of frames averaged, so a word that arrived d seconds ago shows at
 *                d / trail opacity, the same linear fade-in behind the writing edge as CampusChat's Streamed.
 */
import React from "react";
import { Img } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import type { PageCam, Rect, Size } from "../../camera";
import { rectOnCanvas, toCanvas } from "../../camera";

/** Inter at the product field's own weight (400). The kit's INTER loads 500 to 700 only; same family name. */
export const { fontFamily: INTER_400 } = loadFont("normal", { weights: ["400"] });

export type RecFrame = { t: number; name: string };
export type Recording = {
  /** staticFile() of the folder holding the frames, with a trailing slash. */
  dir: string;
  frames: RecFrame[];
  /** The part of the page the frames cover, page px. */
  clip: Rect;
};

/** The sidebar's own colour behind the mark, per capture (sampled from each still). */
export const MARK_RECT: Rect = { x: 116, y: 10, w: 40, h: 36 };

export const MarkPatch: React.FC<{ cam: PageCam; view: Rect; color: string; rect?: Rect }> = ({ cam, view, color, rect = MARK_RECT }) => {
  const r = rectOnCanvas(cam, view, rect);
  return <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, background: color }} />;
};

/** The recorded frame nearest to time t (frames sorted by t). */
export const frameAt = (frames: RecFrame[], t: number): RecFrame => {
  let lo = 0;
  let hi = frames.length - 1;
  if (t <= frames[0].t) return frames[0];
  if (t >= frames[hi].t) return frames[hi];
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (frames[m].t <= t) lo = m;
    else hi = m;
  }
  return t - frames[lo].t < frames[hi].t - t ? frames[lo] : frames[hi];
};

/** A piece of a page image (`from`, page px) drawn into a canvas rect `to`. No transform: laid out at size. */
export const PageCrop: React.FC<{
  src: string;
  page: Size;
  from: Rect;
  to: Rect;
  style?: React.CSSProperties;
}> = ({ src, page, from, to, style }) => {
  const sx = to.w / from.w;
  const sy = to.h / from.h;
  return (
    <div style={{ position: "absolute", left: to.x, top: to.y, width: to.w, height: to.h, overflow: "hidden", ...style }}>
      <Img src={src} style={{ position: "absolute", left: -from.x * sx, top: -from.y * sy, width: page.w * sx, height: page.h * sy, maxWidth: "none" }} />
    </div>
  );
};

/** A window (page rect `win`) onto another page image laid over the same page coordinates. */
export const PageWindow: React.FC<{
  src: string;
  page: Size;
  cam: PageCam;
  view: Rect;
  win: Rect;
  radius?: number;
  opacity?: number;
  shadow?: string;
}> = ({ src, page, cam, view, win, radius = 0, opacity = 1, shadow }) => {
  const r = rectOnCanvas(cam, view, win);
  const o = toCanvas(cam, view, 0, 0);
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, overflow: "hidden", borderRadius: radius * o.s, opacity, boxShadow: shadow }}>
      <Img src={src} style={{ position: "absolute", left: o.x - r.x, top: o.y - r.y, width: page.w * o.s, height: page.h * o.s, maxWidth: "none" }} />
    </div>
  );
};

/** A recorded clip of the page, played at recording time `t` (seconds), with the soft trail. */
export const FrameSeq: React.FC<{
  rec: Recording;
  t: number;
  cam: PageCam;
  view: Rect;
  /** Seconds of soft trail (0 = the plain frame). The chat's own trail is 0.65 s. */
  trail?: number;
  samples?: number;
  opacity?: number;
  /** Where the words arrive (page px). The trail is applied only inside it, over the plain newest frame, so a
   *  layout that moves elsewhere (the field sliding down as lines are added) never ghosts. */
  trailRect?: Rect;
  /** Recording time the words start arriving: older samples are held there, so the layout change before it
   *  (the card re-flowing on send) is never averaged. */
  trailFrom?: number;
}> = ({ rec, t, cam, view, trail = 0.65, samples = 6, opacity = 1, trailRect, trailFrom = -Infinity }) => {
  const r = rectOnCanvas(cam, view, rec.clip);
  const n = trail > 0 ? samples : 1;
  // oldest first; layer i at 1/(i+1) builds the equal-weight average
  const picks: RecFrame[] = [];
  for (let i = n - 1; i >= 0; i--) picks.push(frameAt(rec.frames, Math.max(t - (trail * i) / Math.max(1, n - 1), Math.min(t, trailFrom))));
  const stack = picks.map((fr, i) => (
    <Img key={i} src={rec.dir + fr.name}
      style={{ position: "absolute", left: 0, top: 0, width: r.w, height: r.h, maxWidth: "none", opacity: 1 / (i + 1) }} />
  ));
  if (!trailRect || n === 1) return <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, opacity }}>{stack}</div>;
  const tr = rectOnCanvas(cam, view, trailRect);
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, opacity }}>
      <Img src={rec.dir + picks[picks.length - 1].name} style={{ position: "absolute", left: 0, top: 0, width: r.w, height: r.h, maxWidth: "none" }} />
      <div style={{ position: "absolute", left: tr.x - r.x, top: tr.y - r.y, width: tr.w, height: tr.h, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: r.x - tr.x, top: r.y - tr.y, width: r.w, height: r.h }}>{stack}</div>
      </div>
    </div>
  );
};

/** A rect grown by dx, dy on every side. */
export const inflate = (r: Rect, dx: number, dy = dx): Rect => ({ x: r.x - dx, y: r.y - dy, w: r.w + dx * 2, h: r.h + dy * 2 });

/** Blend two rects. */
export const mixRect = (a: Rect, b: Rect, k: number): Rect => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  w: a.w + (b.w - a.w) * k,
  h: a.h + (b.h - a.h) * k,
});
