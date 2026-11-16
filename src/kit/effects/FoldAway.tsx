/**
 * Fold away (2026-11-16, from Claudian's Fable 5.2 résumé film, stepped frame by frame; films/claudian-checklist/facts.md).
 * The object becomes the transition: a piece of a real capture (a card) lifts off its page, folds itself into a paper
 * plane, and flies to a point, landing there with a ring. Use it to carry a result to where it lands (an event card to
 * its slot on the calendar) instead of cutting.
 *
 * The folds are real paper folds, not a morph. The card is cut along each crease, and every piece on the folding side
 * turns about the crease line. Seen straight on, turning by θ about a line squashes the piece across that line by cos θ,
 * so each fold is an affine map, and past 90 degrees the piece shows the paper's back. A later crease cuts the
 * already-folded layers too, the way paper behaves. The nose points right (+x), so a wide card folds along its length.
 *
 * Measured in the reel (60 fps): crease 1, both top corners to the centre line, 0.2 s; crease 2, the slanted edges to the
 * centre again, 0.15 s; crease 3, in half, 0.1 s; wings and turn, 0.3 s; 0.9 s from first crease to plane. The front
 * stays readable through creases 1 and 2. Ours stretches those by 1.33 so a phone viewer can follow it (30 fps):
 * lift 5, crease 1 8, gap 1, crease 2 6, gap 2, crease 3 5, plane 6, flight `fly` (34), landing 6 frames.
 *
 *   <FoldAway shot={card} width={957} from={{ x: 23, y: 125 }} to={{ x: 356, y: 620 }} at={45} />
 * Positions are in the parent's px; the parent is the box FoldAway is placed in (it fills it). The card is drawn at
 * `from` exactly as `Shot` draws the same crop at the same width, so it lifts off the page seamlessly.
 */
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { B, IN, OUT, SWING, clampX, k } from "./shared";
import type { Capture } from "./shared";

type Pt = [number, number];
/** An affine map as CSS matrix(a, b, c, d, e, f): x' = a x + c y + e, y' = b x + d y + f. */
type M = [number, number, number, number, number, number];

