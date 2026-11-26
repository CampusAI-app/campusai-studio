/**
 * MonitorTour (template, 2026-11-25): the "Monitor in a dark room" look as a film anyone can fill in.
 * Made from the Keynote round 3 film (Nov 24). The real product plays at 1440 x 900 on a monitor in a dark room; a white
 * label sits on top; above the monitor a big drawn icon and a big line, one phrase in a red box; chats answer live, pages
 * assemble row by row, a recorded press lands, and red pixel blocks carry every change of screen.
 *
 * You give it words and recordings (see MonitorTourProps below and monitor-tour.example.json). It works out every
 * timing, the camera push-ins, the room's light and the sound from the recordings themselves.
 *
 * Recordings come from the studio's own scripts, made on your Mac:
 *   npm run chat <film>   a chat answering (folder public/<film>/chat)
 *   npm run flow <film>   your own clicks through the demo (folder public/<film>/flow)
 * Record both at 1440 x 900 ("size": [1440, 900]) so the product shows at real computer size.
 *
 * Render it (public/ is too big to copy, so the public folder is linked, not copied):
 *   node -e "..." with renderMedia({ symlinkPublicDir: true }), or see the entry file's header.
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { DESK_SOLO, ScreenStage, type Quad } from "../kit/effects/ScreenStage";
import { PixelDissolve } from "../kit/effects/PixelDissolve";
import { HandleHighlight } from "../kit/effects/HandleHighlight";
import { LivePart, type LiveManifest, liveTimes, readingOrder } from "../kit/effects/LivePart";
import { ChatRecording } from "../kit/ChatRecording";
import { FlowRecording, pointerAt } from "../kit/FlowRecording";
import { PointerAt } from "../kit/Pointer";
import { B, Bed, IN, OUT, SWING, k, mix } from "../kit/effects/shared";
import { OUTPUT_AUDIO_OFFSET_F } from "../system/sound/Score";
import { pickBed } from "../system/sound/bed";

/* ================================================================ the props, in plain words */

/** The drawn icons you can name (Lucide, the product's own icon set). */
export type IconName =
  | "message-circle" | "sparkles" | "send" | "calendar-check" | "calendar-plus" | "book-open" | "coffee"
  | "briefcase-business" | "graduation-cap" | "check" | "badge-check" | "bell-ring" | "clipboard-check" | "map-pin";

/**
 * The big graphic above the words. One of:
 *  - an icon name, e.g. "briefcase-business": a big icon that draws itself on, stroke by stroke
 *  - { icon, dots: true }: the icon with three typing dots bouncing inside it (good on "message-circle")
 *  - { icon, pressTo: "calendar-check" }: the icon turns into this one, in red, the moment the recorded press lands
 *  - { day: "TUE", date: "24" }: a calendar tile. Two tiles in a row flip from one day to the next
 *  - { pills: ["Goldman Sachs", "Bank of America"] }: names stamping in as pills, a check on each
 *  - { count: 41, icon: "briefcase-business" }: a big number counting up from 0, an icon beside it
 *  - { ring: 51 }: a red ring filling to that percent, the number counting inside it
 * Every number and name here must be one the recording on the monitor actually shows.
 */
export type Graphic =
  | IconName
  | { icon: IconName; dots?: boolean; pressTo?: IconName }
  | { day: string; date: string }
  | { pills: string[] }
  | { count: number; icon?: IconName }
  | { ring: number };

/** A small icon beside the graphic. A plain name draws white; { icon, red: true } draws in red; null leaves that
 *  place empty (the places are left, right-top, right-bottom). */
export type SideIcon = IconName | { icon: IconName; red?: boolean } | null;

/**
 * When something happens. A number is seconds after the beat starts (it can be negative, to start during the change
 * of screen). Or a moment in the beat's recording: "send" (the chat's question is sent), "done" (the answer finished),
 * "press" (the flow's first click). A mark can carry an offset in seconds: "send+0.4", "press-0.2".
 */
export type When = number | string;

/** One line in the big words above the monitor. */
export type Say = {
  /** The words. Put the phrase that goes in the red box in [square brackets]. "\n" breaks the line. */
  text: string;
  /** When the line starts landing (word by word). Leave out and the beat's lines spread out evenly. */
  at?: When;
  /** true: the line lands under the one before it instead of replacing it ("One press." then "[Added.]"). */
  stack?: boolean;
  /** Type size in px, default 84. Drop to about 76 for a long line. */
  size?: number;
  /** A new big graphic that comes in with this line. */
  graphic?: Graphic;
  /** Up to three small icons around the graphic while this line is up. */
  sides?: SideIcon[];
};

/**
 * What plays on the monitor during a beat. One of:
 *  - { title: "What's on [my week?]", mark?: "private-umd-logo/umd-m.svg" }: big dark type on a light screen, a logo
 *    or mark on its left. Good as the opening beat: frame 0 already shows it.
 *  - { chat: "pkm-chat-week/chat", from?: 0.45, speed?: 1.6 }: a recorded chat (`npm run chat`), its folder under
 *    public/. `from` is the second of the recording to start on, `speed` how fast it plays (1.6 keeps it moving).
 *  - { flow: "pkm-press/flow", from?: 2.1, speed?: 1 }: a recorded flow (`npm run flow`), with the pointer drawn.
 *  - { page: "post-keynote-monitor/parts-r3", part: "jobsPage", step?: 0.6 }: a whole page cut into rows by
 *    capture-parts.mjs; the folder holds parts.json and one folder per part. Rows assemble top to bottom, `step`
 *    frames apart.
 *  - { still: "some/capture-1440x900.png" }: one still capture, 1440 x 900.
 *  - { logo: true }: the monitor turns red and the CampusAI logo builds from pixels. This is the payoff beat: give it
 *    the payoff line ("The AI agent system\n[for college.]").
 */
export type Screen =
  | { title: string; mark?: string }
  | { chat: string; from?: number; speed?: number }
  | { flow: string; from?: number; speed?: number }
  | { page: string; part: string; step?: number }
  | { still: string }
  | { logo: true };

/** The camera pushing in on one spot of the screen, then back out to the whole monitor. */
export type Push = {
  /** The spot, in screen px (the screen is 1440 wide, 900 tall). */
  x: number;
  y: number;
  /** How close, 1.45 for an answer, 1.9 for a button or a card. Default 1.45. */
  scale?: number;
  /** When the camera is all the way in. */
  at: When;
  /** Seconds it stays in. Leave out to stay until just before the beat ends. */
  hold?: number;
};

/** One beat of the film: one thing on the monitor and the words about it. */
export type Beat = {
  screen: Screen;
  /** The lines above the monitor during this beat, in order. */
  say: Say[];
  /** The big graphic at the start of the beat (a line can bring a new one). */
  graphic?: Graphic;
  /** How long the beat holds, in seconds, not counting the change into the next one. Leave out and it is worked out
   *  from the recording (a chat holds until its answer is done plus 0.85 s). */
  seconds?: number;
  /** How the screen changes into this beat: "dissolve" (red pixel blocks, the default) or "lift" (the old screen lifts
   *  and blurs off, the default into a page). */
  enter?: "dissolve" | "lift";
  /** The camera push-in. Leave out for the default (a chat's answer, a flow's press), false for none. */
  push?: Push | false;
};

