/**
 * Parts reel for the launch-film kit (2026-10-19), 4:5.
 *
 * Every part in src/kit/parts.tsx played once, in the order a CampusAI launch film would use
 * them, so the reel reads as a rough story as well as a parts sheet: a Monday-morning problem,
 * the pile-up, the brand arrives, one product idea per shot, the payoff number, the end card.
 * The copy is a DRAFT for review, and the small label bottom left names each part (`labels`).
 *
 * Product shots are real dark-mode captures of campusai-demo (public/wall/cards). The calendar
 * button is a redraw of the real component with its real strings. Faces are randomuser.me
 * placeholders and must be swapped for licensed stock before anything is posted.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Atmosphere } from "./components/Atmosphere";
import { getTheme } from "./theme";
import { EASE_CAMERA } from "./lib/anim";
import {
  BlurLines, CalendarPill, FaceChip, FloatCard, Hand, INTER, Ink, Notice, NumberWheel, Odometer, PatternField, RiseBars, SPARK, TypeLine, face, pop, ramp,
} from "./kit/parts";

export const KIT_FPS = 30;
const T = getTheme("campusaiProduct");
const RED = T.accent;
const INK: Ink = { ink: "#ffffff", soft: "rgba(255,255,255,.55)", accent: RED, surface: "#141114", line: "rgba(255,255,255,.08)" };
const W = 1080;
const H = 1350;
const card = (n: string) => staticFile(`wall/cards/${n}.png`);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------------------------------------------------------------- shots */

const Clock: React.FC = () => {
  const f = useCurrentFrame();
  const v = interpolate(f, [16, 32], [1, 2], { ...clamp, easing: EASE_CAMERA });
  const n = ramp(f, 30, 44);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "baseline", fontFamily: INTER, fontWeight: 700, color: "#fff", letterSpacing: "-0.04em",
        opacity: ramp(f, 0, 10), filter: `blur(${(1 - ramp(f, 0, 12)) * 14}px)` }}>
        <span style={{ fontSize: 250 }}>8:0</span>
        <Odometer value={v} digits={1} size={250} color="#fff" />
        <span style={{ fontSize: 110, color: INK.soft, marginLeft: 22 }}>am</span>
      </div>
      <div style={{ position: "absolute", top: 860, opacity: n, transform: `translateY(${(1 - n) * 40}px) scale(${0.94 + 0.06 * n})` }}>
        <Notice icon="book" from="Class site" text="BMGT313 quiz moved to Thursday" time="8:02" w={760} ink={INK} />
      </div>
    </AbsoluteFill>
  );
};

const Question: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <BlurLines at={2} size={112} ink={INK} lines={[{ text: "What's actually" }, { text: "due this week?", accent: true }]} />
    <FaceChip i={0} x={230} y={360} at={14} bubble="Wait, Thursday?" />
    <FaceChip i={3} x={830} y={300} at={20} bubble="Open book?" side="left" />
    <FaceChip i={6} x={190} y={1000} at={26} bubble="Which quiz?" />
    <FaceChip i={9} x={860} y={1040} at={32} bubble="Room change?" side="left" />
  </AbsoluteFill>
);

const PILE = [
  { icon: "book", from: "Class site", text: "BMGT313 quiz moved to Thursday", time: "8:02" },
  { icon: "mail", from: "School email", text: "Reminder: drop deadline is Friday", time: "8:04" },
  { icon: "briefcase", from: "Career portal", text: "12 new postings match your search", time: "8:09" },
  { icon: "chat", from: "Finance Association", text: "who's going tonight??", time: "8:11" },
  { icon: "calendar", from: "Calendar", text: "Office hours moved to 3:30", time: "8:15" },
  { icon: "mail", from: "School email", text: "Advising appointments are open", time: "8:20" },
] as const;

