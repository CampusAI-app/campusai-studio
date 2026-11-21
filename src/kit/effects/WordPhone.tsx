/**
 * Word phone (2026-11-20, from DrillUp's "I turned a song into an iPhone" reel, instagram.com/reel/Df60v8ChJhT, Muse
 * Nov 20; Jacob: "I love how this looks for motion graphics. Def should do something like this"). Read frame by frame
 * at 0.2 s and 0.1 s round each hand-off; the maker's method is comment-gated and was never seen, so this is our build.
 *
 * The idea: the words of the piece are never captions. They are the phone's own text, landing as they are said or sung:
 * a search field typing, the keyboard's suggestion bar, notification titles and bodies, a "N more from" pill counting
 * up, the Dynamic Island's banner, a black pill that grows into an alert card whose button carries the last words.
 *
 * What the reel does, in numbers (13 s, 30 fps, laptop-screen crop):
 *   0.0 to 0.2  a tiny phone (about 5% of frame height, rolled -30 deg) whip-zooms to an extreme close-up, heavy
 *               vertical motion blur on the move.
 *   0.4 to 1.2  close-up in 3D (yaw about 35 deg, roll about 25 deg), shallow depth of field, the camera drifting
 *               across the keys while each press lands.
 *   1.2 to 1.4  whip back to straight-on at about 1.6x on the typed line; 1.6 to 1.9 pull back to the full screen
 *               with motion blur; hold 0.2 s.
 *   2.1 to 2.4  push into one button, which irises open into the next screen.
 *   4.0 to 4.2  one element (a pill) lifts out at 1.3x and rides over a vertical whip-pan into the next screen,
 *               where it shrinks into its place: the carrier.
 *   4.2 to 6.2  the camera creeps right at about 1.3x while a notification body types word by word and the
 *               "N more" pill ticks up one per beat.
 *   6.4 to 7.0  fast pull-back (about 1.6x to 0.55x) to the whole phone tilted in 3D; the Dynamic Island grows into
 *               a call banner (about 0.25 s); 7.2 to 8.4 the camera pushes back in on the island as the phone flattens.
 *   9.0 to 9.4  vertical whip with blur to the next screen.
 *  10.4 to 12.2 the screen collapses into a small black pill on a blurred keypad (about 12 px blur), the pill types
 *               word by word (about 0.25 s a word), then morphs into a white alert card whose green button fills
 *               word by word.
 *  12.6 to 13.0 the button drops into place with motion blur and the reel settles where it began, for the loop.
 * Every hand-off lands on the beat. Entrances ease out hard (0.16, 1, 0.3, 1); exits speed up.
 *
 * Ours: the phone is drawn (an iPhone-shaped device in CSS, Inter for the system face), never a screenshot, and it is
 * the speaker's or student's phone, not the product: CampusAI is web-only until the app ships (rules/campusai.md,
 * 11/06), so a film hands off from this phone to a real capture. Scenes come in a list; every scene's words are
 * `Spoken` (word timings in film seconds, the captions.json shape), so the same part takes any line.
 * The camera is one list of keys (film seconds); motion blur (centred on the true frame) switches on by itself whenever
 * the camera moves fast.
 *
 *   <WordPhone
 *     scenes={[
 *       { kind: "search", from: 0, query: words.slice(9, 13), suggest: words.slice(0, 9), emptyAt: 2.9 },
 *       { kind: "lock", from: 3.0, time: "11:42", date: "Thursday, November 20", focus: "Recruiting",
 *         notes: [{ app: "Mail", title: [...], body: [...], at: 3.08 }], more: { app: "Mail", steps: [[3.6, 2], [4.2, 3]] },
 *         island: { at: 6.0, top: [...], main: [...] } },
 *       { kind: "alert", from: 7.8, pill: [...], morphAt: 9.24, title: [...], button: [...], pressAt: 11.1 },
 *     ]}
 *     camera={[{ t: 0, s: 0.06, rz: -30 }, { t: 0.25, s: 2.6, x: -60, y: 300, ry: 32, rz: 20, dof: 6 }, ...]}
 *   />
 *
 * `wordPhoneEvents(props, fps)` lists the sound events (a key per typed word, a notification per card, a land per
 * island and alert, a press, a move per fast camera key) for the film to score with the studio's cues.
 */
