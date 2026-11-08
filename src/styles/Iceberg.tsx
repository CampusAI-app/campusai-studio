/**
 * /iceberg (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). What you see versus what sits under it. The tip of an iceberg floats at the waterline with one label; the
 * camera sinks through the surface (a ripple line, the light going deeper and darker) down the body of the berg, and
 * each layer below the water labels one true thing the tip does not show, the lowest one in red. Then it rises back
 * to the tip. Drawn in code: a faceted berg in the brand's warm ink, water in the brand's near-black.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR, readHold } from "../system/motion";
import { loadFont as DISPLAYFont } from "@remotion/google-fonts/Fraunces";
import { loadFont as TEXTFont } from "@remotion/google-fonts/Manrope";
import { Cue, clamp, ramp } from "./common";
import { Heading, World } from "./world";

// rebuilt 11/08 as its own world: a red-dusk sea, a cream berg lit pink, labels in Fraunces
const { fontFamily: DISPLAY } = DISPLAYFont("normal", { weights: ["600", "700"], subsets: ["latin"] });
const { fontFamily: TEXT } = TEXTFont("normal", { weights: ["500", "700"], subsets: ["latin"] });
const INK = "#FFF1E8";
const SOFT = "#FFC2B0";
const DEEP = "#12030A";
const GLOW = "255, 110, 80";
const ACCENT = "#FF5A47";

export type IcebergProps = {
  title: string;
  /** The tip, what everyone sees: a short name and a line under it. */
  tip: { label: string; sub: string };
  /** What sits under it, top to bottom. The last one is the accent. */
  below: string[];
  source: string;
  cta?: string;
};

const FPS = 30;
const SINK_AT = 54;
const PER_LAYER = 34; // motion: frames per layer on the way down, a slow descent so each label reads

export const icebergPlan = (p: IcebergProps) => {
  // each layer waits for the one above it to be read (it stays on screen while the next arrives)
  let t = SINK_AT + 18;
  const layers = p.below.map((text) => { const at = t; t += Math.max(PER_LAYER, Math.round(readHold(text) * FPS * 0.75)); return { text, at }; });
  const bottom = layers[layers.length - 1].at + Math.round(readHold(p.below[p.below.length - 1]) * FPS);
  const rise = bottom + DUR.travel + 10;
  const end = rise + Math.round((readHold(p.tip.label) + 0.6) * FPS);
  return { layers, bottom, rise, end };
};
export const icebergEnd = (p: IcebergProps) => icebergPlan(p).end;

const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