const PileUp: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const collapse = ramp(f, 58, 72, Easing.in(Easing.cubic));
  const big = ramp(f, 66, 80);
  const count = interpolate(f, [4, 56, 66, 84], [0, 41, 41, 63], { ...clamp, easing: EASE_CAMERA });
  return (
    <AbsoluteFill>
      {PILE.map((n, i) => {
        const s = pop(f, 2 + i * 7, fps, 14);
        const y = 330 + i * 118;
        const rot = [-2, 1.5, -1, 2, -1.5, 1][i];
        return (
          <div key={i} style={{ position: "absolute", left: 140, top: interpolate(collapse, [0, 1], [y, 600]) + (1 - s) * 120,
            opacity: Math.min(1, s * 1.4) * (1 - collapse), transform: `rotate(${rot * (1 - collapse)}deg) scale(${(0.92 + 0.08 * s) * (1 - collapse * 0.4)})`,
            filter: collapse ? `blur(${collapse * 18}px)` : undefined, zIndex: i }}>
            <Notice {...n} w={800} ink={INK} />
          </div>
        );
      })}
      {/* The unread badge riding the stack, then the same number taking the frame. */}
      <div style={{ position: "absolute", right: 110, top: 270, zIndex: 10, transform: `scale(${pop(f, 6, fps)})`, opacity: 1 - big,
        display: "flex", alignItems: "center", gap: 4, background: RED, borderRadius: 40, padding: "6px 22px 6px 18px" }}>
        <Odometer value={count} digits={2} size={40} color="#fff" />
        <span style={{ fontFamily: INTER, fontWeight: 700, fontSize: 34, color: "#fff" }}>new</span>
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: big, filter: `blur(${(1 - big) * 16}px)`,
        transform: `scale(${0.9 + 0.1 * big})` }}>
        <Odometer value={count} digits={2} size={300} color="#fff" />
        <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 84, color: INK.soft, letterSpacing: "-0.03em", marginTop: -10 }}>unread</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Spark: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dark = ramp(f, 0, 12);
  const s = pop(f, 6, fps, 11);
  const ring = ramp(f, 22, 46, EASE_CAMERA);
  const swap = ramp(f, 44, 58);
  const icon = pop(f, 46, fps, 14);
  const glint = ramp(f, 64, 86, EASE_CAMERA);
  const R = 150;
  const C = 2 * Math.PI * R;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 48%, #1a0709 0%, #040405 62%)", opacity: dark }} />
      <div style={{ position: "absolute", opacity: 1 - swap, transform: `scale(${1 - swap * 0.5})` }}>
        <svg width={420} height={420} viewBox="0 0 420 420" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="kit-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff" /><stop offset="1" stopColor={RED} />
            </linearGradient>
          </defs>
          <circle cx={210} cy={210} r={R} fill="none" stroke="url(#kit-ring)" strokeWidth={10} strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - ring)} transform="rotate(-90 210 210)"
            style={{ filter: `drop-shadow(0 0 22px ${RED})` }} />
          <g transform={`translate(210 210) rotate(${s * 90}) scale(${s * 3.6}) translate(-12 -12)`}>
            <path d={SPARK} fill={RED} style={{ filter: `drop-shadow(0 0 6px ${RED})` }} />
          </g>
        </svg>
      </div>
      <div style={{ position: "absolute", width: 340, height: 340, borderRadius: 78, overflow: "hidden", opacity: swap,
        transform: `scale(${0.6 + 0.4 * icon})`, boxShadow: `0 40px 120px rgba(217,32,46,.35), 0 0 0 1px rgba(255,255,255,.08)` }}>
        <Img src={staticFile("kit/app-icon.png")} style={{ width: "100%", height: "100%", display: "block" }} />
        <div style={{ position: "absolute", top: -60, bottom: -60, width: 120, left: -200 + glint * 760, transform: "rotate(20deg)",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent)" }} />
      </div>
    </AbsoluteFill>
  );
};

const OnePlace: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <TypeLine at={4} size={104} ink={INK} runs={[{ text: "Everything that's due,\n" }, { text: "in one place.", accent: true }]} />
  </AbsoluteFill>
);

const Section: React.FC = () => {
  // classes.png is 1340x805; its "Add to my week" button centres at (1141, 172).
  const cw = 980;
  const k = cw / 1340;
  const ch = 805 * k;
  const cx = W / 2;
  const cy = 760;
  const btn: [number, number] = [cx - cw / 2 + 1141 * k, cy - ch / 2 + 172 * k];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 170, width: "100%" }}>
        <BlurLines at={2} size={84} ink={INK} lines={[{ text: "Pick the section" }, { text: "that fits your week.", accent: true }]} />
      </div>
      <FloatCard src={card("classes")} w={cw} h={ch} x={cx} y={cy} at={8} />
      <Hand from={[1000, 1400]} to={[btn[0] + 6, btn[1] + 10]} at={36} tapAt={62} leaveAt={88} />
    </AbsoluteFill>
  );
};

