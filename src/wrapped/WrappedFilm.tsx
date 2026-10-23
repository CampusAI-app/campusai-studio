/**
 * CampusAI, "Your midterms, Wrapped" (2026-10-21). 9:16, 30fps, about 19.7s, music and sound.
 *
 * Jacob turned down bingo ("more fun") and asked how a fun video ties back to what we offer. The
 * answer this film is built on: every joke is a real student pain and CampusAI has a real screen
 * for it. So it runs in two halves on a Wrapped-style slide format. First half, "your midterms,
 * Wrapped": five loud slides of deadpan stats, each pushing the last one up off the screen on the
 * beat (shelf `bottom-push-stack-wipe`). Then it turns to "now, with CampusAI" and the same five
 * pains get their answer as REAL product pieces captured off campusai-demo (the moved assignment,
 * My Calendar, the study-time button, a Strong match job card, Ask CampusAI). The product half is
 * a little shorter per slide (2.5 beats against 3) so the film stays mostly fun; Lucius's call.
 *
 * Honesty rule: the joke stats are about "you" and are plainly jokes. Nothing on the CampusAI half
 * carries a made-up number.
 *
 * Music: Mixkit "House Vibez" (Lily J, Mixkit Stock Music Free License), 122.00 BPM, grid t0
 * 7.938s, T 0.4918s, residual 14ms, kick on every beat from the top. The film starts on music beat 0.
 */
import React from "react";
import { AbsoluteFill, Img, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { INTER, useZodiak } from "../kit/parts";
import { EASE, Grain, mix, ramp } from "../shots/_fixtures/Polish";

export const WRAPPED_FPS = 30;
export const WRAPPED_SIZE = { width: 1080, height: 1920 };
const FPS = WRAPPED_FPS;
const H = 1920;

const T0 = 7.938;
const T = 0.4918;
const MUSIC_TRIM = Math.round(T0 * FPS);
const OFFSET_S = T0 - MUSIC_TRIM / FPS;
const B = (n: number) => (OFFSET_S + n * T) * FPS;
export const WRAPPED_FRAMES = Math.round(B(40));

const RED = "#D9202E";
const GOLD = "#F5B82E";
const CREAM = "#F7EFE6";
const INK = "#1a0a0c";
const DARK = "#0b0708";

type Slide = { at: number; bg: string; render: (t: number) => React.ReactNode };

/* ---------- small pieces ---------- */
const Rise: React.FC<{ t: number; at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, at, children, style }) => {
  const p = ramp(t, at, 12, EASE.snappy);
  return <div style={{ opacity: p, filter: `blur(${((1 - p) * 12).toFixed(2)}px)`, transform: `translateY(${((1 - p) * 40).toFixed(1)}px)`, ...style }}>{children}</div>;
};
const Label: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 52, lineHeight: 1.15, letterSpacing: "-0.015em", color, textAlign: "center", padding: "0 90px" }}>{children}</div>
);
const Big: React.FC<{ color: string; size?: number; italic?: boolean; children: React.ReactNode }> = ({ color, size = 300, italic, children }) => (
  <div style={{ fontFamily: "Zodiak", fontWeight: italic ? 400 : 700, fontStyle: italic ? "italic" : "normal", fontSize: size, lineHeight: 0.95,
    letterSpacing: "-0.04em", color, textAlign: "center" }}>{children}</div>
);
// a Wrapped-style shape drifting behind the type
const Blob: React.FC<{ t: number; color: string; x: number; y: number; r: number; ring?: boolean }> = ({ t, color, x, y, r, ring }) => {
  const p = spring({ frame: Math.max(0, t - 2), fps: FPS, config: { damping: 12, stiffness: 120 } });
  return (
    <div style={{ position: "absolute", left: x - r, top: y - r + Math.sin(t / 14) * 14, width: r * 2, height: r * 2, borderRadius: "50%",
      transform: `scale(${p.toFixed(4)}) rotate(${(t * 0.6).toFixed(1)}deg)`,
      ...(ring ? { border: `34px solid ${color}`, boxSizing: "border-box" } : { background: color }) }} />
  );
};
const Count: React.FC<{ t: number; to: number; at: number; dur: number }> = ({ t, to, at, dur }) => {
  const p = ramp(t, at, dur, EASE.out);
  return <>{Math.round(to * p)}</>;
};

