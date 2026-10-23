/**
 * AnswerToPage (motion pass, 2026-10-22): something named in a real answer (an event, a job) gets a soft highlight,
 * lifts off the answer, and the frame carries through it into that thing's real page, the camera landing on the
 * spot that matters. One continuous handoff, never a cut.
 *
 * Moves: shared-element-transition, "an element in the outgoing view moves and resizes into its matching position
 * in the incoming view while the rest of the scene fades", carried by a container-transform, "a button or card
 * expands its bounds until it becomes a full screen or dialog, and its content fades in inside the expanding
 * container". Inspired by Raylight's Cinematic SaaS template (prompt, the thing builds, a press) and the
 * linear-agent answer cascade.
 *
 * How it stays honest: both ends are real captures of the same page in the same coordinates (the answer, and the
 * named item opened from it, capture/pass-chat.cjs), so the expanding window is literally a window onto the real
 * destination growing out of the name's own box, and the name itself travels into the destination's title (the
 * same words, "Evercore Coffee Chat", answer link to dialog title) before it hands over.
 *
 * Numbers (30 fps): highlight sweep 12 f with the page dimming to 0.45; lift 14 f, 5 page px up with a shadow;
 * the window and the name travel together over 30 f on a slow-in slow-out (0.6, 0, 0.2, 1), radius 8 to the
 * panel's 24, the name fading between 35% and 75%; the outside of the window becomes the destination over the last
 * 25%; the camera pushes on the name during the lift (to 3.4x the name's width), follows the window to the
 * panel, then lands on `land` over 30 f and breathes 1.5% in over the hold.
 */
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Brand } from "../../brand";
import { glow } from "../../brand";
import type { PageCam, Rect, Size } from "../../camera";
import { camAlong, clampCam, rectOnCanvas } from "../../camera";
import { PageView } from "../../PageView";
import { MarkPatch, PageCrop, PageWindow, inflate, mixRect } from "./shared";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const MORPH = Easing.bezier(0.6, 0, 0.2, 1);
const SOFT = Easing.bezier(0.22, 1, 0.36, 1);

export type AnswerToPageProps = {
  brand: Brand;
  size: Size;
  view: Rect;
  /** The answer still and the named item's box in it (the link's text box). */
  from: { src: string; name: Rect; frame: PageCam; markColor: string;
    /** The answer's own ground colour behind the name: the highlight is laid on it, so when the name lifts it leaves
     *  a lit, empty slot in the sentence instead of a second copy of itself. */
    ground: string };
  /** The destination still (the item opened), its panel (the dialog or card), the title the name becomes, and the
   *  spot the camera lands on. */
  to: { src: string; panel: Rect; radius: number; title: Rect; land: Rect; markColor: string };
  /** Frames: when each beat starts (relative to the composition). */
  timing?: { highlight: number; lift: number; expand: number; expandLen: number; land: number; landLen: number };
};

export const ANSWER_TO_PAGE_TIMING = { highlight: 24, lift: 44, expand: 62, expandLen: 30, land: 96, landLen: 30 };

