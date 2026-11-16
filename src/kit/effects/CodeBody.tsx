/**
 * Code body (2026-11-15, from Skill Stack Store's "20 Claude Effects" reel, #6, 6.0 to 6.6 s, stepped frame by frame).
 * What the reel does: the speaker's silhouette is redrawn as code characters coloured from the footage (cream face,
 * maroon hoodie), the background goes dark, and the character grid starts coarse and resolves back to his face. 0.6 s.
 *
 * Ours: the same beat with no monospace font (taste law). Each character is set in Geist, a proportional face, centred
 * in a fixed square cell, so the grid reads as code without a mono font. Each cell takes the average colour of the
 * footage under it, counted only where the matte says person, so the characters live inside the cutout. The glyph
 * follows the cell's brightness (light cells get dense marks like # and @, dark ones get dots and colons) and changes
 * every two frames so the body reads as live code. His silhouette itself goes near black under the characters. The cell steps fine: by default 90, 60, 42, 30, 21, 14 px, three
 * frames each, then the real picture dissolves back in over 6 frames. The background drops to about 20% while it runs.
 *
 * Headless and deterministic: each frame decodes the clip and the matte itself (frameGrab, mediabunny) and draws on a
 * canvas; nothing depends on playback.
 *
 * Props: `clip`, `person` (alpha webm), `matte` (white = person, same size), `from`, `frame` ({ zoom, bottom, focusX }),
 * `at` (frame the code cuts in), `steps` (cell sizes, px), `hold` (frames per step), `resolve` (frames back to the
 * picture), `glyphs` (light to dense), `dim` (background brightness while it runs), `sound`.
 *
 *   <CodeBody clip="x/clip.mp4" person="x/person.webm" matte="x/matte.mp4" frame={{ zoom: 1.45, bottom: 1560 }} at={38} />
 */
