// CampusAI adaptation (2026-10-21), from the shot shelf (Content/video-studio/shots/, video-shotcraft, Apache-2.0):
// demos/effects/scanline-annotate-focus (part 1) + demos/ui-entrance/list-stack-press (part 2).
// Step "Tailor your resume for that job": CampusAI reads the real Goldman Sachs posting, then hands back what it found.
//
// Part 1 (0 to ~100f), kept from scanline-annotate-focus:
//   scan        strictly linear, no easing, doc-local y -20 -> DOC_H + 20 over SCAN0 6 -> SCAN1 76 (original 6 -> 80,
//               about the same px/frame); 3px core + 140px fading wash + 18px dot grid behind it; a sliding cursor each side
//   triggers    ft = frame the line clears a block's bottom edge, min 4f apart, computed from the bboxes
//   brackets    four L corners from 76px outside the bbox, spring(damping 15, stiffness 210) with one visible overshoot,
//               arms 40 -> 26px one beat (3f) later, focus flash ft+3 -> ft+6 in, out by ft+18 (fill .075, 2px inset)
//   caption     ft+5, pops in 4f, rises 8px over 12f, types at 2.2 chars/frame with a block cursor, grows with the text
//   push-in     1.000 -> 1.035 on EASE.swift across part 1
// Part 2 (~100 to 206f), kept from list-stack-press:
//   flight      from 600px below, 22f on bezier(0.45, 0.05, 0.25, 1.12), alternating +-2deg tilt, scale 1.06 -> 1,
//               vertical speed blur (0.22, max 14), two-layer shadow from elevation 56 -> 3
//   press       the settled stack is pushed down 6px and back over 8f ([0,4,8] -> [0,6,0], inOut sine)
//   lag         the secondary accent (chips, red dashes) grows 3f after the card lands
//   glaze       one soft sweep across the whole stack after the last card lands, clipped to each card
//
// Changed: the sand brand page, its browser window, the cobalt "machine" colour, the status row with its
// READING / SIGNALS caps counter, the Y readout and the odometer counter are gone. The page is the real posting on a
// dark card, the machine colour is brand red (scan, captions, lit words), brackets are white. Captions are INTER 600,
// never monospace. Press fires on landing (as asked), not at the next card's launch as in the original. Cards
// are clipped to the screen band y 340-1610 (soft 160px floor) so their flight never crosses into the notes band.
import React from 'react';
import { Easing, interpolate } from 'remotion';
import { INTER } from '../../kit/parts';
import { EASE, SpeedBlur, ramp, softShadow, velocity } from '../_fixtures/Polish';
import { springAt } from '../_fixtures/Look';

export const POSTING_SCAN_DURATION = 206;

// ───────────── content (the demo's real posting and CampusAI's real Tailor read) ─────────────
const TITLE: string[] = ['2027 Summer Analyst,', 'Global Banking and [Markets]'];
const COMPANY = 'Goldman Sachs';
// [word] lights red as the scan clears it; {tool} gets a red underline. Line breaks are fixed so every word has a known y.
type Block = { key: string; head: string; cap: [string, string]; items: string[][] };
const BLOCKS: Block[] = [
  {
    key: 'resp',
    head: 'Responsibilities',
    cap: ['deals and transactions', ', 3 times'],
    items: [
      ['Build and maintain financial models and comparable', 'company analyses for live [deals]'],
      ['Prepare pitch materials and client presentations', 'in {PowerPoint}'],
      ['Research industries, companies and [market] trends and', 'summarize what matters'],
      ['Support due diligence and the execution of [transactions]'],
    ],
  },
  {
    key: 'basic',
    head: 'Basic qualifications',
    cap: ['markets', ', 3 times'],
    items: [
      ['Strong {Excel} skills and comfort working with financial', 'statements'],
      ['Demonstrated interest in financial [markets]'],
    ],
  },
  {
    key: 'pref',
    head: 'Preferred',
    cap: ['4 tools', ' named'],
    items: [['Experience with {Bloomberg} or {Capital IQ}']],
  },
];
const SAYING = ['deals and transactions 3x', 'markets 3x'];
const TOOLS = ['Excel', 'PowerPoint', 'Bloomberg', 'Capital IQ'];
const CHANGES = [
  { title: 'Call it pitch materials, the way Goldman does', why: 'Goldman lists pitch materials and client presentations as core work. Your fund bullet only says you presented ideas.' },
  { title: 'Spell out comparable company analysis', why: 'The posting asks for comparable company analyses on live deals. Your resume only says comps, which a screen can miss.' },
  { title: 'Name the due diligence you already do', why: 'Due diligence is one of the five things this desk does, and your resume never uses the word.' },
];

