/**
 * "You applied. They're coming. Walk in ready." (product demo type, film 1), round 2: "Connect the dots" (Nov 5).
 *
 * One student job end to end on the real demo, wide 16:9 (the launch format, Jacob Nov 5). A red thread carries the
 * story through four parts of the product, each marked with the product's own nav icon: her Morgan Stanley
 * application (Career), their campus visit matched to it (Events), the one press that lands it on Tuesday (My
 * Calendar), and the chat that preps her (CampusAI). At the end the four marks line up on the thread and become the logo.
 *
 * Jacob's round 1 note: "doesn't do the storytelling well and should have better icons and animations". Icons appear
 * only where they do a job (which part of the product the thread is in, checks that tick); no icon repeats a word.
 * Music: "House Vibez" (Lily J, Mixkit), 122 BPM, entered so film frame 0 is a beat: every press, landing and check
 * sits on a beat (B(n) = n x 14.754 frames).
 *
 * Recordings: public/info-session-ready/flow (npm run flow info-session-ready) and .../chat (npm run chat).
 * Brief, facts, shot list, reviews: Content/video-studio/films/info-session-ready/.
 */
import React from "react";
import { AbsoluteFill, Composition, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { EASE, EASE_CAMERA, ICON, INTER, PointerAt, SPARK, ZODIAK, brand, useBrandFonts, type PageCam, type Rect } from "../kit";
import { clampCam, mixCam, toCanvas } from "../kit/camera";
import { pointerAt } from "../kit/FlowRecording";
import { asset, useFrameSeq } from "../system/parts/common";

const B = brand("campusai");
export const FPS = 30;
const W = 1920;
const H = 1080;

// The light world: warm off-white ground, warm black ink, CampusAI red the one accent.
const GROUND = "#F6F1ED";
const INK = "#1d1517";
const SOFT = "#7a6c66";
const UNLIT = "#cfc4bd";
const RED = B.color.accent;
const RED_PALE = "#fbe3e5";

const DIR = "info-session-ready";
const FLOW = `${DIR}/flow/frames.json`;
const CHAT = `${DIR}/chat/frames.json`;
const aud = (n: string) => staticFile(`${DIR}/audio/${n}`);

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const k = (f: number, a: number, b: number, easing = EASE) => interpolate(f, [a, b], [0, 1], { ...clamp, easing });
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mixRect = (a: Rect, b: Rect, t: number): Rect => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });
export const pw = (f: number, pts: [number, number][]) => {
  if (f <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, ta] = pts[i];
    const [b, tb] = pts[i + 1];
    if (f <= b) return ta + ((f - a) / (b - a)) * (tb - ta);
  }
  const [lf, lt] = pts[pts.length - 1];
  return lt + (f - lf) / FPS;
};
export const pop = (f: number, at: number, damping = 13) => spring({ frame: f - at, fps: FPS, config: { damping, stiffness: 170, mass: 0.7 } });

// ---- the beats: house vibez at 122 BPM, one beat = 14.754 frames ----
const BEAT = (60 / 122) * FPS;
const Bt = (n: number) => Math.round(n * BEAT);
export const FRAMES = Bt(59) + 2 + 46; // 30.6 s
const T = {
  logo: 8,
  hers: Bt(3), // hers lands in the bucket, alone on its beat
  stand: Bt(6), // "How do you stand out?" while the pile keeps growing over it
  lift: Bt(9), // hers lifts out of the pile
  node1: Bt(9) + 16, // the Career mark on it
  eventIn: Bt(10), // the event pops in beside it, like an alert
  thread1: Bt(10) + 6, // the thread runs from her application to the campus visit
  node2: Bt(12), // the Events mark
  merge: Bt(14), // her application docks as a chip, the event card takes the frame
  push1: Bt(16), // the camera eases in on main's "Why this fits you" card; nothing is veiled
  under: Bt(17) + 4, // a red underline draws under "stop being a name on a list."
  pull1: Bt(23), // to the buttons
  press: Bt(26), // Add to CampusAI Calendar
  pill: Bt(27), // the button turns to "On your calendar"
  flier: Bt(27) + 6, // the event lifts off as a calendar block, straight away
  cal: Bt(28) + 2, // My Calendar rises under it, on this week
  next: Bt(32) - 5, // the press forward to Nov 8 to 14; the week flips 3 frames later, 2 frames before the block lands
  fly: Bt(30),
  land: Bt(32), // the block lands on Tuesday, 6 PM
  when: Bt(33), // "Tue, Nov 10, 6 PM. In 5 days."
  push2: Bt(33),
  chatLine: Bt(37), // "Then it gets you ready."
  rowIn: Bt(37) + 8, // the daily brief row with main's prep pill rises
  tap: Bt(40), // the pill is pressed
  send: Bt(41), // the chat opens on the pill's question, already sent
  done: Bt(46),
  push3: Bt(46) + 6, // the camera eases in on "What to listen for"
  tipUnder: Bt(48), // a red underline draws under the posting's skills
  close: Bt(55),
  recap: Bt(55), // "Walk in ready."
  converge: Bt(59),
  end: Bt(59) + 2, // the logo
  bloom: Bt(59) + 10,
};

// ---- layout, wide ----
const CARD: Rect = { x: 210, y: 196, w: 1500, h: 784 };
const CHAT_CARD: Rect = { x: 360, y: 190, w: 1200, h: 830 }; // big from the start, so the answer reads as it streams
const TIP_VIEW: Rect = { x: 240, y: 110, w: 1440, h: 860 }; // wide, for the push into "What to listen for"
const HEAD = { x: 960, y: 112, size: 60, maxW: 1500 };
const PILL = { x: 960, y: 1034 };
const MARK = { x: 128, y: 64, w: 150 };
const APP_BIG: Rect = { x: 100, y: 470, w: 820, h: 160 }; // lifted out of the pile, left of the visit

