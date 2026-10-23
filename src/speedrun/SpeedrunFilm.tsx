/**
 * CampusAI, "Internship speedrun, any%" (2026-10-21). 9:16, 30fps, about 29.5s, music and sound.
 * Storyline is Jacob's (content/video-studio/hook-films/BRIEF.md, film 1).
 *
 *   beats 0-4    the logo
 *   beats 4-8    the hook: "Internship speedrun" with a chip rolling to any% (pill-chip-slot-cycle)
 *   beats 8-10   countdown, a red frame draws and the real Job Match page drops in (neon-frame-orbit-drop)
 *   beats 10-48  ONE real scripted run of campusai-demo (capture/speedrun-run.cjs): North Star,
 *                browsing jobs (as a carousel of the real cards, carousel-3d), Goldman's detail,
 *                Tailor resume, Apply. Two freezes annotate the run (speed-ramp-freeze, the film's
 *                signature): Why this fits you, and the rewritten bullet.
 *   beats 45-48  Apply bounces on the beat before the press (icon-performance-moves)
 *   beats 52-60  the final time slams in on the music's lift (slam-entrance-moves), then the logo
 *
 * The timer is the run's TRUE elapsed time (playback seconds of the recording). Fast-forwarded
 * stretches carry a visible rate tag and freezes pause the timer, so the final time is never edited.
 * Music: Mixkit "House Vibez" (free license). 122.00 BPM, t0 7.938s, T 0.4918s; energy lifts at music
 * beat 48, which is film beat 52 (the film starts at music beat -4).
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { INTER, useZodiak } from "../kit/parts";
import take from "./take.json";

export const SPEEDRUN_FPS = 30;
export const SPEEDRUN_SIZE = { width: 1080, height: 1920 };

// ---------- beat grid ----------
const MUSIC_T0 = 7.938;
const MUSIC_T = 0.4918;
const START_BEAT = -4;
const MUSIC_TRIM = Math.round((MUSIC_T0 + START_BEAT * MUSIC_T) * SPEEDRUN_FPS);
const OFFSET_S = MUSIC_T0 + START_BEAT * MUSIC_T - MUSIC_TRIM / SPEEDRUN_FPS;
const B = (n: number) => (OFFSET_S + n * MUSIC_T) * SPEEDRUN_FPS;
export const SPEEDRUN_FRAMES = Math.round(B(60));

const RED = "#E8293B";
const GOLD = "#F5C842";
const BG = "#0b0708";
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

/** Segments in film beats, mapped onto run seconds. `play` and `carousel` advance the run, `freeze` holds it. */
type Seg = { b0: number; b1: number; r0: number; r1: number; kind: "play" | "freeze" | "carousel" };
const SEGS: Seg[] = [
  { b0: 10, b1: 19, r0: 0, r1: 6.0, kind: "play" }, // North Star
  { b0: 19, b1: 22, r0: 6.0, r1: r("goldmanOpen"), kind: "carousel" }, // browsing
  { b0: 22, b1: 25, r0: r("goldmanOpen"), r1: r("why") + 0.3, kind: "play" }, // Goldman opens
  { b0: 25, b1: 28, r0: r("why") + 0.3, r1: r("why") + 0.3, kind: "freeze" }, // FREEZE 1
  { b0: 28, b1: 32, r0: r("why") + 0.3, r1: r("tailorPressed") + 0.15, kind: "play" }, // read, press Tailor
  { b0: 32, b1: 36, r0: r("tailorPressed") + 0.15, r1: r("tailorDone") + 0.7, kind: "play" }, // tailoring
  { b0: 36, b1: 39, r0: r("tailorDone") + 0.7, r1: r("suggestionShown") + 0.35, kind: "play" }, // open the change
  { b0: 39, b1: 42, r0: r("suggestionShown") + 0.35, r1: r("suggestionShown") + 0.35, kind: "freeze" }, // FREEZE 2
  { b0: 42, b1: 48, r0: r("suggestionShown") + 0.35, r1: RUN_END, kind: "play" }, // back, Apply
];
const segAt = (f: number) => SEGS.find((s) => f >= B(s.b0) && f < B(s.b1));
/** Run seconds shown at film frame f (the timer and the footage both read this). */
const runAt = (f: number) => {
  if (f < B(10)) return 0;
  if (f >= B(48)) return RUN_END;
  const s = segAt(f)!;
  return interpolate(f, [B(s.b0), B(s.b1)], [s.r0, s.r1], CLAMP);
};
const rateOf = (s: Seg) => (s.r1 - s.r0) / ((B(s.b1) - B(s.b0)) / SPEEDRUN_FPS);

