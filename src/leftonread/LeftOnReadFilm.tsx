/**
 * "Left on read" (2026-10-21). A campus street interview with a story told over it in one chat.
 *
 * She answers "What's the hardest part about recruiting for a job?" and the graphics follow her
 * words: her follow-up is read and ignored, the read receipt ages two months, the reply finally
 * lands as a notification, it is the thank-you template, and a ghost leaves her on "steals my soul".
 * No CampusAI product on screen (no employer tracker yet, Jacob's call). The original end card
 * from 14.4s is kept as cut, because it already animates.
 *
 * Everything sits in the band between the burned-in question (ends y 430) and the tops of their
 * heads (y 690), or above the question for the notification, so nothing covers a face or a caption.
 */
import React from "react";
import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { AppNotice, INTER, pop, ramp } from "../kit/parts";
import { EASE_CAMERA } from "../lib/anim";

export const LEFT_ON_READ_FPS = 30;
export const LEFT_ON_READ_FRAMES = 558;
export const LEFT_ON_READ_SIZE = { width: 1080, height: 1920 };

const RED = "#D9202E";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const sfx = (f: string) => staticFile(`leftonread/sfx/${f}`);

/* Beats, in frames, from her words (caption timing read off the source at 5 fps). */
const T = {
  sent: 164, // "like left on read" 5.6s
  read: 177,
  dots: 186,
  dotsOut: 210,
  peek: 214,
  ages: [228, 243, 258], // "like two or three months" 7.6s
  notice: 282, // "and when I finally" 9.4s
  noticeOut: 332,
  threadOut: 322,
  reply: 326, // "it's like a thank" 10.85s
  typeEnd: 352,
  marker: 356, // "you message that is" 11.85s
  soul: 402, // "like steals my soul" 13.4s
  replyOut: 418,
};

const RECEIPTS = [
  { at: T.read, text: "Read 9:41 AM" },
  { at: T.ages[0], text: "Read 2 days ago" },
  { at: T.ages[1], text: "Read 3 weeks ago" },
  { at: T.ages[2], text: "Read 2 months ago" },
];

const REPLY = ["Thank you for your interest.", "Unfortunately, we have decided to", "move forward with other candidates."];
const MARKED = "Unfortunately";

/** Lucide "ghost", filled. */
const Ghost: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ overflow: "visible", filter: "drop-shadow(0 10px 24px rgba(0,0,0,.35))" }}>
    <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" fill="rgba(255,255,255,.95)" />
    <circle cx="9" cy="10" r="1.3" fill="#1b1b1f" />
    <circle cx="15" cy="10" r="1.3" fill="#1b1b1f" />
  </svg>
);

const shadowText = "0 2px 10px rgba(0,0,0,.55), 0 0 2px rgba(0,0,0,.4)";

/* --------------------------------------------- her follow-up, read and ignored */

