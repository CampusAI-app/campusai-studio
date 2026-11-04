/**
 * Named one-prompt styles (2026-11-01, from Shaan Johari's reel, names only, his prompts are DM-gated).
 * Each style is one fixed film shape: the style carries the structure, the subject carries the words.
 * Everything every style shares lives here: sizes, sound, the small held logo, the carry into the end card.
 * Paper is the brand's warm ink turned over, ink on paper is the brand's near-black, so no colour is typed in.
 */
import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { brand, useBrandFonts } from "../kit/brand";
import { LogoEnd } from "../kit/LogoMoment";
import { INTER } from "../kit/parts";
import { CURVE, DUR, DRIFT } from "../system/motion";

export const B = brand("campusai");
export const PAPER = B.color.ink;
export const PRINT = B.color.bgDeep;
export const RED = B.color.accent;
export const ZODIAK = '"Zodiak", serif';
export { INTER };

export const END_FRAMES = 90;
export const SIZES = {
  vertical: { width: 1080, height: 1920 },
  feed: { width: 1080, height: 1350 },
  wide: { width: 1920, height: 1080 },
} as const;
export type Format = keyof typeof SIZES;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ramp = (f: number, a: number, b: number, easing = CURVE.quiet.standard) =>
  interpolate(f, [a, b], [0, 1], { ...clamp, easing });

export const Cue: React.FC<{ at: number; name: string; volume?: number }> = ({ at, name, volume = 0.6 }) => (
  <Sequence from={Math.max(0, at)} layout="none">
    <Audio src={staticFile(`styles/sfx/${name}.mp3`)} volume={() => Math.min(1, volume * 1.4)} />
  </Sequence>
);

export const Bed: React.FC<{ total: number; volume?: number }> = ({ total, volume = 0.42 }) => (
  <Audio
    src={staticFile("styles/sfx/bed.mp3")}
    volume={(f) => volume * interpolate(f, [0, 12, total - 24, total], [0, 1, 1, 0], clamp)}
  />
);

/** The logo inside the first half second, held small top left. It never delays the hook. */
export const HeldLogo: React.FC<{ light?: boolean; out: number }> = ({ light, out }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  const k = ramp(f, 6, 16, CURVE.quiet.enter) * (1 - ramp(f, out - 8, out, CURVE.quiet.exit));
  return (
    <Img
      src={staticFile(light ? B.logo!.onLight : B.logo!.onDark)}
      style={{ position: "absolute", left: 64, top: 96, width: Math.min(220, width * 0.2), height: "auto", opacity: k }}
    />
  );
};

/** The last shot shrinks into the logo's place and lets go as the logo lands. */
export const Carry: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const f = useCurrentFrame();
  const k = ramp(f, at, at + DUR.arrive + 8, CURVE.showy.enter);
  const out = ramp(f, at + DUR.panel, at + DUR.arrive + 4, CURVE.quiet.exit);
  return (
    <AbsoluteFill style={{ transform: `scale(${(1 - k * 0.72).toFixed(4)})`, opacity: 1 - out }}>{children}</AbsoluteFill>
  );
};

export const EndCard: React.FC<{ at: number; light?: boolean; y?: number }> = ({ at, light, y }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  if (f < at) return null;
  const cy = y ?? height * 0.47;
  const logoW = Math.min(width * 0.5, 560);
  const line = ramp(f, at + DUR.arrive, at + DUR.arrive * 2, CURVE.quiet.enter);
  const land = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 90 } });
  const breathe = interpolate(f, [at + 24, at + 24 + fps * 4], [1, 1 + DRIFT.scalePerSecond * 4], clamp);
  return (
    <AbsoluteFill>
      {light ? (
        <Img
          src={staticFile(B.logo!.onLight)}
          style={{ position: "absolute", left: width / 2 - logoW / 2, top: cy - logoW / B.logo!.ratio / 2, width: logoW,
            opacity: Math.min(1, land), transform: `scale(${(breathe * (1.04 - 0.04 * land)).toFixed(4)})` }}
        />
      ) : (
        <LogoEnd brand={B} at={at} x={width / 2} y={cy} width={logoW} />
      )}
      <div style={{ position: "absolute", top: cy + logoW / B.logo!.ratio / 2 + 34, width: "100%", textAlign: "center", opacity: line,
        transform: `translateY(${(1 - line) * 10}px)`, fontFamily: INTER, fontWeight: 500, fontSize: 36, letterSpacing: "-0.01em",
        color: light ? PRINT : B.color.inkSoft }}>
        campusai.app
      </div>
    </AbsoluteFill>
  );
};

/** Ground, fonts, music, held logo, carry and end card, shared by every style. */
export const Clip: React.FC<{ endAt: number; light?: boolean; ground?: string; logoY?: number; noCarry?: boolean; noLogo?: boolean; children: React.ReactNode }> = ({
  endAt, light, ground, logoY, noCarry, noLogo, children,
}) => {
  useBrandFonts(B);
  return (
    <AbsoluteFill style={{ background: ground ?? (light ? PAPER : B.color.bgDeep) }}>
      <Bed total={endAt + END_FRAMES} />
      {noCarry ? children : <Carry at={endAt}>{children}</Carry>}
      {noLogo ? null : <HeldLogo light={light} out={endAt} />}
      <EndCard at={noCarry ? endAt : endAt + DUR.arrive + 2} light={light} y={logoY} />
      <Cue at={endAt + 6} name="transition-soft" volume={0.5} />
    </AbsoluteFill>
  );
};

/** The one small line above the picture. */
export const Title: React.FC<{ at?: number; out: number; light?: boolean; children: React.ReactNode; top?: number; size?: number }> = ({
  at = 4, out, light, children, top = 196, size = 64,
}) => {
  const f = useCurrentFrame();
  const k = ramp(f, at, at + DUR.arrive, CURVE.quiet.enter) * (1 - ramp(f, out - 8, out, CURVE.quiet.exit));
  return (
    <div style={{ position: "absolute", left: 64, right: 64, top, fontFamily: ZODIAK, fontWeight: 700, fontSize: size, lineHeight: 1.08,
      letterSpacing: "-0.02em", color: light ? PRINT : B.color.ink, opacity: k, transform: `translateY(${(1 - k) * 14}px)` }}>
      {children}
    </div>
  );
};
