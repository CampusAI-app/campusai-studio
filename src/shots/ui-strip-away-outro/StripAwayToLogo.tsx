// CampusAI adaptation (2026-10-21), from the shot shelf (Content/video-studio/shots/, video-shotcraft, Apache-2.0):
// outro/ui-strip-away-outro (UiStripAwayOutro). The editor UI is replaced by the real Job Match screen, the Publish
// button by the real "Apply on company site" button, the Shotcraft lockup by the CampusAI logo.
//
// Kept: the six strip layers in the shot's order (each starts 4f after the last, 14f long, ease-in quad, fade +
// directional drift + 0 to 7px blur), the 3f stagger with alternating drift inside the card layer, the field going dark
// as the background layer goes, the press pulse (spring 12 / 220), the 18f inOut cubic slide to centre with x1.5 growth
// and speed blur, the halo and glow that build with the dark, the button fading out with a 6% release, and the logo
// spring (14 / 90, 0.86 to 1, blur 9 to 0).
//
// Our page is one image, so each layer is a copy of `page` clipped to one SEMANTICALLY whole block of the real screen
// (the card's rule: never slice by pixel region). Blocks are measured on the run frame in screen CSS px and placed on
// the canvas from the button rect (the button is the Apply box, so its rect gives the page's scale and offset under
// whatever camera the film is using).
//
//   slot         (shot)          our blocks                                       drift
//   +4           sidebar         left nav, bottom chat bar                        (-140,0) / (0,90)
//   +8           props panel     "About this role"                                (90,20)
//   +12, 3f each canvas cards    the four job cards                               (+-70, 50+10i)
//   +16          toolbar ends    page top left / right (bar, header, filters)     (-80,-60) / (80,-60)
//   +20          canvas bg       "Why this fits you" (the dark comes in here)     (0,40)
//   +24          toolbar middle  job title, the other buttons, Apply's own slot   (0,-50)
import React from "react";
import { Easing, Img, interpolate, spring } from "remotion";
import { EASE, mix, ramp } from "../_fixtures/Polish";

export const STRIP_AWAY_TO_LOGO_DURATION = 148;

type Rect = { x: number; y: number; w: number; h: number };

const RED = "232,41,59"; // #E8293B
const BASE = 148; // frame constants are authored at 148f and scaled by dur / 148
const CLICK = 24; // the shot clicked at 34 after a cursor walk; we have no cursor, so the walk is cut to a short hold
const STRIP = { sidebar: CLICK + 4, leftPanel: CLICK + 8, canvasCards: CLICK + 12, topbarEnds: CLICK + 16, canvasBg: CLICK + 20, toolbarShell: CLICK + 24 };
const STRIP_DUR = 14;
const BTN_MOVE = 18;
const BTN_FADE = CLICK + 52;
const LOGO_IN = CLICK + 62;
const TO = { x: 540, y: 930 }; // button and logo centre
const BTN_GROW = 1.5;
const BTN_MAX_W = 640; // never wider than this once grown
const LOGO_W = 600;

