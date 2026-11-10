/**
 * Vertigo: the dolly zoom. The background is swapped for a light ground with a line-drawn corridor (nested
 * rectangles shrinking toward a vanishing point, joined to the frame corners by perspective lines). The corridor
 * streams toward the viewer and, on the beat, its perspective stretches deep over about a second (SWING) and
 * settles, while the person on top stays exactly the same size.
 * From @mrcreates.ai's "17 Video Effects" reel (16.7 to 17.2 s), watched frame by frame, Nov 10.
 *
 * Props: `person` (alpha cutout, VP9 webm, path under public/), `clip` (the full shot, used for its sound only),
 * `from` (frames trimmed off both), `clipFrames` (the clip's length, so a tail past it holds the last frame),
 * `stretch` (the frame the stretch starts, and its length), `framing` (how the cutout sits: scale, the source row
 * pinned to the bottom edge so a ragged cutout bottom stays off frame, and a horizontal nudge), `vanish` (the
 * vanishing point on screen, put it behind the head), `ground`, `line`, `lineWidth`, `rails` (extra lines per wall, default none: the reel draws only the corner lines), `fill` (the
 * full clip behind the cutout near the crop, to close matte holes).
 *
 * Perspective: a ring at depth z is drawn at r = D / (z + D) of the way from the vanishing point to the frame.
 * A large D is a long lens (rings bunch at the edges, flat); a small D is a wide lens (rings rush to the centre,
 * deep). The stretch moves D from flat to deep; the person layer never changes, which is the dolly zoom.
 */
import React from "react";
import { AbsoluteFill, Audio, Freeze, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { OUT, SWING, clampX, k, mix } from "./shared";

type Pt = { x: number; y: number };
export type VertigoProps = {
  person: string;
  clip: string;
  from: number;
  clipFrames?: number;
  stretch: { at: number; frames?: number; settle?: number };
  framing: { scale: number; bottomRow: number; dx?: number; source?: { w: number; h: number } };
  vanish: Pt;
  ground?: string;
  line?: string;
  lineWidth?: number;
  rails?: number;
  /** Back the cutout with the full clip below this source row, feathered over `feather` px: fills the alpha holes a
   * matte leaves in a forearm or shirt near the crop. Only safe where the person fills the frame edge to edge. */
  fill?: { fromRow: number; feather?: number };
  /** Camera distance before the stretch, at its deepest, and where it settles. */
  depth?: { flat: number; deep: number; rest: number };
};

const RINGS = 16;

export const Vertigo: React.FC<VertigoProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const src = p.framing.source ?? { w: 1080, h: 1920 };
  const ground = p.ground ?? "#F3F1EC";
  const line = p.line ?? "#2B59F0";
  const lw = p.lineWidth ?? 3;
  const depth = p.depth ?? { flat: 5, deep: 0.75, rest: 1.15 };
  const sFrames = p.stretch.frames ?? 30;
  const settleFrames = p.stretch.settle ?? 26;
  const a = p.stretch.at;

  // camera distance: a slow drift before the beat, the stretch (SWING), then a settle (OUT)
  const drift = interpolate(f, [0, a], [depth.flat * 1.08, depth.flat], clampX);
  const st = k(f, a, a + sFrames, SWING);
  const se = k(f, a + sFrames, a + sFrames + settleFrames, OUT);
  const D = mix(mix(drift, depth.deep, st), depth.rest, se);

  // the rings stream toward the viewer, faster through the stretch
  const t = f / fps;
  const stream = t * 0.55 + 1.6 * st + 0.35 * se;
  const frac = stream - Math.floor(stream);

  const V = p.vanish;
  const corners: Pt[] = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }];
  const at = (c: Pt, r: number): Pt => ({ x: V.x + (c.x - V.x) * r, y: V.y + (c.y - V.y) * r });
  const rOf = (z: number) => D / (z + D);
  const zEnd = RINGS + 0.5;
  const rEnd = rOf(zEnd);

  const rings: { r: number; o: number }[] = [];
  for (let i = 0; i < RINGS; i++) {
    const z = i + 1 - frac;
    if (z <= 0.02) continue;
    // far rings fade in as they arrive so nothing pops at the back
    const o = interpolate(z, [zEnd - 3, zEnd - 0.5], [1, 0], clampX);
    rings.push({ r: rOf(z), o });
  }

  // rails: lines along each wall from the frame edge to the back ring
  const rails = p.rails ?? 0;
  const railLines: [Pt, Pt][] = [];
  for (let side = 0; side < 4; side++) {
    const c0 = corners[side];
    const c1 = corners[(side + 1) % 4];
    for (let j = 0; j <= rails + 1; j++) {
      const u = j / (rails + 1);
      if (j === rails + 1) continue; // the next side's corner draws it
      const e = { x: mix(c0.x, c1.x, u), y: mix(c0.y, c1.y, u) };
      railLines.push([e, at(e, rEnd)]);
    }
  }

  const s = p.framing.scale;
  // the source row `bottomRow` sits just past the bottom edge, so anything below it is never on screen
  const top = H + 6 - p.framing.bottomRow * s;
  const left = W / 2 - (src.w / 2) * s + (p.framing.dx ?? 0);
  const last = p.clipFrames !== undefined ? p.clipFrames - p.from - 1 : Infinity;

  return (
    <AbsoluteFill style={{ background: ground, overflow: "hidden" }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g stroke={line} strokeWidth={lw} fill="none" strokeLinejoin="miter">
          {railLines.map(([p0, p1], i) => (
            <line key={`l${i}`} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} strokeOpacity={i % (rails + 1) === 0 ? 1 : 0.5} />
          ))}
          {rings.map(({ r, o }, i) => {
            const q = corners.map((c) => at(c, r));
            return <polygon key={`r${i}`} points={q.map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(" ")} strokeOpacity={o} />;
          })}
          <polygon points={corners.map((c) => at(c, rEnd)).map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(" ")} />
        </g>
      </svg>

      {p.fill && (
        <div style={{ position: "absolute", left, top, width: src.w * s, height: src.h * s,
          maskImage: `linear-gradient(to bottom, transparent ${(100 * p.fill.fromRow) / src.h}%, black ${(100 * (p.fill.fromRow + (p.fill.feather ?? 24))) / src.h}%)` }}>
          <Freeze frame={last} active={f >= last}>
            <OffthreadVideo src={staticFile(p.clip)} trimBefore={p.from} muted style={{ width: "100%", height: "100%", display: "block" }} />
          </Freeze>
        </div>
      )}
      <div style={{ position: "absolute", left, top, width: src.w * s, height: src.h * s }}>
        <Freeze frame={last} active={f >= last}>
          <OffthreadVideo src={staticFile(p.person)} trimBefore={p.from} transparent muted
            style={{ width: "100%", height: "100%", display: "block", filter: "drop-shadow(0 16px 30px rgba(20,24,40,0.1))" }} />
        </Freeze>
      </div>

      <Audio src={staticFile(p.clip)} trimBefore={p.from} />
    </AbsoluteFill>
  );
};