/* ---------- the joke half ---------- */
const JOKES: Omit<Slide, "at">[] = [
  { bg: RED, render: (t) => (
    <>
      <Blob t={t} color="#ff6b5b" x={880} y={360} r={220} />
      <Blob t={t} color={GOLD} x={160} y={1560} r={170} ring />
      <Rise t={t} at={2}><Label color={CREAM}>Times you said</Label></Rise>
      <Rise t={t} at={4}><Big color={CREAM} size={420}><Count t={t} to={23} at={5} dur={16} /></Big></Rise>
      <Rise t={t} at={14}><Label color={CREAM}>&ldquo;I&rsquo;ll start tomorrow.&rdquo;</Label></Rise>
    </>
  ) },
  { bg: GOLD, render: (t) => (
    <>
      {["#D9202E", "#2f6df6", "#16a34a", "#7c3aed", "#ea580c", "#0891b2"].map((c, i) => {
        const p = spring({ frame: Math.max(0, t - 8 - i * 2), fps: FPS, config: { damping: 11, stiffness: 170 } });
        const ang = (i / 6) * Math.PI * 2 - Math.PI / 2;
        return <div key={c} style={{ position: "absolute", left: 540 + Math.cos(ang) * 330 - 60, top: 960 + Math.sin(ang) * 330 - 60, width: 120, height: 120,
          borderRadius: 30, background: c, transform: `scale(${p.toFixed(4)}) rotate(${(i % 2 ? 8 : -8)}deg)`, boxShadow: "0 16px 30px rgba(0,0,0,0.25)" }} />;
      })}
      <Rise t={t} at={2} style={{ position: "absolute", top: 380, left: 0, right: 0 }}><Label color={INK}>Apps you opened to find one deadline</Label></Rise>
      <Rise t={t} at={5}><Big color={INK} size={440}>6</Big></Rise>
    </>
  ) },
  { bg: CREAM, render: (t) => {
    const items = ["Iced coffee", "Procrastination", "Panic."];
    const k = t < 10 ? 0 : t < 20 ? 1 : 2;
    return (
      <>
        <Blob t={t} color="rgba(217,32,46,0.12)" x={540} y={980} r={430} />
        <Rise t={t} at={2} style={{ position: "absolute", top: 520, left: 0, right: 0 }}><Label color={RED}>Your top genre</Label></Rise>
        <div style={{ position: "relative", height: 340, width: "100%" }}>
          {items.map((w, i) => {
            const on = i === k;
            const past = i < k;
            return (
              <div key={w} style={{ position: "absolute", left: 0, right: 0, top: 0, transition: "none",
                opacity: on ? 1 : past ? 0 : 0, transform: `translateY(${on ? 0 : past ? -60 : 60}px)` }}>
                <Big color={i === 2 ? RED : INK} size={i === 2 ? 250 : 136} italic={i === 2}>{w}</Big>
              </div>
            );
          })}
        </div>
      </>
    );
  } },
  { bg: "#5c0a14", render: (t) => (
    <>
      <Blob t={t} color="#7d1220" x={200} y={420} r={260} />
      <Blob t={t} color={GOLD} x={900} y={1500} r={150} />
      <Rise t={t} at={2}><Label color={GOLD}>Where you heard the exam moved</Label></Rise>
      <Rise t={t} at={7} style={{ marginTop: 40 }}><Big color={CREAM} size={200}>The group<br />chat.</Big></Rise>
      <Rise t={t} at={18} style={{ marginTop: 40 }}><Label color="rgba(247,239,230,0.65)">Two days late.</Label></Rise>
    </>
  ) },
  { bg: "#ff6b5b", render: (t) => {
    const bar = (h: number, at: number) => ramp(t, at, 12, EASE.snappy) * h;
    return (
      <>
        <Rise t={t} at={2} style={{ position: "absolute", top: 300, left: 0, right: 0 }}><Label color={INK}>Jobs you applied to</Label></Rise>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 520, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 120 }}>
          <div style={{ textAlign: "center" }}>
            <Big color={INK} size={200}><Count t={t} to={40} at={5} dur={14} /></Big>
            <div style={{ width: 220, height: bar(640, 5), background: INK, borderRadius: 24, marginTop: 20 }} />
            <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 40, color: INK, marginTop: 20 }}>Applied</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Rise t={t} at={20}><Big color={CREAM} size={200}>0</Big></Rise>
            <div style={{ width: 220, height: Math.max(6, bar(6, 20)), background: CREAM, borderRadius: 24, marginTop: 20 }} />
            <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 40, color: INK, marginTop: 20 }}>Heard back</div>
          </div>
        </div>
      </>
    );
  } },
];

