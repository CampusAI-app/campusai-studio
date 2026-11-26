/**
 * Template: Light trial reel (2026-11-25). The look of the round 4 trial reels ("Who to talk to", "Your week"), made
 * from props so anyone can cut a new one from their own captures, lines and (optionally) a student clip and a voice.
 *
 * The film, in order:
 *   1. Hook. Soft pink and white cloud ground. Frame 0 already carries it: the UMD M big, the first line lighting, the
 *      rest faint, each word lighting as it is said. The M glides up into a small tag and a real product chip slides
 *      in under the first line.
 *   2. Student clip (optional). A real clip at a named UMD place, the person's words captioned under them as said.
 *   3. The campusai wordmark: its spark pulses alone, then the wordmark writes out to meet it.
 *   4. Product beats, one per capture. The whole real page on the pastel field, the line small above it on a white
 *      band landing as said, red outlines drawing on what the line names, then the parts marked `lift` come off the
 *      page as stacked cards.
 *   5. End. The wordmark over a sky photo, the end line with its red word, "Link in bio".
 *
 * Worked example and the original film: src/templates/trial-reel.example.json; the look is "Light trial reel" in
 * skill/rules/campusai.md. Everything this file needs lives here or in tracked kit files, so it runs on any studio
 * install. Missing private files (a sky photo, sounds) are left out instead of failing the render; the UMD M falls back to the copy in the repo.
 *
 *   npx remotion render src/templates/trial-reel-entry.tsx Template-TrialReel-9x16 out/template-trial-reel-9x16.mp4 --gl=angle
 */
import React, { createContext, useContext, useState } from "react";
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LAUNCH_FONT } from "../kit/effects/PastelLaunch";
import { B, IN, OUT, SWING, Sfx, clampX, k, mix } from "../kit/effects/shared";
import { pickBed } from "../system/sound/bed";
import { UmdOpen } from "../styles/UmdOpen";

// =====================================================================================================================
// Props. Paths are under public/. Seconds are seconds; boxes are in the capture's own pixels (open the PNG, read x/y).
// =====================================================================================================================

/** A recorded voice line (one ElevenLabs take per hook, beat or end line is the studio's method). */
export type VoiceTake = {
  /** The audio file, under public/ (e.g. "my-reel/vo/hook.mp3"). */
  src: string;
  /** Second in the file where the sound really starts. Default 0. */
  from?: number;
  /** Second in the file where the sound really stops. Left out, it is measured from the file before rendering. */
  to?: number;
};

/** One line of words on screen. */
export type TextLine = {
  /** The words, exactly as shown (and as said, when there is a voice). */
  text: string;
  /** The word (or words, space separated) that turns red when it lights. Punctuation and case are ignored. */
  accent?: string;
  /** When there is a voice: the second in the voice file each word starts, one number per word. Left out, the words
   *  are spread evenly across the take, or with no voice land at an easy speaking pace. */
  times?: number[];
};

/** A rectangle in a capture's pixels. */
export type Box = { x: number; y: number; w: number; h: number };

/** A region of a product capture to outline in red. */
export type MarkBox = Box & {
  /** true: after the outlines, this part lifts off the page as a card. Several lift as a stack, in this order. */
  lift?: boolean;
  /** Draw this outline as this word is said (0 is the first word of the beat's lines). Left out, outlines draw one
   *  after another from the start of the beat. */
  atWord?: number;
};

/** A real product capture (a PNG of the web product, usually 2x of a 1440 x 900 page). */
export type Capture = {
  /** The image, under public/. */
  src: string;
  /** The image's size in pixels, [width, height]. */
  size: [number, number];
};

export type HookProps = {
  /** One to three lines. On frame 0 the first is lighting and the rest sit faint, each word lighting as it is said.
   *  Write it in a student's own words (rules/campusai.md, "Opening and ending"). */
  lines: TextLine[];
  /** A small real piece of the product that slides in under the first line: a capture and the box to crop from it. */
  chip?: Capture & { box: Box };
  /** The voice saying the hook lines (times on each line are seconds in this file). */
  voice?: VoiceTake;
};

export type ClipProps = {
  /** The video, under public/. Student footage stays on the owner's Mac (the repo is public). */
  src: string;
  /** Seconds in the video to play from and to. */
  in: number;
  out: number;
  /** The named UMD place, shown small at the top (e.g. "Inside Van Munching Hall"). */
  place?: string;
  /** Word times for the captions, seconds in the video: a words.json under public/ ({ words: [{ w, start }] }), read
   *  before rendering. Left out, the clip plays with no captions. */
  wordsJson?: string;
  /** The same word times given directly (filled in from wordsJson when that is used). */
  words?: { w: string; start: number }[];
  /** Words to turn red in the captions (space separated). */
  accent?: string;
  /** Play the clip's own sound. Default true. */
  sound?: boolean;
};

export type BeatProps = {
  /** The whole real page this beat shows. */
  capture: Capture;
  /** Show only this part of the capture as the page (for a tall scrolled capture). Default: the whole capture. */
  crop?: Box;
  /** What is said over the page: one or two lines, small above it on a white band, landing as said. */
  lines: TextLine[];
  /** The voice saying the lines (times on each line are seconds in this file). */
  voice?: VoiceTake;
  /** The parts the line names, outlined in red in order; the ones marked `lift` then lift off as stacked cards. */
  boxes?: MarkBox[];
  /** Hold the beat at least this many seconds. */
  minSeconds?: number;
};