// ---- the bucket: everyone's applications, hers one of them ----
const BUCKET: Rect = { x: 600, y: 470, w: 720, h: 470 };
const LIP: Rect = { x: 572, y: 870, w: 776, h: 90 };
const PCARD = { w: 600, h: 104 };
const HERS = 7; // her card's place in the drop order
// Each application: when it starts falling, where it rests (offset from the bucket's centre), its tilt.
// Hers sits further left than any other, so its red badge stays in view as the pile grows over it.
const DROPS = Array.from({ length: 20 }, (_, i) => {
  const at = i < HERS ? Math.round(i * 4.4) : i === HERS ? Bt(3) - 14 : Bt(3) + 8 + Math.round((i - HERS - 1) * 5.5);
  const jx = i === HERS ? -128 : [12, 44, -6, 30, 58, 4, 36, 20, 50, -2][i % 10];
  const r = i === HERS ? -2.2 : [2.4, -1.6, 3, -2.8, 1.2, -0.8, 2, -3.2, 0.6, 1.8][i % 10];
  return { at, x: 960 - PCARD.w / 2 + jx, y: 812 - i * 22, r };
});
const HERS_REST: Rect = { x: DROPS[HERS].x, y: DROPS[HERS].y, w: PCARD.w, h: PCARD.h };

// ---- the daily brief row, with main's prep pill for an info session (brief-actions.ts, eventPrepVariant) ----
const ROW: Rect = { x: 240, y: 600, w: 1440, h: 200 }; // below Tuesday's calendar mark, so the thread can arrive over it
const PREP: Rect = { x: ROW.x + ROW.w - 470, y: ROW.y + 46, w: 430, h: 108 };
const APP_CHIP: Rect = { x: 228, y: 1000, w: 350, h: 56 }; // docked below the card, clear of the line
const EVENT_SMALL: Rect = { x: 1150, y: 300, w: 680, h: 465 }; // the card's own shape, so no backdrop shows around it

// ---- page geometry (CSS px of each recording) ----
const FLOW_PAGE = { w: 1440, h: 900 };
const CHAT_PAGE = { w: 1100, h: 1956 };
export const fit = (r: Rect, view: { w: number; h: number }, o: { pad?: number; top?: boolean; bottom?: boolean; left?: boolean; dpr?: number } = {}): PageCam => {
  const pad = o.pad ?? 1;
  const a = view.h / view.w;
  const cw = Math.max(r.w * pad, (r.h * pad) / a, view.w / ((o.dpr ?? 3) * 1.2));
  const cx = o.left ? Math.max(r.x + r.w / 2, r.x + cw / 2) : r.x + r.w / 2;
  const cy = o.top ? r.y + (cw * a) / 2 : o.bottom ? r.y + r.h - (cw * a) / 2 : r.y + r.h / 2;
  return { cx, cy, cw };
};
const R_CARD: Rect = { x: 340, y: 204, w: 720, h: 492 };
const R_ADD: Rect = { x: 336, y: 376, w: 525, h: 280 }; // left column and both buttons; the right column and "Not interested" stay out
const R_WHY: Rect = { x: 340, y: 212, w: 520, h: 190 }; // the title and the why card together, so the card reads on
// Where main's "Why this fits you" card sits, over the demo's own why section (page px).
const WHY_CARD: Rect = { x: 346, y: 300, w: 502, h: 98 };
const ADD_BTN = { x: 490, y: 625 };
const R_CAL: Rect = { x: 230, y: 10, w: 700, h: 610 }; // the week arrows down to Tuesday's 6 PM row; the sidebar's Maryland mark stays out
const R_WEEK6: Rect = { x: 466, y: 470, w: 704, h: 210 }; // the time labels, Monday to Wednesday around 6 PM
const BLOCK: Rect = { x: 785, y: 545, w: 126, h: 63 };
const TIP_LIT: Rect = { x: 352, y: 772, w: 632, h: 345 }; // "What to listen for" and its paragraph
// The underline under the posting's own skills: "track markets, / build pricing and hedging tools, and support / traders and salespeople."
const TIP_UNDER: { x: number; y: number; w: number }[] = [
  { x: 776, y: 868, w: 180 },
  { x: 397, y: 913, w: 558 },
  { x: 397, y: 959, w: 308 },
];

// ---- icons: the product's own nav icons (lucide), so each mark is the part of CampusAI the thread is in ----
const PIN = ["M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0", "M12 7a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"];
type MarkKind = "career" | "events" | "calendar" | "campusai";
const Glyph: React.FC<{ kind: MarkKind; size: number; color: string }> = ({ kind, size, color }) =>
  kind === "campusai" ? (
    <svg width={size} height={size} viewBox="0 0 24 24"><path d={SPARK} fill={color} /></svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {(kind === "career" ? ICON.briefcase : kind === "events" ? PIN : ICON.calendar).map((d, i) => <path key={i} d={d} />)}
    </svg>
  );

/** A thread mark: white disc, red ring, the product's icon. Pops on a spring, can glide (x, y) and leave. */
const Node: React.FC<{ kind: MarkKind; x: number; y: number; at: number; size?: number; out?: number }> = ({ kind, x, y, at, size = 64, out }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = pop(f, at);
  const o = out === undefined ? 1 : 1 - k(f, out, out + 8);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: "50%", background: "#fff",
      boxShadow: `0 0 0 3px ${RED}, 0 10px 26px rgba(160,30,40,.22)`, display: "flex", alignItems: "center", justifyContent: "center",
      transform: `scale(${(0.4 + 0.6 * p).toFixed(4)})`, opacity: Math.min(1, p * 1.6) * o }}>
      <Glyph kind={kind} size={size * 0.48} color={RED} />
    </div>
  );
};

/** The red thread: a drawn path with a bright head. `d` is canvas px; progress 0 to 1. */
const Thread: React.FC<{ d: string; progress: number; opacity?: number; dot?: boolean }> = ({ d, progress, opacity = 1, dot = true }) =>
  progress <= 0 || opacity <= 0 ? null : (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity }}>
      <path d={d} fill="none" stroke={RED} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - progress} />
      {dot && progress < 1 && <circle r={7} fill={RED} style={{ offsetPath: `path("${d}")`, offsetDistance: `${(progress * 100).toFixed(2)}%` } as React.CSSProperties} />}
    </svg>
  );
const curve = (a: { x: number; y: number }, b: { x: number; y: number }, bend = 0.4) => {
  const dx = b.x - a.x;
  return `M ${a.x} ${a.y} C ${a.x + dx * bend} ${a.y}, ${b.x - dx * bend} ${b.y}, ${b.x} ${b.y}`;
};