// ───────────── look ─────────────
const RED = '#E8293B';
const RED_RGB = '232,41,59';
const CARD_BG = '#21171f';
const HAIR = '1px solid rgba(255,255,255,0.08)';

// ───────────── document layout (doc-local px) ─────────────
const DOC_W = 940;
const DOC_X = (1080 - DOC_W) / 2;
const DOC_Y = 380;
const PAD = 44;
const TITLE_Y = 40;
const TITLE_LH = 52;
const COMPANY_Y = TITLE_Y + TITLE_LH * TITLE.length + 8;
const COMPANY_LH = 36;
const HEAD_H = COMPANY_Y + COMPANY_LH + 36; // the collapsed card: title + company
const HEADING_LH = 32;
const LINE_LH = 36;
const BULLET_IN = 24;

type Line = { text: string; y: number; bullet: boolean };
type BlockLayout = Block & { headY: number; lines: Line[]; box: { x: number; y: number; w: number; h: number }; ft: number };
const LAYOUT = (() => {
  let y = COMPANY_Y + COMPANY_LH + 36;
  const out: BlockLayout[] = [];
  for (const b of BLOCKS) {
    const headY = y;
    y += HEADING_LH + 10;
    const lines: Line[] = [];
    b.items.forEach((item, ii) => {
      if (ii > 0) y += 6;
      item.forEach((text, li) => {
        lines.push({ text, y, bullet: li === 0 });
        y += LINE_LH;
      });
    });
    const box = { x: PAD - 16, y: headY - 12, w: DOC_W - 2 * (PAD - 16), h: y - headY + 24 };
    out.push({ ...b, headY, lines, box, ft: 0 });
    y += 40;
  }
  return { blocks: out, docH: y - 40 + 40 };
})();
const DOC_H = LAYOUT.docH;

// ───────────── scan (strictly linear: the machine's line of sight) ─────────────
const SCAN0 = 6;
const SCAN1 = 76;
const Y0 = -20;
const Y1 = DOC_H + 20;
const scanY = (f: number) => Y0 + (Y1 - Y0) * Math.min(1, Math.max(0, (f - SCAN0) / (SCAN1 - SCAN0)));
const frameAtY = (y: number) => SCAN0 + ((y - Y0) / (Y1 - Y0)) * (SCAN1 - SCAN0);
{
  let prev = -99;
  for (const b of LAYOUT.blocks) {
    b.ft = Math.max(frameAtY(b.box.y + b.box.h), prev + 4);
    prev = b.ft;
  }
}

// ───────────── part 2 timing ─────────────
const COLLAPSE0 = 100;
const COLLAPSE_LEN = 14;
const FADE0 = 98;
const CUES = [106, 122, 138]; // 16f apart (12f in the 5-card original; 3 cards here carry more to read)
const FLY = 22;
const LAND = 16; // FLY_EASE first reaches the slot ~0.72 of the way in: the contact frame
const FLY_EASE = Easing.bezier(0.45, 0.05, 0.25, 1.12);
const TILTS = [2, -2, 2];
const RISE = 600;

const CARD_GAP = 14;
// the last card sizes to its text (three changes); only the cards above it need a fixed height
const CARD_HS = [160, 160, 0];
const CARD_YS = (() => {
  let y = DOC_Y + HEAD_H + 16;
  return CARD_HS.map((h) => {
    const at = y;
    y += h + CARD_GAP;
    return at;
  });
})();
const BAND = { y: 340, h: 1270 };
// cards rise out of a soft floor instead of a hard cut at the band's bottom edge
const BAND_MASK = 'linear-gradient(180deg, #000 0, #000 calc(100% - 160px), transparent 100%)';

