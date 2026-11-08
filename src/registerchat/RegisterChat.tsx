/**
 * Registration in four questions (2026-10-30, round 10), a 16:9 web film. One real CampusAI conversation, recorded
 * in one take at desktop size (1200 x 750 since round 10, was 1440 x 900) by `node capture/register-chat-record.mjs` from
 * films/register-chat/conversation.json:
 *   1. "can you find what gen eds i should take"                 -> AOSC123, ENES210, JOUR175, each double counting
 *   2. "ok now which major classes should i take next semester"  -> the Finance requirements, where she stands, options
 *   3. "who's the best professor for BMGT440"                     -> two options: David Kass (with a real PlanetTerp
 *                                                                    review) and Maria Bustamante (Jacob, round 9)
 *   4. "and a few upper level electives that are easy"            -> PLCY313, JOUR456, PLCY301, each with its professor
 * Answers use the live chat's own format. After answer 1 the pointer rests on AOSC123 and the product's own card
 * grows out of it (one hover in the film, Jacob round 7); the camera lands on the card by its logged position. The film ends on the
 * empty box, "Ask CampusAI anything...", then the logo. Facts and sources: films/register-chat/facts.md.
 *
 * Why 16:9 (Jacob, round 4): the product is a web app, so the recording is the page exactly as a student sees it.
 * The camera opens on the whole app, zooms into the box while the question is typed, holds a close frame on the
 * conversation while each answer streams, and lands on the one card. Typing shows exactly one new letter per frame
 * from the logged keystrokes (round 9: "smoother and quicker"). The page's top bar never enters a reading frame.
 *
 * Round 10 (Jacob: "a lot of it is just waiting for the chat to respond ... zoom in on the chat response and just go
 * through it quickly"): the thinking steps take about half a second each (shorter and the product's fade stacks
 * them unreadably), the answer streams ~2.5x faster with a beat at each line, and the conversation is recorded 1.2x
 * larger in a 1200 px desktop window so its lines wrap short enough for a close frame. That frame is the whole
 * conversation area at once (at this size it is one frame tall), so it holds still and the text moves through it.
 * The scroll is smooth in the recording itself (the recorder turns the product's line-by-line jump into a glide),
 * which replaces round 9's smoothing in the edit: at this zoom there is no margin to shift the page without
 * showing the top bar or the box.
 *
 * Page coordinates are canvas px of the recording drawn at 1920 wide (css px x 1.6 for the 1200 px take).
 */
import React from "react";
import { AbsoluteFill, Audio, Composition, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BlurLines, brand as getBrand, glow, INTER, LogoEnd, LogoOpen, pop, PointerAt, SPARK, useBrandFonts, ZODIAK } from "../kit";
import { EASE, EASE_CAMERA } from "../lib/anim";
import rec from "../../public/register-chat/convo/frames.json";

const FPS = 30;
const W = 1920;
const H = 1080;
const CSS = W / (rec as { vw: number }).vw; // recording css px -> canvas px
const PAGE_H = (rec as { vh: number }).vh * CSS; // 1200
const B = getBrand("campusai");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// the end card: "Ask CampusAI anything." (Jacob, round 11), the logo, campusai.app; long enough that the line is
// fully on screen for its reading time (22 letters / 15 + 1.5 s = 3 s)
const LOGO_LEN = 118;
const REVEAL = 50; // frames held on the empty box, "Ask CampusAI anything...", before the exit
const PRE = 24; // frames before the recording plays: the whole app, then the zoom into the box
const PRE_GENZ = 40; // the Gen Z cut opens on its question over the app first

type Rect = [number, number, number, number];
type Hover = { name: string; start: number; on: number; off: number };
type Mark = { typeStart: number; keys?: number[]; send: number; done: number; hovers: Hover[]; hoverEnd?: number; end: number };
type Label = [number, string, number, number, number]; // document index, text, x, y, height (viewport css px)
type Frame = { t: number; name: string; mx: number; my: number; card: Rect | null; box: Rect | null; scroll: number; labels?: Label[] };
type Rec = { marks: Mark[]; frames: Frame[] };
const R = rec as unknown as Rec;
const FRAMES = R.frames;

