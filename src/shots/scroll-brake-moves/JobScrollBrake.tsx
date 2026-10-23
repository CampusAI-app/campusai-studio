// CampusAI adaptation (2026-10-21), from the shot shelf (Content/video-studio/shots/, video-shotcraft, Apache-2.0):
// demos/data/scroll-brake-moves, the BrakeReticleLock variant (B: long-list brake x reticle lock).
// The student's real Job Match list (one tall screenshot) sprints past, brakes hard onto the Goldman Sachs card with a
// small overshoot and rebound, and on the SAME frame four L brackets fly in from off screen and bite onto the card.
//
// Changes: the fake changelog rows, the fake app bar, the "Just shipped" tag, the backdrop and grain are gone (the real
// list image is the content, the film owns the background). Brackets are white; the target ring is brand red. Because
// the list is one image, "other rows dim to 0.38" is a dark scrim with a rounded cutout over the card, and the ring is
// an overlay on the card. The scrim and ring ease back out over the last 8 frames so the final frame is the plain
// product plus the reticle, which is what the film cuts to. The list mask (top/bottom fade) is dropped for the same
// reason. Direction: the original scrolls DOWN the page; when the target sits too near the top of the list for the
// full travel (Goldman is the third card), the list starts deep and scrolls back UP onto it, same curve mirrored.
//
// Kept from the original (frame numbers at dur = 89, where the brake lands exactly on the original's frame 59):
//   BRAKE = dur - 30          brake frame; brackets mount on this exact frame (the shot's "same-frame" rule)
//   0 -> 12                   rest (scaled with BRAKE / 59)
//   12 -> BRAKE-9             sprint, Easing.in(sin), covers TRAVEL - 430u
//   BRAKE-9 -> BRAKE          hard decel, Easing.out(cubic), runs 30u past the stop
//   BRAKE -> BRAKE+4          rebound onto the stop, Easing.out(quad)
//   brackets                  BRAKE -> BRAKE+9, Easing.out(back(2.4)), from +-620 / +-320 (scaled), opacity min(1, 3t+.35),
//                             10px outside the card, 46px arms, 6px round strokes, directional blur from their own speed
//   list blur                 SpeedBlur on the backward frame difference, x0.15, max 32
//   ring                      BRAKE -> BRAKE+6 linear, 2px at 0.85 alpha
//   dim                       BRAKE+2 -> BRAKE+14, Easing.out(cubic), others to 0.38
//   TRAVEL                    4200px on a 1080 frame, scaled to view.h (u = view.h / 1080)
import React from 'react';
import { Easing, Img, interpolate } from 'remotion';
import { SpeedBlur } from '../_fixtures/Polish';

const RED = '232,41,59';
const ARM = 46;
const STROKE = 6;
const GAP = 10;
const RELEASE = 8; // frames at the end over which the scrim and ring leave

type Props = {
  f: number;
  dur: number;
  src: string;
  imgW: number;
  imgH: number;
  target: { y: number; h: number };
  view: { x: number; y: number; w: number; h: number };
  /** Window corner radius and fill; the film embeds the list in the full web page, so it passes 0 and the page colour. */
  radius?: number;
  bg?: string;
};

const clampOpts = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const CORNERS = [
  { ax: 0, ay: 0, fromX: -620, fromY: -320, flip: [1, 1] },
  { ax: 1, ay: 0, fromX: 620, fromY: -320, flip: [-1, 1] },
  { ax: 0, ay: 1, fromX: -620, fromY: 320, flip: [1, -1] },
  { ax: 1, ay: 1, fromX: 620, fromY: 320, flip: [-1, -1] },
] as const;

const Corner: React.FC<{ flip: readonly [number, number]; style: React.CSSProperties }> = ({ flip, style }) => (
  <div style={{ position: 'absolute', width: ARM, height: ARM, transform: `scale(${flip[0]}, ${flip[1]})`, ...style }}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: ARM, height: STROKE, background: '#fff', borderRadius: STROKE / 2 }} />
    <div style={{ position: 'absolute', left: 0, top: 0, width: STROKE, height: ARM, background: '#fff', borderRadius: STROKE / 2 }} />
  </div>
);

