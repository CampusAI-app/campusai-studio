/**
 * Checklist (2026-11-10, the format of @mrcreates.ai's "17 effects" reel, stepped frame by frame; Jacob: the format that
 * kept people watching to the end). A numbered list sits at the top the whole time. The current item is boxed and
 * bold, the done ones get a tick, the rest wait in grey. Below it one card plays the item, with a counter in its corner
 * (02/04) and the item's name in a pill on its bottom edge. Every switch is a hard cut: the box snaps one row down and
 * widens over 3 frames, the tick lands on the row it left, the pill pops in from 60%, and the card's last 3 frames blur
 * out first. Measured in the reel: whole layout on screen from frame 0, 17 items in 19.5 s (about 1.15 s each, 0.95 to
 * 1.45 s). Ours holds each item for the studio reading rule instead (name length / 15 + 1.5 s, 1.8 s minimum).
 *
 * Its own world: blush grid paper (the reel's is white grid paper), Plus Jakarta Sans with a Newsreader italic word,
 * one red. Every card is a crop of a real capture, pushed in slowly; never a drawn screen.
 *
 *   <Checklist heading={{ count: "4", rest: "things in one place", italic: "inside" }} items={[...]} />
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import { B, Bed, Capture, Logo, Sfx, SWING, Shot, clampX, k, readFrames, shotHeight } from "./shared";

const { fontFamily: JAKARTA } = loadJakarta("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] });
const { fontFamily: NEWS } = loadNewsreader("italic", { weights: ["500"], subsets: ["latin"] });

const PAPER = "#F7E3DF";
const LINE = "rgba(150, 25, 35, 0.085)";
const INK = "#2A0B0E";
const RED = B.color.accent;

export type ChecklistItem = {
  /** The pill and the list row. */
  name: string;
  shot: Capture;
  /** Push-in on the card while the item plays: how far, and toward which point of the crop (0 to 1). */
  zoom?: number;
  focus?: { x: number; y: number };
};

export type ChecklistProps = {
  heading: { count: string; rest: string; italic?: string };
  items: ChecklistItem[];
  /** Frames per item; default is the reading rule on each name. */
  perItem?: number;
  sound?: boolean;
};

const END = 48; // logo hold after the last tick: 1.6 s
const BLUR_OUT = 3; // the reel blurs the card out over 3 frames before a cut

export const checklistTimes = (p: ChecklistProps) => {
  const lens = p.items.map((it) => p.perItem ?? readFrames(it.name));
  const starts: number[] = [];
  lens.reduce((acc, l) => (starts.push(acc), acc + l), 0);
  const end = starts[starts.length - 1] + lens[lens.length - 1];
  return { starts, lens, end, total: end + END };
};

const pad = (n: number) => String(n).padStart(2, "0");

const Tick: React.FC<{ at: number; size: number }> = ({ at, size }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const s = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 220 } });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `scale(${s.toFixed(3)})`, marginLeft: 14, flex: "none" }}>
      <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={RED} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={26} strokeDashoffset={26 * (1 - Math.min(1, s))} />
    </svg>
  );
};

