/**
 * Predict keys (2026-11-15, ours, after Skill Stack Store's "20 Claude Effects" reel, 3.75 to 4.6 s). What the reel
 * does: a phone keyboard rises from the bottom of the frame: a text field typing with a send button, a suggestion bar
 * above the keys ("key", "keys", "keyboard"), and a key-pop bubble on each press. About 0.9 s.
 *
 * Ours is drawn here (no screenshot) and typed by the speech: every word lands in the field as it is said, from the
 * clip's word timings. Short words are typed letter by letter across the word's own duration, each press popping its
 * key; long words are typed two letters in and then taken from the suggestion bar, whose middle slot already guessed
 * them. The bar only ever offers words from the captions: mid-word it shows the letters so far in quotes, the word
 * being said, and another caption word with the same start (or the next word); between words it guesses the next
 * word, with the two after it either side. A sentence end presses send: the line lifts off the field as a sent
 * bubble and the field clears. The keyboard rises on a spring in about 10 frames and drops on `exitAt`.
 *
 * Props: `clip` (path under public/), `from` (frames trimmed off its start), `words` (the words to type, clip
 * seconds, captions.json shape), `vocabulary` (words the bar may guess from, default `words`), `startAt` (frame the
 * keyboard rises), `exitAt` (optional), `acceptFrom` (letters at which a word is taken from the bar, default 6),
 * `accent` (send button and sent bubble), `placeholder`, `sound`.
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { INTER } from "../parts";
import { IN, OUT, Sfx, k, mix } from "./shared";
import type { CaptionWord } from "./CommentDrop";

export type PredictKeysProps = {
  clip: string;
  from?: number;
  volume?: number;
  words: CaptionWord[];
  vocabulary?: CaptionWord[];
  startAt?: number;
  exitAt?: number;
  acceptFrom?: number;
  accent?: string;
  placeholder?: string;
  sound?: boolean;
};

// the keyboard, in frame px for a 1080 wide frame
const SIDE = 10;
const GAP = 14;
const KEY_W = (1080 - SIDE * 2 - GAP * 9) / 10;
const KEY_H = 102;
const ROW_GAP = 20;
const SUGG_H = 96;
const PAD_TOP = 12;
const BOTTOM = 100;
const PANEL_H = PAD_TOP + SUGG_H + 8 + KEY_H * 4 + ROW_GAP * 3 + 14 + BOTTOM;
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

const C = { panel: "#1F1F22", key: "#4B4B50", fn: "#323236", pop: "#626268", ink: "#FFFFFF", dim: "rgba(255,255,255,0.5)", field: "#2A2A2E" };

type Rect = { x: number; y: number; w: number; h: number };
const rowY = (r: number) => PAD_TOP + SUGG_H + 8 + r * (KEY_H + ROW_GAP);
const keyRect = (id: string): Rect | null => {
  for (let r = 0; r < 3; r++) {
    const i = ROWS[r].indexOf(id);
    if (i < 0) continue;
    const n = ROWS[r].length;
    const rowW = n * KEY_W + (n - 1) * GAP;
    const x0 = (1080 - rowW) / 2;
    return { x: x0 + i * (KEY_W + GAP), y: rowY(r), w: KEY_W, h: KEY_H };
  }
  const wide = KEY_W * 1.32;
  if (id === "shift") return { x: SIDE, y: rowY(2), w: wide, h: KEY_H };
  if (id === "delete") return { x: 1080 - SIDE - wide, y: rowY(2), w: wide, h: KEY_H };
  const w123 = KEY_W * 1.3;
  const wRet = KEY_W * 2.3;
  if (id === "123") return { x: SIDE, y: rowY(3), w: w123, h: KEY_H };
  if (id === "return") return { x: 1080 - SIDE - wRet, y: rowY(3), w: wRet, h: KEY_H };
  if (id === "space") return { x: SIDE + w123 + GAP, y: rowY(3), w: 1080 - SIDE * 2 - w123 - wRet - GAP * 2, h: KEY_H };
  return null;
};

const clean = (w: string) => w.replace(/[.,!?;:"]/g, "");
const endsSentence = (w: string) => /[.!?]$/.test(w);

type Ev =
  | { t: number; kind: "char"; ch: string; key: string | null; word: number }
  | { t: number; kind: "space"; word: number }
  | { t: number; kind: "accept"; word: number; rest: string }
  | { t: number; kind: "send"; word: number };

/** Turns the timed words into presses, each on a frame of this composition. */
const plan = (words: CaptionWord[], from: number, fps: number, acceptFrom: number) => {
  const evs: Ev[] = [];
  let last = -Infinity;
  const at = (t: number) => {
    const v = Math.max(t, last + 1);
    last = v;
    return v;
  };
  words.forEach((w, i) => {
    const s = w.start * fps - from;
    const e = Math.max(w.end * fps - from, s + 3);
    const raw = w.w;
    const letters = clean(raw);
    if (letters.length >= acceptFrom) {
      // two letters by hand, then the guess in the middle slot is taken
      const gap = Math.max(1.5, (e - s) * 0.18);
      for (let j = 0; j < 2; j++) evs.push({ t: at(Math.round(s + j * gap)), kind: "char", ch: raw[j], key: raw[j].toLowerCase(), word: i });
      evs.push({ t: at(Math.round(s + Math.max(4, (e - s) * 0.45))), kind: "accept", word: i, rest: raw.slice(2) });
    } else {
      const step = (e - s) / Math.max(1, raw.length);
      for (let j = 0; j < raw.length; j++) {
        const ch = raw[j];
        const key = /[a-z]/i.test(ch) ? ch.toLowerCase() : null;
        evs.push({ t: at(Math.round(s + j * step)), kind: "char", ch, key, word: i });
      }
    }
    if (endsSentence(raw)) evs.push({ t: at(Math.round(e + 4)), kind: "send", word: i });
    else if (i < words.length - 1) evs.push({ t: at(Math.round(e)), kind: "space", word: i });
  });
  return evs;
};

