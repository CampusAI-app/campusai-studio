/**
 * ExplodedPage: a real captured page comes apart into its layers in 3D, holds so each layer can say
 * what it is, then snaps back into the flat page. Motion pass, wave 0 (2026-10-22).
 *
 * WHERE IT CAME FROM
 *   The exploded-assembly move of shelf shot `space-camera-moves` (../shots/demos/camera/
 *   space-camera-moves/ExplodedView.tsx), ported onto a real capture: the page ground stays back,
 *   real cards cropped from the capture by their measured boxes lift forward on separate depths with
 *   contact shadows, the slot each one left stays dark on the ground, the camera turns a little so
 *   the depth reads, then the layers drop back in reverse with a small landing settle and one sheen.
 *   Dictionary name: exploded view (camera family, "space camera moves").
 *
 * NUMBERS THAT MATTER (30 fps, all overridable through `timing`)
 *   apart 18    the camera starts turning and pushing in (36 frames, camera ease)
 *   lift        each layer rises on a spring (damping 15, stiffness 120, one soft overshoot),
 *               6 frames apart, upper layers higher so a rising lower card never covers one above
 *   lines       each drawn 8 frames, text rises 12, 8 frames apart, out 12 frames before `together`
 *   together    layers drop in reverse, ease-in 14 frames, 4 apart; the camera turns back flat
 *   land        the page sinks 6 px and settles (damped), one sheen crosses it
 *   Unlike the shelf shot it starts and ends on the page flat and face-on, so it hands off to any
 *   flat page shot. The page is laid out at its largest size and the push is a real dolly
 *   (translateZ under perspective), never transform: scale.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../../brand";
import { brand as getBrand, glow } from "../../brand";
import type { Rect, Size } from "../../camera";
import { INTER, SPARK, ramp } from "../../parts";
import { EASE, EASE_CAMERA } from "../../../lib/anim";

export type ExplodeLayer = {
  /** The piece of the page, in page px (the capture's JSON boxes). */
  rect: Rect;
  /** How far it lifts, in page px. Give upper layers more. */
  depth: number;
  /** A short line beside it while apart. A real string from the capture. */
  line?: string;
  /** Lead the line with the product's spark, as the product does on that heading. */
  spark?: boolean;
  /** Corner radius of the piece, page px. Default 12. */
  radius?: number;
};

/** A patch painted over the page in its own ground colour (the Maryland mark, for one). */
export type Cover = { rect: Rect; color: string };

/** The Maryland "M" and the divider before it, as measured on the pass captures (CSS px). */
export const markCover = (color: string): Cover => ({ rect: { x: 116, y: 10, w: 40, h: 36 }, color });

export type ExplodedPageProps = {
  src: string;
  page: Size;
  layers: ExplodeLayer[];
  brand?: Brand;
  cover?: Cover[];
  /** Where the flat page sits, frame px. Default: centred, 40 px side margins. */
  view?: Rect;
  /** While apart: which page region the camera frames (default the layers' bounds), where its centre
   *  lands on screen, and how wide it is there (frame px). */
  focus?: { region?: Rect; x: number; y: number; width: number };
  /** Camera turn while apart, degrees: rx tips the top away, ry turns the right side away. */
  turn?: { rx: number; ry: number };
  timing?: { apart?: number; stagger?: number; together?: number; lines?: number };
  /** Line size, frame px. */
  lineSize?: number;
};

const P = 2000; // perspective, frame px
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** The kit's ramp, written as a start and a length. */
const span = (f: number, a: number, len: number, e = EASE) => ramp(f, a, a + len, e);

/** The page image (with covers) laid out at scale k, shifted so page point (ox, oy) sits at 0,0. */
const PageImage: React.FC<{ src: string; page: Size; k: number; ox: number; oy: number; cover: Cover[] }> = ({ src, page, k, ox, oy, cover }) => (
  <>
    <Img src={src} style={{ position: "absolute", left: -ox * k, top: -oy * k, width: page.w * k, height: page.h * k, maxWidth: "none" }} />
    {cover.map((c, i) => (
      <div key={i} style={{ position: "absolute", left: (c.rect.x - ox) * k, top: (c.rect.y - oy) * k, width: c.rect.w * k, height: c.rect.h * k, background: c.color }} />
    ))}
  </>
);

