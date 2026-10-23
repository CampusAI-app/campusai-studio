/**
 * CampusAI launch film, "the morning" (2026-10-19), 4:5. Story is Jacob's.
 *
 * Round 4, his calls: a more fun start with the CampusAI logo in it; "It's hard to know what actually
 * matters" is no longer its own beat; the laptop never rises from the bottom; things go from every
 * direction "into campus", not row by row into the brief; smaller headlines that never sit on the
 * product; and the ending is real: press Add to CampusAI Calendar, then My Calendar, and it is there.
 *
 * 1. Overwhelm: app tiles burst out of the middle with climbing badges while notifications pile up
 *    (assignment, assignment, a moved test, three homeworks, the job board, your network, the club
 *    meeting reminder that gets buried). Everything from every app floods in, and the line arrives
 *    OVER the chaos. Then it all flies in from every side into the CampusAI app icon.
 * 2. Round 5: the icon turns away and a shut laptop, wordmark on its lid, turns in (the gallery's
 *    "MacBook template"); the lid opens on a still deck, the screen wakes on today's dashboard.
 * 3. One LIVE run of the real demo, recorded today (capture/morning-run.cjs through morning-proxy):
 *    the question typed into Ask CampusAI, the real answer, the career fair's card, Add to CampusAI
 *    Calendar, My Calendar (Canvas connected, assignments showing), "Find time to study for Quiz 2",
 *    and the study block added. Round 5 retimed it tighter and dropped the sidebar tour.
 *    The drawn hand follows the recorded cursor (src/lib/morning-take.json).
 * 4. End card.
 *
 * App tiles are INVENTED (colour + glyph + a generic name), never a real app's name or logo.
 * Type: Zodiak with italic red accents (Jacob's pick, 2026-10-16); Inter only in UI. Faces are not
 * used in this cut.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Atmosphere } from "./components/Atmosphere";
import { getTheme } from "./theme";
import { EASE, EASE_CAMERA, keyframes } from "./lib/anim";
import take from "./lib/morning-take.json";
import {
  App, AppNotice, BlurLines, Hand, HandAt, Icon, INTER, Ink, Laptop3D, LaptopCam, RiseBars, ZODIAK, pop, ramp, useZodiak,
} from "./kit/parts";

export const MORNING_FPS = 30;
const T = getTheme("campusaiProduct");
const RED = T.accent;
const INK: Ink = { ink: "#ffffff", soft: "rgba(255,255,255,.55)", accent: RED, surface: "#141114", line: "rgba(255,255,255,.08)" };
const W = 1080;
const H = 1350;
const CX = W / 2;
const CY = 640;
const HEAD = 78; // headline size: two lines fit the top band and never reach the product

/* ---------------------------------------------------------- the apps */

const APPS: Record<string, App> = {
  courses: { name: "Courses", tile: "linear-gradient(160deg,#FF7A45,#E2461E)", glyph: "book" },
  mail: { name: "Mail", tile: "linear-gradient(160deg,#4DA3FF,#1F6FE5)", glyph: "mail" },
  jobs: { name: "Jobs", tile: "linear-gradient(160deg,#8B6CFF,#5B3DE0)", glyph: "briefcase" },
  network: { name: "Network", tile: "linear-gradient(160deg,#2EC4C4,#108A9A)", glyph: "users" },
  calendar: { name: "Calendar", tile: "linear-gradient(160deg,#FFFFFF,#E9E6E6)", glyph: "calendar", glyphColor: "#E5484D" },
  chat: { name: "Group chat", tile: "linear-gradient(160deg,#4CD97B,#1FA855)", glyph: "chat" },
};
type AppKey = keyof typeof APPS;

/* ------------------------------------------------------ 1. overwhelm */

