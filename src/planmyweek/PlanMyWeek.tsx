/**
 * "Plan my week", round 6 (Nov 5). Three students say what is hard, and each is answered by the product straight
 * away: problem, answer, three times, then "CampusAI puts it all in one place." and the logo. Jacob rejected the
 * week-coming-together idea ("doesn't make sense": the quotes were about finding things and the film was about a
 * calendar, and the verbs were a feature tour) and picked this.
 *
 * - Each quote lands in Zodiak italic over a blurred, dimmed view of the very screen that answers it; then the focus
 *   racks from the words to that screen (the rack focus of adiiguu's Island film), the same move three times.
 * - The answers: the week with the Canvas due row and the events in it (flooded with events and assignments); the
 *   Goldman Sachs role on Job Match with its why-it-fits line (cool opportunities); the suggested Goldman Sachs info
 *   session pressed onto the week (very difficult to find).
 * - The product fills the frame; the camera holds still once it arrives; the Focus walk light picks out the part that
 *   answers (`frameRect` is the kit part's own). Every press lands on the next real frame of the recording.
 *
 * Every product pixel is one dark recording of campusai-demo at 3x (`npm run flow plan-my-week`, stills used copied
 * to public/plan-my-week/dark). The Maryland M beside the logo is covered.
 *
 * Music: "Tech House vibes" (Mixkit, 122 BPM), trimmed so frame 0 is a beat and the track's lift lands on the first
 * answer. Brief, facts and shot list: Content/video-studio/films/plan-my-week/. Earlier rounds' code: ./_round2/,
 * ./_round5/.
 */