/** Camera: page point (fx, fy) drawn at (W/2, H/2) at scale s. */
type Cam = { fx: number; fy: number; s: number };
const lerpCam = (a: Cam, b: Cam, k: number): Cam => ({ fx: a.fx + (b.fx - a.fx) * k, fy: a.fy + (b.fy - a.fy) * k, s: a.s + (b.s - a.s) * k });
const camTransform = (c: Cam) => `translate(${(W / 2 - c.fx * c.s).toFixed(2)}px, ${(H / 2 - c.fy * c.s).toFixed(2)}px) scale(${c.s.toFixed(4)})`;
const toScreen = (c: Cam, x: number, y: number) => ({ x: W / 2 + (x - c.fx) * c.s, y: H / 2 + (y - c.fy) * c.s });
const TOP = 48 * CSS; // the page's logo row, never in frame
/** Keep a framing on the page, and below its logo row. */
const onPage = (c: Cam): Cam => {
  const hx = W / 2 / c.s, hy = H / 2 / c.s;
  return { ...c, fx: Math.min(Math.max(c.fx, hx), W - hx), fy: Math.min(Math.max(c.fy, TOP + hy), PAGE_H - hy) };
};

// The whole web app, edge to edge below the logo row.
const WIDE: Cam = onPage({ fx: W / 2, fy: PAGE_H / 2, s: PAGE_H / (PAGE_H - TOP) });
// The box (css px), as logged: the conversation column shares its width.
const BOX = (R.frames.find((fr) => fr.box)?.box ?? [278, 786, 1100, 115]) as Rect;
// Asking: close on the start of the box, where the words appear, with the conversation above it.
const TYPE: Cam = onPage({ fx: (BOX[0] + 0.264 * BOX[2]) * CSS, fy: (BOX[1] - 36) * CSS, s: 1.5 });
// Reading: the conversation, as close as its lines allow. Measured on the 1200 x 750 take: the text runs from css x
// ~340 to ~1125 and the conversation area from under the top bar (~86) to the box (~613); the frame is 840 css wide
// (472 tall), its bottom edge 43 px above the box.
const READ_W = 840;
const READ: Cam = onPage({ fx: 728 * CSS, fy: (BOX[1] - 43 - (READ_W * 9) / 32) * CSS, s: W / (READ_W * CSS) });
// A hover card, from its logged rect: centred a little below the card so the name it opened from shows too.
const cardCam = (r: Rect): Cam => onPage({ fx: (r[0] + r[2] / 2) * CSS, fy: (r[1] + r[3] / 2 + 40) * CSS, s: 1.55 });

const frameAt = (t: number) => {
  let best = FRAMES[0];
  for (const fr of FRAMES) {
    if (fr.t <= t) best = fr;
    else break;
  }
  return best;
};
/** The card's settled rect for a hover (it is still growing at `on`). */
const cardRect = (h: Hover): Rect => {
  for (const dt of [0.9, 1.3, 0.6]) {
    const c = frameAt(h.on + dt).card;
    if (c) return c;
  }
  return [378, 300, 340, 180];
};

/** While a question is typed, the frame just after the k-th logged keystroke, k = frames since the first key: one
 * new letter per film frame. Null outside typing. */
const typedFrame = (t: number, c: Cut) => {
  for (let i = c.from; i <= c.to; i++) {
    const keys = R.marks[i].keys;
    if (!keys?.length || t < keys[0] || t >= keys[keys.length - 1]) continue;
    const at = keys[Math.min(keys.length - 1, Math.floor((t - keys[0]) * FPS + 1e-6))];
    return FRAMES.find((fr) => fr.t >= at) ?? null;
  }
  return null;
};

/** A cut: the recording from turn `from` to the end of turn `to`, then the empty box, then the logo. */
type Cut = { id: string; from: number; to: number; genz?: boolean };

/* The Gen Z cut's one fact per answer (Jacob, round 12: the icon pops "didn't look good"). When an answer has
 * finished, the recording holds still for a beat, the answer dims and its most useful fact pops up big, every word
 * of it already in the answer (facts.md). On the gen ed answer the real AOSC123 block also lifts off the page. */
