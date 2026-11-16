/**
 * Sketch words (2026-11-15, from Skill Stack Store's "20 Claude Effects" reel, #11, 14.25 to 15.0 s, stepped frame by
 * frame). What the reel does: the background goes to cream paper, the speaker stays as a cutout, and a hand-drawn OUTLINE
 * word (red-brown) draws itself stroke by stroke above his head, then a gold swoosh underlines it. About 0.75 s.
 *
 * Ours: the word's outline is real path data, drawn with stroke-dashoffset, never a font fading in. On mount the word is
 * set once in the chosen face on a hidden canvas, and its edges are traced into closed outlines (marching squares,
 * then simplified and smoothed), so any word in any loaded font works. One pen draws the outlines in reading order at a
 * steady speed (`drawFrames`); a second, thinner pass follows a few frames behind with its own wobble, which is what
 * makes it read as sketched. Then the gold swoosh flicks under it (8 frames). The paper (warm cream, fine grain, soft
 * vignette) dissolves in behind him over 5 frames with a slight settle, and he casts a soft shadow on it.
 *
 * Props: `clip`, `person` (alpha webm), `from`, `frame` ({ zoom, bottom, focusX }), `word`, `box` (centre x, centre y and
 * the width the word fills, frame px), `paperAt`, `drawAt`, `drawFrames`, `underline`, `font` (family and weight; the
 * default is Lilita One, loaded here), `ink`, `gold`, `paper`, `exitAt` (optional: paper and word fade off), `sound`.
 *
 *   <SketchWords clip="x/clip.mp4" person="x/person.webm" frame={{ zoom: 1.55, bottom: 1245 }} word="goal"
 *     box={{ x: 540, y: 600, width: 760 }} paperAt={28} drawAt={32} />
 */
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Easing, OffthreadVideo, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/LilitaOne";
import { IN, OUT, Sfx, k } from "./shared";
import { Framing, framingOf } from "./frameGrab";

const lilita = loadFont("normal", { weights: ["400"], subsets: ["latin"] });

export type SketchWordsProps = {
  clip: string;
  person: string;
  from?: number;
  frame?: Framing;
  word: string;
  box: { x: number; y: number; width: number };
  paperAt: number;
  drawAt: number;
  drawFrames?: number;
  underline?: boolean;
  font?: { family: string; weight?: number; ready?: () => Promise<unknown> };
  ink?: string;
  gold?: string;
  paper?: { light: string; shade: string };
  exitAt?: number;
  volume?: number;
  sound?: boolean;
};

type Pt = [number, number];
type Outline = { pts: Pt[]; len: number; minX: number };

/** Closed outlines of the dark-on-light shape in a binary grid, by marching squares. Coordinates in grid px. */
const trace = (on: Uint8Array, w: number, h: number): Pt[][] => {
  // edge ids: top edge of cell (x, y) = (y * w + x) * 2, left edge = (y * w + x) * 2 + 1
  const nbA = new Int32Array(w * h * 2).fill(-1);
  const nbB = new Int32Array(w * h * 2).fill(-1);
  const link = (a: number, b: number) => {
    if (nbA[a] < 0) nbA[a] = b; else nbB[a] = b;
    if (nbA[b] < 0) nbA[b] = a; else nbB[b] = a;
  };
  const at = (x: number, y: number) => on[y * w + x];
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const idx = at(x, y) * 8 + at(x + 1, y) * 4 + at(x + 1, y + 1) * 2 + at(x, y + 1);
      if (idx === 0 || idx === 15) continue;
      const T = (y * w + x) * 2;
      const L = (y * w + x) * 2 + 1;
      const R = (y * w + x + 1) * 2 + 1;
      const B = ((y + 1) * w + x) * 2;
      switch (idx) {
        case 1: case 14: link(L, B); break;
        case 2: case 13: link(B, R); break;
        case 3: case 12: link(L, R); break;
        case 4: case 11: link(T, R); break;
        case 6: case 9: link(T, B); break;
        case 7: case 8: link(T, L); break;
        case 5: link(T, R); link(L, B); break;
        case 10: link(T, L); link(B, R); break;
      }
    }
  }
  const point = (id: number): Pt => {
    const cellI = id >> 1;
    const x = cellI % w;
    const y = (cellI - x) / w;
    return id & 1 ? [x, y + 0.5] : [x + 0.5, y];
  };
  const seen = new Uint8Array(w * h * 2);
  const loops: Pt[][] = [];
  for (let start = 0; start < nbA.length; start++) {
    if (nbA[start] < 0 || seen[start]) continue;
    const loop: Pt[] = [];
    let prev = -1;
    let cur = start;
    while (!seen[cur]) {
      seen[cur] = 1;
      loop.push(point(cur));
      const next = nbA[cur] !== prev ? nbA[cur] : nbB[cur];
      prev = cur;
      cur = next;
      if (cur < 0) break;
    }
    if (loop.length > 12) loops.push(loop);
  }
  return loops;
};

