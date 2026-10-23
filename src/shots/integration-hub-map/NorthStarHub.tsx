// CampusAI adaptation (2026-10-21) of shelf shot ui-entrance/integration-hub-map (IntegrationHubMap.tsx, video-shotcraft).
// How the film explains the North Star: one goal, three parts of CampusAI it steers.
// Kept (retimed by dur / 150): the double-sided card flipping a full 180deg with a fast flip and a long slow tail
// (Easing.out(cubic), 35f), the 2-frame white flash at the 90deg edge, the continuous pull-back (bezier .55,0,.18,1
// over 96f), the two-beat hook-up (all nodes pop on one frame with the .34,1.5,.64,1 overshoot, then all pipes grow
// together on the next beat, GROW 9f, each pipe normalised by its own length so they arrive together), the glowing
// tube + hot core + growth-head spark, comet pulses (FLOW_SPEED 4.6 px/f, FLOW_PERIOD 74, phase offset 37 per pipe),
// the port ripple, the breathing after everything is connected (sin .16/f).
// Changed: front face = a crop of the real North Star picker, back face = the North Star hub (spark tile, label,
// the student's role chips); nodes are Job Match / Courses / Professors with the product's own lines; rainbow
// tubes are brand red with a lighter red pulse; pulses flow centre -> node (the goal steers the parts), the reverse
// of the original's icon -> hub; no neon rectangles, grain or vignette (the film owns the background).
import React, { useId } from 'react';
import { Easing, Img, interpolate } from 'remotion';
import { INTER, SPARK } from '../../kit/parts';

type Box = { x: number; y: number; w: number; h: number };
export type HubNode = { icon: React.ReactNode; title: string; line: string };

const ORIG_DUR = 150;
const VIEW = { x: 24, y: 430, w: 1032, h: 1150 };
const RED = '#E8293B';
const RED_TEXT = '#FF4050';

// Layout on the 1080x1920 canvas.
const CARD_W = 780; // the hub card's settled width; height follows the front crop's aspect
const HUB_C = { x: 540, y: 760 };
const TILE = 88;
const TILE_Y = 1200; // node tile top
const FLOW_SPEED = 4.6; // px per frame (original)
const FLOW_PERIOD = 74; // px between pulses (original)

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const CAM = Easing.bezier(0.55, 0, 0.18, 1);
const POP = Easing.bezier(0.34, 1.5, 0.64, 1);

// Path walking (straight lines + one quadratic per corner), used for length and the growth-head spark.
const polyline = (path: string): [number, number][] => {
  const tok = path.match(/[MLQ]|-?[\d.]+/g)!;
  const pts: [number, number][] = [];
  let i = 0, cx = 0, cy = 0;
  while (i < tok.length) {
    const c = tok[i++];
    if (c === 'M' || c === 'L') { cx = +tok[i++]; cy = +tok[i++]; pts.push([cx, cy]); continue; }
    if (c === 'Q') {
      const qx = +tok[i++], qy = +tok[i++], x = +tok[i++], y = +tok[i++];
      for (let s = 1; s <= 16; s++) {
        const u = s / 16;
        pts.push([(1 - u) * (1 - u) * cx + 2 * (1 - u) * u * qx + u * u * x, (1 - u) * (1 - u) * cy + 2 * (1 - u) * u * qy + u * u * y]);
      }
      cx = x; cy = y;
    }
  }
  return pts;
};
const pathLen = (pts: [number, number][]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const pointAt = (pts: [number, number][], dist: number): [number, number] => {
  let rest = dist;
  for (let s = 1; s < pts.length; s++) {
    const L = Math.hypot(pts[s][0] - pts[s - 1][0], pts[s][1] - pts[s - 1][1]);
    if (rest <= L) { const k = L ? rest / L : 0; return [pts[s - 1][0] + (pts[s][0] - pts[s - 1][0]) * k, pts[s - 1][1] + (pts[s][1] - pts[s - 1][1]) * k]; }
    rest -= L;
  }
  return pts[pts.length - 1];
};

/** The product icons the film passes as node icons (stroked, white, round caps). */
export const HubIcon: React.FC<{ name: 'briefcase' | 'book' | 'user'; size?: number }> = ({ name, size = 42 }) => {
  const common = { fill: 'none', stroke: '#fff', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'briefcase')
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" {...common} strokeWidth={2.1}>
        <path d="M12 12h.01" /><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><path d="M22 13a18.15 18.15 0 0 1-20 0" />
        <rect x={2} y={6} width={20} height={14} rx={2} />
      </svg>
    );
  if (name === 'book')
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" {...common} strokeWidth={1.4}>
        <path d="M1.5 2h4.5a2.5 2.5 0 012.5 2.5V14a2 2 0 00-2-2H1.5V2z" /><path d="M14.5 2H10a2.5 2.5 0 00-2.5 2.5V14a2 2 0 012-2h5V2z" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" {...common} strokeWidth={1.4}>
      <circle cx={8} cy={4.5} r={2.5} /><path d="M3 14a5 5 0 0110 0" />
    </svg>
  );
};