const Wall: React.FC = () => {
  const f = useCurrentFrame();
  const cols = 7;
  const rows = 9;
  const size = 124;
  const gap = 22;
  const gw = cols * size + (cols - 1) * gap;
  const gh = rows * size + (rows - 1) * gap;
  const flip = ramp(f, 26, 34);
  const lifted = new Set([16, 24, 30, 38, 46]);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: (W - gw) / 2, top: (H - gh) / 2 - ramp(f, 0, 100, EASE_CAMERA) * 40,
        width: gw, height: gh, display: "grid", gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap,
        maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, #000 55%, transparent 100%)" }}>
        {[...Array(cols * rows)].map((_, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const d = Math.hypot(r - (rows - 1) / 2, c - (cols - 1) / 2);
          const col = ramp(f, 34 + d * 5, 46 + d * 5);
          const up = lifted.has(i) ? ramp(f, 50 + d * 3, 62 + d * 3) : 0;
          return (
            <Img key={i} src={face(i * 7 + 3)} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover",
              filter: `grayscale(${1 - col}) brightness(${0.55 + 0.45 * col})`, opacity: ramp(f, d * 1.5, d * 1.5 + 10),
              transform: `scale(${1 + up * 0.16})`, boxShadow: up ? `0 0 0 ${5 * up}px ${RED}, 0 20px 40px rgba(0,0,0,${0.5 * up})` : undefined }} />
          );
        })}
      </div>
      {/* The switch that turns the room on. */}
      <div style={{ position: "absolute", left: "50%", top: H / 2, transform: `translate(-50%,-50%) scale(${pop(f, 4, KIT_FPS)})`,
        display: "flex", alignItems: "center", gap: 22, padding: "18px 22px 18px 18px", borderRadius: 60,
        background: "rgba(20,17,20,.92)", border: `1px solid ${INK.line}`, boxShadow: "0 30px 70px rgba(0,0,0,.6)", fontFamily: INTER }}>
        <Img src={staticFile("kit/app-icon.png")} style={{ width: 64, height: 64, borderRadius: 16 }} />
        <span style={{ fontSize: 38, fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}>Find your people</span>
        <div style={{ width: 96, height: 56, borderRadius: 30, background: flip ? `color-mix(in oklab, ${RED} ${flip * 100}%, #3a3a40)` : "#3a3a40", position: "relative" }}>
          <div style={{ position: "absolute", top: 5, left: 5 + flip * 40, width: 46, height: 46, borderRadius: "50%", background: "#fff" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const WhosGoing: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = 3;
  const fs = 92;
  const slot = (j: number) => pop(f, 8 + j * 5, fps, 12);
  const width = [...Array(n)].reduce((w, _, j) => w + slot(j) * (j === 0 ? fs : fs * 0.62), 0);
  const tail = ramp(f, 22, 34);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", fontFamily: INTER, fontWeight: 700, fontSize: 100, color: "#fff", letterSpacing: "-0.035em", whiteSpace: "nowrap" }}>
        <span style={{ opacity: ramp(f, 0, 8) }}>See</span>
        <div style={{ width: width + 40, height: fs, position: "relative", margin: "0 6px", flex: "none" }}>
          {[...Array(n)].map((_, j) => (
            <Img key={j} src={face([12, 19, 27][j])} style={{ position: "absolute", left: 20 + j * fs * 0.62, top: 0, width: fs, height: fs,
              borderRadius: "50%", objectFit: "cover", border: "5px solid #0b0b0d", transform: `scale(${slot(j)})`, zIndex: n - j }} />
          ))}
        </div>
        <span style={{ opacity: tail, filter: `blur(${(1 - tail) * 12}px)`, color: RED }}>who's going</span>
      </div>
    </AbsoluteFill>
  );
};

const Calendar: React.FC = () => {
  const f = useCurrentFrame();
  const cw = 900;
  const ch = 980 * (cw / 1440);
  const pill: [number, number] = [W / 2, 1060];
  const toast = ramp(f, 70, 82);
  return (
    <AbsoluteFill>
      <FloatCard src={card("events")} w={cw} h={ch} x={W / 2} y={560} at={4} />
      <CalendarPill x={pill[0]} y={pill[1]} at={24} flipAt={58} primary={RED} />
      <Hand from={[1100, 1450]} to={[pill[0] + 150, pill[1] + 14]} at={30} tapAt={58} leaveAt={84} />
      <div style={{ position: "absolute", left: "50%", top: 1180, transform: `translate(-50%, ${(1 - toast) * 20}px)`, opacity: toast,
        whiteSpace: "nowrap", fontFamily: INTER, fontWeight: 500, fontSize: 30, color: INK.soft }}>
        Added. It will now show up in Your week on your dashboard.
      </div>
    </AbsoluteFill>
  );
};

const Why: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <PatternField phrase="Why this fits you" color={RED} />
    <svg width={72} height={72} viewBox="0 0 24 24" style={{ marginBottom: 30 }}><path d={SPARK} fill="#fff" /></svg>
    <BlurLines at={4} size={124} ink={{ ...INK, accent: "rgba(255,255,255,.72)" }} lines={[{ text: "Every pick" }, { text: "tells you why.", accent: true }]} />
  </AbsoluteFill>
);