/** The suggestion bar: three slots, the middle one the guess. */
const Suggestions: React.FC<{ slots: [string, string, string]; pressed: number; o: number }> = ({ slots, pressed, o }) => (
  <div style={{ position: "absolute", left: SIDE, right: SIDE, top: PAD_TOP, height: SUGG_H, display: "flex", alignItems: "center", opacity: o }}>
    {slots.map((s, i) => (
      <React.Fragment key={i}>
        {i > 0 && <div style={{ width: 2, height: 46, background: "rgba(255,255,255,0.16)", borderRadius: 1 }} />}
        <div style={{ flex: 1, height: SUGG_H - 14, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 18,
          background: i === 1 && pressed > 0 ? `rgba(255,255,255,${(0.22 * pressed).toFixed(3)})` : "transparent",
          fontFamily: INTER, fontSize: 40, fontWeight: i === 1 ? 600 : 500, letterSpacing: "-0.01em", color: i === 1 ? C.ink : "rgba(255,255,255,0.86)",
          whiteSpace: "nowrap", overflow: "hidden" }}>
          {s}
        </div>
      </React.Fragment>
    ))}
  </div>
);

const Glyph: React.FC<{ id: string; shifted: boolean }> = ({ id, shifted }) => {
  const stroke = { fill: "none", stroke: shifted && id === "shift" ? "#111" : "#fff", strokeWidth: 2.4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  if (id === "shift")
    return (
      <svg width={46} height={46} viewBox="0 0 24 24">
        <path d="M12 4 L20 12.5 H15.5 V19.5 H8.5 V12.5 H4 Z" {...stroke} fill={shifted ? "#111" : "none"} />
      </svg>
    );
  if (id === "delete")
    return (
      <svg width={50} height={50} viewBox="0 0 24 24">
        <path d="M8.5 5.5 H20 V18.5 H8.5 L3 12 Z" {...stroke} />
        <path d="M11.5 9.5 L16 14 M16 9.5 L11.5 14" {...stroke} />
      </svg>
    );
  return null;
};

export const PredictKeys: React.FC<PredictKeysProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, height: H } = useVideoConfig();
  const from = p.from ?? 0;
  const startAt = p.startAt ?? 0;
  const accent = p.accent ?? "#0A84FF";
  const evs = React.useMemo(() => plan(p.words, from, fps, p.acceptFrom ?? 6), [p.words, from, fps, p.acceptFrom]);
  const vocab = React.useMemo(() => Array.from(new Set((p.vocabulary ?? p.words).map((w) => clean(w.w)).filter(Boolean))), [p.vocabulary, p.words]);

  // replay the presses up to now
  let text = "";
  let partial = "";
  let nextWord = 0;
  let lastPress = -100;
  const sent: { t: number; text: string }[] = [];
  for (const e of evs) {
    if (e.t > f) break;
    lastPress = e.t;
    if (e.kind === "char") {
      text += e.ch;
      partial += e.ch;
      nextWord = e.word;
    } else if (e.kind === "accept") {
      text += e.rest;
      partial = "";
      nextWord = e.word + 1;
      if (!endsSentence(p.words[e.word].w) && e.word < p.words.length - 1) text += " ";
    } else if (e.kind === "space") {
      text += " ";
      partial = "";
      nextWord = e.word + 1;
    } else {
      sent.push({ t: e.t, text: text.trim() });
      text = "";
      partial = "";
      nextWord = e.word + 1;
    }
  }
  // a word typed in full (no space yet, e.g. the last one) still counts as in progress
  const midWord = partial.length > 0 && clean(partial).length > 0;

  // what the bar offers, all from the captions
  const word = (i: number) => (i >= 0 && i < p.words.length ? clean(p.words[i].w) : "");
  let slots: [string, string, string];
  if (midWord) {
    const typed = clean(partial);
    const current = word(nextWord);
    const alt = vocab.find((v) => v.toLowerCase().startsWith(typed.toLowerCase()) && v.toLowerCase() !== current.toLowerCase()) ?? word(nextWord + 1);
    slots = [`“${typed}”`, current, alt];
  } else {
    slots = [word(nextWord + 1), word(nextWord), word(nextWord + 2)];
  }
  const accepts = evs.filter((e) => e.kind === "accept");
  const acc = [...accepts].reverse().find((e) => f >= e.t - 3 && f < e.t + 5);
  const pressed = acc ? (f < acc.t ? k(f, acc.t - 3, acc.t) : 1 - k(f, acc.t, acc.t + 5)) : 0;
  // while the middle slot is held, show the guess that is being taken
  if (acc) slots = f >= acc.t ? [slots[0], word(acc.word), slots[2]] : [`“${clean(p.words[acc.word].w).slice(0, 2)}”`, word(acc.word), slots[2]];

  // which keys are down
  const down = new Map<string, number>();
  let shifted = false;
  for (const e of evs) {
    if (e.t > f) break;
    if (f - e.t > 5) continue;
    if (e.kind === "char" && e.key) down.set(e.key, f - e.t);
    if (e.kind === "space") down.set("space", f - e.t);
  }
  for (const e of evs) {
    if (e.kind === "char" && e.key && e.ch !== e.ch.toLowerCase() && f >= e.t - 3 && f < e.t) shifted = true;
  }
  const lastSend = sent.length ? sent[sent.length - 1].t : -100;
  const sendPress = f - lastSend < 6 ? 1 - k(f, lastSend, lastSend + 6) : 0;

  // the keyboard rises on a spring and drops on exit
  const rise = spring({ frame: f - startAt, fps, config: { damping: 18, stiffness: 150, mass: 0.8 } });
  const drop = p.exitAt === undefined ? 0 : k(f, p.exitAt, p.exitAt + 9, IN);
  const lift = (1 - rise) * (PANEL_H + 260) + drop * (PANEL_H + 300);

  const typing = f - lastPress < 8;
  const caretOn = typing || Math.floor((f - lastPress) / 16) % 2 === 0;

  const key = (id: string, label: React.ReactNode, fn = false) => {
    const r = keyRect(id);
    if (!r) return null;
    const t = down.get(id);
    const isDown = t !== undefined;
    const bg = id === "shift" && shifted ? "#F2F2F5" : isDown ? C.pop : fn ? C.fn : C.key;
    return (
      <div key={id} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 16, background: bg,
        boxShadow: "0 2px 0 rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: INTER, fontWeight: fn ? 500 : 400, fontSize: fn ? 36 : 54, color: C.ink, letterSpacing: fn ? "-0.01em" : 0 }}>
        {label}
      </div>
    );
  };

  // key pops: the pressed letter grows out of its key
  const pops = [...down.entries()].filter(([id]) => id.length === 1).map(([id, t]) => {
    const r = keyRect(id)!;
    const s = t < 1 ? mix(0.8, 1, t) : 1;
    const o = t < 4 ? 1 : 1 - (t - 4);
    const bw = r.w * 1.5;
    const bh = r.h * 1.3;
    return (
      <div key={`pop-${id}`} style={{ position: "absolute", left: r.x + r.w / 2 - bw / 2, top: r.y - bh + 14, width: bw, height: bh + r.h - 14,
        opacity: Math.max(0, o), transform: `scale(${s.toFixed(3)})`, transformOrigin: "50% 100%", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: bw, height: bh, borderRadius: 22, background: C.pop, display: "flex",
          alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 400, fontSize: 76, color: C.ink }}>
          {shifted ? id.toUpperCase() : id}
        </div>
        <div style={{ position: "absolute", left: (bw - r.w) / 2, top: bh - 20, width: r.w, height: r.h - 6 + 20, borderRadius: "0 0 16px 16px", background: C.pop }} />
      </div>
    );
  });

  const hasText = text.length > 0;

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <OffthreadVideo src={staticFile(p.clip)} trimBefore={from} volume={p.volume ?? 1} style={{ width: "100%", height: "100%" }} />

      {/* everything below rises together */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: H, transform: `translateY(${lift.toFixed(2)}px)` }}>
        {/* sent lines lift off the field */}
        {sent.map((m, i) => {
          const t = f - m.t;
          if (t > 22) return null;
          const up = k(f, m.t, m.t + 18, OUT);
          return (
            <div key={i} style={{ position: "absolute", right: 34, bottom: PANEL_H + 150 + 190 * up, maxWidth: 760, opacity: 1 - k(f, m.t + 10, m.t + 22),
              transform: `scale(${mix(0.9, 1, k(f, m.t, m.t + 8)).toFixed(4)})`, transformOrigin: "100% 100%",
              background: accent, color: "#fff", fontFamily: INTER, fontWeight: 500, fontSize: 44, lineHeight: 1.22, letterSpacing: "-0.01em",
              padding: "22px 32px", borderRadius: 40, boxShadow: "0 14px 30px rgba(0,0,0,0.35)" }}>
              {m.text}
            </div>
          );
        })}

        {/* the input bar */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: PANEL_H, padding: "22px 24px 22px 24px", background: C.panel,
          borderRadius: "34px 34px 0 0", boxShadow: "0 -16px 40px rgba(0,0,0,0.35)", display: "flex", alignItems: "flex-end", gap: 18 }}>
          <div style={{ width: 74, height: 74, borderRadius: 37, background: C.field, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={34} height={34} viewBox="0 0 24 24"><path d="M12 4 V20 M4 12 H20" stroke="rgba(255,255,255,0.75)" strokeWidth={2.6} strokeLinecap="round" /></svg>
          </div>
          <div style={{ flex: 1, minHeight: 74, borderRadius: 37, background: C.field, boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.10)", display: "flex",
            alignItems: "flex-end", padding: "8px 8px 8px 30px", gap: 12 }}>
            <div style={{ flex: 1, fontFamily: INTER, fontWeight: 400, fontSize: 50, lineHeight: "62px", letterSpacing: "-0.01em", color: hasText ? C.ink : C.dim,
              paddingBottom: 0, overflowWrap: "anywhere" }}>
              {!hasText && caretOn && <span style={{ display: "inline-block", width: 4, height: 50, marginRight: 4, verticalAlign: "-10px", background: accent, borderRadius: 2 }} />}
              {hasText ? text : <span>{p.placeholder ?? "Message"}</span>}
              {hasText && caretOn && <span style={{ display: "inline-block", width: 4, height: 50, marginLeft: 3, verticalAlign: "-10px", background: accent, borderRadius: 2 }} />}
            </div>
            <div style={{ width: 58, height: 58, borderRadius: 29, flexShrink: 0, background: hasText || sendPress > 0 ? accent : "rgba(255,255,255,0.14)",
              display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${(1 - 0.16 * sendPress).toFixed(3)})` }}>
              <svg width={30} height={30} viewBox="0 0 24 24"><path d="M12 19 V5 M5.5 11.5 L12 5 L18.5 11.5" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
        </div>

        {/* the keyboard */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: PANEL_H, background: C.panel }}>
          <Suggestions slots={slots} pressed={pressed} o={1} />
          {ROWS.join("").split("").map((ch) => key(ch, shifted ? ch.toUpperCase() : ch))}
          {key("shift", <Glyph id="shift" shifted={shifted} />, true)}
          {key("delete", <Glyph id="delete" shifted={false} />, true)}
          {key("123", "123", true)}
          {key("space", "space")}
          {key("return", "return", true)}
          {pops}
          {/* globe and mic, then the home bar */}
          <svg width={60} height={60} viewBox="0 0 24 24" style={{ position: "absolute", left: 46, top: rowY(4) - 8 }}>
            <circle cx={12} cy={12} r={8.5} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={1.6} />
            <path d="M3.5 12 H20.5 M12 3.5 C8.5 7 8.5 17 12 20.5 M12 3.5 C15.5 7 15.5 17 12 20.5" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={1.6} />
          </svg>
          <svg width={60} height={60} viewBox="0 0 24 24" style={{ position: "absolute", right: 46, top: rowY(4) - 8 }}>
            <rect x={9} y={3.5} width={6} height={11} rx={3} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={1.6} />
            <path d="M6 11.5 C6 15 8.7 17.5 12 17.5 C15.3 17.5 18 15 18 11.5 M12 17.5 V20.5" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={1.6} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", left: 540 - 140, bottom: 16, width: 280, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.85)" }} />
        </div>
      </div>

      {evs.filter((e) => e.kind === "char" || e.kind === "space").map((e, i) => (
        <Sfx key={i} at={e.t} name="typewriter-hit-soft" volume={0.12} on={p.sound ?? true} />
      ))}
      {evs.filter((e) => e.kind === "send").map((e, i) => (
        <Sfx key={`s${i}`} at={e.t} name="air-woosh-quick" volume={0.3} on={p.sound ?? true} />
      ))}
    </AbsoluteFill>
  );
};
