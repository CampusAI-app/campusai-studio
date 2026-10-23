/**
 * CampusAI Job Match — the 2026-09 rebuild, round 4.
 *
 * NOT a re-cut of the August post (`script.ts`'s JobMatch-*). That one composed
 * card-shaped art we drew. This one composites REAL captured product pixels:
 * Playwright isolates each component off the running demo at 3x and the motion
 * is authored around those pixels, because a hand-built mockup is not something
 * we can post (Jacob, 2026-09-16).
 *
 * Shape (round 4): the film opens INSIDE one job card, on the product's own
 * sentence about this student, and the camera retreats from there — out to the
 * whole card, then out again to the board of twelve it came from. A second card
 * argues a different kind of reason, then Evercore opens and its breakdown
 * writes itself section by section. Every word on screen is the product's, one
 * of two component labels, one of three detail captions, or the closing line.
 *
 * ── Round 3, against Jacob's five notes ───────────────────────────────────
 *
 * 1. "A little too long on showing the big job match" — board beat 2.8s → 2.2s,
 *    and the hook lost 100ms so the board arrives sooner.
 * 2. "it should zoom into the job from the big screen" — it always did, but the
 *    zoom did not READ, because the card that followed played its own entrance
 *    and so popped fresh instead of continuing. Card 1 now has NO entrance: the
 *    board holds its final framing and cross-dissolves into the standalone
 *    capture at a matched scale over 160ms. The push also runs 1100ms instead
 *    of 900 and starts halfway through the beat.
 * 3. "shows a 4th job card for a sec then goes to the bigger description" — the
 *    Evercore card no longer holds. It arrives already expanding, 800ms end to
 *    end, so it reads as one card opening rather than a fourth card and then a
 *    document.
 * 5. "takes a bit too long to showing the full card, and it should say the why
 *    this fits you (a bit more in depth) and then the about this role and skills
 *    recruiter screens for" — the panel lands 1.4s earlier and its three named
 *    sections arrive in order, the card growing 162 → 439 → 577 as each lands.
 *
 * ── Why the sections are captures, not a camera move ──────────────────────
 *
 * The obvious build is to push in on each section in turn. It cannot work here:
 * the panel's text column is 628 of its 670px, so framing a section IS framing
 * the panel, and any push big enough to magnify one crops its own words off a
 * portrait frame. Dimming the rest is the highlighting he rejected in round 1.
 * So the panel is photographed in four states with the later sections collapsed
 * and the film cross-fades between them. Every pixel of every state is still
 * the product's own render. Rig and reasoning: `jobmatch-fixture/capture-detail.mjs`.
 *
 * ── Where the motion comes from ───────────────────────────────────────────
 *
 * Assembly, not authorship. Beats are built from the measured Raylight recipes
 * in `Lucius/memory/motion-raylight-templates.md`:
 *
 *   board    CASCADE GRID  — the camera pulls OUT from one card to reveal the
 *                            field (round 4 reversed it; see BEATS)
 *   cards    UI WALKTHROUGH — held layers under one linear ambient drift;
 *                            "labels settle in during each hold"
 *   detail   the "UI builds itself on screen" beat (drop-in / agent-launch S11)
 *   end      LOGO STING — mark scales in from ~0.94, ease-out-expo
 *
 * House numbers used verbatim: text entrance 500ms, per-word 80ms, exits 280ms
 * (always faster than entrances), scale-in from 0.94, camera moves 800-1200ms,
 * ambient drift linear and <= 1.06, vignette 0.53, film grain 0.02.
 *
 * Silent by design (Jacob, 2026-09-16): "let's not put a sound, background
 * music, or voiceover. This is just the motion graphic itself." No `<Audio>`
 * and no sound source anywhere below, so the AAC track Remotion muxes by
 * default carries nothing but silence — kept rather than stripped because a
 * file with no audio stream at all is what some social encoders mishandle.
 */

import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { Watermark } from "./components/Watermark";
import { safeLayout } from "./lib/safeArea";
import { THEMES } from "./theme";
import { BOARD, CARDS, DETAIL, boardCard, detailPart } from "./lib/jobmatch-geometry";

const T = THEMES.campusaiProduct;
const FONT = "Inter, system-ui, sans-serif";

/* ── Easing, in the ruleset's vocabulary ──────────────────────────────────
   "ease-out-expo for snappy text, ease-in-expo for camera punch-ins and
   departures. Linear is BANNED for layer entrances and exits" but correct for
   long constant-speed drifts. */