/** Ramer-Douglas-Peucker on an open polyline. */
const simplify = (pts: Pt[], eps: number): Pt[] => {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0];
  const [bx, by] = pts[pts.length - 1];
  const dx = bx - ax, dy = by - ay;
  const dd = Math.hypot(dx, dy) || 1;
  let max = 0, at = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / dd;
    if (d > max) { max = d; at = i; }
  }
  if (max <= eps) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, at + 1), eps).slice(0, -1), ...simplify(pts.slice(at), eps)];
};

/** Chaikin corner cutting on a closed loop. */
const smooth = (pts: Pt[], times: number): Pt[] => {
  let p = pts;
  for (let t = 0; t < times; t++) {
    const q: Pt[] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    p = q;
  }
  return p;
};

/** The word's outlines in frame px, in reading order. */
const outlineWord = (word: string, family: string, weight: number, box: { x: number; y: number; width: number }): Outline[] => {
  const S = 2; // trace at twice the frame size for clean curves
  const probe = new OffscreenCanvas(8, 8).getContext("2d")!;
  probe.font = `${weight} 200px ${family}`;
  const m = probe.measureText(word);
  const size = (200 * box.width) / Math.max(1, m.width);
  const pad = Math.ceil(size * 0.35);
  const w = Math.ceil(box.width * S + pad * 2 * S);
  const h = Math.ceil(size * 1.6 * S);
  const cv = new OffscreenCanvas(w, h);
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.font = `${weight} ${size * S}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(word, w / 2, h / 2);
  const data = ctx.getImageData(0, 0, w, h).data;
  const on = new Uint8Array(w * h);
  for (let i = 0; i < on.length; i++) on[i] = data[i * 4] > 127 ? 1 : 0;
  const loops = trace(on, w, h);
  return loops
    .map((loop) => {
      // a closed loop has no baseline for Douglas-Peucker, so simplify its two halves
      const half = Math.floor(loop.length / 2);
      const open = [...simplify(loop.slice(0, half + 1), 0.9 * S).slice(0, -1), ...simplify([...loop.slice(half), loop[0]], 0.9 * S).slice(0, -1)];
      const sm = smooth(open, 2).map(([x, y]): Pt => [box.x + (x - w / 2) / S, box.y + (y - h / 2) / S]);
      let len = 0;
      for (let i = 0; i < sm.length; i++) {
        const a = sm[i], b = sm[(i + 1) % sm.length];
        len += Math.hypot(b[0] - a[0], b[1] - a[1]);
      }
      return { pts: sm, len, minX: Math.min(...sm.map((p) => p[0])) };
    })
    .filter((o) => o.len > 30)
    .sort((a, b) => a.minX - b.minX);
};

/** A deterministic, low-frequency wobble so each pass wanders like a hand. */
const wobble = (pts: Pt[], amp: number, seed: number): string => {
  const n = pts.length;
  const out = pts.map(([x, y], i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const tx = b[0] - a[0], ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    const s = (i / n) * Math.PI * 2;
    const d = amp * (Math.sin(s * 3 + seed) * 0.6 + Math.sin(s * 7 + seed * 2.3) * 0.4);
    return [x - (ty / tl) * d, y + (tx / tl) * d] as Pt;
  });
  return `M ${out.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")} Z`;
};

export const SketchWords: React.FC<SketchWordsProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const from = p.from ?? 0;
  const drawFrames = p.drawFrames ?? 22;
  const ink = p.ink ?? "#8E2C1D";
  const gold = p.gold ?? "#C8962F";
  const paper = p.paper ?? { light: "#F6EEDF", shade: "#E3D3B6" };
  const family = p.font?.family ?? lilita.fontFamily;
  const weight = p.font?.weight ?? 400;
  const ready = p.font?.ready ?? lilita.waitUntilDone;
  const [outlines, setOutlines] = useState<Outline[] | null>(null);
  const [handle] = useState(() => delayRender("sketch words outlines"));

  useEffect(() => {
    ready()
      .then(() => document.fonts.load(`${weight} 100px ${family}`))
      .then(() => setOutlines(outlineWord(p.word, family, weight, p.box)))
      .catch((e) => cancelRender(e));
  }, [family, weight, ready, p.word, p.box]);
  // release the frame only once the outlines are on screen
  useEffect(() => {
    if (outlines) continueRender(handle);
  }, [outlines, handle]);

  const { zoom, tx, ty } = framingOf(W, H, p.frame);
  const framed: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` };

  const paperIn = k(f, p.paperAt, p.paperAt + 5, OUT);
  const gone = p.exitAt === undefined ? 0 : k(f, p.exitAt, p.exitAt + 8, IN);
  const total = outlines ? outlines.reduce((s, o) => s + o.len, 0) : 1;
  // motion: a pen moves at close to constant speed; a soft start and stop only
  const pen = Easing.bezier(0.35, 0.1, 0.55, 0.95);
  const lead = k(f, p.drawAt, p.drawAt + drawFrames, pen) * total;
  const follow = k(f, p.drawAt + 4, p.drawAt + drawFrames + 5, pen) * total;
  const swoosh = k(f, p.drawAt + drawFrames - 4, p.drawAt + drawFrames + 4, OUT);

  const pass = (budget: number, width: number, amp: number, seed: number, opacity: number, dx: number, dy: number) => {
    if (!outlines) return null;
    let used = 0;
    return (
      <g opacity={opacity} transform={`translate(${dx} ${dy})`}>
        {outlines.map((o, i) => {
          const here = Math.max(0, Math.min(o.len, budget - used));
          used += o.len;
          if (here <= 0) return null;
          const L = o.len * 1.04;
          return (
            <path key={i} d={wobble(o.pts, amp, seed + i * 1.7)} fill="none" stroke={ink} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={`${L.toFixed(1)} ${L.toFixed(1)}`} strokeDashoffset={(L - here * 1.04).toFixed(1)} />
          );
        })}
      </g>
    );
  };

  const b = p.box;
  const swY = b.y + b.width * 0.19;
  const swooshD = `M ${b.x - b.width * 0.48} ${swY + 22} C ${b.x - b.width * 0.22} ${swY - 6}, ${b.x + b.width * 0.22} ${swY + 2}, ${b.x + b.width * 0.53} ${swY - 46}`;
  const swooshLen = b.width * 1.1;

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={framed}>
        <OffthreadVideo src={staticFile(p.clip)} startFrom={from} volume={p.volume ?? 1} style={{ width: W, height: H }} />
      </div>

      {paperIn > 0 && gone < 1 ? (
        <AbsoluteFill style={{ opacity: paperIn * (1 - gone), transform: `scale(${(1.04 - 0.04 * paperIn).toFixed(4)})` }}>
          <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 45% 35%, ${paper.light} 0%, ${paper.light} 35%, ${paper.shade} 100%)` }} />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <filter id="sketch-paper-grain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.2  0 0 0 0.16 0" />
            </filter>
            <filter id="sketch-paper-mottle" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="9" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.45  0 0 0 0 0.25  0 0 0 0.14 0" />
            </filter>
            <rect width={W} height={H} filter="url(#sketch-paper-mottle)" />
            <rect width={W} height={H} filter="url(#sketch-paper-grain)" />
          </svg>
        </AbsoluteFill>
      ) : null}

      {/* the word, above his head; he never covers it */}
      {gone < 1 ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - gone }}>
          {pass(follow, 2.2, 3.2, 11, 0.55, 2, -1.5)}
          {pass(lead, 6.5, 1.6, 3, 1, 0, 0)}
          {p.underline !== false && swoosh > 0 ? (
            <g>
              <path d={swooshD} fill="none" stroke={gold} strokeWidth={15} strokeLinecap="round"
                strokeDasharray={`${swooshLen} ${swooshLen}`} strokeDashoffset={swooshLen * (1 - swoosh)} />
              <path d={swooshD} fill="none" stroke={gold} strokeWidth={4} strokeLinecap="round" opacity={0.7} transform="translate(-6 12)"
                strokeDasharray={`${swooshLen} ${swooshLen}`} strokeDashoffset={swooshLen * (1 - k(f, p.drawAt + drawFrames - 2, p.drawAt + drawFrames + 6, OUT))} />
            </g>
          ) : null}
        </svg>
      ) : null}

      <div style={framed}>
        <OffthreadVideo src={staticFile(p.person)} startFrom={from} muted transparent
          style={{ width: W, height: H, filter: `drop-shadow(-12px 22px 26px rgba(80, 55, 30, ${(0.45 * paperIn * (1 - gone)).toFixed(3)}))` }} />
      </div>
      <Sfx at={p.drawAt} name="marker-pen-line" volume={0.4} on={p.sound ?? true} />
    </AbsoluteFill>
  );
};
