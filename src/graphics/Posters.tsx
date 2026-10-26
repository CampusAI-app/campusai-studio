/**
 * Film posters for the five wave 1 films (2026-10-23), Graphic-Poster pattern: each poster is the film's
 * strongest frame, taken with `--frame N --scale 2` from the film's own composition, plus its title and
 * the logo. Nothing here is a separately designed screen: the only thing a poster does to its frame is
 * place it (and, for a second aspect, crop it), feathering a cut edge into the same dark ground the
 * films use. Logo on top, title under it, the product below and big, the way the films open.
 *
 * Frames (public/graphics/posters/, gitignored, re-make with the commands in each comment):
 *   calm-tour-f56      Tour-16x9 frame 56: the camera inside the push, laptop big with the daily brief
 *   ask-friend-f300    AskFriend-9x16 frame 300: the real answer to "What should I ask at the Evercore chat?"
 *   sunday-night-f470  Sunday-4x5 frame 470: the study-time answer, its Wed, Oct 21 6pm to 8pm button lit, just before the press
 *   picked-today-f200  Picked-9x16 frame 200: the red dot standing on the Evercore job in Worth a look
 *   inside-match-f315  InsideMatch-9x16 frame 315: the Deloitte detail apart into its sections
 *
 *   npx remotion still src/wave1/<film>/entry.ts <Id> public/graphics/posters/<film>-f<N>.png --frame N --scale 2 --gl=angle
 *
 * Words: every title is the film's own on-screen line or its brief's sentence (films/graphics-oct23/facts.md).
 */
import React from "react";
import { AbsoluteFill, Composition, Img, staticFile } from "remotion";
import { brand, glow, INTER, useBrandFonts } from "../kit";

const B = brand("campusai");
const ZODIAK = "Zodiak";

type Box = { x: number; y: number; w: number; h: number };
type Feather = { top?: number; bottom?: number; left?: number; right?: number };

const Ground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useBrandFonts(B);
  return <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient, fontFamily: INTER }}>{children}</AbsoluteFill>;
};

/** The real logo, its width in px, centred on `cx` (or left-aligned at `x`). */
const Logo: React.FC<{ y: number; width: number; cx?: number; x?: number }> = ({ y, width, cx, x }) =>
  B.logo ? (
    <Img src={staticFile(B.logo.onDark)} style={{ position: "absolute", top: y, left: x ?? (cx ?? 0) - width / 2, width,
      filter: `drop-shadow(0 0 24px ${glow(B, 0.45)})` }} />
  ) : null;

const Title: React.FC<{ text: string; y: number; size: number; x?: number; w: number; align?: "center" | "left" }> = ({ text, y, size, x = 0, w, align = "center" }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, fontFamily: ZODIAK, fontWeight: 700, fontSize: size, lineHeight: 1.08,
    letterSpacing: "-0.02em", color: B.color.ink, textAlign: align, textWrap: "balance" }}>{text}</div>
);

/**
 * A film frame (rendered at 2x) cropped to `crop` (in the film's own 1x pixels) and placed at `to`
 * (x, y, width; height follows). Cut edges fade into the ground over `feather` px.
 */
const Frame: React.FC<{ src: string; film: { w: number; h: number }; crop: Box; to: { x: number; y: number; w: number }; feather?: Feather }> = ({
  src, film, crop, to, feather = {},
}) => {
  const s = to.w / crop.w;
  const h = crop.h * s;
  const { top = 0, bottom = 0, left = 0, right = 0 } = feather;
  const v = `linear-gradient(180deg, transparent 0, #000 ${top}px, #000 calc(100% - ${bottom}px), transparent 100%)`;
  const hz = `linear-gradient(90deg, transparent 0, #000 ${left}px, #000 calc(100% - ${right}px), transparent 100%)`;
  return (
    <div style={{ position: "absolute", left: to.x, top: to.y, width: to.w, height: h, overflow: "hidden",
      maskImage: `${v}, ${hz}`, maskComposite: "intersect", WebkitMaskImage: `${v}, ${hz}`, WebkitMaskComposite: "source-in" }}>
      <Img src={staticFile(src)} style={{ position: "absolute", left: -crop.x * s, top: -crop.y * s, width: film.w * s, height: film.h * s, maxWidth: "none" }} />
    </div>
  );
};

const V = { w: 1080, h: 1920 };
const F = { w: 1080, h: 1350 };
const WIDE = { w: 1920, h: 1080 };

/* ── Calm tour: "This is where you find everything." ─────────────────────────────────────────── */
const CALM = "graphics/posters/calm-tour-f56.png";
const CALM_TITLE = "This is where you find everything.";

const CalmWide: React.FC = () => (
  <Ground>
    {/* the whole frame, a little smaller, right and bottom; its own dark room fades into the ground */}
    <Frame src={CALM} film={WIDE} crop={{ x: 0, y: 0, w: 1920, h: 1080 }} to={{ x: 470, y: 196, w: 1920 * 0.82 }} feather={{ top: 160, left: 260 }} />
    <Logo x={130} y={318} width={250} />
    <Title text={CALM_TITLE} x={130} y={410} w={640} size={84} align="left" />
  </Ground>
);

