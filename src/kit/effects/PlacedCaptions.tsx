/**
 * Placed captions (2026-11-18, ours, after Shaan Johari's reel "I filmed this. Claude edited it." instagram.com/reel/Df4TGYjEZLu,
 * read frame by frame from contact sheets, 4.75 to 8.75 s; his prompt and files were never seen). What the reel does: each
 * caption LINE lands in a different open spot of the frame, never over the face and never under Instagram's own buttons:
 * 4.75 s lower middle, 5.0 to 6.5 s top left above the head ("it knows where all of instagram's buttons are"), 6.75 to
 * 7.75 s left of the chest ("so my captions never"), 8.0 s on right middle inside a thin dashed rectangle ("end up
 * underneath them."). Words come out of a blur one at a time (3 to 4 frames), bold white sans, one accent word per line
 * larger in an italic serif ("buttons", "them."). The dashed outline shows the safe zone the caption chose.
 *
 * Ours: `placeLines` (pure, testable) picks the spot for each line. Candidates sit round the face: above the head, left of
 * the chest, right of the face, below the face. The face box comes from the 10 Hz track (`effects/scripts/facetrack.py`),
 * expanded 35% (plus 20% of its height above for hair), and is tested at EVERY frame the line is on screen; the platform's
 * header, bottom strip and right rail come from `src/lib/platformUI.ts`. A spot must clear both, the side margins, and any
 * line still on screen, and every `avoid` area: another person's face track (same 35% box, e.g. an interviewer, tracked
 * with `facetrack.py --near X`) or a rectangle in source px, optionally only between two clip seconds. Score: the `prefer` order (4 points a step), minus 30 for the same spot as the previous line, minus
 * 40 per unit of type shrink (tries 100%, 88%, 76%), minus 6 a row past three, minus a little for distance from the face. The line is laid out to fit
 * the spot (rows wrap to its width) and kept wholly inside the free area. If nothing fits, the least-bad spot is used and
 * the line is marked `ok: false` (and logged).
 *
 * Timing, from the editing lane: the line shows dim and soft 0.35 s before its first word; each word lights from its exact
 * start, out of a 7 px blur over 4 frames (never ahead of the voice); finished words stay full white; the line holds at least
 * until its last word ends plus 0.6 s, and on through a short pause (up to 1.5 s after it) until the next line's first word;
 * it leaves into a 12 px blur over 5 frames. Inter 700 at 58 px (1080 wide), the accent in Newsreader italic at 1.5x.
 * `showZone` draws the chosen spot as a thin white dashed rectangle (1.5 px, 10 on 7), off by default.
 *
 * Props: `clip`, `from`, `frame`, and the spec: `words` (captions.json words), `lines` (inclusive word index ranges;
 * omitted, `autoLines` chunks them), `accent` (word indices), `track`, `avoid`, `platform`, `feedCrop`, `showZone`, `size`,
 * `prefer`.
 * `PlacedCaptionsLayer` is the type alone.
 */
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, OffthreadVideo, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import { INTER } from "../parts";
import { IN, OUT, k, mix } from "./shared";
import { Framing, framingOf } from "./frameGrab";
import { FaceTrack, faceAt } from "./FaceLock";
import type { CaptionWord } from "./CommentDrop";
import { Platform, Rect, clearOfPlatform, freeRects, intersects, overlapArea, platformZones } from "../../lib/platformUI";

const news = loadNewsreader("italic", { weights: ["400"], subsets: ["latin"] });

