/**
 * Your campus guide (2026-11-05, Jacob). A new student moves across campus and asks CampusAI three things; each answer
 * is the real chat and the next place follows from it.
 * Round 4 (11/06, his notes): the chat is the real DESKTOP web app ("we're not on the phone yet"), recorded tall at
 * 1100 x 1956 with zoom 1.8 and shown full frame with a slow camera, never in a phone or a card; no map ("we don't really
 * have a map in our platform", a map would read as a feature); the opening line no longer claims a phone.
 *
 * Layers: the place (real footage when shot, a credited Wikimedia photo until then), a hand-drawn paper tag naming it,
 * then the product full frame; where the answer names the next stop, a marker loop circles that link before the cut.
 * Facts: Content/video-studio/films/campus-guide/facts.md.
 */
import React from "react";
import { loadFont } from "@remotion/google-fonts/Caveat";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CURVE, DUR } from "../system/motion";
import { B, Clip, Cue, INTER, PAPER, PRINT, RED, ZODIAK, clamp, ramp } from "../styles/common";
import studyChat from "../../public/d-study/chat/frames.json";
import mathChat from "../../public/d-math/chat/frames.json";
import peopleChat from "../../public/d-people/chat/frames.json";

const { fontFamily: HAND } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

type Rec = { vw: number; vh: number; marks: { typeStart: number; send: number; done: number }; frames: { t: number; name: string }[] };
/** A real photo of the place: public/ path and its on-screen credit. */
type Photo = { src: string; credit: string };
/** Where the camera settles once the answer arrives, in the page's CSS px: zoom and the point it centres on. */
type Cam = { z: number; fx: number; fy: number };
/** The link in the answer that names the next stop, in the page's CSS px on the recording's last frame. */
type Mark = { x0: number; y0: number; x1: number; y1: number };
/** Round 5 (11/06, Jacob: "a few more things pop up ... think of Gen Z college students"): the student annotates the
 * answer like a screenshot they would send. Each pop reacts to words the answer really says; `at` is recording seconds.
 *   under: a marker underline with a small camera punch toward it
 *   note: the student's own handwriting on a paper sticker, at a page point, with an optional marker arrow to `to`
 *   sticker: a round paper sticker with a doodle beside a link */
type Pop =
  | { kind: "under"; at: number; box: Mark }
  | { kind: "note"; at: number; text: string; x: number; y: number; rot: number; size?: number; arrow?: [number, number][] }
  | { kind: "sticker"; at: number; icon: "glove" | "ball" | "chart"; x: number; y: number };
export type GuideStop = { place: string; footage?: string; photo?: Photo; shoot: string; rec: Rec; dir: string; hold: number; cam: Cam; mark?: Mark; pops?: Pop[] };
export type CampusGuideProps = { intro: { line: string; footage?: string; photo?: Photo; shoot: string }; stops: GuideStop[]; closer: string };

