/**
 * Campus island (2026-11-26, Muse send 1918bcf7, dnyx studios' Find My Dynamic Island film; Jacob: "let's make one
 * like this"). A Feature Friday post, 9:16, 16.5 s, music and UI cues, no voice.
 *
 * Story (films/campus-island/brief.md): a junior at Maryland, her week lives everywhere; one black pill gathers it,
 * state after state, never cutting: her 9:30 class, the jobs that came in, Friday's coffee chat on the real campus map
 * with a pin on Van Munching Hall, her midterm in 6 days; the pill becomes the ground for "Everything at Maryland, in
 * one place." Every string is the demo's own (films/campus-island/facts.md, captured Nov 26).
 *
 * Built on IslandMorph (src/kit/effects/IslandMorph.tsx). The pill never sits in a phone (web only until the app ships).
 */
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { INTER } from "../kit/parts";
import { pickBed } from "../system/sound/bed";
import {
  IslandComet, IslandFlash, IslandMorph, IslandParticleLogo, IslandPin, IslandWords, islandProject,
} from "../kit/effects/IslandMorph";
import type { IslandState, IslandTilt } from "../kit/effects/IslandMorph";

export const ISLAND_FPS = 30;
export const ISLAND_FRAMES = 495;
const W = 1080;
const H = 1920;
const CX = 540;
const CY = 960;
const P = "post-campus-island/";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// one accent per state, each the product's own colour for that thing
const RED = "#D9202E"; // CampusAI --color-primary
const GREEN = "#33B679"; // the map's class marker, sampled from map-vmh.png
const GOLD = "#FFD200"; // Maryland gold, the map's Van Munching highlight
const GREY = "rgba(255,255,255,0.58)";

// map card: the capture is 1404 x 881; Van Munching's roof sits at (275, 430) on it
const CARD_W = 980;
const CARD_H = Math.round((881 / 1404) * CARD_W);
const PIN_ON_CARD = { x: (275 / 1404 - 0.5) * CARD_W, y: (440 / 881 - 0.5) * CARD_H };

// timeline, frames
const T = {
  cls: 30, // 1.0 s circle stretches into the class pill
  jobs: 96, // 3.2 s widens into the jobs pill
  map: 180, // 6.0 s grows into the map card
  panel: 192,
  tilt2d: 228, // 7.6 s slight turn
  lay: 240, // 8.0 s tips back to lie flat
  pin: 252, // 8.4 s pin drops
  push: 258, // 8.6 s push in on Van Munching as the pin lands
  line: 294, // 9.8 s squashes to a line straight from the flat pose
  up: 298, // stands up while it is only a line (unseen)
  mid: 303, // 10.1 s opens as the midterm
  close: 375, // 12.5 s back to a circle
  cover: 386, // 12.9 s the circle becomes the ground
  logo: 392, // 13.1 s the wordmark glows in
  line1: 420, // 14.0 s
  line2: 436, // 14.5 s
};

const Cap: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  // lucide graduation-cap, the product's own class icon
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </svg>
);

