/**
 * The honest campus tour (UMD student episode 5, 2026-11-05). A new format, Jacob's pick: drawn over real campus.
 * Real phone footage of UMD is the ground; the guide, the tour group's hands, the bubbles, the sticky notes and the
 * tally are drawn on top under the /pov-doodle boil. The guide walks backwards through every cut (the carrier), each
 * stop adds a question he cannot answer, he trips at the third, asks CampusAI, and the REAL chat answers.
 *
 * Footage is a prop. A stop with no file renders a grey stand-in that names the clip it needs, so the film can be
 * timed and reviewed before anyone shoots. Brief, facts and shot list: Content/video-studio/films/honest-tour/.
 */
import React from "react";
import { loadFont } from "@remotion/google-fonts/Caveat";
import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR } from "../system/motion";
import { Clip, Cue, INTER, PAPER, PRINT, RED, ZODIAK, clamp, ramp } from "../styles/common";
import { Peep, type FaceName } from "../styles/peeps/Peep";
import { DrawnAsk, askFrames, type DrawnAskSpec } from "../styles/DrawnChat";
import { RecShot, recFrame, type AnswerRec } from "../styles/PovDoodle";
import tourChat from "../../public/honest-tour/chat/frames.json";

const { fontFamily: HAND } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export type Stop = {
  /** The tag at the top, e.g. "Stop 1" and the building. The Mall opening has no number. */
  tag?: string;
  place: string;
  /** public/ path of the clip, or nothing for the grey stand-in. */
  footage?: string;
  /** What to film there, written on the stand-in. */
  shoot: string;
  /** The tour group's question; none for the opening. */
  q?: string;
  /** The guide's line. */
  say: string;
  /** Frames this stop lasts. */
  len: number;
};

export type HonestTourProps = {
  stops: Stop[];
  /** What the tally counts. */
  tally: string;
  /** What he says as he gives up and opens CampusAI. */
  ask: string;
  closer: string;
};

export const HONEST_TOUR: HonestTourProps = {
  stops: [
    { place: "McKeldin Mall", shoot: "McKeldin Mall, walking backwards", say: "Welcome to Maryland!", len: 90 },
    { tag: "Stop 1", place: "McKeldin Library", shoot: "McKeldin Library, walking backwards", q: "Which floor is actually quiet?", say: "Great question!", len: 150 },
    { tag: "Stop 2", place: "Stamp Student Union", shoot: "Stamp, walking backwards", q: "How do I find a club that isn't 300 people?", say: "Also great.", len: 150 },
    { tag: "Stop 3", place: "Van Munching Hall", shoot: "Van Munching, walking backwards, 25 s", q: "If I drop a class now, does it tank my GPA?", say: "Uh.", len: 170 },
  ],
  tally: "Couldn't answer",
  ask: "Okay. Asking CampusAI.",
  closer: "Any other questions?",
};

// ---- the answer: the drawn composer (the real empty chat greets "Hi Maya", and he is not Maya), then the real chat
const ASK: DrawnAskSpec = { kind: "ask", question: "if I drop a class now does it tank my GPA", charMs: 30 };
const REC: AnswerRec = {
  dir: "honest-tour/chat",
  rec: tourChat,
  x0: 0,
  // from the send to just after the answer finishes (marks: send 3.29, done 7.96); the finished answer holds ~1 s
  segs: [{ from: 3.3, to: 8.9, speed: 1 }],
  // css px: inside the drawn card (1016 wide). Starts at the question bubble, under the header bar, its right edge
  // whole; 1.32 keeps body text near 35 px; the card ends above the follow-up chips; still
  cam: [[3.3, 126, 140, 1.29], [8.9, 126, 140, 1.29]],
  pointer: { from: 98, to: 99 }, // the chat recording has no pointer
  landed: 7.9,
};
const ASK_F = askFrames(ASK);
const REC_F = Math.round(REC.segs.reduce((s, g) => s + (g.to - g.from) / g.speed, 0) * 30);
const BOX_IN = 20; // the pile sweeps and he says the line, then the product rises (round 2: 30 left an empty beat)
/** The product opens on the composer already settled and typing starts at once (round 1: an empty first frame). */
const ASK_SKIP = 22;
const BOX_HOLD = 18;
const CLOSER = 116;
/** The drawn card the product sits in (round 3, Jacob on the full-width slab: "does not look good"). It hugs the
 * composer while he types, then grows to fit the answer when the real chat takes over. */