export const CAMPUS_GUIDE: CampusGuideProps = {
  // Photos from Wikimedia Commons (CC BY / CC BY-SA, credited on screen); real footage replaces them when it is shot.
  intro: { line: "New to UMD? Ask CampusAI.", shoot: "McKeldin Mall, walking forward toward the library",
    photo: { src: "campus-guide/photos/mall.jpg", credit: "Photo: Radhika Kshirsagar, CC BY-SA 4.0" } },
  stops: [
    { place: "McKeldin Library", shoot: "inside McKeldin when it is busy, walking forward", rec: studyChat as Rec, dir: "d-study/chat", hold: 1.5,
      photo: { src: "campus-guide/photos/mckeldin.jpg", credit: "Photo: Meihe Chen, CC BY-SA 4.0" },
      cam: { z: 1.38, fx: 690, fy: 790 }, mark: { x0: 396, y0: 368, x1: 731, y1: 402 },
      pops: [
        { kind: "under", at: 5.35, box: { x0: 640, y0: 423, x1: 930, y1: 449 } },
        // the arrow keeps to the right margin, clear of the text
        { kind: "note", at: 5.75, text: "no reservation?? bet", x: 780, y: 1150, rot: -4, arrow: [[965, 1118], [1068, 900], [1068, 520], [950, 456]] },
      ] },
    { place: "Iribe Center", shoot: "walking into Iribe, up to the second floor", rec: mathChat as Rec, dir: "d-math/chat", hold: 1.5,
      photo: { src: "campus-guide/photos/iribe.jpg", credit: "Photo: Blacktupelo, CC BY-SA 4.0" },
      cam: { z: 1.38, fx: 690, fy: 790 },
      pops: [
        { kind: "under", at: 5.7, box: { x0: 398, y0: 464, x1: 626, y1: 490 } },
        // the arrow keeps to the left margin
        { kind: "note", at: 6.1, text: "free AND drop-in. saved", x: 570, y: 1170, rot: 3, arrow: [[372, 1138], [302, 900], [306, 560], [386, 486]] },
      ] },
    { place: "Stamp Student Union", shoot: "walking through Stamp, people around", rec: peopleChat as Rec, dir: "d-people/chat", hold: 2.8,
      photo: { src: "campus-guide/photos/stamp.jpg", credit: "Photo: Bgervais, CC BY-SA 3.0" },
      cam: { z: 1.38, fx: 690, fy: 790 },
      pops: [
        { kind: "sticker", at: 9.5, icon: "glove", x: 600, y: 462 },
        { kind: "note", at: 9.75, text: "wait they box here??", x: 840, y: 466, rot: 4, size: 50 },
        { kind: "sticker", at: 10.05, icon: "ball", x: 703, y: 624 },
        { kind: "sticker", at: 10.8, icon: "chart", x: 748, y: 832 },
        { kind: "note", at: 11.2, text: "found my people", x: 640, y: 1290, rot: -3, size: 76 },
      ] },
  ],
  closer: "Ask CampusAI anything.",
};

// ---- timing (frames)
const INTRO = 72; // five words write on and hold long enough to read
const PLACE = 40; // the place and its tag, before the product comes up
const TYPE_SPEED = 2.2; // the real typing (55 ms a letter) plays faster; the answer plays at true speed
const PUSH = 26; // the camera's move in once the question is sent
const MARK_DRAW = 14;
const MARK_HOLD = 24;
const OUT = 14; // the product leaves as the next place arrives under it
const CLOSE = 66;
const START = { z: 1.45, fx: 690, fy: 1400 }; // on the empty chat and its input, big enough to read the typing; the sidebar and logo row out of frame

/** The recording's stretches: typing (sped up), then the answer at true speed, never past the last frame. */
const segsOf = (s: GuideStop) => {
  const last = s.rec.frames[s.rec.frames.length - 1].t - 0.05;
  return [
    { from: Math.max(0, s.rec.marks.typeStart - 0.15), to: s.rec.marks.send, speed: TYPE_SPEED },
    { from: s.rec.marks.send, to: Math.min(s.rec.marks.done + s.hold, last), speed: 1 },
  ];
};
const playF = (s: GuideStop) => {
  const segs = segsOf(s);
  const played = segs.reduce((n, g) => n + (g.to - g.from) / g.speed, 0);
  const wanted = (s.rec.marks.send - segs[0].from) / TYPE_SPEED + (s.rec.marks.done + s.hold - s.rec.marks.send);
  return Math.round(Math.max(played, wanted) * 30);
};
/** film frames into the recording -> recording seconds (freezes on the last stretch's end) */
const recT = (s: GuideStop, k: number) => {
  const segs = segsOf(s);
  let left = Math.max(0, k) / 30;
  for (const g of segs) {
    const len = (g.to - g.from) / g.speed;
    if (left <= len) return g.from + left * g.speed;
    left -= len;
  }
  return segs[segs.length - 1].to;
};
const beats = (s: GuideStop) => {
  const playAt = PLACE + 8;
  const sendAt = playAt + Math.round(((s.rec.marks.send - segsOf(s)[0].from) / TYPE_SPEED) * 30);
  const answered = playAt + playF(s);
  const markAt = answered;
  const outAt = s.mark ? markAt + MARK_DRAW + MARK_HOLD : answered;
  return { playAt, sendAt, markAt, outAt, len: outAt + OUT };
};
/** recording seconds (after the send) -> frames into the stop */
const atF = (s: GuideStop, rt: number) => beats(s).sendAt + Math.round((rt - s.rec.marks.send) * 30);
const starts = (p: CampusGuideProps) => p.stops.reduce<number[]>((a, s, i) => [...a, i === 0 ? INTRO : a[i - 1] + beats(p.stops[i - 1]).len], []);
export const guideEnd = (p: CampusGuideProps) => INTRO + p.stops.reduce((n, s) => n + beats(s).len, 0) + CLOSE;

