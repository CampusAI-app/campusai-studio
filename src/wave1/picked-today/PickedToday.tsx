/**
 * CampusAI, "What it picked for you today" (wave 1, 2026-10-22). 9:16, 30 fps, about 22 s, music and sound, no voice.
 * Brief, facts and shot list: Content/video-studio/films/picked-today/.
 *
 * One sentence: every morning CampusAI picks what's worth your attention, and each pick takes you somewhere real.
 * The carrier is the kit's RedDot (CampusAI as a small red dot; there is no cursor, the dot is the software). It
 * wakes in the Ask CampusAI sparkle, hops to three of the daily brief's picks, and after each landing the pick opens
 * where it really opens on the demo (capture/w1-picked-today.cjs): the Evercore job and the Finance Association event
 * (Worth a look) and the Evercore Coffee Chat the student is registered for (Your week) each open their detail pop-up
 * in place over the dashboard (the product's own sheet, rising). Then the dot goes home and becomes the dot on the
 * "i" of the logo, which is a red sparkle. Round 2 (2026-10-23): the third pick was the moved assignment, which opened
 * My Calendar without the item on it; the frame now fills down to the Reels safe zone.
 *
 * One camera for every layer (`camAt`): the dashboard under the dot and each pop-up over it are captures of the same
 * 1440 x 900 page, so a pop-up can fade in exactly in register. Column framings are cw 530 (row titles about 31 px),
 * the pop-ups cw 670 to 680 (titles about 43 px).
 *
 * Music: Mixkit "House Vibez", 122.00 BPM, t0 7.938 s, T 0.4918 s (refit 2026-10-22, residual 14 ms). The film
 * starts at music beat -11, so the track's lift (music beat 16) lands as the dot launches for the third pick.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { brand, glow, useBrandFonts, RedDot, LogoOpen, clampCam, rectOnCanvas, toCanvas, EASE_CAMERA } from "../../kit";
import type { PageCam, Rect } from "../../kit";
import { PageCrop } from "../../kit/pass/chat";

const B_ = brand("campusai");
export const PICKED_FPS = 30;
export const PICKED_SIZE = { width: 1080, height: 1920 };
const PAGE = { w: 1440, h: 900 };
const VIEW: Rect = { x: 0, y: 200, w: 1080, h: 1430 }; // full bleed down to the Reels safe zone (290 px); edges feathered (FEATHER)
const RADIUS = 34; // PageView's own radius, matched by the overlays (its corners sit in the feather)
const FEATHER = `linear-gradient(to bottom, transparent ${VIEW.y}px, #000 ${VIEW.y + 24}px, #000 ${VIEW.y + VIEW.h - 60}px, transparent ${VIEW.y + VIEW.h}px)`;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SNAP = Easing.bezier(0.22, 1, 0.36, 1);
const DROP = Easing.bezier(0.55, 0, 0.75, 0.2);
const ramp = (f: number, a: number, b: number, e = SNAP) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });

// ---------- beat grid ----------
const MUSIC_T0 = 7.938;
const MUSIC_T = 0.4918;
const START_BEAT = -11.5;
const MUSIC_TRIM = Math.floor((MUSIC_T0 + START_BEAT * MUSIC_T) * PICKED_FPS);
const OFFSET_S = MUSIC_T0 + START_BEAT * MUSIC_T - MUSIC_TRIM / PICKED_FPS;
const B = (n: number) => Math.round((OFFSET_S + n * MUSIC_T) * PICKED_FPS);

// beats (film beats; music beat = film beat - 11.5)
const APPEAR = 0.5; // the dot wakes in the Ask CampusAI sparkle (the hook, frame 8)
const L1 = 4.5; // lands on the Evercore job (launches at about 1.45 s)
const O1 = 6; // the job opens
const C1 = 11; // and closes
const L2 = 15; // lands on the Finance Association event
const O2 = 16.5;
const C2 = 21.5;
const L3 = 26; // lands on the Evercore Coffee Chat in Your week
const O3 = 27.5; // it opens on the music's lift (music beat 16)
const C3 = 32.5;
const LH = 36.5; // home, back in the Ask CampusAI sparkle
const END = 37.5; // the page recedes
const FLY = 39.5; // the dot lands as the logo's sparkle
const DONE = 44; // a 2.2 s logo hold
export const PICKED_FRAMES = B(DONE);
const HOP = 24;

// ---------- real material (capture/w1-picked-today.cjs -> public/w1/picked-today, recaptured 2026-10-23) ----------
const src = (n: string) => staticFile(`w1/picked-today/${n}`);
const DASH = src("dashboard.jpg");
const JOB = src("job.jpg");
const EVENT = src("event.jpg");
const COFFEE = src("coffee.jpg");
// measured boxes, CSS px (dashboard.json, job.json, event.json)
const ASK_MARK: Rect = { x: 265, y: 448.8, w: 36, h: 36 };
// RedDot stands a dot on a rect's top edge; this rect's top edge is the mark's centre, so the dot rests IN the sparkle
const ASK_DOT: Rect = { ...ASK_MARK, y: ASK_MARK.y + ASK_MARK.h / 2 + 9 };
const JOB_ROW: Rect = { x: 856, y: 220.7, w: 275, h: 56.3 };
const EVENT_ROW: Rect = { x: 856, y: 289.9, w: 511, h: 36.8 };
const COFFEE_ROW: Rect = { x: 289, y: 309.8, w: 219, h: 36.8 }; // Your week: the event the student is registered for
const PANEL: Rect = { x: 360, y: 128, w: 720, h: 648 }; // the detail pop-up (all three picks share it)
const PANEL_R = 24;
// the sidebar's own colour behind the Maryland mark, sampled per capture (never in frame, patched anyway)
const MARK = { dash: "rgb(33, 21, 21)", modal: "rgb(14, 10, 9)" };
const MARK_RECT: Rect = { x: 116, y: 10, w: 40, h: 36 };

// ---------- the one camera ----------
// Pushed in until a column just fits (Your week from the Ask mark at x 265, Worth a look 853 to 1363). The page height
// in view starts at the brief's top (y 25) and ends past Ask CampusAI (y 693), so the product fills to the safe zone.
const A: PageCam = { cx: 530, cy: 376, cw: 530 }; // Your week, the brief's header, Ask CampusAI (x 265 to 795)
const R: PageCam = { cx: 1108, cy: 362, cw: 510 }; // Worth a look (x 853 to 1363)
const J: PageCam = { cx: 719, cy: 450, cw: 680 }; // the pop-up edge to edge; at this view's shape that is the page's full height
const J2: PageCam = { cx: 719, cy: 446, cw: 670 }; // a slow push (the title starts at x 385, so no tighter)

type Seg = { a: number; b: number; from: PageCam; to: PageCam; bump?: number; ease?: (t: number) => number };
const SEGS: Seg[] = [
  { a: B(L1) - HOP - 6, b: B(L1) + 8, from: A, to: R, bump: 110 }, // swoop with hop 1
  { a: B(O1), b: B(O1) + 22, from: R, to: J },
  { a: B(O1) + 40, b: B(C1), from: J, to: J2, ease: Easing.bezier(0.3, 0, 0.6, 1) },
  { a: B(C1) + 12, b: B(C1) + 34, from: J2, to: R },
  { a: B(O2), b: B(O2) + 22, from: R, to: J },
  { a: B(O2) + 40, b: B(C2), from: J, to: J2, ease: Easing.bezier(0.3, 0, 0.6, 1) },
  { a: B(C2) + 12, b: B(C2) + 34, from: J2, to: R },
  { a: B(L3) - HOP - 6, b: B(L3) + 8, from: R, to: A, bump: 110 }, // swoop with hop 3
  { a: B(O3), b: B(O3) + 22, from: A, to: J },
  { a: B(O3) + 40, b: B(C3), from: J, to: J2, ease: Easing.bezier(0.3, 0, 0.6, 1) },
  { a: B(C3) + 12, b: B(C3) + 34, from: J2, to: A },
];
const camAt = (f: number): PageCam => {
  let cam = A;
  for (const s of SEGS) {
    if (f < s.a) break;
    if (f >= s.b) { cam = s.to; continue; }
    const k = interpolate(f, [s.a, s.b], [0, 1], { ...clamp, easing: s.ease ?? EASE_CAMERA });
    const lin = (f - s.a) / (s.b - s.a);
    cam = { cx: s.from.cx + (s.to.cx - s.from.cx) * k, cy: s.from.cy + (s.to.cy - s.from.cy) * k,
      cw: s.from.cw + (s.to.cw - s.from.cw) * k + (s.bump ?? 0) * Math.sin(Math.PI * lin) };
    break;
  }
  return clampCam(cam, PAGE, VIEW);
};
// RedDot takes camera keys; one key per frame reproduces camAt exactly (keys land on whole frames).
const CAM_KEYS = Array.from({ length: PICKED_FRAMES + 1 }, (_, t) => ({ t, cam: camAt(t) }));

// ---------- overlays, in register with the dashboard under them ----------
const Frame: React.FC<{ children: React.ReactNode; opacity?: number }> = ({ children, opacity = 1 }) => (
  <div style={{ position: "absolute", left: VIEW.x, top: VIEW.y, width: VIEW.w, height: VIEW.h, overflow: "hidden", borderRadius: RADIUS, opacity }}>
    {children}
  </div>
);
/** The whole page image at the camera, in the Frame's own coordinates. */
const PageImg: React.FC<{ src: string; cam: PageCam; style?: React.CSSProperties }> = ({ src, cam, style }) => {
  const o = toCanvas(cam, VIEW, 0, 0);
  const s = VIEW.w / cam.cw;
  return <Img src={src} style={{ position: "absolute", left: o.x - VIEW.x, top: o.y - VIEW.y, width: PAGE.w * s, height: PAGE.h * s, maxWidth: "none", ...style }} />;
};
const Patch: React.FC<{ cam: PageCam; color: string; rect?: Rect }> = ({ cam, color, rect = MARK_RECT }) => {
  const r = rectOnCanvas(cam, VIEW, rect);
  return <div style={{ position: "absolute", left: r.x - VIEW.x, top: r.y - VIEW.y, width: r.w, height: r.h, background: color }} />;
};
const roundedHole = (r: Rect, rad: number) => {
  const { x, y, w, h } = r;
  return `M${x + rad} ${y} H${x + w - rad} A${rad} ${rad} 0 0 1 ${x + w} ${y + rad} V${y + h - rad} A${rad} ${rad} 0 0 1 ${x + w - rad} ${y + h} H${x + rad} A${rad} ${rad} 0 0 1 ${x} ${y + h - rad} V${y + rad} A${rad} ${rad} 0 0 1 ${x + rad} ${y} Z`;
};

