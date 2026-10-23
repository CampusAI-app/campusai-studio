/**
 * CampusAI — "ask anything" chat film.
 *
 * Two sources, deliberately:
 *   · Product beats are REAL FOOTAGE of the patched lab demo recorded headless
 *     (CampusAI/build/labs/campusai-chat-video). The typing is the product's own
 *     auto-type, the step trace is its own ThinkingSteps component, and the
 *     answer streams off its real SSE route. Nothing is a re-drawn screenshot.
 *   · Wrapper beats are ported from the Raylight project
 *     "Introducing video--updated" — entrance timings, staggers, easings, camera
 *     ratios and grade values read out of the project, not eyeballed.
 *
 * v2 note. The first cut ran the whole product section as ONE continuous take
 * with a moving camera. That was wrong twice over: the camera had to travel to
 * each moment, and the travel ate the moment (by the time it arrived at the
 * step trace, the trace had already started). It also paid for every second of
 * the take. Now each beat is its OWN shot, framed statically at the thing it is
 * about, cut together with short dissolves. Nothing moves to find its subject.
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { msToFrames, secondsToFrames } from "./lib/timing";
import { BEATS, BEAT_CUT_MS, CHAT_VIDEO_MS, DISSOLVE_MS } from "./lib/chat-timeline";
import { ChatSoundtrack } from "./ChatSoundtrack";

// ── Raylight constants, read from the project ───────────────────────────────
// Canvas is 2.261 world units across a 1920px frame.
const WORLD = 1920 / 2.261; // 849.18 px per world unit
const w = (u: number) => u * WORLD;

const CREAM = "#F7EFE6"; // Raylight text fill
const PLUM = "#1F1216"; // Raylight bubble fill
const PLUM_EDGE = "#402028"; // Raylight bubble stroke
const GRADE = { bloom: 0.85, vignette: 0.53, grain: 0.02 };

export const EASE = {
  outExpo: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.45, 0, 0.55, 1),
};

// ── Measured footage geometry (video pixels, source is 1440x900) ────────────
// Capture is 1440x900, 1:1. Legibility of the step trace is solved by drawing
// those rows large in the demo, not by capturing at higher resolution — both
// higher-res routes were tried and rejected (see capture-chat.mjs).
const DPR = 1;
const VID = { w: 1440 * DPR, h: 900 * DPR };

/** Each entry is the region of the capture that should FILL the frame. */
const SHOT = {
  // One framing per step row, measured off the capture: rows sit at a 51px
  // pitch with centres at y 212.5 / 263.5 / 315 / 366, content spanning
  // x 505-942. Window is 560x315 CSS px, so the 26px row text lands ~89px on
  // screen. The camera holds on each row while it is the live one.
  step1: { x: 445, y: 55, width: 560, height: 315 },
  step2: { x: 445, y: 106, width: 560, height: 315 },
  step3: { x: 445, y: 158, width: 560, height: 315 },
  step4: { x: 445, y: 209, width: 560, height: 315 },
  // The pull-back. Deliberately wider than the answer bubble itself: the text
  // runs the full 627px width, so the opening framing cannot zoom past ~3x
  // without slicing sentences, and a 3.0 -> 2.78 move is too shallow to read as
  // a move at all. Ending wide (2.0) makes it a real 1.5x release and brings the
  // question bubble back into shot as context.
};

/** A few px of blur at a shot's head and tail, so cuts melt rather than snap. */
const soften = (frame: number, total: number, amount = 9) => {
  const ramp = 9;
  const inP = Math.min(1, frame / ramp);
  const outP = Math.min(1, (total - frame) / ramp);
  return (1 - Math.min(inP, outP)) * amount;
};

const frameRect = (
  css: { x: number; y: number; width: number; height: number },
  outW: number,
  outH: number,
  zoom = 1,
) => {
  const r = { x: css.x * DPR, y: css.y * DPR, width: css.width * DPR, height: css.height * DPR };
  const cover = Math.max(outW / VID.w, outH / VID.h);
  const scale = Math.max(cover, Math.min(outW / r.width, outH / r.height)) * zoom;
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  // Centring on a rect near an edge slides the frame off the footage and leaves
  // black bands. Clamp the pan so the video always covers the output.
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return {
    scale,
    tx: clamp(outW / 2 - cx * scale, outW - VID.w * scale, 0),
    ty: clamp(outH / 2 - cy * scale, outH - VID.h * scale, 0),
  };
};

/*
 * <Shot> lived here — footage under a static or two-point camera. Every beat it
 * served is now either drawn (<Composer/>, <AnswerMessage/>) or uses <Walk/>, so
 * it is removed rather than left dead. The only footage left in the film is the
 * step trace, which is the one beat that should stay the real product.
 */

/**
 * Footage under a camera that WALKS a list of framings. Used for the step
 * trace: the note was "zoom in on each one specifically, it goes to one, then
 * it goes to next", which a single static framing on the whole block cannot do.
 * Keys are in seconds from the shot's start.
 */