export type MonitorTourProps = {
  /** The white label at the top the whole film, e.g. "Built by Terps, for Terps." Empty string for none. */
  label: string;
  /** The beats, in order. About 6 to 8 beats, each 1.2 to 3 s, makes a 20 s film. */
  beats: Beat[];
  /** The end card: the monitor clears to the logo on light, these words above it in plain white. */
  end: { text: string; graphic?: Graphic; seconds?: number };
  /** The room. Leave out for the filmed room (public/post-keynote-monitor/room.png with its screen corners), or
   *  "drawn" for the room drawn in code. If the room photo is not on this Mac, the drawn room is used by itself. */
  room?: { plate: string; screen: Quad } | "drawn";
  /** The music bed: a track name from src/system/sound/tracks.ts. null for none. If the track's file is not on this
   *  Mac (or the name is not a known track), the film plays without music. */
  music?: { track: string; volume?: number } | null;
  /** Sound effects on each motion. false for none. Any effect whose file is not on this Mac is skipped by itself. */
  sound?: boolean;
  /** Where the effects' files live under public/. Leave out for the usual folders. */
  sfx?: { product?: string; studio?: string };
  /** Filled in by the template itself from the recordings (calculateMonitorTourMetadata). Leave it out. */
  loaded?: Loaded;
};

/* ================================================================ loading the recordings at render time */

type Pt = { x: number; y: number };
type Move = { from: Pt; to: Pt; start: number; end: number; click?: number };
type RecInfo = { marks: Record<string, number>; moves: Move[]; last: number };
export type Loaded = {
  rec: Record<string, RecInfo>;
  parts: Record<string, LiveManifest>;
  /** Which optional files are on this Mac (missing ones fall back: drawn room, no mark, no music, cue skipped). */
  has?: { plate: boolean; music: boolean; marks: Record<string, boolean>; sfx: Record<string, boolean> };
};

const folder = (p: string) => p.replace(/\/frames\.json$/, "").replace(/\/+$/, "").replace(/^\/+/, "");
const recKey = (s: Screen) => ("chat" in s ? folder(s.chat) : "flow" in s ? folder(s.flow) : null);
const partKey = (s: Screen) => ("page" in s ? `${folder(s.page)}/${s.part}` : null);

/** Is this file under public/ on this Mac? (A HEAD request, then a GET if the server will not answer HEAD.) */
const exists = async (path: string) => {
  const url = staticFile(path.replace(/^\/+/, ""));
  try {
    const r = await fetch(url, { method: "HEAD" });
    if (r.ok) return true;
    if (r.status !== 405 && r.status !== 501) return false;
    const g = await fetch(url);
    return g.ok;
  } catch {
    return false;
  }
};

const missingRecording = (kind: "chat" | "flow", rk: string) => {
  const film = rk.replace(new RegExp(`/${kind}$`), "");
  return new Error(
    `MonitorTour: the ${kind} recording "${rk}" is not on this Mac (no public/${rk}/frames.json). ` +
    `Record it with \`npm run ${kind} ${film}\` (it reads films/${film}/${kind}.json and writes public/${film}/${kind}/), ` +
    `or point the beat at a recording you have.`,
  );
};

const sfxPath = (p: MonitorTourProps, name: string) =>
  STUDIO_SFX.has(name) ? `${folder(p.sfx?.studio ?? "styles/sfx")}/${name}.mp3` : `${folder(p.sfx?.product ?? "post-keynote-monitor/sfx")}/${name}.mp3`;

/** Reads every recording's marks and every page's manifest, so the film can time itself, and checks which optional
 *  files (room photo, mark, music, sound effects) are on this Mac. Missing recordings, pages or stills stop the render
 *  with a plain message naming the file and how to make it. */
export const loadMonitorTour = async (props: MonitorTourProps, compositionId = "Template-MonitorTour-9x16"): Promise<Loaded> => {
  const rec: Loaded["rec"] = {};
  const parts: Loaded["parts"] = {};
  const manifests: Record<string, Promise<Record<string, LiveManifest>>> = {};
  await Promise.all(props.beats.map(async (b) => {
    const rk = recKey(b.screen);
    if (rk && !rec[rk]) {
      const kind = "chat" in b.screen ? "chat" : "flow";
      const j = await fetch(staticFile(`${rk}/frames.json`)).then((r) => {
        if (!r.ok) throw missingRecording(kind, rk);
        return r.json();
      }, () => { throw missingRecording(kind, rk); });
      const frames: { t: number }[] = j.frames ?? [];
      rec[rk] = { marks: j.marks ?? {}, moves: j.moves ?? [], last: frames.length ? frames[frames.length - 1].t : 0 };
    }
    if ("page" in b.screen) {
      const dir = folder(b.screen.page);
      const noParts = () => new Error(
        `MonitorTour: the page parts "${dir}" are not on this Mac (no public/${dir}/parts.json). ` +
        `They are cut from the real page by films/post-keynote-monitor/capture-parts.mjs; run it for your page, or point the beat at parts you have.`,
      );
      manifests[dir] ??= fetch(staticFile(`${dir}/parts.json`)).then((r) => {
        if (!r.ok) throw noParts();
        return r.json();
      }, () => { throw noParts(); });
      const all = await manifests[dir];
      const m = all[b.screen.part];
      if (!m) throw new Error(`MonitorTour: public/${dir}/parts.json has no part called "${b.screen.part}" (it has: ${Object.keys(all).join(", ")}).`);
      if (!(await exists(`${dir}/${b.screen.part}/full.png`))) throw new Error(`MonitorTour: the images for part "${b.screen.part}" are missing (no public/${dir}/${b.screen.part}/full.png). Run capture-parts.mjs again for that page.`);
      parts[`${dir}/${b.screen.part}`] = m;
    }
    if ("still" in b.screen && !(await exists(b.screen.still))) {
      throw new Error(`MonitorTour: the still "${b.screen.still}" is not on this Mac (looked for public/${folder(b.screen.still)}). Put a 1440 x 900 capture there, or point the beat at one you have.`);
    }
  }));

  // the optional files: each one missing falls back instead of breaking the render
  const plate = props.room === "drawn" ? false : await exists((props.room as { plate: string } | undefined)?.plate ?? PLATE.plate);
  const markPaths = [...new Set(props.beats.map((b) => ("title" in b.screen ? b.screen.mark : undefined)).filter((m): m is string => !!m))];
  const marks: Record<string, boolean> = {};
  await Promise.all(markPaths.map(async (m) => (marks[m] = await exists(m))));
  let music = false;
  if (props.music) {
    try {
      const bed = pickBed(compositionId, 30, props.music.track);
      music = bed.track === props.music.track && (await exists(bed.file));
    } catch {
      music = false;
    }
  }
  const sfx: Record<string, boolean> = {};
  if (props.sound !== false) await Promise.all(Object.keys(PEAK).map(async (n) => (sfx[sfxPath(props, n)] = await exists(sfxPath(props, n)))));
  return { rec, parts, has: { plate, music, marks, sfx } };
};

/* ================================================================ the plan: every beat's frames */