export type EndProps = {
  /** The end line under the wordmark. Default "Made for Terps." */
  line?: string;
  /** Its red word. Default "Terps." */
  accent?: string;
  /** The small line under it. Default "Link in bio". Empty string to leave it out. */
  sub?: string;
  /** A sky photo behind the wordmark, under public/. Left out, or missing on this Mac, a soft sky drawn in code is used. */
  photo?: string;
  /** The voice saying the end line. */
  voice?: VoiceTake;
};

export type TrialReelProps = {
  hook: HookProps;
  /** Optional: a real student clip after the hook. Leave it out for the product-only reel. */
  clip?: ClipProps;
  /** The product beats, in order. Two or three keep a reel near 20 s. */
  beats: BeatProps[];
  end?: EndProps;
  /** Sound effects on the moves (a soft whoosh, a chime on the logo). Default true. */
  effects?: boolean;
  /** A music bed from the studio's licensed tracks. Default false: trial reels carry no music, a song is picked in
   *  Instagram instead (rules/campusai.md). */
  music?: boolean;
  /** Filled in automatically before rendering (resolveTrialReelProps): the optional files not on this Mac (sound
   *  effects, music, voices, the sky photo), which are then left out instead of failing the render. Leave it out. */
  missing?: string[];
};

// =====================================================================================================================
// Timing
// =====================================================================================================================
export const TR_FPS = 30;
export const TR_W = 1080;
const sf = (s: number) => Math.round(s * TR_FPS);
const LOGO_LEN = 46; // the spark and the wordmark
const END_LEN = 95; // the end card, held about 3 s
const PACE = 8; // frames per word with no voice (about 0.27 s, speaking pace)
const LINE_GAP = 10; // extra frames between lines with no voice
const VO_LEAD = 4; // a beat's voice starts this many frames into the beat

export type W = { t: string; at: number; accent?: boolean };
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, "");
const takeEnd = (v: VoiceTake) => v.to ?? 0;
const takeLen = (v: VoiceTake) => Math.max(1, sf(takeEnd(v) - (v.from ?? 0)));

/** Each line's words with the frame each one lights on. `voAt`: the frame the take starts; `start`: first word with no voice. */
const timeLines = (lines: TextLine[], voice: VoiceTake | undefined, voAt: number, start: number): W[][] => {
  const all = lines.map((l) => l.text.split(/\s+/).filter(Boolean));
  const total = all.reduce((n, ws) => n + ws.length, 0);
  let idx = 0;
  return lines.map((l, li) => {
    const acc = (l.accent ?? "").split(/\s+/).map(norm).filter(Boolean);
    return all[li].map((t, wi) => {
      const i = idx++;
      let at: number;
      if (voice && l.times && l.times[wi] !== undefined) at = voAt + sf(l.times[wi] - (voice.from ?? 0)) - 2;
      else if (voice && takeEnd(voice) > 0) {
        const from = voice.from ?? 0;
        at = voAt + sf(((takeEnd(voice) - from) * 0.92 * i) / Math.max(1, total)) - 2;
      } else at = start + i * PACE + li * LINE_GAP;
      return { t, at, accent: acc.some((a) => a === norm(t)) };
    });
  });
};
const lastAt = (rows: W[][]) => rows.reduce((m, r) => r.reduce((n, w) => Math.max(n, w.at), m), 0);

type BeatPlan = { rows: W[][]; marks: number[]; liftAt: number | null; len: number };
const planBeat = (b: BeatProps): BeatPlan => {
  const rows = timeLines(b.lines, b.voice, VO_LEAD, 6);
  const flat = rows.reduce<W[]>((a, r) => a.concat(r), []);
  const boxes = b.boxes ?? [];
  const marks = boxes.map((bx, i) => (bx.atWord !== undefined && flat[bx.atWord] ? flat[bx.atWord].at : 16 + i * 14));
  const lastMark = marks.length ? Math.max(...marks) : 0;
  const lineEnd = lastAt(rows) + 14;
  const vEnd = b.voice ? VO_LEAD + takeLen(b.voice) : 0;
  const lifts = boxes.filter((bx) => bx.lift).length;
  const liftAt = lifts ? Math.max(lastMark + 20, lineEnd) : null;
  const len = Math.max(
    liftAt !== null ? liftAt + 26 + 60 : Math.max(lastMark + 40, lineEnd + 24),
    vEnd + 10,
    sf(b.minSeconds ?? 0),
  );
  return { rows, marks, liftAt, len };
};

const hookLen = (h: HookProps) => {
  const rows = timeLines(h.lines, h.voice, 0, -4);
  return Math.max(75, h.voice ? takeLen(h.voice) + 10 : 0, lastAt(rows) + 30);
};
const endLen = (e?: EndProps) => Math.max(END_LEN, e?.voice ? 44 + takeLen(e.voice) + 12 : 0);

/** Where each part of the film starts, and how long it is (frames at 30 fps). */
export const trialReelPlan = (p: TrialReelProps) => {
  const hook = hookLen(p.hook);
  const clip = p.clip ? Math.max(1, sf(p.clip.out - p.clip.in)) : 0;
  const beats = p.beats.map(planBeat);
  let t = hook + clip + LOGO_LEN;
  const beatAt = beats.map((b) => { const a = t; t += b.len; return a; });
  return { hook, clipAt: hook, clip, logoAt: hook + clip, beats, beatAt, endAt: t, end: endLen(p.end), total: t + endLen(p.end) };
};
/** The film's length in frames, from its props. */
export const trialReelFrames = (p: TrialReelProps) => trialReelPlan(p).total;