export const Walk: React.FC<{
  src: string;
  from: number;
  keys: { at: number; rect: keyof typeof SHOT }[];
  durationInFrames: number;
  moveFor?: number;
}> = ({ src, from, keys, durationInFrames, moveFor = 0.42 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const solved = keys.map((k) => ({ at: k.at, ...frameRect(SHOT[k.rect], width, height) }));
  let cam = solved[0];
  for (let i = 1; i < solved.length; i++) {
    const a = solved[i - 1];
    const b = solved[i];
    if (t >= b.at) { cam = b; continue; }
    if (t > b.at - moveFor) {
      const p = interpolate(t, [b.at - moveFor, b.at], [0, 1], {
        easing: EASE.outExpo,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      cam = {
        at: b.at,
        scale: a.scale + (b.scale - a.scale) * p,
        tx: a.tx + (b.tx - a.tx) * p,
        ty: a.ty + (b.ty - a.ty) * p,
      };
    }
    break;
  }

  const blur = soften(frame, durationInFrames);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#08070A" }}>
      <div
        style={{
          position: "absolute",
          width: VID.w,
          height: VID.h,
          transformOrigin: "0 0",
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.scale})`,
        }}
      >
        <OffthreadVideo src={staticFile(src)} startFrom={Math.round(from * fps)} />
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

// `strength` exists because the product beats need a LIGHTER vignette than the
// film's own beats. The demo's red lives in the corners, which is exactly where
// a 0.53 vignette darkens hardest — so on the answer beat, with a big card
// covering the centre, the red got squeezed out of frame entirely and the shot
// came back grey. Half vignette on the product beats keeps the red visible.
// `grain` is switchable because the answer beat cannot have it. With the grain
// layer present, that beat rendered its page gradient as flat grey no matter
// where the gradient was placed (component child, Sequence sibling, or directly
// on the element that holds the message). Dropping the blended grain layer from
// that one beat is what actually restored the colour; every other beat keeps it.
export const Vignette: React.FC<{ warm?: boolean; strength?: number; grain?: boolean }> = ({ warm = true, strength = 1, grain = true }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 46%, rgba(0,0,0,0.78) 100%)",
        opacity: GRADE.vignette * strength,
      }}
    />
    {warm ? (
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, rgba(255,64,80,${0.05 * GRADE.bloom}) 0%, rgba(0,0,0,0) 62%)`,
          mixBlendMode: "screen",
        }}
      />
    ) : null}
    {grain ? <Grain /> : null}
  </AbsoluteFill>
);

/** Film grain at 0.02. Static SVG noise, cheap and it kills digital flatness. */
const Grain: React.FC = () => (
  <AbsoluteFill
    style={{
      opacity: GRADE.grain * 9,
      mixBlendMode: "overlay",
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
    }}
  />
);

/**
 * PRODUCT palette, read out of the demo's own `globals.css` dark block rather
 * than eyeballed. Jacob: "you see that the coloring is on and that it's not the
 * same as the demo." It wasn't — the chat beats were sitting on the film's warm
 * plum ground with a red bloom over them, and the bubbles used invented plum
 * gradients. These are the real token values.
 */
export const UI = {
  bg: "#070709",                          // --color-background (dark)
  card: "#171012",                        // --card
  // The real bubble is TRANSLUCENT over the page gradient — in the screenshots
  // of the live chat the red clearly reads through the answer card. Ours was
  // solid, which is why the answer beat kept coming back grey: a 1812px-wide
  // opaque card centred in a 1920 frame masks the gradient almost entirely.
  cardGlass: "rgba(23,16,18,0.72)",
  rule: "rgba(255,255,255,0.08)",         // --rule
  ink: "#F2F1EF",                         // --ink
  mute: "rgba(255,255,255,0.45)",         // --c-mute
  red: "#E21833",                         // --c-red (dark)
  redDim: "rgba(226,24,51,0.12)",         // --c-red-dim
  redEdge: "rgba(226,24,51,0.22)",        // the user bubble's border-mix
  link: "#FF4050",                        // --primary-on-surface (the AA red on dark)
  green: "#34D399",                       // --c-green, the completed-step check
  radius: 34,                             // --radius-module 15px, scaled to film type
  shadow: "0 0 0 1px rgba(255,255,255,0.04), 0 10px 30px rgba(0,0,0,0.22)", // --shadow-sm dark
};

/**
 * The product's own page background, copied EXACTLY from the demo's dark
 * `--gradient-page-bg` over `--color-background`. Jacob: "I want the red
 * coloring of the original one from the demo, which you should know is the
 * coloring we do."
 *
 * The red is not a film grade, it is the product: a red wash from top right at
 * 22%, a gold one from bottom left at 15%, and a warm dark pool through the
 * middle, all over #070709. Flattening this to a neutral near-black was the
 * mistake — the previous pass over-corrected off one ambiguous note.
 */
