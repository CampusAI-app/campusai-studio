/**
 * Reeded title (2026-11-18, ours, after @eightsenses.media's "PODCAST edited this, not me" reel, instagram.com/reel/Df447Vfj36j,
 * Muse Nov 18, 9.4 s, read frame by frame; the paid skill behind it was never bought or seen). What the reel does: the
 * edit ends on a full-frame title card of the speaker's last words, the letters seen through reeded (fluted) glass, so
 * every vertical rib shows its own magnified, shifted strip of the type.
 *
 * Ours: no backdrop-filter, so it renders headless. The scene behind the glass (a deep blue ground, two slow light pools,
 * the lead line and the title) is drawn once per rib inside a strip that clips it; each strip magnifies its copy about
 * the rib's own centre, which gives the stepped breaks at every rib edge, plus a 0.6 px soften, and a shading overlay
 * (lit left edge, shadowed right edge) makes each rib read as a rounded flute. The small lead line sits on the glass,
 * unrefracted: at 54 px the ribs scramble it past reading. The glass slides in from the right in
 * 8 frames with a light streak on its leading edge; the ribs start strong (2x) and relax to 1.32x as the scene drifts
 * left under them, so the letters shimmer through the flutes and the last frame is never still.
 * Words come from the clip's captions.json: the lead line (said before the card) shows lit, and each title word appears
 * on its own first frame, never ahead of the voice. Inter Tight 800 for the title, Inter for the lead line.
 *
 * Props: `words` (word timings, seconds of the clip), `from` (frames trimmed off the clip), `lead` and `title` (inclusive
 * [first, last] index ranges into `words`), `at` (frame the glass arrives), `ribs` (default 22), `ground` (top, bottom
 * and the light colour), `ink`, `size` (title px), `sound`. It is an overlay: put it over the footage it ends.
 *
 *   <ReededTitle words={words} lead={[14, 16]} title={[17, 18]} at={172} />
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/InterTight";
import { INTER } from "../parts";
import { OUT, Sfx, clampX, k, mix } from "./shared";
import type { CaptionWord } from "./CommentDrop";

const tight = loadFont("normal", { weights: ["800"], subsets: ["latin"] });

export type ReededTitleProps = {
  words: CaptionWord[];
  from?: number;
  lead?: [number, number];
  title: [number, number];
  at: number;
  ribs?: number;
  ground?: { top: string; bottom: string; light: string };
  ink?: string;
  size?: number;
  sound?: boolean;
};

const strip = (w: string) => w.replace(/[.,!?;:"]+$/g, "");

export const ReededTitle: React.FC<ReededTitleProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const sfx = <Sfx at={p.at - 1} name="swoosh-slow" volume={0.28} on={p.sound ?? true} />;
  // same tree shape before and after the card arrives, so the sound is never remounted
  if (f < p.at) return <AbsoluteFill style={{ overflow: "hidden" }}>{sfx}</AbsoluteFill>;

  const from = p.from ?? 0;
  const ribs = p.ribs ?? 22;
  const rw = W / ribs;
  const ground = p.ground ?? { top: "#0B1E4A", bottom: "#02050D", light: "#4C9BFF" };
  const ink = p.ink ?? "#FFFFFF";
  const size = p.size ?? 230;
  const now = (f + from) / fps;
  const local = f - p.at;

  // motion: the glass slides in hard and lands (ease-out, 8 frames); the ribs relax over 26; the scene keeps drifting
  const reveal = k(f, p.at, p.at + 8, OUT);
  const mag = mix(2.0, 1.32, k(f, p.at, p.at + 26, OUT));
  const drift = mix(110, 0, k(f, p.at, p.at + 30, OUT)) - local * 0.55;
  const pool = local * 0.9;

  const leadWords = p.lead ? p.words.slice(p.lead[0], p.lead[1] + 1) : [];
  const titleWords = p.words.slice(p.title[0], p.title[1] + 1);
  const capFirst = (s: string, i: number) => (i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  const scene = (
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${ground.top} 0%, ${ground.bottom} 100%)` }}>
      <div style={{ position: "absolute", left: -200 + pool, top: 380, width: 900, height: 900, borderRadius: "50%",
        background: `radial-gradient(circle, ${ground.light}88 0%, ${ground.light}00 65%)` }} />
      <div style={{ position: "absolute", left: 520 - pool * 0.6, top: 1050, width: 760, height: 760, borderRadius: "50%",
        background: `radial-gradient(circle, ${ground.light}55 0%, ${ground.light}00 65%)` }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `translateX(${drift.toFixed(2)}px)` }}>
        <div style={{ position: "absolute", left: 0, width: W, top: H / 2 - size * 1.0, textAlign: "center",
          fontFamily: tight.fontFamily, fontWeight: 800, fontSize: size, lineHeight: 0.92, letterSpacing: "-0.045em", color: ink,
          textShadow: `0 0 60px ${ground.light}99` }}>
          {titleWords.map((w, j) => {
            const s = w.start * fps - from;
            const o = f < s ? 0 : k(f, s, s + 4, OUT);
            return (
              <div key={j} style={{ whiteSpace: "nowrap", opacity: o, transform: `translateY(${((1 - o) * 34).toFixed(2)}px)`,
                filter: o < 0.999 ? `blur(${((1 - o) * 10).toFixed(2)}px)` : undefined }}>
                {capFirst(strip(w.w), j)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // the lead line sits ON the glass, not behind it: small type does not survive the ribs (it scrambled at 54 px)
  const leadLine = leadWords.length ? (
    <div style={{ position: "absolute", left: 0, width: W, top: H / 2 - size * 1.08 - 92, textAlign: "center",
      transform: `translateX(${(drift * 0.25).toFixed(2)}px)`, fontFamily: INTER, fontWeight: 500, fontSize: 54,
      letterSpacing: "-0.01em", color: ink, whiteSpace: "nowrap", textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}>
      {leadWords.map((w, j) => (
        <span key={j} style={{ opacity: mix(0.3, 0.85, k(now * fps, w.start * fps, w.start * fps + 3)) }}>
          {strip(w.w).toLowerCase()}
          {j < leadWords.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  ) : null;

  const streakX = (1 - reveal) * W;
  const streakO = interpolate(reveal, [0, 0.85, 1], [1, 0.6, 0], clampX);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {sfx}
      <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${(streakX - 1).toFixed(2)}px)`, background: ground.bottom }}>
        {Array.from({ length: ribs }, (_, i) => {
          const c = i * rw + rw / 2;
          return (
            <div key={i} style={{ position: "absolute", left: i * rw, top: 0, width: rw + 0.6, height: H, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: -i * rw, top: 0, width: W, height: H, transformOrigin: `${c.toFixed(2)}px 50%`,
                transform: `scaleX(${mag.toFixed(4)})`, filter: "blur(0.6px)" }}>
                {scene}
              </div>
              <div style={{ position: "absolute", inset: 0,
                background: "linear-gradient(90deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.05) 14%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.08) 74%, rgba(0,0,0,0.34) 100%)",
                boxShadow: "inset 1px 0 0 rgba(255,255,255,0.22)" }} />
            </div>
          );
        })}
        {leadLine}
      </AbsoluteFill>
      {streakO > 0.01 ? (
        <div style={{ position: "absolute", top: 0, left: streakX - 70, width: 140, height: H, opacity: streakO,
          background: `linear-gradient(90deg, ${ground.light}00 0%, ${ground.light}AA 42%, #FFFFFF 50%, ${ground.light}AA 58%, ${ground.light}00 100%)`,
          filter: "blur(6px)" }} />
      ) : null}
    </AbsoluteFill>
  );
};
