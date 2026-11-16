/**
 * Voice note (2026-11-15). Ours from the name only: the Skill Stack Store reel lists "voice note" (19.7 to 20.4 s) but
 * shows nothing for it in any frame, so this was designed from scratch, not matched to anything.
 *
 * A chat voice-note bubble arrives under the speaker and plays his own words: the waveform is the clip's real audio
 * (`getWaveformPortion` over the note's span, one bar per slice), the played bars fill with the accent as the play
 * head moves with the speech, the bars at the play head swell with the live loudness of that frame, a knob rides the
 * play head, and the play button's ring pulses with the voice. The clock counts the elapsed time. Under the waveform,
 * the transcript lights word by word from the clip's word timings, the way a phone transcribes a voice message. The
 * bubble rises on a spring (about 10 frames) and, once the note has played, the button turns back to play.
 *
 * Props: `clip` (path under public/, its audio is the note), `from` (frames trimmed off its start), `span` ([start, end]
 * of the note in clip seconds), `words` (optional, captions.json shape, clip seconds, for the transcript), `startAt`
 * (frame the bubble arrives), `exitAt` (optional), `bars` (default 34), `accent`, `at` ({ x, y } of the bubble's
 * bottom left, frame px), `width`, `sound`.
 */
import React from "react";
import { AbsoluteFill, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { getWaveformPortion, useAudioData } from "@remotion/media-utils";
import { INTER } from "../parts";
import { IN, Sfx, k, mix } from "./shared";
import type { CaptionWord } from "./CommentDrop";

export type VoiceNoteProps = {
  clip: string;
  from?: number;
  volume?: number;
  span: [number, number];
  words?: CaptionWord[];
  startAt?: number;
  exitAt?: number;
  bars?: number;
  accent?: string;
  at?: { x: number; y: number };
  width?: number;
  sound?: boolean;
};

const PAPER = "#F6F3EE";
const INK = "#17151A";
const IDLE = "#CDC7BF";

const clock = (s: number) => {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

export const VoiceNote: React.FC<VoiceNoteProps> = (p) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const from = p.from ?? 0;
  const accent = p.accent ?? "#E5484D";
  const n = p.bars ?? 34;
  const width = p.width ?? 960;
  const at = p.at ?? { x: 60, y: 1700 };
  const startAt = p.startAt ?? 0;
  const [s0, s1] = p.span;
  const now = (f + from) / fps;

  const audio = useAudioData(staticFile(p.clip));
  const shape = React.useMemo(() => {
    if (!audio) return null;
    const raw = getWaveformPortion({ audioData: audio, startTimeInSeconds: s0, durationInSeconds: s1 - s0, numberOfSamples: n }).map((b) => b.amplitude);
    const max = Math.max(...raw, 1e-6);
    return { bars: raw.map((a) => a / max), max };
  }, [audio, s0, s1, n]);
  // loudness right now, against the loudest slice of the note
  let level = 0;
  if (audio && shape && now >= s0 && now <= s1) {
    const w = getWaveformPortion({ audioData: audio, startTimeInSeconds: Math.max(0, now - 1 / fps), durationInSeconds: 2 / fps, numberOfSamples: 1 });
    level = Math.min(1, w[0].amplitude / shape.max);
  }

  const head = Math.min(1, Math.max(0, (now - s0) / (s1 - s0)));
  const playing = now >= s0 && now < s1;
  const done = now >= s1;

  const arrive = spring({ frame: f - startAt, fps, config: { damping: 15, stiffness: 170, mass: 0.8 } });
  const leave = p.exitAt === undefined ? 0 : k(f, p.exitAt, p.exitAt + 9, IN);
  const o = Math.min(1, arrive * 1.4) * (1 - leave);

  const pad = 30;
  const btn = 104;
  const gap = 26;
  const waveW = width - pad * 2 - btn - gap;
  const barGap = 7;
  const barW = (waveW - barGap * (n - 1)) / n;
  const waveH = 110;

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <OffthreadVideo src={staticFile(p.clip)} trimBefore={from} volume={p.volume ?? 1} style={{ width: "100%", height: "100%" }} />

      <div style={{ position: "absolute", left: at.x, bottom: 1920 - at.y, width, opacity: o, transformOrigin: "0% 100%",
        transform: `translateY(${((1 - arrive) * 70 + leave * 40).toFixed(2)}px) scale(${mix(0.86, 1, arrive).toFixed(4)})` }}>
        <div style={{ position: "relative", background: PAPER, borderRadius: "46px 46px 46px 14px", padding: `${pad}px ${pad}px ${pad - 4}px`,
          boxShadow: "0 24px 50px rgba(0,0,0,0.42), 0 4px 10px rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap }}>
            {/* play button: a pause while the note plays, its ring pulsing with the voice */}
            <div style={{ position: "relative", width: btn, height: btn, flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: -10 * level, borderRadius: "50%", background: accent, opacity: 0.22 * level }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 6px 14px rgba(0,0,0,0.18)" }}>
                <svg width={44} height={44} viewBox="0 0 24 24">
                  {playing ? (
                    <g fill="#fff"><rect x={5.5} y={4} width={4.6} height={16} rx={1.4} /><rect x={13.9} y={4} width={4.6} height={16} rx={1.4} /></g>
                  ) : (
                    <path d="M7.5 4.8 L19 12 L7.5 19.2 Z" fill="#fff" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
                  )}
                </svg>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ position: "relative", height: waveH }}>
                {Array.from({ length: n }).map((_, i) => {
                  const amp = shape ? shape.bars[i] : 0.15;
                  const centre = (i + 0.5) / n;
                  const fill = Math.min(1, Math.max(0, (head * n - i)));
                  const near = playing ? Math.max(0, 1 - Math.abs(centre - head) * n * 0.6) : 0;
                  const h = Math.max(10, (10 + amp * (waveH - 14)) * (1 + 0.4 * near * level));
                  return (
                    <div key={i} style={{ position: "absolute", left: i * (barW + barGap), top: (waveH - h) / 2, width: barW, height: h, borderRadius: barW / 2,
                      background: `linear-gradient(90deg, ${accent} ${(fill * 100).toFixed(1)}%, ${IDLE} ${(fill * 100).toFixed(1)}%)` }} />
                  );
                })}
                {(playing || done) && (
                  <div style={{ position: "absolute", left: head * waveW - 13, top: waveH / 2 - 13, width: 26, height: 26, borderRadius: 13, background: accent,
                    boxShadow: "0 0 0 4px rgba(246,243,238,0.95), 0 2px 6px rgba(0,0,0,0.25)" }} />
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: INTER, fontWeight: 500, fontSize: 28, lineHeight: 1,
                color: "rgba(23,21,26,0.55)", fontVariantNumeric: "tabular-nums" }}>
                <span style={{ color: playing ? accent : undefined }}>{clock(playing || done ? now - s0 : s1 - s0)}</span>
                <span>{clock(s1 - s0)}</span>
              </div>
            </div>
          </div>

          {p.words && p.words.length > 0 && (
            <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1.5px solid rgba(23,21,26,0.1)", fontFamily: INTER, fontWeight: 500, fontSize: 40,
              lineHeight: 1.3, letterSpacing: "-0.015em", color: INK }}>
              {p.words.map((w, i) => {
                const lit = k(now * fps, w.start * fps, w.start * fps + 3);
                return (
                  <span key={i} style={{ opacity: mix(0.28, 1, lit) }}>
                    {w.w}
                    {i < p.words!.length - 1 ? " " : ""}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Sfx at={startAt} name="switch-tap" volume={0.25} on={p.sound ?? true} />
    </AbsoluteFill>
  );
};
