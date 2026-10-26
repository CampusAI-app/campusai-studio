/**
 * Two Instagram carousels, round three (2026-10-24), 4:5, eight slides each, in Robin Tempe's 8-block shape:
 * hook, lead, body 1, open loop, body 2, open loop, body 3, CTA. Every word is in
 * Content/video-studio/films/carousels-oct24/facts.md.
 *
 *   Fit-*   "Why this role fits you": Job Match, the skills it screens for, and the event for the gap.
 *   Fair-*  "From a career fair to your calendar": the fair's card, why, one press, My Calendar.
 *
 *   npx remotion still src/graphics/entry-carousels24.ts Fit-1 out/c24/fit-1.png
 *
 * What changed from the Oct 23 "Like when" carousel (from the posts.design study, Design/component-galleries-study.md):
 * - Two layers of product. The page sits behind, dim and soft, so it says "this is real" without asking to be read;
 *   ONE piece of it is lifted out in front at 2.2 to 3x, so what you read is product-big at 375 px wide.
 * - Pieces are clips of single real elements from DPR 3 captures (capture/carousels24.cjs), so nothing is cut at a
 *   page edge and nothing is upscaled from a 2x frame.
 * - Open-loop slides show the next slide's piece, blurred, with only its first line sharp: the swipe finishes it.
 * - One set of parts: logo top left, "n of 8" top right, a left-set Zodiak headline with one italic red phrase,
 *   the piece below it. The content is the only thing that changes.
 *
 * Captures: public/c24/ (campusai-demo, dark, 2026-10-24). Kept out of frame on purpose: the Why paragraphs on
 * Job Match (they name Sandy Spring since Oct 24), the org card's links, the sidebar's Maryland mark.
 */
import React from "react";
import { AbsoluteFill, Composition, Img, staticFile } from "remotion";
import { brand, glow, INTER, useBrandFonts } from "../kit";
import rules from "../system/rules.json";

const B = brand("campusai");
const W = 1080;
const H = 1350;
const OF = 8;
const ZODIAK = "Zodiak";
const SIDE = 64;
/** Pieces sit centred on MID, below a two-line headline, never above PIECE_TOP. */
const MID = 830;
const PIECE_TOP = 400;

/* ── Sources: whole-window captures, css px, DPR 3 ─────────────────────────────────────────────── */

type Src = { src: string; w: number; h: number };
const SRC = {
  jobs: { src: "c24/jobs-view.png", w: 1440, h: 900 },
  skills: { src: "c24/job-skills-view-1024.png", w: 1024, h: 900 },
  events: { src: "c24/ev-view-1024.png", w: 1024, h: 900 },
  eventsAfter: { src: "c24/ev-after-view-1024.png", w: 1024, h: 900 },
  toast: { src: "c24/ev-toast-1024.png", w: 464, h: 51 },
  week: { src: "c24/cal-view.png", w: 1440, h: 900 },
  open: { src: "c24/cal-open-view-1024.png", w: 1024, h: 900 },
} satisfies Record<string, Src>;

type Box = { x: number; y: number; w: number; h: number };

/* ── The parts every slide shares ──────────────────────────────────────────────────────────────── */

const Ground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useBrandFonts(B);
  return <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient, fontFamily: INTER, overflow: "hidden" }}>{children}</AbsoluteFill>;
};

const Top: React.FC<{ n: number }> = ({ n }) => (
  <>
    {B.logo ? <Img src={staticFile(B.logo.onDark)} style={{ position: "absolute", left: SIDE, top: 62, width: 168 }} /> : null}
    <div style={{ position: "absolute", right: SIDE, top: 60, fontSize: 30, fontWeight: 600, color: B.color.inkSoft }}>{n} of {OF}</div>
  </>
);

