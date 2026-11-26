/**
 * Template: Laptop at night (2026-11-25), made from Feature Friday ("Everything in one place, all you need is your
 * laptop", src/trials/post-everything-laptop.tsx, which stays on Jacob's Mac).
 *
 * The look: a real laptop on a warm dark desk at night (kit LaptopRoom, lamp preset), a framed Testudo photo and a
 * Maryland mug behind it. Real pages, each with its mark on the corner, stack onto the glass one at a time, then the
 * pile collapses into one point that opens as the CampusAI dashboard. Captions build word by word at the top with one
 * red word. Then a run of beats: each puts one real capture on the glass and the camera pushes in until the thing the
 * caption names fills the width. The camera pulls back out to the room for the end card (the logo and one line).
 *
 * Everything that was wired to one film (the captures, the measured boxes, the narration, the caption words) is a prop
 * here, so a new film is a new JSON file: see `laptop-night.example.json` and `LaptopNightProps` below. Times are plain
 * film seconds, or seconds from the start of a beat, never frames.
 *
 * Render: three.js, so `--gl=angle`. The studio's public/ folder is huge on Jacob's Mac: render with the Node API and
 * `symlinkPublicDir: true` there (a plain `npx remotion render` copies public/ first).
 */
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { LaptopRoom, onScreen, roomPose } from "../kit/pass/stage/LaptopRoom";
import { cameraAt, type CamKey, type Vec3 } from "../four/real-laptop";
import { brand } from "../kit/brand";
import { PointerAt } from "../kit/Pointer";
import { LAUNCH_FONT } from "../kit/effects/PastelLaunch";
import { UmdOpen } from "../styles/UmdOpen";
import { pickBed } from "../system/sound/bed";

/* ================================================================== the props (what a teammate fills in) */

/** A box on a capture, in that capture's own pixels (open the image, read the corners). */
export type Box = { x: number; y: number; w: number; h: number };

/**
 * One caption line. Put `*` round the one word that turns red: "Upload your *transcript,*".
 * Either just the text, or the text with `at` (seconds: from the film's start for the opening lines, from the beat's
 * start for a beat's lines) and `pace` (seconds between words, to keep up with the voice; default `wordPace`).
 */
export type CaptionLine = string | { text: string; at?: number; pace?: number };

/** One page in the opening pile. */
export type PilePage = {
  /** The page capture, a path under public/ (a real page at desktop size, 1440 wide or a 2x capture of it). */
  image: string;
  /** What the page is, for whoever edits the JSON next ("Canvas", "Testudo"). Not drawn. */
  name?: string;
  /** The page's mark, a path under public/. It sits on the page's corner as an app-icon tile. Leave out for no mark. */
  mark?: string;
  /** How the mark sits in its tile: "fill" (the image is already a square icon), "logo" (a logo centred on white),
   *  "red" (a light logo on a red tile). Default "fill". */
  markStyle?: "fill" | "logo" | "red";
};

/** One beat after the opening: one caption (or a few), one capture on the glass, one camera move. */
export type Beat = {
  /** The capture on the glass, a path under public/. Same size as `captureSize`. If it is the same file as the beat
   *  before, the page stays and only the camera moves. */
  capture: string;
  /** The words for this beat. One line, or a few that follow each other in the same place. */
  caption: CaptionLine | CaptionLine[];
  /** What the camera looks at. A box (capture pixels): the camera pushes in until the box fills the frame's width.
   *  "screen": the whole screen. "laptop": back out to the whole laptop on the desk. Default "screen". */
  focus?: Box | "screen" | "laptop";
  /** How long the beat lasts, in seconds (about 1.2 to 2.8: a new beat every couple of seconds). */
  hold: number;
  /** Lift the focus box off the page with a red edge while the rest dims (the brief's cards in Feature Friday). */
  highlight?: boolean;
  /** A pointer press on the capture: `x`, `y` in capture pixels, `at` seconds from the beat's start (default 0.8). */
  click?: { x: number; y: number; at?: number };
  /** How a new capture arrives: "slide" (up from below), "dissolve" or "cut". Default "slide". */
  enter?: "slide" | "dissolve" | "cut";
};

/** One piece of narration audio. */
export type NarrationClip = {
  /** The audio file, a path under public/. */
  src: string;
  /** When it starts, in seconds: from the film's start, or from the start of `beat` if that is given. */
  at: number;
  /** Count `at` from: a beat's number (0 is the first beat), "reveal" (the moment the dashboard opens) or "end". */
  beat?: number | "reveal" | "end";
  /** Play only part of the file: from `from` to `to`, seconds within the file. Give `to` so the music ducks the right length. */
  from?: number;
  to?: number;
  /** Loudness, 1 is as recorded. */
  volume?: number;
};

export type LaptopNightProps = {
  /** The opening: pages pile up on the glass, then collapse into one point that opens as the dashboard. */
  opening: {
    /** The pages, in the order they land. About ten reads as "too many tabs". */
    pages: PilePage[];
    /** When the first page lands, and the seconds between pages. Default 0.3 and 0.3. */
    firstPageAt?: number;
    pageEvery?: number;
    /** The words over the pile, in order. The first one sits faint on frame 0 and lights up word by word. `at` is film
     *  seconds; left out, the lines spread evenly over the pile. */
    lines: CaptionLine[];
    /** Seconds when the pile collapses. Default: 1.5 s after the last page lands. */
    collapseAt?: number;
    /** The capture that opens out of the collapsed pile (the dashboard). Path under public/, same size as `captureSize`. */
    dashboard: string;
    /** The line said as the dashboard opens, "Meet *CampusAI.*". */
    reveal: string;
    /** Seconds the dashboard and that line hold before the first beat. Default 2.4 (long enough to read twice). */
    revealHold?: number;
  };
  /** The beats, in order. */
  beats: Beat[];
  /** The end card: the CampusAI logo and one plain line under it ("Made for Terps. Link in bio."). `at`: seconds after
   *  the last beat when the line's first word lands (default 0.5); `pace`: seconds between its words; `hold`: how long the
   *  end card stays (default 3.6). */
  end: { line: string; at?: number; pace?: number; hold?: number };
  /** The pixel size of every capture (pile pages excepted). Default 2880 x 1858 (a 1440 x 929 screen at 2x). */
  captureSize?: { width: number; height: number };
  /** The narrator. Leave out for a film with no voice. */
  narration?: NarrationClip[];
  /** The music bed, ducked under the narration. `track` is a name from public/sound/music (src/system/sound/tracks.ts).
   *  Leave out or null for no music (trial reels carry none: the song is picked on Instagram). Skipped if the file is missing. */
  music?: { track?: string; volume?: number } | null;
  /** Sound effects (pops on the pages, whooshes on the moves, a click on each press): a folder under public/ holding
   *  whoosh-air, sweep-air-transition, swoosh-quick, swoosh-slow, notification-bubble-pop, ui-popup-dry, ui-message-pop,
   *  ui-click-tone, bass-knock-sub (.mp3). Any file that is missing is skipped. Leave out for none. */
  effects?: { folder: string; volume?: number } | null;
  /** The things on the desk. `testudoPhoto`: a photo for the frame behind the laptop (left out: no frame). `mug`: the
   *  red Maryland mug, drawn in code (default true). */
  desk?: { testudoPhoto?: string; mug?: boolean };
  /** Seconds between caption words. Default 0.26 (about a narrator's pace). */
  wordPace?: number;
  /** Filled in by the template itself (calculateMetadata): the optional files that are not on this computer, so they are
   *  skipped instead of breaking the render. Leave it out of the JSON. */
  missing?: string[];
};

