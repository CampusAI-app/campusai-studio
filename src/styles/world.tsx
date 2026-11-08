/**
 * The frame for a named style that is its own world (Jacob 11/08: "completely different types of content", "experimenting
 * with different fonts", "more red, but it shouldn't always just be a black background or a white background"). Unlike
 * `Clip` in common.tsx, this imposes no look: the style passes its own ground, its own face, where its small logo sits
 * and how it ends. All it keeps from the house rules is the logo inside two seconds, a music bed, and an ending that
 * lands on the logo, drawn on the style's own ground in the style's own face.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useBrandFonts } from "../kit/brand";
import { CURVE, DUR } from "../system/motion";
import { B, Bed, Cue, END_FRAMES, clamp, ramp } from "./common";

export { END_FRAMES };

export type WorldEnd = "wipe-up" | "wipe-left" | "iris" | "drop";

export type WorldProps = {
  endAt: number;
  /** Any CSS background: a colour, a gradient, layered gradients for texture. */
  ground: string;
  /** The text colour on this ground, for the end line and the URL. */
  ink: string;
  /** Which logo file reads on this ground: "white" (the onDark file) or "dark" (the onLight file). */
  logo: "white" | "dark";
  /** The small logo inside the first two seconds: which corner. */
  logoSpot?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "none";
  /** The style's own face, for the end line. */
  font: string;
  fontWeight?: number;
  cta?: string;
  /** How the scene gives way to the ending, in the style's own colour. */
  end?: WorldEnd;
  /** The colour that sweeps in for the ending; defaults to the ground. */
  endGround?: string;
  /** The logo file on the ending, when the end ground differs from the scene's; defaults to `logo`. */
  endLogo?: "white" | "dark";
  children: React.ReactNode;
};

const SmallLogo: React.FC<{ file: string; spot: NonNullable<WorldProps["logoSpot"]>; out: number }> = ({ file, spot, out }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  if (spot === "none") return null;
  const k = ramp(f, 6, 16, CURVE.quiet.enter) * (1 - ramp(f, out - 8, out, CURVE.quiet.exit));
  const w = Math.min(200, width * 0.18);
  const pos: React.CSSProperties = {
    "top-left": { left: 64, top: 90 }, "top-right": { right: 64, top: 90 },
    "bottom-left": { left: 64, bottom: 330 }, "bottom-right": { right: 64, bottom: 330 },
  }[spot];
  return <Img src={staticFile(file)} style={{ position: "absolute", ...pos, width: w, height: "auto", opacity: k, zIndex: 50 }} />;
};

export const World: React.FC<WorldProps> = ({ endAt, ground, ink, logo, logoSpot = "top-right", font, fontWeight = 700, cta, end = "wipe-up", endGround, endLogo, children }) => {
  useBrandFonts(B);
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const file = logo === "white" ? B.logo!.onDark : B.logo!.onLight;
  const endFile = (endLogo ?? logo) === "white" ? B.logo!.onDark : B.logo!.onLight;
  const sweep = ramp(f, endAt, endAt + DUR.arrive + 4, CURVE.showy.enter);
  const bg = endGround ?? ground;
  const clip = {
    "wipe-up": `inset(${((1 - sweep) * 100).toFixed(2)}% 0 0 0)`,
    "wipe-left": `inset(0 0 0 ${((1 - sweep) * 100).toFixed(2)}%)`,
    iris: `circle(${(sweep * 75).toFixed(2)}% at 50% 50%)`,
    drop: `inset(0 0 ${((1 - sweep) * 100).toFixed(2)}% 0)`,
  }[end];
  const at = endAt + DUR.arrive;
  const land = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 110 } });
  const logoW = Math.min(width * 0.52, 580);
  const cy = height * 0.5;
  const line = ramp(f, at + 6, at + 6 + DUR.arrive, CURVE.quiet.enter);
  const breathe = interpolate(f, [at + 20, at + END_FRAMES], [1, 1.025], clamp);
  return (
    <AbsoluteFill style={{ background: ground, overflow: "hidden" }}>
      <Bed total={endAt + END_FRAMES} />
      {children}
      <SmallLogo file={file} spot={logoSpot} out={endAt} />
      {f >= endAt ? (
        <AbsoluteFill style={{ background: bg, clipPath: clip, zIndex: 60 }}>
          {cta ? (
            <div style={{ position: "absolute", left: 72, right: 72, bottom: height - (cy - logoW / B.logo!.ratio / 2 - 60), textAlign: "center", fontFamily: font, fontWeight,
              fontSize: 76, lineHeight: 1.05, color: ink, opacity: line, transform: `translateY(${(1 - line) * 14}px)` }}>{cta}</div>
          ) : null}
          <Img src={staticFile(endFile)} style={{ position: "absolute", left: width / 2 - logoW / 2, top: cy - logoW / B.logo!.ratio / 2, width: logoW, height: "auto",
            opacity: f < at ? 0 : Math.min(1, land * 1.3), transform: `scale(${(breathe * (1.08 - 0.08 * Math.min(1, land))).toFixed(4)})` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: cy + logoW / B.logo!.ratio / 2 + 34, textAlign: "center", fontFamily: font, fontWeight: 500, fontSize: 36,
            color: ink, opacity: 0.8 * line }}>campusai.app</div>
        </AbsoluteFill>
      ) : null}
      <Cue at={endAt} name="air-woosh-quick" volume={0.45} />
      <Cue at={at} name="bass-hit-short" volume={0.4} />
    </AbsoluteFill>
  );
};

/** A headline in the style's own face and colour, placed by the style. Fades in early, out at `out`. */
export const Heading: React.FC<{ font: string; color: string; size?: number; weight?: number; top?: number; left?: number; right?: number; out: number; at?: number;
  align?: "left" | "center"; italic?: boolean; tracking?: string; children: React.ReactNode }> = ({ font, color, size = 72, weight = 700, top = 190, left = 64, right = 64, out, at = 0,
  align = "left", italic, tracking = "-0.02em", children }) => {
  const f = useCurrentFrame();
  const k = ramp(f, at, at + DUR.arrive, CURVE.quiet.enter) * (1 - ramp(f, out - 8, out, CURVE.quiet.exit));
  return (
    <div style={{ position: "absolute", left, right, top, fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.02, letterSpacing: tracking, color, textAlign: align,
      fontStyle: italic ? "italic" : "normal", opacity: k, transform: `translateY(${((1 - k) * 16).toFixed(1)}px)`, zIndex: 20 }}>{children}</div>
  );
};
