/**
 * "Like when" carousel (2026-10-23): six 4:5 slides made from the like-when film
 * (Content/video-studio/films/like-when/). One set of parts for every slide: the same ground, the
 * same slide marker, the same Zodiak headline (the film's accent phrase set in its italic red), the
 * same product window and the same logo at the foot, so the six read as one piece.
 *
 *   1  cover: the hook, over the real daily brief's Your week
 *   2  "Like when a professor moves a due date..." and the bell open on the moved notice
 *   3  "Or when registration opens..." and the finished spring week, Friday free
 *   4  "Or when you can't tell which internships..." and the Goldman Sachs card: Strong match and its one-line why
 *   5  the three together, in words
 *   6  the logo and campusai.app
 *
 *   npx remotion still src/graphics/entry.ts LikeWhen-2 out/graphics/like-when-2.png
 *
 * Captures are the film's own (public/sys/, campusai-demo, dark, 1440x900 at 2x), drawn through the
 * film system's SurfaceView so the Maryland M and the film's Testudo patch are painted out exactly as
 * in the film. The patch rects are copied from films/like-when/storyboard.json `surfaces`.
 * Banned (the film's line): never say or suggest the moved date shows on My Calendar.
 * Every word is in films/graphics-oct23/facts.md.
 */
import React from "react";
import { AbsoluteFill, Composition, Img, staticFile } from "remotion";
import { brand, glow, INTER, useBrandFonts } from "../kit";
import type { Rect } from "../kit/camera";
import { SurfaceView } from "../system/parts/common";
import type { Layout } from "../system/parts/types";
import type { Surface } from "../system/storyboard";
import rules from "../system/rules.json";

const B = brand("campusai");
const W = 1080;
const H = 1350;
const OF = 6;
const MARGIN = 36;
const ZODIAK = "Zodiak";

const PAGE = { w: 1440, h: 900 };
const SURF: Record<string, Surface> = {
  dash: { src: "sys/moved-0-dashboard.jpg", page: PAGE, dpr: 2 },
  bell: { src: "sys/moved-1-bell.jpg", page: PAGE, dpr: 2 },
  weekFull: { src: "sys/spring-4-fifth-added.jpg", page: PAGE, dpr: 2, patch: [{ x: 700, y: 181, w: 665, h: 72 }] },
  goldman: { src: "sys/job-1-goldman.jpg", page: PAGE, dpr: 2 },
};

/* ── The parts every slide shares ─────────────────────────────────────────────────────────────── */

const Ground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useBrandFonts(B);
  return <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient, fontFamily: INTER }}>{children}</AbsoluteFill>;
};

const Marker: React.FC<{ n: number }> = ({ n }) => (
  <div style={{ position: "absolute", left: 60, top: 54, fontSize: 30, fontWeight: 600, color: B.color.inkSoft }}>{n} of {OF}</div>
);

const Foot: React.FC = () =>
  B.logo ? (
    <Img src={staticFile(B.logo.onDark)} style={{ position: "absolute", left: W / 2 - 100, top: H - 64 - 100 / B.logo.ratio / 2, width: 200,
      filter: `drop-shadow(0 0 24px ${glow(B, 0.45)})` }} />
  ) : null;

/** A Zodiak headline; `accent` is set the way the film sets it, italic in the one red. */
const Headline: React.FC<{ text: string; accent?: string; top: number; size?: number }> = ({ text, accent, top, size = 64 }) => {
  const i = accent ? text.indexOf(accent) : -1;
  const parts = i < 0 ? [text] : [text.slice(0, i), accent as string, text.slice(i + (accent as string).length)];
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, fontFamily: ZODIAK, fontWeight: 700, fontSize: size, lineHeight: 1.1,
      letterSpacing: "-0.02em", color: B.color.ink, textAlign: "center", textWrap: "balance" }}>
      {parts.map((p, k) =>
        k === 1 ? <span key={k} style={{ fontStyle: "italic", fontWeight: 400, color: B.color.accent, whiteSpace: "nowrap" }}>{p}</span> : <span key={k}>{p}</span>,
      )}
    </div>
  );
};

/**
 * The real page, frameless, in the product window: `crop` is the part of the page in view (page px,
 * its height follows the window's shape). `spot` keeps one region lit while the rest dims a touch.
 */
