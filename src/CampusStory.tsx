/**
 * CampusAI story cut, v3 (2026-10-16): screens pop out of the moving wall.
 *
 * No camera move (v2 zoomed, and Jacob found it made the rest look less clean). The whole wall
 * keeps drifting exactly as in the loop, and for each stop ONE real screen lifts forward out of
 * its own slot: it grows, straightens part way, and leans toward the middle, so it reads as coming
 * from the wall, then it settles back into the slot and the wall carries it on. Stops, in Jacob's
 * order: daily brief, jobs, classes and assignments, calendar, clubs, events. Then "One place.",
 * the logo and line.
 *
 * wallColumns gives every screen's exact position on every frame, so the lifted copy is drawn
 * over the live tile and tracks it while it drifts.
 *
 * The CampusAI mark sits small in a top corner the whole time and fades out when the end card's
 * full-size logo arrives (2026-10-16, Jacob: no standalone logo intro, the logo always in a corner).
 *
 * ending "ig" adds "Link in bio." under the line; "linkedin" holds on the logo and line.
 * Every screen is a real campusai-demo.vercel.app capture in dark mode.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Watermark } from "./components/Watermark";
import { GAP, layoutFor, Phone, TILT, Web, wallColumns, WallColumn } from "./CampusWall";

const { fontFamily } = loadFont("normal", { weights: ["700"] });

export const STORY_FPS = 30;
export const STORY_FRAMES = 462; // 15.4s

export type CampusStoryProps = { ending: "ig" | "linkedin"; corner?: "left" | "right" };

const POOLS = {
  // Web columns take pairs (0,1), (4,5), (8,9) of this list in a 4:5 frame, so every stop's
  // screen sits in a pair that is always on the wall, even the narrowest cut.
  webs: ["D_dashboard", "D_jobs", "D_planner", "D_resume", "D_classes", "D_calendar", "D_eventdetail", "D_degree", "D_chat", "D_orgs"],
  phones: ["MD_dash", "MD_events", "MD_orgs", "MD_jobs", "MD_degree"],
};

const STOPS = [
  { label: "Your daily brief.", src: "D_dashboard" },
  { label: "Your jobs.", src: "D_jobs" },
  { label: "Your classes.", src: "D_classes" },
  { label: "Your calendar.", src: "D_calendar" },
  { label: "Your clubs.", src: "MD_orgs" },
  { label: "Your events.", src: "MD_events" },
];

// Timeline, in frames. Each stop: lift 14, hold 32, settle 12, breathe 2.
const FIRST = 18;
const LIFT = 14;
const HOLD = 32;
const SETTLE = 12;
const STEP = LIFT + HOLD + SETTLE + 2; // 60
const stopStart = (i: number) => FIRST + i * STEP;
const STOPS_END = stopStart(STOPS.length); // 378
const ONE_PLACE = STOPS_END - 4; // 374
const BRAND = ONE_PLACE + 26; // 400
const BIO = BRAND + 30; // 430

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const LIFT_EASE = Easing.bezier(0.34, 1.32, 0.64, 1); // a touch of overshoot on the way up
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const A = (TILT * Math.PI) / 180;

/** Wall drift: same speed as the 10s loop. */
const wallT = (frame: number) => frame / 300;

type Target = { col: number; k: number; phone: boolean };

const screenPos = (c: WallColumn, k: number, planeLeft: number) => {
  const px = c.x + c.w / 2;
  const py = c.y0 + k * c.pitch + c.h / 2;
  return { x: planeLeft + px * Math.cos(A) - py * Math.sin(A), y: px * Math.sin(A) + py * Math.cos(A) };
};

