/**
 * The graphics starters (2026-10-23): four still images made from the same kit as the films, so a
 * still always matches the videos. Each is a 4:5 feed image (1080x1350) built on a real
 * campusai-demo capture (`public/pass/`, layer boxes in the matching .json) and the real logo.
 * Copy one into a piece's own folder and change the words and the crop; every word and number on
 * a posted graphic comes from that piece's facts.md.
 *
 *   npx remotion still src/graphics/entry.ts Graphic-Feed out/graphics/feed.png
 *
 * The example words here are true of the demo today: "Why this fits you" is on every job, the
 * Goldman role shows "Skills recruiters screen for, 4 of 6", and the four steps are the how-to
 * film's real flow.
 */
import React from "react";
import { AbsoluteFill, Composition, Img, staticFile } from "remotion";
import { brand, glow, INTER, PageView, useBrandFonts } from "../kit";
import { PostersRoot } from "./Posters";
import { LikeWhenRoot } from "./LikeWhenCarousel";

const B = brand("campusai");
const W = 1080;
const H = 1350;
const ZODIAK = "Zodiak";

const Ground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useBrandFonts(B);
  return <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient, fontFamily: INTER }}>{children}</AbsoluteFill>;
};

/** The logo, small and centred at the foot of every graphic. */
const Foot: React.FC<{ y?: number }> = ({ y = H - 92 }) =>
  B.logo ? (
    <Img src={staticFile(B.logo.onDark)} style={{ position: "absolute", left: W / 2 - 110, top: y - 110 / B.logo.ratio / 2, width: 220,
      filter: `drop-shadow(0 0 24px ${glow(B, 0.45)})` }} />
  ) : null;

const Headline: React.FC<{ text: string; top: number; size?: number }> = ({ text, top, size = 64 }) => (
  <div style={{ position: "absolute", left: 80, right: 80, top, fontFamily: ZODIAK, fontWeight: 700, fontSize: size, lineHeight: 1.08,
    letterSpacing: "-0.02em", color: B.color.ink, textAlign: "center" }}>{text}</div>
);

const GOLDMAN = { src: staticFile("pass/job-goldman.jpg"), page: { w: 1440, h: 900 } };
// The tall capture only paints the detail panel's first screen, so the skills section comes from
// the how-to run's frame scrolled to it (take.json mark "skills", 19.5 s).
const GOLDMAN_SKILLS = { src: staticFile("howto/run/f01507.jpg"), page: { w: 1440, h: 900 } };
const JOBS = { src: staticFile("pass/jobmatch-tall.jpg"), page: { w: 1440, h: 3600 } };

/** Graphic 1: a real screen with one line above it. */
const Feed: React.FC = () => (
  <Ground>
    <Headline text="Every job comes with why it fits you." top={120} />
    <PageView src={GOLDMAN.src} page={GOLDMAN.page} cam={{ cx: 1058, cy: 420, cw: 680 }} view={{ x: 60, y: 330, w: 960, h: 780 }} brand={B} />
    <Foot />
  </Ground>
);

/** Graphic 2: one true number, what it means, and where it comes from on the real page. */
const Stat: React.FC = () => (
  <Ground>
    <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", fontFamily: ZODIAK, fontWeight: 700, fontSize: 250,
      lineHeight: 1, letterSpacing: "-0.03em", color: B.color.accent, textShadow: `0 0 80px ${glow(B, 0.35)}` }}>4 of 6</div>
    <div style={{ position: "absolute", left: 120, right: 120, top: 460, textAlign: "center", fontSize: 38, lineHeight: 1.3, fontWeight: 600,
      color: B.color.ink }}>skills this Goldman Sachs role screens for are already on your resume.</div>
    <PageView src={GOLDMAN_SKILLS.src} page={GOLDMAN_SKILLS.page} cam={{ cx: 1054, cy: 640, cw: 660 }} view={{ x: 60, y: 690, w: 960, h: 420 }} brand={B} />
    <Foot />
  </Ground>
);

/** Graphic 3: one slide of a carousel. The step marker and the crop change per slide; the layout never does. */
const Slide: React.FC<{ n: number; of: number; step: string }> = ({ n, of, step }) => (
  <Ground>
    <div style={{ position: "absolute", left: 80, top: 96, fontSize: 30, fontWeight: 600, color: B.color.inkSoft }}>{n} of {of}</div>
    <Headline text={step} top={150} size={72} />
    <PageView src={JOBS.src} page={JOBS.page} cam={{ cx: 487, cy: 480, cw: 500 }} view={{ x: 140, y: 330, w: 800, h: 800 }} brand={B} />
    <Foot />
  </Ground>
);

/** Graphic 4: a film's poster, its strongest frame with the title and the logo. Swap in the film's own frame. */
const Poster: React.FC = () => (
  <Ground>
    <Img src={staticFile("graphics/poster-frame-example.png")} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${B.color.bgDeep} 0%, transparent 26%, transparent 70%, ${B.color.bgDeep} 92%)` }} />
    <Headline text="Find the internship that fits you." top={110} size={70} />
    <Foot y={H - 110} />
  </Ground>
);

export const GraphicsRoot: React.FC = () => (
  <>
    <Composition id="Graphic-Feed" component={Feed} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="Graphic-Stat" component={Stat} durationInFrames={1} fps={30} width={W} height={H} />
    <Composition id="Graphic-Slide" component={Slide} durationInFrames={1} fps={30} width={W} height={H}
      defaultProps={{ n: 2, of: 4, step: "Find jobs that fit you" }} />
    <Composition id="Graphic-Poster" component={Poster} durationInFrames={1} fps={30} width={W} height={H} />
    <PostersRoot />
    <LikeWhenRoot />
  </>
);