const Boil: React.FC<{ f: number }> = ({ f }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id="guide-boil" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={Math.floor(f / 4) % 7} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={5} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

/** The real place: footage if shot, else a real photo with a slow push-in (walking forward), else a grey stand-in. */
const Ground: React.FC<{ footage?: string; photo?: Photo; shoot: string; dim: number; len: number }> = ({ footage, photo, shoot, dim, len }) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  if (!footage && photo) {
    const push = interpolate(f, [0, len], [1.0, 1.14], clamp);
    return (
      <AbsoluteFill style={{ overflow: "hidden", filter: dim > 0 ? `blur(${(dim * 4).toFixed(2)}px)` : undefined }}>
        <Img src={staticFile(photo.src)} style={{ width: W, height: H, objectFit: "cover", transform: `scale(${push.toFixed(4)})`, transformOrigin: "50% 45%" }} />
        <AbsoluteFill style={{ background: `rgba(14,9,10,${(0.08 + 0.3 * dim).toFixed(3)})` }} />
        <div style={{ position: "absolute", right: 28, bottom: 26, fontFamily: INTER, fontSize: 20, color: "rgba(255,255,255,0.78)", textShadow: "0 1px 6px rgba(0,0,0,.7)" }}>{photo.credit}</div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ overflow: "hidden", filter: dim > 0 ? `blur(${(dim * 4).toFixed(2)}px)` : undefined }}>
      {footage ? (
        <OffthreadVideo src={staticFile(footage)} muted style={{ width: W, height: H, objectFit: "cover" }} />
      ) : (
        <AbsoluteFill style={{ background: "linear-gradient(175deg, #8d8a86 0%, #b9b5af 45%, #9a968f 100%)" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ position: "absolute", left: 0, right: 0, top: ((i * 420 + f * 4) % (H + 400)) - 200, height: 140, background: "rgba(255,255,255,0.07)" }} />
          ))}
          <div style={{ position: "absolute", left: 120, right: 120, top: 1480, padding: "18px 22px", border: "3px dashed rgba(20,14,16,0.45)", borderRadius: 16,
            fontFamily: INTER, fontWeight: 600, fontSize: 30, lineHeight: 1.25, color: "rgba(20,14,16,0.62)", textAlign: "center" }}>
            Footage here: {shoot}
          </div>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: `rgba(14,9,10,${(0.3 * dim).toFixed(3)})` }} />
    </AbsoluteFill>
  );
};

/** A paper tag in the doodle hand. */
const Tag: React.FC<{ text: string; k: number; x: number; y: number; rot?: number; small?: string; size?: number }> = ({ text, k, x, y, rot = -3, small, size = 50 }) =>
  k <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, padding: "12px 24px 14px", background: PAPER, border: `5px solid ${PRINT}`, borderRadius: "14px 20px 12px 22px",
      boxShadow: `6px 8px 0 ${PRINT}`, opacity: interpolate(k, [0, 0.3], [0, 1], clamp), transform: `rotate(${rot}deg) translateY(${((1 - k) * -26).toFixed(2)}px) scale(${(0.9 + 0.1 * k).toFixed(4)})` }}>
      {small ? <div style={{ fontFamily: HAND, fontSize: 42, color: RED, lineHeight: 1 }}>{small}</div> : null}
      <div style={{ fontFamily: ZODIAK, fontWeight: 700, fontSize: size, color: PRINT, lineHeight: 1.05, letterSpacing: "-0.015em" }}>{text}</div>
    </div>
  );

