// CampusAI adaptation (2026-10-22), from the shot shelf (Content/video-studio/shots/, video-shotcraft, Apache-2.0):
// demos/ui-entrance/document-typewriter-reveal (card: cards/typography/document-typewriter-reveal.md).
// Step "Tailor your resume for that job", right after the posting scan: the student's own resume, and CampusAI
// rewriting it line by line for the Goldman Sachs posting.
//
// Kept from the shot:
//   one pen      a single 3px accent caret with a soft same-colour glow, never two at once; it blinks while idle
//                (floor(f/4) % 2 -> 1 / 0.25, as the shot's waiting pen) and fades 2f after the last line is written
//   writing      each written line runs the shot's 9f block wipe on bezier(0.4, 0, 0.6, 1), the pen riding the edge
//   rail reveal  the card opens top to bottom (card-colour patch receding, bezier(0.3, 0, 0.2, 1)) with a 2px accent
//                line growing on the inner edge and fading over 24f; the same curve opens space as lines are added
//   drop-in      the shot's history entries become the note under each rewritten line: drop from -48px, 9f on
//                bezier(0.2, 1.15, 0.3, 1) (light bounce), 3f fade in, air shadow 12*air / 24*air
//   camera       the shot's monotone cubic Hermite camera, toned down: a slight oblique open that settles flat by f64,
//                then the 0.8% slow push across the hold
//
// Changed: the weekly-report texture, the aurora stage, dust, @-mention wash and the closing tagline are gone. The
// document is the demo student's resume on our dark card, the accent is brand red. Text is live type, so the
// wipe is quantised to characters (a real typewriter) instead of a paper mask over a screenshot. New in this port:
// before each rewrite the old line is struck through (a red strike sweeping on the wipe curve) and then deleted
// back character by character, so the edit reads as an edit.
import React from 'react';
import { INTER } from '../../kit/parts';
import { bezier, ramp, softShadow } from '../_fixtures/Polish';

export const RESUME_REWRITE_DURATION = 177;

// ───────────── content (the demo student's real resume lines and CampusAI's real Tailor changes) ─────────────
const FILE_NAME = 'Maya_Chen_Resume.pdf';
type Edit = { old: string; next: string[]; note: string };
type Section = { head: string; edits: Edit[] };
const SECTIONS: Section[] = [
  {
    head: 'Smith Investment Fund',
    edits: [
      {
        old: 'Researched stocks and presented ideas to the group.',
        next: ['Built pitch materials in PowerPoint for 3 equity', "ideas and presented each to the fund's", 'investment committee.'],
        note: 'Call it pitch materials, the way Goldman does',
      },
      {
        old: 'Built DCF and comps models for equity pitches.',
        next: ['Built DCF and comparable company analysis models', "in Excel to value 3 companies for the fund's", 'investment committee.'],
        note: 'Spell out comparable company analysis',
      },
    ],
  },
  {
    head: 'Coursework',
    edits: [
      {
        old: 'Analyzed company financials for class projects.',
        next: ['Ran due diligence on company financials for class', 'valuation projects, from the filings to a written', 'recommendation.'],
        note: 'Name the due diligence you already do',
      },
    ],
  },
];
const EDITS = SECTIONS.flatMap((s) => s.edits);

// ───────────── look ─────────────
const RED = '#E8293B';
const RED_RGB = '232,41,59';
const CARD_BG = '#21171f';
const HAIR = '1px solid rgba(255,255,255,0.12)';

// ───────────── document layout (card-local px) ─────────────
const CARD_W = 940;
const CARD_X = (1080 - CARD_W) / 2;
const CARD_Y = 400;
const PAD_X = 48;
const PAD_TOP = 36;
const TEXT_X = PAD_X + 30; // bullet dot sits in the 30px before the text
const TITLE_LH = 34;
const HEAD_LH = 46;
const LH = 42; // body line
const NOTE_GAP = 8;
const NOTE_LH = 38;
const ITEM_GAP = 18;
const SECTION_GAP = 34;
const PAD_BOTTOM = 40;
const BODY_SIZE = 30;
const BODY_TRACK = -0.3; // -0.01em at 30px
const CARET_H = 34;