export const Checklist: React.FC<ChecklistProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { starts, lens, end, total } = checklistTimes(p);
  const n = p.items.length;
  const sound = p.sound ?? true;
  const cur = f >= end ? n : Math.max(0, starts.findIndex((s, i) => f >= s && f < s + lens[i]));

  // layout, 1080 x 1920; the block is centred inside the Reels safe area
  const twoCols = n > 6;
  const perCol = twoCols ? Math.ceil(n / 2) : n;
  const rowH = twoCols ? 62 : 80;
  const listW = twoCols ? 960 : 700;
  const cardW = 1000;
  const cardH = Math.max(...p.items.map((it) => shotHeight(it.shot, cardW)));
  const top = Math.round((height - (230 + 50 + perCol * rowH + 70 + cardH + 150)) / 2) - 40;
  const listTop = top + 280;
  const cardTop = listTop + perCol * rowH + 70;
  const cardCx = width / 2;

  const item = p.items[Math.min(cur, n - 1)];
  const s0 = starts[Math.min(cur, n - 1)];
  const l0 = lens[Math.min(cur, n - 1)];
  const local = f - s0;
  const zoom = interpolate(local, [0, l0], [1, item.zoom ?? 1.14], { ...clampX, easing: SWING });
  const blurOut = cur < n ? interpolate(local, [l0 - BLUR_OUT, l0], [0, 12], clampX) : 0;
  // the ending: the card folds away and the logo takes its place
  const fold = k(f, end, end + 9);
  const pillPop = spring({ frame: local, fps, config: { damping: 11, stiffness: 260 } });
  const progress = interpolate(f, [s0, s0 + 8], [cur, cur + 1], clampX) / n;

  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: JAKARTA, color: INK, overflow: "hidden" }}>
      <Bed total={total} on={sound} />
      {starts.map((s, i) => <Sfx key={i} at={s} name="switch-tap" volume={0.45} on={sound && i > 0} />)}
      <Sfx at={end} name="chime-crystal" volume={0.5} on={sound} />
      {/* grid paper */}
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(${LINE} 2px, transparent 2px), linear-gradient(90deg, ${LINE} 2px, transparent 2px)`,
        backgroundSize: "54px 54px", backgroundPosition: "-2px -2px",
      }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 55% at 50% 48%, rgba(255,250,248,0.55), rgba(255,250,248,0) 70%)" }} />

      {/* heading: on screen from frame 0, the logo inside it */}
      <div style={{ position: "absolute", top, left: 0, width, textAlign: "center" }}>
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1 }}>
          <span style={{ color: RED }}>{p.heading.count}</span> {p.heading.rest}
        </div>
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
          {p.heading.italic ? <span style={{ fontFamily: NEWS, fontStyle: "italic", fontWeight: 500, fontSize: 80, lineHeight: 1 }}>{p.heading.italic}</span> : null}
          <Img src={staticFile(B.logo!.onLight)} style={{ height: 66, width: "auto", marginTop: 8 }} />
        </div>
      </div>

      {/* the list */}
      <div style={{ position: "absolute", left: (width - listW) / 2, top: listTop, width: listW, display: "grid",
        gridTemplateColumns: twoCols ? "1fr 1fr" : "1fr", gridAutoFlow: "column", gridTemplateRows: `repeat(${perCol}, ${rowH}px)`, columnGap: 30 }}>
        {p.items.map((it, i) => {
          const isCur = i === cur;
          const done = i < cur;
          const grow = isCur ? k(f, starts[i], starts[i] + 3) : 0;
          const leave = i === n - 1 ? 1 - k(f, end, end + 6) : 1;
          return (
            <div key={i} style={{ position: "relative", display: "flex", alignItems: "center", fontSize: twoCols ? 40 : 50 }}>
              {isCur || (i === n - 1 && f >= end) ? (
                <div style={{ position: "absolute", left: -18, top: 6, bottom: 6, width: `calc(${(88 + 12 * grow).toFixed(2)}% + 18px)`,
                  borderRadius: 12, border: `3px solid ${RED}`, background: "rgba(217, 32, 46, 0.09)", opacity: leave }} />
              ) : null}
              <span style={{ position: "relative", width: 84, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                color: isCur ? RED : INK, opacity: isCur ? 1 : done ? 0.45 : 0.22 }}>{pad(i + 1)}</span>
              <span style={{ position: "relative", fontWeight: isCur ? 800 : 600, letterSpacing: "-0.02em", opacity: isCur || done ? 1 : 0.3 }}>{it.name}</span>
              {done ? <Tick at={i + 1 < n ? starts[i + 1] : end} size={twoCols ? 32 : 40} /> : null}
            </div>
          );
        })}
      </div>

      {/* the card */}
      <div style={{ position: "absolute", left: cardCx - cardW / 2, top: cardTop, width: cardW, height: cardH,
        opacity: 1 - fold, transform: `scale(${(1 - 0.14 * fold).toFixed(4)})`, filter: `blur(${(fold * 14).toFixed(2)}px)` }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 30, boxShadow: "0 40px 90px rgba(90, 10, 18, 0.32), 0 6px 18px rgba(90, 10, 18, 0.18)" }} />
        <div style={{ position: "absolute", inset: 0, filter: blurOut > 0.05 ? `blur(${blurOut.toFixed(2)}px)` : undefined }}>
          <Shot shot={item.shot} width={cardW} radius={30} zoom={zoom} focus={item.focus} style={{ height: cardH }} />
        </div>
        {/* counter, inside the card's corner */}
        <div style={{ position: "absolute", left: 26, top: 24, padding: "8px 16px", borderRadius: 999, background: "rgba(42, 11, 14, 0.82)",
          color: "#FFF4F2", fontWeight: 700, fontSize: 28, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>
          {pad(Math.min(cur, n - 1) + 1)}/{pad(n)}
        </div>
        {/* the name, on the card's bottom edge */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: -34, display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "14px 34px", borderRadius: 999, background: RED, color: "#FFFFFF", fontWeight: 700, fontSize: 38,
            letterSpacing: "-0.015em", boxShadow: "0 12px 30px rgba(217, 32, 46, 0.35)",
            transform: `scale(${(0.6 + 0.4 * Math.min(1.08, pillPop)).toFixed(4)})` }}>
            {item.name}
          </div>
        </div>
      </div>

      {/* progress under the card */}
      <div style={{ position: "absolute", left: cardCx - 240, top: cardTop + cardH + 92, width: 480, height: 8, borderRadius: 8,
        background: "rgba(42, 11, 14, 0.1)", opacity: 1 - fold }}>
        <div style={{ width: `${(Math.min(1, progress) * 100).toFixed(2)}%`, height: "100%", borderRadius: 8, background: RED }} />
      </div>

      {/* the ending: the logo lands where the card was */}
      <Logo at={end + 5} x={cardCx} y={cardTop + cardH / 2 - 20} width={560} light spring />
      {f >= end + 14 ? (
        <div style={{ position: "absolute", left: 0, width, top: cardTop + cardH / 2 + 90, textAlign: "center", fontSize: 44, fontWeight: 600,
          letterSpacing: "-0.02em", opacity: k(f, end + 14, end + 24) }}>campusai.app</div>
      ) : null}
    </AbsoluteFill>
  );
};
