import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Highlight } from "../components/Highlight";
import { PunchCaption } from "../components/PunchCaption";
import { EASE } from "../lib/anim";
import type { Scene } from "../script";
import type { Theme } from "../theme";
import { safeLayout } from "../lib/safeArea";

type EvidenceSceneProps = Extract<Scene, { type: "evidence" }> & {
  theme: Theme;
  fontFamily: string;
  captionFamily: string;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * All four evidence beats in ONE scene, run as a horizontal carousel.
 *
 * Cards swipe left as the next one comes in from the right, which is the
 * gesture the content already implies — these are peers in a ranked list, and
 * you move through a list sideways, not by stacking it. Each card holds DEAD
 * STILL once it is centred, because its whole job is a sentence being read, and
 * the highlight then wipes across the phrase that earned the match.
 *
 * The carousel position is a single continuous float, `pos`, so a card's
 * offset, scale and opacity all fall out of how far it is from centre. No
 * per-card state machine, and interruption is impossible by construction.
 */
export const EvidenceScene: React.FC<EvidenceSceneProps> = ({
  beats,
  chipSrc,
  aspect = 357 / 234,
  theme,
  fontFamily,
  captionFamily,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const safe = safeLayout(width, height);
  const cardW = width * 0.86;
  const cardH = cardW / aspect;
  const spacing = width * 1.04;
  const SLIDE = 16;

  const starts: number[] = [];
  beats.reduce((acc, b) => {
    starts.push(acc);
    return acc + b.durationInFrames;
  }, 0);

  const ramp = (at: number) =>
    interpolate(frame, [at, at + SLIDE], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    });

  // Which card is centred, as a float. Card 0 is centre at 0, card 1 at 1, and
  // the value slides continuously between them.
  const pos = starts.slice(1).reduce((acc, s) => acc + ramp(s), 0);

  // The whole rail arrives from the right at the top of the scene.
  const railX = (1 - ramp(0)) * width;

  return (
    <AbsoluteFill
      style={{ backgroundColor: "transparent" }}
    >
      {/* The goal stays on screen throughout, so the evidence sliding past
          underneath always has something to be evidence FOR. */}
      {chipSrc ? (
        <div
          style={{
            position: "absolute",
            top: height * safe.chipY,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: ramp(0),
          }}
        >
          <Img src={staticFile(chipSrc)} style={{ width: width * 0.62 }} />
        </div>
      ) : null}

      {beats.map((beat, i) => {
        const d = i - pos;
        if (Math.abs(d) > 1.6) return null;

        const away = Math.min(Math.abs(d), 1);
        const scale = 1 - 0.05 * away;
        const opacity = 1 - away * 0.85;
        const centred = clamp01(1 - Math.abs(d) * 2);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (width - cardW) / 2,
              top: height * safe.contentY - cardH / 2,
              width: cardW,
              height: cardH,
              opacity,
              transform: `translateX(${d * spacing + railX}px) scale(${scale})`,
            }}
          >
            <Img
              src={staticFile(beat.src)}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: theme.radius,
                boxShadow: theme.shadow,
              }}
            />
            {/* The same bevel the full panels carry, so a carousel card reads as
                the same kind of object. Light only, no sweep: four cards
                sweeping in a row would be busy, and the highlight is the thing
                that should draw the eye here. */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: theme.radius,
                pointerEvents: "none",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.35)",
              }}
            />
            {beat.rects?.length ? (
              <div style={{ opacity: centred }}>
                <Highlight
                  rects={beat.rects}
                  from={starts[i] + 26}
                  theme={theme}
                />
              </div>
            ) : null}
          </div>
        );
      })}

      {/* Captions live at frame level and each one ENDS. Without a duration
          they stayed at full opacity and the next beat's caption drew straight
          on top of the last one. */}
      {beats.map((beat, i) =>
        beat.label ? (
          <PunchCaption
            key={`c${i}`}
            text={beat.label}
            from={starts[i] + 28}
            // -8, not -24: each card's label is now SPOKEN, and at -24 the
            // caption faded while the voice was still saying those words.
            duration={beat.durationInFrames - 8}
            accentWords={beat.accentWords}
            theme={theme}
            fontFamily={captionFamily}
            y={safe.captionY}
          />
        ) : null,
      )}
    </AbsoluteFill>
  );
};
