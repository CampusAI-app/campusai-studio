/**
 * Scene 1, round 2: the components (shelf shot `card-stack`, re-laid for 9:16).
 *
 * Jacob's note on round 1: drop the "This week you have" opener and just show the product's
 * components. Round 3 adds the CampusAI wordmark at the very start (LogoOpen below), which cost one
 * component (degree progress, since the Planner already appears in the ending). So five real pieces of CampusAI, each captured on its own by
 * `capture/flock-components.cjs`, spring up from below the frame one per beat and pile into a
 * single stack: an event card, a Job Match card, the calendar week, Ask CampusAI,
 * and the daily brief on top. On beat 6 the pile fans out (vertically here, the shelf fans
 * sideways at 16:9) so every component's header shows, and a six-frame crash zoom drives into the
 * daily brief, which is where the graze tour picks up. No headline: the components carry it.
 */
import React from "react";
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame } from "remotion";
import { EASE, Grain, Vignette, bezier, mix, ramp } from "../shots/_fixtures/Polish";
import { B, FIELD_END, FPS } from "./beats";

const CX = 540;
const PILE_Y = 1000;
const FAN_TOP = 250;
const FAN_STEP = 232;
const DROP = 1500;

const PARTS: { src: string; w: number; h: number; width: number }[] = [
  { src: "event", w: 574, h: 210, width: 780 },
  { src: "job", w: 436, h: 158, width: 780 },
  { src: "calendar", w: 968, h: 712, width: 780 },
  { src: "ask", w: 1160, h: 257, width: 920 },
  { src: "brief", w: 1160, h: 372, width: 920 },
].map((p) => ({ ...p, h: (p.h * p.width) / p.w }));

const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
// Round 3: the film opens on the wordmark; the first card rises once it has cleared the centre, the rest land on beats 2-5.
export const LOGO_DEMOTE = 14;
export const START = PARTS.map((_, i) => (i === 0 ? LOGO_DEMOTE + 6 : B(i + 1) + 1));
const FAN_AT = B(6);
const PUSH = FIELD_END - 7;
const FRONT = PARTS.length - 1;
const FRONT_C = { x: CX, y: FAN_TOP + FRONT * FAN_STEP + PARTS[FRONT].h / 2 };

const inAt = (f: number, i: number) => (f < START[i] ? 0 : spring({ frame: f - START[i], fps: FPS, config: { damping: 13, stiffness: 150 } }));

/* ---------- logo open (shelf `title-demote-to-label`) ----------
 * The wordmark de-blurs in at the centre on frame 0, stands until frame 14, then one continuous
 * asymmetric tween shrinks it to a third and carries it to the top of the frame, where it stays
 * as a label over the stack until the crash zoom. It demotes rather than leaves. */
const LOGO_W = 720;
const LOGO_H = LOGO_W * (53 / 223);
const LabelEase = bezier(0.6, 0, 0.18, 1);
const LogoOpen: React.FC<{ f: number; out: number }> = ({ f, out }) => {
  const inK = ramp(f, 0, 10, EASE.snappy);
  const dem = ramp(f, LOGO_DEMOTE, 16, LabelEase);
  const s = mix(mix(1.06, 1, inK), 0.33, dem);
  const cy = mix(940, 150, dem);
  const glow = mix(1, 0.4, dem);
  return (
    <div style={{ position: "absolute", left: CX - LOGO_W / 2, top: cy - LOGO_H / 2, width: LOGO_W, height: LOGO_H, opacity: inK * (1 - out),
      transform: `scale(${s.toFixed(4)})`, filter: `blur(${((1 - inK) * 16).toFixed(2)}px) drop-shadow(0 0 ${(30 * glow).toFixed(1)}px rgba(217,32,46,${(0.6 * glow).toFixed(3)}))` }}>
      <Img src={staticFile("brand/campusai-logo-white.svg")} style={{ width: LOGO_W, height: LOGO_H, display: "block" }} />
    </div>
  );
};

export const ComponentStack: React.FC = () => {
  const f = useCurrentFrame();
  const fan = f < FAN_AT ? 0 : spring({ frame: f - FAN_AT, fps: FPS, config: { damping: 20, stiffness: 110 } });
  // every landing dips the pile a few px, the shelf card's sense of weight
  const dip = START.reduce((d, s) => d + Math.sin(Math.min(1, Math.max(0, (f - s - 6) / 9)) * Math.PI) * 6, 0) * (1 - fan);
  const cam = mix(mix(1, 1.05, ramp(f, 0, FAN_AT, EASE.smooth)), 0.97, ramp(f, FAN_AT, 20, EASE.smooth));
  const push = ramp(f, PUSH, 7, EASE.exit);
  const z = cam * Math.pow(16, push);
  const origin = { x: mix(CX, FRONT_C.x, fan), y: mix(PILE_Y, FRONT_C.y, fan) };
  const flash = Math.max(0, 1 - Math.abs(f - (FIELD_END - 1)) / 4);
  return (
    <AbsoluteFill style={{ background: "#0b0708", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 45% at 50% 52%, rgba(217,32,46,0.2) 0%, rgba(217,32,46,0) 70%)" }} />
      <AbsoluteFill style={{ transformOrigin: `${origin.x}px ${origin.y}px`, transform: `scale(${z.toFixed(4)})` }}>
        <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: "50% 45%" }}>
          {PARTS.map((p, i) => {
            if (f < START[i]) return null;
            const k = inAt(f, i);
            const y0 = (1 - k) * DROP;
            const jitR = (rand(i * 3 + 1) - 0.5) * 6;
            const jitX = (rand(i * 5 + 2) - 0.5) * 28;
            const tilt = (i % 2 ? 1 : -1) * 10 * (y0 / DROP);
            const pileY = PILE_Y - p.h / 2 + y0 + dip;
            const fanY = FAN_TOP + i * FAN_STEP;
            const top = mix(pileY, fanY, fan);
            const rz = mix(jitR + tilt, (i % 2 ? 1 : -1) * 1.2, fan);
            const tx = mix(jitX, 0, fan);
            const rx = mix(0, 9, fan);
            const dim = mix(0, 0.28 * (FRONT - i) / FRONT, fan);
            return (
              <div key={p.src} style={{ position: "absolute", left: CX - p.width / 2, top, width: p.width, height: p.h, zIndex: 10 + i,
                transform: `translate3d(${tx.toFixed(2)}px, 0, ${(i * 30 * fan).toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg)` }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden",
                  boxShadow: `0 0 0 1.5px rgba(255,140,140,0.2), 0 0 70px rgba(217,32,46,0.28), 0 ${(20 + (y0 / DROP) * 40).toFixed(1)}px 70px rgba(0,0,0,0.7)` }}>
                  <Img src={staticFile(`flock/parts/${p.src}.png`)} style={{ width: p.width, height: p.h, display: "block" }} />
                  {dim > 0 && <div style={{ position: "absolute", inset: 0, background: "#0b0708", opacity: dim }} />}
                </div>
              </div>
            );
          })}
        </AbsoluteFill>
      </AbsoluteFill>
      <LogoOpen f={f} out={push} />
      <Vignette strength={0.45} inner={0.5} color="#060304" />
      <Grain opacity={0.06} blend="soft-light" />
      {flash > 0 && <AbsoluteFill style={{ background: `radial-gradient(circle at ${CX}px ${FRONT_C.y}px, rgba(255,245,245,${flash}) 0%, rgba(217,32,46,${0.6 * flash}) 45%, rgba(11,7,8,0) 80%)` }} />}
    </AbsoluteFill>
  );
};
