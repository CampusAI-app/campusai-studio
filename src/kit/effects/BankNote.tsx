/**
 * Bank note (2026-11-15, effect 15 of Skill Stack Store's "20 Claude Effects in 20 Secs" reel, 18.5 to 19.6 s, stepped
 * frame by frame; facts in films/effects-skillstack/facts.md). What the reel does: the frame becomes a green engraved
 * banknote, his portrait sits in the centre oval as green line engraving (live footage), and a cream label at the
 * bottom counts a serif number up (174 to 174,953). About 1.1 s.
 *
 * Ours is a vertical note (like the Swiss ones), all drawn: guilloche bands on every edge, rosette medallions at the
 * corners carrying the denomination, a guilloche ring round the oval, fine wavy security lines across the paper, and
 * the speaker's cutout engraved live through InkScreen (horizontal lines with a hand wobble, a light line tone behind
 * him, as engraved portraits have). The note lands from 106% in 6 frames with a paper flash; the guilloche keeps
 * turning slowly so the held frame is alive; the label counts `countFrom` to `value` with an ease-out landing on
 * `countEnd` (put that on the spoken number). Cormorant Garamond for the lettering, lining tabular figures for the count.
 *
 *   <BankNote clip="x/clip.mp4" person="x/person.webm" at={27} outAt={80} countEnd={63} value={1000}
 *     unit="downloads" title="In just one week" portrait={{ x: 495, y: 1190, zoom: 1.45 }} />
 */
import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { OUT, Sfx, k, mix } from "./shared";
import { Framing, InkScreen, framedStyle } from "./InkScreen";

const { fontFamily: CORMORANT } = loadCormorant("normal", { weights: ["600", "700"], subsets: ["latin"] });
loadCormorant("italic", { weights: ["600"], subsets: ["latin"] });