const flyT = (i: number, f: number) =>
  interpolate(f, [CUES[i], CUES[i] + FLY], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: FLY_EASE });
const flyY = (i: number, f: number) => RISE * (1 - flyT(i, f));
// the settled stack (and the posting above it) is pushed down 6px when a later card lands
const pressAt = (settledBelow: number, f: number) => {
  let p = 0;
  for (let j = settledBelow + 1; j < CUES.length; j++) {
    const at = CUES[j] + LAND;
    p = Math.max(p, interpolate(f, [at, at + 4, at + 8], [0, 6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin) }));
  }
  return p;
};

// ───────────── text with lit words ─────────────
const BODY: [number, number, number, number] = [255, 255, 255, 0.78];
const WHITE: [number, number, number, number] = [255, 255, 255, 1];
const REDA: [number, number, number, number] = [232, 41, 59, 1];
const mixC = (a: number[], b: number[], t: number) =>
  `rgba(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)},${(a[3] + (b[3] - a[3]) * t).toFixed(3)})`;

const LitText: React.FC<{ text: string; base: number[]; f: number; at: number }> = ({ text, base, f, at }) => {
  const lit = ramp(f, at, 5, EASE.out);
  const under = ramp(f, at + 2, 7, EASE.out);
  return (
    <>
      {text.split(/(\[[^\]]+\]|\{[^}]+\})/).map((s, i) => {
        if (s.startsWith('[')) {
          return (
            <span key={i} style={{ color: mixC(base, REDA, lit), textShadow: `0 0 16px rgba(${RED_RGB},${(0.45 * lit).toFixed(3)})` }}>
              {s.slice(1, -1)}
            </span>
          );
        }
        if (s.startsWith('{')) {
          return (
            <span key={i} style={{ position: 'relative', color: mixC(base, WHITE, lit) }}>
              {s.slice(1, -1)}
              <span style={{ position: 'absolute', left: 0, bottom: -4, height: 3, borderRadius: 2, width: `${(100 * under).toFixed(2)}%`, background: RED }} />
            </span>
          );
        }
        return <span key={i}>{s}</span>;
      })}
    </>
  );
};

// ───────────── brackets + captions ─────────────
const Bracket: React.FC<{ b: BlockLayout; f: number }> = ({ b, f }) => {
  if (f < b.ft) return null;
  const t = b.box;
  const s = springAt(f, b.ft, { damping: 15, stiffness: 210 });
  const pad = 76 * (1 - s);
  const op = Math.min(1, (f - b.ft) / 3);
  const arm = 40 - 14 * ramp(f, b.ft + 3, 12, EASE.out);
  const flash = ramp(f, b.ft + 3, 3, EASE.out) * (1 - ramp(f, b.ft + 6, 12, EASE.out));
  const x = t.x - pad;
  const y = t.y - pad;
  const w = t.w + pad * 2;
  const h = t.h + pad * 2;
  const d = [
    `M${x} ${y + arm}V${y}H${x + arm}`,
    `M${x + w - arm} ${y}H${x + w}V${y + arm}`,
    `M${x + w} ${y + h - arm}V${y + h}H${x + w - arm}`,
    `M${x + arm} ${y + h}H${x}V${y + h - arm}`,
  ].join('');
  return (
    <>
      <div style={{ position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h, borderRadius: 8, background: `rgba(${RED_RGB},${(0.075 * flash).toFixed(3)})`, boxShadow: `inset 0 0 0 2px rgba(${RED_RGB},${(0.4 * flash).toFixed(3)})` }} />
      <svg width={DOC_W} height={DOC_H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: op }}>
        <path d={d} fill="none" stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </>
  );
};

