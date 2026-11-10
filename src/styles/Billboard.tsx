/**
 * /billboard (2026-11-10, name and look from Shaan Johari's "Black Friday Styles Part 6, made with Claude Code" reel via
 * Muse; his prompts are DM-gated and were never seen, so this is our own build). A night drive on a wet highway under an
 * oxblood sky, in the rain: lane dashes rush at the camera, red tail lights trail and smear on the wet road, street lamps
 * whip past, a green road sign slides by on the left. Ahead, a lit billboard on two posts shows a short teaser on a
 * red-orange panel. The car slows, drifts right and stops under it, the camera turning up until the board fills most of
 * the frame, then the face turns like a tri-vision board, ten vertical slats flipping left to right, to the real ad: a
 * real capture as the product on the left, the headline and a pill on the right, lit from below by four board lamps, the
 * whole face mirrored and blurred in the wet road. A beat to read it, the camera goes in to the product on the board and
 * back out, then it tilts up and the slats turn once more to a red face, where the end logo lands, the traffic still
 * running below. The board is the end card.
 *
 * Motion in numbers (30 fps): travel 72 frames (2.4 s), board from 40 m to 13 m, ease out with exponent 2.6 (about
 * 29 m/s at the start, stopped at the end); lane change 1.8 m to 7 m and a turn of up to ~210 px toward the board, a
 * tilt of 200 px, both in the back two thirds of the travel; a creep from 13 m to 11.5 m over the hold. Each flip: a
 * slat turns 180 degrees in 5 frames (0.17 s), 1 frame apart; the first starts at frame 82 and is done by 96, the
 * seams close 3 frames later. Then at least 45 frames on the whole board, 24 frames in to 2x about the capture, 30 on
 * it, 24 back out, a 26 frame tilt that centres the board, and the logo flip 6 frames before the end card.
 * Faces: Big Shoulders for the board, Overpass (the open highway face) for the road sign and the small line.
 */
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as shouldersFont } from "@remotion/google-fonts/BigShoulders";
import { loadFont as overpassFont } from "@remotion/google-fonts/Overpass";
import { CURVE, readHold } from "../system/motion";
import { B, Cue, clamp, ramp } from "./common";
import { World } from "./world";

const { fontFamily: SHOULDERS } = shouldersFont("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin"] });
const { fontFamily: OVERPASS } = overpassFont("normal", { weights: ["500", "700"], subsets: ["latin"] });

// the night: oxblood sky, a near-black wet road, sodium-pink lamps, red tail lights
const SKY_TOP = "#14030A";
const SKY_MID = "#3A0A14";
const SKY_LOW = "#7A1C22";
const FIELD = "#0E0507";
const ROAD = "#160A0C";
const LAMP = "#FFC09A";
const TAIL = "#FF2A2E";
const SIGN = "#0F5A3E";
const TEASER = "#E5402B";
const VINYL = "#F4E5D4";
const OXBLOOD = "#3B0710";
const RED = "#D9202E";
const CREAM = "#FFF1E4";

export type BillboardProps = {
  /** The board's face as you drive up: a few words, sentence case. */
  teaser: string;
  /** The green road sign that passes on the left: two short lines. Never a real place or route. */
  sign: [string, string];
  /** The ad's product: a real capture from public/ and the part of it to show (pixels of the file). */
  capture: { src: string; w: number; h: number; crop: { x: number; y: number; w: number; h: number } };
  /** The ad's headline: one true line. */
  headline: string;
  /** The pill under the headline: a real button label, or the URL. */
  pill: string;
  /** Small line on the road under the board. */
  source: string;
  cta?: string;
};

const F = 900; // focal length, px
const CX = 540;
const VP_Y = 1060;
const CAM_H = 1.5; // eye height, m
const BOARD = { x: 10, zw: 40, w: 14, h: 8, bottom: 2.5 }; // face bottom 4 m above the road
const STOP = 72;
const TRAVEL = BOARD.zw - 13;
const CREEP = 1.5;
const FLIP = 82;
const SLATS = 10;
const SLAT_TURN = 5;
const ZOOM = 24; // the push from the whole board to its product, and back, frames
const ZOOM_K = 2.0;
const ON_PRODUCT = 30;
const FW = 1400; // face design size
const FH = 800;

