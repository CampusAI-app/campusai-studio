/**
 * Matte reveal (2026-11-18, ours, after Shaan Johari's reel "I filmed this. Claude edited it." instagram.com/reel/Df4TGYjEZLu,
 * stepped frame by frame at 0.25 s and 0.05 s; nothing behind it was bought or seen). What the reel does, twice:
 * 1. "show your work", 0.80 to 1.00 s: a hard cut from the footage (and a punch in) to the cutout drawn as a flat
 *    silhouette, a black person on a cream ground (about #EFE9DF) with two or three wide soft brown and tan arcs sweeping
 *    behind them, an italic serif lead line ("tracking my") over a wide heavy condensed caps word ("FACE"). It holds about
 *    0.5 s, then ONE inverted frame (navy ground, white silhouette, light blue arcs, white type) as a flash at 1.00 s, then
 *    a hard cut back to the footage at 1.05 s.
 * 2. 3.65 to 3.70 s: one frame of a white silhouette on black, one frame black on white, then it holds black on white
 *    while the next title builds (that hold is RibbonWrap's).
 *
 * Ours: the silhouette is the person cutout (VP9 alpha webm) through a CSS filter, so it has the cutout's exact edge and
 * can keep a trace of the clothing (`detail`, the reel's black silhouette still shows the stars on his sleeve). Layer
 * order: ground, arcs, the `behind` slot, the silhouette, the title, the `front` slot. Three looks (`mode`): "cream"
 * (black on #EFE9DF with arcs #9C6B3E, #C9A27A, #B07E4E), "black-on-white" (#F4F2EE) and "white-on-black" (#08090C).
 * Inverted: cream flips to navy #0E1A33 with white and arcs #8DB3EA, #CADCF6, #5F8FD8; the other two swap. The arcs
 * are wide (44 to 64 px) soft ellipse strokes that turn about 4 degrees a second so a hold is never a freeze.
 * Timing in frames: `flashIn` inverted frames at `at` (default 0), then `hold` frames of the look (default 15, the reel's
 * 0.5 s), then `flashOut` inverted frames (default 1), then a hard cut back to the footage (or nothing, `back: false`, so
 * the next part can take over). The title shows on every matte frame after `flashIn` and inverts with the flash.
 * Words come only from the clip's captions.json (`title.words`, index ranges); the lead line is said already when the
 * matte cuts in, so it is all there on the first frame, as in the reel. Faces: DM Serif Display italic for the
 * lead, Anton for the caps word (both already in the kit). Renders headless; no backdrop-filter.
 *
 * Framing: the silhouette must fill the bottom of the frame, so give the matte its own tighter framing (`matteFrame`)
 * that pushes the cutout's ragged bottom edge off frame; the reel punches in for its matte too.
 *
 * Props: `clip`, `person`, `from`, `frame` (footage), `matteFrame`, `at`, `hold`, `flashIn`, `flashOut`, `mode`, `arcs`,
 * `detail`, `title` (MatteTitleSpec), `back`, `behind`, `front`, `volume`, `sound`. `MatteLayer` is the look alone (no
 * timing, no footage), to build other beats on.
 *
 *   <MatteReveal clip="x/clip.mp4" person="x/person.webm" frame={{ zoom: 1.25, bottom: 1650 }}
 *     matteFrame={{ zoom: 1.7, bottom: 1330 }} at={80} hold={18} mode="cream"
 *     title={{ words, lead: [5, 8], word: [9, 9], at: { x: 84, y: 300 } }} />
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadDMSerif } from "@remotion/google-fonts/DMSerifDisplay";
import { Sfx } from "./shared";
import { Framing, framingOf } from "./frameGrab";
import type { CaptionWord } from "./CommentDrop";

const { fontFamily: ANTON } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
export const { fontFamily: DMSERIF } = loadDMSerif("italic", { weights: ["400"], subsets: ["latin"] });

export type MatteMode = "cream" | "black-on-white" | "white-on-black";
type Look = { ground: string; ink: "black" | "white"; text: string; arcs: string[] };

const LOOK: Record<MatteMode, Look> = {
  cream: { ground: "#EFE9DF", ink: "black", text: "#15120F", arcs: ["#9C6B3E", "#C9A27A", "#B07E4E"] },
  "black-on-white": { ground: "#F4F2EE", ink: "black", text: "#15120F", arcs: ["#9C6B3E", "#C9A27A", "#B07E4E"] },
  "white-on-black": { ground: "#08090C", ink: "white", text: "#F4F2EE", arcs: ["#5F8FD8", "#8DB3EA", "#3E6CB8"] },
};
const INVERTED: Record<MatteMode, Look> = {
  cream: { ground: "#0E1A33", ink: "white", text: "#F4F6FB", arcs: ["#8DB3EA", "#CADCF6", "#5F8FD8"] },
  "black-on-white": LOOK["white-on-black"],
  "white-on-black": LOOK["black-on-white"],
};
export const matteLook = (mode: MatteMode, inverted = false): Look => (inverted ? INVERTED[mode] : LOOK[mode]);

/** The framed transform every person effect uses. */
export const framedStyle = (W: number, H: number, frame?: Framing): React.CSSProperties => {
  const { zoom, tx, ty } = framingOf(W, H, frame);
  return { position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` };
};

/** The cutout as a flat silhouette. `detail` 0 is pure ink; above 0 a trace of the clothing shows through the black. */
export const Silhouette: React.FC<{ person: string; from?: number; frame?: Framing; ink: "black" | "white"; detail?: number; extra?: string }> = ({
  person, from = 0, frame, ink, detail = 0, extra = "",
}) => {
  const { width: W, height: H } = useVideoConfig();
  const filter =
    ink === "white"
      ? `brightness(0) invert(1)`
      : detail > 0
        ? `grayscale(1) brightness(${(0.8 * detail).toFixed(3)}) contrast(1.5)`
        : `brightness(0)`;
  return (
    <div style={{ ...framedStyle(W, H, frame), filter: `${filter} ${extra}`.trim() }}>
      <OffthreadVideo src={staticFile(person)} startFrom={from} muted transparent style={{ width: W, height: H }} />
    </div>
  );
};

/** Two or three wide soft arcs (ellipse strokes) behind the person, turning slowly. */
const Arcs: React.FC<{ colors: string[]; f: number }> = ({ colors, f }) => {
  const { width: W, height: H, fps } = useVideoConfig();
  const turn = (4 * f) / fps;
  const arcs = [
    { cx: 1.02 * W, cy: 0.3 * H, rx: 0.66 * W, ry: 0.5 * W, rot: -18 + turn, w: 64, o: 0.9 },
    { cx: -0.12 * W, cy: 0.06 * H, rx: 0.8 * W, ry: 0.58 * W, rot: 24 - turn * 0.7, w: 44, o: 0.75 },
    { cx: 0.62 * W, cy: 0.98 * H, rx: 1.05 * W, ry: 0.5 * W, rot: -8 + turn * 0.5, w: 56, o: 0.8 },
  ];
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, filter: "blur(2.4px)" }}>
      {arcs.slice(0, colors.length).map((a, i) => (
        <ellipse key={i} cx={a.cx} cy={a.cy} rx={a.rx} ry={a.ry} fill="none" stroke={colors[i]} strokeWidth={a.w} strokeLinecap="round"
          opacity={a.o} transform={`rotate(${a.rot.toFixed(2)} ${a.cx} ${a.cy})`} />
      ))}
    </svg>
  );
};

/** The look alone: ground, arcs, `behind`, the silhouette, `front`. No timing and no footage. */
export const MatteLayer: React.FC<{
  person: string;
  from?: number;
  frame?: Framing;
  mode: MatteMode;
  inverted?: boolean;
  arcs?: boolean;
  detail?: number;
  behind?: React.ReactNode;
  front?: React.ReactNode;
}> = ({ person, from = 0, frame, mode, inverted = false, arcs, detail, behind, front }) => {
  const f = useCurrentFrame();
  const look = matteLook(mode, inverted);
  const showArcs = arcs ?? mode === "cream";
  return (
    <AbsoluteFill style={{ background: look.ground, overflow: "hidden" }}>
      {showArcs ? <Arcs colors={look.arcs} f={f} /> : null}
      {behind}
      <Silhouette person={person} from={from} frame={frame} ink={look.ink} detail={look.ink === "black" ? (detail ?? 0.3) : 0} />
      {front}
    </AbsoluteFill>
  );
};

const strip = (w: string) => w.replace(/[.,!;:"]+$/g, "").replace(/^["]+/, "");

/** The reel's title: an italic serif lead line over one wide heavy condensed caps word. Frame px, top-left of the block. */
export type MatteTitleSpec = {
  words: CaptionWord[];
  lead?: [number, number];
  word?: [number, number];
  at: { x: number; y: number };
  align?: "left" | "center";
  leadSize?: number;
  size?: number;
};

export const MatteTitle: React.FC<{ spec: MatteTitleSpec; color: string }> = ({ spec, color }) => {
  const { width: W } = useVideoConfig();
  const leadSize = spec.leadSize ?? 74;
  const size = spec.size ?? 236;
  const lead = spec.lead ? spec.words.slice(spec.lead[0], spec.lead[1] + 1).map((w) => strip(w.w).toLowerCase()).join(" ") : "";
  const word = spec.word ? spec.words.slice(spec.word[0], spec.word[1] + 1).map((w) => strip(w.w)).join(" ").toUpperCase() : "";
  const center = spec.align === "center";
  const box: React.CSSProperties = center
    ? { position: "absolute", left: 0, width: W, textAlign: "center" }
    : { position: "absolute", left: spec.at.x, textAlign: "left" };
  return (
    <div style={{ ...box, top: spec.at.y, color, pointerEvents: "none" }}>
      {lead ? (
        <div style={{ fontFamily: DMSERIF, fontStyle: "italic", fontWeight: 400, fontSize: leadSize, lineHeight: 1, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
          {lead}
        </div>
      ) : null}
      {word ? (
        <div style={{ fontFamily: ANTON, fontWeight: 400, fontSize: size, lineHeight: 0.98, letterSpacing: "0.02em", whiteSpace: "nowrap", marginTop: leadSize * 0.12 }}>
          {word}
        </div>
      ) : null}
    </div>
  );
};

export type MatteRevealProps = {
  clip: string;
  person: string;
  from?: number;
  frame?: Framing;
  matteFrame?: Framing;
  at: number;
  hold?: number;
  flashIn?: number;
  flashOut?: number;
  mode?: MatteMode;
  arcs?: boolean;
  detail?: number;
  title?: MatteTitleSpec;
  /** After the matte: true cuts back to the footage, false leaves the frame empty for the next part. */
  back?: boolean;
  behind?: React.ReactNode;
  front?: React.ReactNode;
  volume?: number;
  sound?: boolean;
};

/** Which matte state a frame is in: null (footage), "in" / "out" (inverted flash) or "hold". */
export const matteState = (f: number, at: number, flashIn: number, hold: number, flashOut: number) => {
  if (f < at) return null;
  if (f < at + flashIn) return "in" as const;
  if (f < at + flashIn + hold) return "hold" as const;
  if (f < at + flashIn + hold + flashOut) return "out" as const;
  return null;
};

export const MatteReveal: React.FC<MatteRevealProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const from = p.from ?? 0;
  const mode = p.mode ?? "cream";
  const flashIn = p.flashIn ?? 0;
  const hold = p.hold ?? 15;
  const flashOut = p.flashOut ?? 1;
  const state = matteState(f, p.at, flashIn, hold, flashOut);
  const end = p.at + flashIn + hold + flashOut;
  const showFootage = state === null && (f < p.at || (p.back ?? true));
  const inverted = state === "in" || state === "out";
  const look = matteLook(mode, inverted);
  return (
    <AbsoluteFill style={{ background: showFootage || state ? "#000" : "transparent", overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: showFootage ? 1 : 0 }}>
        <div style={framedStyle(W, H, p.frame)}>
          <OffthreadVideo src={staticFile(p.clip)} startFrom={from} volume={p.volume ?? 1} style={{ width: W, height: H }} />
        </div>
      </AbsoluteFill>
      {state ? (
        <MatteLayer person={p.person} from={from} frame={p.matteFrame ?? p.frame} mode={mode} inverted={inverted} arcs={p.arcs} detail={p.detail}
          behind={p.behind}
          front={
            <>
              {p.title && state !== "in" ? <MatteTitle spec={p.title} color={look.text} /> : null}
              {p.front}
            </>
          }
        />
      ) : null}
      <Sfx at={p.at} name="switch-tap" volume={0.4} on={p.sound ?? true} />
      <Sfx at={end - Math.max(1, flashOut)} name="hit-weak" volume={0.35} on={(p.sound ?? true) && flashOut > 0} />
    </AbsoluteFill>
  );
};
