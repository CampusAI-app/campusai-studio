/**
 * /receipt (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). Something itemised as a till receipt: the paper feeds out of a slot at the top a line at a time with a small
 * jolt per line, the camera riding down with it, dotted leaders run to each amount, the totals print bold, and one red
 * stamp lands across the bottom. Receipts are usually set in a monospace face; this one is Inter with tabular figures,
 * so the columns still line up. The paper is the brand's warm ink, the print its near-black.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, readHold } from "../system/motion";
import { B, Clip, Cue, INTER, PAPER, PRINT, RED, Title, ZODIAK, clamp, ramp } from "./common";

export type ReceiptProps = {
  title: string;
  /** The receipt's own header lines, small and centred. */
  header: string[];
  /** Each item: its name, the lines under it, and its amount. */
  items: { label: string; lines?: string[]; amount: string }[];
  totals: { label: string; value: string }[];
  /** The stamp, a word or two, sentence case. */
  stamp: string;
  source: string;
  cta?: string;
};

const LINE = 6; // motion: frames per printed line, a quick thermal printer
const START = 18;
const FPS = 30;
const LH = 70;

type Row = { kind: "head" | "item" | "sub" | "rule" | "total" | "blank"; text: string; amount?: string };
const rowsOf = (p: ReceiptProps): Row[] => [
  ...p.header.map((t) => ({ kind: "head" as const, text: t })),
  { kind: "rule", text: "" },
  ...p.items.flatMap((it) => [{ kind: "item" as const, text: it.label, amount: it.amount }, ...(it.lines ?? []).map((l) => ({ kind: "sub" as const, text: l }))]),
  { kind: "rule", text: "" },
  ...p.totals.map((t) => ({ kind: "total" as const, text: t.label, amount: t.value })),
  // room at the foot for the stamp, so it never sits on a figure
  { kind: "blank", text: "" },
  { kind: "blank", text: "" },
];

export const receiptPlan = (p: ReceiptProps) => {
  const rows = rowsOf(p);
  const printed = START + rows.length * LINE;
  const stampAt = printed + 10;
  const end = stampAt + Math.round((readHold(`${p.stamp} ${p.totals.map((t) => `${t.label} ${t.value}`).join(" ")}`) + 0.4) * FPS);
  return { rows, printed, stampAt, end };
};
export const receiptEnd = (p: ReceiptProps) => receiptPlan(p).end;

export const Receipt: React.FC<ReceiptProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { rows, stampAt, end } = receiptPlan(p);
  const W = Math.min(940, width - 140);
  const left = (width - W) / 2;
  const slotY = height * 0.8;
  // the paper rises out of the slot, a small jolt as each line prints; the newest line sits just above the slot
  const fed = interpolate(f, [0, START, START + (rows.length - 2) * LINE], [1.2, 2, rows.length], clamp); // the header is already out on frame one
  const line = Math.floor(fed);
  const jolt = line < rows.length ? Math.sin((fed - line) * Math.PI) * 5 : 0;
  const fullH = 110 + rows.length * LH;
  const room = slotY - 300; // below the title
  const fit = Math.min(1, room / fullH); // a long receipt is drawn smaller rather than leaving the frame
  const paperH = (50 + fed * LH) * fit + jolt;
  const stampK = spring({ frame: f - stampAt, fps, config: { damping: 11, stiffness: 160 } });
  const teeth = Math.round(W / 26);
  return (
    <Clip endAt={end} cta={p.cta}>
      <Title out={end}>{p.title}</Title>
      <div style={{ position: "absolute", left, width: W, top: slotY - paperH, height: paperH, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, width: W, top: 0, height: fullH * fit + 20, background: PAPER, color: PRINT }}>
          <svg width={W} height={14} style={{ position: "absolute", top: -1, left: 0 }}>
            <path d={`M0,0 ${[...Array(teeth)].map((_, i) => `L${((i + 0.5) * W) / teeth},12 L${((i + 1) * W) / teeth},0`).join(" ")} Z`} fill={B.color.bgDeep} />
          </svg>
          <div style={{ position: "absolute", left: 0, top: 30, width: W / fit, padding: "0 52px", boxSizing: "border-box", transform: `scale(${fit})`, transformOrigin: "0 0" }}>
            {rows.map((r, i) => {
              const key = `r${i}`;
              if (r.kind === "blank") return <div key={key} style={{ height: LH }} />;
              if (r.kind === "rule") return <div key={key} style={{ height: LH, display: "flex", alignItems: "center" }}><div style={{ flex: 1, borderTop: `3px dashed ${PRINT}`, opacity: 0.5 }} /></div>;
              if (r.kind === "head") return <div key={key} style={{ height: LH, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: i === 0 ? ZODIAK : INTER, fontWeight: i === 0 ? 700 : 500, fontSize: i === 0 ? 54 : 34 }}>{r.text}</div>;
              const big = r.kind === "total";
              return (
                <div key={key} style={{ height: LH, display: "flex", alignItems: "baseline", gap: 12, fontFamily: INTER, fontVariantNumeric: "tabular-nums",
                  fontSize: big ? 48 : r.kind === "sub" ? 36 : 44, fontWeight: big ? 700 : r.kind === "sub" ? 400 : 600, paddingLeft: r.kind === "sub" ? 28 : 0, opacity: r.kind === "sub" ? 0.75 : 1 }}>
                  <span>{r.text}</span>
                  {r.amount ? <><span style={{ flex: 1, borderBottom: `3px dotted ${PRINT}`, opacity: 0.35, transform: "translateY(-8px)" }} /><span>{r.amount}</span></> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* the slot the paper comes out of */}
      <div style={{ position: "absolute", left: left - 50, width: W + 100, top: slotY - 4, height: 30, borderRadius: 15, background: B.color.surface,
        boxShadow: "inset 0 8px 14px rgba(0,0,0,.85), 0 1px 0 rgba(247,239,230,.08)" }} />
      {/* the stamp, across the totals */}
      <div style={{ position: "absolute", left, width: W, top: slotY - LH * fit * 2.1 - 40, display: "flex", justifyContent: "center",
        opacity: f < stampAt ? 0 : Math.min(1, stampK * 1.5), transform: `rotate(-8deg) scale(${(1.6 - 0.6 * Math.min(1, stampK)).toFixed(3)})` }}>
        <div style={{ border: `7px solid ${RED}`, borderRadius: 14, padding: "4px 30px 10px", fontFamily: ZODIAK, fontWeight: 700, fontSize: 76, color: RED, letterSpacing: "-0.02em",
          background: "rgba(247,239,230,.35)" }}>{p.stamp}</div>
      </div>
      <div style={{ position: "absolute", left: 64, right: 64, top: slotY + 56, fontFamily: INTER, fontSize: 34, color: B.color.ink, opacity: ramp(f, stampAt + 6, stampAt + 18, CURVE.quiet.enter) }}>{p.source}</div>
      {rows.map((_, i) => <Cue key={i} at={START + i * LINE} name="typewriter-hit-soft" volume={0.22} />)}
      <Cue at={stampAt} name="bass-hit-short" volume={0.6} />
    </Clip>
  );
};