type Ping = { app: AppKey; title: string; body?: string; at: number };
const PINGS: Ping[] = [
  { app: "courses", title: "New assignment", body: "BMGT343 · Problem set 3: bond pricing", at: 14 },
  { app: "courses", title: "Due Tuesday", body: "BMGT364 · Reading: Ch. 6-7", at: 28 },
  { app: "mail", title: "Quiz 4 moved to Friday", body: "BMGT364 · from your professor", at: 42 },
  { app: "courses", title: "3 homeworks due this week", body: "PSYC417 · Problem sets 4 to 6", at: 56 },
  { app: "jobs", title: "New role matches your search", body: "Evercore · IB Summer Analyst 2027", at: 72 },
  { app: "network", title: "Deloitte is hosting a coffee chat", body: "Monday, 3:00 PM", at: 86 },
  { app: "calendar", title: "General meeting in 10 min", body: "Finance Association · Van Munching 1330", at: 98 },
  { app: "chat", title: "Club soccer", body: "23 new messages", at: 106 },
  { app: "mail", title: "Advising appointments are open", body: "Smith Undergraduate Office", at: 112 },
];

/** The app tiles: they burst out of the middle to their spots, then their badges keep climbing. */
const ORBIT: { app: AppKey; x: number; y: number; bubble: string; at: number; from: number; to: number }[] = [
  { app: "courses", x: 170, y: 190, bubble: "Due tonight", at: 2, from: 3, to: 14 },
  { app: "mail", x: 900, y: 170, bubble: "Quiz moved", at: 5, from: 2, to: 37 },
  { app: "jobs", x: 1000, y: 610, bubble: "New match", at: 8, from: 1, to: 12 },
  { app: "network", x: 890, y: 1150, bubble: "9 searches", at: 11, from: 5, to: 28 },
  { app: "calendar", x: 190, y: 1160, bubble: "In 10 min", at: 14, from: 1, to: 6 },
  { app: "chat", x: 80, y: 640, bubble: "23 new", at: 17, from: 23, to: 99 },
];

