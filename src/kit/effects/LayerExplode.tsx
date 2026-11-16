/**
 * Layer explode (2026-11-15, effect 10 of Skill Stack Store's "20 Claude Effects in 20 Secs" reel, 12.9 to 14.0 s,
 * stepped frame by frame; facts in films/effects-skillstack/facts.md). What the reel does: a punch out so the whole
 * frame shrinks; a white serif title types on; the frame turns about 25 to 30 degrees on Y and splits into 4 to 5
 * glass planes along depth (ground, footage, person, title, a red and white audio waveform strip), each with a thin
 * white edge; it holds about 0.4 s and snaps back flat at 14.0.
 *
 * Ours, in real CSS 3D (preserve-3d, renders headless): the five layers of the shot pulled apart in depth. Ground
 * (the clip blurred and dark, its light), footage, the person (the cutout), the title, and a waveform strip drawn from
 * the clip's own audio levels (`levels`, one 0 to 1 value per clip frame; the strip scrolls so the newest bar is the
 * voice right now). Punch out to 62% in 7 frames, title words land on `wordAt` (put them on the voice), the stack turns
 * 28 degrees on a spring and splits, holds, snaps flat in 5 frames at `backAt`, then punches back in to full frame.
 * Glass planes carry a thin white edge and a faint sheen. DM Serif Display for the title.
 *
 *   <LayerExplode clip="x/clip.mp4" person="x/person.webm" startFrom={87} at={26} splitAt={36} backAt={58}
 *     title={["Bring", "students", "together"]} wordAt={[37, 41, 53]} levels={GOAL_LEVELS} />
 */
import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadDMSerif } from "@remotion/google-fonts/DMSerifDisplay";
import { OUT, Sfx, k, mix } from "./shared";
import { Framing, framedStyle } from "./InkScreen";

const { fontFamily: DMSERIF } = loadDMSerif("normal", { weights: ["400"], subsets: ["latin"] });

export type LayerExplodeProps = {
  clip: string;
  person: string;
  startFrom?: number;
  frame?: Framing;
  /** Punch out starts. */
  at: number;
  /** The turn and split start. */
  splitAt: number;
  /** The snap back flat starts; full frame again 11 frames later. */
  backAt: number;
  /** Title words and the frame each lands. */
  title: string[];
  wordAt: number[];
  /** Audio level per clip frame, 0 to 1 (from the clip's own sound). */
  levels: number[];
  /** Degrees of turn on Y (the reel: 25 to 30). */
  turn?: number;
  /** How small the punched-out frame gets. */
  punch?: number;
  sound?: boolean;
};

const RED = "#E0313C";

