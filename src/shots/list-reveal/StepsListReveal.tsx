// CampusAI adaptation (2026-10-21), from the shot shelf (Content/video-studio/shots/, video-shotcraft, Apache-2.0):
// ui-entrance/list-reveal. "in 4 steps", right after the hook.
//
// Kept from the shot: the two decoupled motions. (1) Each row finds its place on its own window:
// scale 0.82 -> 1, rise 44 -> 0, focus blur 8px -> 0, through the soft back bezier(0.3, 1.18, 0.5, 1)
// (~1.5% overshoot), opacity min(1, lin * 2.2), transform origin 30% 50%; the icon follows 2f late
// (scale 0.72 -> 1) and the side text 4f late (opacity + 14px slide, EASE.out). Rows are 10f apart on
// 24f windows, so two or three are moving at once. (2) The whole list drifts up linearly the entire
// shot at the original ~0.8 px/f, centred on its rest position, and does not settle back (as in the card).
//
// Changed: CampusAI rows (red step tile, "Step N" in Inter over the step in Zodiak) instead of the
// graphite sidebar, no row panels, no highlighted Home bar or sheen, no backdrop (the film owns it), and
// the title sits above the list and leads it instead of arriving halfway. Stagger 10f, window 24f and
// the 2f / 4f follow lags are kept in frames (the card's "readable" rhythm, not tied to length; with 4
// rows instead of 6 the list still settles by f60). The title reveal (18f) is scaled to dur / 120.
import React from 'react';
import { EASE, bezier, ramp } from '../_fixtures/Polish';
import { INTER } from '../../kit/parts';

export const STEPS_LIST_REVEAL_DURATION = 89;

const ORIG_DUR = 120;
const ROW_START = 6; // first row; the title leads from f0
const STAGGER = 10;
const EACH = 24;
const RISE = 44;
const BLUR = 8;
const DRIFT_PER_FRAME = 96 / (ORIG_DUR - 1); // the shot's 96px across 119 frames

const TILE = 96;
const ROW_GAP = 44;
const CENTER_Y = 1000;

const softBack = bezier(0.3, 1.18, 0.5, 1);

export type StepRow = { icon: React.ReactNode; step: string; label: string };

export const StepsListReveal: React.FC<{ f: number; dur: number; title: string; rows: StepRow[] }> = ({
  f,
  dur,
  title,
  rows,
}) => {
  const k = dur / ORIG_DUR;
  const drift = DRIFT_PER_FRAME * (dur - 1);
  const dy = drift / 2 - (drift * f) / Math.max(1, dur - 1);

  const titleIn = ramp(f, 0, 18 * k, EASE.out);
  const titleRise = (1 - ramp(f, 0, 18 * k, EASE.snappy)) * 16;

  const titleH = 48;
  const titleGap = 48;
  const blockH = titleH + titleGap + rows.length * TILE + Math.max(0, rows.length - 1) * ROW_GAP;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: CENTER_Y - blockH / 2,
        transform: `translateX(-50%) translateY(${dy.toFixed(3)}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          height: titleH,
          marginBottom: titleGap,
          fontFamily: INTER,
          fontWeight: 600,
          fontSize: 40,
          lineHeight: `${titleH}px`,
          letterSpacing: '-0.01em',
          color: 'rgba(255,255,255,0.6)',
          whiteSpace: 'nowrap',
          opacity: titleIn,
          transform: `translateY(${titleRise.toFixed(2)}px)`,
        }}
      >
        {title}
      </div>

      {rows.map((row, i) => {
        const t0 = ROW_START + i * STAGGER;
        const lin = ramp(f, t0, EACH, EASE.linear);
        const p = softBack(lin);
        const pIcon = softBack(ramp(f, t0 + 2, EACH, EASE.linear));
        const pSide = ramp(f, t0 + 4, EACH - 4, EASE.out);
        const blur = (1 - EASE.out(lin)) * BLUR;
        return (
          <div
            key={i}
            style={{
              height: TILE,
              marginTop: i === 0 ? 0 : ROW_GAP,
              display: 'flex',
              alignItems: 'center',
              gap: 34,
              opacity: Math.min(1, lin * 2.2),
              filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
              transform: `translateY(${((1 - p) * RISE).toFixed(2)}px) scale(${(0.82 + 0.18 * p).toFixed(4)})`,
              transformOrigin: '30% 50%',
            }}
          >
            <div
              style={{
                flex: 'none',
                transform: `scale(${(0.72 + 0.28 * pIcon).toFixed(4)})`,
                opacity: Math.min(1, Math.max(0, pIcon) * 2),
              }}
            >
              {row.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                style={{
                  fontFamily: INTER,
                  fontWeight: 600,
                  fontSize: 28,
                  lineHeight: '34px',
                  color: 'rgba(255,255,255,0.55)',
                  opacity: pSide,
                  transform: `translateX(${((1 - pSide) * 14).toFixed(2)}px)`,
                  whiteSpace: 'nowrap',
                }}
              >
                {row.step}
              </div>
              <div
                style={{
                  fontFamily: 'Zodiak, serif',
                  fontWeight: 700,
                  fontSize: 56,
                  lineHeight: '60px',
                  letterSpacing: '-0.02em',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
