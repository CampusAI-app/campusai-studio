/**
 * Proof of the Edge-turn card (2026-11-26, Muse send d7d623c9, Medallia slide 9): the demo student's degree progress,
 * then the card turns edge-on and opens on her professors this fall. Every number from campusai-demo /academics,
 * captured Nov 26 (films/campus-island/capture/academics.txt): Degree Progress 53%, 64 done, 18 in-progress,
 * 38 remaining; Fall 2026, 6 classes tracked; BMGT310 Ortiz 4.2, BMGT343 Kim 4.5, BMGT364 Park 4.3.
 */
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { INTER } from "../kit/parts";
import { EdgeTurnCard, GrowBars, StatTile, edgeTurnTimes, EDGE_TURN } from "../kit/effects/EdgeTurnCard";
import type { EdgePage } from "../kit/effects/EdgeTurnCard";

export const EDGE_FRAMES = 210;
const RED = "#D9202E";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Head: React.FC<{ local: number; title: string; sub: string }> = ({ local, title, sub }) => (
  <div style={{ opacity: interpolate(local, [0, 6], [0, 1], clamp), transform: `translateY(${interpolate(local, [0, 10], [10, 0], clamp)}px)` }}>
    <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 44, color: "#fff", letterSpacing: "-0.035em", lineHeight: 1.08 }}>{title}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
      <div style={{ width: 10, height: 10, borderRadius: 5, background: RED }} />
      <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 21, color: "rgba(255,255,255,0.66)" }}>{sub}</div>
    </div>
  </div>
);

const Page: React.FC<{ left: React.ReactNode; right: React.ReactNode }> = ({ left, right }) => (
  <AbsoluteFill style={{ flexDirection: "row", padding: "70px 34px 34px 40px", gap: 26 }}>
    <div style={{ width: 370, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>{left}</div>
    <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>{right}</div>
  </AbsoluteFill>
);

const PAGES: EdgePage[] = [
  {
    frames: 105,
    // frame 0 is never empty: the first chart is already mid-arrival
    render: (l0) => { const l = l0 + 12; return (
      <Page
        left={<><Head local={l} title="Degree progress" sub="On track" /><StatTile local={l} value={53} suffix="%" label="of your degree done" /></>}
        right={<GrowBars local={l} max={64} width={500} height={420} start={6} bars={[
          { value: 64, valueText: "64", label: "credits done", color: "#4a4a4e" },
          { value: 18, valueText: "18", label: "in progress", color: RED },
          { value: 38, valueText: "38", label: "remaining", color: "#f2f2f2", ink: "#111" },
        ]} />}
      />
    ); },
  },
  {
    frames: 105,
    render: (l) => (
      <Page
        left={<><Head local={l} title="Your professors this fall" sub="6 classes tracked" /><StatTile local={l} value={4.5} decimals={1} label="Kim, BMGT343" /></>}
        right={<GrowBars local={l} max={5} width={500} height={420} start={6} bars={[
          { value: 4.2, valueText: "4.2", label: "Ortiz, 310", color: "#4a4a4e" },
          { value: 4.3, valueText: "4.3", label: "Park, 364", color: "#f2f2f2", ink: "#111" },
          { value: 4.5, valueText: "4.5", label: "Kim, 343", color: RED },
        ]} />}
      />
    ),
  },
];

const Cue: React.FC<{ at: number; name: string; volume?: number }> = ({ at, name, volume = 0.45 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={45} layout="none">
    <Audio src={staticFile(`sound/cues/${name}.wav`)} volume={volume} />
  </Sequence>
);

export const ProofEdgeTurn: React.FC = () => {
  const f = useCurrentFrame();
  const starts = edgeTurnTimes(PAGES);
  return (
    <AbsoluteFill style={{ background: "#e8ecee", alignItems: "center", justifyContent: "center" }}>
      <EdgeTurnCard pages={PAGES} width={980} height={600} accent={RED}
        mark={<Img src={staticFile("post-campus-island/spark.svg")} style={{ width: 26 }} />} />
      <Img src={staticFile("brand/campusai-logo.svg")} style={{ position: "absolute", bottom: 90, width: 200, opacity: 0.8 }} />
      {starts.slice(1).map((s) => <Cue key={s} at={s - EDGE_TURN.turnIn} name="move-swoosh-quick" volume={0.4} />)}
      {starts.map((s) => [0, 1, 2].map((b) => <Cue key={`${s}-${b}`} at={s + 6 + b * EDGE_TURN.barStagger} name="type-switch-tap" volume={0.25} />))}
      <div style={{ display: "none" }}>{f}</div>
    </AbsoluteFill>
  );
};