// The Apply button on the run frame (screen CSS px) and the blocks around it, measured on howto/run/f01674.jpg
// (the re-recorded run: page header, filter bar, then the job list and the detail panel, split at x 712).
const AP = { x: 741.671875, y: 345.6875, w: 189.453125, h: 35.5 };
const INF = 1e5;
type Block = { x0: number; y0: number; x1: number; y1: number; at: number; dx: number; dy: number };
const card = (i: number) => ({ at: STRIP.canvasCards + i * 3, dx: i % 2 ? 70 : -70, dy: 50 + i * 10 });
const BLOCKS: Block[] = [
  { x0: -INF, y0: -INF, x1: 216, y1: INF, at: STRIP.sidebar, dx: -140, dy: 0 }, // left nav
  { x0: 480, y0: 800, x1: INF, y1: INF, at: STRIP.sidebar, dx: 0, dy: 90 }, // chat bar + footer (and what sits behind it)
  { x0: 712, y0: 600, x1: INF, y1: 800, at: STRIP.leftPanel, dx: 90, dy: 20 }, // About this role
  { x0: 216, y0: 207, x1: 712, y1: 377, ...card(0) }, // Deloitte
  { x0: 216, y0: 377, x1: 712, y1: 556, ...card(1) }, // Capital One
  { x0: 216, y0: 556, x1: 712, y1: 761, ...card(2) }, // Goldman Sachs
  { x0: 216, y0: 761, x1: 480, y1: INF, ...card(3) }, // Uline (left of the chat bar)
  { x0: 480, y0: 761, x1: 712, y1: 800, ...card(3) }, // Uline (above the chat bar)
  { x0: 216, y0: -INF, x1: 712, y1: 207, at: STRIP.topbarEnds, dx: -80, dy: -60 }, // breadcrumb, Jobs for you, search + Roles
  { x0: 712, y0: -INF, x1: INF, y1: 207, at: STRIP.topbarEnds, dx: 80, dy: -60 }, // notifications, Aiming for, other filters
  { x0: 712, y0: 392, x1: INF, y1: 600, at: STRIP.canvasBg, dx: 0, dy: 40 }, // Why this fits you
  { x0: 712, y0: 207, x1: INF, y1: 338, at: STRIP.toolbarShell, dx: 0, dy: -50 }, // job title block
  { x0: 935, y0: 338, x1: INF, y1: 392, at: STRIP.toolbarShell, dx: 0, dy: -50 }, // Tailor, cover letter, Saved
  { x0: 712, y0: 338, x1: 935, y1: 392, at: STRIP.toolbarShell, dx: 0, dy: -50 }, // Apply's own slot
];

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// A layer's strip state: ease-in (accelerating exit) + drift + growing blur, the "evaporate" read
const strip = (f: number, start: number, dur: number, dx: number, dy: number) => {
  const p = interpolate(f, [start, start + dur], [0, 1], { ...clampOpts, easing: Easing.in(Easing.quad) });
  return { p, style: { opacity: 1 - p, transform: `translate(${(dx * p).toFixed(2)}px, ${(dy * p).toFixed(2)}px)`, filter: p > 0.001 ? `blur(${(p * 7).toFixed(2)}px)` : undefined } as React.CSSProperties };
};