export const LayerExplode: React.FC<LayerExplodeProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const from = p.startFrom ?? 0;
  const end = p.backAt + 11;
  const sound = p.sound ?? true;
  const audio = <Audio src={staticFile(p.clip)} trimBefore={from || undefined} />;
  const clipVideo = (filter?: string) => <OffthreadVideo src={staticFile(p.clip)} startFrom={from} muted style={{ width: W, height: H, filter }} />;
  const sfx = (
    <>
      <Sfx at={p.at} name="air-woosh-quick" volume={0.35} on={sound} />
      <Sfx at={p.splitAt} name="swoosh-slow" volume={0.3} on={sound} />
      <Sfx at={p.backAt + 3} name="switch-tap" volume={0.45} on={sound} />
    </>
  );
  if (f < p.at || f >= end) {
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        {audio}
        <div style={framedStyle(W, H, p.frame)}>{clipVideo()}</div>
        {sfx}
      </AbsoluteFill>
    );
  }

  // motion: punch out with a hard ease-out; the split is a spring (a small overshoot so it lands); the snap back is
  // a fast ease-in-out over 5 frames; then the punch back in mirrors the punch out.
  const small = p.punch ?? 0.62;
  const s = mix(1, small, k(f, p.at, p.at + 7, OUT)) + (1 - small) * k(f, p.backAt + 5, end, OUT);
  const split = spring({ frame: f - p.splitAt, fps, config: { damping: 15, stiffness: 150 } });
  const ex = Math.max(0, split * (1 - k(f, p.backAt, p.backAt + 5, Easing.bezier(0.7, 0, 0.3, 1))));
  const turn = p.turn ?? 28;

  const edge = (o: number): React.CSSProperties => ({ boxShadow: `inset 0 0 0 2px rgba(255,255,255,${o.toFixed(3)})` });
  const sheen = (o: number) => (
    <div style={{ position: "absolute", inset: 0, opacity: o, background: "linear-gradient(125deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.08))" }} />
  );
  const plane = (z: number, children: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{ position: "absolute", inset: 0, transform: `translateZ(${(z * ex).toFixed(2)}px)`, ...style }}>{children}</div>
  );

  // the waveform strip: 44 bars, the newest on the right is the voice now
  const bars = 44;
  const now = from + f;
  const stripW = 760;
  const bw = stripW / bars;
  const strip = Array.from({ length: bars }, (_, i) => {
    const v = p.levels[Math.max(0, Math.min(p.levels.length - 1, now - (bars - 1 - i)))] ?? 0;
    const h = 8 + v * 92;
    return <div key={i} style={{ position: "absolute", left: i * bw + bw * 0.22, top: 70 - h / 2, width: bw * 0.56, height: h, borderRadius: bw, background: i % 2 ? "#FFFFFF" : RED, opacity: 0.4 + 0.6 * (i / bars) }} />;
  });

  const words = p.title.map((w, i) => {
    const a = k(f, p.wordAt[i] ?? 0, (p.wordAt[i] ?? 0) + 4, OUT);
    return (
      <span key={i} style={{ display: "inline-block", marginRight: "0.24em", opacity: a, transform: `translateY(${((1 - a) * 26).toFixed(1)}px)`, filter: `blur(${((1 - a) * 8).toFixed(2)}px)` }}>{w}</span>
    );
  });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 45%, #2A1215 0%, #140A0B 55%, #070405 100%)", overflow: "hidden" }}>
      {audio}
      <AbsoluteFill style={{ perspective: 2600, perspectiveOrigin: "50% 46%" }}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d",
          transform: `scale(${s.toFixed(4)}) rotateX(${(-7 * ex).toFixed(3)}deg) rotateY(${(turn * ex).toFixed(3)}deg)` }}>
          {/* ground: the room's light */}
          {plane(-560, <><div style={framedStyle(W, H, p.frame)}>{clipVideo("blur(26px) brightness(0.5) saturate(1.2)")}</div>{sheen(ex)}</>, { overflow: "hidden", ...edge(0.75 * ex), opacity: mix(0, 1, Math.min(1, ex * 3)) })}
          {/* footage */}
          {plane(-220, <><div style={framedStyle(W, H, p.frame)}>{clipVideo()}</div><div style={{ position: "absolute", inset: 0, ...edge(0.9) }} /></>, { overflow: "hidden" })}
          {/* person */}
          {plane(170, <><div style={framedStyle(W, H, p.frame)}><OffthreadVideo src={staticFile(p.person)} startFrom={from} muted transparent style={{ width: W, height: H }} /></div><div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${(0.035 * ex).toFixed(3)})`, ...edge(0.8 * ex) }} />{sheen(ex)}</>, { overflow: "hidden" })}
          {/* title */}
          {plane(440, <>
            <div style={{ position: "absolute", left: 60, right: 60, top: 230, textAlign: "center", fontFamily: DMSERIF, fontSize: 132, lineHeight: 1.02, color: "#FFFFFF", letterSpacing: "-0.01em",
              textShadow: "0 6px 30px rgba(0,0,0,0.45)" }}>{words}</div>
            <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${(0.03 * ex).toFixed(3)})`, ...edge(0.8 * ex) }} />{sheen(ex)}
          </>)}
          {/* waveform strip */}
          {plane(660, (
            <div style={{ position: "absolute", left: (W - stripW - 40) / 2, top: H - 330, width: stripW + 40, height: 140, borderRadius: 26, background: "rgba(20,10,12,0.55)",
              boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.85), 0 20px 40px rgba(0,0,0,0.35)", opacity: k(f, p.at + 3, p.at + 9) }}>
              <div style={{ position: "absolute", left: 20, top: 0, width: stripW, height: 140 }}>
                <div style={{ position: "absolute", left: 0, right: 0, top: 69, height: 2, background: "rgba(255,255,255,0.35)" }} />
                {strip}
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
      {sfx}
    </AbsoluteFill>
  );
};