export type PlaceSpot = "above" | "left" | "right" | "below";
export type CaptionLine = [number, number];
/** A rectangle to keep clear, in the clip's source px; with `from` / `to` (clip seconds) only while that is true. */
export type AvoidRect = { x: number; y: number; w: number; h: number; from?: number; to?: number };
/** Anything else captions must not cover: another face's track, or a rectangle. */
export type Avoid = FaceTrack | AvoidRect;
/** Measures a word's width in px at `size`; `accent` is the italic serif. */
export type Measure = (text: string, size: number, accent: boolean) => number;
export type PlacedRow = { words: { i: number; text: string; accent: boolean; size: number; w: number }[]; w: number; h: number };
export type PlacedLine = {
  line: CaptionLine;
  spot: PlaceSpot;
  /** The type block, frame px. */
  rect: Rect;
  /** The block plus its breathing room: what was tested, and what `showZone` draws. */
  zone: Rect;
  rows: PlacedRow[];
  align: "left" | "center" | "right";
  space: number;
  show: number;
  hide: number;
  scale: number;
  ok: boolean;
};

export type PlaceInput = {
  words: CaptionWord[];
  lines: CaptionLine[];
  accent?: number[];
  track: FaceTrack;
  /** More faces or areas to keep clear, tested at every frame like the main face. */
  avoid?: Avoid[];
  frame?: Framing;
  fps: number;
  /** Frames trimmed off the clip's start. */
  from?: number;
  W: number;
  H: number;
  platform: Platform;
  feedCrop?: boolean;
  size?: number;
  accentScale?: number;
  measure?: Measure;
  prefer?: PlaceSpot[];
  /** Seconds the line shows (dim) before its first word. */
  lead?: number;
};