const frameSrc = (rs: number) => {
  const t = rs + S0;
  let lo = 0, hi = FRAMES.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (FRAMES[mid][0] <= t) lo = mid; else hi = mid - 1; }
  return staticFile(`speedrun/run/${FRAMES[lo][1]}`);
};
const cursorAt = (rs: number) => {
  const t = rs + S0;
  let at = { x: 760, y: 620 }, click: number | null = null;
  for (const m of MOVES) {
    if (t < m.start) break;
    if (t < m.end) { const e = 1 - Math.pow(1 - (t - m.start) / (m.end - m.start), 3); at = { x: m.from.x + (m.to.x - m.from.x) * e, y: m.from.y + (m.to.y - m.from.y) * e }; }
    else at = m.to;
    if (m.click !== undefined && t >= m.click) click = m.click;
  }
  return { ...at, since: click !== null && t - click < 0.6 ? t - click : null };
};

// ---------- layout ----------
const VIEW = { x: 24, y: 430, w: 1032, h: 1150 }; // the screen window on the canvas
const NOTE_Y = VIEW.y + VIEW.h + 44; // freeze notes sit in their own band, never on the UI
type Cam = { cx: number; cy: number; cw: number };
/** Zoom (camera width in screen CSS px) over run seconds: tight enough to read on a phone. */
const ZOOM: [number, number][] = [
  [0, 600], [r("pickerOpen"), 640], [r("pickerClosed"), 640], [r("goldmanOpen"), 580], [r("why"), 560],
  [r("tailorPressed") - 0.3, 600], [r("tailorDone"), 660], [r("suggestionShown"), 600], [r("back"), 560], [RUN_END - 0.5, 470],
];
/** Where the camera looks instead of the cursor (screen CSS px), with the run seconds it holds. */
const AP = BOXES.apply ?? { x: 1000, y: 280, w: 200, h: 40 };
const LOOK: { r0: number; r1: number; x: number; y: number }[] = [
  { r0: -1, r1: r("pickerOpen") + 0.1, x: 980, y: 220 }, // the Aiming for chip
  { r0: r("pickerOpen") + 0.1, r1: r("pickerClosed") + 0.2, x: 560, y: 360 }, // the picker
  { r0: r("tailorPressed") + 0.1, r1: r("tailorDone") + 0.4, x: 640, y: 250 }, // the loader
  { r0: r("tailorDone") + 0.4, r1: r("suggestionOpen") - 0.6, x: 600, y: 320 }, // chips and lines
  { r0: r("back") + 0.1, r1: RUN_END + 5, x: AP.x + AP.w / 2 + 60, y: AP.y + AP.h / 2 + 80 }, // Apply
];
const FREEZE_LOOK: Record<number, { x: number; y: number; cw: number }> = {
  25: { x: 1054, y: 400, cw: 700 },
  39: { x: 545, y: 570, cw: 540 },
};
const lerpTable = (t: [number, number][], x: number) => {
  if (x <= t[0][0]) return t[0][1];
  for (let i = 0; i < t.length - 1; i++) if (x < t[i + 1][0]) return t[i][1] + (t[i + 1][1] - t[i][1]) * EASE((x - t[i][0]) / (t[i + 1][0] - t[i][0]));
  return t[t.length - 1][1];
};
const camAt = (rs: number, freezeB?: number): Cam => {
  if (freezeB !== undefined && FREEZE_LOOK[freezeB]) { const z = FREEZE_LOOK[freezeB]; return clampCam({ cx: z.x, cy: z.y, cw: z.cw }); }
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
const clampCam = (c: Cam): Cam => {
  const ch = c.cw * (VIEW.h / VIEW.w);
  return { cw: c.cw, cx: Math.min(1440 - c.cw / 2, Math.max(c.cw / 2, c.cx)), cy: Math.min(900 - ch / 2, Math.max(ch / 2, c.cy)) };
};
const toCanvas = (cam: Cam, x: number, y: number) => {
  const s = VIEW.w / cam.cw;
  return { x: VIEW.x + VIEW.w / 2 + (x - cam.cx) * s, y: VIEW.y + VIEW.h / 2 + (y - cam.cy) * s, s };
};

// ---------- pieces ----------
const fmt = (s: number) => {
  const m = Math.floor(s / 60), sec = s - m * 60;
  return `${m}:${sec.toFixed(2).padStart(5, "0")}`;
};

const Screen: React.FC<{ rs: number; cam: Cam; showHand: boolean; dim?: number }> = ({ rs, cam, showHand, dim = 0 }) => {
  const s = VIEW.w / cam.cw;
  const o = toCanvas(cam, 0, 0);
  const c = cursorAt(rs);
  const h = toCanvas(cam, c.x, c.y);
  const press = c.since === null ? 1 : interpolate(c.since, [0, 0.08, 0.25], [0.86, 0.86, 1], CLAMP);
  const ring = c.since === null ? 1 : Math.min(1, c.since / 0.5);
  return (
    <div style={{ position: "absolute", left: VIEW.x, top: VIEW.y, width: VIEW.w, height: VIEW.h, overflow: "hidden", borderRadius: 34,
      boxShadow: `0 0 0 1.5px rgba(255,255,255,.08), 0 40px 120px rgba(0,0,0,.6), 0 0 140px ${RED}22`, background: BG }}>
      <Img src={frameSrc(rs)} style={{ position: "absolute", left: o.x - VIEW.x, top: o.y - VIEW.y, width: 1440 * s, height: 900 * s, maxWidth: "none", filter: dim ? `brightness(${1 - dim * 0.72}) saturate(${1 - dim * 0.6}) blur(${dim > 0.8 ? 6 : 0}px)` : undefined }} />
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

/** LiveSplit-style panel: the five splits and the big timer. */
const SPLITS: { name: string; at: number }[] = [
  { name: "Set your North Star", at: r("pickerClosed") },
  { name: "Find the job", at: r("goldmanOpen") },
  { name: "Read why you fit", at: r("tailorPressed") },
  { name: "Tailor your resume", at: r("suggestionShown") },
  { name: "Apply", at: RUN_END },
];
const Timer: React.FC<{ f: number; rs: number }> = ({ f, rs }) => {
  const seg = segAt(f);
  const frozen = seg?.kind === "freeze";
  const done = f >= B(48);
  const enter = ramp(f, B(8), B(9.5));
  const countdown = f >= B(8) && f < B(10) ? Math.max(1, 3 - Math.floor((f - B(8)) / ((B(10) - B(8)) / 3))) : null;
  const ff = seg && seg.kind !== "freeze" && rateOf(seg) > 1.6 ? rateOf(seg) : null;
  const fade = 1 - ramp(f, B(50), B(51.5));
  return (
    <div style={{ position: "absolute", left: 40, top: 70, width: 1000, opacity: enter * fade, transform: `translateY(${(1 - enter) * -30}px)` }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ fontFamily: INTER, fontSize: 30, fontWeight: 600, color: "rgba(255,255,255,.6)", letterSpacing: "-0.01em" }}>
          Internship speedrun <span style={{ color: RED, fontWeight: 700 }}>any%</span>
        </div>
        <div style={{ fontFamily: INTER, fontSize: 26, fontWeight: 700, color: frozen ? GOLD : ff ? "#fff" : "transparent", padding: "6px 14px", borderRadius: 999,
          background: frozen ? `${GOLD}22` : ff ? "rgba(255,255,255,.12)" : "transparent" }}>
          {frozen ? "Paused" : ff ? `${ff.toFixed(1)}× speed` : "."}
        </div>
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 28, alignItems: "stretch" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {SPLITS.map((sp) => {
            const hit = rs >= sp.at - 1e-6 && f >= B(10);
            return (
              <div key={sp.name} style={{ display: "flex", justifyContent: "space-between", fontFamily: INTER, fontSize: 25, fontWeight: 600,
                color: hit ? "#fff" : "rgba(255,255,255,.32)", padding: "5px 12px", borderRadius: 10, background: hit ? "rgba(255,255,255,.06)" : "transparent" }}>
                <span>{sp.name}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: hit ? GOLD : "rgba(255,255,255,.25)" }}>{hit ? fmt(sp.at) : "-"}</span>
              </div>
            );
          })}
        </div>
        <div style={{ width: 360, display: "flex", alignItems: "center", justifyContent: "flex-end", fontFamily: INTER, fontWeight: 800,
          fontSize: countdown ? 150 : 104, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums",
          color: countdown ? RED : done ? GOLD : frozen ? "rgba(255,255,255,.55)" : "#fff" }}>
          {countdown ?? fmt(rs)}
        </div>
      </div>
    </div>
  );
};

