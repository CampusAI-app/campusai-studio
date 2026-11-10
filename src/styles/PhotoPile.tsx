/**
 * /photo-pile (2026-11-10, name from Shaan Johari's "Black Friday Styles Part 6, made with Claude Code" reel via Muse;
 * his prompts are DM-gated and were never seen, so this is our own build of the look). Instant photos drop one after
 * another onto a sheet of tomato paper until the pile covers the frame, then the camera pushes in, the photos blur and fly
 * outward off frame, and underneath sits the clean product shot with one huge number and a dark pill sliding up under it,
 * blurred to sharp.
 *
 * Every photo is a REAL crop of a demo capture (the events page by default), never a rebuilt card. The number is the
 * count the page itself shows.
 *
 * Motion in numbers (30 fps): the first photo lands at frame 4; later photos start 8, 7, 6, 5 then 4 frames apart, so
 * eleven land in about 1.8 s. Each one falls from 1.55x scale (closer to the lens) to 1x on a spring (damping 12,
 * stiffness 170) with 9 deg of extra turn settling out, its shadow tightening as it lands. The pile breathes 1 to 1.03
 * for 0.4 s, then over 24 frames the camera pushes 1.03 to 1.55 while each photo flies 1500 px out along its own line
 * from the centre with up to 22 px of blur. The reveal starts 8 frames into the push: the number goes from 1.25x and
 * 26 px blur to sharp in 22 frames, the pill slides 60 px up from blurred 12 frames later, the product shot de-blurs
 * beneath them.
 */
import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";
import { CURVE, readHold } from "../system/motion";
import { Cue, clamp, ramp } from "./common";
import { World } from "./world";

const { fontFamily: SCHIBSTED } = loadFont("normal", { weights: ["500", "600", "800", "900"], subsets: ["latin"] });

// its own world: tomato paper with a fibre grain, white instant-photo frames, oxblood pill, cream type
const TOMATO = "#EE5444";
const TOMATO_LIGHT = "#F8705C";
const TOMATO_DEEP = "#D63B33";
const FRAME = "#FBF8F2";
const PILL = "#2B0B09";
const CREAM = "#FFEDE6";
const FPS = 30;

type Box = { x: number; y: number; w: number; h: number };

export type PhotoPileProps = {
  /** The capture every photo is cut from, in `public/`, and its pixel size. */
  photoSrc: string;
  photoImage: { w: number; h: number };
  /** One crop per photo, in the capture's pixels, ideally all the same shape (the frames are instant-wide). */
  photos: Box[];
  /** The clean product shot under the pile: a capture and its crop (tall crops bleed off the foot and rise slowly). */
  shot: { src: string; crop: Box };
  /** Optional: the box on the shot (capture pixels) where the page itself shows the number; a ring draws round it. */
  mark?: Box;
  /** The one huge number, true on the shot. */
  big: string;
  /** What the number counts, in the dark pill, a few words. */
  pill: string;
  source: string;
  cta?: string;
};

// where each photo lands (centre x, centre y, turn), laid so eleven cover a 1080 x 1920 frame; later ones nearer the middle
const SPOTS: [number, number, number][] = [
  [540, 980, -6], [360, 610, 14], [720, 1340, -18], [320, 1470, 9], [770, 560, -12], [520, 250, 19],
  [290, 1030, -21], [800, 990, 15], [560, 1720, -10], [270, 290, -5], [600, 1170, 23], [470, 800, -14],
];
const GAPS = [8, 7, 6, 6, 5, 5, 4, 4, 4, 4, 4];
const FIRST = 4;
const PIC_W = 660;
const SIDE = 24;
const FOOT = 84;

export const photoPilePlan = (p: PhotoPileProps) => {
  const starts: number[] = [];
  let t = FIRST - 4; // the spring reaches the paper about 4 frames after it starts
  p.photos.forEach((_, i) => { starts.push(t); t += GAPS[Math.min(i, GAPS.length - 1)]; });
  const piled = starts[starts.length - 1] + 12;
  const push = piled + 12;
  const reveal = push + 8;
  const pillAt = reveal + 12;
  const ringAt = pillAt + 18;
  const end = pillAt + 10 + Math.round(readHold(`${p.big} ${p.pill}`) * FPS);
  return { starts, piled, push, reveal, pillAt, ringAt, end };
};
export const photoPileEnd = (p: PhotoPileProps) => photoPilePlan(p).end;

