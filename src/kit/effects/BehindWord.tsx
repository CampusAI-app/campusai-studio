/**
 * Behind word (2026-11-18, ours, after @eightsenses.media's "PODCAST edited this, not me" reel, instagram.com/reel/Df447Vfj36j,
 * Muse Nov 18, 1.3 s and 6.6 s, read frame by frame; the paid skill behind it was never bought or seen). What the reel does:
 * a small lowercase line ("build an") above one HUGE condensed white word ("Empire", a white to grey gradient) that sits
 * BEHIND the speaker's head, the cutout in front of it; later "build a" + "World" takes its place.
 *
 * Before building: the kit had no word-behind-the-head part. GlassType and CoverStory put a word behind a still capture,
 * SketchWords draws an outline above the head, and `npm run effects -- backdrop-word` (the Python renderer) drops one fixed
 * word with no caption timing. None lands on the spoken word or swaps, so this is new.
 *
 * Ours: every word comes from the clip's captions.json. A beat is a lead line (word indices) and the keyword (indices).
 * The first beat's lead line shows dim 0.35 s before its first word and lights each word as it is said, never ahead of
 * the voice. The keyword lands on its exact first frame: out of a 14 px blur and down from 118% in 4 frames, then a
 * slow 4% push so it is never still. The next beat swaps in on ITS keyword: the old one drops back out of focus in
 * 4 frames while the new lead line (already said) and word land together. The room darkens a little behind the words
 * (`dim`, fading out well above the cutout's bottom edge, so no seam shows), which keeps the person brighter than the type.
 * Barlow Condensed 800 for the word, Inter for the lead line. Sentence case, no tracking.
 *
 * Props: `clip`, `person` (alpha webm), `from`, `frame` ({ zoom, bottom, focusX }), and the BehindWordSpec: `words` (the
 * clip's word timings, seconds), `beats`, `at` (frame px centre of the keyword), `width` (px it may fill), `maxSize`,
 * `dim`, `exitAt`, `ink`. `BehindWordLayer` is the type alone, to stack with other effects on one person.
 *
 *   <BehindWord clip="x/clip.mp4" person="x/person.webm" frame={{ zoom: 1.25, bottom: 1700 }} words={words}
 *     beats={[{ lead: [8, 9], word: [10, 10] }]} at={{ x: 540, y: 620 }} width={860} />
 */