const CalmFeed: React.FC = () => (
  <Ground>
    <Frame src={CALM} film={WIDE} crop={{ x: 360, y: 0, w: 1360, h: 1080 }} to={{ x: 0, y: 462, w: 1080 }} feather={{ top: 120 }} />
    <Logo cx={540} y={92} width={230} />
    <Title text={CALM_TITLE} y={196} w={1080} x={0} size={72} />
  </Ground>
);

/* ── Ask it like a friend ────────────────────────────────────────────────────────────────────── */
const ASK = "graphics/posters/ask-friend-f300.png";
const ASK_TITLE = "Ask it like you'd ask a friend.";

const AskVertical: React.FC = () => (
  <Ground>
    <Frame src={ASK} film={V} crop={{ x: 0, y: 0, w: 1080, h: 1920 }} to={{ x: 0, y: 0, w: 1080 }} />
    <Logo cx={540} y={176} width={260} />
    <Title text={ASK_TITLE} y={290} x={90} w={900} size={80} />
  </Ground>
);

const AskFeed: React.FC = () => (
  <Ground>
    <Frame src={ASK} film={V} crop={{ x: 0, y: 470, w: 1080, h: 1000 }} to={{ x: 0, y: 330, w: 1080 }} feather={{ top: 60, bottom: 90 }} />
    <Logo cx={540} y={86} width={220} />
    <Title text={ASK_TITLE} y={176} x={60} w={960} size={64} />
  </Ground>
);

/* ── Sunday night (home 4:5 only) ────────────────────────────────────────────────────────────── */
const SUNDAY = "graphics/posters/sunday-night-f470.png";

const SundayFeed: React.FC = () => (
  <Ground>
    <Frame src={SUNDAY} film={F} crop={{ x: 40, y: 0, w: 1040, h: 820 }} to={{ x: 0, y: 380, w: 1080 }} feather={{ top: 24, bottom: 110, left: 60 }} />
    <Logo cx={540} y={92} width={230} />
    <Title text="11:48 PM. Sunday." y={196} x={0} w={1080} size={84} />
  </Ground>
);

/* ── What it picked for you today ────────────────────────────────────────────────────────────── */
const PICKED = "graphics/posters/picked-today-f200.png";
const PICKED_TITLE = "What it picked for you today.";

const PickedVertical: React.FC = () => (
  <Ground>
    {/* the frame below its own watermark logo, which the poster's logo replaces */}
    <Frame src={PICKED} film={V} crop={{ x: 0, y: 186, w: 1080, h: 1290 }} to={{ x: 0, y: 520, w: 1080 }} feather={{ top: 40, bottom: 140 }} />
    <Logo cx={540} y={170} width={260} />
    <Title text={PICKED_TITLE} y={282} x={90} w={900} size={80} />
  </Ground>
);

const PickedFeed: React.FC = () => (
  <Ground>
    <Frame src={PICKED} film={V} crop={{ x: 0, y: 372, w: 960, h: 690 }} to={{ x: 0, y: 392, w: 1080 }} feather={{ top: 40, bottom: 90 }} />
    <Logo cx={540} y={92} width={230} />
    <Title text={PICKED_TITLE} y={196} x={60} w={960} size={68} />
  </Ground>
);

/* ── Inside a match ──────────────────────────────────────────────────────────────────────────── */
const INSIDE = "graphics/posters/inside-match-f315.png";
const INSIDE_TITLE = "Strong match. But why?";

const InsideVertical: React.FC = () => (
  <Ground>
    <Frame src={INSIDE} film={V} crop={{ x: 0, y: 0, w: 1080, h: 1920 }} to={{ x: 0, y: 0, w: 1080 }} />
    <Logo cx={540} y={120} width={260} />
    <Title text={INSIDE_TITLE} y={226} x={60} w={960} size={80} />
  </Ground>
);

const InsideFeed: React.FC = () => (
  <Ground>
    <Frame src={INSIDE} film={V} crop={{ x: 0, y: 330, w: 1080, h: 1000 }} to={{ x: 0, y: 290, w: 1080 }} feather={{ top: 30, bottom: 130 }} />
    <Logo cx={540} y={70} width={210} />
    <Title text={INSIDE_TITLE} y={164} x={60} w={960} size={68} />
  </Ground>
);

export const PostersRoot: React.FC = () => (
  <>
    <Composition id="Poster-CalmTour-16x9" component={CalmWide} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="Poster-CalmTour-4x5" component={CalmFeed} durationInFrames={1} fps={30} width={1080} height={1350} />
    <Composition id="Poster-AskFriend-9x16" component={AskVertical} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="Poster-AskFriend-4x5" component={AskFeed} durationInFrames={1} fps={30} width={1080} height={1350} />
    <Composition id="Poster-Sunday-4x5" component={SundayFeed} durationInFrames={1} fps={30} width={1080} height={1350} />
    <Composition id="Poster-Picked-9x16" component={PickedVertical} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="Poster-Picked-4x5" component={PickedFeed} durationInFrames={1} fps={30} width={1080} height={1350} />
    <Composition id="Poster-InsideMatch-9x16" component={InsideVertical} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="Poster-InsideMatch-4x5" component={InsideFeed} durationInFrames={1} fps={30} width={1080} height={1350} />
  </>
);
