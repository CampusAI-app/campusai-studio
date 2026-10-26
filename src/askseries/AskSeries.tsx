/**
 * Ask CampusAI, a mini-series (2026-10-23), three 9:16 films. A student types something a little dramatic into
 * the real CampusAI chat and the answer deflates it with a fact the product actually holds:
 *   1. "midterm wednesday. zero free time. when do i study"  -> her real calendar's open time (My Calendar)
 *   2. "its 11:40pm and i havent eaten since lunch..."      -> the Dining page's real hours
 *   3. "do i qualify for goldman or am i delusional"         -> Job Match's requirement check on the real posting
 *
 * Each chat is recorded with `npm run chat ask-series-<n>` (the real full-page /ai chat at the frame's own 9:16
 * shape, answer zoomed 2.2x). Facts: films/ask-series-<n>/facts.md.
 *
 * One camera for the series (zoomed on the box while the question types, pull back to the conversation on the
 * send), then each film has its own punch move, so no two share a signature:
 *   1. a slow push-in onto "Monday, 8am to 11am. Yes, 8am."
 *   2. the &pizza line lifts off the page, settles, then "Leave now." lifts
 *   3. a spotlight walks down the answer line by line and lands on the 3.3 GPA
 * Every film ends by pushing into the page and resolving on the logo plus campusai.app, held ~3 s.
 *
 * Page coordinates below are canvas px of the recording drawn at 1080 x 1920 (the 1640 x 2916 frames x 0.6585).
 */