export const MT_FPS = 30;
export const MT_W = 1080;
export const MT_H = 1920;
const FPS = MT_FPS;
const SW = 1440;
const SH = 900;
const TR = 10; // a dissolve between product screens, frames
const TR_BIG = 14; // into the logo and into the end
const LIFT = 6;
const END_DEFAULT = 3.5;

type Kind = "title" | "chat" | "flow" | "page" | "still" | "logo";
const kindOf = (s: Screen): Kind =>
  "title" in s ? "title" : "chat" in s ? "chat" : "flow" in s ? "flow" : "page" in s ? "page" : "still" in s ? "still" : "logo";

type PB = {
  i: number; beat: Beat; kind: Kind; S: number; own: number; trIn: number; enter: "open" | "dissolve" | "lift";
  from: number; speed: number; rec?: RecInfo; part?: LiveManifest;
  /** a mark of the recording, in film frames, or null */
  mark: (name: string) => number | null;
};
type Plan = { beats: PB[]; E: number; total: number };

const recSpeed = (s: Screen) => ("chat" in s ? s.speed ?? 1.6 : "flow" in s ? s.speed ?? 1 : 1);
const recFrom = (s: Screen) => ("chat" in s ? s.from ?? 0.45 : "flow" in s ? s.from ?? 0 : 0);
const firstClick = (r?: RecInfo) => r?.moves.find((m) => m.click !== undefined)?.click;

const defaultSeconds = (kind: Kind, from: number, speed: number, r?: RecInfo) => {
  switch (kind) {
    case "title": return 1.35;
    case "logo": return 1.15;
    case "page": return 2.3;
    case "still": return 2;
    case "chat": return r && r.marks.done !== undefined ? Math.max(1, (r.marks.done - from) / speed + 0.85) : 3;
    case "flow": {
      const c = firstClick(r);
      if (c !== undefined) return Math.max(1, (c - from) / speed + 2.4);
      return r ? Math.max(1, (r.last - from) / speed) : 3;
    }
  }
};

export const planMonitorTour = (p: MonitorTourProps): Plan => {
  const out: PB[] = [];
  let S = 0;
  p.beats.forEach((beat, i) => {
    const kind = kindOf(beat.screen);
    const enter = i === 0 ? "open" : beat.enter ?? (kind === "page" ? "lift" : "dissolve");
    const trIn = enter === "dissolve" ? (kind === "logo" ? TR_BIG : TR) : 0;
    if (i > 0) S += trIn;
    const rk = recKey(beat.screen);
    const pk = partKey(beat.screen);
    const rec = rk ? p.loaded?.rec[rk] : undefined;
    const from = recFrom(beat.screen);
    const speed = recSpeed(beat.screen);
    const own = Math.max(12, Math.round((beat.seconds ?? defaultSeconds(kind, from, speed, rec)) * FPS));
    const start = S;
    const mark = (name: string) => {
      const t = name === "press" || name === "click" ? firstClick(rec) : rec?.marks[name];
      return t === undefined ? null : start + ((t - from) / speed) * FPS;
    };
    out.push({ i, beat, kind, S, own, trIn, enter, from, speed, rec, part: pk ? p.loaded?.parts[pk] : undefined, mark });
    S += own;
  });
  const E = S + TR_BIG;
  return { beats: out, E, total: E + Math.round((p.end.seconds ?? END_DEFAULT) * FPS) };
};

/** The film's length in frames, from its props (pass the loaded recordings for exact chat and flow lengths). */
export const monitorTourFrames = (p: MonitorTourProps, loaded?: Loaded) => planMonitorTour({ ...p, loaded: loaded ?? p.loaded }).total;

/** For the Composition: reads the recordings, then sets the length. */
export const calculateMonitorTourMetadata = async ({ props, compositionId }: { props: MonitorTourProps; compositionId?: string }) => {
  const loaded = await loadMonitorTour(props, compositionId);
  return { durationInFrames: monitorTourFrames(props, loaded), props: { ...props, loaded } };
};

/** A When, in film frames, for a beat. */
const whenF = (pb: PB, w: When | undefined, fallback: number) => {
  if (w === undefined) return fallback;
  if (typeof w === "number") return pb.S + w * FPS;
  const m = /^\s*([a-z]+)\s*([+-]\s*[\d.]+)?\s*$/i.exec(w);
  if (!m) return fallback;
  const base = pb.mark(m[1].toLowerCase());
  if (base === null) return fallback;
  return base + (m[2] ? parseFloat(m[2].replace(/\s/g, "")) * FPS : 0);
};

/* ================================================================ type */

const RED = B.color.accent;
const RED_RGB = B.color.glowRgb;
const GROUND = "#f4f4f1";
const INK = "#151515";
const BLOCK_REDS = ["#D9202E", "#C01624", "#E4404F", "#A90F1B", "#F0636E"];
const geist = loadGeist("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily;
const LOGO_AR = 53 / 223;

type Seg = { t: string; hl?: boolean; br?: boolean };
/** "Thursday: a quiz,\n[and a coffee chat.]" to segments: the bracketed phrase gets the red box. */
const parse = (text: string): Seg[] => {
  const segs: Seg[] = [];
  text.split("\n").forEach((row, ri) => {
    let first = true;
    const re = /\[([^\]]+)\]|([^[]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(row))) {
      const t = (m[1] ?? m[2]).trim();
      if (!t) continue;
      segs.push({ t, hl: m[1] !== undefined, br: ri > 0 && first });
      first = false;
    }
  });
  return segs;
};
/** Frame the red box starts drawing, for the marker sound. */
const boxAt = (text: string, at: number) => {
  let n = 0;
  for (const s of parse(text)) {
    if (s.hl) return at + n * 2 + 1;
    n += s.t.split(" ").length;
  }
  return null;
};

/** Words land one at a time, each popping in; the bracketed phrase wipes into its red handle box as it lands. */
const Line: React.FC<{ f: number; at: number; text: string; size?: number; step?: number; color?: string; style?: React.CSSProperties }> = ({ f, at, text, size = 84, step = 2, color = "#fff", style }) => {
  let i = 0;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: size * 0.26, rowGap: size * 0.14, fontFamily: geist, fontWeight: 500, fontSize: size, letterSpacing: -size * 0.025, color, lineHeight: 1.12, ...style }}>
      {parse(text).map((s, si) => {
        const ws = s.t.split(" ");
        const first = at + i * step;
        const nodes = ws.map((w, wi) => {
          const t = at + (i + wi) * step;
          const a = k(f, t, t + 5, OUT);
          const pop = k(f, t, t + 8, Easing.out(Easing.back(2.4)));
          return (
            <span key={wi} style={{ display: "inline-block", opacity: a, transform: `translateY(${(1 - a) * 18}px) scale(${0.55 + 0.45 * pop})`, filter: `blur(${(1 - a) * 5}px)`, marginRight: wi < ws.length - 1 ? size * 0.26 : 0 }}>
              {w}
            </span>
          );
        });
        i += ws.length;
        const el = !s.hl ? (
          <span key={si} style={{ display: "inline-flex", whiteSpace: "nowrap" }}>{nodes}</span>
        ) : (
          <HandleHighlight key={si} reveal={k(f, first + 1, first + 9, OUT)} fill={RED} handle={RED} handleSize={14} offset={5} pad={[2, size * 0.2]} style={{ whiteSpace: "nowrap" }}>
            {nodes}
          </HandleHighlight>
        );
        return s.br ? <React.Fragment key={si}><div style={{ flexBasis: "100%", height: 0 }} />{el}</React.Fragment> : el;
      })}
    </div>
  );
};