/**
 * The product page gradient, painted ONCE at the composition root.
 *
 * It does not live in the beats any more. Inside them it flickered: "it keeps
 * switching off between gray and not gray." The message's camera promotes its
 * box to a composited layer, and under the ANGLE renderer we enable for the GL
 * transitions, individual frames capture without the ancestor ground — as a CSS
 * background, as a sibling layer, and as SVG content alike, so it was never a
 * question of how the colour was painted. The composition root is the one layer
 * that never dropped across every frame tested, so the gradient lives there and
 * the product beats paint nothing of their own. The film's own beats (hook,
 * breadth, CTA) still lay their warm <Ground/> over the top.
 */
export const PRODUCT_BG = [
  "radial-gradient(ellipse 95% 85% at 82% 2%, rgba(217,32,46,0.44) 0%, transparent 62%)",
  "radial-gradient(ellipse 90% 80% at 50% 45%, rgba(200,16,46,0.20) 0%, transparent 62%)",
  "radial-gradient(ellipse at 0% 100%, rgba(245,200,66,0.09) 0%, transparent 48%)",
  "radial-gradient(ellipse at 50% 30%, rgba(23,16,18,0.8) 0%, transparent 70%)",
  "#070709",
].join(", ");

const Ground: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(120% 90% at 50% 42%, #2C1017 0%, #140A0D 46%, #08070A 100%)",
    }}
  />
);

/*
 * The <Panel> component lived here: it cropped the composer out of the capture
 * and floated it as a card. It is gone, not disabled — <Composer/> replaces it
 * outright, because the note was that a screenshot with a camera over it is not
 * a chat animation no matter how it is framed. Nothing else referenced it.
 */

/** Raylight's text entrance: fade + blur-from + slide, staggered per word. */
const RayText: React.FC<{
  text: string;
  sizeWorld: number;
  weight: number;
  delayMs: number;
  durationMs: number;
  blurFrom: number;
  slideY?: number;
  startMs?: number;
  maxWidthWorld?: number;
  color?: string;
}> = ({
  text, sizeWorld, weight, delayMs, durationMs, blurFrom,
  slideY = 0, startMs = 0, maxWidthWorld, color = CREAM,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000 - startMs;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: maxWidthWorld ? w(maxWidthWorld) : undefined,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: w(sizeWorld),
        fontWeight: weight,
        color,
        lineHeight: 1.3,
        textAlign: "center",
      }}
    >
      {text.split(" ").map((word, i) => {
        const start = i * delayMs;
        const p = interpolate(ms, [start, start + durationMs], [0, 1], {
          easing: EASE.outExpo,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={i}
            style={{
              opacity: p,
              filter: blurFrom ? `blur(${(1 - p) * blurFrom}px)` : undefined,
              transform: `translateY(${(1 - p) * w(slideY)}px)`,
              whiteSpace: "pre",
            }}
          >
            {word}{" "}
          </span>
        );
      })}
    </div>
  );
};

/** Raylight's opening move: zoom 2.034 → 1.0 over 850ms, ease-out-expo. */
const PullOpen: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = interpolate((frame / fps) * 1000, [0, 850], [2.034, 1], {
    easing: EASE.outExpo,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "50% 50%" }}>
      {children}
    </AbsoluteFill>
  );
};

// ── Beat 2: the chat, actually animated ─────────────────────────────────────
/**
 * The composer DRAWN, not a screenshot with a camera over it. Jacob's note:
 * "I don't want it to just be like a screenshot that you're covering over in
 * Raylight. They actually have a good type-in and chat thing."
 *
 * The treatment is Raylight's `linear-agent` scene 2, the typed-prompt beat,
 * read out of the harvested beat sheet: placeholder fades in over 600ms
 * ease-out, the prompt arrives on a per-character Typewriter, and the whole
 * surface arrives on a settle-in rather than a cut. Geometry matches the real
 * CampusAI composer measured in the capture (698x76 CSS px, radius 16), so it
 * is the product's bar, redrawn, not an invented one.
 */
const QUESTION = "Any events this week I should go to?";
const BAR_W = 1370;
const BAR_H = Math.round(BAR_W * (76 / 698));
const CHAR_MS = 45;
const TYPE_START = 1000;