export const ExplodedPage: React.FC<ExplodedPageProps> = (props) => {
  const f = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const b = props.brand ?? getBrand("campusai");
  const { page, layers, src } = props;
  const cover = props.cover ?? [];
  const n = layers.length;

  const apart = props.timing?.apart ?? 18;
  const stagger = props.timing?.stagger ?? 6;
  const together = props.timing?.together ?? 196;
  const linesAt = props.timing?.lines ?? apart + 30;
  const turn = props.turn ?? { rx: 14, ry: 14 };
  const lineSize = props.lineSize ?? 28;

  // Flat framing and the framing while apart.
  const view = props.view ?? (() => {
    const w = W - 80;
    const h = (w * page.h) / page.w;
    return { x: 40, y: (H - h) / 2, w, h };
  })();
  const bx0 = Math.min(...layers.map((l) => l.rect.x));
  const by0 = Math.min(...layers.map((l) => l.rect.y));
  const bx1 = Math.max(...layers.map((l) => l.rect.x + l.rect.w));
  const by1 = Math.max(...layers.map((l) => l.rect.y + l.rect.h));
  const region = props.focus?.region ?? { x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 };
  const focus = props.focus ?? { x: W * 0.62, y: H * 0.47, width: W * 0.5 };

  const flat = { fx: page.w / 2, fy: page.h / 2, ax: view.x + view.w / 2, ay: view.y + view.h / 2, s: view.w / page.w };
  const close = { fx: region.x + region.w / 2, fy: region.y + region.h / 2, ax: focus.x, ay: focus.y, s: focus.width / region.w };
  const k = Math.max(flat.s, close.s) * 1.04; // laid out at the largest size it is ever seen

  // Camera: out to the apart framing, back to flat, a slow push through the whole thing.
  const landAt = together + (n - 1) * 4 + 14;
  const go = span(f, apart, 36, EASE_CAMERA) * (1 - span(f, together - 2, landAt - together + 6, EASE_CAMERA));
  const drift = interpolate(f, [0, landAt + 60], [0, 1], { extrapolateRight: "clamp" });
  const orbit = span(f, apart + 20, together - apart - 20, Easing.inOut(Easing.sin));
  const mix = (a: number, c: number) => a + (c - a) * go;
  const fx = mix(flat.fx, close.fx);
  const fy = mix(flat.fy, close.fy);
  const ax = mix(flat.ax, close.ax);
  const ay = mix(flat.ay, close.ay);
  const s = mix(flat.s, close.s) * (1 + 0.025 * drift);
  const rx = turn.rx * go + 2 * orbit * go;
  const ry = turn.ry * go - 5 * orbit * go;
  const tz = P * (1 - k / s);
  // Landing settle.
  const since = f - landAt;
  const thud = since >= 0 ? 6 * Math.exp(-since / 3.2) * Math.cos(since * 0.85) : 0;
  // Where the focus point must sit before perspective so it lands at (ax, ay).
  const pre = { x: W / 2 + (ax - W / 2) * ((P - tz) / P), y: H / 2 + (ay - H / 2) * ((P - tz) / P) + thud };

  // Each layer: spring up, ease-in back down in reverse order.
  const lift = layers.map((_, i) => {
    const up = spring({ frame: f - (apart + 6 + i * stagger), fps, config: { damping: 15, stiffness: 120 } });
    const down = span(f, together + (n - 1 - i) * 4, 14, Easing.in(Easing.cubic));
    return up * (1 - down);
  });
  const spread = Math.max(0, ...lift.map(clamp01));

  // Page point at lift z (page px) to frame px, the same matrices CSS applies.
  const rad = Math.PI / 180;
  const project = (px: number, py: number, pz: number) => {
    const x = (px - fx) * k, y = (py - fy) * k, z = pz * k;
    const cy = Math.cos(ry * rad), sy = Math.sin(ry * rad), cx = Math.cos(rx * rad), sx = Math.sin(rx * rad);
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    const y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx + tz;
    const m = P / (P - z2);
    return { x: W / 2 + (pre.x + x1 - W / 2) * m, y: H / 2 + (pre.y + y2 - H / 2) * m };
  };

  const sheen = span(f, landAt + 2, 26, EASE_CAMERA);
  const R = 22; // page corner, page px

  return (
    <AbsoluteFill style={{ background: b.color.bgDeep, backgroundImage: b.color.gradient, overflow: "hidden" }}>
      <AbsoluteFill style={{ perspective: P, perspectiveOrigin: "50% 50%" }}>
        <div
          style={{
            position: "absolute",
            left: pre.x - fx * k,
            top: pre.y - fy * k,
            width: page.w * k,
            height: page.h * k,
            transformOrigin: `${fx * k}px ${fy * k}px`,
            transform: `translateZ(${tz.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* The ground: the whole page, frameless, lit by the product's own glow. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: R * k,
              overflow: "hidden",
              background: b.color.bg,
              boxShadow: `0 0 0 1.5px rgba(255,255,255,.08), 0 40px 120px rgba(0,0,0,.6), 0 0 140px ${glow(b, 0.13)}`,
            }}
          >
            <PageImage src={src} page={page} k={k} ox={0} oy={0} cover={cover} />
            {/* the slots the layers came out of */}
            {layers.map((l, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: l.rect.x * k,
                  top: l.rect.y * k,
                  width: l.rect.w * k,
                  height: l.rect.h * k,
                  borderRadius: (l.radius ?? 12) * k,
                  background: "rgba(4,3,4,0.92)",
                  boxShadow: `inset 0 0 0 ${1.2 * k}px rgba(255,255,255,0.07), inset 0 ${10 * k}px ${24 * k}px rgba(0,0,0,0.6)`,
                  opacity: clamp01(lift[i] * 4),
                }}
              />
            ))}
            {/* the ground steps back while the layers are out */}
            <div style={{ position: "absolute", inset: 0, background: "rgba(5,3,4,1)", opacity: 0.68 * spread }} />
            {sheen > 0 && sheen < 1 ? (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: page.w * k * 0.22,
                  left: interpolate(sheen, [0, 1], [-0.3, 1.1]) * page.w * k,
                  background: "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0) 100%)",
                }}
              />
            ) : null}
          </div>

          {/* contact shadows on the ground: further down, softer and fainter the higher the layer */}
          {layers.map((l, i) => {
            const h = l.depth * Math.max(0, lift[i]);
            if (h < 0.5) return null;
            return (
              <div
                key={`s${i}`}
                style={{
                  position: "absolute",
                  left: (l.rect.x + h * 0.1) * k,
                  top: (l.rect.y + h * 0.2) * k,
                  width: l.rect.w * k,
                  height: l.rect.h * k,
                  borderRadius: (l.radius ?? 12) * k,
                  background: "rgba(0,0,0,0.75)",
                  filter: `blur(${((6 + h * 0.12) * k).toFixed(1)}px)`,
                  opacity: clamp01(lift[i] * 2) * (0.85 - Math.min(0.4, h / 600)),
                  transform: "translateZ(1px)",
                }}
              />
            );
          })}

          {/* the layers themselves: the real pixels of the page, lifted along its normal */}
          {layers.map((l, i) => {
            const p = lift[i];
            const z = l.depth * p;
            const on = clamp01(p * 4);
            return (
              <div
                key={`l${i}`}
                style={{
                  position: "absolute",
                  left: l.rect.x * k,
                  top: l.rect.y * k,
                  width: l.rect.w * k,
                  height: l.rect.h * k,
                  borderRadius: (l.radius ?? 12) * k,
                  overflow: "hidden",
                  background: b.color.bg,
                  transform: `translateZ(${(z * k + 2).toFixed(2)}px)`,
                  boxShadow: on > 0.02 ? `0 0 0 ${1.2 * k}px rgba(255,255,255,${(0.14 * on).toFixed(3)})` : undefined,
                }}
              >
                <PageImage src={src} page={page} k={k} ox={l.rect.x} oy={l.rect.y} cover={cover} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* Lines: anchored to each layer's left edge, set flat in a column to its left. */}
      {(() => {
        const placed: { i: number; ax: number; ay: number; y: number }[] = [];
        layers.forEach((l, i) => {
          if (!l.line) return;
          const z = l.depth * lift[i];
          const a = project(l.rect.x, l.rect.y + l.rect.h / 2, z);
          const prev = placed[placed.length - 1];
          placed.push({ i, ax: a.x, ay: a.y, y: prev ? Math.max(a.y, prev.y + lineSize * 2.3) : a.y });
        });
        const colRight = Math.min(...placed.map((p) => p.ax)) - 40;
        return placed.map(({ i, ax, ay, y }, order) => {
          const l = layers[i];
          const start = linesAt + order * 8;
          const draw = span(f, start, 8);
          const rise = span(f, start + 5, 12);
          const out = span(f, together - 12 + (placed.length - 1 - order) * 2, 10, Easing.in(Easing.cubic));
          if (draw <= 0 || out >= 1) return null;
          const lx0 = colRight + 14;
          const len = Math.abs(ax - 8 - lx0) + Math.abs(ay - y);
          return (
            <React.Fragment key={`t${i}`}>
              <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
                <path
                  d={`M${ax - 8},${ay} L${Math.max(lx0 + 20, ax - 30)},${ay} L${lx0},${y}`}
                  fill="none"
                  stroke={b.color.accent}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={`${len} ${len}`}
                  strokeDashoffset={len * (1 - draw)}
                />
                <circle cx={ax - 2} cy={ay} r={6.5 * Math.min(1, draw * 3)} fill={b.color.accent} stroke={b.color.ink} strokeWidth={2.5} />
              </svg>
              <div
                style={{
                  position: "absolute",
                  right: W - colRight,
                  top: y,
                  maxWidth: colRight - 40,
                  transform: `translateY(calc(-50% + ${((1 - rise) * 18 - out * 10).toFixed(2)}px))`,
                  opacity: rise * (1 - out),
                  fontFamily: INTER,
                  fontWeight: 600,
                  fontSize: lineSize,
                  lineHeight: 1.18,
                  letterSpacing: "-0.01em",
                  color: b.color.ink,
                  textShadow: "0 2px 16px rgba(0,0,0,0.9)",
                  textAlign: "right",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: lineSize * 0.32,
                }}
              >
                {l.spark ? (
                  <svg width={lineSize * 0.62} height={lineSize * 0.62} viewBox="0 0 24 24" style={{ flex: "none" }}>
                    <path d={SPARK} fill={b.color.accent} />
                  </svg>
                ) : null}
                <span style={{ whiteSpace: "nowrap" }}>{l.line}</span>
              </div>
            </React.Fragment>
          );
        });
      })()}
    </AbsoluteFill>
  );
};