const EASE_OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_EXPO = Easing.bezier(0.7, 0, 0.84, 0);
const EASE_OUT = Easing.bezier(0.33, 1, 0.68, 1);
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);
const LINEAR = Easing.linear;

/* ── The beat sheet, in milliseconds ─────────────────────────────────────
 *
 * ROUND 4 (2026-09-16) runs the camera BACKWARDS, and that is the whole edit.
 *
 * Rounds 1-3 opened abstract and pushed in: a black frame, a logo flash, two
 * lines of type, then the board, then a zoom onto one card. Audited as a
 * college student scrolling Instagram, that shape fails on its own terms —
 * measured, frame 0 had a max luminance of 22/255, so the cover frame in feed
 * is BLACK, and 2.7s (13% of the film) went by before any product appeared.
 * The two hook lines also instructed a viewer who had no product in their head
 * yet: "tell it what you're aiming at" has no antecedent for a stranger.
 *
 * So the film now opens INSIDE the proof and pulls out to reveal scale:
 *
 *   frame 1   the PwC card's own sentence, already legible, no setup
 *   the intro plays OVER that card, in the band beneath it
 *   the label then names what kind of reason this one is
 *   pull back — it was one of twelve, all ranked
 *
 * Same captures, same product, no new rig. It is the round-3 match cut run in
 * the other direction, which pays a question off instead of setting one up.
 *
 * ROUND 4b, Jacob on the first 4a cut: "theres no intro to this, just shows a
 * job card." Correct, and it was a real cost — 4a deleted the runway and took
 * the orientation with it, so a stranger met a job card with nothing telling
 * them what they were looking at. His two approved intro lines are back, word
 * for word. What does NOT come back is playing them on black BEFORE the
 * product: they now run in the caption band under the card, so the film
 * explains the idea while the evidence is already on screen. Frame one still
 * has a picture on it.
 *
 * Also cut: one of the three feed cards (by the third the layout is fully
 * predictable), and 3.1s off the detail scroll, whose body copy renders at
 * roughly 7pt on a handset and is never going to be read — the captions carry
 * that beat, so the film stops paying nine seconds for text nobody reads.
 *
 * 20.84s -> 16.30s.
 */
const BEATS = {
  /** The PwC card, close, from frame one. The intro plays OVER it. */
  open: 0,
  /** Keep pulling: the card was one of twelve. */
  board: 3900,
  /** A second, different kind of reason. */
  card2: 5500,
  detail: 7200,
  /** Jacob's line, 2026-09-16. Wide enough for its own word stagger to finish
      and then HOLD: 7 words at the house 80ms cadence take 1040ms to land, and
      a line nobody gets to read is not a closing line. */
  close: 13400,
  end: 15200,
  out: 16300,
} as const;


export const jobMatchFrames = (fps: number) => Math.round((BEATS.out / 1000) * fps);

const CARD_MS = 1700;

/** The cross-dissolve between the opening card and the board it came from. */
const MATCH_CUT_MS = 160;

/**
 * The opening card, and the label that names what kind of reason it carries.
 *
 * Jacob approved these labels word for word (2026-09-16). The label is a claim
 * the card's own sentence then evidences, which is the honest ordering: we
 * never assert something the product does not go on to show. An all-caps
 * letterspaced kicker over a headline is banned by both Jacob's taste laws and
 * the Raylight ruleset ("NEVER build the AI poster").
 */
const OPEN = { slug: "01-experience-pwc", label: "From your last internship" } as const;

/**
 * The intro. Jacob's own two lines, unchanged from round 3.
 *
 * Round 4a deleted them, on the audit's reading that "tell it what you're
 * aiming at" has no antecedent for a stranger. That reading was half right and
 * the half it got wrong was the expensive one: the lines were not the problem,
 * playing them on a black frame for 2.2s before any product was. Under the card
 * they have their antecedent — the thing being aimed at is on screen — and the
 * film still opens on a picture.
 */
const INTRO = [
  { text: "Tell it what you're aiming at.", at: 300, until: 1550 },
  { text: "Every job ranks against that.", at: 1650, until: 2900 },
] as const;