const Thread: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  if (f < T.sent - 1 || f > T.threadOut + 18) return null;
  const s = pop(f, T.sent, fps, 12);
  const out = ramp(f, T.threadOut, T.threadOut + 14);
  const dim = 1 - 0.35 * ramp(f, T.notice, T.notice + 10);

  // Receipt: each new label rolls up from below, the old one rolls out the top.
  const cur = RECEIPTS.filter((r) => f >= r.at);
  const i = cur.length - 1;
  const roll = i >= 0 ? ramp(f, RECEIPTS[i].at, RECEIPTS[i].at + 8) : 0;
  const kick = i >= 1 ? pop(f, RECEIPTS[i].at, fps, 9) : 1;

  // Typing dots, then nothing.
  const dIn = pop(f, T.dots, fps, 14);
  const dOut = ramp(f, T.dotsOut, T.dotsOut + 6);
  const dScale = dIn * (1 - dOut);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: (1 - out) * dim, transform: `translateY(${(-70 * out).toFixed(1)}px)` }}>
      {/* sent bubble */}
      <div style={{ position: "absolute", right: 150, top: 462, transformOrigin: "100% 100%",
        transform: `translate(${((1 - s) * 40).toFixed(1)}px, ${((1 - s) * 30).toFixed(1)}px) scale(${(0.6 + 0.4 * s).toFixed(4)})`,
        opacity: Math.min(1, s * 2) }}>
        <div style={{ background: RED, color: "#fff", fontFamily: INTER, fontWeight: 600, fontSize: 34, letterSpacing: "-0.01em",
          padding: "18px 28px", borderRadius: "32px 32px 8px 32px", whiteSpace: "nowrap", boxShadow: "0 14px 34px rgba(0,0,0,.28)" }}>
          Just following up on my application!
        </div>
      </div>
      {/* read receipt */}
      {i >= 0 && (
        <div style={{ position: "absolute", right: 156, top: 548, height: 36, width: 420, overflow: "hidden",
          transform: `scale(${(0.9 + 0.1 * kick).toFixed(4)})`, transformOrigin: "100% 50%" }}>
          {i >= 1 && (
            <div style={{ position: "absolute", right: 0, top: -36 * roll, fontFamily: INTER, fontWeight: 600, fontSize: 27,
              color: "rgba(255,255,255,.95)", textShadow: shadowText, opacity: 1 - roll }}>{RECEIPTS[i - 1].text}</div>
          )}
          <div style={{ position: "absolute", right: 0, top: i >= 1 ? 36 * (1 - roll) : 0, fontFamily: INTER, fontWeight: 600, fontSize: 27,
            color: "rgba(255,255,255,.95)", textShadow: shadowText, opacity: i >= 1 ? roll : roll }}>{RECEIPTS[i].text}</div>
        </div>
      )}
      {/* typing dots */}
      {dScale > 0.01 && (
        <div style={{ position: "absolute", left: 150, top: 598, transform: `scale(${dScale.toFixed(4)})`, transformOrigin: "0% 100%",
          display: "flex", gap: 10, padding: "22px 26px", borderRadius: "30px 30px 30px 8px", background: "rgba(238,238,242,.96)",
          boxShadow: "0 14px 34px rgba(0,0,0,.25)" }}>
          {[0, 1, 2].map((k) => {
            const b = Math.sin((f - T.dots) / 3.2 - k * 0.9);
            return <div key={k} style={{ width: 16, height: 16, borderRadius: 8, background: "#8a8a92",
              transform: `translateY(${(Math.max(0, b) * -7).toFixed(2)}px)`, opacity: 0.55 + 0.45 * Math.max(0, b) }} />;
          })}
        </div>
      )}
      {/* the ghost that answered instead */}
      {f >= T.peek && (() => {
        const g = pop(f, T.peek, fps, 9);
        const bob = Math.sin((f - T.peek) / 9) * 6;
        const sway = Math.sin((f - T.peek) / 14) * 6;
        return (
          <div style={{ position: "absolute", left: 160, top: 590 + bob, transform: `rotate(${sway.toFixed(2)}deg) scale(${g.toFixed(4)})`,
            transformOrigin: "50% 100%" }}>
            <Ghost size={84} />
          </div>
        );
      })()}
    </div>
  );
};

/* --------------------------------------------- two months later, the reply */

const Notification: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  if (f < T.notice - 1 || f > T.noticeOut + 16) return null;
  const s = pop(f, T.notice, fps, 16);
  const out = ramp(f, T.noticeOut, T.noticeOut + 12, EASE_CAMERA);
  const y = interpolate(s, [0, 1], [-240, 46]) - out * 300;
  return (
    <div style={{ position: "absolute", left: 50, top: y }}>
      <AppNotice app={{ name: "Inbox", tile: "#3b6fe0", glyph: "mail" }} title="Recruiting Team"
        body="Re: Following up on my application" time="now" w={980} />
    </div>
  );
};

