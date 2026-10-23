/**
 * Scene 2: My Calendar (beats 8.6 to 22).
 *
 *   8.6-12     the bootcamp card leaves the rail and flies down into its own slot, Friday 5pm, where
 *              the calendar was already suggesting it as a dashed block; it lands on the drop and the
 *              dashed suggestion becomes the solid event (the real before and after on campusai-demo)
 *   12-13.5    the camera pulls back to the whole week: classes, work shifts, events, the due row
 *              of assignments, and the other suggestion still waiting (Deloitte, Thursday 4pm)
 *   14.6-15.6  the due row: Quiz 2 lights up
 *   15.2-20    Ask CampusAI, "Find time to study for Quiz 2", the chat's real answer, its add
 *              button, and the study block flies to Wednesday 6:30pm, landing on the kick
 *   20.2-22    pull back and tilt, the full week, one sheen
 *
 * Every image is the real /calendar and its chat on campusai-demo, captured in one run by
 * `capture/campus-film.cjs` (positions from public/campus/meta.json). The camera is a flat 2D
 * camera over the captured grid until the last pull back, so the screen-space fliers can land
 * exactly on their slots.
 */
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { EASE, bezier, mix, ramp } from "../shots/_fixtures/Polish";
import meta from "../../public/campus/meta.json";
import { ANSWER_AT, ASK_AT, ASK_PRESS, B, DROP, FLY_AT, OUTRO_AT, PILL_PRESS, QUIZ_AT, STUDY_LAND } from "./beats";
import { CARD_CY, CARD_H, CARD_W, CARD_X, Cursor, LIFT, Ripple } from "./Rail";

const RED = "#E21833";
const GW = meta.grid.width;
const GH = meta.grid.height;
const S0 = 1040 / GW;
type Rect = { x: number; y: number; w: number; h: number };
const PRE = meta.pre.filter((b) => b.kind !== "suggested" || !/^Financial Modeling/.test(b.text));
const BOOT_SUGGESTED = meta.pre.find((b) => b.kind === "suggested" && /^Financial Modeling/.test(b.text))!;
const QUIZ2 = meta.pre.find((b) => b.kind === "due" && b.text === "Quiz 2")!;
const BOOT: Rect = { x: meta.postBoot.x, y: meta.postBoot.y, w: meta.postBoot.w, h: meta.postBoot.h };
// the study block was read in the chat layout; it sits in Wednesday's column of the normal grid, at its own 6:30pm
const WED = meta.pre.find((b) => b.kind === "class" && b.text === "BMGT343" && b.x > 400 && b.x < 480)!;
const STUDY: Rect = { x: WED.x, y: meta.postStudy.y, w: WED.w, h: meta.postStudy.h };

/* ---------- the camera ---------- */
type Cam = { fx: number; fy: number; z: number; cy: number };
const KEYS: [number, number, number, number, number][] = [
  [8.6, BOOT.x + BOOT.w / 2, BOOT.y + BOOT.h / 2, 2.3, 900],
  [12, BOOT.x + BOOT.w / 2, BOOT.y + BOOT.h / 2, 2.05, 900],
  [13.5, GW / 2, GH / 2, 1.0, 900],
  [14.6, QUIZ2.x + 40, QUIZ2.y + 60, 1.8, 760],
  [15.6, STUDY.x + STUDY.w / 2, STUDY.y - 50, 1.45, 640],
  [20.2, STUDY.x + STUDY.w / 2, STUDY.y - 50, 1.55, 640],
  [21.6, GW / 2, GH / 2, 1.0, 900],
  [22.6, GW / 2, GH / 2, 1.05, 900],
];
const cam = (f: number): Cam => {
  let k = 0;
  while (k < KEYS.length - 2 && f >= B(KEYS[k + 1][0])) k++;
  const a = KEYS[k], b = KEYS[k + 1];
  const t = ramp(f, B(a[0]), B(b[0]) - B(a[0]), k === KEYS.length - 2 ? EASE.linear : EASE.smooth);
  const bump = f >= DROP ? 0.08 * Math.exp(-(f - DROP) / 4) : 0;
  return { fx: mix(a[1], b[1], t), fy: mix(a[2], b[2], t), z: mix(a[3], b[3], t) + bump, cy: mix(a[4], b[4], t) };
};
const toScreen = (c: Cam, r: Rect): Rect => {
  const s = S0 * c.z;
  return { x: 540 + s * (r.x - c.fx), y: c.cy + s * (r.y - c.fy), w: r.w * s, h: r.h * s };
};
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t) });

