/**
 * /paper-desk: real product pages printed as sheets on a dark desk, seen from above. One sheet comes forward,
 * the camera leans in, a red pen circles the one thing that matters. Deal from shelf shot `deck-deal-flyin`,
 * overhead view from `overhead-camera-moves`. The sheets are real captures, printed by inverting dark mode.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR } from "../system/motion";
import { B, Clip, Cue, PAPER, RED, Title, clamp, ramp } from "./common";

export type Sheet = { src: string; pageW: number; crop: { x: number; y: number; w: number; h: number }; rest: { x: number; y: number; r: number } };
export type PaperDeskProps = {
  title: string;
  sheets: Sheet[];
  /** Which sheet comes forward. */
  hero: number;
  /** The circle, in hero-sheet px (sheet is SHEET_W wide). */
  circle: { x: number; y: number; w: number; h: number };
};

export const PAPER_DESK_END = 225;
export const SHEET_W = 820;
const SHEET_H = 1060;
const sheetH = (s: Sheet) => (SHEET_W * s.crop.h) / s.crop.w;
const FRONT = 74;
const LEAN = 118;

const SheetView: React.FC<{ s: Sheet }> = ({ s }) => {
  const scale = SHEET_W / s.crop.w;
  return (
    <div style={{ position: "absolute", left: -SHEET_W / 2, top: -sheetH(s) / 2, width: SHEET_W, height: sheetH(s), overflow: "hidden", background: PAPER }}>
      <Img
        src={staticFile(s.src)}
        style={{ position: "absolute", left: -s.crop.x * scale, top: -s.crop.y * scale, width: s.pageW * scale, height: "auto",
          filter: "invert(1) hue-rotate(180deg) saturate(0.55) brightness(1.06) contrast(0.98)" }}
      />
    </div>
  );
};

export const PaperDesk: React.FC<PaperDeskProps> = ({ title, sheets, hero, circle }) => {
  const f = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const front = ramp(f, FRONT, FRONT + DUR.travel, CURVE.quiet.standard);
  const lean = ramp(f, LEAN, LEAN + DUR.travel, CURVE.quiet.standard);
  const order = sheets.map((_, i) => i).sort((a, b) => (a === hero ? 1 : b === hero ? -1 : a - b));
  const cam = 1 + lean * 0.14;
  const camX = -lean * (circle.x + circle.w / 2 - SHEET_W / 2) * 0.35;
  const camY = -lean * (circle.y + circle.h / 2 - SHEET_H / 2) * 0.2;
  const drift = interpolate(f, [0, PAPER_DESK_END], [1.03, 1], clamp);
  const pen = ramp(f, 160, 186, CURVE.quiet.standard);
  const len = 2 * Math.PI * Math.sqrt((circle.w ** 2 + circle.h ** 2) / 8) * 1.15;
  return (
    <Clip endAt={PAPER_DESK_END}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 50% 42%, rgba(${B.color.glowRgb},0.20), transparent 70%)` }} />
      <AbsoluteFill style={{ transform: `scale(${(cam * drift).toFixed(4)}) translate(${camX.toFixed(1)}px, ${camY.toFixed(1)}px)`, transformOrigin: "50% 56%" }}>
        {order.map((i) => {
          const s = sheets[i];
          const at = 2 + i * 12;
          const land = spring({ frame: f - at, fps, config: { damping: 16, stiffness: 120 } });
          const isHero = i === hero;
          const x = isHero ? s.rest.x * (1 - front) : s.rest.x * (1 + front * 0.35);
          const y = isHero ? s.rest.y * (1 - front) : s.rest.y + front * (i === 0 ? -60 : 120);
          const r = isHero ? s.rest.r * (1 - front) : s.rest.r * (1 + front * 0.6);
          const sc = (0.82 + (isHero ? front * 0.1 : 0)) * (1.34 - 0.34 * land);
          return (
            <div key={i} style={{ position: "absolute", left: "50%", top: height * 0.56, opacity: f < at ? 0 : 1,
              transform: `translate(${x.toFixed(1)}px, ${(y + (1 - land) * 1500).toFixed(1)}px) rotate(${(r + (1 - land) * -14).toFixed(2)}deg) scale(${sc.toFixed(4)})`,
              filter: `drop-shadow(0 ${24 + (isHero ? front * 26 : 0)}px ${40 + (isHero ? front * 30 : 0)}px rgba(0,0,0,0.72)) brightness(${isHero ? 1 : 1 - front * 0.42})` }}>
              <SheetView s={s} />
              {isHero ? (
                <svg width={SHEET_W} height={SHEET_H} style={{ position: "absolute", left: -SHEET_W / 2, top: -SHEET_H / 2, overflow: "visible" }}>
                  <ellipse cx={circle.x + circle.w / 2} cy={circle.y + circle.h / 2} rx={circle.w / 2 + 26} ry={circle.h / 2 + 16} fill="none"
                    stroke={RED} strokeWidth={7} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - pen)}
                    transform={`rotate(-2 ${circle.x + circle.w / 2} ${circle.y + circle.h / 2})`} />
                </svg>
              ) : null}
            </div>
          );
        })}
      </AbsoluteFill>
      <Title out={150}>{title}</Title>
      {sheets.map((_, i) => <Cue key={i} at={3 + i * 12} name="paper-slide" volume={0.65} />)}
      <Cue at={FRONT} name="paper-move-quick" volume={0.5} />
      <Cue at={160} name="marker-pen-line" volume={0.6} />
    </Clip>
  );
};
