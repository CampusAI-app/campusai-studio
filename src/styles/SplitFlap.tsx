/**
 * /split-flap (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). A departures board: rows of flap tiles that clatter through letters and settle, left to right and row by row,
 * until the board reads as a true table. Each tile is a top half that falls over the bottom half, the way the real
 * mechanism works. The board's cells are fixed width because the board is; the letters inside are Inter, never a
 * monospace face. Two short columns with a small label over each, one row can be the accent, settling in red.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, readHold } from "../system/motion";
import { B, Clip, Cue, INTER, RED, Title, ZODIAK, ramp } from "./common";

export type SplitFlapProps = {
  title: string;
  /** The small label over each column. */
  heads: [string, string];
  /** Each row is a left and a right column. Keep the whole row to about 10 characters. */
  rows: { left: string; right: string }[];
  /** Rows whose letters settle in red: the rows the note is about. */
  accent?: number[];
  /** A line under the board, Zodiak. */
  note: string;
  source: string;
  cta?: string;
};

// The tiles: a board's flaps are a warm near-black a step above the ground. brand.ts has no tone between surface and
// bgDeep that reads as a raised tile on video, so these two are the style's own, like the chalkboard's slate.
const TILE_TOP = "#221a1b";
const TILE_BOTTOM = "#1b1415";
const GLYPHS = "ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789";
const FLIP = 3; // motion: frames per flap, the real mechanism's clatter
const ROW_GAP = 12; // motion: frames between rows starting
const START = 16;
const FPS = 30;
// a stable scramble per tile and flap, so no two tiles share a pattern
const hash = (a: number, b: number) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return Math.abs(h ^ (h >>> 16)); };

export const flapPlan = (p: SplitFlapProps) => {
  const lw = Math.max(...p.rows.map((r) => r.left.length));
  const rw = Math.max(...p.rows.map((r) => r.right.length));
  const n = lw + 1 + rw;
  // Each tile flips a few times plus its column, so the settle runs left to right like a real board.
  const settle = (row: number, col: number) => START + row * ROW_GAP + (6 + col) * FLIP;
  const boardDone = settle(p.rows.length - 1, n - 1) + FLIP;
  const noteAt = boardDone + 8;
  const end = noteAt + Math.round((readHold(p.note) + 0.8) * FPS);
  return { lw, rw, n, settle, boardDone, noteAt, end };
};
export const flapEnd = (p: SplitFlapProps) => flapPlan(p).end;

const Tile: React.FC<{ ch: string; settleAt: number; w: number; h: number; red: boolean; seed: number }> = ({ ch, settleAt, w, h, red, seed }) => {
  const f = useCurrentFrame();
  const flips = Math.max(0, Math.ceil((settleAt - f) / FLIP));
  const glyph = (k: number) => (k <= 0 ? ch : GLYPHS[hash(seed, k) % GLYPHS.length]);
  const cur = glyph(flips);
  const next = glyph(flips - 1);
  const phase = flips > 0 ? ((f - (settleAt - flips * FLIP)) % FLIP) / FLIP : 1;
  const ink = red && flips === 0 ? RED : B.color.ink;
  const face = (c: string, half: "top" | "bottom", rot = 0) => (
    <div style={{ position: "absolute", left: 0, width: w, height: h / 2, top: half === "top" ? 0 : h / 2, overflow: "hidden",
      background: half === "top" ? TILE_TOP : TILE_BOTTOM, borderRadius: half === "top" ? "8px 8px 0 0" : "0 0 8px 8px",
      transformOrigin: half === "top" ? "50% 100%" : "50% 0%", transform: `rotateX(${rot}deg)`, backfaceVisibility: "hidden",
      filter: rot ? `brightness(${(1 - phase * 0.35).toFixed(3)})` : undefined }}>
      <div style={{ position: "absolute", top: half === "top" ? 0 : -h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: INTER, fontWeight: 700, fontSize: h * 0.6, color: ink, fontVariantNumeric: "tabular-nums" }}>{c}</div>
    </div>
  );
  return (
    <div style={{ position: "relative", width: w, height: h, perspective: 500 }}>
      {face(next, "top")}
      {face(cur, "bottom")}
      {flips > 0 ? face(cur, "top", -phase * 90) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: h / 2 - 1.5, height: 3, background: B.color.bgDeep }} />
    </div>
  );
};

export const SplitFlap: React.FC<SplitFlapProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { lw, n, settle, boardDone, noteAt, end } = flapPlan(p);
  const gap = 8;
  const w = Math.floor((width - 160 - gap * (n - 1)) / n);
  const h = Math.round(w * 1.4);
  const rowH = h + 16;
  const boardH = p.rows.length * rowH;
  const top = height * 0.5 - boardH / 2;
  const note = ramp(f, noteAt, noteAt + 12, CURVE.quiet.enter);
  const heads = ramp(f, 6, 18, CURVE.quiet.enter);
  const push = 1 + ramp(f, START, end, CURVE.quiet.standard) * 0.035; // motion: slow push across the whole board
  const colX = (c: number) => 80 + c * (w + gap);
  return (
    <Clip endAt={end} cta={p.cta}>
      <Title out={end} size={58}>{p.title}</Title>
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})` }}>
        {/* the board's housing */}
        <div style={{ position: "absolute", left: 56, right: 56, top: top - 92, height: boardH + 120, borderRadius: 20, background: B.color.surface,
          boxShadow: "inset 0 0 0 2px rgba(247,239,230,.06), 0 30px 80px rgba(0,0,0,.6)" }} />
        {[p.heads[0], p.heads[1]].map((t, i) => (
          <div key={i} style={{ position: "absolute", ...(i === 0 ? { left: colX(0) } : { right: width - (colX(n - 1) + w) }), top: top - 62, fontFamily: INTER, fontWeight: 500, fontSize: 30,
            color: B.color.inkSoft, opacity: heads }}>{t}</div>
        ))}
        {p.rows.map((r, ri) => {
          const cells = [...r.left.padEnd(lw, " "), " ", ...r.right.padEnd(n - lw - 1, " ")];
          return (
            <div key={ri} style={{ position: "absolute", left: 80, top: top + ri * rowH, display: "flex", gap }}>
              {cells.map((ch, ci) => (ci === lw ? <div key={ci} style={{ width: w }} /> : (
                <Tile key={ci} ch={ch} settleAt={settle(ri, ci)} w={w} h={h} red={!!p.accent?.includes(ri)} seed={ri * 97 + ci * 13 + 7} />
              )))}
            </div>
          );
        })}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 64, right: 64, top: top + boardH + 70, fontFamily: ZODIAK, fontWeight: 700, fontSize: 64, lineHeight: 1.1,
        color: B.color.ink, opacity: note, transform: `translateY(${(1 - note) * 14}px)` }}>{p.note}</div>
      <div style={{ position: "absolute", left: 64, right: 64, top: top + boardH + 220, fontFamily: INTER, fontSize: 34, color: B.color.ink,
        opacity: ramp(f, noteAt + 10, noteAt + 22) }}>{p.source}</div>
      {p.rows.map((_, ri) => (
        <React.Fragment key={ri}>
          <Cue at={START + ri * ROW_GAP} name="typewriter-hit-soft" volume={0.35} />
          <Cue at={START + ri * ROW_GAP + 6} name="data-scan" volume={0.16} />
        </React.Fragment>
      ))}
      <Cue at={boardDone} name="switch-tap" volume={0.5} />
    </Clip>
  );
};
