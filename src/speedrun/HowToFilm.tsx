/**
 * CampusAI, "How to find an internship that actually fits you" (2026-10-22, draft 6 of film 1).
 * 9:16, 30fps, about 53s, music and sound. Brief, facts and shot list: content/video-studio/films/howto-internship/.
 *
 * Draft 6 (Jacob on draft 5): explain what the North Star is (a definition on the empty chip, then the picker's own
 * Job Match line); the job card moment holds ONE framing from the scroll through the skills (draft 5 panned and
 * zoomed right at the press); Tailor shows the student's own resume being fixed line by line. Every beat is a shelf
 * shot in src/shots/. The run is capture/howto-run.cjs (src/howto/take.json, public/howto/run).
 *
 * Notes sit in a band below the screen, never on the UI. Music: Mixkit "House Vibez" (free license).
 * 122.00 BPM, t0 7.938s, T 0.4918s; the film starts at music beat -4.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { INTER, useZodiak } from "../kit/parts";
import { PillChipHook } from "../shots/pill-chip-slot-cycle-handled/PillChipHook";
import { SteepTiltGlideIn } from "../shots/steep-tilt-glide/SteepTiltGlideIn";
import { JobScrollBrake } from "../shots/scroll-brake-moves/JobScrollBrake";
import { WhyDepthLayers } from "../shots/depth-layer-moves/WhyDepthLayers";
import { PostingScan } from "../shots/scanline-annotate-focus/PostingScan";
import { ContactLift } from "../shots/element-body-moves/ContactLift";
import { ResumeRewrite } from "../shots/document-typewriter-reveal/ResumeRewrite";
import { ApplyBounce } from "../shots/icon-performance-moves/ApplyBounce";
import { StripAwayToLogo } from "../shots/ui-strip-away-outro/StripAwayToLogo";
import take from "../howto/take.json";

export const HOWTO_FPS = 30;
export const HOWTO_SIZE = { width: 1080, height: 1920 };

// ---------- beat grid ----------
const MUSIC_T0 = 7.938;
const MUSIC_T = 0.4918;
const START_BEAT = -4;
const MUSIC_TRIM = Math.round((MUSIC_T0 + START_BEAT * MUSIC_T) * HOWTO_FPS);
const OFFSET_S = MUSIC_T0 + START_BEAT * MUSIC_T - MUSIC_TRIM / HOWTO_FPS;
const B = (n: number) => (OFFSET_S + n * MUSIC_T) * HOWTO_FPS;
const END_BEAT = 111.5;
export const HOWTO_FRAMES = Math.round(B(END_BEAT));

const RED = "#E8293B";
const BG = "#0b0708";
const PATCH = "#231519"; // the job detail panel colour round Apply
const ZODIAK = "Zodiak, serif";
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE = Easing.bezier(0.23, 1, 0.32, 1);
const ramp = (f: number, a: number, b: number, e = EASE) => interpolate(f, [a, b], [0, 1], { ...CLAMP, easing: e });

// ---------- the run ----------
type Move = { from: { x: number; y: number }; to: { x: number; y: number }; start: number; end: number; click?: number };
type Box = { x: number; y: number; w: number; h: number };
const M = take.marks as Record<string, number>;
const MOVES = take.moves as Move[];
const BOXES = take.boxes as Record<string, Box>;
const FRAMES = take.frames as [number, string][];
const S0 = M.start;
const r = (k: string) => M[k] - S0; // run seconds of a mark
const RUN_END = r("apply");
const AP = BOXES.apply;

/** The film's shots in beats. `play` advances the run; the others hold or replace it while a shelf shot runs. */
type Kind = "glide" | "cue" | "play" | "moves" | "brake" | "depth" | "skills" | "scan" | "resume" | "bounce" | "strip";
type Seg = { b0: number; b1: number; r0: number; r1: number; kind: Kind };
const at = (b0: number, b1: number, rs: number, kind: Kind): Seg => ({ b0, b1, r0: rs, r1: rs, kind });
const play = (b0: number, b1: number, r0: number, r1: number): Seg => ({ b0, b1, r0, r1, kind: "play" });
const SEGS: Seg[] = [
  at(9, 13, 0, "glide"), // 1 Pick your North Star
  at(13, 18, 0.3, "cue"),
  play(18, 35.5, 0.3, r("role3Picked") + 1.0),
  at(35.5, 41, r("role3Picked") + 1.0, "moves"),
  at(41, 47, r("scrollEnd"), "brake"), // 2 Find jobs that fit you
  play(47, 50, r("goldmanOpen") - 0.7, r("why") + 0.3),
  at(50, 57, r("why") + 0.3, "depth"),
  play(57, 59, r("why") + 0.3, r("skills") + 0.4),
  at(59, 65, r("skills") + 0.4, "skills"),
  play(65, 68.5, r("tailorPressed") - 1.1, r("tailorPressed") + 0.4), // 3 Tailor
  at(68.5, 81.5, r("tailorDone") + 0.5, "scan"), // both result cards held 1.5s before the resume (review round 1)
  at(81.5, 93.5, r("tailorDone") + 0.5, "resume"),
  play(93.5, 96, r("back") + 0.2, r("back") + 1.0), // 4 Apply
  { b0: 96, b1: 101.5, r0: r("back") + 1.0, r1: RUN_END, kind: "bounce" },
  at(101.5, END_BEAT, RUN_END, "strip"),
];
const segAt = (f: number) => SEGS.find((s) => f >= B(s.b0) && f < B(s.b1));
const runAt = (f: number) => {
  const s = segAt(f);
  if (!s) return f < B(9) ? 0 : RUN_END;
  return interpolate(f, [B(s.b0), B(s.b1)], [s.r0, s.r1], CLAMP);
};
/** Film frame where run second `rs` plays, if a play segment shows it. */
const frameOfRun = (rs: number) => {
  const s = SEGS.find((g) => g.kind === "play" && rs >= g.r0 && rs <= g.r1);
  return s ? interpolate(rs, [s.r0, s.r1], [B(s.b0), B(s.b1)]) : null;
};

