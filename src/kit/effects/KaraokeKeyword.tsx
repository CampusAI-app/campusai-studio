/**
 * KaraokeKeyword (2026-11-24, Muse pass, from Alex Prompter's Cicada demo reel, instagram.com/reel/DgFw8w-xrJD, read every
 * 0.5 s). The reel's caption: small white sans words at the top centre that build one word at a time, two to five words on
 * screen, and the KEY word of each phrase set in an italic serif inside a thin outlined box with tiny square handles at its
 * corners, like a text box that has just been selected. Ours: the box and handles in the brand accent.
 *
 * Write a phrase as plain text with the key word(s) between asterisks: "It's called *CampusAI*". Each word lands at
 * `at + i * stagger` frames, or at its own frame from `times` (word timings from a voice track, when there is one). A word
 * arrives out of a small blur and rise; the key box draws open from its centre as the key word lands. The phrase leaves on
 * `end` (fade and lift, 6 frames), so phrases can be butted end to start.
 *
 * Reading time is the film's job: hold each phrase at least letters / 15 + 1.5 s (rules in skill/SKILL.md).
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { INTER } from "../parts";

const { fontFamily: SERIF } = loadSerif("italic", { weights: ["400"] });

export type KaraokePhrase = {
  /** Frame the first word lands. */
  at: number;
  /** Frame the phrase leaves. */
  end: number;
  /** The words, key word(s) between asterisks. */
  text: string;
  /** Optional landing frame per word (absolute), e.g. from word timings. Overrides `stagger`. */
  times?: number[];
};

export type KaraokeKeywordProps = {
  phrases: KaraokePhrase[];
  /** Frames between words when `times` is not given. Default 6 (0.2 s at 30 fps). */
  stagger?: number;
  /** Top of the caption block, px. */
  top?: number;
  /** Sans size, px; the serif key word is set 1.18x. */
  size?: number;
  maxWidth?: number;
  ink?: string;
  accent: string;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Word = { w: string; key: boolean };
const parse = (text: string): Word[] => {
  const out: Word[] = [];
  let key = false;
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    let w = raw;
    const opens = w.startsWith("*");
    if (opens) { key = true; w = w.slice(1); }
    const closes = w.endsWith("*") || /\*[.,?!]$/.test(w);
    w = w.replace(/\*/g, "");
    out.push({ w, key: key || opens });
    if (closes) key = false;
  }
  return out;
};

/** Group consecutive key words so one box wraps them all. */
const runs = (words: Word[]) => {
  const r: { words: { w: string; i: number }[]; key: boolean }[] = [];
  words.forEach((x, i) => {
    const last = r[r.length - 1];
    if (last && last.key && x.key) last.words.push({ w: x.w, i });
    else r.push({ words: [{ w: x.w, i }], key: x.key });
  });
  return r;
};

const Handle: React.FC<{ style: React.CSSProperties; accent: string; s: number }> = ({ style, accent, s }) => (
  <div style={{ position: "absolute", width: s, height: s, background: "#fff", border: `1.5px solid ${accent}`, ...style }} />
);

const PhraseView: React.FC<{ p: KaraokePhrase; stagger: number; size: number; maxWidth: number; ink: string; accent: string }> = ({ p, stagger, size, maxWidth, ink, accent }) => {
  const f = useCurrentFrame();
  const words = parse(p.text);
  const landAt = (i: number) => (p.times?.[i] ?? p.at + i * stagger);
  const leave = interpolate(f, [p.end - 6, p.end], [1, 0], clamp);
  const lift = interpolate(f, [p.end - 6, p.end], [0, -10], clamp);
  const wordStyle = (i: number): React.CSSProperties => {
    const t = interpolate(f, [landAt(i), landAt(i) + 5], [0, 1], clamp);
    return { opacity: t, transform: `translateY(${(1 - t) * 10}px)`, filter: `blur(${(1 - t) * 5}px)`, display: "inline-block" };
  };
  return (
    <div style={{ opacity: leave, transform: `translateY(${lift}px)`, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", columnGap: size * 0.28, rowGap: size * 0.32, maxWidth, margin: "0 auto" }}>
      {runs(words).map((run, k) => {
        if (!run.key) {
          // a word takes its place only when it lands, so the line builds from the centre the way the reel's does
          return run.words.filter(({ i }) => f >= landAt(i)).map(({ w, i }) => (
            <span key={`${k}-${i}`} style={{ ...wordStyle(i), fontFamily: INTER, fontWeight: 600, fontSize: size, color: ink, letterSpacing: "-0.02em", textShadow: "0 2px 14px rgba(0,0,0,0.65)" }}>{w}</span>
          ));
        }
        const first = run.words[0].i;
        if (f < landAt(first)) return null;
        const open = interpolate(f, [landAt(first), landAt(first) + 7], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
        const hs = Math.round(size * 0.2);
        return (
          <span key={`k${k}`} style={{ position: "relative", display: "inline-flex", gap: size * 0.24, padding: `${size * 0.02}px ${size * 0.2}px ${size * 0.08}px` }}>
            <span style={{ position: "absolute", inset: 0, transform: `scaleX(${open})`, opacity: Math.min(1, open * 1.5), border: `2px solid ${accent}`, background: `rgba(${hexRgb(accent)}, 0.14)` }}>
              <Handle accent={accent} s={hs} style={{ left: -hs / 2 - 1, top: -hs / 2 - 1 }} />
              <Handle accent={accent} s={hs} style={{ right: -hs / 2 - 1, top: -hs / 2 - 1 }} />
              <Handle accent={accent} s={hs} style={{ left: -hs / 2 - 1, bottom: -hs / 2 - 1 }} />
              <Handle accent={accent} s={hs} style={{ right: -hs / 2 - 1, bottom: -hs / 2 - 1 }} />
            </span>
            {run.words.filter(({ i }) => f >= landAt(i)).map(({ w, i }) => (
              <span key={i} style={{ ...wordStyle(i), position: "relative", fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: size * 1.18, lineHeight: 1.05, color: "#fff", textShadow: "0 2px 14px rgba(0,0,0,0.5)" }}>{w}</span>
            ))}
          </span>
        );
      })}
    </div>
  );
};

const hexRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

export const KaraokeKeyword: React.FC<KaraokeKeywordProps> = ({ phrases, stagger = 6, top = 180, size = 54, maxWidth = 900, ink = "#ffffff", accent }) => {
  const f = useCurrentFrame();
  const live = phrases.filter((p) => f >= p.at - 1 && f < p.end);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", pointerEvents: "none" }}>
      {live.map((p) => (
        <PhraseView key={`${p.at}-${p.text}`} p={p} stagger={stagger} size={size} maxWidth={maxWidth} ink={ink} accent={accent} />
      ))}
    </div>
  );
};
