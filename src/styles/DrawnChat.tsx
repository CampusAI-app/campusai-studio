/**
 * The chat, DRAWN, for a box inside a vertical style (2026-11-04, /pov-doodle). Jacob: make the typing and the answer
 * move "like the video attached" (`ChatVideo`, the ask anything film) "but the same visuals our chat uses".
 *
 * So the motion is ChatVideo's, beat for beat: the composer settles in under the logo, the placeholder fades, the
 * question types at 45 ms a character and the send button presses; the question becomes the user bubble and the
 * thinking rows land 800 ms apart (sparkle while live, green check when done) with the camera close on the live row,
 * then gather; the answer arrives as one bubble, the lead line rising, then each block mounting, the first one
 * streaming word by word, while the type eases from close to wide. The visuals are the product's: ChatVideo's `UI`
 * tokens and page gradient, and the answer laid out the way the real chat renders this answer (gold-underlined course
 * code, red gen ed chips, "Double counts for:" and "Why it fits:" lines), copied from the recorded demo answer.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE, PRODUCT_BG, UI } from "../ChatVideo";

export type ChatBlock = {
  code: string;
  title: string;
  gpa: string;
  counts: [string, string][]; // [code, name]
  why: string;
};
/** Only the typing: the composer beat, before a recording of the real chat takes over at the send (round 11). */
export type DrawnAskSpec = { kind: "ask"; question: string; /** ms per letter (default CHAR_MS); episode 3 types a 101-letter question */ charMs?: number };
export type DrawnChatSpec = {
  kind: "chat";
  question: string;
  steps: string[];
  /** The lead line; any four-capital-letter gen ed code in it is drawn as a chip, as the real chat does. */
  lead: string;
  blocks: ChatBlock[];
};

const CHAR_MS = 45;
const TYPE_START = 900;
const STEP_MS = 800;
const WORD_MS = 48;
const CUT = 300; // the soft cut between composer, trace and answer

const askMs = (s: { question: string; charMs?: number }) => TYPE_START + s.question.length * (s.charMs ?? CHAR_MS) + 700;
export const askFrames = (s: DrawnAskSpec, fps = 30) => Math.round((askMs(s) / 1000) * fps);
const gatherAt = (s: DrawnChatSpec) => (s.steps.length - 1) * STEP_MS + 550;
const thinkMs = (s: DrawnChatSpec) => gatherAt(s) + 550;
const streamStart = 1150;
const streamDone = (s: DrawnChatSpec) => streamStart + s.blocks[0].why.split(" ").length * WORD_MS;
const blockAt = (s: DrawnChatSpec, i: number) => (i === 0 ? 650 : streamDone(s) + 250 + (i - 1) * 520);
const answerMs = (s: DrawnChatSpec) => blockAt(s, s.blocks.length - 1) + 1800;
/** The whole chat in film frames. */
export const chatFrames = (s: DrawnChatSpec, fps = 30) => Math.round(((askMs(s) + thinkMs(s) + answerMs(s)) / 1000) * fps);
/** When the answer is all on screen, in film frames (he grins here). */
export const chatLanded = (s: DrawnChatSpec, fps = 30) => Math.round(((askMs(s) + thinkMs(s) + blockAt(s, s.blocks.length - 1) + 500) / 1000) * fps);