const Fan: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glow = ramp(f, 0, 24, EASE_CAMERA);
  const n = interpolate(f, [30, 60], [0, 3], { ...clamp, easing: EASE_CAMERA });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: -300, right: -300, top: 700 + (1 - glow) * 200, height: 1200, borderRadius: "50%",
        background: `radial-gradient(ellipse at 50% 0%, ${RED} 0%, rgba(217,32,46,.35) 30%, transparent 62%)`, opacity: glow,
        borderTop: "2px solid rgba(255,150,160,.6)" }} />
      <FloatCard src={card("clubs")} w={620} h={818 * (620 / 1788)} x={260} y={600} at={10} rot={-7} />
      <FloatCard src={card("classes")} w={580} h={805 * (580 / 1340)} x={830} y={640} at={16} rot={7} />
      <FloatCard src={card("jobs")} w={860} h={370 * (860 / 1255)} x={540} y={850} at={22} />
      <div style={{ position: "absolute", left: "50%", top: 260, transform: `translateX(-50%) scale(${pop(f, 26, fps)})`, display: "flex",
        alignItems: "center", gap: 18, padding: "16px 30px 16px 18px", borderRadius: 50, background: "rgba(20,17,20,.94)",
        border: `1px solid ${INK.line}`, fontFamily: INTER, boxShadow: "0 24px 60px rgba(0,0,0,.6)" }}>
        <div style={{ width: 58, height: 58, borderRadius: "50%", background: RED, display: "grid", placeItems: "center" }}>
          <Odometer value={n} digits={1} size={36} color="#fff" />
        </div>
        <span style={{ fontSize: 40, fontWeight: 600, color: "#fff" }}>New matches</span>
      </div>
      <FaceChip i={30} x={140} y={400} at={34} size={88} bubble="Going!" />
      <FaceChip i={41} x={950} y={420} at={40} size={88} bubble="Same section?" side="left" />
    </AbsoluteFill>
  );
};

const Payoff: React.FC = () => {
  const f = useCurrentFrame();
  const v = interpolate(f, [6, 58], [63, 3], { ...clamp, easing: Easing.bezier(0.3, 0, 0.1, 1) });
  const t = ramp(f, 46, 60);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        <NumberWheel value={v} pad={2} size={290} color="#fff" />
        <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 82, lineHeight: 1.04, letterSpacing: "-0.03em",
          opacity: t, filter: `blur(${(1 - t) * 12}px)`, transform: `translateX(${(1 - t) * -20}px)` }}>
          <div style={{ color: "#fff" }}>things</div>
          <div style={{ color: RED }}>actually due.</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const End: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const i = pop(f, 4, fps, 14);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <RiseBars at={8} color={RED} height={420} />
      <div style={{ marginTop: 300, width: 240, height: 240, borderRadius: 56, overflow: "hidden", transform: `scale(${i})`,
        boxShadow: "0 30px 90px rgba(217,32,46,.3)" }}>
        <Img src={staticFile("kit/app-icon.png")} style={{ width: "100%", height: "100%" }} />
      </div>
      <div style={{ marginTop: 60 }}>
        <BlurLines at={14} size={84} ink={INK} lines={[{ text: "Your student" }, { text: "operating system", accent: true }]} />
      </div>
      <div style={{ marginTop: 34, fontFamily: INTER, fontWeight: 600, fontSize: 36, color: INK.soft, opacity: ramp(f, 34, 46) }}>Link in bio.</div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- the edit */