type Word = { w: string; red?: boolean };
export const words = (s: string, red: string[] = []): Word[] => s.split(" ").map((w) => ({ w, red: red.some((r) => w.replace(/[.,?]/g, "") === r) }));
/** A line whose words arrive and colour in one by one. */
export const Line: React.FC<{ ws: Word[]; at: number; out?: number; x: number; y: number; size: number; maxW?: number; stagger?: number }> = ({ ws, at, out, x, y, size, maxW = 1500, stagger = 3 }) => {
  const f = useCurrentFrame();
  if (f < at || (out !== undefined && f > out + 10)) return null;
  const leave = out === undefined ? 0 : k(f, out, out + 9, EASE_CAMERA);
  return (
    <div style={{ position: "absolute", left: x - maxW / 2, top: y, width: maxW, transform: `translateY(-50%) translateY(${-20 * leave}px)`, opacity: 1 - leave,
      textAlign: "center", fontFamily: ZODIAK.family, fontWeight: 700, fontSize: size, lineHeight: 1.08, letterSpacing: ZODIAK.track }}>
      {ws.map((wd, i) => {
        const a = at + i * stagger;
        const show = k(f, a, a + 8);
        const lit = k(f, a + 4, a + 14);
        const color = wd.red ? (lit > 0.5 ? RED : UNLIT) : lit > 0.5 ? INK : UNLIT;
        return (
          <span key={i} style={{ display: "inline-block", marginRight: "0.24em", opacity: show, transform: `translateY(${(1 - show) * 16}px)`, color,
            filter: `blur(${((1 - show) * 6).toFixed(2)}px)`, fontStyle: wd.red && lit > 0.5 ? "italic" : "normal", fontWeight: wd.red && lit > 0.5 ? 400 : 700 }}>
            {wd.w}
          </span>
        );
      })}
    </div>
  );
};

/** A recorded frame sequence through the page camera: light, frameless, soft lift. */
export const Shot: React.FC<{ src: string; t: number; page: { w: number; h: number }; cam: PageCam; view: Rect; radius: number; opacity?: number; children?: React.ReactNode }> = ({ src, t, page, cam, view, radius, opacity = 1, children }) => {
  const seq = useFrameSeq(src);
  if (!seq || !seq.frames.length || opacity <= 0) return null;
  let shown = seq.frames[0];
  for (const fr of seq.frames) {
    if (fr.t <= t) shown = fr;
    else break;
  }
  const c = clampCam(cam, page, { w: view.w, h: view.h });
  const o = toCanvas(c, view, 0, 0);
  const s = view.w / c.cw;
  return (
    <div style={{ position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h, overflow: "hidden", borderRadius: radius, background: "#fbf8f6", opacity,
      boxShadow: radius > 1 ? "0 0 0 1px rgba(70,30,30,.07), 0 34px 90px rgba(90,40,40,.16)" : "none" }}>
      <Img src={asset(seq.dir + shown.name)} style={{ position: "absolute", left: o.x - view.x, top: o.y - view.y, width: page.w * s, height: page.h * s, maxWidth: "none" }} />
      <div style={{ position: "absolute", left: -view.x, top: -view.y }}>{children}</div>
    </div>
  );
};
export const onCanvas = (cam: PageCam, view: Rect, page: { w: number; h: number }, x: number, y: number) => toCanvas(clampCam(cam, page, { w: view.w, h: view.h }), view, x, y);
export const scaleOf = (cam: PageCam, view: Rect, page: { w: number; h: number }) => view.w / clampCam(cam, page, { w: view.w, h: view.h }).cw;

/** A small status pill below the product. */
const Pill: React.FC<{ at: number; out: number; icon: "check" | "calendar"; children: React.ReactNode }> = ({ at, out, icon, children }) => {
  const f = useCurrentFrame();
  if (f < at || f > out + 10) return null;
  const p = pop(f, at, 14);
  const o = 1 - k(f, out, out + 9, EASE_CAMERA);
  return (
    <div style={{ position: "absolute", left: PILL.x, top: PILL.y, transform: `translate(-50%, -50%) scale(${(0.86 + 0.14 * p).toFixed(4)})`, opacity: Math.min(1, p * 1.5) * o,
      display: "flex", alignItems: "center", gap: 14, padding: "14px 28px 14px 18px", borderRadius: 999, background: "#fff",
      boxShadow: "0 0 0 1.5px rgba(217,32,46,.22), 0 14px 40px rgba(120,30,30,.14)", fontFamily: INTER, fontWeight: 600, fontSize: 30, color: INK, whiteSpace: "nowrap" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon === "check" ? (
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d={ICON.check[0]} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k(f, at + 4, at + 14)} />
          </svg>
        ) : (
          <Glyph kind="calendar" size={20} color="#fff" />
        )}
      </div>
      {children}
    </div>
  );
};

export const Logo: React.FC<{ x: number; y: number; w: number; opacity: number; blur?: number }> = ({ x, y, w, opacity, blur = 0 }) =>
  B.logo && opacity > 0 ? (
    <Img src={staticFile(B.logo.onLight)} style={{ position: "absolute", left: x - w / 2, top: y - w / B.logo.ratio / 2, width: w, opacity, filter: blur ? `blur(${blur.toFixed(2)}px)` : undefined }} />
  ) : null;

