/**
 * /map-route: real buildings rise off the ground, the route draws itself, the minutes count. Footprints and
 * paths are OpenStreetMap, baked into a JSON (`public/styles/*.json`) so a render never touches the network.
 * Drawn as projected SVG, sorted far to near. The route is laid under the buildings and again faintly over them.
 */
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR } from "../system/motion";
import { B, Clip, Cue, INTER, RED, ZODIAK, clamp, ramp } from "./common";

type P = [number, number];
type Campus = { buildings: { n: string; h: number; p: P[] }[]; ways: { k: string; p: P[] }[]; route: P[]; routeMeters: number; minutes: number };
export type MapRouteProps = { data: string; from: string; to: string; toBuilding: string; pass?: { label: string; building: string }[]; credit: string };

export const ROUTE_END = 262;
const RISE_TO = 44;
const DRAW_FROM = 14;
const DRAW_TO = 214;

const lengths = (r: P[]) => { const l = [0]; for (let i = 1; i < r.length; i++) l.push(l[i - 1] + Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1])); return l; };
const along = (r: P[], l: number[], t: number): P => {
  const d = t * l[l.length - 1];
  let i = 1; while (i < l.length - 1 && l[i] < d) i++;
  const k = (d - l[i - 1]) / Math.max(l[i] - l[i - 1], 1e-6);
  return [r[i - 1][0] + (r[i][0] - r[i - 1][0]) * k, r[i - 1][1] + (r[i][1] - r[i - 1][1]) * k];
};
const centroid = (p: P[]): P => [p.reduce((a, q) => a + q[0], 0) / p.length, p.reduce((a, q) => a + q[1], 0) / p.length];