const Photo: React.FC<{ p: PhotoPileProps; box: Box; i: number; start: number; push: number }> = ({ p, box, i, start, push }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < start) return null;
  const [cx, cy, rot] = SPOTS[i % SPOTS.length];
  const land = spring({ frame: f - start, fps, config: { damping: 12, stiffness: 170 } });
  const lift = 1 - Math.min(1, land);
  const scale = 1 + 0.55 * (1 - land);
  const turn = rot + (i % 2 ? 9 : -9) * (1 - land);
  // the scatter: straight out along its own line from the frame's centre, faster the further out it already sits
  const out = ramp(f, push, push + 24, CURVE.quiet.exit);
  let dx = cx - 540;
  let dy = cy - 960;
  const len = Math.hypot(dx, dy);
  if (len < 60) { dx = i % 2 ? 1 : -1; dy = -0.4; } // the centre photo still leaves, sideways
  const n = Math.hypot(dx, dy);
  const fly = 1500 * out;
  const tx = (dx / n) * fly;
  const ty = (dy / n) * fly;
  const blur = 22 * out;
  const picH = Math.round((PIC_W * box.h) / box.w);
  const s = PIC_W / box.w;
  return (
    <div style={{ position: "absolute", left: cx - (PIC_W + SIDE * 2) / 2, top: cy - (picH + SIDE + FOOT) / 2, width: PIC_W + SIDE * 2, height: picH + SIDE + FOOT,
      background: FRAME, borderRadius: 6, opacity: Math.min(1, (f - start) / 2),
      transform: `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) rotate(${(turn + out * (i % 2 ? 30 : -30)).toFixed(2)}deg) scale(${scale.toFixed(4)})`,
      filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined,
      boxShadow: `0 ${(5 + lift * 34).toFixed(1)}px ${(10 + lift * 46).toFixed(1)}px rgba(70,8,4,${(0.42 - lift * 0.2).toFixed(3)}), 0 1px 2px rgba(70,8,4,.25)` }}>
      <div style={{ position: "absolute", left: SIDE, top: SIDE, width: PIC_W, height: picH, overflow: "hidden", background: "#0b0708" }}>
        <Img src={staticFile(p.photoSrc)} style={{ position: "absolute", width: p.photoImage.w * s, height: p.photoImage.h * s, left: -box.x * s, top: -box.y * s, maxWidth: "none" }} />
        {/* the gloss of instant film */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(125deg, rgba(255,255,255,.10), transparent 38%, transparent 70%, rgba(255,255,255,.05))" }} />
      </div>
    </div>
  );
};