export type BankNoteProps = {
  clip: string;
  person: string;
  startFrom?: number;
  /** Framing of the footage before and after. */
  frame?: Framing;
  /** The clip pixel at the oval's centre, and the clip's scale inside it. */
  portrait: { x: number; y: number; zoom: number };
  /** Hard cut to the note, and back. */
  at: number;
  outAt: number;
  /** The number the label lands on, where it starts, and the frame it lands. */
  value: number;
  countFrom?: number;
  countEnd: number;
  /** The line under the number. */
  unit: string;
  /** The lettering across the top. */
  title: string;
  /** The corner denomination (defaults to the value). */
  corner?: string;
  ink?: string;
  paper?: string;
  sound?: boolean;
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** Closed guilloche strands round an ellipse: each strand a wave of `waves` periods, phase-shifted from the last. */
const ringPaths = (cx: number, cy: number, rx: number, ry: number, amp: number, waves: number, strands: number, phase: number) => {
  const out: string[] = [];
  const steps = 360;
  for (let j = 0; j < strands; j++) {
    const ph = phase + (j * Math.PI * 2) / strands / waves;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const w = amp * Math.sin(waves * t + ph * waves);
      const x = cx + (rx + w) * Math.cos(t);
      const y = cy + (ry + w) * Math.sin(t);
      d += `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    out.push(d + "Z");
  }
  return out;
};

/** Straight guilloche: interleaved sine strands between two points (a band `amp` thick). */
const bandPaths = (x0: number, y0: number, x1: number, y1: number, amp: number, period: number, strands: number, phase: number) => {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const ux = (x1 - x0) / len;
  const uy = (y1 - y0) / len;
  const out: string[] = [];
  for (let j = 0; j < strands; j++) {
    let d = "";
    const ph = phase + (j * Math.PI * 2) / strands;
    for (let s = 0; s <= len; s += 4) {
      const w = amp * Math.sin((s / period) * Math.PI * 2 + ph);
      d += `${s ? "L" : "M"} ${(x0 + ux * s - uy * w).toFixed(1)} ${(y0 + uy * s + ux * w).toFixed(1)} `;
    }
    out.push(d);
  }
  return out;
};

export const BankNote: React.FC<BankNoteProps> = (p) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const ink = p.ink ?? "#1E4A33";
  const paper = p.paper ?? "#DDE4CB";
  const on = f >= p.at && f < p.outAt;
  const sound = p.sound ?? true;
  const audio = <Audio src={staticFile(p.clip)} trimBefore={p.startFrom || undefined} />;
  const sfx = (
    <>
      <Sfx at={p.at} name="paper-slide" volume={0.5} on={sound} />
      <Sfx at={p.at + 3} name="counter" volume={0.4} on={sound} />
      <Sfx at={p.countEnd} name="chime-crystal" volume={0.25} on={sound} />
    </>
  );
  if (!on) {
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        {audio}
        <div style={framedStyle(W, H, p.frame)}>
          <OffthreadVideo src={staticFile(p.clip)} startFrom={p.startFrom ?? 0} muted style={{ width: W, height: H }} />
        </div>
        {sfx}
      </AbsoluteFill>
    );
  }

  const t = f - p.at;
  const land = k(t, 0, 6, OUT);
  const turn = t * 0.012; // motion: the guilloche drifts about 20 degrees of phase a second, alive but never busy
  // motion: a gentle ease-out, so the digits are seen climbing most of the way and only settle at the end
  const count = mix(p.countFrom ?? 0, p.value, k(f, p.at + 3, p.countEnd, Easing.bezier(0.33, 0.2, 0.25, 1)));
  const corner = p.corner ?? fmt(p.value);

  const B0 = 34; // outer border
  const B1 = 112; // inner border
  const oval = { cx: W / 2, cy: 840, rx: 300, ry: 392 };
  const label = { w: 760, h: 270, y: 1335 };

  const strokes = (ds: string[], width: number, opacity: number) => ds.map((d, i) => <path key={i} d={d} fill="none" stroke={ink} strokeWidth={width} opacity={opacity} />);
  const security: string[] = [];
  for (let y = 0; y < H; y += 11) {
    let d = "";
    for (let x = 0; x <= W; x += 12) d += `${x ? "L" : "M"} ${x} ${(y + 3.2 * Math.sin(x * 0.021 + y * 0.05)).toFixed(1)} `;
    security.push(d);
  }
  const corners = [
    { x: B1 - 6, y: B1 - 6 },
    { x: W - B1 + 6, y: B1 - 6 },
    { x: B1 - 6, y: H - B1 + 6 },
    { x: W - B1 + 6, y: H - B1 + 6 },
  ];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {audio}
      <AbsoluteFill style={{ background: paper, color: ink, fontFamily: CORMORANT, transform: `scale(${mix(1.06, 1, land).toFixed(4)})` }}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(250,252,240,0.75), rgba(250,252,240,0) 75%)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {strokes(security, 1, 0.13)}
          {/* edge bands */}
          <rect x={B0} y={B0} width={W - B0 * 2} height={H - B0 * 2} fill="none" stroke={ink} strokeWidth={3} />
          <rect x={B1} y={B1} width={W - B1 * 2} height={H - B1 * 2} fill="none" stroke={ink} strokeWidth={1.6} />
          {strokes(bandPaths(B0, (B0 + B1) / 2, W - B0, (B0 + B1) / 2, 24, 58, 5, turn * 6), 1.1, 0.75)}
          {strokes(bandPaths(B0, H - (B0 + B1) / 2, W - B0, H - (B0 + B1) / 2, 24, 58, 5, -turn * 6), 1.1, 0.75)}
          {strokes(bandPaths((B0 + B1) / 2, B0, (B0 + B1) / 2, H - B0, 24, 58, 5, turn * 6), 1.1, 0.75)}
          {strokes(bandPaths(W - (B0 + B1) / 2, B0, W - (B0 + B1) / 2, H - B0, 24, 58, 5, -turn * 6), 1.1, 0.75)}
          {/* the oval's ring */}
          <ellipse cx={oval.cx} cy={oval.cy} rx={oval.rx + 54} ry={oval.ry + 54} fill={paper} stroke={ink} strokeWidth={1.4} />
          {strokes(ringPaths(oval.cx, oval.cy, oval.rx + 28, oval.ry + 28, 16, 44, 6, turn), 1.1, 0.85)}
          <ellipse cx={oval.cx} cy={oval.cy} rx={oval.rx + 2} ry={oval.ry + 2} fill="#EEF1E0" stroke={ink} strokeWidth={2.4} />
          {/* side medallions */}
          {[oval.cx - oval.rx - 120, oval.cx + oval.rx + 120].map((x, i) => (
            <g key={i}>{strokes(ringPaths(x, oval.cy, 46, 46, 9, 18, 7, -turn * 2), 1, 0.8)}</g>
          ))}
          {/* corner rosettes */}
          {corners.map((c, i) => (
            <g key={i}>
              <circle cx={c.x} cy={c.y} r={82} fill={paper} stroke={ink} strokeWidth={1.6} />
              {strokes(ringPaths(c.x, c.y, 64, 64, 12, 24, 6, turn * (i % 2 ? -2 : 2)), 1, 0.8)}
              <circle cx={c.x} cy={c.y} r={48} fill={paper} stroke={ink} strokeWidth={1.2} />
            </g>
          ))}
          {/* the strip under the label */}
          {strokes(bandPaths(B1 + 20, 1700, W - B1 - 20, 1700, 30, 90, 7, turn * 4), 1.1, 0.7)}
        </svg>
        {corners.map((c, i) => (
          <div key={i} style={{ position: "absolute", left: c.x - 60, top: c.y - 30, width: 120, height: 60, display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: corner.length > 4 ? 30 : 38, fontVariantNumeric: "lining-nums tabular-nums" }}>{corner}</div>
        ))}
        {/* the title */}
        <div style={{ position: "absolute", left: 0, width: W, top: 150, textAlign: "center", fontStyle: "italic", fontWeight: 600, fontSize: 84, letterSpacing: "-0.005em", lineHeight: 1 }}>
          {p.title}
        </div>
        <div style={{ position: "absolute", left: W / 2 - 220, width: 440, top: 262, height: 2, background: ink, opacity: 0.8 }} />
        {/* the engraved portrait, live */}
        <div style={{ position: "absolute", left: oval.cx - oval.rx, top: oval.cy - oval.ry, width: oval.rx * 2, height: oval.ry * 2, clipPath: "ellipse(50% 50% at 50% 50%)" }}>
          <InkScreen id="note-engrave" src={p.person} transparent paper={0.76} startFrom={p.startFrom} width={oval.rx * 2} height={oval.ry * 2}
            place={p.portrait} pattern="lines" cell={8} angle={-6} wave={9} ink={ink} contrast={1.3} brightness={1.04} edge={10} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: `inset 0 0 60px rgba(30,74,51,0.25)` }} />
        </div>
        {/* the counting label */}
        <div style={{ position: "absolute", left: (W - label.w) / 2, top: label.y, width: label.w, height: label.h, background: "#F4EEDC", borderRadius: 20,
          border: `3px solid ${ink}`, boxShadow: `inset 0 0 0 9px #F4EEDC, inset 0 0 0 10.5px ${ink}, 0 10px 30px rgba(20,50,30,0.18)`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 176, lineHeight: 0.92, letterSpacing: "-0.01em", fontVariantNumeric: "lining-nums tabular-nums" }}>{fmt(count)}</div>
          <div style={{ fontStyle: "italic", fontWeight: 600, fontSize: 50, lineHeight: 1.1, marginTop: 4 }}>{p.unit}</div>
        </div>
      </AbsoluteFill>
      {/* the paper flash as the note lands */}
      <AbsoluteFill style={{ background: "#F6F8EC", opacity: 0.7 * (1 - k(t, 0, 4)) }} />
      {sfx}
    </AbsoluteFill>
  );
};