// Rounded-rect outline as polygon points (for the "outside the window" clip)
const roundRectPts = (w: number, h: number, r: number) => {
  const pts: string[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (i / 6) * (Math.PI / 2);
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)}px ${(cy + r * Math.sin(a)).toFixed(1)}px`);
    }
  };
  corner(r, r, Math.PI);
  corner(w - r, r, -Math.PI / 2);
  corner(w - r, h - r, 0);
  corner(r, h - r, Math.PI / 2);
  return pts;
};

export const StripAwayToLogo: React.FC<{
  f: number; dur: number; view: Rect; page: React.ReactNode; button: { rect: Rect; node: React.ReactNode }; logoSrc: string;
}> = ({ f: frame, dur, view, page, button, logoSrc }) => {
  const T = dur / BASE;
  const at = (x: number) => x * T; // authored frame -> real frame
  const { rect } = button;

  // page scale and offset (screen CSS px -> view-local px), read off the button
  const s = rect.w / AP.w;
  const ox = rect.x - view.x - AP.x * s;
  const oy = rect.y - view.y - AP.y * s;
  const clip = (b: Block) => {
    const L = Math.max(0, Math.round(ox + b.x0 * s)), R = Math.min(view.w, Math.round(ox + b.x1 * s));
    const Tp = Math.max(0, Math.round(oy + b.y0 * s)), Bt = Math.min(view.h, Math.round(oy + b.y1 * s));
    return R <= L || Bt <= Tp ? null : `inset(${Tp}px ${view.w - R}px ${view.h - Bt}px ${L}px)`;
  };

  // the field goes dark as the background layer leaves
  const bgDark = interpolate(frame, [at(STRIP.canvasBg), at(STRIP.canvasBg + STRIP_DUR + 6)], [0, 1], { ...clampOpts, easing: Easing.inOut(Easing.quad) });

  // button: press pulse, slide to centre, grow, fade with a small release
  // no press here: the film presses Apply at the end of ApplyBounce, the shot just before this one
  const pressScale = 1;
  const move = (x: number) => interpolate(x, [at(STRIP.toolbarShell), at(STRIP.toolbarShell + BTN_MOVE)], [0, 1], { ...clampOpts, easing: Easing.inOut(Easing.cubic) });
  const c = move(frame);
  const from = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
  const bx = mix(from.x, TO.x, c);
  const by = mix(from.y, TO.y, c);
  const grow = Math.min(BTN_GROW, BTN_MAX_W / rect.w);
  const btnScale = 1 + (grow - 1) * c;
  const speed = Math.hypot(TO.x - from.x, TO.y - from.y) * Math.abs(c - move(frame - 1));
  const btnBlur = Math.min(3, speed * 0.04);
  const btnOp = 1 - ramp(frame, at(BTN_FADE), at(12), EASE.exit);
  const release = ramp(frame, at(BTN_FADE), at(12), EASE.out);
  const rad = rect.h * 0.17;

  // logo: focus-pull spring
  const logoP = frame >= at(LOGO_IN) ? spring({ frame: frame - at(LOGO_IN), fps: 30, config: { damping: 14, stiffness: 90 } }) : 0;

  const outside = `polygon(evenodd, -400px -400px, ${view.w + 400}px -400px, ${view.w + 400}px ${view.h + 400}px, -400px ${view.h + 400}px, -400px -400px, ${roundRectPts(view.w, view.h, 34).join(", ")}, 0px 34px)`;
  const pageBox: React.CSSProperties = { position: "absolute", left: view.x, top: view.y, width: view.w, height: view.h };

  return (
    <>
      {/* the dark field's own light: a faint red glow at centre, up with the dark */}
      <div style={{
        position: "absolute", left: TO.x - 560, top: TO.y - 520, width: 1120, height: 1040, opacity: bgDark,
        background: `radial-gradient(ellipse 50% 45% at 50% 50%, rgba(${RED},0.10) 0%, rgba(${RED},0.03) 50%, rgba(${RED},0) 75%)`,
      }} />

      {/* the window's own frame (ring, drop shadow, glow) lives outside its box: keep it until the field goes dark */}
      {bgDark < 1 && (
        <div style={{ ...pageBox, opacity: 1 - bgDark }}>
          <div style={{ position: "absolute", inset: 0, clipPath: outside }}>{page}</div>
        </div>
      )}

      {/* the page, block by block */}
      {BLOCKS.map((b, i) => {
        const cp = clip(b);
        if (!cp) return null;
        const { p, style } = strip(frame, at(b.at), at(STRIP_DUR), b.dx, b.dy);
        if (p >= 1) return null;
        return (
          <div key={i} style={{ ...pageBox, ...style }}>
            <div style={{ position: "absolute", inset: 0, clipPath: cp }}>{page}</div>
          </div>
        );
      })}

      {/* the button: last survivor, always on top */}
      {btnOp > 0.001 && (
        <div style={{ position: "absolute", left: bx, top: by, width: 0, height: 0, opacity: btnOp, filter: btnBlur > 0.2 ? `blur(${btnBlur.toFixed(2)}px)` : undefined }}>
          <div style={{
            position: "absolute", left: -rect.w * 1.75 * btnScale, top: -rect.h * 4 * btnScale, width: rect.w * 3.5 * btnScale, height: rect.h * 8 * btnScale, borderRadius: "50%",
            background: `radial-gradient(ellipse at center, rgba(${RED},0.38) 0%, rgba(${RED},0.10) 40%, rgba(${RED},0) 70%)`,
            opacity: c * bgDark,
          }} />
          <div style={{
            position: "absolute", left: -rect.w / 2, top: -rect.h / 2, width: rect.w, height: rect.h, borderRadius: rad, overflow: "hidden",
            transform: `scale(${(btnScale * pressScale * (1 + 0.06 * release)).toFixed(4)})`, transformOrigin: "50% 50%",
            boxShadow: c > 0 ? `0 0 ${((30 + 40 * c) / btnScale).toFixed(1)}px rgba(${RED},${((0.18 + 0.4 * bgDark) * c).toFixed(3)})` : undefined,
          }}>
            {button.node}
          </div>
        </div>
      )}

      {/* the logo takes over */}
      {logoP > 0 && (
        <div style={{
          position: "absolute", left: TO.x, top: TO.y, width: LOGO_W, transform: `translate(-50%, -50%) scale(${(0.86 + 0.14 * logoP).toFixed(4)})`,
          opacity: Math.min(1, logoP * 1.4), filter: logoP < 0.995 ? `blur(${((1 - logoP) * 9).toFixed(2)}px)` : undefined,
        }}>
          <Img src={logoSrc} style={{ display: "block", width: LOGO_W, height: "auto" }} />
        </div>
      )}
    </>
  );
};