/* ---------- the CampusAI half: same pains, real product ---------- */
const Product: React.FC<{ t: number; line: string; src: string; w: number; h: number; width: number }> = ({ t, line, src, w, h, width }) => {
  const p = spring({ frame: Math.max(0, t - 5), fps: FPS, config: { damping: 14, stiffness: 140 } });
  const hgt = (h * width) / w;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 45% at 50% 58%, rgba(217,32,46,0.28) 0%, rgba(217,32,46,0) 70%)" }} />
      <Rise t={t} at={1} style={{ position: "absolute", top: 430, left: 0, right: 0 }}>
        <div style={{ fontFamily: "Zodiak", fontWeight: 700, fontSize: 92, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#fff", textAlign: "center", padding: "0 70px" }}>{line}</div>
      </Rise>
      <div style={{ position: "absolute", left: 540 - width / 2, top: 1060 - hgt / 2 + (1 - p) * 140, width, height: hgt, opacity: Math.min(1, p * 1.6),
        transform: `perspective(1400px) rotateX(${((1 - p) * 18).toFixed(2)}deg) scale(${mix(0.86, 1, p).toFixed(4)})` }}>
        {/* contact shadow that separates as it lifts (shelf element-body-moves) */}
        <div style={{ position: "absolute", left: 40, right: 40, bottom: -30, height: 60, borderRadius: "50%", background: "rgba(0,0,0,0.7)",
          filter: `blur(${(10 + p * 16).toFixed(1)}px)`, opacity: 0.4 + 0.4 * p }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 24, overflow: "hidden", background: "#141217",
          boxShadow: "0 0 0 1.5px rgba(255,140,140,0.22), 0 0 90px rgba(217,32,46,0.35), 0 40px 90px rgba(0,0,0,0.6)" }}>
          <Img src={staticFile(src)} style={{ width, height: hgt, display: "block" }} />
        </div>
      </div>
    </>
  );
};

const ANSWERS: Omit<Slide, "at" | "bg">[] = [
  { render: (t) => <Product t={t} line="Caught the day it moved." src="flock/fl-11.png" w={527} h={89} width={1020} /> },
  { render: (t) => <Product t={t} line="Every deadline. One calendar." src="flock/parts/calendar.png" w={968} h={712} width={960} /> },
  { render: (t) => <Product t={t} line="Study time, found for you." src="flock/fl-13.png" w={527} h={57} width={1020} /> },
  { render: (t) => <Product t={t} line="Jobs that actually fit you." src="flock/parts/job.png" w={436} h={158} width={940} /> },
  { render: (t) => <Product t={t} line="And where to eat, right now." src="flock/fl-21.png" w={274} h={80} width={900} /> },
];

/* ---------- the running order ---------- */
const SLIDES: Slide[] = [
  { at: 0, bg: RED, render: (t) => (
    <>
      <Blob t={t} color="#ff6b5b" x={200} y={420} r={240} />
      <Blob t={t} color={GOLD} x={920} y={1480} r={200} ring />
      <Blob t={t} color="#5c0a14" x={880} y={300} r={90} />
      <Rise t={t} at={2}><Big color={CREAM} size={150}>Your midterms,</Big></Rise>
      <Rise t={t} at={10}><Big color={CREAM} size={220} italic>Wrapped.</Big></Rise>
    </>
  ) },
  ...JOKES.map((j, i) => ({ ...j, at: B(4 + i * 3) })),
  { at: B(19), bg: DARK, render: (t) => (
    <>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 45% at 50% 50%, rgba(217,32,46,0.35) 0%, rgba(217,32,46,0) 70%)" }} />
      <Rise t={t} at={2}><Big color={CREAM} size={130}>Now, with</Big></Rise>
      <Rise t={t} at={8} style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
        <Img src={staticFile("brand/campusai-logo-white.svg")} style={{ width: 760, height: 760 * (53 / 223), filter: "drop-shadow(0 0 30px rgba(217,32,46,0.7))" }} />
      </Rise>
    </>
  ) },
  ...ANSWERS.map((a, i) => ({ ...a, bg: DARK, at: B(21 + i * 2.5) })),
  { at: B(33.5), bg: RED, render: (t) => {
    const pill = spring({ frame: Math.max(0, t - 30), fps: FPS, config: { damping: 12, stiffness: 160 } });
    return (
      <>
        <Blob t={t} color="#ff6b5b" x={880} y={380} r={200} />
        <Blob t={t} color={GOLD} x={150} y={1500} r={160} ring />
        <Rise t={t} at={2}><Big color={CREAM} size={120}>Next semester&rsquo;s Wrapped</Big></Rise>
        <Rise t={t} at={9}><Big color={CREAM} size={150} italic>looks different.</Big></Rise>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 90, opacity: Math.min(1, pill * 1.4), transform: `scale(${mix(0.85, 1, pill).toFixed(4)})` }}>
          <div style={{ padding: "30px 54px", borderRadius: 60, background: INK, color: CREAM, fontFamily: INTER, fontWeight: 700, fontSize: 44 }}>Comment your top genre</div>
        </div>
        <Rise t={t} at={18} style={{ position: "absolute", bottom: 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <Img src={staticFile("brand/campusai-logo-white.svg")} style={{ width: 340, height: 340 * (53 / 223) }} />
        </Rise>
      </>
    );
  } },
];