const Composer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  // Raylight settle-in: opacity 620ms + scale from 0.965, ease-out-expo.
  const settle = interpolate(ms, [0, 620], [0, 1], {
    easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  // Placeholder fades in at 600ms ease-out, then out as typing starts.
  const phIn = interpolate(ms, [300, 900], [0, 1], {
    easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const phOut = interpolate(ms, [TYPE_START - 180, TYPE_START + 60], [1, 0], {
    easing: EASE.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const chars = Math.max(0, Math.min(QUESTION.length, Math.floor((ms - TYPE_START) / CHAR_MS)));
  const typed = QUESTION.slice(0, chars);
  const done = chars >= QUESTION.length;
  const doneAt = TYPE_START + QUESTION.length * CHAR_MS;
  // The prompt-button-press primitive: the send button commits once the line
  // is finished, rather than the film just cutting away from a full box.
  const press = done
    ? interpolate(ms, [doneAt + 180, doneAt + 300, doneAt + 480], [1, 0.9, 1], {
        easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    : 1;
  const caretOn = !done && Math.floor(ms / 520) % 2 === 0;
  const glyph = UI.mute;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 54 }}>
        {/* The mark belongs here. Raylight's own linear-agent preview puts the
            Linear mark right on the composer next to "Ask Linear". */}
        <Img
          src={staticFile("brand/campusai-logo-white.svg")}
          style={{
            width: 330,
            opacity: settle,
            filter: `blur(${(1 - settle) * 8}px)`,
            transform: `translateY(${(1 - settle) * 14}px)`,
          }}
        />
        <div
          style={{
            width: BAR_W,
            height: BAR_H,
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "0 26px",
            borderRadius: 32,
            background: UI.cardGlass,
            border: `1px solid ${UI.rule}`,
            boxShadow: UI.shadow,
            opacity: settle,
            transform: `scale(${0.965 + settle * 0.035}) translateY(${(1 - settle) * 20}px)`,
          }}
        >
          {/* paperclip */}
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L10 17.9a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"
              stroke={glyph} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <div style={{ position: "relative", flex: 1, fontFamily: "Inter, system-ui, sans-serif", fontSize: 30 }}>
            <span style={{ color: glyph, opacity: phIn * phOut }}>Ask Campus AI anything…</span>
            <span style={{ position: "absolute", left: 0, top: 0, color: "#EFE7DF", fontWeight: 450 }}>
              {typed}
              <span style={{ opacity: caretOn ? 1 : 0, color: "#E8323F" }}>|</span>
            </span>
          </div>

          {/* mic */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <rect x="9" y="3" width="6" height="11" rx="3" stroke={glyph} strokeWidth="1.7" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={glyph} strokeWidth="1.7" strokeLinecap="round" />
          </svg>

          {/* send */}
          <div
            style={{
              flexShrink: 0,
              width: 62, height: 62, borderRadius: 999,
              background: UI.red,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: `scale(${press})`,
              boxShadow: done ? "0 0 34px rgba(226,24,51,0.42)" : "none",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M3.5 12 20 4l-4 16-4.2-5.6L3.5 12Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </AbsoluteFill>
      <Vignette warm={false} strength={0.45} grain={false} />
    </AbsoluteFill>
  );
};

// ── Beat 3: the thinking trace, DRAWN ───────────────────────────────────────
/**
 * This beat used to be the one piece of real screen recording left in the film.
 * Jacob killed it: "for the actual chat response, I wanted it to be more like a
 * template from online rather than just recording the demo, because the demo
 * doesn't do it super smoothly."
 *
 * So the trace is redrawn here on the same terms as the composer and the answer:
 * the product's own four steps, verbatim from
 * `chat-message.tsx` THINKING_STEPS, its own row treatment (check on a completed
 * step, spinner ring on the active one, completed rows dropping to muted), its
 * own 800ms cadence — but at film scale, on a real camera, with no compression
 * artefacts and no 26px hack. The capture rig and `Walk` are now unused by this
 * composition; they are left in place because the light cut and any future beat
 * that genuinely wants product footage still need them.
 *
 * The last ~600ms is the hand-off Jacob asked for after step four: the rows
 * check off, gather upward and dissolve while the camera pulls back, so the
 * answer arrives out of the thinking rather than after a cut.
 */
const STEPS = [
  "Reading your profile",
  "Checking the jobs you applied to",
  "Scanning campus events this week",
  "Matching them to your goals",
];
const STEP_AT = [0, 800, 1600, 2400]; // the product's own STEP_MS = 800
const GATHER_AT = 2950;               // step four has landed and held
const ROW_H = 62;
const ROW_GAP = 22;
const BUBBLE_H = 92;
const BUBBLE_GAP = 46;
const ROWS_H = STEPS.length * ROW_H + (STEPS.length - 1) * ROW_GAP;
const THREAD_H = BUBBLE_H + BUBBLE_GAP + ROWS_H;
// The column is NARROWER than the composer bar and the close scale is modest,
// because 1370 x 1.5 = 2055px overflows a 1920 frame: the first render pushed
// every step's spinner and check off the left edge and clipped the question
// bubble on the right. 1150 x 1.3 = 1495 sits inside the frame with margin.
const THREAD_W = 1150;
const ROW_CLOSE = 1.3;
const rowCentre = (i: number) => BUBBLE_H + BUBBLE_GAP + i * (ROW_H + ROW_GAP) + ROW_H / 2;

const ThinkingTrace: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  // Which row the camera is on. It starts moving 420ms BEFORE the row lands, so
  // the frame is already there when the step arrives — the note was "zoom in on
  // each one specifically. It goes to one, then it goes to next."
  const LEAD = 420;
  let camRow = 0;
  for (let i = 1; i < STEPS.length; i++) if (ms >= STEP_AT[i] - LEAD) camRow = i;
  const prevRow = Math.max(0, camRow - 1);
  const move = interpolate(ms, [STEP_AT[camRow] - LEAD, STEP_AT[camRow]], [0, 1], {
    easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const focus = camRow === 0 ? 0 : prevRow + (camRow - prevRow) * move;

  // The gather: camera pulls back off the row and the rows compress upward.
  const gather = interpolate(ms, [GATHER_AT, GATHER_AT + 550], [0, 1], {
    easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const closeY = THREAD_H / 2 - (rowCentre(Math.floor(focus)) +
    (rowCentre(Math.ceil(focus)) - rowCentre(Math.floor(focus))) * (focus % 1));
  const scale = (ROW_CLOSE + (1 - ROW_CLOSE) * gather);
  const dy = closeY * (1 - gather);

  const settle = interpolate(ms, [0, 380], [0, 1], {
    easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: THREAD_W,
            transformOrigin: "50% 50%",
            transform: `scale(${scale}) translateY(${dy}px)`,
          }}
        >
          {/* The question, carried over from the composer so the cut reads as
              the same thread rather than a new screen. */}
          <div
            style={{
              height: BUBBLE_H,
              marginBottom: BUBBLE_GAP,
              display: "flex",
              justifyContent: "flex-end",
              opacity: settle * (1 - gather * 0.35),
            }}
          >
            <div
              style={{
                padding: "22px 34px",
                borderRadius: UI.radius,
                borderTopRightRadius: 10, // the product's rounded-tr-sm on a user turn
                background: UI.redDim,
                border: `1px solid ${UI.redEdge}`,
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 30,
                fontWeight: 450,
                color: UI.ink,
              }}
            >
              {QUESTION}
            </div>
          </div>

          {STEPS.map((label, i) => {
            // Product treatment: a row fades up over 280ms, is "active" until the
            // next one lands, then goes muted with a check.
            const inP = interpolate(ms, [STEP_AT[i], STEP_AT[i] + 280], [0, 1], {
              easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            const done = i < STEPS.length - 1 ? ms >= STEP_AT[i + 1] : ms >= GATHER_AT;
            const spin = (ms / 700) * 360;
            // Gather: rows compress upward and fade, last row last.
            const gOff = gather * (i - STEPS.length + 1) * 18;
            return (
              <div
                key={label}
                style={{
                  height: ROW_H,
                  marginBottom: i < STEPS.length - 1 ? ROW_GAP : 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  opacity: inP * (1 - gather),
                  transform: `translateY(${(1 - inP) * 10 + gOff}px)`,
                }}
              >
                <span style={{ width: 42, height: 42, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {done ? (
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6 9 17l-5-5" stroke={UI.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    // The real product marks the live reasoning step with a red
                    // four-point sparkle, not a spinner — see the screenshot of
                    // the actual chat ("Matching to your skills…"). It breathes
                    // rather than spins.
                    <svg width="34" height="34" viewBox="0 0 24 24" style={{ transform: `scale(${0.9 + 0.1 * Math.sin(spin * Math.PI / 180)})` }}>
                      <path
                        d="M12 2.6c.35 3.9 2.9 6.45 6.8 6.8v1.2c-3.9.35-6.45 2.9-6.8 6.8h-1.2c-.35-3.9-2.9-6.45-6.8-6.8V9.4c3.9-.35 6.45-2.9 6.8-6.8Z"
                        fill={UI.red}
                      />
                    </svg>
                  )}
                </span>
                <span
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 38,
                    fontWeight: done ? 400 : 500,
                    color: done ? UI.mute : UI.ink,
                  }}
                >
                  {label}…
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Vignette warm={false} strength={0.45} grain={false} />
    </AbsoluteFill>
  );
};

// ── Beat 4: the answer, as cards ────────────────────────────────────────────
/**
 * Raylight `linear-agent` scene 3, the answer cascade, read from the design
 * guide: a lead line on a **Rise entrance, 864ms ease-out, per-line 100ms**,
 * then the results arriving one at a time **~363ms apart** on 855ms settle-ins.
 *
 * This replaces footage of the product streaming markdown. Jacob's note was
 * "the way this text comes out is actually not so clean" — and it isn't:
 * markdown paragraphs reflow as they stream, the asterisks flash before the
 * renderer catches them, and there is no rhythm to it. Discrete cards arriving
 * on a beat is what the template does and it is strictly cleaner. The content
 * is unchanged, and every fact in it is still the demo's real data.
 */
const EVENTS = [
  {
    title: "Morgan Stanley — Sales & Trading Info Session",
    meta: "Fri · 6:00 PM · Van Munching 1524",
    why: "Good one to show up to. It's the S&T Summer Analyst role you applied to, so it's a great time to network with the team and learn what the role involves.",
  },
  {
    title: "Financial Modeling Bootcamp: 3-Statement to DCF",
    meta: "Tue · 5:00 PM · Van Munching 1412",
    why: "Good to learn either way. Three-statement to DCF is the modeling every finance interview tests, and it is what Carlyle is about to put in front of you.",
  },
  {
    title: "Evercore Coffee Chat",
    meta: "Mon · 10:00 AM · Van Munching 1330",
    why: "Two Smith alumni on the restructuring desk. Small group, no presentation, so you will actually get to talk to them.",
  },
];

// Geometry of ONE assistant message. Jacob, on the card version: "It typed it
// in here, but with these weird boxes around it, I can't just be like that. The
// actual look of the chat, can't you just do that in the demo itself."
//
// He is right and the cards were an invention. The product's answer is a SINGLE
// bubble of prose — `chat-message.tsx` renders one `bg-card border border-rule`
// container and `renderMarkdown` puts bold headings, a meta line, a reason line
// and a red link inside it. The copy below is the demo's own EVENTS_ANSWER
// structure, with the reason lines rewritten (see below). Three boxes are gone;
// there is one bubble, and the blocks are text inside it.
const BUBBLE_W = 1250;
const PAD = 34;
const LEAD_H = 46;
const LEAD_MB = 28;
const TITLE_H = 46;
const META_H = 36;
const REASON_H = 78; // two lines at 26px/1.5 — the reasons are longer now
const LINK_H = 34;
const BLOCK_GAP = 26;

// The message GROWS as it streams, the way the real one does: the bubble is
// clipped to a revealed height that steps as each block lands.
// The message GROWS by mounting one block at a time. It used to grow by
// animating a clipped height, which looked the same but forced a composited
// clip layer and cost us whole layers on random frames.

// Word-chunked streaming, not per-character. SSE arrives in token chunks, so
// word-at-a-time is both what the product does and far calmer to watch than a
// typewriter at this size.
const WORDS = EVENTS[0].why.split(" ");
const WORD_MS = 48;
const STREAM_START = 1350;
const STREAM_DONE = STREAM_START + WORDS.length * WORD_MS;
const BLOCK_AT = [700, STREAM_DONE + 300, STREAM_DONE + 1000];
const CAM_CLOSE = 1.45;
const CAM_WIDE = 1.0;

const AnswerMessage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  // NO transform, NO zoom, NO overflow clip anywhere in this beat. Every one of
  // those promotes a composited layer, and under the ANGLE renderer the GL
  // transitions require, individual frames then capture WITHOUT some layer —
  // first the page gradient ("it keeps switching off between gray and not
  // gray"), then, once the gradient moved to the root, the message card and its
  // first block. The camera is therefore a real layout resize: every dimension
  // is multiplied by `k`, so the type genuinely grows instead of being scaled.
  // And the message grows by MOUNTING blocks rather than by clipping a box,
  // which is also closer to how the real one streams.
  const camP = interpolate(ms, [STREAM_DONE + 150, STREAM_DONE + 1550], [0, 1], {
    easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const k = CAM_CLOSE + (CAM_WIDE - CAM_CLOSE) * camP;
  const z = (v: number) => v * k;

  const leadP = interpolate(ms, [0, 864], [0, 1], {
    easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const shown = Math.max(0, Math.min(WORDS.length, Math.floor((ms - STREAM_START) / WORD_MS)));

  // The product renders every non-bold line at --ink; only the heading is
  // heavier. The meta line is held at --c-mute (a real demo token) purely
  // because at film type size three same-weight lines per block read as a wall.
  const ink = UI.ink;
  const mute = UI.mute;

  return (
    <AbsoluteFill>
      {/* TOP-anchored, not centred. Centring meant every mounted block moved
          all the earlier content, and for ~300ms after each mount the frame
          captured mid-reflow with the card and everything above the new block
          missing. Anchored, growth only ever adds below, which is also how the
          real message grows. 101px is what centres the finished card. */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start" }}>
        <div
          style={{
            marginTop: 101,
            width: z(BUBBLE_W),
            padding: z(PAD),
            borderRadius: z(UI.radius),
            borderTopLeftRadius: z(10), // the product's rounded-tl-sm on an assistant turn
            background: UI.cardGlass,
            border: `1px solid ${UI.rule}`,
            boxShadow: UI.shadow,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <div
            style={{
              height: z(LEAD_H),
              marginBottom: z(LEAD_MB),
              fontSize: z(31),
              fontWeight: 400,
              color: ink,
              opacity: leadP,
            }}
          >
            Yeah, three of them. All worth your time for different reasons.
          </div>

          {EVENTS.map((e, i) => {
            if (ms < BLOCK_AT[i]) return null;
            const p = interpolate(ms, [BLOCK_AT[i], BLOCK_AT[i] + 520], [0, 1], {
              easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            const streaming = i === 0;
            const linkP = streaming
              ? interpolate(ms, [STREAM_DONE + 60, STREAM_DONE + 420], [0, 1], {
                  easing: EASE.outExpo, extrapolateLeft: "clamp", extrapolateRight: "clamp",
                })
              : p;
            return (
              <div key={e.title} style={{ marginBottom: i < 2 ? z(BLOCK_GAP) : 0, opacity: p }}>
                <div style={{ height: z(TITLE_H), marginBottom: z(8), fontSize: z(32), fontWeight: 650, color: ink, letterSpacing: "-0.01em" }}>
                  {e.title}
                </div>
                <div style={{ height: z(META_H), marginBottom: z(12), fontSize: z(25), fontWeight: 500, color: mute }}>
                  {e.meta}
                </div>
                {/* Fixed height so the words arriving never reflow the block. */}
                <div style={{ height: z(REASON_H), marginBottom: z(14), fontSize: z(26), fontWeight: 400, color: ink, lineHeight: 1.5 }}>
                  {streaming ? (
                    <>
                      {WORDS.slice(0, shown).join(" ")}
                      <span style={{ color: UI.red, opacity: ms >= STREAM_START && ms < STREAM_DONE + 260 ? 1 : 0 }}>
                        {shown > 0 ? " " : ""}|
                      </span>
                    </>
                  ) : (
                    e.why
                  )}
                </div>
                <div style={{ height: z(LINK_H), fontSize: z(24), fontWeight: 550, color: UI.link, opacity: linkP }}>
                  View event →
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Vignette warm={false} strength={0.45} grain={false} />
    </AbsoluteFill>
  );
};

// ── Beat 6: the breadth field ───────────────────────────────────────────────
// The seven questions and the 130ms sibling stagger are Raylight's. Scatter and
// tilt stay inside the measured house distribution (tilt on roughly a third of
// siblings, never the whole set).
const QUESTIONS: { text: string; x: number; y: number; rot: number }[] = [
  { text: "What's happening today?", x: -0.48, y: 0.34, rot: -2 },
  { text: "How's my career readiness?", x: 0.46, y: 0.34, rot: 2 },
  { text: "Is my resume ready to send?", x: -0.56, y: 0.11, rot: 0 },
  { text: "Which events should I actually go to?", x: 0.48, y: 0.11, rot: -2 },
  { text: "Course recommendations", x: -0.54, y: -0.12, rot: 0 },
  { text: "Who else at Smith went into consulting?", x: 0.44, y: -0.12, rot: 2 },
  { text: "What should I do this summer?", x: 0.0, y: -0.35, rot: 0 },
];

const Breadth: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  return (
    <AbsoluteFill>
      <Ground />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: w(2.0), height: w(1.1) }}>
          {QUESTIONS.map((q, i) => {
            const p = interpolate(ms, [i * 130, i * 130 + 620], [0, 1], {
              easing: EASE.outExpo,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={q.text}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(-50%, -50%) translate(${w(q.x)}px, ${w(-q.y)}px) rotate(${q.rot}deg) scale(${0.94 + p * 0.06})`,
                  opacity: p,
                  filter: `blur(${(1 - p) * 8}px)`,
                  background: PLUM,
                  border: `1px solid ${PLUM_EDGE}`,
                  borderRadius: 999,
                  padding: `${w(0.020)}px ${w(0.030)}px`,
                  whiteSpace: "nowrap",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: w(0.036),
                  fontWeight: 500,
                  color: CREAM,
                }}
              >
                {q.text}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ── Beat 7: end card ────────────────────────────────────────────────────────
const CallToAction: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate((frame / fps) * 1000, [0, 700], [0, 1], {
    easing: EASE.outExpo,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <Ground />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: w(0.045) }}>
        <Img
          src={staticFile("brand/campusai-logo-white.svg")}
          style={{ width: w(0.36), opacity: p, filter: `blur(${(1 - p) * 8}px)` }}
        />
        {/* Bookends the hook: the film opens on "Ask anything." and closes on
            the thing to actually go and do. */}
        <RayText
          text="Ask CampusAI."
          sizeWorld={0.082}
          weight={600}
          delayMs={80}
          durationMs={620}
          blurFrom={10}
          slideY={-0.02}
          startMs={240}
        />
        <RayText
          text="Your personalized student operating system"
          sizeWorld={0.032}
          weight={500}
          delayMs={40}
          durationMs={600}
          blurFrom={6}
          startMs={640}
          maxWidthWorld={1.1}
          color="#B9A9AD"
        />
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ── The film ────────────────────────────────────────────────────────────────
// Beat lengths, the two transition durations and every beat's absolute start
// live in src/lib/chat-timeline.ts, because ChatSoundtrack reads them too and a
// cue sheet with its own copy of this arithmetic would go quietly out of sync
// the first time a beat changed length.
// The /events beat is deliberately gone — see note at the bottom of this file.

/**
 * Total frames at a given fps. Three register dissolves and two within-screen
 * cuts each overlap their neighbours, so each one shortens the film by its own
 * length. At 30fps this is 573 - (9*3 + 14*2) = 518, exactly what it was when
 * the number was hardcoded.
 */
export const chatVideoFrames = (fps: number) => msToFrames(CHAT_VIDEO_MS, fps);

// NOTE: `mode` is deliberately no longer read. Every beat is drawn now, so the
// film has no footage to swap light for dark, and the light palette was never
// built (the Testudo orb does not exist on cream). `ChatAsk-16x9-Light`
// therefore renders identical to the dark cut until a light palette is a real
// task. The prop stays so that job is a palette change, not a signature change.
export const ChatVideo: React.FC<{ mode?: "dark" | "light" }> = () => {
  const { fps } = useVideoConfig();
  const f = (sec: number) => secondsToFrames(sec, fps);
  const DISSOLVE = msToFrames(DISSOLVE_MS, fps);
  const BEAT_CUT = msToFrames(BEAT_CUT_MS, fps);
  // Cross-dissolving one dense UI screen straight into another reads as mush
  // for the length of the dissolve. Fading the outgoing scene out as the
  // incoming fades in dips through the dark ground instead, which is the
  // "clean and smooth" exit rather than two screens wrestling.
  // Fade dips through the dark ground: for cuts that change register
  // (text -> UI, UI -> graphic), where cross-dissolving two dense screens is
  // mush.
  const T = () => (
    <TransitionSeries.Transition
      presentation={fade({ shouldFadeOutExitingScene: true })}
      timing={springTiming({ config: { damping: 200 }, durationInFrames: DISSOLVE, durationRestThreshold: 0.001 })}
    />
  );
  // Cuts WITHIN the same screen (composer -> trace -> answer). This WAS the GL
  // linearBlur dissolve, which read as the camera moving through one space. The
  // ANGLE renderer it needs is what was dropping layers from frames, so it is a
  // fade now, at a shorter 14 frames so it still reads as a softer cut than the
  // register changes. See remotion.config.ts.
  const B = () => (
    <TransitionSeries.Transition
      presentation={fade({ shouldFadeOutExitingScene: true })}
      timing={springTiming({ config: { damping: 200 }, durationInFrames: BEAT_CUT, durationRestThreshold: 0.001 })}
    />
  );

  return (
    <AbsoluteFill style={{ background: PRODUCT_BG }}>
      {/* Sound sits outside the TransitionSeries: its cues are absolute
          positions on the film, not children of any one beat. Delete this one
          line to get the silent cut back. */}
      <ChatSoundtrack />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={f(BEATS.hook)}>
          <Ground />
          <PullOpen>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
              <RayText
                text="Ask CampusAI anything."
                sizeWorld={0.1}
                weight={600}
                delayMs={80}
                durationMs={620}
                blurFrom={10}
                slideY={-0.025}
              />
            </AbsoluteFill>
          </PullOpen>
          <Vignette />
        </TransitionSeries.Sequence>
        {T()}

        {/* The chat, drawn and animated — not a screenshot under a camera. */}
        <TransitionSeries.Sequence durationInFrames={f(BEATS.ask)}>
          <Composer />
        </TransitionSeries.Sequence>
        {B()}

        {/* The trace, one step at a time, drawn. Ends on the gather. */}
        <TransitionSeries.Sequence durationInFrames={f(BEATS.think)}>
          <ThinkingTrace />
        </TransitionSeries.Sequence>

        {B()}
        {/* Opens framed on the FIRST event as it streams, then pulls back to
            reveal the other two. */}
        <TransitionSeries.Sequence durationInFrames={f(BEATS.answer)}>
          <AnswerMessage />
        </TransitionSeries.Sequence>
        {T()}

        <TransitionSeries.Sequence durationInFrames={f(BEATS.breadth)}>
          <Breadth />
        </TransitionSeries.Sequence>
        {T()}

        <TransitionSeries.Sequence durationInFrames={f(BEATS.cta)}>
          <CallToAction />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

/**
 * Removed, deliberately: the `/events` beat.
 *
 * It used to sit between the answer and the breadth field. Jacob's note was "I
 * still don't know why it goes to the job board" — and he is right that it did
 * not earn its place. The answer beat now ends by pulling back across all three
 * events, so cutting to the events surface immediately afterwards said the same
 * thing twice, and the jump to a different screen read as a non-sequitur. The
 * hole it left is where the call to action now lives.
 *
 * The footage still contains it (capture marks `nav-events` at ~17.8s), so it
 * can come back without a re-capture — but it should come back motivated, e.g.
 * as a click-through from one of the "View event →" links, not as a hard cut.
 */
