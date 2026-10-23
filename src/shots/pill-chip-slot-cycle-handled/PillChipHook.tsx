// CampusAI adaptation (2026-10-21), from the shot shelf (Content/video-studio/shots/, video-shotcraft, Apache-2.0):
// typography/pill-chip-slot-cycle-handled. The film's opening hook.
//
// Kept from the shot: the slot roll (`pos` summed from per-switch windows, each 0.12 of the shot on
// E.inOutCubic, 0.22 apart), the column translating by -pos * rowHeight inside an overflow-hidden pill,
// the pill width lerped frame by frame between the measured widths of the current and next word, the
// ghost neighbours above and below at the shot's -38 / +58 offsets (scaled to our pill height) with the
// half-speed parallax `(pos - near) * H * 0.5` and opacity `0.13 * (0.4 + settle * 0.6)`.
//
// Changed: CampusAI type and colour (Zodiak, dark product ground, brand red), a vertical layout (the
// prefix sits above the pill instead of "Your ... Handled" either side of it), no emoji slot, and a
// lock beat on the last word (red fill, red glow, Zodiak italic, ghosts fade) followed by a settled hold.
// The shot measured widths once with offsetWidth, which its own card warns reads the fallback font if
// the webfont is late; here the measure is held behind delayRender until Zodiak is in document.fonts.
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { continueRender, delayRender } from 'remotion';
import { E, lerp, seg } from '../_fixtures/Motion';

export const PILL_CHIP_HOOK_DURATION = 118;

const ZODIAK = 'Zodiak, serif';
const RED = '#E8293B';

// Canvas geometry (1080x1920).
const CX = 540;
const PREFIX_SIZE = 104;
const PREFIX_LINE = 110;
const CHIP_H = 140; // the shot's 48 design px
const K = CHIP_H / 48; // design px -> canvas px, for the shot's offsets
const CHIP_FONT = 70;
const CHIP_PAD = 56; // per side, the shot's +74 minus the emoji slot
const GAP = 170; // prefix to pill; the top ghost lives in here
const CENTER_Y = 900;

// Timing as fractions of the shot (t = f / (dur - 1)), like the original.
const SWITCH_W = 0.12; // the shot's switch window
const SWITCH_STEP = 0.22; // the shot's spacing between switch starts (0.25 / 0.47 / 0.69)
const FIRST_SWITCH = 0.33; // the shot's 0.25, moved later: one switch fewer, plus the lock beat
const LOCK_W = 0.1; // ~12f at 118f; leaves ~27f of settled hold

const wordStyle = (italic: boolean): React.CSSProperties => ({
  fontFamily: ZODIAK,
  fontWeight: italic ? 400 : 700, // the italic face is registered at 400; asking 700 would fake-bold it
  fontStyle: italic ? 'italic' : 'normal',
  fontSize: CHIP_FONT,
  letterSpacing: '-0.02em',
  whiteSpace: 'nowrap',
  fontSynthesis: 'none',
});