const TAG_H = 46;
const Caption: React.FC<{ b: BlockLayout; f: number }> = ({ b, f }) => {
  const s0 = b.ft + 5;
  if (f < s0) return null;
  const rise = ramp(f, s0, 12, EASE.out);
  const pop = ramp(f, s0, 4, EASE.out);
  const full = b.cap[0] + b.cap[1];
  const typed = Math.floor(Math.min(full.length, (f - s0) * 2.2 + 1));
  const typing = typed < full.length;
  const head = full.slice(0, Math.min(typed, b.cap[0].length));
  const rest = typed > b.cap[0].length ? full.slice(b.cap[0].length, typed) : '';
  return (
    <div
      style={{
        position: 'absolute',
        right: DOC_W - (b.box.x + b.box.w) + 40,
        top: b.headY + (HEADING_LH - TAG_H) / 2,
        height: TAG_H,
        borderRadius: 10,
        background: RED,
        boxShadow: `0 10px 22px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.22)`,
        opacity: pop,
        transform: `translateY(${((1 - rise) * 8).toFixed(2)}px)`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        fontFamily: INTER,
        fontSize: 26,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        whiteSpace: 'pre',
        color: '#ffffff',
      }}
    >
      <span>{head}</span>
      <span style={{ color: 'rgba(255,255,255,0.8)' }}>{rest}</span>
      {typing && <span style={{ display: 'inline-block', width: 12, height: 26, marginLeft: 2, background: 'rgba(255,255,255,0.85)' }} />}
    </div>
  );
};

