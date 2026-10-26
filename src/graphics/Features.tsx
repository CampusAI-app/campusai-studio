/**
 * Feature graphics (2026-10-23): one set of parts for three kinds of still.
 *
 *   A. Feature cards, one per product surface, feed 4:5 and story 9:16. One true line in Zodiak, the real
 *      page big beneath it (cropped with the kit camera to the part that proves the line), the logo and
 *      campusai.app on the top row. Same margins and type on all ten; only the crop changes.
 *   B. Hero stills, 16:9, the same page on the realistic laptop (`four/real-laptop.tsx`) with the one
 *      element that proves the line lifted off the glass. Lift is scale plus shadow, never translateZ
 *      (HeroStill.tsx explains why), and the rest of the page dims a little so the lift reads.
 *   C. LinkedIn images for Jacob's build-in-public posts: a real screen, frameless and edge to edge, no
 *      headline (the post carries the words), the logo small in a band below.
 *
 * Captures: `public/sys/` (system-flows.cjs), `public/gfx/` (capture/graphics-surfaces.cjs). Every
 * on-image string and where it comes from: films/graphics-features-oct23/facts.md.
 *
 *   npx remotion still src/graphics/entry-features.ts Feature-JobMatch-4x5 out/gfx/jobmatch-4x5.png
 *   npx remotion still src/graphics/entry-features.ts Hero-JobMatch-16x9 out/gfx/hero.png --gl=angle
 */
import React from "react";
import { AbsoluteFill, Composition, Img, staticFile } from "remotion";
import { brand, clampCam, glow, INTER, PageView, useBrandFonts } from "../kit";
import type { PageCam, Rect, Size } from "../kit";
import { RealLaptop } from "../four/real-laptop";
import type { Vec3 } from "../four/real-laptop";

const B = brand("campusai");
const ZODIAK = "Zodiak";
const SIDE = 72;

/* ------------------------------------------------------------------ the five surfaces */

type Shot = { src: string; page: Size; cam: PageCam };
type Surface = {
  key: string;
  name: string;
  line: string;
  feed: Shot;
  story: Shot;
  /** The laptop still: the page on the glass, and the one element lifted off it (page px). */
  hero: { src: string; page: Size; lift: Rect; radius: number };
};

const P1440 = { w: 1440, h: 900 };
const P1024 = { w: 1024, h: 900 };
const JOB = "sys/job-2-why.jpg";
const CAL = "sys/cal-3-added.jpg";
const ASK = "gfx/ask-chat-page-1024.jpg";
const PLAN = "gfx/planner-scrolled.jpg";
const NOTE = "gfx/notifications-scrolled.jpg";

export const SURFACES: Surface[] = [
  {
    key: "JobMatch",
    name: "Job Match",
    line: "Every role tells you why it fits you.",
    // The Goldman Sachs card, selected, with its one-line reason; Capital One and Uline under it.
    feed: { src: JOB, page: P1440, cam: { cx: 487, cy: 539, cw: 500 } },
    story: { src: JOB, page: P1440, cam: { cx: 487, cy: 445, cw: 500 } },
    hero: { src: JOB, page: P1440, lift: { x: 742, y: 108, w: 624, h: 196 }, radius: 12 },
  },
  {
    key: "Calendar",
    name: "My Calendar",
    line: "Add a campus event to your calendar in one press.",
    // Right column of Events: a card already "On your calendar" above one still showing the red button.
    feed: { src: CAL, page: P1440, cam: { cx: 1121, cy: 466, cw: 610 } },
    story: { src: CAL, page: P1440, cam: { cx: 1121, cy: 540, cw: 610 } },
    hero: { src: CAL, page: P1440, lift: { x: 834, y: 448, w: 574, h: 207 }, radius: 14 },
  },
  {
    key: "Ask",
    name: "Ask CampusAI",
    line: "Ask before a coffee chat. Get questions worth asking.",
    // The real chat page at a 1024 window, so the answer wraps into a column that reads on a phone.
    feed: { src: ASK, page: P1024, cam: { cx: 618, cy: 496, cw: 740 } },
    story: { src: ASK, page: P1024, cam: { cx: 618, cy: 522, cw: 660 } },
    hero: { src: "gfx/ask-chat-page.jpg", page: P1440, lift: { x: 318, y: 166, w: 1010, h: 100 }, radius: 14 },
  },
  {
    key: "Planner",
    name: "Four-year planner",
    line: "See what's left to graduate, and what to take next.",
    // Scrolled past the guide box (it names Testudo); instructor names hidden at capture.
    feed: { src: PLAN, page: P1440, cam: { cx: 560, cy: 347, cw: 640 } },
    story: { src: PLAN, page: P1440, cam: { cx: 560, cy: 434, cw: 640 } },
    hero: { src: PLAN, page: P1440, lift: { x: 270, y: 124, w: 330, h: 152 }, radius: 12 },
  },
  {
    key: "Notifications",
    name: "Notifications",
    line: "Know when new roles and events match you.",
    // Scrolled so the list starts at the new roles; the moved-due-date row above is out of frame.
    feed: { src: NOTE, page: P1440, cam: { cx: 605, cy: 472, cw: 700 } },
    story: { src: NOTE, page: P1440, cam: { cx: 605, cy: 469, cw: 700 } },
    hero: { src: NOTE, page: P1440, lift: { x: 248, y: 107, w: 1160, h: 172 }, radius: 0 },
  },
];