// =====================================================================================================================
// The look (from src/trials/post-howdo-remake.tsx, moved here so the template stands on tracked files alone)
// =====================================================================================================================
const FONT = LAUNCH_FONT;
const INK = "#2a0d16";
const INK_RGB = [42, 13, 22];
const ARRIVE = [240, 150, 160];
const ACCENT = "#e0465a";
const RED = B.color.accent;
const BAND_A = "#f6c3ca";
const BAND_B = "#f9d6da";

const SFX = (name: string) => `styles/sfx/${name}.mp3`; // the path kit/effects/shared's Sfx plays
const SFX_USED = ["transition-soft", "chime-crystal", "air-woosh-quick"];
/** false when the file was found missing before rendering. */
const Have = createContext<(path: string) => boolean>(() => true);

type Frame = { W: number; H: number; CY: number; tall: boolean };
const FrameCtx = createContext<Frame>({ W: 1080, H: 1920, CY: 960, tall: true });
const useF = () => useContext(FrameCtx);

/** White ground with the soft cloud band along the bottom, drifting. */
const CloudCard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const { tall } = useF();
  const lumps = [
    { x: 4, w: 30, h: 15, c: BAND_A }, { x: 24, w: 26, h: 19, c: BAND_B }, { x: 44, w: 30, h: 14, c: BAND_A },
    { x: 66, w: 24, h: 20, c: BAND_B }, { x: 86, w: 30, h: 16, c: BAND_A }, { x: 50, w: 70, h: 9, c: BAND_A },
  ];
  const hs = tall ? 0.78 : 1;
  return (
    <AbsoluteFill style={{ background: "#ffffff", overflow: "hidden", fontFamily: FONT }}>
      <AbsoluteFill style={{ filter: "blur(38px)" }}>
        {lumps.map((l, i) => {
          const dx = Math.sin((f / 30) * 0.35 + i * 1.7) * 2.2;
          const dy = Math.sin((f / 30) * 0.5 + i) * 1.2;
          return (
            <div key={i} style={{ position: "absolute", left: `${l.x - l.w / 2 + dx}%`, bottom: `${(-l.h * 0.35 + dy) * hs}%`, width: `${l.w}%`, height: `${l.h * 1.7 * hs}%`,
              borderRadius: "50%", background: l.c, opacity: 0.95 }} />
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${9 * hs}%`, background: BAND_A }} />
      </AbsoluteFill>
      {children}
    </AbsoluteFill>
  );
};

/** The pastel field of the product and logo shots, in blush, lilac and peach. */
const Pastel: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const s = (p: number, a: number) => Math.sin((f / 30) * ((Math.PI * 2) / p)) * a;
  const bg = [
    `radial-gradient(55% 45% at ${-2 + s(13, 3)}% ${92 + s(11, 3)}%, #e7d9f7 0%, #e7d9f700 100%)`,
    `radial-gradient(60% 50% at ${104 + s(15, 3)}% ${74 + s(12, 4)}%, #f8d2c2 0%, #f8d2c200 100%)`,
    `radial-gradient(50% 40% at ${12 + s(17, 3)}% ${8 + s(9, 3)}%, #f7cfd8 0%, #f7cfd800 100%)`,
    `radial-gradient(45% 35% at ${88 + s(19, 4)}% 4%, #dde6fb 0%, #dde6fb00 100%)`,
    "radial-gradient(55% 45% at 50% 45%, #ffffff 0%, #ffffff00 100%)",
    "#fbf7f8",
  ].join(", ");
  return <AbsoluteFill style={{ background: bg, overflow: "hidden", fontFamily: FONT }}>{children}</AbsoluteFill>;
};

/** One word arriving: out of a blur, rising a little, rose first, then ink (or white on footage). With `ghost` it
 *  already sits in place, faint, and lights up when it is said. */
const Word: React.FC<{ w: W; size: number; leaveAt?: number; light?: boolean; ghost?: number }> = ({ w, size, leaveAt, light, ghost }) => {
  const f = useCurrentFrame();
  const a0 = f < w.at ? 0 : k(f, w.at, w.at + 7, OUT);
  const a = ghost === undefined ? a0 : 1;
  const gOp = ghost === undefined ? 1 : mix(ghost, 1, a0);
  const c = f < w.at ? 0 : k(f, w.at + 1, w.at + 10, SWING);
  const to = light ? [255, 255, 255] : INK_RGB;
  const rgb = ARRIVE.map((v, i) => Math.round(mix(v, to[i], c)));
  const color = w.accent ? (light ? "#ffd3d8" : c > 0.5 ? ACCENT : `rgb(${ARRIVE.join(",")})`) : `rgb(${rgb.join(",")})`;
  const l = leaveAt === undefined || f < leaveAt ? 0 : k(f, leaveAt, leaveAt + 6, IN);
  return (
    <span style={{ display: "inline-block", opacity: a * gOp * (1 - l), color, transform: `translateY(${((1 - a) * size * 0.28 - l * size * 0.4).toFixed(2)}px)`,
      filter: `blur(${((1 - a) * 7 + l * 8).toFixed(2)}px)`, marginRight: size * 0.26, textShadow: light ? "0 2px 18px rgba(0,0,0,0.45)" : undefined }}>{w.t}</span>
  );
};

/** A centred line of words; shrinks to fit the frame width if the line is long. */
const Line: React.FC<{ words: W[]; size: number; y: number; leaveAt?: number; light?: boolean; ghost?: number }> = ({ words, size, y, leaveAt, light, ghost }) => {
  const { W: FW } = useF();
  const chars = words.reduce((n, w) => n + w.t.length + 1, 0);
  const fit = Math.min(size, (FW - 120) / Math.max(1, chars * 0.55));
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, transform: "translateY(-50%)", textAlign: "center",
      fontFamily: FONT, fontSize: fit, fontWeight: 500, letterSpacing: "-0.02em", whiteSpace: "nowrap", lineHeight: 1.15 }}>
      {words.map((w, i) => <Word key={i} w={w} size={fit} leaveAt={leaveAt} light={light} ghost={ghost} />)}
    </div>
  );
};

/** A crop of a capture (capture pixels), drawn `width` px wide. */
const Crop: React.FC<{ cap: Capture; box: Box; width: number; radius?: number; style?: React.CSSProperties }> = ({ cap, box, width, radius = 14, style }) => {
  const s = width / box.w;
  return (
    <div style={{ width, height: box.h * s, overflow: "hidden", borderRadius: radius, position: "relative", background: "#fff",
      boxShadow: "0 24px 50px rgba(80,30,45,0.20), 0 6px 14px rgba(80,30,45,0.12)", ...style }}>
      <Img src={staticFile(cap.src)} style={{ position: "absolute", left: -box.x * s, top: -box.y * s, width: cap.size[0] * s, height: cap.size[1] * s, maxWidth: "none" }} />
    </div>
  );
};

/** The real CampusAI logo (dark or white file, tracked in public/brand). */
const RealLogo: React.FC<{ width: number; dark?: boolean; style?: React.CSSProperties }> = ({ width, dark = true, style }) => (
  <Img src={staticFile(dark ? B.logo!.onLight : B.logo!.onDark)} style={{ width, height: width / B.logo!.ratio, display: "block", ...style }} />
);
// the spark sits over the "i": x 211..223, y 0..11.6 of the logo's 223 x 53 box
const SPARK = { x0: 211.35, x1: 223, y0: 0, y1: 11.65 };

/** The UMD M, started 14 frames early so it is already up on frame 0, then gliding into a small tag. */
const Umd: React.FC<{ bigDy: number; outAt: number }> = ({ bigDy, outAt }) => {
  const fr = useF();
  return (
    <Sequence from={-14} layout="none">
      <UmdOpen bigCx={fr.W / 2} bigCy={fr.CY + bigDy} bigH={fr.tall ? 240 : 210} tagCx={fr.W / 2} tagCy={fr.tall ? 170 : 86} tagH={56} outAt={outAt} />
    </Sequence>
  );
};

// =====================================================================================================================
// 1. The hook
// =====================================================================================================================
const Hook: React.FC<{ h: HookProps; len: number }> = ({ h, len }) => {
  const f = useCurrentFrame();
  const fr = useF();
  const rows = timeLines(h.lines, h.voice, 0, -4);
  const a = k(f, -8, 14, OUT); // the chip is already sliding on frame 0
  let chip: React.ReactNode = null;
  let ys: number[];
  if (h.chip) {
    const width = Math.min(fr.W * 0.9, (fr.tall ? 300 : 220) * (h.chip.box.w / h.chip.box.h));
    const ch = (h.chip.box.h / h.chip.box.w) * width;
    const gap = Math.max(150, ch / 2 + 70);
    ys = rows.map((_, i) => (i === 0 ? fr.CY - gap : fr.CY + gap + (i - 1) * 86));
    chip = (
      <div style={{ position: "absolute", left: fr.W / 2 - width / 2, top: fr.CY - ch / 2 + (1 - a) * 260, opacity: Math.min(1, a * 1.5),
        transform: `perspective(1200px) rotateX(${((1 - a) * 40).toFixed(2)}deg) scale(${mix(0.9, 1, a).toFixed(3)})` }}>
        <Crop cap={h.chip} box={h.chip.box} width={width} />
      </div>
    );
  } else {
    ys = rows.map((_, i) => fr.CY + (i - (rows.length - 1) / 2) * 96);
  }
  return (
    <CloudCard>
      {rows.map((r, i) => <Line key={i} words={r} size={i === 0 ? 54 : 62} y={ys[i]} ghost={0.34} />)}
      {chip}
      <Umd bigDy={ys[0] - fr.CY - (fr.tall ? 200 : 170)} outAt={len - 10 + 14} />
    </CloudCard>
  );
};

// =====================================================================================================================
// 2. The student clip
// =====================================================================================================================
const Clip: React.FC<{ c: ClipProps; len: number }> = ({ c, len }) => {
  const f = useCurrentFrame();
  const fr = useF();
  const acc = (c.accent ?? "").split(/\s+/).map(norm).filter(Boolean);
  const words: W[] = (c.words ?? []).filter((w) => w.start >= c.in - 0.05 && w.start < c.out)
    .map((w) => ({ t: w.w.trim(), at: Math.max(0, sf(w.start - c.in) - 2), accent: acc.some((a) => a === norm(w.w)) }));
  // each sentence in even rows of up to 5 words; two rows on screen at a time
  const rows: W[][] = [];
  const sentences: W[][] = [[]];
  words.forEach((w) => { sentences[sentences.length - 1].push(w); if (/[.?!]$/.test(w.t)) sentences.push([]); });
  sentences.filter((s) => s.length).forEach((s) => {
    const n = Math.ceil(s.length / 5);
    for (let r = 0; r < n; r++) rows.push(s.slice(Math.round((r * s.length) / n), Math.round(((r + 1) * s.length) / n)));
  });
  const pages: W[][][] = [];
  for (let i = 0; i < rows.length; i += 2) pages.push(rows.slice(i, i + 2));
  const pi = pages.reduce((n, p, i) => (f >= p[0][0].at - 4 ? i : n), 0);
  const page = pages[pi];
  const next = pages[pi + 1];
  const capY = fr.H - (fr.tall ? 560 : 360);
  const sound = c.sound !== false;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile(c.src)} trimBefore={sf(c.in)} muted={!sound}
        volume={(g) => interpolate(g, [0, 2, len - 3, len], [0, 1, 1, 0], clampX)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 40%" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)" }} />
      {c.place ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: fr.tall ? 220 : 90, textAlign: "center", fontFamily: FONT, fontSize: 34, fontWeight: 500, color: "#fff",
          opacity: 0.92 * k(f, 0, 8, OUT), textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}>{c.place}</div>
      ) : null}
      {page && page.map((r, i) => (
        <Line key={`${pi}-${i}`} words={r} size={i === 0 ? 66 : fr.tall ? 58 : 52} y={capY - 44 + i * 80} light leaveAt={next ? next[0][0].at - 4 : undefined} />
      ))}
    </AbsoluteFill>
  );
};

