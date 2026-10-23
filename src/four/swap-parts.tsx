/**
 * Parts for the Swap film, round 2 (four-video batch, 2026-10-19). Kept out of kit/parts.tsx on
 * purpose: other films render from the kit at the same time.
 *
 * Sources adapted here (all driven by useCurrentFrame, no CSS animation time):
 * - Coverflow maths: SmoothUI `coverflow-carousel` (smoothui.dev/r/coverflow-carousel.json, MIT):
 *   offset from the active card, scale 1 - 0.15 per step, depth 180 per step, perspective 1200, a
 *   spring with bounce 0.1. Turned vertical after Reelfolio's "Fold" template ("a vertical carousel
 *   with the center card flat and its neighbours tilted in 3D", reelfolio.io/docs/templates/
 *   LoopCoverFlowVerticalTemplate), read as a motion spec.
 * - The word swap in the counter: beUI ActionSwapText "roll", as ported in our Elevations pick
 *   e-match-bundle (labs/elevations/src/parts/1014e/e-match-bundle): the old word leaves up 90% with
 *   a 3px blur, the new one rolls in from below on a 460 / 30 / 0.55 spring.
 * - The after-half glow: shadcnblocks background-pattern1 (radial-gradient(125% 125% at 50% 10%,
 *   background 40%, primary 100%)), the brand red rising from the bottom edge as light, not bars.
 */
import React from "react";
import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { INTER, ZODIAK, ramp } from "../kit/parts";

export const RED = "#D9202E";
export const BG = "#0b0708";

/* ------------------------------------------------------------- glyphs (lucide paths) */

const GLYPH: Record<string, string[]> = {
  book: ["M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"],
  mail: ["M22 7l-8.99 5.73a2 2 0 0 1-2.03 0L2 7", "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"],
  briefcase: ["M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", "M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"],
  calendar: ["M8 2v4", "M16 2v4", "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M3 10h18"],
  clipboard: ["M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z", "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2", "M12 11h4", "M12 16h4", "M8 11h.01", "M8 16h.01"],
  check: ["M9 11l3 3L22 4", "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"],
};