// ───────────── result cards ─────────────
const LABEL: React.CSSProperties = { fontFamily: INTER, fontWeight: 600, fontSize: 26, lineHeight: '34px', color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em' };

const Chip: React.FC<{ text: string; red: boolean; k: number }> = ({ text, red, k }) => (
  <div
    style={{
      height: 54,
      padding: '0 20px',
      borderRadius: 999,
      display: 'flex',
      alignItems: 'center',
      boxSizing: 'border-box',
      background: red ? `rgba(${RED_RGB},0.18)` : 'rgba(255,255,255,0.08)',
      border: red ? `1.5px solid rgba(${RED_RGB},0.75)` : HAIR,
      color: red ? '#FF4050' : '#ffffff',
      fontFamily: INTER,
      fontWeight: 600,
      fontSize: 30,
      letterSpacing: '-0.015em',
      whiteSpace: 'nowrap',
      opacity: k,
      transform: `translateY(${((1 - k) * 8).toFixed(2)}px) scale(${(0.92 + 0.08 * k).toFixed(4)})`,
    }}
  >
    {text}
  </div>
);

const CardBody: React.FC<{ i: number; f: number }> = ({ i, f }) => {
  const landed = CUES[i] + LAND;
  const lag = (n: number) => ramp(f, landed + 3 + n * 2, 7, EASE.out); // secondary action, 3f after contact
  if (i < 2) {
    const chips = i === 0 ? SAYING : TOOLS;
    return (
      <>
        <div style={LABEL}>{i === 0 ? 'They keep saying' : 'Tools they name'}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {chips.map((c, n) => (
            <Chip key={c} text={c} red={i === 0} k={lag(n)} />
          ))}
        </div>
      </>
    );
  }
  return (
    <>
      <div style={LABEL}>What to change</div>
      {CHANGES.map((g, n) => {
        const k = lag(n);
        return (
          <div key={g.title} style={{ position: 'relative', marginTop: n === 0 ? 16 : 20, paddingLeft: 44 }}>
            <div style={{ position: 'absolute', left: 0, top: 19, width: 26 * k, height: 4, borderRadius: 2, background: RED }} />
            <div style={{ fontFamily: 'Zodiak, serif', fontWeight: 700, fontSize: 34, lineHeight: '40px', letterSpacing: '-0.02em', color: '#ffffff' }}>{g.title}</div>
            <div style={{ marginTop: 6, fontFamily: INTER, fontWeight: 500, fontSize: 26, lineHeight: 1.4, color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.01em', textWrap: 'pretty' } as React.CSSProperties}>{g.why}</div>
          </div>
        );
      })}
    </>
  );
};

// ───────────── the shot ─────────────
/** `cards`: how many result cards come out (3 by default). The film's draft 6 passes 2 and shows the changes on the
 *  student's own resume in the next shot (ResumeRewrite) instead of as a third card. */
export const PostingScan: React.FC<{ f: number; dur: number; cards?: number }> = ({ f, dur, cards = 3 }) => {
  // part 1
  const ly = scanY(f);
  const lineOn = ramp(f, SCAN0 - 4, 5, EASE.out) * (1 - ramp(f, SCAN1, 8, EASE.exit));
  const collapse = ramp(f, COLLAPSE0, COLLAPSE_LEN, EASE.swift);
  const bodyOp = 1 - ramp(f, FADE0, 7, EASE.out);
  const push = 1 + 0.035 * ramp(f, 0, COLLAPSE0, EASE.swift) * (1 - collapse);
  const docH = DOC_H + (HEAD_H - DOC_H) * collapse;
  const docPress = pressAt(-1, f);

  // part 2 glaze, once, after the last card lands (13f sweep, as in the original)
  const g0 = CUES[cards - 1] + FLY + 2;
  const glazeX = interpolate(f, [g0, g0 + 13], [-400, 1500], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.35, 1) });
  const glazeVis = interpolate(f, [g0, g0 + 3, g0 + 10, g0 + 13], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const titleLit = (li: number) => frameAtY(TITLE_Y + TITLE_LH * (li + 1));

  return (
    <>
      {/* ── the posting ── */}
      <div
        style={{
          position: 'absolute',
          left: DOC_X,
          top: DOC_Y,
          width: DOC_W,
          height: DOC_H,
          transform: `translateY(${docPress.toFixed(3)}px) scale(${push.toFixed(5)})`,
          transformOrigin: '50% 30%',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: DOC_W,
            height: docH,
            borderRadius: 20,
            overflow: 'hidden',
            background: CARD_BG,
            border: HAIR,
            boxSizing: 'border-box',
            boxShadow: softShadow(30, { color: '#000000', strength: 1.1 }),
          }}
        >
          {TITLE.map((t, li) => (
            <div
              key={li}
              style={{ position: 'absolute', left: PAD, top: TITLE_Y + TITLE_LH * li, fontFamily: 'Zodiak, serif', fontWeight: 700, fontSize: 46, lineHeight: `${TITLE_LH}px`, letterSpacing: '-0.025em', color: '#ffffff', whiteSpace: 'nowrap' }}
            >
              <LitText text={t} base={WHITE} f={f} at={titleLit(li)} />
            </div>
          ))}
          <div style={{ position: 'absolute', left: PAD, top: COMPANY_Y, fontFamily: INTER, fontWeight: 600, fontSize: 28, lineHeight: `${COMPANY_LH}px`, color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.01em' }}>
            {COMPANY}
          </div>

          <div style={{ position: 'absolute', inset: 0, opacity: bodyOp }}>
            {LAYOUT.blocks.map((b) => (
              <React.Fragment key={b.key}>
                <div style={{ position: 'absolute', left: PAD, top: b.headY, fontFamily: INTER, fontWeight: 600, fontSize: 24, lineHeight: `${HEADING_LH}px`, color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.005em' }}>
                  {b.head}
                </div>
                {b.lines.map((l, li) => (
                  <React.Fragment key={li}>
                    {l.bullet && <div style={{ position: 'absolute', left: PAD + 2, top: l.y + LINE_LH / 2 - 3, width: 6, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.35)' }} />}
                    <div style={{ position: 'absolute', left: PAD + BULLET_IN, top: l.y, fontFamily: INTER, fontWeight: 500, fontSize: 26, lineHeight: `${LINE_LH}px`, color: 'rgba(255,255,255,0.78)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                      <LitText text={l.text} base={BODY} f={f} at={frameAtY(l.y + LINE_LH)} />
                    </div>
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* read wash: 140px of fading red behind the line, a dot grid, then the 3px core */}
          {lineOn > 0.01 && (
            <>
              <div style={{ position: 'absolute', left: 0, width: DOC_W, top: ly - 140, height: 140, opacity: lineOn, background: `linear-gradient(180deg, rgba(${RED_RGB},0) 0%, rgba(${RED_RGB},0.05) 60%, rgba(${RED_RGB},0.13) 100%)` }} />
              <div
                style={{
                  position: 'absolute', left: 0, width: DOC_W, top: ly - 90, height: 90, opacity: lineOn * 0.8,
                  backgroundImage: `radial-gradient(circle, rgba(${RED_RGB},0.55) 1.3px, transparent 1.9px)`, backgroundSize: '18px 18px',
                  WebkitMaskImage: 'linear-gradient(180deg, transparent, #000)', maskImage: 'linear-gradient(180deg, transparent, #000)',
                }}
              />
              <div style={{ position: 'absolute', left: 0, width: DOC_W, top: ly - 1.5, height: 3, opacity: lineOn, background: RED, boxShadow: `0 0 10px rgba(${RED_RGB},0.6), 0 0 28px rgba(${RED_RGB},0.35)` }} />
            </>
          )}
        </div>

        {/* cursors riding the line on both sides */}
        {lineOn > 0.01 && (
          <div style={{ opacity: lineOn }}>
            <svg width={22} height={26} viewBox="0 0 22 26" style={{ position: 'absolute', left: -30, top: ly - 13 }}>
              <path d="M2 2 L20 13 L2 24 Z" fill={RED} />
            </svg>
            <svg width={22} height={26} viewBox="0 0 22 26" style={{ position: 'absolute', left: DOC_W + 8, top: ly - 13 }}>
              <path d="M20 2 L2 13 L20 24 Z" fill={RED} />
            </svg>
          </div>
        )}

        {/* brackets and captions, unclipped so the brackets can start outside the card */}
        <div style={{ position: 'absolute', inset: 0, opacity: bodyOp }}>
          {LAYOUT.blocks.map((b) => <Bracket key={b.key} b={b} f={f} />)}
          {LAYOUT.blocks.map((b) => <Caption key={b.key} b={b} f={f} />)}
        </div>
      </div>

      {/* ── the results, flying up into the stack (clipped to the screen band) ── */}
      <div style={{ position: 'absolute', left: 0, top: BAND.y, width: 1080, height: BAND.h, overflow: 'hidden', pointerEvents: 'none', WebkitMaskImage: BAND_MASK, maskImage: BAND_MASK }}>
        {CARD_YS.map((cy, i) => {
          if (i >= cards) return null;
          const t = flyT(i, f);
          if (t <= 0) return null;
          const settled = f >= CUES[i] + FLY;
          const press = settled ? pressAt(i, f) : 0;
          const dy = flyY(i, f) + press;
          const rot = TILTS[i] * (1 - t);
          const scale = 1.06 - 0.06 * t;
          const elev = settled ? 3 - press * 0.3 : 3 + 53 * Math.min(1, Math.max(0, 1 - t));
          const vy = settled ? 0 : velocity((x) => flyY(i, x), f);
          const card = (
            <div
              style={{
                position: 'absolute',
                left: DOC_X,
                top: cy - BAND.y,
                width: DOC_W,
                height: CARD_HS[i] || undefined,
                transform: `translateY(${dy.toFixed(3)}px) rotate(${rot.toFixed(4)}deg) scale(${scale.toFixed(5)})`,
                transformOrigin: 'center center',
                borderRadius: 16,
                boxShadow: softShadow(elev, { color: '#000000', strength: 1.15 }),
                opacity: ramp(f, CUES[i], 5, EASE.out),
              }}
            >
              <div style={{ position: CARD_HS[i] ? 'absolute' : 'relative', inset: 0, borderRadius: 16, overflow: 'hidden', background: CARD_BG, border: HAIR, boxSizing: 'border-box', padding: '28px 36px' }}>
                <CardBody i={i} f={f} />
                {glazeVis > 0 && (
                  <div
                    style={{
                      position: 'absolute', top: -200, height: (CARD_HS[i] || 640) + 400, width: 300,
                      left: glazeX - DOC_X - (cy - CARD_YS[0]) * 0.25,
                      transform: 'rotate(14deg)', opacity: glazeVis * 0.1, mixBlendMode: 'screen',
                      background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.9) 45%, rgba(255,255,255,0.9) 55%, rgba(255,255,255,0))',
                    }}
                  />
                )}
              </div>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
            </div>
          );
          return Math.abs(vy) > 1 ? (
            <SpeedBlur key={i} vx={0} vy={vy} amount={0.22} max={14}>
              {card}
            </SpeedBlur>
          ) : (
            <React.Fragment key={i}>{card}</React.Fragment>
          );
        })}
      </div>
    </>
  );
};