const img = (f: string) => staticFile(`campus/${f}`);
const Block: React.FC<{ r: Rect; src: string; style?: React.CSSProperties }> = ({ r, src, style }) => (
  <Img src={img(src)} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 6, ...style }} />
);

/* ---------- the flying pieces, in screen space ---------- */
const Fly = bezier(0.55, 0, 0.25, 1);
const BootFlight: React.FC<{ f: number; c: Cam }> = ({ f, c }) => {
  if (f < FLY_AT || f >= DROP) return null;
  const t = ramp(f, FLY_AT, DROP - FLY_AT, Fly);
  const start: Rect = { x: CARD_X + (CARD_W * (1 - LIFT)) / 2, y: CARD_CY - (CARD_H * LIFT) / 2, w: CARD_W * LIFT, h: CARD_H * LIFT };
  const r = lerpRect(start, toScreen(c, BOOT), t);
  const bump = 1 + 0.1 * Math.sin(Math.PI * t);
  const cx = r.x + r.w / 2 + Math.sin(Math.PI * t) * 70, cyy = r.y + r.h / 2;
  const w = r.w * bump, h = r.h * bump;
  const morph = ramp(f, FLY_AT + (DROP - FLY_AT) * 0.55, (DROP - FLY_AT) * 0.3, EASE.smooth);
  const radius = mix(20, 6, t);
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cyy - h / 2, width: w, height: h, borderRadius: radius,
      boxShadow: `0 0 0 ${mix(3, 1.5, t).toFixed(2)}px ${RED}, 0 0 ${mix(70, 30, t).toFixed(0)}px rgba(226,24,51,0.55), 0 ${(40 * (1 - t) + 10).toFixed(0)}px ${(60 * (1 - t) + 20).toFixed(0)}px rgba(0,0,0,0.6)` }}>
      <Img src={img("bootcamp-on.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: radius, opacity: 1 - morph }} />
      <Img src={img("post-boot.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: radius, opacity: morph }} />
    </div>
  );
};

// Ask CampusAI card and the chat's answer, both as captured, scaled up
const AK = 2.3;
const ASK: Rect = { x: 70, y: 1150, w: meta.ask.width * AK, h: meta.ask.height * AK };
const ROW = { x: ASK.x + (meta.ask.row.x + meta.ask.row.w / 2) * AK, y: ASK.y + (meta.ask.row.y + meta.ask.row.h / 2) * AK };
const ANS: Rect = { x: 97, y: 1170, w: meta.answer.width * AK, h: meta.answer.height * AK };
const PILL: Rect = { x: ANS.x + meta.answer.pill.x * AK, y: ANS.y + meta.answer.pill.y * AK, w: meta.answer.pill.w * AK, h: meta.answer.pill.h * AK };

const AskAndAnswer: React.FC<{ f: number }> = ({ f }) => {
  if (f < ASK_AT || f > STUDY_LAND + 14) return null;
  const askIn = ramp(f, ASK_AT, 12, EASE.snappy);
  const askOut = ramp(f, ANSWER_AT - 4, 10, EASE.exit);
  const ansIn = ramp(f, ANSWER_AT, 12, EASE.snappy);
  const ansOut = ramp(f, STUDY_LAND - 2, 12, EASE.exit);
  const added = ramp(f, PILL_PRESS + 2, 4, EASE.out);
  const panel: React.CSSProperties = { position: "absolute", borderRadius: 30, overflow: "hidden",
    boxShadow: "0 0 0 1px rgba(255,140,140,0.18), 0 40px 90px rgba(0,0,0,0.75), 0 0 80px rgba(226,24,51,0.18)" };
  return (
    <>
      {askOut < 1 && (
        <div style={{ ...panel, left: ASK.x, top: ASK.y, width: ASK.w, height: ASK.h, background: "#1a0c0f",
          opacity: askIn * (1 - askOut), transform: `translateX(${((1 - askIn) * -700 - askOut * 200).toFixed(1)}px)` }}>
          <Img src={img("ask.png")} style={{ width: "100%", height: "100%", display: "block" }} />
          {f >= ASK_PRESS - 1 && f < ASK_PRESS + 5 && (
            <div style={{ position: "absolute", left: ROW.x - ASK.x - (meta.ask.row.w * AK) / 2, top: ROW.y - ASK.y - (meta.ask.row.h * AK) / 2,
              width: meta.ask.row.w * AK, height: meta.ask.row.h * AK, borderRadius: 16, background: "rgba(255,255,255,0.12)" }} />
          )}
        </div>
      )}
      {f >= ANSWER_AT && (
        <div style={{ ...panel, left: ANS.x, top: ANS.y, width: ANS.w, height: ANS.h, background: "#1c0d10",
          opacity: ansIn * (1 - ansOut), transform: `translateY(${((1 - ansIn) * 80 + ansOut * 120).toFixed(1)}px) scale(${mix(0.94, 1, ansIn)})` }}>
          <Img src={img("answer.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          <Img src={img("answer-after.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: added }} />
        </div>
      )}
    </>
  );
};

const StudyFlight: React.FC<{ f: number; c: Cam }> = ({ f, c }) => {
  const from = PILL_PRESS + 4;
  if (f < from || f >= STUDY_LAND) return null;
  const t = ramp(f, from, STUDY_LAND - from, Fly);
  const start: Rect = { x: PILL.x + PILL.w * 0.3, y: PILL.y, w: PILL.w * 0.4, h: PILL.h };
  const r = lerpRect(start, toScreen(c, STUDY), t);
  const bump = 1 + 0.25 * Math.sin(Math.PI * t);
  const cx = r.x + r.w / 2 - Math.sin(Math.PI * t) * 60, cyy = r.y + r.h / 2;
  return (
    <div style={{ position: "absolute", left: cx - (r.w * bump) / 2, top: cyy - (r.h * bump) / 2, width: r.w * bump, height: r.h * bump, borderRadius: 8,
      opacity: ramp(f, from, 4, EASE.out), boxShadow: `0 0 0 2px #FF5068, 0 0 40px rgba(226,24,51,0.6), 0 20px 40px rgba(0,0,0,0.6)` }}>
      <Img src={img("post-study.png")} style={{ width: "100%", height: "100%", display: "block", borderRadius: 8 }} />
    </div>
  );
};

const Landing: React.FC<{ f: number; at: number; r: Rect }> = ({ f, at, r }) => {
  const k = ramp(f, at, 20, EASE.out);
  if (f < at || k >= 1) return null;
  return <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 10, transform: `scale(${1 + k * 0.5})`,
    opacity: 1 - k, boxShadow: "0 0 0 3px rgba(255,120,135,0.95), 0 0 40px rgba(226,24,51,0.7)" }} />;
};