const Reply: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  if (f < T.reply - 1 || f > T.replyOut + 14) return null;
  const s = pop(f, T.reply, fps, 13);
  const total = REPLY.join("").length;
  const shown = Math.round(interpolate(f, [T.reply + 3, T.typeEnd], [0, total], clamp));
  const drain = ramp(f, T.soul, T.soul + 14);
  const out = ramp(f, T.replyOut, T.replyOut + 12);
  const mark = ramp(f, T.marker, T.marker + 12);

  let left = shown;
  const lines = REPLY.map((line) => {
    const n = Math.max(0, Math.min(line.length, left));
    left -= line.length;
    return n;
  });

  return (
    <div style={{ position: "absolute", left: 150, top: 470, transformOrigin: "0% 100%",
      transform: `translateY(${(drain * 14 + (1 - s) * 30).toFixed(1)}px) rotate(${(-2.5 * drain).toFixed(2)}deg) scale(${(0.6 + 0.4 * s).toFixed(4)})`,
      opacity: Math.min(1, s * 2) * (1 - 0.45 * drain) * (1 - out), filter: `saturate(${(1 - drain).toFixed(3)})` }}>
      <div style={{ background: "rgba(238,238,242,.97)", color: "#1b1b1f", fontFamily: INTER, fontWeight: 500, fontSize: 32, lineHeight: 1.32,
        letterSpacing: "-0.01em", padding: "20px 28px", borderRadius: "32px 32px 32px 8px", boxShadow: "0 14px 34px rgba(0,0,0,.28)",
        width: 640 }}>
        {REPLY.map((line, k) => {
          const vis = line.slice(0, lines[k]);
          // Keep each line's full width reserved so the bubble never reflows while typing.
          const ghostRest = <span style={{ opacity: 0 }}>{line.slice(lines[k]) || " "}</span>;
          if (k === 1) {
            const w = vis.slice(0, MARKED.length);
            const rest = vis.slice(MARKED.length);
            return (
              <div key={k} style={{ whiteSpace: "nowrap" }}>
                <span style={{ position: "relative", display: "inline-block" }}>
                  {w}
                  {w.length < MARKED.length && <span style={{ opacity: 0 }}>{MARKED.slice(w.length)}</span>}
                  <svg viewBox="0 0 200 16" preserveAspectRatio="none" style={{ position: "absolute", left: -6, right: -6, bottom: -6, width: "calc(100% + 12px)", height: 14,
                    overflow: "visible", clipPath: `inset(0 ${((1 - mark) * 100).toFixed(2)}% 0 0)` }}>
                    <path d="M2 10 C 50 4, 120 3, 198 7" stroke={RED} strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.92} />
                  </svg>
                </span>
                {rest}
                <span style={{ opacity: 0 }}>{line.slice(Math.max(MARKED.length, lines[k]))}</span>
              </div>
            );
          }
          return <div key={k} style={{ whiteSpace: "nowrap" }}>{vis}{ghostRest}</div>;
        })}
      </div>
    </div>
  );
};

/* --------------------------------------------- "steals my soul" */

const Soul: React.FC<{ f: number }> = ({ f }) => {
  const at = T.soul + 2;
  const end = at + 70;
  if (f < at || f > end) return null;
  const t = interpolate(f, [at, end], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const born = ramp(f, at, at + 10);
  // Rises out of the top of her head (bun tops out near y 690), never across her face.
  const x = 400 + Math.sin((f - at) / 7) * 34 * born;
  const y = interpolate(t, [0, 1], [640, -260]);
  const scale = interpolate(born, [0, 1], [0.3, 1]);
  const tilt = Math.sin((f - at) / 7 + 1) * 8;
  return (
    <div style={{ position: "absolute", left: x - 85, top: y - 85, opacity: born * 0.95, transformOrigin: "50% 100%",
      transform: `rotate(${tilt.toFixed(2)}deg) scale(${scale.toFixed(4)})` }}>
      <Ghost size={170} />
    </div>
  );
};

/* --------------------------------------------- film */

const CUES: { at: number; file: string; volume: number }[] = [
  { at: T.sent, file: "ui-message-pop.mp3", volume: 0.5 },
  { at: T.read, file: "switch-tap.mp3", volume: 0.22 },
  { at: T.dots, file: "ui-popup-dry.mp3", volume: 0.25 },
  { at: T.peek, file: "sparkle-poof-hit.mp3", volume: 0.25 },
  ...T.ages.map((at) => ({ at, file: "clock-tick-single.mp3", volume: 0.4 })),
  { at: T.notice, file: "chime-crystal.mp3", volume: 0.42 },
  { at: T.reply, file: "ui-message-pop.mp3", volume: 0.4 },
  { at: T.reply + 3, file: "typewriter-digital.mp3", volume: 0.16 },
  { at: T.marker, file: "marker-pen-line.mp3", volume: 0.4 },
  { at: T.soul + 2, file: "whoosh-swirl.mp3", volume: 0.42 },
];

export const LeftOnReadFilm: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile("leftonread/interview.mov")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <Thread f={f} />
      <Reply f={f} />
      <Notification f={f} />
      <Soul f={f} />
      {CUES.map((c, k) => (
        <Sequence key={k} from={c.at} layout="none">
          <Audio src={sfx(c.file)} volume={c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