/**
 * The detail pop-up opening in place, the way the product opens it: the dashboard dims behind it (the capture's own
 * backdrop and its strip of today's other picks fade in), and the sheet rises from below. Closing reverses it.
 * Moves: sheet-rise ("a sheet slides up from below over a dimming backdrop") and its mirror, sheet-dismiss.
 */
const DetailSheet: React.FC<{ src: string; open: number; close: number; row: Rect }> = ({ src: img, open, close, row }) => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const bgIn = ramp(f, open + 2, open + 16);
  const bgOut = ramp(f, close + 4, close + 16);
  const bg = bgIn * (1 - bgOut);
  if (bg <= 0.001) return null;
  const rise = ramp(f, open + 16, open + 36);
  const drop = ramp(f, close, close + 8, DROP);
  const gone = ramp(f, close, close + 5, Easing.linear);
  const s = VIEW.w / cam.cw;
  const pr = rectOnCanvas(cam, VIEW, PANEL);
  const local = { ...pr, x: pr.x - VIEW.x, y: pr.y - VIEW.y };
  const dy = ((1 - rise) * 120 + drop * 140) * s;
  const W = VIEW.w;
  const H = VIEW.h;
  const hole = `path(evenodd, "M0 0 H${W} V${H} H0 Z ${roundedHole(local, PANEL_R * s)}")`;
  return (
    <Frame>
      {/* the backdrop's dim, under the panel too, so nothing bright shows while the sheet is still rising */}
      <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${0.5 * bg})` }} />
      <div style={{ position: "absolute", inset: 0, opacity: bg, clipPath: hole }}>
        <PageImg src={img} cam={cam} />
        {/* the row the dot is standing on is lifted 4 page px under it (RedDot); lift it here too, so the
            backdrop fades in exactly in register instead of ghosting the row's text */}
        <PageCrop src={img} page={PAGE} from={row} to={{ ...rectOnCanvas(cam, VIEW, row), x: rectOnCanvas(cam, VIEW, row).x - VIEW.x, y: rectOnCanvas(cam, VIEW, row).y - VIEW.y - 4 * s }}
          style={{ borderRadius: 8 * s }} />
        <Patch cam={cam} color={MARK.modal} />
      </div>
      <PageCrop src={img} page={PAGE} from={PANEL} to={{ ...local, y: local.y + dy }}
        style={{ borderRadius: PANEL_R * s, opacity: Math.min(1, rise * 2.2) * (1 - gone),
          boxShadow: `0 ${-10 * s}px ${50 * s}px rgba(0,0,0,${0.45 * (1 - rise)})` }} />
    </Frame>
  );
};

// ---------- the ending: the dot leaves the page and becomes the dot on the logo's "i" ----------
const LOGO_W = 600;
const LOGO_RATIO = 223 / 53;
const LOGO_C = { x: 540, y: 960 };
const LOGO_K = LOGO_W / 223;
const LOGO_BOX = { x: LOGO_C.x - LOGO_W / 2, y: LOGO_C.y - LOGO_W / LOGO_RATIO / 2 };
// the sparkle in the logo's own viewBox: x 211.35 to 223, y 0 to 11.65 (campusai-logo-white.svg)
const SPARK = { x: LOGO_BOX.x + 217.18 * LOGO_K, y: LOGO_BOX.y + 5.82 * LOGO_K, size: 11.65 * LOGO_K };
const SPARK_CLIP = "polygon(94.4% 0, 100% 0, 100% 23.5%, 94.4% 23.5%)";
const WORD_CLIP = "polygon(0 0, 94.4% 0, 94.4% 23.5%, 100% 23.5%, 100% 100%, 0 100%)";
const DOT_SIZE = 18; // page px, as RedDot draws it

const homeDot = (f: number, fps: number) => {
  const cam = camAt(f);
  const p = toCanvas(cam, VIEW, ASK_DOT.x + ASK_DOT.w / 2, ASK_DOT.y - DOT_SIZE / 2);
  const d = DOT_SIZE * p.s;
  const settled = f - B(LH);
  const breathe = settled >= 0 ? 1 + 0.06 * Math.sin((settled / fps) * Math.PI * 1.2) * Math.min(1, settled / 20) : 1;
  // RedDot anchors the dot at its bottom: centre = p.y + d/2 - d*breathe/2
  return { x: p.x, y: p.y + d / 2 - (d * breathe) / 2, size: d * breathe };
};

const Ending: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fly0 = B(FLY) - 26;
  const land = B(FLY);
  if (f < B(END)) return null;
  const from = homeDot(Math.min(f, fly0), fps);
  const k = interpolate(f, [fly0, land], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.35, 1) });
  const arc = Math.max(80, Math.hypot(SPARK.x - from.x, SPARK.y - from.y) * 0.3);
  const x = from.x + (SPARK.x - from.x) * k;
  const y = from.y + (SPARK.y - from.y) * k - 4 * arc * k * (1 - k);
  const mid = Math.sin(Math.PI * k);
  const morph = ramp(f, land - 2, land + 10);
  const squash = f >= land ? spring({ frame: f - land, fps, config: { damping: 11, stiffness: 260, mass: 0.6 }, durationInFrames: 9 }) : 1;
  const size = from.size + (SPARK.size - from.size) * k;
  const sx = (1 - 0.06 * mid) * (f >= land ? 1.2 - 0.2 * squash : 1);
  const sy = (1 + 0.08 * mid) * (f >= land ? 0.8 + 0.2 * squash : 1);
  const word = ramp(f, land - 8, land + 12);
  const drift = interpolate(f, [land, PICKED_FRAMES], [0, 0.012], clamp);
  const sparkIn = spring({ frame: f - land + 1, fps, config: { damping: 13, stiffness: 160 } });
  const logoStyle: React.CSSProperties = { position: "absolute", left: LOGO_BOX.x, top: LOGO_BOX.y, width: LOGO_W, height: LOGO_W / LOGO_RATIO };
  return (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${(1 + drift).toFixed(4)})`, transformOrigin: `${SPARK.x}px ${SPARK.y}px` }}>
        <Img src={staticFile(B_.logo!.onDark)} style={{ ...logoStyle, clipPath: WORD_CLIP, opacity: word,
          filter: `blur(${((1 - word) * 12).toFixed(2)}px) drop-shadow(0 0 ${(36 * word).toFixed(1)}px ${glow(B_, 0.4 * word)})` }} />
        {f >= land - 2 ? (
          <div style={{ position: "absolute", left: SPARK.x, top: SPARK.y, width: 0, height: 0, transform: `scale(${(0.55 + 0.45 * sparkIn).toFixed(4)})` }}>
            <Img src={staticFile(B_.logo!.onDark)} style={{ ...logoStyle, left: LOGO_BOX.x - SPARK.x, top: LOGO_BOX.y - SPARK.y, clipPath: SPARK_CLIP, opacity: morph,
              filter: `drop-shadow(0 0 ${(14 * morph).toFixed(1)}px ${glow(B_, 0.7)})` }} />
          </div>
        ) : null}
      </div>
      {morph < 1 ? (
        <div style={{ position: "absolute", left: x - (size * sx) / 2, top: y - (size * sy) / 2, width: size * sx, height: size * sy, borderRadius: "50%",
          background: B_.color.accent, opacity: 1 - morph,
          boxShadow: `0 0 ${size * 0.9}px ${glow(B_, 0.75)}, 0 0 ${size * 2.4}px ${glow(B_, 0.35)}, inset 0 ${-size * 0.18}px ${size * 0.3}px rgba(0,0,0,.25)` }} />
      ) : null}
    </>
  );
};