type Sticker = { big: string; small: string };
const STICKERS: Sticker[] = [
  { big: "2 gen eds, 1 class", small: "AOSC123 + JOUR175 covers all 4" },
  // round 13 (Jacob): about knowing what she has done and recommending what is left, not the credit count
  { big: "Knows what you've taken", small: "and what's left: BMGT440 + 4 Finance electives" },
  // round 13 (Jacob): name the PlanetTerp reviews
  { big: "Real PlanetTerp reviews", small: "Ratings, grades and what students say" },
  { big: "Once a week", small: "PLCY313, 3.74 average GPA" },
];
const HOLD_S = [1.8, 1.4, 1.4, 1.4]; // s the recording holds after each answer for its sticker
type Hold = { turn: number; at: number; dur: number };
const holdsOf = (c: Cut): Hold[] =>
  // 0.45 s after the stream ends, when the product has drawn the last words (at 0.15 it froze mid-word)
  c.genz ? R.marks.slice(c.from, c.to + 1).map((m, k) => ({ turn: c.from + k, at: m.done + 0.45, dur: HOLD_S[c.from + k] })) : [];

const span = (c: Cut) => {
  const pre = c.genz ? PRE_GENZ : PRE;
  const t0 = c.from === 0 ? 0.3 : R.marks[c.from].typeStart - 0.05;
  const t1 = R.marks[c.to].end;
  const holds = holdsOf(c);
  const play = pre + Math.round((t1 - t0 + holds.reduce((n, h) => n + h.dur, 0)) * FPS);
  const end = play + REVEAL;
  return { pre, t0, t1, holds, play, end, total: end + LOGO_LEN };
};
/** Recording time at film frame f: the recording plays straight through except during a hold, when it stays put. */
const recAt = (c: Cut, f: number) => {
  const { pre, t0, holds, play } = span(c);
  let t = t0 + (Math.min(f, play) - pre) / FPS;
  for (const h of holds) {
    if (t <= h.at) break;
    if (t < h.at + h.dur) return h.at;
    t -= h.dur;
  }
  return t;
};
/** Film frame at which recording time t plays. */
const frameOf = (c: Cut, t: number) => {
  const { pre, t0, holds } = span(c);
  return pre + Math.round((t - t0 + holds.filter((h) => h.at < t).reduce((n, h) => n + h.dur, 0)) * FPS);
};

/** The camera at recording time t (before t0 is the opening): a list of moves, each easing from wherever the
 * camera is to its target. While a question is typed the camera only drifts in, a few percent. */
const camAt = (t: number, c: Cut, f: number, play: number, t0: number): Cam => {
  const { pre } = span(c);
  const moves: { a: number; b: number; to: Cam }[] = [{ a: t0 - (pre - 8) / FPS, b: t0 - 0.02, to: TYPE }];
  for (let i = c.from; i <= c.to; i++) {
    const m = R.marks[i];
    if (i > c.from) {
      // back to the box for the next question; in the Gen Z cut not before the last answer's sticker hold is over
      const prev = span(c).holds.find((h) => h.turn === i - 1);
      const a = Math.max(R.marks[i - 1].end - 0.95, prev ? prev.at + STICKER_TAIL[prev.turn] + 0.02 : -Infinity);
      moves.push({ a, b: Math.max(a + 0.5, R.marks[i - 1].end - 0.05), to: TYPE });
    }
    // the drift while typing: a slow push on the words
    moves.push({ a: m.typeStart, b: m.send, to: { ...TYPE, s: TYPE.s * 1.05 } });
    moves.push({ a: m.send + 0.15, b: m.send + 0.85, to: READ });
    m.hovers.forEach((h, j) => {
      moves.push({ a: j === 0 ? h.start + 0.15 : m.hovers[j - 1].off, b: h.on + 0.5, to: cardCam(cardRect(h)) });
    });
    const last = m.hovers[m.hovers.length - 1];
    if (last) moves.push({ a: last.off, b: last.off + 0.75, to: READ });
  }
  let cam = WIDE;
  for (const mv of moves) cam = lerpCam(cam, mv.to, interpolate(t, [mv.a, mv.b], [0, 1], { ...clamp, easing: EASE_CAMERA }));
  // the ending: back to the box, empty again, its own words on it: "Ask CampusAI anything..."
  return lerpCam(cam, TYPE, interpolate(f, [play - 6, play + 22], [0, 1], { ...clamp, easing: EASE_CAMERA }));
};