const Check: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const Ring: React.FC<{ local: number; size: number }> = ({ local, size }) => {
  const draw = interpolate(local, [4, 26], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(217,32,46,0.25)" strokeWidth={10} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={RED} strokeWidth={10} fill="none" strokeLinecap="round"
          strokeDasharray={`${c * draw} ${c}`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <IslandWords text="6" local={local} accent={RED} size={58} weight={700} delay={6} />
        <div style={{ marginTop: -2 }}><IslandWords text="days left" local={local} accent={RED} size={20} weight={600} delay={9} stagger={0.4} color={GREY} /></div>
      </div>
    </div>
  );
};

const STATES: IslandState[] = [
  // the dot, already opening at frame 0 over the red tint
  { at: -16, w: 54, h: 54, flash: RED, flashPeak: 0.5 },
  {
    at: -12, w: 176, h: 176, accent: RED,
    content: () => (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Img src={staticFile("private-umd-logo/umd-m.svg")} style={{ width: 84 }} />
      </AbsoluteFill>
    ),
  },
  {
    at: T.cls, w: 640, h: 176, accent: GREEN, flash: GREEN, flashPeak: 0.16,
    content: (l) => (
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <div style={{ width: 92, height: 92, flex: "none", borderRadius: 46, background: "rgba(51,182,121,0.2)", display: "flex", alignItems: "center", justifyContent: "center",
          transform: `scale(${interpolate(l, [2, 10], [0.6, 1], clamp)})` }}>
          <Cap color={GREEN} size={52} />
        </div>
        <IslandWords text="BMGT310 · 9:30am" local={l} accent={GREEN} size={52} />
      </AbsoluteFill>
    ),
  },
  {
    at: T.jobs, w: 960, h: 206, accent: GOLD,
    content: (l) => (
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 34px", gap: 26 }}>
        <Img src={staticFile(`${P}job-logos.png`)} style={{ width: 210, borderRadius: 18, flex: "none",
          transform: `translateX(${interpolate(l, [2, 12], [-30, 0], clamp)}px)` }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <IslandWords text="6 new jobs came in" local={l} accent={GOLD} size={44} />
          <IslandWords text="Matched to you, 2h ago" local={l} accent={GOLD} size={31} weight={500} color={GREY} delay={8} stagger={0.5} />
        </div>
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "14px 20px", borderRadius: 40,
          background: "rgba(255,210,0,0.16)", opacity: interpolate(l, [10, 16], [0, 1], clamp),
          transform: `scale(${interpolate(l, [10, 18], [0.7, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) })})` }}>
          <Check color={GOLD} size={30} />
          <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 30, color: GOLD }}>3 saved</span>
        </div>
      </AbsoluteFill>
    ),
  },
  {
    at: T.map, w: CARD_W, h: CARD_H, radius: 54, accent: GOLD, glow: true,
    content: (l) => {
      const f = l + T.map;
      const pin = interpolate(f, [T.pin + 2, T.pin + 10], [0, 1], clamp);
      return (
        <AbsoluteFill>
          <Img src={staticFile(`${P}map-vmh.png`)} style={{ width: "100%", height: "100%", objectFit: "cover",
            transform: `scale(${interpolate(l, [0, 40], [1.12, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) })})` }} />
          {/* the glass panel, the reference's "Work / ETA" card, holding the event's own strings */}
          <div style={{ position: "absolute", right: 28, bottom: 28, width: 500, padding: "24px 28px", borderRadius: 30,
            background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
            opacity: interpolate(f, [T.panel, T.panel + 8], [0, 1], clamp),
            transform: `translateY(${interpolate(f, [T.panel, T.panel + 12], [24, 0], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) })}px)` }}>
            <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 36, color: "#111", letterSpacing: "-0.02em" }}>Evercore Coffee Chat</div>
            <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 28, color: RED, marginTop: 8 }}>Fri · 10am · On your calendar</div>
            <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 28, color: "#555", marginTop: 6 }}>Van Munching Hall</div>
          </div>
          {/* the ripple where the pin lands, in the card's own plane */}
          <div style={{ position: "absolute", left: CARD_W / 2 + PIN_ON_CARD.x - 90 * (0.4 + pin), top: CARD_H / 2 + PIN_ON_CARD.y - 90 * (0.4 + pin),
            width: 180 * (0.4 + pin), height: 180 * (0.4 + pin), borderRadius: "50%", border: `5px solid ${RED}`, opacity: pin > 0 && pin < 1 ? 1 - pin : 0 }} />
        </AbsoluteFill>
      );
    },
  },
  { at: T.line, w: CARD_W, h: 14, radius: 7, accent: RED },
  {
    at: T.mid, w: 920, h: 312, radius: 74, accent: RED,
    content: (l) => (
      <AbsoluteFill style={{ padding: "30px 34px", display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 28 }}>
          <Ring local={l} size={150} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <IslandWords text="Midterm exam" local={l} accent={RED} size={50} />
            <IslandWords text="BMGT343 · Wed, Dec 2" local={l} accent={RED} size={32} weight={500} color={GREY} delay={9} stagger={0.5} />
          </div>
        </div>
        <div style={{ height: 76, borderRadius: 38, background: "rgba(217,32,46,0.22)", display: "flex", alignItems: "center", justifyContent: "center",
          opacity: interpolate(l, [12, 18], [0, 1], clamp), transform: `scaleX(${interpolate(l, [12, 22], [0.6, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) })})` }}>
          <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 32, color: "#ff5a63" }}>Plan your studying</span>
        </div>
      </AbsoluteFill>
    ),
  },
  {
    at: T.close, w: 176, h: 176, accent: RED, flash: RED, flashPeak: 0.18,
    content: () => (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Img src={staticFile(`${P}spark.svg`)} style={{ width: 70 }} />
      </AbsoluteFill>
    ),
  },
  { at: T.cover, w: 2700, h: 2700, fill: "#0b0708" },
];

const TILT: IslandTilt[] = [
  { at: T.tilt2d, rx: 0, rz: -4 },
  { at: T.lay, rx: 60, rz: -10, dy: 40, scale: 1.04 },
  { at: T.push, rx: 56, rz: -10, dx: 360, dy: 90, scale: 1.4 },
  { at: T.up, rx: 0, rz: 0, dx: 0, dy: 0, scale: 1 },
];

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const out = interpolate(f, [T.jobs - 6, T.jobs + 6], [1, 0], clamp);
  const lift = interpolate(f, [T.jobs - 6, T.jobs + 6], [0, -30], clamp);
  if (out <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontFamily: INTER, fontWeight: 700,
      fontSize: 66, letterSpacing: "-0.035em", lineHeight: 1.12, color: "#0b0b0b", opacity: out, transform: `translateY(${lift}px)` }}>
      <div>Junior at Maryland.</div>
      <div>My week lives <span style={{ color: RED }}>everywhere.</span></div>
    </div>
  );
};

