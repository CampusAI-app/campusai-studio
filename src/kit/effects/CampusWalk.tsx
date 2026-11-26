/**
 * CampusWalk (2026-11-25, Muse: Ildari's self-made Strava concept ad, Jacob's note "let's do one of these for walking to
 * classes ... so we can eventually do one like that for when map comes out"). The reel's middle, made ours: a top-down
 * campus map from real OpenStreetMap footprints and paths, a dot that walks the real route while the line draws itself
 * behind it, places popping up as it passes them, and a bar under it: the time of day ticking over the map, and the two
 * times that matter either side of the walker (when you leave, when class starts). It never counts distance or minutes
 * walked: a counter reads as a tracking app, which a CampusAI film must not claim (critic, 2026-11-25).
 *
 * It takes its world as data so the same part films any walk: bake one with
 *   python3 scripts/map-route.py <name> "<from lat,lng>" "<to lat,lng>"   (writes public/styles/<name>.json)
 * then pass the file, the frames the walk runs between, and the numbers the bar shows. The bar's numbers are props, never
 * worked out here: a CampusAI film passes the product's own walk minutes and times (the map is geography; the minutes
 * are the product's claim). When CampusAI's own Campus Map ships, swap `data` for a capture of it or keep this part as
 * the illustration and cut to the capture after it.
 *
 * Drawn flat from above, the way the reference's map is, with the route turned to run up the frame. Brand colours from
 * the kit; the route is the one accent.
 */
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Easing, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { B, SWING, clampX, k, mix } from "./shared";

type P = [number, number];
export type WalkWorld = { buildings: { n: string; h: number; p: P[] }[]; ways: { k: string; p: P[] }[]; route: P[]; routeMeters: number; minutes: number };

export type CampusWalkProps = {
  /** A baked walk under public/ (scripts/map-route.py). */
  data: string;
  /** Frames the dot leaves and arrives. Before `from` it waits at the start; the map is up from frame 0. */
  from: number;
  to: number;
  /** Where the walk starts and ends, as people say it. */
  fromLabel: string;
  toLabel: string;
  /** Places on the way: a label and how far along the route it sits (0 to 1). Each pops as the dot passes. */
  stops?: { label: string; at: number }[];
  /** The bar. `clock` is the time of day at `from` in minutes after midnight and `minutes` how long the walk takes (the
   *  big clock ticks from one to the other); `left` and `right` sit either side of the walker. */
  bar?: { clock: number; minutes: number; chip: string; left: { value: string; label: string }; right: { value: string; label: string } };
  /** A day of walks (2026-11-25, round 2): each leg runs between two stops along `route` (fractions, as bake-day.py writes
   *  them in `stops`) over its own frames. The bar then shows that leg: the clock ticking from `clock` for `minutes`, the
   *  walk and the time between either side, and, past `clock + between`, the clock in red with `lateLine`. A leg over
   *  `long` minutes carries the running figure, the mark the product puts on a long walk. Overrides from/to and bar. */
  legs?: { f0: number; f1: number; a0: number; a1: number; clock: number; minutes: number; between: number; chip: string }[];
  long?: number;
  lateLine?: string;
  /** Camera: px per metre at the start and at the end of the walk. */
  zoom?: [number, number];
  /** Bottom of the map's useful area (the bar sits under it). */
  credit?: string;
};

const lengths = (r: P[]) => { const l = [0]; for (let i = 1; i < r.length; i++) l.push(l[i - 1] + Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1])); return l; };
const along = (r: P[], l: number[], t: number): P => {
  const d = Math.max(0, Math.min(1, t)) * l[l.length - 1];
  let i = 1; while (i < l.length - 1 && l[i] < d) i++;
  const q = (d - l[i - 1]) / Math.max(l[i] - l[i - 1], 1e-6);
  return [r[i - 1][0] + (r[i][0] - r[i - 1][0]) * q, r[i - 1][1] + (r[i][1] - r[i - 1][1]) * q];
};
/** "9:12am" from minutes after midnight. */
export const clockText = (m: number) => {
  const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(mm).padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
};

const INTER = "Inter";
const GROUND = "#120d0e";
const BLOCK = "#2a2023";
const BLOCK_EDGE = "#36292d";
const ROAD = "#3b2f32";