const CARD = { x: 32, askTop: 560, askH: 420, top: 300, h: 940 };

const stopStarts = (p: HonestTourProps) => p.stops.reduce<number[]>((a, s, i) => [...a, i === 0 ? 0 : a[i - 1] + p.stops[i - 1].len], []);
const tourEnd = (p: HonestTourProps) => p.stops.reduce((n, s) => n + s.len, 0);
export const honestEnd = (p: HonestTourProps) => tourEnd(p) + BOX_IN + ASK_F - ASK_SKIP + REC_F + BOX_HOLD + CLOSER;

// ---- per-stop beats (frames into the stop)
const HAND_UP = 6;
const Q_IN = 12;
const SAY_IN = 64;
const TO_PILE = 72;
const TICK = 84;
const TRIP = 100;

const Boil: React.FC<{ f: number }> = ({ f }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id="tour-boil" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={Math.floor(f / 4) % 7} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={5} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

/** The ground: the real clip, or a grey stand-in that says what to film. */
const Ground: React.FC<{ s: Stop; dim: number }> = ({ s, dim }) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  return (
    <AbsoluteFill style={{ filter: dim > 0 ? `blur(${dim * 6}px)` : undefined, overflow: "hidden" }}>
      {s.footage ? (
        <OffthreadVideo src={staticFile(s.footage)} muted style={{ width: W, height: H, objectFit: "cover" }} />
      ) : (
        <AbsoluteFill style={{ background: `linear-gradient(${170 + Math.sin(f / 40) * 6}deg, #8d8a86 0%, #b9b5af 45%, #9a968f 100%)` }}>
          {/* slow drifting bands so the stand-in reads as a walk, not a still */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ position: "absolute", left: 0, right: 0, top: ((i * 420 + f * 3) % (H + 400)) - 200, height: 140, background: "rgba(255,255,255,0.07)" }} />
          ))}
          <div style={{ position: "absolute", left: 560, top: 1090, width: 440, padding: "18px 22px", border: "3px dashed rgba(20,14,16,0.45)", borderRadius: 16,
            fontFamily: INTER, fontWeight: 600, fontSize: 30, lineHeight: 1.25, color: "rgba(20,14,16,0.62)" }}>
            Footage here: {s.shoot}
          </div>
        </AbsoluteFill>
      )}
      {/* light enough that the card's ink edge and shadow still read (round 3: 0.58 swallowed them) */}
      <AbsoluteFill style={{ background: `rgba(14,9,10,${0.3 * dim})` }} />
    </AbsoluteFill>
  );
};

/** A hand-drawn speech bubble with its tail. */
const Bubble: React.FC<{ x: number; y: number; w: number; k: number; tail: "left" | "down"; size?: number; children: React.ReactNode; rot?: number }> = ({
  x, y, w, k, tail, size = 58, children, rot = -2,
}) =>
  k <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: interpolate(k, [0, 0.3], [0, 1], clamp),
      transform: `scale(${(0.7 + 0.3 * k).toFixed(4)}) rotate(${rot}deg)`, transformOrigin: tail === "left" ? "0% 80%" : "80% 100%" }}>
      <div style={{ position: "relative", padding: "20px 28px", background: PAPER, border: `5px solid ${PRINT}`, borderRadius: "28px 34px 26px 36px",
        boxShadow: `6px 8px 0 ${PRINT}`, fontFamily: HAND, fontSize: size, lineHeight: 1.02, color: PRINT }}>
        {children}
        <svg width={60} height={50} style={{ position: "absolute", overflow: "visible", ...(tail === "left" ? { left: -46, bottom: 18 } : { right: 70, bottom: -44 }) }}>
          {tail === "left" ? (
            <path d="M48 4 L4 34 L48 30" fill={PAPER} stroke={PRINT} strokeWidth={5} strokeLinejoin="round" />
          ) : (
            <path d="M8 2 L40 44 L40 2" fill={PAPER} stroke={PRINT} strokeWidth={5} strokeLinejoin="round" />
          )}
        </svg>
      </div>
    </div>
  );

