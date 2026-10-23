/**
 * Scene 1: the wordmark, then the week's events on a date rail (beats 0 to 8.6).
 *
 *   beats 0-2    the CampusAI wordmark draws itself, every letter in parallel, finishing on the
 *                same frame, then fills (shelf `letterspace-materialize`, on the real logo paths)
 *   beats 2-6    the real event cards hang off a rail of days, Wed 21 to Sun 25. The camera rides
 *                down it, slows at each day while that day's node lights and its cards rise, then
 *                runs on and brakes hard on Fri 23 (shelf `timeline-travel`, turned vertical)
 *   beats 6-8.6  the bootcamp lifts with a red edge, the rest go dark, a cursor presses the real
 *                "Add to CampusAI Calendar" and it becomes the real "On your calendar"
 *
 * Jacob's round 1 notes: keep the events scrolling but with a different scroll, and no flash or
 * black screen before the press. Cards are the real /events cards on campusai-demo, captured alone by
 * `capture/campus-film.cjs`; the press is real too.
 */
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { EASE, SpeedBlur, bezier, mix, ramp, velocity } from "../shots/_fixtures/Polish";
import { B, FLY_AT, PRESS_AT, RAIL_AT, STOP_AT } from "./beats";
import { LOGO_PATHS, LOGO_VB } from "./logo";

const W = 1080;
const RED = "#E21833";

/* ---------- the rail ---------- */
export const CARD_X = 180;
export const CARD_W = 860;
export const CARD_K = CARD_W / 574;
export const CARD_H = 210 * CARD_K;
/** Where the lifted bootcamp sits on screen when the press happens; the week takes it from here. */
export const CARD_CY = 880;
export const LIFT = 1.03;
const GAP = 26;
const DAY_GAP = 84;
const RAIL_X = 112;

type Day = { dow: string; date: string; cards: string[] };
const DAYS: Day[] = [
  { dow: "Wed", date: "21", cards: ["finassoc"] },
  { dow: "Thu", date: "22", cards: ["evercore", "deloitte"] },
  { dow: "Fri", date: "23", cards: ["bootcamp"] },
  { dow: "Sat", date: "24", cards: ["pitch"] },
  { dow: "Sun", date: "25", cards: ["fair"] },
];
// content-space layout: every card's top, every day's span
const LAYOUT = (() => {
  let y = 0;
  return DAYS.map((d) => {
    const top = y;
    const cards = d.cards.map((slug) => { const t = y; y += CARD_H + GAP; return { slug, top: t }; });
    y += DAY_GAP - GAP;
    return { ...d, top, bottom: y - DAY_GAP, cards };
  });
})();
const centerOf = (i: number) => (LAYOUT[i].top + LAYOUT[i].bottom) / 2;
const scrollTo = (i: number) => centerOf(i) - CARD_CY;

// Stops in beats: run in to Wed, Thu, then run on and brake on Fri. Between stops it never sits still.
const STOPS = [
  { at: 2.0, s: scrollTo(0) - 1500 },
  { at: 2.9, s: scrollTo(0) },
  { at: 3.5, s: scrollTo(0) + 30 },
  { at: 4.3, s: scrollTo(1) },
  { at: 4.8, s: scrollTo(1) + 30 },
  { at: 6.0, s: scrollTo(2) },
];
const Arrive = bezier(0.3, 0, 0.1, 1);
const Brake = bezier(0.5, 0, 0.04, 1);
const scrollAt = (f: number) => {
  for (let k = STOPS.length - 1; k > 0; k--) {
    const a = STOPS[k - 1], b = STOPS[k];
    if (f >= B(a.at)) {
      const ease = k % 2 === 1 ? (k === STOPS.length - 1 ? Brake : Arrive) : EASE.linear;
      return mix(a.s, b.s, ramp(f, B(a.at), B(b.at) - B(a.at), ease));
    }
  }
  return STOPS[0].s;
};
// which day the camera is on, and how lit it is
const lit = (f: number, i: number) => {
  const at = [2.9, 4.3, 6.0][i];
  if (at === undefined) return 0;
  const next = [4.3, 6.0, 99][i];
  return ramp(f, B(at) - 6, 8, EASE.out) * (1 - (i < 2 ? ramp(f, B(next) - 10, 8, EASE.out) : 0));
};