/** Her application, drawn in the product's own card style (the setup; not a captured screen). Morphs into a docked chip. */
const AppCard: React.FC<{ rect: Rect; chip: number; appliedAt: number; muted?: boolean; you?: boolean }> = ({ rect, chip, appliedAt, muted = false, you = false }) => {
  const f = useCurrentFrame();
  const ap = pop(f, appliedAt, 12);
  const full = 1 - chip;
  const z = rect.h / 150; // the full card's type scales with it
  // everyone else's: the same application, nothing on it in colour
  const tint = muted ? "#f1ebe7" : RED_PALE;
  const mark = muted ? "#b5a79f" : RED;
  const ink = muted ? "#9d9089" : INK;
  const soft = muted ? "#bdb1aa" : SOFT;
  return (
    <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: lerp(20, 28, chip), background: "#fff",
      boxShadow: "0 0 0 1px rgba(70,30,30,.07), 0 24px 60px rgba(90,40,40,.14)", overflow: "hidden", fontFamily: INTER }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 22 * z, padding: `0 ${30 * z}px`, opacity: full }}>
        <div style={{ width: 72 * z, height: 72 * z, borderRadius: 16 * z, background: tint, color: mark, fontWeight: 700, fontSize: 26 * z, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>MS</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 21 * z, color: ink, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>Sales &amp; Trading Summer Analyst, 2027</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 * z, fontWeight: 500, fontSize: 20 * z, color: soft, marginTop: 6 * z }}>
            Morgan Stanley
            {you && <span style={{ padding: `${3 * z}px ${12 * z}px`, borderRadius: 999, background: RED, color: "#fff", fontWeight: 700, fontSize: 17 * z }}>You</span>}
          </div>
        </div>
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8 * z, padding: `${9 * z}px ${16 * z}px`, borderRadius: 999, background: tint, color: mark, fontWeight: 600, fontSize: 20 * z,
          transform: `scale(${(0.5 + 0.5 * ap).toFixed(4)})`, opacity: f < appliedAt ? 0 : Math.min(1, ap * 1.6) }}>
          <svg width={18 * z} height={18 * z} viewBox="0 0 24 24" fill="none" stroke={mark} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d={ICON.check[0]} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k(f, appliedAt + 3, appliedAt + 13)} />
          </svg>
          Applied
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 12, padding: "0 18px", opacity: chip }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: RED_PALE, color: RED, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>MS</div>
        <div style={{ fontWeight: 600, fontSize: 20, color: INK, whiteSpace: "nowrap" }}>Morgan Stanley</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: RED, fontWeight: 600, fontSize: 17 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"><path d={ICON.check[0]} /></svg>
          Applied
        </div>
      </div>
    </div>
  );
};


/**
 * Main's "Why this fits you" card (event-detail-modal.tsx, the maroon hero card): a red 8% wash fading down, a red 20%
 * border, a 3px red bar on the left, the spark and the heading, then the reason. Drawn over the demo's plain why
 * section, whose design main has replaced. The underline sits under the reason's second line.
 */
const WhyCard: React.FC<{ under: number }> = ({ under }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: WHY_CARD.w, height: WHY_CARD.h, boxSizing: "border-box", borderRadius: 16, overflow: "hidden",
    background: "linear-gradient(180deg, rgba(223,23,50,0.08), rgba(223,23,50,0)), #fff", border: "1px solid rgba(223,23,50,0.20)", padding: "14px 16px 0 22px", fontFamily: INTER }}>
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "#DF1732" }} />
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: INK }}>
      <span style={{ color: "#DF1732" }}>✦</span>Why this fits you
    </div>
    <div style={{ marginTop: 9, fontSize: 13.2, lineHeight: 1.55, color: "#3D2B1A", whiteSpace: "nowrap" }}>
      <div>Your S&amp;T application is already in, so this is the room where you</div>
      <div><span style={{ position: "relative" }}>stop being a name on a list.
        <span style={{ position: "absolute", left: 0, bottom: -3, height: 2.5, width: `${(under * 100).toFixed(1)}%`, background: "#DF1732", borderRadius: 2 }} />
      </span></div>
    </div>
  </div>
);

/** Lucide MessageCircle, the mark main's prep pill carries. */
const MSG = "M7.9 20A9 9 0 1 0 4 16.1L2 22Z";
/**
 * Her daily brief row for the event, with main's prep pill (today-pack.tsx, BriefRowActionButton): a red 8% tint,
 * the chat mark pinned left, and one sentence over two lines in the same weight and colour. A motion graphic: the
 * demo's brief is static and never shows this row, so it cannot be recorded.
 */
const PrepRow: React.FC<{ rect: Rect; pill: Rect; press: number; opacity: number }> = ({ rect, pill, press, opacity }) =>
  opacity <= 0 ? null : (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: 28, background: "#fff",
        boxShadow: "0 0 0 1px rgba(70,30,30,.07), 0 30px 80px rgba(90,40,40,.14)", fontFamily: INTER }}>
        <div style={{ position: "absolute", left: 48, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 26 }}>
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={SOFT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            {PIN.map((d, i) => <path key={i} d={d} />)}
          </svg>
          <div>
            <div style={{ fontWeight: 600, fontSize: 34, color: INK, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>Morgan Stanley, Sales &amp; Trading Info Session</div>
            <div style={{ fontWeight: 500, fontSize: 28, color: SOFT, marginTop: 8 }}>6:00 PM</div>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: pill.x, top: pill.y, width: pill.w, height: pill.h, borderRadius: 999, boxSizing: "border-box",
        background: `rgba(217,32,46,${(0.08 + 0.08 * press).toFixed(3)})`, color: "#C41E2A", fontFamily: INTER, fontWeight: 600, fontSize: 31, lineHeight: 1.3,
        display: "flex", alignItems: "center", gap: 20, padding: "0 34px 0 30px", transform: `scale(${(1 - 0.04 * press).toFixed(4)})` }}>
        <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#C41E2A" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
          <path d={MSG} />
        </svg>
        <div style={{ whiteSpace: "nowrap" }}>
          <div>What to listen for</div>
          <div>and what to ask after</div>
        </div>
      </div>
    </div>
  );

/** The calendar block, drawn in the product's own block style, flying from the button to Tuesday. */
const Flier: React.FC<{ rect: Rect; opacity: number; squash: number }> = ({ rect, opacity, squash }) =>
  opacity <= 0 ? null : (
    <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, opacity, borderRadius: 10, background: "#f4cdd1", borderLeft: `5px solid ${RED}`,
      boxShadow: "0 18px 40px rgba(150,30,40,.25)", transform: `scale(${(1 + 0.06 * squash).toFixed(4)}, ${(1 - 0.08 * squash).toFixed(4)})`, overflow: "hidden",
      fontFamily: INTER, padding: `${rect.h * 0.12}px ${rect.h * 0.16}px`, boxSizing: "border-box" }}>
      <div style={{ fontWeight: 600, fontSize: rect.h * 0.24, color: INK, whiteSpace: "nowrap" }}>Morgan Stanley, Sales &amp; Trading</div>
      <div style={{ fontWeight: 500, fontSize: rect.h * 0.2, color: SOFT, whiteSpace: "nowrap", marginTop: rect.h * 0.04 }}>Van Munching Hall</div>
    </div>
  );