/** A raised hand from the tour group, drawn from the bottom edge; with `phone`, it is holding one. */
const RaisedHand: React.FC<{ x: number; k: number; phone?: boolean; tilt?: number; scale?: number; tipY?: number }> = ({ x, k, phone, tilt = 0, scale = 1.35, tipY = 1340 }) => {
  const { height: H } = useVideoConfig();
  // heavier ink and a dark sleeve (round 1: the thin beige hands would get lost over busy footage)
  const line = { stroke: PRINT, strokeWidth: 8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const top = tipY - 24 * scale + (1 - k) * (H - tipY + 120);
  return k <= 0 ? null : (
    <svg width={220 * scale} height={560 * scale} viewBox="0 0 220 560" style={{ position: "absolute", left: x, top, overflow: "visible", transform: `rotate(${tilt}deg)`, transformOrigin: "50% 100%" }}>
      {/* sleeve and forearm */}
      <path d="M70 560 L84 250 L140 250 L156 560 Z" fill="#3b3033" {...line} />
      <path d="M86 250 L94 180 L136 180 L140 250" fill={PAPER} {...line} />
      {phone ? (
        <>
          <path d="M82 190 C 70 150, 80 120, 96 118 L 140 118 C 156 120, 160 150, 148 190 Z" fill={PAPER} {...line} />
          <rect x={78} y={24} width={78} height={140} rx={14} fill={PRINT} {...line} transform="rotate(-6 117 94)" />
          <rect x={90} y={44} width={54} height={96} rx={6} fill="#2a1a1d" transform="rotate(-6 117 94)" />
          <path d="M98 76 H134 M98 92 H126" stroke={RED} strokeWidth={6} strokeLinecap="round" transform="rotate(-6 117 94)" />
        </>
      ) : (
        <path
          d="M92 186 C 84 150, 84 120, 90 96 C 92 70, 104 70, 106 96 L 108 60 C 110 34, 124 34, 124 60 L 126 64 C 128 40, 142 40, 142 66 L 142 96 C 146 78, 160 80, 158 104 L 152 150 C 150 170, 144 182, 140 188 Z"
          fill={PAPER} {...line} />
      )}
    </svg>
  );
};

export const HonestTour: React.FC<HonestTourProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const starts = stopStarts(p);
  const TOUR = tourEnd(p);
  const END = honestEnd(p);
  const si = Math.max(0, starts.filter((s) => s <= f).length - 1);
  const stop = p.stops[si];
  const t = f - starts[si]; // frames into this stop
  const qs = p.stops.map((s, i) => ({ s, i })).filter((x) => x.s.q);
  const tickAt = (i: number) => starts[i] + TICK;
  const pileAt = (i: number) => starts[i] + TO_PILE;
  const tripIdx = p.stops.length - 1;
  const tripAt = starts[tripIdx] + TRIP;

  // the answer box and the closer
  const boxAt = TOUR + BOX_IN;
  const askFrom = boxAt - ASK_SKIP; // the composer is already settled as it rises
  const recAt = askFrom + ASK_F; // the real chat takes over at the send
  const closeAt = recAt + REC_F + BOX_HOLD;
  const inBox = f >= TOUR && f < closeAt + 10;
  const dim = ramp(f, TOUR, TOUR + DUR.travel * 0.6, CURVE.quiet.standard) * (1 - ramp(f, closeAt, closeAt + DUR.arrive, CURVE.quiet.standard));
  const swept = ramp(f, TOUR, TOUR + DUR.travel * 0.6, CURVE.showy.exit);
  const makeRoom = dim;

  // the tally: one per question he could not answer, and one off when CampusAI answers his (round 1: dropping to 0
  // implied all three were answered; only the GPA one was)
  const grinAt = recAt + recFrame(REC, REC.landed);
  const phonesAt = [closeAt + 30, closeAt + 42, closeAt + 54];
  const unanswered = qs.filter((x) => f >= tickAt(x.i)).length - (f >= grinAt ? 1 : 0);
  const lastTick = [...qs.map((x) => tickAt(x.i)), grinAt].filter((a) => a <= f).pop() ?? -99;
  const pop = 1 + 0.2 * (1 - ramp(f, lastTick, lastTick + 8, CURVE.quiet.standard));

  // his face gets worse with each question, calms on the chat, grins when it lands
  const asked = qs.filter((x) => f >= starts[x.i] + Q_IN).length;
  const face: FaceName =
    f >= closeAt ? "SmileLol" : f >= grinAt ? "SmileBig" : f >= TOUR ? "Calm" : f >= tripAt ? "EyesClosed" : (["SmileTeeth", "Concerned", "ConcernedFear", "Fear"] as FaceName[])[asked];

  // walking backwards: a step bob, a small sway; the trip tips him back and down and he stays down till the chat
  const bob = Math.abs(Math.sin(f / 8)) * -14;
  const sway = Math.sin(f / 16) * 1.6;
  const trip = spring({ frame: f - tripAt, fps, config: { damping: 9, stiffness: 160 } }) * (1 - ramp(f, TOUR, TOUR + DUR.arrive, CURVE.quiet.standard));
  // the hook (round 1: "never walks in backwards"): he backs into frame from the left inside the first half second
  const walkIn = spring({ frame: f, fps, config: { damping: 15, stiffness: 120 } });

  const guideX = -70 + 20 * makeRoom;
  const guideY = H * 0.43 + bob * (1 - makeRoom) + makeRoom * (1290 - H * 0.43);
  const guideScale = 1 - 0.4 * makeRoom;

  // stop tag
  const tagK = stop.tag ? ramp(t, 2, 2 + DUR.arrive, CURVE.quiet.enter) * (1 - makeRoom) : 0;
  const closerK = ramp(f, closeAt + 8, closeAt + 8 + DUR.arrive, CURVE.showy.enter);

  return (
    <Clip endAt={END} light>
      {/* the real place: one cut per stop; the last stop's clip runs under the chat and the close */}
      {p.stops.map((s, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={i === p.stops.length - 1 ? END - starts[i] + 40 : s.len} layout="none">
          <Ground s={s} dim={i === p.stops.length - 1 ? dim : 0} />
        </Sequence>
      ))}
      <Boil f={f} />
      <AbsoluteFill style={{ filter: "url(#tour-boil)", overflow: "hidden" }}>
        {/* stop tag, top left under the held logo */}
        {stop.tag ? (
          <div style={{ position: "absolute", left: 60, top: 200, padding: "14px 26px 16px", background: PAPER, border: `5px solid ${PRINT}`, borderRadius: "14px 20px 12px 22px",
            boxShadow: `6px 8px 0 ${PRINT}`, transform: `rotate(-3deg) translateY(${(1 - tagK) * -30}px)`, opacity: tagK }}>
            <div style={{ fontFamily: HAND, fontSize: 40, color: RED, lineHeight: 1 }}>{stop.tag}</div>
            <div style={{ fontFamily: ZODIAK, fontWeight: 700, fontSize: 48, color: PRINT, lineHeight: 1.05, letterSpacing: "-0.015em" }}>{stop.place}</div>
          </div>
        ) : null}

        {/* the tally, top right */}
        {f >= tickAt(qs[0].i) - 10 ? (
          <div style={{ position: "absolute", right: 56, top: 206, padding: "10px 22px", background: PAPER, border: `5px solid ${PRINT}`, borderRadius: "18px 12px 20px 14px",
            boxShadow: `5px 7px 0 ${PRINT}`, fontFamily: HAND, fontSize: 44, color: PRINT, transform: "rotate(2deg)", textAlign: "center",
            opacity: ramp(f, tickAt(qs[0].i) - 10, tickAt(qs[0].i)) * (1 - (inBox ? makeRoom : 0)) }}>
            {p.tally}
            <div style={{ color: RED, fontSize: 92, lineHeight: 0.95, transform: `scale(${pop.toFixed(3)})` }}>{Math.max(0, unanswered)}</div>
          </div>
        ) : null}

        {/* the pile: every question he could not answer, pinned up the right side, swept off when he asks */}
        {qs.map(({ s, i }, n) => {
          const at = pileAt(i);
          if (f < at || f > TOUR + 26) return null; // gone once swept, or the carry into the logo shows it in flight
          const k = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 140 } });
          const off = swept * (W * 1.1 + n * 60);
          const x0 = 600, y0 = 1330, x1 = 650 + (n % 2) * 20, y1 = 440 + n * 150;
          return (
            <div key={i} style={{ position: "absolute", left: x0 + (x1 - x0) * k, top: y0 + (y1 - y0) * k, width: 380, padding: "18px 22px",
              background: n === qs.length - 1 ? "#fff6c9" : "#fffdf8", border: `5px solid ${PRINT}`, borderRadius: "14px 22px 12px 26px", boxShadow: `6px 8px 0 ${PRINT}`,
              fontFamily: HAND, fontSize: 40, lineHeight: 1, color: PRINT, transform: `translateX(${off}px) rotate(${(n % 2 ? 4 : -5) + swept * 40}deg) scale(${0.85 + 0.15 * k})`,
              transformOrigin: "left top" }}>{s.q}</div>
          );
        })}

        {/* the guide, walking backwards */}
        <div style={{ position: "absolute", left: guideX, top: guideY, transform: `scale(${guideScale.toFixed(4)})`, transformOrigin: "0 0" }}>
          <div style={{ transform: `translateX(${((1 - walkIn) * -560).toFixed(2)}px) rotate(${(sway * (1 - makeRoom) - 16 * trip).toFixed(3)}deg) translateY(${(trip * 50).toFixed(2)}px)`,
            transformOrigin: "30% 100%" }}>
            <Peep face={face} body="Paper" hair="Twists" glasses="GlassRound" ink={PRINT} fill={PAPER} width={W * 0.72} />
          </div>
        </div>

        {/* his line at this stop */}
        {f < TOUR ? (
          <Bubble x={530} y={stop.q ? 860 : 820} w={470} tail="left" size={stop.say.length < 6 ? 84 : 58}
            k={stop.q ? spring({ frame: t - SAY_IN, fps, config: { damping: 12, stiffness: 160 } }) * (1 - ramp(t, stop.len - 8, stop.len))
              : spring({ frame: t - 2, fps, config: { damping: 12, stiffness: 160 } }) * (1 - ramp(t, stop.len - 8, stop.len))}>
            {stop.say}
          </Bubble>
        ) : null}

        {/* the tour group: a hand shoots up, then the question; on the Mall the hand is the "any questions?" */}
        {f < TOUR ? (
          <>
            <RaisedHand x={790} tilt={6} tipY={stop.q ? 1530 : 1240} k={spring({ frame: t - (stop.q ? HAND_UP : 16), fps, config: { damping: 10, stiffness: 170 } }) * (1 - ramp(t, stop.len - 10, stop.len))} />
            {stop.q && t < TO_PILE + 2 ? (
              <Bubble x={470} y={1290} w={560} tail="down" size={50} rot={2}
                k={spring({ frame: t - Q_IN, fps, config: { damping: 12, stiffness: 150 } }) * (1 - ramp(t, TO_PILE - 4, TO_PILE + 2))}>
                {stop.q}
              </Bubble>
            ) : null}
          </>
        ) : null}

        {/* the close: everyone's hand is up, and every hand is holding a phone */}
        {f >= closeAt ? (
          <>
            <Bubble x={530} y={820} w={470} tail="left" size={58} k={closerK}>{p.closer}</Bubble>
            {/* round 1: the phones sat in the bottom 15%, under the app's caption; now they land at 60 to 70% height */}
            {phonesAt.map((a, i) => (
              <RaisedHand key={i} x={[480, 650, 805][i]} tilt={[-8, 3, 9][i]} scale={1.55} tipY={[1330, 1200, 1300][i]} phone k={spring({ frame: f - a, fps, config: { damping: 10, stiffness: 170 } })} />
            ))}
          </>
        ) : null}

        {/* he says it as he opens CampusAI (round 1: a headline over the product competed with it) */}
        {inBox && f < recAt + 6 ? (
          <Bubble x={330} y={1350} w={620} tail="left" size={56}
            k={spring({ frame: f - TOUR - 4, fps, config: { damping: 12, stiffness: 160 } }) * (1 - ramp(f, recAt - 4, recAt + 6))}>
            {p.ask}
          </Bubble>
        ) : null}
      </AbsoluteFill>

      {/* the answer, in a drawn card like the episodes' (ink edge, rounded, offset shadow) so it sits in the scene: the
          drawn composer, then the real chat. Never boiled: the product never wobbles */}
      {inBox && f >= boxAt ? (() => {
        const k = spring({ frame: f - boxAt, fps, config: { damping: 14, stiffness: 120 } });
        const grow = ramp(f, recAt - 2, recAt + DUR.arrive + 4, CURVE.quiet.standard);
        const out = ramp(f, closeAt - 2, closeAt + 12, CURVE.quiet.exit);
        const w = W - CARD.x * 2;
        return (
          <div style={{ position: "absolute", left: CARD.x, top: CARD.askTop + (CARD.top - CARD.askTop) * grow, width: w, height: CARD.askH + (CARD.h - CARD.askH) * grow,
            overflow: "hidden", borderRadius: 26, border: `5px solid ${PRINT}`, boxShadow: `8px 10px 0 ${PRINT}`, background: "#0b0708",
            opacity: interpolate(k, [0, 0.25], [0, 1], clamp) * (1 - out), transform: `translateY(${(1 - k) * 240 + out * 160}px) rotate(${((1 - k) * -4).toFixed(3)}deg)` }}>
            {f < recAt ? <DrawnAsk s={ASK} from={askFrom} w={w} /> : <RecShot a={REC} into={f - recAt} w={w} />}
          </div>
        );
      })() : null}

      {/* sound: a step on every cut, paper for the bubbles and notes, a tap per tally, the trip */}
      {starts.slice(1).map((s, i) => <Cue key={`c${i}`} at={s} name="air-woosh-quick" volume={0.35} />)}
      <Cue at={2} name="paper-slide" volume={0.45} />
      {qs.map(({ i }) => <Cue key={`q${i}`} at={starts[i] + Q_IN} name="paper-slide" volume={0.45} />)}
      {qs.map(({ i }) => <Cue key={`s${i}`} at={starts[i] + SAY_IN} name="typewriter-hit-soft" volume={0.4} />)}
      {qs.map(({ i }) => <Cue key={`t${i}`} at={tickAt(i)} name="switch-tap" volume={0.4} />)}
      <Cue at={tripAt} name="hit-weak" volume={0.7} />
      <Cue at={TOUR} name="paper-move-quick" volume={0.6} />
      <Cue at={boxAt} name="paper-slide" volume={0.5} />
      <Cue at={closeAt + 8} name="typewriter-hit-soft" volume={0.4} />
      {phonesAt.map((a, i) => <Cue key={`p${i}`} at={a} name="switch-tap" volume={0.4} />)}
    </Clip>
  );
};