export const Glyph: React.FC<{ name: string; size: number; color: string; stroke?: number }> = ({ name, size, color, stroke = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    {GLYPH[name].map((d, i) => <path key={i} d={d} />)}
  </svg>
);

/* ------------------------------------------------------------- the six invented apps */

export type AppDef = {
  name: string;
  tile: string;
  glyph: string;
  light?: boolean;
  rows: { a: string; b?: string; dot?: boolean; done?: boolean }[];
  /** the real row of the daily brief it becomes (public/four/swap/row-<row>.png) */
  row: string;
};

// Invented apps, generic names, own colour and glyph. Each one's words are the words of the real
// brief row it folds into, so the fold reads as the same thing arriving in one place.
export const APPS: AppDef[] = [
  { name: "Mail", tile: "linear-gradient(160deg,#4DA3FF,#1F6FE5)", glyph: "mail", row: "moved",
    rows: [{ a: "Due date changed", b: "BMGT380", dot: true }, { a: "Reading Response 6 is now Sunday", dot: true }, { a: "Advising appointments", b: "1d" }] },
  { name: "Courses", tile: "linear-gradient(160deg,#FF7A45,#E2461E)", glyph: "book", row: "due343",
    rows: [{ a: "Problem set 3", b: "Due Mon" }, { a: "Bond pricing", b: "BMGT343" }, { a: "Quiz 4", b: "Fri" }] },
  { name: "To-do", tile: "linear-gradient(160deg,#FFD25A,#F29A0E)", glyph: "check", row: "due364",
    rows: [{ a: "Reading Ch. 6-7", b: "Tue", done: false }, { a: "Email TA", done: true }, { a: "Print notes", done: false }] },
  { name: "Registration", tile: "linear-gradient(160deg,#35D0A5,#0F8F78)", glyph: "clipboard", row: "spring",
    rows: [{ a: "Spring 2027 schedule is out" }, { a: "BMGT343 · 0101", b: "Full" }, { a: "BMGT364 · 0301", b: "3 seats" }] },
  { name: "Jobs", tile: "linear-gradient(160deg,#8B6CFF,#5B3DE0)", glyph: "briefcase", row: "job",
    rows: [{ a: "IB Summer Analyst 2027", b: "Evercore" }, { a: "Finance Summer Analyst", b: "Capital One" }, { a: "Consulting Intern", b: "Deloitte" }] },
  { name: "Calendar", tile: "linear-gradient(160deg,#FFFFFF,#E9E6E6)", glyph: "calendar", light: true, row: "event",
    rows: [{ a: "Coffee chat", b: "Mon 3:00 PM" }, { a: "Problem set 3", b: "Mon 11:59 PM" }, { a: "Quiz 4", b: "Fri 2:00 PM" }] },
];

export const WIN_W = 860;
export const WIN_H = 452;
const HEAD_H = 104;

/** One app as a window. Fixed design size; the film scales and clips it. */
export const AppWindow: React.FC<{ app: AppDef }> = ({ app }) => {
  const fg = app.light ? "#16131a" : "#fff";
  return (
    <div style={{ width: WIN_W, height: WIN_H, background: "#1c181b", fontFamily: INTER }}>
      <div style={{ height: HEAD_H, background: app.tile, display: "flex", alignItems: "center", gap: 20, padding: "0 32px" }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: app.light ? "#E5484D" : "rgba(255,255,255,.22)", display: "grid", placeItems: "center" }}>
          <Glyph name={app.glyph} size={36} color="#fff" />
        </div>
        <div style={{ flex: 1, fontSize: 38, fontWeight: 700, color: fg, letterSpacing: "-0.02em" }}>{app.name}</div>
      </div>
      <div style={{ padding: "14px 32px 0" }}>
        {app.rows.map((r, i) => (
          <div key={i} style={{ height: 106, display: "flex", alignItems: "center", gap: 18, borderTop: i ? "1px solid rgba(255,255,255,.07)" : undefined }}>
            {r.dot ? <div style={{ width: 15, height: 15, borderRadius: 8, background: "#4DA3FF", flex: "none" }} /> : null}
            {r.done !== undefined ? (
              <div style={{ width: 34, height: 34, borderRadius: 9, flex: "none", border: "2.5px solid rgba(255,255,255,.4)", background: r.done ? "#F29A0E" : "transparent", display: "grid", placeItems: "center" }}>
                {r.done ? <Glyph name="check" size={22} color="#fff" stroke={3} /> : null}
              </div>
            ) : null}
            <div style={{ flex: 1, fontSize: 34, fontWeight: 600, color: r.done ? "rgba(255,255,255,.45)" : "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              textDecoration: r.done ? "line-through" : undefined }}>{r.a}</div>
            {r.b ? <div style={{ fontSize: 30, fontWeight: 500, color: "rgba(255,255,255,.55)", whiteSpace: "nowrap" }}>{r.b}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------- the real brief rows */

// Crops of public/morning/tour/dashboard.jpg (campusai-demo, dark, 2880x1800 = 2x the 1440x900
// screen). (x, y, w, h) in capture pixels. Same crops as round 1.
export const ROWS: Record<string, { x: number; y: number; w: number; h: number }> = {
  moved: { x: 562, y: 294, w: 1060, h: 192 },
  due343: { x: 562, y: 494, w: 1060, h: 92 },
  due364: { x: 562, y: 594, w: 1060, h: 106 },
  spring: { x: 1700, y: 294, w: 1042, h: 130 },
  job: { x: 1700, y: 432, w: 1042, h: 130 },
  event: { x: 1700, y: 570, w: 1042, h: 102 },
};
export const CAP_W = 2880;
export const CAP_H = 1800;
export const SLOT_BG = "#18181b";

export const RowImg: React.FC<{ row: string; style?: React.CSSProperties }> = ({ row, style }) => (
  <Img src={staticFile(`four/swap/row-${row}.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", ...style }} />
);

/* ------------------------------------------------------------- backgrounds */

/** Before: graphite desk, a faint dot grid and one soft overhead light on the strip. */
export const DeskBackground: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div style={{ position: "absolute", inset: 0, opacity }}>
    <div style={{ position: "absolute", inset: 0, background: "#0c0a0b" }} />
    <div style={{ position: "absolute", inset: 0,
      backgroundImage: "radial-gradient(rgba(255,255,255,.075) 1.6px, transparent 1.8px)", backgroundSize: "36px 36px", backgroundPosition: "18px 6px",
      maskImage: "radial-gradient(70% 52% at 50% 52%, #000 0%, rgba(0,0,0,.5) 55%, transparent 100%)",
      WebkitMaskImage: "radial-gradient(70% 52% at 50% 52%, #000 0%, rgba(0,0,0,.5) 55%, transparent 100%)" }} />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(48% 34% at 50% 50%, rgba(255,244,236,.07) 0%, rgba(255,244,236,0) 100%)" }} />
  </div>
);

/** After: the brand red as light rising from the bottom edge (shadcnblocks background-pattern1). */
export const RedHorizon: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div style={{ position: "absolute", inset: 0, opacity,
    background: `radial-gradient(125% 125% at 50% 8%, rgba(11,7,8,0) 42%, rgba(217,32,46,.20) 78%, rgba(217,32,46,.42) 100%)` }} />
);

/* ------------------------------------------------------------- the counter */

/** A digit rolling through 0..6. value is continuous. */
export const RollDigit: React.FC<{ value: number; size: number }> = ({ value, size }) => {
  const h = size * 1.14;
  return (
    <span style={{ display: "inline-block", height: h, overflow: "hidden", verticalAlign: "top", width: "0.64em", textAlign: "center" }}>
      <span style={{ display: "block", transform: `translateY(${-value * h}px)` }}>
        {[0, 1, 2, 3, 4, 5, 6].map((d) => <span key={d} style={{ display: "block", height: h, lineHeight: `${h}px` }}>{d}</span>)}
      </span>
    </span>
  );
};

/** beUI ActionSwapText "roll": `from` leaves up with a blur, `to` rolls in from below. */
export const RollWord: React.FC<{ from: string; to: string; at: number; size: number; wFrom: number; wTo: number; accentTo?: boolean }> = ({ from, to, at, size, wFrom, wTo, accentTo }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = ramp(f, at, at + 5);
  const inn = f < at ? 0 : spring({ frame: f - at, fps, config: { stiffness: 460, damping: 30, mass: 0.55 } });
  const h = size * 1.14;
  const w = wFrom + (wTo - wFrom) * inn;
  return (
    <span style={{ display: "inline-block", position: "relative", width: w, height: h, verticalAlign: "top", overflow: "visible" }}>
      <span style={{ position: "absolute", left: 0, top: 0, lineHeight: `${h}px`, whiteSpace: "nowrap", opacity: 1 - out,
        transform: `translateY(${-0.9 * h * out}px)`, filter: out > 0 ? `blur(${3 * out}px)` : undefined }}>{from}</span>
      {f >= at ? (
        <span style={{ position: "absolute", left: 0, top: 0, lineHeight: `${h}px`, whiteSpace: "nowrap", opacity: Math.min(1, inn * 1.4),
          transform: `translateY(${0.9 * h * (1 - inn)}px)`, filter: inn < 1 ? `blur(${3 * (1 - inn)}px)` : undefined,
          color: accentTo ? RED : undefined, fontStyle: accentTo ? "italic" : undefined, fontWeight: accentTo ? 400 : undefined }}>{to}</span>
      ) : null}
    </span>
  );
};

export const HEAD_FONT: React.CSSProperties = { fontFamily: ZODIAK.family, fontWeight: 700, letterSpacing: ZODIAK.track, color: "#fff" };
