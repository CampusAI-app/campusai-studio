import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BrowserChrome } from "../components/Chrome";
import { PunchCaption } from "../components/PunchCaption";
import { keyframes } from "../lib/anim";
import type { Scene } from "../script";
import type { Theme } from "../theme";

type WallSceneProps = Extract<Scene, { type: "wall" }> & {
  theme: Theme;
  fontFamily: string;
  captionFamily: string;
};

// World units. The grid is laid out once at a fixed size and the camera moves
// over it, so tile geometry never depends on the output resolution.
const TILE_W = 1000;
const SCREEN_H = TILE_W / 1.6; // captures are 1440x900
const BAR = 56; // BrowserChrome's title bar, in the same world units
const TILE_H = SCREEN_H + BAR;
const GAP = 70;
// Rows are offset from each other so the wall reads as a wall rather than a
// spreadsheet, and so a horizontal move across it has something to parallax.
const ROW_STAGGER = [0, 90, -60];

/**
 * A wall of real product screens with a camera flying over it: close on one,
 * pull back to reveal the whole platform, then dive into the screen the rest of
 * the video is about.
 *
 * Its job is breadth without narration. Four beats of one feature tell you the
 * reasoning is good; three seconds over the wall tell you how much there is,
 * and no caption has to claim it.
 *
 * Scale is interpolated in LOG space. Interpolating it linearly makes a long
 * zoom appear to accelerate into the target and stall coming out of it, because
 * apparent motion goes with the ratio between scales, not their difference.
 */
export const WallScene: React.FC<WallSceneProps> = ({
  screens,
  path,
  captions = [],
  theme,
  fontFamily,
  captionFamily,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const gridW = 3 * TILE_W + 2 * GAP;
  const gridH = 3 * TILE_H + 2 * GAP;

  const wideScale = Math.min(width / gridW, height / gridH) * 0.9;
  const tileScale = width / TILE_W;

  const centreOf = (i: number) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    return {
      cx: col * (TILE_W + GAP) + TILE_W / 2 + ROW_STAGGER[row],
      cy: row * (TILE_H + GAP) + TILE_H / 2,
    };
  };

  const resolve = (t: number | "wide") =>
    t === "wide"
      ? { cx: gridW / 2, cy: gridH / 2, s: wideScale }
      : { ...centreOf(t), s: tileScale };

  const pts = path.map((p) => ({ at: p.at, ...resolve(p.target) }));

  const cx = keyframes(
    frame,
    pts.map((p) => ({ at: p.at, value: p.cx })),
  );
  const cy = keyframes(
    frame,
    pts.map((p) => ({ at: p.at, value: p.cy })),
  );
  const s = Math.exp(
    keyframes(
      frame,
      pts.map((p) => ({ at: p.at, value: Math.log(p.s) })),
    ),
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        backgroundImage: theme.bgGradient,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: gridW,
          height: gridH,
          transformOrigin: "0 0",
          transform: `translate(${width / 2 - cx * s}px, ${
            height / 2 - cy * s
          }px) scale(${s})`,
        }}
      >
        {screens.map((src, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          return (
            <div
              key={src}
              style={{
                position: "absolute",
                left: col * (TILE_W + GAP) + ROW_STAGGER[row],
                top: row * (TILE_H + GAP),
                width: TILE_W,
                height: TILE_H,
              }}
            >
              <BrowserChrome
                theme={theme}
                fontFamily={fontFamily}
                url="campusai.app"
              >
                <Img
                  src={staticFile(src)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </BrowserChrome>
            </div>
          );
        })}
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
          y={0.09}
        />
      ))}
    </AbsoluteFill>
  );
};