const ID: M = [1, 0, 0, 1, 0, 0];
const mul = (m: M, n: M): M => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
]; // m after n
const apply = (m: M, p: Pt): Pt => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
const inv = (m: M): M => {
  const det = m[0] * m[3] - m[1] * m[2];
  const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
};
/** Turning by θ about the line a-b, seen straight on: squash by cos θ across the line. */
const foldM = (a: Pt, b: Pt, cos: number): M => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
  const s = cos - 1;
  const L: M = [1 + s * nx * nx, s * nx * ny, s * nx * ny, 1 + s * ny * ny, 0, 0];
  const t = apply(L, a);
  return [L[0], L[1], L[2], L[3], a[0] - t[0], a[1] - t[1]];
};
const side = (a: Pt, b: Pt, p: Pt) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
/** The part of a polygon on one side of a line (Sutherland-Hodgman against one edge). */
const clipHalf = (poly: Pt[], a: Pt, b: Pt, sign: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const sp = side(a, b, p) * sign, sq = side(a, b, q) * sign;
    if (sp >= 0) out.push(p);
    if ((sp >= 0) !== (sq >= 0)) {
      const t = sp / (sp - sq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
};
const area = (poly: Pt[]) => Math.abs(poly.reduce((s, p, i) => {
  const q = poly[(i + 1) % poly.length];
  return s + p[0] * q[1] - q[0] * p[1];
}, 0)) / 2;

type Crease = { a: Pt; b: Pt; toward: Pt; from: number; len: number };
type Piece = { poly: Pt[]; folds: number[] };

// motion: the reel's crease lengths x 1.33, in frames at 30 fps (see the header).
export const FOLD = { lift: 5, c1: [5, 8], c2: [14, 6], c3: [22, 5], plane: [27, 6], fly: 34, land: 6 } as const;

/** When each phase happens, from the frame the fold starts. `land` is the frame the plane touches down. */
export const foldAwayTimes = (at: number, fly: number = FOLD.fly) => {
  const flyFrom = at + FOLD.plane[0] + FOLD.plane[1];
  return { at, creased: at + FOLD.c3[0] + FOLD.c3[1], flyFrom, land: flyFrom + fly, end: flyFrom + fly + FOLD.land };
};

/** The creases of a dart folded from a w x h card, nose at the right, and the pieces they cut. */
const planOf = (w: number, h: number) => {
  const m = h / 2;
  const k2 = 1 / Math.tan(Math.PI / 8); // crease 2 bisects the 45 degree edge onto the centre line
  const N: Pt = [w, m];
  const c = FOLD;
  const creases: Crease[] = [
    { a: [w - m, 0], b: N, toward: [w, 0], from: c.c1[0], len: c.c1[1] },
    { a: [w - m, h], b: N, toward: [w, h], from: c.c1[0], len: c.c1[1] },
    { a: [Math.max(0, w - k2 * m), 0], b: N, toward: [w - m - 1, 0.5], from: c.c2[0], len: c.c2[1] },
    { a: [Math.max(0, w - k2 * m), h], b: N, toward: [w - m - 1, h - 0.5], from: c.c2[0], len: c.c2[1] },
    { a: [0, m], b: [w, m], toward: [0, h], from: c.c3[0], len: c.c3[1] },
  ];
  let pieces: Piece[] = [{ poly: [[0, 0], [w, 0], [w, h], [0, h]], folds: [] }];
  creases.forEach((cr, ci) => {
    const sign = Math.sign(side(cr.a, cr.b, cr.toward));
    const next: Piece[] = [];
    for (const p of pieces) {
      // where this piece lies once every earlier fold is complete
      const T = p.folds.reduce((acc, j) => mul(foldM(creases[j].a, creases[j].b, -1), acc), ID);
      const placed = p.poly.map((q) => apply(T, q));
      const back = inv(T);
      const stay = clipHalf(placed, cr.a, cr.b, -sign);
      const turn = clipHalf(placed, cr.a, cr.b, sign);
      if (stay.length > 2 && area(stay) > 1) next.push({ poly: stay.map((q) => apply(back, q)), folds: p.folds });
      if (turn.length > 2 && area(turn) > 1) next.push({ poly: turn.map((q) => apply(back, q)), folds: [...p.folds, ci] });
    }
    pieces = next;
  });
  return { creases, pieces };
};

/** A paper plane seen from above and a little behind, nose at the right, in a 120 x 100 box. */
const Plane: React.FC<{ paper: string }> = ({ paper }) => (
  <svg width="100%" height="100%" viewBox="0 0 120 100" style={{ display: "block", overflow: "visible" }}>
    <polygon points="120,50 2,10 16,50" fill={paper} style={{ filter: "brightness(0.9)" }} />
    <polygon points="120,50 16,50 22,64" fill={paper} style={{ filter: "brightness(0.72)" }} />
    <polygon points="120,50 6,94 16,50" fill={paper} />
    <polyline points="120,50 16,50" fill="none" stroke="rgba(60, 10, 16, 0.25)" strokeWidth={0.8} />
  </svg>
);

export type FoldAwayProps = {
  /** The piece of a real capture that folds: usually one card, cropped to its edges. */
  shot: Capture;
  /** Drawn width of the card in px (its height follows the crop). */
  width: number;
  /** Top-left of the card where it sits on its page, in the parent's px. */
  from: { x: number; y: number };
  /** Where the plane lands, in the parent's px. */
  to: { x: number; y: number };
  /** Frame the fold starts (the lift). */
  at: number;
  /** Frames of flight; default 34. */
  fly?: number;
  /** The paper's back. */
  paper?: string;
  /** Plane width at the start of the flight and at touchdown, px. */
  planeWidth?: number;
  landWidth?: number;
  /** How far the flight swings out ahead of the nose before it turns, and rises, px. */
  reach?: number;
  lift?: number;
  accent?: string;
};

export const FoldAway: React.FC<FoldAwayProps> = ({
  shot, width: W, from, to, at, fly = FOLD.fly, paper = "#F7E3DF", planeWidth, landWidth = 130, reach, lift = 70,
  accent = B.color.accent,
}) => {
  const f = useCurrentFrame();
  const H = (shot.crop.h / shot.crop.w) * W;
  const { creases, pieces } = React.useMemo(() => planOf(W, H), [W, H]);
  const t = foldAwayTimes(at, fly);
  if (f < at || f > t.end + 18) return null;
  const local = f - at;
  const s = W / shot.crop.w;

  // the card, folding (until the plane takes over)
  const planeIn = k(local, FOLD.plane[0], FOLD.plane[0] + 4);
  const liftK = k(local, 0, FOLD.lift);
  const thetas = creases.map((c) => Math.PI * interpolate(local, [c.from, c.from + c.len], [0, 1], { ...clampX, easing: SWING }));
  const drawn = pieces.map((p, i) => {
    let m = ID;
    let flips = 0;
    let moving = false;
    for (const j of p.folds) {
      const th = thetas[j];
      m = mul(foldM(creases[j].a, creases[j].b, Math.cos(th)), m);
      if (th > Math.PI / 2) flips++;
      if (th > 0 && th < Math.PI) moving = true;
    }
    const shade = moving ? 0.28 * (1 - Math.abs(Math.cos(thetas[p.folds[p.folds.length - 1]]))) : 0;
    const order = (p.folds.length ? p.folds[p.folds.length - 1] + 1 : 0) * 10 + (moving ? 100 : 0) + p.folds.length;
    return { i, p, m, back: flips % 2 === 1, shade, order };
  }).sort((a, b) => a.order - b.order);

  // the folded body: the top half of the card, x 0..W, y 0..H/2; its centre is where the plane is born
  const bodyC = { x: from.x + W / 2, y: from.y + H / 4 };
  const pw = planeWidth ?? Math.min(420, W * 0.45);
  const ph = pw * (100 / 120);
  const ctrl = { x: bodyC.x + (reach ?? W * 0.45), y: bodyC.y - lift };
  const at01 = (fr: number) => interpolate(fr, [t.flyFrom, t.land], [0, 1], { ...clampX, easing: SWING });
  const posAt = (u: number) => {
    const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
    return { x: a * bodyC.x + b * ctrl.x + c * to.x, y: a * bodyC.y + b * ctrl.y + c * to.y };
  };
  const angAt = (u: number) => {
    const dx = 2 * (1 - u) * (ctrl.x - bodyC.x) + 2 * u * (to.x - ctrl.x);
    const dy = 2 * (1 - u) * (ctrl.y - bodyC.y) + 2 * u * (to.y - ctrl.y);
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };
  const touch = k(f, t.land, t.end, IN);
  const planeAt = (fr: number, ghost = 1) => {
    const u = at01(fr);
    const p = posAt(u);
    const settleTurn = k(fr, at + FOLD.plane[0], t.flyFrom); // the plane turns from level to its heading
    const ang = angAt(u) * settleTurn;
    const size = interpolate(u, [0, 1], [pw, landWidth]) * (fr >= t.land ? 1 - 0.85 * k(fr, t.land, t.end, IN) : 1);
    const bank = 1 - 0.25 * Math.sin(Math.PI * u); // the wings tip as it turns
    const born = interpolate(fr, [at + FOLD.plane[0], t.flyFrom], [0.55, 1], { ...clampX, easing: OUT });
    return (
      <div key={ghost} style={{ position: "absolute", left: p.x - size / 2, top: p.y - (size * ph) / pw / 2, width: size, height: (size * ph) / pw,
        transform: `rotate(${ang.toFixed(2)}deg) scale(${born.toFixed(4)}, ${(born * bank).toFixed(4)})`,
        opacity: planeIn * (fr >= t.land ? 1 - touch : 1) * ghost,
        filter: ghost === 1 ? "drop-shadow(0 18px 16px rgba(20, 4, 6, 0.45))" : undefined }}>
        <Plane paper={paper} />
      </div>
    );
  };
  const flying = f >= t.flyFrom && f < t.land;
  const ring = k(f, t.land, t.land + 16);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {planeIn < 1 ? (
        <div style={{ position: "absolute", left: from.x, top: from.y, width: W, height: H, opacity: 1 - planeIn,
          transform: `translateY(${(-10 * liftK).toFixed(2)}px) scale(${(1 + 0.03 * liftK).toFixed(4)})`, transformOrigin: "50% 50%",
          filter: `drop-shadow(0 ${(24 * liftK).toFixed(1)}px ${(26 * liftK).toFixed(1)}px rgba(20, 4, 6, ${(0.55 * liftK).toFixed(3)}))` }}>
          {drawn.map(({ i, p, m, back, shade }) => {
            const clip = `polygon(${p.poly.map((q) => `${q[0].toFixed(2)}px ${q[1].toFixed(2)}px`).join(", ")})`;
            return (
              <div key={i} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0",
                transform: `matrix(${m.map((v) => v.toFixed(5)).join(", ")})` }}>
                <div style={{ position: "absolute", inset: 0, clipPath: clip, overflow: "hidden" }}>
                  {back ? (
                    <div style={{ position: "absolute", inset: 0, background: paper }} />
                  ) : (
                    <Img src={staticFile(shot.src)} style={{ position: "absolute", left: -shot.crop.x * s, top: -shot.crop.y * s,
                      width: shot.image.w * s, height: shot.image.h * s, maxWidth: "none" }} />
                  )}
                  {shade > 0.003 ? <div style={{ position: "absolute", inset: 0, background: `rgba(20, 4, 6, ${shade.toFixed(3)})` }} /> : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      {/* a two-step trail while it flies fast, then the plane itself */}
      {flying ? planeAt(f - 2, 0.22) : null}
      {flying ? planeAt(f - 1, 0.4) : null}
      {local >= FOLD.plane[0] && f < t.end ? planeAt(f) : null}
      {/* touchdown */}
      {f >= t.land ? (
        <div style={{ position: "absolute", left: to.x, top: to.y, width: 40 + 220 * ring, height: 40 + 220 * ring,
          transform: "translate(-50%, -50%)", borderRadius: "50%", border: `${(5 * (1 - ring) + 1).toFixed(2)}px solid ${accent}`,
          opacity: 1 - ring }} />
      ) : null}
    </div>
  );
};