type Move = "whip" | "fade" | "cut";
const SHOTS: { C: React.FC; dur: number; label: string; inK: Move; outK: Move }[] = [
  { C: Clock, dur: 62, label: "Clock tick + notification", inK: "fade", outK: "fade" },
  { C: Question, dur: 78, label: "Blur-in headline + faces with bubbles", inK: "fade", outK: "whip" },
  { C: PileUp, dur: 92, label: "Pile-up into one number", inK: "whip", outK: "fade" },
  { C: Spark, dur: 98, label: "Spark, ring, app icon", inK: "fade", outK: "fade" },
  { C: OnePlace, dur: 74, label: "Typed line", inK: "fade", outK: "whip" },
  { C: Section, dur: 104, label: "Real card + hand tap", inK: "whip", outK: "whip" },
  { C: Wall, dur: 100, label: "Face wall + switch", inK: "whip", outK: "fade" },
  { C: WhosGoing, dur: 66, label: "Faces inside a sentence", inK: "fade", outK: "whip" },
  { C: Calendar, dur: 112, label: "Real card + pressed button", inK: "whip", outK: "whip" },
  { C: Why, dur: 78, label: "Pattern field", inK: "whip", outK: "whip" },
  { C: Fan, dur: 108, label: "Fanned cards on a horizon + counter", inK: "whip", outK: "fade" },
  { C: Payoff, dur: 90, label: "Number wheel", inK: "fade", outK: "fade" },
  { C: End, dur: 104, label: "End card + rising bars", inK: "fade", outK: "cut" },
];
const OVERLAP = 8;
const START = SHOTS.reduce<number[]>((a, s, i) => [...a, i === 0 ? 0 : a[i - 1] + SHOTS[i - 1].dur - OVERLAP], []);
export const KIT_FRAMES = START[START.length - 1] + SHOTS[SHOTS.length - 1].dur;

const Shot: React.FC<{ dur: number; inK: Move; outK: Move; id: number; children: React.ReactNode }> = ({ dur, inK, outK, id, children }) => {
  const f = useCurrentFrame();
  const L = 11;
  let x = 0;
  let bx = 0;
  let op = 1;
  if (inK === "whip") { const p = 1 - ramp(f, 0, L, Easing.out(Easing.cubic)); x += p * W * 0.55; bx += p * 60; op *= 1 - p * 0.5; }
  if (inK === "fade") { const p = ramp(f, 0, L); op *= p; bx += (1 - p) * 4; }
  if (outK === "whip") { const p = ramp(f, dur - L, dur, Easing.in(Easing.cubic)); x -= p * W * 0.55; bx += p * 60; op *= 1 - p * 0.5; }
  if (outK === "fade") { const p = ramp(f, dur - L, dur); op *= 1 - p; }
  return (
    <AbsoluteFill style={{ transform: `translateX(${x}px)`, opacity: op, filter: bx > 0.3 ? `url(#whip-${id})` : undefined }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={`whip-${id}`} x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation={`${bx} 0`} /></filter>
      </svg>
      {children}
    </AbsoluteFill>
  );
};

export const KitReel: React.FC<{ labels?: boolean }> = ({ labels = true }) => (
  <AbsoluteFill style={{ background: T.bg }}>
    <Atmosphere theme={T} totalFrames={KIT_FRAMES} />
    {SHOTS.map((s, i) => (
      <Sequence key={i} from={START[i]} durationInFrames={s.dur}>
        <Shot dur={s.dur} inK={s.inK} outK={s.outK} id={i}><s.C /></Shot>
        {labels ? (
          <div style={{ position: "absolute", left: 48, bottom: 40, fontFamily: INTER, fontWeight: 500, fontSize: 24, color: "rgba(255,255,255,.4)" }}>
            {String(i + 1).padStart(2, "0")}  {s.label}
          </div>
        ) : null}
      </Sequence>
    ))}
  </AbsoluteFill>
);

export const KIT_SIZE = { width: W, height: H };