const frameSrc = (rs: number) => {
  const t = rs + S0;
  let lo = 0, hi = FRAMES.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (FRAMES[mid][0] <= t) lo = mid; else hi = mid - 1; }
  return staticFile(`howto/run/${FRAMES[lo][1]}`);
};
const cursorAt = (rs: number) => {
  const t = rs + S0;
  let pos = { x: 760, y: 620 }, click: number | null = null;
  for (const m of MOVES) {
    if (t < m.start) break;
    if (t < m.end) { const e = 1 - Math.pow(1 - (t - m.start) / (m.end - m.start), 3); pos = { x: m.from.x + (m.to.x - m.from.x) * e, y: m.from.y + (m.to.y - m.from.y) * e }; }
    else pos = m.to;
    if (m.click !== undefined && t >= m.click) click = m.click;
  }
  return { ...pos, since: click !== null && t - click < 0.6 ? t - click : null };
};

// ---------- layout ----------
// The screen is taller than draft 3 (the step line is plain text now) so the product reads bigger.
const VIEW = { x: 24, y: 340, w: 1032, h: 1200 }; // notes clear of the Reels/TikTok bottom overlay (review round 1)
const NOTE_Y = VIEW.y + VIEW.h + 40; // notes sit in their own band, never on the UI
type Cam = { cx: number; cy: number; cw: number };
const ZOOM: [number, number][] = [
  [0, 760], [r("pickerClosed") + 0.1, 760], [r("scrollEnd") - 0.1, 1040], [r("tailorPressed") - 1.1, 1040],
  [r("tailorPressed") - 0.4, 820], [r("tailorDone"), 820], [r("back"), 800], [RUN_END - 0.5, 760],
];
const LOOK: { r0: number; r1: number; x: number; y: number }[] = [
  // ONE framing from the scroll through the press, the open, Why this fits you and the skills (draft 5 panned and
  // zoomed right at the press, which is what read as not smooth)
  { r0: r("pickerClosed") + 0.1, r1: r("skills") + 1.0, x: 740, y: 450 },
  { r0: r("tailorPressed") - 1.2, r1: r("tailorPressed") + 0.5, x: 900, y: 380 }, // Tailor resume
  { r0: r("back") + 0.1, r1: RUN_END + 5, x: AP.x + 300, y: AP.y + 120 }, // Apply, with Goldman's whole title in frame
];
/** Step 1 holds ONE framing, the picker's left pane and the Aiming for chip, so typing never pans (draft 4 swung left). */
const PICKER_CAM = { cx: 620, cy: 450, cw: 760 };
/** After the third pick the camera eases right once, 0.8s, to the picker's What it moves panel. */
const PANEL_CAM = { cx: 900, cy: 450, cw: 760 };
const lerpTable = (t: [number, number][], x: number) => {
  if (x <= t[0][0]) return t[0][1];
  for (let i = 0; i < t.length - 1; i++) if (x < t[i + 1][0]) return t[i][1] + (t[i + 1][1] - t[i][1]) * EASE((x - t[i][0]) / (t[i + 1][0] - t[i][0]));
  return t[t.length - 1][1];
};
const clampCam = (c: Cam): Cam => {
  const ch = c.cw * (VIEW.h / VIEW.w);
  const cx = c.cw >= 1440 ? 720 : Math.min(1440 - c.cw / 2, Math.max(c.cw / 2, c.cx));
  const cy = ch >= 900 ? 450 : Math.min(900 - ch / 2, Math.max(ch / 2, c.cy)); // wider than the page: centre it
  return { cw: c.cw, cx, cy };
};
const camAt = (rs: number): Cam => {
  const pan0 = r("role3Picked") + 0.15;
  if (rs <= pan0) return clampCam(PICKER_CAM);
  if (rs <= r("pickerClosed") + 0.1) {
    const k = EASE(Math.min(1, (rs - pan0) / 0.8));
    return clampCam({ cx: PICKER_CAM.cx + (PANEL_CAM.cx - PICKER_CAM.cx) * k, cy: 450, cw: 760 });
  }
  const cw = lerpTable(ZOOM, rs);
  // the cursor, lagged and averaged, so the camera eases after the hand instead of jerking with it
  let x = 0, y = 0;
  for (let i = 0; i < 6; i++) { const c = cursorAt(Math.max(0, rs - 0.08 * i)); x += c.x / 6; y += c.y / 6; }
  for (const l of LOOK) {
    const k = Math.min(l.r0 < 0 ? 1 : ramp(rs, l.r0, l.r0 + 0.35), 1 - ramp(rs, l.r1 - 0.35, l.r1));
    x += (l.x - x) * k; y += (l.y - y) * k;
  }
  return clampCam({ cx: x, cy: y, cw });
};
const toCanvas = (cam: Cam, x: number, y: number) => {
  const s = VIEW.w / cam.cw;
  return { x: VIEW.x + VIEW.w / 2 + (x - cam.cx) * s, y: VIEW.y + VIEW.h / 2 + (y - cam.cy) * s, s };
};
const rectOf = (cam: Cam, b: Box) => { const p = toCanvas(cam, b.x, b.y); return { x: p.x, y: p.y, w: b.w * p.s, h: b.h * p.s }; };