/** Left-set Zodiak headline; `accent` is set in the one red, italic. */
const Headline: React.FC<{ text: string; accent?: string; top?: number; size?: number }> = ({ text, accent, top = 150, size = 72 }) => {
  const i = accent ? text.indexOf(accent) : -1;
  const parts = i < 0 ? [text] : [text.slice(0, i), accent as string, text.slice(i + (accent as string).length)];
  return (
    <div style={{ position: "absolute", left: SIDE, right: SIDE, top, fontFamily: ZODIAK, fontWeight: 700, fontSize: size, lineHeight: 1.08,
      letterSpacing: "-0.02em", color: B.color.ink, textWrap: "balance" }}>
      {parts.map((p, k) =>
        k === 1 ? <span key={k} style={{ fontStyle: "italic", fontWeight: 400, color: B.color.accent }}>{p}</span> : <span key={k}>{p}</span>,
      )}
    </div>
  );
};

/** The page behind: a crop of the real window, dim and soft, faded into the ground on every side. */
const Behind: React.FC<{ s: Src; crop: Box; opacity?: number }> = ({ s, crop, opacity = 0.3 }) => {
  const k = Math.max(W / crop.w, H / crop.h);
  return (
    <AbsoluteFill style={{ opacity, filter: "blur(5px) saturate(0.9)",
      WebkitMaskImage: "radial-gradient(120% 80% at 50% 62%, #000 35%, transparent 78%)", maskImage: "radial-gradient(120% 80% at 50% 62%, #000 35%, transparent 78%)" }}>
      <Img src={staticFile(s.src)} style={{ position: "absolute", width: s.w * k, height: s.h * k,
        left: W / 2 - (crop.x + crop.w / 2) * k, top: H / 2 - (crop.y + crop.h / 2) * k }} />
    </AbsoluteFill>
  );
};

/**
 * One real piece of the product, lifted: `crop` is the element's box in the capture (css px), drawn `width` wide.
 * `top` is its top edge; it is centred left to right unless `left` is given. `blurBelow` blurs everything under
 * that many css px of the crop (the open-loop teaser); `dimExcept` dims all but one box of it.
 */
const Piece: React.FC<{ s: Src; crop: Box; width: number; top?: number; cy?: number; left?: number; radius?: number; blurBelow?: number;
  dimExcept?: Box; frame?: boolean }> = ({ s, crop, width, top: top0, cy = MID, left, radius = 26, blurBelow, dimExcept, frame = true }) => {
  const k = width / crop.w;
  const h = crop.h * k;
  const top = top0 ?? Math.max(PIECE_TOP, cy - h / 2);
  const x = left ?? (W - width) / 2;
  const img = (extra: React.CSSProperties = {}) => (
    <Img src={staticFile(s.src)} style={{ position: "absolute", width: s.w * k, height: s.h * k, left: -crop.x * k, top: -crop.y * k, ...extra }} />
  );
  return (
    <div style={{ position: "absolute", left: x, top, width, height: h, borderRadius: radius, overflow: "hidden",
      boxShadow: frame ? `0 40px 90px rgba(0,0,0,0.6), 0 0 0 1.5px rgba(${B.color.glowRgb}, 0.38), 0 0 70px ${glow(B, 0.22)}` : undefined }}>
      {img()}
      {blurBelow !== undefined ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: blurBelow * k, bottom: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            background: "linear-gradient(180deg, rgba(11,7,8,0.15), rgba(11,7,8,0.55))" }} />
        </div>
      ) : null}
      {dimExcept ? (
        <svg width={width} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <mask id="hole">
              <rect width={width} height={h} fill="#fff" />
              <rect x={(dimExcept.x - crop.x) * k} y={(dimExcept.y - crop.y) * k} width={dimExcept.w * k} height={dimExcept.h * k} rx={14} fill="#000" />
            </mask>
          </defs>
          <rect width={width} height={h} fill="rgba(11,7,8,0.66)" mask="url(#hole)" />
          <rect x={(dimExcept.x - crop.x) * k} y={(dimExcept.y - crop.y) * k} width={dimExcept.w * k} height={dimExcept.h * k} rx={14}
            fill="none" stroke={B.color.accent} strokeWidth={3} />
        </svg>
      ) : null}
    </div>
  );
};

const Slide: React.FC<{ n: number; behind?: React.ReactNode; children: React.ReactNode }> = ({ n, behind, children }) => (
  <Ground>
    {behind}
    <Top n={n} />
    {children}
  </Ground>
);