// ───────────── timing (frames at the 177f reference, scaled to dur) ─────────────
const REF = 177;
const OPEN = 12; // card reveal, top to bottom
const LINE0 = 12; // first rewrite starts as the card finishes opening
const PER_LINE = 45;
const TRAVEL = [0, 6]; // pen moves to the end of the old line
const STRIKE = [6, 11]; // red strike sweeps the old line
const DELETE = [12, 17]; // old line deleted back
const TYPE0 = 17; // new line starts typing
const WIPE = 9; // the shot's per-block write
const NOTE_AT = 41; // note drops as the last written line lands
const NOTE_DROP = 9;
const GROW = 4; // space opens for each new written line, starting 3f before it types

const WRITE_EASE = bezier(0.4, 0, 0.6, 1);
const RAIL_EASE = bezier(0.3, 0, 0.2, 1);
const DROP_EASE = bezier(0.2, 1.15, 0.3, 1);

// ───────────── the shot's camera: monotone cubic Hermite, no velocity jumps ─────────────
type Cam = { zoom: number; rotX: number; rotY: number };
const ANCHORS: (Cam & { frame: number })[] = [
  { frame: 0, zoom: 1.06, rotX: 6, rotY: -9 },
  { frame: 26, zoom: 1.025, rotX: 2.5, rotY: -4 },
  { frame: 64, zoom: 1.0, rotX: 0, rotY: 0 },
  { frame: 150, zoom: 1.0, rotX: 0, rotY: 0 },
  { frame: 177, zoom: 1.008, rotX: 0, rotY: 0 },
];
const hermite = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d = xs.slice(0, -1).map((x, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - x));
  const m = xs.map((_, i) => (i === 0 || i === n - 1 ? 0 : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};
const CAM_KEYS: (keyof Cam)[] = ['zoom', 'rotX', 'rotY'];
const CURVES = Object.fromEntries(CAM_KEYS.map((p) => [p, hermite(ANCHORS.map((k) => k.frame), ANCHORS.map((k) => k[p]))])) as Record<keyof Cam, (x: number) => number>;

// ───────────── text measure (live type, so the pen can travel to a line's real end) ─────────────
let ctx: CanvasRenderingContext2D | null = null;
const measure = (s: string) => {
  if (typeof document !== 'undefined' && !ctx) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return s.length * 15;
  ctx.font = `500 ${BODY_SIZE}px ${INTER}, sans-serif`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${BODY_TRACK}px`;
  return ctx.measureText(s).width;
};

// ───────────── per-frame layout ─────────────
type ItemLayout = { y: number; noteY: number; noteT: number };
type Layout = { titleY: number; heads: number[]; items: ItemLayout[]; h: number };

const BODY_TEXT: React.CSSProperties = {
  position: 'absolute',
  left: TEXT_X,
  fontFamily: INTER,
  fontWeight: 500,
  fontSize: BODY_SIZE,
  lineHeight: `${LH}px`,
  letterSpacing: `${BODY_TRACK}px`,
  whiteSpace: 'nowrap',
};

export const ResumeRewrite: React.FC<{ f: number; dur: number }> = ({ f, dur }) => {
  const S = dur / REF;
  const at = (x: number) => x * S;
  const base = (k: number) => at(LINE0 + PER_LINE * k);
  const typeCue = (k: number, j: number) => base(k) + at(TYPE0) + WIPE * S * j;
  const noteCue = (k: number) => base(k) + at(NOTE_AT);
  const camF = f / S;
  const cam = { zoom: CURVES.zoom(camF), rotX: CURVES.rotX(camF), rotY: CURVES.rotY(camF) };

  // layout: space opens for each extra written line and for each note as it drops
  const lay: Layout = (() => {
    let y = PAD_TOP;
    const titleY = y;
    y += TITLE_LH + 28;
    const heads: number[] = [];
    const items: ItemLayout[] = [];
    let k = 0;
    SECTIONS.forEach((s, si) => {
      if (si > 0) y += SECTION_GAP;
      heads.push(y);
      y += HEAD_LH + 12;
      s.edits.forEach((e, ei) => {
        if (ei > 0) y += ITEM_GAP;
        const itemY = y;
        let lines = 1;
        for (let j = 1; j < e.next.length; j++) lines += ramp(f, typeCue(k, j) - 3 * S, GROW * S, RAIL_EASE);
        y += LH * lines;
        const noteT = ramp(f, noteCue(k), NOTE_DROP * S, RAIL_EASE);
        const noteY = y + NOTE_GAP;
        y += (NOTE_GAP + NOTE_LH) * noteT;
        items.push({ y: itemY, noteY, noteT });
        k++;
      });
    });
    return { titleY, heads, items, h: y + PAD_BOTTOM };
  })();

  // the one pen
  const blink = Math.floor(f / 4) % 2 === 0 ? 1 : 0.25;
  const caretStyle = (op: number): React.CSSProperties => ({
    width: 3,
    height: CARET_H,
    borderRadius: 2,
    background: RED,
    boxShadow: `0 0 8px rgba(${RED_RGB},0.6), 0 0 20px rgba(${RED_RGB},0.45)`,
    opacity: op,
  });
  const InlineCaret: React.FC<{ op: number }> = ({ op }) => (
    <span style={{ ...caretStyle(op), display: 'inline-block', marginLeft: 3, verticalAlign: '-0.22em' }} />
  );

  let active = -1;
  EDITS.forEach((_, k) => {
    if (f >= base(k)) active = k;
  });
  // absolute pen while idle before the first edit or travelling between lines
  let freePen: { x: number; y: number; op: number } | null = null;
  if (active === -1) {
    const it = lay.items[0];
    const show = ramp(f, at(4), 2, (t) => t);
    if (show > 0) freePen = { x: TEXT_X, y: it.y, op: blink * show };
  } else {
    const local = f - base(active);
    if (local < at(TRAVEL[1])) {
      const t = ramp(f, base(active) + at(TRAVEL[0]), at(TRAVEL[1] - TRAVEL[0]), WRITE_EASE);
      const from =
        active === 0
          ? { x: TEXT_X, y: lay.items[0].y }
          : (() => {
              const prev = EDITS[active - 1];
              return { x: TEXT_X + measure(prev.next[prev.next.length - 1]), y: lay.items[active - 1].y + LH * (prev.next.length - 1) };
            })();
      const to = { x: TEXT_X + measure(EDITS[active].old), y: lay.items[active].y };
      freePen = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, op: 1 };
    }
  }

  const reveal = ramp(f, 0, at(OPEN), RAIL_EASE);
  const revealLine = 1 - ramp(f, at(OPEN), at(24), (t) => t);
  // the window is already in frame at f0 (as in the shot); only its contents are still unwritten
  const cardIn = 0.6 + 0.4 * ramp(f, 0, at(5), (t) => t);

  return (
    <div
      style={{
        position: 'absolute',
        left: CARD_X,
        top: CARD_Y,
        width: CARD_W,
        height: lay.h,
        transform: `perspective(2200px) rotateY(${cam.rotY.toFixed(3)}deg) rotateX(${cam.rotX.toFixed(3)}deg) scale(${cam.zoom.toFixed(5)})`,
        transformOrigin: '50% 35%',
        opacity: cardIn,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
          overflow: 'hidden',
          background: CARD_BG,
          border: HAIR,
          boxSizing: 'border-box',
          boxShadow: softShadow(30, { color: '#000000', strength: 1.1 }),
        }}
      >
        <div style={{ position: 'absolute', left: PAD_X, top: lay.titleY, fontFamily: INTER, fontWeight: 600, fontSize: 26, lineHeight: `${TITLE_LH}px`, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em' }}>
          {FILE_NAME}
        </div>

        {SECTIONS.map((s, si) => (
          <div
            key={s.head}
            style={{ position: 'absolute', left: PAD_X, top: lay.heads[si], fontFamily: 'Zodiak, serif', fontWeight: 700, fontSize: 38, lineHeight: `${HEAD_LH}px`, letterSpacing: '-0.02em', color: '#ffffff', whiteSpace: 'nowrap' }}
          >
            {s.head}
          </div>
        ))}

        {EDITS.map((e, k) => {
          const it = lay.items[k];
          const local = f - base(k);
          const dot = <div style={{ position: 'absolute', left: PAD_X + 4, top: it.y + LH / 2 - 4, width: 8, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.4)' }} />;

          // 1. the old line: untouched, then struck, then deleted back
          if (f < base(k) + at(TYPE0)) {
            const strike = ramp(f, base(k) + at(STRIKE[0]), at(STRIKE[1] - STRIKE[0]), WRITE_EASE);
            const del = ramp(f, base(k) + at(DELETE[0]), at(DELETE[1] - DELETE[0]), WRITE_EASE);
            const shown = e.old.slice(0, Math.round(e.old.length * (1 - del)));
            const w = measure(shown);
            const penHere = active === k && local >= at(TRAVEL[1]);
            return (
              <React.Fragment key={k}>
                {dot}
                {strike > 0 && (
                  <>
                    <div style={{ position: 'absolute', left: TEXT_X - 4, top: it.y + 3, width: (w + 8) * strike, height: LH - 6, borderRadius: 6, background: `rgba(${RED_RGB},0.2)` }} />
                    <div style={{ position: 'absolute', left: TEXT_X, top: it.y + LH / 2 + 1, width: w * strike, height: 2.5, borderRadius: 2, background: RED }} />
                  </>
                )}
                <div style={{ ...BODY_TEXT, top: it.y, color: `rgba(255,255,255,${(0.85 - 0.35 * strike).toFixed(3)})` }}>
                  {shown}
                  {penHere && <InlineCaret op={1} />}
                </div>
              </React.Fragment>
            );
          }

          // 2. the new line, written one wrapped line at a time behind the pen
          const lastDone = typeCue(k, e.next.length - 1) + WIPE * S;
          const isLast = k === EDITS.length - 1;
          const penOwner = active === k;
          const typingNow = f < lastDone;
          const penOp = typingNow ? 1 : isLast ? 1 - ramp(f, lastDone, 2, (t) => t) : blink;
          let penLine = -1;
          e.next.forEach((_, j) => {
            if (f >= typeCue(k, j)) penLine = j;
          });
          const air = Math.max(0, 1 - ramp(f, noteCue(k), NOTE_DROP * S, DROP_EASE));
          const noteIn = ramp(f, noteCue(k), 3 * S, (t) => t);
          return (
            <React.Fragment key={k}>
              {dot}
              {e.next.map((line, j) => {
                if (f < typeCue(k, j)) return null;
                const t = ramp(f, typeCue(k, j), WIPE * S, WRITE_EASE);
                const shown = line.slice(0, Math.max(1, Math.round(line.length * t)));
                return (
                  <div key={j} style={{ ...BODY_TEXT, top: it.y + LH * j, color: '#ffffff' }}>
                    {shown}
                    {penOwner && j === penLine && penOp > 0 && <InlineCaret op={penOp} />}
                  </div>
                );
              })}
              {f >= noteCue(k) && (
                <div
                  style={{
                    position: 'absolute',
                    left: TEXT_X,
                    top: it.noteY,
                    fontFamily: 'Zodiak, serif',
                    fontWeight: 700,
                    fontSize: 30,
                    lineHeight: `${NOTE_LH}px`,
                    letterSpacing: '-0.02em',
                    color: RED,
                    whiteSpace: 'nowrap',
                    opacity: noteIn,
                    transform: `translateY(${(-48 * air).toFixed(2)}px)`,
                    filter: air > 0.02 ? `drop-shadow(0 ${(12 * air).toFixed(2)}px ${(12 * air).toFixed(2)}px rgba(0,0,0,${(0.5 * air).toFixed(3)}))` : undefined,
                  }}
                >
                  {e.note}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {freePen && <div style={{ ...caretStyle(freePen.op), position: 'absolute', left: freePen.x + 3, top: freePen.y + (LH - CARET_H) / 2 }} />}

        {/* the shot's rail reveal: a card-colour patch recedes top to bottom, an accent line grows on the inner edge */}
        {reveal < 1 && <div style={{ position: 'absolute', left: 0, right: 0, top: lay.h * reveal, bottom: 0, background: CARD_BG }} />}
        {revealLine > 0 && f >= 0 && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: 2, height: lay.h * reveal, background: RED, opacity: revealLine, boxShadow: `0 0 10px rgba(${RED_RGB},0.6)` }} />
        )}
      </div>
    </div>
  );
};
