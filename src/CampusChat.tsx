/**
 * CampusAI post 2, "What makes CampusAI special?" (2026-10-16, round 3).
 *
 * Three chapters, each a title over a REAL recording of the campusai-demo chat (dark, the redesigned
 * answer), served through Content/video-studio/capture/post2-proxy.mjs, which feeds the scripted answers
 * in the demo's own stream shape, one word at a time. The demo itself is not edited; the recorder
 * (post2-record.cjs) zooms the conversation, leaves room at its top for the title, lets the answer run
 * the full width, and swaps two bits of demo copy that would contradict the answers (the Lockheed card's
 * reason line and its match label, shown as the product's own Strong match). Recordings are sharp 2x
 * screenshots taken in slow motion, resampled to even 60fps (public/post2/<size>q1..q3, marks in
 * lib/post2-takes.json), one set per aspect so the page IS the frame.
 *
 * Round 3, Jacob's calls: no mention of ChatGPT; the hook is "What makes [logo] special?"; the product
 * is the whole frame (recorded at the frame's own shape, nothing feathered, no seam); no "Hi Maya"
 * page and no retyping, each chapter opens on the question already asked; one hover, on a job; and it
 * ends by zooming into the CampusAI mark and landing on the logo.
 *
 * Kept from round 2: Zodiak titles with the key words in italic red, streamed in the chat's soft trail
 * (each character fades in over 650ms behind the writing edge), and a slow red wash over the whole frame.
 */
import React from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import takes from "./lib/post2-takes.json";

const { fontFamily: inter } = loadFont("normal", { weights: ["500"] });

// Zodiak (Indian Type Foundry, Fontshare, free for commercial use), self-hosted in public/fonts.
const ZODIAK = "Zodiak";
if (typeof document !== "undefined") {
  const handle = delayRender("Zodiak");
  const faces = [
    new FontFace(ZODIAK, `url(${staticFile("fonts/Zodiak-Bold.woff2")}) format("woff2")`, { weight: "700", style: "normal" }),
    new FontFace(ZODIAK, `url(${staticFile("fonts/Zodiak-Italic.woff2")}) format("woff2")`, { weight: "400", style: "italic" }),
  ];
  Promise.all(faces.map((f) => f.load().then((l) => document.fonts.add(l))))
    .then(() => continueRender(handle))
    .catch(() => continueRender(handle));
}

export const CHAT_POST_FPS = 30;

/** A title line: plain runs, italic accent runs, and the logo, in order. */
type Run = { t: string; accent?: boolean } | { logo: true };
type Chapter = "q1" | "q2" | "q3";
type Size = "916" | "45";

const HOOK: Run[] = [{ t: "What makes " }, { logo: true }, { t: " special?", accent: true }];
const CHAPTERS: { take: Chapter; title: Run[] }[] = [
  { take: "q1", title: [{ t: "It knows what you " }, { t: "still need.", accent: true }] },
  { take: "q2", title: [{ t: "It knows what " }, { t: "you've done.", accent: true }] },
  { take: "q3", title: [{ t: "It knows what's " }, { t: "happening on campus.", accent: true }] },
];

const PAGE_W = 820; // CSS px wide; height matches the frame's shape
const MARK = { x: 51, y: 93 }; // CSS px: the CampusAI mark in the page header, where the ending dives in
const START = 0.12; // seconds after send: the question is already in the chat
const HOLD = 1.9; // seconds an answer holds after its last word
const HOVER_HOLD = 2.0; // seconds the job card holds after the cursor lands
const SRC_FPS = 60;

type Hover = { from: { x: number; y: number }; to: { x: number; y: number }; start: number; end: number };
type Take = { n: number; streamEnd: number; vh: number; marks: { send: number; hover?: Hover } };
const plan = (size: Size, q: Chapter) => {
  const T = (takes as unknown as Record<string, Take>)[`${size}${q}`];
  const a = T.marks.send + START;
  const c = T.marks.hover ? T.marks.hover.end + HOVER_HOLD : T.streamEnd + HOLD;
  return { T, a, frames: Math.round((c - a) * CHAT_POST_FPS) };
};

const HOOK_FRAMES = 78;
const XF = 12;
const EASE_IN = Easing.bezier(0.55, 0, 1, 0.45);
const TRAIL = Easing.bezier(0.25, 1, 0.5, 1); // the chat's soft-trail curve
const LAND = Easing.bezier(0.34, 1.3, 0.64, 1); // one controlled settle
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const RED = "#ff5a6b";