import React from "react";
import { AbsoluteFill, Easing, Freeze, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { INTER } from "../parts";
import { IN, OUT, SWING, clampX } from "./shared";
import type { CaptionWord } from "./CommentDrop";

/** Words with their film-second timings, or a plain string that is simply there. */
export type Spoken = CaptionWord[] | string;

export type PhoneNote = {
  /** The app line ("MAIL" is drawn as the app's own small caps, here sentence case: "Mail"). */
  app: string;
  /** The app icon: a colour and one glyph. */
  icon?: { bg: string; glyph: React.ReactNode; ink?: string };
  title: Spoken;
  body?: Spoken;
  /** Film second the card lands. */
  at: number;
  age?: string;
};

export type PhoneIsland = {
  /** Film second the island grows into its banner. */
  at: number;
  /** Small grey line, then the big line. */
  top: Spoken;
  main: Spoken;
  initials?: string;
  /** Film second it shrinks back, if it does. */
  out?: number;
  /** Show the red and green call buttons. Default true. */
  buttons?: boolean;
};

type SceneBase = {
  /** Film second the scene takes the screen (it holds until the next scene's `from`). */
  from: number;
  /** How it arrives: a quick dissolve under the camera's blur (default), a slide up from the bottom, or an iris
   *  opening from a point on the screen (screen px from the centre). */
  enter?: "dissolve" | "slide" | { iris: { x: number; y: number; color?: string } };
  island?: PhoneIsland;
};

export type SearchScene = SceneBase & {
  kind: "search";
  /** The big title over the list. Default "Contacts". */
  title?: string;
  /** Rows shown before the search. */
  rows?: string[];
  /** Typed letter by letter across each word's own duration. */
  query: Spoken;
  /** Words shown one at a time in the keyboard's suggestion bar (middle slot) before and while typing. */
  suggest?: CaptionWord[];
  /** Film second the empty result lands ("No Results"). */
  emptyAt?: number;
};

export type LockScene = SceneBase & {
  kind: "lock";
  time: string;
  date: string;
  focus?: string;
  notes: PhoneNote[];
  /** The "N more from <app>" pill under the stack, stepping at film seconds: [[second, n], ...]. */
  more?: { app: string; steps: [number, number][] };
  /** CSS background of the wallpaper. */
  wallpaper?: string;
  /** Where the notification stack starts, screen px from the top. Default 470. */
  notesTop?: number;
};

export type AlertScene = SceneBase & {
  kind: "alert";
  /** The black pill's words, typed word by word. */
  pill: Spoken;
  /** Film second the pill grows into the white card. */
  morphAt: number;
  title?: Spoken;
  body?: Spoken;
  button: Spoken;
  buttonColor?: string;
  /** Film second the button is pressed. */
  pressAt?: number;
};

export type DialerScene = SceneBase & {
  kind: "dialer";
  /** Digits as spoken words (each word's digits land on it). */
  number: Spoken;
  name?: Spoken;
  sub?: string;
};

export type PhoneScene = SearchScene | LockScene | AlertScene | DialerScene;

export type PhoneCam = {
  /** Film second. */
  t: number;
  /** Scale of the whole phone (1 = the phone fills about 77% of the frame height). */
  s?: number;
  /** The point of the screen held at the frame's anchor, in screen px from the screen's centre (screen is 390 x 844). */
  x?: number;
  y?: number;
  /** Rotations in degrees: tip back (rx), turn (ry), roll (rz). */
  rx?: number;
  ry?: number;
  rz?: number;
  /** Depth of field: px of blur outside a soft circle round the held point. 0 is all sharp. */
  dof?: number;
  /** Easing INTO this key: "swing" (default, ease in and out), "whip" (gathers speed in two frames, lands hard), "out"
   *  (lands hard from full speed), "in" (speeds away), "linear". */
  ease?: "swing" | "whip" | "out" | "in" | "linear";
};

export type WordPhoneProps = {
  scenes: PhoneScene[];
  camera: PhoneCam[];
  /** The frame's ground behind the phone. */
  ground?: string;
  /** Where the held point sits, in frame px from the frame's centre. Default { x: 0, y: 70 }. */
  anchor?: { x: number; y: number };
  /** Status-bar clock. */
  clock?: string;
  /** Motion blur: the fewest samples when the camera moves fast (faster moves take up to 29). 0 turns it off. Default 9. */
  blur?: number;
  /** Hide everything after this film second (the film's own hand-off takes over). */
  until?: number;
};

// ── geometry ────────────────────────────────────────────────────────────────────────────────────────────────────────
const SW = 390;
const SH = 844;
const BEZEL = 13;
const RADIUS = 60;
const KEYS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

// ── words ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const asWords = (s: Spoken | undefined): CaptionWord[] => (s === undefined ? [] : typeof s === "string" ? [{ w: s, start: -1e9, end: -1e9 }] : s);
/** The words said by second t, whole words. */
const wordsBy = (s: Spoken | undefined, t: number) => asWords(s).filter((w) => t >= w.start).map((w) => w.w).join(" ");
/** Letter by letter across each word's own span (a keyboard). */
const lettersBy = (s: Spoken | undefined, t: number) => {
  const out: string[] = [];
  for (const w of asWords(s)) {
    if (t < w.start) break;
    const span = Math.max(0.06, w.end - w.start);
    const n = Math.min(w.w.length, Math.floor(((t - w.start) / span) * w.w.length) + 1);
    out.push(w.w.slice(0, n));
  }
  return out.join(" ");
};
const fullText = (s: Spoken | undefined) => asWords(s).map((w) => w.w).join(" ");
/** The word being said at t, or the last one said. */
const wordAt = (ws: CaptionWord[] | undefined, t: number) => {
  if (!ws?.length) return undefined;
  let cur: CaptionWord | undefined;
  for (const w of ws) if (t >= w.start) cur = w;
  return cur;
};

// ── camera ──────────────────────────────────────────────────────────────────────────────────────────────────────────
// motion: a whip gathers speed over about two frames, then lands hard (the reel's zooms never start at full speed)
const WHIP = Easing.bezier(0.6, 0, 0.1, 1);
const EASES = { swing: SWING, out: OUT, in: IN, whip: WHIP, linear: (x: number) => x };
type CamState = Required<Omit<PhoneCam, "t" | "ease">>;
const DEF: CamState = { s: 1, x: 0, y: 0, rx: 0, ry: 0, rz: 0, dof: 0 };
const fill = (keys: PhoneCam[]): (PhoneCam & CamState)[] => {
  let last = DEF;
  return keys.map((k) => {
    const v = { ...last, ...Object.fromEntries(Object.entries(k).filter(([, x]) => x !== undefined)) } as PhoneCam & CamState;
    last = v;
    return v;
  });
};
export const camAt = (keys: PhoneCam[], t: number): CamState => {
  const ks = fill(keys);
  if (!ks.length) return DEF;
  if (t <= ks[0].t) return ks[0];
  for (let i = 1; i < ks.length; i++) {
    const a = ks[i - 1];
    const b = ks[i];
    if (t <= b.t) {
      const e = EASES[b.ease ?? "swing"](Math.min(1, Math.max(0, (t - a.t) / Math.max(1e-6, b.t - a.t))));
      // scale moves in log space so a whip from 0.05 to 3 feels even
      const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * e);
      const m = (p: keyof CamState) => a[p] + (b[p] - a[p]) * e;
      return { s, x: m("x"), y: m("y"), rx: m("rx"), ry: m("ry"), rz: m("rz"), dof: m("dof") };
    }
  }
  return ks[ks.length - 1];
};
/** How fast the camera moves at t, in frame px a frame (rough, for the blur switch and the whoosh cues). */
export const camSpeed = (keys: PhoneCam[], t: number, fps: number, base: number) => {
  const a = camAt(keys, t - 1 / fps);
  const b = camAt(keys, t);
  const zoom = Math.abs(Math.log(b.s / a.s)) * 900;
  const pan = Math.hypot((b.x - a.x) * b.s * base, (b.y - a.y) * b.s * base);
  const turn = (Math.abs(b.rx - a.rx) + Math.abs(b.ry - a.ry) + Math.abs(b.rz - a.rz)) * 12;
  return zoom + pan + turn;
};

