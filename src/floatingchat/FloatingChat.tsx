/**
 * The floating chat window answers on the dashboard (Nov 18). A UMD junior asks when the Merrill internship she
 * saved closes and when she can work on it; the real CampusAI floating window answers over her real dashboard.
 *
 * Footage: films/floating-chat-merrill/capture.mjs (chat.mjs's method: the public demo through localhost, only the
 * answer swapped) into public/floating-chat-merrill/chat/. Every claim in the answer is in that film's facts.md.
 * Framed Stageshow's way (2026-11-18): crop to the window, the dashboard as the ground, one thing moving at a time,
 * the answer as the poster frame (POSTER_FRAME).
 *
 * Render: npx remotion render src/floatingchat/entry.ts FloatingChat-16x9 out/FloatingChat-16x9.mp4
 * Gate:   npm run gate FloatingChat-16x9 -- --entry src/floatingchat/entry.ts
 */
import React from "react";
import { AbsoluteFill, Composition, Img, Sequence, interpolate, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { EASE, EASE_CAMERA, INTER, LogoEnd, LogoOpen, brand, useZodiak } from "../kit";
import { asset, useFrameSeq } from "../system/parts/common";

const B = brand("campusai");
const W = 1920;
const H = 1080;
const FPS = 30;
export const FRAMES = 484; // 16.1 s
export const POSTER_FRAME = 360; // the answer, landed and held

// ---- the recording (page px). The clip is the page region recorded; the window sits 25 px off the page's right and
// bottom edges, which makes that the film's one gutter on every side of it.
const SRC = "floating-chat-merrill/chat/frames.json";
const CLIP = { x: 240, y: 250, w: 1200, h: 650 };
const FROM = 0.4; // seconds into the recording at frame 0: the first letter lands on frame 0

// ---- time (frames)
const T = {
  line: 0, // "Junior at Maryland." fades in (4 f) and reads 2.8 s
  logo: 9, // the small mark, settled top right of the band
  logoOut: 86, // reverse stagger: last in leaves first ...
  lineOut: 88, // ... the line 2 f (67 ms) later
  push: 90, // the band closes, the camera settles on the window and the ground dims (24 f), during the thinking steps
  pushEnd: 114,
  // answer streams about 110 to 138 (recording marks: send 3.28 s, done 4.56 s, then the product's soft trail)
  end: 387, // answer has held 8.3 s (102 letters / 15 + 1.5): push into the window's own CampusAI mark
  logoEnd: 398,
  ask: 395, // "Ask CampusAI anything." holds 2.97 s (22 letters / 15 + 1.5) to the last frame
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const k = (f: number, a: number, b: number, easing = EASE) => interpolate(f, [a, b], [0, 1], { ...clamp, easing });
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

type Cam = { cx: number; cy: number; cw: number };
type View = { x: number; y: number; w: number; h: number };
// band open: the product under a 150 px band; band closed: the product is the whole frame
const VIEW_A: View = { x: 0, y: 150, w: W, h: H - 150 };
const VIEW_B: View = { x: 0, y: 0, w: W, h: H };
// each camera keeps the page's right and bottom edges on the frame's, so the window keeps its own 25 px gutter
const anchored = (cw: number, view: View): Cam => {
  const ch = cw * (view.h / view.w);
  return { cw, cx: 1440 - cw / 2, cy: 900 - ch / 2 };
};
const CAM_A = anchored(1150, VIEW_A);
const CAM_B = anchored(940, VIEW_B);
const CAM_B2 = anchored(930, VIEW_B); // the hold breathes 1%, so it is never a freeze
// the end: into the window's own "CampusAI" mark in its header
const CAM_END: Cam = { cx: 1128, cy: 419, cw: 260 };
// the floating window's outer box on the page (the Nov 18 capture), for the light on it
const WIN = { x: 1057, y: 397, w: 358, h: 478, r: 16 };

const Recording: React.FC<{ t: number; cam: Cam; view: View; feather: number; fade: number; dim: number }> = ({ t, cam, view, feather, fade, dim }) => {
  const seq = useFrameSeq(SRC);
  if (!seq || !seq.frames.length) return null;
  let shown = seq.frames[0];
  for (const fr of seq.frames) {
    if (fr.t <= t) shown = fr;
    else break;
  }
  const s = view.w / cam.cw;
  const left = view.w / 2 + (CLIP.x - cam.cx) * s;
  const top = view.h / 2 + (CLIP.y - cam.cy) * s;
  const mask = feather > 0 ? `linear-gradient(to bottom, transparent 0px, #000 ${(110 * feather).toFixed(1)}px)` : undefined;
  return (
    <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h, overflow: "hidden", opacity: 1 - fade,
      maskImage: mask, WebkitMaskImage: mask }}>
      <Img src={asset(seq.dir + shown.name)} style={{ position: "absolute", left, top, width: CLIP.w * s, height: CLIP.h * s, maxWidth: "none" }} />
      {/* the light: the dashboard stays as the ground, a step darker, so the window leads */}
      {dim > 0 ? (
        <div style={{ position: "absolute", left: view.w / 2 + (WIN.x - cam.cx) * s, top: view.h / 2 + (WIN.y - cam.cy) * s, width: WIN.w * s, height: WIN.h * s,
          borderRadius: WIN.r * s, boxShadow: `0 0 0 4000px rgba(6, 3, 4, ${(0.42 * dim).toFixed(3)}), 0 0 ${(60 * s).toFixed(0)}px ${(20 * s).toFixed(0)}px rgba(6, 3, 4, ${(0.2 * dim).toFixed(3)})` }} />
      ) : null}
    </div>
  );
};