const End: React.FC = () => (
  <Ground>
    <Top n={OF} />
    {B.logo ? (
      <Img src={staticFile(B.logo.onDark)} style={{ position: "absolute", left: W / 2 - 300, top: H * 0.43 - 300 / B.logo.ratio, width: 600,
        filter: `drop-shadow(0 0 44px ${glow(B, 0.55)})` }} />
    ) : null}
    <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.43 + 300 / B.logo!.ratio + 36, textAlign: "center", fontWeight: 600,
      fontSize: 54, letterSpacing: "-0.01em", color: B.color.ink }}>{rules.end.url}</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.43 + 300 / B.logo!.ratio + 112, textAlign: "center", fontWeight: 500,
      fontSize: 34, color: B.color.inkSoft }}>{rules.end.instagram}</div>
  </Ground>
);

/* ── Carousel 1: Why this role fits you ────────────────────────────────────────────────────────── */

// Job Match list column only (the detail panel to its right names Sandy Spring today).
const LIST: Box = { x: 262, y: 170, w: 452, h: 700 };
const CARD: Box = { x: 270, y: 379, w: 436, h: 198 };
const TWO: Box = { x: 268, y: 207, w: 440, h: 374 };
const REASON: Box = { x: 334, y: 390, w: 334, h: 156 };
const SKILLS: Box = { x: 578, y: 425, w: 372, h: 208 };
const SKILLS_CTX: Box = { x: 560, y: 60, w: 420, h: 760 };
const GAP: Box = { x: 589, y: 537, w: 350, h: 86 };
const BOOT: Box = { x: 627, y: 265, w: 365, h: 208 };
const EV_CTX: Box = { x: 240, y: 170, w: 760, h: 700 };

const Fit1: React.FC = () => (
  <Slide n={1} behind={<Behind s={SRC.jobs} crop={LIST} opacity={0.34} />}>
    <Headline text="Which of these is actually yours?" accent="actually yours" />
    <Piece s={SRC.jobs} crop={TWO} width={990} />
  </Slide>
);
const Fit2: React.FC = () => (
  <Slide n={2} behind={<Behind s={SRC.jobs} crop={LIST} />}>
    <Headline text="Every card answers that before you open it." accent="before you open it" />
    <Piece s={SRC.jobs} crop={CARD} width={990} />
  </Slide>
);
const Fit3: React.FC = () => (
  <Slide n={3} behind={<Behind s={SRC.jobs} crop={LIST} />}>
    <Headline text="It starts from what you've already done." accent="already done" />
    <Piece s={SRC.jobs} crop={REASON} width={980} dimExcept={{ x: 336, y: 497, w: 330, h: 44 }} />
  </Slide>
);
const Fit4: React.FC = () => (
  <Slide n={4} behind={<Behind s={SRC.skills} crop={SKILLS_CTX} />}>
    <Headline text="But what does Goldman actually screen for?" accent="screen for" />
    <Piece s={SRC.skills} crop={SKILLS} width={970} radius={30} blurBelow={38} />
  </Slide>
);
const Fit5: React.FC = () => (
  <Slide n={5} behind={<Behind s={SRC.skills} crop={SKILLS_CTX} />}>
    <Headline text="You already have four of the six." accent="four of the six" />
    <Piece s={SRC.skills} crop={SKILLS} width={970} radius={30} />
  </Slide>
);
const Fit6: React.FC = () => (
  <Slide n={6} behind={<Behind s={SRC.skills} crop={SKILLS_CTX} />}>
    <Headline text="And the two your resume doesn't show yet?" accent="doesn't show yet" />
    <Piece s={SRC.skills} crop={SKILLS} width={970} radius={30} dimExcept={GAP} />
  </Slide>
);
const Fit7: React.FC = () => (
  <Slide n={7} behind={<Behind s={SRC.events} crop={EV_CTX} />}>
    <Headline text="Events already knows the gap." accent="knows the gap" />
    <Piece s={SRC.events} crop={BOOT} width={970} />
  </Slide>
);

