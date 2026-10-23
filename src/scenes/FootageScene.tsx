import { Video } from "@remotion/media";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Callout } from "../components/Callout";
import { Caption } from "../components/Caption";
import { BareChrome, BrowserChrome, PhoneChrome } from "../components/Chrome";
import { keyframes } from "../lib/anim";
import type { Scene } from "../script";
import type { Theme } from "../theme";

type FootageSceneProps = Extract<Scene, { type: "footage" }> & {
  theme: Theme;
  fontFamily: string;
  /** Resolved length, since the script may declare "auto". */
  resolvedDuration: number;
};

/**
 * The workhorse. A screen recording, framed, with a virtual camera moving over
 * it and graphics layered on top.
 *
 * The camera is a CSS scale with a moving transform-origin. Callouts sit
 * OUTSIDE that transform and are mapped through it, so they stay pixel-crisp
 * at any zoom instead of being magnified along with the footage.
 */
export const FootageScene: React.FC<FootageSceneProps> = ({
  src,
  trimStart = 0,
  frame: chrome = "browser",
  url,
  inset = 90,
  focus,
  callouts = [],
  captions = [],
  audio = false,
  theme,
  fontFamily,
}) => {
  const frame = useCurrentFrame();

  // Default camera: hold wide for the whole scene.
  const track = focus?.length
    ? focus
    : [{ at: 0, x: 0.5, y: 0.5, scale: 1 }];

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

  // Map a point in footage space through the camera into screen space.
  const project = (x: number, y: number) => ({
    x: ox + (x - ox) * scale,
    y: oy + (y - oy) * scale,
  });

  const footage = (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${scale})`,
          transformOrigin: `${ox * 100}% ${oy * 100}%`,
        }}
      >
        <Video
          src={staticFile(`footage/${src}`)}
          trimBefore={trimStart}
          muted={!audio}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      {/* graphics layer, deliberately not inside the camera transform */}
      {callouts.map((c, i) => {
        const p = project(c.x, c.y);
        return (
          <Callout
            key={i}
            callout={{ ...c, x: p.x, y: p.y }}
            theme={theme}
            fontFamily={fontFamily}
          />
        );
      })}
    </>
  );

  const framed =
    chrome === "browser" ? (
      <BrowserChrome theme={theme} fontFamily={fontFamily} url={url}>
        {footage}
      </BrowserChrome>
    ) : chrome === "phone" ? (
      <PhoneChrome theme={theme}>{footage}</PhoneChrome>
    ) : (
      <BareChrome theme={theme}>{footage}</BareChrome>
    );

  // A phone recording is portrait, so it gets a centred column rather than
  // filling the 16:9 frame.
  const isPhone = chrome === "phone";

  // Captions get their own band under the footage instead of overlaying it.
  const band = captions.length > 0 ? 168 : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <AbsoluteFill
        style={{
          padding: inset,
          paddingBottom: inset + band,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={
            isPhone
              ? { height: "100%", aspectRatio: "9 / 19.5" }
              : { width: "100%", height: "100%" }
          }
        >
          {framed}
        </div>
      </AbsoluteFill>
      {captions.map((c, i) => (
        <Caption
          key={i}
          caption={c}
          theme={theme}
          fontFamily={fontFamily}
          band={band}
        />
      ))}
    </AbsoluteFill>
  );
};