/**
 * The second card. ONE of the three survives round 4, not two.
 *
 * Three cards was three identical layouts in a row, 1.7s each, with only the
 * label changing — by the second one a viewer can predict the third, and
 * prediction is when they leave. Two beats make the point that the product
 * reads different parts of a life; a third only makes it a list.
 *
 * Carlyle survives over Capital One because "from what you led on campus" sits
 * further from "from your last internship" than a resume skill does, and campus
 * leadership is the evidence source only we can claim. The Capital One capture
 * stays on disk, unused, in case that call reverses.
 */
const CARD_BEATS = [
  { at: BEATS.card2, slug: "03-club-carlyle", label: "From what you led on campus" },
] as const;

/**
 * The closing line. Jacob's words, 2026-09-16.
 *
 * The film used to end on "5 of 6" — 8px of grey in the card's top right that
 * no one on a handset can read — and then fade to a wordmark. So the payoff was
 * both invisible AND, if you could read it, a deficiency shown to an anxious
 * junior one frame before the logo. The gap stays exactly where it is and keeps
 * its honesty; this line now sits between it and the mark, so the last sentence
 * of the film is what the student gets.
 *
 * Lucius proposed "Every job here already knows why it's here." Jacob rewrote
 * it active and aimed at the viewer, which is the better line.
 */
const CLOSING_LINE = "Every job here tells you why it's here.";

/** Where the card rests once the opening pull-back finishes. 377 -> 905 of 1080. */
const CARD_SCALE = 2.4;

/**
 * Where the opening pull-back STARTS.
 *
 * The capture is 1134px wide for a 377px card, so 3.0 is exactly 1:1 and is the
 * sharpness ceiling; 2.88 stays under it and still fills the frame's width.
 *
 * It is deliberately not tighter than the card. The reason paragraph is 344 of
 * the card's 377px, so there is no framing that isolates the sentence without
 * cropping the card that gives it its meaning — the same geometry that made a
 * camera walk down the detail card impossible. At 2.88 the sentence stands
 * 141px tall in a 1350 frame, which is the point: it is legible at frame one
 * on a real handset, verified at 430px wide.
 */
const OPEN_SCALE = 2.88;

/**
 * Where the card's own scroller rests, section by section, relative to
 * BEATS.detail.
 *
 * Jacob asked for "the top half of the card then go to the about this role and
 * then skills recruiter screen for and then about evercore", and then, when a
 * narrower capture made a camera walk possible: "now it looks like mobile and
 * not the web, and shrunk some of it."
 *
 * Both are satisfiable, but not by a camera. At the 720px desktop width the
 * card is nearly the frame's own shape, so no framing leaves anything to travel
 * through. The card's SCROLLER does: 838px of content behind a 371px window,
 * which is how a person reads this card anyway. The card never moves, never
 * resizes, and stays the width it is on the web.
 *
 * The first stop gets the longest hold, because he asked for the Why section
 * "a bit more in depth".
 */
const STOPS = [
  { key: "why", at: 0, until: 1500, label: "Why it picked this one" },
  { key: "about", at: 2200, until: 3600, label: "What the role actually is" },
  { key: "skills", at: 4300, until: 6200, label: "Where you already match" },
] as const;

/**
 * THREE stops, not four, and About Evercore does not get its own.
 *
 * It cannot have one. The skills and company sections together are 468px of
 * card and the frame sees 537px at once, so the last two sections always share
 * a framing — anchoring them separately produced two near-identical shots and
 * a 1.6s stall. The final stop lands with the card's bottom on the frame's
 * bottom, so the company blurb is the last thing on screen, which is the order
 * asked for.
 */
/**
 * The pills arrive at CASCADE-GRID speed, not sibling speed.
 *
 * Jacob, 2026-09-16: "the showing popup of the 5/6 skills happens too slow."
 * They were 170ms apart over 340ms each, which is the Raylight sibling-stagger
 * median (307ms, range 139-495) — right for things that arrive as separate
 * events. Six pills in one row are a FIELD, and the cascade-grid recipe puts
 * those 40-90ms apart. At 85/240 the whole row lands in 665ms instead of 1190.
 */
/* Round 4 pulled the whole beat in from 9.3s to 6.2s, so both marks move with
   their stop. The pills still land AFTER the scroll settles on the skills
   section (4300 + a 700ms travel), never during the move. */
const PILLS_AT = 4500;
const COUNT_AT = 5300;
const PILL_STAGGER = 85;
const PILL_MS = 240;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Eased 0 -> 1 across an ms window. */
const ramp = (ms: number, from: number, to: number, easing = EASE_OUT_EXPO) =>
  interpolate(ms, [from, to], [0, 1], { ...clamp, easing });

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Whole frames for a millisecond mark at this composition's fps. */
const msFrame = (msValue: number, fps: number) => Math.round((msValue / 1000) * fps);