// =====================================================================================================================
// 3. The spark, then the wordmark
// =====================================================================================================================
const SparkLogo: React.FC = () => {
  const f = useCurrentFrame();
  const fr = useF();
  const LW = 600, U = LW / 223;
  const LH = 53 * U;
  const settle = k(f, 14, 30, Easing.bezier(0.5, 0, 0.1, 1));
  const wipe = k(f, 18, 36, OUT);
  const dot = k(f, 0, 8, OUT);
  const pulse = 1 + Math.sin((f / 30) * Math.PI * 3.2) * 0.1 * (1 - settle);
  const left = fr.W / 2 - LW / 2, top = fr.CY - LH / 2;
  const homeCx = left + ((SPARK.x0 + SPARK.x1) / 2) * U, homeCy = top + ((SPARK.y0 + SPARK.y1) / 2) * U;
  const scale = mix(9, 1, settle) * dot * pulse;
  const cx = mix(fr.W / 2, homeCx, settle), cy = mix(fr.CY, homeCy, settle);
  const sw = (SPARK.x1 - SPARK.x0) * U * scale, sh = (SPARK.y1 - SPARK.y0) * U * scale;
  return (
    <Pastel>
      <div style={{ position: "absolute", left, top, width: LW, height: LH, clipPath: `inset(-10% ${((1 - wipe) * 100).toFixed(2)}% -10% 0)` }}>
        <RealLogo width={LW} />
      </div>
      {wipe < 0.98 && sw > 0 && (
        // the spark is the logo's own: the logo file seen through a window the size of its spark
        <div style={{ position: "absolute", left: cx - sw / 2, top: cy - sh / 2, width: sw, height: sh, overflow: "hidden" }}>
          <Img src={staticFile(B.logo!.onLight)} style={{ position: "absolute", left: -SPARK.x0 * U * scale, top: -SPARK.y0 * U * scale, width: 223 * U * scale, height: 53 * U * scale, maxWidth: "none" }} />
        </div>
      )}
    </Pastel>
  );
};