const CursorPath: React.FC<{ f: number }> = ({ f }) => {
  if (f < ASK_AT + 6 || f > PILL_PRESS + 18) return null;
  const toRow = ramp(f, ASK_AT + 6, ASK_PRESS - ASK_AT - 8, EASE.swift);
  const toPill = ramp(f, ASK_PRESS + 8, PILL_PRESS - ASK_PRESS - 10, EASE.swift);
  const out = ramp(f, PILL_PRESS + 6, 12, EASE.exit);
  const x = mix(mix(1000, ROW.x + 30, toRow), PILL.x + PILL.w / 2 + 30, toPill) + out * 300;
  const y = mix(mix(1800, ROW.y + 4, toRow), PILL.y + PILL.h / 2 + 4, toPill) + out * 300;
  const press = (f >= ASK_PRESS - 2 && f < ASK_PRESS + 4) || (f >= PILL_PRESS - 2 && f < PILL_PRESS + 4);
  return <Cursor x={x} y={y} press={press} />;
};

export const Week: React.FC = () => {
  const f = useCurrentFrame();
  if (f < FLY_AT - 2 || f >= OUTRO_AT + 12) return null;
  const c = cam(f);
  const s = S0 * c.z;
  const enter = ramp(f, FLY_AT - 2, 12, EASE.out);
  const out = ramp(f, OUTRO_AT, 10, EASE.exit);
  const tilt = ramp(f, B(20.2), B(21.6) - B(20.2), EASE.smooth);
  const sheen = ramp(f, B(21.4), 30, EASE.smooth);
  const quiz = ramp(f, QUIZ_AT, 8, EASE.out) * (1 - ramp(f, ASK_PRESS + 10, 10, EASE.out));
  const bootGlow = ramp(f, DROP, 10, EASE.out);
  const studyGlow = ramp(f, STUDY_LAND, 10, EASE.out);
  const d = f - DROP;
  const flash = d < 0 || d > 10 ? 0 : 0.18 * Math.exp(-d / 3);
  return (
    <AbsoluteFill style={{ opacity: enter * (1 - out), filter: out > 0 ? `blur(${(out * 10).toFixed(1)}px)` : enter < 1 ? `blur(${((1 - enter) * 8).toFixed(1)}px)` : undefined }}>
      <AbsoluteFill style={{ perspective: 2400, perspectiveOrigin: `540px ${c.cy}px` }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: `540px ${c.cy}px`,
          transform: `rotateX(${(tilt * 24).toFixed(2)}deg) rotateZ(${(tilt * -6).toFixed(2)}deg) scale(${(1 - out * 0.1) * mix(1.12, 1, enter)})` }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: GW, height: GH, transformOrigin: "0 0",
            transform: `translate(${540 - s * c.fx}px, ${c.cy - s * c.fy}px) scale(${s})` }}>
            <div style={{ position: "absolute", inset: -40, borderRadius: 40, background: "radial-gradient(ellipse at 50% 50%, rgba(226,24,51,0.3), rgba(226,24,51,0) 70%)", filter: "blur(30px)" }} />
            <Img src={img("cal-base.png")} style={{ position: "absolute", inset: 0, width: GW, height: GH, borderRadius: 14,
              boxShadow: "0 0 0 1px rgba(255,140,140,0.16), 0 50px 100px rgba(0,0,0,0.7)" }} />
            {PRE.map((b) => <Block key={b.i} r={b} src={`pre-${b.i}.png`} />)}
            {f < DROP ? <Block r={BOOT_SUGGESTED} src={`pre-${BOOT_SUGGESTED.i}.png`} />
              : <Block r={BOOT} src="post-boot.png" style={{ boxShadow: `0 0 0 ${(1.5 * bootGlow).toFixed(2)}px #FF5068, 0 0 ${(18 * bootGlow).toFixed(0)}px rgba(226,24,51,${(0.8 * bootGlow).toFixed(2)})` }} />}
            {f >= STUDY_LAND && <Block r={STUDY} src="post-study.png" style={{ boxShadow: `0 0 0 ${(1.5 * studyGlow).toFixed(2)}px #FF5068, 0 0 ${(18 * studyGlow).toFixed(0)}px rgba(226,24,51,${(0.8 * studyGlow).toFixed(2)})` }} />}
            {quiz > 0 && <div style={{ position: "absolute", left: QUIZ2.x - 3, top: QUIZ2.y - 3, width: QUIZ2.w + 6, height: QUIZ2.h + 6, borderRadius: 8,
              boxShadow: `0 0 0 ${(2 * quiz).toFixed(2)}px #FF5068, 0 0 ${(26 * quiz).toFixed(0)}px rgba(226,24,51,${(0.9 * quiz).toFixed(2)})` }} />}
            {sheen > 0 && sheen < 1 && (
              <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 14, pointerEvents: "none" }}>
                <div style={{ position: "absolute", top: "-50%", bottom: "-50%", left: `${-30 + sheen * 140}%`, width: "16%", transform: "rotate(18deg)", mixBlendMode: "screen",
                  background: "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,220,220,0.12) 40%, rgba(255,240,240,0.28) 50%, rgba(255,220,220,0.12) 60%, rgba(255,255,255,0) 100%)" }} />
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
      <Landing f={f} at={DROP} r={toScreen(c, BOOT)} />
      <Landing f={f} at={STUDY_LAND} r={toScreen(c, STUDY)} />
      <BootFlight f={f} c={c} />
      <AskAndAnswer f={f} />
      <StudyFlight f={f} c={c} />
      <Ripple f={f} at={ASK_PRESS} x={ROW.x} y={ROW.y} />
      <Ripple f={f} at={PILL_PRESS} x={PILL.x + PILL.w / 2} y={PILL.y + PILL.h / 2} />
      <CursorPath f={f} />
      {flash > 0 && <AbsoluteFill style={{ background: `rgba(255,90,110,${flash.toFixed(3)})`, mixBlendMode: "screen" }} />}
    </AbsoluteFill>
  );
};