/** The real desktop app, full frame, through a camera that keeps inside the page. Never boiled: the product never wobbles. */
const Product: React.FC<{ s: GuideStop; t: number }> = ({ s, t }) => {
  const { width: W, height: H } = useVideoConfig();
  const b = beats(s);
  const fr = (() => {
    const rt = recT(s, t - b.playAt);
    const i = s.rec.frames.findIndex((x) => x.t > rt);
    return i === -1 ? s.rec.frames[s.rec.frames.length - 1] : s.rec.frames[Math.max(0, i - 1)];
  })();
  const c = ramp(t, b.sendAt + 4, b.sendAt + 4 + PUSH, CURVE.quiet.standard);
  // a small punch toward the underlined phrase, then back
  const u = s.pops?.find((q) => q.kind === "under") as Extract<Pop, { kind: "under" }> | undefined;
  const ua = u ? atF(s, u.at) : 0;
  const punch = u ? ramp(t, ua, ua + 10, CURVE.quiet.standard) * (1 - ramp(t, ua + 40, ua + 58, CURVE.quiet.standard)) : 0;
  const z = (START.z + (s.cam.z - START.z) * c) * (1 + 0.08 * punch);
  const ucx = u ? (u.box.x0 + u.box.x1) / 2 : 0;
  const fx = START.fx + (s.cam.fx - START.fx) * c + (ucx - s.cam.fx) * 0.2 * punch;
  const fy = START.fy + (s.cam.fy - START.fy) * c;
  const K = W / s.rec.vw; // canvas px per CSS px at zoom 1
  const vw = s.rec.vw / z, vh = H / (K * z);
  const left = Math.min(Math.max(fx - vw / 2, 0), s.rec.vw - vw);
  const top = Math.min(Math.max(fy - vh / 2, 0), s.rec.vh - vh);
  const sc = K * z;
  const m = s.mark;
  const md = ramp(t, b.markAt, b.markAt + MARK_DRAW, CURVE.quiet.standard);
  const pad = 26;
  const mx = m ? (m.x0 - left) * sc - pad : 0, my = m ? (m.y0 - top) * sc - pad * 0.8 : 0;
  const mw = m ? (m.x1 - m.x0) * sc + pad * 2 : 0, mh = m ? (m.y1 - m.y0) * sc + pad * 1.6 : 0;
  // one marker loop, drawn as a slightly open ellipse the way a hand circles a word
  const loop = m ? `M ${mw * 0.06} ${mh * 0.62} C ${mw * 0.0} ${mh * 0.05}, ${mw * 0.9} ${-mh * 0.12}, ${mw * 0.99} ${mh * 0.42} C ${mw * 1.05} ${mh * 0.95}, ${mw * 0.2} ${mh * 1.12}, ${mw * 0.03} ${mh * 0.7} C ${mw * 0.0} ${mh * 0.5}, ${mw * 0.1} ${mh * 0.3}, ${mw * 0.22} ${mh * 0.2}` : "";
  return (
    <AbsoluteFill style={{ background: "#0b0708", overflow: "hidden" }}>
      <Img src={staticFile(`${s.dir}/${fr.name}`)} style={{ position: "absolute", left: -left * sc, top: -top * sc, width: s.rec.vw * sc, height: s.rec.vh * sc, maxWidth: "none" }} />
      {m && md > 0 ? (
        <>
          <svg width={mw + 20} height={mh + 20} style={{ position: "absolute", left: mx - 10, top: my - 10, overflow: "visible", filter: "url(#guide-boil)" }}>
            <path d={loop} transform="translate(10 10)" fill="none" stroke={RED} strokeWidth={7} strokeLinecap="round" pathLength={1}
              strokeDasharray={1} strokeDashoffset={1 - md} />
          </svg>
          <div style={{ position: "absolute", left: mx + mw + 18, top: my + mh * 0.5 - 40, fontFamily: HAND, fontSize: 64, color: RED, whiteSpace: "nowrap",
            opacity: ramp(t, b.markAt + 6, b.markAt + 14), transform: `rotate(-4deg) translateY(${((1 - ramp(t, b.markAt + 6, b.markAt + 16, CURVE.quiet.enter)) * 10).toFixed(1)}px)` }}>next stop</div>
        </>
      ) : null}
      {(s.pops ?? []).map((q, i) => <PopView key={i} q={q} k={t - atF(s, q.at)} at={(x, y) => [(x - left) * sc, (y - top) * sc]} />)}
    </AbsoluteFill>
  );
};