// =====================================================================================================================
// 4. A product beat
// =====================================================================================================================
type View = { cx: number; cy: number; s: number };

/** The line small above the product, on a soft white band, landing as said. */
const VoHead: React.FC<{ rows: W[][]; len: number }> = ({ rows, len }) => {
  const f = useCurrentFrame();
  const fr = useF();
  const op = k(f, 0, 6, OUT) * (1 - k(f, len - 6, len, IN));
  const top = fr.tall ? 210 : 120;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: op, background: `linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.86) ${fr.tall ? 14 : 18}%, rgba(255,255,255,0) ${fr.tall ? 26 : 34}%)` }} />
      {rows.map((r, i) => <Line key={i} words={r} size={fr.tall ? 56 : 50} y={top + i * (fr.tall ? 68 : 60)} leaveAt={len - 5} />)}
    </AbsoluteFill>
  );
};

const Beat: React.FC<{ b: BeatProps; plan: BeatPlan; effects: boolean }> = ({ b, plan, effects }) => {
  const f = useCurrentFrame();
  const fr = useF();
  const have = useContext(Have);
  const cap = b.capture;
  const crop: Box = b.crop ?? { x: 0, y: 0, w: cap.size[0], h: cap.size[1] };
  const boxes = b.boxes ?? [];
  const pageY = fr.CY + (fr.tall ? 70 : 60); // under the line's band
  // whole page first, at the frame's width
  const s0 = Math.min((fr.W * 0.94) / crop.w, (fr.H * (fr.tall ? 0.56 : 0.6)) / crop.h);
  const v0: View = { cx: crop.x + crop.w / 2, cy: crop.y + crop.h / 2, s: s0 };
  // then a slow push toward what the line names (the union of the outlined parts), never past the frame's width
  let v1 = v0;
  if (boxes.length) {
    const x0 = Math.min(...boxes.map((q) => q.x)), y0 = Math.min(...boxes.map((q) => q.y));
    const x1 = Math.max(...boxes.map((q) => q.x + q.w)), y1 = Math.max(...boxes.map((q) => q.y + q.h));
    const push = Math.max(1, Math.min(1.14, (fr.W * 0.9) / ((x1 - x0) * s0)));
    v1 = { cx: mix(v0.cx, (x0 + x1) / 2, 0.35), cy: mix(v0.cy, (y0 + y1) / 2, 0.35), s: s0 * push };
  }
  const pushEnd = plan.liftAt ?? plan.len;
  const t = interpolate(f, [0, pushEnd], [0, 1], { ...clampX, easing: Easing.bezier(0.45, 0, 0.3, 1) });
  const v: View = { cx: mix(v0.cx, v1.cx, t), cy: mix(v0.cy, v1.cy, t), s: Math.exp(mix(Math.log(v0.s), Math.log(v1.s), t)) };
  const at = (x: number, y: number) => ({ x: fr.W / 2 + (x - v.cx) * v.s, y: pageY + (y - v.cy) * v.s });

  const enter = k(f, 0, 10, OUT);
  const lift = plan.liftAt === null ? 0 : k(f, plan.liftAt, plan.liftAt + 26, Easing.bezier(0.2, 0, 0, 1));
  const tl = at(crop.x, crop.y);

  // the lifted parts, stacked in the middle under the band
  const lifts = boxes.map((q, i) => ({ q, i })).filter((x) => x.q.lift);
  const areaTop = fr.tall ? 420 : 320, areaBot = fr.H - (fr.tall ? 170 : 70);
  const gap = fr.tall ? 26 : 16;
  const natW = lifts.map(({ q }) => Math.min(fr.W * 0.86, q.w * 1.25));
  const natH = lifts.map(({ q }, i) => (q.h / q.w) * natW[i]);
  const sumH = natH.reduce((a, b2) => a + b2, 0) + gap * Math.max(0, lifts.length - 1);
  const fit = Math.min(1, (areaBot - areaTop) / Math.max(1, sumH));
  let yCursor = (areaTop + areaBot) / 2 - (sumH * fit) / 2;
  const slots = natH.map((h, i) => { const y = yCursor + (h * fit) / 2; yCursor += h * fit + gap * fit; return { x: fr.W / 2, y, w: natW[i] * fit }; });

  return (
    <Pastel>
      <AbsoluteFill style={{ opacity: enter, transform: `translateY(${((1 - enter) * 50).toFixed(1)}px)` }}>
        <div style={{ position: "absolute", left: tl.x, top: tl.y, width: crop.w * v.s, height: crop.h * v.s, borderRadius: 12, overflow: "hidden",
          boxShadow: "0 40px 90px rgba(90,30,50,0.20), 0 10px 26px rgba(90,30,50,0.12)", background: "#fff" }}>
          <Img src={staticFile(cap.src)} style={{ position: "absolute", left: -crop.x * v.s, top: -crop.y * v.s, width: cap.size[0] * v.s, height: cap.size[1] * v.s, maxWidth: "none",
            filter: lift ? `blur(${(lift * 8).toFixed(2)}px)` : undefined }} />
        </div>
        {boxes.map((q, i) => {
          const a0 = plan.marks[i];
          if (f < a0) return null;
          const a = k(f, a0, a0 + 9, OUT);
          const o = plan.liftAt === null ? 1 - k(f, plan.len - 6, plan.len, IN) : 1 - k(f, plan.liftAt, plan.liftAt + 6, IN);
          const p0 = at(q.x, q.y), p1 = at(q.x + q.w, q.y + q.h);
          const pad = 6 + (1 - a) * 16;
          return (
            <div key={i} style={{ position: "absolute", left: p0.x - pad, top: p0.y - pad, width: p1.x - p0.x + pad * 2, height: p1.y - p0.y + pad * 2, borderRadius: 14,
              border: `3px solid ${RED}`, background: "rgba(224,70,90,0.07)", opacity: a * o, boxShadow: "0 10px 30px rgba(217,32,46,0.15)" }} />
          );
        })}
      </AbsoluteFill>
      {lift > 0 && <AbsoluteFill style={{ background: `rgba(251,247,248,${(lift * 0.55).toFixed(3)})` }} />}
      {plan.liftAt !== null && f >= plan.liftAt && lifts.map(({ q }, j) => {
        const a = k(f, plan.liftAt! + j * 3, plan.liftAt! + j * 3 + 24, Easing.bezier(0.2, 0, 0, 1));
        // from where it sat on the page (the push has ended by the lift, so the page is still)
        const c0 = at(q.x + q.w / 2, q.y + q.h / 2);
        const from = { x: c0.x, y: c0.y, w: q.w * v.s };
        const sl = slots[j];
        const w = mix(from.w, sl.w, a);
        const h = (q.h / q.w) * w;
        const x = mix(from.x, sl.x, a), y = mix(from.y, sl.y, a);
        return (
          <div key={j} style={{ position: "absolute", left: x - w / 2, top: y - h / 2, transform: `rotate(${((1 - a) * (j % 2 ? -6 : 6)).toFixed(2)}deg)`,
            boxShadow: `0 ${(30 * a).toFixed(1)}px ${(70 * a).toFixed(1)}px rgba(90,30,50,0.22), 0 8px 20px rgba(90,30,50,0.12)`, borderRadius: 16 }}>
            <Crop cap={cap} box={q} width={w} radius={16} style={{ boxShadow: "none" }} />
          </div>
        );
      })}
      <VoHead rows={plan.rows} len={plan.len} />
      {plan.liftAt !== null && <Sfx at={plan.liftAt} name="air-woosh-quick" volume={0.24} on={effects && have(SFX("air-woosh-quick"))} />}
    </Pastel>
  );
};