/** Freeze annotation: a marker loop draws round the box and a note rises under it. */
const Freeze: React.FC<{ f: number; b0: number; box: Box; cam: Cam; note: React.ReactNode; pad?: number }> = ({ f, b0, box, cam, note, pad = 14 }) => {
  const a = toCanvas(cam, box.x - pad, box.y - pad);
  const w = (box.w + pad * 2) * a.s, h = (box.h + pad * 2) * a.s;
  const draw = ramp(f, B(b0) + 3, B(b0 + 1));
  const show = ramp(f, B(b0 + 0.8), B(b0 + 1.6));
  const flash = interpolate(f, [B(b0), B(b0) + 1, B(b0) + 5], [0.3, 0.3, 0], CLAMP);
  const per = 2 * (w + h);
  return (
    <>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={a.x} y={a.y} width={w} height={h} rx={22} fill="none" stroke={RED} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={per} strokeDashoffset={per * (1 - draw)} style={{ filter: `drop-shadow(0 0 18px ${RED}88)` }} />
      </svg>
      <div style={{ position: "absolute", left: 50, right: 50, top: NOTE_Y, opacity: show, transform: `translateY(${(1 - show) * 24}px)`, textAlign: "center",
        fontFamily: "Zodiak, serif", fontWeight: 700, fontSize: 60, lineHeight: 1.08, letterSpacing: "-0.02em", color: "#fff" }}>
        {note}
      </div>
    </>
  );
};