/**
 * How large a capture is drawn, from whichever frame edge runs out first.
 *
 * 4:5 and 9:16 are width-bound; 16:9 is height-bound. Budgeting the height here
 * rather than per-beat is what stopped the panel standing 902px tall in a 1080
 * frame with 46px of air above it.
 */
const fitScale = (
  w: number,
  h: number,
  frameW: number,
  frameH: number,
  wPct = 0.94,
  hPct = 0.8,
) => Math.min((frameW * wPct) / w, (frameH * hPct) / h);

/* ── A line of the film's own type, centred ───────────────────────────────
   Used only by the closer now. The two opening hook lines it also used to draw
   are gone: they instructed a viewer who had no product in their head yet, and
   they cost 2.2s of runway before anything appeared.

   One phrase per beat, per the ruleset's "multi-phrase copy is multiple BEATS". */
const TypeLine: React.FC<{ ms: number; from: number; to: number; text: string; size: number }> = ({
  ms,
  from,
  to,
  text,
  size,
}) => {
  const inP = ramp(ms, from, from + 500);
  const outP = ramp(ms, to - 280, to, EASE_IN_EXPO);
  if (Math.min(inP, 1 - outP) <= 0.001) return null;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 9%" }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: T.displayWeight,
          letterSpacing: T.displayTracking,
          fontSize: size,
          lineHeight: 1.08,
          textAlign: "center",
          color: T.ink,
          opacity: 1 - outP,
          translate: `0px ${-outP * 18}px`,
        }}
      >
        {text.split(" ").map((word, i) => {
          const p = ramp(ms, from + i * 80, from + i * 80 + 500);
          return (
            <span
              key={`${word}-${i}`}
              style={{
                display: "inline-block",
                opacity: p,
                translate: `0px ${(1 - p) * 22}px`,
                marginRight: size * 0.24,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/**
 * A line in a reserved band at the bottom of the frame.
 *
 * The studio's own caption rule: text goes UNDER the product on clean ground,
 * never over live UI whose contrast we do not control, and never squeezed into
 * whatever space is left above it. Round 5 put these above the detail card and
 * Jacob's note was "the text above the detail view does not look good" — it was
 * an orphan line in dead space. Same treatment now for the board and the card,
 * so the film has one voice for its own words.
 *
 * `topOf` is where the product above it ends, so the band is whatever is left.
 */
const CaptionBand: React.FC<{
  text: string;
  topOf: number;
  frameW: number;
  frameH: number;
  inP: number;
  outP: number;
}> = ({ text, topOf, frameW, frameH, inP, outP }) => {
  if (Math.min(inP, 1 - outP) <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: topOf,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: frameH * 0.02,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: Math.round(frameW * 0.042),
          letterSpacing: "-0.02em",
          color: T.ink,
          textAlign: "center",
          maxWidth: "80%",
          opacity: inP * (1 - outP),
          translate: `0px ${(1 - inP) * 16}px`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* ── Beat 0: frame one is a sentence about the student ────────────────────
 *
 * The film's first frame is the PwC card at 2.88, which puts its own reason
 * paragraph — "At BlackRock you did credit analysis and loan write-ups. Deals
 * teams run that same analysis on every company they buy." — 141px tall in a
 * 1350 frame. A finance junior scrolling past reads a true sentence about their
 * own history before they know what app they are looking at. That is the hook,
 * and it is the product's own text, not ours.
 *
 * The camera then eases back to the resting CARD_SCALE across the whole beat,
 * decelerating, and hands off to the board's pull-out at exactly that scale so
 * the two moves read as one continuous retreat.
 *
 * No entrance on the card itself. It is simply THERE at frame 0 — anything that
 * fades or scales in reintroduces the runway this round exists to delete.
 */
const OpenBeat: React.FC<{
  ms: number;
  centreY: number;
  frameW: number;
  frameH: number;
}> = ({ ms, centreY, frameW, frameH }) => {
  const t = ms - BEATS.open;
  const span = BEATS.board - BEATS.open;
  if (t < 0 || t > span + MATCH_CUT_MS) return null;

  const card = CARDS.find((c) => c.slug === OPEN.slug);
  if (!card) return null;

  /* One decelerating pull, 2.88 -> 2.40, across the whole beat. The board takes
     over from 2.40, which is the scale its own match framing lands on. */
  const back = ramp(t, 0, span, EASE_OUT);
  const s = lerp(OPEN_SCALE, CARD_SCALE, back);

  const w = card.w * s;
  const h = card.h * s;

  /* Cross-fades into the board over MATCH_CUT_MS, the same handoff the round-3
     match cut used, just pointed the other way. */
  const out = ramp(t, span, span + MATCH_CUT_MS, LINEAR);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: frameW / 2 - w / 2,
          top: centreY - h / 2,
          width: w,
          height: h,
          opacity: 1 - out,
          filter: "drop-shadow(0 34px 70px rgba(0,0,0,0.55))",
        }}
      >
        <Img
          src={staticFile(`captures/jobmatch/${OPEN.slug}.png`)}
          style={{ width: "100%", height: "100%", maxWidth: "none" }}
        />
      </div>

      {/* The intro, then the label, all in the band BELOW the card. One voice,
          one place, three lines in sequence — the same reserved band the detail
          captions use. Below, not above: Jacob's round-3 note on the detail
          view was that a line floating ABOVE a card "does not look good", and
          the band is also what spends the 38% of frame height that used to sit
          empty under every card beat.

          The card is on screen under all of it, so the intro explains the idea
          while the evidence for it is already visible. That is the whole
          difference between this and round 3's black-frame open. */}
      {INTRO.map((line) => (
        <CaptionBand
          key={line.text}
          text={line.text}
          topOf={centreY + h / 2}
          frameW={frameW}
          frameH={frameH}
          inP={ramp(t, line.at, line.at + 520)}
          outP={ramp(t, line.until - 120, line.until + 160, EASE_IN_EXPO)}
        />
      ))}

      <CaptionBand
        text={OPEN.label}
        topOf={centreY + h / 2}
        frameW={frameW}
        frameH={frameH}
        inP={ramp(t, 3000, 3520)}
        outP={ramp(t, span - 280, span, EASE_IN_EXPO)}
      />
    </>
  );
};

/* ── Beat 1: pull out, and it was one of twelve ───────────────────────────
   The camera starts ON the PwC card, at exactly the framing the opening beat
   hands it, and pulls OUT until the whole field is in frame. That is round 3's
   match cut run backwards, and it answers the question the opening sentence
   raises: the product did not say that about one job, it said it about twelve.

   Round 3 ran this the other way — out, hold, then punch in — which meant the
   reveal arrived before anyone had a reason to care about it, and the board
   held 2.2s as unreadable texture. It is 1.6s now — 820ms of move and then a
   real hold — and its job is scale, which reads instantly.

   A round that opened FRAMED on the real North Star control, pulled back from
   there, and carried a caption explaining Job Match went back out on Jacob's
   call. The board still shows the chip and its own "Ranked against your North
   Star" header in passing; it just does not stop on them. */
const BoardBeat: React.FC<{
  ms: number;
  frameW: number;
  frameH: number;
  centreY: number;
}> = ({ ms, frameW, frameH, centreY }) => {
  const t = ms - BEATS.board;
  const span = BEATS.card2 - BEATS.board;
  if (t < -MATCH_CUT_MS || t > span) return null;

  const fit = fitScale(BOARD.w, BOARD.h, frameW, frameH);
  const pwc = boardCard(OPEN.slug);

  /* The move finishes well before the cut. A reveal that is still travelling
     when the next card arrives never lets the field register as a field, which
     is the one thing this beat exists to say. 820ms of move, then it holds. */
  const pullOut = ramp(t, 0, 820, EASE_OUT_EXPO);

  const zMatch = CARD_SCALE / fit; // the board card starts the size the standalone card ended
  const z = lerp(zMatch, 1, pullOut);

  const target = { x: pwc.x + pwc.w / 2, y: pwc.y + pwc.h / 2 };
  const anchorX = lerp(target.x, BOARD.w / 2, pullOut);
  const anchorY = lerp(target.y, BOARD.h / 2, pullOut);

  const s = fit * z;

  /* Flat on the card, leaning as the field opens up. 29% of layers in the
     official templates rest tilted; a board of twelve cards is the one thing
     here that can carry it without hurting legibility, and arriving at the lean
     as we retreat is the move earning its place. */
  const lean = pullOut;

  return (
    <AbsoluteFill style={{ perspective: 2400, perspectiveOrigin: "50% 42%" }}>
      <div
        style={{
          position: "absolute",
          left: frameW / 2 - anchorX * s,
          top: centreY - anchorY * s,
          width: BOARD.w * s,
          height: BOARD.h * s,
          opacity: Math.min(ramp(t, 0, MATCH_CUT_MS, LINEAR), 1 - ramp(t, span - 260, span, EASE_IN_EXPO)),
          rotate: `y ${lean * -7}deg`,
          filter: "drop-shadow(0 50px 110px rgba(0,0,0,0.62))",
        }}
      >
        <Img
          src={staticFile("captures/jobmatch/00-board.png")}
          style={{ width: "100%", height: "100%", maxWidth: "none" }}
        />
      </div>
    </AbsoluteFill>
  );
};

/* ── Beat 2: a second, different kind of reason (UI WALKTHROUGH) ──────────
   The camera holds: a push here would read as a tic against the two camera
   moves either side of it, and "a static camera with layer motion beats a timid
   push every time." The one move is a LINEAR ambient drift applied by the
   caller.

   Round 4 moved this label BELOW the card. It used to sit above, which left the
   bottom 38% of the frame empty black for the whole beat — measured: content
   ended at row 838 of 1350. The detail captions already lived in a reserved
   band under the product, so the film now has one voice for its own words and
   spends the space it was wasting. */
const CardBeat: React.FC<{
  ms: number;
  at: number;
  slug: string;
  label: string;
  centreY: number;
  frameW: number;
  frameH: number;
}> = ({ ms, at, slug, label, centreY, frameW, frameH }) => {
  const t = ms - at;
  if (t < -120 || t > CARD_MS) return null;

  const card = CARDS.find((c) => c.slug === slug);
  if (!card) return null;

  const w = card.w * CARD_SCALE;
  const h = card.h * CARD_SCALE;
  const left = frameW / 2 - w / 2;

  /* Settle-in arrival: three reverse-direction blocks landing together, the
     house idiom for an arrival that reads hand-made rather than like a preset.
     Exits are 280ms, always faster than the entrance. */
  const fade = ramp(t, 0, 500, EASE_OUT);
  const rise = ramp(t, 0, 620, EASE_OUT_EXPO);
  const out = ramp(t, CARD_MS - 280, CARD_MS, EASE_IN_EXPO);

  return (
    <>
      {/* The label settles in during the hold, never during a move. */}
      <CaptionBand
        text={label}
        topOf={centreY + h / 2}
        frameW={frameW}
        frameH={frameH}
        inP={ramp(t, 620, 1140)}
        outP={out}
      />

      <div
        style={{
          position: "absolute",
          left,
          top: centreY - h / 2,
          width: w,
          height: h,
          opacity: Math.min(fade, 1 - out),
          translate: `0px ${(1 - rise) * 46 - out * 42}px`,
          scale: lerp(0.94, 1, rise),
          filter: "drop-shadow(0 34px 70px rgba(0,0,0,0.55))",
        }}
      >
        <Img
          src={staticFile(`captures/jobmatch/${slug}.png`)}
          style={{ width: "100%", height: "100%", maxWidth: "none" }}
        />
      </div>
    </>
  );
};

/* ── Beat 3: the breakdown writes itself ───────────────────────────────
   Why this fits you, then About this role, then Skills recruiters screen for,
   in that order, with the card growing 579 -> 856 -> 995 as each section lands.
   Then the six pills tick in 170ms apart and the count lands last.

   The capture is the WHOLE job card now, header and footer included, so it
   arrives already saying "Investment Banking Summer Analyst — Evercore". That
   is what let the separate Evercore feed card go.

   Each state is its own capture with its own natural height, so the growth is
   real geometry rather than a reveal mask, and the shared region is pixel
   identical across the cross-fade. */
const BreakdownBeat: React.FC<{
  ms: number;
  centreY: number;
  frameW: number;
  frameH: number;
}> = ({ ms, centreY, frameW, frameH }) => {
  const t = ms - BEATS.detail;
  const span = BEATS.close - BEATS.detail;
  if (t < -60 || t > span + 300) return null;

  const url = (name: string) => staticFile(`captures/jobmatch/04-evercore-detail${name}.png`);
  const { card, scroller } = DETAIL.shell;

  const scale = Math.min((frameW * 0.93) / card.w, (frameH * 0.8) / card.h);
  const w = card.w * scale;
  const h = card.h * scale;

  /* How far the scroller can actually travel. Measured from the two captures
     rather than taken from `scrollHeight`, which counts the container's bottom
     padding and would let the film scroll past the end. */
  const maxScroll = Math.max(0, DETAIL.h - scroller.h);

  /**
   * A stop puts its section's heading just below the scroller's top edge, then
   * clamps to the real travel. Centring a section instead buries its heading
   * and the viewer never sees what they are looking at.
   */
  const LEAD = 24;
  const stopScroll = (key: (typeof STOPS)[number]["key"]) =>
    Math.max(0, Math.min(maxScroll, DETAIL.sections[key] - LEAD));

  let offset = stopScroll(STOPS[0].key);
  for (let i = 1; i < STOPS.length; i++) {
    const from = STOPS[i - 1];
    const to = STOPS[i];
    offset = lerp(offset, stopScroll(to.key), ramp(t, from.until, to.at, EASE_IN_OUT));
  }

  const enter = ramp(t, 0, 500, EASE_OUT);
  const rise = ramp(t, 0, 620, EASE_OUT_EXPO);
  const out = ramp(t, span, span + 300, EASE_IN_EXPO);

  const count = detailPart("5 of 6");
  const pillAt = (i: number) => PILLS_AT + i * PILL_STAGGER;
  const countIn = ramp(t, COUNT_AT, COUNT_AT + 380);

  /* A clipped copy of the full content, for a pill or the count. It lives
     INSIDE the scrolling wrapper, so it travels with the text it belongs to
     instead of needing its own offset maths. */
  const lit = (rect: { x: number; y: number; w: number; h: number }, pad: number, p: number, radius?: number) => {
    const x = (rect.x - pad) * scale;
    const y = (rect.y - pad) * scale;
    return (
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: (rect.w + pad * 2) * scale,
          height: (rect.h + pad * 2) * scale,
          overflow: "hidden",
          borderRadius: radius,
          opacity: p,
          scale: lerp(0.92, 1, p),
        }}
      >
        <Img
          src={url("-content")}
          style={{
            position: "absolute",
            left: -x,
            top: -y,
            width: DETAIL.w * scale,
            height: DETAIL.h * scale,
            /* Tailwind's preflight sets `img { max-width: 100% }` and max-width
               beats an inline width, so without this the whole content is
               squeezed into the pill and renders as scrambled text. */
            maxWidth: "none",
            maxHeight: "none",
          }}
        />
      </div>
    );
  };

  const left = frameW / 2 - w / 2;

  return (
    <>
      {/**
       * A line per stop, in a band BELOW the card.
       *
       * Jacob, 2026-09-16: "The text above the detail view does not look good."
       * It was an orphan line floating in the dead space over a card that
       * already sits high in the frame. This studio already had the answer:
       * captions live in a reserved band under the product, never over it and
       * never squeezed above it (see `components/Caption.tsx`). Same treatment
       * here — centred, weight 600, full ink, on clean ground.
       *
       * Each line names what its section ANSWERS rather than repeating the
       * heading underneath it, and lands during the HOLD, never during the
       * scroll.
       */}
      {STOPS.map((stop) => {
        const last = stop === STOPS[STOPS.length - 1];
        const from = stop.at + 200;
        return (
          <CaptionBand
            key={stop.key}
            text={stop.label}
            topOf={centreY + h / 2}
            frameW={frameW}
            frameH={frameH}
            inP={ramp(t, from, from + 520)}
            outP={
              last
                ? ramp(t, span, span + 300, EASE_IN_EXPO)
                : ramp(t, stop.until - 120, stop.until + 160, EASE_IN_EXPO)
            }
          />
        );
      })}

      <div
      style={{
        position: "absolute",
        left,
        top: centreY - h / 2,
        width: w,
        height: h,
        opacity: Math.min(enter, 1 - out),
        translate: `0px ${(1 - rise) * 46}px`,
        filter: "drop-shadow(0 40px 90px rgba(0,0,0,0.6))",
      }}
    >
      {/* The card at rest. It never moves and never changes size. */}
      <Img src={url("")} style={{ width: w, height: h, maxWidth: "none" }} />

      {/* Its own scroller, doing what it really does. At offset 0 this sits
          exactly on top of the card's own pixels, so there is no seam. */}
      <div
        style={{
          position: "absolute",
          left: scroller.x * scale,
          top: scroller.y * scale,
          width: scroller.w * scale,
          height: scroller.h * scale,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: -offset * scale }}>
          <Img
            src={url("-content-nopills")}
            style={{
              width: DETAIL.w * scale,
              height: DETAIL.h * scale,
              maxWidth: "none",
              display: "block",
            }}
          />
          {countIn > 0.001 ? lit(count, 6, countIn) : null}
          {DETAIL.pills.map((pill, i) => {
            const p = ramp(t, pillAt(i), pillAt(i) + PILL_MS);
            if (p <= 0.001) return null;
            return <React.Fragment key={pill.name}>{lit(pill, 4, p, 999)}</React.Fragment>;
          })}
        </div>
      </div>
      </div>
    </>
  );
};

/* ── Beat 4: the mark (LOGO STING) ───────────────────────────────────────
   Wordmark only. The chat film's closing tagline diverged from the locked
   launch line and that is unresolved, so this film does not pick a side. */
const EndBeat: React.FC<{ ms: number; width: number }> = ({ ms, width }) => {
  const t = ms - BEATS.end;
  if (t < 0) return null;
  const p = ramp(t, 120, 640, EASE_OUT_EXPO);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Img
        src={staticFile("brand/campusai-logo-white.svg")}
        style={{
          width: width * 0.46,
          maxWidth: "none",
          opacity: p,
          scale: lerp(0.94, 1, p),
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * The graded stack, at the levels the official templates actually run at.
 *
 * "What keeps it premium is grading, not scarcity: every effect stays below the
 * level where it announces itself." Vignette 0.53 and grain 0.02 are the two
 * that are honest in CSS; bloom and depth of field need a real compositor and
 * faking them would look worse than leaving them out.
 */
const Grade: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.53) 100%)",
        pointerEvents: "none",
      }}
    />
    <AbsoluteFill style={{ opacity: 0.02, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        {/* Reseeded every frame so the grain moves like film instead of sitting
            on the picture as a static texture. */}
        <filter id="jobmatch-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 11} />
        </filter>
        <rect width="100%" height="100%" filter="url(#jobmatch-grain)" />
      </svg>
    </AbsoluteFill>
  </>
);

export const JobMatchFilm: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  const safe = safeLayout(width, height);
  const centreY = height * safe.contentY;
  const closingSize = Math.round(width * (height / width >= 1.5 ? 0.082 : 0.086));

  /* The ambient drift, over the one remaining card beat. It is scoped to that
     beat and nothing else: the open and the board each run their own camera,
     and stacking a second scale on top of either would fight it. */
  const inCards = ms >= BEATS.card2 && ms < BEATS.detail;
  const cardDrift = inCards ? lerp(1, 1.06, ramp(ms, BEATS.card2, BEATS.detail, LINEAR)) : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: T.bg }}>
      <AbsoluteFill style={{ backgroundImage: T.bgGradient }} />

      <OpenBeat ms={ms} centreY={centreY} frameW={width} frameH={height} />

      <BoardBeat ms={ms} frameW={width} frameH={height} centreY={centreY} />

      <AbsoluteFill style={{ scale: cardDrift }}>
        {CARD_BEATS.map((b) => (
          <CardBeat
            key={b.slug}
            ms={ms}
            at={b.at}
            slug={b.slug}
            label={b.label}
            centreY={centreY}
            frameW={width}
            frameH={height}
          />
        ))}
      </AbsoluteFill>

      <BreakdownBeat ms={ms} centreY={centreY} frameW={width} frameH={height} />

      {/* The line, then the mark. The gap it follows keeps its honesty and its
          place; it just is not the last thing a junior sees any more. */}
      <TypeLine
        ms={ms}
        from={BEATS.close}
        to={BEATS.end}
        text={CLOSING_LINE}
        size={closingSize}
      />
      <EndBeat ms={ms} width={width} />

      {/**
       * The mark, held from the end of the opening sting to the start of the
       * closing one. The studio's own component: top left, small, and it fades
       * before the end card so two CampusAI logos never share a frame.
       *
       * Wrapped in a Sequence so its internal fade-in counts from where it
       * actually appears rather than from frame zero, which is under the sting.
       */}
      <Sequence layout="none">
        <Watermark
          src="brand/campusai-logo-white.svg"
          fadeOutAt={msFrame(BEATS.close, fps)}
        />
      </Sequence>

      <Grade frame={frame} />
    </AbsoluteFill>
  );
};