/* ================================================================== constants of the look */

const B = brand("campusai");
const RED = B.color.accent;
const ACCENT = "#e0465a"; // the trial reels' caption accent
const ARRIVE = [240, 150, 160];
const FONT = LAUNCH_FONT;
const CAP_SIZE = 66;
export const LN_FPS = 30;
export const LN_W = 1080;
export const LN_H = 1920;
export const LN45_H = 1350;
/** The mug's mark: the UMD M that ships with the repo. */
const UMD_M_PUBLIC = "styles/umd/umd-m.svg";

type Fmt = { W: number; H: number; aspect: number; tall: boolean; capY: number; endY: number; markY: number; tagCy: number; bigCy: number };
const FMT_916: Fmt = { W: LN_W, H: LN_H, aspect: LN_W / LN_H, tall: true, capY: 360, endY: 384, markY: 76, tagCy: 94, bigCy: 760 };
const FMT_45: Fmt = { W: LN_W, H: LN45_H, aspect: LN_W / LN45_H, tall: false, capY: 196, endY: 232, markY: 40, tagCy: 58, bigCy: 560 };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE = Easing.bezier(0.45, 0, 0.2, 1);
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const IN = Easing.bezier(0.55, 0, 0.85, 0.35);
const PUSH = Easing.bezier(0.6, 0, 0.1, 1);
const k = (f: number, a: number, b: number, from = 0, to = 1, easing: (t: number) => number = OUT) => interpolate(f, [a, b], [from, to], { ...clamp, easing });
const fr = (sec: number) => Math.round(sec * LN_FPS);
const src = (p: string) => (/^(https?:|data:|blob:)/.test(p) ? p : staticFile(p.replace(/^\/+/, "")));

const norm = (p: string) => p.replace(/^\/+/, "");
const isUrl = (p: string) => /^(https?:|data:|blob:)/.test(p);
/** Whether an optional file is on this computer (calculateMetadata probed it and listed it in `missing` if not). */
const hasFor = (p: LaptopNightProps) => (path: string) => !(p.missing ?? []).includes(norm(path));

/* ================================================================== the timeline (seconds), from the props */

type BeatT = Beat & { i: number; start: number; end: number; newPage: boolean };
type Timeline = { lands: number[]; collapse: number; open: number; b0: number; beats: BeatT[]; endAt: number; total: number };

const timeline = (p: LaptopNightProps): Timeline => {
  const o = p.opening;
  const first = o.firstPageAt ?? 0.3, every = o.pageEvery ?? 0.3;
  const lands = o.pages.map((_, i) => first + every * i);
  const collapse = o.collapseAt ?? (lands.length ? lands[lands.length - 1] : 0) + 1.5;
  const open = collapse + 0.4; // the dashboard opens out of the point 12 frames after the collapse starts
  const b0 = open + (o.revealHold ?? 2.4);
  let t = b0;
  let shown = o.dashboard;
  const beats = p.beats.map((b, i) => {
    const bt: BeatT = { ...b, i, start: t, end: t + b.hold, newPage: b.capture !== shown };
    shown = b.capture;
    t += b.hold;
    return bt;
  });
  const endAt = t;
  return { lands, collapse, open, b0, beats, endAt, total: endAt + (p.end.hold ?? 3.6) };
};

/** The film's length in frames, from its props. */
export const laptopNightFrames = (p: LaptopNightProps) => Math.max(1, fr(timeline(p).total));

/** The effects the template plays (files `<effects.folder>/<name>.mp3`). */
const FX_NAMES = ["whoosh-air", "sweep-air-transition", "swoosh-quick", "swoosh-slow", "notification-bubble-pop", "ui-popup-dry", "ui-message-pop", "ui-click-tone", "bass-knock-sub"];
const probe = async (path: string) => {
  if (isUrl(path)) return true;
  try { return (await fetch(staticFile(norm(path)), { method: "HEAD" })).ok; } catch { return false; }
};
/**
 * Works out the length from the props, and checks every file the film reads before the first frame renders.
 * Page captures are the film: if one is missing the render stops with a plain message saying which and how to make it.
 * Everything else is optional and skipped when missing (a teammate's Mac has none of the gitignored sound, voice or
 * photo files): narration, music and effects go silent, the desk photo is left out, the mug loses its M, a pile page
 * loses its mark. The UMD M tag (UmdOpen) already leaves itself out when its file is missing.
 */
export const calculateLaptopNightMetadata: CalculateMetadataFunction<LaptopNightProps> = async ({ props, compositionId }) => {
  const tl = timeline(props);
  const required = [...new Set([props.opening.dashboard, ...props.beats.map((b) => b.capture), ...props.opening.pages.map((pg) => pg.image)].map(norm))];
  const optional = new Set<string>();
  (props.narration ?? []).forEach((n) => optional.add(norm(n.src)));
  if (props.music) optional.add(norm(pickBed(compositionId, tl.total, props.music.track).file));
  if (props.effects) FX_NAMES.forEach((n) => optional.add(`${norm(props.effects!.folder).replace(/\/+$/, "")}/${n}.mp3`));
  if (props.desk?.testudoPhoto) optional.add(norm(props.desk.testudoPhoto));
  if (props.desk?.mug ?? true) optional.add(UMD_M_PUBLIC);
  props.opening.pages.forEach((pg) => { if (pg.mark) optional.add(norm(pg.mark)); });
  const opt = [...optional];
  const [reqOk, optOk] = await Promise.all([Promise.all(required.map(probe)), Promise.all(opt.map(probe))]);
  const lost = required.filter((_, i) => !reqOk[i]);
  if (lost.length) {
    throw new Error(`LaptopNight: ${lost.length === 1 ? "this page capture is" : "these page captures are"} not in the studio's public/ folder: ${lost.join(", ")}. ` +
      `Capture the page first (npm run flow, see skill/SKILL.md), or put the image at public/<that path>, then check the path in your JSON.`);
  }
  return { durationInFrames: Math.max(1, fr(tl.total)), fps: LN_FPS, props: { ...props, missing: opt.filter((_, i) => !optOk[i]) } };
};

/* ================================================================== the screen (1440 x 929 CSS px on the glass) */

const SW = 1440;
const SH = 929;
type Cap = { w: number; h: number; sc: number; drawH: number };
const capOf = (p: LaptopNightProps): Cap => {
  const w = p.captureSize?.width ?? 2880, h = p.captureSize?.height ?? 1858;
  return { w, h, sc: SW / w, drawH: (SW * h) / w };
};
const boxPx = (b: Box, c: Cap) => ({ x: b.x * c.sc, y: b.y * c.sc, w: b.w * c.sc, h: b.h * c.sc });