const EXIT = 5;
const clean = (w: string) => w.replace(/^["]+/, "");

/** A rough width for tests without a canvas: Inter bold ~0.56 em a letter, Newsreader italic ~0.46. */
export const approxMeasure: Measure = (text, size, accent) => text.length * size * (accent ? 0.46 : 0.56);

/** Chunk words into caption lines: break after . ? ! , or a gap over 0.35 s, or at `max` words. */
export const autoLines = (words: CaptionWord[], max = 5): CaptionLine[] => {
  const out: CaptionLine[] = [];
  let a = 0;
  for (let i = 0; i < words.length; i++) {
    const end = i === words.length - 1;
    const punct = /[.?!,]$/.test(words[i].w);
    const gap = !end && words[i + 1].start - words[i].end > 0.35;
    if (end || punct || gap || i - a + 1 >= max) {
      out.push([a, i]);
      a = i + 1;
    }
  }
  return out;
};

/** When a line shows and leaves, in composition frames. */
export const lineTimes = (words: CaptionWord[], lines: CaptionLine[], fps: number, from = 0, lead = 0.35) =>
  lines.map(([a, b], j) => {
    const lastEnd = words[b].end;
    const next = lines[j + 1] ? words[lines[j + 1][0]].start : lastEnd + 0.6;
    const hold = Math.max(lastEnd + 0.6, Math.min(next, lastEnd + 1.5));
    return { show: Math.round((words[a].start - lead) * fps - from), hide: Math.round(hold * fps - from) };
  });

const layoutRows = (
  ws: { i: number; text: string; accent: boolean }[], maxW: number, size: number, accentScale: number, measure: Measure,
): { rows: PlacedRow[]; w: number; h: number; space: number } => {
  const space = size * 0.27;
  const rows: PlacedRow[] = [];
  let cur: PlacedRow = { words: [], w: 0, h: 0 };
  for (const w of ws) {
    const s = w.accent ? size * accentScale : size;
    const ww = measure(w.text, s, w.accent) + (w.accent ? s * 0.08 : 0);
    if (cur.words.length && cur.w + space + ww > maxW) {
      rows.push(cur);
      cur = { words: [], w: 0, h: 0 };
    }
    cur.w += (cur.words.length ? space : 0) + ww;
    cur.h = Math.max(cur.h, s * (w.accent ? 1.02 : 1.1));
    cur.words.push({ ...w, size: s, w: ww });
  }
  if (cur.words.length) rows.push(cur);
  return { rows, w: Math.max(...rows.map((r) => r.w)), h: rows.reduce((t, r) => t + r.h, 0), space };
};

const pad = (r: Rect, p: number): Rect => ({ x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p });

/** A face's track box at clip second t, on screen, expanded 35% plus 20% of its height above for hair. */
const faceBlock = (track: FaceTrack, t: number, W: number, H: number, frame?: Framing): Rect => {
  const maxT = track.samples[track.samples.length - 1].t + 1 / track.rate;
  const b = faceAt(track, Math.max(0, Math.min(maxT, t)), W, H, frame);
  const w = b.w * 1.35;
  const h = b.h * 1.35;
  return { x: b.cx - w / 2, y: b.cy - h / 2 - b.h * 0.2, w, h: h + b.h * 0.2 };
};

/** Every `avoid` area on screen at clip second t. Rectangles are in the main track's source px. */
const avoidBlocks = (avoid: Avoid[], main: FaceTrack, t: number, W: number, H: number, frame?: Framing): Rect[] => {
  const { zoom, tx, ty } = framingOf(W, H, frame);
  const sx = (W / main.width) * zoom;
  const sy = (H / main.height) * zoom;
  const out: Rect[] = [];
  for (const a of avoid) {
    if ("samples" in a) out.push(faceBlock(a, t, W, H, frame));
    else if ((a.from === undefined || t >= a.from) && (a.to === undefined || t <= a.to)) {
      out.push({ x: a.x * sx + tx, y: a.y * sy + ty, w: a.w * sx, h: a.h * sy });
    }
  }
  return out;
};

/** Pick a spot, a size and a layout for every line. Pure: same input, same answer. */
export const placeLines = (inp: PlaceInput): PlacedLine[] => {
  const { words, lines, track, fps, W, H, platform } = inp;
  const from = inp.from ?? 0;
  const u = W / 1080;
  const size = (inp.size ?? 58) * u;
  const accentScale = inp.accentScale ?? 1.5;
  const measure = inp.measure ?? approxMeasure;
  const prefer = inp.prefer ?? ["above", "right", "left", "below"];
  const accent = new Set(inp.accent ?? []);
  const opts = { feedCrop: inp.feedCrop };
  const free = freeRects(platform, W, H, opts);
  const freeTop = Math.min(...free.map((r) => r.y));
  const freeBottom = Math.max(...free.map((r) => r.y + r.h));
  const m = 40 * u;
  const gap = 26 * u;
  const room = 18 * u; // breathing room round the type, tested and drawn as the zone
  const rail = platformZones(platform, W, H, opts).find((z) => z.name === "rail");
  const times = lineTimes(words, lines, fps, from, inp.lead ?? 0.35);

  const placed: PlacedLine[] = [];
  lines.forEach((line, j) => {
    const { show, hide } = times[j];
    // the face, expanded, at every frame the line is on screen
    const faces: Rect[] = [];
    // and everything else to keep clear (other faces, areas), at the same frames
    const others: Rect[] = [];
    for (let f = show; f <= hide + EXIT; f++) {
      const t = (f + from) / fps;
      faces.push(faceBlock(track, t, W, H, inp.frame));
      if (inp.avoid?.length) others.push(...avoidBlocks(inp.avoid, track, t, W, H, inp.frame));
    }
    const E = {
      x0: Math.min(...faces.map((r) => r.x)), y0: Math.min(...faces.map((r) => r.y)),
      x1: Math.max(...faces.map((r) => r.x + r.w)), y1: Math.max(...faces.map((r) => r.y + r.h)),
    };
    const ecx = (E.x0 + E.x1) / 2;
    const ecy = (E.y0 + E.y1) / 2;
    const live = placed.filter((p, i) => i < j && p.hide + EXIT >= show && p.show <= hide + EXIT);
    const ws = words.slice(line[0], line[1] + 1).map((w, n) => ({ i: line[0] + n, text: clean(w.w), accent: accent.has(line[0] + n) }));
    const prev = placed[j - 1]?.spot;

    type Cand = { spot: PlaceSpot; rect: Rect; zone: Rect; lay: ReturnType<typeof layoutRows>; scale: number; ok: boolean; score: number; bad: number };
    const cands: Cand[] = [];
    for (const spot of prefer) {
      for (const scale of [1, 0.88, 0.76]) {
        const s = size * scale;
        const widths =
          spot === "left" ? [E.x0 - gap - m - 2 * room]
          : spot === "right" ? [W - m - (E.x1 + gap) - 2 * room, (rail ? rail.x : W - m) - (E.x1 + gap) - 2 * room]
          : [W * 0.62, W * 0.8];
        for (const maxW of widths) {
          if (maxW < s * 3) continue;
          const lay = layoutRows(ws, maxW, s, accentScale, measure);
          if (lay.w > maxW + 0.5) continue; // one word wider than the spot
          let x = 0;
          let y = 0;
          if (spot === "above") { x = ecx - lay.w / 2; y = E.y0 - gap - room - lay.h; }
          if (spot === "below") { x = ecx - lay.w / 2; y = E.y1 + gap + room; }
          if (spot === "left") { x = E.x0 - gap - room - lay.w; y = E.y1 - lay.h * 0.3; }
          // right sits beside the face, where it clears the rail on every platform; left sits by the chest
          if (spot === "right") { x = E.x1 + gap + room; y = ecy - lay.h / 2; }
          // keep the whole block inside the free area
          x = Math.max(m + room, Math.min(W - m - room - lay.w, x));
          y = Math.max(freeTop + room, Math.min(freeBottom - room - lay.h, y));
          let rect: Rect = { x, y, w: lay.w, h: lay.h };
          if (rail && intersects(pad(rect, room), rail)) rect = { ...rect, x: Math.max(m + room, rail.x - room - lay.w - 2) };
          const zone = pad(rect, room);
          const faceHit = faces.reduce((t, r) => t + overlapArea(zone, r), 0) + others.reduce((t, r) => t + overlapArea(zone, r), 0);
          const lineHit = live.reduce((t, p) => t + overlapArea(zone, p.zone), 0);
          const platOk = clearOfPlatform(zone, platform, W, H, opts);
          const ok = faceHit === 0 && lineHit === 0 && platOk;
          const dist = Math.hypot(rect.x + rect.w / 2 - ecx, rect.y + rect.h / 2 - ecy) / H;
          const score = 100 - prefer.indexOf(spot) * 4 - (spot === prev ? 30 : 0) - (1 - scale) * 40 - dist * 20
            - Math.max(0, lay.rows.length - 3) * 6;
          const bad = faceHit / faces.length + lineHit + (platOk ? 0 : zone.w * zone.h * 0.5);
          cands.push({ spot, rect, zone, lay, scale, ok, score, bad });
        }
      }
    }
    const good = cands.filter((c) => c.ok).sort((a, b) => b.score - a.score);
    const pick = good[0] ?? [...cands].sort((a, b) => a.bad - b.bad)[0];
    if (!pick) throw new Error(`placeLines: no layout at all for line ${line[0]}-${line[1]}`);
    if (!pick.ok) console.warn(`placeLines: no free spot for line ${line[0]}-${line[1]}; used ${pick.spot} (least overlap)`);
    placed.push({
      line, spot: pick.spot, rect: pick.rect, zone: pick.zone, rows: pick.lay.rows, space: pick.lay.space,
      align: pick.spot === "left" ? "right" : pick.spot === "right" ? "left" : "center",
      show, hide, scale: pick.scale, ok: pick.ok,
    });
  });
  return placed;
};

export type PlacedCaptionsSpec = {
  words: CaptionWord[];
  lines?: CaptionLine[];
  accent?: number[];
  track: FaceTrack;
  avoid?: Avoid[];
  frame?: Framing;
  platform?: Platform;
  feedCrop?: boolean;
  showZone?: boolean;
  size?: number;
  prefer?: PlaceSpot[];
  ink?: string;
};

export const PlacedCaptionsLayer: React.FC<{ spec: PlacedCaptionsSpec; from?: number }> = ({ spec, from = 0 }) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const u = W / 1080;
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("placed captions fonts"));
  useEffect(() => {
    news
      .waitUntilDone()
      .then(() => Promise.all([document.fonts.load(`700 100px ${INTER}`), document.fonts.load(`italic 400 100px ${news.fontFamily}`)]))
      .then(() => setReady(true))
      .catch((e) => cancelRender(e));
  }, []);
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);

  const lines = useMemo(() => spec.lines ?? autoLines(spec.words), [spec.lines, spec.words]);
  const placed = useMemo(() => {
    if (!ready) return null;
    const ctx = new OffscreenCanvas(8, 8).getContext("2d")!;
    const measure: Measure = (text, size, accent) => {
      ctx.font = accent ? `italic 400 ${size}px ${news.fontFamily}` : `700 ${size}px ${INTER}`;
      // Inter is set at -0.02em tracking
      return ctx.measureText(text).width - (accent ? 0 : 0.02 * size * text.length);
    };
    return placeLines({ ...spec, lines, fps, from, W, H, platform: spec.platform ?? "instagram", measure });
  }, [ready, spec, lines, fps, from, W, H]);
  if (!placed) return null;

  const now = f;
  const ink = spec.ink ?? "#FFFFFF";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {placed.map((p, j) => {
        if (now < p.show - 1 || now > p.hide + EXIT) return null;
        const lineIn = k(now, p.show, p.show + 5, OUT);
        const exit = k(now, p.hide, p.hide + EXIT, IN);
        const o = lineIn * (1 - exit);
        return (
          <React.Fragment key={j}>
            {spec.showZone ? (
              <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: o * 0.9 }}>
                <rect x={p.zone.x} y={p.zone.y} width={p.zone.w} height={p.zone.h} rx={6 * u} fill="none" stroke="white" strokeWidth={1.5 * u}
                  strokeDasharray={`${10 * u} ${7 * u}`} />
              </svg>
            ) : null}
            <div style={{ position: "absolute", left: p.rect.x, top: p.rect.y, width: p.rect.w, opacity: o,
              filter: exit > 0.01 ? `blur(${(exit * 12 * u).toFixed(2)}px)` : undefined }}>
              {p.rows.map((r, ri) => (
                <div key={ri} style={{ display: "flex", alignItems: "baseline", height: r.h, columnGap: p.space, whiteSpace: "nowrap",
                  justifyContent: p.align === "left" ? "flex-start" : p.align === "right" ? "flex-end" : "center" }}>
                  {r.words.map((w) => {
                    // lit from the first frame at or after its start (never a fraction of a frame early), out of the blur over 4 frames
                    const at = Math.ceil(spec.words[w.i].start * fps - from - 1e-6);
                    const lit = k(now, at - 1, at + 3, OUT);
                    return (
                      <span key={w.i} style={{
                        display: "inline-block", width: w.w, flex: "none", color: ink, lineHeight: 1,
                        fontFamily: w.accent ? news.fontFamily : INTER, fontStyle: w.accent ? "italic" : "normal",
                        fontWeight: w.accent ? 400 : 700, fontSize: w.size, letterSpacing: w.accent ? "0" : "-0.02em",
                        opacity: mix(0.3, 1, lit), filter: lit < 0.99 ? `blur(${((1 - lit) * 7 * u).toFixed(2)}px)` : undefined,
                        transform: `translateY(${((1 - lit) * 6 * u).toFixed(2)}px)`,
                        textShadow: "0 2px 14px rgba(0,0,0,0.55)", textAlign: "center",
                      }}>
                        {w.text}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

export type PlacedCaptionsProps = PlacedCaptionsSpec & { clip: string; from?: number; volume?: number };

export const PlacedCaptions: React.FC<PlacedCaptionsProps> = (p) => {
  const { width: W, height: H } = useVideoConfig();
  const { zoom, tx, ty } = framingOf(W, H, p.frame);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` }}>
        <OffthreadVideo src={staticFile(p.clip)} startFrom={p.from ?? 0} volume={p.volume ?? 1} style={{ width: W, height: H }} />
      </div>
      <PlacedCaptionsLayer spec={p} from={p.from ?? 0} />
    </AbsoluteFill>
  );
};