const travel = (u: number) => 1 - Math.pow(1 - u, 2.6);

export const billboardPlan = (p: BillboardProps) => {
  const flipped = FLIP + (SLATS - 1) + SLAT_TURN;
  // read the board, go in to the product and hold, come back out, then the face turns to the logo
  const zoomAt = flipped + Math.max(45, Math.round(readHold(`${p.headline} ${p.pill}`) * 0.6 * 30));
  const back = zoomAt + ZOOM + ON_PRODUCT + ZOOM;
  const end = back + 40;
  return { flipped, zoomAt, back, end, logoFlip: end - 6 };
};
export const billboardEnd = (p: BillboardProps) => billboardPlan(p).end;

type Cam = { z: number; x: number; yaw: number; pitch: number; bob: number; speed: number };
const camAt = (f: number, end: number): Cam => {
  const u = Math.min(1, Math.max(0, f / STOP));
  const k = travel(u);
  const creep = interpolate(f, [STOP, end], [0, CREEP], { ...clamp, easing: CURVE.quiet.standard });
  const z = TRAVEL * k + creep;
  const w = interpolate(u, [0.28, 1], [0, 1], { ...clamp, easing: CURVE.quiet.standard });
  const x = 1.8 + 5.2 * w; // ends on the shoulder line, so the right lane can pass
  const boardZ = BOARD.zw - z;
  const yaw = w * ((BOARD.x - x) * F) / boardZ;
  const speed = Math.pow(1 - u, 1.2);
  const bob = Math.sin(f * 1.7) * 2.2 * speed + Math.sin(f * 0.37) * 1.2;
  // before the end the camera tilts up a little more, so the board sits in the middle of the frame for the logo
  const centre = 960 - (VP_Y + 200 - ((BOARD.bottom + BOARD.h / 2) * F) / (BOARD.zw - TRAVEL - CREEP));
  const tilt = ramp(f, end - 34, end - 8, CURVE.quiet.standard) * centre;
  return { z, x, yaw, pitch: w * 200 + tilt, bob, speed };
};

/** World point to screen. Y is metres above the eye; Zw is metres down the road from the start. */
const project = (c: Cam, X: number, Y: number, Zw: number) => {
  const Z = Zw - c.z;
  return { x: CX + ((X - c.x) * F) / Z - c.yaw, y: VP_Y + c.pitch + c.bob - (Y * F) / Z, Z, s: F / Z };
};

// traffic: lane centre, where it starts, its speed (m/s). The last four come up from behind during the hold.
const CARS = [
  { X: 1.8, z0: 22, v: 20 }, { X: -1.8, z0: 40, v: 22 }, { X: -5.4, z0: 70, v: 24 }, { X: 5.4, z0: 90, v: 19 },
  { X: 1.8, z0: 120, v: 21 }, { X: -1.8, z0: 160, v: 23 }, { X: -5.4, z0: 18, v: 26 }, { X: 1.8, z0: 210, v: 22 },
  { X: -1.8, z0: -40, v: 34 }, { X: 1.8, z0: -20, v: 30 }, { X: 5.4, z0: -95, v: 27 }, { X: -5.4, z0: -150, v: 38 },
  { X: 5.4, z0: -160, v: 26 }, { X: 1.8, z0: -230, v: 30 },
  // these pass under the end card
  { X: 5.4, z0: -227, v: 28 }, { X: 1.8, z0: -285, v: 31 }, { X: 5.4, z0: -255, v: 26 }, { X: -1.8, z0: -387, v: 36 },
];

const hash = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

