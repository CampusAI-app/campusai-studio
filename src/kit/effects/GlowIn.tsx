/**
 * Glow in (2026-11-18, ours, after Shaan Johari's reel "I filmed this. Claude edited it." instagram.com/reel/Df4TGYjEZLu,
 * 2.05 to 2.50 s, stepped at 0.05 s; nothing behind it was bought or seen). What the reel does: a hard cut to a new shot
 * at 2.15 s; the person first appears as a solid white silhouette with a soft outer glow (2.20), is half white at 2.25
 * and is the real person by 2.30, so about 3 frames from white to real. An italic serif word ("Wait,") is already in the
 * top left on the cut frame, blurred, and sharp two frames later.
 *
 * Ours: on the cut frame (`at`) the cutout is drawn pure white over the footage with two soft glows (14 and 42 px,
 * `glow` scales them), held `white` frames (default 2), then it fades out over `fade` frames (default 3), the glow
 * shrinking with it, so the real person shows through. The reel's shot has no person on its very first frame (a clean
 * plate we never have), so ours starts white on frame one. Before `at` the previous shot plays (`prev`: another framing
 * of the same take by default, the lane's rule for punch-ins, or another clip). The word comes from the clip's
 * captions.json (`word.range`), sits in the top left from the cut, out of a 12 px blur in 2 frames, and leaves out of
 * focus over 4 frames at `word.outAt`. DM Serif Display italic (in the kit), white. Renders headless; no backdrop-filter.
 *
 * Props: `clip`, `person`, `from`, `frame`, `at`, `prev` ({ clip?, from?, frame? }), `white`, `fade`, `glow`, `word`
 * ({ words, range, at, size, outAt }), `volume`, `sound`. `GlowInLayer` is the white silhouette and the word alone, to
 * put over footage another part draws.
 *
 *   <GlowIn clip="x/clip.mp4" person="x/person.webm" frame={{ zoom: 1.12, bottom: 1714 }} at={30}
 *     prev={{ frame: { zoom: 1.25, bottom: 1650 } }} word={{ words, range: [10, 10], at: { x: 80, y: 300 } }} />
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { IN, OUT, Sfx, k } from "./shared";
import type { Framing } from "./frameGrab";
import type { CaptionWord } from "./CommentDrop";
import { DMSERIF, Silhouette, framedStyle } from "./MatteReveal";

export type GlowWord = {
  words: CaptionWord[];
  range: [number, number];
  /** Frame px of the word's top-left. */
  at: { x: number; y: number };
  size?: number;
  outAt?: number;
};

export type GlowInSpec = {
  at: number;
  white?: number;
  fade?: number;
  glow?: number;
  word?: GlowWord;
};

/** How white the silhouette is at frame f: 1 on the cut and `white` frames, then down to 0 over `fade`. */
export const glowWhite = (f: number, s: GlowInSpec) => {
  if (f < s.at) return 0;
  const hold = s.at + (s.white ?? 2);
  return 1 - k(f, hold - 1, hold - 1 + (s.fade ?? 3), (t) => t);
};

export const GlowWordLayer: React.FC<{ word: GlowWord; at: number }> = ({ word, at }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const inT = k(f, at, at + 2, OUT);
  const out = word.outAt === undefined ? 0 : k(f, word.outAt, word.outAt + 4, IN);
  if (out >= 1) return null;
  const text = word.words.slice(word.range[0], word.range[1] + 1).map((w) => w.w).join(" ");
  const blur = (1 - inT) * 12 + out * 10;
  return (
    <div style={{
      position: "absolute", left: word.at.x, top: word.at.y, whiteSpace: "nowrap", color: "#FFFFFF",
      fontFamily: DMSERIF, fontStyle: "italic", fontWeight: 400, fontSize: word.size ?? 112, lineHeight: 1,
      opacity: Math.min(1, 0.75 + inT) * (1 - out), filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
      transform: `scale(${(1.06 - 0.06 * inT + 0.04 * out).toFixed(4)})`, transformOrigin: "0 50%",
      textShadow: "0 4px 30px rgba(0,0,0,0.55)",
    }}>
      {text}
    </div>
  );
};

export const GlowInLayer: React.FC<{ person: string; from?: number; frame?: Framing; spec: GlowInSpec }> = ({ person, from = 0, frame, spec }) => {
  const f = useCurrentFrame();
  const w = glowWhite(f, spec);
  const g = spec.glow ?? 1;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {w > 0.001 ? (
        <AbsoluteFill style={{ opacity: w }}>
          <Silhouette person={person} from={from} frame={frame} ink="white"
            extra={`drop-shadow(0 0 ${(14 * g * (0.5 + 0.5 * w)).toFixed(1)}px rgba(255,255,255,0.95)) drop-shadow(0 0 ${(42 * g * (0.5 + 0.5 * w)).toFixed(1)}px rgba(255,248,236,0.8))`} />
        </AbsoluteFill>
      ) : null}
      {spec.word ? <GlowWordLayer word={spec.word} at={spec.at} /> : null}
    </AbsoluteFill>
  );
};

export type GlowInProps = GlowInSpec & {
  clip: string;
  person: string;
  from?: number;
  frame?: Framing;
  prev?: { clip?: string; from?: number; frame?: Framing };
  volume?: number;
  sound?: boolean;
};

export const GlowIn: React.FC<GlowInProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const from = p.from ?? 0;
  const prevClip = p.prev?.clip;
  const before = f < p.at;
  // the previous shot: the same take in another framing (one video, so the sound never jumps) or another clip
  const frame = before && p.prev ? p.prev.frame ?? p.frame : p.frame;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {prevClip && before ? (
        <div style={framedStyle(W, H, p.prev?.frame)}>
          <OffthreadVideo src={staticFile(prevClip)} startFrom={p.prev?.from ?? 0} volume={p.volume ?? 1} style={{ width: W, height: H }} />
        </div>
      ) : null}
      <div style={{ ...framedStyle(W, H, frame), opacity: prevClip && before ? 0 : 1 }}>
        <OffthreadVideo src={staticFile(p.clip)} startFrom={from} volume={prevClip && before ? 0 : p.volume ?? 1} style={{ width: W, height: H }} />
      </div>
      <GlowInLayer person={p.person} from={from} frame={p.frame} spec={p} />
      <Sfx at={p.at} name="transition-soft" volume={0.35} on={p.sound ?? true} />
    </AbsoluteFill>
  );
};