// ---------- pieces ----------
/** The product screen, sized VIEW.w x VIEW.h. `inner` renders it at 0,0 for a shot that positions it itself. */
const Screen: React.FC<{ rs: number; cam: Cam; showHand: boolean; dim?: number; inner?: boolean; hideApply?: boolean }> = ({ rs, cam, showHand, dim = 0, inner, hideApply }) => {
  const s = VIEW.w / cam.cw;
  const o = toCanvas(cam, 0, 0);
  const c = cursorAt(rs);
  const h = toCanvas(cam, c.x, c.y);
  const press = c.since === null ? 1 : interpolate(c.since, [0, 0.08, 0.25], [0.86, 0.86, 1], CLAMP);
  const ring = c.since === null ? 1 : Math.min(1, c.since / 0.5);
  const ap = toCanvas(cam, AP.x - 2, AP.y - 2);
  return (
    <div style={{ position: "absolute", left: inner ? 0 : VIEW.x, top: inner ? 0 : VIEW.y, width: VIEW.w, height: VIEW.h, overflow: "hidden", borderRadius: 34,
      boxShadow: `0 0 0 1.5px rgba(255,255,255,.08), 0 40px 120px rgba(0,0,0,.6), 0 0 140px ${RED}22`, background: BG }}>
      <Img src={frameSrc(rs)} style={{ position: "absolute", left: o.x - VIEW.x, top: o.y - VIEW.y, width: 1440 * s, height: 900 * s, maxWidth: "none",
        filter: dim ? `brightness(${1 - dim * 0.72}) saturate(${1 - dim * 0.6}) blur(${dim > 0.8 ? 6 : dim * 3}px)` : undefined }} />
      {/* the picker's "N jobs fit your North Star, Evercore, JPMorgan..." tile: its employers are not all in the
          list, so it never reaches a frame (facts.md); painted over with the panel colour while the picker is open */}
      {rs >= r("pickerOpen") && rs <= r("pickerClosed") + 0.1 && (() => {
        const t = toCanvas(cam, 937, 117);
        return <div style={{ position: "absolute", left: t.x - VIEW.x, top: t.y - VIEW.y, width: 258 * s, height: 80 * s, background: "#211517", borderRadius: 14 * s }} />;
      })()}
      {/* the button's empty slot while the real one is out bouncing */}
      {hideApply && <div style={{ position: "absolute", left: ap.x - VIEW.x, top: ap.y - VIEW.y, width: (AP.w + 4) * s, height: (AP.h + 4) * s, background: PATCH, borderRadius: 8 * s }} />}
      {showHand && (
        <div style={{ position: "absolute", left: h.x - VIEW.x, top: h.y - VIEW.y }}>
          {c.since !== null && ring < 1 && (
            <div style={{ position: "absolute", left: 0, top: 0, width: 120 * ring, height: 120 * ring, transform: "translate(-50%,-50%)", borderRadius: "50%", border: `3px solid ${RED}`, opacity: 1 - ring }} />
          )}
          <svg width={58} height={58} viewBox="0 0 24 24" style={{ position: "absolute", left: -3, top: -3, transform: `scale(${press})`, transformOrigin: "3px 3px", filter: "drop-shadow(0 6px 10px rgba(0,0,0,.5))" }}>
            <path d="M3 2l15 8.2-6.6 1.7L8.6 18z" fill="#fff" stroke="#0b0708" strokeWidth={1.3} strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
};

/** A crop of a run frame at `s` canvas px per screen px. */
const Crop: React.FC<{ src: string; b: Box; s: number; style?: React.CSSProperties }> = ({ src, b, s, style }) => (
  <div style={{ position: "relative", width: b.w * s, height: b.h * s, overflow: "hidden", ...style }}>
    <Img src={src} style={{ position: "absolute", left: -b.x * s, top: -b.y * s, width: 1440 * s, height: 900 * s, maxWidth: "none" }} />
  </div>
);

/** The step line above the screen, plain text (Jacob: the icon tile read as generic). */
const STEPS: { n: number; t: string; b: number }[] = [
  { n: 1, t: "Pick your North Star", b: 9 },
  { n: 2, t: "Find jobs that fit you", b: 41 },
  { n: 3, t: "Tailor your resume for that job", b: 65 },
  { n: 4, t: "Apply", b: 93.5 },
];
const StepHeader: React.FC<{ f: number }> = ({ f }) => (
  <>
    {STEPS.map((st, i) => {
      const next = STEPS[i + 1]?.b ?? 101.5;
      if (f < B(st.b) - 1 || f > B(next) + 12) return null;
      const inn = ramp(f, B(st.b), B(st.b + 0.8));
      const out = ramp(f, B(next), B(next + 0.5));
      return (
        <div key={st.n} style={{ position: "absolute", left: 60, right: 60, top: 70, height: 230, display: "flex", flexDirection: "column", justifyContent: "center",
          opacity: inn * (1 - out), transform: `translateY(${(1 - inn) * 50 - out * 50}px)` }}>
          <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 32, color: "rgba(255,255,255,.55)", marginBottom: 8 }}>Step {st.n}</div>
          <div style={{ fontFamily: ZODIAK, fontWeight: 700, fontSize: 74, lineHeight: 1.04, letterSpacing: "-0.025em", color: "#fff" }}>{st.t}</div>
        </div>
      );
    })}
  </>
);

/** Notes under the screen, each with its own beat window. */
const NOTES: { b0: number; b1: number; text: React.ReactNode }[] = [
  { b0: 10, b1: 18.5, text: <>Your North Star is the job you want <span style={{ color: RED, fontStyle: "italic" }}>after college</span>.</> },
  { b0: 19, b1: 35.2, text: <>Type it, or tap <span style={{ color: RED, fontStyle: "italic" }}>a suggestion</span>.</> },
  { b0: 36, b1: 40.7, text: <>Every job gets <span style={{ color: RED, fontStyle: "italic" }}>ranked toward it</span>.</> },
  { b0: 41.5, b1: 49.7, text: <>Your jobs, ranked toward <span style={{ color: RED, fontStyle: "italic" }}>that goal</span>.</> },
  { b0: 50.5, b1: 56.7, text: <>Every job says <span style={{ color: RED, fontStyle: "italic" }}>why it fits you</span>.</> },
  { b0: 59.5, b1: 64.7, text: <>You already have <span style={{ color: RED, fontStyle: "italic" }}>4 of their 6 skills</span>.</> },
  { b0: 69, b1: 74.2, text: <>It reads the posting <span style={{ color: RED, fontStyle: "italic" }}>for you</span>.</> },
  { b0: 74.5, b1: 81.2, text: <>And finds what it <span style={{ color: RED, fontStyle: "italic" }}>keeps asking for</span>.</> },
  { b0: 82.5, b1: 93.2, text: <>Then fixes your resume, <span style={{ color: RED, fontStyle: "italic" }}>line by line</span>.</> },
  { b0: 94, b1: 101.2, text: <>Then apply, knowing <span style={{ color: RED, fontStyle: "italic" }}>why you fit</span>.</> },
];
const Notes: React.FC<{ f: number }> = ({ f }) => (
  <>
    {NOTES.map((n, i) => {
      if (f < B(n.b0) || f > B(n.b1)) return null;
      const show = ramp(f, B(n.b0), B(n.b0 + 0.7)) * (1 - ramp(f, B(n.b1 - 0.5), B(n.b1)));
      return (
        <div key={i} style={{ position: "absolute", left: 60, right: 60, top: NOTE_Y, opacity: show, transform: `translateY(${(1 - show) * 24}px)`, textAlign: "center",
          fontFamily: ZODIAK, fontWeight: 700, fontSize: 54, lineHeight: 1.1, letterSpacing: "-0.02em", color: "#fff" }}>
          {n.text}
        </div>
      );
    })}
  </>
);

// The tall list still for the scroll-brake (capture/howto-run.cjs writes it with its clip and Goldman's box, CSS px).
const LIST = { src: staticFile("howto/stills/list-tall.png"), w: 934, h: 6980, goldman: { y: (561 - 211) * 2, h: 194.9375 * 2 } };
// Why this fits you and the layers round it, on the frame where it is read (screen CSS px).
const DETAIL_HEAD: Box = { x: 742, y: 228, w: 624, h: 160 };
const WHY: Box = { x: 742, y: 398, w: 624, h: 200 };
const ABOUT: Box = { x: 742, y: 602, w: 624, h: 176 };
// The empty "Aiming for, Choose a role" chip, and the picker's Job Match line under What it moves.
const CUE: Box = { x: 788, y: 108, w: 216, h: 38 };
const MOVES_JM: Box = { x: 942, y: 232, w: 240, h: 60 };
// "Skills recruiters screen for, 4 of 6" once the detail has scrolled to it.
const SKILLS: Box = BOXES.skills;
// The job list column on the page (CSS px), where the tall still scrolls inside the web page.
const LIST_COL: Box = { x: 253, y: 211, w: 467.67, h: 900 - 211 };

// ---------- sound ----------
const a = (n: string) => staticFile(`speedrun/audio/${n}`);
const CUES: { at: number; src: string; v: number; name: string }[] = [
  { at: B(2) - 2, src: a("swoosh-quick.mp3"), v: 0.3, name: "hook" },
  { at: B(9) - 2, src: a("whoosh-swirl.mp3"), v: 0.35, name: "glide" },
  { at: B(13), src: a("paper-slide.mp3"), v: 0.35, name: "cue" },
  ...MOVES.flatMap((mv, i) => {
    const t = mv.click === undefined ? null : frameOfRun(mv.click - S0);
    return t === null ? [] : [{ at: t, src: a("switch-tap.mp3"), v: 0.25, name: `click ${i}` }];
  }),
  // one soft key per typed letter ("invest", then "management"; 0.14s apart, the last 0.65s before the mark)
  ...([["invest", "typed"], ["management", "typed2"]] as const).flatMap(([w, mk]) =>
    [...w].map((_, i) => {
      const t = frameOfRun(r(mk) - 0.65 - (w.length - 1 - i) * 0.14);
      return { at: t ?? 0, src: a("ui-tone-quick.mp3"), v: 0.1, name: `key ${mk} ${i}` };
    }),
  ),
  { at: B(35.5), src: a("paper-slide.mp3"), v: 0.35, name: "moves" },
  { at: B(42), src: a("whoosh-fast.mp3"), v: 0.35, name: "scroll" },
  { at: B(45), src: a("ui-select-click.mp3"), v: 0.35, name: "lock" },
  { at: B(50), src: a("paper-slide.mp3"), v: 0.4, name: "lift" },
  { at: B(59), src: a("paper-slide.mp3"), v: 0.35, name: "skills" },
  { at: B(68.5), src: a("data-scan.mp3"), v: 0.35, name: "scan" },
  { at: B(81.5), src: a("ui-tone-quick.mp3"), v: 0.2, name: "resume" },
  { at: B(101.5) - 8, src: a("ui-select-click.mp3"), v: 0.6, name: "apply" },
  { at: B(102), src: a("air-woosh-deep.mp3"), v: 0.4, name: "strip" },
  { at: B(104.5), src: a("impact-cine-big.mp3"), v: 0.5, name: "logo" },
];

// ---------- the film ----------
export const HowToFilm: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rs = runAt(f);
  const seg = segAt(f);
  const cam = camAt(rs);
  const local = seg ? f - B(seg.b0) : 0;
  const dur = seg ? B(seg.b1) - B(seg.b0) : 0;

  const logoIn = spring({ frame: f + 4, fps, config: { damping: 18 } });
  const logoOut = ramp(f, B(1.5), B(2));
  const headOut = ramp(f, B(101.5), B(102.2));

  const apRect = rectOf(cam, AP);
  const applyNode = <Crop src={frameSrc(RUN_END)} b={AP} s={apRect.w / AP.w} style={{ borderRadius: 7 * (apRect.w / AP.w) }} />;

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(1200px 900px at 50% 38%, ${RED}30, transparent 70%)` }} />

      {/* logo */}
      {f < B(2.2) && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - logoOut }}>
          <Img src={staticFile("brand/campusai-logo-white.svg")} style={{ width: 620, transform: `scale(${0.9 + 0.1 * logoIn}) translateY(${-60 * logoOut}px)`, filter: `blur(${(1 - logoIn) * 14}px)`, opacity: logoIn }} />
        </AbsoluteFill>
      )}

      {/* hook */}
      {f >= B(2) && f < B(9) && <PillChipHook f={f - B(2)} dur={B(9) - B(2)} prefix={["How to find an", "internship that"]} words={["pays well", "is remote", "actually fits you"]} />}


      {seg?.kind === "glide" && (
        <SteepTiltGlideIn f={local} dur={dur} view={VIEW}><Screen rs={0} cam={camAt(0)} showHand={false} inner /></SteepTiltGlideIn>
      )}
      {seg?.kind === "play" && <Screen rs={rs} cam={cam} showHand />}
      {seg?.kind === "brake" && (
        <>
          <Screen rs={rs} cam={cam} showHand={false} />
          {(() => {
            // the shot parks its target at 45% of its window; size the window so that is Goldman's real place on
            // the page, then clip it to the screen, so the cut to the live page does not jump
            const goldmanMid = 561 + 194.9375 / 2;
            const col = rectOf(cam, { ...LIST_COL, h: (goldmanMid - LIST_COL.y) / 0.45 });
            return (
              <div style={{ position: "absolute", left: VIEW.x, top: VIEW.y, width: VIEW.w, height: Math.min(VIEW.h, toCanvas(cam, 0, 900).y - VIEW.y), overflow: "hidden", borderRadius: 34 }}>
                <JobScrollBrake f={local} dur={dur} src={LIST.src} imgW={LIST.w} imgH={LIST.h} target={LIST.goldman}
                  view={{ ...col, x: col.x - VIEW.x, y: col.y - VIEW.y }} radius={0} bg="#0a0607" />
              </div>
            );
          })()}
        </>
      )}
      {seg?.kind === "depth" && (() => {
        const p0 = toCanvas(cam, 0, 0);
        return <WhyDepthLayers f={local} dur={dur} src={frameSrc(rs)} page={{ x: p0.x, y: p0.y, s: p0.s }} layers={[DETAIL_HEAD, ABOUT]} hero={WHY} view={VIEW} />;
      })()}
      {(seg?.kind === "cue" || seg?.kind === "moves") && (() => {
        const box = seg.kind === "cue" ? CUE : MOVES_JM;
        return (
          <>
            <Screen rs={rs} cam={cam} showHand={false} dim={0.55 * ramp(local, 0, 10) * (1 - ramp(local, dur - 15, dur))} />
            <ContactLift f={local} dur={dur} src={frameSrc(rs)} box={box} from={toCanvas(cam, box.x, box.y)} maxScale={seg.kind === "cue" ? 3.6 : 3.4} />
          </>
        );
      })()}
      {seg?.kind === "skills" && (
        <>
          <Screen rs={rs} cam={cam} showHand={false} dim={0.55 * ramp(local, 0, 10) * (1 - ramp(local, dur - 15, dur))} />
          <ContactLift f={local} dur={dur} src={frameSrc(rs)} box={SKILLS} from={toCanvas(cam, SKILLS.x, SKILLS.y)} />
        </>
      )}
      {seg?.kind === "scan" && (
        <>
          <Screen rs={rs} cam={cam} showHand={false} dim={0.8 * ramp(local, 0, 12)} />
          <PostingScan f={local} dur={dur} cards={2} />
        </>
      )}
      {seg?.kind === "resume" && (
        <>
          <Screen rs={rs} cam={cam} showHand={false} dim={0.85} />
          <ResumeRewrite f={local} dur={dur} />
        </>
      )}
      {seg?.kind === "bounce" && (
        <>
          <Screen rs={rs} cam={cam} showHand={false} hideApply />
          <ApplyBounce f={local} dur={dur} rect={apRect}>{applyNode}</ApplyBounce>
        </>
      )}
      {seg?.kind === "strip" && (
        <StripAwayToLogo f={local} dur={dur} view={VIEW} page={<Screen rs={RUN_END} cam={cam} showHand={false} inner />}
          button={{ rect: apRect, node: applyNode }} logoSrc={staticFile("brand/campusai-logo-white.svg")} />
      )}

      {/* drawn after the screen so the gliding page never covers the step line (review round 1) */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - headOut }}><StepHeader f={f} /></div>
      <Notes f={f} />

      <Audio src={a("house-vibez.mp3")} trimBefore={MUSIC_TRIM}
        volume={(fr) => 0.7 * Math.min(1, fr / 8) * Math.min(1, Math.max(0, (HOWTO_FRAMES - fr) / 24))} />
      {CUES.map((c) => (
        <Sequence key={c.name} from={Math.round(c.at)} name={c.name}>
          <Audio src={c.src} volume={() => c.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