// =====================================================================================================================
// 5. The end
// =====================================================================================================================
/** With no sky photo on this Mac: a soft sunrise sky drawn in code, clouds drifting, settling the way the photo does. */
const DrawnSky: React.FC<{ opacity: number; settle: number }> = ({ opacity, settle }) => {
  const f = useCurrentFrame();
  const clouds = [{ x: 18, y: 50, w: 70, h: 9 }, { x: 72, y: 58, w: 60, h: 8 }, { x: 40, y: 68, w: 90, h: 10 }, { x: 85, y: 40, w: 45, h: 6 }];
  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${mix(1.25, 1, settle).toFixed(4)})` }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #8fb6e8 0%, #b7cff0 30%, #e9d6e6 55%, #f8cfc4 72%, #fbe2c8 86%, #fdf0e2 100%)" }} />
      <AbsoluteFill style={{ filter: "blur(30px)" }}>
        {clouds.map((c, i) => (
          <div key={i} style={{ position: "absolute", left: `${c.x - c.w / 2 + Math.sin(f / 60 + i) * 1.5}%`, top: `${c.y - c.h / 2}%`, width: `${c.w}%`, height: `${c.h}%`,
            borderRadius: "50%", background: i % 2 ? "rgba(255,240,236,0.75)" : "rgba(255,255,255,0.7)" }} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ e: EndProps }> = ({ e }) => {
  const f = useCurrentFrame();
  const fr = useF();
  const have = useContext(Have);
  const [failed, setFailed] = useState(false);
  const missing = failed || !e.photo || !have(e.photo);
  const a = k(f, 0, 10, OUT);
  const tilt = k(f, 0, 44, Easing.bezier(0.45, 0, 0.15, 1));
  const wipe = k(f, 30, 50, OUT);
  const LW = 560, LH = LW / B.logo!.ratio;
  const coverW = Math.max(fr.W, fr.H * 1.03 * (4 / 3)), coverH = coverW * (3 / 4);
  const ly = fr.H * 0.2;
  const t = Math.max(0, (f - 44) / 30);
  const line = e.line ?? "Made for Terps.";
  const acc = (e.accent ?? (e.line === undefined ? "Terps." : "")).split(/\s+/).map(norm).filter(Boolean);
  const sub = e.sub ?? "Link in bio";
  const lineIn = k(f, 44, 56, OUT);
  // the sky fades in over the same pastel the product beats sit on, so there is no white flash on the cut
  return (
    <Pastel>
      {e.photo && !missing ? (
        <>
          <Img src={staticFile(e.photo)} onError={() => setFailed(true)}
            style={{ position: "absolute", width: coverW, height: coverH, left: (fr.W - coverW) / 2, top: (fr.H - coverH) / 2, maxWidth: "none",
              opacity: a, transform: `scale(${(mix(2.3, 1, tilt) * (1 + t * 0.01)).toFixed(4)})`, transformOrigin: `50% ${mix(0, 50, tilt).toFixed(2)}%`,
              filter: `blur(${mix(6, 0, tilt).toFixed(2)}px) saturate(0.95)` }} />
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,245,246,0.30) 0%, rgba(255,245,246,0.12) 40%, rgba(0,0,0,0) 60%)" }} />
        </>
      ) : <DrawnSky opacity={a} settle={tilt} />}
      <div style={{ position: "absolute", left: fr.W / 2 - LW / 2, top: ly - LH / 2, width: LW, height: LH, clipPath: `inset(-20% ${((1 - wipe) * 100).toFixed(2)}% -20% 0)`,
        filter: "drop-shadow(0 6px 24px rgba(255,255,255,0.6))" }}>
        <RealLogo width={LW} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: ly + LH / 2 + 34, textAlign: "center", fontFamily: FONT, fontSize: 54, fontWeight: 500, color: INK, letterSpacing: "-0.02em",
        opacity: lineIn, transform: `translateY(${((1 - lineIn) * 14).toFixed(1)}px)`, textShadow: "0 2px 16px rgba(255,255,255,0.7)" }}>
        {line.split(/\s+/).map((w, i) => (
          <React.Fragment key={i}>{i ? " " : ""}<span style={{ color: acc.some((x) => x === norm(w)) ? ACCENT : undefined }}>{w}</span></React.Fragment>
        ))}
      </div>
      {sub ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: ly + LH / 2 + 112, textAlign: "center", fontFamily: FONT, fontSize: 36, fontWeight: 500, color: INK,
          opacity: k(f, 58, 68, OUT), textShadow: "0 2px 14px rgba(255,255,255,0.7)" }}>{sub}</div>
      ) : null}
    </Pastel>
  );
};

// =====================================================================================================================
// The film
// =====================================================================================================================
export const TrialReel: React.FC<TrialReelProps> = (p) => {
  const { width, height, id, durationInFrames: N } = useVideoConfig();
  const fr: Frame = { W: width, H: height, CY: height / 2, tall: height / width > 1.5 };
  const plan = trialReelPlan(p);
  const effects = p.effects !== false;
  const e = p.end ?? {};
  const gone = p.missing ?? [];
  const have = (path: string) => !gone.some((m) => m === path);
  // every voice take: [frame it starts on, take]
  const takes: [number, VoiceTake][] = [];
  if (p.hook.voice) takes.push([0, p.hook.voice]);
  p.beats.forEach((b, i) => { if (b.voice) takes.push([plan.beatAt[i] + VO_LEAD, b.voice]); });
  if (e.voice) takes.push([plan.endAt + 44, e.voice]);
  const heard = takes.filter(([, v]) => have(v.src));
  const pick = p.music ? pickBed(id, N / TR_FPS) : null;
  const bed = pick && have(pick.file) ? pick : null;
  const duck = (g: number) => takes.reduce((m, [t, v]) => m * interpolate(g, [t - 6, t, t + takeLen(v), t + takeLen(v) + 10], [1, 1 / 3, 1 / 3, 1], clampX), 1)
    * (p.clip ? interpolate(g, [plan.clipAt - 6, plan.clipAt, plan.clipAt + plan.clip, plan.clipAt + plan.clip + 10], [1, 1 / 3, 1 / 3, 1], clampX) : 1);
  return (
    <FrameCtx.Provider value={fr}>
      <Have.Provider value={have}>
      <AbsoluteFill style={{ background: "#fff", fontFamily: FONT }}>
        <Sequence durationInFrames={plan.hook}><Hook h={p.hook} len={plan.hook} /></Sequence>
        {p.clip && <Sequence from={plan.clipAt} durationInFrames={plan.clip}><Clip c={p.clip} len={plan.clip} /></Sequence>}
        <Sequence from={plan.logoAt} durationInFrames={LOGO_LEN}><SparkLogo /></Sequence>
        {p.beats.map((b, i) => (
          <Sequence key={i} from={plan.beatAt[i]} durationInFrames={plan.beats[i].len}><Beat b={b} plan={plan.beats[i]} effects={effects} /></Sequence>
        ))}
        <Sequence from={plan.endAt}><EndCard e={e} /></Sequence>

        {heard.map(([t, v], i) => (
          <Sequence key={`v${i}`} from={t} durationInFrames={takeLen(v) + 2} layout="none">
            <Audio src={staticFile(v.src)} trimBefore={sf(v.from ?? 0)} volume={(x) => interpolate(x, [0, 1, takeLen(v) - 3, takeLen(v)], [0, 1, 1, 0], clampX)} />
          </Sequence>
        ))}
        {bed && <Audio src={staticFile(bed.file)} trimBefore={Math.round(bed.startAt * TR_FPS)}
          volume={(g) => bed.gain * 0.36 * duck(g) * interpolate(g, [0, 8, N - 24, N], [0, 1, 1, 0], clampX)} />}
        <Sfx at={plan.hook - 2} name="transition-soft" volume={0.22} on={effects && have(SFX("transition-soft"))} />
        <Sfx at={plan.logoAt + 2} name="chime-crystal" volume={0.3} on={effects && have(SFX("chime-crystal"))} />
        <Sfx at={plan.endAt + 10} name="chime-crystal" volume={0.32} on={effects && have(SFX("chime-crystal"))} />
      </AbsoluteFill>
      </Have.Provider>
    </FrameCtx.Provider>
  );
};

const exists = async (path: string) => {
  try {
    return (await fetch(staticFile(path), { method: "HEAD" })).ok;
  } catch {
    return false;
  }
};

/**
 * Before rendering (the entry's calculateMetadata): checks every file the reel names. A missing product capture or
 * student clip stops the render with a plain message saying which file and how to make it. Missing optional files
 * (sound effects, music, voices, the sky photo) are listed in `missing` and left out. Also reads a clip's words.json
 * and measures any voice take with no `to`, so timing is exact.
 */
export const resolveTrialReelProps = async (p: TrialReelProps, compositionId = "Template-TrialReel"): Promise<TrialReelProps> => {
  const need: [string, string][] = [];
  if (p.hook.chip) need.push([p.hook.chip.src, "the hook's product chip (hook.chip.src)"]);
  p.beats.forEach((b, i) => need.push([b.capture.src, `product beat ${i + 1} (beats[${i}].capture.src)`]));
  for (const [path, what] of need) {
    if (!(await exists(path))) {
      throw new Error(`Trial reel: the capture for ${what} is not on this Mac: public/${path}. Capture that page from the real demo ` +
        "(npm run flow, see scripts/flow.mjs), save the PNG under public/, then point the props at it and give its pixel size.");
    }
  }
  if (p.clip && !(await exists(p.clip.src))) {
    throw new Error(`Trial reel: the student clip is not on this Mac: public/${p.clip.src}. Copy the video into public/ (student ` +
      "footage stays on your own Mac, never in git) and point clip.src at it, or leave clip out for the product-only reel.");
  }
  const missing: string[] = [];
  const optional = async (path?: string) => {
    if (!path) return true;
    const ok = await exists(path);
    if (!ok && !missing.some((m) => m === path)) missing.push(path);
    return ok;
  };
  for (const n of SFX_USED) await optional(SFX(n));
  await optional(p.end?.photo);
  const { getAudioDurationInSeconds } = await import("@remotion/media-utils");
  const measure = async (v?: VoiceTake): Promise<VoiceTake | undefined> => {
    if (!v || !(await optional(v.src))) return v; // a missing take is left out; its times still pace the words
    return v.to === undefined ? { ...v, to: await getAudioDurationInSeconds(staticFile(v.src)) } : v;
  };
  let clip = p.clip;
  if (clip && clip.wordsJson && !clip.words) {
    if (await optional(clip.wordsJson)) {
      const j = await (await fetch(staticFile(clip.wordsJson))).json();
      const list: { w?: string; word?: string; text?: string; start: number }[] = Array.isArray(j) ? j : j.words ?? [];
      clip = { ...clip, words: list.map((x) => ({ w: x.w ?? x.word ?? x.text ?? "", start: x.start })) };
    }
  }
  const resolved: TrialReelProps = {
    ...p,
    clip,
    hook: { ...p.hook, voice: await measure(p.hook.voice) },
    beats: await Promise.all(p.beats.map(async (b) => ({ ...b, voice: await measure(b.voice) }))),
    end: p.end ? { ...p.end, voice: await measure(p.end.voice) } : p.end,
  };
  if (p.music) await optional(pickBed(compositionId, trialReelFrames(resolved) / TR_FPS).file);
  return { ...resolved, missing };
};