import React from "react";
import { AbsoluteFill, Audio, Composition, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { brand as getBrand, glow, INTER, LogoEnd, LogoOpen, useBrandFonts } from "../kit";
import { EASE, EASE_CAMERA } from "../lib/anim";
import rec1 from "../../public/ask-series-1/chat/frames.json";
import rec2 from "../../public/ask-series-2/chat/frames.json";
import rec3 from "../../public/ask-series-3/chat/frames.json";

const FPS = 30;
const W = 1080;
const H = 1920;
const PAGE_H = (2916 / 1640) * W; // 1920.4
const B = getBrand("campusai");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const REC_FROM = 0.66; // just after the first keystroke (typeStart 0.60): frame one already shows the question typing,
// never the box's placeholder, which wraps and clips at this zoom
const LOGO_LEN = 96; // logo plus campusai.app, held ~3 s

type Rec = { marks: { typeStart: number; send: number; done: number }; frames: { t: number; name: string }[] };
type Rect = { x0: number; y0: number; x1: number; y1: number };
type Punch =
  | { kind: "push"; focus: { x: number; y: number }; scale: number; cy: number; after: number; len: number }
  | { kind: "pop"; card: Rect; last: Rect; after: number; hold: number }
  | { kind: "sweep"; bands: { y0: number; y1: number; at: number }[]; scale: number };

type Film = {
  id: string;
  dir: string;
  rec: Rec;
  question: string;
  /** Seconds the whole answer stays fully on screen: letters / 15 + 1.5 (studio rule). */
  read: number;
  punch: Punch;
};

// The box (chat input) and the conversation, in page px.
const BOX = { x: 540, y: 1690 };
const CONVO = { x: 540, y: 650 };
const TYPE_CAM = { s: 1.3, cy: 1100 };
// bubble top lands at y 260, the answer fills to ~1350, and the chat box (whose zoomed placeholder clips) stays below the frame
const CONVO_CAM = { s: 1.22, cy: 772 }; // avatar (x 144) and bubble edge (x 936) both inside the frame

export const FILMS: Film[] = [
  {
    id: "AskSeries1-9x16",
    dir: "ask-series-1",
    rec: rec1 as Rec,
    question: "midterm wednesday. zero free time. when do i study",
    read: 8.6, // 106 letters
    punch: { kind: "push", focus: { x: 497, y: 1008 }, scale: 1.5, cy: 1065, after: 75, len: 90 }, // bubble above the frame, box below it, avatar and "your" inside
  },
  {
    id: "AskSeries2-9x16",
    dir: "ask-series-2",
    rec: rec2 as Rec,
    question: "its 11:40pm and i havent eaten since lunch. whats still open",
    read: 9.0, // 112 letters
    punch: {
      kind: "pop",
      card: { x0: 232, y0: 664, x1: 836, y1: 902 }, // "&pizza on Baltimore Ave / Open until midnight, an 11 minute walk."
      last: { x0: 232, y0: 942, x1: 862, y1: 1084 }, // "Everything else closed by 11. / Leave now."
      after: 60,
      hold: 85,
    },
  },
  {
    id: "AskSeries3-9x16",
    dir: "ask-series-3",
    rec: rec3 as Rec,
    question: "be honest. do i qualify for goldman or am i delusional",
    read: 10.2, // 134 letters, the hold trimmed to the rule's floor so the film stays under 20 s
    punch: {
      kind: "sweep",
      scale: 1.3,
      bands: [
        { y0: 566, y1: 636, at: 8 }, // "Not delusional."
        { y0: 676, y1: 900, at: 62 }, // "You show 3 of the 4 things ..."
        { y0: 934, y1: 1084, at: 150 }, // "The 4th is a 3.3 GPA, and it isn't on your resume yet."
      ],
    },
  },
];

const timing = (film: Film) => {
  const { marks } = film.rec;
  const send = Math.round((marks.send - REC_FROM) * FPS);
  const typeStart = Math.round((marks.typeStart - REC_FROM) * FPS);
  const done = Math.round((marks.done - REC_FROM) * FPS) + 3; // the last word is on screen a frame or two later
  const askLen = done + Math.round(film.read * FPS);
  return { send, typeStart, done, askLen, total: askLen + LOGO_LEN };
};

const frameAt = (rec: Rec, t: number) => {
  let best = rec.frames[0];
  for (const fr of rec.frames) {
    if (fr.t <= t) best = fr;
    else break;
  }
  return best;
};

/** Camera: page point (fx, fy) drawn at (540, cy) at scale s. */
type Cam = { fx: number; fy: number; s: number; cy: number };
const lerpCam = (a: Cam, b: Cam, k: number): Cam => ({
  fx: a.fx + (b.fx - a.fx) * k,
  fy: a.fy + (b.fy - a.fy) * k,
  s: a.s + (b.s - a.s) * k,
  cy: a.cy + (b.cy - a.cy) * k,
});
const camTransform = (c: Cam) => `translate(${(W / 2 - c.fx * c.s).toFixed(2)}px, ${(c.cy - c.fy * c.s).toFixed(2)}px) scale(${c.s.toFixed(4)})`;

const insetOf = (r: Rect, radius = 22) => `inset(${r.y0}px ${W - r.x1}px ${PAGE_H - r.y1}px ${r.x0}px round ${radius}px)`;

/** A piece of the page lifted toward the camera: the same frame, clipped to `r`, scaled about its centre. */
const Lift: React.FC<{ src: string; r: Rect; p: number; scale: number }> = ({ src, r, p, scale }) => {
  if (p <= 0.001) return null;
  const cx = (r.x0 + r.x1) / 2;
  const cy = (r.y0 + r.y1) / 2;
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: `${cx}px ${cy}px`,
      transform: `translateY(${(-10 * p).toFixed(2)}px) scale(${(1 + (scale - 1) * p).toFixed(4)})`,
      filter: `drop-shadow(0 ${(26 * p).toFixed(1)}px ${(44 * p).toFixed(1)}px rgba(0,0,0,${(0.7 * p).toFixed(3)})) drop-shadow(0 0 ${(28 * p).toFixed(1)}px ${glow(B, 0.35 * p)})` }}>
      <div style={{ position: "absolute", inset: 0, clipPath: insetOf(r) }}>
        <Img src={staticFile(src)} style={{ width: W, height: PAGE_H, maxWidth: "none", display: "block" }} />
        <div style={{ position: "absolute", left: r.x0, top: r.y0, width: r.x1 - r.x0, height: r.y1 - r.y0, borderRadius: 22,
          boxShadow: `inset 0 0 0 2px ${glow(B, 0.55 * p)}`, background: `rgba(255,255,255,${(0.03 * p).toFixed(3)})` }} />
      </div>
    </div>
  );
};

