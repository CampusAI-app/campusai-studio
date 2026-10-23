/**
 * CampusAI post 1, "What CampusAI actually is" (2026-10-16).
 *
 * One laptop, the camera moving across its screen part by part (Raylight "Desktop app presentation"
 * as the camera reference), with big two-beat words in the Fetch Saas manner: the first line sets up,
 * the second lands the moment the screen shows the proof. Three beats, each on a real
 * campusai-demo.vercel.app capture in dark mode: the daily brief's moved deadline, Job Match's
 * "Why this fits you", and the spring planner's one section that fits. Ends on the logo and line,
 * with the laptop still on screen under it.
 *
 * Camera math: the laptop is drawn in its own pixel space (screen 1440x900, the capture's CSS size)
 * and the camera is "this point of the laptop sits at this point of the frame, at this scale". A
 * tilt rotates about that same point, so the focus never slides while the laptop flattens out.
 *
 * Words come from props so a different set can be swapped in without touching the timeline.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Watermark } from "./components/Watermark";

const { fontFamily } = loadFont("normal", { weights: ["700"] });

export const LAPTOP_FPS = 30;

type Rect = [number, number, number, number]; // x0, y0, x1, y1 in screen px (1440x900)
type Beat = { src: string; a: string; b: string; r1: Rect; r2: Rect };

export type CampusLaptopProps = {
  ending: "ig" | "linkedin";
  words?: [string, string][];
};

const SHOTS: Omit<Beat, "a" | "b">[] = [
  // the whole daily brief, then the moved deadline row (Wed, Oct 14 crossed out, Sun, Oct 18)
  { src: "L_dashboard", r1: [250, 34, 1406, 412], r2: [270, 150, 820, 248] },
  // "Jobs for you, 22 open student roles", then "Why this fits you"
  { src: "L_jobs", r1: [256, 96, 724, 166], r2: [732, 474, 1378, 670] },
  // "Only one section of BMGT434 fits" and its card, then the 5.0 review row
  { src: "L_planner", r1: [700, 322, 1378, 514], r2: [712, 436, 1366, 508] },
];

const DEFAULT_WORDS: [string, string][] = [
  ["Due Wednesday?", "Sunday now."],
  ["22 jobs.", "Each one says why."],
  ["One section fits.", "Rated 5.0 by students."],
];

// Laptop geometry (from the August banner's MacBook, Content/campusai/banners/banner.html).
const SCREEN = { w: 1440, h: 900 };
const PAD = 16;
const LID = { w: SCREEN.w + PAD * 2, h: SCREEN.h + PAD + 18 };
const BASE_W = LID.w + 148;
const LAPTOP_H = LID.h + 7 + 26;
const FIT_TILT = 14;

// Timeline, in frames. Each beat is 128: push to r1, hold, move to r2, hold, pull back.
const FIRST = 8;
const BEAT = 128;
const beatStart = (i: number) => FIRST + i * BEAT;
const END = beatStart(SHOTS.length) - 22; // the last beat pulls back into the end card instead
const BRAND = END + 6;
const BIO = BRAND + 26;
export const LAPTOP_FRAMES = BRAND + 84; // ~15.6s

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Cam = { px: number; py: number; s: number; tilt: number };

const layout = (w: number, h: number) => {
  if (w > h) {
    // 16:9: words left, laptop right
    return { words: { left: 100, top: h / 2, size: 64, max: 680, centerY: true }, stage: { x: 1240, y: 560, w: 1140, h: 900 }, fitW: 1240 };
  }
  if (h / w >= 1.5) {
    // 9:16: words in the top of the safe band (y 285 to 1500), the screen below
    return { words: { left: 76, top: 300, size: 84, max: w - 152, centerY: false }, stage: { x: w / 2, y: 1120, w: w - 64, h: 700 }, fitW: w * 0.94 };
  }
  // 4:5
  return { words: { left: 76, top: 92, size: 76, max: w - 152, centerY: false }, stage: { x: w / 2, y: 840, w: w - 64, h: 760 }, fitW: w * 0.92 };
};

export const CampusLaptop: React.FC<CampusLaptopProps> = ({ ending, words = DEFAULT_WORDS }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const L = layout(width, height);
  const beats: Beat[] = SHOTS.map((s, i) => ({ ...s, a: words[i][0], b: words[i][1] }));

  const fit: Cam = { px: LID.w / 2, py: LAPTOP_H / 2, s: L.fitW / BASE_W, tilt: FIT_TILT };
  const on = (r: Rect): Cam => {
    const rw = r[2] - r[0], rh = r[3] - r[1];
    return { px: PAD + (r[0] + r[2]) / 2, py: PAD + (r[1] + r[3]) / 2, s: Math.min(L.stage.w / rw, L.stage.h / rh, 2.1), tilt: 0 };
  };

  // Camera keyframes: [frame, cam, easing into it]
  const keys: [number, Cam, (t: number) => number][] = [[0, fit, EASE]];
  beats.forEach((b, i) => {
    const s0 = beatStart(i);
    keys.push([s0 + 24, on(b.r1), EASE]);
    keys.push([s0 + 46, on(b.r1), EASE]);
    keys.push([s0 + 68, on(b.r2), MOVE]);
    keys.push([s0 + 106, on(b.r2), EASE]);
    keys.push([s0 + 128, fit, MOVE]);
  });

  let cam = fit;
  for (let k = 0; k < keys.length - 1; k++) {
    const [f0, c0] = keys[k];
    const [f1, c1, ease] = keys[k + 1];
    if (frame >= f0 && frame <= f1) {
      const t = ease((frame - f0) / Math.max(1, f1 - f0));
      cam = {
        px: c0.px + (c1.px - c0.px) * t,
        py: c0.py + (c1.py - c0.py) * t,
        s: Math.exp(Math.log(c0.s) + (Math.log(c1.s) - Math.log(c0.s)) * t),
        tilt: c0.tilt + (c1.tilt - c0.tilt) * t,
      };
      break;
    }
    if (frame > f1) cam = c1;
  }

  // Intro: the laptop rises in. Outro: it settles lower and quieter under the brand.
  const rise = interpolate(frame, [0, 26], [1, 0], { ...clamp, easing: EASE });
  const settle = interpolate(frame, [END, END + 30], [0, 1], { ...clamp, easing: EASE });
  const tiltNow = cam.tilt + rise * 16 + settle * 6;
  const tx = L.stage.x;
  const ty = L.stage.y + rise * height * 0.55 + settle * (width > height ? 0 : height * 0.06);
  const sNow = cam.s * (1 - settle * 0.08);
  const laptopDim = settle * 0.35;

  // Which screen is up, and the crossfade into the next one at the end of each beat.
  const shotAt = (f: number) => Math.min(beats.length - 1, Math.max(0, Math.floor((f - FIRST) / BEAT)));
  const cur = shotAt(frame);
  const xfade = (i: number) => interpolate(frame, [beatStart(i) + 116, beatStart(i) + 128], [0, 1], clamp);
  // The end goes back to the brief through a quick dip, never a double exposure.
  const dip = interpolate(frame, [END, END + 7, END + 16], [0, 1, 0], clamp);
  const backToBrief = frame >= END + 7 ? 1 : 0;

  // Spotlight: a rounded window over the rect in focus, the rest of the screen dimmed.
  let spot: { r: Rect; a: number } | null = null;
  if (frame >= FIRST && frame < END) {
    const b = beats[cur];
    const t = frame - beatStart(cur);
    const mix = interpolate(t, [46, 68], [0, 1], { ...clamp, easing: MOVE });
    const r = b.r1.map((v, j) => v + (b.r2[j] - v) * mix) as Rect;
    const a = interpolate(t, [8, 26, 104, 118], [0, 1, 1, 0], clamp);
    spot = { r, a };
  }

  const lineIn = (f: number) => {
    const v = interpolate(frame, [f, f + 14], [0, 1], { ...clamp, easing: EASE });
    return { opacity: v, transform: `translateY(${(1 - v) * 26}px)`, filter: `blur(${(1 - v) * 10}px)` };
  };

  const brandIn = interpolate(frame, [BRAND, BRAND + 20], [0, 1], { ...clamp, easing: EASE });
  const tagIn = interpolate(frame, [BRAND + 8, BRAND + 28], [0, 1], { ...clamp, easing: EASE });
  const bioIn = ending === "ig" ? interpolate(frame, [BIO, BIO + 16], [0, 1], { ...clamp, easing: EASE }) : 0;

  const W = L.words;
  const wordBox: React.CSSProperties = {
    position: "absolute", left: W.left, top: W.top, width: W.max,
    transform: W.centerY ? "translateY(-50%)" : undefined,
    fontFamily, fontWeight: 700, fontSize: W.size, lineHeight: 1.06, letterSpacing: "-0.03em", color: "#fff",
  };

  const screenImg = (src: string, o: number) => (
    <Img key={src} src={staticFile(`laptop/${src}.jpg`)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: o }} />
  );

  return (
    <AbsoluteFill style={{ background: "#0b0708", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: width * 0.5 - width * 0.7, top: L.stage.y - height * 0.45, width: width * 1.4, height: height * 0.9,
        borderRadius: "50%", background: "radial-gradient(closest-side, rgba(226,24,51,.30), rgba(226,24,51,0) 72%)" }} />

      {/* the laptop, under the camera */}
      <div style={{ position: "absolute", inset: 0, perspective: 2600, perspectiveOrigin: `${tx}px ${ty}px` }}>
        <div style={{
          position: "absolute", left: 0, top: 0, width: BASE_W, height: LAPTOP_H, transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) rotateX(${tiltNow}deg) scale(${sNow}) translate(${-cam.px}px, ${-cam.py}px)`,
        }}>
          <div style={{
            position: "relative", width: LID.w, padding: `${PAD}px ${PAD}px 18px`, borderRadius: "22px 22px 9px 9px",
            background: "linear-gradient(184deg, #423a3b 0%, #272022 32%, #1a1517 70%, #241d1f 100%)",
            boxShadow: "0 2px 0 rgba(255,255,255,.12) inset, 0 -1px 0 rgba(0,0,0,.6) inset, 0 0 0 1px rgba(255,255,255,.095), 0 64px 128px rgba(0,0,0,.60), 0 20px 48px rgba(0,0,0,.46)",
          }}>
            <div style={{ position: "absolute", left: "50%", top: 5, transform: "translateX(-50%)", width: 7, height: 7, borderRadius: "50%",
              background: "#0d0b0c", boxShadow: "0 0 0 1px rgba(255,255,255,.11)" }} />
            <div style={{ position: "relative", width: SCREEN.w, height: SCREEN.h, overflow: "hidden", borderRadius: 5, background: "#0b0708" }}>
              {beats.map((b, i) => {
                const o = i === cur ? 1 : i === cur + 1 ? xfade(cur) : 0;
                return o > 0 ? screenImg(b.src, o) : null;
              })}
              {/* the end card sits over the brief again, the first screen of the film */}
              {backToBrief > 0 ? <div key="end" style={{ position: "absolute", inset: 0 }}>{screenImg(beats[0].src, 1)}</div> : null}
              {spot && spot.a > 0 ? (
                <div style={{
                  position: "absolute", left: spot.r[0], top: spot.r[1], width: spot.r[2] - spot.r[0], height: spot.r[3] - spot.r[1], borderRadius: 16,
                  boxShadow: `0 0 0 4000px rgba(8,5,6,${0.62 * spot.a}), 0 0 0 1.5px rgba(226,24,51,${0.55 * spot.a}), 0 0 40px rgba(226,24,51,${0.18 * spot.a})`,
                }} />
              ) : null}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(102deg, rgba(255,255,255,.075) 0%, rgba(255,255,255,.024) 17%, rgba(255,255,255,0) 37%)" }} />
              <div style={{ position: "absolute", inset: 0, background: `rgba(11,7,8,${Math.max(laptopDim, dip * 0.92)})` }} />
            </div>
          </div>
          <div style={{ width: LID.w, height: 7, background: "linear-gradient(180deg, #0a0809, #171214)", boxShadow: "0 1px 0 rgba(255,255,255,.05)" }} />
          <div style={{
            position: "relative", width: BASE_W, height: 26, marginLeft: -74, borderRadius: "0 0 15px 15px",
            background: "linear-gradient(180deg, #4d4645 0%, #2e2729 24%, #1c1719 72%, #100d0e 100%)",
            clipPath: "polygon(0 0, 100% 0, 98.6% 100%, 1.4% 100%)",
          }} />
        </div>
      </div>

      {/* frame-space shading so the words always read */}
      {width > height ? (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 760,
          background: "linear-gradient(90deg, rgba(11,7,8,.94) 0%, rgba(11,7,8,.8) 60%, rgba(11,7,8,0) 100%)" }} />
      ) : (
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: W.top + W.size * 3.6,
          background: "linear-gradient(180deg, rgba(11,7,8,.96) 0%, rgba(11,7,8,.86) 62%, rgba(11,7,8,0) 100%)" }} />
      )}

      {beats.map((b, i) => {
        const s0 = beatStart(i);
        if (frame < (i === 0 ? 0 : s0 - 2) || frame > s0 + 112) return null;
        const out = interpolate(frame, [s0 + 100, s0 + 110], [0, 1], clamp);
        const dimA = interpolate(frame, [s0 + 62, s0 + 76], [1, 0.5], clamp);
        return (
          <div key={i} style={{ ...wordBox, opacity: 1 - out, translate: `0 ${-out * 12}px` }}>
            <div style={{ ...lineIn(i === 0 ? 0 : s0 + 2), color: `rgba(255,255,255,${dimA})` }}>{b.a}</div>
            <div style={lineIn(s0 + 62)}>{b.b}</div>
          </div>
        );
      })}

      <div style={{ ...wordBox, opacity: brandIn }}>
        <Img src={staticFile("wall/campusai-wordmark-white.svg")}
          style={{ width: W.size * 4.1, display: "block", transform: `translateY(${(1 - brandIn) * 18}px)` }} />
        <div style={{ marginTop: W.size * 0.45, fontSize: W.size * 0.8, opacity: tagIn, transform: `translateY(${(1 - tagIn) * 20}px)` }}>
          Your student
          <br />
          operating system
        </div>
        {ending === "ig" ? (
          <div style={{ marginTop: W.size * 0.3, fontSize: W.size * 0.5, color: "rgba(255,255,255,.55)", opacity: bioIn,
            transform: `translateY(${(1 - bioIn) * 14}px)` }}>
            Link in bio.
          </div>
        ) : null}
      </div>

      <Watermark src="brand/campusai-logo-white.svg" side="right" fadeOutAt={BRAND} />
    </AbsoluteFill>
  );
};
