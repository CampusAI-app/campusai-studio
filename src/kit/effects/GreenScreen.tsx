/**
 * Green screen (2026-11-10, from @mrcreates.ai's "17 Video Effects" reel, 13.5 to 14.2 s, stepped frame by frame). What
 * the reel does: the presenter's background snaps to a flat chroma green, so he is plainly keyed, then a hard diagonal
 * wipe sweeps across and replaces the green with a new background. It reads as "the green screen, then the shot".
 *
 * Ours: the real clip plays for a beat, then a hard cut to chroma green behind the cutout, then a hard-edged diagonal
 * wipe (a fast ease-out, so it lands and settles) reveals the new background, slightly blurred and darkened so the person separates,
 * with a soft light wrap: the new background's light bleeds a few pixels into the person's edges so he sits in it. The
 * whole stack is framed by `frame` (zoom, and which clip y sits on the bottom edge) so a cutout that stops at a table or
 * a ragged line is always off frame.
 *
 * Props (positions in the clip's own pixels; the clip, cutout and matte are the composition's size):
 * - clip: the full clip under public/ (its sound plays). person: the cutout (alpha webm). matte: white = person, used
 *   for the light wrap (omit for none).
 * - background: the new shot, with where to start in it (frames), blur px, darken (0 to 1) and zoom.
 * - keyAt: the frame the green snaps in. wipeAt / wipeFrames: the diagonal reveal.
 * - frame: zoom and the clip y that sits on the frame's bottom edge; focusX is the clip x kept centred.
 * - green, wrap (0 to 1), choke (px the cutout's edge is pulled in), sfx (a tap on the snap, a soft sweep on the wipe).
 *
 *   <GreenScreen clip="x/clip.mp4" person="x/person.webm" matte="x/matte.mp4" keyAt={42} wipeAt={70}
 *     background={{ src: "broll/room.mp4", startFrom: 60 }} frame={{ zoom: 1.7, bottom: 1280 }} />
 */
import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Sfx, k, mix } from "./shared";

export type GreenScreenProps = {
  clip: string;
  person: string;
  matte?: string;
  /** Frames into the clip (and cutout, and matte) to start from. */
  startFrom?: number;
  background: { src: string; startFrom?: number; blur?: number; darken?: number; zoom?: number };
  keyAt: number;
  wipeAt: number;
  wipeFrames?: number;
  frame?: { zoom: number; bottom: number; focusX?: number };
  green?: string;
  wrap?: number;
  /** px the cutout's edge is pulled in (in the clip's pixels), to lose the old backdrop's fringe. 0 for none. */
  choke?: number;
  sfx?: boolean;
};

export const GreenScreen: React.FC<GreenScreenProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const startFrom = p.startFrom ?? 0;
  const green = p.green ?? "#00B140";

  // framing: the same transform on the clip, the cutout and the matte, so they stay locked together
  const zoom = p.frame?.zoom ?? 1;
  const bottom = p.frame?.bottom ?? H;
  const focusX = p.frame?.focusX ?? W / 2;
  const tx = W / 2 - focusX * zoom;
  const ty = H - bottom * zoom;
  const framed: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` };

  // the wipe: a hard edge leaning about 15 degrees, sweeping left to right in 9 frames
  const wipeFrames = p.wipeFrames ?? 9;
  const lean = H * 0.27;
  // motion: a milder ease-out than OUT so the sweep is seen crossing the frame before it settles
  const w = k(f, p.wipeAt, p.wipeAt + wipeFrames, Easing.bezier(0.3, 0.55, 0.35, 1));
  const edge = mix(-lean - 20, W + lean + 20, w);
  const clip = `polygon(-2000px -10px, ${(edge + lean).toFixed(1)}px -10px, ${(edge - lean).toFixed(1)}px ${H + 10}px, -2000px ${H + 10}px)`;

  const bg = p.background;
  const bgBlur = bg.blur ?? 6;
  const bgBright = 1 - (bg.darken ?? 0.3);
  const bgZoom = bg.zoom ?? 1.08;
  // motion: the new shot drifts in 4% over the rest of the piece so the held background is never still
  const drift = 1 + 0.04 * k(f, p.wipeAt, p.wipeAt + 150, (x) => x);
  const background = (filter: string) => (
    <Sequence from={p.wipeAt - 2} layout="none">
      <OffthreadVideo
        src={staticFile(bg.src)}
        startFrom={bg.startFrom ?? 0}
        muted
        style={{ position: "absolute", left: 0, top: 0, width: W, height: H, objectFit: "cover", transform: `scale(${(bgZoom * drift).toFixed(4)})`, filter }}
      />
    </Sequence>
  );

  const keyed = f >= p.keyAt;
  const choke = p.choke ?? 1.6;
  const chokeId = "green-screen-choke";
  const wrap = p.wrap ?? 0.85;

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {/* choke: pull the cutout's alpha in a little so the old backdrop's dark fringe never rims the person */}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={chokeId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="erode" radius={choke} result="a" />
          <feGaussianBlur in="a" stdDeviation={Math.max(0.6, choke * 0.7)} result="ab" />
          <feComposite in="SourceGraphic" in2="ab" operator="in" />
        </filter>
      </svg>
      <Audio src={staticFile(p.clip)} trimBefore={startFrom || undefined} />
      {!keyed ? (
        <div style={framed}>
          <OffthreadVideo src={staticFile(p.clip)} startFrom={startFrom} muted style={{ width: W, height: H }} />
        </div>
      ) : (
        <>
          <AbsoluteFill style={{ background: green }} />
          {f >= p.wipeAt - 2 ? (
            <AbsoluteFill style={{ clipPath: clip }}>
              {background(`blur(${bgBlur}px) brightness(${bgBright})`)}
            </AbsoluteFill>
          ) : null}
          <div style={framed}>
            <OffthreadVideo src={staticFile(p.person)} startFrom={startFrom} transparent muted style={{ width: W, height: H, filter: choke > 0 ? `url(#${chokeId})` : undefined }} />
          </div>
          {/* light wrap: (matte minus blurred matte) keeps a thin band just inside his edge, times the new shot's light */}
          {p.matte && f >= p.wipeAt - 2 ? (
            <AbsoluteFill style={{ clipPath: clip, isolation: "isolate", mixBlendMode: "screen", opacity: wrap, filter: "brightness(1.9)" }}>
              <AbsoluteFill style={{ background: "#000" }} />
              <div style={framed}>
                <OffthreadVideo src={staticFile(p.matte)} startFrom={startFrom} muted style={{ width: W, height: H }} />
              </div>
              <div style={{ ...framed, mixBlendMode: "difference" }}>
                <OffthreadVideo src={staticFile(p.matte)} startFrom={startFrom} muted style={{ width: W, height: H, filter: "blur(9px)" }} />
              </div>
              <div style={{ ...framed, mixBlendMode: "multiply" }}>
                <OffthreadVideo src={staticFile(p.matte)} startFrom={startFrom} muted style={{ width: W, height: H }} />
              </div>
              <AbsoluteFill style={{ mixBlendMode: "multiply" }}>
                {background("blur(28px) brightness(1.15)")}
              </AbsoluteFill>
            </AbsoluteFill>
          ) : null}
        </>
      )}
      <Sfx at={p.keyAt} name="switch-tap" volume={0.3} on={!!p.sfx} />
      <Sfx at={p.wipeAt - 1} name="transition-soft" volume={0.26} on={!!p.sfx} />
    </AbsoluteFill>
  );
};