import React, { useEffect, useRef } from "react";
import { AbsoluteFill, OffthreadVideo, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Geist";
import { OUT, Sfx, k } from "./shared";
import { Framing, drawFramed, framingOf, grabFrame } from "./frameGrab";

const geist = loadFont("normal", { weights: ["800"], subsets: ["latin"] });

export type CodeBodyProps = {
  clip: string;
  person: string;
  matte: string;
  from?: number;
  frame?: Framing;
  at: number;
  steps?: number[];
  hold?: number;
  resolve?: number;
  glyphs?: string;
  dim?: number;
  volume?: number;
  sound?: boolean;
};

const GLYPHS = ".,:;-_~=+<>/\\|!?*()[]{}%$&#@";

const hash = (a: number, b: number, c: number) => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

let scratch: { clip: OffscreenCanvas; matte: OffscreenCanvas } | null = null;
const scratchFor = (W: number, H: number) => {
  if (!scratch || scratch.clip.width !== W || scratch.clip.height !== H) {
    scratch = { clip: new OffscreenCanvas(W, H), matte: new OffscreenCanvas(W, H) };
  }
  return scratch;
};

export const CodeBody: React.FC<CodeBodyProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const canvas = useRef<HTMLCanvasElement>(null);
  const from = p.from ?? 0;
  const steps = p.steps ?? [90, 60, 42, 30, 21, 14];
  const hold = p.hold ?? 3;
  const resolve = p.resolve ?? 6;
  const glyphs = p.glyphs ?? GLYPHS;
  const codeEnd = p.at + steps.length * hold;
  const end = codeEnd + resolve;
  const active = f >= p.at && f < end;
  const step = Math.min(steps.length - 1, Math.max(0, Math.floor((f - p.at) / hold)));
  const cell = steps[step];
  // the code holds, then gives way to the picture
  const back = k(f, codeEnd, end, OUT);
  const darkness = active ? (1 - (p.dim ?? 0.2)) * (1 - back) : 0;

  const { zoom, tx, ty } = framingOf(W, H, p.frame);
  const framed: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` };

  useEffect(() => {
    if (!active) return;
    const handle = delayRender(`code body frame ${f}`);
    (async () => {
      await geist.waitUntilDone();
      const n = from + f;
      const [img, mat] = await Promise.all([grabFrame(p.clip, n, fps), grabFrame(p.matte, n, fps)]);
      const s = scratchFor(W, H);
      const cc = s.clip.getContext("2d", { willReadFrequently: true })!;
      const mc = s.matte.getContext("2d", { willReadFrequently: true })!;
      cc.clearRect(0, 0, W, H);
      mc.clearRect(0, 0, W, H);
      drawFramed(cc, img, W, H, p.frame);
      drawFramed(mc, mat, W, H, p.frame);
      const px = cc.getImageData(0, 0, W, H).data;
      const mx = mc.getImageData(0, 0, W, H).data;

      const el = canvas.current;
      if (!el) return;
      const ctx = el.getContext("2d")!;
      // his silhouette goes near black first, so the characters are the only trace of him
      const shade = ctx.createImageData(W, H);
      const sd = shade.data;
      for (let i = 0; i < sd.length; i += 4) {
        sd[i] = 9; sd[i + 1] = 6; sd[i + 2] = 8; sd[i + 3] = mx[i] * 0.92;
      }
      ctx.putImageData(shade, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `800 ${Math.round(cell * 1.05)}px ${geist.fontFamily}`;
      const cols = Math.ceil(W / cell);
      const rows = Math.ceil(H / cell);
      const ox = (W - cols * cell) / 2;
      const oy = (H - rows * cell) / 2;
      const stride = Math.max(1, Math.floor(cell / 7));
      const tick = Math.floor(f / 2);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x0 = Math.max(0, Math.floor(ox + c * cell));
          const y0 = Math.max(0, Math.floor(oy + r * cell));
          const x1 = Math.min(W, Math.floor(ox + (c + 1) * cell));
          const y1 = Math.min(H, Math.floor(oy + (r + 1) * cell));
          let m = 0, R = 0, G = 0, B = 0, count = 0;
          for (let y = y0; y < y1; y += stride) {
            for (let x = x0; x < x1; x += stride) {
              const i = (y * W + x) * 4;
              const a = mx[i] / 255;
              count++;
              if (a <= 0.02) continue;
              m += a;
              R += px[i] * a;
              G += px[i + 1] * a;
              B += px[i + 2] * a;
            }
          }
          if (count === 0 || m / count < 0.32) continue;
          R /= m; G /= m; B /= m;
          // lift the colour so it reads as light on the dark ground, keeping its hue
          const lift = (v: number) => Math.min(255, v * 1.28 + 22);
          const lum = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
          const jitter = Math.floor((hash(c, r, tick + step * 97) - 0.5) * 6);
          const gi = Math.max(0, Math.min(glyphs.length - 1, Math.round(lum * 1.15 * (glyphs.length - 1)) + jitter));
          ctx.globalAlpha = Math.min(1, (m / count - 0.2) * 1.6);
          ctx.fillStyle = `rgb(${lift(R) | 0}, ${lift(G) | 0}, ${lift(B) | 0})`;
          ctx.fillText(glyphs[gi], ox + (c + 0.5) * cell, oy + (r + 0.5) * cell);
        }
      }
      ctx.globalAlpha = 1;
    })()
      .then(() => continueRender(handle))
      .catch((e) => cancelRender(e));
  }, [active, f, cell, step, from, fps, W, H, p.clip, p.matte, p.frame, glyphs]);

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={framed}>
        <OffthreadVideo src={staticFile(p.clip)} startFrom={from} volume={p.volume ?? 1}
          style={{ width: W, height: H, filter: darkness > 0 ? `brightness(${(1 - darkness).toFixed(3)}) saturate(${(1 - 0.4 * darkness).toFixed(3)})` : undefined }} />
      </div>
      <div style={{ ...framed, opacity: active ? back : 1 }}>
        <OffthreadVideo src={staticFile(p.person)} startFrom={from} muted transparent style={{ width: W, height: H }} />
      </div>
      {active ? (
        <canvas ref={canvas} width={W} height={H}
          style={{ position: "absolute", inset: 0, width: W, height: H, opacity: 1 - back, filter: "drop-shadow(0 0 7px rgba(255, 190, 170, 0.28))" }} />
      ) : null}
      <Sfx at={p.at} name="data-scan" volume={0.28} on={p.sound ?? true} />
    </AbsoluteFill>
  );
};