const shell = (glow: number, w: number, h: number): React.CSSProperties => ({
  width: w,
  height: h,
  borderRadius: 28,
  overflow: 'hidden',
  boxSizing: 'border-box',
  position: 'relative',
  boxShadow: [
    'inset 0 0 0 1px rgba(255,255,255,0.08)',
    '0 40px 90px -24px rgba(0,0,0,0.75)',
    `0 0 ${50 + glow * 90}px rgba(255,214,218,${(0.06 + glow * 0.4).toFixed(3)})`,
    `0 0 ${150 + glow * 120}px rgba(232,41,59,${(0.14 + glow * 0.26).toFixed(3)})`,
  ].join(', '),
});

export const NorthStarHub: React.FC<{
  f: number;
  dur: number;
  front: { src: string; box: Box };
  roles: string[];
  nodes: HubNode[];
}> = ({ f, dur, front, roles, nodes }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const k = dur / ORIG_DUR;
  const T = (x: number) => x * k;

  const W = CARD_W;
  const H = Math.round((CARD_W * front.box.h) / front.box.w);

  // Camera: one continuous pull-back from the front filling VIEW's width to the settled hub card.
  const cam = CAM(Math.min(1, Math.max(0, f / T(96))));
  const z0 = VIEW.w / W;
  const zoom = z0 + (1 - z0) * cam;
  const startC = { x: VIEW.x + VIEW.w / 2, y: VIEW.y + VIEW.h / 2 };
  const cx = startC.x + (HUB_C.x - startC.x) * cam;
  const cy = startC.y + (HUB_C.y - startC.y) * cam;

  // Full 180deg flip, fast then a long slow tail.
  const flipA = T(14), flipB = T(49);
  const rotY = interpolate(f, [flipA, flipB], [0, 180], { ...clamp, easing: Easing.out(Easing.cubic) });
  // 2-frame flash centred on the 90deg edge (out-cubic reaches .5 at t = .2063), same offsets as the original.
  const edge = flipA + 0.2063 * (flipB - flipA);
  const bloom = interpolate(f, [edge - 2.2, edge - 0.2, edge + 1.8, edge + 5.8], [0, 1, 0.25, 0], clamp);

  // Two beats: every node on one frame, every pipe on the next.
  const tIcon = T(52), tPipe = T(62), GROW = T(9);
  const allOn = tPipe + GROW;
  const breathe = f > allOn ? 0.5 + 0.5 * Math.sin((f - allOn) * 0.16) : 0;
  const panelGlow = bloom * 1.1 + breathe * 0.16;
  const mapIn = interpolate(f, [T(34), T(60)], [0, 1], clamp);

  // Node + pipe geometry.
  const n = nodes.length;
  const colW = VIEW.w / n;
  const cardBottom = HUB_C.y + H / 2;
  const yMid = Math.round(cardBottom + (TILE_Y - cardBottom) * 0.48);
  const r = 30;
  const pipes = nodes.map((_, i) => {
    const nx = Math.round(VIEW.x + colW * (i + 0.5));
    const px = Math.round(HUB_C.x + (i - (n - 1) / 2) * 120);
    const dir = Math.sign(nx - px);
    const path =
      dir === 0
        ? `M ${px} ${cardBottom - 6} L ${nx} ${TILE_Y}`
        : `M ${px} ${cardBottom - 6} L ${px} ${yMid - r} Q ${px} ${yMid} ${px + dir * r} ${yMid} L ${nx - dir * r} ${yMid} Q ${nx} ${yMid} ${nx} ${yMid + r} L ${nx} ${TILE_Y}`;
    const pts = polyline(path);
    return { nx, path, pts, len: pathLen(pts) };
  });

  const cardW = W * zoom, cardH = H * zoom;
  const imgScale = W / front.box.w;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Pipes: brand red tube, hot core, growth-head spark, then comet pulses centre -> node. */}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: mapIn }}>
        <defs>
          {/* userSpaceOnUse: a straight vertical pipe has a zero-width bbox, which kills a percentage filter region. */}
          <filter id={`pipeGlow-${uid}`} filterUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920">
            <feGaussianBlur stdDeviation="9" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`soft-${uid}`} filterUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>
        {pipes.map((p, i) => {
          const grow = interpolate(f, [tPipe, tPipe + GROW], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
          if (grow <= 0) return null;
          const dashOn = p.len * grow;
          const pulse = f > allOn ? 0.84 + 0.16 * Math.sin((f - allOn) * 0.16 + i) : 1;
          const flowOffset = -((f - tPipe) * FLOW_SPEED + i * 37);
          const flowIn = interpolate(f, [allOn, allOn + T(8)], [0, 1], clamp);
          const head = pointAt(p.pts, dashOn);
          return (
            <g key={i}>
              <g filter={`url(#pipeGlow-${uid})`}>
                <path d={p.path} fill="none" stroke={RED} strokeWidth={12} strokeLinecap="round"
                  strokeDasharray={`${dashOn} ${p.len + 60}`} opacity={0.9 * pulse} />
              </g>
              <path d={p.path} fill="none" stroke="rgba(255,196,201,0.92)" strokeWidth={3} strokeLinecap="round"
                strokeDasharray={`${dashOn} ${p.len + 60}`} opacity={0.8 * pulse} />
              {grow < 1 && (
                <>
                  <circle cx={head[0]} cy={head[1]} r={16} fill="rgba(255,214,218,0.5)" filter={`url(#soft-${uid})`} />
                  <circle cx={head[0]} cy={head[1]} r={5.5} fill="#ffe6e8" />
                </>
              )}
              {grow >= 1 && flowIn > 0 && (
                <>
                  <path d={p.path} fill="none" stroke="rgba(255,150,160,0.75)" strokeWidth={8} strokeLinecap="round"
                    strokeDasharray={`26 ${FLOW_PERIOD - 26}`} strokeDashoffset={flowOffset}
                    opacity={0.45 * flowIn} filter={`url(#soft-${uid})`} />
                  <path d={p.path} fill="none" stroke="#ffc4c9" strokeWidth={6} strokeLinecap="round"
                    strokeDasharray={`7 ${FLOW_PERIOD - 7}`} strokeDashoffset={flowOffset - 19}
                    opacity={0.95 * flowIn} />
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Nodes: all pop on one frame (one overshoot), glow red once their pipe arrives. */}
      {nodes.map((node, i) => {
        const appear = interpolate(f, [tIcon, tIcon + T(13)], [0, 1], clamp);
        if (appear <= 0) return null;
        const pop = POP(appear);
        const on = interpolate(f, [tPipe + GROW - 2, tPipe + GROW + T(8)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const lit = on * (f > allOn ? 0.82 + 0.18 * breathe : 1);
        const nx = pipes[i].nx;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: nx - colW / 2,
              top: TILE_Y,
              width: colW,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: Math.min(1, appear * 2.2),
              transform: `translateY(${((1 - pop) * 22).toFixed(2)}px) scale(${(0.72 + 0.28 * pop).toFixed(4)})`,
              transformOrigin: '50% 0%',
            }}
          >
            <div
              style={{
                width: TILE,
                height: TILE,
                borderRadius: 24,
                background: 'rgba(255,255,255,0.06)',
                boxShadow: [
                  'inset 0 0 0 1.5px rgba(255,255,255,0.12)',
                  '0 18px 40px -12px rgba(0,0,0,0.7)',
                  `0 0 ${(18 + lit * 40).toFixed(1)}px rgba(232,41,59,${(0.44 * Math.min(1, lit)).toFixed(3)})`,
                ].join(', '),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1a1113',
              }}
            >
              {node.icon}
            </div>
            <div style={{ marginTop: 22, fontFamily: 'Zodiak, serif', fontWeight: 700, fontSize: 44, letterSpacing: '-0.025em', color: '#fff', lineHeight: 1.05, textAlign: 'center' }}>
              {node.title}
            </div>
            <div style={{ marginTop: 12, fontFamily: INTER, fontWeight: 500, fontSize: 28, lineHeight: 1.3, color: 'rgba(255,255,255,0.7)', textAlign: 'center', maxWidth: colW - 36 }}>
              {node.line}
            </div>
          </div>
        );
      })}

      {/* The double-sided card: front = the real picker, back = the North Star hub. */}
      <div style={{ position: 'absolute', inset: 0, perspective: 1500, perspectiveOrigin: `${cx}px ${cy}px` }}>
        <div
          style={{
            position: 'absolute',
            left: cx - cardW / 2,
            top: cy - cardH / 2,
            width: cardW,
            height: cardH,
            transform: `rotateY(${rotY.toFixed(3)}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
            <div style={{ zoom }}>
              <div style={{ ...shell(panelGlow, W, H), background: '#1c1315' }}>
                <Img
                  src={front.src}
                  style={{
                    position: 'absolute',
                    left: -front.box.x * imgScale,
                    top: -front.box.y * imgScale,
                    width: 1440 * imgScale,
                    height: 900 * imgScale,
                    maxWidth: 'none',
                  }}
                />
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <div style={{ zoom }}>
              <div
                style={{
                  ...shell(panelGlow, W, H),
                  background: 'linear-gradient(180deg, #221618 0%, #1a1113 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 24,
                    background: RED,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 14px 40px -10px rgba(232,41,59,0.6), inset 0 1px 0 rgba(255,255,255,0.25)',
                  }}
                >
                  <svg width={40} height={40} viewBox="0 0 24 24"><path d={SPARK} fill="#fff" /></svg>
                </div>
                <div style={{ marginTop: 24, fontFamily: INTER, fontWeight: 500, fontSize: 28, color: 'rgba(255,255,255,0.6)' }}>
                  Your North Star
                </div>
                <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  {roles.map((role) => (
                    <div
                      key={role}
                      style={{
                        fontFamily: INTER,
                        fontWeight: 600,
                        fontSize: 30,
                        color: RED_TEXT,
                        background: 'rgba(232,41,59,0.18)',
                        border: '2px solid rgba(232,41,59,0.6)',
                        borderRadius: 18,
                        padding: '14px 28px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {role}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Overexposure on the card at the edge flash. */}
          <div
            style={{
              position: 'absolute',
              inset: -6 * zoom,
              borderRadius: 32 * zoom,
              background: '#fff',
              opacity: Math.min(0.96, bloom * 1.05),
              filter: `blur(${5 * zoom}px)`,
              transform: rotY > 90 ? 'rotateY(180deg) translateZ(1px)' : 'translateZ(1px)',
              backfaceVisibility: 'hidden',
            }}
          />
        </div>
      </div>

      {/* Port ripple where each pipe arrives at its node (all on the same frame). */}
      {pipes.map((p, i) => {
        const kk = interpolate(f, [tPipe + GROW - 1, tPipe + GROW + T(13)], [0, 1], clamp);
        if (kk <= 0 || kk >= 1) return null;
        const rr = 6 + Easing.out(Easing.cubic)(kk) * 26;
        return (
          <div
            key={`port-${i}`}
            style={{
              position: 'absolute', left: p.nx - rr, top: TILE_Y - rr, width: rr * 2, height: rr * 2, borderRadius: '50%',
              border: '2px solid rgba(255,235,237,0.9)', opacity: (1 - kk) * 0.85, boxShadow: '0 0 12px rgba(255,120,135,0.6)',
            }}
          />
        );
      })}

      {/* Edge flash glare: white core, red wing, soft rose spot, plus the short light streak (only while the flash is up, as in the original). */}
      {bloom > 0.02 && (
        <>
          <div style={{
            position: 'absolute', left: cx - 560, top: cy - 520, width: 1120, height: 1040,
            background: 'radial-gradient(closest-side, rgba(255,255,255,0.98), rgba(255,232,234,0.75) 42%, rgba(232,41,59,0.4) 68%, transparent 88%)',
            filter: 'blur(26px)', opacity: Math.min(1, bloom),
          }} />
          <div style={{
            position: 'absolute', left: cx + 120, top: cy - 640, width: 620, height: 600,
            background: 'radial-gradient(closest-side, rgba(232,41,59,0.85), rgba(180,20,40,0.4) 60%, transparent 85%)',
            filter: 'blur(34px)', opacity: bloom * 0.9,
          }} />
          <div style={{
            position: 'absolute', left: cx - 700, top: cy + 120, width: 560, height: 520,
            background: 'radial-gradient(closest-side, rgba(255,170,180,0.7), rgba(232,41,59,0.3) 60%, transparent 85%)',
            filter: 'blur(30px)', opacity: bloom * 0.85,
          }} />
          {(() => {
            const streak = interpolate(f, [T(20), T(34), T(70), T(92)], [0, 0.9, 0.5, 0], clamp);
            if (streak <= 0.01) return null;
            return (
              <div style={{
                position: 'absolute', left: 0, top: cy + cardH / 2 - 40, width: 420, height: 40, borderRadius: 20,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(232,41,59,0.7), transparent)',
                filter: 'blur(16px)', opacity: streak,
              }} />
            );
          })()}
        </>
      )}
    </div>
  );
};
