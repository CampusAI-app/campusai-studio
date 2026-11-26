/**
 * PostPhoneWalk-9x16 (2026-11-26, Muse: thejimmy.vision's NestPay walkthrough, Jacob: "let's make one of these for
 * mobile"). A CampusAI post: the real CampusAI app (Nikhil's TestFlight build in the iOS simulator on its sample data,
 * captured Nov 26) is the subject, and every scene change is a move of the phone: rise, roll away, lay flat, a card
 * lifting out, the spin edge-on, chips orbiting in. Story and sources: films/post-phone-walk/brief.md and facts.md.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { INTER } from "../kit/parts";
import { useZodiak } from "../kit/parts";
import { B, Bed, Sfx, k, mix, OUT, IN, SWING, clampX } from "../kit/effects/shared";
import { Phone3D, PhoneStage, PhoneShadow, poseAt, poseBlur, ScreenPx, PressRing, PHONE_EASE, type PhonePose } from "../kit/effects/PhoneMove";
import { PillType } from "../kit/effects/PillType";
import { SPARK_D, SPARK_HOME, WORDMARK, WORDMARK_LETTERS } from "../kit/effects/DeskFlow";

export const PW = { fps: 30, frames: 780, w: 1080, h: 1920 };
const P = (n: string) => staticFile(`post-phone-walk/${n}.png`);
const PHONE_W = 560;
const DARK = B.color.bgDeep;
const LIGHT = "#F5EEEA";
const INK_DARK = "#1b1214";
const CREAM = B.color.ink;
const RED = B.color.accent;

// ---------------------------------------------------------------- timeline (frames)
const T = {
  rise: 0, l1: 0, scroll: 100, l2: 100, roll: 150, q: 192, qOut: 300, logo: 302, reveal: 340, stand: 348,
  l3: 360, push: 380, press: 424, flat: 446, l4: 462, card: 474, outline: 508, cardOut: 548, spin: 552, tick: 584,
  l5: 588, chipsIn: 640, endOut: 688, end: 700,
};

// ---------------------------------------------------------------- phone poses
const C = { x: 540, y: 1180 };
const POSES: PhonePose[] = [
  { t: -18, x: C.x, y: 2300, rx: 18, s: 1.1 },
  { t: 22, x: C.x, y: 1270, rx: 0, s: 1.18, ease: PHONE_EASE.land },
  // push in on the degree ring while the line reads
  { t: 92, x: 690, y: 1370, s: 1.45, ease: Easing.bezier(0.33, 0, 0.2, 1) },
  // back out to read the lists as they scroll
  // stay close on the lists as they scroll, so the four can be read
  { t: 118, x: 600, y: 1300, s: 1.42, ease: PHONE_EASE.land },
  { t: 150, x: 600, y: 1290, s: 1.45 },
  // tilt and roll away
  { t: 190, x: 1320, y: 1900, rz: -28, ry: 38, rx: 12, s: 0.82, ease: PHONE_EASE.leave },
  { t: T.stand - 2, x: C.x, y: 2400, rz: 0, ry: 0, rx: 30, s: 0.9 },
  // the product half: the phone stands centred
  { t: T.stand + 24, x: C.x, y: 1230, rx: 0, s: 1.0, ease: PHONE_EASE.land },
  { t: T.push, x: C.x, y: 1230, s: 1.0 },
  // push in on the Take next card
  { t: T.press - 10, x: 667, y: 1318, s: 1.6, ease: Easing.bezier(0.33, 0, 0.2, 1) },
  { t: T.flat, x: 667, y: 1318, s: 1.6 },
  // tip forward: the course list lying flat in perspective
  { t: T.flat + 26, x: 560, y: 1380, rx: 70, z: 0, s: 1.75, ease: SWING },
  { t: T.cardOut, x: 560, y: 1400, rx: 71, s: 1.72 },
  // stand back up while turning: back shown, edge-on, front
  { t: T.spin + 34, x: C.x, y: 1300, rx: 0, ry: 360, s: 0.92, ease: SWING },
  // the result: the phone sits low and big so the degree ring reads (NestPay's vault, phone low in frame)
  { t: T.tick + 10, x: 541, y: 1508, ry: 360, s: 1.5, ease: PHONE_EASE.land },
  { t: T.endOut, x: 541, y: 1520, ry: 360, s: 1.48 },
  { t: T.endOut + 22, x: 542, y: 3300, ry: 360, rx: 25, s: 1.7, ease: PHONE_EASE.leave },
];

// ---------------------------------------------------------------- screens (capture px, 1206 x 2622)
const TALL_H = 3301;
const ReqScroll: React.FC<{ f: number }> = ({ f }) => {
  const off = interpolate(f, [T.scroll, T.scroll + 44], [0, 640], { ...clampX, easing: Easing.bezier(0.45, 0, 0.2, 1) });
  return (
    <>
      <Img src={P("req-tall")} style={{ position: "absolute", left: 0, top: -off, width: 1206, height: TALL_H }} />
      {/* the status bar and the tab bar stay put while the page scrolls under them */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1206, height: 170, overflow: "hidden", opacity: off > 4 ? 1 : 0 }}>
        <Img src={P("req-geneds")} style={{ position: "absolute", left: 0, top: 0, width: 1206, height: 2622 }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 40, background: "linear-gradient(rgba(0,0,0,0), rgba(20,16,14,0.6))" }} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 2320, width: 1206, height: 302, overflow: "hidden" }}>
        <Img src={P("req-geneds")} style={{ position: "absolute", left: 0, top: -2320, width: 1206, height: 2622 }} />
      </div>
    </>
  );
};

