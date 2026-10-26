/**
 * The type film's script and clock (2026-10-25). Pure data and arithmetic, no React, so the timeline can be
 * printed and checked without rendering (see films/type-film/brief.md).
 *
 * Four thoughts a student has in their head, each one typed, then re-set as the real heading of the place in
 * CampusAI that answers it. The words that survive the re-set carry an `id` in both lines; everything else leaves
 * or arrives. Every answer string is read off a real capture in public/pass (box in the comment beside it).
 *
 * Clock rules (numbers from the studio rules and the shelf):
 *   - typing 1.5 frames a character (shelf `typewriter-moves`, its fast pass)
 *   - each question then holds fully typed for letters / 15 + 1.5 s, never under 1.8 s (studio reading rule)
 *   - the re-set (morph) 14 f, then the flight onto the page 24 f (shelf `title-demote-to-label`: one continuous
 *     move, bezier(.6, 0, .18, 1), 26 f; two frames shorter here because the words are already small-ish)
 *   - every landing waits for the music: Q1 to Q3 land on the next half beat of slow-walk, Q4 on the next beat,
 *     and Q4 starts typing on the downbeat where the track goes full (track 21.33 s, film 20.0 s)
 *   - the page then holds at least 40 f, longer if the answer's own reading time needs it
 */
import type { PageCam } from "../../kit/camera";

/** A piece of a line. `sp` puts a space after it. Pieces with the same `id` in question and answer are the same words. */
export type Tok = { t: string; id?: string; sp?: boolean };

export type Target = {
  /** Under public/. */
  src: string;
  page: { w: number; h: number };
  /** The real heading on the page, CSS px: left edge, baseline, cap height, right edge (measured from pixels). */
  x: number;
  base: number;
  capH: number;
  right: number;
  /** Where the caret rests on the page: after the heading, or at the start of an empty field. */
  caret: "end" | "start";
  caretX?: number;
  /** The sidebar's own name for the page (public/pass/*.json nav boxes). */
  place: string;
  /** The page colour behind the heading, left and right (sampled from the capture), for the patch that hides the
   *  real heading until the flying line reaches it, so the two never show at once. */
  bg: [string, string];
  /** Final camera at the landing, per aspect. Each right edge sits in a column gutter (CSS x 828 between the dashboard's
   *  ask cards and between the events columns, 713 beside the job list, 1112 after the Events ask card) (checked with
   *  tools/pixel-cutcheck.py, 2026-10-25 lead review: no word sliced at the frame edge); only full-width sentence
   *  lines still run past it, and the view fades them out over its last 44 px. */
  cam: { v: PageCam; w: PageCam };
};

export type Thought = { q: Tok[]; a: Tok[]; target: Target };

const DASH = { src: "pass/dashboard-tall.jpg", page: { w: 1440, h: 1565 } };

export const THOUGHTS: Thought[] = [
  {
    // dashboard.json heading "Your week" (281, 117); glyphs measured x 281.5 to 346, cap 121.5 to 131
    q: [{ t: "What's", sp: true }, { t: "due", sp: true }, { t: "this", sp: true }, { t: "week", id: "week" }, { t: "?" }],
    a: [{ t: "Your", sp: true }, { t: "week", id: "week" }],
    target: {
      ...DASH, x: 281.5, base: 131, capH: 9.5, right: 346, caret: "end", place: "Dashboard", bg: ["rgb(24, 23, 29)", "rgb(24, 23, 29)"],
      cam: { v: { cx: 545, cy: 424.1, cw: 566 }, w: { cx: 826, cy: 354.1, cw: 1128 } },
    },
  },
  {
    // jobmatch.json heading "Jobs for you" (269, 101); glyphs x 269.5 to 385.5, cap 108 to 123
    q: [{ t: "Any", sp: true }, { t: "j" }, { t: "obs", id: "obs", sp: true }, { t: "for", id: "for", sp: true }, { t: "me?" }],
    a: [{ t: "J" }, { t: "obs", id: "obs", sp: true }, { t: "for", id: "for", sp: true }, { t: "you" }],
    target: {
      src: "pass/jobmatch.jpg", page: { w: 1440, h: 900 }, x: 269.5, base: 123, capH: 15, right: 385.5, caret: "end",
      place: "Job Match", bg: ["rgb(39, 25, 24)", "rgb(45, 25, 26)"],
      cam: { v: { cx: 487.5, cy: 383.2, cw: 451 }, w: { cx: 828.5, cy: 378.5, cw: 1133 } },
    },
  },
  {
    // events capture, "Recommended for you" under "Personalized"; glyphs x 249 to 441.5, cap 172.5 to 186
    q: [{ t: "Any", sp: true }, { t: "events", sp: true }, { t: "for", id: "for", sp: true }, { t: "me?" }],
    a: [{ t: "Recommended", sp: true }, { t: "for", id: "for", sp: true }, { t: "you" }],
    target: {
      src: "pass/events.jpg", page: { w: 1440, h: 900 }, x: 249, base: 186, capH: 13.5, right: 441.5, caret: "end",
      place: "Events", bg: ["rgb(21, 11, 10)", "rgb(39, 10, 14)"],
      cam: { v: { cx: 534, cy: 468.3, cw: 588 }, w: { cx: 827, cy: 374.5, cw: 1174 } },
    },
  },
  {
    // dashboard, the Ask CampusAI field's placeholder "Ask CampusAI anything..."; glyphs x 270.5 to 422, cap 634 to 643
    q: [{ t: "Every" }, { t: "thing", id: "thing", sp: true }, { t: "else?" }],
    a: [{ t: "Ask", sp: true }, { t: "CampusAI", sp: true }, { t: "any" }, { t: "thing", id: "thing" }, { t: "..." }],
    target: {
      ...DASH, x: 270.5, base: 643, capH: 9.5, right: 422, caret: "start", caretX: 267, place: "Dashboard", bg: ["rgb(43, 31, 33)", "rgb(43, 31, 33)"],
      cam: { v: { cx: 543, cy: 805.8, cw: 570 }, w: { cx: 685, cy: 638.8, cw: 854 } },
    },
  },
];