// ---------- sound: one soft sound per real action ----------
const a = (n: string) => src(`audio/${n}`);
const CUES: { at: number; file: string; v: number; name: string }[] = [
  { at: B(APPEAR), file: "ui-message-pop.mp3", v: 0.45, name: "dot appears" },
  { at: B(L1), file: "ui-select-modern.mp3", v: 0.55, name: "lands on the job" },
  { at: B(O1) + 16, file: "transition-soft.mp3", v: 0.32, name: "job opens" },
  { at: B(C1), file: "sweep-short.mp3", v: 0.18, name: "job closes" },
  { at: B(L2), file: "ui-select-modern.mp3", v: 0.55, name: "lands on the event" },
  { at: B(O2) + 16, file: "transition-soft.mp3", v: 0.32, name: "event opens" },
  { at: B(C2), file: "sweep-short.mp3", v: 0.18, name: "event closes" },
  { at: B(L3), file: "ui-select-modern.mp3", v: 0.55, name: "lands on the coffee chat" },
  { at: B(O3) + 16, file: "transition-soft.mp3", v: 0.32, name: "coffee chat opens" },
  { at: B(C3), file: "sweep-short.mp3", v: 0.18, name: "coffee chat closes" },
  { at: B(LH), file: "ui-select-modern.mp3", v: 0.4, name: "home" },
  { at: B(FLY), file: "sparkle-touch.mp3", v: 0.5, name: "the logo's sparkle" },
];

