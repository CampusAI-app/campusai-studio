import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { PunchCaption } from "../components/PunchCaption";
import { keyframes } from "../lib/anim";
import type { Scene } from "../script";
import type { Theme } from "../theme";
import { safeLayout } from "../lib/safeArea";

type CardSceneProps = Extract<Scene, { type: "card" }> & {
  theme: Theme;
  fontFamily: string;
  captionFamily: string;
  resolvedDuration: number;
};

/**
 * A still captured out of the running product, composited rather than recorded.
 *
 * Used when a beat shows INFORMATION rather than an INTERACTION. Nothing is
 * clicked in those beats, so a screen recording only costs us: the source grid
 * crops badly, the floating ask bar sits where the caption goes, and scroll
 * timing becomes a performance.
 *
 * Two fits. "contain" shows the whole image. "width" fills the frame width and
 * lets the image run past the bottom, so a tall capture — an opened job detail,
 * say — can be panned down through instead of shrunk until it is unreadable.
 * The pan is driven by focus[].y: 0 is the top, 1 is the bottom.
 */
export const CardScene: React.FC<CardSceneProps> = ({
  src,
  inset = 70,
  maxWidth = 1,
  above,
  fit = "contain",
  srcAspect,
  focus,
  captions = [],
  theme,
  fontFamily,
  captionFamily,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const safe = safeLayout(width, height);
  const band = captions.length ? Math.round(height * safe.bandRatio) : 0;
  const stageTop = above ? height * 0.36 : height * safe.stageTopRatio;
  const stageH = height - band - stageTop;

  const track = focus?.length ? focus : [{ at: 0, x: 0.5, y: 0.5, scale: 1 }];
  const scale = keyframes(
    frame,
    track.map((f) => ({ at: f.at, value: f.scale })),
  );
  const ox = keyframes(
    frame,
    track.map((f) => ({ at: f.at, value: f.x })),
  );
  const oy = keyframes(
    frame,
    track.map((f) => ({ at: f.at, value: f.y })),
  );

  // fit="width" needs explicit pixel math, because the pan has to know how far
  // the image actually overruns the stage.
  const innerW = width - inset * 2;
  const imgH = srcAspect ? innerW / srcAspect : 0;
  const overflow = Math.max(0, imgH - (stageH - inset));
  const panY = -overflow * oy;

  // fit="contain" letterboxes the image inside the wrapper, so focus x/y (which
  // are IMAGE coordinates, the only ones a measurement off the real page can
  // give us) do not line up with the transform-origin percentages the wrapper
  // wants. Map them through the letterbox so a zoom lands on the same pixel in
  // every aspect ratio. Without srcAspect there is nothing to map with, so the
  // old behaviour stands.
  // Depth on ENTRY only. The panel arrives with a slight tilt and settles
  // perfectly flat by frame 22, which is well before any caption lands or any
  // highlight wipes. Text is never read on a skewed plane.
  const settle = keyframes(frame, [
    { at: 0, value: 1 },
    { at: 22, value: 0 },
  ]);
  const tiltY = settle * 5.5;
  const tiltX = settle * -2;

  // A single specular pass across the panel as it settles, the thing that reads
  // as "this is a physical object catching light" rather than a pasted image.
  const sweep = keyframes(frame, [
    { at: 4, value: 0 },
    { at: 40, value: 1 },
  ]);
  const sweepOpacity = keyframes(frame, [
    { at: 4, value: 0 },
    { at: 12, value: 1 },
    { at: 34, value: 1 },
    { at: 42, value: 0 },
  ]);

  let originX = ox;
  let originY = oy;
  if (fit === "contain" && srcAspect) {
    const boxW = width * maxWidth;
    const contentW = boxW - inset * 2;
    const contentH = stageH - inset * 2;
    const fittedW = Math.min(contentW, contentH * srcAspect);
    const fittedH = fittedW / srcAspect;
    originX = (inset + (contentW - fittedW) / 2 + ox * fittedW) / boxW;
    originY = (inset + (contentH - fittedH) / 2 + oy * fittedH) / stageH;
  }

  return (
    <AbsoluteFill
      style={{ backgroundColor: "transparent" }}
    >
      {/* The card this panel opened from, held above it and dimmed, so the
          viewer keeps the thread back to what they were just looking at. */}
      {above ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: height * safe.aboveY,
            display: "flex",
            justifyContent: "center",
            opacity:
              0.34 *
              keyframes(frame, [
                { at: 0, value: 0 },
                { at: 16, value: 1 },
              ]),
          }}
        >
          <Img
            src={staticFile(above)}
            style={{
              width: Math.min(width * 0.5, height * 0.29 * (357 / 234)),
              borderRadius: theme.radius,
            }}
          />
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: stageTop,
          bottom: band,
          display: "flex",
          alignItems: fit === "width" ? "flex-start" : "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {fit === "width" ? (
          <div
            style={{
              width: innerW,
              marginTop: inset,
              transform: `perspective(2400px) translateY(${panY}px) scale(${scale}) rotateY(${tiltY}deg) rotateX(${tiltX}deg)`,
              transformOrigin: "50% 0%",
              position: "relative",
            }}
          >
            <Img
              src={staticFile(src)}
              style={{
                width: "100%",
                display: "block",
                borderRadius: theme.radius,
                boxShadow: theme.shadow,
              }}
            />
            <PanelLight radius={theme.radius} sweep={sweep} opacity={sweepOpacity} />
          </div>
        ) : (
          <div
            style={{
              width: `${maxWidth * 100}%`,
              height: "100%",
              padding: inset,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `perspective(2400px) scale(${scale}) rotateY(${tiltY}deg) rotateX(${tiltX}deg)`,
              transformOrigin: `${originX * 100}% ${originY * 100}%`,
            }}
          >
            <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", maxHeight: "100%" }}>
              <Img
                src={staticFile(src)}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  display: "block",
                  borderRadius: theme.radius,
                  boxShadow: theme.shadow,
                }}
              />
              <PanelLight radius={theme.radius} sweep={sweep} opacity={sweepOpacity} />
            </div>
          </div>
        )}
      </div>

      {captions.map((caption, i) => (
        <PunchCaption
          key={i}
          text={caption.text}
          from={caption.from}
          duration={caption.duration}
          accentWords={caption.accentWords}
          theme={theme}
          fontFamily={captionFamily}
          y={safe.captionY}
        />
      ))}
    </AbsoluteFill>
  );
};

/**
 * Edge light and one specular sweep, laid over a panel and clipped to it.
 *
 * Purely additive light: it never darkens, never blurs, and it is gone by frame
 * 42, so no sentence is ever read through it. The top edge highlight stays,
 * because that is what gives a flat capture a bevel.
 */
const PanelLight: React.FC<{
  radius: number;
  sweep: number;
  opacity: number;
}> = ({ radius, sweep, opacity }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: radius,
      overflow: "hidden",
      pointerEvents: "none",
    }}
  >
    {/* The bevel. Light catches the top edge, falls off down the panel. */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.35)",
      }}
    />
    {/* The sweep. */}
    <div
      style={{
        position: "absolute",
        top: "-30%",
        bottom: "-30%",
        left: `${-70 + sweep * 170}%`,
        width: "60%",
        background:
          "linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.10) 55%, transparent 100%)",
        opacity: opacity * 0.9,
        transform: "rotate(8deg)",
      }}
    />
  </div>
);
