import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadCaptionFont } from "@remotion/google-fonts/Montserrat";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Atmosphere } from "./components/Atmosphere";
import { BrandScene } from "./scenes/BrandScene";
import { Watermark } from "./components/Watermark";
import { CardScene } from "./scenes/CardScene";
import { EndScene } from "./scenes/EndScene";
import { EvidenceScene } from "./scenes/EvidenceScene";
import { WallScene } from "./scenes/WallScene";
import { FootageScene } from "./scenes/FootageScene";
import { StatementScene } from "./scenes/StatementScene";
import { TitleScene } from "./scenes/TitleScene";
import type { Scene, VideoScript } from "./script";
import { getTheme } from "./theme";

// Inter only. No monospace anywhere in this pipeline, by house rule.
const { fontFamily } = loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600", "700"],
});

// Captions only. Short-form captions are a different voice from product UI
// type, and the heavy geometric sans is what the format actually uses.
const { fontFamily: captionFamily } = loadCaptionFont("normal", {
  subsets: ["latin"],
  weights: ["800"],
});

export type DemoVideoProps = {
  script: VideoScript;
  /** Frame counts per scene, resolved by calculateMetadata. */
  resolvedDurations: number[];
};

export const DemoVideo: React.FC<DemoVideoProps> = ({
  script,
  resolvedDurations,
}) => {
  const theme = getTheme(script.theme as string);

  // Every scene is transparent; this is the one place the ground is painted, so
  // it stays continuous across every crossfade instead of dissolving into
  // itself.
  const totalFrames = Math.max(
    1,
    resolvedDurations.reduce((a, b) => a + b, 0) -
      script.transitionFrames * Math.max(0, script.scenes.length - 1),
  );

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <Atmosphere theme={theme} totalFrames={totalFrames} />
      {script.music ? (
        <MusicBed src={script.music.src} volume={script.music.volume ?? 0.5} />
      ) : null}
      <TransitionSeries>
        {script.scenes.flatMap((scene, i) => {
          const duration = resolvedDurations[i];
          const nodes: React.ReactNode[] = [];

          if (i > 0 && script.transitionFrames > 0) {
            nodes.push(
              <TransitionSeries.Transition
                key={`t-${i}`}
                presentation={fade()}
                timing={linearTiming({
                  durationInFrames: script.transitionFrames,
                })}
              />,
            );
          }

          nodes.push(
            <TransitionSeries.Sequence
              key={`s-${i}`}
              durationInFrames={duration}
              name={`${i + 1}. ${scene.type}`}
            >
              {/* The line for this beat, offset so it sits just behind its own
                  caption. `layout="none"` because a Sequence must not add a
                  wrapper that could affect the scene's layout, and the audio is
                  allowed to run past the scene end. */}
              <VoiceTrack scene={scene} />
              {scene.type === "brand" ? (
                <BrandScene {...scene} theme={theme} />
              ) : scene.type === "title" ? (
                <TitleScene {...scene} theme={theme} fontFamily={fontFamily} />
              ) : scene.type === "statement" ? (
                <StatementScene
                  {...scene}
                  theme={theme}
                  fontFamily={fontFamily}
                  captionFamily={captionFamily}
                />
              ) : scene.type === "wall" ? (
                <WallScene
                  {...scene}
                  theme={theme}
                  fontFamily={fontFamily}
                  captionFamily={captionFamily}
                />
              ) : scene.type === "evidence" ? (
                <EvidenceScene
                  {...scene}
                  theme={theme}
                  fontFamily={fontFamily}
                  captionFamily={captionFamily}
                />
              ) : scene.type === "card" ? (
                <CardScene
                  {...scene}
                  theme={theme}
                  fontFamily={fontFamily}
                  captionFamily={captionFamily}
                  resolvedDuration={duration}
                />
              ) : scene.type === "end" ? (
                <EndScene {...scene} theme={theme} fontFamily={fontFamily} />
              ) : (
                <FootageScene
                  {...scene}
                  theme={theme}
                  fontFamily={fontFamily}
                  resolvedDuration={duration}
                />
              )}
            </TransitionSeries.Sequence>,
          );

          return nodes;
        })}
      </TransitionSeries>
      {/* Above the series on purpose, so it holds steady through every
          crossfade instead of dissolving with the scene under it. */}
      {script.watermark ? (
        <Watermark
          {...script.watermark}
          fadeOutAt={
            totalFrames - (resolvedDurations[resolvedDurations.length - 1] ?? 0)
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * Background bed. Faded up over the first half second and down across the end
 * card, because a hard cut at the last frame is the single most obvious tell
 * that a post was assembled rather than edited.
 */
const MusicBed: React.FC<{ src: string; volume: number }> = ({
  src,
  volume,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const inFrames = Math.round(fps * 0.5);
  const outFrames = Math.round(fps * 1.6);

  const v = interpolate(
    frame,
    [
      0,
      inFrames,
      durationInFrames - outFrames,
      durationInFrames,
    ],
    [0, volume, volume, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return <Audio src={staticFile(src)} volume={v} />;
};

/**
 * Every spoken line belonging to one scene.
 *
 * Three shapes, because the captions have three shapes: one line per beat
 * (`vo`), several lines in one beat (`vos`), and one line per card inside the
 * evidence carousel (`beats[].vo`, offset from that CARD's start, not the
 * scene's).
 *
 * A clip is deliberately allowed to run past the scene's end. Audio does not
 * have to stop where a picture cuts, and a line that carries a few tenths
 * across the crossfade bridges it rather than breaking it.
 */
const VoiceTrack: React.FC<{ scene: Scene }> = ({ scene }) => {
  const clips: { src: string; from: number; volume?: number }[] = [];

  if ("vo" in scene && scene.vo) {
    clips.push({ ...scene.vo, from: scene.vo.from ?? 0 });
  }
  if ("vos" in scene && scene.vos) {
    for (const v of scene.vos) clips.push({ ...v, from: v.from ?? 0 });
  }
  if (scene.type === "evidence") {
    let cardStart = 0;
    for (const b of scene.beats) {
      if (b.vo) clips.push({ ...b.vo, from: cardStart + (b.vo.from ?? 0) });
      cardStart += b.durationInFrames;
    }
  }

  return (
    <>
      {clips.map((c, i) => (
        <Sequence key={i} from={c.from} layout="none">
          <Audio src={staticFile(c.src)} volume={c.volume ?? 1} />
        </Sequence>
      ))}
    </>
  );
};