import React, { useEffect, useState } from "react";
import { AbsoluteFill, OffthreadVideo, cancelRender, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { INTER } from "../parts";
import { IN, OUT, Sfx, clampX, k, mix } from "./shared";
import { Framing, framingOf } from "./frameGrab";
import type { CaptionWord } from "./CommentDrop";

const barlow = loadFont("normal", { weights: ["800"], subsets: ["latin"] });

/** A lead line and its keyword, each an inclusive [first, last] index range into `words`. */
export type BehindBeat = { lead?: [number, number]; word: [number, number] };

export type BehindWordSpec = {
  words: CaptionWord[];
  beats: BehindBeat[];
  at: { x: number; y: number };
  width: number;
  maxSize?: number;
  /** 0 to 1: how much the room darkens behind the words. */
  dim?: number;
  exitAt?: number;
  ink?: { top: string; bottom: string; lead: string };
};

const strip = (w: string) => w.replace(/[.,!?;:"]+$/g, "").replace(/^["]+/, "");
const keyText = (s: BehindWordSpec, b: BehindBeat) => {
  const t = s.words.slice(b.word[0], b.word[1] + 1).map((w) => strip(w.w)).join(" ");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** When each beat shows, lands and leaves, in this composition's frames. */
export const behindTimes = (s: BehindWordSpec, fps: number, from = 0, total = Infinity) => {
  const lands = s.beats.map((b) => s.words[b.word[0]].start * fps - from);
  return s.beats.map((b, i) => {
    const land = lands[i];
    // only the first beat builds its lead line on the voice; later ones arrive whole with their keyword
    const show = i === 0 && b.lead ? s.words[b.lead[0]].start * fps - from - 0.35 * fps : land;
    const leave = i < lands.length - 1 ? lands[i + 1] : (s.exitAt ?? total);
    return { show, land, leave };
  });
};

export const BehindWordLayer: React.FC<{ spec: BehindWordSpec; from?: number }> = ({ spec, from = 0 }) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const [sizes, setSizes] = useState<number[] | null>(null);
  const [handle] = useState(() => delayRender("behind word sizes"));
  const maxSize = spec.maxSize ?? 520;
  const ink = spec.ink ?? { top: "#FFFFFF", bottom: "#9EA3AC", lead: "#FFFFFF" };
  const texts = spec.beats.map((b) => keyText(spec, b));
  const textsKey = texts.join("|");

  useEffect(() => {
    barlow
      .waitUntilDone()
      .then(() => document.fonts.load(`800 100px ${barlow.fontFamily}`))
      .then(() => {
        const ctx = new OffscreenCanvas(8, 8).getContext("2d")!;
        ctx.font = `800 100px ${barlow.fontFamily}`;
        setSizes(textsKey.split("|").map((t) => Math.min(maxSize, (spec.width * 100) / Math.max(1, ctx.measureText(t).width))));
      })
      .catch((e) => cancelRender(e));
  }, [textsKey, maxSize, spec.width]);
  useEffect(() => {
    if (sizes) continueRender(handle);
  }, [sizes, handle]);
  if (!sizes) return null;

  const times = behindTimes(spec, fps, from, durationInFrames);
  const now = (f + from) / fps;
  const first = times[0].show;
  const last = times[times.length - 1].leave;
  const dimO = (spec.dim ?? 0.4) * k(f, first, first + 8, OUT) * (1 - k(f, last, last + 6, IN));
  const lowest = spec.at.y + Math.max(...sizes) * 0.5;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {dimO > 0.001 ? (
        <AbsoluteFill
          style={{
            opacity: dimO,
            background: `linear-gradient(180deg, rgba(4,6,12,0.95) 0px, rgba(4,6,12,0.85) ${Math.round(lowest)}px, rgba(4,6,12,0) ${Math.round(Math.min(H, lowest + 360))}px)`,
          }}
        />
      ) : null}
      {spec.beats.map((b, i) => {
        const t = times[i];
        if (f < t.show - 1 || f > t.leave + 5) return null;
        const size = sizes[i];
        const out = k(f, t.leave, t.leave + 4, IN);
        // the keyword: lands on its first frame out of a blur, then a slow push
        const land = k(f, t.land, t.land + 4, OUT);
        const wordO = f < t.land ? 0 : Math.min(1, (f - t.land + 1) / 2) * (1 - out);
        const push = interpolate(f, [t.land + 4, t.leave], [1, 1.04], clampX);
        const scale = mix(1.18, 1, land) * push * (1 - 0.06 * out);
        const blur = (1 - land) * 14 + out * 8;
        const leadSize = Math.round(Math.max(38, Math.min(58, size * 0.13)));
        const lineIn = k(f, t.show, t.show + 5, OUT);
        const leadWords = b.lead ? spec.words.slice(b.lead[0], b.lead[1] + 1) : [];
        const top = spec.at.y - size * 0.43;
        return (
          <React.Fragment key={i}>
            {leadWords.length ? (
              <div
                style={{
                  position: "absolute", left: 0, width: W, top: top - leadSize * 1.55, textAlign: "center",
                  fontFamily: INTER, fontWeight: 500, fontSize: leadSize, lineHeight: 1.1, letterSpacing: "-0.01em", whiteSpace: "nowrap",
                  color: ink.lead, opacity: lineIn * (1 - out),
                  transform: `translateY(${((1 - lineIn) * 12 - out * 10).toFixed(2)}px)`,
                  textShadow: "0 2px 18px rgba(0,0,0,0.45)",
                }}
              >
                {leadWords.map((w, j) => (
                  <span key={j} style={{ opacity: mix(0.32, 1, k(now * fps, w.start * fps, w.start * fps + 3)) }}>
                    {strip(w.w).toLowerCase()}
                    {j < leadWords.length - 1 ? " " : ""}
                  </span>
                ))}
              </div>
            ) : null}
            {wordO > 0 ? (
              <div
                style={{
                  position: "absolute", left: spec.at.x - W, width: W * 2, top, height: size * 0.86, textAlign: "center",
                  transform: `scale(${scale.toFixed(4)})`, transformOrigin: `50% 60%`, opacity: wordO,
                  filter: `${blur > 0.05 ? `blur(${blur.toFixed(2)}px) ` : ""}drop-shadow(0 18px 40px rgba(0,0,0,0.35))`,
                }}
              >
                <span
                  style={{
                    fontFamily: barlow.fontFamily, fontWeight: 800, fontSize: size, lineHeight: 0.86, whiteSpace: "nowrap",
                    color: "transparent", backgroundImage: `linear-gradient(180deg, ${ink.top} 0%, ${ink.top} 38%, ${ink.bottom} 100%)`,
                    WebkitBackgroundClip: "text", backgroundClip: "text", display: "inline-block", paddingTop: size * 0.04,
                  }}
                >
                  {texts[i]}
                </span>
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

export type BehindWordProps = BehindWordSpec & {
  clip: string;
  person: string;
  from?: number;
  frame?: Framing;
  volume?: number;
  sound?: boolean;
};

export const BehindWord: React.FC<BehindWordProps> = (p) => {
  const { width: W, height: H, fps } = useVideoConfig();
  const from = p.from ?? 0;
  const { zoom, tx, ty } = framingOf(W, H, p.frame);
  const framed: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${zoom})` };
  const times = behindTimes(p, fps, from);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <div style={framed}>
        <OffthreadVideo src={staticFile(p.clip)} startFrom={from} volume={p.volume ?? 1} style={{ width: W, height: H }} />
      </div>
      <BehindWordLayer spec={p} from={from} />
      <div style={framed}>
        <OffthreadVideo src={staticFile(p.person)} startFrom={from} muted transparent style={{ width: W, height: H }} />
      </div>
      {times.map((t, i) => (
        <Sfx key={i} at={t.land - 1} name="bass-hit-short" volume={0.3} on={p.sound ?? true} />
      ))}
    </AbsoluteFill>
  );
};