const Orbit: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {ORBIT.map((o, i) => {
        if (f < o.at) return null;
        const s = pop(f, o.at, fps, 10);
        const fly = ramp(f, o.at, o.at + 16, Easing.out(Easing.back(1.6)));
        const b = pop(f, o.at + 18 + i * 6, fps, 14);
        const n = Math.round(interpolate(f, [o.at + 20, 200], [o.from, o.to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) }));
        const bump = pop(f, o.at + 20 + Math.floor((f - o.at) / 9) * 9, fps, 9);
        const x = interpolate(fly, [0, 1], [CX, o.x]) + Math.sin((f + i * 40) / 30) * 7;
        const y = interpolate(fly, [0, 1], [CY, o.y]) + Math.cos((f + i * 55) / 37) * 9;
        const right = o.x > W / 2;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s}) rotate(${(1 - fly) * (right ? 40 : -40)}deg)`, zIndex: 400 }}>
            <div style={{ width: 120, height: 120, borderRadius: 30, background: APPS[o.app].tile, display: "grid", placeItems: "center",
              boxShadow: "0 24px 50px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.3)" }}>
              <Icon name={APPS[o.app].glyph} size={60} color={APPS[o.app].glyphColor ?? "#fff"} stroke={2.1} />
            </div>
            {f >= o.at + 20 ? (
              <div style={{ position: "absolute", right: -16, top: -16, minWidth: 54, height: 54, padding: "0 14px", borderRadius: 27, background: "#E5484D",
                color: "#fff", fontFamily: INTER, fontWeight: 700, fontSize: 28, display: "grid", placeItems: "center", border: "4px solid #0b0708",
                transform: `scale(${0.85 + 0.15 * bump})` }}>
                {n > 99 ? "99+" : n}
              </div>
            ) : null}
            <div style={{ position: "absolute", top: 128, [right ? "right" : "left"]: -10, transform: `scale(${b})`,
              transformOrigin: right ? "100% 0" : "0 0", whiteSpace: "nowrap", fontFamily: INTER, fontWeight: 600, fontSize: 26, color: "#121214",
              background: "#fff", padding: "8px 16px", borderRadius: 16, boxShadow: "0 10px 26px rgba(0,0,0,.4)" }}>{o.bubble}</div>
          </div>
        );
      })}
    </>
  );
};

/** Newest on top in the middle; older ones slide down and, past four, fold into the pile behind. */
const Stack: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const GAP = 148;
  return (
    <>
      {PINGS.map((p, i) => {
        if (f < p.at) return null;
        const s = pop(f, p.at, fps, 13);
        const depth = PINGS.slice(i + 1).reduce((acc, q) => acc + ramp(f, q.at, q.at + 9, EASE), 0);
        const open = Math.min(depth, 3);
        const folded = Math.max(0, depth - 3);
        const y = 330 + open * GAP + Math.min(folded, 3) * 16;
        const sc = (0.9 + 0.1 * s) * (1 - Math.min(folded, 3) * 0.05);
        return (
          <div key={i} style={{ position: "absolute", left: 180, top: y, zIndex: 200 - Math.round(depth * 10),
            opacity: Math.min(1, s * 1.5) * (folded > 3 ? 0 : 1 - folded * 0.22),
            transform: `translateY(${(1 - s) * -70}px) scale(${sc})`, transformOrigin: "50% 0%" }}>
            <AppNotice app={APPS[p.app]} title={p.title} body={p.body} w={720} />
          </div>
        );
      })}
    </>
  );
};

const FLOOD_MSGS: { app: AppKey; title: string; body: string }[] = [
  { app: "courses", title: "Grade posted", body: "BMGT343 · Problem set 2" },
  { app: "mail", title: "Room change for Thursday", body: "BMGT495 · now in VMH 1212" },
  { app: "chat", title: "3rd floor", body: "who's going tonight??" },
  { app: "jobs", title: "Applications close Friday", body: "Capital One · Finance Summer Analyst" },
  { app: "network", title: "You appeared in 9 searches", body: "This week" },
  { app: "calendar", title: "Office hours moved", body: "BMGT364 · now 3:30 PM" },
  { app: "courses", title: "New announcement", body: "PSYC417 · Lab 6 is posted" },
  { app: "chat", title: "BMGT380 group project", body: "did anyone start the reading" },
  { app: "mail", title: "Spring registration opens", body: "Your time: Nov 9, 8:00 AM" },
  { app: "jobs", title: "3 new roles for you", body: "Investment banking · New York" },
  { app: "network", title: "Priya Menon viewed your profile", body: "VP, Finance Association" },
  { app: "calendar", title: "Career fair this week", body: "The Hotel at UMD · Grand Ballroom" },
];
const N_FLOOD = 22;
const FLOOD = [...Array(N_FLOOD)].map((_, i) => ({
  ...FLOOD_MSGS[i % FLOOD_MSGS.length],
  at: 118 + 72 * Math.pow(i / N_FLOOD, 0.55),
  x: 20 + random(`fx${i}`) * 520,
  y: 60 + random(`fy${i}`) * 1180,
  z: 0.62 + random(`fz${i}`) * 0.42,
  rot: (random(`fr${i}`) - 0.5) * 7,
})).sort((a, b) => a.z - b.z);

const Flood: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {FLOOD.map((b, i) => {
        if (f < b.at) return null;
        const s = pop(f, b.at, fps, 12);
        const blur = Math.max(0, (0.84 - b.z) * 22);
        return (
          <div key={i} style={{ position: "absolute", left: b.x, top: b.y, zIndex: 250 + Math.round(b.z * 100), transformOrigin: "0 0",
            transform: `scale(${b.z * (0.6 + 0.4 * s)}) rotate(${b.rot}deg)`, opacity: Math.min(1, s * 1.6),
            filter: blur > 0.5 ? `blur(${blur}px) brightness(${0.55 + b.z * 0.45})` : undefined }}>
            <AppNotice app={APPS[b.app]} title={b.title} body={b.body} w={620} />
          </div>
        );
      })}
    </>
  );
};

const LINE_AT = 134;
const INTO = 200; // everything starts flying into the CampusAI icon
export const OVERWHELM_FRAMES = 262;

const Overwhelm: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const live = Math.min(f, INTO);
  const shake = f < INTO ? ramp(f, 150, 196) * 6 : 0;
  // Into campus: every item travels from wherever it is to the icon in the middle, and is gone.
  const c = ramp(f, INTO, INTO + 20, Easing.in(Easing.cubic));
  const icon = pop(f, INTO - 6, fps, 12);
  const gulp = interpolate(f, [INTO + 18, INTO + 22, INTO + 32], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ring = ramp(f, INTO + 20, INTO + 40, Easing.out(Easing.cubic));
  // Then the icon turns away edge-on as the shut laptop, wordmark on its lid, turns in behind it.
  const away = ramp(f, OVERWHELM_FRAMES - 24, OVERWHELM_FRAMES - 6, Easing.in(Easing.cubic));
  const lineOut = ramp(f, INTO - 4, INTO + 8);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${Math.sin(live * 2.3) * shake}px, ${Math.cos(live * 1.9) * shake}px) scale(${1 - c})`,
        transformOrigin: `${CX}px ${CY}px`, opacity: 1 - c * 0.6, filter: c ? `blur(${c * 6}px)` : undefined }}>
        <Stack />
        <Flood />
        <Orbit />
      </AbsoluteFill>
      {/* the line, over the chaos rather than after it, on a soft pool so it reads */}
      {f >= LINE_AT ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", zIndex: 600, opacity: 1 - lineOut }}>
          <div style={{ position: "absolute", left: -100, right: -100, top: CY - 330, height: 560, borderRadius: "50%", opacity: ramp(f, LINE_AT, LINE_AT + 10),
            background: "radial-gradient(closest-side, rgba(7,5,6,.92), rgba(7,5,6,.75) 55%, rgba(7,5,6,0))" }} />
          <div style={{ marginTop: CY * 2 - H }}>
            <BlurLines at={LINE_AT + 2} size={104} ink={INK} face={ZODIAK} lines={[{ text: "It's hard to know" }, { text: "what actually matters.", accent: true }]} />
          </div>
        </AbsoluteFill>
      ) : null}
      {f >= INTO - 6 ? (
        <div style={{ position: "absolute", left: CX, top: CY, zIndex: 700, transform: `translate(-50%,-50%) scale(${(icon + gulp * 0.12) * (1 - away * 0.45)}) rotateY(${away * 90}deg)`, opacity: 1 - away }}>
          <div style={{ position: "absolute", left: 130, top: 130, width: 260 * ring + 20, height: 260 * ring + 20, transform: "translate(-50%,-50%)",
            borderRadius: 80, border: `3px solid rgba(217,32,46,${0.8 * (1 - ring)})` }} />
          <div style={{ width: 260, height: 260, borderRadius: 62, overflow: "hidden", boxShadow: `0 30px 100px rgba(217,32,46,${0.35 + gulp * 0.3})` }}>
            <Img src={staticFile("kit/app-icon.png")} style={{ width: "100%", height: "100%", display: "block" }} />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* -------------------------------------------------- 2-3. the laptop */

// The live run (public/morning/chat30, already retimed to 30fps by the capture step). Its key
// moments, in frames of the take: question sent, answer done, card open, added, and each page.
const TAKE = take as { n: number; keys: Record<string, number>; hand: ({ x: number; y: number; since: number | null } | null)[] };
const K = TAKE.keys;

const SPUN = 24; // the shut laptop has turned in
const OPEN = 60; // its lid is open and the screen awake
const PRESS = 138; // the hand presses Ask CampusAI
const REC0 = 144; // and the live run starts
const REC1 = REC0 + TAKE.n;
export const LAPTOP_FRAMES = REC1 + 10;

const recFrame = (k: number) => staticFile(`morning/chat30/${String(Math.max(0, Math.min(TAKE.n - 1, k))).padStart(4, "0")}.jpg`);
const fill = { position: "absolute", inset: 0, width: "100%", height: "100%" } as const;

const Screen: React.FC = () => {
  const f = useCurrentFrame();
  const k = f - REC0;
  const h = k >= 0 && k < TAKE.n ? TAKE.hand[k] : null;
  const firstSeen = TAKE.hand.findIndex((x) => x);
  return (
    <>
      {/* before the run, its own first frame, so nothing changes on screen when it starts */}
      <Img src={recFrame(Math.max(0, k))} style={fill} />
      {f >= PRESS - 26 && f < REC0 + 24 ? <Hand from={[900, 1100]} to={[560, 642]} at={PRESS - 26} tapAt={PRESS} leaveAt={REC0 + 4} size={150} /> : null}
      {/* for the Add press only, the fingertip sits at the button's left edge so its label stays readable as it flips */}
      {h ? <HandAt x={h.x - 80 * ramp(k, K.added - 34, K.added - 22) * (1 - ramp(k, K.added + 30, K.added + 44))} y={h.y} since={h.since}
        opacity={ramp(k, firstSeen, firstSeen + 6)} /> : null}
    </>
  );
};

const LaptopShot: React.FC = () => {
  const f = useCurrentFrame();
  const kf = (pts: [number, number][]) => keyframes(f, pts.map(([at, value]) => ({ at, value })), EASE_CAMERA);
  const r = (key: string, d = 0) => REC0 + K[key] + d;
  const hand = (i: number) => TAKE.hand.slice(K[["cardOpen", "added", "calendar", "studyAsk", "studyAdded"][i]]).find((h) => h) ?? { x: 720, y: 450 };
  const slot = hand(4);
  // The MacBook-template entrance: shut, it turns in on its hinge; the lid opens on a still deck and the
  // screen wakes; it settles at three-quarters seen from above. Then it turns to face you for the live run.
  const lid = keyframes(f, [{ at: SPUN, value: 0 }, { at: OPEN, value: 100 }], Easing.inOut(Easing.cubic));
  const hinge = 1 - ramp(f, OPEN + 40, PRESS - 14, EASE_CAMERA); // 1 while the pivot is the hinge
  const cam: LaptopCam = {
    x: kf([[0, CX], [PRESS - 14, CX], [r("calendar", 6), CX], [REC1, CX]]),
    y: kf([[0, 760], [SPUN, 780], [OPEN, 840], [OPEN + 40, 860], [PRESS - 14, 900], [r("done"), 880], [r("cardOpen", -14), 900], [r("cardOpen", 10), 930], [r("added", 20), 930],
      [r("calendar", 6), 800], [r("studyAnswer", -8), 800], [r("studyAnswer", 14), 880], [r("studyAdded", 10), 880], [REC1, 820]]),
    s: kf([[0, 0.34], [SPUN, 0.44], [OPEN, 0.5], [OPEN + 40, 0.54], [PRESS - 14, 1.0], [r("done"), 1.0], [r("cardOpen", -14), 1.0], [r("cardOpen", 10), 1.3],
      [r("added", 20), 1.3], [r("calendar", 6), 0.74], [r("studyAnswer", -8), 0.74], [r("studyAnswer", 14), 1.2], [r("studyAdded", 10), 1.2], [REC1, 0.8]]),
    ax: kf([[0, -42], [SPUN, -38], [OPEN, -24], [OPEN + 40, -20], [PRESS - 14, 0], [REC1, 0]]) + (lid - 100), // negative: looking down on it
    ay: kf([[0, -48], [SPUN, -22], [OPEN, -24], [OPEN + 40, -16], [PRESS - 14, 0], [REC1, 0]]),
    px: interpolate(hinge, [0, 1], [kf([[PRESS - 14, 640], [r("done"), 700], [r("cardOpen", -14), 700], [r("cardOpen", 10), 440], [r("added", 20), 440],
      [r("calendar", 6), 720], [r("studyAnswer", -8), 720], [r("studyAnswer", 14), slot.x - 120], [r("studyAdded", 10), slot.x - 120], [REC1, 640]]), 720]),
    py: interpolate(hinge, [0, 1], [kf([[PRESS - 14, 560], [r("done"), 520], [r("cardOpen", -14), 520], [r("cardOpen", 10), 560], [r("added", 20), 560],
      [r("calendar", 6), 450], [r("studyAnswer", -8), 450], [r("studyAnswer", 14), slot.y + 120], [r("studyAdded", 10), slot.y + 120], [REC1, 500]]), 930]),
  };
  const lines = [
    { from: OPEN - 6, to: PRESS - 16, l: [{ text: "Your whole day," }, { text: "in one place.", accent: true }] },
    { from: PRESS - 8, to: r("cardOpen", -22), l: [{ text: "Ask what's" }, { text: "going on.", accent: true }] },
    { from: r("cardOpen", -8), to: r("calendar", -6), l: [{ text: "Add it" }, { text: "in one tap.", accent: true }] },
    { from: r("calendar", 4), to: r("studyAdded", 4), l: [{ text: "Find time" }, { text: "to study.", accent: true }] },
    { from: r("studyAdded", 10), to: LAPTOP_FRAMES, l: [{ text: "This is where" }, { text: "you find everything.", accent: true }] },
  ];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: -200, right: -200, top: cam.y - 420, height: 900, borderRadius: "50%",
        background: "radial-gradient(closest-side, rgba(217,32,46,.26), rgba(217,32,46,0) 72%)", opacity: ramp(f, 10, 50) }} />
      <Laptop3D cam={cam} lid={lid} perspective={4200} screen={<Screen />} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 380, opacity: ramp(f, OPEN - 10, OPEN + 6),
        background: "linear-gradient(180deg, rgba(8,5,6,.97) 0%, rgba(8,5,6,.9) 60%, rgba(8,5,6,0) 100%)" }} />
      {lines.map((x, i) => (
        <div key={i} style={{ position: "absolute", top: 104, width: "100%", opacity: ramp(f, x.from, x.from + 6) * (1 - ramp(f, x.to - 8, x.to)) }}>
          {f >= x.from && f < x.to ? <BlurLines at={x.from} size={HEAD} ink={INK} face={ZODIAK} lines={x.l} /> : null}
        </div>
      ))}
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------- 4. end card */