/** Browsing as a ring of the real job cards that spins and brakes on Goldman (index 2). */
const CARDS = [0, 1, 2, 3, 4, 5, 6, 7];
const Carousel: React.FC<{ f: number }> = ({ f }) => {
  const k = ramp(f, B(19), B(21.6), Easing.bezier(0.16, 1, 0.3, 1));
  const turns = 1.25;
  const step = 360 / CARDS.length;
  const target = -2 * step - turns * 360;
  const ang = target * k;
  const lock = ramp(f, B(21.4), B(21.9));
  const out = ramp(f, B(21.8), B(22));
  return (
    <AbsoluteFill style={{ perspective: 2200, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: 540, top: VIEW.y + VIEW.h / 2, transformStyle: "preserve-3d", transform: `translateZ(-760px) rotateX(-6deg) rotateY(${ang}deg)` }}>
        {CARDS.map((i) => {
          const isG = i === 2;
          return (
            <div key={i} style={{ position: "absolute", width: 700, transform: `translate(-50%,-50%) rotateY(${i * step}deg) translateZ(860px)`, backfaceVisibility: "hidden",
              borderRadius: 26, overflow: "hidden", boxShadow: isG && lock ? `0 0 0 ${6 * lock}px ${RED}, 0 0 80px ${RED}88` : "0 30px 80px rgba(0,0,0,.6)" }}>
              <Img src={staticFile(`speedrun/cards/card${i}.png`)} style={{ width: "100%", display: "block", maxWidth: "none" }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Apply bounces on beats 45, 46, 47, harder each time, then the press on 48. */
const ApplyBounce: React.FC<{ f: number; rs: number; cam: Cam }> = ({ f, rs, cam }) => {
  const box = BOXES.apply;
  if (!box || f < B(45) || f >= B(48.4)) return null;
  const pad = 14;
  const bx = { x: box.x - pad * 2.6, y: box.y - pad, w: box.w + pad * 4.2, h: box.h + pad * 2 };
  const a = toCanvas(cam, bx.x, bx.y);
  let sc = 1;
  [45, 46, 47].forEach((b, i) => {
    const d = f - B(b);
    if (d >= 0 && d < 12) sc = Math.max(sc, 1 + (0.08 + i * 0.05) * Math.sin((d / 12) * Math.PI));
  });
  const s = a.s;
  return (
    <div style={{ position: "absolute", left: a.x, top: a.y, width: bx.w * s, height: bx.h * s, transform: `scale(${sc})`, transformOrigin: "50% 50%", borderRadius: 18 * s, overflow: "hidden",
      boxShadow: `0 ${18 * (sc - 1) * 10}px ${50 * (sc - 1) * 10}px rgba(0,0,0,.5), 0 0 ${60 * (sc - 1) * 8}px ${RED}66` }}>
      <Img src={frameSrc(rs)} style={{ position: "absolute", left: -bx.x * s, top: -bx.y * s, width: 1440 * s, height: 900 * s, maxWidth: "none" }} />
    </div>
  );
};

// ---------- the film ----------
const a = (n: string) => staticFile(`speedrun/audio/${n}`);
const CUES: { at: number; src: string; v: number; name: string }[] = [
  { at: B(4) - 2, src: a("swoosh-quick.mp3"), v: 0.3, name: "hook" },
  { at: B(6.5), src: a("ui-select-click.mp3"), v: 0.45, name: "any%" },
  { at: B(8), src: a("countdown-bleeps.mp3"), v: 0.45, name: "countdown" },
  { at: B(10) - 3, src: a("bass-hit-short.mp3"), v: 0.55, name: "go" },
  ...SPLITS.slice(0, 4).map((sp, i) => {
    const seg = SEGS.find((s) => s.kind !== "freeze" && sp.at >= s.r0 && sp.at <= s.r1)!;
    const at = seg.kind === "carousel" ? B(seg.b1) - 2 : interpolate(sp.at, [seg.r0, seg.r1], [B(seg.b0), B(seg.b1)]);
    return { at, src: a("clock-tick-single.mp3"), v: 0.5, name: `split ${i + 1}` };
  }),
  { at: B(19), src: a("whoosh-fast.mp3"), v: 0.45, name: "carousel" },
  { at: B(25), src: a("camera-shutter-hard.mp3"), v: 0.5, name: "freeze 1" },
  { at: B(25.3), src: a("marker-pen-line.mp3"), v: 0.4, name: "marker 1" },
  { at: B(39), src: a("camera-shutter-hard.mp3"), v: 0.5, name: "freeze 2" },
  { at: B(39.3), src: a("marker-pen-line.mp3"), v: 0.4, name: "marker 2" },
  { at: B(45), src: a("pop-electric.mp3"), v: 0.3, name: "bounce 1" },
  { at: B(46), src: a("pop-electric.mp3"), v: 0.38, name: "bounce 2" },
  { at: B(47), src: a("pop-electric.mp3"), v: 0.46, name: "bounce 3" },
  { at: B(48), src: a("ui-select-click.mp3"), v: 0.6, name: "apply" },
  { at: B(52) - 2, src: a("impact-cine-big.mp3"), v: 0.6, name: "final time" },
];

export const SpeedrunFilm: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rs = runAt(f);
  const seg = segAt(f);
  const cam = camAt(f >= B(48) ? RUN_END : rs, seg?.kind === "freeze" ? seg.b0 : undefined);

  // logo (beats 0-4)
  const logoIn = spring({ frame: f + 4, fps, config: { damping: 18 } });
  const logoOut = ramp(f, B(3.4), B(4));
  // hook (beats 4-8)
  const hookIn = ramp(f, B(4), B(4.8));
  const hookOut = ramp(f, B(7.6), B(8.2));
  const words = ["100%", "glitchless", "any%"];
  const roll = interpolate(f, [B(4.6), B(5.4), B(5.6), B(6.3), B(6.5)], [0, 1, 1, 2, 2], { ...CLAMP, easing: EASE });
  // screen drop (beats 8-10)
  const frameDraw = ramp(f, B(8), B(9.4));
  const drop = spring({ frame: f - Math.round(B(9.2)), fps, config: { damping: 16, mass: 0.9 } });
  const showScreen = f >= B(9.2) && f < B(52.4);
  const goFlash = interpolate(f, [B(10) - 1, B(10), B(10) + 4], [0, 0.2, 0], CLAMP);
  // after Apply
  const press = ramp(f, B(48), B(49.5));
  const endFlash = interpolate(f, [B(48), B(48) + 1, B(48) + 6], [0, 0.22, 0], CLAMP);
  const slamF = f - Math.round(B(52) - 3);
  const slam = slamF < 0 ? 0 : spring({ frame: slamF, fps, config: { damping: 11, mass: 0.7, stiffness: 180 } });
  const shake = slamF >= 0 && slamF < 9 ? Math.sin(slamF * 2.3) * (9 - slamF) * 2.4 : 0;
  const endLogo = ramp(f, B(56), B(57.5));
  const outro = ramp(f, B(59), B(60));

  const P = VIEW;
  const per = 2 * (P.w + P.h);
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(1200px 900px at 50% 38%, ${RED}30, transparent 70%)` }} />

      {/* logo */}
      {f < B(4.2) && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - logoOut }}>
          <Img src={staticFile("brand/campusai-logo-white.svg")} style={{ width: 620, transform: `scale(${0.9 + 0.1 * logoIn}) translateY(${-60 * logoOut}px)`, filter: `blur(${(1 - logoIn) * 14}px)`, opacity: logoIn }} />
        </AbsoluteFill>
      )}

      {/* hook */}
      {f >= B(3.8) && f < B(8.4) && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: hookIn * (1 - hookOut) }}>
          <div style={{ fontFamily: "Zodiak, serif", fontWeight: 700, fontSize: 104, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1, whiteSpace: "nowrap", transform: `translateY(${(1 - hookIn) * 30}px)` }}>
            Internship speedrun
          </div>
          <div style={{ marginTop: 34, height: 128, overflow: "hidden", borderRadius: 999, background: roll > 1.6 ? RED : "rgba(255,255,255,.1)",
            padding: "0 52px", display: "flex", alignItems: "flex-start", boxShadow: roll > 1.6 ? `0 0 60px ${RED}77` : "none" }}>
            <div style={{ transform: `translateY(${-roll * 128}px)` }}>
              {words.map((w) => (
                <div key={w} style={{ height: 128, lineHeight: "128px", fontFamily: INTER, fontWeight: 800, fontSize: 84, letterSpacing: "-0.03em", color: "#fff", textAlign: "center" }}>{w}</div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 40, fontFamily: INTER, fontWeight: 600, fontSize: 30, color: "rgba(255,255,255,.55)", opacity: ramp(f, B(6.5), B(7.2)) }}>
            Real product. The timer is real time.
          </div>
        </AbsoluteFill>
      )}

      {/* the red frame that draws ahead of the screen */}
      {f >= B(8) && f < B(10.5) && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - ramp(f, B(9.8), B(10.5)) }}>
          <rect x={P.x} y={P.y} width={P.w} height={P.h} rx={34} fill="none" stroke={RED} strokeWidth={6}
            strokeDasharray={per} strokeDashoffset={per * (1 - frameDraw)} style={{ filter: `drop-shadow(0 0 22px ${RED})` }} />
        </svg>
      )}

      {/* the run */}
      {showScreen && (
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - drop) * -120}px) scale(${1 + (1 - drop) * 0.06 - press * 0.08}) rotateX(${(1 - drop) * 8}deg)`,
          transformOrigin: "50% 60%", opacity: f < B(10) ? Math.min(1, drop * 1.4) : 1 - ramp(f, B(51.4), B(52.4)), filter: press ? `blur(${press * 6}px)` : undefined }}>
          {seg?.kind === "carousel" ? (
            <>
              <Screen rs={rs} cam={cam} showHand={false} dim={1} />
              <Carousel f={f} />
            </>
          ) : (
            <Screen rs={rs} cam={cam} showHand={f >= B(10) && seg?.kind !== "freeze"} dim={seg?.kind === "freeze" ? 0.5 : 0} />
          )}
          {seg?.kind === "freeze" && seg.b0 === 25 && BOXES.whyTitle && (
            <Freeze f={f} b0={25} cam={cam} box={{ x: BOXES.whyTitle.x - 22, y: BOXES.whyTitle.y - 14, w: 630, h: 300 }}
              note={<>It tells you <span style={{ color: RED, fontStyle: "italic" }}>why you fit</span>, in plain words.</>} />
          )}
          {seg?.kind === "freeze" && seg.b0 === 39 && BOXES.suggested && (
            <Freeze f={f} b0={39} cam={cam} box={{ x: BOXES.suggested.x, y: BOXES.suggested.y, w: 492, h: BOXES.suggested.h }} pad={10}
              note={<>Your bullet, rewritten in <span style={{ color: RED, fontStyle: "italic" }}>Goldman&apos;s words</span>.</>} />
          )}
          <ApplyBounce f={f} rs={rs} cam={cam} />
        </div>
      )}
      <AbsoluteFill style={{ background: "#fff", opacity: goFlash + endFlash, pointerEvents: "none" }} />

      <Timer f={f} rs={rs} />

      {/* the final time */}
      {f >= B(52) - 3 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - outro }}>
          <div style={{ transform: `translate(${shake}px, ${-120 - endLogo * 80}px) scale(${2.4 - 1.4 * slam})`, textAlign: "center" }}>
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 210, letterSpacing: "-0.05em", color: GOLD, fontVariantNumeric: "tabular-nums", lineHeight: 1,
              textShadow: `0 0 80px ${GOLD}55` }}>{fmt(RUN_END)}</div>
            <div style={{ marginTop: 26, fontFamily: INTER, fontWeight: 600, fontSize: 38, color: "rgba(255,255,255,.7)" }}>
              North Star to applied. <span style={{ color: "#fff" }}>Internship speedrun</span> <span style={{ color: RED, fontWeight: 800 }}>any%</span>
            </div>
          </div>
          <Img src={staticFile("brand/campusai-logo-white.svg")} style={{ position: "absolute", bottom: 300, width: 400, opacity: endLogo, transform: `translateY(${(1 - endLogo) * 30}px)` }} />
        </AbsoluteFill>
      )}

      <Audio src={a("house-vibez.mp3")} trimBefore={MUSIC_TRIM}
        volume={(fr) => 0.7 * Math.min(1, fr / 8) * Math.min(1, Math.max(0, (SPEEDRUN_FRAMES - fr) / 20))} />
      {CUES.map((c) => (
        <Sequence key={c.name} from={Math.round(c.at)} name={c.name}>
          <Audio src={c.src} volume={() => c.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