import React from "react";
import { AbsoluteFill, Composition, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { EASE, EASE_CAMERA, INTER, PageView, PointerAt, brand, camAlong, clampCam, glow, rectOnCanvas, toCanvas, useZodiak } from "../kit";
import type { PageCam, Rect } from "../kit";
import { frameRect } from "../kit/pass/camera/FocusWalk";

const B = brand("campusai");
const FPS = 30;
const RED = B.color.accent;
const INK = B.color.ink;
const SOFT = B.color.inkSoft;
const DIR = "plan-my-week";
const img = (n: string) => staticFile(`${DIR}/dark/${n}.jpg`);
const aud = (n: string) => staticFile(`${DIR}/audio/${n}`);
const PAGE = { w: 1440, h: 900 };
const DPR = 3;

// ---- time: Tech House vibes, 122 BPM; one beat = 14.754 frames ----
const BEAT = (60 / 122) * FPS;
const Bt = (n: number) => Math.round(n * BEAT);
const T = {
  q1: 3, // "Flooded with events and assignments."
  a1: Bt(8), // ...answered: the week, its due row and its events (the music's lift lands here)
  q2: Bt(17), // "I really have a hard time finding cool opportunities"
  a2: Bt(27), // ...answered: a role picked for them on Job Match, with why it fits
  q3: Bt(34), // "They're very difficult to find."
  a3: Bt(42), // ...answered: an event found for them, added to the week
  suggPress: Bt(44),
  addPress: Bt(47),
  close: Bt(51), // "CampusAI puts it all in one place."
  end: Bt(59),
};
export const FRAMES = Bt(66); // 32.5 s
// The track's lift sits at 14.32 s; trim so it lands on T.a1. Track beats fall at 0.054 + n * 0.4918 s.
const MUSIC_TRIM = Math.round((14.32 - T.a1 / FPS) * FPS);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const k = (f: number, a: number, b: number, easing = EASE) => interpolate(f, [a, b], [0, 1], { ...clamp, easing });

/** The page fills the whole frame (the product IS the frame, no window on a ground); `band` is the top strip the
 *  headline sits in, over a soft fade of the page, and framed regions are centred in the frame below it. */
type L = { W: number; H: number; port: boolean; view: Rect; band: { y: number; size: number; h: number } };

// ---- the real page, measured on the dark frames (page px, 1440 x 900; public/plan-my-week/dark) ----
const R = {
  week: { x: 472, y: 48, w: 968, h: 665 },
  dueRow: { x: 520, y: 107, w: 790, h: 28 }, // the Due row: Canvas assignments across the week of Nov 8
  smith: { x: 521, y: 601, w: 128, h: 65 }, // Sunday 6:30 PM, Smith Finance Group, an event on the same week
  sugg: { x: 916, y: 580, w: 127, h: 64 }, // Wednesday 6 PM, the Goldman Sachs info session (dashed, then solid)
  gsCard: { x: 270, y: 391, w: 434, h: 193 }, // Goldman Sachs, 2027 Summer Analyst, its why-it-fits line
  pop: { x: 830, y: 444, w: 300, h: 198 }, // the suggestion's popup, + Add
};
const PRESS = {
  sugg: { x: 980, y: 612 },
  add: { x: 911, y: 608 },
};
const MARK = { r: { x: 116, y: 10, w: 40, h: 36 }, color: "rgb(33, 21, 21)" }; // the Maryland M beside the logo

/** A camera that frames a region at the Focus walk's padding, centred in the frame below the headline band. */
const fr = (r: Rect, l: L, pad = 1.18): PageCam => {
  const below = { x: 0, y: l.band.h, w: l.W, h: l.H - l.band.h };
  const c = frameRect(r, PAGE, below, pad, DPR);
  // never wider than the page is tall at this frame's shape, so the page always fills the frame (on the phone frame a
  // wider camera showed empty ground under the page)
  const cw = Math.min(c.cw, (PAGE.h * l.W) / l.H);
  const s = l.W / cw;
  return clampCam({ cx: c.cx, cy: c.cy - l.band.h / 2 / s, cw }, PAGE, l.view);
};
// Wide shows the whole week; the phone frame shows Sunday to Thursday filling the frame (the full week at phone
// width sat small with empty bands above and below it).
const whole = (l: L): PageCam =>
  l.port
    ? clampCam({ cx: R.week.x + 250, cy: 450, cw: (PAGE.h * l.W) / l.H }, PAGE, l.view)
    : clampCam({ cx: 1440 - 590, cy: R.week.y + R.week.h / 2 - 20, cw: 1180 }, PAGE, l.view);

/** Which recorded frame the page shows at a given film frame; the newest key at or before `f` wins. */
const SRC: [number, string][] = [
  [0, "before"],
  [T.q2 - 8, "jobs"],
  [T.q3 - 8, "before"],
  [T.suggPress + 3, "event-sheet"],
  [T.addPress + 3, "event-landed"],
];
const srcAt = (f: number) => {
  let s = SRC[0][1];
  for (const [t, n] of SRC) if (f >= t) s = n;
  return s;
};
/** Page changes cross through a short blur dip, hidden under the next quote: 8 frames each side of the key. */
const PAGE_CHANGES = [T.q2 - 8, T.q3 - 8];
const dip = (f: number) => Math.max(0, ...PAGE_CHANGES.map((t) => 1 - Math.min(1, Math.abs(f - t) / 8)));

/** Camera keys. Each quote sits over the framing of its own answer, so the rack to the answer is pure focus; the
 *  camera moves only for the event's press and the closing pull back, and holds dead still once it arrives. */
const cams = (l: L): { t: number; cam: PageCam }[] => {
  const W0 = whole(l);
  const hold = (t0: number, t1: number, cam: PageCam) => [{ t: t0, cam }, { t: t1, cam }];
  // the first answer frames the week from its Due row down, with the Due row clear of the headline band (the page's
  // top edge then sits under the band's dark fade)
  const s1 = l.port ? l.W / ((PAGE.h * l.W) / l.H) : l.W / 1316;
  const week1: PageCam = { cx: l.port ? R.week.x + 253 : 1440 - 658, cy: 95 + (l.H / 2 - (l.band.h + (l.port ? -20 : 0))) / s1, cw: l.W / s1 };
  return [
    ...hold(0, T.q2 - 8, week1),
    ...hold(T.q2 - 7, T.q3 - 8, fr(R.gsCard, l, 1.25)),
    ...hold(T.q3 - 7, T.suggPress + 4, fr(R.sugg, l, 3.0)),
    ...hold(T.suggPress + 26, T.addPress + 4, fr(R.pop, l, 1.35)),
    ...hold(T.addPress + 26, T.close - 4, fr(R.sugg, l, 2.6)),
    ...hold(T.close + 26, FRAMES, W0),
  ];
};

/** The lit region (Focus walk's light) with its window: [from, to, rect]. */
const LIGHT: [number, number, Rect][] = [
  [T.a1 + 10, T.a1 + 56, R.dueRow],
  [T.a1 + 76, T.q2 - 16, R.smith],
  [T.a2 + 10, T.q3 - 16, R.gsCard],
  [T.a3 + 10, T.suggPress - 12, R.sugg],
  [T.suggPress + 10, T.addPress - 12, R.pop],
  [T.addPress + 14, T.close - 12, R.sugg],
];
const lightAt = (f: number) => {
  for (const [a, b, r] of LIGHT) {
    if (f >= a - 10 && f <= b + 10) return { r, on: Math.min(k(f, a - 10, a, EASE_CAMERA), 1 - k(f, b, b + 10, EASE_CAMERA)) };
  }
  return null;
};

/** How dim the page is: deep under each quote and the closing line, the Focus walk's 0.5 while a region is lit. */
const dimAt = (f: number) => {
  const under = (q: number, a: number) => 0.9 * Math.min(k(f, q - 10, q), 1 - k(f, a, a + 18));
  const quotes = Math.max(0.9 * (1 - k(f, T.a1, T.a1 + 18)), under(T.q2, T.a2), under(T.q3, T.a3));
  const close = 0.86 * k(f, T.close, T.close + 14);
  const lit = lightAt(f);
  return Math.max(quotes, close, lit ? 0.5 * lit.on : 0);
};

const Pointer: React.FC<{ l: L; cam: PageCam; target: { x: number; y: number }; t0: number; press: number }> = ({ l, cam, target, t0, press }) => {
  const f = useCurrentFrame();
  if (f < t0 || f > press + 12) return null;
  const p = toCanvas(cam, l.view, target.x, target.y);
  const g = k(f, t0, press - 3, EASE_CAMERA);
  const off = { x: (l.port ? 220 : 300) * (1 - g), y: (l.port ? 200 : 220) * (1 - g) - Math.sin(g * Math.PI) * 30 };
  const since = f >= press ? (f - press) / FPS : null;
  return <PointerAt x={p.x + off.x} y={p.y + off.y} since={since} accent={RED} size={l.port ? 62 : 54} opacity={k(f, t0, t0 + 5) * (1 - k(f, press + 6, press + 12))} />;
};

/** The page carrier: one real page through one camera, lit where the story is. */
const Carrier: React.FC<{ l: L }> = ({ l }) => {
  const f = useCurrentFrame();
  const cam = camAlong(f, cams(l));
  const d = dimAt(f);
  const lit = lightAt(f);
  const s = l.view.w / cam.cw;
  const o = toCanvas(cam, l.view, 0, 0);
  const src = img(srcAt(f));
  const patches = [MARK];
  // under a quote the page goes further out of focus than the dim alone takes it, so the words never fight its text
  const soft = Math.max(1 - k(f, T.a1, T.a1 + 18), ...[[T.q2, T.a2], [T.q3, T.a3]].map(([q, a]) => Math.min(k(f, q - 10, q), 1 - k(f, a, a + 18))));
  const blur = dip(f) * 14 + soft * 9;
  const outro = 1 - k(f, T.end, T.end + 14);
  return (
    <AbsoluteFill style={{ opacity: outro, filter: blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
      <PageView src={src} page={PAGE} cam={cam} view={l.view} brand={B} dim={d} radius={0}>
        {lit && lit.on > 0.005 && (() => {
          const r = rectOnCanvas(cam, l.view, { x: lit.r.x - 8, y: lit.r.y - 8, w: lit.r.w + 16, h: lit.r.h + 16 });
          return (
            <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 12 * s, overflow: "hidden", opacity: lit.on,
              boxShadow: `0 0 0 ${Math.max(1.2, 0.8 * s).toFixed(2)}px ${glow(B, 0.5)}, 0 0 70px ${glow(B, 0.2)}` }}>
              <Img src={src} style={{ position: "absolute", left: o.x - r.x, top: o.y - r.y, width: PAGE.w * s, height: PAGE.h * s, maxWidth: "none" }} />
              {patches.map((p, i) => {
                const q = rectOnCanvas(cam, l.view, p.r);
                return <div key={i} style={{ position: "absolute", left: q.x - r.x, top: q.y - r.y, width: q.w, height: q.h, background: p.color }} />;
              })}
            </div>
          );
        })()}
        {patches.map((p, i) => {
          const q = rectOnCanvas(cam, l.view, p.r);
          return <div key={`p${i}`} style={{ position: "absolute", left: q.x, top: q.y, width: q.w, height: q.h, background: p.color, filter: d ? `brightness(${(1 - d * 0.72).toFixed(3)})` : undefined }} />;
        })}
      </PageView>
      <Pointer l={l} cam={cam} target={PRESS.sugg} t0={T.a3 + 16} press={T.suggPress} />
      <Pointer l={l} cam={cam} target={PRESS.add} t0={T.suggPress + 22} press={T.addPress} />
    </AbsoluteFill>
  );
};

// ---- the students' words, each over a blurred view of the screen that answers it ----
const QUOTES = [
  { at: T.q1, out: T.a1, text: "Flooded with events and assignments.", who: "Freshman, Finance" },
  { at: T.q2, out: T.a2, text: "I really have a hard time finding cool opportunities", who: "Freshman, Economics" },
  { at: T.q3, out: T.a3, text: "They're very difficult to find.", who: "UMD student" },
];

const Quote: React.FC<{ q: (typeof QUOTES)[number]; size: number; maxW: number }> = ({ q, size, maxW }) => {
  const f = useCurrentFrame();
  const words = q.text.split(" ");
  const credit = k(f, q.at + words.length * 3 + 4, q.at + words.length * 3 + 18);
  return (
    <div style={{ width: maxW, textAlign: "center" }}>
      <div style={{ fontFamily: "Zodiak", fontStyle: "italic", fontWeight: 400, fontSize: size, lineHeight: 1.12, letterSpacing: "-0.012em", color: INK }}>
        {words.map((w, i) => {
          const p = k(f, q.at + i * 3, q.at + i * 3 + 14);
          const first = i === 0;
          const last = i === words.length - 1;
          return (
            <span key={i} style={{ display: "inline-block", opacity: p, filter: `blur(${((1 - p) * 16).toFixed(1)}px)`, transform: `translateY(${((1 - p) * 0.28 * size).toFixed(1)}px)`, marginRight: last ? 0 : "0.24em" }}>
              {first && <span style={{ color: RED }}>“</span>}
              {w}
              {last && <span style={{ color: RED }}>”</span>}
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: size * 0.32, fontFamily: INTER, fontWeight: 500, fontSize: size * 0.36, color: SOFT, opacity: credit, transform: `translateY(${(1 - credit) * 10}px)` }}>
        {q.who}
      </div>
    </div>
  );
};

const Quotes: React.FC<{ l: L }> = ({ l }) => {
  const f = useCurrentFrame();
  const size = l.port ? 78 : 76;
  const maxW = l.port ? 960 : 1600;
  return (
    <>
      {QUOTES.map((q, i) => {
        if (f < q.at || f > q.out + 20) return null;
        // the rack: the words go soft and fall back as the answer behind them comes sharp
        const out = k(f, q.out, q.out + 18);
        return (
          <AbsoluteFill key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 - out,
            transform: `scale(${(1 - 0.08 * out).toFixed(4)})`, filter: out > 0.01 ? `blur(${(out * 16).toFixed(1)}px)` : undefined }}>
            <Quote q={q} size={size} maxW={maxW} />
          </AbsoluteFill>
        );
      })}
    </>
  );
};

// ---- a headline in the band above the page: Zodiak, words out of a blur, one accent word in red italic ----
const Headline: React.FC<{ words: { t: string; accent?: boolean; br?: boolean }[]; at: number; outAt: number; size: number; y: number; maxW: number; W: number }> = ({ words, at, outAt, size, y, maxW, W }) => {
  const f = useCurrentFrame();
  if (f < at || f > outAt + 12) return null;
  const out = k(f, outAt, outAt + 10);
  return (
    <div style={{ position: "absolute", left: W / 2 - maxW / 2, top: y, width: maxW, textAlign: "center", lineHeight: 1.08, transform: "translateY(-50%)",
      opacity: 1 - out, filter: out > 0.01 ? `blur(${(out * 14).toFixed(1)}px)` : undefined }}>
      {words.map((w, i) => {
        const p = k(f, at + i * 3, at + i * 3 + 14);
        return (
          <React.Fragment key={i}>
            {w.br && <br />}
            <span style={{ display: "inline-block", marginRight: "0.24em", opacity: p, filter: `blur(${((1 - p) * 16).toFixed(1)}px)`, transform: `translateY(${((1 - p) * 0.28 * size).toFixed(1)}px)`,
              fontFamily: "Zodiak", fontWeight: w.accent ? 400 : 700, fontStyle: w.accent ? "italic" : "normal", fontSize: size, letterSpacing: "-0.02em", color: w.accent ? RED : INK }}>
              {w.t}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};
const words = (s: string, accent: string[] = [], br?: string) => s.split(" ").map((t) => ({ t, accent: accent.includes(t), br: t === br }));

const Logo: React.FC<{ x: number; y: number; w: number; opacity: number; blur?: number }> = ({ x, y, w, opacity, blur = 0 }) =>
  B.logo && opacity > 0.001 ? (
    <Img src={staticFile(B.logo.onDark)} style={{ position: "absolute", left: x - w / 2, top: y - w / B.logo.ratio / 2, width: w, opacity, filter: blur ? `blur(${blur.toFixed(2)}px)` : undefined }} />
  ) : null;

const SFX: [number, string, number][] = [
  [T.q1, "ui-message-pop.mp3", 0.4],
  [T.a1, "swoosh-quick.mp3", 0.4],
  [T.q2, "ui-message-pop.mp3", 0.4],
  [T.a2, "swoosh-quick.mp3", 0.4],
  [T.q3, "ui-message-pop.mp3", 0.4],
  [T.a3, "swoosh-quick.mp3", 0.4],
  [T.suggPress, "ui-select-click.mp3", 0.55],
  [T.addPress, "ui-select-click.mp3", 0.6],
  [T.addPress + 14, "ui-success-soft.mp3", 0.4],
  [T.close, "swoosh-quick.mp3", 0.35],
];

export const PlanMyWeek: React.FC<{ port: boolean }> = ({ port }) => {
  useZodiak();
  const f = useCurrentFrame();
  const l: L = port
    ? { W: 1080, H: 1920, port, view: { x: 0, y: 0, w: 1080, h: 1920 }, band: { y: 300, size: 84, h: 420 } }
    : { W: 1920, H: 1080, port, view: { x: 0, y: 0, w: 1920, h: 1080 }, band: { y: 104, size: 70, h: 190 } };
  const markIn = k(f, 4, 14);
  const markOut = k(f, T.end - 6, T.end + 4);
  const endK = k(f, T.end + 6, T.end + 30, EASE);
  const hl = (s: string, at: number, outAt: number, accent: string[]) => (
    <Headline words={words(s, accent)} at={at} outAt={outAt} size={l.band.size} y={l.band.y} maxW={l.W - 120} W={l.W} />
  );
  return (
    <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient }}>
      <Carrier l={l} />
      {/* the headline band: the page fades into the brand's near-black at the top (a soft fade, never a box) */}
      <AbsoluteFill style={{ pointerEvents: "none", opacity: 1 - k(f, T.end, T.end + 10),
        background: `linear-gradient(to bottom, rgba(11,7,8,0.95) 0%, rgba(11,7,8,0.8) ${((l.band.h * 0.6) / l.H) * 100}%, rgba(11,7,8,0) ${((l.band.h * 1.25) / l.H) * 100}%)` }} />
      <Quotes l={l} />
      <Headline words={words("CampusAI puts it all in one place.", ["one", "place."], port ? "it" : "in")}
        at={T.close + 2} outAt={T.end - 6} size={port ? 104 : 112} y={l.H / 2 - (port ? 20 : 10)} maxW={port ? 960 : 1600} W={l.W} />
      {hl("Deadlines and events, in one week.", T.a1 + 4, T.q2 - 10, ["one", "week."])}
      {hl("Roles picked for you.", T.a2 + 4, T.q3 - 10, ["you."])}
      {hl("Events found for you.", T.a3 + 4, T.close - 10, ["you."])}
      <Logo x={port ? 150 : 132} y={port ? 110 : 62} w={port ? 200 : 160} opacity={markIn * (1 - markOut)} />
      {f >= T.end + 4 && (
        <>
          <Logo x={l.W / 2} y={l.H / 2 - 40} w={(port ? 640 : 600) * (0.94 + 0.06 * endK + interpolate(f, [T.end + 30, FRAMES], [0, 0.02], clamp))} opacity={endK} blur={(1 - endK) * 12} />
          <div style={{ position: "absolute", left: 0, width: l.W, top: l.H / 2 + (port ? 70 : 60), textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: port ? 46 : 40, color: SOFT, opacity: k(f, T.end + 18, T.end + 32) }}>campusai.app</div>
        </>
      )}
      <Audio src={aud("tech-house-vibes.mp3")} trimBefore={MUSIC_TRIM} volume={(fr) => 0.5 * Math.min(1, fr / 4) * Math.min(1, Math.max(0, (FRAMES - fr) / 36))} />
      {SFX.map(([t, src, v], i) => (
        <Sequence key={i} from={t} durationInFrames={60} layout="none">
          <Audio src={aud(src)} volume={() => v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const PlanMyWeekRoot: React.FC = () => (
  <>
    <Composition id="PlanMyWeek-16x9" component={PlanMyWeek} durationInFrames={FRAMES} fps={FPS} width={1920} height={1080} defaultProps={{ port: false }} />
    <Composition id="PlanMyWeek-9x16" component={PlanMyWeek} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{ port: true }} />
  </>
);