export const CampusStory: React.FC<CampusStoryProps> = ({ ending, corner = "right" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const L = layoutFor(width, height);
  const wide = width > height;
  const tall = height / width >= 1.5;
  const size = L.head.size;

  // Where a lifted screen leans toward, and how much it grows, per aspect.
  const focus = wide ? { x: width * 0.6, y: height * 0.52 } : { x: width / 2, y: height * (tall ? 0.55 : 0.6) };
  const liftScale = (phone: boolean) => (wide ? (phone ? 1.5 : 1.55) : tall ? (phone ? 1.75 : 1.6) : phone ? 1.55 : 1.5);
  const LEAN = 0.45; // how far toward the focus point a lifted screen travels
  const topLimit = wide ? 40 : L.head.top + size * 1.4;

  const colsAt = (f: number) => wallColumns(width, height, wallT(f), POOLS);

  // Pick each stop's screen: a copy that stays fully in frame (below the label) for the whole
  // stop, closest to the focus point, so the lift is short and starts from somewhere visible.
  const targets: Target[] = React.useMemo(() => {
    const visible = (c: WallColumn, k: number, f: number) => {
      const p = screenPos(c, k, L.planeLeft);
      const hx = (c.w / 2) * Math.cos(A) + (c.h / 2) * Math.abs(Math.sin(A));
      const hy = (c.w / 2) * Math.abs(Math.sin(A)) + (c.h / 2) * Math.cos(A);
      void f;
      return p.x - hx > 16 && p.x + hx < width - 16 && p.y - hy > topLimit && p.y + hy < height - 16;
    };
    return STOPS.map((st, i) => {
      const f0 = stopStart(i), f1 = f0 + STEP;
      const c0 = colsAt(f0), c1 = colsAt(f1), cm = colsAt((f0 + f1) / 2);
      let best: Target | null = null;
      let bestScore = Infinity;
      cm.forEach((c, ci) => {
        for (let k = 1; k < c.count - 1; k++) {
          if (c.pair[k % 2] !== st.src) continue;
          const inFrame = visible(c0[ci], k, f0) && visible(c1[ci], k, f1);
          const p = screenPos(c, k, L.planeLeft);
          const score = Math.hypot(p.x - focus.x, p.y - focus.y) + (inFrame ? 0 : 5000);
          if (score < bestScore) { bestScore = score; best = { col: c.index, k, phone: c.isPhone }; }
        }
      });
      if (!best) throw new Error(`no copy of ${st.src} on the wall`);
      return best;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  const cols = colsAt(frame);

  // Which stop is live, and how lifted it is (0 = in the wall, 1 = fully up).
  const i = Math.floor((frame - FIRST) / STEP);
  const active = i >= 0 && i < STOPS.length ? i : -1;
  let lift = 0;
  if (active >= 0) {
    const local = frame - stopStart(active);
    lift = local < LIFT
      ? interpolate(local, [0, LIFT], [0, 1], { ...clamp, easing: LIFT_EASE })
      : local < LIFT + HOLD
        ? 1
        : interpolate(local, [LIFT + HOLD, LIFT + HOLD + SETTLE], [1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  }
  const dim = 0.12 + 0.42 * Math.min(1, Math.max(0, lift)) + interpolate(frame, [STOPS_END - 10, STOPS_END + 14], [0, 0.3], clamp);

  let lifted: React.ReactNode = null;
  if (active >= 0 && lift > 0.001) {
    const tg = targets[active];
    const c = cols[tg.col];
    const p = screenPos(c, tg.k, L.planeLeft);
    // Fully lifted, the screen leans toward the focus point and is held fully inside the frame
    // (below the label); on the way up it travels from its own slot to there.
    const S = liftScale(tg.phone);
    const r1 = (TILT * 0.35 * Math.PI) / 180;
    const hx = S * ((c.w / 2) * Math.cos(r1) + (c.h / 2) * Math.abs(Math.sin(r1)));
    const hy = S * ((c.w / 2) * Math.abs(Math.sin(r1)) + (c.h / 2) * Math.cos(r1));
    const fx = Math.min(width - hx - 24, Math.max(hx + 24, p.x + (focus.x - p.x) * LEAN));
    const fy = Math.min(height - hy - 24, Math.max(topLimit + hy, p.y + (focus.y - p.y) * LEAN));
    const cx = p.x + (fx - p.x) * lift;
    const cy = p.y + (fy - p.y) * lift;
    const sc = 1 + (S - 1) * lift;
    const rot = TILT * (1 - 0.65 * lift);
    const src = c.pair[tg.k % 2];
    lifted = (
      <div style={{
        position: "absolute", left: cx, top: cy, width: c.w, height: c.h,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${sc})`,
        filter: `drop-shadow(0 ${30 * lift}px ${50 * lift}px rgba(0,0,0,${0.7 * lift}))`,
      }}>
        {tg.phone ? <Phone src={src} /> : <Web src={src} />}
      </div>
    );
  }

  const labelFor = (n: number) => {
    const s0 = stopStart(n);
    const inn = interpolate(frame, [s0 - 2, s0 + 12], [0, 1], { ...clamp, easing: EASE });
    const out = interpolate(frame, [s0 + LIFT + HOLD, s0 + LIFT + HOLD + 10], [0, 1], clamp);
    return { o: inn * (1 - out), y: (1 - inn) * 18 - out * 10 };
  };
  const oneIn = interpolate(frame, [ONE_PLACE, ONE_PLACE + 16], [0, 1], { ...clamp, easing: EASE });
  const oneOut = interpolate(frame, [BRAND - 8, BRAND + 6], [0, 1], clamp);
  const brandIn = interpolate(frame, [BRAND, BRAND + 20], [0, 1], { ...clamp, easing: EASE });
  const lineIn = interpolate(frame, [BRAND + 8, BRAND + 28], [0, 1], { ...clamp, easing: EASE });
  const bioIn = ending === "ig" ? interpolate(frame, [BIO, BIO + 16], [0, 1], { ...clamp, easing: EASE }) : 0;

  const headPos: React.CSSProperties = {
    position: "absolute", left: L.head.left, top: L.head.top,
    transform: L.head.centerY ? "translateY(-50%)" : undefined,
    fontFamily, fontWeight: 700, fontSize: size, lineHeight: 1.08, letterSpacing: "-0.025em", color: "#fff",
  };
  const labelPos: React.CSSProperties = wide
    ? { ...headPos, top: height / 2, transform: "translateY(-50%)", maxWidth: 440 }
    : { ...headPos };

  return (
    <AbsoluteFill style={{ background: "#0b0708", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: width * 0.2, top: height * 0.15, width: width * 1.1, height, borderRadius: "50%",
        background: "radial-gradient(closest-side, rgba(226,24,51,.30), rgba(226,24,51,0) 72%)" }} />

      {/* the wall, drifting as in the loop */}
      <div style={{ position: "absolute", left: L.planeLeft, top: 0, transformOrigin: "0 0", transform: `rotate(${TILT}deg)` }}>
        {cols.map((c) => (
          <div key={c.index} style={{ position: "absolute", left: c.x, top: c.y0, display: "flex", flexDirection: "column", gap: GAP }}>
            {Array.from({ length: c.count }, (_, k) =>
              c.isPhone ? <Phone key={k} src={c.pair[k % 2]} /> : <Web key={k} src={c.pair[k % 2]} />,
            )}
          </div>
        ))}
      </div>
      <AbsoluteFill style={{ background: `rgba(11,7,8,${dim})` }} />

      {/* frame-space shading so the words always read */}
      {wide ? (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 760,
          background: "linear-gradient(90deg, rgba(11,7,8,.92) 0%, rgba(11,7,8,.75) 55%, rgba(11,7,8,0) 100%)" }} />
      ) : (
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: L.head.top + size * 2.6,
          background: "linear-gradient(180deg, rgba(11,7,8,.95) 0%, rgba(11,7,8,.8) 55%, rgba(11,7,8,0) 100%)" }} />
      )}

      {lifted}

      {STOPS.map((st, n) => {
        const l = labelFor(n);
        return l.o > 0 ? (
          <div key={st.label} style={{ ...labelPos, opacity: l.o, translate: `0 ${l.y}px` }}>{st.label}</div>
        ) : null;
      })}

      <div style={{ ...headPos, opacity: oneIn * (1 - oneOut), translate: `0 ${(1 - oneIn) * 20}px` }}>One place.</div>

      <div style={{ ...headPos, opacity: brandIn }}>
        <Img src={staticFile("wall/campusai-wordmark-white.svg")}
          style={{ width: L.head.logo, display: "block", transform: `translateY(${(1 - brandIn) * 18}px)` }} />
        <div style={{ marginTop: size * 0.52, opacity: lineIn, transform: `translateY(${(1 - lineIn) * 22}px)` }}>
          Your student
          <br />
          operating system
        </div>
        {ending === "ig" ? (
          <div style={{ marginTop: size * 0.35, fontSize: size * 0.6, color: "rgba(255,255,255,.55)", opacity: bioIn,
            transform: `translateY(${(1 - bioIn) * 14}px)` }}>
            Link in bio.
          </div>
        ) : null}
      </div>

      <Watermark src="brand/campusai-logo-white.svg" side={corner} fadeOutAt={BRAND} />
    </AbsoluteFill>
  );
};