export const JobScrollBrake: React.FC<Props> = ({ f, dur, src, imgW, imgH, target, view, radius: viewRadius = 34, bg = '#0b0708' }) => {
  const BRAKE = dur - 30;
  const START = Math.round((12 * BRAKE) / 59);
  const SPRINT_END = BRAKE - 9;

  const k = view.w / imgW; // image px -> canvas px
  const u = view.h / 1080; // original frame -> our view
  const listH = imgH * k;
  const maxScroll = Math.max(0, listH - view.h);

  // the card in image px; the real capture insets cards 16 CSS px (32 device px) each side
  const inset = 32;
  const card = { x: inset * k, y: target.y * k, w: (imgW - inset * 2) * k, h: target.h * k };
  // final scroll puts the card's centre at 45% of the view
  const FINAL = Math.min(maxScroll, Math.max(0, card.y + card.h / 2 - view.h * 0.45));

  // downward like the original when there is room above the target, else start deep and come back up
  const TRAVEL = 4200 * u;
  const down = FINAL - TRAVEL >= 0;
  const startPos = down ? FINAL - TRAVEL : Math.min(maxScroll, FINAL + TRAVEL);
  const D = Math.abs(FINAL - startPos);
  const s = down ? 1 : -1;
  const DECEL = Math.min(430 * u, D * 0.5);
  const OVER = 30 * u;

  // distance travelled toward the stop (0 -> D), with the 30u overshoot and rebound
  const distAt = (fr: number): number => {
    if (fr <= START) return 0;
    if (fr <= SPRINT_END) return interpolate(fr, [START, SPRINT_END], [0, D - DECEL], { easing: Easing.in(Easing.sin) });
    if (fr <= BRAKE) return interpolate(fr, [SPRINT_END, BRAKE], [D - DECEL, D + OVER], { easing: Easing.out(Easing.cubic) });
    return interpolate(fr, [BRAKE, BRAKE + 4], [D + OVER, D], { ...clampOpts, easing: Easing.out(Easing.quad) });
  };
  const scrollAt = (fr: number) => startPos + s * distAt(fr);

  const scroll = scrollAt(f);
  const v = scroll - scrollAt(Math.max(0, f - 1));

  const release = 1 - interpolate(f, [dur - 1 - RELEASE, dur - 1], [0, 1], { ...clampOpts, easing: Easing.inOut(Easing.cubic) });
  const ring = interpolate(f, [BRAKE, BRAKE + 6], [0, 1], clampOpts) * release;
  const dim = interpolate(f, [BRAKE + 2, BRAKE + 14], [0, 1], { ...clampOpts, easing: Easing.out(Easing.cubic) }) * release;

  // the card on the canvas at a given frame
  const rectAt = (fr: number) => ({
    x: view.x + card.x - GAP,
    y: view.y + card.y - scrollAt(fr) - GAP,
    w: card.w + GAP * 2,
    h: card.h + GAP * 2,
  });
  const lockAt = (fr: number) => interpolate(fr, [BRAKE, BRAKE + 9], [0, 1], { ...clampOpts, easing: Easing.out(Easing.back(2.4)) });
  const fly = view.w / 1200; // original list width 1200 -> our view width
  const cornerPos = (c: (typeof CORNERS)[number], fr: number) => {
    const r = rectAt(fr);
    const away = 1 - lockAt(fr);
    const half = ARM / 2;
    return { x: r.x + c.ax * r.w - half + c.fromX * fly * away, y: r.y + c.ay * r.h - half + c.fromY * fly * away };
  };

  const cardTop = card.y - scroll;
  const radius = 22;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: view.x,
          top: view.y,
          width: view.w,
          height: view.h,
          borderRadius: viewRadius,
          overflow: 'hidden',
          background: bg,
        }}
      >
        <SpeedBlur vx={0} vy={v} amount={0.1} max={18}>
          <Img
            src={src}
            style={{ position: 'absolute', left: 0, top: -scroll, width: view.w, height: listH, maxWidth: 'none' }}
          />
        </SpeedBlur>
        {/* scrim with a cutout over the card: the other rows fall to 0.38 */}
        {dim > 0.001 && (
          <div
            style={{
              position: 'absolute',
              left: card.x,
              top: cardTop,
              width: card.w,
              height: card.h,
              borderRadius: radius,
              boxShadow: `0 0 0 4000px rgba(11,7,8,${(0.62 * dim).toFixed(3)})`,
            }}
          />
        )}
        {ring > 0.001 && (
          <div
            style={{
              position: 'absolute',
              left: card.x,
              top: cardTop,
              width: card.w,
              height: card.h,
              borderRadius: radius,
              boxShadow: `0 0 0 ${(2 * ring).toFixed(2)}px rgba(${RED},${(0.85 * ring).toFixed(3)})`,
            }}
          />
        )}
      </div>

      {/* reticle: mounts on the brake frame, directional blur from each corner's own speed */}
      {f >= BRAKE &&
        CORNERS.map((c, i) => {
          const p = cornerPos(c, f);
          const q = cornerPos(c, f - 1);
          return (
            <SpeedBlur key={i} vx={p.x - q.x} vy={p.y - q.y} amount={0.1} max={18}>
              <Corner flip={c.flip} style={{ left: p.x, top: p.y, opacity: Math.min(1, lockAt(f) * 3 + 0.35) }} />
            </SpeedBlur>
          );
        })}
    </>
  );
};
