/**
 * Arc words (2026-11-18, ours, after Shaan Johari's reel "I filmed this. Claude edited it." instagram.com/reel/Df4TGYjEZLu,
 * 2.5 to 3.6 s, "how are these words going", stepped at 0.25 s and 0.05 s; nothing behind it was bought or seen). What
 * the reel does: the words of the spoken line enter one by one, each out of a blur, on an arc that wraps round the head
 * at about eye to crown height. The newest word lands at the front, the older ones travel round over the head toward
 * the back, getting smaller and softer, and the ones on the far side pass BEHIND the head (the cutout covers them).
 * Mixed faces: a light serif italic and a bold sans, about 60 to 90 px.
 *
 * Ours: the words ride a ring in 3D centred on the head (`head`, `radius` in clip px; put the centre a little above the
 * eyes), its far side tipped up by `tilt` (default 30 degrees), so the ring reads as an arch over the head and a word at
 * the back sits on the top of the head, which hides part of it. A word lands on its exact first frame at `land`
 * (default -24 degrees: front right, beside the face, never on it), out of a 14 px blur in 5 frames and down from 112%;
 * words said together land 3 frames apart. Every later word pushes the ring round by `step` (default 40 degrees) over
 * 9 frames on a strong ease out, starting 3 frames before it lands so its spot is clear, and the ring drifts `spin`
 * degrees a second (default 5) so nothing is ever still. Depth sets the
 * size (80% far to 120% near), a far blur up to 3.5 px and a dim to 65%. A word changes layer at the sides of the ring,
 * out beside the head, so the switch never shows. Past `fadeAfter` degrees (default 200) a word fades over 25 degrees;
 * `exitAt` blurs them all out in 5 frames. Front words are faded to a trace if they would overlap `face`. Faces:
 * Instrument Serif italic 400 at 92 px and Inter 700 at 66 px (both in the kit), every third word serif unless `faces`
 * says otherwise. White with a soft shadow, words exactly as captioned. Renders headless; no backdrop-filter.
 *
 * A handheld shot moves the head, so `follow` takes the clip's face track (track.json) and the ring centre and the face
 * guard ride it (then `head` and `face` are offsets from the tracked face centre).
 *
 * Props: `clip`, `person`, `from`, `frame`, plus the ArcSpec: `words`, `range` (inclusive indices into the clip's
 * captions), `head`, `radius`, `tilt`, `land`, `step`, `spin`, `face`, `faces`, `sizes`, `ink`, `fadeAfter`, `exitAt`,
 * `follow`.
 * `ArcWordsLayer` is one half (back or front) with no footage, to stack with other parts on one person.
 *
 *   <ArcWords clip="x/clip.mp4" person="x/person.webm" frame={{ zoom: 1.12, bottom: 1714 }}
 *     words={words} range={[11, 16]} head={{ x: 500, y: 700 }} radius={300} face={{ x: 500, y: 800, rx: 105, ry: 140 }} />
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSerif";
import { INTER } from "../parts";
import { IN, OUT, Sfx, k, mix } from "./shared";
import { Framing, framingOf } from "./frameGrab";
import type { CaptionWord } from "./CommentDrop";
import { framedStyle } from "./MatteReveal";

const { fontFamily: INSTRUMENT } = loadInstrument("italic", { weights: ["400"], subsets: ["latin"] });

export type ArcFace = "serif" | "sans";
/** A face track (the studio's track.json: `rate` samples a second, each the face box centre and size in clip px). */
export type FaceTrack = { rate: number; samples: { t: number; x: number; y: number; w?: number; h?: number }[] };

/** The tracked face centre at clip time t (seconds), linear between samples. */
export const trackAt = (track: FaceTrack, t: number) => {
  const s = track.samples;
  const i = Math.max(0, Math.min(s.length - 2, Math.floor(t * track.rate)));
  const a = s[i];
  const b = s[i + 1] ?? a;
  const u = Math.max(0, Math.min(1, (t - a.t) / Math.max(1e-6, b.t - a.t)));
  return { x: mix(a.x, b.x, u), y: mix(a.y, b.y, u) };
};

export type ArcSpec = {
  words: CaptionWord[];
  range: [number, number];
  /** Ring centre and radius, clip px. */
  head: { x: number; y: number };
  radius: number;
  tilt?: number;
  land?: number;
  step?: number;
  spin?: number;
  face?: { x: number; y: number; rx: number; ry: number };
  faces?: ArcFace[];
  sizes?: { serif: number; sans: number };
  ink?: string;
  fadeAfter?: number;
  exitAt?: number;
  /** A face track: when given, `head` and `face` are offsets from the tracked face centre, so the ring rides a moving
   * camera or a moving person. */
  follow?: FaceTrack;
};

type Placed = { i: number; text: string; face: ArcFace; x: number; y: number; z: number; size: number; rot: number; blur: number; alpha: number };

const rad = (d: number) => (d * Math.PI) / 180;

