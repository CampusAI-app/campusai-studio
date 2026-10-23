/**
 * Inside a match (wave 1, round 2, 2026-10-23). One sentence: a match isn't a score, it's the reasons, and you
 * can see every one. 9:16, 22.9 s, composition `InsideMatch-9x16`.
 *
 * The carrier is Deloitte's "Audit and Assurance Intern, Summer 2027": the card pressed in the real Job Match
 * list, the detail that opens in the right-hand panel and comes apart into its sections (kit ExplodedPage), the
 * job "Tailor resume" opens, and that view's own red "View suggestion" button, which glides to centre and becomes
 * the logo (kit NameToLogo, fromElement).
 *
 * Captures: capture/w1-inside-match.cjs -> public/w1/inside-match/{list,detail,tailor}.jpg, the desktop web layout
 * (1440 x 1400 CSS, DPR 3). The vertical frame shows about 692 CSS px of it at 1040 / 666.3 = 1.56 frame px per
 * CSS px: the list column for the press, then one camera pan right to the detail panel, which fills the frame.
 * The Maryland mark (CSS x 116 to 156) is never inside that window.
 *
 * Music: "Close Up" (Michael Ramir C., Mixkit), 105 BPM, entered at its bar-7 downbeat (16.116 s) so film beat
 * n sits at n x 17.143 frames. Every press, the explode, the snap back and the logo land on a beat.
 * Shot list with the numbers: Content/video-studio/films/inside-match/shotlist.md.
 */