const Cue: React.FC<{ at: number; src: string; v: number }> = ({ at, src, v }) => (
  <Sequence from={at} durationInFrames={60}>
    <Audio src={asset(`plan-my-week/audio/${src}`)} volume={() => v} />
  </Sequence>
);

export const FloatingChat: React.FC = () => {
  const f = useCurrentFrame();
  useZodiak();
  const t = FROM + f / FPS;

  // the band closes and the camera settles, one move
  const p = k(f, T.push, T.pushEnd, EASE_CAMERA);
  const view: View = { x: 0, y: mix(VIEW_A.y, VIEW_B.y, p), w: W, h: mix(VIEW_A.h, VIEW_B.h, p) };
  let cam: Cam = { cx: mix(CAM_A.cx, CAM_B.cx, p), cy: mix(CAM_A.cy, CAM_B.cy, p), cw: mix(CAM_A.cw, CAM_B.cw, p) };
  const breathe = k(f, T.pushEnd, T.end, (x) => x);
  if (f >= T.pushEnd) cam = { cx: mix(CAM_B.cx, CAM_B2.cx, breathe), cy: mix(CAM_B.cy, CAM_B2.cy, breathe), cw: mix(CAM_B.cw, CAM_B2.cw, breathe) };
  // the end: accelerate into the window's own mark while the page goes, and the logo opens from the dark
  const e = k(f, T.end, T.end + 12, (x) => x * x);
  if (f >= T.end) cam = { cx: mix(CAM_B2.cx, CAM_END.cx, e), cy: mix(CAM_B2.cy, CAM_END.cy, e), cw: mix(CAM_B2.cw, CAM_END.cw, e) };
  const fade = k(f, T.end, T.end + 8, (x) => x);

  const lineIn = k(f, T.line, T.line + 4);
  const lineOut = k(f, T.lineOut, T.lineOut + 8);
  const askIn = k(f, T.ask, T.ask + 12);
  const addrIn = k(f, T.ask + 6, T.ask + 16);

  return (
    <AbsoluteFill style={{ background: `${B.color.gradient}, ${B.color.bgDeep}`, overflow: "hidden" }}>
      <Audio src={asset("plan-my-week/audio/tech-house-vibes.mp3")} volume={(fr) => 0.22 * Math.min(1, fr / 8) * Math.min(1, Math.max(0, (FRAMES - fr) / 30))} />
      <Cue at={86} src="ui-select-click.mp3" v={0.5} />
      <Cue at={110} src="ui-message-pop.mp3" v={0.45} />
      <Cue at={T.end - 2} src="swoosh-quick.mp3" v={0.4} />
      <Cue at={T.logoEnd} src="ui-success-soft.mp3" v={0.4} />

      {f < T.end + 9 ? <Recording t={t} cam={cam} view={view} feather={1 - p} fade={fade} dim={p} /> : null}

      {f < T.lineOut + 8 ? (
        <div style={{ position: "absolute", left: 96, top: 46, fontFamily: "Zodiak", fontWeight: 700, fontSize: 60, letterSpacing: "-0.02em",
          color: B.color.ink, opacity: lineIn * (1 - lineOut), transform: `translateY(${(-10 * lineOut).toFixed(2)}px)` }}>
          Junior at Maryland.
        </div>
      ) : null}
      <LogoOpen brand={B} at={T.logo} x={W - 96 - 85} y={84} width={170} leaveAt={T.logoOut} />

      {f >= T.ask ? (
        <div style={{ position: "absolute", left: 0, width: W, top: 330, textAlign: "center", fontFamily: "Zodiak", fontWeight: 700, fontSize: 72,
          letterSpacing: "-0.02em", color: B.color.ink, opacity: askIn, transform: `translateY(${((1 - askIn) * 14).toFixed(2)}px)` }}>
          Ask CampusAI anything.
        </div>
      ) : null}
      <LogoEnd brand={B} at={T.logoEnd} x={W / 2} y={560} width={460} />
      {f >= T.ask + 6 ? (
        <div style={{ position: "absolute", left: 0, width: W, top: 690, textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: 32,
          color: B.color.inkSoft, opacity: addrIn }}>
          campusai.app
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const FloatingChatRoot: React.FC = () => (
  <Composition id="FloatingChat-16x9" component={FloatingChat} durationInFrames={FRAMES} fps={FPS} width={W} height={H} />
);