/** The address under the end logo, typed by the same caret (rules.json end.url). */
export const URL_TEXT = "campusai.app";

export const MUSIC = { track: "slow-walk", startAt: 40 / 30 };

export const F = {
  type: 1.5,
  morph: 14,
  travel: 24,
  ret: 12,
  holdMin: 40,
  urlType: 1.5,
  endHold: 80,
  first: 3,
};

export const textOf = (toks: Tok[]) => toks.map((k) => k.t + (k.sp ? " " : "")).join("").trimEnd();
const letters = (s: string) => s.match(/[\p{L}\p{N}]/gu)?.length ?? 0;
export const readF = (s: string, fps = 30) => Math.ceil(Math.max(1.8, letters(s) / 15 + 1.5) * fps);

export type Beat = {
  i: number;
  typeStart: number;
  typedEnd: number;
  morphStart: number;
  travelStart: number;
  land: number;
  /** The page starts to leave (the return to the next thought, or the end). */
  leave: number;
};

export type Clock = {
  beats: Beat[];
  endStart: number;
  logoSettle: number;
  logoLand: number;
  urlStart: number;
  duration: number;
};

/**
 * `beatAt(n)` is the film frame of beat n of the track (fractional), as `beatGrid(...).beatFrame`. The grid of
 * slow-walk from 1.333 s lands every beat on a multiple of 20 frames and every downbeat on 40 + 80k.
 */
export function makeClock(beatAt: (n: number) => number): Clock {
  const onOrAfter = (frame: number, step: number) => {
    // smallest grid point (beats subdivided by `step`) at or after `frame`
    let n = Math.floor(-50 / step);
    for (; ; n++) {
      const t = Math.round(beatAt(n * step));
      if (t >= frame) return t;
    }
  };
  const beats: Beat[] = [];
  let start = F.first;
  THOUGHTS.forEach((th, i) => {
    const q = textOf(th.q);
    const a = textOf(th.a);
    if (i === 3) {
      // the turn of the film starts on the downbeat where the track goes full
      // (only when it is within half a second; pulling it earlier shortens the previous page hold, never below 36 f)
      const full = onOrAfter(start - 16, 4);
      const prev = beats[i - 1];
      if (full - start <= 16 && full - F.ret - prev.land >= 36) {
        prev.leave = full - F.ret;
        start = full;
      }
    }
    const typedEnd = start + Math.ceil(q.length * F.type);
    const holdEnd = typedEnd + readF(q);
    const land = onOrAfter(holdEnd + F.morph + F.travel, i === 3 ? 1 : 0.5);
    const travelStart = land - F.travel;
    const morphStart = travelStart - F.morph;
    const pageHold = Math.max(F.holdMin, readF(a) - F.travel);
    const leave = land + pageHold;
    beats.push({ i, typeStart: start, typedEnd, morphStart, travelStart, land, leave });
    start = leave + F.ret;
  });
  const last = beats[beats.length - 1];
  const endStart = last.leave;
  const logoLand = onOrAfter(endStart + 18, 1);
  const logoSettle = logoLand - 16; // LogoOpen settles over 16 frames
  const urlStart = logoSettle + 6; // typed while the logo settles, so the address holds its full reading time
  return { beats, endStart, logoSettle, logoLand, urlStart, duration: logoLand + F.endHold };
}