/* ---------- wordmark trace ---------- */
const LOGO_W = 760;
const LOGO_S = LOGO_W / LOGO_VB.w;
const LogoTrace: React.FC<{ f: number }> = ({ f }) => {
  const draw = ramp(f, 2, 26, bezier(0.5, 0, 0.3, 1));
  const fill = ramp(f, 22, 12, EASE.out);
  const out = ramp(f, RAIL_AT - 4, 10, EASE.exit);
  const h = LOGO_VB.h * LOGO_S;
  const push = mix(0.97, 1.05, ramp(f, 0, RAIL_AT + 6, EASE.linear));
  return (
    <div style={{ position: "absolute", left: (W - LOGO_W) / 2, top: 900 - h / 2 - out * 160, width: LOGO_W, height: h,
      transform: `scale(${push})`, opacity: 1 - out, filter: `blur(${(out * 14).toFixed(1)}px)` }}>
      <svg width={LOGO_W} height={h} viewBox={`0 0 ${LOGO_VB.w} ${LOGO_VB.h}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="cf-dot" x1="217" y1="0" x2="217" y2="11.6" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF5068" /><stop offset="1" stopColor={RED} />
          </linearGradient>
        </defs>
        {LOGO_PATHS.map((d, i) => {
          const dot = i === LOGO_PATHS.length - 1;
          return (
            <path key={i} d={d} pathLength={1} fill={dot ? "url(#cf-dot)" : "#f7efe6"} fillOpacity={fill}
              stroke={dot ? "#FF5068" : "#f7efe6"} strokeWidth={0.55} strokeDasharray="1 1" strokeDashoffset={1 - draw}
              strokeOpacity={1 - fill * 0.8} />
          );
        })}
      </svg>
    </div>
  );
};

/* ---------- cursor and press, shared with the week ---------- */
export const BTN = { x: (15 + 269 / 2) * CARD_K, y: (158.8 + 17) * CARD_K, w: 269 * CARD_K, h: 34 * CARD_K };
export const Cursor: React.FC<{ x: number; y: number; press: boolean; opacity?: number }> = ({ x, y, press, opacity = 1 }) => (
  <svg width={64} height={64} viewBox="0 0 24 24" style={{ position: "absolute", left: x, top: y, opacity, transform: `scale(${press ? 0.86 : 1})`, transformOrigin: "0 0",
    filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))" }}>
    <path d="M3 2 L3 19 L7.6 14.8 L10.6 21.6 L13.6 20.3 L10.7 13.7 L17 13.4 Z" fill="#fff" stroke="#1a0a0c" strokeWidth={1.3} strokeLinejoin="round" />
  </svg>
);
export const Ripple: React.FC<{ f: number; at: number; x: number; y: number }> = ({ f, at, x, y }) => {
  const k = ramp(f, at, 16, EASE.out);
  if (f < at || k >= 1) return null;
  return <div style={{ position: "absolute", left: x - 60, top: y - 60, width: 120, height: 120, borderRadius: 60,
    transform: `scale(${0.3 + k * 2.2})`, opacity: (1 - k) * 0.7, boxShadow: "0 0 0 3px rgba(255,255,255,0.8)" }} />;
};

const DateRail: React.FC<{ f: number }> = ({ f }) => {
  if (f < RAIL_AT - 4) return null;
  const scroll = scrollAt(f);
  const vy = -velocity(scrollAt, f);
  const lift = ramp(f, STOP_AT, 9, EASE.snappy);
  const leave = ramp(f, PRESS_AT + 6, 8, EASE.exit);
  const appear = ramp(f, RAIL_AT - 4, 10, EASE.out);
  const yOf = (c: number) => c - scroll;
  return (
    <AbsoluteFill style={{ opacity: appear }}>
      <SpeedBlur vx={0} vy={vy} amount={0.28} max={24}>
        {/* the rail */}
        <div style={{ position: "absolute", left: RAIL_X - 1.5, top: yOf(LAYOUT[0].top) - 2000, width: 3, height: 6000, opacity: 1 - leave,
          background: "linear-gradient(180deg, rgba(226,24,51,0) 0%, rgba(226,24,51,0.55) 35%, rgba(255,140,150,0.35) 100%)" }} />
        {LAYOUT.map((d, i) => {
          const l = lit(f, i) * (1 - leave);
          const cy = yOf(d.top) + 40;
          return (
            <React.Fragment key={d.date}>
              <div style={{ position: "absolute", left: RAIL_X - 11, top: cy - 11, width: 22, height: 22, borderRadius: 11, opacity: 1 - leave,
                background: l > 0.05 ? RED : "#2a1216", boxShadow: `0 0 0 3px #0b0708, 0 0 ${(30 * l).toFixed(0)}px rgba(255,80,104,${(0.9 * l).toFixed(2)})` }} />
              <div style={{ position: "absolute", left: 4, width: RAIL_X - 26, top: cy + 22, textAlign: "center", fontFamily: "Zodiak", color: "#f7efe6",
                opacity: (0.45 + 0.55 * l) * (1 - leave) }}>
                <div style={{ fontStyle: "italic", fontWeight: 400, fontSize: 28, lineHeight: 1 }}>{d.dow}</div>
                <div style={{ fontWeight: 700, fontSize: 52, lineHeight: 1.05, color: l > 0.5 ? "#ff8090" : "#f7efe6" }}>{d.date}</div>
              </div>
              {d.cards.map(({ slug: c, top }) => {
                const hero = c === "bootcamp";
                if (hero && f >= FLY_AT) return null; // the week flies it from here
                const rise = l * 14;
                const dim = hero ? 0 : lift * 0.72 + (1 - Math.max(l, 0.35)) * 0.4 * (1 - lift);
                const op = (1 - dim) * (hero ? 1 : 1 - leave);
                return (
                  <div key={c} style={{ position: "absolute", left: CARD_X, top: yOf(top) - rise,
                    width: CARD_W, height: CARD_H, opacity: op, borderRadius: 20,
                    transform: `scale(${hero ? 1 + lift * (LIFT - 1) : 1 + l * 0.012})`,
                    boxShadow: hero && lift > 0
                      ? `0 0 0 ${(3 * lift).toFixed(2)}px ${RED}, 0 0 ${(70 * lift).toFixed(0)}px rgba(226,24,51,${(0.55 * lift).toFixed(2)}), 0 30px 60px rgba(0,0,0,0.6)`
                      : `0 ${(10 + rise).toFixed(0)}px ${(24 + rise * 2).toFixed(0)}px rgba(0,0,0,0.5)` }}>
                    <Img src={staticFile(`campus/ev-${c}.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 20 }} />
                    {hero && <Img src={staticFile("campus/bootcamp-on.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 20,
                      opacity: ramp(f, PRESS_AT + 2, 4, EASE.out) }} />}
                    {hero && f >= PRESS_AT - 1 && f < PRESS_AT + 5 && (
                      <div style={{ position: "absolute", left: BTN.x - BTN.w / 2, top: BTN.y - BTN.h / 2, width: BTN.w, height: BTN.h, borderRadius: 12, background: "rgba(255,255,255,0.14)" }} />
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </SpeedBlur>
    </AbsoluteFill>
  );
};

// the bootcamp's own top on screen once it has stopped (its day's first card, centred on CARD_CY)
const HERO_TOP = CARD_CY - CARD_H / 2;
const PressCursor: React.FC<{ f: number }> = ({ f }) => {
  const inK = ramp(f, STOP_AT + 10, PRESS_AT - STOP_AT - 13, EASE.swift);
  const outK = ramp(f, PRESS_AT + 6, 10, EASE.exit);
  if (inK <= 0 || outK >= 1) return null;
  const tx = CARD_X + BTN.x + 30, ty = HERO_TOP + BTN.y + 8;
  return <Cursor x={mix(960, tx, inK) + outK * 260} y={mix(1620, ty, inK) + outK * 380} press={f >= PRESS_AT - 2 && f < PRESS_AT + 4} />;
};

export const Rail: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= FLY_AT + 10) return null;
  return (
    <AbsoluteFill>
      {f < RAIL_AT + 8 && <LogoTrace f={f} />}
      <DateRail f={f} />
      <Ripple f={f} at={PRESS_AT} x={CARD_X + BTN.x} y={HERO_TOP + BTN.y} />
      <PressCursor f={f} />
    </AbsoluteFill>
  );
};