// ---- the film ----

export const InfoSession: React.FC = () => {
  useBrandFonts(B);
  const f = useCurrentFrame();
  const flow = useFrameSeq(FLOW) as (ReturnType<typeof useFrameSeq> & { marks?: Record<string, number>; moves?: Parameters<typeof pointerAt>[0] }) | null;
  const chat = useFrameSeq(CHAT) as (ReturnType<typeof useFrameSeq> & { marks?: Record<string, number> }) | null;
  if (!flow || !chat) return <AbsoluteFill style={{ background: GROUND }} />;
  const m = flow.marks ?? {};
  const moves = flow.moves ?? [];
  const cm = chat.marks ?? {};

  // flow time: the two presses play at true speed and land on T.press and T.next
  const addMove = moves.find((mv) => mv.click !== undefined && Math.abs(mv.click - (m.add ?? 0)) < 1.5) ?? moves[1];
  const nextMove = moves[moves.length - 1];
  const pressT = addMove?.click ?? 5.65;
  const nextT = nextMove?.click ?? 15.88;
  const CAL_FROM = nextT - (T.next - T.cal) / FPS;
  const flowT =
    f < T.cal
      ? pw(f, [
          [0, (m.card ?? 2.1)],
          [T.pull1 + 20, (m.why ?? 3.3) + 0.3],
          [T.pull1 + 21, (addMove?.start ?? pressT - 1) - 0.05],
          [T.press, pressT],
          [T.press + 60, pressT + 2],
        ])
      : pw(f, [
          [T.cal, CAL_FROM],
          [T.next + 60, nextT + 2],
        ]);
  // the chat opens on the pill's question already sent (the recording types it first; that part is never shown)
  const chatT = pw(f, [
    [T.send, (cm.send ?? 11.8) + 0.25],
    [T.done, cm.done ?? 17.41],
    [T.done + 40, (cm.done ?? 17.41) + 0.6],
  ]);

  // ---- 1. the bucket fills; hers lands on its own beat, gets buried, then lifts out ----
  const fall = (at: number) => k(f, at, at + 14, (x) => x * x); // gravity
  const settle = (at: number) => (f < at + 14 ? 0 : Math.exp(-(f - at - 14) / 3) * Math.sin((f - at - 14) / 1.6)); // a small bounce on landing
  const sink = k(f, T.lift + 2, T.lift + 26, EASE_CAMERA); // the bucket and everyone else drop away
  const liftK = k(f, T.lift, T.lift + 24, EASE_CAMERA);
  const mergeK = k(f, T.merge, T.merge + 26, EASE_CAMERA);
  const hersPile: Rect = { ...HERS_REST, y: lerp(Math.max(190, HERS_REST.y - 360), HERS_REST.y, fall(DROPS[HERS].at)) - settle(DROPS[HERS].at) * 10 };
  const lifted0 = mixRect(hersPile, APP_BIG, liftK);
  const appBase: Rect = { ...lifted0, y: lifted0.y - Math.sin(liftK * Math.PI) * 120 };
  const appRot = DROPS[HERS].r * (1 - liftK);
  const appRect = mixRect(appBase, APP_CHIP, mergeK);
  const appOut = k(f, T.pull1, T.pull1 + 14); // the chip leaves with the thread
  const hersCard = (
    <div style={{ position: "absolute", inset: 0, opacity: (1 - appOut) * k(f, DROPS[HERS].at, DROPS[HERS].at + 4), transform: `rotate(${appRot}deg)`, transformOrigin: `${appRect.x + appRect.w / 2}px ${appRect.y + appRect.h / 2}px` }}>
      <AppCard rect={appRect} chip={mergeK} appliedAt={DROPS[HERS].at + 14} you />
    </div>
  );

  // ---- 2. the campus visit pops in beside it, like an alert ----
  const evRise = pop(f, T.eventIn, 11);
  const evS = 0.7 + 0.3 * evRise;
  const evSmall: Rect = { x: EVENT_SMALL.x + (EVENT_SMALL.w * (1 - evS)) / 2, y: EVENT_SMALL.y + (EVENT_SMALL.h * (1 - evS)) / 2, w: EVENT_SMALL.w * evS, h: EVENT_SMALL.h * evS };
  const ping = k(f, T.eventIn + 4, T.eventIn + 30);
  const p1 = k(f, T.push1, T.push1 + 30, EASE_CAMERA);
  const r1 = k(f, T.pull1, T.pull1 + 24, EASE_CAMERA);
  const flyOff = k(f, T.flier, T.flier + 18, EASE_CAMERA); // the event card steps back as its block lifts off
  let evView = mixRect(evSmall, CARD, mergeK);
  const CAM_CARD = fit(R_CARD, evView);
  const CAM_WHY = fit(R_WHY, CARD, { top: true });
  const CAM_ADD = fit(R_ADD, CARD, { top: true });
  const evCam = f < T.pull1 ? mixCam(CAM_CARD, CAM_WHY, p1) : mixCam(CAM_ADD, CAM_WHY, 1 - r1);
  if (f >= T.flier) evView = { ...CARD, x: CARD.x - flyOff * flyOff * 2000 };
  const evOpacity = Math.min(1, evRise * 2);
  const whyStart = onCanvas(evCam, evView, FLOW_PAGE, 346, 345);

  // the thread, part 1: application to the visit, then chip to the why line
  const appEdge = { x: lerp(appRect.x + appRect.w + 40, appRect.x, mergeK), y: appRect.y + appRect.h / 2 }; // just off the card, clear of the Applied chip
  const t1 = k(f, T.thread1, T.thread1 + 28, EASE_CAMERA);
  const evEdge = { x: evView.x, y: evView.y + evView.h * 0.36 };
  const threadTo = f < T.merge ? evEdge : { x: lerp(evEdge.x, whyStart.x - 34, mergeK), y: lerp(evEdge.y, whyStart.y, mergeK) };
  const thread1D =
    f < T.merge
      ? curve(appEdge, threadTo, 0.45)
      : // around the card's left edge, never across its text
        `M ${appEdge.x} ${appEdge.y} C ${lerp(appEdge.x, 130, mergeK)} ${appEdge.y}, ${lerp(threadTo.x, 130, mergeK)} ${threadTo.y}, ${threadTo.x} ${threadTo.y}`;
  const thread1Out = 1 - k(f, T.pull1, T.pull1 + 12);

  // pointer for the press
  const ptr = pointerAt(moves, flowT);
  const evPtr = ptr.p ? onCanvas(evCam, evView, FLOW_PAGE, ptr.p.x, ptr.p.y) : null;
  const ptrOn = f >= T.pull1 + 18 && f < T.flier + 4;

  // ---- 3. the block flies to Tuesday ----
  const calRise = pop(f, T.cal, 16);
  const calOut = k(f, T.chatLine - 2, T.chatLine + 14, EASE_CAMERA);
  const calView: Rect = { ...CARD, y: CARD.y + (1 - calRise) * 800, x: CARD.x - calOut * 1700 };
  const p2 = k(f, T.push2, T.push2 + 30, EASE_CAMERA);
  const CAM_CAL = fit(R_CAL, CARD, { top: true, left: true });
  const calCam = mixCam(CAM_CAL, fit(R_WEEK6, CARD), p2);
  const btnAt = onCanvas(CAM_ADD, CARD, FLOW_PAGE, ADD_BTN.x, ADD_BTN.y);
  const blockAt = (() => {
    const a = onCanvas(calCam, calView, FLOW_PAGE, BLOCK.x, BLOCK.y);
    const s = scaleOf(calCam, calView, FLOW_PAGE);
    return { x: a.x, y: a.y, w: BLOCK.w * s, h: BLOCK.h * s };
  })();
  const hover: Rect = { x: btnAt.x + 330, y: btnAt.y - 380, w: 340, h: 88 }; // inside the card, up and right of the pressed button
  const lift = k(f, T.flier, T.flier + 22, EASE);
  const flyK = k(f, T.fly, T.land, (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2));
  const bob = Math.sin((f - T.flier) / 9) * 6 * (1 - flyK);
  const fromBtn: Rect = { x: btnAt.x - 150, y: btnAt.y - 24, w: 300, h: 48 };
  const lifted = mixRect(fromBtn, hover, lift);
  const flierRect: Rect =
    f < T.fly
      ? { ...lifted, y: lifted.y + bob }
      : (() => {
          // along an arc: up and over, then down into Tuesday's slot
          const a = { x: hover.x + hover.w / 2, y: hover.y + hover.h / 2 + bob };
          const b = { x: blockAt.x + blockAt.w / 2, y: blockAt.y + blockAt.h / 2 };
          const cx = lerp(a.x, b.x, 0.5);
          const cy = Math.min(a.y, b.y) - 160;
          const u = flyK;
          const x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * cx + u * u * b.x;
          const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * cy + u * u * b.y;
          const w = lerp(hover.w, blockAt.w, u);
          const h = lerp(hover.h, blockAt.h, u);
          return { x: x - w / 2, y: y - h / 2, w, h };
        })();
  const flierOn = f >= T.flier && f < T.land + 10;
  const flierOpacity = Math.min(1, k(f, T.flier, T.flier + 6)) * (1 - k(f, T.land + 2, T.land + 10));
  const squash = f >= T.land ? Math.exp(-(f - T.land) / 3) * Math.cos((f - T.land) / 2) : 0;
  const calPtr = ptr.p ? onCanvas(calCam, calView, FLOW_PAGE, ptr.p.x, ptr.p.y) : null;

  // ---- 4. the prep pill on her brief row opens the chat, which preps her ----
  const rowRise = pop(f, T.rowIn, 16);
  const rowRect: Rect = { ...ROW, y: ROW.y + (1 - rowRise) * 700 };
  const prepRect: Rect = { ...PREP, y: PREP.y + (1 - rowRise) * 700 };
  const pressK = k(f, T.tap, T.tap + 4) * (1 - k(f, T.tap + 8, T.tap + 16));
  const rowOut = k(f, T.tap + 4, T.tap + 10);
  const openK = k(f, T.tap + 4, T.tap + 16, EASE_CAMERA); // the chat opens over the row, from the pill's side
  const chatOut = k(f, T.close, T.close + 16, EASE_CAMERA);
  const OPEN_FROM: Rect = { x: CHAT_CARD.x + CHAT_CARD.w * 0.12, y: CHAT_CARD.y + CHAT_CARD.h * 0.12, w: CHAT_CARD.w * 0.76, h: CHAT_CARD.h * 0.76 };
  const chatCard = mixRect(OPEN_FROM, CHAT_CARD, openK);
  const p3 = k(f, T.push3, T.push3 + 30, EASE_CAMERA);
  const chatView = mixRect(chatCard, TIP_VIEW, p3);
  // the conversation column only, from her question down, following the answer as it streams
  const follow = k(f, T.send + 24, T.done, EASE_CAMERA);
  const camTalk = fit({ x: 300, y: lerp(110, 780, follow), w: 760, h: 600 }, CHAT_CARD, { dpr: 2 });
  const tapAt = { x: PREP.x + PREP.w * 0.42, y: PREP.y + PREP.h * 0.56 };
  const ptrK = k(f, T.rowIn + 16, T.tap - 2, EASE_CAMERA);
  const tapPtr = { x: lerp(1560, tapAt.x, ptrK), y: lerp(980, tapAt.y, ptrK) };
  const tipCam = fit(TIP_LIT, TIP_VIEW, { pad: 1.08, dpr: 2 });
  const drift = 1 - 0.05 * k(f, T.push3 + 30, T.close, (x) => x); // the hold keeps creeping in
  const chatCam = mixCam(camTalk, { ...tipCam, cw: tipCam.cw * drift }, p3);
  const sparkAt = { x: rowRect.x, y: rowRect.y + rowRect.h / 2 };

  const SPARK_PT = { x: 960 + 265, y: 500 - 51 }; // the red spark over the logo's "i" (measured on the end frame, logo 560 wide at 960, 500)
  const endK = k(f, T.end, T.end + 12);
  const markIn = k(f, T.logo, T.logo + 12);
  const markOut = k(f, T.end - 6, T.end + 4);
  const markHide = 0;

  return (
    <AbsoluteFill style={{ background: GROUND, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(1400px 700px at 50% -15%, rgba(217,32,46,0.07), transparent 70%)" }} />

      {/* 1. the bucket: everyone's applications fall in, hers one of them */}
      {sink < 1 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(560 * sink * sink).toFixed(1)}px)`, opacity: 1 - sink }}>
          <div style={{ position: "absolute", left: BUCKET.x, top: BUCKET.y, width: BUCKET.w, height: BUCKET.h, borderRadius: 44, background: "#ece3dd",
            boxShadow: "inset 0 18px 40px rgba(90,40,40,.08)" }} />
          {DROPS.map((d, i) => {
            if (i === HERS) return f < T.lift ? <React.Fragment key={i}>{hersCard}</React.Fragment> : null;
            if (f < d.at) return null;
            const y = lerp(Math.max(190, d.y - 360), d.y, fall(d.at)) - settle(d.at) * 8;
            return <div key={i} style={{ position: "absolute", inset: 0, opacity: k(f, d.at, d.at + 4), transform: `rotate(${(d.r * (0.4 + 0.6 * fall(d.at))).toFixed(3)}deg)`, transformOrigin: `${d.x + PCARD.w / 2}px ${y + PCARD.h / 2}px` }}><AppCard rect={{ x: d.x, y, w: PCARD.w, h: PCARD.h }} chip={0} appliedAt={0} muted /></div>;
          })}
          <div style={{ position: "absolute", left: LIP.x, top: LIP.y, width: LIP.w, height: LIP.h, borderRadius: 30, background: "#e2d6cf",
            boxShadow: "0 -1px 0 rgba(255,255,255,.7) inset, 0 20px 50px rgba(90,40,40,.12)" }} />
        </div>
      )}

      {/* 2. the event card: pops in beside her application, then the frame, then the why line, then the press */}
      {f >= T.eventIn && ping < 1 && f < T.merge && (
        <div style={{ position: "absolute", left: evSmall.x - 40 * ping, top: evSmall.y - 40 * ping, width: evSmall.w + 80 * ping, height: evSmall.h + 80 * ping,
          borderRadius: 30 + 30 * ping, border: `3px solid ${RED}`, opacity: 0.6 * (1 - ping) }} />
      )}
      {f >= T.eventIn && f < T.flier + 19 && (
        <Shot src={FLOW} t={flowT} page={FLOW_PAGE} cam={evCam} view={evView} radius={30} opacity={evOpacity}>
          {(() => {
            const a = onCanvas(evCam, evView, FLOW_PAGE, WHY_CARD.x, WHY_CARD.y);
            const sc = scaleOf(evCam, evView, FLOW_PAGE);
            return (
              <div style={{ position: "absolute", left: a.x, top: a.y, transform: `scale(${sc.toFixed(4)})`, transformOrigin: "0 0" }}>
                <WhyCard under={k(f, T.under, T.under + 16) * (1 - k(f, T.pull1, T.pull1 + 10))} />
              </div>
            );
          })()}
          {ptrOn && evPtr && <PointerAt x={evPtr.x} y={evPtr.y} since={ptr.since} accent={RED} size={Math.round(22 * scaleOf(evCam, evView, FLOW_PAGE))} />}
        </Shot>
      )}

      {/* her application, lifted out of the pile, then the docked chip */}
      {f >= T.lift && appOut < 1 && hersCard}

      {/* the thread: application to visit, then to the why line */}
      <Thread d={thread1D} progress={t1} opacity={thread1Out} dot={f < T.merge} />
      {f < T.pull1 + 10 && <Node kind="career" x={appEdge.x} y={appEdge.y} at={T.node1} size={lerp(64, 40, mergeK)} out={T.pull1} />}
      {f < T.pull1 + 10 && <Node kind="events" x={threadTo.x} y={threadTo.y} at={T.node2} size={72} out={T.pull1} />}

      {/* 3. My Calendar, the press forward, the landing */}
      {f >= T.cal && f < T.chatLine + 38 && (
        <Shot src={FLOW} t={flowT} page={FLOW_PAGE} cam={calCam} view={calView} radius={30} opacity={1 - calOut}>
          {f >= T.land && (() => {
            // where it landed: a red ring that settles on the block, nothing else veiled
            const a = onCanvas(calCam, calView, FLOW_PAGE, BLOCK.x, BLOCK.y);
            const s = scaleOf(calCam, calView, FLOW_PAGE);
            const ring = k(f, T.land + 2, T.land + 16, EASE_CAMERA);
            const pad = 10 + 26 * (1 - ring);
            return <div style={{ position: "absolute", left: a.x - pad, top: a.y - pad, width: BLOCK.w * s + pad * 2, height: BLOCK.h * s + pad * 2, borderRadius: 14,
              border: `3px solid ${RED}`, opacity: ring * (1 - calOut) }} />;
          })()}
          {f < T.land && calPtr && <PointerAt x={calPtr.x} y={calPtr.y} since={ptr.since} accent={RED} size={30} />}
        </Shot>
      )}
      {flierOn && <Flier rect={flierRect} opacity={flierOpacity} squash={squash} />}
      {f >= T.land && f < T.chatLine + 8 && <Node kind="calendar" x={blockAt.x - 34} y={blockAt.y + blockAt.h / 2} at={T.land + 2} size={52} out={T.chatLine - 2} />}


      {/* 4. her brief row with main's prep pill, pressed; the chat grows out of the pill */}
      {f >= T.rowIn && rowOut < 1 && <PrepRow rect={rowRect} pill={prepRect} press={pressK} opacity={1 - rowOut} />}
      {f >= T.tap + 4 && f < T.close + 18 && (
        <div style={{ opacity: 1 - chatOut, position: "absolute", inset: 0 }}>
          <Shot src={CHAT} t={chatT} page={CHAT_PAGE} cam={chatCam} view={chatView} radius={30} opacity={k(f, T.tap + 6, T.tap + 12)}>
            {f >= T.tipUnder &&
              TIP_UNDER.map((u, i) => {
                const a = onCanvas(chatCam, chatView, CHAT_PAGE, u.x, u.y);
                const sc = scaleOf(chatCam, chatView, CHAT_PAGE);
                const d = k(f, T.tipUnder + i * 9, T.tipUnder + i * 9 + 10);
                return d <= 0 ? null : <div key={i} style={{ position: "absolute", left: a.x, top: a.y, height: 3 * sc, width: u.w * sc * d, background: RED, borderRadius: 3 }} />;
              })}
          </Shot>
        </div>
      )}
      {f >= T.rowIn + 10 && f < T.tap + 18 && <Node kind="campusai" x={sparkAt.x} y={sparkAt.y} at={T.rowIn + 14} out={T.tap + 2} />}
      {f >= T.rowIn + 12 && f < T.tap + 14 && <PointerAt x={tapPtr.x} y={tapPtr.y} since={f >= T.tap ? (f - T.tap) / FPS : null} accent={RED} size={58} opacity={k(f, T.rowIn + 12, T.rowIn + 18) * (1 - k(f, T.tap + 3, T.tap + 8))} />}

      {/* lines */}
      <Line ws={words("Your application is in the pile.", ["pile"])} at={0} stagger={2} out={T.stand - 8} x={HEAD.x} y={HEAD.y} size={HEAD.size} />
      <Line ws={words("How do you stand out?", ["out"])} at={T.stand} out={T.eventIn - 6} x={HEAD.x} y={HEAD.y} size={HEAD.size} />
      <Line ws={words("CampusAI tells you they're coming to campus.", ["campus"])} at={T.eventIn} out={T.pull1 - 4} x={HEAD.x} y={HEAD.y} size={HEAD.size} stagger={2} />
      <Line ws={words("Add it in one press.", ["one"])} at={T.pull1 + 6} out={T.next - 8} x={HEAD.x} y={HEAD.y} size={HEAD.size} />
      <Line ws={words("It lands on Tuesday.", ["Tuesday"])} at={T.next} out={T.chatLine - 4} x={HEAD.x} y={HEAD.y} size={HEAD.size} />
      <Line ws={words("Then it gets you ready.", ["ready"])} at={T.chatLine + 2} out={T.push3 - 4} x={HEAD.x} y={HEAD.y} size={HEAD.size} />
      <Line ws={words("Walk in ready.", ["ready"])} at={T.recap + 4} out={T.converge - 8} x={W / 2} y={420} size={110} />

      {/* pills: the button's own new label, then when it is */}
      <Pill at={T.when} out={T.chatLine - 4} icon="calendar">Tue, Nov 10, 6 PM<span style={{ color: SOFT, fontWeight: 500 }}>&nbsp;&nbsp;In 5 days</span></Pill>

      {/* the logo: a small mark from the first second, then the end card */}
      {f < T.end + 4 && <Logo x={MARK.x} y={MARK.y} w={MARK.w} opacity={markIn * (1 - markOut) * (1 - markHide)} blur={(1 - markIn) * 10} />}
      {f >= T.end - 4 && (
        <>
          <Logo x={W / 2} y={500} w={560 * (1 + interpolate(f, [T.bloom, FRAMES], [0, 0.015], clamp))} opacity={endK} />
          {f >= T.bloom && (() => {
            // a small bloom on the spark as the logo settles
            const b = k(f, T.bloom, T.bloom + 18);
            return <div style={{ position: "absolute", left: SPARK_PT.x - 70 * b, top: SPARK_PT.y - 70 * b, width: 140 * b, height: 140 * b, borderRadius: "50%",
              border: `3px solid ${RED}`, opacity: 0.55 * (1 - b) }} />;
          })()}
          <div style={{ position: "absolute", left: 0, right: 0, top: 500 + 140, textAlign: "center", fontFamily: INTER, fontWeight: 600, fontSize: 42, color: INK,
            opacity: k(f, T.bloom + 4, T.bloom + 18), letterSpacing: "-0.01em" }}>campusai.app</div>
        </>
      )}

      {/* sound: House Vibez entered on a beat; every cue below sits on one */}
      <Audio src={aud("house-vibez.mp3")} trimBefore={120} volume={(fr) => 0.5 * Math.min(1, fr / 6) * Math.min(1, Math.max(0, (FRAMES - fr) / 40))} />
      {(
        [
          ...DROPS.filter((_, i) => i !== HERS && i % 3 === 0).map((d) => [d.at + 14, "switch-tap.mp3", 0.18] as [number, string, number]),
          [DROPS[HERS].at + 14, "ui-select-click.mp3", 0.6],
          [T.lift, "swoosh-quick.mp3", 0.4],
          [T.eventIn, "pop-electric.mp3", 0.45],
          [T.thread1, "air-woosh-quick.mp3", 0.35],
          [T.node2, "switch-tap.mp3", 0.5],
          [T.push1, "air-woosh-quick.mp3", 0.35],
          [T.under, "switch-tap.mp3", 0.35],
          [T.press, "ui-select-click.mp3", 0.75],
          [T.pill, "ui-success-soft.mp3", 0.4],
          [T.flier, "swoosh-quick.mp3", 0.35],
          [T.next, "ui-select-click.mp3", 0.5],
          [T.fly, "air-woosh-quick.mp3", 0.45],
          [T.land, "ui-confirm-tone.mp3", 0.55],
          [T.rowIn, "swoosh-quick.mp3", 0.3],
          [T.tap, "ui-select-click.mp3", 0.7],
          [T.send, "ui-message-pop.mp3", 0.6],
          [T.tipUnder, "switch-tap.mp3", 0.35],
          [T.push3, "air-woosh-quick.mp3", 0.4],
          [T.recap + 4, "switch-tap.mp3", 0.35],
          [T.bloom, "shimmer-sparkle-sweep.mp3", 0.45],
        ] as [number, string, number][]
      ).map(([at, src, v], i) => (
        <Sequence key={i} from={at} layout="none">
          <Audio src={aud(src)} volume={() => v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const InfoSessionRoot: React.FC = () => (
  <Composition id="InfoSession-16x9" component={InfoSession} durationInFrames={FRAMES} fps={FPS} width={W} height={H} />
);