// ── small drawn parts ───────────────────────────────────────────────────────────────────────────────────────────────
// the status bar steps aside while the island is grown over it, as iOS does
const StatusBar: React.FC<{ clock: string; ink: string; under?: number }> = ({ clock, ink, under = 0 }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: 54, color: ink, fontWeight: 600, fontSize: 17, opacity: 1 - under }}>
    <div style={{ position: "absolute", left: 48, top: 17, letterSpacing: "-0.01em" }}>{clock}</div>
    <div style={{ position: "absolute", right: 34, top: 19, display: "flex", gap: 6, alignItems: "flex-end" }}>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 12 }}>
        {[4, 6, 8, 11].map((h, i) => <div key={i} style={{ width: 3, height: h, borderRadius: 1, background: ink }} />)}
      </div>
      <svg width="17" height="12" viewBox="0 0 17 12"><path d="M8.5 11.2 6 8.6a3.6 3.6 0 0 1 5 0Zm-4.3-4.4L2.6 5.2a8.4 8.4 0 0 1 11.8 0l-1.6 1.6a6.1 6.1 0 0 0-8.6 0ZM.9 3.5-.7 1.9a12.9 12.9 0 0 1 18.4 0l-1.6 1.6a10.6 10.6 0 0 0-15.2 0Z" fill={ink} /></svg>
      <div style={{ width: 25, height: 12, borderRadius: 4, border: `1.5px solid ${ink}`, opacity: 0.9, padding: 1.5, boxSizing: "border-box" }}>
        <div style={{ width: "78%", height: "100%", borderRadius: 2, background: ink }} />
      </div>
    </div>
  </div>
);

/** How far the island has grown into its banner, 0 to 1. */
const islandGrown = (t: number, spec?: PhoneIsland) => {
  const grow = spec ? interpolate(t, [spec.at, spec.at + 0.27], [0, 1], { ...clampX, easing: OUT }) : 0;
  const shrink = spec?.out !== undefined ? interpolate(t, [spec.out, spec.out + 0.2], [0, 1], { ...clampX, easing: IN }) : 0;
  return grow * (1 - shrink);
};

/** How far the status bar is hidden under the grown island: a gentler curve than the island's own, so it fades. */
const islandCover = (t: number, spec?: PhoneIsland) => {
  if (!spec) return 0;
  const on = interpolate(t, [spec.at, spec.at + 0.24], [0, 1], { ...clampX, easing: SWING });
  const off = spec.out !== undefined ? interpolate(t, [spec.out, spec.out + 0.24], [0, 1], { ...clampX, easing: SWING }) : 0;
  return on * (1 - off);
};