/** The running figure the product puts on a walk over 15 minutes (Material Symbols directions_run, Apache 2.0). */
export const RunFigure: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path fill={color} d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9 1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" />
  </svg>
);

/** A walking figure (drawn from the Material Symbols directions_walk shape, Apache 2.0). */
export const WalkFigure: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 -960 960 960" style={{ display: "block" }}>
    <path fill={color} d="m280-40 112-564-72 28v136h-80v-188l202-86q14-6 29.5-7t29.5 4q14 5 26.5 14t20.5 23l40 64q26 42 70.5 69T760-520v80q-70 0-125-29t-94-74l-25 123 84 80v300h-80v-260l-84-64-72 324h-84Zm260-700q-33 0-56.5-23.5T460-820q0-33 23.5-56.5T540-900q33 0 56.5 23.5T620-820q0 33-23.5 56.5T540-740Z" />
  </svg>
);

export const CampusWalk: React.FC<CampusWalkProps> = ({ data, from, to, fromLabel, toLabel, stops = [], bar: barProp, zoom = [1.25, 1.75], credit, legs, long = 15, lateLine }) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const [world, setWorld] = useState<WalkWorld | null>(null);
  const [wait] = useState(() => delayRender("campus walk data"));
  useEffect(() => { fetch(staticFile(data)).then((r) => r.json()).then((j) => { setWorld(j); continueRender(wait); }); }, [data, wait]);
  const L = useMemo(() => (world ? lengths(world.route) : []), [world]);
  if (!world) return null;

  // motion: a walk at a near-even pace, a soft start and stop so the dot and the camera never jolt
  const ease = Easing.bezier(0.25, 0.05, 0.75, 0.95);
  // with legs: the active leg is the last one that has started; between legs the dot waits at the stop
  const leg = legs ? [...legs].reverse().find((g) => f >= g.f0) ?? legs[0] : null;
  const legT = leg ? interpolate(f, [leg.f0, leg.f1], [0, 1], { ...clampX, easing: ease }) : 0;
  const t = leg ? mix(leg.a0, leg.a1, legT) : interpolate(f, [from, to], [0, 1], { ...clampX, easing: ease });
  const bar = leg ? { clock: leg.clock, minutes: leg.minutes, chip: leg.chip, left: { value: `${leg.minutes} min`, label: "walk" }, right: { value: `${leg.between} min`, label: "between" } } : barProp;
  const barT = leg ? legT : t;
  const late = leg ? leg.minutes > leg.between && legT * leg.minutes > leg.between : false;
  const lateA = leg && leg.minutes > leg.between ? k(f, mix(leg.f0, leg.f1, leg.between / leg.minutes), mix(leg.f0, leg.f1, leg.between / leg.minutes) + 8) : 0;
  const running = leg ? leg.minutes > long : false;
  const head = along(world.route, L, t);
  const start = world.route[0], end = world.route[world.route.length - 1];
  const mid = along(world.route, L, 0.5);
  // the route runs north to south; turn the world so it runs up the frame
  const ang = Math.atan2(end[0] - start[0], end[1] - start[1]) + Math.PI; // radians that put end above start
  const cos = Math.cos(ang), sin = Math.sin(ang);
  const s = mix(zoom[0], zoom[1], k(f, from - 20, to, SWING));
  // follow the dot, held a little toward the middle so the line behind it stays in frame
  const follow = 0.78;
  const tx = mix(mid[0], head[0], follow), ty = mix(mid[1], head[1], follow);
  const cx = width / 2, cy = height * (bar ? 0.44 : 0.5);
  const proj = (x: number, y: number) => {
    const dx = x - tx, dy = y - ty;
    return { x: cx + (dx * cos - dy * sin) * s, y: cy + (dx * sin + dy * cos) * s };
  };
  const pts = (p: P[]) => p.map(([x, y]) => { const q = proj(x, y); return `${q.x.toFixed(1)},${q.y.toFixed(1)}`; }).join(" ");
  const pad = 200;
  const visible = (p: P[]) => p.some(([x, y]) => { const q = proj(x, y); return q.x > -pad && q.x < width + pad && q.y > -pad && q.y < height + pad; });

  const dNow = t * L[L.length - 1];
  const drawn: P[] = [];
  world.route.forEach((q, i) => { if (L[i] <= dNow) drawn.push(q); });
  drawn.push(head);
  const H = proj(head[0], head[1]);
  const S0 = proj(start[0], start[1]);
  const E0 = proj(end[0], end[1]);
  const pulse = 0.5 + 0.5 * Math.sin((f / fps) * Math.PI * 2 * 1.1);
  const f0 = legs ? legs[0].f0 : from;
  const arrived = legs ? k(f, legs[legs.length - 1].f1 - 4, legs[legs.length - 1].f1 + 10) : k(f, to - 4, to + 10);

  const minutesNow = bar ? Math.min(bar.minutes, Math.floor(barT * bar.minutes + 0.0001)) : 0;

  return (
    <AbsoluteFill style={{ background: GROUND, overflow: "hidden" }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="cw-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
        </defs>
        {world.ways.map((w, i) => {
          if (!visible(w.p)) return null;
          const foot = w.k === "footway" || w.k === "path" || w.k === "pedestrian";
          const big = w.k === "secondary" || w.k === "tertiary";
          return <polyline key={i} points={pts(w.p)} fill="none" stroke={ROAD} strokeOpacity={foot ? 0.55 : 1} strokeWidth={(foot ? 1.6 : big ? 9 : 5) * (s / 1.4)} strokeLinecap="round" strokeLinejoin="round" />;
        })}
        {world.buildings.map((b, i) => (visible(b.p) ? <polygon key={i} points={pts(b.p)} fill={BLOCK} stroke={BLOCK_EDGE} strokeWidth={1.5} /> : null))}
        {/* the line drawn so far: a soft glow under a solid stroke */}
        <polyline points={pts(drawn)} fill="none" stroke={B.color.accent} strokeOpacity={0.55} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" filter="url(#cw-glow)" />
        <polyline points={pts(drawn)} fill="none" stroke={B.color.accent} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
        {/* start: a small ring that stays where the walk began */}
        <circle cx={S0.x} cy={S0.y} r={13} fill={GROUND} stroke="#f7efe6" strokeWidth={5} />
        {/* end: the class building's pin, lit on arrival */}
        <circle cx={E0.x} cy={E0.y} r={14 + 6 * arrived} fill={arrived > 0.5 ? B.color.accent : GROUND} stroke={B.color.accent} strokeWidth={5} />
        {/* the walker */}
        <circle cx={H.x} cy={H.y} r={30 + pulse * 14} fill={B.color.accent} opacity={0.18 * (1 - arrived)} />
        <circle cx={H.x} cy={H.y} r={17} fill="#ffffff" stroke={B.color.accent} strokeWidth={7} opacity={1 - arrived * 0.9} />
      </svg>
      {/* on a long walk the walker carries the running figure, the way the product marks it */}
      {running ? (
        <div style={{ position: "absolute", left: H.x + 22, top: H.y - 66, width: 52, height: 52, borderRadius: 26, background: late ? B.color.accent : "#f7efe6",
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
          transform: `scale(${spring({ frame: f - (leg ? leg.f0 : 0), fps, config: { damping: 11, stiffness: 180 } }).toFixed(3)})` }}>
          <RunFigure size={34} color={late ? "#ffffff" : "#151213"} />
        </div>
      ) : null}

      {/* place names: where it starts, where it is going, and the places on the way as the dot passes them */}
      {[
        { label: fromLabel, x: S0.x, y: S0.y, at: Math.max(0, from - 30), until: from + 40, side: 1 },
        ...stops.map((q) => {
          const p = along(world.route, L, q.at); const P0 = proj(p[0], p[1]);
          const g = legs?.find((x) => q.at >= x.a0 - 1e-6 && q.at <= x.a1 + 1e-6);
          const when = g ? mix(g.f0, g.f1, (q.at - g.a0) / Math.max(1e-6, g.a1 - g.a0)) : mix(from, to, q.at);
          const isStop = legs?.some((x) => Math.abs(x.a1 - q.at) < 1e-4);
          return { label: q.label, x: P0.x, y: P0.y, at: when - 6, until: isStop ? 99999 : when + 30, side: -1 };
        }),
        { label: toLabel, x: E0.x, y: E0.y, at: (legs ? legs[legs.length - 1].f1 : to) - 26, until: 99999, side: 1 },
      ].map((l, i) => {
        const a = spring({ frame: f - l.at, fps, config: { damping: 12, stiffness: 170 } });
        // a name never sits over the bar's band: it gives way as it slides down into it
        const o = (1 - k(f, l.until, l.until + 8)) * (bar ? 1 - interpolate(l.y, [height * 0.56, height * 0.62], [0, 1], clampX) : 1);
        if (f < l.at || o <= 0) return null;
        return (
          <div key={i} style={{ position: "absolute", left: l.x + l.side * 34, top: l.y - 30, transform: `translate(${l.side < 0 ? "-100%" : "0"}, 0) scale(${(0.6 + 0.4 * Math.min(a, 1.08)).toFixed(3)})`,
            transformOrigin: l.side < 0 ? "right center" : "left center", opacity: Math.min(1, a) * o,
            display: "flex", alignItems: "center", gap: 12, padding: "10px 20px 10px 14px", borderRadius: 999, background: "rgba(247, 239, 230, 0.96)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.45)", fontFamily: INTER, fontWeight: 600, fontSize: 30, color: "#151213", whiteSpace: "nowrap" }}>
            <span style={{ width: 14, height: 14, borderRadius: 7, background: B.color.accent }} />
            {l.label}
          </div>
        );
      })}

      {/* the map's edges fade into the ground, and the bar's band */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${GROUND} 0%, rgba(18,13,14,0) 16%, rgba(18,13,14,0) 62%, ${GROUND} 80%)` }} />

      {bar ? (
        <>
          {/* the big number over the map, as the reference's pace does: the time of day, ticking */}
          {lateLine ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.625, display: "flex", justifyContent: "center", opacity: lateA,
              transform: `translateY(${((1 - lateA) * 16).toFixed(1)}px)` }}>
              <span style={{ padding: "8px 22px", borderRadius: 999, background: B.color.accent, fontFamily: INTER, fontWeight: 600, fontSize: 32, color: "#ffffff" }}>{lateLine}</span>
            </div>
          ) : null}
          <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.665, textAlign: "center", fontFamily: INTER, fontWeight: 600, fontSize: 112,
            letterSpacing: "-0.02em", color: late ? "#ff4d5a" : "#f7efe6", fontVariantNumeric: "tabular-nums", opacity: k(f, f0 - 24, f0 - 10) }}>
            {clockText(bar.clock + minutesNow)}
          </div>
          <div style={{ position: "absolute", left: 70, right: 70, top: height * 0.775, height: 4, borderRadius: 2, background: "rgba(247,239,230,0.14)", opacity: k(f, f0 - 24, f0 - 10) }}>
            <div style={{ width: `${barT * 100}%`, height: "100%", borderRadius: 2, background: B.color.accent }} />
          </div>
          <div style={{ position: "absolute", left: 70, right: 70, top: height * 0.8, display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            fontFamily: INTER, color: "#f7efe6", opacity: k(f, f0 - 20, f0 - 6), transform: `translateY(${(1 - k(f, f0 - 20, f0 - 4)) * 40}px)` }}>
            <div style={{ width: 280 }}>
              <div style={{ fontWeight: 600, fontSize: 64, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{bar.left.value}</div>
              <div style={{ fontSize: 28, color: "rgba(247,239,230,0.6)", marginTop: 4 }}>{bar.left.label}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 124, height: 124, borderRadius: 62, background: B.color.accent, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 ${40 + pulse * 20}px rgba(${B.color.glowRgb}, 0.55)` }}>
                {running ? <RunFigure size={74} color="#ffffff" /> : <WalkFigure size={70} color="#ffffff" />}
              </div>
              <div style={{ fontWeight: 600, fontSize: 30 }}>{bar.chip}</div>
            </div>
            <div style={{ width: 280, textAlign: "right" }}>
              <div style={{ fontWeight: 600, fontSize: 64, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: late ? "#ff4d5a" : undefined }}>{bar.right.value}</div>
              <div style={{ fontSize: 28, color: "rgba(247,239,230,0.6)", marginTop: 4 }}>{bar.right.label}</div>
            </div>
          </div>
        </>
      ) : null}
      {credit ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", fontFamily: INTER, fontSize: 20, color: "rgba(247,239,230,0.38)" }}>{credit}</div> : null}
    </AbsoluteFill>
  );
};