const Thread: React.FC<{ c: Cut }> = ({ c }) => {
  const f = useCurrentFrame();
  const { pre, t0, play, end } = span(c);
  const t = recAt(c, f); // before t0 the first frame holds while the camera zooms in
  const fr = typedFrame(t, c) ?? frameAt(Math.max(t0, t));
  const cam = camAt(t, c, f, play, t0);

  // the pointer, drawn where the recording's pointer was (headless Chrome draws none); seen only around the hovers
  let pointer: React.ReactNode = null;
  for (let i = c.from; i <= c.to; i++) {
    const m = R.marks[i];
    if (!m.hovers.length || m.hoverEnd === undefined) continue;
    const a = m.hovers[0].start;
    if (t < a - 0.4 || t > m.hoverEnd + 0.3) continue;
    const op = interpolate(t, [a - 0.35, a, m.hoverEnd - 0.35, m.hoverEnd], [0, 1, 1, 0], clamp);
    const p = toScreen(cam, fr.mx * CSS, fr.my * CSS);
    pointer = <PointerAt x={p.x} y={p.y} since={null} accent={B.color.accent} opacity={op} size={30 * cam.s} />;
  }

  const out = interpolate(f, [end - 14, end], [0, 1], { ...clamp, easing: EASE });
  // Gen Z cut: the app sits soft and dark under the opening question, then sharpens as the camera zooms in
  const hush = c.genz ? interpolate(f, [0, pre - 10, pre + 4], [1, 1, 0], clamp) : 0;
  const blur = out * 12 + hush * 7;
  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: blur > 0 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `${camTransform(cam)} scale(${(1 + 0.12 * out).toFixed(4)})` }}>
        <Img src={staticFile(`register-chat/convo/${fr.name}`)} style={{ width: W, height: PAGE_H, maxWidth: "none", display: "block" }} />
        {c.genz ? <Lift c={c} f={f} fr={fr} /> : null}
      </AbsoluteFill>
      {c.genz ? <Stickers c={c} f={f} /> : null}
      {c.genz ? <AbsoluteFill style={{ background: "#000", opacity: 0.78 * hush }} /> : null}
      {pointer}
    </AbsoluteFill>
  );
};

/** A hold's progress at film frame f: in (0 to 1 over 8 frames), out (0 to 1 over 8 frames ending `tail` s after the
 * hold), or null outside it. */
const holdPhase = (c: Cut, h: Hold, f: number, tail: number) => {
  const a = frameOf(c, h.at) + 1;
  const b = a + Math.round((h.dur + tail) * FPS);
  if (f < a || f > b) return null;
  return { k: (f - a) / FPS, in: interpolate(f, [a, a + 8], [0, 1], { ...clamp, easing: EASE }), out: interpolate(f, [b - 8, b], [0, 1], clamp) };
};
const STICKER_TAIL = [0.15, 0.25, 0.25, 0.25]; // s a sticker stays after its hold: gone before the hover, or before the camera turns to the next question