const CapImg: React.FC<{ img: string; c: Cap }> = ({ img, c }) => (
  <Img src={src(img)} style={{ position: "absolute", left: 0, top: 0, width: SW, height: c.drawH, display: "block" }} />
);
/** A crop of a capture, positioned in screen px. */
const Crop: React.FC<{ img: string; c: Cap; x: number; y: number; w: number; h: number; style?: React.CSSProperties }> = ({ img, c, x, y, w, h, style }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", ...style }}>
    <Img src={src(img)} style={{ position: "absolute", left: -x, top: -y, width: SW, height: c.drawH, display: "block" }} />
  </div>
);

const Ground: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(70% 70% at 50% 45%, rgba(${B.color.glowRgb}, 0.32) 0%, ${B.color.bgDeep} 72%)` }} />
);

/** Where each page of the pile sits, round the middle (Feature Friday's ten, measured by eye there); more than ten repeat
 *  with a small turn. The last page always lands square in the middle. `ax`, `ay`: the corner its mark rides on. */
const PILE_SPOTS = [
  { dx: -150, dy: -62, rot: -3, ax: 0, ay: 0 }, { dx: 130, dy: -40, rot: 2.5, ax: 1, ay: 0 }, { dx: -96, dy: 44, rot: -1.5, ax: 0, ay: 1 },
  { dx: 160, dy: 58, rot: 3, ax: 1, ay: 1 }, { dx: -170, dy: 18, rot: -2.5, ax: 0, ay: 0.5 }, { dx: 64, dy: -78, rot: 1.5, ax: 0.55, ay: 0 },
  { dx: -44, dy: 76, rot: -3.5, ax: 0.4, ay: 1 }, { dx: 140, dy: -8, rot: 2, ax: 1, ay: 0.5 }, { dx: -112, dy: -30, rot: -1, ax: 0.25, ay: 0 },
];
const spotOf = (i: number, n: number) => {
  if (i === n - 1) return { dx: 0, dy: 0, rot: 0, ax: 0.78, ay: 1 };
  const s = PILE_SPOTS[i % PILE_SPOTS.length], lap = Math.floor(i / PILE_SPOTS.length);
  return { ...s, rot: s.rot + (lap % 2 ? -1.5 : 0) * lap, dx: s.dx * (lap ? 0.8 : 1), dy: s.dy * (lap ? 0.8 : 1) };
};
const PILE_SC = 0.64;
const PW = SW * PILE_SC, PH = SH * PILE_SC;
const TILE = 124;

const MarkTile: React.FC<{ page: PilePage; size: number }> = ({ page, size }) => {
  const look = page.markStyle ?? "fill";
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.23, overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
      background: look === "red" ? "linear-gradient(160deg, #e8283b 0%, #b5101f 100%)" : "#fff",
      boxShadow: `0 ${size * 0.12}px ${size * 0.3}px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,${look === "red" ? 0.18 : 0.9})` }}>
      {look === "fill" ? <Img src={src(page.mark!)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
      {look === "logo" ? <Img src={src(page.mark!)} style={{ width: "64%", height: "64%", objectFit: "contain" }} /> : null}
      {look === "red" ? <Img src={src(page.mark!)} style={{ width: "94%", objectFit: "contain", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }} /> : null}
    </div>
  );
};

/** The pile: one page at a time, a calm stack, then every page slides to the middle and shrinks to one point. */
const PileStack: React.FC<{ pages: PilePage[]; tl: Timeline; has: (p: string) => boolean }> = ({ pages, tl, has }) => {
  const f = useCurrentFrame();
  const c0 = fr(tl.collapse);
  if (f > c0 + 20) return null;
  const n = pages.length, cx = SW / 2, cy = SH / 2;
  const state = (i: number) => {
    const a = fr(tl.lands[i]);
    const land = k(f, a - 1, a + 11, 0, 1, Easing.bezier(0.2, 0.75, 0.25, 1));
    const lag = (n - 1 - i) * 0.5; // the top of the pile goes first, half a frame apart
    const cIn = interpolate(f, [c0 + lag, c0 + 14 + lag], [0, 1], { ...clamp, easing: Easing.bezier(0.6, 0, 0.4, 1) });
    return { a, land, cIn, sc: (1.07 - 0.07 * land) * (1 - 0.84 * cIn), sp: spotOf(i, n) };
  };
  return (
    <AbsoluteFill>
      {pages.map((pg, i) => {
        const { a, land, cIn, sc, sp } = state(i);
        if (f < a - 1) return null;
        const x = cx + sp.dx * (1 - cIn), y = cy + sp.dy * (1 - cIn);
        const rot = sp.rot * (1 - cIn) + (1 - land) * 2.5;
        return (
          <div key={`p${i}`} style={{ position: "absolute", left: x - PW / 2, top: y - PH / 2 + (1 - land) * -70, width: PW, height: PH, transformOrigin: "50% 50%",
            transform: `rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`, opacity: Math.min(1, land * 2.2) * (1 - interpolate(cIn, [0.85, 1], [0, 1], clamp)) }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 14, overflow: "hidden",
              boxShadow: `0 ${30 + 30 * (1 - land)}px ${70 + 40 * (1 - land)}px rgba(0,0,0,0.62), 0 0 0 1px rgba(255,255,255,0.1)` }}>
              <Img src={src(pg.image)} style={{ width: PW, height: PH, display: "block", objectFit: "cover", objectPosition: "50% 0%" }} />
            </div>
          </div>
        );
      })}
      {/* the marks ride with their pages but sit above the whole pile, so every one stays in sight */}
      {pages.map((pg, i) => {
        if (!pg.mark || !has(pg.mark)) return null;
        const { a, land, cIn, sc, sp } = state(i);
        if (f < a - 1) return null;
        const x = cx + sp.dx * (1 - cIn) + (sp.ax - 0.5) * PW * sc, y = cy + sp.dy * (1 - cIn) + (sp.ay - 0.5) * PH * sc + (1 - land) * -70;
        const size = TILE * (1 - 0.6 * cIn);
        return (
          <div key={`m${i}`} style={{ position: "absolute", left: x - size / 2, top: y - size / 2, opacity: Math.min(1, land * 2.2) * (1 - interpolate(cIn, [0.7, 1], [0, 1], clamp)),
            transform: `rotate(${(sp.rot * (1 - cIn) + (1 - land) * 6).toFixed(2)}deg)` }}><MarkTile page={pg} size={size} /></div>
        );
      })}
    </AbsoluteFill>
  );
};

/** The dashboard opens out of the point the pile collapsed into. */
const DashOpen: React.FC<{ img: string; c: Cap; tl: Timeline }> = ({ img, c, tl }) => {
  const f = useCurrentFrame();
  const c0 = fr(tl.open);
  if (f < c0) return null;
  const t = k(f, c0, c0 + 15, 0, 1, Easing.bezier(0.16, 1, 0.3, 1));
  const glow = interpolate(f, [c0, c0 + 5, c0 + 22], [0, 1, 0], clamp);
  return (
    <AbsoluteFill>
      {glow > 0 ? <AbsoluteFill style={{ background: `radial-gradient(30% 34% at 50% 50%, rgba(${B.color.glowRgb}, ${0.55 * glow}) 0%, rgba(0,0,0,0) 70%)` }} /> : null}
      <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, transformOrigin: "50% 50%", transform: `scale(${(0.16 + 0.84 * t).toFixed(4)})`,
        borderRadius: 18 * (1 - t), overflow: "hidden", opacity: Math.min(1, t * 4), boxShadow: t < 1 ? `0 30px 80px rgba(0,0,0,${0.6 * (1 - t)})` : undefined }}>
        <CapImg img={img} c={c} />
      </div>
    </AbsoluteFill>
  );
};

/** The focus box lifts off the page with a red edge while the rest of the page dims. */
const Highlight: React.FC<{ b: BeatT; img: string; c: Cap }> = ({ b, img, c }) => {
  const f = useCurrentFrame();
  if (!b.highlight || typeof b.focus !== "object") return null;
  const a = fr(b.start), e = fr(b.end);
  const h = interpolate(f, [a + 1, a + 9, e - 2, e + 4], [0, 1, 1, 0], { ...clamp, easing: EASE });
  if (h <= 0) return null;
  const r = boxPx(b.focus, c);
  return (
    <>
      <AbsoluteFill style={{ background: `rgba(10,6,7,${(0.42 * h).toFixed(3)})` }} />
      <Crop img={img} c={c} x={r.x} y={r.y} w={r.w} h={r.h}
        style={{ borderRadius: 15, transformOrigin: "50% 60%", transform: `translateY(${(-5 * h).toFixed(2)}px) scale(${(1 + 0.035 * h).toFixed(4)})`,
          boxShadow: `0 0 0 2px rgba(${B.color.glowRgb}, ${(0.9 * h).toFixed(3)}), 0 0 36px rgba(${B.color.glowRgb}, ${(0.4 * h).toFixed(3)}), 0 ${(16 * h).toFixed(1)}px 40px rgba(0,0,0,${(0.5 * h).toFixed(3)})` }} />
    </>
  );
};

/** The pointer for a beat's press: in from the lower right, onto the point, press, gone. */
const pointerFor = (b: BeatT | undefined, c: Cap, f: number) => {
  if (!b || !b.click) return null;
  const at = fr(b.start + (b.click.at ?? 0.8));
  const t0 = at - 14, tOut = at + 8;
  if (f < t0 || f > tOut) return null;
  const x1 = b.click.x * c.sc, y1 = b.click.y * c.sc;
  const x0 = Math.min(SW - 40, x1 + 220), y0 = Math.min(SH - 40, y1 + 200);
  const t = EASE(Math.min(1, Math.max(0, (f - t0) / Math.max(1, at - 1 - t0))));
  const since = f >= at ? (f - at) / LN_FPS : null;
  return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, since, appear: interpolate(f, [t0, t0 + 4, tOut - 3, tOut], [0.4, 1, 1, 0], clamp) };
};

const ScreenNode: React.FC<{ p: LaptopNightProps; tl: Timeline; c: Cap }> = ({ p, tl, c }) => {
  const f = useCurrentFrame();
  // the pages that arrive after the dashboard: one per beat whose capture is new
  const pages = useMemo(() => tl.beats.filter((b) => b.newPage), [tl]);
  let i = -1;
  pages.forEach((pg, j) => { if (fr(pg.start) <= f) i = j; });
  const cur = i >= 0 ? pages[i] : null;
  const prevImg = i > 0 ? pages[i - 1].capture : i === 0 ? p.opening.dashboard : null;
  const tr = cur?.enter ?? "slide";
  const ca = cur ? fr(cur.start) : 0;
  const tIn = cur ? (tr === "cut" ? 1 : k(f, ca, ca + (tr === "slide" ? 10 : 5), 0, 1, Easing.bezier(0.2, 0.8, 0.2, 1))) : 0;
  const beat = [...tl.beats].reverse().find((b) => fr(b.start) <= f);
  const shownImg = cur ? cur.capture : p.opening.dashboard;
  const ptr = pointerFor(beat, c, f);
  return (
    <AbsoluteFill style={{ width: SW, height: SH, overflow: "hidden", background: B.color.bgDeep }}>
      <Ground />
      <PileStack pages={p.opening.pages} tl={tl} has={hasFor(p)} />
      {!cur || tIn < 1 ? <DashOpen img={p.opening.dashboard} c={c} tl={tl} /> : null}
      {cur && prevImg && tIn < 1 ? (
        <AbsoluteFill style={tr === "slide" ? { transform: `translateY(${-tIn * SH * 0.22}px)`, filter: `brightness(${1 - 0.45 * tIn})` } : {}}>
          <CapImg img={prevImg} c={c} />
        </AbsoluteFill>
      ) : null}
      {cur ? (
        <AbsoluteFill style={tr === "slide" ? { transform: `translateY(${(1 - tIn) * SH}px)`, boxShadow: "0 -30px 60px rgba(0,0,0,0.55)", background: B.color.bgDeep } : { opacity: tIn }}>
          <CapImg img={cur.capture} c={c} />
        </AbsoluteFill>
      ) : null}
      {beat ? <Highlight b={beat} img={shownImg} c={c} /> : null}
      {ptr ? <PointerAt x={ptr.x} y={ptr.y} since={ptr.since} accent={RED} size={34} opacity={ptr.appear} /> : null}
    </AbsoluteFill>
  );
};

/* ================================================================== the camera (laptop centimetres, see four/real-laptop.tsx) */

const posesFor = (fmt: Fmt) => {
  // 4x5: the captions take the top, so the product sits 120 px lower and close-ups come down 10%
  const SQ = (u: number, v: number, fill: number) => {
    if (fmt.tall) return onScreen(u, v, fill, fmt.aspect);
    const fl = fill * (fill > 1.3 ? 0.9 : 1);
    return onScreen(u, v - 120 / (fl * 0.75) / SH, fl, fmt.aspect);
  };
  const RP = (dir: Vec3, target: Vec3, dist: number) => (fmt.tall ? roomPose(dir, target, dist) : roomPose(dir, [target[0], target[1] + 3.5, target[2]], dist * (dist >= 150 ? 0.8 : 0.97)));
  return {
    SQ,
    wideA: RP([-0.58, 0.36, 0.73], [0, 5, -3], 182),
    glass: SQ(0.5, 0.5, 1.0),
    glassB: SQ(0.5, 0.5, 1.1),
    glassC: SQ(0.5, 0.5, 1.12),
    laptop: RP([-0.24, 0.3, 0.92], [0, 6, -4], 120),
    laptopB: RP([-0.2, 0.3, 0.93], [0, 6, -4], 116),
    mid: SQ(0.5, 0.45, 1.08),
    midB: SQ(0.52, 0.45, 1.12),
    endA: RP([-0.42, 0.3, 0.86], [0, 12.5, -4], 160),
    endB: RP([-0.3, 0.3, 0.9], [0, 12.5, -4], 168),
  };
};
/** How much of the frame's width the focus box fills (0.9: a little room either side), and the deepest push. */
const FOCUS_FILL = 0.9;
const MAX_FILL = 5;
const camFor = (tl: Timeline, c: Cap, fmt: Fmt): CamKey[] => {
  const P = posesFor(fmt);
  const keys: CamKey[] = [];
  const at = (sec: number, pose: Omit<CamKey, "at">, ease: (t: number) => number = EASE) => keys.push({ at: fr(sec), ...pose, ease });
  // the push to the glass starts on the first frames while the first pages land; the glass fills the width by 1.25 s
  at(0, P.wideA);
  at(1.25, P.glass, Easing.bezier(0.42, 0, 0.12, 1));
  at(tl.collapse, P.glassB, Easing.linear);
  at(tl.b0, P.glassC, Easing.linear);
  let deep = false; // is the camera pushed into something (so a new page wants the whole screen first)
  for (const b of tl.beats) {
    const s = b.start, e = b.end, room = Math.max(0.3, e - s);
    if (b.focus === "laptop") {
      at(s + Math.min(1.0, room * 0.6), P.laptop, Easing.bezier(0.5, 0, 0.2, 1));
      at(e, P.laptopB, Easing.linear);
      deep = false;
    } else if (b.focus === undefined || b.focus === "screen") {
      at(s + Math.min(0.6, room * 0.5), P.mid, EASE);
      at(e, P.midB, Easing.linear);
      deep = false;
    } else {
      const r = boxPx(b.focus, c);
      const fill = Math.min(MAX_FILL, Math.max(1, (SW / r.w) * FOCUS_FILL));
      const u = (r.x + r.w / 2) / SW, v = (r.y + r.h / 2) / SH;
      // whole thing first: a new page arrives with the whole screen in view, then the camera pushes to the named thing
      if (b.newPage && deep && room > 1.4) {
        at(s + 0.35, P.mid, EASE);
        at(s + Math.min(0.95, room * 0.6), P.SQ(u, v, fill), PUSH);
      } else {
        at(s + Math.min(0.6, room * 0.5), P.SQ(u, v, fill), b.newPage ? PUSH : EASE);
      }
      at(e, P.SQ(u + 0.004, v, fill * 1.03), Easing.linear);
      deep = fill > 1.3;
    }
  }
  at(tl.endAt + 1.2, P.endA, Easing.bezier(0.3, 0, 0.1, 1));
  at(tl.total, P.endB, Easing.linear);
  // keys must rise frame by frame
  for (let i = 1; i < keys.length; i++) if (keys[i].at <= keys[i - 1].at) keys[i] = { ...keys[i], at: keys[i - 1].at + 1 };
  return keys;
};

/* ================================================================== projection of the laptop's own world into the frame */

type Pt = { x: number; y: number };
const camOf = (c: Omit<CamKey, "at">, fmt: Fmt) => {
  const cam = new THREE.PerspectiveCamera(c.fov ?? 30, fmt.aspect, 1, 3000);
  cam.position.set(...c.pos);
  cam.lookAt(new THREE.Vector3(...c.target));
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
};
const proj = (cam: THREE.PerspectiveCamera, p: Vec3, fmt: Fmt): Pt => {
  const v = new THREE.Vector3(...p).project(cam);
  return { x: (v.x * 0.5 + 0.5) * fmt.W, y: (-v.y * 0.5 + 0.5) * fmt.H };
};
/** CSS matrix3d mapping a W x H box onto a quad (TL, TR, BR, BL), the same maths RealLaptop uses for its glass. */
const quadMatrix = (W: number, H: number, q: Pt[]) => {
  const [p0, p1, p2, p3] = q;
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y, dy3 = p0.y - p1.y + p2.y - p3.y;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const hh = (dx1 * dy3 - dx3 * dy1) / den;
  const a = p1.x - p0.x + g * p1.x, b = p3.x - p0.x + hh * p3.x, c = p0.x;
  const d = p1.y - p0.y + g * p1.y, e = p3.y - p0.y + hh * p3.y, f = p0.y;
  return `matrix3d(${a / W},${d / W},0,${g / W},${b / H},${e / H},0,${hh / H},0,0,1,0,${c},${f},0,1)`;
};
// the open lid (measured in four/real-laptop.tsx and kit/pass/stage/LaptopRoom.tsx)
const HINGE: Vec3 = [0, -0.063, -12.15];
const TILT = 0.3474;
const GLASS = { half: 17.19, s1: 23.82 };
const lidPoint = (x: number, sUp: number, n: number): Vec3 => [
  x + HINGE[0],
  Math.cos(TILT) * sUp + Math.sin(TILT) * n + HINGE[1],
  -Math.sin(TILT) * sUp + Math.cos(TILT) * n + HINGE[2],
];
const glassWidthOf = (cam: THREE.PerspectiveCamera, fmt: Fmt) => {
  const g0 = proj(cam, lidPoint(-GLASS.half, GLASS.s1, 0), fmt), g1 = proj(cam, lidPoint(GLASS.half, GLASS.s1, 0), fmt);
  return Math.hypot(g1.x - g0.x, g1.y - g0.y);
};

/* ================================================================== the desk: a framed Testudo photo and a Maryland mug */

const DESK_Y = -0.96; // four/real-laptop.tsx
const add = (a: Vec3, b: Vec3, k1 = 1): Vec3 => [a[0] + b[0] * k1, a[1] + b[1] * k1, a[2] + b[2] * k1];
const visible = (cam: THREE.PerspectiveCamera, p: Vec3) => { const v = new THREE.Vector3(...p).project(cam); return v.z < 1 && v.z > -1; };
const planeQuad = (cam: THREE.PerspectiveCamera, fmt: Fmt, o: Vec3, right: Vec3, up: Vec3) => [
  proj(cam, add(o, up), fmt), proj(cam, add(add(o, up), right), fmt), proj(cam, add(o, right), fmt), proj(cam, o, fmt),
];
/** A red Maryland mug with the UMD M and a band of the Maryland flag's black and gold, drawn as a lit cylinder. */
const Mug: React.FC<{ x: number; y: number; w: number; h: number; el: number; light: number; mark: boolean }> = ({ x, y, w, h, el, light, mark }) => {
  const ry = (w / 2) * Math.max(0.08, Math.sin(el));
  const W = w * 1.42;
  return (
    <svg width={W} height={h + ry * 2 + 4} viewBox={`0 0 ${W} ${h + ry * 2 + 4}`}
      style={{ position: "absolute", left: x - w / 2, top: y - h - ry, overflow: "visible", filter: `blur(1.3px) brightness(${(0.6 * light).toFixed(3)}) saturate(0.72)` }}>
      <defs>
        <linearGradient id="ln-mug-fall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.06" /><stop offset="0.6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="ln-mug-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.75" /><stop offset="0.3" stopColor="#000" stopOpacity="0.3" /><stop offset="0.7" stopColor="#000" stopOpacity="0" />
          <stop offset="0.82" stopColor="#fff" stopOpacity="0.18" /><stop offset="1" stopColor="#000" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="ln-mug" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a0408" /><stop offset="0.22" stopColor="#8e0c17" /><stop offset="0.62" stopColor="#c8182a" />
          <stop offset="0.8" stopColor="#e2505a" /><stop offset="0.9" stopColor="#b31322" /><stop offset="1" stopColor="#4a050b" />
        </linearGradient>
      </defs>
      <ellipse cx={w / 2} cy={h + ry + 2} rx={w * 0.62} ry={ry * 1.3 + 3} fill="rgba(0,0,0,0.55)" style={{ filter: "blur(3px)" }} />
      <path d={`M${w * 0.98} ${ry + h * 0.2} C ${w * 1.38} ${ry + h * 0.18}, ${w * 1.4} ${ry + h * 0.72}, ${w * 0.96} ${ry + h * 0.74}`} fill="none" stroke="#8e0c17" strokeWidth={w * 0.1} strokeLinecap="round" />
      <path d={`M0 ${ry} L0 ${ry + h} A ${w / 2} ${ry} 0 0 0 ${w} ${ry + h} L${w} ${ry} Z`} fill="url(#ln-mug)" />
      {Array.from({ length: 14 }, (_, i) => {
        const x0 = (w / 2) * (1 + Math.sin(-Math.PI / 2 + (Math.PI * i) / 14)), x1 = (w / 2) * (1 + Math.sin(-Math.PI / 2 + (Math.PI * (i + 1)) / 14));
        return <rect key={i} x={x0} y={ry + h * 0.83} width={Math.max(0.5, x1 - x0)} height={h * 0.045} fill={i % 2 ? "#3a2a1c" : "#a8812c"} />;
      })}
      <path d={`M0 ${ry + h * 0.83} L${w} ${ry + h * 0.83} L${w} ${ry + h * 0.875} L0 ${ry + h * 0.875} Z`} fill="url(#ln-mug-shade)" />
      <path d={`M0 ${ry} L0 ${ry + h} A ${w / 2} ${ry} 0 0 0 ${w} ${ry + h} L${w} ${ry} Z`} fill="url(#ln-mug-fall)" />
      <path d={`M${w * 0.93} ${ry + h * 0.06} L${w * 0.93} ${ry + h * 0.94}`} stroke="rgba(255,200,160,0.28)" strokeWidth={Math.max(1, w * 0.025)} strokeLinecap="round" />
      {mark ? <image href={staticFile(UMD_M_PUBLIC)} x={w * 0.3} y={ry + h * 0.24} width={w * 0.4} height={w * 0.38} opacity={0.92} /> : null}
      <ellipse cx={w / 2} cy={ry} rx={w / 2} ry={ry} fill="#d3404c" />
      <ellipse cx={w / 2} cy={ry + ry * 0.12} rx={w / 2 - w * 0.05} ry={ry * 0.82} fill="#1a0b08" />
    </svg>
  );
};
/** Both stand to the right of and behind the laptop, so from every camera in the look the laptop never covers them. */
const DeskProps: React.FC<{ cam: THREE.PerspectiveCamera; fmt: Fmt; lit: number; photo?: string; mug: boolean; mugMark: boolean }> = ({ cam, fmt, lit, photo, mug, mugMark }) => {
  const [bad, setBad] = React.useState(false); // a photo that fails to load is left out, not an error
  const yaw = (-32 * Math.PI) / 180, lean = (9 * Math.PI) / 180;
  const n: Vec3 = [Math.sin(yaw), 0, Math.cos(yaw)];
  const right: Vec3 = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const up: Vec3 = [-n[0] * Math.sin(lean), Math.cos(lean), -n[2] * Math.sin(lean)];
  const FW = 15, FH = 20;
  const fBase: Vec3 = [36, DESK_Y, -25];
  const fO = add(fBase, right, -FW / 2);
  const mBase: Vec3 = [27.5, DESK_Y, -22];
  const MH = 9.6, MR = 4.1;
  const showF = !!photo && !bad && [fO, add(fO, up, FH)].every((p) => visible(cam, p));
  const toCam = new THREE.Vector3(cam.position.x - mBase[0], 0, cam.position.z - mBase[2]).normalize();
  const mRight: Vec3 = [toCam.z, 0, -toCam.x];
  const m0 = proj(cam, mBase, fmt), m1 = proj(cam, [mBase[0], mBase[1] + MH, mBase[2]], fmt), mr = proj(cam, add(mBase, mRight, MR), fmt);
  const mW = 2 * Math.hypot(mr.x - m0.x, mr.y - m0.y), mHpx = Math.hypot(m1.x - m0.x, m1.y - m0.y);
  const el = Math.atan2(cam.position.y - (mBase[1] + MH), Math.hypot(cam.position.x - mBase[0], cam.position.z - mBase[2]));
  const showM = mug && visible(cam, mBase) && mW > 4;
  if (!showF && !showM) return null;
  const light = 0.5 + 0.22 * lit;
  const fQ = planeQuad(cam, fmt, fO, [right[0] * FW, 0, right[2] * FW], [up[0] * FH, up[1] * FH, up[2] * FH]);
  const sh: Vec3 = add(fBase, n, -3.2);
  const shQ = planeQuad(cam, fmt, add(add(sh, right, -13), n, -5), [right[0] * 26, 0, right[2] * 26], [n[0] * 12, 0.02, n[2] * 12]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {showF ? (
        <>
          <div style={{ position: "absolute", left: 0, top: 0, width: 260, height: 120, transformOrigin: "0 0", transform: quadMatrix(260, 120, shQ),
            background: "radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: 300, height: 400, transformOrigin: "0 0", transform: quadMatrix(300, 400, fQ),
            filter: `blur(1.1px) brightness(${(0.78 * light).toFixed(3)})` }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(150deg, #3a2a20 0%, #22170f 60%, #1a120c 100%)", borderRadius: 3,
              boxShadow: "inset 0 0 0 2px rgba(255,220,180,0.12), inset 0 0 18px rgba(0,0,0,0.6)" }} />
            <div style={{ position: "absolute", left: 22, top: 22, right: 22, bottom: 22, background: "#d9d1c3", boxShadow: "inset 0 1px 4px rgba(0,0,0,0.45)" }} />
            <div style={{ position: "absolute", left: 50, top: 50, right: 50, bottom: 50, overflow: "hidden", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.35)" }}>
              <Img src={src(photo!)} onError={() => setBad(true)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 60%", filter: "saturate(0.92)" }} />
            </div>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(225deg, rgba(255,190,120,0.22) 0%, rgba(255,190,120,0) 45%, rgba(0,0,0,0.38) 100%)" }} />
            <div style={{ position: "absolute", left: 50, top: 50, right: 50, bottom: 50, background: "linear-gradient(118deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.08) 48%, rgba(255,255,255,0) 58%)" }} />
          </div>
        </>
      ) : null}
      {showM ? <Mug x={m0.x} y={m0.y} w={mW} h={mHpx} el={el} light={light} mark={mugMark} /> : null}
    </AbsoluteFill>
  );
};

/* ================================================================== the room's light */

/** `lit` is the clean light of the opening and the end (the whole laptop is the picture); the middle is the lamp. */
const roomLight = (lit: number, glassW: number) => {
  const m = (a: number, b: number) => a + (b - a) * lit;
  const m3 = (a: Vec3, b: Vec3): Vec3 => [m(a[0], b[0]), m(a[1], b[1]), m(a[2], b[2])];
  return {
    lamp: { pos: m3([46, 52, -16], [40, 60, 6]), aim: m3([-0.55, -1, 0.35], [-0.5, -1, 0.1]), color: m3([1.0, 0.66, 0.36], [1.0, 0.8, 0.6]), power: m(5200, 9000), size: m(7, 11), cone: m(0.55, 0.7) },
    ambient: m3([0.012, 0.01, 0.01], [0.04, 0.034, 0.034]),
    body: { near: m3([1.0, 0.82, 0.62], [1.0, 0.94, 0.86]), far: m3([0.24, 0.21, 0.21], [0.62, 0.58, 0.58]), litFrom: [24, 18, -8] as Vec3 },
    deck: { color: m3([1.0, 0.72, 0.45], [1.0, 0.86, 0.75]), strength: m(0.12, 0.22) },
    glow: lit > 0.01 ? { color: [0.85, 0.13, 0.18] as Vec3, power: 0.5 * lit, at: [0, -24] as [number, number], radius: 44 } : null,
    bloom: m(0.16, 0.24),
    haze: { x: m(0.92, 0.78), y: m(0.06, 0.02), strength: m(0.16, 0.3) },
    vignette: interpolate(glassW, [900, 1500], [m(0.55, 0.28), 0.18], clamp),
  };
};

/** A soft scrim behind the captions, only while the glass is bigger than the frame. */
const CapScrim: React.FC<{ glassW: number; fmt: Fmt }> = ({ glassW, fmt }) => {
  const o = interpolate(glassW, [1250, 1700], [0, 1], clamp);
  if (o <= 0) return null;
  const d = interpolate(glassW, [2400, 3600], [0, 1], clamp);
  const a = (x: number, y: number) => (x + (y - x) * d).toFixed(3);
  const { capY } = fmt;
  return <AbsoluteFill style={{ pointerEvents: "none", opacity: o, background: `linear-gradient(180deg, rgba(11,7,8,${a(0.9, 0.97)}) 0px, rgba(11,7,8,${a(0.8, 0.94)}) ${capY - 30}px, rgba(11,7,8,${a(0.55, 0.75)}) ${capY + 80}px, rgba(11,7,8,0) ${capY + 220}px)` }} />;
};

/* ================================================================== captions */

type CW = { t: string; at: number; accent: boolean };
type Chunk = { words: CW[]; at: number; leave: number; ghost?: number };
const lineOf = (l: CaptionLine) => (typeof l === "string" ? { text: l } : l);
const wordsOf = (text: string, start: number, pace: number): CW[] =>
  text.trim().split(/\s+/).map((w, j) => ({ t: w.replace(/\*/g, ""), accent: w.includes("*"), at: fr(start + j * pace) - 1 }));

const captionsOf = (p: LaptopNightProps, tl: Timeline): Chunk[] => {
  const pace = p.wordPace ?? 0.26;
  const out: Chunk[] = [];
  const push = (text: string, start: number, pc: number) => { const words = wordsOf(text, start, pc); out.push({ words, at: words[0].at, leave: 0 }); };
  // the opening lines: given times, or spread evenly over the pile
  const ol = p.opening.lines.map(lineOf);
  const span = Math.max(1, tl.collapse - 0.2);
  ol.forEach((l, i) => push(l.text, l.at ?? 0.2 + (span * i) / Math.max(1, ol.length), l.pace ?? pace));
  push(p.opening.reveal, tl.collapse + 0.375, pace * 1.4);
  for (const b of tl.beats) {
    const ls = (Array.isArray(b.caption) ? b.caption : [b.caption]).map(lineOf);
    ls.forEach((l, j) => push(l.text, b.start + (l.at ?? 0.05 + (b.hold * j) / ls.length), l.pace ?? pace));
  }
  out.sort((a, b) => a.at - b.at);
  out.forEach((c, j) => { c.leave = j < out.length - 1 ? out[j + 1].at - 5 : fr(tl.endAt) - 6; });
  if (out.length && out[0].at <= fr(0.6)) out[0].ghost = 0.4; // frame 0 already carries the first line, faint
  return out;
};

const CapWord: React.FC<{ w: CW; leave: number; ghost?: number }> = ({ w, leave, ghost }) => {
  const f = useCurrentFrame();
  const a0 = f < w.at ? 0 : k(f, w.at, w.at + 7);
  const a = ghost === undefined ? a0 : 1;
  const gOp = ghost === undefined ? 1 : ghost + (1 - ghost) * a0;
  const c = f < w.at ? 0 : k(f, w.at + 1, w.at + 10, 0, 1, EASE);
  const rgb = ARRIVE.map((v) => Math.round(v + (255 - v) * c));
  const l = f < leave ? 0 : k(f, leave, leave + 6, 0, 1, IN);
  return (
    <span style={{ display: "inline-block", opacity: a * gOp * (1 - l), transform: `translateY(${((1 - a) * CAP_SIZE * 0.28 - l * CAP_SIZE * 0.4).toFixed(2)}px)`,
      filter: `blur(${((1 - a) * 7 + l * 8).toFixed(2)}px)`, marginRight: CAP_SIZE * 0.26,
      color: w.accent ? (c > 0.5 ? ACCENT : `rgb(${ARRIVE.join(",")})`) : `rgb(${rgb.join(",")})` }}>{w.t}</span>
  );
};
const Captions: React.FC<{ chunks: Chunk[]; fmt: Fmt }> = ({ chunks, fmt }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {chunks.map((c, i) => (f < (c.ghost !== undefined ? 0 : c.at) || f > c.leave + 7 ? null : (
        <div key={i} style={{ position: "absolute", left: 60, right: 60, top: fmt.capY, transform: "translateY(-50%)", textAlign: "center", fontFamily: FONT, fontSize: CAP_SIZE,
          fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.15, textWrap: "balance", textShadow: "0 2px 18px rgba(0,0,0,0.55)" } as React.CSSProperties}>
          {c.words.map((w, j) => <CapWord key={j} w={w} leave={c.leave} ghost={c.ghost} />)}
        </div>
      )))}
    </AbsoluteFill>
  );
};

/* ================================================================== titles over the frame */

const Logo: React.FC<{ width: number }> = ({ width }) => (
  <Img src={staticFile(B.logo!.onDark)} style={{ width, height: width / B.logo!.ratio, display: "block" }} />
);
/** The small campusai wordmark beside the UMD M tag, up by 0.85 s, held through the reveal. */
const TopMark: React.FC<{ fmt: Fmt; out: number }> = ({ fmt, out }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [fr(0.7), fr(0.85), out, out + 9], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 482, top: fmt.markY, opacity: o, display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ width: 2, height: 36, background: "rgba(255,255,255,0.35)" }} />
      <Logo width={170} />
    </div>
  );
};
/** The end card: the logo, then one plain white line under it, word by word. No pill, no glow, no box. */
const EndCard: React.FC<{ line: string; tl: Timeline; fmt: Fmt; at0: number; pace: number }> = ({ line, tl, fmt, at0, pace }) => {
  const f = useCurrentFrame();
  const a = fr(tl.endAt) - 2;
  if (f < a) return null;
  const o = k(f, a, a + 10);
  const rise = interpolate(f, [a, a + 16], [40, 0], { ...clamp, easing: OUT });
  const breathe = 1 + Math.sin((f - a) / 20) * 0.01;
  const drift = interpolate(f, [a, fr(tl.total)], [0, -18], clamp);
  const LW = 560, LH = LW / B.logo!.ratio;
  const words = line.trim().split(/\s+/);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: fmt.endY - LH / 2 + rise + drift, display: "flex", flexDirection: "column", alignItems: "center", opacity: o, transform: `scale(${breathe})` }}>
        <Logo width={LW} />
        <div style={{ marginTop: 34, fontFamily: FONT, fontSize: 54, fontWeight: 500, letterSpacing: "-0.02em", color: "#fff", whiteSpace: "nowrap", textShadow: "0 2px 14px rgba(0,0,0,0.5)" }}>
          {words.map((w, i) => {
            const at = fr(tl.endAt + at0 + i * pace);
            const t = k(f, at - 1, at + 6);
            return <span key={i} style={{ display: "inline-block", marginRight: 54 * 0.26, opacity: t, transform: `translateY(${((1 - t) * 54 * 0.28).toFixed(2)}px)`, filter: `blur(${((1 - t) * 7).toFixed(2)}px)` }}>{w}</span>;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ================================================================== sound */

type Clip = { src: string; start: number; from: number; to?: number; volume: number };
const narrationOf = (p: LaptopNightProps, tl: Timeline): Clip[] =>
  (p.narration ?? []).map((n) => {
    const base = n.beat === undefined ? 0 : n.beat === "reveal" ? tl.open : n.beat === "end" ? tl.endAt : (tl.beats[n.beat]?.start ?? 0);
    return { src: n.src, start: base + n.at, from: n.from ?? 0, to: n.to, volume: n.volume ?? 1 };
  });

type Cue = { at: number; n: string; v: number };
const cuesOf = (p: LaptopNightProps, tl: Timeline): Cue[] => {
  const cues: Cue[] = [
    { at: 0.12, n: "whoosh-air", v: 0.2 },
    ...tl.lands.map((at) => ({ at, n: "notification-bubble-pop", v: 0.2 })),
    ...tl.lands.map((at) => ({ at: at + 0.02, n: "ui-popup-dry", v: 0.08 })),
    { at: tl.collapse - 0.05, n: "sweep-air-transition", v: 0.28 },
    { at: tl.open + 0.02, n: "ui-message-pop", v: 0.26 },
    { at: tl.collapse + 0.75, n: "bass-knock-sub", v: 0.6 },
  ];
  for (const b of tl.beats) {
    if (b.newPage) cues.push({ at: b.start, n: "swoosh-quick", v: 0.12 });
    else if (b.focus === "laptop") cues.push({ at: b.start + 0.2, n: "swoosh-quick", v: 0.2 });
    if (b.highlight) cues.push({ at: b.start + 0.05, n: "notification-bubble-pop", v: 0.18 });
    if (b.click) cues.push({ at: b.start + (b.click.at ?? 0.8), n: "ui-click-tone", v: 0.55 });
  }
  cues.push({ at: tl.endAt - 0.3, n: "swoosh-slow", v: 0.24 }, { at: tl.endAt + 0.5, n: "ui-message-pop", v: 0.16 });
  return cues;
};
const BED_UP = 0.3;
const BED_DUCK = 0.067; // about 10 dB under each line
const FX_GAIN = 0.36;
const LONG: Record<string, number> = { "bass-knock-sub": 36, "whoosh-air": 30, "swoosh-slow": 45 };

const Sound: React.FC<{ p: LaptopNightProps; tl: Timeline }> = ({ p, tl }) => {
  const { id } = useVideoConfig();
  const has = hasFor(p);
  const total = fr(tl.total);
  const clips = narrationOf(p, tl).filter((c) => has(c.src));
  const bedLevel = (f: number) => {
    let duck = 0;
    for (const c of clips) {
      const a = fr(c.start) - 4, b = fr(c.start + (c.to !== undefined ? c.to - c.from : 3)) + 6;
      duck = Math.max(duck, interpolate(f, [a - 4, a, b, b + 8], [0, 1, 1, 0], clamp));
    }
    const fade = interpolate(f, [0, 8, total - 40, total], [0, 1, 1, 0], clamp);
    return (BED_UP + (BED_DUCK - BED_UP) * (clips.length ? duck : 0)) * fade;
  };
  const bed = p.music ? pickBed(id, tl.total, p.music.track) : null;
  const fxDir = p.effects ? p.effects.folder.replace(/^\/+|\/+$/g, "") : null;
  const fxGain = FX_GAIN * (p.effects?.volume ?? 1);
  return (
    <>
      {clips.map((c, i) => (
        <Sequence key={`vo${i}`} from={Math.max(0, fr(c.start))} layout="none">
          <Audio src={src(c.src)} trimBefore={fr(c.from) || undefined} trimAfter={c.to !== undefined ? fr(c.to) : undefined} volume={c.volume} />
        </Sequence>
      ))}
      {bed && has(bed.file) ? <Audio src={staticFile(bed.file)} trimBefore={fr(bed.startAt)} volume={(f) => bedLevel(f) * bed.gain * (p.music?.volume ?? 1)} /> : null}
      {fxDir ? cuesOf(p, tl).filter((c) => has(`${fxDir}/${c.n}.mp3`)).map((c, i) => (
        <Sequence key={`fx${i}`} from={Math.max(0, fr(c.at))} layout="none">
          <Audio src={staticFile(`${fxDir}/${c.n}.mp3`)} volume={(f0) => fxGain * c.v * (LONG[c.n] ? interpolate(f0, [LONG[c.n] - 12, LONG[c.n]], [1, 0], clamp) : 1)} />
        </Sequence>
      )) : null}
    </>
  );
};

/* ================================================================== the film */

export const LaptopNight: React.FC<LaptopNightProps> = (p) => {
  const { height } = useVideoConfig();
  const fmt = height === LN45_H ? FMT_45 : FMT_916;
  const f = useCurrentFrame();
  const tl = useMemo(() => timeline(p), [p]);
  const c = useMemo(() => capOf(p), [p]);
  const CAM = useMemo(() => camFor(tl, c, fmt), [tl, c, fmt]);
  const chunks = useMemo(() => captionsOf(p, tl), [p, tl]);
  const cam = camOf(cameraAt(CAM, f), fmt);
  // clean light while the whole laptop is the picture (the opening, any "laptop" beats that open the run, the end)
  const firstClose = tl.beats.find((b) => b.focus !== "laptop");
  const dim = firstClose ? firstClose.start : tl.endAt;
  const lit = Math.max(1 - k(f, fr(dim - 0.2), fr(dim + 0.35), 0, 1, EASE), k(f, fr(tl.endAt), fr(tl.endAt + 1), 0, 1, EASE));
  const glassW = glassWidthOf(cam, fmt);
  const has = hasFor(p);
  const photo = p.desk?.testudoPhoto && has(p.desk.testudoPhoto) ? p.desk.testudoPhoto : undefined;
  return (
    <AbsoluteFill style={{ background: B.color.bgDeep }}>
      <LaptopRoom screen={{ node: <ScreenNode p={p} tl={tl} c={c} /> }} preset="lamp" camera={CAM} lid={1} brand={B} light={roomLight(lit, glassW)} />
      <DeskProps cam={cam} fmt={fmt} lit={lit} photo={photo} mug={p.desk?.mug ?? true} mugMark={has(UMD_M_PUBLIC)} />
      <CapScrim glassW={glassW} fmt={fmt} />
      <EndCard line={p.end.line} tl={tl} fmt={fmt} at0={p.end.at ?? 0.5} pace={p.end.pace ?? (p.wordPace ?? 0.26) * 0.8} />
      <Captions chunks={chunks} fmt={fmt} />
      <UmdOpen bigCx={540} bigCy={fmt.bigCy} bigH={fmt.tall ? 330 : 270} tagCx={440} tagCy={fmt.tagCy} tagH={54} outAt={fr(tl.b0)} />
      <TopMark fmt={fmt} out={fr(tl.b0)} />
      <Sound p={p} tl={tl} />
    </AbsoluteFill>
  );
};