const fontsReady = () => {
  try {
    const faces: FontFace[] = [];
    (document.fonts as unknown as { forEach: (cb: (f: FontFace) => void) => void }).forEach((f) => faces.push(f));
    const has = (style: string) =>
      faces.some((f) => f.family.replace(/["']/g, '') === 'Zodiak' && f.style === style && f.status === 'loaded');
    return has('normal') && has('italic');
  } catch {
    return true;
  }
};

export const PillChipHook: React.FC<{ f: number; dur: number; prefix: string[]; words: string[] }> = ({
  f,
  dur,
  prefix,
  words,
}) => {
  const n = Math.max(1, words.length);
  const last = n - 1;
  const t = Math.min(1, Math.max(0, f / Math.max(1, dur - 1)));

  // ---- widths: every word in bold, plus the last word in italic (its locked face)
  const fallback = [...words.map((w) => w.length * CHIP_FONT * 0.5), (words[last] ?? '').length * CHIP_FONT * 0.46];
  const measRef = useRef<HTMLDivElement>(null);
  const [textW, setTextW] = useState<number[]>(fallback);
  const [measured, setMeasured] = useState(false);
  const read = useCallback((): number[] | null => {
    const el = measRef.current;
    if (!el) return null;
    return Array.from(el.children).map((c, i) => (c as HTMLElement).offsetWidth || fallback[i] || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words.join('|')]);

  // Re-read after every render (cheap), so a word change or a late font never sticks.
  useLayoutEffect(() => {
    const a = read();
    if (a && (a.length !== textW.length || a.some((v, i) => Math.abs(v - textW[i]) > 0.5))) setTextW(a);
  });

  // Hold the first frame until Zodiak is loaded, then measure (4s cap, then measure whatever is there).
  const handleRef = useRef<number | null>(null);
  const release = () => {
    if (handleRef.current !== null) continueRender(handleRef.current);
    handleRef.current = null;
  };
  useEffect(() => {
    handleRef.current = delayRender('PillChipHook: measure words once Zodiak is loaded');
    let alive = true;
    const start = Date.now();
    const tick = () => {
      if (!alive) return;
      if (fontsReady() || Date.now() - start > 4000) {
        requestAnimationFrame(() => {
          if (!alive) return;
          const a = read();
          if (a) setTextW(a);
          setMeasured(true);
        });
      } else setTimeout(tick, 40);
    };
    tick();
    return () => {
      alive = false;
      release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Released only after the measured widths have committed, so frame 0 never shows the fallback.
  useEffect(() => {
    if (measured) release();
  }, [measured]);

  const chipWidths = textW.map((w) => w + CHIP_PAD * 2);

  // ---- slot roll (the shot's core): pos accumulates one inOutCubic window per switch
  let pos = 0;
  for (let i = 0; i < last; i++) {
    const s0 = FIRST_SWITCH + i * SWITCH_STEP;
    pos += seg(t, s0, s0 + SWITCH_W, E.inOutCubic);
  }
  const ci = Math.min(last, Math.floor(pos));
  const frac = pos - ci;
  const rollW = lerp(frac, chipWidths[ci], chipWidths[Math.min(ci + 1, last)]);

  // ---- lock on the last word
  const lockAt = FIRST_SWITCH + Math.max(0, last - 1) * SWITCH_STEP + (last > 0 ? SWITCH_W : 0);
  const L = seg(t, lockAt, lockAt + LOCK_W, E.outCubic);
  const chipW = lerp(L, rollW, chipWidths[n] ?? rollW);
  const pulse = 1 + 0.035 * Math.sin(Math.PI * L);

  // ---- ghosts (the shot's outer ring): half-speed parallax, faintest mid-roll
  const near = Math.round(pos);
  const roll = (pos - near) * CHIP_H * 0.5;
  const settle = 1 - Math.min(1, Math.abs(pos - near) * 3);
  const ghostOpacity = 0.13 * (0.4 + settle * 0.6) * (1 - L);

  // ---- layout
  const prefixH = prefix.length * PREFIX_LINE;
  const top = CENTER_Y - (prefixH + GAP + CHIP_H) / 2;
  const chipTop = top + prefixH + GAP;

  const ghost = (dy: number, text: string): React.ReactNode => (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: chipTop + dy,
        width: 1080,
        textAlign: 'center',
        color: '#fff',
        lineHeight: 1,
        opacity: ghostOpacity,
        transform: `translateY(${(-roll).toFixed(2)}px)`,
        ...wordStyle(false),
      }}
    >
      {text}
    </div>
  );

  return (
    <>
      {/* hidden measure spans, same style as what they measure */}
      <div
        ref={measRef}
        style={{ position: 'absolute', left: 0, top: 0, visibility: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', pointerEvents: 'none' }}
      >
        {words.map((w, i) => (
          <span key={`b${i}`} style={{ ...wordStyle(false), display: 'inline-block' }}>
            {w}
          </span>
        ))}
        <span style={{ ...wordStyle(true), display: 'inline-block' }}>{words[last]}</span>
      </div>

      {/* prefix */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top,
          width: 1080,
          textAlign: 'center',
          color: '#fff',
          fontFamily: ZODIAK,
          fontWeight: 700,
          fontSize: PREFIX_SIZE,
          lineHeight: `${PREFIX_LINE}px`,
          letterSpacing: '-0.03em',
          whiteSpace: 'nowrap',
        }}
      >
        {prefix.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      {/* ghosts outside the pill, the shot's -38 / +58 design px */}
      {ghost(-38 * K, near > 0 ? words[near - 1] : '')}
      {ghost(58 * K, near < last ? words[near + 1] : '')}

      {/* the pill */}
      <div
        style={{
          position: 'absolute',
          left: CX - chipW / 2,
          top: chipTop,
          width: chipW,
          height: CHIP_H,
          borderRadius: 999,
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.1)',
          transform: `scale(${pulse.toFixed(4)})`,
          boxShadow: [
            `inset 0 0 0 1.5px rgba(255,255,255,${(0.08 * (1 - L)).toFixed(3)})`,
            `0 ${8 * K}px ${24 * K}px rgba(0,0,0,0.35)`,
            `0 0 ${80}px rgba(232,41,59,${(0.5 * L).toFixed(3)})`,
            `0 ${18}px ${54}px rgba(232,41,59,${(0.32 * L).toFixed(3)})`,
          ].join(', '),
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: RED, opacity: L }} />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            transform: `translateY(${(-pos * CHIP_H).toFixed(2)}px)`,
          }}
        >
          {words.map((w, i) => (
            <div key={i} style={{ position: 'relative', height: CHIP_H }}>
              {[false, true].map((italic) =>
                italic && i !== last ? null : (
                  <span
                    key={String(italic)}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -52%)',
                      color: '#fff',
                      lineHeight: 1,
                      opacity: i === last ? (italic ? L : 1 - L) : 1,
                      ...wordStyle(italic),
                    }}
                  >
                    {w}
                  </span>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