/* ================================================================ the words' timeline */

type LineT = { pb: PB; say: Say; at: number };
type Block = { lines: LineT[]; at: number; out: number };

const timeline = (plan: Plan) => {
  const lines: LineT[] = [];
  plan.beats.forEach((pb) => {
    const n = pb.beat.say.length;
    const first = pb.i === 0 ? -6 : pb.enter === "dissolve" ? pb.S - pb.trIn / 2 + 2 : pb.S + 4;
    const last = pb.S + pb.own * 0.7;
    pb.beat.say.forEach((say, j) => {
      const even = j === 0 ? first : first + ((last - first) * j) / Math.max(1, n - 1);
      lines.push({ pb, say, at: Math.round(whenF(pb, say.at, even)) });
    });
  });
  const blocks: Block[] = [];
  lines.forEach((l) => {
    if (l.say.stack && blocks.length) blocks[blocks.length - 1].lines.push(l);
    else blocks.push({ lines: [l], at: l.at, out: 0 });
  });
  blocks.forEach((b, i) => (b.out = i + 1 < blocks.length ? Math.max(b.at + 8, blocks[i + 1].at) : plan.E - TR_BIG + 2));
  return { lines, blocks };
};

/* graphics: each one holds until the next one comes in; the same graphic twice in a row just holds */
type GSeg = { g: Graphic; at: number; out: number; pb: PB; days?: { day: string; date: string; at: number }[] };
const isDay = (g: Graphic): g is { day: string; date: string } => typeof g === "object" && "day" in g;
const graphics = (plan: Plan, lines: LineT[], endGraphic?: Graphic) => {
  const segs: GSeg[] = [];
  const add = (g: Graphic, at: number, pb: PB) => {
    const prev = segs[segs.length - 1];
    if (prev && JSON.stringify(prev.g) === JSON.stringify(g)) return;
    if (prev && isDay(prev.g) && isDay(g) && prev.days) {
      prev.days.push({ ...g, at });
      return;
    }
    segs.push({ g, at, out: 0, pb, days: isDay(g) ? [{ ...g, at }] : undefined });
  };
  plan.beats.forEach((pb) => {
    const own = lines.filter((l) => l.pb === pb);
    if (pb.beat.graphic) add(pb.beat.graphic, (own[0]?.at ?? pb.S) - 2, pb);
    own.forEach((l) => l.say.graphic && add(l.say.graphic, l.at - 2, pb));
  });
  segs.forEach((s, i) => (s.out = i + 1 < segs.length ? segs[i + 1].at : plan.E - TR_BIG + 2));
  const end = endGraphic ? { g: endGraphic, at: plan.E + 22, out: plan.total + 30 } : null;
  return { segs, end };
};

/* ================================================================ icons and graphics */

type IconNode = [string, Record<string, string>][];
const ICONS: Record<IconName, IconNode> = {"calendar-check": [["path", {"d": "M8 2v4"}], ["path", {"d": "M16 2v4"}], ["rect", {"width": "18", "height": "18", "x": "3", "y": "4", "rx": "2"}], ["path", {"d": "M3 10h18"}], ["path", {"d": "m9 16 2 2 4-4"}]], "calendar-plus": [["path", {"d": "M16 19h6"}], ["path", {"d": "M16 2v4"}], ["path", {"d": "M19 16v6"}], ["path", {"d": "M21 12.598V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5"}], ["path", {"d": "M3 10h18"}], ["path", {"d": "M8 2v4"}]], "book-open": [["path", {"d": "M12 7v14"}], ["path", {"d": "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"}]], "coffee": [["path", {"d": "M10 2v2"}], ["path", {"d": "M14 2v2"}], ["path", {"d": "M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"}], ["path", {"d": "M6 2v2"}]], "briefcase-business": [["path", {"d": "M12 12h.01"}], ["path", {"d": "M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"}], ["path", {"d": "M22 13a18.15 18.15 0 0 1-20 0"}], ["rect", {"width": "20", "height": "14", "x": "2", "y": "6", "rx": "2"}]], "graduation-cap": [["path", {"d": "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"}], ["path", {"d": "M22 10v6"}], ["path", {"d": "M6 12.5V16a6 3 0 0 0 12 0v-3.5"}]], "check": [["path", {"d": "M20 6 9 17l-5-5"}]], "sparkles": [["path", {"d": "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"}], ["path", {"d": "M20 2v4"}], ["path", {"d": "M22 4h-4"}], ["circle", {"cx": "4", "cy": "20", "r": "2"}]], "message-circle": [["path", {"d": "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"}]], "badge-check": [["path", {"d": "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"}], ["path", {"d": "m9 12 2 2 4-4"}]], "bell-ring": [["path", {"d": "M10.268 21a2 2 0 0 0 3.464 0"}], ["path", {"d": "M22 8c0-2.3-.8-4.3-2-6"}], ["path", {"d": "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"}], ["path", {"d": "M4 2C2.8 3.7 2 5.7 2 8"}]], "clipboard-check": [["rect", {"width": "8", "height": "4", "x": "8", "y": "2", "rx": "1", "ry": "1"}], ["path", {"d": "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"}], ["path", {"d": "m9 14 2 2 4-4"}]], "map-pin": [["path", {"d": "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"}], ["circle", {"cx": "12", "cy": "10", "r": "3"}]], "send": [["path", {"d": "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"}], ["path", {"d": "m21.854 2.147-10.94 10.939"}]]};
const BACK = Easing.out(Easing.back(2.2));