export const PhotoPile: React.FC<PhotoPileProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const { starts, piled, push, reveal, pillAt, ringAt, end } = photoPilePlan(p);
  const cam = interpolate(f, [piled, push], [1, 1.03], clamp) + 0.52 * ramp(f, push, push + 24, CURVE.quiet.exit);
  // the reveal: number, pill and shot, each from blurred to sharp
  const num = ramp(f, reveal, reveal + 22, CURVE.showy.enter);
  const pillK = ramp(f, pillAt, pillAt + 16, CURVE.showy.enter);
  const shotK = ramp(f, reveal - 4, reveal + 24, CURVE.quiet.enter);
  const srcK = ramp(f, pillAt + 10, pillAt + 24, CURVE.quiet.enter);
  const pop = spring({ frame: f - reveal, fps, config: { damping: 13, stiffness: 140 } });
  const SHOT_W = width - 80;
  const shotH = Math.round((SHOT_W * p.shot.crop.h) / p.shot.crop.w);
  const shotScale = SHOT_W / p.shot.crop.w;
  const drift = interpolate(f, [pillAt, end], [1, 1.025], clamp);
  // the shot keeps rising through the hold, so the page is still being read when the number has landed
  const rise = interpolate(f, [reveal, end], [0, -70], clamp);
  const ring = ramp(f, ringAt, ringAt + 14, CURVE.quiet.enter);
  return (
    <World endAt={end} cta={p.cta} font={SCHIBSTED} fontWeight={800} ink={PILL} logo="dark" logoSpot="top-left" end="drop" endGround={FRAME}
      ground={`radial-gradient(ellipse 80% 55% at 35% 20%, ${TOMATO_LIGHT}, transparent 70%), radial-gradient(ellipse 90% 70% at 50% 110%, ${TOMATO_DEEP}, transparent 70%), ${TOMATO}`}>
      {/* paper grain: fine speckle plus long fibres, fixed so it never boils */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 0.5 }}>
        <filter id="pp-grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.12  0 0 0 0 0.08  0 0 0 -1.4 0.9" /></filter>
        <filter id="pp-fibre"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves={2} seed={11} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 -2.2 1.25" /></filter>
        <rect width="100%" height="100%" filter="url(#pp-grain)" opacity={0.35} />
        <rect width="100%" height="100%" filter="url(#pp-fibre)" opacity={0.5} />
      </svg>

      {/* the reveal, sitting under the pile the whole time */}
      {f >= reveal - 4 ? (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${drift.toFixed(4)})` }}>
          <div style={{ position: "absolute", left: 40, top: 800 + rise, width: SHOT_W, height: shotH, borderRadius: 22, overflow: "hidden", opacity: shotK,
            filter: `blur(${((1 - shotK) * 16).toFixed(1)}px)`, transform: `scale(${(1.06 - 0.06 * shotK).toFixed(4)})`, transformOrigin: "50% 0%",
            boxShadow: "0 30px 70px rgba(70,8,4,.45), 0 0 0 2px rgba(255,255,255,.08)" }}>
            <Img src={staticFile(p.shot.src)} style={{ position: "absolute", left: -p.shot.crop.x * shotScale, top: -p.shot.crop.y * shotScale, width: "auto", height: "auto",
              transform: `scale(${shotScale})`, transformOrigin: "0 0", maxWidth: "none" }} />
            {p.mark ? (() => {
              const m = p.mark;
              const x = (m.x - p.shot.crop.x) * shotScale - 12, y = (m.y - p.shot.crop.y) * shotScale - 10, w = m.w * shotScale + 24, h = m.h * shotScale + 20;
              const per = 2 * (w + h);
              return (
                <svg width={SHOT_W} height={shotH} style={{ position: "absolute", left: 0, top: 0 }}>
                  <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="none" stroke={CREAM} strokeWidth={5} strokeDasharray={per} strokeDashoffset={per * (1 - ring)} opacity={ring > 0 ? 1 : 0} />
                </svg>
              );
            })() : null}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", fontFamily: SCHIBSTED, fontWeight: 900, fontSize: 470, lineHeight: 0.86,
            letterSpacing: "-0.05em", color: "#FFFFFF", opacity: num, filter: `blur(${((1 - num) * 26).toFixed(1)}px)`,
            transform: `scale(${(1.25 - 0.25 * Math.min(1, pop)).toFixed(4)})`, textShadow: "0 18px 40px rgba(90,10,6,.35)" }}>{p.big}</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 612, display: "flex", justifyContent: "center", opacity: pillK,
            transform: `translateY(${((1 - pillK) * 60).toFixed(1)}px)`, filter: `blur(${((1 - pillK) * 10).toFixed(1)}px)` }}>
            <div style={{ background: PILL, color: CREAM, fontFamily: SCHIBSTED, fontWeight: 600, fontSize: 50, letterSpacing: "-0.01em", padding: "20px 46px 24px", borderRadius: 999,
              boxShadow: "0 12px 30px rgba(60,6,4,.35)" }}>{p.pill}</div>
          </div>
          {/* the shot fades into the paper at the foot, where the credit sits */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 1420, height: 500, background: `linear-gradient(180deg, rgba(238,84,68,0), ${TOMATO} 48%)`, opacity: shotK }} />
          <div style={{ position: "absolute", left: 64, right: 64, top: 1690, textAlign: "center", fontFamily: SCHIBSTED, fontWeight: 500, fontSize: 34, color: CREAM,
            opacity: 0.9 * srcK }}>{p.source}</div>
        </div>
      ) : null}

      {/* the pile, under the one camera */}
      <div style={{ position: "absolute", inset: 0, transform: `scale(${cam.toFixed(4)})`, transformOrigin: "50% 50%" }}>
        {p.photos.map((box, i) => <Photo key={i} p={p} box={box} i={i} start={starts[i]} push={push} />)}
      </div>

      {starts.map((s, i) => <Cue key={i} at={s + 4} name={i % 3 === 2 ? "paper-slide" : "paper-move-quick"} volume={0.3} />)}
      <Cue at={push} name="swoosh-slow" volume={0.45} />
      <Cue at={reveal + 4} name="bass-hit-short" volume={0.55} />
      <Cue at={pillAt + 4} name="switch-tap" volume={0.4} />
      {p.mark ? <Cue at={ringAt} name="marker-pen-line" volume={0.35} /> : null}
    </World>
  );
};