const Road: React.FC<{ f: number; end: number }> = ({ f, end }) => {
  // the camera stops at the end; the traffic and the rain keep going
  const fc = Math.min(f, end);
  const c = camAt(fc, end);
  const prev = camAt(Math.max(0, fc - 2), end);
  const t = f / 30;
  const near = c.z + 1.6;
  const far = c.z + 600;
  const edge = (X: number) => [project(c, X, -CAM_H, near), project(c, X, -CAM_H, far)];
  const [l0, l1] = edge(-9);
  const [r0, r1] = edge(9);
  const horizon = VP_Y + c.pitch + c.bob;
  const dashes: React.ReactNode[] = [];
  for (const X of [-3.6, 0, 3.6]) {
    const first = Math.ceil(c.z / 12) * 12;
    for (let zw = first; zw < c.z + 260; zw += 12) {
      const a = Math.max(zw, near);
      const b = zw + 3;
      if (b <= near) continue;
      const p = [project(c, X - 0.08, -CAM_H, a), project(c, X + 0.08, -CAM_H, a), project(c, X + 0.08, -CAM_H, b), project(c, X - 0.08, -CAM_H, b)];
      const fade = interpolate(zw - c.z, [0, 220], [0.85, 0.1], clamp);
      dashes.push(<polygon key={`d${X}-${zw}`} points={p.map((q) => `${q.x},${q.y}`).join(" ")} fill="#D8C4B6" opacity={fade} />);
    }
  }
  const lines = [-7.2, 7.2].map((X) => {
    const [a, b] = edge(X);
    return <line key={`e${X}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#C9B2A2" strokeOpacity={0.55} strokeWidth={5} />;
  });
  // street lamps on the median, every 40 m: pole, glow, a streak from where it was two frames ago, a smear on the wet road
  const lamps: React.ReactNode[] = [];
  for (let zw = 20; zw < 420; zw += 40) {
    const q = project(c, -9.6, 7.5, zw);
    if (q.Z < 2) continue;
    const o = project(prev, -9.6, 7.5, zw);
    const g = project(c, -9.6, -CAM_H, zw);
    const r = Math.max(2, 0.35 * q.s);
    const fade = interpolate(q.Z, [2, 30, 400], [0.4, 1, 0.35], clamp);
    lamps.push(
      <g key={`l${zw}`} opacity={fade}>
        <line x1={g.x} y1={g.y} x2={q.x} y2={q.y} stroke="#2A1215" strokeWidth={Math.max(1, 0.25 * q.s)} />
        <ellipse cx={g.x} cy={g.y + (g.y - q.y) * 0.9} rx={Math.max(3, 0.7 * q.s)} ry={(g.y - q.y) * 1.0} fill="url(#lampSmear)" opacity={0.7} />
        <circle cx={q.x} cy={q.y} r={r * 6} fill="url(#lampGlow)" />
        <line x1={o.x} y1={o.y} x2={q.x} y2={q.y} stroke={LAMP} strokeWidth={r * 1.6} strokeLinecap="round" opacity={0.9} />
      </g>,
    );
  }
  // tail lights
  const cars = CARS.map((car, i) => {
    const zw = car.z0 + car.v * t;
    const L = project(c, car.X - 0.72, -0.75, zw);
    if (L.Z < 3 || L.Z > 520) return null;
    const R = project(c, car.X + 0.72, -0.75, zw);
    // a light trail: where each lamp was over the last six frames, fading
    const trail = (dx: number) => Array.from({ length: 7 }, (_, k) => project(camAt(Math.max(0, fc - k), end), car.X + dx, -0.75, car.z0 + car.v * Math.max(0, t - k / 30)))
      .filter((q) => q.Z > 2.5);
    const g = project(c, car.X, -CAM_H, zw);
    const r = Math.max(1.8, 0.12 * L.s);
    const body = [project(c, car.X - 0.95, -1.45, zw), project(c, car.X + 0.95, -0.1, zw)];
    const fade = interpolate(L.Z, [3, 8, 520], [0.6, 1, 0.5], clamp);
    const smear = (g.y - L.y) * 7;
    return (
      <g key={`c${i}`} opacity={fade}>
        <rect x={body[0].x} y={body[1].y} width={body[1].x - body[0].x} height={body[0].y - body[1].y} rx={0.2 * L.s} fill="#080304" opacity={0.92} />
        {[L, R].map((q, j) => (
          <g key={j}>
            <rect x={q.x - r * 1.2} y={q.y} width={r * 2.4} height={smear} fill="url(#tailSmear)" opacity={0.75} />
            <circle cx={q.x} cy={q.y} r={r * 5} fill="url(#tailGlow)" />
          </g>
        ))}
        {[-0.72, 0.72].map((dx) => {
          const pts = trail(dx);
          return pts.slice(1).map((q, k) => (
            <line key={`${dx}-${k}`} x1={pts[k].x} y1={pts[k].y} x2={q.x} y2={q.y} stroke={TAIL} strokeWidth={r * 1.7 * (1 - k * 0.1)} strokeLinecap="round" opacity={1 - k / 6} />
          ));
        })}
      </g>
    );
  });
  // the board's posts and the glow it throws on the wet shoulder
  const posts = [BOARD.x - 2.2, BOARD.x + 2.2].map((X) => {
    const top = project(c, X, BOARD.bottom, BOARD.zw + 0.4);
    const foot = project(c, X, -CAM_H, BOARD.zw + 0.4);
    const w = 0.45 * top.s;
    return <rect key={`p${X}`} x={top.x - w / 2} y={top.y} width={w} height={foot.y - top.y} fill="#1C0B0E" />;
  });
  const bFoot = project(c, BOARD.x, -CAM_H, BOARD.zw);
  const tree = Array.from({ length: 48 }, (_, i) => {
    const x = -900 + i * 60;
    return `L${x},${-14 - hash(i) * 46} L${x + 30},${-8 - hash(i + 9) * 30}`;
  }).join(" ");
  // drizzle: thin streaks in front of everything, falling fast
  const rain = Array.from({ length: 70 }, (_, i) => {
    const sx = hash(i + 3) * 1180 - 50;
    const sp = 70 + hash(i + 7) * 50;
    const sy = ((hash(i + 11) * 2000 + f * sp) % 2100) - 100;
    return <line key={`r${i}`} x1={sx} y1={sy} x2={sx - 6} y2={sy + 34} stroke="#F6CDBE" strokeOpacity={0.12 + hash(i) * 0.1} strokeWidth={2} />;
  });
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="lampGlow"><stop offset="0" stopColor={LAMP} stopOpacity={0.55} /><stop offset="1" stopColor={LAMP} stopOpacity={0} /></radialGradient>
        <radialGradient id="tailGlow"><stop offset="0" stopColor={TAIL} stopOpacity={0.75} /><stop offset="1" stopColor={TAIL} stopOpacity={0} /></radialGradient>
        <linearGradient id="tailSmear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={TAIL} stopOpacity={0.7} /><stop offset="1" stopColor={TAIL} stopOpacity={0} /></linearGradient>
        <linearGradient id="lampSmear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={LAMP} stopOpacity={0} /><stop offset="0.3" stopColor={LAMP} stopOpacity={0.5} /><stop offset="1" stopColor={LAMP} stopOpacity={0} /></linearGradient>
        <linearGradient id="roadSheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A1418" /><stop offset="0.35" stopColor={ROAD} /><stop offset="1" stopColor="#0A0405" /></linearGradient>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={SKY_LOW} stopOpacity={0} /><stop offset="1" stopColor="#A2302E" stopOpacity={0.45} /></linearGradient>
        <linearGradient id="wet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5A2026" stopOpacity={0.5} /><stop offset="0.25" stopColor="#5A2026" stopOpacity={0} /><stop offset="1" stopColor="#3A1418" stopOpacity={0.25} /></linearGradient>
        <filter id="asphalt" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves={2} seed={4} /><feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.25  0 0 0 0 0.25  0 0 0 1.4 -0.55" /></filter>
        <radialGradient id="boardSpill" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFB98E" stopOpacity={0.28} /><stop offset="1" stopColor="#FFB98E" stopOpacity={0} /></radialGradient>
      </defs>
      {/* horizon haze and a low treeline, a long way off */}
      <rect x={0} y={horizon - 320} width={1080} height={340} fill="url(#haze)" />
      <path d={`M-900,0 ${tree} L2000,0 L2000,40 L-900,40 Z`} transform={`translate(${-c.yaw * 0.98},${horizon})`} fill="#1A060B" />
      <rect x={0} y={horizon} width={1080} height={1920 - horizon} fill={FIELD} />
      <polygon points={`${l0.x},${l0.y} ${l1.x},${l1.y} ${r1.x},${r1.y} ${r0.x},${r0.y}`} fill="url(#roadSheen)" />
      {/* wet asphalt: a fine horizontal grain and the sky's sheen near the horizon; view-bound, so it does not travel */}
      <clipPath id="roadClip"><polygon points={`${l0.x},${l0.y} ${l1.x},${l1.y} ${r1.x},${r1.y} ${r0.x},${r0.y}`} /></clipPath>
      <g clipPath="url(#roadClip)">
        <rect x={0} y={horizon} width={1080} height={1920 - horizon} filter="url(#asphalt)" opacity={0.5} />
        <rect x={0} y={horizon} width={1080} height={1920 - horizon} fill="url(#wet)" />
      </g>
      {lines}
      {dashes}
      <ellipse cx={bFoot.x} cy={bFoot.y + 30} rx={BOARD.w * 0.7 * bFoot.s} ry={2.2 * bFoot.s} fill="url(#boardSpill)" />
      {posts}
      {lamps}
      {cars}
      <g>{rain}</g>
    </svg>
  );
};

/** The two faces, drawn at the design size. */
const Teaser: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ width: FW, height: FH, background: `linear-gradient(180deg, ${TEASER}, #C9261F)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 70, boxSizing: "border-box" }}>
    <div style={{ fontFamily: SHOULDERS, fontWeight: 900, fontSize: 210, lineHeight: 0.9, color: CREAM, textAlign: "center", letterSpacing: "-0.005em" }}>{text}</div>
  </div>
);

/** The face the board turns to for the ending: red, lamp-lit; the end logo lands on it. */
const LogoFace: React.FC = () => <div style={{ width: FW, height: FH, background: `radial-gradient(ellipse 80% 90% at 50% 60%, #E02633, ${RED} 55%, #A8121D)` }} />;

const Ad: React.FC<{ p: BillboardProps }> = ({ p }) => {
  const cw = 640;
  const k = cw / p.capture.crop.w;
  const ch = p.capture.crop.h * k;
  return (
    <div style={{ width: FW, height: FH, background: VINYL, position: "relative", overflow: "hidden" }}>
      <Img src={staticFile(B.logo!.onLight)} style={{ position: "absolute", left: 64, top: 52, width: 250, height: "auto" }} />
      <div style={{ position: "absolute", left: 64, top: 160, width: cw, height: ch, borderRadius: 20, overflow: "hidden", boxShadow: "0 18px 40px rgba(59,7,16,.35)" }}>
        <Img src={staticFile(p.capture.src)} style={{ position: "absolute", left: -p.capture.crop.x * k, top: -p.capture.crop.y * k, width: p.capture.w * k, height: p.capture.h * k, maxWidth: "none" }} />
      </div>
      <div style={{ position: "absolute", left: 760, right: 60, top: 150, fontFamily: SHOULDERS, fontWeight: 800, fontSize: 128, lineHeight: 0.9, color: OXBLOOD, letterSpacing: "-0.005em" }}>{p.headline}</div>
      <div style={{ position: "absolute", left: 760, top: 600, background: RED, color: CREAM, borderRadius: 999, padding: "16px 40px 20px", fontFamily: SHOULDERS, fontWeight: 700, fontSize: 46, whiteSpace: "nowrap" }}>{p.pill}</div>
    </div>
  );
};

const Board: React.FC<{ p: BillboardProps; f: number; end: number }> = ({ p, f, end }) => {
  const { flipped, logoFlip } = billboardPlan(p);
  const c = camAt(Math.min(f, end), end);
  const q = project(c, BOARD.x, BOARD.bottom + BOARD.h / 2, BOARD.zw);
  const s = (BOARD.w * q.s) / FW;
  const sw = FW / SLATS;
  const flicker = 0.94 + 0.06 * Math.sin(f * 0.9) * Math.sin(f * 2.3);
  // the seams between slats show while a face is turning and close up once it has settled
  // once settled the slats overlap by a pixel, so no seam line is left across the ad
  const gap = -1 + 3 * (1 - ramp(f, flipped, flipped + 3)) + 3 * ramp(f, logoFlip - 3, logoFlip) * (1 - ramp(f, logoFlip + 15, logoFlip + 18));
  return (
    <div style={{ position: "absolute", left: q.x - (FW / 2) * s, top: q.y - (FH / 2) * s, width: FW, height: FH + 70, transform: `scale(${s})`, transformOrigin: "0 0" }}>
      {/* frame, then the slats inside it */}
      <div style={{ position: "absolute", inset: -22, bottom: 70 - 22, background: "#1B0A0D", borderRadius: 6, boxShadow: "0 0 0 3px #2C1418" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: FW, height: FH, background: "#120507", perspective: 2600 }}>
        {Array.from({ length: SLATS }, (_, i) => {
          const a = interpolate(f, [FLIP + i, FLIP + i + SLAT_TURN], [0, 180], { ...clamp, easing: CURVE.quiet.standard })
            + interpolate(f, [logoFlip + i, logoFlip + i + SLAT_TURN], [0, 180], { ...clamp, easing: CURVE.quiet.standard });
          const face = (back: boolean) => (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", backfaceVisibility: "hidden", transform: back ? "rotateY(180deg)" : undefined }}>
              <div style={{ position: "absolute", left: -i * sw - gap / 2, top: 0 }}>{back ? <Ad p={p} /> : f >= logoFlip ? <LogoFace /> : <Teaser text={p.teaser} />}</div>
            </div>
          );
          return (
            <div key={i} style={{ position: "absolute", left: i * sw + gap / 2, top: 0, width: sw - gap, height: FH, transformStyle: "preserve-3d", transform: `rotateY(${a}deg)` }}>
              {face(false)}
              {face(true)}
            </div>
          );
        })}
        {/* lit from below: four lamps throw warm light up the face, falling off toward the top */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: flicker,
          background: `${[0.14, 0.38, 0.62, 0.86].map((x) => `radial-gradient(ellipse 22% 70% at ${x * 100}% 104%, rgba(255,226,190,.42), transparent 70%)`).join(", ")}, linear-gradient(0deg, rgba(255,214,170,.18), rgba(0,0,0,.28))`,
          mixBlendMode: "soft-light" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(0deg, rgba(255,220,180,.10), transparent 40%, rgba(20,3,10,.22))" }} />
      </div>
      {/* catwalk and the lamps on their arms */}
      <div style={{ position: "absolute", left: -10, width: FW + 20, top: FH + 22, height: 14, background: "#24100F" }} />
      {[0.14, 0.38, 0.62, 0.86].map((x) => (
        <div key={x} style={{ position: "absolute", left: x * FW - 30, top: FH + 4, width: 60, height: 26, borderRadius: 6, background: "#2E1715" }}>
          <div style={{ position: "absolute", left: 6, right: 6, top: 2, height: 8, borderRadius: 4, background: "#FFE8CF", boxShadow: "0 0 30px 12px rgba(255,214,170,.55)", opacity: flicker }} />
        </div>
      ))}
    </div>
  );
};

/** The green road sign on the left shoulder, on two posts. */
const SIGN_ZW = 24;
const RoadSign: React.FC<{ lines: [string, string]; f: number; end: number }> = ({ lines, f, end }) => {
  const c = camAt(Math.min(f, end), end);
  const q = project(c, -8.4, 3.5 + 1.6, SIGN_ZW);
  if (q.Z < 2.2) return null;
  const s = (6.4 * q.s) / 560;
  const foot = project(c, -8.4, -CAM_H, SIGN_ZW);
  const postH = (foot.y - q.y) / s;
  return (
    <div style={{ position: "absolute", left: q.x - 280 * s, top: q.y - 140 * s, width: 560, height: 280, transform: `scale(${s})`, transformOrigin: "0 0" }}>
      {[150, 410].map((x) => <div key={x} style={{ position: "absolute", left: x - 9, top: 200, width: 18, height: postH + 60, background: "#2A1A1B" }} />)}
      <div style={{ position: "absolute", inset: 0, background: SIGN, borderRadius: 22, border: "8px solid #E9F1EC", boxSizing: "border-box", boxShadow: "inset 0 0 60px rgba(0,0,0,.35)",
        display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 44, color: "#F4F8F5", fontFamily: OVERPASS }}>
        <div style={{ fontWeight: 700, fontSize: 92, lineHeight: 1 }}>{lines[0]}</div>
        <div style={{ fontWeight: 500, fontSize: 58, lineHeight: 1.2, opacity: 0.92 }}>{lines[1]} <span style={{ fontSize: 64 }}>&#8599;</span></div>
      </div>
    </div>
  );
};

export const Billboard: React.FC<BillboardProps> = (p) => {
  const f = useCurrentFrame();
  const { end, flipped, zoomAt, back } = billboardPlan(p);
  const fe = Math.min(f, end);
  const src = ramp(f, flipped + 8, flipped + 20, CURVE.quiet.enter) * (1 - ramp(f, end - 30, end - 18));
  const gy = project(camAt(fe, end), BOARD.x, -CAM_H, BOARD.zw).y; // the road line under the board
  const zk = ramp(f, zoomAt, zoomAt + ZOOM, CURVE.showy.standard) * (1 - ramp(f, back - ZOOM, back, CURVE.showy.standard));
  const bq = project(camAt(fe, end), BOARD.x, BOARD.bottom + BOARD.h / 2, BOARD.zw);
  const bs = (BOARD.w * bq.s) / FW;
  const focus = { x: bq.x + (64 + 320 - FW / 2) * bs, y: bq.y + (160 + 224 - FH / 2) * bs };
  // our own small logo for the first seconds; the board carries the real one after the flip
  const small = ramp(f, 4, 14, CURVE.quiet.enter) * (1 - ramp(f, FLIP - 10, FLIP));
  return (
    // the ending is printed on the board: the face turns to red and the end logo lands on it, the road still running
    <World endAt={end} cta={p.cta} font={SHOULDERS} fontWeight={800} ink={CREAM} logo="white" logoSpot="none" end="wipe-left" endGround="transparent"
      ground={`radial-gradient(ellipse 90% 30% at 50% 58%, rgba(170,46,46,.45), transparent 70%), linear-gradient(180deg, ${SKY_TOP} 0%, ${SKY_MID} 38%, ${SKY_LOW} 62%, ${SKY_MID} 100%)`}>
      {/* a lens move from the whole board in to the product on its left, about the capture's centre, and back out */}
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${focus.x.toFixed(1)}px ${focus.y.toFixed(1)}px`,
        transform: `translate(${((540 - focus.x) * zk).toFixed(1)}px, ${((900 - focus.y) * zk).toFixed(1)}px) scale(${(1 + (ZOOM_K - 1) * zk).toFixed(4)})` }}>
        <Road f={f} end={end} />
        {/* the lit face mirrored in the wet road below its own foot, blurred and broken up by the rain */}
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(${gy.toFixed(1)}px 0 0 0)`, mixBlendMode: "screen", opacity: 0.42,
          maskImage: `linear-gradient(180deg, transparent ${gy}px, #000 ${gy + 60}px, rgba(0,0,0,.35) 1920px)`, WebkitMaskImage: `linear-gradient(180deg, transparent ${gy}px, #000 ${gy + 60}px, rgba(0,0,0,.35) 1920px)` }}>
          <div style={{ position: "absolute", inset: 0, transformOrigin: "0 0", transform: `translateY(${(2 * gy).toFixed(1)}px) scaleY(-1)`, filter: `blur(${14 + 3 * Math.sin(f * 0.6)}px)` }}>
            <Board p={p} f={f} end={end} />
          </div>
        </div>
        <Board p={p} f={f} end={end} />
        <RoadSign lines={p.sign} f={f} end={end} />
      </div>
      <Img src={staticFile(B.logo!.onDark)} style={{ position: "absolute", right: 64, top: 90, width: 200, height: "auto", opacity: small }} />
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 150, fontFamily: OVERPASS, fontWeight: 500, fontSize: 34, color: CREAM, opacity: 0.8 * src, textAlign: "left",
        transform: `translateY(${(1 - src) * 10}px)` }}>{p.source}</div>
      <Cue at={0} name="swoosh-slow" volume={0.5} />
      <Cue at={8} name="air-woosh-quick" volume={0.4} />
      {[0, 3, 6, 9].map((i) => <Cue key={i} at={FLIP + i} name="switch-tap" volume={0.35} />)}
      <Cue at={flipped} name="bass-hit-short" volume={0.45} />
      <Cue at={zoomAt} name="swoosh-slow" volume={0.25} />
      <Cue at={back - ZOOM} name="swoosh-slow" volume={0.22} />
      {[0, 3, 6, 9].map((i) => <Cue key={`e${i}`} at={end - 6 + i} name="switch-tap" volume={0.3} />)}
    </World>
  );
};