const ICON: Record<"glove" | "ball" | "chart", string> = {
  // hand-drawn in a 24 box: a boxing glove, a ball, a rising line
  glove: "M7 21 L7 17 C4 16 3 12 4 9 C5 5 9 3 13 3 C18 3 21 6 21 10 C21 14 19 16 17 17 L17 21 Z M7 18 L17 18 M9 9 C8 11 9 13 12 13",
  ball: "M12 3 A9 9 0 1 0 12.01 3 Z M3 12 L21 12 M12 3 L12 21 M6 5.5 C9 9 9 15 6 18.5 M18 5.5 C15 9 15 15 18 18.5",
  chart: "M4 4 L4 20 L20 20 M7 16 L11 11 L14 14 L19 7 M15.5 7 L19 7 L19 10.5",
};

/** One pop, drawn in screen px from page points through the camera. Doodle parts boil; the product never does. */
const PopView: React.FC<{ q: Pop; k: number; at: (x: number, y: number) => [number, number] }> = ({ q, k, at }) => {
  if (k < 0) return null;
  const pop = spring({ frame: k, fps: 30, config: { damping: 11, stiffness: 190 } });
  if (q.kind === "under") {
    const [x0, y] = at(q.box.x0, q.box.y1 + 6), [x1] = at(q.box.x1, 0);
    const d = ramp(k, 0, 9, CURVE.quiet.standard);
    return (
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", filter: "url(#guide-boil)" }}>
        <path d={`M ${x0 - 6} ${y + 2} C ${x0 + (x1 - x0) * 0.3} ${y - 5}, ${x0 + (x1 - x0) * 0.7} ${y + 7}, ${x1 + 8} ${y - 1}`} fill="none" stroke={RED}
          strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - d} />
      </svg>
    );
  }
  if (q.kind === "sticker") {
    const [x, y] = at(q.x, q.y);
    const r = 46;
    return (
      <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: PAPER, border: `4px solid ${PRINT}`,
        boxShadow: `4px 5px 0 ${PRINT}`, display: "flex", alignItems: "center", justifyContent: "center", filter: "url(#guide-boil)",
        opacity: interpolate(pop, [0, 0.2], [0, 1], clamp), transform: `rotate(${((1 - pop) * -40 + 8).toFixed(2)}deg) scale(${(0.4 + 0.6 * pop).toFixed(4)})` }}>
        <svg width={58} height={58} viewBox="0 0 24 24"><path d={ICON[q.icon]} fill="none" stroke={q.icon === "glove" ? RED : PRINT} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    );
  }
  const [x, y] = at(q.x, q.y);
  const arrow = q.arrow ? (() => {
    const [p0, p1, p2, p3] = q.arrow.map(([ax, ay]) => at(ax, ay));
    const d = ramp(k, 4, 22, CURVE.quiet.standard);
    const ang = Math.atan2(p3[1] - p2[1], p3[0] - p2[0]);
    const head = (a: number) => `${(p3[0] - 26 * Math.cos(ang + a)).toFixed(1)} ${(p3[1] - 26 * Math.sin(ang + a)).toFixed(1)}`;
    return (
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", filter: "url(#guide-boil)" }}>
        <path d={`M ${p0.join(" ")} C ${p1.join(" ")}, ${p2.join(" ")}, ${p3.join(" ")}`} fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - d} />
        {d > 0.95 ? <path d={`M ${head(0.5)} L ${p3[0]} ${p3[1]} L ${head(-0.5)}`} fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
    );
  })() : null;
  return (
    <>
      {arrow}
      <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${(q.rot + (1 - pop) * 10).toFixed(2)}deg) scale(${(0.5 + 0.5 * pop).toFixed(4)})`,
        opacity: interpolate(pop, [0, 0.2], [0, 1], clamp), padding: "8px 22px 12px", background: PAPER, border: `4px solid ${PRINT}`, borderRadius: "12px 18px 10px 20px",
        boxShadow: `5px 6px 0 ${PRINT}`, whiteSpace: "nowrap", fontFamily: HAND, fontSize: q.size ?? 58, lineHeight: 1.05, color: PRINT, filter: "url(#guide-boil)" }}>
        {q.text}
      </div>
    </>
  );
};

export const CampusGuide: React.FC<CampusGuideProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, height: H } = useVideoConfig();
  const st = starts(p);
  const END = guideEnd(p);
  const lastEnd = END - CLOSE;
  const inIntro = f < INTRO;
  const si = Math.min(p.stops.length - 1, Math.max(0, st.filter((s) => s <= f).length - 1));
  const s = p.stops[si];
  const b = beats(s);
  const t = f - st[si];

  const introW = ramp(f, 0, 6, CURVE.quiet.standard);
  const introOut = ramp(f, INTRO - 10, INTRO + 4, CURVE.quiet.exit);

  // the product rises over the place, plays, and slides away as the next place arrives under it
  const k = inIntro || f >= lastEnd + OUT ? 0 : spring({ frame: t - PLACE, fps, config: { damping: 18, stiffness: 110 } });
  const out = inIntro ? 0 : ramp(t, b.outAt, b.outAt + OUT, CURVE.quiet.exit);
  const prodOn = !inIntro && t >= PLACE && t < b.outAt + OUT;
  const tagK = inIntro ? 0 : ramp(t, 2, 2 + DUR.arrive, CURVE.quiet.enter) * (1 - ramp(t, PLACE, PLACE + 8));
  const closeK = ramp(f, lastEnd + 4, lastEnd + 26, CURVE.quiet.standard);

  return (
    <Clip endAt={END} light noCarry noLogo>
      <AbsoluteFill style={{ opacity: 1 - ramp(f, END - 6, END + 6, CURVE.quiet.exit) }}>
        <Sequence from={0} durationInFrames={INTRO + 8} layout="none">
          <Ground footage={p.intro.footage} photo={p.intro.photo} shoot={p.intro.shoot} dim={0} len={INTRO + 8} />
        </Sequence>
        {p.stops.map((stop, i) => {
          const from = i === 0 ? st[i] : st[i] - OUT; // arrives under the product as it leaves
          return (
            <Sequence key={i} from={from} durationInFrames={i === p.stops.length - 1 ? END - from + 40 : st[i] - from + beats(stop).len} layout="none">
              <Ground footage={stop.footage} photo={stop.photo} shoot={stop.shoot} dim={i === p.stops.length - 1 && f >= lastEnd ? 0.8 : 0} len={st[i] - from + beats(stop).len} />
            </Sequence>
          );
        })}

        <Boil f={f} />
        {prodOn ? (
          <AbsoluteFill style={{ opacity: interpolate(k, [0, 0.25], [0, 1], clamp), transform: `translateY(${((1 - k) * H * 0.6 - out * H).toFixed(1)}px)` }}>
            <Product s={s} t={t} />
          </AbsoluteFill>
        ) : null}

        {/* the held logo, stepped aside while the product fills the frame (it sat on the question bubble) */}
        <Img src={staticFile(B.logo!.onLight)} style={{ position: "absolute", left: 64, top: 96, width: 216, height: "auto",
          opacity: ramp(f, 6, 16, CURVE.quiet.enter) * (1 - ramp(f, END - 8, END, CURVE.quiet.exit)) * (1 - (prodOn ? Math.min(1, k) * (1 - out) : 0)) }} />
        <AbsoluteFill style={{ filter: "url(#guide-boil)", overflow: "hidden" }}>
          {inIntro || f < INTRO + 6 ? (
            <div style={{ position: "absolute", left: 70, right: 70, top: 760, padding: "30px 36px 34px", background: PAPER, border: `5px solid ${PRINT}`,
              borderRadius: "22px 30px 20px 32px", boxShadow: `8px 10px 0 ${PRINT}`, transform: `rotate(-2deg) translateY(${(-introOut * 120).toFixed(1)}px)`,
              opacity: interpolate(introW, [0, 0.1], [0, 1], clamp) * (1 - introOut) }}>
              <div style={{ fontFamily: HAND, fontSize: 96, lineHeight: 1.05, color: PRINT }}>
                {p.intro.line.split(" ").map((w, i) => {
                  const wk = ramp(f, i * 4, i * 4 + 9, CURVE.quiet.enter);
                  return <span key={i} style={{ display: "inline-block", marginRight: "0.25em", opacity: wk, transform: `translateY(${((1 - wk) * 10).toFixed(1)}px)`, color: /CampusAI/.test(w) ? RED : PRINT }}>{w}</span>;
                })}
              </div>
            </div>
          ) : null}
          {!inIntro && f < lastEnd ? <Tag text={s.place} k={tagK} x={60} y={170} /> : null}
          {f >= lastEnd ? (
            <div style={{ position: "absolute", left: 80, right: 80, top: 820, padding: "26px 34px 30px", background: PAPER, border: `5px solid ${PRINT}`,
              borderRadius: "22px 30px 20px 32px", boxShadow: `8px 10px 0 ${PRINT}`, transform: "rotate(-2deg)", textAlign: "center",
              opacity: interpolate(closeK, [0, 0.15], [0, 1], clamp) }}>
              <div style={{ fontFamily: HAND, fontSize: 96, lineHeight: 1.02, color: PRINT, clipPath: `inset(0 ${((1 - closeK) * 100).toFixed(2)}% 0 0)` }}>
                {p.closer.split(" ").map((w, i) => <span key={i} style={{ color: w.startsWith("CampusAI") ? RED : PRINT }}>{w} </span>)}
              </div>
            </div>
          ) : null}
        </AbsoluteFill>

        <Cue at={0} name="marker-pen-line" volume={0.5} />
        {p.stops.map((stop, i) => {
          const bb = beats(stop);
          return (
            <React.Fragment key={i}>
              <Cue at={st[i] + PLACE} name="paper-slide" volume={0.45} />
              <Cue at={st[i] + bb.sendAt} name="typewriter-hit-soft" volume={0.45} />
              {stop.mark ? <Cue at={st[i] + bb.markAt} name="marker-pen-line" volume={0.5} /> : null}
              {(stop.pops ?? []).map((q, j) => (
                <Cue key={j} at={st[i] + atF(stop, q.at)} name={q.kind === "under" ? "marker-pen-line" : q.kind === "sticker" ? "switch-tap" : "paper-slide"} volume={q.kind === "sticker" ? 0.55 : 0.4} />
              ))}
              <Cue at={st[i] + bb.outAt} name="paper-move-quick" volume={0.5} />
            </React.Fragment>
          );
        })}
        <Cue at={lastEnd + 4} name="marker-pen-line" volume={0.5} />
      </AbsoluteFill>
    </Clip>
  );
};
