/**
 * UmdOpen (2026-11-17): the UMD "M" in the first second of a named style, so a Maryland student scrolling past knows it
 * is about them before they leave. Jacob, Nov 17: "They should try to have the UMD logo or something showing up at UMD
 * at the beginning, because otherwise people might scroll through if it's not related to them." UMD imagery in films is
 * cleared (rules/campusai.md, 11/04 and 11/10).
 *
 * The move is his Nov 16 pick for the street interview (src/private/UmdLogoOverlay.tsx, option 1): the M pops in big at
 * 0.1 s (spring from 0.6, damping 15), holds to 1.1 s, then glides up into a small tag (size eases out ahead of position,
 * so it is already small as it crosses the opening line) and stays. Same values here, so every style opens the same way.
 *
 * The logo file is `public/private-umd-logo/umd-m.svg` (Jacob's Mac). Place it in a style as the LAST child so it sits on
 * top, and let the style's own opening line land under the tag.
 */
import React, { useState } from "react";
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

/** Jacob's copy, on his Mac only. Without it the M comes from the copy already in the repo (public/styles/umd, the same M
 * on a slightly taller canvas), so a teammate's frame 0 still opens on it (2026-11-25); if both are missing it is left out. */
const LOGO = "private-umd-logo/umd-m.svg";
const LOGO_IN_REPO = "styles/umd/umd-m.svg";

const ENTER = 3; // motion: lands at 0.1 s, sharing the hook with the opening line
const MOVE_START = 33; // motion: holds big until 1.1 s
const MOVE_FRAMES = 16; // motion: ~0.53 s glide up into the tag

export type UmdOpenProps = {
  /** Centre of the big M. Default: the middle of the frame, a little high. */
  bigCx?: number;
  bigCy?: number;
  bigH?: number;
  /** Where the small tag rests and stays. Default: top centre, clear of the campusai wordmark top-left. */
  tagCx?: number;
  tagCy?: number;
  tagH?: number;
  /** Frame it fades out on, if the style wants the tag gone before its end card. Omit to keep it to the end. */
  outAt?: number;
  /** Soft shadow under the M; turn off on very dark or very busy grounds if it muddies. */
  shadow?: boolean;
};

export const UmdOpen: React.FC<UmdOpenProps> = ({
  bigCx = 540, bigCy = 760, bigH = 340, tagCx = 540, tagCy = 118, tagH = 64, outAt, shadow = true,
}) => {
  const frame = useCurrentFrame();
  const [missing, setMissing] = useState(false);
  const [fallback, setFallback] = useState(false);
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - ENTER, fps, config: { damping: 15, mass: 0.7, stiffness: 160 } });
  const fadeIn = interpolate(frame, [ENTER, ENTER + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const popScale = interpolate(pop, [0, 1], [0.6, 1]);
  const m = interpolate(frame, [MOVE_START, MOVE_START + MOVE_FRAMES], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const ms = interpolate(frame, [MOVE_START, MOVE_START + MOVE_FRAMES], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const h = interpolate(ms, [0, 1], [bigH, tagH]);
  const cx = interpolate(m, [0, 1], [bigCx, tagCx]);
  const cy = interpolate(m, [0, 1], [bigCy, tagCy]);
  const sh = interpolate(m, [0, 1], [24, 6]);
  const out = outAt === undefined ? 1 : interpolate(frame, [outAt, outAt + 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (fadeIn * out <= 0 || missing) return null;
  return (
    <Img
      src={staticFile(fallback ? LOGO_IN_REPO : LOGO)}
      onError={() => (fallback ? setMissing(true) : setFallback(true))}
      style={{
        position: "absolute",
        left: cx,
        top: cy - h / 2,
        height: h,
        transform: `translateX(-50%) scale(${m > 0 ? 1 : popScale})`,
        opacity: fadeIn * out,
        filter: shadow ? `drop-shadow(0 ${sh / 4}px ${sh}px rgba(0,0,0,0.45))` : undefined,
        zIndex: 50,
      }}
    />
  );
};
