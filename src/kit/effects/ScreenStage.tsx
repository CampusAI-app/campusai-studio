/**
 * ScreenStage (2026-11-20, Muse): a product film played on a big monitor inside a dark desk scene, the camera locked off.
 * From XZE Creative's Notion spec film (instagram.com/reel/Df5Ozz2KVRR, read frame by frame): one still shot of a desk at
 * night, a laptop in front showing the product small and soft, a lamp beside it, and behind them a big screen that is the
 * whole stage and the only real light. All motion happens on that screen; the room only answers it with spill.
 *
 * Two ways to use it:
 *  - No `plate`: the room is drawn in code (slatted warm wall, walnut desk, monitor, laptop, a red ball lamp). Low light
 *    and grain carry it; it is a stand-in until a real plate is filmed.
 *  - `plate`: a real locked-off photo or clip of a desk with a monitor (any phone, tripod, monitor showing plain white).
 *    Give the screen's four corners in frame px and the film is pinned onto it in perspective, spill and glass on top.
 *
 * `screen` renders at `screenSize` (default 1440 x 900, the demo's own CSS size) and is projected onto the quad, so a
 * film inside it is authored flat. `light` is the screen's colour and strength this frame ("r, g, b", 0 to 1); the
 * film knows its beats, so it passes them in and the wall, desk and lamp take that light.
 */
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, random, staticFile, useCurrentFrame } from "remotion";

export type Pt = [number, number];
export type Quad = [Pt, Pt, Pt, Pt]; // top-left, top-right, bottom-right, bottom-left

export type ScreenStagePlate = { src: string; video?: boolean; screen: Quad; laptop?: Quad };

export type ScreenStageProps = {
  /** The film on the big screen, authored flat at `screenSize`. */
  screen: React.ReactNode;
  screenSize?: [number, number];
  /** What the foreground laptop shows (a capture under public/), or null for no laptop. Ignored with a plate that has no laptop quad. */
  laptop?: string | null;
  /** The screen's light this frame. */
  light?: { rgb: string; level: number };
  /** The lamp's colour, "r, g, b". */
  lamp?: string;
  /** A real filmed desk. Leave out for the code-drawn room. */
  plate?: ScreenStagePlate;
  /** Text above the screen, the reel's POV line. */
  caption?: React.ReactNode;
  /** Film grain, 0 to 1. */
  grain?: number;
};

