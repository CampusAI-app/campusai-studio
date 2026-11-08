/**
 * /day-counter (2026-11-08, name from Gian Angioletti's "30 Claude animations" reel via Muse; prompts gated, our own
 * build). A number of days between two real dates, counted on an odometer: each digit is a reel that rolls, the low
 * digits blurring past while the high ones tick over. Under it a day strip runs, one tick per day, the camera riding
 * along it, and the dates that matter pop up as flags as the count passes them. The count is worked out from the two
 * dates, never typed in, so it cannot disagree with them.
 */
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR, readHold } from "../system/motion";
import { loadFont } from "@remotion/google-fonts/Oswald";
import { Cue, clamp, ramp } from "./common";
import { World } from "./world";

const { fontFamily: OSWALD } = loadFont("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });
// rebuilt 11/08 as its own world: a cream desk-calendar page, the count in big red Oswald, ink in a deep oxblood
const PAPER_G = "#F3E5D4";
const INK = "#2A0A0C";
const SOFT = "#8C4A42";
const ACCENT = "#D9202E";

export type DayCounterProps = {
  title: string;
  /** ISO dates, e.g. "2026-08-31". */
  from: { label: string; date: string };
  to: { label: string; date: string };
  /** Dates in between that matter, each flagged as the count passes it. */
  marks: { label: string; date: string }[];
  /** The word under the number. */
  unit: string;
  source: string;
  cta?: string;
};

const COUNT_FROM = 14;
const COUNT_TO = 150; // motion: the count runs 4.5 s so every flag gets its moment
const FPS = 30;
const DAY = 86400000;
const days = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DAY);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const short = (iso: string) => { const d = new Date(`${iso}T12:00:00Z`); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`; };

export const counterEnd = (p: DayCounterProps) => COUNT_TO + 8 + DUR.travel + Math.round((readHold(`${p.title} ${p.unit}`) + 0.4) * FPS);

/** One odometer reel. `v` is the continuous value of this digit's place (e.g. 104.6 / 10 for the tens). */
const Reel: React.FC<{ v: number; h: number; w: number; color: string }> = ({ v, h, w, color }) => {
  const settled = Math.floor(v);
  const frac = v - settled;
  // A digit only moves while the place below it is rolling over, the way a real odometer carries.
  const y = -(settled % 10 + frac) * h;
  return (
    <div style={{ width: w, height: h, overflow: "hidden", position: "relative",
      WebkitMaskImage: "linear-gradient(transparent, #000 8%, #000 92%, transparent)", maskImage: "linear-gradient(transparent, #000 8%, #000 92%, transparent)" }}>
      <div style={{ position: "absolute", top: y, left: 0, width: w }}>
        {[...Array(11)].map((_, i) => (
          <div key={i} style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: OSWALD, fontWeight: 700,
            fontSize: h * 0.92, lineHeight: 1, color, letterSpacing: "-0.03em" }}>{i % 10}</div>
        ))}
      </div>
    </div>
  );
};

export const DayCounter: React.FC<DayCounterProps> = (p) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const total = days(p.from.date, p.to.date);
  const end = counterEnd(p);
  const t = interpolate(f, [COUNT_FROM, COUNT_TO], [0, total], { ...clamp, easing: CURVE.quiet.standard });
  const digits = String(total).length;
  const h = Math.min(420, (width - 160) / digits / 0.62);
  const w = h * 0.6;
  const done = ramp(f, COUNT_TO, COUNT_TO + 12, CURVE.showy.enter);
  // the strip: one tick per day, the current day held at the centre
  // While counting, the camera rides the strip with today held at the centre; once it lands, it pulls back to the
  // whole range so every flag can be read at once.
  const pxRide = Math.max(14, Math.min(40, (width * 3) / total));
  const pxFit = (width - 200) / total;
  const pull = ramp(f, COUNT_TO + 8, COUNT_TO + 8 + DUR.travel, CURVE.quiet.standard);
  const px = pxRide + (pxFit - pxRide) * pull;
  const stripY = height * 0.64;
  const offset = (width / 2 - t * pxRide) * (1 - pull) + 100 * pull;
  const flagged = [{ label: p.from.label, d: 0 }, ...p.marks.map((m) => ({ label: m.label, d: days(p.from.date, m.date), date: m.date })), { label: p.to.label, d: total }];
  return (
    <World endAt={end} ground={`repeating-linear-gradient(0deg, rgba(42,10,12,.05) 0 2px, transparent 2px 64px), radial-gradient(ellipse at 50% 30%, #FBF1E6, ${PAPER_G} 70%, #E6CDB6)`}
      ink="#FBE9DA" logo="dark" endLogo="white" logoSpot="top-right" font={OSWALD} fontWeight={700} cta={p.cta} end="iris" endGround={ACCENT}>
      {/* the page's binding: the rings of a desk calendar, and the title written under them */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 70, background: ACCENT }} />
      {[...Array(6)].map((_, i) => <div key={i} style={{ position: "absolute", top: 40, left: 90 + i * 112, width: 26, height: 60, borderRadius: 13, background: "#3a1012", boxShadow: "inset 0 -6px 0 rgba(255,255,255,.15)" }} />)}
      <div style={{ position: "absolute", left: 64, right: 64, top: 190, fontFamily: OSWALD, fontWeight: 700, fontSize: 76, lineHeight: 1, color: INK, letterSpacing: "-0.01em",
        opacity: ramp(f, 2, 14) }}>{p.title}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.25, display: "flex", justifyContent: "center",
        transform: `scale(${(1 + done * 0.04 - ramp(f, COUNT_TO + 8, COUNT_TO + 22) * 0.04).toFixed(4)})` }}>
        {[...Array(digits)].map((_, i) => {
          const place = 10 ** (digits - 1 - i);
          // carry: this place rolls only during the last tenth of the place below it
          const below = t / place;
          const whole = Math.floor(below);
          const lower = place === 1 ? below - whole : ((t % place) / place);
          const ease = (x: number) => x * x * (3 - 2 * x); // rests on whole digits, moves between them
          const carry = place === 1 ? ease(lower) : ease(Math.max(0, (lower - 0.9) / 0.1));
          return <Reel key={i} v={whole + carry} h={h} w={w} color={ACCENT} />;
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.25 + h + 10, textAlign: "center", fontFamily: OSWALD, fontWeight: 500, fontSize: 42, color: SOFT }}>
        {p.unit}
      </div>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {[...Array(total + 1)].map((_, d) => {
          const x = offset + d * px;
          if (x < -40 || x > width + 40) return null;
          const passed = d <= t;
          const flag = flagged.some((m) => m.d === d);
          return <line key={d} x1={x} x2={x} y1={stripY - (flag ? 46 : 18)} y2={stripY + (flag ? 46 : 18)} stroke={passed ? (flag ? ACCENT : INK) : INK}
            strokeOpacity={passed ? (flag ? 1 : 0.85) : 0.22} strokeWidth={flag ? 5 : 3} strokeLinecap="round" />;
        })}
        <line x1={0} x2={width} y1={stripY} y2={stripY} stroke={INK} strokeOpacity={0.12} strokeWidth={2} />
      </svg>
      {(() => {
        // each flag gets a row (above or below the strip, then a second level of each) so no two labels overlap at
        // the pulled-back framing; a label near an edge is slid inward and keeps a thin leader to its tick
        const lab = flagged.map((m) => Math.max(150, m.label.length * 23));
        const fitX = flagged.map((m) => 100 + m.d * pxFit);
        const levels = [-1, 1, -2, 2];
        const used: { lvl: number; a: number; b: number }[] = [];
        const lvlOf = flagged.map((_, i) => {
          const c = Math.min(width - 40 - lab[i] / 2, Math.max(40 + lab[i] / 2, fitX[i]));
          const lvl = levels.find((L) => !used.some((u) => u.lvl === L && !(c + lab[i] / 2 + 24 < u.a || c - lab[i] / 2 - 24 > u.b))) ?? 1;
          used.push({ lvl, a: c - lab[i] / 2, b: c + lab[i] / 2 });
          return lvl;
        });
        return flagged.map((m, i) => {
          // the frame the count actually passes this day, read off the same eased curve
          let hit = COUNT_FROM;
          for (let k = COUNT_FROM; k <= COUNT_TO; k++) { if (interpolate(k, [COUNT_FROM, COUNT_TO], [0, total], { ...clamp, easing: CURVE.quiet.standard }) >= m.d) { hit = k; break; } }
          const k = ramp(f, hit, hit + 10, CURVE.showy.enter);
          const tick = offset + m.d * px;
          const cx = Math.min(width - 40 - lab[i] / 2, Math.max(40 + lab[i] / 2, tick));
          // fade at the frame edge while riding, and dip out during the pull back so labels never cross mid-move
          const edge = (Math.min(1, Math.max(0, (Math.min(tick, width - tick) + 20) / 120)) * (1 - pull) + pull) * (pull < 0.05 || pull > 0.95 ? 1 : 0);
          const lvl = lvlOf[i];
          const up = lvl < 0;
          const y = up ? stripY - 70 - Math.abs(lvl) * 88 : stripY + 70 + (Math.abs(lvl) - 1) * 88;
          return (
            <React.Fragment key={i}>
              <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: k * edge }}>
                <line x1={tick} x2={cx} y1={up ? stripY - 50 : stripY + 50} y2={up ? y + 76 : y - 6} stroke={ACCENT} strokeOpacity={0.6} strokeWidth={2} />
              </svg>
              <div style={{ position: "absolute", left: cx - lab[i] / 2 - 20, width: lab[i] + 40, top: y, textAlign: "center", opacity: k * edge,
                transform: `translateY(${(1 - k) * (up ? 16 : -16)}px)` }}>
                <div style={{ fontFamily: OSWALD, fontWeight: 700, fontSize: 42, color: INK, lineHeight: 1.1, whiteSpace: "nowrap" }}>{m.label}</div>
                <div style={{ fontFamily: OSWALD, fontSize: 32, color: SOFT, marginTop: 2 }}>{short(i === 0 ? p.from.date : i === flagged.length - 1 ? p.to.date : (m as { date: string }).date)}</div>
              </div>
            </React.Fragment>
          );
        });
      })()}
      <div style={{ position: "absolute", left: 64, right: 64, top: height * 0.8, fontFamily: OSWALD, fontSize: 34, color: INK, textAlign: "center",
        opacity: ramp(f, COUNT_TO + 10, COUNT_TO + 22) }}>{p.source}</div>
      <Cue at={COUNT_FROM} name="counter" volume={0.3} />
      <Cue at={COUNT_FROM + 40} name="counter" volume={0.22} />
      <Cue at={COUNT_TO} name="bass-hit-short" volume={0.6} />
    </World>
  );
};