const Watermark: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [T.close - 8, T.close + 4], [1, 0], clamp);
  return o > 0 ? (
    <Img src={staticFile("brand/campusai-logo.svg")} style={{ position: "absolute", left: CX - 120, top: 1740, width: 240, opacity: 0.85 * o }} />
  ) : null;
};

const EndLines: React.FC = () => {
  const f = useCurrentFrame();
  const a = interpolate(f, [T.line1, T.line1 + 10], [0, 1], clamp);
  const b = interpolate(f, [T.line2, T.line2 + 10], [0, 1], clamp);
  const drift = interpolate(f, [T.logo, ISLAND_FRAMES], [0, -14]);
  return (
    <AbsoluteFill style={{ transform: `translateY(${drift}px)` }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: CY + 90, textAlign: "center", fontFamily: INTER, fontWeight: 600, fontSize: 50,
        letterSpacing: "-0.03em", color: "#f7efe6", opacity: a, transform: `translateY(${(1 - a) * 16}px)` }}>
        Everything at Maryland, in one place.
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: CY + 170, textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: 36,
        color: "rgba(247,239,230,0.62)", opacity: b }}>
        Made for Terps. Link in bio.
      </div>
    </AbsoluteFill>
  );
};

const Pin: React.FC = () => {
  const f = useCurrentFrame();
  if (f < T.pin || f > T.line + 4) return null;
  const p = islandProject(TILT, f, ISLAND_FPS, PIN_ON_CARD.x, PIN_ON_CARD.y);
  const o = interpolate(f, [T.line, T.line + 4], [1, 0], clamp);
  const squash = interpolate(f, [T.line, T.line + 4], [1, 0.3], clamp);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o, transform: `scale(${squash})`, transformOrigin: `${CX + p.x}px ${CY + p.y}px` }}>
      <IslandPin x={CX + p.x} y={CY + p.y} at={T.pin} color={RED} size={96} depth={p.depth} />
    </div>
  );
};

const Cue: React.FC<{ at: number; name: string; volume?: number }> = ({ at, name, volume = 0.5 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={60} layout="none">
    <Audio src={staticFile(`sound/cues/${name}.wav`)} volume={volume} />
  </Sequence>
);

const Sound: React.FC = () => {
  const bed = pickBed("PostCampusIsland", ISLAND_FRAMES / ISLAND_FPS);
  return (
    <>
      <Audio src={staticFile(bed.file)} trimBefore={Math.round(bed.startAt * ISLAND_FPS)}
        volume={(f) => 0.3 * bed.gain * interpolate(f, [0, 6, ISLAND_FRAMES - 30, ISLAND_FRAMES], [0, 1, 1, 0], clamp)} />
      <Cue at={0} name="notify-ui-message-pop" volume={0.45} />
      <Cue at={T.cls} name="move-swoosh-quick" volume={0.4} />
      <Cue at={T.jobs} name="notify-ui-message-pop" volume={0.4} />
      <Cue at={T.map} name="arrive-wind-swoosh-short" volume={0.45} />
      <Cue at={T.lay} name="move-swoosh-quick" volume={0.35} />
      <Cue at={T.pin + 8} name="land-ui-popup-dry" volume={0.55} />
      <Cue at={T.line} name="move-swoosh-quick" volume={0.4} />
      <Cue at={T.mid} name="notify-ui-message-pop" volume={0.4} />
      <Cue at={T.close} name="type-switch-tap" volume={0.4} />
      <Cue at={T.cover} name="arrive-wind-swoosh-short" volume={0.4} />
      <Cue at={T.logo + 20} name="logo-bass-hit-futuristic" volume={0.5} />
    </>
  );
};

export const PostCampusIsland: React.FC<{ muted?: boolean }> = ({ muted }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#ffffff", width: W, height: H }}>
      <IslandFlash states={STATES} />
      <Hook />
      <Watermark />
      <IslandMorph states={STATES} tilt={TILT} x={CX} y={CY} shadow={f < T.cover}>
        <IslandComet x={CX} y={CY} w={920} h={312} at={T.line + 2} color={GOLD} frames={15} />
        <Pin />
      </IslandMorph>
      {f >= T.logo - 2 && (
        <>
          <AbsoluteFill style={{ background: `radial-gradient(60% 40% at 50% 100%, rgba(217,32,46,${interpolate(f, [T.logo, T.logo + 40], [0, 0.35], clamp)}), transparent)` }} />
          <IslandParticleLogo src={staticFile("brand/campusai-logo-white.svg")} x={CX} y={CY - 20} width={560} ratio={223 / 53} at={T.logo} frames={24} />
          <EndLines />
        </>
      )}
      {!muted && <Sound />}
    </AbsoluteFill>
  );
};