/* ------------------------------------------------------------------ shared parts */

const Ground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useBrandFonts(B);
  return (
    <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient, fontFamily: INTER, overflow: "hidden" }}>
      {children}
    </AbsoluteFill>
  );
};

const LOGO_W = 196;
const LOGO_H = LOGO_W / (B.logo ? B.logo.ratio : 4);

/** The top row of every card: the logo on the left, the address on the right. */
const TopRow: React.FC<{ y: number }> = ({ y }) => (
  <>
    {B.logo ? <Img src={staticFile(B.logo.onDark)} style={{ position: "absolute", left: SIDE, top: y, width: LOGO_W }} /> : null}
    <div style={{ position: "absolute", right: SIDE, top: y + LOGO_H / 2 - 18, height: 36, lineHeight: "36px", fontSize: 28, fontWeight: 600,
      color: B.color.inkSoft, letterSpacing: "-0.005em" }}>campusai.app</div>
  </>
);

const Line: React.FC<{ text: string; top: number; size: number }> = ({ text, top, size }) => (
  <div style={{ position: "absolute", left: SIDE, right: SIDE, top, fontFamily: ZODIAK, fontWeight: 700, fontSize: size, lineHeight: 1.08,
    letterSpacing: "-0.02em", color: B.color.ink, textWrap: "balance" } as React.CSSProperties}>{text}</div>
);

/**
 * The real page in a window that runs off the bottom of the frame, so the product is the ground, not a cut-out.
 * Not clamped: each cam is set so the part of the window that is on screen stays inside the capture.
 */
const Product: React.FC<{ shot: Shot; top: number; W: number; H: number }> = ({ shot, top, W, H }) => {
  const view = { x: 40, y: top, w: W - 80, h: H - top + 60 };
  return <PageView src={staticFile(shot.src)} page={shot.page} cam={shot.cam} view={view} brand={B} radius={30} />;
};

/* ------------------------------------------------------------------ A. feature cards */

const FMT = {
  feed: { W: 1080, H: 1350, row: 72, line: 168, size: 66, product: 340 },
  // Story: the top row sits below Instagram's profile bar (about 220 px), the line under it.
  story: { W: 1080, H: 1920, row: 250, line: 350, size: 72, product: 640 },
} as const;

const FeatureCard: React.FC<{ s: Surface; fmt: keyof typeof FMT }> = ({ s, fmt }) => {
  const f = FMT[fmt];
  return (
    <Ground>
      <TopRow y={f.row} />
      <Line text={s.line} top={f.line} size={f.size} />
      <Product shot={fmt === "feed" ? s.feed : s.story} top={f.product} W={f.W} H={f.H} />
    </Ground>
  );
};

/* ------------------------------------------------------------------ B. hero stills on the laptop */

const NW = 1440;
// The glass is about 1.55 wide to tall, so a 1440 wide screen is about 929 tall: the page sits at the top
// and the 29 px under it take the page's own ground.
const NH = 929;

const Glass: React.FC<{ h: Surface["hero"] }> = ({ h }) => {
  const s = NW / h.page.w;
  const L = h.lift;
  const src = staticFile(h.src);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: NW, height: NH, background: B.color.bg, overflow: "hidden" }}>
      <Img src={src} style={{ position: "absolute", left: 0, top: 0, width: h.page.w * s, height: h.page.h * s, maxWidth: "none" }} />
      {/* Everything but the lifted piece steps back a little. */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(4,3,4,0.34)" }} />
      {/* The lifted piece: the same pixels, a touch larger, with a shadow long enough to show the gap. */}
      <div style={{ position: "absolute", left: L.x * s, top: L.y * s, width: L.w * s, height: L.h * s, overflow: "hidden",
        borderRadius: h.radius * s, transform: "scale(1.045)", transformOrigin: "50% 50%",
        boxShadow: `0 34px 70px rgba(0,0,0,0.85), 0 6px 14px rgba(0,0,0,0.6), 0 0 0 1.5px rgba(255,255,255,0.14), 0 0 90px ${glow(B, 0.25)}` }}>
        <Img src={src} style={{ position: "absolute", left: -L.x * s, top: -L.y * s, width: h.page.w * s, height: h.page.h * s, maxWidth: "none" }} />
      </div>
    </div>
  );
};

