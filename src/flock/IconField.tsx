/**
 * Scene 1: the icon field (shelf shot `icon-field-colorize`, re-laid for 9:16 and recoloured red).
 *
 * Dark keycaps carrying real Lucide icons (the icon set the product's own nav uses) fill the frame
 * from the centre out: everything a week throws at a student. Above them the headline rolls its last
 * words like a slot (shelf shot `pill-slot-cycle`), one item per beat, and every item is a real one
 * from Maya's dashboard, so the tour that follows shows the exact things the line named. On the
 * beat the red waves sweep down and light the field, the centre key turns into the CampusAI app icon,
 * and a six-frame crash zoom (shelf shot `crash-zoom-punch`) drives through it into the product.
 */
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { EASE, mix, ramp } from "../shots/_fixtures/Polish";
import { B, FIELD_END } from "./beats";
import { LUCIDE } from "./icons";

const W = 1080;
const RED = "#D9202E";

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const COLS = 8;
const ROWS = 11;
const CELL_X = 128;
const CELL_Y = 124;
const TILE = 88;
const GLYPH = 40;
const X0 = (W - ((COLS - 1) * CELL_X + CELL_X / 2 + TILE)) / 2;
const Y0 = 560;
const FOCUS = { x: 540, y: Y0 + 5 * CELL_Y + TILE / 2 };

type RGB = [number, number, number];
// One red family, top to bottom: warm coral, brand red, deep red, crimson.
const WAVES: { color: RGB; fromRow: number; start: number }[] = [
  { color: [255, 112, 96], fromRow: 0, start: B(5) },
  { color: [229, 44, 56], fromRow: 3, start: B(5) + 6 },
  { color: [196, 24, 42], fromRow: 6, start: B(5) + 12 },
  { color: [150, 14, 32], fromRow: 9, start: B(5) + 18 },
];
const css = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const shade = (c: RGB, k: number): RGB => c.map((v) => Math.round(Math.max(0, Math.min(255, v + k * 255)))) as RGB;
const NAMES = Object.keys(LUCIDE);
const GRAYS = ["#5c4b4d", "#6b5759", "#4e4042"];

const rnd = mulberry32(20261021);
const KEYS = Array.from({ length: ROWS * COLS }, (_, idx) => {
  const r = Math.floor(idx / COLS);
  const c = idx % COLS;
  const r1 = rnd(), r2 = rnd(), r3 = rnd();
  const x = X0 + c * CELL_X + (r % 2) * (CELL_X / 2);
  const y = Y0 + r * CELL_Y;
  const d = Math.hypot(x + TILE / 2 - FOCUS.x, y + TILE / 2 - FOCUS.y) / 1100;
  const batch = Math.min(9, Math.floor((d * 0.8 + r1 * 0.3) * 10));
  return {
    idx, r, c, x, y,
    t0: batch * 3.6 + r2 * 3,
    gray: GRAYS[Math.floor(r2 * GRAYS.length)],
    icon: NAMES[Math.floor(r3 * NAMES.length) % NAMES.length],
    arrive: WAVES.filter((w) => r >= w.fromRow).map((w) => ({ w, at: w.start + (r - w.fromRow) * 1.4 + c * 0.25 + r3 * 1.5 })),
  };
});
const CENTER = KEYS.reduce((best, k) =>
  Math.hypot(k.x + TILE / 2 - FOCUS.x, k.y + TILE / 2 - FOCUS.y) < Math.hypot(best.x + TILE / 2 - FOCUS.x, best.y + TILE / 2 - FOCUS.y) ? k : best);
const CC = { x: CENTER.x + TILE / 2, y: CENTER.y + TILE / 2 };

const Glyph: React.FC<{ name: string; color: string; size: number }> = ({ name, color, size }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block", color }} dangerouslySetInnerHTML={{ __html: LUCIDE[name] }} />
);

const ICON_AT = B(7); // centre key becomes the app icon
const PUSH = FIELD_END - 7; // six-frame crash zoom, landing on the cut