const PUSH = 10; // frames for one slide to shove the last one up and out
// which slide owns the top of the frame right now (it changes halfway through each push)
const onLight = (f: number) => {
  let cur = 0;
  SLIDES.forEach((s, i) => { if (f >= s.at - PUSH / 2) cur = i; });
  return SLIDES[cur].bg === GOLD || SLIDES[cur].bg === CREAM;
};

export const WrappedFilm: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  const p = (i: number) => (i >= SLIDES.length ? 0 : ramp(f, SLIDES[i].at - (i === 0 ? 0 : PUSH), i === 0 ? 1 : PUSH, EASE.swift));
  return (
    <AbsoluteFill style={{ background: DARK, overflow: "hidden" }}>
      {SLIDES.map((s, i) => {
        const pin = i === 0 ? 1 : p(i);
        const pout = p(i + 1);
        if (pin <= 0 || pout >= 1) return null;
        const y = (1 - pin) * H - pout * H;
        const t = f - s.at + (i === 0 ? 0 : 8); // content starts arriving while the slide is still pushing in
        return (
          <AbsoluteFill key={i} style={{ background: s.bg, transform: `translateY(${y.toFixed(2)}px)`, overflow: "hidden",
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 10 }}>
            {s.render(t)}
          </AbsoluteFill>
        );
      })}
      {/* the small wordmark rides the top of the joke half, so it is branded from frame 0; it goes dark on the light slides */}
      <div style={{ position: "absolute", left: 540 - 120, top: 110, width: 240, height: 240 * (53 / 223), opacity: 1 - ramp(f, B(18.5), 6, EASE.out),
        filter: onLight(f) ? "brightness(0.12)" : undefined }}>
        <Img src={staticFile("brand/campusai-logo-white.svg")} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
      <Grain opacity={0.07} blend="soft-light" />
      <Audio src={staticFile("wrapped/audio/house-vibez.mp3")} trimBefore={MUSIC_TRIM}
        volume={(fr) => 0.75 * Math.min(1, fr / 4) * Math.min(1, Math.max(0, (WRAPPED_FRAMES - fr) / 18))} />
      {CUES.map((c) => (
        <Sequence key={c.name} from={Math.max(0, Math.round(c.at))} name={c.name}>
          <Audio src={staticFile(`wrapped/audio/${c.src}`)} volume={() => c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const CUES: { at: number; src: string; volume: number; name: string }[] = [
  ...SLIDES.slice(1).map((s, i) => ({ at: s.at - PUSH, src: i % 2 ? "transition-snap.mp3" : "swoosh-quick.mp3", volume: 0.35, name: `push ${i + 1}` })),
  { at: B(19) + 8, src: "bass-hit-short.mp3", volume: 0.55, name: "with CampusAI" },
  ...ANSWERS.map((_, i) => ({ at: B(21 + i * 2.5) + 5, src: "ui-popup-dry.mp3", volume: 0.4, name: `product ${i + 1}` })),
  { at: B(33.5) + 30, src: "ui-message-pop.mp3", volume: 0.4, name: "comment pill" },
];