import React from "react";
import { AbsoluteFill, Composition, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import {
  BlurLines,
  EASE,
  EASE_CAMERA,
  ExplodedPage,
  LogoOpen,
  NameToLogo,
  PointerAt,
  ZODIAK,
  brand,
  glow,
  useBrandFonts,
  type ExplodeLayer,
  type Rect,
} from "../../kit";

const B = brand("campusai");
export const W = 1080;
export const H = 1920;
export const FPS = 30;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Film beat n in frames (105 BPM). */
const BEAT = (60 / 105) * FPS;
const b = (n: number) => Math.round(n * BEAT);

// ---------- the page geometry (CSS px of the 1440 x 1400 capture) ----------
const PAGE = { w: 1440, h: 1400 };
const pass = (n: string) => staticFile(`w1/inside-match/${n}`);
// The detail panel (x 720.7 to 1387) spans 1040 px of frame.
const S = 1040 / 666.3;
const TOP = 85; // frame y of the page's top edge
const LIST_CX = 540; // list column framing: page x 194 to 886 (the mark at 116 to 156 stays out)
const DETAIL_CX = 1054; // detail panel framing: page x 708 to 1400
const viewAt = (cx: number): Rect => ({ x: W / 2 - cx * S, y: TOP, w: PAGE.w * S, h: PAGE.h * S });
const VIEW = viewAt(DETAIL_CX);

// Measured on the captures (detail.json, list.json, tailor.json and the tailor pixels).
const DELOITTE_TITLE = { x: 500, y: 261 };
const TAILOR_BTN = { x: 1004, y: 342 };
const LAYERS: ExplodeLayer[] = [
  // the header: logo, title, the match chips (Strong match, Big 4, Internship, Closes today), locations, actions
  { rect: { x: 735, y: 226, w: 638, h: 142 }, depth: 420, radius: 10 },
  // Why this fits you (the fit card's first section)
  { rect: { x: 741.7, y: 377, w: 624.3, h: 179 }, depth: 300, radius: 13 },
  // About this role
  { rect: { x: 742, y: 556, w: 623, h: 200 }, depth: 180, radius: 4 },
  // What they're looking for
  { rect: { x: 742, y: 756, w: 623, h: 116 }, depth: 60, radius: 4 },
];
// Tailor resume: laid out at 1.7 (round 3: the block fills the frame width; the suggestion title, 17 CSS px, sets at 29 px), the camera on "What to change for this role" (page y 598 to 790), then a pan
// right to its red View suggestion button (x 1166 to 1296, y 695 to 722).
const ST = 1.7;
const T_TOP = 1000 - 693 * ST; // the section's middle at frame y 1000
const T_CX0 = 582.5; // shows page x 265 to 900: the heading at 273 to the title's end at 892, 14 px margins
const T_CX1 = 1100; // shows page x 782 to 1418: the button at frame x 653 to 874
const SUGGESTION_BAND = { top: 598, bottom: 790 };
const VIEW_SUGGESTION: Rect = { x: 1166, y: 695, w: 130, h: 27.5 };

// ---------- timing (frames) ----------
const LOGO_OUT = 36;
const LINE_AT = 42;
const PRESS_1 = b(4); // 69, the Deloitte card
const PAN_AT = PRESS_1 + 7; // the detail has changed; the camera follows it to the panel
const PAN_END = PAN_AT + 34;
const EXPLODE_FROM = b(7); // 120, ExplodedPage takes over, flat
const APART = b(8) - EXPLODE_FROM; // 17, the camera starts to turn
const TOGETHER = b(18) - EXPLODE_FROM; // 189, the layers drop back
const LAND = EXPLODE_FROM + TOGETHER + 3 * 4 + 14; // 335
const PRESS_2 = b(22); // 377, Tailor resume
const SWAP = PRESS_2 + 3;
const SPOT_AT = SWAP + 18;
const T_PAN = b(29.2); // 501
const LIFT = b(31.25); // 536, the button lifts
const LOGO_AT = LIFT + 30;
const SHEEN_AT = b(35); // 600
const SHEEN_FRAMES = 50;
export const INSIDE_MATCH_FRAMES = 686;
const MUSIC_TRIM = Math.round(16.116 * FPS); // bar 7 downbeat of Close Up

// ---------- pieces ----------
const ground: React.CSSProperties = {
  position: "absolute", overflow: "hidden", background: B.color.bg,
  boxShadow: `0 0 0 1.5px rgba(255,255,255,.08), 0 40px 120px rgba(0,0,0,.6), 0 0 140px ${glow(B, 0.13)}`,
};

/** The page laid out at the film's scale, dressed like ExplodedPage's ground so the hand-off is invisible. */
const FlatPage: React.FC<{ src: string; cx: number; opacity?: number }> = ({ src, cx, opacity = 1 }) => {
  const v = viewAt(cx);
  return (
    <div style={{ ...ground, left: v.x, top: v.y, width: v.w, height: v.h, borderRadius: 22 * S, opacity }}>
      <Img src={src} style={{ position: "absolute", left: 0, top: 0, width: v.w, height: v.h, maxWidth: "none" }} />
    </div>
  );
};

/** ExplodedPage's own flat mapping once its camera is back face-on (it keeps a slow 2.5% push to landAt + 60). */
const explodedScale = (local: number) => S * (1 + 0.025 * Math.min(1, Math.max(0, local / (TOGETHER + 26 + 60))));
const onExploded = (x: number, y: number, s: number) => ({ x: W / 2 + (x - DETAIL_CX) * s, y: TOP + (PAGE.h / 2) * S + (y - PAGE.h / 2) * s });

const ink = { ink: B.color.ink, soft: B.color.inkSoft, accent: B.color.accent, surface: B.color.surface, line: B.color.inkSoft };

const CUES: { at: number; src: string; v: number }[] = [
  { at: PRESS_1, src: "ui-select-click.mp3", v: 0.45 },
  { at: PAN_AT, src: "swoosh-slow.mp3", v: 0.18 },
  { at: EXPLODE_FROM + APART, src: "air-woosh-deep.mp3", v: 0.32 },
  { at: LAND - 8, src: "paper-slide.mp3", v: 0.3 },
  { at: PRESS_2, src: "ui-select-click.mp3", v: 0.45 },
  { at: SWAP + 14, src: "ui-tone-quick.mp3", v: 0.22 },
  { at: SHEEN_AT, src: "shimmer-sparkle-sweep.mp3", v: 0.28 },
];

export const InsideMatch: React.FC = () => {
  useBrandFonts(B);
  const f = useCurrentFrame();

  // the list, then one pan right to the detail panel once the press has changed it
  const pan = interpolate(f, [PAN_AT, PAN_END], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const cx = LIST_CX + (DETAIL_CX - LIST_CX) * pan;
  const swapped = interpolate(f, [PRESS_1 + 2, PRESS_1 + 6], [0, 1], clamp);

  // pointer 1: already moving toward the Deloitte card on frame one, presses on beat 4
  const p1k = interpolate(f, [-12, 50], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const p1to = { x: W / 2 + (DELOITTE_TITLE.x - LIST_CX) * S, y: TOP + DELOITTE_TITLE.y * S };
  const p1 = { x: 900 + (p1to.x - 900) * p1k, y: 1720 + (p1to.y - 1720) * p1k };
  const p1o = 1 - interpolate(f, [PRESS_1 + 6, PRESS_1 + 14], [0, 1], clamp);

  // pointer 2: rides ExplodedPage's flat mapping to Tailor resume, presses on beat 22
  const p2to = onExploded(TAILOR_BTN.x, TAILOR_BTN.y, explodedScale(f - EXPLODE_FROM));
  const p2k = interpolate(f, [LAND - 4, PRESS_2 - 8], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const p2 = { x: 860 + (p2to.x - 860) * p2k, y: 1500 + (p2to.y - 1500) * p2k };
  const p2o = interpolate(f, [LAND - 4, LAND + 6], [0, 1], clamp) * (1 - interpolate(f, [PRESS_2 + 3, PRESS_2 + 9], [0, 1], clamp));

  // Tailor resume pushes up over the detail, the camera rests on What to change, pans to the button, which lifts
  const explodedGone = f >= SWAP + 18;
  const tIn = interpolate(f, [SWAP, SWAP + 18], [0, 1], { ...clamp, easing: EASE });
  const spot = interpolate(f, [SPOT_AT, SPOT_AT + 16], [0, 1], { ...clamp, easing: EASE });
  const tPan = interpolate(f, [T_PAN, T_PAN + 30], [0, 1], { ...clamp, easing: EASE_CAMERA });
  const tcx = T_CX0 + (T_CX1 - T_CX0) * tPan;
  const tx = W / 2 - tcx * ST;
  const ty = T_TOP + (H - T_TOP + 80) * (1 - tIn);
  const tDim = interpolate(f, [LIFT, LIFT + 18], [0, 1], { ...clamp, easing: EASE });
  const tGone = interpolate(f, [LIFT + 10, LIFT + 40], [0, 1], { ...clamp, easing: EASE });
  const btnFrom: Rect = { x: W / 2 + (VIEW_SUGGESTION.x - T_CX1) * ST, y: T_TOP + VIEW_SUGGESTION.y * ST, w: VIEW_SUGGESTION.w * ST, h: VIEW_SUGGESTION.h * ST };
  const band = { top: T_TOP + SUGGESTION_BAND.top * ST, bottom: T_TOP + SUGGESTION_BAND.bottom * ST };

  return (
    <AbsoluteFill style={{ background: B.color.bgDeep, backgroundImage: B.color.gradient, overflow: "hidden" }}>
      {/* the list column, the press changes the detail, the camera pans to it */}
      {f < EXPLODE_FROM && (
        <>
          <FlatPage src={pass("list.jpg")} cx={cx} />
          {swapped > 0 && <FlatPage src={pass("detail.jpg")} cx={cx} opacity={swapped} />}
        </>
      )}

      {/* the detail comes apart into its sections, holds, snaps back flat */}
      {f >= EXPLODE_FROM && !explodedGone && (
        <Sequence from={EXPLODE_FROM} layout="none">
          <ExplodedPage
            src={pass("detail.jpg")}
            page={PAGE}
            layers={LAYERS}
            brand={B}
            view={VIEW}
            focus={{ x: 470, y: 1110, width: 740 }}
            turn={{ rx: 32, ry: 16 }}
            timing={{ apart: APART, stagger: 6, together: TOGETHER }}
          />
        </Sequence>
      )}

      {/* Tailor resume for this job */}
      {f >= SWAP && tGone < 1 && (
        <div style={{ ...ground, left: tx, top: ty, width: PAGE.w * ST, height: PAGE.h * ST, borderRadius: 22 * ST, opacity: 1 - tGone }}>
          <Img src={pass("tailor.jpg")} style={{ position: "absolute", left: 0, top: 0, width: PAGE.w * ST, height: PAGE.h * ST, maxWidth: "none",
            filter: tDim ? `brightness(${1 - tDim * 0.72}) saturate(${1 - tDim * 0.6}) blur(${tDim * 3}px)` : undefined }} />
        </div>
      )}
      {/* the light falls on What to change for this role: the page above and below it steps back */}
      {f >= SWAP && spot > 0 && tGone < 1 && (
        <>
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: band.top, opacity: spot * (1 - tGone),
            background: `linear-gradient(to bottom, rgba(5,3,4,.82), rgba(5,3,4,.72) 75%, rgba(5,3,4,0))` }} />
          <div style={{ position: "absolute", left: 0, top: band.bottom, width: W, height: H - band.bottom, opacity: spot * (1 - tGone),
            background: `linear-gradient(to top, rgba(5,3,4,.82), rgba(5,3,4,.6) 70%, rgba(5,3,4,0))` }} />
        </>
      )}

      {/* the logo on frame one, then the question above the list */}
      <LogoOpen brand={B} at={-4} x={W / 2} y={44} width={260} leaveAt={LOGO_OUT} />
      <div style={{ position: "absolute", left: 0, top: 44, width: W, transform: "translateY(-50%)", paddingLeft: 52 * 0.24, boxSizing: "border-box" }}>
        <BlurLines lines={[{ text: "Strong match. But why?" }]} at={LINE_AT} size={52} ink={ink} face={ZODIAK} outAt={EXPLODE_FROM + APART} />
      </div>

      {/* the presses */}
      {f < PRESS_1 + 16 && <PointerAt x={p1.x} y={p1.y} since={f >= PRESS_1 ? (f - PRESS_1) / FPS : null} accent={B.color.accent} opacity={p1o} />}
      {p2o > 0 && <PointerAt x={p2.x} y={p2.y} since={f >= PRESS_2 ? (f - PRESS_2) / FPS : null} accent={B.color.accent} opacity={p2o} />}

      {/* the red View suggestion button lifts off the Tailor view, glides to centre and becomes the logo */}
      <NameToLogo brand={B} variant="fromElement" x={W / 2} y={940} width={520} logoAt={LOGO_AT} sheenAt={SHEEN_AT} sheenFrames={SHEEN_FRAMES}
        element={{ src: pass("tailor.jpg"), page: PAGE, rect: VIEW_SUGGESTION, from: btnFrom, radius: 7, liftAt: LIFT }} />

      {/* sound */}
      <Audio src={pass("audio/close-up.mp3")} trimBefore={MUSIC_TRIM}
        volume={(fr) => 0.7 * Math.min(1, fr / 6) * Math.min(1, Math.max(0, (INSIDE_MATCH_FRAMES - fr) / 30))} />
      {CUES.map((c, i) => (
        <Sequence key={i} from={c.at} layout="none">
          <Audio src={pass(`audio/${c.src}`)} volume={() => c.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const InsideMatchRoot: React.FC = () => (
  <Composition id="InsideMatch-9x16" component={InsideMatch} durationInFrames={INSIDE_MATCH_FRAMES} fps={FPS} width={W} height={H} />
);