const Product: React.FC<{ surface: Surface; crop: { x: number; y: number; w: number }; top: number; height: number; spot?: Rect }> = ({
  surface, crop, top, height, spot,
}) => {
  const view = { x: MARGIN, y: top, w: W - MARGIN * 2, h: height };
  const ch = crop.w * (view.h / view.w);
  const cam = { cx: crop.x + crop.w / 2, cy: crop.y + ch / 2, cw: crop.w };
  const layout = { view, radius: 28 } as Layout;
  return <SurfaceView surface={surface} brand={B} layout={layout} cam={cam} view={view} radius={28} dim={spot ? 0.32 : 0} spot={spot} />;
};

const Slide: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <Ground>
    <Marker n={n} />
    {children}
    <Foot />
  </Ground>
);

/* ── The six slides ───────────────────────────────────────────────────────────────────────────── */

const LINES = {
  moved: "Like when a professor moves a due date and nobody tells you.",
  spring: "Or when registration opens and you still don't have a schedule.",
  job: "Or when you can't tell which internships actually fit you.",
};

const Cover: React.FC = () => (
  <Slide n={1}>
    <Headline text="Three things that go wrong in a student's week." accent="go wrong" top={128} size={82} />
    <Product surface={SURF.dash} crop={{ x: 272, y: 44, w: 560 }} top={440} height={770} />
  </Slide>
);

const Moved: React.FC = () => (
  <Slide n={2}>
    <Headline text={LINES.moved} accent="due date" top={124} />
    <Product surface={SURF.bell} crop={{ x: 902, y: 4, w: 412 }} top={392} height={820} spot={{ x: 906, y: 154, w: 402, h: 102 }} />
  </Slide>
);

const Spring: React.FC = () => (
  <Slide n={3}>
    <Headline text={LINES.spring} accent="a schedule" top={124} />
    <Product surface={SURF.weekFull} crop={{ x: 262, y: 206, w: 438 }} top={392} height={820} />
  </Slide>
);

const Job: React.FC = () => (
  <Slide n={4}>
    <Headline text={LINES.job} accent="fit you" top={124} />
    <Product surface={SURF.goldman} crop={{ x: 262, y: 290, w: 450 }} top={392} height={820} spot={{ x: 268, y: 381, w: 438, h: 197 }} />
  </Slide>
);

/** The three together: what each one became, in the product's own terms. */
const ROWS: { label: string; line: string }[] = [
  { label: "A moved due date", line: "lands in your bell, old date crossed out." },
  { label: "A spring with no schedule", line: "becomes a real week, class by class." },
  { label: "Internships you can't read", line: "Job Match tells you why a role fits." },
];
const Together: React.FC = () => (
  <Slide n={5}>
    <Headline text="One place for all three." accent="all three" top={150} size={82} />
    <div style={{ position: "absolute", left: 90, right: 90, top: 350 }}>
      {ROWS.map((r, i) => (
        <div key={r.label} style={{ padding: "48px 0", borderTop: i ? `1.5px solid rgba(247, 239, 230, 0.14)` : "none" }}>
          <div style={{ fontSize: 34, fontWeight: 600, color: B.color.accent, marginBottom: 10 }}>{r.label}</div>
          <div style={{ fontFamily: ZODIAK, fontWeight: 700, fontSize: 58, lineHeight: 1.12, letterSpacing: "-0.015em", color: B.color.ink, textWrap: "balance" }}>{r.line}</div>
        </div>
      ))}
    </div>
  </Slide>
);

const End: React.FC = () => (
  <Ground>
    <Marker n={6} />
    {B.logo ? (
      <Img src={staticFile(B.logo.onDark)} style={{ position: "absolute", left: W / 2 - 280, top: H * 0.44 - 280 / B.logo.ratio, width: 560,
        filter: `drop-shadow(0 0 40px ${glow(B, 0.5)})` }} />
    ) : null}
    <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.44 + 280 / B.logo!.ratio + 40, textAlign: "center", fontWeight: 600,
      fontSize: 50, letterSpacing: "-0.01em", color: B.color.ink }}>{rules.end.url}</div>
  </Ground>
);

const SLIDES: React.FC[] = [Cover, Moved, Spring, Job, Together, End];

export const LikeWhenRoot: React.FC = () => (
  <>
    {SLIDES.map((C, i) => (
      <Composition key={i} id={`LikeWhen-${i + 1}`} component={C} durationInFrames={1} fps={30} width={W} height={H} />
    ))}
  </>
);