const DrawIcon: React.FC<{ name: IconName; size: number; f: number; at: number; out?: number; color?: string; x: number; y: number; rot?: number; bob?: number }> = ({ name, size, f, at, out, color = "#fff", x, y, rot = 0, bob = 0 }) => {
  const nodes = ICONS[name];
  const pop = k(f, at, at + 9, BACK);
  const gone = out === undefined ? 0 : k(f, out - 5, out, IN);
  if (!nodes || pop <= 0 || gone >= 1) return null;
  const float = bob ? Math.sin((f - at) / 14) * bob : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", left: x - size / 2, top: y - size / 2 + float, overflow: "visible", opacity: 1 - gone, transform: `rotate(${rot}deg) scale(${(0.6 + 0.4 * pop) * (1 - 0.3 * gone)})` }}>
      {nodes.map(([tag, attrs], i) => {
        const d = k(f, at + 2 + i * 3, at + 14 + i * 3, SWING);
        return React.createElement(tag, { key: i, ...attrs, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - d, fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" });
      })}
    </svg>
  );
};

/** A whole graphic's way in (pops up from below) and out (lifts and blurs). */
const gIn = (f: number, at: number, out: number) => {
  const a = k(f, at, at + 10, BACK);
  const x = k(f, out - 6, out, IN);
  return { opacity: Math.min(1, a * 1.4) * (1 - x), transform: `translateY(${(1 - a) * 40 - 20 * x}px) scale(${(0.7 + 0.3 * a) * (1 - 0.08 * x)})`, filter: x > 0 ? `blur(${5 * x}px)` : undefined } as React.CSSProperties;
};
const GY = 330; // the graphics' centre line
const MID: React.CSSProperties = { position: "absolute", left: 0, right: 0, top: GY - 130, height: 260, display: "flex", alignItems: "center", justifyContent: "center" };
const label = (size: number, weight = 600): React.CSSProperties => ({ fontFamily: geist, fontWeight: weight, fontSize: size, letterSpacing: -size * 0.02, color: "#fff", lineHeight: 1 });

const DayTile: React.FC<{ f: number; at: number; out: number; days: { day: string; date: string; at: number }[] }> = ({ f, at, out, days }) => {
  let shown = days[0];
  let turn = 0;
  days.slice(1).forEach((d) => {
    const t = k(f, d.at - 3, d.at + 5, SWING);
    if (t > 0) turn = t;
    if (t >= 0.5) shown = d;
  });
  if (turn >= 1) turn = 0;
  return (
    <div style={{ ...MID, ...gIn(f, at, out) }}>
      <div style={{ width: 210, height: 230, borderRadius: 26, border: "5px solid #fff", overflow: "hidden", background: "rgba(255,255,255,0.04)", display: "flex", flexDirection: "column" }}>
        <div style={{ height: 62, background: RED, display: "flex", alignItems: "center", justifyContent: "center", ...label(34, 700) }}>{shown.day}</div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", transform: `perspective(600px) rotateX(${Math.sin(turn * Math.PI) * 80}deg)` }}>
          <span style={{ ...label(116, 600), fontVariantNumeric: "tabular-nums" }}>{shown.date}</span>
        </div>
      </div>
    </div>
  );
};

const Pills: React.FC<{ f: number; at: number; out: number; names: string[] }> = ({ f, at, out, names }) => (
  <div style={{ ...MID, ...gIn(f, at, out), flexDirection: "column", gap: 18 }}>
    {names.slice(0, 3).map((text, i) => {
      const s = k(f, at + 2 + i * 8, at + 10 + i * 8, BACK);
      return (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 30px 16px 20px", borderRadius: 999, border: "4px solid #fff", background: "rgba(255,255,255,0.05)", opacity: Math.min(1, s * 1.5), transform: `rotate(${i % 2 ? 1.5 : -2}deg) scale(${1.35 - 0.35 * s})` }}>
          <svg width={52} height={52} viewBox="0 0 24 24" style={{ overflow: "visible" }}>
            {ICONS["badge-check"].map(([tag, attrs], j) => React.createElement(tag, { key: j, ...attrs, fill: j === 0 ? RED : "none", stroke: "#fff", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }))}
          </svg>
          <span style={label(46, 600)}>{text}</span>
        </div>
      );
    })}
  </div>
);

const CountUp: React.FC<{ f: number; at: number; out: number; to: number; icon?: IconName }> = ({ f, at, out, to, icon }) => {
  const n = Math.round(interpolate(f, [at + 2, at + 24], [0, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  const digits = String(to).length;
  return (
    <div style={{ ...MID, ...gIn(f, at, out), gap: 34 }}>
      {icon ? <div style={{ position: "relative", width: 150, height: 150 }}><DrawIcon name={icon} size={150} f={f} at={at} x={75} y={75} /></div> : null}
      <span style={{ ...label(220, 600), letterSpacing: -10, fontVariantNumeric: "tabular-nums", width: 125 * digits + 20, textAlign: icon ? "left" : "center" }}>{n}</span>
    </div>
  );
};

const Ring: React.FC<{ f: number; at: number; out: number; pct: number }> = ({ f, at, out, pct }) => {
  const p = interpolate(f, [at + 3, at + 30], [0, pct / 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ ...MID, ...gIn(f, at, out) }}>
      <div style={{ position: "relative", width: 250, height: 250 }}>
        <svg width={250} height={250} viewBox="0 0 250 250" style={{ position: "absolute", inset: 0 }}>
          <circle cx={125} cy={125} r={105} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={22} />
          <circle cx={125} cy={125} r={105} fill="none" stroke={RED} strokeWidth={22} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} transform="rotate(-90 125 125)" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", ...label(84, 600), fontVariantNumeric: "tabular-nums" }}>{Math.round(p * 100)}%</div>
      </div>
    </div>
  );
};

const BigIcon: React.FC<{ f: number; at: number; out: number; name: IconName; swapTo?: IconName; swapAt?: number | null; dots?: boolean }> = ({ f, at, out, name, swapTo, swapAt, dots }) => {
  const swapped = swapTo && swapAt != null && f >= swapAt;
  const bounce = swapped ? 1 + 0.18 * Math.sin(Math.min(1, (f - swapAt!) / 8) * Math.PI) : 1;
  const fadeOld = swapTo && swapAt != null ? k(f, swapAt, swapAt + 4) : 0;
  return (
    <div style={{ ...MID, ...gIn(f, at, out) }}>
      <div style={{ position: "relative", width: 220, height: 220, transform: `scale(${bounce})` }}>
        {fadeOld < 1 ? <div style={{ position: "absolute", inset: 0, opacity: 1 - fadeOld }}><DrawIcon name={name} size={220} f={f} at={at} x={110} y={110} /></div> : null}
        {swapped ? <DrawIcon name={swapTo!} size={220} f={f} at={swapAt! - 2} x={110} y={110} color={RED} /> : null}
        {dots ? [0, 1, 2].map((i) => {
          const b = Math.max(0, Math.sin((f - at) / 4 - i * 0.9));
          return <div key={i} style={{ position: "absolute", left: 72 + i * 30, top: 100 - 10 * b, width: 16, height: 16, borderRadius: 8, background: "#fff", opacity: k(f, at + 10, at + 14) * (1 - fadeOld) }} />;
        }) : null}
      </div>
    </div>
  );
};

const GraphicView: React.FC<{ f: number; s: { g: Graphic; at: number; out: number; pb?: PB; days?: GSeg["days"] } }> = ({ f, s }) => {
  if (f < s.at - 1 || f >= s.out) return null;
  const g = s.g;
  if (typeof g === "string") return <BigIcon f={f} at={s.at} out={s.out} name={g} />;
  if ("day" in g) return <DayTile f={f} at={s.at} out={s.out} days={s.days ?? [{ ...g, at: s.at }]} />;
  if ("pills" in g) return <Pills f={f} at={s.at} out={s.out} names={g.pills} />;
  if ("count" in g) return <CountUp f={f} at={s.at} out={s.out} to={g.count} icon={g.icon} />;
  if ("ring" in g) return <Ring f={f} at={s.at} out={s.out} pct={g.ring} />;
  const press = g.pressTo && s.pb ? s.pb.mark("press") : null;
  return <BigIcon f={f} at={s.at} out={s.out} name={g.icon} dots={g.dots} swapTo={g.pressTo} swapAt={press === null ? null : press + 2} />;
};

const L = 150, RX = 930;
const SIDE_AT: [number, number, number][] = [[L, GY - 30, -7], [RX, GY - 40, 7], [RX - 20, GY + 80, -4]];

/* ================================================================ the monitor */

const RedFill: React.FC = () => <AbsoluteFill style={{ background: RED }} />;

const Title: React.FC<{ f: number; at: number; text: string; mark?: string }> = ({ f, at, text, mark }) => (
  <AbsoluteFill style={{ background: GROUND, width: SW, height: SH }}>
    {mark ? <Img src={staticFile(mark)} style={{ position: "absolute", left: 110, top: 250, height: 380 }} /> : null}
    <div style={{ position: "absolute", left: mark ? 545 : 140, top: mark ? 236 : 250, width: mark ? 860 : 1160 }}>
      <Line f={f} at={at} step={3} text={text} size={164} color={INK} style={mark ? undefined : { justifyContent: "center" }} />
    </div>
  </AbsoluteFill>
);

const RedLogo: React.FC<{ f: number; at: number }> = ({ f, at }) => (
  <AbsoluteFill style={{ background: RED, width: SW, height: SH, alignItems: "center", justifyContent: "center" }}>
    <div style={{ position: "relative", width: 620, height: Math.round(620 * LOGO_AR) }}>
      <PixelDissolve progress={k(f, at, at + 16, SWING)} width={620} height={Math.round(620 * LOGO_AR)} cell={14} band={0.18} direction="random" colors={["#ffffff", "#ffd6da", "#ff9aa3"]} seed="logo"
        to={<Img src={staticFile(B.logo!.onDark)} style={{ width: 620, height: 620 * LOGO_AR }} />} />
    </div>
  </AbsoluteFill>
);

const EndLogo: React.FC<{ f: number; E: number; total: number }> = ({ f, E, total }) => (
  <AbsoluteFill style={{ background: GROUND, width: SW, height: SH, alignItems: "center", justifyContent: "center" }}>
    <Img src={staticFile(B.logo!.onLight)} style={{ width: 640, height: 640 * LOGO_AR, transform: `scale(${mix(1, 1.04, k(f, E, total, (t) => t))})` }} />
  </AbsoluteFill>
);

const onScreen = (m: LiveManifest) => readingOrder(m).filter((i) => m.lines[i].y < SH - 4);
const pageTiming = (pb: PB) => {
  const s = pb.beat.screen as { step?: number };
  return { start: pb.S - pb.trIn, frameDur: 1, fillAfter: 3, step: s.step ?? 0.5, lineDur: 9, countDur: 24, order: pb.part ? onScreen(pb.part) : [] };
};

const recT = (pb: PB, f: number) => pb.from + ((f - pb.S) / FPS) * pb.speed;

const Content: React.FC<{ f: number; pb: PB; has?: Loaded["has"] }> = ({ f, pb, has }) => {
  const s = pb.beat.screen;
  const dark = { background: "#0d0b0c", width: SW, height: SH } as const;
  if ("title" in s) return <Title f={f} at={pb.i === 0 ? -8 : pb.S - pb.trIn} text={s.title} mark={s.mark && has?.marks[s.mark] !== false ? s.mark : undefined} />;
  if ("chat" in s) return <AbsoluteFill style={dark}><ChatRecording src={`${folder(s.chat)}/frames.json`} from={pb.from - (pb.S / FPS) * pb.speed} speed={pb.speed} /></AbsoluteFill>;
  if ("flow" in s) {
    const at = pb.rec ? pointerAt(pb.rec.moves, recT(pb, f)) : null;
    return (
      <AbsoluteFill style={dark}>
        <FlowRecording src={`${folder(s.flow)}/frames.json`} from={pb.from - (pb.S / FPS) * pb.speed} speed={pb.speed} pointer={false} />
        {at?.p && f >= pb.S ? <PointerAt x={at.p.x} y={at.p.y} since={at.since} accent={RED} size={64} opacity={k(f, pb.S, pb.S + 4, OUT)} /> : null}
      </AbsoluteFill>
    );
  }
  if ("page" in s) {
    if (!pb.part) return <AbsoluteFill style={dark} />;
    return <AbsoluteFill style={dark}><LivePart f={f} dir={`${folder(s.page)}/${s.part}`} m={pb.part} scale={1} timing={pageTiming(pb)} radius={0} shadow={false} /></AbsoluteFill>;
  }
  if ("still" in s) return <AbsoluteFill style={dark}><Img src={staticFile(s.still)} style={{ width: SW, height: SH, objectFit: "cover" }} /></AbsoluteFill>;
  return <RedLogo f={f} at={pb.S + 2} />;
};

const Monitor: React.FC<{ f: number; plan: Plan; has?: Loaded["has"] }> = ({ f, plan, has }) => {
  const { beats, E, total } = plan;
  if (!beats.length) return <RedFill />;
  const last = beats[beats.length - 1];
  if (f >= E) {
    const clear = k(f, E + 2, E + 20, (t) => t);
    return clear < 1 ? <PixelDissolve progress={clear} width={SW} height={SH} cell={60} band={0.3} direction="random" colors={["#E4404F", "#F0636E", "#F59AA1"]} seed="end" from={<RedFill />} to={<EndLogo f={f} E={E} total={total} />} /> : <EndLogo f={f} E={E} total={total} />;
  }
  if (f >= E - TR_BIG) return <PixelDissolve progress={k(f, E - TR_BIG, E, (t) => t)} width={SW} height={SH} cell={60} band={0.5} colors={BLOCK_REDS} seed="close" from={<Content f={f} pb={last} has={has} />} to={<RedFill />} />;
  let i = 0;
  for (let j = 1; j < beats.length; j++) if (f >= beats[j].S - beats[j].trIn) i = j;
  const cur = beats[i];
  const now = <Content f={f} pb={cur} has={has} />;
  if (i === 0) {
    const p = k(f, -22, 10, (t) => t); // frame 0: red blocks already clearing off the first screen
    return p < 1 ? <PixelDissolve progress={p} width={SW} height={SH} cell={60} band={0.45} colors={BLOCK_REDS} seed="open" from={<RedFill />} to={now} /> : now;
  }
  const prev = <Content f={f} pb={beats[i - 1]} has={has} />;
  if (cur.enter === "dissolve" && f < cur.S) {
    return <PixelDissolve progress={k(f, cur.S - cur.trIn, cur.S, (t) => t)} width={SW} height={SH} cell={60} band={cur.kind === "logo" ? 0.5 : 0.4} colors={BLOCK_REDS} seed={`b${i}`} from={prev} to={now} />;
  }
  if (cur.enter === "lift" && f < cur.S + LIFT) {
    const x = k(f, cur.S, cur.S + LIFT, IN);
    return (
      <AbsoluteFill>
        {now}
        <AbsoluteFill style={{ opacity: 1 - x, transform: `translateY(${-10 * x}px)`, filter: `blur(${5 * x}px)` }}>{prev}</AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return now;
};

/* ================================================================ the camera and the light */

const PLATE = { plate: "post-keynote-monitor/room.png", screen: [[25, 473], [1040, 558], [1024, 1077], [31, 1115]] as Quad };
const DROP = 270; // the camera sits low, so the monitor fills the lower half and the words own the top
const WORDS_BOTTOM = 720; // the words sit just above the monitor's top edge

const projector = (quad: Quad) => (x: number, y: number): [number, number] => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den, h = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  const u = x / SW, v = y / SH, w = g * u + h * v + 1;
  return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w];
};

type PushF = { a: number; b: number; c: number; d: number; pt: [number, number]; s: number };
const pushes = (plan: Plan): PushF[] => {
  const out: PushF[] = [];
  plan.beats.forEach((pb) => {
    if (pb.beat.push === false) return;
    let p: Push | null = pb.beat.push ?? null;
    if (!p && pb.kind === "chat") p = { x: 850, y: 400, scale: 1.45, at: pb.mark("send") !== null ? "send+0.72" : 1.2 };
    if (!p && pb.kind === "flow") {
      const m = pb.rec?.moves.find((mv) => mv.click !== undefined);
      if (m) p = { x: Math.max(360, m.to.x - 260), y: m.to.y - 10, scale: 1.9, at: "press", hold: 0.1 };
    }
    if (!p) return;
    const b = Math.round(whenF(pb, p.at, pb.S + 30));
    const c = p.hold !== undefined ? b + Math.round(p.hold * FPS) : pb.S + pb.own - 18;
    if (c <= b - 1) return;
    out.push({ a: b - 14, b, c, d: c + 13, pt: [p.x, p.y], s: p.scale ?? 1.45 });
  });
  return out;
};
const pushAt = (list: PushF[], f: number) => {
  for (const q of list) {
    const w = k(f, q.a, q.b, SWING) - k(f, q.c, q.d, SWING);
    if (w > 0) return { w, q };
  }
  return { w: 0, q: null as PushF | null };
};

const COOL = { rgb: "236, 240, 248", level: 0.62 };
const PRODUCT = { rgb: "170, 70, 80", level: 0.42 }; // the product's own dark red ground
const lightAt = (plan: Plan, f: number) => {
  const { beats, E } = plan;
  if (f >= E + 12) return COOL;
  if (f >= E - TR_BIG + 6) return { rgb: RED_RGB, level: 1 };
  let i = 0;
  for (let j = 1; j < beats.length; j++) if (f >= beats[j].S - beats[j].trIn / 2 - (beats[j].kind === "logo" ? 1 : 0)) i = j;
  const kd = beats[i]?.kind;
  if (kd === "logo") return { rgb: RED_RGB, level: 1 };
  if (kd === "title") return COOL;
  return PRODUCT;
};

const Room: React.FC<{ f: number; plan: Plan; list: PushF[]; room: MonitorTourProps["room"]; has?: Loaded["has"] }> = ({ f, plan, list, room, has }) => {
  // the room photo is gitignored, so on a Mac without it the room drawn in code stands in
  const drawn = room === "drawn" || has?.plate === false;
  const quad: Quad = drawn ? DESK_SOLO.screen : (room as { screen: Quad } | undefined)?.screen ?? PLATE.screen;
  const project = projector(quad);
  const mid = project(SW / 2, SH / 2);
  const { w, q } = pushAt(list, f);
  const s = (0.94 + 0.012 * k(f, 0, 90, SWING) + 0.02 * (f / plan.total)) * (1 + ((q?.s ?? 1) - 1) * w);
  const tp = q ? project(q.pt[0], q.pt[1]) : mid;
  const p: [number, number] = [mix(mid[0], tp[0], w), mix(mid[1], tp[1], w)];
  const c: [number, number] = [540 + 3 * Math.sin(f / 70), mix(mid[1] + DROP - 10 * k(f, 0, 90, SWING), 1240, w) + 2 * Math.sin(f / 95)];
  const light = lightAt(plan, f);
  const plate = drawn ? undefined : { src: (room as { plate: string } | undefined)?.plate ?? PLATE.plate, screen: quad };
  return (
    <AbsoluteFill style={{ transform: `translate(${c[0] - s * p[0]}px, ${c[1] - s * p[1]}px) scale(${s})`, transformOrigin: "0 0" }}>
      <ScreenStage screen={<Monitor f={f} plan={plan} has={has} />} screenSize={[SW, SH]} laptop={null} light={light} plate={plate} grain={0.08} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 22% at 50% 64%, rgba(${light.rgb}, ${0.2 * light.level}) 0%, rgba(0,0,0,0) 70%)`, mixBlendMode: "screen", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 26% at 50% 41%, rgba(${light.rgb}, ${0.1 * light.level}) 0%, rgba(0,0,0,0) 72%)`, mixBlendMode: "screen", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

/* ================================================================ the words and graphics above the monitor */

const Words: React.FC<{ f: number; plan: Plan; blocks: Block[]; labelText: string; endText: string }> = ({ f, plan, blocks, labelText, endText }) => {
  const { E } = plan;
  const out: React.ReactNode[] = [];
  blocks.forEach((b, i) => {
    if (f < b.at - 1 || f >= b.out) return;
    const x = k(f, b.out - 5, b.out, IN);
    out.push(
      <div key={`b${i}`} style={{ position: "absolute", left: 40, right: 40, bottom: MT_H - WORDS_BOTTOM, display: "flex", justifyContent: "center", opacity: 1 - x, transform: `translateY(${-24 * x}px)`, filter: x > 0 ? `blur(${6 * x}px)` : undefined }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          {b.lines.map((l, j) => <Line key={j} f={f} at={l.at} text={l.say.text} size={l.say.size} style={{ justifyContent: "center" }} />)}
        </div>
      </div>,
    );
  });
  const e = k(f, E + 18, E + 32, OUT);
  if (e > 0) out.push(
    <div key="end" style={{ position: "absolute", left: 40, right: 40, bottom: MT_H - WORDS_BOTTOM, textAlign: "center", fontFamily: geist, fontWeight: 600, fontSize: 70, letterSpacing: -1, lineHeight: 1.2, color: "#fff", opacity: e, transform: `translateY(${(1 - e) * 14}px)` }}>
      {endText.replace(/[[\]]/g, "").split("\n").map((t, i) => <div key={i}>{t}</div>)}
    </div>,
  );
  const cap = 1 - k(f, E + 4, E + 12, IN);
  if (labelText && cap > 0) out.push(
    <div key="label" style={{ position: "absolute", top: 100, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: cap }}>
      <div style={{ background: "#fff", color: "#000", fontFamily: geist, fontWeight: 700, fontSize: 50, letterSpacing: -0.6, lineHeight: 1.12, padding: "4px 18px", borderRadius: 6 }}>{labelText}</div>
    </div>,
  );
  return <>{out}</>;
};

const Sides: React.FC<{ f: number; lines: LineT[]; blocks: Block[] }> = ({ f, lines, blocks }) => (
  <>
    {lines.map((l, li) => {
      if (!l.say.sides?.length) return null;
      const block = blocks.find((b) => b.lines.includes(l));
      const out = block?.out ?? l.at + 60;
      return l.say.sides.slice(0, 3).map((sd, j) => {
        if (!sd) return null;
        const name = typeof sd === "string" ? sd : sd.icon;
        const red = typeof sd === "object" && sd.red;
        const [x, y, rot] = SIDE_AT[j];
        return <DrawIcon key={`${li}-${j}`} name={name} size={92} f={f} at={l.at + 2 + j * 4} out={out} x={x} y={y} rot={rot} bob={5} color={red ? RED : "#fff"} />;
      });
    })}
  </>
);

/* ================================================================ sound: each effect set so its loudest sample lands on its frame */

const PEAK: Record<string, number> = {
  "ui-click-tone": 0, "ui-select-modern": 0, "ui-popup-dry": 1, "click-like-button": 1, "ui-confirm-bleep": 6,
  "swoosh-quick": 9, "swoosh-quick-accent": 3, "sweep-digital": 11, "riser-short-noise": 82,
  "marker-pen-line": 4, "bass-hit-short": 3, "chime-crystal": 7, "counter": 3, "transition-soft": 13,
  "notification-bubble-pop": 7, "ding-notification": 5, "sweep-fast-small": 8, "whoosh-fast": 21, "typing-laptop": 0,
};
const STUDIO_SFX = new Set(["marker-pen-line", "bass-hit-short", "chime-crystal", "counter", "transition-soft"]);
type Hit = { at: number; name: string; vol: number; len?: number; trim?: number };
const Hits: React.FC<{ hits: Hit[]; p: MonitorTourProps }> = ({ hits, p }) => (
  <>
    {hits.map((h, i) => {
      const src = sfxPath(p, h.name);
      if (p.loaded?.has && !p.loaded.has.sfx[src]) return null; // not on this Mac: the cue is skipped
      const from = Math.max(0, Math.round(h.at - (PEAK[h.name] ?? 0) - OUTPUT_AUDIO_OFFSET_F));
      return (
        <Sequence key={i} from={from} durationInFrames={h.len} layout="none">
          <Audio src={staticFile(src)} trimBefore={h.trim} volume={h.len ? (fr) => h.vol * (h.trim
            ? interpolate(fr, [0, 2, h.len! - 6, h.len!], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
            : interpolate(fr, [h.len! - 6, h.len!], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) : h.vol} />
        </Sequence>
      );
    })}
  </>
);

const soundHits = (plan: Plan, lines: LineT[], segs: GSeg[], end: { at: number } | null): Hit[] => {
  const hits: Hit[] = [{ at: 4, name: "sweep-digital", vol: 0.32 }];
  lines.forEach((l) => {
    const t = boxAt(l.say.text, l.at);
    if (t !== null && t >= 0) hits.push({ at: t, name: "marker-pen-line", vol: 0.2, len: 12 });
  });
  segs.forEach((s) => {
    hits.push({ at: s.at + 3, name: "ui-popup-dry", vol: 0.24 });
    if (typeof s.g === "object" && "pills" in s.g) s.g.pills.slice(0, 3).forEach((_, i) => hits.push({ at: s.at + 2 + i * 8, name: "click-like-button", vol: 0.35 }));
    if (typeof s.g === "object" && ("count" in s.g || "ring" in s.g)) hits.push({ at: s.at + 4, name: "counter", vol: 0.5 });
  });
  if (end) hits.push({ at: end.at + 3, name: "ui-popup-dry", vol: 0.24 });
  plan.beats.forEach((pb) => {
    if (pb.i > 0 && pb.enter === "dissolve") {
      hits.push({ at: pb.S - pb.trIn + 7, name: "sweep-digital", vol: 0.34 });
      hits.push({ at: pb.S - pb.trIn + 2, name: "swoosh-quick-accent", vol: 0.28 });
    }
    if (pb.enter === "lift") hits.push({ at: pb.S + 2, name: "whoosh-fast", vol: 0.3 });
    if (pb.kind === "chat") {
      const ts = pb.mark("typeStart"), send = pb.mark("send");
      if (send !== null) {
        const a = Math.max(pb.S - pb.trIn, ts ?? pb.S);
        const len = Math.round(send - a - 4);
        if (len > 6) hits.push({ at: Math.round(a), name: "typing-laptop", vol: 0.32, trim: 45, len });
        hits.push({ at: send, name: "notification-bubble-pop", vol: 0.34 });
        hits.push({ at: send + 16, name: "ui-popup-dry", vol: 0.22 });
        [0, 1, 2, 3].forEach((i) => hits.push({ at: send + 24 + i * 6, name: i % 2 ? "ui-select-modern" : "ui-click-tone", vol: 0.1, len: 8 }));
      }
    }
    if (pb.kind === "page" && pb.part) {
      const rows = liveTimes(pb.part, pageTiming(pb)).filter((t) => Number.isFinite(t)).sort((a, b) => a - b);
      let last = -99, n = 0;
      rows.forEach((t, i) => {
        if (i % 6 === 0 && t - last >= 2) {
          hits.push({ at: Math.round(t) + 1, name: n++ % 2 ? "ui-select-modern" : "ui-click-tone", vol: 0.1, len: 8 });
          last = t;
        }
      });
    }
    if (pb.kind === "logo") hits.push({ at: pb.S + 4, name: "bass-hit-short", vol: 0.45 });
    if (pb.kind === "flow") {
      const press = pb.mark("press");
      if (press !== null) {
        hits.push({ at: press, name: "click-like-button", vol: 0.9 });
        hits.push({ at: press + 3, name: "sweep-fast-small", vol: 0.26 });
        hits.push({ at: press + 19, name: "ui-confirm-bleep", vol: 0.32 });
      }
    }
  });
  hits.push({ at: plan.E - TR_BIG + 9, name: "sweep-digital", vol: 0.42 });
  hits.push({ at: plan.E + 14, name: "riser-short-noise", vol: 0.3 });
  hits.push({ at: plan.E + 14, name: "chime-crystal", vol: 0.42 });
  return hits.filter((h) => h.at >= 0 && h.at < plan.total).map((h) => ({ ...h, at: Math.round(h.at) }));
};

/* ================================================================ the film */

export const MonitorTour: React.FC<MonitorTourProps> = (props) => {
  const f = useCurrentFrame();
  const plan = React.useMemo(() => planMonitorTour(props), [props]);
  const { lines, blocks } = React.useMemo(() => timeline(plan), [plan]);
  const { segs, end } = React.useMemo(() => graphics(plan, lines, props.end.graphic), [plan, lines, props.end]);
  const list = React.useMemo(() => pushes(plan), [plan]);
  const hits = React.useMemo(() => (props.sound === false ? [] : soundHits(plan, lines, segs, end)), [plan, lines, segs, end, props.sound]);
  const pw = pushAt(list, f).w;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Room f={f} plan={plan} list={list} room={props.room} has={props.loaded?.has} />
      {/* while the camera is close the screen reaches up under the words: a dark fade keeps them on black */}
      {pw > 0 ? <AbsoluteFill style={{ opacity: pw, background: "linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.9) 34%, rgba(0,0,0,0) 46%)" }} /> : null}
      <Words f={f} plan={plan} blocks={blocks} labelText={props.label} endText={props.end.text} />
      {segs.map((s, i) => <GraphicView key={i} f={f} s={s} />)}
      {end ? <GraphicView f={f} s={end} /> : null}
      <Sides f={f} lines={lines} blocks={blocks} />
      {props.music && props.loaded?.has?.music !== false ? <Bed total={plan.total} on volume={props.music.volume ?? 0.3} track={props.music.track} /> : null}
      <Hits hits={hits} p={props} />
    </AbsoluteFill>
  );
};