const timeline = (size: Size) => {
  const plans = CHAPTERS.map((ch) => plan(size, ch.take));
  const starts: number[] = [];
  let f = HOOK_FRAMES;
  plans.forEach((p, i) => { starts.push(f); f += p.frames - (i < plans.length - 1 ? XF : 0); });
  const zoomAt = f; // the last chapter's final frame holds while the camera dives into the mark
  return { plans, starts, zoomAt, logoAt: zoomAt + 20, bioAt: zoomAt + 52, total: zoomAt + 110 };
};
export const chatPostFrames = (w: number, h: number) => timeline(h / w >= 1.5 ? "916" : "45").total;

const layoutFor = (w: number, h: number) =>
  h / w >= 1.5
    ? { size: "916" as Size, left: 72, top: 300, title: 78, hook: 96 }
    : { size: "45" as Size, left: 72, top: 168, title: 62, hook: 86 };

/** Streams runs in the chat's soft trail: each character fades in over 650ms, one after another. */
const Streamed: React.FC<{ runs: Run[]; at: number; frame: number; fps: number; stagger?: number; em: number }> = ({ runs, at, frame, fps, stagger = 0.55, em }) => {
  const fade = 0.65 * fps;
  let k = 0;
  const o = (weight = 1) => {
    const start = at + k * stagger;
    k += weight;
    return interpolate(frame, [start, start + fade], [0, 1], { ...clamp, easing: TRAIL });
  };
  return (
    <>
      {runs.map((r, ri) =>
        "logo" in r ? (
          <Img key={ri} src={staticFile("wall/campusai-wordmark-white.svg")}
            style={{ height: em * 0.98, width: "auto", display: "inline-block", verticalAlign: -em * 0.16, opacity: o(8) }} />
        ) : (
          <span key={ri} style={r.accent ? { fontStyle: "italic", fontWeight: 400, color: RED } : undefined}>
            {[...r.t].map((ch, ci) => <span key={ci} style={{ opacity: o() }}>{ch}</span>)}
          </span>
        ),
      )}
    </>
  );
};