export const PickedToday: React.FC = () => {
  useBrandFonts(B_);
  const f = useCurrentFrame();
  const enterK = ramp(f, 0, 12);
  const recede = ramp(f, B(END), B(END) + 30, Easing.bezier(0.4, 0, 0.2, 1));
  return (
    <AbsoluteFill style={{ background: B_.color.bgDeep, backgroundImage: B_.color.gradient }}>
      <div style={{ position: "absolute", inset: 0, opacity: enterK * (1 - recede), WebkitMaskImage: FEATHER, maskImage: FEATHER,
        transform: `translateY(${((1 - enterK) * 70).toFixed(2)}px)` }}>
        <RedDot
          brand={B_}
          page={{ src: DASH, size: PAGE }}
          view={VIEW}
          cams={CAM_KEYS}
          start={{ rect: ASK_DOT, ax: 0.5, appear: B(APPEAR) }}
          stops={[
            { rect: JOB_ROW, ax: 0.5, at: B(L1) },
            { rect: EVENT_ROW, ax: 0.62, at: B(L2) }, // over "Night", clear of the job row above
            { rect: COFFEE_ROW, ax: 0.45, at: B(L3) },
          ]}
          home={{ rect: ASK_DOT, ax: 0.5, at: B(LH) }}
          hop={HOP}
          size={DOT_SIZE}
          markColor={MARK.dash}
        />
        <DetailSheet src={JOB} open={B(O1)} close={B(C1)} row={JOB_ROW} />
        <DetailSheet src={EVENT} open={B(O2)} close={B(C2)} row={EVENT_ROW} />
        <DetailSheet src={COFFEE} open={B(O3)} close={B(C3)} row={COFFEE_ROW} />
      </div>
      <LogoOpen brand={B_} at={2} x={540} y={140} width={420} settle={{ at: 40, x: 540, y: 132, width: 300 }} leaveAt={B(END)} />
      <Ending />

      <Audio src={a("house-vibez.mp3")} trimBefore={MUSIC_TRIM}
        volume={(fr) => 0.7 * Math.min(1, fr / 8) * Math.min(1, Math.max(0, (PICKED_FRAMES - fr) / 24))} />
      {CUES.map((c) => (
        <Sequence key={c.name} from={c.at} name={c.name}>
          <Audio src={a(c.file)} volume={() => c.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