/** The Take next screen, then the press on "Find a course" and the course list it opens. */
const TakeNext: React.FC<{ f: number }> = ({ f }) => {
  const swap = k(f, T.press + 3, T.press + 10, OUT);
  return (
    <>
      <Img src={staticFile("post-phone-walk/req-scrolled.png")} style={{ position: "absolute", inset: 0, width: 1206, height: 2622 }} />
      {/* the capture has the page scrolled under the status bar; keep the bar clean, as the app's own header does */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1206, height: 170, overflow: "hidden" }}>
        <Img src={P("req-geneds")} style={{ position: "absolute", left: 0, top: 0, width: 1206, height: 2622 }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 40, background: "linear-gradient(rgba(0,0,0,0), rgba(20,16,14,0.6))" }} />
      </div>
      <Img src={P("course-list")} style={{ position: "absolute", inset: 0, width: 1206, height: 2622, opacity: swap }} />
      <PressRing f={f} at={T.press} x={246} y={1890} size={190} />
    </>
  );
};

/** Requirements with the degree ring and the credits counting up to the captured numbers, then the capture itself. */
const RING = { cx: 240, cy: 766, r: 120, sw: 24 };
const ReqTick: React.FC<{ f: number }> = ({ f }) => {
  const p = k(f, T.tick + 4, T.tick + 50, Easing.bezier(0.25, 0.1, 0.25, 1));
  // the overlay stays to the end of the beat, landing on the captured values (51%, 61), so nothing swaps under the eye
  const live = true;
  const handOff = 1;
  const pct = Math.round(51 * p);
  const cr = Math.round(61 * p);
  const yel = k(f, T.tick + 40, T.tick + 54, OUT);
  const circ = 2 * Math.PI * RING.r;
  const g = (51 / 100) * circ * p;
  const y = (15 / 100) * circ * yel;
  return (
    <>
      <Img src={P("req-top")} style={{ position: "absolute", inset: 0, width: 1206, height: 2622 }} />
      {live ? (
        <>
          <div style={{ position: "absolute", inset: 0, opacity: handOff }}>
          <div style={{ position: "absolute", left: RING.cx - 150, top: RING.cy - 150, width: 300, height: 300, borderRadius: "50%", background: "linear-gradient(90deg, rgb(41,34,22), rgb(39,33,23))" }} />
          <div style={{ position: "absolute", left: 414, top: 700, width: 360, height: 56, background: "linear-gradient(90deg, rgb(38,32,23), rgb(33,30,26))" }} />
          <svg width={1206} height={1000} style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={RING.cx} cy={RING.cy} r={RING.r} fill="none" stroke="rgb(64,57,45)" strokeWidth={RING.sw} />
            {y > 0.5 ? (
              <circle cx={RING.cx} cy={RING.cy} r={RING.r} fill="none" stroke="rgb(255,184,28)" strokeWidth={RING.sw} strokeLinecap="round"
                strokeDasharray={`${y} ${circ}`} strokeDashoffset={-g} transform={`rotate(-90 ${RING.cx} ${RING.cy})`} />
            ) : null}
            <circle cx={RING.cx} cy={RING.cy} r={RING.r} fill="none" stroke="rgb(79,204,121)" strokeWidth={RING.sw} strokeLinecap="round"
              strokeDasharray={`${Math.max(0.01, g)} ${circ}`} transform={`rotate(-90 ${RING.cx} ${RING.cy})`} />
          </svg>
          {/* HTML, not SVG text: SVG text dropped or jumped for a frame in the render while the font settled. Inter's
              baseline sits 0.863 em below the top of a line-height 1 box, so these tops put the baselines on the capture's. */}
          <div style={{ position: "absolute", left: 88, width: 300, top: 788 - 0.8633 * 50, fontFamily: INTER, fontWeight: 600, fontSize: 50, lineHeight: 1, color: "#fff", textAlign: "center" }}><span style={{ display: "inline-block", width: "1.16em", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pct}</span>%</div>
          <div style={{ position: "absolute", left: 423, top: 750 - 0.8633 * 41.3, fontFamily: INTER, fontWeight: 600, fontSize: 41.3, lineHeight: 1, color: "#fff", whiteSpace: "nowrap" }}>{/* the final width is reserved so the line never shifts as digits arrive (Stageshow rule) */}<span style={{ display: "inline-block", width: "1.24em", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{cr}</span> of 120 credits</div>
          </div>
        </>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- words
const Words: React.FC<{ f: number; text: string; at: number; out: number; y: number; size: number; color: string; accent?: string; accentWord?: number; mode: "light" | "rise" | "blur"; align?: "left" | "center" }> = ({
  f, text, at, out, y, size, color, accent, accentWord, mode, align = "center",
}) => {
  if (f < at - 2 || f > out + 10) return null;
  const ws = text.split(" ");
  const o = 1 - k(f, out, out + 8, IN);
  return (
    <div style={{ position: "absolute", left: align === "left" ? 80 : 60, right: 60, top: y, textAlign: align, fontFamily: "Zodiak", fontWeight: 700, fontSize: size, lineHeight: 1.08, letterSpacing: "-0.02em", color, opacity: o,
      filter: f > out ? `blur(${(1 - o) * 12}px)` : undefined }}>
      {ws.map((w, i) => {
        const a = k(f, at + i * 4, at + i * 4 + 10, OUT);
        const st: React.CSSProperties =
          mode === "light" ? { opacity: 0.5 + 0.5 * a } :
          mode === "rise" ? { opacity: a, transform: `translateY(${(1 - a) * 46}px)`, display: "inline-block" } :
          { opacity: a, filter: `blur(${(1 - a) * 14}px)`, display: "inline-block" };
        return (
          <React.Fragment key={i}>
            <span style={{ ...st, color: i === accentWord ? accent : undefined, fontStyle: i === accentWord ? "italic" : undefined, fontWeight: i === accentWord ? 400 : 700 }}>{w}</span>
            {i < ws.length - 1 ? " " : ""}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- the logo build (NestPay 6.7 to 8.3 s): the spark draws on with a streak, the wordmark slides out of it
const LogoBuild: React.FC<{ f: number; at: number; cy: number; width: number; color: string; out?: number }> = ({ f, at, cy, width, color, out }) => {
  if (f < at) return null;
  const s = width / WORDMARK.w;
  const left = 540 - width / 2;
  const top = cy - (WORDMARK.h * s) / 2;
  const spark = k(f, at, at + 10, OUT);
  const slide = k(f, at + 10, at + 24, OUT);
  const streak = k(f, at + 2, at + 16, Easing.bezier(0.3, 0, 0.2, 1));
  const o = out === undefined ? 1 : 1 - k(f, out, out + 8, IN);
  // the spark starts at the centre of the frame, then slides right to its home as the letters come out behind it
  const homeX = left + SPARK_HOME.cx * s;
  const startX = 540;
  const sx = mix(startX, homeX, slide);
  const sy = mix(cy, top + SPARK_HOME.cy * s, slide);
  const size = mix(width * 0.24, SPARK_HOME.size * s, slide);
  const revealW = mix(0, width, slide);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 540 - 520 * streak, top: cy - 2, width: 1040 * streak, height: 4, borderRadius: 4, opacity: 1 - streak,
        background: `linear-gradient(90deg, rgba(255,255,255,0), ${color === "#fff" ? "rgba(255,220,225,0.95)" : "rgba(217,32,46,0.8)"}, rgba(255,255,255,0))` }} />
      <div style={{ position: "absolute", left: sx + size * 0.6 - revealW, top, width: revealW, height: WORDMARK.h * s, overflow: "hidden" }}>
        <svg width={width} height={WORDMARK.h * s} viewBox={`0 0 ${WORDMARK.w} ${WORDMARK.h}`} style={{ position: "absolute", right: 0, top: 0, transform: `translateX(${(width - revealW) * 0}px)` }}>
          {WORDMARK_LETTERS.map((L, i) => <path key={i} d={L.d} fill={color} />)}
        </svg>
      </div>
      <svg width={size} height={size} viewBox={`${SPARK_HOME.cx - SPARK_HOME.size / 2} 0 ${SPARK_HOME.size} ${SPARK_HOME.size}`}
        style={{ position: "absolute", left: sx - size / 2, top: sy - size / 2, transform: `scale(${spark}) rotate(${(1 - spark) * -120}deg)`, filter: `drop-shadow(0 0 ${18 * (1 - slide) + 6}px rgba(217,32,46,0.8))` }}>
        <path d={SPARK_D} fill={RED} />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- chips that orbit the phone and drift in (NestPay 15.1 to 18.7 s)
type Chip = { src: string; w: number; h: number; x: number; y: number; z: number; rz: number; delay: number };
const CHIPS: Chip[] = [
  { src: "chip-aosc123", w: 540, h: 211, x: 540, y: 600, z: 150, rz: -2, delay: 0 },
  { src: "chip-gened", w: 300, h: 132, x: 175, y: 1420, z: 170, rz: -6, delay: 6 },
  { src: "chip-electives", w: 300, h: 132, x: 915, y: 1010, z: -140, rz: 5, delay: 10 },
  { src: "chip-finance", w: 280, h: 151, x: 190, y: 1780, z: -160, rz: 4, delay: 14 },
  { src: "chip-core", w: 280, h: 151, x: 900, y: 1650, z: 180, rz: -5, delay: 4 },
];
const Chips: React.FC<{ f: number; phone: { x: number; y: number } }> = ({ f, phone }) => (
  <>
    {CHIPS.map((c, i) => {
      const a = k(f, T.tick + 6 + c.delay, T.tick + 26 + c.delay, OUT);
      const inK = k(f, T.chipsIn + c.delay * 2, T.chipsIn + 26 + c.delay * 2, IN);
      if (a <= 0 || inK >= 1) return null;
      const bob = Math.sin((f + i * 17) / 14) * 10;
      const x = mix(c.x, phone.x, inK);
      const y = mix(c.y + (1 - a) * 80 + bob, phone.y - 60, inK);
      const s = mix(0.86 + 0.14 * a, 0.25, inK);
      return (
        <div key={c.src} style={{ position: "absolute", left: x - c.w / 2, top: y - c.h / 2, width: c.w, height: c.h, borderRadius: 26, overflow: "hidden",
          transform: `translateZ(${mix(c.z, 40, inK)}px) rotateZ(${c.rz * (1 - inK)}deg) scale(${s})`, opacity: a * (1 - inK),
          boxShadow: "0 24px 50px rgba(60,20,24,0.28), 0 0 0 2px rgba(255,255,255,0.08)" }}>
          <Img src={P(c.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      );
    })}
  </>
);

// ---------------------------------------------------------------- the course card lifting out of the flat screen
const CARD = { w: 860, h: (860 * 440) / 1126 };
const CardLift: React.FC<{ f: number }> = ({ f }) => {
  if (f < T.card || f > T.cardOut + 14) return null;
  const up = k(f, T.card, T.card + 26, OUT);
  const out = k(f, T.cardOut - 6, T.cardOut + 6, IN);
  const line = k(f, T.outline, T.outline + 16, OUT);
  // the "Counts twice" row, in the card's own pixels (crop 1126 x 440)
  const row = { x: 10, y: 334, w: 830, h: 100 };
  const sc = CARD.w / 1126;
  const per = 2 * (row.w + row.h) * sc;
  return (
    <div style={{ position: "absolute", left: 540 - CARD.w / 2, top: mix(1250, 900, up) - CARD.h / 2 - out * 900, width: CARD.w, height: CARD.h, transformStyle: "preserve-3d",
      transform: `translateZ(${mix(0, 110, up)}px) rotateX(${mix(60, 0, up)}deg) scale(${mix(0.62, 1, up) * (1 - out * 0.3)})`, opacity: 1 - out }}>
      <div style={{ position: "absolute", inset: -26, borderRadius: 40, background: "linear-gradient(160deg, #2a2120, #1a1416)", boxShadow: "0 40px 90px rgba(80,20,28,0.35), 0 0 0 2px rgba(255,255,255,0.07)" }} />
      <Img src={P("chip-aosc123")} style={{ position: "absolute", inset: 0, width: CARD.w, height: CARD.h, borderRadius: 14 }} />
      <svg width={CARD.w} height={CARD.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={row.x * sc - 10} y={row.y * sc - 8} width={row.w * sc + 20} height={row.h * sc + 16} rx={16} fill="none" stroke={RED} strokeWidth={5}
          strokeDasharray={`${per * line} ${per + 200}`} />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------- the film
export const PhoneWalk: React.FC = () => {
  useZodiak();
  const f = useCurrentFrame();
  const pose = poseAt(POSES, f);
  const blur = poseBlur(POSES, f, 0.05, 10);

  const screen =
    f < T.stand ? <ReqScroll f={f} /> :
    f < T.spin + 17 ? <TakeNext f={f} /> :
    <ReqTick f={f} />;

  // the ground: dark for the problem, flipping to light from the logo's spark (NestPay 8.7 s)
  const rev = k(f, T.reveal, T.reveal + 10, Easing.bezier(0.7, 0, 0.3, 1));
  const light = f >= T.reveal;
  const phoneBehindCard = f >= T.card && f < T.cardOut + 10 ? k(f, T.card, T.card + 20) * (1 - k(f, T.cardOut, T.cardOut + 10)) : 0;

  return (
    <AbsoluteFill style={{ background: DARK, overflow: "hidden" }}>
      {/* dark ground with the product's red light from below */}
      <AbsoluteFill style={{ background: `radial-gradient(120% 60% at 50% 108%, rgba(${B.color.glowRgb},0.42), rgba(${B.color.glowRgb},0) 62%), radial-gradient(80% 40% at 50% -5%, rgba(120,70,40,0.18), rgba(0,0,0,0) 70%), ${DARK}` }} />
      {light ? (
        <AbsoluteFill style={{ clipPath: `circle(${(rev * 2400).toFixed(0)}px at 805px 908px)`,
          background: `radial-gradient(110% 55% at 50% 112%, rgba(${B.color.glowRgb},0.22), rgba(${B.color.glowRgb},0) 65%), radial-gradient(70% 40% at 80% 0%, rgba(255,190,170,0.45), rgba(255,255,255,0) 70%), ${LIGHT}` }} />
      ) : null}

      {/* the held mark, top, so the brand is there inside two seconds */}
      {f < T.q ? (
        <div style={{ position: "absolute", left: 540 - 105, top: 110, width: 210, opacity: k(f, 4, 16) * (1 - k(f, T.roll + 20, T.roll + 34)) * 0.92 }}>
          <Img src={staticFile(B.logo!.onDark)} style={{ width: "100%" }} />
        </div>
      ) : null}

      {/* words */}
      <Words f={f} text="61 credits in at Maryland." at={T.l1} out={T.l2 - 8} y={250} size={92} color={CREAM} accent={RED} accentWord={0} mode="light" />
      <Words f={f} text="Four lists still open." at={T.l2} out={T.q - 12} y={240} size={72} color={CREAM} mode="rise" align="left" />
      {f >= T.q && f < T.qOut + 10 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 760, transform: `scale(${interpolate(f, [T.q, T.qOut + 8], [0.96, 1.08], clampX)})` }}>
          <PillType f={f} at={T.q} runs={[{ text: "What if one class" }, { text: "counted " }, { text: "twice", pill: true }, { text: "?" }]} breaks={[1]}
            size={112} font="Zodiak" ink={CREAM} pillBg={RED} pillInk="#fff" italicPill speed={1.0} out={T.qOut} />
        </div>
      ) : null}
      <LogoBuild f={f} at={T.logo} cy={960} width={560} color="#fff" out={T.reveal - 6} />
      <Words f={f} text="It shows what to take next." at={T.l3} out={T.l4 - 10} y={170} size={74} color={INK_DARK} accent={RED} accentWord={4} mode="rise" align="left" />
      <Words f={f} text="AOSC123 counts for both." at={T.l4} out={T.cardOut - 4} y={200} size={92} color={INK_DARK} accent={RED} accentWord={2} mode="blur" align="left" />
      <Words f={f} text="Your whole degree, counted." at={T.l5} out={T.endOut - 6} y={150} size={100} color={INK_DARK} accent={RED} accentWord={3} mode="light" />

      {/* the phone */}
      {f < T.endOut + 24 && (f < T.q || f >= T.stand - 2) ? (
        <>
          {f >= T.stand ? <PhoneShadow pose={pose} width={PHONE_W} opacity={0.22 * (1 - phoneBehindCard)} color="70,20,25" /> : null}
          {/* opacity sits on the flat outer layer: on a preserve-3d layer it would flatten the phone's perspective */}
          <PhoneStage blur={blur + phoneBehindCard * 5} style={{ opacity: 1 - phoneBehindCard * 0.35 }}>
            <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
              <Phone3D width={PHONE_W} pose={pose} screen={<ScreenPx width={PHONE_W}>{screen}</ScreenPx>} />
              {f >= T.tick ? <Chips f={f} phone={pose} /> : null}
            </div>
          </PhoneStage>
        </>
      ) : null}
      <PhoneStage>
        <CardLift f={f} />
      </PhoneStage>

      {/* the end: the mark returns, the wordmark slides out of it */}
      <AbsoluteFill style={{ transform: `scale(${interpolate(f, [T.end + 30, PW.frames], [1, 1.035], clampX)})` }}>
        <LogoBuild f={f} at={T.end} cy={900} width={600} color={INK_DARK} />
      {f >= T.end + 26 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1010, textAlign: "center", fontFamily: INTER, color: "#5b4a4c", opacity: k(f, T.end + 26, T.end + 40),
          transform: `translateY(${(1 - k(f, T.end + 26, T.end + 40)) * 20}px)` }}>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.01em" }}>Building the CampusAI app.</div>
          <div style={{ fontSize: 34, fontWeight: 500, marginTop: 14, color: RED }}>campusai.app</div>
        </div>
      ) : null}
      </AbsoluteFill>

      {/* sound: music bed plus a licensed cue on every move */}
      <Bed total={PW.frames} on volume={0.62} />
      <Sfx on at={0} name="air-woosh-quick" volume={0.68} />
      <Sfx on at={T.roll + 4} name="transition-soft" volume={0.77} />
      <Sfx on at={T.q + 2} name="typewriter-hit-soft" volume={0.51} />
      <Sfx on at={T.q + 18} name="typewriter-hit-soft" volume={0.51} />
      <Sfx on at={T.logo} name="bass-hit-short" volume={0.94} />
      <Sfx on at={T.reveal} name="swoosh-slow" volume={0.68} />
      <Sfx on at={T.press} name="switch-tap" volume={0.95} />
      <Sfx on at={T.flat} name="swoosh-slow" volume={0.59} />
      <Sfx on at={T.card} name="paper-slide" volume={0.85} />
      <Sfx on at={T.outline} name="marker-pen-line" volume={0.68} />
      <Sfx on at={T.spin + 4} name="air-woosh-quick" volume={0.85} />
      <Sfx on at={T.tick + 4} name="counter" volume={0.59} />
      <Sfx on at={T.end} name="bass-hit-short" volume={0.85} />
    </AbsoluteFill>
  );
};