/** Three-quarter view from the front left, close enough that the screen carries the frame. */
const heroCam = (dist: number, target: Vec3) => {
  const dir: Vec3 = [-0.42, 0.2, 0.88];
  const n = Math.hypot(...dir);
  return { pos: [target[0] + (dir[0] / n) * dist, target[1] + (dir[1] / n) * dist, target[2] + (dir[2] / n) * dist] as Vec3, target, fov: 30 };
};

const HeroLaptop: React.FC<{ s: Surface }> = ({ s }) => {
  useBrandFonts(B);
  return (
    <AbsoluteFill style={{ background: "#050405", fontFamily: INTER, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 55% at 62% 40%, ${glow(B, 0.2)} 0%, transparent 70%)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(142deg, rgba(255,255,255,0.08) 0%, transparent 30%)" }} />
      <RealLaptop screen={{ node: <Glass h={s.hero} /> }} camera={heroCam(56, [4, 11.5, -13])} lid={1} nodeWidth={NW} />
      {B.logo ? <Img src={staticFile(B.logo.onDark)} style={{ position: "absolute", right: 64, top: 60, width: 180 }} /> : null}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ C. LinkedIn: a real screen, frameless */

const LI = {
  why: { src: JOB, page: P1440, sq: { cx: 1057, cy: 412, cw: 680 }, tall: { cx: 1054, cy: 462, cw: 625 } },
  spring: { src: "sys/spring-4-fifth-added.jpg", page: P1440, sq: { cx: 1040, cy: 559, cw: 672 } },
};
const BAND = 112;

const LinkedIn: React.FC<{ src: string; page: Size; cam: PageCam; W: number; H: number }> = ({ src, page, cam, W, H }) => {
  const view = { x: 0, y: 0, w: W, h: H - BAND };
  return (
    <Ground>
      <PageView src={staticFile(src)} page={page} cam={clampCam(cam, page, view)} view={view} brand={B} radius={0} />
      {/* The page eases into the band instead of ending on a hard edge. */}
      <div style={{ position: "absolute", left: 0, right: 0, top: H - BAND - 70, height: 70,
        background: `linear-gradient(180deg, rgba(11,7,8,0) 0%, ${B.color.bgDeep} 100%)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: H - BAND, height: BAND, background: B.color.bgDeep }} />
      {B.logo ? <Img src={staticFile(B.logo.onDark)} style={{ position: "absolute", left: W / 2 - 75, top: H - BAND / 2 - 75 / B.logo.ratio, width: 150 }} /> : null}
    </Ground>
  );
};

/* ------------------------------------------------------------------ registry */

export const FeaturesRoot: React.FC = () => (
  <>
    {SURFACES.map((s) => (
      <React.Fragment key={s.key}>
        <Composition id={`Feature-${s.key}-4x5`} component={FeatureCard} durationInFrames={1} fps={30} width={1080} height={1350}
          defaultProps={{ s, fmt: "feed" as const }} />
        <Composition id={`Feature-${s.key}-9x16`} component={FeatureCard} durationInFrames={1} fps={30} width={1080} height={1920}
          defaultProps={{ s, fmt: "story" as const }} />
        <Composition id={`Hero-${s.key}-16x9`} component={HeroLaptop} durationInFrames={1} fps={30} width={1920} height={1080}
          defaultProps={{ s }} />
      </React.Fragment>
    ))}
    <Composition id="LinkedIn-Why-1x1" component={LinkedIn} durationInFrames={1} fps={30} width={1080} height={1080}
      defaultProps={{ src: LI.why.src, page: LI.why.page, cam: LI.why.sq, W: 1080, H: 1080 }} />
    <Composition id="LinkedIn-Why-4x5" component={LinkedIn} durationInFrames={1} fps={30} width={1080} height={1350}
      defaultProps={{ src: LI.why.src, page: LI.why.page, cam: LI.why.tall, W: 1080, H: 1350 }} />
    <Composition id="LinkedIn-Spring-1x1" component={LinkedIn} durationInFrames={1} fps={30} width={1080} height={1080}
      defaultProps={{ src: LI.spring.src, page: LI.spring.page, cam: LI.spring.sq, W: 1080, H: 1080 }} />
  </>
);