const End: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <RiseBars at={8} color={RED} height={420} />
      <div style={{ marginTop: 300, width: 240, height: 240, borderRadius: 56, overflow: "hidden", transform: `scale(${pop(f, 4, fps, 14)})`,
        boxShadow: "0 30px 90px rgba(217,32,46,.3)" }}>
        <Img src={staticFile("kit/app-icon.png")} style={{ width: "100%", height: "100%" }} />
      </div>
      <div style={{ marginTop: 60 }}>
        <BlurLines at={14} size={92} ink={INK} face={ZODIAK} lines={[{ text: "Your student" }, { text: "operating system", accent: true }]} />
      </div>
      <div style={{ marginTop: 34, fontFamily: ZODIAK.family, fontWeight: 700, fontSize: 40, color: INK.soft, opacity: ramp(f, 34, 46) }}>Link in bio.</div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ the edit */

const SHOTS: { C: React.FC; dur: number; overlap: number; fadeIn: boolean; fadeOut: boolean }[] = [
  { C: Overwhelm, dur: OVERWHELM_FRAMES, overlap: 0, fadeIn: true, fadeOut: false },
  // Starts as the icon turns away, so the shut laptop turns in where the icon was.
  { C: LaptopShot, dur: LAPTOP_FRAMES, overlap: 16, fadeIn: true, fadeOut: true },
  { C: End, dur: 100, overlap: 8, fadeIn: true, fadeOut: false },
];
const START = SHOTS.reduce<number[]>((a, s, i) => [...a, i === 0 ? 0 : a[i - 1] + SHOTS[i - 1].dur - s.overlap], []);
export const MORNING_FRAMES = START[START.length - 1] + SHOTS[SHOTS.length - 1].dur;

const Fade: React.FC<{ dur: number; fadeIn: boolean; fadeOut: boolean; children: React.ReactNode }> = ({ dur, fadeIn, fadeOut, children }) => {
  const f = useCurrentFrame();
  const op = (fadeIn ? ramp(f, 0, 10) : 1) * (fadeOut ? 1 - ramp(f, dur - 12, dur) : 1);
  return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};

export const MorningFilm: React.FC = () => {
  useZodiak();
  return (
    <AbsoluteFill style={{ background: T.bg }}>
      <Atmosphere theme={T} totalFrames={MORNING_FRAMES} />
      {/* the laptop is drawn first so the icon dive sits on top of it during the overlap */}
      {[1, 0, 2].map((i) => {
        const s = SHOTS[i];
        return (
          <Sequence key={i} from={START[i]} durationInFrames={s.dur}>
            <Fade dur={s.dur} fadeIn={s.fadeIn} fadeOut={s.fadeOut}><s.C /></Fade>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const MORNING_SIZE = { width: W, height: H };