const ramp = (ms: number, a: number, b: number, e = EASE.outExpo) =>
  interpolate(ms, [a, b], [0, 1], { easing: e, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Composer: React.FC<{ s: { question: string; charMs?: number }; ms: number; w: number }> = ({ s, ms, w }) => {
  const settle = ramp(ms, 0, 620);
  const phIn = ramp(ms, 300, 800);
  const phOut = 1 - ramp(ms, TYPE_START - 180, TYPE_START + 60, EASE.inOut);
  const chars = Math.max(0, Math.min(s.question.length, Math.floor((ms - TYPE_START) / (s.charMs ?? CHAR_MS))));
  const done = chars >= s.question.length;
  const doneAt = TYPE_START + s.question.length * CHAR_MS;
  const press = done ? interpolate(ms, [doneAt + 180, doneAt + 300, doneAt + 480], [1, 0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const caretOn = !done && Math.floor(ms / 520) % 2 === 0;
  const barW = w - 70;
  // The CURRENT chat box (round 12, Jacob: the first drawing was the old box). Matched to a crop of the demo's
  // composer from the round 3 recording: a rounded bar with a thin red border and soft red halo, a brighter red
  // highlight along its bottom right edge, the text in an inner rounded field with a faint red focus ring, grey
  // paperclip and mic, and a rounded-square send button on the primary-to-hover red gradient with a white plane.
  const icon = "rgba(255,255,255,0.42)";
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 46 }}>
      <Img src={staticFile("brand/campusai-logo-white.svg")} style={{ width: 300, opacity: settle, filter: `blur(${(1 - settle) * 8}px)`, transform: `translateY(${(1 - settle) * 14}px)` }} />
      <div style={{ position: "relative", width: barW, display: "flex", alignItems: "center", gap: 16, padding: "14px 14px 14px 22px", borderRadius: 34,
        background: "rgba(26,16,19,0.92)", border: "2px solid rgba(200,16,46,0.42)", boxShadow: "0 0 0 6px rgba(200,16,46,0.07), 0 12px 40px rgba(0,0,0,0.35)",
        opacity: settle, transform: `scale(${0.965 + settle * 0.035}) translateY(${(1 - settle) * 20}px)` }}>
        <div style={{ position: "absolute", left: "52%", right: 34, bottom: -2, height: 3, borderRadius: 3,
          background: "linear-gradient(90deg, transparent, #E21833 55%, transparent)" }} />
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L10 17.9a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" stroke={icon} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ position: "relative", flex: 1, padding: "16px 18px", borderRadius: 20, background: "rgba(255,255,255,0.025)",
          border: "2px solid rgba(200,16,46,0.16)", fontFamily: "Inter, system-ui, sans-serif", fontSize: 34, lineHeight: 1.3, minHeight: 80 }}>
          <span style={{ position: "absolute", left: 18, top: 16, color: icon, opacity: phIn * phOut, whiteSpace: "nowrap" }}>Ask CampusAI anything...</span>
          <span style={{ color: "#F2F1EF", fontWeight: 400 }}>
            {s.question.slice(0, chars)}
            <span style={{ opacity: caretOn ? 1 : 0, color: "#E8323F" }}>|</span>
          </span>
        </div>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, margin: "0 4px" }}>
          <rect x="9" y="3" width="6" height="11" rx="3" stroke={icon} strokeWidth="1.8" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={icon} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <div style={{ flexShrink: 0, width: 88, height: 88, borderRadius: 24, background: "linear-gradient(135deg, #E0243C, #EE4A62)", display: "flex",
          alignItems: "center", justifyContent: "center", transform: `scale(${press})`, boxShadow: done ? "0 0 30px rgba(226,24,51,0.45)" : "0 1px 2px rgba(0,0,0,0.3)" }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none"><path d="M21.5 2.5 10.5 13.5M21.5 2.5l-7 19-4-8-8-4 19-7Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ROW_H = 62, ROW_GAP = 22, BUBBLE_H = 96, BUBBLE_GAP = 46, ROW_CLOSE = 1.3, LEAD = 420;

const Trace: React.FC<{ s: DrawnChatSpec; ms: number; w: number }> = ({ s, ms, w }) => {
  const n = s.steps.length;
  const at = (i: number) => i * STEP_MS;
  const rowCentre = (i: number) => BUBBLE_H + BUBBLE_GAP + i * (ROW_H + ROW_GAP) + ROW_H / 2;
  const threadH = BUBBLE_H + BUBBLE_GAP + n * ROW_H + (n - 1) * ROW_GAP;
  let camRow = 0;
  for (let i = 1; i < n; i++) if (ms >= at(i) - LEAD) camRow = i;
  const move = ramp(ms, at(camRow) - LEAD, at(camRow));
  const prev = Math.max(0, camRow - 1);
  const focus = camRow === 0 ? 0 : prev + (camRow - prev) * move;
  const gather = ramp(ms, gatherAt(s), gatherAt(s) + 550);
  const lo = Math.floor(focus), hi = Math.ceil(focus);
  const closeY = threadH / 2 - (rowCentre(lo) + (rowCentre(hi) - rowCentre(lo)) * (focus % 1));
  const settle = ramp(ms, 0, 380);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: w / ROW_CLOSE - 20, transformOrigin: "50% 50%", transform: `scale(${ROW_CLOSE + (1 - ROW_CLOSE) * gather}) translateY(${closeY * (1 - gather)}px)` }}>
        <div style={{ height: BUBBLE_H, marginBottom: BUBBLE_GAP, display: "flex", justifyContent: "flex-end", opacity: settle * (1 - gather * 0.35) }}>
          <div style={{ padding: "18px 28px", borderRadius: UI.radius, borderTopRightRadius: 10, background: UI.redDim, border: `1px solid ${UI.redEdge}`,
            fontFamily: "Inter, system-ui, sans-serif", fontSize: 28, fontWeight: 450, color: UI.ink, alignSelf: "center" }}>
            {s.question}
          </div>
        </div>
        {s.steps.map((label, i) => {
          const inP = ramp(ms, at(i), at(i) + 280);
          const done = i < n - 1 ? ms >= at(i + 1) : ms >= gatherAt(s);
          const spin = (ms / 700) * 360;
          return (
            <div key={label} style={{ height: ROW_H, marginBottom: i < n - 1 ? ROW_GAP : 0, display: "flex", alignItems: "center", gap: 18,
              opacity: inP * (1 - gather), transform: `translateY(${(1 - inP) * 10 + gather * (i - n + 1) * 18}px)` }}>
              <span style={{ width: 40, height: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {done ? (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke={UI.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" style={{ transform: `scale(${0.9 + 0.1 * Math.sin((spin * Math.PI) / 180)})` }}>
                    <path d="M12 2.6c.35 3.9 2.9 6.45 6.8 6.8v1.2c-3.9.35-6.45 2.9-6.8 6.8h-1.2c-.35-3.9-2.9-6.45-6.8-6.8V9.4c3.9-.35 6.45-2.9 6.8-6.8Z" fill={UI.red} />
                  </svg>
                )}
              </span>
              <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 34, fontWeight: done ? 400 : 500, color: done ? UI.mute : UI.ink, whiteSpace: "nowrap" }}>{label}…</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** A gen ed code as the real chat draws it: a small red chip. */
const Chip: React.FC<{ code: string; size: number }> = ({ code, size }) => (
  <span style={{ display: "inline-block", padding: `${size * 0.08}px ${size * 0.3}px`, margin: `0 ${size * 0.2}px`, borderRadius: size * 0.25, background: UI.redDim,
    color: UI.link, fontSize: size * 0.78, fontWeight: 600, letterSpacing: "0.02em", verticalAlign: "0.08em" }}>{code}</span>
);

const CAM_CLOSE = 1.22;
const CAM_WIDE = 1.12; // wide enough for all three blocks, close enough to read on a phone

const Answer: React.FC<{ s: DrawnChatSpec; ms: number; w: number }> = ({ s, ms, w }) => {
  const done0 = streamDone(s);
  const k = CAM_CLOSE + (CAM_WIDE - CAM_CLOSE) * ramp(ms, done0 + 150, done0 + 1550);
  const z = (v: number) => v * k;
  const words = s.blocks[0].why.split(" ");
  const shown = Math.max(0, Math.min(words.length, Math.floor((ms - streamStart) / WORD_MS)));
  const leadP = ramp(ms, 0, 864);
  const body = { fontSize: z(25), lineHeight: 1.45, color: UI.ink } as const;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start" }}>
      <div style={{ marginTop: 40, width: Math.min(w - 40, z(w - 90)), padding: z(30), borderRadius: z(UI.radius), borderTopLeftRadius: z(10), background: UI.cardGlass,
        border: `1px solid ${UI.rule}`, boxShadow: UI.shadow, fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ ...body, fontSize: z(26), marginBottom: z(22), opacity: leadP, transform: `translateY(${(1 - leadP) * 12}px)` }}>
          {s.lead.split(/\b([A-Z]{4})\b/).map((part, i) => (i % 2 ? <Chip key={i} code={part} size={z(26)} /> : <React.Fragment key={i}>{part}</React.Fragment>))}
        </div>
        {s.blocks.map((b, i) => {
          if (ms < blockAt(s, i)) return null;
          const p = ramp(ms, blockAt(s, i), blockAt(s, i) + 520);
          const streaming = i === 0;
          return (
            <div key={b.code} style={{ marginBottom: i < s.blocks.length - 1 ? z(22) : 0, opacity: p, transform: `translateY(${(1 - p) * 10}px)` }}>
              <div style={{ ...body, fontSize: z(27), marginBottom: z(8) }}>
                <span style={{ fontWeight: 650, textDecoration: "underline", textDecorationColor: "#E4A72B", textDecorationThickness: z(3), textUnderlineOffset: z(6) }}>{b.code}</span>
                <span style={{ color: UI.mute }}> - </span>
                {b.title} <span style={{ color: UI.mute }}>(Average GPA: </span><span style={{ fontWeight: 650 }}>{b.gpa}</span><span style={{ color: UI.mute }}>)</span>
              </div>
              <div style={{ ...body, paddingLeft: z(26), marginBottom: z(4) }}>
                <span style={{ fontWeight: 650 }}>Double counts for:</span>
                {b.counts.map(([c, name], j) => (
                  <React.Fragment key={c}>{j > 0 ? " &" : ""}<Chip code={c} size={z(25)} />({name})</React.Fragment>
                ))}
              </div>
              <div style={{ ...body, paddingLeft: z(26) }}>
                <span style={{ fontWeight: 650 }}>Why it fits: </span>
                {streaming ? (
                  <>
                    {words.slice(0, shown).join(" ")}
                    <span style={{ color: UI.red, opacity: ms >= streamStart && ms < done0 + 260 ? 1 : 0 }}>{shown > 0 ? " " : ""}|</span>
                  </>
                ) : b.why}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Plays the three beats in a box `w` wide, from its own frame 0. */
export const DrawnChat: React.FC<{ s: DrawnChatSpec; from: number; w: number }> = ({ s, from, w }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = ((f - from) / fps) * 1000;
  const a = askMs(s), t = thinkMs(s);
  // the soft cut: each beat fades in over CUT ms as the one before fades out
  const fadeIn = (start: number) => ramp(ms, start - CUT / 2, start + CUT / 2, EASE.inOut);
  const askOp = 1 - fadeIn(a), thinkOp = fadeIn(a) * (1 - fadeIn(a + t)), answerOp = fadeIn(a + t);
  return (
    <AbsoluteFill style={{ background: PRODUCT_BG }}>
      {askOp > 0 ? <AbsoluteFill style={{ opacity: askOp }}><Composer s={s} ms={ms} w={w} /></AbsoluteFill> : null}
      {thinkOp > 0 ? <AbsoluteFill style={{ opacity: thinkOp }}><Trace s={s} ms={ms - a} w={w} /></AbsoluteFill> : null}
      {answerOp > 0 ? <AbsoluteFill style={{ opacity: answerOp }}><Answer s={s} ms={ms - a - t} w={w} /></AbsoluteFill> : null}
    </AbsoluteFill>
  );
};

/** The typing alone, from its own frame 0. */
export const DrawnAsk: React.FC<{ s: DrawnAskSpec; from: number; w: number }> = ({ s, from, w }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: PRODUCT_BG }}>
      <Composer s={s} ms={((f - from) / fps) * 1000} w={w} />
    </AbsoluteFill>
  );
};
