/**
 * Scene 2: the graze tour (shelf shot `graze-face-tour`), on the REAL dashboard.
 *
 * The camera skims low over Maya's dashboard at a steep angle and keeps moving: down the sidebar,
 * across Your week, across Worth a look, then down to the Ask CampusAI cards. The shelf version
 * draws its own UI and fakes the hover with a 2D offset; here every floating row is a capture of
 * the real row (`capture/flock-film.cjs` hides those rows for `base.jpg` and screenshots each one
 * at its own box), lifted on real translateZ above the page and dropped back into its slot as the
 * camera reaches it, with its shadow on the page tightening as it lands.
 *
 * One continuous move with no cuts inside it (the shelf cuts between three planes). Landings are
 * quantised to half beats so the rows settle on the music.
 */
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Grain, Vignette, bezier, ramp, EASE } from "../shots/_fixtures/Polish";
import { B, BEAT_F, FIELD_END, TOUR_END } from "./beats";
import LAYERS from "../../public/flock/layers.json";

const SX = 540;
const SY = 960; // where the camera's subject sits on screen

type Key = { f: number; x: number; y: number; s: number; rx: number; ry: number; rz: number };
// Page coordinates are the 1440x900 dashboard.
const KEYS: Key[] = [
  { f: FIELD_END, x: 100, y: 60, s: 3.1, rx: 30, ry: 22, rz: -7 },
  { f: FIELD_END + 34, x: 110, y: 300, s: 2.9, rx: 27, ry: 18, rz: -5 },
  { f: FIELD_END + 60, x: 540, y: 205, s: 2.45, rx: 24, ry: -10, rz: 3 },
  { f: FIELD_END + 86, x: 1105, y: 235, s: 2.4, rx: 23, ry: -15, rz: 4 },
  { f: TOUR_END, x: 830, y: 555, s: 2.1, rx: 27, ry: 7, rz: -3 },
];
const catmull = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};
const camAt = (f: number) => {
  const ff = Math.max(KEYS[0].f, Math.min(KEYS[KEYS.length - 1].f + 8, f));
  let i = 0;
  while (i < KEYS.length - 2 && ff > KEYS[i + 1].f) i++;
  const a = KEYS[Math.max(0, i - 1)], b = KEYS[i], c = KEYS[i + 1], d = KEYS[Math.min(KEYS.length - 1, i + 2)];
  const t = (ff - b.f) / (c.f - b.f); // not clamped past the last key: the camera keeps flying into the cut
  const out = {} as Key;
  for (const k of ["x", "y", "s", "rx", "ry", "rz"] as const) out[k] = catmull(a[k], b[k], c[k], d[k], t);
  return out;
};

// When does the camera pass each layer? Closest approach of its centre, quantised to a half beat.
const easeFall = bezier(0.5, 0.05, 0.6, 1);
const H = 70; // hover height, page px
const FALL = 14;
const LAND = LAYERS.layers.map((l) => {
  const cx = l.x + l.w / 2, cy = l.y + l.h / 2;
  let best = FIELD_END, bd = Infinity;
  for (let f = FIELD_END; f <= TOUR_END; f++) {
    const c = camAt(f);
    const d = Math.hypot(c.x - cx, (c.y - cy) * 1.6);
    if (d < bd) { bd = d; best = f; }
  }
  const half = BEAT_F / 2;
  const q = B(0) + Math.round((best - 6 - B(0)) / half) * half;
  return Math.max(FIELD_END + 10, Math.min(TOUR_END - 4, q));
});

const Page: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 1440, height: 900, transformStyle: "preserve-3d" }}>
    <Img src={staticFile("flock/base.jpg")} style={{ position: "absolute", inset: 0, width: 1440, height: 900, display: "block" }} />
    {LAYERS.layers.map((l, i) => {
      const p = Math.min(1, Math.max(0, (f - (LAND[i] - FALL)) / FALL));
      const h = (1 - easeFall(p)) * H;
      const src = staticFile(`flock/fl-${l.i}.png`);
      return (
        <React.Fragment key={l.i}>
          {h > 1 && (
            <Img src={src} style={{ position: "absolute", left: l.x + h * 0.15, top: l.y + h * 0.3, width: l.w, height: l.h,
              filter: `brightness(0) blur(${(2 + h * 0.12).toFixed(1)}px)`, opacity: Math.min(0.55, 0.15 + h * 0.006) }} />
          )}
          <Img src={src} style={{ position: "absolute", left: l.x, top: l.y, width: l.w, height: l.h,
            transform: `translateZ(${h.toFixed(2)}px)` }} />
        </React.Fragment>
      );
    })}
  </div>
);

const Stage: React.FC<{ f: number }> = ({ f }) => {
  const c = camAt(f);
  return (
    <AbsoluteFill style={{ perspective: 1100, perspectiveOrigin: `${SX}px ${SY - 80}px` }}>
      <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transformStyle: "preserve-3d",
        transform: `translate(${SX}px, ${SY}px) scale(${c.s.toFixed(4)}) rotateX(${c.rx.toFixed(3)}deg) rotateY(${c.ry.toFixed(3)}deg) rotateZ(${c.rz.toFixed(3)}deg) translate(${(-c.x).toFixed(2)}px, ${(-c.y).toFixed(2)}px)` }}>
        {/* red rim light along the page edge, the brand glow in place of the shelf's neon */}
        <div style={{ position: "absolute", left: -60, top: -30, width: 40, height: 920, background: "linear-gradient(185deg, #ff5a64, #d9202e 55%, #7a0c18)", filter: "blur(40px)", opacity: 0.45 }} />
        <div style={{ position: "absolute", left: -30, top: -60, width: 1500, height: 40, background: "linear-gradient(90deg, #ff5a64, #d9202e 55%, #7a0c18)", filter: "blur(40px)", opacity: 0.35 }} />
        <Page f={f} />
      </div>
    </AbsoluteFill>
  );
};

export const GrazeTour: React.FC = () => {
  const f = useCurrentFrame();
  const inK = ramp(f, FIELD_END, 8, EASE.out);
  const out = ramp(f, TOUR_END - 6, 6, EASE.exit);
  const fy = 50 + 4 * Math.sin((f - FIELD_END) / 40);
  return (
    <AbsoluteFill style={{ background: "#0b0708", opacity: 1 - out }}>
      <AbsoluteFill style={{ filter: `brightness(${(0.6 + 0.4 * inK).toFixed(3)})` }}>
        <Stage f={f} />
        {/* shallow depth of field: the same stage, blurred outside the focus band */}
        <AbsoluteFill style={{ filter: "blur(9px)",
          WebkitMaskImage: `radial-gradient(ellipse 85% 40% at 50% ${fy}%, transparent 55%, rgba(0,0,0,0.8) 85%, black 100%)`,
          maskImage: `radial-gradient(ellipse 85% 40% at 50% ${fy}%, transparent 55%, rgba(0,0,0,0.8) 85%, black 100%)` }}>
          <Stage f={f} />
        </AbsoluteFill>
      </AbsoluteFill>
      <Vignette strength={0.45} inner={0.5} color="#0b0708" cy={fy / 100} />
      <Grain opacity={0.06} blend="soft-light" />
    </AbsoluteFill>
  );
};
