/**
 * The round 4 kit review reel (2026-10-25): every new kit part's preview, back to back, each under a
 * numbered name so Jacob can mark them by number ("keep 3, kill 7"). Not a post; a review copy.
 * The clips are the rendered previews, copied into public/pass/reel/ with their lengths by
 *   python3 src/kit/r4/make-reel.py
 * Render: npx remotion render src/kit/r4/reel-entry.ts R4-Reel out/r4/R4-Reel.mp4
 */
import React from "react";
import { AbsoluteFill, Composition, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { brand } from "../brand";
import { INTER } from "../parts";
import { useBrandFonts } from "../brand";
import reel from "../../../public/r4/reel/reel.json";

const B = brand("campusai");
const W = 1080;
const H = 1350;
const FPS = 30;
const BAND = 150;
const GAP = 12;

type Clip = { n: number; name: string; note: string; file: string; seconds: number; w: number; h: number };
const CLIPS = reel as Clip[];
const frames = (c: Clip) => Math.round(c.seconds * FPS) + GAP;

const Label: React.FC<{ c: Clip }> = ({ c }) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 56, top: 40, right: 56, opacity: k, fontFamily: INTER, color: B.color.ink }}>
      <div style={{ fontFamily: "Zodiak", fontWeight: 700, fontSize: 46, letterSpacing: "-0.02em" }}>
        <span style={{ color: B.color.accent }}>{c.n}</span>&nbsp;&nbsp;{c.name}
      </div>
      <div style={{ fontSize: 22, fontWeight: 500, color: B.color.inkSoft, marginTop: 6 }}>{c.note}</div>
    </div>
  );
};

const ClipView: React.FC<{ c: Clip }> = ({ c }) => {
  const boxH = H - BAND;
  const s = Math.min(W / c.w, boxH / c.h);
  const w = c.w * s;
  const h = c.h * s;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: (W - w) / 2, top: BAND + (boxH - h) / 2, width: w, height: h, overflow: "hidden" }}>
        <OffthreadVideo src={staticFile(`r4/reel/${c.file}`)} muted style={{ width: "100%", height: "100%" }} />
      </div>
      <Label c={c} />
    </AbsoluteFill>
  );
};

const Reel: React.FC = () => {
  useBrandFonts(B);
  let at = 0;
  return (
    <AbsoluteFill style={{ background: B.color.bgDeep }}>
      {CLIPS.map((c) => {
        const from = at;
        at += frames(c);
        return (
          <Sequence key={c.file} from={from} durationInFrames={frames(c)}>
            <ClipView c={c} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const ReelRoot: React.FC = () => (
  <Composition id="R4-Reel" component={Reel} durationInFrames={CLIPS.reduce((a, c) => a + frames(c), 0)} fps={FPS} width={W} height={H} />
);
