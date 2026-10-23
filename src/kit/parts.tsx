/**
 * The launch-film parts kit (2026-10-19).
 *
 * Taken from S Zee Ahmed's Officely launch film (IG @zeeuiux, reel DeKoRsNgOPK): one idea per
 * scene, the product pulled apart into single floating cards, and people, a hand and moving
 * numbers carrying the story. Every part here is product-agnostic and themed by props, so
 * CampusAI, Got60, FigBlossom and Fig and Bone can all use them.
 *
 * The one rule they bend to: anything that shows OUR platform is a real capture (FloatCard) or a
 * redraw of a real component from its source with its real strings (CalendarPill). Faces, the
 * hand, type, counters and notification cards from other tools are not our platform, so they
 * are drawn freely.
 */
import React from "react";
import { continueRender, delayRender, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { EASE, EASE_CAMERA } from "../lib/anim";

export const { fontFamily: INTER } = loadFont("normal", { weights: ["500", "600", "700"] });

/** The film's own typeface. Defaults to Inter; CampusAI posts use Zodiak with italic accents. */
export type Face = { family: string; weight: number; track: string; accentItalic?: boolean };
const INTER_FACE: Face = { family: INTER, weight: 700, track: "-0.035em" };

/** Zodiak, Jacob's pick for CampusAI posts (2026-10-16): Bold, plus Italic for the accent words. Self-hosted, Fontshare ITF free licence. */
export const ZODIAK: Face = { family: "Zodiak", weight: 700, track: "-0.02em", accentItalic: true };
export const useZodiak = () => {
  const [wait] = React.useState(() => delayRender("Zodiak"));
  React.useEffect(() => {
    const faces = [
      new FontFace("Zodiak", `url(${staticFile("fonts/Zodiak-Bold.woff2")}) format("woff2")`, { weight: "700", style: "normal" }),
      new FontFace("Zodiak", `url(${staticFile("fonts/Zodiak-Italic.woff2")}) format("woff2")`, { weight: "400", style: "italic" }),
    ];
    Promise.all(faces.map((x) => x.load().then((l) => document.fonts.add(l)))).finally(() => continueRender(wait));
  }, [wait]);
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 to 1 between two frames. */
export const ramp = (f: number, a: number, b: number, easing = EASE) =>
  interpolate(f, [a, b], [0, 1], { ...clamp, easing });

/** A springy 0 to 1 that starts at `at`. Slight overshoot, the reel's pop. */
export const pop = (f: number, at: number, fps: number, damping = 13) =>
  spring({ frame: f - at, fps, config: { damping, stiffness: 170, mass: 0.7 } });

export type Ink = { ink: string; soft: string; accent: string; surface: string; line: string };

/* ------------------------------------------------------------------ type */

type Run = { text: string; accent?: boolean };


/**
 * Headline whose words arrive one at a time out of a blur, rising slightly. The reel's main
 * type move ("Who's actually / in today?"). One line per array entry; mark the line that carries
 * the brand colour with `accent`.
 */
export const BlurLines: React.FC<{
  lines: Run[];
  at: number;
  size: number;
  ink: Ink;
  stagger?: number;
  align?: "center" | "left";
  outAt?: number;
  face?: Face;
}> = ({ lines, at, size, ink, stagger = 4, align = "center", outAt, face = INTER_FACE }) => {
  const f = useCurrentFrame();
  let k = 0;
  const out = outAt === undefined ? 0 : ramp(f, outAt, outAt + 10);
  return (
    <div style={{ fontFamily: face.family, fontWeight: face.weight, fontSize: size, lineHeight: 1.06, letterSpacing: face.track, textAlign: align,
      opacity: 1 - out, filter: out ? `blur(${out * 14}px)` : undefined }}>
      {lines.map((line, li) => (
        <div key={li} style={{ color: line.accent ? ink.accent : ink.ink,
          ...(line.accent && face.accentItalic ? { fontStyle: "italic", fontWeight: 400 } : null) }}>
          {line.text.split(" ").map((w, wi) => {
            const p = ramp(f, at + k * stagger, at + k * stagger + 14);
            k += 1;
            return (
              <span key={wi} style={{ display: "inline-block", opacity: p, filter: `blur(${(1 - p) * 16}px)`,
                transform: `translateY(${(1 - p) * 0.28 * size}px)`, marginRight: "0.24em" }}>{w}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** A line typed out with a caret, the reel's "Right where your team works|". `\n` breaks a line. */
export const TypeLine: React.FC<{ runs: Run[]; at: number; size: number; ink: Ink; perFrame?: number }> = ({
  runs, at, size, ink, perFrame = 1.1,
}) => {
  const f = useCurrentFrame();
  const shown = Math.max(0, Math.floor((f - at) * perFrame));
  const total = runs.reduce((n, r) => n + r.text.length, 0);
  const caretOn = shown < total || Math.floor(f / 8) % 2 === 0;
  let used = 0;
  return (
    <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: size, lineHeight: 1.08, letterSpacing: "-0.035em",
      textAlign: "center", whiteSpace: "pre-wrap" }}>
      {runs.map((r, i) => {
        const take = Math.max(0, Math.min(r.text.length, shown - used));
        used += r.text.length;
        return <span key={i} style={{ color: r.accent ? ink.accent : ink.ink }}>{r.text.slice(0, take)}</span>;
      })}
      <span style={{ display: "inline-block", width: size * 0.07, height: size * 0.9, marginLeft: size * 0.05,
        transform: `translateY(${size * 0.12}px)`, background: ink.accent, opacity: caretOn ? 1 : 0, borderRadius: 2 }} />
    </div>
  );
};

/* -------------------------------------------------------------- numbers */

const colPos = (v: number, i: number) => {
  if (i === 0) return v;
  const p = Math.pow(10, i);
  const lower = ((v % p) + p) % p;
  return Math.floor(v / p) + Math.max(0, lower - (p - 1));
};

/**
 * Rolling digits. `value` is continuous, so drive it with interpolate and every column rolls
 * like an odometer: units spin, tens turn over only on the carry.
 */
export const Odometer: React.FC<{
  value: number;
  digits: number;
  size: number;
  color: string;
  weight?: number;
}> = ({ value, digits, size, color, weight = 700 }) => {
  const h = size * 1.05;
  const cells = [...Array(12)].map((_, i) => (i + 9) % 10); // 9,0,1..9,0 so both wraps are seamless
  return (
    <div style={{ display: "inline-flex", fontFamily: INTER, fontWeight: weight, fontSize: size, color,
      fontVariantNumeric: "tabular-nums", letterSpacing: "-0.04em", lineHeight: `${h}px`,
      height: h, overflow: "hidden" }}>
      {[...Array(digits)].map((_, k) => {
        const i = digits - 1 - k;
        const pos = ((colPos(value, i) % 10) + 10) % 10;
        return (
          <div key={k} style={{ width: "0.62em", textAlign: "center",
            transform: `translateY(${-(pos + 1) * h}px)` }}>
            {cells.map((d, j) => <div key={j} style={{ height: h }}>{d}</div>)}
          </div>
        );
      })}
    </div>
  );
};

/**
 * A dial of whole numbers, the reel's "04 / 05 / 06 minutes" wheel. Neighbours are the numbers
 * either side of the current one (02 / 03 / 04), not per-digit neighbours, which is why this is
 * separate from Odometer. `value` is continuous; the fraction is the roll between two numbers.
 */
export const NumberWheel: React.FC<{ value: number; pad: number; size: number; color: string }> = ({ value, pad, size, color }) => {
  const h = size * 1.05;
  const base = Math.floor(value);
  const frac = value - base;
  return (
    <div style={{ height: h * 3, overflow: "hidden", fontFamily: INTER, fontWeight: 700, fontSize: size, color, lineHeight: `${h}px`,
      fontVariantNumeric: "tabular-nums", letterSpacing: "-0.04em",
      maskImage: "linear-gradient(transparent, rgba(0,0,0,.28) 22%, #000 40%, #000 60%, rgba(0,0,0,.28) 78%, transparent)" }}>
      <div style={{ transform: `translateY(${-frac * h}px)` }}>
        {[base - 1, base, base + 1, base + 2].map((n) => (
          <div key={n} style={{ height: h }}>{n < 0 ? "" : String(n).padStart(pad, "0")}</div>
        ))}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------- people */

/** Stock portrait by index, cycled. Faces live in public/kit/faces (randomuser.me, placeholder). */
const FACE_FILES = [
  "w2", "m5", "w8", "m11", "w14", "m17", "w21", "m24", "w26", "m29", "w32", "m35", "w38", "m41", "w44", "m47",
  "w50", "m53", "w56", "m60", "w63", "m65", "w68", "m71", "m2", "w5", "m8", "w11", "m14", "w17", "m21", "w24",
  "m26", "w29", "m32", "w35", "m38", "w41", "m44", "w47", "m50", "w53", "m56", "w60", "m63", "w65", "m68", "w71",
];
export const face = (i: number) => staticFile(`kit/faces/${FACE_FILES[((i % FACE_FILES.length) + FACE_FILES.length) % FACE_FILES.length]}.jpg`);

/** A round face with an optional speech bubble, popping in and drifting. */
export const FaceChip: React.FC<{
  i: number;
  x: number;
  y: number;
  at: number;
  size?: number;
  bubble?: string;
  side?: "left" | "right";
  ring?: string;
}> = ({ i, x, y, at, size = 96, bubble, side = "right", ring }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(f, at, fps);
  const b = pop(f, at + 8, fps, 15);
  const dx = Math.sin((f + i * 40) / 34) * 6;
  const dy = Math.cos((f + i * 55) / 41) * 8;
  return (
    <div style={{ position: "absolute", left: x + dx, top: y + dy, transform: `translate(-50%,-50%) scale(${s})` }}>
      <Img src={face(i)} style={{ width: size, height: size, borderRadius: "50%", display: "block", objectFit: "cover",
        border: `${Math.round(size * 0.05)}px solid ${ring ?? "rgba(255,255,255,.9)"}`, boxShadow: "0 18px 40px rgba(0,0,0,.45)" }} />
      {bubble ? (
        <div style={{ position: "absolute", top: -size * 0.28, [side === "right" ? "left" : "right"]: size * 0.72,
          transform: `scale(${b}) rotate(${side === "right" ? 4 : -4}deg)`, transformOrigin: side === "right" ? "0% 100%" : "100% 100%",
          whiteSpace: "nowrap", fontFamily: INTER, fontWeight: 600, fontSize: size * 0.24, color: "#121214",
          background: "#fff", padding: `${size * 0.09}px ${size * 0.17}px`, borderRadius: size * 0.2,
          boxShadow: "0 10px 26px rgba(0,0,0,.35)" }}>{bubble}</div>
      ) : null}
    </div>
  );
};

/* ----------------------------------------------------------------- hand */

/** Closed pointing-hand silhouette on a 24 grid; the fingertip is at (9, 2.5). */
const HAND = "M9 2.5c.83 0 1.5.67 1.5 1.5V10c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V16c0 3.3-2.7 6-6 6h-2.5c-2 0-3.4-.7-4.6-2L3.6 15.6c-.6-.6-.6-1.6 0-2.2s1.6-.6 2.2 0L7.5 15V4c0-.83.67-1.5 1.5-1.5Z";

/**
 * The hand that does the tapping. Glides in from `from`, lands its fingertip on `to`, presses at
 * `tapAt` (squash, then a ripple ring), and leaves at `leaveAt` if given.
 */
export const Hand: React.FC<{
  from: [number, number];
  to: [number, number];
  at: number;
  tapAt: number;
  leaveAt?: number;
  size?: number;
  ripple?: string;
}> = ({ from, to, at, tapAt, leaveAt, size = 120, ripple = "rgba(255,255,255,.7)" }) => {
  const f = useCurrentFrame();
  const p = ramp(f, at, tapAt - 4, EASE_CAMERA);
  const l = leaveAt === undefined ? 0 : ramp(f, leaveAt, leaveAt + 14, Easing.in(Easing.cubic));
  const x = interpolate(p, [0, 1], [from[0], to[0]]) + l * 260;
  const y = interpolate(p, [0, 1], [from[1], to[1]]) + l * 300;
  const press = interpolate(f, [tapAt - 2, tapAt + 2, tapAt + 8], [1, 0.84, 1], clamp);
  const r = ramp(f, tapAt + 1, tapAt + 20, Easing.out(Easing.cubic));
  const sc = size / 24;
  return (
    <>
      {f >= tapAt ? (
        <div style={{ position: "absolute", left: to[0], top: to[1], width: 170 * r, height: 170 * r,
          transform: "translate(-50%,-50%)", borderRadius: "50%", border: `3px solid ${ripple}`, opacity: 1 - r }} />
      ) : null}
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", left: x - 9 * sc, top: y - 2.5 * sc,
        opacity: ramp(f, at, at + 6) * (1 - l), transform: `scale(${press})`, transformOrigin: `${9 * sc}px ${2.5 * sc}px`,
        filter: "drop-shadow(0 14px 22px rgba(0,0,0,.45))", overflow: "visible" }}>
        <path d={HAND} fill="#fff" stroke="#0b0b0d" strokeWidth={1.1} strokeLinejoin="round" />
        <path d="M10.5 10v2.2M13.5 11v1.6M16.5 11.5v1.2" stroke="#0b0b0d" strokeWidth={1} strokeLinecap="round" opacity={0.55} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- cards */

/**
 * A real product capture floating in space. Arrives tilted back and settles flat, the reel's
 * card entrance. `x`/`y` are the card's centre.
 */
export const FloatCard: React.FC<{
  src: string;
  w: number;
  h: number;
  x: number;
  y: number;
  at: number;
  rot?: number;
  tilt?: number;
  radius?: number;
  from?: number;
}> = ({ src, w, h, x, y, at, rot = 0, tilt = 22, radius = 22, from = 90 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - at, fps, config: { damping: 18, stiffness: 90, mass: 0.9 } });
  const bob = Math.sin((f + x) / 45) * 5;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2 + (1 - p) * from + bob, width: w, height: h,
      opacity: ramp(f, at, at + 10), perspective: 1600 }}>
      <div style={{ width: "100%", height: "100%", borderRadius: radius, overflow: "hidden",
        transform: `rotateX(${(1 - p) * tilt}deg) rotateY(${(1 - p) * -tilt * 0.45}deg) rotate(${rot}deg) scale(${0.9 + 0.1 * p})`,
        boxShadow: "0 50px 110px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.07)" }}>
        <Img src={src} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
    </div>
  );
};

/** Lucide icon paths (24 grid, stroke), only the handful the kit uses. */
export const ICON: Record<string, string[]> = {
  book: ["M12 7v14", "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"],
  mail: ["M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"],
  briefcase: ["M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", "M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"],
  chat: ["M7.9 20A9 9 0 1 0 4 16.1L2 22Z"],
  calendar: ["M8 2v4", "M16 2v4", "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M3 10h18"],
  check: ["M20 6 9 17l-5-5"],
  users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
};

export const Icon: React.FC<{ name: keyof typeof ICON; size: number; color: string; stroke?: number }> = ({ name, size, color, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {ICON[name].map((d, i) => <path key={i} d={d} />)}
  </svg>
);

/** The brand's four-point sparkle. */
export const SPARK = "M12 0C12.9 6.6 17.4 11.1 24 12C17.4 12.9 12.9 17.4 12 24C11.1 17.4 6.6 12.9 0 12C6.6 11.1 11.1 6.6 12 0Z";

/** A notification from some other tool. The problem side of the story, never our product. */
export const Notice: React.FC<{ icon: keyof typeof ICON; from: string; text: string; time: string; w: number; ink: Ink }> = ({
  icon, from, text, time, w, ink,
}) => (
  <div style={{ width: w, display: "flex", gap: 22, alignItems: "center", padding: "24px 28px", borderRadius: 26,
    background: ink.surface, border: `1px solid ${ink.line}`, boxShadow: "0 24px 60px rgba(0,0,0,.5)", fontFamily: INTER }}>
    <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,.07)", display: "grid", placeItems: "center", flex: "none" }}>
      <Icon name={icon} size={32} color={ink.ink} />
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 600, color: ink.soft }}>
        <span>{from}</span><span style={{ fontWeight: 500 }}>{time}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 600, color: ink.ink, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{text}</div>
    </div>
  </div>
);

/**
 * The event action button, REDRAWN from campusai-demo's event-rsvp-button.tsx: filled primary
 * with "Add to CampusAI Calendar", and after the press the 12% primary tint, primary border and
 * text, a check, and "On your calendar". Strings are the component's own. `flipAt` is the press.
 */
export const CalendarPill: React.FC<{ x: number; y: number; at: number; flipAt: number; scale?: number; primary: string }> = ({
  x, y, at, flipAt, scale = 2.6, primary,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(f, at, fps, 15);
  const on = f >= flipAt;
  const squash = interpolate(f, [flipAt - 2, flipAt + 2, flipAt + 9], [1, 0.94, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${scale * s * squash})` }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 10, padding: "8px 16px", whiteSpace: "nowrap",
        fontFamily: INTER, fontWeight: 600, fontSize: 12,
        ...(on
          ? { border: `1px solid color-mix(in oklab, ${primary} 35%, transparent)`, background: `color-mix(in oklab, ${primary} 12%, transparent)`, color: primary }
          : { border: "1px solid transparent", background: primary, color: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.2)" }) }}>
        {on ? <Icon name="check" size={13} color={primary} stroke={2.6} /> : null}
        {on ? "On your calendar" : "Add to CampusAI Calendar"}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------- grounds */

/** Full-bleed colour field with a phrase tiled behind in outline, rows drifting both ways. */
export const PatternField: React.FC<{ phrase: string; color: string; size?: number }> = ({ phrase, color, size = 70 }) => {
  const f = useCurrentFrame();
  const rows = 12;
  return (
    <div style={{ position: "absolute", inset: 0, background: color, overflow: "hidden" }}>
      {[...Array(rows)].map((_, r) => (
        <div key={r} style={{ position: "absolute", top: r * size * 1.18 - 20, left: -400 + (r % 2 ? -1 : 1) * f * 1.4 - (r % 3) * 120,
          whiteSpace: "nowrap", fontFamily: INTER, fontWeight: 700, fontSize: size, letterSpacing: "-0.03em",
          color: "transparent", WebkitTextStroke: "1.5px rgba(255,255,255,.24)" }}>
          {`${phrase}   `.repeat(6)}
        </div>
      ))}
    </div>
  );
};

/** Bars rising from the bottom edge, the reel's end-card equaliser glow. */
export const RiseBars: React.FC<{ at: number; color: string; count?: number; height: number }> = ({ at, color, count = 26, height }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  const bw = width / count;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height, display: "flex", alignItems: "flex-end",
      maskImage: "linear-gradient(to top, #000 30%, transparent)" }}>
      {[...Array(count)].map((_, i) => {
        const c = 1 - Math.abs(i - (count - 1) / 2) / (count / 2);
        const grow = ramp(f, at + Math.abs(i - count / 2) * 1.2, at + 18 + Math.abs(i - count / 2) * 1.2);
        const wob = 0.75 + 0.25 * Math.sin(f / 6 + i * 1.7) * Math.cos(f / 11 + i);
        return <div key={i} style={{ width: bw - 8, margin: "0 4px", height: height * (0.25 + 0.75 * c) * wob * grow,
          borderRadius: "12px 12px 0 0", background: `linear-gradient(to top, ${color}, transparent)` }} />;
      })}
    </div>
  );
};

/**
 * A group chat going off. Messages arrive at their `at` frames and push older ones up, and the
 * unread badge counts every arrival plus `base`. Not any real app's chrome, so it is drawn freely.
 */
export const ChatThread: React.FC<{
  name: string;
  faceIndex: number;
  base: number;
  msgs: { at: number; who: number; text: string }[];
  w: number;
  ink: Ink;
}> = ({ name, faceIndex, base, msgs, w, ink }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const arrived = msgs.filter((m) => f >= m.at);
  const unread = base + arrived.length;
  const bump = arrived.length ? pop(f, arrived[arrived.length - 1].at, fps, 10) : 1;
  const ROW = 64;
  const shown = arrived.slice(-3);
  return (
    <div style={{ width: w, borderRadius: 28, background: ink.surface, border: `1px solid ${ink.line}`, padding: 22,
      boxShadow: "0 24px 60px rgba(0,0,0,.5)", fontFamily: INTER }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Img src={face(faceIndex)} style={{ width: 52, height: 52, borderRadius: 16, objectFit: "cover" }} />
        <div style={{ flex: 1, fontSize: 26, fontWeight: 600, color: ink.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div style={{ minWidth: 52, height: 40, padding: "0 12px", borderRadius: 20, background: ink.accent, color: "#fff", fontSize: 24,
          fontWeight: 700, display: "grid", placeItems: "center", transform: `scale(${0.85 + 0.15 * bump})` }}>
          {unread > 99 ? "99+" : unread}
        </div>
      </div>
      <div style={{ position: "relative", height: ROW * 3, marginTop: 16, overflow: "hidden" }}>
        {shown.map((m, i) => {
          const p = ramp(f, m.at, m.at + 8);
          const slot = shown.length - 1 - i;
          return (
            <div key={m.at} style={{ position: "absolute", left: 0, right: 0, bottom: slot * ROW + (1 - p) * -30, height: ROW - 10,
              display: "flex", alignItems: "center", gap: 10, opacity: p * (slot === 2 ? 0.45 : 1) }}>
              <Img src={face(m.who)} style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flex: "none" }} />
              <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 18, padding: "10px 16px", fontSize: 24, color: ink.ink,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: w - 110 }}>{m.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------- app notifications */

/** An app as a notification shows it: a coloured tile with a glyph, and a name. Invented, never a real logo. */
export type App = { name: string; tile: string; glyph: keyof typeof ICON; glyphColor?: string };

/**
 * A phone-style notification: frosted glass over whatever is behind, the app tile on the left,
 * app name and time on top, a bold title and one line of body. Different tiles are what make a
 * pile of these read as many different apps.
 */
export const AppNotice: React.FC<{ app: App; title: string; body?: string; time?: string; w: number }> = ({
  app, title, body, time = "now", w,
}) => (
  <div style={{ width: w, display: "flex", gap: 22, alignItems: "flex-start", padding: "22px 26px", borderRadius: 34,
    background: "rgba(48,42,46,.62)", backdropFilter: "blur(28px) saturate(1.6)", WebkitBackdropFilter: "blur(28px) saturate(1.6)",
    border: "1px solid rgba(255,255,255,.1)", boxShadow: "0 24px 60px rgba(0,0,0,.45)", fontFamily: INTER }}>
    <div style={{ width: 76, height: 76, borderRadius: 19, background: app.tile, display: "grid", placeItems: "center", flex: "none",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.25)" }}>
      <Icon name={app.glyph} size={40} color={app.glyphColor ?? "#fff"} stroke={2.2} />
    </div>
    <div style={{ minWidth: 0, flex: 1, paddingTop: 2 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 23, fontWeight: 600, color: "rgba(255,255,255,.6)" }}>
        <span>{app.name}</span><span style={{ fontWeight: 500 }}>{time}</span>
      </div>
      <div style={{ fontSize: 29, fontWeight: 700, color: "#fff", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
      {body ? <div style={{ fontSize: 26, fontWeight: 500, color: "rgba(255,255,255,.78)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{body}</div> : null}
    </div>
  </div>
);

/* ------------------------------------------------------------- laptop */

/** A laptop in real 3D: lid and keyboard deck hinged, so it can sit at three-quarters and turn to face you. */
export const LAPTOP_SCREEN = { w: 1440, h: 900 };
const BEZ = { side: 22, top: 26, bottom: 30 };
export const LID = { w: LAPTOP_SCREEN.w + BEZ.side * 2, h: LAPTOP_SCREEN.h + BEZ.top + BEZ.bottom };
const DECK = { w: LID.w + 150, d: 980 };

export type LaptopCam = { x: number; y: number; s: number; ax: number; ay: number; px: number; py: number };

/**
 * `cam` says which SCREEN point (px, py, in screen pixels) sits at frame point (x, y), at scale s,
 * with the laptop turned by ax (tip back) and ay (turn sideways) about that same point, so the
 * focus never slides while it turns. `screen` is drawn inside the screen, in screen pixels, so
 * anything placed there (a hand, a highlight) turns with it.
 *
 * `lid` is how far the laptop is open, in degrees (0 shut, 100 open). To open it on a still deck,
 * drive ax with the lid (ax = base + lid - 100, base negative to look down on it) and put the pivot on the hinge (px = 720, py = 930).
 * Every panel has a back face, so a shut laptop shows its lid (with the wordmark) and a turn never
 * shows a mirrored screen.
 */
export const Laptop3D: React.FC<{ cam: LaptopCam; screen: React.ReactNode; overlay?: React.ReactNode; lid?: number; perspective?: number }> = ({
  cam, screen, overlay, lid = 100, perspective = 2800,
}) => {
  const px = cam.px + BEZ.side;
  const py = cam.py + BEZ.top;
  const keys = [...Array(6 * 15)];
  // The deck's tilt relative to the camera. Seen from above it is well under 80; head-on it points
  // straight at the camera, where Chrome's 3D sorting clips the lid, so it fades out there (it is
  // off-frame head-on anyway). NEGATIVE ax looks down on the laptop; positive ax looks up from under it.
  const deckWorld = cam.ax + 180 - lid;
  const deck = Math.max(0, Math.min(1, (80 - deckWorld) / 8));
  const metal = "linear-gradient(184deg, #423a3b 0%, #272022 32%, #1a1517 70%, #241d1f 100%)";
  const face = { position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" } as const;
  return (
    <div style={{ position: "absolute", inset: 0, perspective, perspectiveOrigin: `${cam.x}px ${cam.y}px` }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: LID.w, height: LID.h, transformOrigin: "0 0", transformStyle: "preserve-3d",
        transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s}) rotateX(${cam.ax}deg) rotateY(${cam.ay}deg) translate(${-px}px, ${-py}px)` }}>
        {/* keyboard deck, hinged at the bottom of the lid */}
        {deck > 0.01 ? (
          <div style={{ position: "absolute", left: (LID.w - DECK.w) / 2, top: LID.h - 4, width: DECK.w, height: DECK.d, transformOrigin: "50% 0",
            transform: `rotateX(${180 - lid}deg)`, transformStyle: "preserve-3d", opacity: deck }}>
            <div style={{ ...face, borderRadius: "10px 10px 34px 34px", background: "linear-gradient(180deg, #3b3436 0%, #2b2527 40%, #1f1a1c 100%)",
              boxShadow: "inset 0 0 0 2px rgba(255,255,255,.07)" }}>
              <div style={{ position: "absolute", left: 120, right: 120, top: 70, height: 470, display: "grid", gridTemplateColumns: "repeat(15, 1fr)",
                gap: 10, padding: 16, borderRadius: 14, background: "#151113" }}>
                {keys.map((_, i) => <div key={i} style={{ borderRadius: 8, background: "linear-gradient(180deg,#2a2426,#1d181a)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)" }} />)}
              </div>
              <div style={{ position: "absolute", left: "50%", top: 580, width: 620, height: 340, transform: "translateX(-50%)", borderRadius: 22,
                background: "linear-gradient(180deg,#2f292b,#262022)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.05)" }} />
            </div>
            <div style={{ ...face, transform: "rotateX(180deg)", borderRadius: "34px 34px 10px 10px", background: "linear-gradient(0deg, #2e2729, #1a1517)" }} />
          </div>
        ) : null}
        {/* lid: the screen side, and the back with the wordmark */}
        <div style={{ ...face, borderRadius: "28px 28px 10px 10px", background: metal,
          boxShadow: "0 2px 0 rgba(255,255,255,.12) inset, 0 0 0 1px rgba(255,255,255,.1)" }}>
          <div style={{ position: "absolute", left: BEZ.side, top: BEZ.top, width: LAPTOP_SCREEN.w, height: LAPTOP_SCREEN.h, overflow: "hidden",
            borderRadius: 6, background: "#0b0708" }}>
            {screen}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(102deg, rgba(255,255,255,.07) 0%, rgba(255,255,255,.02) 18%, rgba(255,255,255,0) 38%)" }} />
            {/* the screen wakes as the lid opens */}
            <div style={{ position: "absolute", inset: 0, background: "#050304", opacity: 1 - Math.max(0, Math.min(1, (lid - 50) / 45)) }} />
          </div>
          {/* in screen pixels but NOT clipped by the screen: things flying onto it from outside */}
          {overlay ? <div style={{ position: "absolute", left: BEZ.side, top: BEZ.top, width: LAPTOP_SCREEN.w, height: LAPTOP_SCREEN.h }}>{overlay}</div> : null}
        </div>
        <div style={{ ...face, transform: "rotateY(180deg)", borderRadius: "28px 28px 10px 10px", background: metal, display: "grid", placeItems: "center",
          boxShadow: "inset 0 0 0 2px rgba(255,255,255,.06)" }}>
          {/* turned so it reads from in front of the laptop, the way the camera sees a shut lid */}
          <Img src={staticFile("wall/campusai-wordmark-white.svg")} style={{ width: 460, opacity: 0.55, transform: "rotate(180deg)" }} />
        </div>
      </div>
    </div>
  );
};

/**
 * The hand at a point, for following a RECORDED cursor frame by frame. `since` is seconds since the
 * last click (null when none is recent): a squash on the press and a ripple ring after it.
 */
export const HandAt: React.FC<{ x: number; y: number; since: number | null; size?: number; opacity?: number }> = ({ x, y, since, size = 150, opacity = 1 }) => {
  const sc = size / 24;
  const press = since === null ? 1 : interpolate(since, [0, 0.07, 0.25], [0.84, 0.84, 1], clamp);
  const r = since === null ? 1 : Math.min(1, since / 0.55);
  return (
    <>
      {since !== null && r < 1 ? (
        <div style={{ position: "absolute", left: x, top: y, width: 170 * r, height: 170 * r, transform: "translate(-50%,-50%)", borderRadius: "50%",
          border: "3px solid rgba(255,255,255,.7)", opacity: 1 - r }} />
      ) : null}
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", left: x - 9 * sc, top: y - 2.5 * sc, opacity,
        transform: `scale(${press})`, transformOrigin: `${9 * sc}px ${2.5 * sc}px`, filter: "drop-shadow(0 14px 22px rgba(0,0,0,.45))", overflow: "visible" }}>
        <path d={HAND} fill="#fff" stroke="#0b0b0d" strokeWidth={1.1} strokeLinejoin="round" />
        <path d="M10.5 10v2.2M13.5 11v1.6M16.5 11.5v1.2" stroke="#0b0b0d" strokeWidth={1} strokeLinecap="round" opacity={0.55} />
      </svg>
    </>
  );
};