const Ask: React.FC<{ film: Film }> = ({ film }) => {
  const f = useCurrentFrame();
  const { send, done, askLen } = timing(film);
  const fr = frameAt(film.rec, REC_FROM + f / FPS);
  const src = `${film.dir}/chat/${fr.name}`;
  const pull = interpolate(f, [send + 4, send + 28], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const typeCam: Cam = { fx: BOX.x, fy: BOX.y, s: TYPE_CAM.s, cy: TYPE_CAM.cy };
  const convoCam: Cam = { fx: CONVO.x, fy: CONVO.y, s: CONVO_CAM.s, cy: CONVO_CAM.cy };
  let cam = lerpCam(typeCam, convoCam, pull);

  const p = film.punch;
  let dim = 0;
  let lifts: React.ReactNode = null;
  let mask: React.ReactNode = null;

  if (p.kind === "push") {
    const k = interpolate(f, [done + p.after, done + p.after + p.len], [0, 1], { ...clamp, easing: EASE_CAMERA });
    cam = lerpCam(cam, { fx: p.focus.x, fy: p.focus.y, s: p.scale, cy: p.cy }, k);
  } else if (p.kind === "pop") {
    const a = done + p.after;
    const up = interpolate(f, [a, a + 14], [0, 1], { ...clamp, easing: EASE });
    const down = interpolate(f, [a + p.hold, a + p.hold + 12], [0, 1], { ...clamp, easing: EASE });
    const cardP = up * (1 - down);
    const lastP = interpolate(f, [a + p.hold + 4, a + p.hold + 18], [0, 1], { ...clamp, easing: EASE });
    dim = Math.max(cardP, lastP) * 0.5;
    lifts = (
      <>
        <Lift src={src} r={p.card} p={cardP} scale={1.12} />
        <Lift src={src} r={p.last} p={lastP} scale={1.12} />
      </>
    );
  } else {
    // the spotlight: everything outside the band sits under a dark veil; the band moves line to line
    const on = interpolate(f, [done + p.bands[0].at - 6, done + p.bands[0].at + 6], [0, 1], clamp);
    let band = { y0: p.bands[0].y0, y1: p.bands[0].y1 };
    for (let i = 1; i < p.bands.length; i++) {
      const k = interpolate(f, [done + p.bands[i].at, done + p.bands[i].at + 14], [0, 1], { ...clamp, easing: EASE_CAMERA });
      band = { y0: band.y0 + (p.bands[i].y0 - band.y0) * k, y1: band.y1 + (p.bands[i].y1 - band.y1) * k };
    }
    const soft = 26;
    mask = (
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: PAGE_H, background: `rgba(11, 7, 8, ${(0.6 * on).toFixed(3)})`,
        WebkitMaskImage: `linear-gradient(to bottom, #000 0px, #000 ${band.y0 - soft}px, transparent ${band.y0}px, transparent ${band.y1}px, #000 ${band.y1 + soft}px, #000 100%)`,
        maskImage: `linear-gradient(to bottom, #000 0px, #000 ${band.y0 - soft}px, transparent ${band.y0}px, transparent ${band.y1}px, #000 ${band.y1 + soft}px, #000 100%)` }} />
    );
    // the camera leans in a little and keeps the lit line near the middle
    // the camera leans in once and holds, so the lit line does the moving (the box stays below the frame)
    const lean = interpolate(f, [done, done + 40], [0, 1], { ...clamp, easing: EASE_CAMERA });
    cam = lerpCam(cam, { fx: 530, fy: 830, s: p.scale, cy: 960 }, lean);
  }

  // the exit: a push into the page that blurs out as the logo arrives
  const out = interpolate(f, [askLen - 14, askLen], [0, 1], { ...clamp, easing: EASE });
  cam = { ...cam, s: cam.s * (1 + 0.18 * out) };
  const typingVeil = 1 - pull;

  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${(out * 12).toFixed(2)}px)` : undefined }}>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: camTransform(cam) }}>
        <div style={{ position: "absolute", inset: 0, filter: dim > 0 ? `brightness(${(1 - dim).toFixed(3)})` : undefined }}>
          <Img src={staticFile(src)} style={{ width: W, height: PAGE_H, maxWidth: "none", display: "block" }} />
        </div>
        {mask}
        {lifts}
      </AbsoluteFill>
      {/* after the pull: the product's own top bar sits under a soft dark fade instead of being cut at the edges */}
      <AbsoluteFill style={{ opacity: pull, background: `linear-gradient(to bottom, ${B.color.bgDeep} 0, ${B.color.bgDeep} 175px, rgba(11,7,8,0) 270px)` }} />
      {/* while typing: everything but the box sits in the dark, so the greeting and starter chips never compete */}
      {typingVeil > 0 && (
        <AbsoluteFill style={{ opacity: typingVeil,
          background: `linear-gradient(to bottom, ${B.color.bgDeep} 0, ${B.color.bgDeep} 900px, rgba(11,7,8,0) 1000px, rgba(11,7,8,0) 1300px, ${B.color.bgDeep} 1400px)` }} />
      )}
    </AbsoluteFill>
  );
};

const Address: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: EASE });
  return (
    <div style={{ position: "absolute", top: 1030, width: "100%", textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: 50,
      color: B.color.inkSoft, opacity: p, transform: `translateY(${((1 - p) * 12).toFixed(2)}px)` }}>
      campusai.app
    </div>
  );
};

const AskFilm: React.FC<{ film: Film }> = ({ film }) => {
  useBrandFonts(B);
  const { send, typeStart, done, askLen, total } = timing(film);
  const keys = Math.ceil(film.question.length / 3);
  const p = film.punch;
  const punchAt = p.kind === "push" ? done + p.after : p.kind === "pop" ? done + p.after : done + p.bands[2].at;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 100%, ${glow(B, 0.28)} 0%, rgba(11,7,8,0) 60%), ${B.color.bgDeep}` }}>
      <Sequence durationInFrames={askLen}>
        <Ask film={film} />
      </Sequence>
      {/* the mark arrives with the hook, above the box, and leaves as the camera pulls back */}
      <LogoOpen brand={B} at={2} x={W / 2} y={760} width={300} leaveAt={send - 2} />
      <LogoEnd brand={B} at={askLen - 6} x={W / 2} y={900} width={600} />
      <Sequence from={askLen + 8}>
        <Address />
      </Sequence>

      {/* sound: the series' one track under everything, a tap under the real typing, a click on the send,
          one soft land on the punch, the logo hit */}
      <Audio src={staticFile("ask-series/music.mp3")} volume={(fr) => interpolate(fr, [0, 8, total - 30, total], [0, 0.32, 0.32, 0], clamp)} />
      {Array.from({ length: keys }, (_, i) => (
        <Sequence key={`k${i}`} from={typeStart + Math.round(((i * 3) / film.question.length) * (send - typeStart))} durationInFrames={10}>
          <Audio src={staticFile("sound/cues/type-switch-tap.wav")} volume={0.14} />
        </Sequence>
      ))}
      <Sequence from={send} durationInFrames={30}>
        <Audio src={staticFile("sound/cues/press-ui-select-click.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={punchAt} durationInFrames={30}>
        <Audio src={staticFile("sound/cues/land-ui-popup-dry.wav")} volume={0.35} />
      </Sequence>
      {p.kind === "pop" && (
        <Sequence from={done + p.after + p.hold + 4} durationInFrames={30}>
          <Audio src={staticFile("sound/cues/land-ui-popup-dry.wav")} volume={0.4} />
        </Sequence>
      )}
      <Sequence from={askLen - 6} durationInFrames={60}>
        <Audio src={staticFile("sound/cues/logo-bass-hit-futuristic.wav")} volume={0.45} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const AskSeriesRoot: React.FC = () => (
  <>
    {FILMS.map((film) => (
      <Composition key={film.id} id={film.id} component={AskFilm} defaultProps={{ film }} durationInFrames={timing(film).total} fps={FPS} width={W} height={H} />
    ))}
  </>
);