export const Iceberg: React.FC<IcebergProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { layers, bottom, rise, end } = icebergPlan(p);
  const water = height * 0.46;
  const depth = height * (1.1 + p.below.length * 0.42); // how far down the berg reaches
  const cx = width / 2;
  // the camera: hold on the tip, sink layer by layer, then rise back to the tip
  const stops = layers.map((l, i) => ({ at: l.at - 14, y: water + (i + 0.8) * ((depth - water) / (p.below.length + 0.3)) - height * 0.5 }));
  const camKeys = [0, SINK_AT, ...stops.map((s) => s.at), bottom, rise];
  const camVals = [0, 0, ...stops.map((s) => s.y), stops[stops.length - 1].y, 0];
  const cam = interpolate(f, camKeys, camVals, { ...clamp, easing: CURVE.quiet.standard });
  const bob = Math.sin(f / 22) * 6;
  const berg = useMemo(() => {
    const r = rng(77);
    const tipW = width * 0.34, bodyW = width * 1.05;
    const top = water - height * 0.16;
    const pts: [number, number][] = [];
    pts.push([cx - tipW * 0.18, top]);
    pts.push([cx + tipW * 0.1, top - 30]);
    pts.push([cx + tipW * 0.5, water - 40]);
    pts.push([cx + tipW * 0.62, water]);
    const steps = 9;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const w = bodyW * (0.55 + 0.45 * Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5)) * (1 - Math.pow(t, 2.4) * 0.8);
      pts.push([cx + w / 2 + (r() - 0.5) * 40, water + t * (depth - water)]);
    }
    for (let i = steps; i >= 1; i--) {
      const t = i / steps;
      const w = bodyW * (0.55 + 0.45 * Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5)) * (1 - Math.pow(t, 2.4) * 0.8);
      pts.push([cx - w / 2 + (r() - 0.5) * 40, water + t * (depth - water)]);
    }
    pts.push([cx - tipW * 0.66, water]);
    pts.push([cx - tipW * 0.42, water - 50]);
    return pts;
  }, [width, height, water, depth, cx]);
  const path = `M${berg.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L")} Z`;
  const facets = berg.filter((_, i) => i % 2 === 0).map(([x, y]) => `M${cx},${water + (y > water ? (y - water) * 0.4 : -40)} L${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const tipK = ramp(f, 8, 8 + DUR.arrive, CURVE.quiet.enter) * (1 - ramp(f, SINK_AT, SINK_AT + 10)) + ramp(f, rise - 4, rise + 10);
  return (
    <World endAt={end} cta={p.cta} font={DISPLAY} ink={INK} logo="white" logoSpot="top-left" end="wipe-up" endGround="#7A0E1E" ground="linear-gradient(180deg, #FFB08A 0%, #F06A4E 18%, #C42A35 34%, #7A0E1E 46%, #3A0712 70%, #12030A 100%)">
      <AbsoluteFill style={{ transform: `translateY(${(-cam).toFixed(1)}px)` }}>
        {/* water, darker with depth */}
        <div style={{ position: "absolute", left: 0, right: 0, top: water, height: depth - water + height, background: `repeating-linear-gradient(100deg, rgba(255,170,150,.06) 0 40px, transparent 40px 140px), linear-gradient(rgba(${GLOW},0.22), #3A0712 35%, ${DEEP})` }} />
        <svg width={width} height={depth + height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <clipPath id="under"><rect x={0} y={water} width={width} height={depth + height} /></clipPath>
            <clipPath id="over"><rect x={0} y={-height} width={width} height={water + height} /></clipPath>
          </defs>
          <g transform={`translate(0 ${bob.toFixed(1)})`}>
            <g clipPath="url(#over)">
              <path d={path} fill={INK} />
              <path d={facets} stroke={SOFT} strokeOpacity={0.5} strokeWidth={3} fill="none" />
            </g>
            <g clipPath="url(#under)" opacity={0.5}>
              <path d={path} fill={SOFT} fillOpacity={0.35} stroke={INK} strokeOpacity={0.3} strokeWidth={3} />
              <path d={facets} stroke={INK} strokeOpacity={0.15} strokeWidth={3} fill="none" />
            </g>
          </g>
          {/* the waterline, rippling */}
          <path d={`M0,${water} ${[...Array(25)].map((_, i) => `L${(i * width) / 24},${(water + Math.sin(i * 1.3 + f / 7) * 5).toFixed(1)}`).join(" ")}`} stroke={INK} strokeOpacity={0.55} strokeWidth={3} fill="none" />
        </svg>
        {/* the tip's label */}
        <div style={{ position: "absolute", left: 64, right: 64, top: water - height * 0.16 - 210, textAlign: "center", opacity: tipK, transform: `translateY(${(1 - tipK) * 14}px)` }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 84, lineHeight: 1, color: INK, letterSpacing: "-0.02em" }}>{p.tip.label}</div>
          <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 34, color: SOFT, marginTop: 12 }}>{p.tip.sub}</div>
        </div>
        {/* the layers below */}
        {layers.map((l, i) => {
          const k = ramp(f, l.at, l.at + DUR.arrive, CURVE.quiet.enter);
          const y = stops[i].y + height * 0.5;
          const last = i === layers.length - 1;
          // fade out before the camera carries it past the frame edge, and drop the layers on the way back up
          const onScreen = y - 60 - cam;
          const edge = Math.min(1, Math.max(0, (onScreen - 180) / 120)) * Math.min(1, Math.max(0, (height - 360 - onScreen) / 120));
          return (
            <div key={i} style={{ position: "absolute", left: 64, right: 64, top: y - 60, textAlign: "center", opacity: k * edge * (1 - ramp(f, bottom, bottom + 12)), transform: `translateY(${(1 - k) * 18}px)` }}>
              <div style={{ display: "inline-block", padding: "14px 30px", borderRadius: 16, background: "rgba(58,7,18,.72)", fontFamily: DISPLAY, fontWeight: 700, fontSize: 64,
                lineHeight: 1.1, color: last ? ACCENT : INK, letterSpacing: "-0.015em" }}>{l.text}</div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Heading font={DISPLAY} color={INK} size={76} out={SINK_AT + 10}>{p.title}</Heading>
      <Heading font={DISPLAY} color={INK} size={76} at={rise} out={end + 40}>{p.title}</Heading>
      <div style={{ position: "absolute", left: 64, right: 64, top: water - height * 0.16 - 300, fontFamily: TEXT, fontSize: 34, color: INK, textAlign: "center",
        opacity: ramp(f, rise - 6, rise + 8) }}>{p.source}</div>
      <Cue at={SINK_AT} name="swoosh-slow" volume={0.35} />
      {layers.map((l, i) => <Cue key={i} at={l.at} name={i === layers.length - 1 ? "bass-hit-short" : "paper-move-quick"} volume={0.4} />)}
      <Cue at={bottom} name="air-woosh-quick" volume={0.3} />
    </World>
  );
};