const Island: React.FC<{ t: number; fps: number; spec?: PhoneIsland }> = ({ t, spec }) => {
  const g = islandGrown(t, spec);
  const w = 126 + (372 - 126) * g;
  const h = 37 + (84 - 37) * g;
  const inner = interpolate(g, [0.6, 1], [0, 1], clampX);
  return (
    <div style={{ position: "absolute", left: (SW - w) / 2, top: 11, width: w, height: h, borderRadius: h / 2, background: "#000", overflow: "hidden" }}>
      {spec && inner > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: inner, display: "flex", alignItems: "center", padding: "0 14px", gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: "linear-gradient(#8E8E93, #6C6C70)", color: "#fff", display: "flex",
            alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 21, flexShrink: 0 }}>{spec.initials ?? ""}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div data-typing style={{ color: "#A1A1A6", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap" }}>{wordsBy(spec.top, t) || " "}</div>
            <div data-typing style={{ color: "#fff", fontSize: 19, fontWeight: 600, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{wordsBy(spec.main, t) || " "}</div>
          </div>
          {spec.buttons !== false ? (
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: "#FF3B30" }} />
              <div style={{ width: 44, height: 44, borderRadius: 22, background: "#34C759" }} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const Keyboard: React.FC<{ typed: string; suggestions: [string, string, string] }> = ({ typed, suggestions }) => {
  const last = typed.slice(-1).toLowerCase();
  return (
    <div data-typing style={{ position: "absolute", left: 0, bottom: 0, width: SW, height: 336, background: "#D1D3D9", paddingTop: 6 }}>
      <div style={{ display: "flex", height: 44, alignItems: "center", color: "#000", fontSize: 17 }}>
        {suggestions.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontWeight: i === 1 ? 600 : 400, borderLeft: i ? "1px solid rgba(0,0,0,0.14)" : "none",
            whiteSpace: "nowrap", overflow: "hidden" }}>{s}</div>
        ))}
      </div>
      {KEYS.map((row, r) => (
        <div key={r} style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12, padding: "0 3px" }}>
          {row.split("").map((ch) => {
            const on = ch === last && typed.length > 0;
            return (
              <div key={ch} style={{ width: 33, height: 43, borderRadius: 5, background: on ? "#AEB3BE" : "#fff", boxShadow: "0 1px 0 rgba(0,0,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, color: "#000", position: "relative" }}>
                {ch}
                {on ? (
                  <div style={{ position: "absolute", bottom: 30, left: -8, width: 49, height: 58, borderRadius: 9, background: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>{ch}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, marginTop: 12, padding: "0 3px" }}>
        <div style={{ width: 92, height: 43, borderRadius: 5, background: "#AEB3BE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>123</div>
        <div style={{ flex: 1, height: 43, borderRadius: 5, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>space</div>
        <div style={{ width: 92, height: 43, borderRadius: 5, background: "#007AFF", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>search</div>
      </div>
    </div>
  );
};

// ── scenes ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const SearchScreen: React.FC<{ sc: SearchScene; t: number }> = ({ sc, t }) => {
  const typed = lettersBy(sc.query, t);
  const typing = typed.length > 0;
  const lift = interpolate(t, [asWords(sc.query)[0]?.start ?? 1e9, (asWords(sc.query)[0]?.start ?? 1e9) + 0.25], [0, 1], { ...clampX, easing: SWING });
  const empty = sc.emptyAt !== undefined ? interpolate(t, [sc.emptyAt, sc.emptyAt + 0.2], [0, 1], { ...clampX, easing: OUT }) : 0;
  const caret = Math.floor(t * 2.2) % 2 === 0;
  const said = wordAt(sc.suggest, t);
  const saidI = said ? sc.suggest!.indexOf(said) : -1;
  const next = sc.suggest && saidI >= 0 ? sc.suggest[saidI + 1]?.w ?? "" : "";
  const prev = sc.suggest && saidI > 0 ? sc.suggest[saidI - 1].w : "";
  const qWords = asWords(sc.query);
  const q = wordAt(typeof sc.query === "string" ? undefined : sc.query, t);
  const suggestions: [string, string, string] = typing
    ? [`“${typed.split(" ").pop()}”`, q?.w ?? "", qWords[qWords.indexOf(q!) + 1]?.w ?? ""]
    : [prev || "\u00a0", said?.w || "\u00a0", next || "\u00a0"];
  const rows = sc.rows ?? [];
  return (
    <AbsoluteFill style={{ background: "#fff", color: "#000" }}>
      <div style={{ position: "absolute", left: 20, top: 98 - lift * 52, fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em", opacity: 1 - lift }}>
        {sc.title ?? "Contacts"}
      </div>
      <div style={{ position: "absolute", left: 16, right: 16 + 68 * lift, top: 148 - lift * 82, height: 38, borderRadius: 11, background: "#EEEEF0",
        display: "flex", alignItems: "center", padding: "0 10px", gap: 7, fontSize: 18, overflow: "hidden" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}><circle cx="6.5" cy="6.5" r="5" stroke="#8E8E93" strokeWidth="2" fill="none" /><path d="m10.5 10.5 4 4" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" /></svg>
        <div data-typing style={{ whiteSpace: "nowrap", color: typing ? "#000" : "#8E8E93", display: "flex", alignItems: "center" }}>
          {typing ? typed : "Search"}
          <div style={{ width: 2, height: 22, marginLeft: 1, background: "#007AFF", opacity: caret || typing ? 1 : 0 }} />
        </div>
      </div>
      {typing ? <div style={{ position: "absolute", right: 18, top: 156 - lift * 82, fontSize: 17, color: "#007AFF", opacity: lift }}>Cancel</div> : null}
      {/* the list before the search, the empty result after */}
      <div style={{ position: "absolute", left: 0, top: 204 - lift * 82, width: SW, opacity: 1 - lift }}>
        {rows.map((r, i) => (
          <div key={i} style={{ height: 46, marginLeft: 20, borderBottom: "1px solid #E5E5EA", display: "flex", alignItems: "center", fontSize: 17 }}>{r}</div>
        ))}
      </div>
      {empty > 0 ? (
        <div style={{ position: "absolute", left: 0, width: SW, top: 230 + (1 - empty) * 14, textAlign: "center", opacity: empty }}>
          <div style={{ fontSize: 22, fontWeight: 700, padding: "0 24px", lineHeight: 1.2 }}>No Results for {"“"}{fullText(sc.query)}{"”"}</div>
          <div style={{ fontSize: 15, color: "#8E8E93", marginTop: 8 }}>Check the spelling or try a new search.</div>
        </div>
      ) : null}
      <Keyboard typed={typed} suggestions={suggestions} />
    </AbsoluteFill>
  );
};

const NOTE_BG = "rgba(245, 245, 250, 0.20)";
const LockScreen: React.FC<{ sc: LockScene; t: number }> = ({ sc, t }) => {
  const visible = sc.notes.filter((n) => t >= n.at - 0.01);
  const moreN = sc.more ? [...sc.more.steps].reverse().find(([s]) => t >= s)?.[1] : undefined;
  const moreAt = sc.more ? [...sc.more.steps].reverse().find(([s]) => t >= s)?.[0] ?? 0 : 0;
  const tick = interpolate(t, [moreAt, moreAt + 0.18], [0, 1], { ...clampX, easing: OUT });
  return (
    <AbsoluteFill style={{ background: sc.wallpaper ?? "linear-gradient(170deg, #22345C 0%, #101A33 55%, #070B16 100%)", color: "#fff" }}>
      <div style={{ position: "absolute", width: SW, top: 76, textAlign: "center", fontSize: 19, fontWeight: 600, opacity: 0.92 }}>{sc.date}</div>
      <div style={{ position: "absolute", width: SW, top: 92, textAlign: "center", fontSize: 98, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{sc.time}</div>
      {sc.focus ? (
        <div style={{ position: "absolute", left: 0, width: SW, top: 214, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 20, background: "rgba(255,255,255,0.16)", fontSize: 15, fontWeight: 600 }}>
            <svg width="13" height="13" viewBox="0 0 13 13"><path d="M9.6 9.8A5.6 5.6 0 0 1 4.4 1.2a5.8 5.8 0 1 0 7.3 7.4 5.5 5.5 0 0 1-2.1 1.2Z" fill="#fff" /></svg>
            {sc.focus}
          </div>
        </div>
      ) : null}
      {/* the stack: newest on top, older ones shrink a little behind it */}
      <div style={{ position: "absolute", left: 12, width: SW - 24, top: sc.notesTop ?? 470 }}>
        {visible.map((n, i) => {
          const a = interpolate(t, [n.at, n.at + 0.28], [0, 1], { ...clampX, easing: OUT });
          const depth = visible.length - 1 - i;
          return (
            <div key={i} style={{ position: depth === 0 ? "relative" : "absolute", top: depth === 0 ? 0 : 74 + depth * 10, left: 0, right: 0, zIndex: 10 - depth,
              transform: `translateY(${((1 - a) * 90).toFixed(2)}px) scale(${(depth === 0 ? 0.92 + 0.08 * a : 1 - depth * 0.05).toFixed(4)})`,
              opacity: depth === 0 ? a : Math.max(0, 0.85 - depth * 0.3),
              background: NOTE_BG, borderRadius: 22, padding: "13px 14px", display: "flex", gap: 11, backdropFilter: "blur(18px)" }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: n.icon?.bg ?? "#34C759", color: n.icon?.ink ?? "#fff", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>{n.icon?.glyph ?? ""}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 600 }}>
                  <span data-typing style={{ whiteSpace: "nowrap", overflow: "hidden" }}>{wordsBy(n.title, t) || n.app}</span>
                  <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 8, fontSize: 13 }}>{n.age ?? "now"}</span>
                </div>
                {n.body !== undefined ? <div data-typing style={{ fontSize: 15, lineHeight: 1.3, marginTop: 1, minHeight: 20 }}>{wordsBy(n.body, t)}</div> : null}
              </div>
            </div>
          );
        })}
        {sc.more && moreN !== undefined ? (
          <div style={{ position: "relative", marginTop: visible.length > 1 ? 34 : 14, display: "flex", justifyContent: "center" }}>
            <div style={{ padding: "7px 16px", borderRadius: 18, background: "rgba(245,245,250,0.18)", fontSize: 14, fontWeight: 600,
              opacity: moreAt === sc.more.steps[0][0] ? tick : 1,
              transform: `scale(${(moreAt === sc.more.steps[0][0] ? 0.85 + 0.15 * tick : 1 + 0.08 * (1 - tick)).toFixed(4)})` }}>
              <span data-snap>{moreN} more from {sc.more.app}</span>
            </div>
          </div>
        ) : null}
      </div>
      <div style={{ position: "absolute", left: 48, bottom: 52, width: 50, height: 50, borderRadius: 25, background: "rgba(255,255,255,0.16)" }} />
      <div style={{ position: "absolute", right: 48, bottom: 52, width: 50, height: 50, borderRadius: 25, background: "rgba(255,255,255,0.16)" }} />
    </AbsoluteFill>
  );
};

const KEYPAD: [string, string][] = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", "+"], ["#", ""]];
const Keypad: React.FC<{ top: number; lit?: string }> = ({ top, lit }) => (
  <div style={{ position: "absolute", left: 0, width: SW, top, display: "grid", gridTemplateColumns: "repeat(3, 78px)", columnGap: 28, rowGap: 18, justifyContent: "center" }}>
    {KEYPAD.map(([d, l]) => (
      <div key={d} style={{ width: 78, height: 78, borderRadius: 39, background: lit === d ? "#BDBDC2" : "#E5E5EA", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", color: "#000" }}>
        <div style={{ fontSize: 34, lineHeight: 1 }}>{d}</div>
        {l ? <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginTop: 2 }}>{l}</div> : null}
      </div>
    ))}
  </div>
);

const DialerScreen: React.FC<{ sc: DialerScene; t: number }> = ({ sc, t }) => {
  const num = wordsBy(sc.number, t).replace(/\s/g, "");
  return (
    <AbsoluteFill style={{ background: "#fff", color: "#000" }}>
      <div data-typing style={{ position: "absolute", width: SW, top: 130, textAlign: "center", fontSize: 40, fontWeight: 400 }}>{num || " "}</div>
      <div data-typing style={{ position: "absolute", width: SW, top: 186, textAlign: "center", fontSize: 19, fontWeight: 600 }}>{wordsBy(sc.name, t) || " "}</div>
      {sc.sub ? <div style={{ position: "absolute", width: SW, top: 212, textAlign: "center", fontSize: 15, color: "#8E8E93" }}>{sc.sub}</div> : null}
      <Keypad top={290} lit={num.slice(-1)} />
      <div style={{ position: "absolute", left: SW / 2 - 39, top: 290 + 4 * 96 + 8, width: 78, height: 78, borderRadius: 39, background: "#34C759" }} />
    </AbsoluteFill>
  );
};

const AlertScreen: React.FC<{ sc: AlertScene; t: number }> = ({ sc, t }) => {
  const m = interpolate(t, [sc.morphAt, sc.morphAt + 0.3], [0, 1], { ...clampX, easing: OUT });
  const pillText = wordsBy(sc.pill, t);
  const pw = asWords(sc.pill);
  const cur = [...pw].reverse().find((x) => t >= x.start);
  const before = cur ? wordsBy(sc.pill, cur.start - 1e-3) : "";
  const grow = cur ? interpolate(t, [cur.start, cur.start + 0.2], [0, 1], { ...clampX, easing: SWING }) : 1;
  const textW = (n: number) => Math.min(340, 46 + n * 10.6);
  const pillW = textW(before.length) + (textW(pillText.length) - textW(before.length)) * grow;
  const pillGone = interpolate(t, [sc.morphAt - 0.1, sc.morphAt], [1, 0], clampX);
  const cardW = 300;
  const w = pillW + (cardW - pillW) * m;
  const color = sc.buttonColor ?? "#34C759";
  const press = sc.pressAt !== undefined ? interpolate(t, [sc.pressAt, sc.pressAt + 0.08, sc.pressAt + 0.2], [0, 1, 0.4], clampX) : 0;
  const bws = asWords(sc.button);
  // the card's height, estimated from its words, so the pill grows into it instead of popping
  const lines = (text: string, perLine: number) => Math.max(1, Math.ceil(text.length / perLine));
  const titleText = fullText(sc.title) || fullText(sc.pill);
  const cardH = 20 + lines(titleText, 27) * 22.5 + (sc.body !== undefined ? 6 + lines(fullText(sc.body), 36) * 19 : 0) + 16 + 46 + 16;
  const h = 56 + (cardH - 56) * m;
  return (
    <AbsoluteFill style={{ background: "#F2F2F7" }}>
      {/* a blurred keypad underneath, the way the reel's alert sits on its dialer */}
      <div style={{ position: "absolute", inset: 0, filter: "blur(12px)", opacity: 0.85 }}><Keypad top={300} /></div>
      <div style={{ position: "absolute", left: (SW - w) / 2, top: 300 - m * 40, width: w, height: h, borderRadius: 30 - m * 8, overflow: "hidden",
        background: m < 0.5 ? "#0A0A0B" : "#FFFFFF", boxShadow: "0 14px 40px rgba(0,0,0,0.18)", transform: `scale(${(1 + 0.04 * Math.sin(m * Math.PI)).toFixed(4)})` }}>
        {m < 0.5 ? (
          <div data-typing style={{ padding: "16px 22px", color: "#fff", fontSize: 19, fontWeight: 600, whiteSpace: "nowrap", opacity: pillGone }}>{pillText || " "}</div>
        ) : (
          <div style={{ position: "absolute", left: (w - cardW) / 2, top: 0, width: cardW, padding: "20px 18px 16px", boxSizing: "border-box", textAlign: "center", opacity: (m - 0.5) * 2 }}>
            <div data-typing style={{ fontSize: 18, fontWeight: 700, color: "#000", lineHeight: 1.25 }}>{wordsBy(sc.title, t) || fullText(sc.pill)}</div>
            {sc.body !== undefined ? <div data-typing style={{ fontSize: 14, color: "#6C6C70", marginTop: 6, lineHeight: 1.35, minHeight: 19 }}>{wordsBy(sc.body, t)}</div> : null}
            <div style={{ marginTop: 16, height: 46, borderRadius: 13, background: color, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontSize: 17, fontWeight: 700, color: "#fff", transform: `scale(${(1 - press * 0.05).toFixed(4)})`, filter: `brightness(${(1 - press * 0.12).toFixed(3)})` }}>
              {bws.map((bw, i) => <span key={i} style={{ opacity: t >= bw.start ? 1 : 0.45 }}>{bw.w}</span>)}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Screen: React.FC<{ sc: PhoneScene; t: number }> = ({ sc, t }) => {
  if (sc.kind === "search") return <SearchScreen sc={sc} t={t} />;
  if (sc.kind === "lock") return <LockScreen sc={sc} t={t} />;
  if (sc.kind === "alert") return <AlertScreen sc={sc} t={t} />;
  return <DialerScreen sc={sc} t={t} />;
};
const darkScene = (sc: PhoneScene) => sc.kind === "lock";

/** The screen content at film second t: the current scene, and the last one while the new one arrives. */
const ScreenAt: React.FC<{ scenes: PhoneScene[]; t: number; clock: string }> = ({ scenes, t, clock }) => {
  let i = 0;
  scenes.forEach((s, j) => { if (t >= s.from) i = j; });
  const sc = scenes[i];
  const prev = i > 0 ? scenes[i - 1] : undefined;
  const enter = sc.enter ?? "dissolve";
  const dur = enter === "dissolve" ? 0.13 : 0.3;
  const a = prev ? interpolate(t, [sc.from, sc.from + dur], [0, 1], { ...clampX, easing: OUT }) : 1;
  let style: React.CSSProperties = { opacity: a };
  if (enter === "slide") style = { transform: `translateY(${((1 - a) * SH).toFixed(2)}px)` };
  else if (typeof enter === "object") {
    const r = a * 1000;
    const { x, y } = enter.iris;
    style = { clipPath: `circle(${r.toFixed(1)}px at ${(SW / 2 + x).toFixed(1)}px ${(SH / 2 + y).toFixed(1)}px)` };
  }
  const island = sc.island ?? (prev && t < sc.from + dur + 0.04 ? prev.island : undefined);
  // every scene keeps its own place in the tree, so a scene handing off is the same node before and after
  return (
    <>
      {scenes.map((x, j) =>
        j === i ? <AbsoluteFill key={j} style={style}><Screen sc={x} t={t} /></AbsoluteFill>
        : j === i - 1 && t < sc.from + dur + 0.04 ? <AbsoluteFill key={j} style={{ opacity: interpolate(t, [sc.from + dur * 0.6, sc.from + dur + 0.04], [1, 0], clampX) }}><Screen sc={x} t={t} /></AbsoluteFill> : null)}
      <StatusBar clock={clock} ink={darkScene(sc) ? "#fff" : "#000"} under={islandCover(t, island)} />
      <Island t={t} fps={30} spec={island} />
    </>
  );
};

const Device: React.FC<{ scenes: PhoneScene[]; t: number; clock: string; dof: number; focus: { x: number; y: number } }> = ({ scenes, t, clock, dof, focus }) => {
  const screen = <ScreenAt scenes={scenes} t={t} clock={clock} />;
  const fx = SW / 2 + focus.x;
  const fy = SH / 2 + focus.y;
  const mask = `radial-gradient(circle at ${fx.toFixed(1)}px ${fy.toFixed(1)}px, transparent 0px, transparent 70px, #000 190px)`;
  return (
    <div style={{ position: "relative", width: SW + BEZEL * 2, height: SH + BEZEL * 2, borderRadius: RADIUS + BEZEL, background: "#0B0B0C",
      boxShadow: "0 0 0 2px #5E5B57, 0 0 0 5px #2A2826, 0 60px 120px rgba(0,0,0,0.55)" }}>
      <div style={{ position: "absolute", left: BEZEL, top: BEZEL, width: SW, height: SH, borderRadius: RADIUS, overflow: "hidden", fontFamily: INTER }}>
        {screen}
        {/* depth of field: a blurred copy over everything outside a soft circle round the held point */}
        {dof > 0.3 ? (
          <AbsoluteFill data-gate-skip="" style={{ WebkitMaskImage: mask, maskImage: mask }}>
            <AbsoluteFill style={{ filter: `blur(${dof.toFixed(2)}px)` }}><ScreenAt scenes={scenes} t={t} clock={clock} /></AbsoluteFill>
          </AbsoluteFill>
        ) : null}
      </div>
    </div>
  );
};

/** The phone in its camera, at the current (possibly sub-frame) time. Its own component so motion blur can freeze it. */
const PhoneWorld: React.FC<WordPhoneProps & { base: number; anchor: { x: number; y: number } }> = (p) => {
  const { fps, width, height } = useVideoConfig();
  const ft = useCurrentFrame() / fps;
  const c = camAt(p.camera, ft);
  const S = p.base * c.s;
  const { anchor } = p;
  // the held point (screen px from centre) lands on the anchor; rotations turn round it
  return (
    <AbsoluteFill style={{ perspective: 2600, perspectiveOrigin: `${width / 2 + anchor.x}px ${height / 2 + anchor.y}px` }}>
      <div style={{ position: "absolute", left: width / 2 + anchor.x, top: height / 2 + anchor.y, transformStyle: "preserve-3d",
        transform: `rotateX(${c.rx.toFixed(3)}deg) rotateY(${c.ry.toFixed(3)}deg) rotateZ(${c.rz.toFixed(3)}deg) scale(${S.toFixed(5)}) translate(${(-c.x - SW / 2 - BEZEL).toFixed(2)}px, ${(-c.y - SH / 2 - BEZEL).toFixed(2)}px)`,
        transformOrigin: "0 0" }}>
        <Device scenes={p.scenes} t={ft} clock={p.clock ?? "11:42"} dof={c.dof} focus={{ x: c.x, y: c.y }} />
      </div>
    </AbsoluteFill>
  );
};

/**
 * Motion blur that stays centred on the true frame: `samples` copies frozen at sub-frames spread evenly either side of
 * now (`shutter` frames wide in all), averaged. Remotion's CameraMotionBlur samples only BEFORE now, so switching it on
 * and off shifts the picture by half a trail; this one never does, and copy 0 (the true frame) is always the same node.
 */
const Smear: React.FC<{ samples: number; shutter: number; children: React.ReactNode }> = ({ samples, shutter, children }) => {
  const f = useCurrentFrame();
  const n = Math.max(1, samples);
  const step = n > 1 ? shutter / (n - 1) : 0;
  return (
    <AbsoluteFill style={{ isolation: "isolate" }}>
      {Array.from({ length: n }).map((_, i) => {
        const off = i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2) * step;
        return (
          <AbsoluteFill key={i} data-gate-skip={i > 0 ? "" : undefined}
            style={n > 1 ? { mixBlendMode: "plus-lighter", filter: `opacity(${(1 / n).toFixed(4)})` } : undefined}>
            <Freeze frame={f + off}>{children}</Freeze>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

/** The phone and its camera, no sound. */
export const WordPhone: React.FC<WordPhoneProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = f / fps;
  const base = (height * 0.77) / (SH + BEZEL * 2);
  const anchor = p.anchor ?? { x: 0, y: 70 };
  if (p.until !== undefined && t >= p.until) return null;

  // motion blur only while the camera moves fast; faster moves take more samples so the trail never steps
  const speed = camSpeed(p.camera, t, fps, base);
  const minSamples = p.blur ?? 9;
  const n = minSamples > 0 && speed > 26 ? Math.min(29, Math.max(minSamples, Math.round(speed / 7))) | 1 : 1;
  return (
    <AbsoluteFill style={{ background: p.ground ?? "radial-gradient(ellipse 80% 70% at 50% 50%, #3A0A10 0%, #170306 60%, #0B0204 100%)", overflow: "hidden" }}>
      <Smear samples={n} shutter={0.7}><PhoneWorld {...p} base={base} anchor={anchor} /></Smear>
    </AbsoluteFill>
  );
};

/** The sound events the phone makes, in film frames, for the film to score with the studio's cues (cueFor). */
export const wordPhoneEvents = (p: WordPhoneProps, fps: number) => {
  const ev: { kind: "type" | "notify" | "land" | "press" | "move"; frame: number; index?: number }[] = [];
  const fr = (s: number) => Math.round(s * fps);
  let ti = 0;
  for (const sc of p.scenes) {
    if (sc.kind === "search") for (const w of asWords(sc.query)) if (w.start > -1e8) ev.push({ kind: "type", frame: fr(w.start), index: ti++ });
    if (sc.kind === "search" && sc.emptyAt !== undefined) ev.push({ kind: "land", frame: fr(sc.emptyAt) });
    if (sc.kind === "lock") {
      for (const n of sc.notes) ev.push({ kind: "notify", frame: fr(n.at) });
      for (const [s] of sc.more?.steps ?? []) ev.push({ kind: "type", frame: fr(s), index: ti++ });
    }
    if (sc.island) ev.push({ kind: "land", frame: fr(sc.island.at) });
    if (sc.kind === "alert") {
      for (const w of asWords(sc.pill)) if (w.start > -1e8) ev.push({ kind: "type", frame: fr(w.start), index: ti++ });
      ev.push({ kind: "land", frame: fr(sc.morphAt) });
      if (sc.pressAt !== undefined) ev.push({ kind: "press", frame: fr(sc.pressAt) });
    }
  }
  // a move on each burst of fast camera (its first frame)
  const base = 1;
  let was = false;
  const end = Math.max(...p.camera.map((k) => k.t));
  for (let f = 1; f <= fr(end); f++) {
    const isFast = camSpeed(p.camera, f / fps, fps, base * 1.7) > 60;
    if (isFast && !was) ev.push({ kind: "move", frame: f });
    was = isFast;
  }
  return ev.sort((a, b) => a.frame - b.frame);
};
