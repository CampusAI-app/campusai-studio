/**
 * snapcn parts sample (2026-11-06, from Jacob's Muse send, "Need asap").
 *
 * A short vertical piece whose only job is to show the vendored snapcn parts (`src/snapcn/`) working in
 * CampusAI's brand. Four beats, no product screens, no numbers:
 *   1. Hook, 0 to 4.7 s: Text Reveal, "Classes, jobs, clubs." with the logo arriving and settling top.
 *   2. Middle, 4.7 to 9.5 s: Word Wheel, "Your next" spinning through class / event / club / internship.
 *   3. Line, 9.5 to 13 s: Karaoke Captions, "All of it in one place." filling word by word, then held.
 *   4. End, 13 to 15 s: the kit's LogoEnd.
 * Beat lengths follow the studio's reading rule (letters / 15 + 1.5 s, counted from the line being whole).
 * Colours and faces come from the kit's brand only (Zodiak titles, Inter for the caption line).
 */
import React from "react";
import { AbsoluteFill, Freeze, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { brand, glow, INTER, LogoEnd, LogoOpen } from "../kit";
import { TextReveal } from "../snapcn/text-reveal";
import { WordWheel } from "../snapcn/word-wheel";
import { KaraokeCaptions } from "../snapcn/karaoke-captions";

export const SNAPCN_SAMPLE_FPS = 30;
export const SNAPCN_SAMPLE_FRAMES = 449;
export const SNAPCN_SAMPLE_SIZE = { width: 1080, height: 1920 };

const B = brand("campusai");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * The snapcn parts measure their line once, on mount, so Zodiak has to be loaded BEFORE they mount or
 * they measure the fallback face. The kit's `useBrandFonts` holds the render but gives no "ready" signal,
 * so this gate loads the same two files and only then lets the beats render.
 */
const useZodiakReady = () => {
  const [ready, setReady] = React.useState(false);
  const [wait] = React.useState(() => delayRender("snapcn sample: Zodiak"));
  React.useEffect(() => {
    const faces = [
      new FontFace("Zodiak", `url(${staticFile("fonts/Zodiak-Bold.woff2")}) format("woff2")`, { weight: "700", style: "normal" }),
      new FontFace("Zodiak", `url(${staticFile("fonts/Zodiak-Italic.woff2")}) format("woff2")`, { weight: "400", style: "italic" }),
    ];
    Promise.all(faces.map((x) => x.load().then((l) => document.fonts.add(l))))
      .then(() => setReady(true))
      .finally(() => continueRender(wait));
  }, [wait]);
  return ready;
};

/** Fades a beat in and out at its own edges, so cuts between parts never pop. */
const Beat: React.FC<{ len: number; fadeIn?: number; fadeOut?: number; children: React.ReactNode }> = ({ len, fadeIn = 0, fadeOut = 8, children }) => {
  const f = useCurrentFrame();
  const a = Math.min(fadeIn ? interpolate(f, [0, fadeIn], [0, 1], clamp) : 1, interpolate(f, [len - fadeOut, len], [1, 0], clamp));
  return <AbsoluteFill style={{ opacity: a }}>{children}</AbsoluteFill>;
};

/**
 * Karaoke Captions drops a line a few frames after its fill ends, because it expects the next spoken line.
 * With no voice there is no next line, so once the fill completes the part is frozen on its finished frame.
 */
const HoldAfter: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const f = useCurrentFrame();
  return (
    <Freeze frame={at} active={f >= at}>
      <AbsoluteFill>{children}</AbsoluteFill>
    </Freeze>
  );
};

const theme = {
  background: "transparent",
  foreground: B.color.ink,
  mutedForeground: B.color.inkSoft,
  primary: B.color.accent,
  card: B.color.surface,
  border: B.color.surface,
};

export const SnapcnSample: React.FC = () => {
  const ready = useZodiakReady();
  const f = useCurrentFrame();
  // the ground breathes a little so no frame is ever fully still
  const breathe = 0.16 + 0.04 * Math.sin(f / 30);

  return (
    <AbsoluteFill style={{ background: B.color.bgDeep }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 55% at 50% 58%, ${glow(B, breathe)}, transparent 70%)` }} />

      {ready ? (
        <>
          {/* 1. Hook: Text Reveal. The lead word lands big inside the first frames, the line assembles. */}
          <Sequence from={0} durationInFrames={142}>
            <Beat len={142}>
              <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
                <TextReveal
                  text="Classes, jobs, clubs."
                  fontSize={88}
                  fontWeight={700}
                  fontFamily="Zodiak"
                  color={B.color.ink}
                  letterSpacing="-0.02em"
                  holdDuration={10}
                  assembleDuration={34}
                />
              </AbsoluteFill>
            </Beat>
          </Sequence>

          {/* 2. Middle: Word Wheel, laid out in its own 1080 x 760 box so it scales to a phone width. */}
          <Sequence from={142} durationInFrames={144}>
            <Beat len={144} fadeIn={6}>
              <div style={{ position: "absolute", left: -96, top: 565, width: 1080, height: 760 }}>
                <Sequence width={1080} height={760} layout="none">
                  <AbsoluteFill>
                    <WordWheel
                      headline="Your next"
                      words="internship, class, event, club"
                      mode="dark"
                      fontFamily="Zodiak"
                      theme={theme}
                    />
                  </AbsoluteFill>
                </Sequence>
              </div>
            </Beat>
          </Sequence>

          {/* 3. Line: Karaoke Captions, filling word by word, "one place" in the accent. */}
          <Sequence from={286} durationInFrames={104}>
            <Beat len={104} fadeOut={10}>
              <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1250 }}>
                <Sequence width={1080} height={1250} layout="none">
                  <HoldAfter at={52}>
                    <KaraokeCaptions
                      lines={[{ text: "All of it in one place.", startFrame: 4, endFrame: 52, emphasize: [4, 5] }]}
                      preset="karaoke"
                      aspect="portrait"
                      mode="dark"
                      fontFamily={INTER}
                      fontWeight={700}
                      fontSize={92}
                      strokeRatio={0}
                      emphasisScale={1.03}
                      accentColor={B.color.accent}
                      baseColor={B.color.inkSoft}
                      fillColor={B.color.ink}
                      theme={theme}
                    />
                  </HoldAfter>
                </Sequence>
              </div>
            </Beat>
          </Sequence>
        </>
      ) : null}

      {/* Logo near the start (settles into a held mark), and the piece ends on it. */}
      <LogoOpen brand={B} at={3} x={540} y={300} width={360} settle={{ at: 40, x: 540, y: 200, width: 220 }} leaveAt={384} />
      <LogoEnd brand={B} at={392} x={540} y={940} width={620} />
    </AbsoluteFill>
  );
};