/** Every visible word's place at frame f (composition frames; `from` = clip frames trimmed). */
export const arcPlaces = (f: number, fps: number, W: number, H: number, s: ArcSpec, frame: Framing | undefined, from: number): Placed[] => {
  const { zoom, tx, ty } = framingOf(W, H, frame);
  const o = s.follow ? trackAt(s.follow, (f + from) / fps) : { x: 0, y: 0 };
  const cx = tx + (o.x + s.head.x) * zoom;
  const cy = ty + (o.y + s.head.y) * zoom;
  const R = s.radius * zoom;
  const tilt = rad(s.tilt ?? 30);
  const land = s.land ?? -24;
  const step = s.step ?? 40;
  const spin = s.spin ?? 5;
  const fadeAfter = s.fadeAfter ?? 200;
  const sizes = s.sizes ?? { serif: 92, sans: 66 };
  const face = s.face ? { x: tx + (o.x + s.face.x) * zoom, y: ty + (o.y + s.face.y) * zoom, rx: s.face.rx * zoom, ry: s.face.ry * zoom } : null;
  const exit = s.exitAt === undefined ? 0 : k(f, s.exitAt, s.exitAt + 5, IN);
  const idx: number[] = [];
  for (let i = s.range[0]; i <= s.range[1]; i++) idx.push(i);
  // words said together (the same start) land 3 frames apart, never earlier than said
  const lands: number[] = [];
  idx.forEach((i, n) => lands.push(Math.max(s.words[i].start * fps - from, n ? lands[n - 1] + 3 : -Infinity)));
  const out: Placed[] = [];
  idx.forEach((wi, n) => {
    const L = lands[n];
    if (f < L) return;
    let phi = land + (spin * (f - L)) / fps;
    // each later word pushes the ring round, starting 3 frames before it lands so the spot is clear
    for (let m = n + 1; m < idx.length; m++) phi += step * k(f, lands[m] - 3, lands[m] + 6, OUT);
    if (phi > fadeAfter + 25) return;
    const p = rad(phi);
    // phi 0 = right side of the head, 90 = straight behind, 180 = left side; z > 0 is near the camera
    const z = -Math.sin(p);
    const persp = 1 + 0.12 * z;
    const x = cx + R * Math.cos(p) * persp;
    const y = cy + R * z * Math.sin(tilt) * persp;
    const faceKind: ArcFace = s.faces?.[n] ?? (n % 3 === 1 ? "serif" : "sans");
    const inT = k(f, L, L + 5, OUT);
    const size = sizes[faceKind] * (1 + 0.2 * z) * mix(1.12, 1, inT);
    let alpha = Math.min(1, (f - L + 1) / 2) * mix(1, 0.65, Math.max(0, -z)) * (1 - k(phi, fadeAfter, fadeAfter + 25, (t) => t)) * (1 - exit);
    if (face && z >= 0) {
      const halfW = (s.words[wi].w.length * size * (faceKind === "serif" ? 0.42 : 0.55)) / 2;
      const nx = Math.max(0, Math.abs(x - face.x) - halfW) / face.rx;
      const ny = Math.max(0, Math.abs(y - face.y) - size * 0.4) / face.ry;
      const d = nx * nx + ny * ny;
      if (d < 1) alpha *= 0.15;
    }
    const blur = (1 - inT) * 14 + Math.max(0, -z) * 3.5 + exit * 10;
    out.push({ i: n, text: s.words[wi].w, face: faceKind, x, y, z, size, rot: -14 * Math.cos(p), blur, alpha });
  });
  return out;
};

export const ArcWordsLayer: React.FC<{ half: "back" | "front"; spec: ArcSpec; frame?: Framing; from?: number }> = ({ half, spec, frame, from = 0 }) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const placed = arcPlaces(f, fps, W, H, spec, frame, from).filter((w) => (half === "front" ? w.z >= 0 : w.z < 0)).sort((a, b) => a.z - b.z);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {placed.map((w) =>
        w.alpha <= 0.003 ? null : (
          <div key={w.i} style={{
            position: "absolute", left: w.x, top: w.y, whiteSpace: "nowrap", color: spec.ink ?? "#FFFFFF",
            transform: `translate(-50%, -50%) rotate(${w.rot.toFixed(2)}deg)`, opacity: w.alpha,
            fontFamily: w.face === "serif" ? INSTRUMENT : INTER, fontStyle: w.face === "serif" ? "italic" : "normal",
            fontWeight: w.face === "serif" ? 400 : 700, fontSize: w.size, lineHeight: 1, letterSpacing: w.face === "serif" ? "0" : "-0.02em",
            filter: w.blur > 0.05 ? `blur(${w.blur.toFixed(2)}px)` : undefined,
            textShadow: "0 4px 22px rgba(0,0,0,0.4)",
          }}>
            {w.text}
          </div>
        ),
      )}
    </AbsoluteFill>
  );
};

export type ArcWordsProps = ArcSpec & {
  clip: string;
  person: string;
  from?: number;
  frame?: Framing;
  volume?: number;
  sound?: boolean;
};

export const ArcWords: React.FC<ArcWordsProps> = (p) => {
  const { width: W, height: H, fps } = useVideoConfig();
  const from = p.from ?? 0;
  const lands: number[] = [];
  for (let i = p.range[0]; i <= p.range[1]; i++) lands.push(Math.round(p.words[i].start * fps - from));
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={framedStyle(W, H, p.frame)}>
        <OffthreadVideo src={staticFile(p.clip)} startFrom={from} volume={p.volume ?? 1} style={{ width: W, height: H }} />
      </div>
      <ArcWordsLayer half="back" spec={p} frame={p.frame} from={from} />
      <div style={framedStyle(W, H, p.frame)}>
        <OffthreadVideo src={staticFile(p.person)} startFrom={from} muted transparent style={{ width: W, height: H }} />
      </div>
      <ArcWordsLayer half="front" spec={p} frame={p.frame} from={from} />
      {lands.map((at, i) => (
        <Sfx key={i} at={at} name="typewriter-hit-soft" volume={0.12} on={p.sound ?? true} />
      ))}
    </AbsoluteFill>
  );
};