export const IconField: React.FC = () => {
  const f = useCurrentFrame();
  const inhale = ramp(f, B(4.3), 8, EASE.smooth) * (1 - ramp(f, B(5), 8, EASE.out));
  const iconPop = ramp(f, ICON_AT, 10, EASE.overshoot);
  // Crash zoom: an exponential push on the centre key, the whole field scaling around it.
  const push = ramp(f, PUSH, 7, EASE.exit);
  const z = (1 + 0.035 * ramp(f, 0, PUSH, EASE.linear)) * Math.pow(22, push);
  const flash = Math.max(0, 1 - Math.abs(f - (FIELD_END - 1)) / 4);
  return (
    <AbsoluteFill style={{ background: "#0b0708", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 45% at 50% 62%, rgba(217,32,46,0.16) 0%, rgba(217,32,46,0) 70%)" }} />
      <AbsoluteFill style={{ transformOrigin: `${CC.x}px ${CC.y}px`, transform: `scale(${z.toFixed(4)})`, filter: inhale ? `brightness(${1 - 0.12 * inhale})` : undefined }}>
        {KEYS.map((k) => {
          const p = ramp(f, k.t0, 12, EASE.overshoot);
          if (p <= 0) return null;
          const isCenter = k.idx === CENTER.idx;
          let tint: RGB | null = null;
          let fill = 1;
          let flipK = 0;
          for (const a of k.arrive) {
            if (f >= a.at) {
              tint = a.w.color;
              fill = Math.min(1, (f - a.at) / 4);
              flipK = Math.sin(Math.min(1, (f - a.at) / 4) * Math.PI);
            }
          }
          const s = mix(0.6, 1, p) * (1 + 0.16 * flipK);
          return (
            <div key={k.idx} style={{ position: "absolute", left: k.x, top: k.y, width: TILE, height: TILE,
              opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 12}px) scale(${s.toFixed(4)})` }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 22, background: "linear-gradient(180deg, #221719 0%, #150e10 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,220,220,0.07), inset 0 0 0 1px rgba(255,200,200,0.05), 0 8px 16px -8px rgba(0,0,0,0.8)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Glyph name={k.icon} color={k.gray} size={GLYPH} />
              </div>
              {tint && (
                <div style={{ position: "absolute", inset: 0, borderRadius: 22, clipPath: `inset(0 0 ${((1 - fill) * 100).toFixed(1)}% 0)`,
                  background: `linear-gradient(180deg, ${css(shade(tint, 0.07))} 0%, ${css(tint)} 55%, ${css(shade(tint, -0.08))} 100%)`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 0 26px ${css(tint, 0.4)}, 0 10px 22px -8px ${css(shade(tint, -0.3), 0.6)}`,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Glyph name={k.icon} color="rgba(255,255,255,0.92)" size={GLYPH} />
                  {flipK > 0 && <div style={{ position: "absolute", inset: 0, borderRadius: 22, background: `rgba(255,255,255,${(0.5 * flipK).toFixed(3)})` }} />}
                </div>
              )}
              {isCenter && iconPop > 0 && (
                <div style={{ position: "absolute", inset: -6, borderRadius: 26, overflow: "hidden", transform: `scale(${mix(0.4, 1.18, iconPop).toFixed(4)})`,
                  boxShadow: `0 0 ${40 * iconPop}px rgba(217,32,46,0.7)` }}>
                  <Img src={staticFile("kit/app-icon.png")} style={{ width: "100%", height: "100%", display: "block" }} />
                </div>
              )}
            </div>
          );
        })}
      </AbsoluteFill>
      {/* the headline band stays clean: fade the field out under it */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 640, background: "linear-gradient(180deg, #0b0708 0%, #0b0708 70%, rgba(11,7,8,0) 100%)",
        opacity: 1 - push }} />
      <Headline f={f} hide={push} />
      {flash > 0 && <AbsoluteFill style={{ background: `radial-gradient(circle at ${CC.x}px ${CC.y}px, rgba(255,245,245,${flash}) 0%, rgba(217,32,46,${0.6 * flash}) 45%, rgba(11,7,8,0) 80%)` }} />}
    </AbsoluteFill>
  );
};

/* ---------- headline: fixed opener, slot of real items, then the turn ---------- */
const SLOT = ["a moved deadline", "a case brief due", "Quiz 2 on Thursday", "a coffee chat", "spring registration"];
const SLOT_AT = [B(1), B(2), B(3), B(4), B(5)];
const TURN = B(6); // the field is lit; the line turns
const HEAD = 72;
const ITALIC_EM = 0.53; // Zodiak italic width per character, in em (0.43 clipped "spring registration")

const Headline: React.FC<{ f: number; hide: number }> = ({ f, hide }) => {
  const inP = ramp(f, 2, 14, EASE.snappy);
  const turn = ramp(f, TURN, 10, EASE.smooth);
  const turnIn = ramp(f, TURN + 6, 14, EASE.snappy);
  let cur = -1;
  SLOT_AT.forEach((a, i) => { if (f >= a) cur = i; });
  const widthOf = (i: number) => (i < 0 ? 4 : SLOT[i].length) * ITALIC_EM * HEAD + 64;
  const wFrom = widthOf(cur - 1);
  const wTo = widthOf(cur);
  const wK = cur < 0 ? 0 : ramp(f, SLOT_AT[cur], 8, EASE.snappy);
  const pillW = mix(wFrom, wTo, wK);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 1 - hide }}>
      <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center", fontFamily: "Zodiak", fontWeight: 700, fontSize: HEAD,
        letterSpacing: "-0.02em", lineHeight: 1.12, color: "#fff" }}>
        <div style={{ opacity: inP * (1 - turn), filter: `blur(${(1 - inP) * 14 + turn * 14}px)`, transform: `translateY(${(1 - inP) * 20 - turn * 18}px)` }}>
          <div>This week you have</div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
            <div style={{ position: "relative", width: pillW, height: HEAD * 1.32, borderRadius: HEAD, overflow: "hidden",
              background: "rgba(217,32,46,0.16)", boxShadow: "inset 0 0 0 1.5px rgba(255,90,100,0.35)", opacity: cur < 0 ? 0 : 1 }}>
              {SLOT.map((w, i) => {
                if (i < cur - 1 || i > cur) return null;
                const k = ramp(f, SLOT_AT[i], 8, EASE.snappy);
                const y = i === cur ? (1 - k) * HEAD * 1.1 : -ramp(f, SLOT_AT[cur], 8, EASE.snappy) * HEAD * 1.1;
                const blur = i === cur ? (1 - k) * 10 : ramp(f, SLOT_AT[cur], 8, EASE.snappy) * 10;
                return (
                  <div key={w} style={{ position: "absolute", left: 0, right: 0, top: HEAD * 0.12, whiteSpace: "nowrap", textAlign: "center",
                    fontStyle: "italic", fontWeight: 400, color: "#ff5a64", transform: `translateY(${y.toFixed(2)}px)`, filter: `blur(${blur.toFixed(2)}px)` }}>{w}</div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", top: 40, left: 0, right: 0, opacity: turnIn, filter: `blur(${(1 - turnIn) * 14}px)`, transform: `translateY(${(1 - turnIn) * 22}px)` }}>
          <div>Here is all of it,</div>
          <div style={{ fontStyle: "italic", fontWeight: 400, color: RED }}>picked for you.</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