/** The answer dims and its fact pops up big, tilted, in the brand red. */
const Stickers: React.FC<{ c: Cut; f: number }> = ({ c, f }) => (
  <>
    {span(c).holds.map((h) => {
      const ph = holdPhase(c, h, f, STICKER_TAIL[h.turn]);
      if (!ph) return null;
      const st = STICKERS[h.turn];
      const k = pop(ph.k * FPS, 2, FPS, 10);
      const sm = pop(ph.k * FPS, 8, FPS, 13);
      const lift = h.turn === 0; // the gen ed sticker sits under the lifted block, so it goes low
      return (
        <React.Fragment key={h.turn}>
          {!lift ? <AbsoluteFill style={{ background: "#0b0708", opacity: 0.62 * ph.in * (1 - ph.out) }} /> : null}
          <div style={{ position: "absolute", left: W / 2, top: lift ? 830 : 540, transform: `translate(-50%, -50%) rotate(${(-3 - (1 - k) * 6).toFixed(2)}deg) scale(${(k * (1 - 0.15 * ph.out)).toFixed(4)})`,
            opacity: 1 - ph.out, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "26px 46px 24px",
            borderRadius: 30, background: B.color.accent, boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 70px ${glow(B, 0.5)}` }}>
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 84, lineHeight: 1, letterSpacing: "-0.035em", color: "#fff", whiteSpace: "nowrap" }}>{st.big}</div>
            <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 34, lineHeight: 1.1, color: "rgba(255,255,255,0.86)", whiteSpace: "nowrap",
              opacity: sm, transform: `translateY(${((1 - sm) * 10).toFixed(2)}px)` }}>{st.small}</div>
            <svg width={54} height={54} viewBox="0 0 24 24" style={{ position: "absolute", right: -22, top: -24, transform: `rotate(${(ph.k * 40).toFixed(1)}deg) scale(${sm.toFixed(3)})` }}>
              <path d={SPARK} fill="#fff" />
            </svg>
          </div>
        </React.Fragment>
      );
    })}
  </>
);

/** The gen ed answer's hero beat: the real AOSC123 block (its line, "Double counts for", "Why it fits"), cut from
 * the frame by the recorder's label boxes, lifts off the page while the rest dims, then goes home. RoleCard's lift
 * (src/kit/pass/readout), drawn in page space so it rides the camera. */
const Lift: React.FC<{ c: Cut; f: number; fr: Frame }> = ({ c, f, fr }) => {
  const h = span(c).holds.find((x) => x.turn === 0);
  if (!h) return null;
  const ph = holdPhase(c, h, f, STICKER_TAIL[0]);
  if (!ph) return null;
  // AOSC123's two label lines are the first "Double counts for:" and "Why it fits:" of the conversation
  const labs = (fr.labels ?? []).filter((l) => l[1] === "Double counts for:" || l[1] === "Why it fits:").sort((a, b) => a[0] - b[0]);
  const [dbl, why] = labs;
  if (!dbl || !why || why[0] !== dbl[0] + 1) return null;
  const x = 340, w = 772, y = dbl[3] - 40, hgt = why[3] + why[4] + 12 - y; // css px: the course line through "Why it fits", inside the frame's edges
  const up = pop(ph.k * FPS, 0, FPS, 16) * (1 - ph.out);
  const src = staticFile(`register-chat/convo/${fr.name}`);
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: PAGE_H, background: "#0b0708", opacity: 0.6 * ph.in * (1 - ph.out) }} />
      <div style={{ position: "absolute", left: x * CSS, top: y * CSS, width: w * CSS, height: hgt * CSS, borderRadius: 18, overflow: "hidden",
        transform: `translateY(${(-16 * up).toFixed(2)}px) scale(${(1 + 0.035 * up).toFixed(4)})`, transformOrigin: "50% 50%",
        boxShadow: `0 ${(30 * up).toFixed(1)}px ${(60 * up).toFixed(1)}px rgba(0,0,0,${(0.55 * up).toFixed(2)}), 0 0 0 ${(2 * up).toFixed(2)}px ${B.color.accent}`,
        background: B.color.bg }}>
        <Img src={src} style={{ position: "absolute", left: -x * CSS, top: -y * CSS, width: W, height: PAGE_H, maxWidth: "none" }} />
      </div>
    </>
  );
};

/** The opening question, over the app, then tucked up top while the first question types (Gen Z cut). */
const Hook: React.FC<{ pre: number; until: number }> = ({ pre, until }) => {
  const f = useCurrentFrame();
  const tuck = interpolate(f, [pre - 10, pre + 6], [0, 1], { ...clamp, easing: EASE });
  const out = interpolate(f, [until, until + 8], [0, 1], clamp);
  return (
    <>
    {/* tucked up top, its dark band covers the page's greeting, so the question stands in for "Hi Maya, how can I
        help" rather than stacking on it as a second heading */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 360, opacity: tuck * (1 - out),
      background: "linear-gradient(#0b0708 0%, #0b0708 68%, rgba(11,7,8,0) 100%)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 360 + (40 - 360) * tuck, transformOrigin: "50% 0", transform: `scale(${(1 - 0.58 * tuck).toFixed(4)})`,
      opacity: 1 - out }}>
      <BlurLines lines={[{ text: "Need help scheduling" }, { text: "your classes?", accent: true }]} at={0} size={110} face={ZODIAK} stagger={3}
        ink={{ ink: B.color.ink, soft: B.color.inkSoft, accent: B.color.accent, surface: B.color.surface, line: B.color.inkSoft }} />
    </div>
    </>
  );
};

const Address: React.FC = () => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ position: "absolute", top: 735, width: "100%", textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: 40,
      color: B.color.inkSoft, opacity: k, transform: `translateY(${((1 - k) * 10).toFixed(2)}px)` }}>
      campusai.app
    </div>
  );
};

const Film: React.FC<{ cut: Cut }> = ({ cut }) => {
  useBrandFonts(B);
  const { pre, end } = span(cut);
  const at = (t: number) => frameOf(cut, t);
  const turns = R.marks.slice(cut.from, cut.to + 1);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 100%, ${glow(B, 0.28)} 0%, rgba(11,7,8,0) 60%), ${B.color.bgDeep}` }}>
      <Sequence durationInFrames={end}>
        <Thread c={cut} />
      </Sequence>
      {/* the mark arrives with the hook in the dark band above the app, and leaves as the camera zooms into the box */}
      <LogoOpen brand={B} at={2} x={W / 2} y={110} width={240} leaveAt={pre - 10} />
      {cut.genz ? <Hook pre={pre} until={at(R.marks[cut.from].send + 0.4)} /> : null}
      {/* the box's own words, said at the finish: "Ask CampusAI anything." (Jacob, round 11) */}
      <div style={{ position: "absolute", top: 230, width: "100%" }}>
        <BlurLines lines={[{ text: "Ask CampusAI" }, { text: "anything.", accent: true }]} at={end - 4} size={104} face={ZODIAK}
          ink={{ ink: B.color.ink, soft: B.color.inkSoft, accent: B.color.accent, surface: B.color.surface, line: B.color.inkSoft }} />
      </div>
      <LogoEnd brand={B} at={end + 10} x={W / 2} y={640} width={400} />
      <Sequence from={end + 22}>
        <Address />
      </Sequence>

      {/* sound: a tap under each question's typing, a click on each send, a soft land on each card, the logo hit */}
      {/* no music (Jacob, round 13: "we will get one from online"); the song is laid on later, so only effects here */}
      {cut.genz ? (
        <>
          <Audio src={staticFile("sound/cues/arrive-wind-swoosh-short.wav")} volume={0.35} />
          {span(cut).holds.map((h) => (
            <React.Fragment key={h.turn}>
              <Sequence from={frameOf(cut, h.at)} durationInFrames={40}>
                <Audio src={staticFile("sound/cues/move-swoosh-quick.wav")} volume={0.3} />
              </Sequence>
              <Sequence from={frameOf(cut, h.at) + 3} durationInFrames={40}>
                <Audio src={staticFile(h.turn === 0 ? "sound/cues/success-chime-crystal.wav" : "register-chat/sfx/pop-electric.mp3")} volume={h.turn === 0 ? 0.45 : 0.35} />
              </Sequence>
            </React.Fragment>
          ))}
        </>
      ) : null}
      {turns.map((m, i) => {
        const a = Math.max(0, at(m.typeStart));
        const b = at(m.send);
        return (
          <React.Fragment key={i}>
            {Array.from({ length: Math.max(1, Math.floor((b - a) / 3)) }, (_, k) => (
              <Sequence key={`k${k}`} from={a + k * 3} durationInFrames={10}>
                <Audio src={staticFile("sound/cues/type-switch-tap.wav")} volume={0.12} />
              </Sequence>
            ))}
            <Sequence from={b} durationInFrames={30}>
              <Audio src={staticFile("sound/cues/press-ui-select-click.wav")} volume={0.4} />
            </Sequence>
            {m.hovers.map((h) => (
              <Sequence key={h.name} from={at(h.on)} durationInFrames={30}>
                <Audio src={staticFile("sound/cues/land-ui-popup-dry.wav")} volume={0.3} />
              </Sequence>
            ))}
          </React.Fragment>
        );
      })}
      <Sequence from={end - 6} durationInFrames={60}>
        <Audio src={staticFile("sound/cues/logo-bass-hit-futuristic.wav")} volume={0.45} />
      </Sequence>
    </AbsoluteFill>
  );
};

const CUTS: Cut[] = [
  { id: "RegisterChat-16x9", from: 0, to: 3 },
  { id: "RegisterChatGenEds-16x9", from: 0, to: 0 },
  { id: "RegisterChatMajor-16x9", from: 1, to: 2 }, // the major classes, then who teaches BMGT440
  { id: "RegisterChatElectives-16x9", from: 3, to: 3 },
  { id: "RegisterChatGenZ-16x9", from: 0, to: 3, genz: true }, // the same film with a hook and a fact sticker per answer (round 12)
  // the Gen Z edit's short cuts, split like the plain ones (round 14)
  { id: "RegisterChatGenZGenEds-16x9", from: 0, to: 0, genz: true },
  { id: "RegisterChatGenZMajor-16x9", from: 1, to: 2, genz: true },
  { id: "RegisterChatGenZElectives-16x9", from: 3, to: 3, genz: true },
];

export const RegisterChatRoot: React.FC = () => (
  <>
    {CUTS.map((c) => (
      <Composition key={c.id} id={c.id} component={Film} defaultProps={{ cut: c }} durationInFrames={span(c).total} fps={FPS} width={W} height={H} />
    ))}
  </>
);
