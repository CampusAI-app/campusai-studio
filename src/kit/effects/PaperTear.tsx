/**
 * Paper tear (2026-11-15, effect 20 of Skill Stack Store's "20 Claude Effects in 20 Secs" reel, 24.15 to 24.3 s, stepped
 * frame by frame; facts in films/effects-skillstack/facts.md). What the reel does: the newspaper front page rips down
 * the middle with a jagged, fibrous edge and the two halves pull apart, revealing the live footage. About 0.2 s.
 *
 * Ours tears ANY page (`page` is any full-frame node: PressPage, a cover, a still) to reveal any node under it (`reveal`,
 * usually the live clip). The rip runs top to bottom: each half hinges on a point below the frame, so the gap opens
 * as a V from the top in `frames` (default 6, the reel's 0.2 s), then both halves fly off sideways, accelerating, in
 * another 10 frames. The torn line is seeded (the same tear every render): a slow wander, a finer zigzag, and sharp
 * spikes. Along each edge a strip of paper core (lighter, fibrous via a turbulence displacement) sticks out past the
 * print, the way torn newsprint shows its white middle. Each half casts a soft shadow onto what is revealed, and the
 * revealed shot settles from 106% to 100% so it feels underneath, not behind glass.
 *
 *   <PaperTear at={116} page={<PressPage ... />} reveal={<OffthreadVideo src={...} />} />
 */
import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, k, mix } from "./shared";
import { rng } from "./InkScreen";

export type PaperTearProps = {
  /** The page that rips, full frame. */
  page: React.ReactNode;
  /** What is underneath, full frame. */
  reveal: React.ReactNode;
  /** Frame the rip starts. Before it the page is whole; from `at + frames + 9` only `reveal` is drawn. */
  at: number;
  /** Frames for the rip to open (the reel: about 6). */
  frames?: number;
  /** Seed for the shape of the tear. */
  seed?: number;
  /** px the tear drifts sideways from top to bottom (positive leans right at the bottom). */
  lean?: number;
  /** Colour of the torn paper core along the edge. */
  core?: string;
  sound?: boolean;
};

type Pt = { x: number; y: number };

/** The torn line, top (above the frame) to bottom (below it). */
const tearLine = (W: number, H: number, seed: number, lean: number): Pt[] => {
  const r = rng(seed);
  const s1 = r() * 6.28;
  const s2 = r() * 6.28;
  const n = 96;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const y = -40 + ((H + 80) * i) / n;
    let x = W / 2 + lean * (y / H - 0.5) + 34 * Math.sin(y * 0.0041 + s1) + 13 * Math.sin(y * 0.0137 + s2);
    x += (r() - 0.5) * 16; // the zigzag
    if (r() < 0.12) x += (r() < 0.5 ? -1 : 1) * (12 + r() * 16); // a spike
    pts.push({ x, y });
  }
  return pts;
};

const poly = (pts: Pt[]) => `polygon(${pts.map((p) => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(", ")})`;
const pathD = (pts: Pt[]) => `M ${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")} Z`;

export const PaperTear: React.FC<PaperTearProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const frames = p.frames ?? 6;
  const seed = p.seed ?? 7;
  const core = p.core ?? "#FBF8F0";
  const line = React.useMemo(() => tearLine(W, H, seed, p.lean ?? 60), [W, H, seed, p.lean]);
  // fibre widths along the edge, one set per half, so the two edges do not mirror
  const fibres = React.useMemo(() => {
    const r = rng(seed + 100);
    return [line.map(() => (r() < 0.35 ? 0.5 : 3 + r() * 9)), line.map(() => (r() < 0.35 ? 0.5 : 3 + r() * 9))];
  }, [line, seed]);

  const sound = p.sound ?? true;
  const fx = (
    <>
      <Sfx at={p.at - 1} name="paper-page-turn" volume={0.6} on={sound} />
      <Sfx at={p.at + frames - 1} name="air-woosh-quick" volume={0.35} on={sound} />
    </>
  );
  if (f < p.at) return <AbsoluteFill>{p.page}{fx}</AbsoluteFill>;
  const done = p.at + frames + 9;
  if (f >= done) return <AbsoluteFill>{p.reveal}{fx}</AbsoluteFill>;

  // motion: the rip opens hard and settles (a sharp ease-out) in `frames`; the halves then leave with an ease-in.
  const open = k(f, p.at, p.at + frames, Easing.bezier(0.2, 0.9, 0.3, 1));
  // motion: a softer ease-in than IN so the halves are seen leaving, not just gone
  const away = k(f, p.at + frames - 3, done, Easing.bezier(0.45, 0, 0.8, 0.6));
  const hinge = { x: W / 2, y: H * 1.15 };

  const left: Pt[] = [{ x: -W, y: -40 }, ...line, { x: -W, y: H + 40 }];
  const right: Pt[] = [{ x: 2 * W, y: -40 }, ...line, { x: 2 * W, y: H + 40 }];
  // the fibre strips: the line itself, and the line pushed out into the gap by each fibre width
  const strip = (side: -1 | 1, widths: number[]) => [...line, ...line.map((q, i) => ({ x: q.x - side * widths[i], y: q.y })).reverse()];

  const half = (side: -1 | 1) => {
    const rot = side * (8 * open + 10 * away);
    const tx = side * (24 * open + W * 0.8 * away);
    const ty = 30 * away;
    return (
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${hinge.x}px ${hinge.y}px`,
        transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`,
        filter: `drop-shadow(${(side * 10).toFixed(0)}px 14px 26px rgba(0,0,0,${(0.5 * open).toFixed(3)}))` }}>
        <div style={{ position: "absolute", inset: 0, clipPath: poly(side < 0 ? left : right) }}>{p.page}</div>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path d={pathD(strip(side, fibres[side < 0 ? 0 : 1]))} fill={core} filter="url(#paper-tear-fibre)" />
          {/* a hairline of shade where the print meets the core */}
          <path d={`M ${line.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" L ")}`} fill="none" stroke="rgba(60,45,25,0.28)" strokeWidth={1.2} />
        </svg>
      </div>
    );
  };

  const settle = mix(1.06, 1, k(f, p.at, done));
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="paper-tear-fibre" x="-20%" y="-5%" width="140%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.22 0.05" numOctaves={2} seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale={7} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <AbsoluteFill style={{ transform: `scale(${settle.toFixed(4)})`, filter: `brightness(${mix(0.7, 1, open).toFixed(3)})` }}>{p.reveal}</AbsoluteFill>
      {half(-1)}
      {half(1)}
      {fx}
    </AbsoluteFill>
  );
};