/* ── Carousel 2: From a career fair to your calendar ───────────────────────────────────────────── */

const FAIR_HEAD: Box = { x: 627, y: 487, w: 365, h: 100 };
const FAIR_WHY: Box = { x: 627, y: 552, w: 365, h: 82 };
const FAIR: Box = { x: 627, y: 487, w: 365, h: 208 };
const REC: Box = { x: 240, y: 180, w: 340, h: 76 };
const BTN: Box = { x: 636, y: 637, w: 176, h: 48 };
const WEEK: Box = { x: 912, y: 52, w: 400, h: 462 };
const THU: Box = { x: 1048, y: 54, w: 130, h: 456 };
const HEAD: Box = { x: 168, y: 158, w: 420, h: 162 };
const FOOT: Box = { x: 488, y: 716, w: 370, h: 50 };
const OPEN_CTX: Box = { x: 150, y: 120, w: 730, h: 680 };

const Fair1: React.FC = () => (
  <Slide n={1} behind={<Behind s={SRC.events} crop={EV_CTX} opacity={0.34} />}>
    <Headline text="Recruiters start their first-round lists here." accent="first-round lists" />
    <Piece s={SRC.events} crop={FAIR_HEAD} width={980} />
  </Slide>
);
const Fair2: React.FC = () => (
  <Slide n={2} behind={<Behind s={SRC.events} crop={EV_CTX} />}>
    <Headline text="Already on your list. Next stop, your calendar." accent="your calendar" />
    <Piece s={SRC.events} crop={REC} width={980} />
  </Slide>
);
const Fair3: React.FC = () => (
  <Slide n={3} behind={<Behind s={SRC.events} crop={EV_CTX} />}>
    <Headline text="First, why it's worth your afternoon." accent="worth your afternoon" />
    <Piece s={SRC.events} crop={FAIR_WHY} width={980} />
  </Slide>
);
const Fair4: React.FC = () => (
  <Slide n={4} behind={<Behind s={SRC.events} crop={EV_CTX} />}>
    <Headline text="One press. Then where does it go?" accent="where does it go" />
    <Piece s={SRC.events} crop={BTN} width={640} radius={20} />
  </Slide>
);
const Fair5: React.FC = () => (
  <Slide n={5} behind={<Behind s={SRC.eventsAfter} crop={EV_CTX} />}>
    <Headline text="On your calendar, and it tells you where." accent="where" />
    <Piece s={SRC.eventsAfter} crop={FAIR} width={900} top={400} />
    <Piece s={SRC.toast} crop={{ x: 8, y: 8, w: 448, h: 35 }} width={940} top={1010} radius={24} />
  </Slide>
);
const Fair6: React.FC = () => (
  <Slide n={6} behind={<Behind s={SRC.week} crop={{ x: 700, y: 40, w: 740, h: 700 }} />}>
    <Headline text="Now open My Calendar. Look at Thursday." accent="Thursday" />
    <Piece s={SRC.week} crop={WEEK} width={700} dimExcept={THU} />
  </Slide>
);
const Fair7: React.FC = () => (
  <Slide n={7} behind={<Behind s={SRC.open} crop={OPEN_CTX} />}>
    <Headline text="Open it. When and where, already there." accent="already there" />
    <Piece s={SRC.open} crop={HEAD} width={960} top={430} />
    <Piece s={SRC.open} crop={FOOT} width={880} top={890 + 40} radius={20} />
  </Slide>
);

/* ── Register ──────────────────────────────────────────────────────────────────────────────────── */

const SETS: Record<string, React.FC[]> = {
  Fit: [Fit1, Fit2, Fit3, Fit4, Fit5, Fit6, Fit7, End],
  Fair: [Fair1, Fair2, Fair3, Fair4, Fair5, Fair6, Fair7, End],
};

export const Carousels24Root: React.FC = () => (
  <>
    {Object.entries(SETS).flatMap(([name, slides]) =>
      slides.map((C, i) => <Composition key={name + i} id={`${name}-${i + 1}`} component={C} durationInFrames={1} fps={30} width={W} height={H} />),
    )}
  </>
);