export const MapRoute: React.FC<MapRouteProps> = ({ data, from, to, toBuilding, pass = [], credit }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const [campus, setCampus] = useState<Campus | null>(null);
  const [wait] = useState(() => delayRender("campus data"));
  useEffect(() => { fetch(staticFile(data)).then((r) => r.json()).then((j) => { setCampus(j); continueRender(wait); }); }, [data, wait]);
  const L = useMemo(() => (campus ? lengths(campus.route) : []), [campus]);
  if (!campus) return null;

  const t = interpolate(f, [DRAW_FROM, DRAW_TO], [0, 1], { ...clamp, easing: CURVE.quiet.standard });
  const head = along(campus.route, L, t);
  const lag = along(campus.route, L, Math.max(0, t - 0.1));
  const open = ramp(f, 0, 50, CURVE.quiet.standard);
  const yaw = Math.PI + interpolate(f, [0, ROUTE_END], [0.5, 0.2], clamp);
  const pitch = interpolate(open, [0, 1], [0.32, 0.92], clamp);
  const dist = interpolate(f, [0, 50, DRAW_TO, ROUTE_END], [1500, 1060, 1000, 1040], clamp);
  const wide = ramp(f, DRAW_TO - 40, ROUTE_END, CURVE.quiet.standard);
  const mid = along(campus.route, L, 0.5);
  const hold = 0.68 + 0.32 * wide; /* the follow stays loose so the start and the head are both in frame */
  const tx = lag[0] + (mid[0] - lag[0]) * hold, ty = lag[1] + (mid[1] - lag[1]) * hold;
  const cx = width / 2, cy = height * 0.52, fl = 1150;
  const cos = Math.cos(yaw), sin = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const proj = (x: number, y: number, z = 0) => {
    const dx = x - tx, dy = y - ty;
    const rx = dx * cos - dy * sin, ry = dx * sin + dy * cos;
    const y2 = ry * cp - z * sp, d = dist - ry * sp - z * cp;
    return { x: cx + (fl * rx) / d, y: cy + (fl * y2) / d, d };
  };
  const pts = (p: { x: number; y: number }[]) => p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
  const on = (p: { x: number; y: number }) => p.x > -300 && p.x < width + 300 && p.y > -500 && p.y < height + 400;

  const start = campus.route[0];
  const items = campus.buildings.map((b) => {
    const c = centroid(b.p);
    const pc = proj(c[0], c[1]);
    return { b, c, d: pc.d, seen: on(pc) && pc.d > 60 };
  }).filter((x) => x.seen).sort((a, b) => b.d - a.d);

  const drawnRoute: P[] = [];
  const dNow = t * L[L.length - 1];
  campus.route.forEach((q, i) => { if (L[i] <= dNow) drawnRoute.push(q); });
  drawnRoute.push(head);
  const routePts = pts(drawnRoute.map(([x, y]) => proj(x, y)));
  const headP = proj(head[0], head[1]);
  const arrive = ramp(f, DRAW_TO - 8, DRAW_TO + DUR.arrive, CURVE.showy.enter);
  const fadeIn = (at: number) => ramp(f, at, at + DUR.arrive, CURVE.quiet.enter);
  const mins = Math.floor(t * campus.minutes + 0.001);

  const label = (b: string) => { const x = campus.buildings.find((q) => q.n === b); return x ? centroid(x.p) : null; };
  const fromP = proj(start[0], start[1]);
  const toC = label(toBuilding);
  const toP = toC ? proj(toC[0], toC[1], 34) : null;

  return (
    <Clip endAt={ROUTE_END}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {campus.ways.map((w, i) => {
          const q = w.p.map(([x, y]) => proj(x, y));
          if (q.some((n) => n.d < 120)) return null; /* behind the camera a projected line streaks across the frame */
          const foot = w.k === "footway" || w.k === "path";
          return <polyline key={i} points={pts(q)} fill="none" stroke={B.color.ink} strokeOpacity={foot ? 0.14 : 0.24} strokeWidth={foot ? 1.5 : 3} />;
        })}
        <polyline points={routePts} fill="none" stroke={RED} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
        {items.map(({ b, c }) => {
          const seed = Math.hypot(c[0] - start[0], c[1] - start[1]) / 900;
          const g = ramp(f, 2 + seed * 18, 2 + seed * 18 + RISE_TO - 18, CURVE.showy.enter);
          const isTo = b.n === toBuilding;
          const h = (b.h + (isTo ? arrive * 12 : 0)) * g;
          const base = b.p.map(([x, y]) => proj(x, y));
          const top = b.p.map(([x, y]) => proj(x, y, h));
          const walls = b.p.map((_, i) => {
            const j = (i + 1) % b.p.length;
            return { i, j, d: (base[i].d + base[j].d) / 2, shade: Math.abs(Math.cos(Math.atan2(b.p[j][1] - b.p[i][1], b.p[j][0] - b.p[i][0]) + yaw)) };
          }).sort((m, n) => n.d - m.d);
          const roof = isTo ? `rgba(${B.color.glowRgb},${0.25 + arrive * 0.75})` : "#4a3a3e";
          return (
            <g key={b.n + c[0]}>
              {h > 0.5 ? walls.map((w) => (
                <polygon key={w.i} points={pts([base[w.i], base[w.j], top[w.j], top[w.i]])}
                  fill={isTo && arrive > 0.2 ? "#7c141c" : `rgb(${Math.round(30 + w.shade * 30)},${Math.round(23 + w.shade * 22)},${Math.round(26 + w.shade * 24)})`} />
              )) : null}
              <polygon points={pts(top)} fill={roof} />
            </g>
          );
        })}
        <polyline points={routePts} fill="none" stroke={RED} strokeOpacity={0.4} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={headP.x} cy={headP.y} r={13} fill={B.color.ink} stroke={RED} strokeWidth={6} opacity={ramp(f, 4, 10)} />
      </svg>
      {[{ text: from, p: fromP, at: 4, end: 76 }, ...(toP ? [{ text: to, p: toP, at: DRAW_TO - 14, end: 999 }] : []),
        ...pass.flatMap((q) => { const c = label(q.building); if (!c) return []; const near = L.findIndex((_, i) => Math.hypot(campus.route[i][0] - c[0], campus.route[i][1] - c[1]) < 70); const when = DRAW_FROM + (near / L.length) * (DRAW_TO - DRAW_FROM); return [{ text: q.label, p: proj(c[0], c[1], 30), at: when - 10, end: when + 50 }]; }),
      ].map((l) => {
        const k = fadeIn(l.at) * (1 - ramp(f, l.end, l.end + 10));
        return (
          <div key={l.text} style={{ position: "absolute", left: l.p.x, top: l.p.y - 62, transform: `translate(-50%, ${(1 - k) * 12}px)`, opacity: k, whiteSpace: "nowrap", fontFamily: INTER, fontWeight: 600, fontSize: 36, color: B.color.ink, textShadow: "0 2px 18px rgba(0,0,0,.95)" }}>
            {l.text}
          </div>
        );
      })}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${B.color.bgDeep} 12%, transparent 30%, transparent 78%, ${B.color.bgDeep} 100%)` }} />
      <div style={{ position: "absolute", left: 64, top: 196, fontFamily: ZODIAK, fontWeight: 700, fontSize: 64, lineHeight: 1.08, letterSpacing: "-0.02em", color: B.color.ink, opacity: fadeIn(4) }}>
        {from} to {to}
      </div>
      <div style={{ position: "absolute", left: 64, bottom: 190, fontFamily: ZODIAK, fontWeight: 700, fontSize: 170, lineHeight: 1, letterSpacing: "-0.03em", color: B.color.ink, fontVariantNumeric: "tabular-nums", opacity: fadeIn(DRAW_FROM - 10) }}>
        {mins} <span style={{ fontFamily: INTER, fontWeight: 500, fontSize: 56, letterSpacing: "-0.01em", color: B.color.inkSoft }}>min walk</span>
      </div>
      <div style={{ position: "absolute", left: 64, bottom: 150, fontFamily: INTER, fontSize: 22, color: B.color.inkSoft, opacity: 0.7 * fadeIn(20) }}>{credit}</div>
      <Cue at={4} name="air-woosh-quick" volume={0.4} />
      <Cue at={DRAW_FROM} name="swoosh-slow" volume={0.4} />
      <Cue at={DRAW_TO - 4} name="bass-hit-short" volume={0.55} />
    </Clip>
  );
};