/** CSS matrix3d that maps a w x h box (origin top-left) onto a quad. */
export const quadMatrix = (w: number, h: number, q: Quad) => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let g = 0, hh = 0;
  if (dx3 !== 0 || dy3 !== 0) {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (dx3 * dy2 - dx2 * dy3) / den;
    hh = (dx1 * dy3 - dx3 * dy1) / den;
  }
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, c = x0;
  const d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3, f = y0;
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.map((v) => +v.toFixed(9)).join(",")})`;
};

const Pinned: React.FC<{ w: number; h: number; quad: Quad; children: React.ReactNode; style?: React.CSSProperties }> = ({ w, h, quad, children, style }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transformOrigin: "0 0", transform: quadMatrix(w, h, quad), overflow: "hidden", ...style }}>
    {children}
  </div>
);

/** Where the code-drawn room puts things, in a 1080 x 1920 frame. */
export const DESK = {
  screen: [[64, 452], [1020, 436], [1014, 1036], [70, 1046]] as Quad,
  laptop: [[196, 1170], [766, 1162], [759, 1518], [205, 1525]] as Quad,
  lampAt: [918, 1560] as Pt,
  deskTop: 1610,
};

const Grain: React.FC<{ amount: number }> = ({ amount }) => {
  const f = useCurrentFrame();
  if (amount <= 0) return null;
  const seed = Math.floor(random(`g${f}`) * 1000);
  return (
    <AbsoluteFill style={{ opacity: amount, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={`gr${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#gr${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** The code-drawn room behind the screen: wall, desk, monitor body, laptop, lamp. */
const Room: React.FC<{ light: { rgb: string; level: number }; lamp: string; laptop?: string | null; children: React.ReactNode }> = ({ light, lamp, laptop, children }) => {
  const L = light.level;
  const [lx, ly] = DESK.lampAt;
  const s = DESK.screen;
  return (
    <AbsoluteFill style={{ background: "#120806" }}>
      {/* the slatted wall: warm oxblood wood, lit from the screen */}
      <AbsoluteFill
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.42) 0px, rgba(0,0,0,0.42) 4px, rgba(255,200,170,0.035) 6px, rgba(0,0,0,0) 15px, rgba(0,0,0,0.12) 29px, rgba(0,0,0,0.42) 35px), radial-gradient(ellipse 90% 60% at 50% 45%, #2e1510 0%, #1d0c08 55%, #0c0504 100%)",
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 32% at 50% 38%, rgba(${light.rgb}, ${0.42 * L}) 0%, rgba(${light.rgb}, ${0.12 * L}) 45%, rgba(0,0,0,0) 75%)`, mixBlendMode: "screen" }} />
      {/* a warm practical low on the right, so the wall is never flat */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 40% 26% at ${lx / 10.8}% ${ly / 19.2}%, rgba(${lamp}, 0.2) 0%, rgba(${lamp}, 0.05) 50%, rgba(0,0,0,0) 80%)`, mixBlendMode: "screen" }} />
      {/* the monitor: thin black bezel, a shadow on the wall, the stand */}
      <div style={{ position: "absolute", left: 520, top: 1030, width: 40, height: 140, background: "linear-gradient(90deg,#0b0a0a,#1c1a19,#0b0a0a)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, borderRadius: 6, background: "linear-gradient(180deg,#252220,#0c0b0a)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="mshadow" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="28" /></filter>
        </defs>
        <polygon points={s.map(([x, y]) => `${x + 8},${y + 40}`).join(" ")} fill="rgba(0,0,0,0.6)" filter="url(#mshadow)" />
        <polygon points={[[s[0][0] - 12, s[0][1] - 12], [s[1][0] + 12, s[1][1] - 12], [s[2][0] + 12, s[2][1] + 14], [s[3][0] - 12, s[3][1] + 14]].map(([x, y]) => `${x},${y}`).join(" ")} fill="#070707" stroke="#2b2826" strokeWidth={2} />
      </svg>
      {children}
      {/* the desk: dark walnut, the screen and lamp reflected in it */}
      <div style={{ position: "absolute", left: 0, top: DESK.deskTop, width: 1080, height: 1920 - DESK.deskTop, background: "linear-gradient(180deg,#2a1710 0%,#1a0d08 40%,#0d0604 100%)" }} />
      <div style={{ position: "absolute", left: 0, top: DESK.deskTop, width: 1080, height: 1920 - DESK.deskTop, opacity: 0.35, background: "repeating-linear-gradient(178deg, rgba(255,200,160,0.05) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.25) 9px, rgba(0,0,0,0) 14px)" }} />
      <div style={{ position: "absolute", left: 0, top: DESK.deskTop, width: 1080, height: 300, background: `radial-gradient(ellipse 60% 70% at 50% 0%, rgba(${light.rgb}, ${0.3 * L}) 0%, rgba(0,0,0,0) 70%)`, mixBlendMode: "screen" }} />
      {/* laptop */}
      {laptop ? <Laptop src={laptop} /> : null}
      {/* the lamp: a glossy red ball, lit from inside */}
      <div style={{ position: "absolute", left: lx - 92, top: ly - 175, width: 184, height: 184, borderRadius: "50%", background: `radial-gradient(circle at 36% 30%, rgba(255,235,225,0.95) 0%, rgba(${lamp},1) 22%, rgba(${lamp},0.9) 55%, #3a0507 100%)`, boxShadow: `0 0 90px 24px rgba(${lamp}, 0.45), 0 0 220px 80px rgba(${lamp}, 0.18)` }} />
      <div style={{ position: "absolute", left: lx - 80, top: ly + 2, width: 160, height: 26, borderRadius: "50%", background: `radial-gradient(ellipse at 50% 50%, rgba(${lamp},0.5) 0%, rgba(0,0,0,0) 70%)` }} />
      {/* falloff to the corners */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

/** A laptop from the front and a little above: lid with the capture, base with keys in shadow. */
const Laptop: React.FC<{ src: string }> = ({ src }) => {
  const q = DESK.laptop;
  const bez: Quad = [[q[0][0] - 14, q[0][1] - 14], [q[1][0] + 14, q[1][1] - 14], [q[2][0] + 14, q[2][1] + 10], [q[3][0] - 14, q[3][1] + 10]];
  const baseTop = q[3][1] + 12;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="lbase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a3a3d" /><stop offset="1" stopColor="#151517" /></linearGradient>
          <filter id="lshadow"><feGaussianBlur stdDeviation="18" /></filter>
        </defs>
        <ellipse cx={482} cy={baseTop + 92} rx={370} ry={28} fill="rgba(0,0,0,0.8)" filter="url(#lshadow)" />
        <polygon points={bez.map(([x, y]) => `${x},${y}`).join(" ")} fill="#0a0a0b" stroke="#55555a" strokeWidth={2} />
        <polygon points={`${q[3][0] - 26},${baseTop} ${q[2][0] + 26},${baseTop - 4} ${q[2][0] + 96},${baseTop + 72} ${q[3][0] - 96},${baseTop + 78}`} fill="url(#lbase)" />
        <polygon points={`${q[3][0] + 8},${baseTop + 10} ${q[2][0] - 8},${baseTop + 6} ${q[2][0] + 40},${baseTop + 48} ${q[3][0] - 40},${baseTop + 52}`} fill="#0d0d0f" opacity={0.85} />
        <polygon points={`${q[3][0] - 96},${baseTop + 78} ${q[2][0] + 96},${baseTop + 72} ${q[2][0] + 92},${baseTop + 82} ${q[3][0] - 92},${baseTop + 88}`} fill="#0b0b0c" />
      </svg>
      <Pinned w={1440} h={900} quad={q} style={{ filter: "blur(0.6px) brightness(0.92)" }}>
        <Img src={staticFile(src)} style={{ width: 1440, height: 900, display: "block" }} />
        <AbsoluteFill style={{ background: "linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 35%)" }} />
      </Pinned>
    </>
  );
};

export const ScreenStage: React.FC<ScreenStageProps> = ({ screen, screenSize = [1440, 900], laptop = null, light = { rgb: "217, 32, 46", level: 0.6 }, lamp = "217, 32, 46", plate, caption, grain = 0.12 }) => {
  const [sw, sh] = screenSize;
  const quad = plate ? plate.screen : DESK.screen;
  const glass = (
    <Pinned w={sw} h={sh} quad={quad} style={{ pointerEvents: "none" }}>
      {/* glass: a soft sheen top left and a touch of falloff at the edges, so it reads as a lit panel, not a sticker */}
      <AbsoluteFill style={{ background: "linear-gradient(118deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 30%)" }} />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 120px rgba(0,0,0,0.35)" }} />
    </Pinned>
  );
  const film = (
    <>
      <Pinned w={sw} h={sh} quad={quad} style={{ background: "#000", filter: "saturate(1.05) contrast(1.02)" }}>
        {screen}
      </Pinned>
      {glass}
    </>
  );
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {plate ? (
        <>
          {plate.video ? <OffthreadVideo src={staticFile(plate.src)} muted /> : <Img src={staticFile(plate.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          {film}
          {plate.laptop && laptop ? (
            <Pinned w={1440} h={900} quad={plate.laptop} style={{ filter: "blur(0.6px) brightness(0.92)" }}>
              <Img src={staticFile(laptop)} style={{ width: 1440, height: 900 }} />
            </Pinned>
          ) : null}
          <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 40% at 50% 38%, rgba(${light.rgb}, ${0.18 * light.level}) 0%, rgba(0,0,0,0) 70%)`, mixBlendMode: "screen" }} />
        </>
      ) : (
        <Room light={light} lamp={lamp} laptop={laptop}>
          {film}
        </Room>
      )}
      <Grain amount={grain} />
      {caption ? <AbsoluteFill style={{ pointerEvents: "none" }}>{caption}</AbsoluteFill> : null}
    </AbsoluteFill>
  );
};