/** The macOS arrow, drawn where the real mouse was (headless screenshots carry no cursor). */
const Cursor: React.FC<{ x: number; y: number; scale: number; opacity: number }> = ({ x, y, scale, opacity }) => (
  <svg width={26 * scale} height={38 * scale} viewBox="0 0 26 38"
    style={{ position: "absolute", left: x - 2 * scale, top: y - 2 * scale, opacity, filter: "drop-shadow(0 3px 6px rgba(0,0,0,.5))" }}>
    <path d="M2 2 L2 30 L9 23.5 L13.6 34 L18.4 32 L13.9 21.8 L23 21.8 Z" fill="#fff" stroke="#000" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

export const CampusChat: React.FC<{ ending: "ig" | "linkedin" }> = ({ ending }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const L = layoutFor(width, height);
  const TL = timeline(L.size);
  const s = width / PAGE_W; // frame px per CSS px: the page is the frame

  const head: React.CSSProperties = {
    position: "absolute", left: L.left, top: L.top, width: width - L.left * 2,
    fontFamily: ZODIAK, fontWeight: 700, fontSize: L.title, lineHeight: 1.04, letterSpacing: "-0.02em", color: "#fff",
  };
  const center: React.CSSProperties = { ...head, top: height * 0.44, transform: "translateY(-50%)", fontSize: L.hook };

  // the dive into the header mark at the end
  const dive = interpolate(frame, [TL.zoomAt, TL.zoomAt + 26], [0, 1], { ...clamp, easing: EASE_IN });
  const diveFade = interpolate(frame, [TL.zoomAt + 14, TL.zoomAt + 26], [1, 0], clamp);

  const chapters = CHAPTERS.map((ch, i) => {
    const P = TL.plans[i];
    const s0 = TL.starts[i];
    const local = frame - s0;
    const last = i === CHAPTERS.length - 1;
    if (local < 0 || (!last && local > P.frames) || (last && frame > TL.zoomAt + 28)) return null;
    const src = P.a + Math.min(local, P.frames) / fps;
    const idx = Math.max(0, Math.min(P.T.n - 1, Math.round(src * SRC_FPS)));
    const inA = interpolate(local, [0, XF], [0, 1], clamp);
    const outA = last ? diveFade : interpolate(local, [P.frames - XF, P.frames - XF / 2], [1, 0], clamp);
    const titleOut = last
      ? interpolate(frame, [TL.zoomAt - 2, TL.zoomAt + 8], [1, 0], clamp)
      : interpolate(local, [P.frames - XF - 10, P.frames - XF], [1, 0], clamp);
    const h = P.T.marks.hover;
    let cursor: React.ReactNode = null;
    if (h) {
      const k = interpolate(src, [h.start, h.end], [0, 1], clamp);
      const e = 1 - Math.pow(1 - k, 3); // the recorder moved the real mouse on this same curve
      const co = interpolate(src, [h.start - 0.2, h.start], [0, 1], clamp);
      if (co > 0) cursor = <Cursor x={(h.from.x + (h.to.x - h.from.x) * e) * s} y={(h.from.y + (h.to.y - h.from.y) * e) * s} scale={s * 0.9} opacity={co} />;
    }
    const zoomStyle: React.CSSProperties = last && dive > 0
      ? { transform: `scale(${1 + 22 * dive})`, transformOrigin: `${MARK.x * s}px ${MARK.y * s}px`, filter: `blur(${dive * 8}px)` }
      : {};
    return (
      <React.Fragment key={ch.take}>
        <AbsoluteFill style={{ opacity: inA * outA, ...zoomStyle }}>
          <Img src={staticFile(`post2/${L.size}${ch.take}/${String(idx).padStart(4, "0")}.jpg`)}
            style={{ position: "absolute", left: 0, top: 0, width, height: P.T.vh * s }} />
          {cursor}
        </AbsoluteFill>
        <div style={{ ...head, opacity: titleOut }}>
          <Streamed runs={ch.title} at={s0 + 6} frame={frame} fps={fps} em={L.title} />
        </div>
      </React.Fragment>
    );
  });

  const hookOut = interpolate(frame, [HOOK_FRAMES - 8, HOOK_FRAMES + 4], [1, 0], clamp);
  const logoIn = interpolate(frame, [TL.logoAt, TL.logoAt + 26], [0, 1], { ...clamp, easing: LAND });
  const logoA = interpolate(frame, [TL.logoAt, TL.logoAt + 10], [0, 1], clamp);
  const bioIn = ending === "ig" ? interpolate(frame, [TL.bioAt, TL.bioAt + 18], [0, 1], { ...clamp, easing: TRAIL }) : 0;
  const flare = interpolate(frame, [TL.zoomAt + 10, TL.zoomAt + 24, TL.zoomAt + 60], [0, 0.55, 0.18], clamp);

  // The red wash: three soft blooms drifting slowly over the whole frame, product included.
  const d = frame / fps;
  const bloom = (x: number, y: number, rw: number, rh: number, a: number) =>
    `radial-gradient(${rw}% ${rh}% at ${x}% ${y}%, rgba(226,24,51,${a}), rgba(226,24,51,0) 70%)`;
  const wash = [
    bloom(18 + 6 * Math.sin(d * 0.35), 10 + 4 * Math.cos(d * 0.3), 70, 34, 0.36),
    bloom(84 + 5 * Math.cos(d * 0.28), 58 + 6 * Math.sin(d * 0.33), 72, 36, 0.26),
    bloom(30 + 8 * Math.sin(d * 0.22), 98, 85, 30, 0.28),
  ].join(", ");

  return (
    <AbsoluteFill style={{ background: "#0b0708", overflow: "hidden" }}>
      {frame < HOOK_FRAMES + 6 ? (
        <div style={{ ...center, opacity: hookOut }}>
          <Streamed runs={HOOK} at={2} frame={frame} fps={fps} stagger={0.65} em={L.hook} />
        </div>
      ) : null}

      {chapters}

      {/* the dive lands in a red bloom, and the logo settles out of it */}
      <AbsoluteFill style={{ background: `radial-gradient(60% 40% at 50% 46%, rgba(226,24,51,${flare}), rgba(226,24,51,0) 75%)` }} />
      {frame >= TL.logoAt ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.44, transform: "translateY(-50%)", textAlign: "center" }}>
          <Img src={staticFile("wall/campusai-wordmark-white.svg")}
            style={{ display: "block", margin: "0 auto", width: width * 0.62, opacity: logoA, transform: `scale(${1.6 - 0.6 * logoIn})`, filter: `blur(${(1 - logoA) * 10}px)` }} />
          {ending === "ig" ? (
            <div style={{ marginTop: L.title * 0.7, fontFamily: inter, fontWeight: 500, fontSize: L.title * 0.42, letterSpacing: "-0.01em",
              color: "rgba(255,255,255,.62)", opacity: bioIn }}>
              Link in bio.
            </div>
          ) : null}
        </div>
      ) : null}

      <AbsoluteFill style={{ background: wash, mixBlendMode: "screen", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
