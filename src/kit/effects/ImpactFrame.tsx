/**
 * Impact frame (2026-11-15, effect 17 of Skill Stack Store's "20 Claude Effects in 20 Secs" reel, 20.5 to 21.1 s, stepped
 * frame by frame; facts in films/effects-skillstack/facts.md). What the reel does: a hard cut to a two-tone threshold
 * portrait (black and white, posterised) on white, radial manga speed lines behind him, a huge condensed black word
 * across the bottom IN FRONT of him, a slight shake. About 0.6 s, then a hard cut back.
 *
 * Ours, as a manga impact panel: the first 2 frames print inverted (white on black), the classic impact flash; then
 * the cutout is screened through InkScreen with a hard tone curve, so the shadows go solid, the lights go to paper and
 * only the mid tones become screentone dots. The speed lines are seeded wedges aimed at `focus` that redraw every 2
 * frames (the boil of hand-drawn lines). An ink keyline and a white silhouette under the print keeps the lines off his body. The word
 * (Anton, condensed) slams from 135% in 3 frames with a white keyline. The shake starts at 18 px and settles to 3 px.
 *
 *   <ImpactFrame clip="x/clip.mp4" person="x/person.webm" at={32} word="Special"
 *     portrait={{ zoom: 1.45, bottom: 1300 }} focus={{ x: 500, y: 860 }} />
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { OUT, Sfx, k, mix } from "./shared";
import { Framing, InkScreen, framedPoint, framedStyle, rng } from "./InkScreen";

const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });

export type ImpactFrameProps = {
  clip: string;
  person: string;
  startFrom?: number;
  /** Framing of the footage before and after. */
  frame?: Framing;
  /** Framing of the impact portrait (usually tighter). */
  portrait: Framing;
  /** Clip point the speed lines aim at (the face). */
  focus: { x: number; y: number };
  /** Frame of the hard cut in, and how long the panel holds (the reel: about 18). */
  at: number;
  frames?: number;
  word: string;
  ink?: string;
  paper?: string;
  /** The two inverted flash frames at the start. */
  flash?: boolean;
  sound?: boolean;
};

export const ImpactFrame: React.FC<ImpactFrameProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const frames = p.frames ?? 18;
  const ink = p.ink ?? "#0E0D0D";
  const paper = p.paper ?? "#FBFAF7";
  const on = f >= p.at && f < p.at + frames;
  const t = f - p.at;

  const audio = <Audio src={staticFile(p.clip)} trimBefore={p.startFrom || undefined} />;
  const sfx = (
    <>
      <Sfx at={p.at} name="bass-hit-short" volume={0.7} on={p.sound ?? true} />
      <Sfx at={p.at} name="hit-weak" volume={0.45} on={p.sound ?? true} />
    </>
  );
  if (!on) {
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        {audio}
        <div style={framedStyle(W, H, p.frame)}>
          <OffthreadVideo src={staticFile(p.clip)} startFrom={p.startFrom ?? 0} muted style={{ width: W, height: H }} />
        </div>
        {sfx}
      </AbsoluteFill>
    );
  }

  // the shake: big on the hit, settling to a tremor; a new offset every frame from a seed
  const r = rng(f * 13 + 5);
  const amp = mix(18, 3, k(t, 0, 8));
  const sx = (r() - 0.5) * 2 * amp;
  const sy = (r() - 0.5) * 2 * amp;

  // speed lines: redrawn every 2 frames
  const c = framedPoint(W, H, p.portrait, p.focus.x, p.focus.y);
  const lr = rng(Math.floor(t / 2) * 7 + 3);
  const n = 120;
  const outer = H * 1.4;
  const wedges: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (lr() - 0.5) * 0.05;
    const inner = H * (0.26 + lr() * 0.16);
    const half = (3 + lr() * lr() * 22) / 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const tip = { x: c.x + ca * inner, y: c.y + sa * inner };
    const b = { x: c.x + ca * outer, y: c.y + sa * outer };
    wedges.push(`M ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} L ${(b.x - sa * half * 6).toFixed(1)} ${(b.y + ca * half * 6).toFixed(1)} L ${(b.x + sa * half * 6).toFixed(1)} ${(b.y - ca * half * 6).toFixed(1)} Z`);
  }

  // the word: slams from 135% in 3 frames
  const slam = k(t, 0, 3, OUT);
  const size = Math.min(400, (W - 70) / (p.word.length * 0.46));
  const key = 9;
  const keyline = [0, 45, 90, 135, 180, 225, 270, 315].map((d) => `${(Math.cos((d * Math.PI) / 180) * key).toFixed(1)}px ${(Math.sin((d * Math.PI) / 180) * key).toFixed(1)}px 0 ${paper}`).join(", ");
  const flash = (p.flash ?? true) && t < 2;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {audio}
      <AbsoluteFill style={{ background: paper, overflow: "hidden", filter: flash ? "invert(1)" : undefined }}>
        <AbsoluteFill style={{ transform: `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(1.04)` }}>
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <path d={wedges.join(" ")} fill={ink} />
          </svg>
          {/* an ink keyline round him (his alpha grown 3 px), then a white silhouette, so the lines stop at his edge */}
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <filter id="impact-keyline" x="-5%" y="-5%" width="110%" height="110%">
              <feMorphology in="SourceAlpha" operator="dilate" radius={3 / p.portrait.zoom} result="grown" />
              <feFlood floodColor={ink} />
              <feComposite in2="grown" operator="in" />
            </filter>
          </svg>
          <div style={framedStyle(W, H, p.portrait)}>
            <OffthreadVideo src={staticFile(p.person)} startFrom={p.startFrom ?? 0} muted transparent style={{ width: W, height: H, filter: "url(#impact-keyline)" }} />
          </div>
          <div style={framedStyle(W, H, p.portrait)}>
            <OffthreadVideo src={staticFile(p.person)} startFrom={p.startFrom ?? 0} muted transparent style={{ width: W, height: H, filter: "brightness(0) invert(1)" }} />
          </div>
          <div style={{ position: "absolute", inset: 0 }}>
            <InkScreen id="impact-print" src={p.person} transparent paper={1} startFrom={p.startFrom} width={W} height={H}
              place={{ x: (p.portrait.focusX ?? W / 2), y: p.portrait.bottom - H / 2 / p.portrait.zoom, zoom: p.portrait.zoom }}
              pattern="dots" cell={8} angle={45} ink={ink} contrast={2.3} brightness={1.12} edge={12} />
          </div>
        </AbsoluteFill>
        <div style={{ position: "absolute", left: 0, width: W, bottom: 70, textAlign: "center", fontFamily: ANTON, fontSize: size, lineHeight: 1,
          color: ink, textTransform: "uppercase", letterSpacing: "-0.01em", textShadow: keyline, whiteSpace: "nowrap",
          transform: `translate(${(sx * 0.4).toFixed(1)}px, ${(sy * 0.4).toFixed(1)}px) rotate(-3deg) scale(${mix(1.35, 1, slam).toFixed(4)})`, transformOrigin: "50% 80%" }}>
          {p.word}
        </div>
      </AbsoluteFill>
      {sfx}
    </AbsoluteFill>
  );
};