export const AnswerToPage: React.FC<AnswerToPageProps> = ({ brand, size, view, from, to, timing = ANSWER_TO_PAGE_TIMING }) => {
  const f = useCurrentFrame();
  const T = timing;
  const hi = interpolate(f, [T.highlight, T.highlight + 12], [0, 1], { ...clamp, easing: SOFT });
  const lift = interpolate(f, [T.lift, T.lift + 14], [0, 1], { ...clamp, easing: SOFT });
  const ex = interpolate(f, [T.expand, T.expand + T.expandLen], [0, 1], { ...clamp, easing: MORPH });
  const dim = 0.45 * hi + 0.3 * ex;

  // camera: the answer, a push on the name, the panel, then the landing spot
  const nameC = { cx: from.name.x + from.name.w / 2, cy: from.name.y + from.name.h / 2 };
  const pushCam: PageCam = { cx: nameC.cx + from.name.w * 0.4, cy: nameC.cy, cw: Math.max(from.name.w * 3.4, 420) };
  const panelCam: PageCam = { cx: to.panel.x + to.panel.w / 2, cy: to.panel.y + to.panel.h * 0.42, cw: to.panel.w * 1.18 };
  const landCam: PageCam = { cx: to.land.x + to.land.w / 2, cy: to.land.y + to.land.h / 2, cw: to.land.w * 1.22 };
  const settled: PageCam = { ...landCam, cw: landCam.cw * 0.985 };
  const cam = clampCam(camAlong(f, [
    { t: 0, cam: from.frame },
    { t: T.lift - 4, cam: from.frame },
    { t: T.expand + 2, cam: pushCam },
    { t: T.expand + T.expandLen, cam: panelCam },
    { t: T.land, cam: panelCam },
    { t: T.land + T.landLen, cam: landCam },
    { t: T.land + T.landLen + 120, cam: settled },
  ]), size, view);

  // the highlight pill under the name, sweeping left to right
  const pill = inflate(from.name, 6, 3);
  const pillNow = { ...pill, w: pill.w * hi };
  const win = mixRect(pill, to.panel, ex);
  const winRadius = 8 + (to.radius - 8) * ex;

  // the name, lifted, then travelling into the title's place at the title's size
  const nameUp = { ...from.name, y: from.name.y - 5 * lift };
  const titleH = to.title.h;
  const ratio = from.name.w / from.name.h;
  const target: Rect = { x: to.title.x, y: to.title.y, w: titleH * ratio, h: titleH };
  const nameNow = mixRect(nameUp, target, ex);
  const nameFade = interpolate(ex, [0.35, 0.75], [1, 0], clamp);
  const outside = interpolate(ex, [0.75, 1], [0, 1], clamp);
  const pc = rectOnCanvas(cam, view, pillNow);
  const s = view.w / cam.cw;

  return (
    <PageView src={from.src} page={size} cam={cam} view={view} brand={brand} dim={dim}>
      <MarkPatch cam={cam} view={view} color={from.markColor} />
      {/* the destination takes the whole view at the end of the morph, so the landing is the real page */}
      {outside > 0 ? (
        <PageWindow src={to.src} page={size} cam={cam} view={view} win={{ x: 0, y: 0, w: size.w, h: size.h }} opacity={outside} />
      ) : null}
      {outside > 0 ? <div style={{ opacity: outside }}><MarkPatch cam={cam} view={view} color={to.markColor} /></div> : null}
      {hi > 0 && ex < 1 ? (
        <div style={{ position: "absolute", left: pc.x, top: pc.y, width: pc.w, height: pc.h, borderRadius: 7 * s,
          background: `linear-gradient(${glow(brand, 0.2)}, ${glow(brand, 0.2)}), ${from.ground}`, boxShadow: `0 0 0 ${1.2 * s}px ${glow(brand, 0.55)}, 0 0 ${26 * s}px ${glow(brand, 0.35 * hi)}`,
          opacity: 1 - ex }} />
      ) : null}
      {ex > 0 ? (
        <PageWindow src={to.src} page={size} cam={cam} view={view} win={win} radius={winRadius}
          opacity={interpolate(ex, [0.12, 0.42], [0, 1], clamp)}
          shadow={`0 ${30 * s}px ${80 * s}px rgba(0,0,0,${0.55 * (1 - outside)}), 0 0 ${60 * s}px ${glow(brand, 0.25 * (1 - outside))}`} />
      ) : null}
      {hi > 0 && nameFade > 0 ? (
        <PageCrop src={from.src} page={size} from={inflate(from.name, 1)} to={rectOnCanvas(cam, view, inflate(nameNow, nameNow.h / from.name.h))}
          style={{ opacity: nameFade, filter: `drop-shadow(0 ${6 * lift * s}px ${12 * lift * s}px rgba(0,0,0,.55))` }} />
      ) : null}
    </PageView>
  );
};
